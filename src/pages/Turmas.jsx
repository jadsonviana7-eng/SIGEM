import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getTurmas, addTurma, updateTurma, deleteTurma } from "../services/turmasService";
import { getAlunos } from "../services/alunosService";
import { getProfessores } from "../services/professoresService";
import { getDisciplinas } from "../services/disciplinasService";
import { registrarAuditoria } from "../services/auditoriaService";
import { ANOS_LETIVOS, TURNOS, DISCIPLINAS } from "../utils/constants";
import { Badge, Btn, Modal, Input, Select, Alert, Spinner, EmptyState, ProgressBar, Card } from "../components/ui";

const VAZIO = { nome:"",ano:"1º Ano",turno:"Manhã",professor:"",auxiliar:"",professoresPorDisciplina:{},sala:"",vagas:30 };

const isAnoFinal = (ano) => ["5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"].includes(ano);
const isAnoInfantil = (ano) => ["Creche", "Pré-Escola"].includes(ano);

export default function Turmas() {
  const navigate = useNavigate();
  const { user, selectedEscolaId, escolas } = useAuth();
  const activeEscolaId = user?.selectedEscolaId || "";
  const escolaAtual = (escolas || []).find(e => e.id === activeEscolaId);

  const { dados: turmas, carregando: cT, recarregar } = useFirestore(useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]), [activeEscolaId]);
  const { dados: alunos, carregando: cA } = useFirestore(useCallback(() => getAlunos(activeEscolaId), [activeEscolaId]), [activeEscolaId]);
  const { dados: professores, carregando: cP } = useFirestore(useCallback(() => getProfessores(activeEscolaId), [activeEscolaId]), [activeEscolaId]);
  const { dados: disciplinasDocs } = useFirestore(useCallback(() => getDisciplinas(activeEscolaId), [activeEscolaId]), [activeEscolaId]);

  const listaDisciplinas = useMemo(() => {
    if (disciplinasDocs && disciplinasDocs.length > 0) {
      const ativas = disciplinasDocs.filter(d => d.status === "Ativa").map(d => d.nome);
      if (ativas.length > 0) return ativas;
    }
    return DISCIPLINAS;
  }, [disciplinasDocs]);

  const [form, setForm] = useState(VAZIO);
  const [editId, setEditId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  // Modo de visualização: "bloco" (cards) ou "lista" (tabela)
  const [visualizacao, setVisualizacao] = useState(() => {
    return localStorage.getItem("sigem_turmas_view") || "bloco";
  });

  function alterarVisualizacao(modo) {
    setVisualizacao(modo);
    localStorage.setItem("sigem_turmas_view", modo);
  }

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })); }
  function abrirNovo() { setForm(VAZIO); setEditId(null); setModalAberto(true); }
  function abrirEditar(t) { setForm({ ...VAZIO, ...t }); setEditId(t.id); setModalAberto(true); }

  async function salvar() {
    if (!form.nome) { alert("Informe o nome da turma."); return; }
    setSalvando(true);
    try {
      if (editId) {
        const turmaAntiga = turmas.find(t => t.id === editId) || {};
        await updateTurma(editId, form);
        await registrarAuditoria({
          usuario: user,
          escolaId: activeEscolaId,
          escolaNome: escolaAtual?.nome || "Escola Municipal",
          modulo: "Turmas",
          acao: "EDICAO_TURMA",
          entidade: "Turma",
          entidadeId: editId,
          entidadeNome: form.nome,
          registroAnterior: `${turmaAntiga.nome} (${turmaAntiga.turno}, Sala ${turmaAntiga.sala || '—'}, ${turmaAntiga.vagas || 30} vagas)`,
          registroNovo: `${form.nome} (${form.turno}, Sala ${form.sala || '—'}, ${form.vagas} vagas)`,
          descricao: `${user?.displayName || 'Secretaria'} editou a turma ${form.nome}`
        });
      } else {
        const docRef = await addTurma(form, activeEscolaId);
        await registrarAuditoria({
          usuario: user,
          escolaId: activeEscolaId,
          escolaNome: escolaAtual?.nome || "Escola Municipal",
          modulo: "Turmas",
          acao: "CRIACAO_TURMA",
          entidade: "Turma",
          entidadeId: docRef?.id || "",
          entidadeNome: form.nome,
          registroAnterior: "—",
          registroNovo: `Turma ${form.nome} (${form.ano} · ${form.turno} · ${form.vagas} vagas)`,
          descricao: `${user?.displayName || 'Secretaria'} criou a turma ${form.nome}`
        });
      }
      setModalAberto(false);
      setAlerta({ msg: `Turma "${form.nome}" salva com sucesso.`, tipo: "success" });
      recarregar();
    } catch (e) {
      setAlerta({ msg: "Erro: " + e.message, tipo: "error" });
    } finally { setSalvando(false); }
  }

  async function remover(t) {
    if (!window.confirm(`Tem certeza que deseja excluir a turma "${t.nome}"? Todos os alunos perderão o vínculo com esta turma.`)) return;
    try {
      await deleteTurma(t.id);
      await registrarAuditoria({
        usuario: user,
        escolaId: activeEscolaId,
        escolaNome: escolaAtual?.nome || "Escola Municipal",
        modulo: "Turmas",
        acao: "EXCLUSAO_TURMA",
        entidade: "Turma",
        entidadeId: t.id,
        entidadeNome: t.nome,
        registroAnterior: `Turma ${t.nome} (${t.ano} · ${t.turno})`,
        registroNovo: "Excluída do Sistema",
        descricao: `${user?.displayName || 'Administrador'} excluiu a turma ${t.nome}`
      });
      setAlerta({ msg: `Turma "${t.nome}" excluída.`, tipo: "success" });
      recarregar();
    } catch (e) {
      setAlerta({ msg: "Erro ao excluir: " + e.message, tipo: "error" });
    }
  }

  if (cT || cA || cP) return <Spinner />;

  return (
    <div>
      {alerta && <Alert tipo={alerta.tipo}>{alerta.msg}</Alert>}

      {/* Barra Superior com Controles e Seletor de Visualização */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 18,
        background: "var(--bg-card)",
        padding: "12px 18px",
        borderRadius: 14,
        border: "1px solid var(--border-color)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
      }}>
        {/* Esquerda: Seletor de Modo (Blocos / Lista) e Contador */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {/* Alternador de Visualização Segmentado */}
          <div style={{
            display: "inline-flex",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: 10,
            padding: 3,
            gap: 2
          }}>
            <button
              type="button"
              onClick={() => alterarVisualizacao("bloco")}
              title="Visualização em Blocos (Cards)"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: visualizacao === "bloco" ? 700 : 500,
                background: visualizacao === "bloco" ? "var(--bg-card)" : "transparent",
                color: visualizacao === "bloco" ? "var(--accent-indigo, #6366f1)" : "var(--text-muted)",
                boxShadow: visualizacao === "bloco" ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <i className="ti ti-layout-grid" style={{ fontSize: 16 }} />
              <span>Blocos</span>
            </button>
            <button
              type="button"
              onClick={() => alterarVisualizacao("lista")}
              title="Visualização em Lista (Tabela)"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: visualizacao === "lista" ? 700 : 500,
                background: visualizacao === "lista" ? "var(--bg-card)" : "transparent",
                color: visualizacao === "lista" ? "var(--accent-indigo, #6366f1)" : "var(--text-muted)",
                boxShadow: visualizacao === "lista" ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <i className="ti ti-list" style={{ fontSize: 16 }} />
              <span>Lista</span>
            </button>
          </div>

          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Total: <strong style={{ color: "var(--text-primary)" }}>{turmas.length}</strong> {turmas.length === 1 ? "turma" : "turmas"}
          </div>
        </div>

        {/* Direita: Botões de Ação */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Btn variant="default" onClick={() => navigate("/matriculas")}>
            <i className="ti ti-clipboard-plus" /> Matrículas & Vagas
          </Btn>
          <Btn variant="primary" onClick={abrirNovo}>
            <i className="ti ti-plus" aria-hidden="true" /> Nova turma
          </Btn>
        </div>
      </div>

      {!turmas.length ? (
        <EmptyState icon="books-off" texto="Nenhuma turma cadastrada." />
      ) : visualizacao === "lista" ? (
        <>
          {/* Visualização Desktop: Tabela Estruturada */}
          <div className="sigem-desktop-table">
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface)" }}>
                      <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)" }}>Turma</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)" }}>Ano / Etapa</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)" }}>Turno & Sala</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)" }}>Responsável Docente</th>
                      <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)", width: "230px" }}>Ocupação & Vagas</th>
                      <th style={{ textAlign: "right", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)" }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turmas.map(t => {
                      const count = alunos.filter(a => a.turma === t.nome).length;
                      const vagas = t.vagas || 30;
                      const pct = Math.round((count / vagas) * 100);
                      const isLotada = count >= vagas;
                      return (
                        <tr
                          key={t.id}
                          style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.15s ease" }}
                          onMouseOver={e => e.currentTarget.style.background = "var(--bg-surface)"}
                          onMouseOut={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: "var(--badge-blue-bg, rgba(56, 189, 248, 0.12))",
                                color: "var(--badge-blue-text, #0369a1)",
                                border: "1px solid var(--badge-blue-border, rgba(56, 189, 248, 0.3))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 16,
                                fontWeight: 700,
                                flexShrink: 0
                              }}>
                                <i className="ti ti-chalkboard" />
                              </div>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t.nome}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>ID: {t.id ? t.id.slice(0, 8) : "—"}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <Badge color="blue">{t.ano}</Badge>
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 13 }}>
                            <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{t.turno}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                              <Badge color="gray">Sala {t.sala || "—"}</Badge>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 13 }}>
                            {isAnoFinal(t.ano) ? (
                              <span style={{ fontSize: 12, color: "var(--badge-purple-text, #6d28d9)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                                <i className="ti ti-users" /> Professores por disciplina
                              </span>
                            ) : (
                              <div>
                                {t.professor ? (
                                  <div style={{ color: "var(--text-primary)", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                                    <i className="ti ti-user-star" style={{ color: "#38bdf8", fontSize: 14 }} />
                                    {t.professor}
                                  </div>
                                ) : (
                                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Não atribuído</span>
                                )}
                                {isAnoInfantil(t.ano) && t.auxiliar && (
                                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                    <i className="ti ti-user-plus" style={{ color: "#c084fc" }} /> Aux: {t.auxiliar}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 4 }}>
                              <span style={{ color: "var(--text-secondary)" }}>
                                <strong style={{ color: "var(--text-primary)" }}>{count}</strong> / {vagas} alunos
                              </span>
                              <Badge color={isLotada ? "red" : pct >= 80 ? "amber" : "green"}>
                                {isLotada ? "Lotada" : `${vagas - count} livres`}
                              </Badge>
                            </div>
                            <ProgressBar valor={count} max={vagas} />
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: 6 }}>
                              <Btn onClick={() => abrirEditar(t)} style={{ padding: "6px 10px", fontSize: 12 }} title="Editar Turma">
                                <i className="ti ti-edit" />
                              </Btn>
                              <Btn variant="danger" onClick={() => remover(t)} style={{ padding: "6px 10px", fontSize: 12 }} title="Excluir Turma">
                                <i className="ti ti-trash" />
                              </Btn>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Visualização Mobile: Cards Otimizados */}
          <div className="sigem-mobile-cards">
            {turmas.map(t => {
              const count = alunos.filter(a => a.turma === t.nome).length;
              const vagas = t.vagas || 30;
              const isLotada = count >= vagas;
              return (
                <div
                  key={`mob-turma-${t.id}`}
                  onClick={() => abrirEditar(t)}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    boxShadow: "var(--card-shadow)",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-indigo)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "var(--badge-blue-bg, rgba(56, 189, 248, 0.12))",
                    color: "var(--badge-blue-text, #0369a1)",
                    border: "1px solid var(--badge-blue-border, rgba(56, 189, 248, 0.3))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0
                  }}>
                    <i className="ti ti-chalkboard" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.nome}
                      </span>
                      <Badge color={isLotada ? "red" : count / vagas >= 0.8 ? "amber" : "green"}>
                        {count}/{vagas}
                      </Badge>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11, color: "var(--text-muted)" }}>
                      <Badge color="blue">{t.ano}</Badge>
                      <span>{t.turno}</span>
                      {t.sala && <span>· Sala {t.sala}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <Btn
                      onClick={(e) => { e.stopPropagation(); abrirEditar(t); }}
                      style={{ padding: "6px 8px", fontSize: 12 }}
                      title="Editar"
                    >
                      <i className="ti ti-edit" />
                    </Btn>
                    <div style={{ color: "var(--text-muted)", fontSize: 18, display: "flex", alignItems: "center" }}>
                      <i className="ti ti-chevron-right" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ══════════════════════════════════════════════════════════ */
        /* VISUALIZAÇÃO EM BLOCOS (GRID DE CARDS)                    */
        /* ══════════════════════════════════════════════════════════ */
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16 }}>
          {turmas.map(t => {
            const count = alunos.filter(a => a.turma === t.nome).length;
            const vagas = t.vagas || 30;
            const pct = Math.round((count / vagas) * 100);
            return (
              <div
                key={t.id}
                onClick={() => abrirEditar(t)}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 14,
                  padding: 20,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  WebkitTapHighlightColor: "transparent"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--accent-indigo, #6366f1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{t.nome}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{t.ano} · {t.turno}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Badge color="blue">Sala {t.sala}</Badge>
                    <Btn
                      onClick={(e) => { e.stopPropagation(); abrirEditar(t); }}
                      style={{ padding: "4px 8px", fontSize: 11 }}
                      title="Editar"
                    >
                      <i className="ti ti-edit" />
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={(e) => { e.stopPropagation(); remover(t); }}
                      style={{ padding: "4px 8px", fontSize: 11 }}
                      title="Excluir"
                    >
                      <i className="ti ti-trash" />
                    </Btn>
                  </div>
                </div>
                {isAnoFinal(t.ano) ? (
                  <div style={{ fontSize:12,color:"var(--text-secondary)",marginBottom:8 }}>
                    <i className="ti ti-users" style={{ marginRight:4, color:"#818cf8" }} /> Professores por disciplina
                  </div>
                ) : (
                  <>
                    {t.professor && (
                      <div style={{ fontSize:12,color:"var(--text-secondary)",marginBottom:4 }}>
                        <i className="ti ti-user-star" style={{ marginRight:4, color:"#38bdf8" }} />{t.professor}
                      </div>
                    )}
                    {isAnoInfantil(t.ano) && t.auxiliar && (
                      <div style={{ fontSize:12,color:"var(--text-muted)",marginBottom:8 }}>
                        <i className="ti ti-user-plus" style={{ marginRight:4, color:"#c084fc" }} />Auxiliar: {t.auxiliar}
                      </div>
                    )}
                  </>
                )}
                <div style={{ fontSize:12,color:"var(--text-secondary)", marginTop: isAnoFinal(t.ano) || (!t.professor && !t.auxiliar) ? 0 : 4 }}>Alunos: <strong style={{ color:"var(--text-primary)" }}>{count}</strong> / {vagas}</div>
                <ProgressBar valor={count} max={vagas} />
              </div>
            );
          })}
        </div>
      )}

      {modalAberto && (
        <Modal titulo={editId?"Editar turma":"Nova turma"} onClose={()=>setModalAberto(false)} onSave={salvar} salvando={salvando}>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <Input label="Nome da turma *" value={form.nome} onChange={e=>set("nome",e.target.value)} placeholder="Ex: 5A" />
              <Input label="Sala" value={form.sala} onChange={e=>set("sala",e.target.value)} placeholder="Ex: 08" />
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <Select label="Ano" value={form.ano} onChange={e=>set("ano",e.target.value)}>
                {ANOS_LETIVOS.map(a=><option key={a}>{a}</option>)}
              </Select>
              <Select label="Turno" value={form.turno} onChange={e=>set("turno",e.target.value)}>
                {TURNOS.map(t=><option key={t}>{t}</option>)}
              </Select>
            </div>
            
            {isAnoFinal(form.ano) ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop: 4, marginBottom: 4 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#ffffff", marginBottom:4 }}>Professores por Disciplina</div>
                {listaDisciplinas.map(d => (
                  <Select key={d} label={d} value={form.professoresPorDisciplina?.[d] || ""} onChange={e => set("professoresPorDisciplina", { ...form.professoresPorDisciplina, [d]: e.target.value })}>
                    <option value="">Selecione um professor</option>
                    {professores.filter(p => p.cargo === "Professor" || !p.cargo).map(p => (
                      <option key={p.id} value={p.nome}>{p.nome}</option>
                    ))}
                  </Select>
                ))}
              </div>
            ) : (
              <>
                <Select label="Professor(a) responsável" value={form.professor} onChange={e=>set("professor",e.target.value)}>
                  <option value="">Selecione um professor</option>
                  {professores.filter(p => p.cargo === "Professor" || !p.cargo).map(p => (
                    <option key={p.id} value={p.nome}>{p.nome}</option>
                  ))}
                </Select>
                {isAnoInfantil(form.ano) && (
                  <Select label="Professor(a) Auxiliar" value={form.auxiliar} onChange={e=>set("auxiliar",e.target.value)}>
                    <option value="">Selecione um auxiliar (opcional)</option>
                    {professores.map(p => (
                      <option key={p.id} value={p.nome}>{p.nome} {p.cargo ? `(${p.cargo})` : ""}</option>
                    ))}
                  </Select>
                )}
              </>
            )}

            <Input label="Vagas" type="number" value={form.vagas} onChange={e=>set("vagas",+e.target.value)} min={1} max={60} />
          </div>
        </Modal>
      )}
    </div>
  );
}

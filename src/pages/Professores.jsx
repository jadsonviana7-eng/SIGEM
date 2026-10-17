import { useState, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getProfessores, addProfessor, updateProfessor, deleteProfessor } from "../services/professoresService";
import { getDisciplinas } from "../services/disciplinasService";
import { registrarAuditoria } from "../services/auditoriaService";
import { TURNOS, DISCIPLINAS } from "../utils/constants";
import { Card, Badge, Btn, Modal, Input, Select, Alert, Spinner, EmptyState } from "../components/ui";
import { comprimirEUploadFoto } from "../utils/upload";
import CropModal from "../components/CropModal";
import { formatCPF, formatTelefone } from "../utils/masks";

const CARGOS = ["Diretor", "Secretário", "Professor", "Coordenador", "Merendeira", "Serviços Gerais", "Vigia"];
const VAZIO = { nome:"",cpf:"",email:"",telefone:"",cargo:"Professor",turno:"Manhã",disciplinas:[],status:"Ativo",fotoUrl:"", vinculo:"Efetivo" };

export default function Professores() {
  const { user, selectedEscolaId, escolas } = useAuth();
  const activeEscolaId = user?.selectedEscolaId || "";
  const escolaAtual = (escolas || []).find(e => e.id === activeEscolaId);
  
  const { dados: professores, carregando, recarregar } = useFirestore(
    useCallback(() => getProfessores(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  const { dados: disciplinasDocs } = useFirestore(
    useCallback(() => getDisciplinas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  const listaDisciplinas = useMemo(() => {
    if (disciplinasDocs && disciplinasDocs.length > 0) {
      const ativas = disciplinasDocs.filter(d => d.status === "Ativa").map(d => d.nome);
      if (ativas.length > 0) return ativas;
    }
    return DISCIPLINAS;
  }, [disciplinasDocs]);
  
  const [form, setForm] = useState(VAZIO);
  const [abaAtiva, setAbaAtiva] = useState("professores"); // "professores" ou "demais-servidores"
  const [editId, setEditId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [professorFicha, setProfessorFicha] = useState(null);
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const [cropFile, setCropFile] = useState(null);

  function handleFotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCropFile(file);
    e.target.value = "";
  }

  async function handleCroppedFoto(croppedFile) {
    setCropFile(null);
    setCarregandoFoto(true);
    try {
      const url = await comprimirEUploadFoto(croppedFile, "professores", editId || Date.now().toString());
      set("fotoUrl", url);
    } catch (error) {
      alert("Erro ao carregar foto: " + error.message);
    } finally {
      setCarregandoFoto(false);
    }
  }

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })); }

  function toggleDisciplina(d) {
    setForm(f => ({
      ...f,
      disciplinas: (f.disciplinas||[]).includes(d)
        ? f.disciplinas.filter(x => x !== d)
        : [...(f.disciplinas||[]), d],
    }));
  }

  function abrirNovo() {
    setForm({
      ...VAZIO,
      cargo: abaAtiva === "professores" ? "Professor" : "Diretor"
    });
    setEditId(null);
    setModalAberto(true);
  }
  function abrirEditar(p) {
    setForm({ ...VAZIO, ...p });
    setEditId(p.id);
    setModalAberto(true);
  }

  async function salvar() {
    if (!form.nome) { alert("Informe o nome."); return; }
    setSalvando(true);
    
    // Se o cargo não for professor, limpamos as disciplinas para manter consistência no Firestore
    const dadosParaSalvar = {
      ...form,
      disciplinas: form.cargo === "Professor" ? (form.disciplinas || []) : []
    };

    try {
      if (editId) {
        const antigo = professores.find(pr => pr.id === editId) || {};
        await updateProfessor(editId, dadosParaSalvar);
        await registrarAuditoria({
          usuario: user,
          escolaId: activeEscolaId,
          escolaNome: escolaAtual?.nome || "Escola Municipal",
          modulo: "Servidores",
          acao: "EDICAO_SERVIDOR",
          entidade: dadosParaSalvar.cargo || "Servidor",
          entidadeId: editId,
          entidadeNome: dadosParaSalvar.nome,
          registroAnterior: `${antigo.nome || form.nome} (${antigo.cargo || form.cargo} · ${antigo.turno || form.turno})`,
          registroNovo: `${dadosParaSalvar.nome} (${dadosParaSalvar.cargo} · ${dadosParaSalvar.turno})`,
          descricao: `${user?.displayName || 'Secretaria'} editou os dados de ${dadosParaSalvar.nome}`
        });
      } else {
        const docRef = await addProfessor(dadosParaSalvar, activeEscolaId);
        await registrarAuditoria({
          usuario: user,
          escolaId: activeEscolaId,
          escolaNome: escolaAtual?.nome || "Escola Municipal",
          modulo: "Servidores",
          acao: "CADASTRO_SERVIDOR",
          entidade: dadosParaSalvar.cargo || "Servidor",
          entidadeId: docRef?.id || "",
          entidadeNome: dadosParaSalvar.nome,
          registroAnterior: "—",
          registroNovo: `${dadosParaSalvar.nome} (${dadosParaSalvar.cargo} · ${dadosParaSalvar.turno})`,
          descricao: `${user?.displayName || 'Secretaria'} cadastrou ${dadosParaSalvar.nome}`
        });
      }
      setModalAberto(false);
      setAlerta({ msg: `${dadosParaSalvar.cargo === "Professor" ? "Professor(a)" : "Servidor(a)"} "${form.nome}" salvo(a) com sucesso.`, tipo: "success" });
      recarregar();
    } catch (e) {
      setAlerta({ msg: "Erro: " + e.message, tipo: "error" });
    } finally { setSalvando(false); }
  }

  async function remover(p) {
    const cargoFormatado = p.cargo === "Professor" ? "o(a) professor(a)" : "o(a) servidor(a)";
    if (!window.confirm(`Tem certeza que deseja excluir ${cargoFormatado} "${p.nome}"? Esta ação removerá o cadastro do servidor.`)) return;
    try {
      await deleteProfessor(p.id);
      await registrarAuditoria({
        usuario: user,
        escolaId: activeEscolaId,
        escolaNome: escolaAtual?.nome || "Escola Municipal",
        modulo: "Servidores",
        acao: "EXCLUSAO_SERVIDOR",
        entidade: p.cargo || "Servidor",
        entidadeId: p.id,
        entidadeNome: p.nome,
        registroAnterior: `${p.nome} (${p.cargo || 'Servidor'} · ${p.turno || '—'} · ${p.vinculo || 'Efetivo'})`,
        registroNovo: "—",
        descricao: `${user?.displayName || 'Secretaria'} excluiu ${cargoFormatado} ${p.nome}`
      });
      if (professorFicha?.id === p.id) {
        setProfessorFicha(null);
      }
      setAlerta({ msg: `${p.cargo === "Professor" ? "Professor(a)" : "Servidor(a)"} "${p.nome}" excluído(a) com sucesso.`, tipo: "success" });
      recarregar();
    } catch (e) {
      setAlerta({ msg: "Erro ao excluir: " + e.message, tipo: "error" });
    }
  }

  if (carregando) return <Spinner />;

  const listaFiltrada = professores.filter(p => {
    if (abaAtiva === "professores") {
      return p.cargo === "Professor";
    } else {
      return p.cargo !== "Professor";
    }
  });

  const colunas = abaAtiva === "professores"
    ? ["Nome", "Cargo", "Disciplinas", "Turno", "Contato", "Status", ""]
    : ["Nome", "Cargo", "Turno", "Contato", "Status", ""];

  return (
    <div>
      {alerta && <Alert tipo={alerta.tipo}>{alerta.msg}</Alert>}

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid var(--border-color)",
        marginBottom: 16,
        gap: 8
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setAbaAtiva("professores")}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom: abaAtiva === "professores" ? "3px solid #6366f1" : "3px solid transparent",
              background: "none",
              fontSize: 14,
              fontWeight: 600,
              color: abaAtiva === "professores" ? "var(--primary-color, #4f46e5)" : "var(--text-muted)",
              cursor: "pointer"
            }}
          >
            <i className="ti ti-chalkboard" style={{ marginRight: 6 }} />
            Professores
          </button>
          <button
            onClick={() => setAbaAtiva("demais-servidores")}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom: abaAtiva === "demais-servidores" ? "3px solid #6366f1" : "3px solid transparent",
              background: "none",
              fontSize: 14,
              fontWeight: 600,
              color: abaAtiva === "demais-servidores" ? "var(--primary-color, #4f46e5)" : "var(--text-muted)",
              cursor: "pointer"
            }}
          >
            <i className="ti ti-users" style={{ marginRight: 6 }} />
            Demais Servidores
          </button>
        </div>
        <Btn variant="primary" onClick={abrirNovo} style={{ marginBottom: 8 }}>
          <i className="ti ti-plus" aria-hidden="true" /> {abaAtiva === "professores" ? "Novo Professor" : "Novo Servidor"}
        </Btn>
      </div>

      {!listaFiltrada.length ? (
        <EmptyState
          icon={abaAtiva === "professores" ? "chalkboard" : "users"}
          texto={abaAtiva === "professores" ? "Nenhum professor cadastrado." : "Nenhum servidor administrativo cadastrado."}
        />
      ) : (
        <>
          {/* Visualização Desktop: Tabela Estruturada */}
          <div className="sigem-desktop-table">
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface)" }}>
                      {colunas.map(h => (
                        <th key={h} style={{ textAlign:"left",padding:"12px 14px",fontSize:11,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid var(--border-color)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {listaFiltrada.map(p => (
                      <tr key={p.id} style={{ borderBottom:"1px solid var(--border-color)", transition: "background 0.15s ease" }}
                        onMouseOver={e => e.currentTarget.style.background="var(--bg-surface)"}
                        onMouseOut={e => e.currentTarget.style.background="transparent"}
                      >
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", background: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-color)", flexShrink: 0 }}>
                              {p.fotoUrl ? (
                                <img src={p.fotoUrl} alt={p.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <i className="ti ti-user" style={{ fontSize: 20, color: "var(--text-muted)" }} />
                              )}
                            </div>
                            <span style={{ fontWeight:600, color:"var(--text-primary)", fontSize: 13 }}>{p.nome}</span>
                          </div>
                        </td>
                        <td style={{ padding:"12px 14px",fontSize:13 }}>
                          <Badge color="gray">{p.cargo || "Professor"}</Badge>
                          {p.vinculo && <Badge color={p.vinculo === "Efetivo" ? "blue" : "purple"} style={{ marginLeft: 4 }}>{p.vinculo}</Badge>}
                        </td>
                        {abaAtiva === "professores" && (
                          <td style={{ padding:"12px 14px" }}>
                            {(p.disciplinas||[]).map(d => (
                              <Badge key={d} color="blue" style={{ marginRight:3 }}>{d}</Badge>
                            ))}
                          </td>
                        )}
                        <td style={{ padding:"12px 14px",fontSize:13,color:"var(--text-secondary)" }}>{p.turno}</td>
                        <td style={{ padding:"12px 14px",fontSize:12,color:"var(--text-muted)" }}>{p.telefone}<br />{p.email}</td>
                        <td style={{ padding:"12px 14px" }}><Badge color={p.status==="Ativo"?"green":"amber"}>{p.status}</Badge></td>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <Btn onClick={() => setProfessorFicha(p)} style={{ padding:"5px 9px",fontSize:12, background: "var(--badge-blue-bg, rgba(56, 189, 248, 0.12))", color: "var(--badge-blue-text, #0369a1)", border: "1px solid var(--badge-blue-border, rgba(56, 189, 248, 0.3))" }} title="Visualizar Ficha">
                              <i className="ti ti-eye" style={{ fontSize: 13 }} aria-hidden="true" />
                            </Btn>
                            <Btn onClick={()=>abrirEditar(p)} style={{ padding:"5px 9px",fontSize:12 }} title="Editar">
                              <i className="ti ti-edit" style={{ fontSize: 13 }} aria-hidden="true" />
                            </Btn>
                            <Btn variant="danger" onClick={()=>remover(p)} style={{ padding:"5px 9px",fontSize:12 }} title="Excluir">
                              <i className="ti ti-trash" style={{ fontSize: 13 }} aria-hidden="true" />
                            </Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Visualização Mobile: Cards Essenciais */}
          <div className="sigem-mobile-cards">
            {listaFiltrada.map(p => (
              <div
                key={`mob-prof-${p.id}`}
                onClick={() => setProfessorFicha(p)}
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
                {/* Foto / Avatar */}
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "var(--bg-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--border-color)",
                  flexShrink: 0
                }}>
                  {p.fotoUrl ? (
                    <img src={p.fotoUrl} alt={p.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <i className="ti ti-user" style={{ fontSize: 24, color: "var(--text-muted)" }} />
                  )}
                </div>

                {/* Dados Essenciais */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>
                    {p.nome}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Badge color="gray">{p.cargo || (abaAtiva === "professores" ? "Professor" : "Servidor")}</Badge>
                    {p.turno && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.turno}</span>}
                  </div>
                </div>

                {/* Status & Ações Mobile */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <Btn
                    onClick={(e) => { e.stopPropagation(); abrirEditar(p); }}
                    style={{ padding: "6px 8px", fontSize: 12 }}
                    title="Editar"
                  >
                    <i className="ti ti-edit" />
                  </Btn>
                  <Btn
                    variant="danger"
                    onClick={(e) => { e.stopPropagation(); remover(p); }}
                    style={{ padding: "6px 8px", fontSize: 12 }}
                    title="Excluir"
                  >
                    <i className="ti ti-trash" />
                  </Btn>
                  <div style={{ color: "var(--text-muted)", fontSize: 16, display: "flex", alignItems: "center", marginLeft: 2 }}>
                    <i className="ti ti-chevron-right" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalAberto && (
        <Modal
          titulo={editId ? (form.cargo === "Professor" ? "Editar Professor(a)" : "Editar Servidor(a)") : (abaAtiva === "professores" ? "Novo(a) Professor(a)" : "Novo(a) Servidor(a)")}
          onClose={()=>setModalAberto(false)}
          onSave={salvar}
          salvando={salvando}
        >
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {/* Upload de Foto */}
            <div style={{ display:"flex", alignItems: "center", gap: 16, background: "var(--bg-surface)", padding: 12, borderRadius: 10, border: "1px solid var(--border-color)", marginBottom: 4 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #6366f1", flexShrink: 0 }}>
                {form.fotoUrl ? (
                  <img src={form.fotoUrl} alt="Visualização" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <i className="ti ti-camera" style={{ fontSize: 22, color: "var(--text-muted)" }} />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>Foto do Servidor</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    background: "rgba(99, 102, 241, 0.2)",
                    color: "#818cf8",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: carregandoFoto ? "not-allowed" : "pointer",
                    opacity: carregandoFoto ? 0.7 : 1,
                    border: "1px solid rgba(99, 102, 241, 0.4)"
                  }}>
                    <i className="ti ti-upload" />
                    {carregandoFoto ? "Carregando..." : "Enviar Foto"}
                    <input type="file" accept="image/*" onChange={handleFotoSelect} disabled={carregandoFoto} style={{ display: "none" }} />
                  </label>
                  {form.fotoUrl && (
                    <Btn variant="danger" onClick={() => set("fotoUrl", "")} style={{ padding: "4px 10px", fontSize: 12 }}>
                      <i className="ti ti-trash" /> Remover
                    </Btn>
                  )}
                </div>
              </div>
            </div>

            <Input label="Nome completo *" value={form.nome} onChange={e=>set("nome",e.target.value)} />
            
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {abaAtiva === "professores" ? (
                <Input label="Cargo" value="Professor" disabled />
              ) : (
                <Select label="Cargo *" value={form.cargo || "Diretor"} onChange={e=>set("cargo",e.target.value)}>
                  {CARGOS.filter(c => c !== "Professor").map(c => <option key={c}>{c}</option>)}
                </Select>
              )}
              <Select label="Turno" value={form.turno} onChange={e=>set("turno",e.target.value)}>
                {TURNOS.map(t=><option key={t}>{t}</option>)}
              </Select>
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <Input label="CPF" value={form.cpf} onChange={e=>set("cpf",formatCPF(e.target.value))} placeholder="000.000.000-00" />
              <Input label="Telefone" value={form.telefone} onChange={e=>set("telefone",formatTelefone(e.target.value))} placeholder="(82) 99999-9999" />
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <Input label="E-mail" type="email" value={form.email} onChange={e=>set("email",e.target.value)} />
              <Select label="Vínculo *" value={form.vinculo || "Efetivo"} onChange={e=>set("vinculo",e.target.value)}>
                <option value="Efetivo">Efetivo</option>
                <option value="Contratado">Contratado</option>
              </Select>
            </div>

            {(form.cargo === "Professor" || !form.cargo) && (
              <div>
                <label style={{ fontSize:12,fontWeight:500,color:"#cbd5e1",display:"block",marginBottom:8 }}>Disciplinas que leciona</label>
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {listaDisciplinas.map(d => {
                    const sel = (form.disciplinas||[]).includes(d);
                    return (
                      <button key={d} onClick={()=>toggleDisciplina(d)} type="button"
                        style={{ padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:500,cursor:"pointer",border:"1px solid",
                          background:sel?"linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)":"#1e293b",color:sel?"#ffffff":"#cbd5e1",borderColor:sel?"#6366f1":"#33435c" }}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Select label="Status" value={form.status} onChange={e=>set("status",e.target.value)}>
              <option>Ativo</option><option>Inativo</option><option>Afastado</option>
            </Select>
          </div>
        </Modal>
      )}

      {cropFile && (
        <CropModal
          file={cropFile}
          onClose={() => setCropFile(null)}
          onCrop={handleCroppedFoto}
        />
      )}

      {professorFicha && (
        <Modal
          titulo={professorFicha.cargo === "Professor" ? "Ficha do(a) Professor(a)" : "Ficha do(a) Servidor(a)"}
          onClose={() => setProfessorFicha(null)}
          semRodape
          width={600}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header / Foto */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, background: "var(--bg-surface)", padding: 12, borderRadius: 10, border: "1px solid var(--border-color)" }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-color)", flexShrink: 0 }}>
                {professorFicha.fotoUrl ? (
                  <img src={professorFicha.fotoUrl} alt={professorFicha.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <i className="ti ti-user" style={{ fontSize: 28, color: "var(--text-muted)" }} />
                )}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{professorFicha.nome}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge color="blue">{professorFicha.cargo || "Professor"}</Badge>
                  <Badge color={professorFicha.status === "Ativo" ? "green" : "amber"}>{professorFicha.status}</Badge>
                </div>
              </div>
            </div>

            {/* Dados Pessoais e Contato */}
            <div style={{ border: "1px solid var(--border-color)", background: "var(--bg-surface)", borderRadius: 10, padding: 16 }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 13, color: "var(--text-primary)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)", paddingBottom: 6 }}>
                <i className="ti ti-address-book" style={{ marginRight: 6, color: "var(--primary-color, #6366f1)" }} /> Contato e Lotação
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
                <div><span style={{ color: "var(--text-muted)", fontSize: 11, display: "block" }}>Telefone</span><span style={{ color: "var(--text-secondary)" }}>{professorFicha.telefone || "Não informado"}</span></div>
                <div><span style={{ color: "var(--text-muted)", fontSize: 11, display: "block" }}>E-mail</span><span style={{ color: "var(--text-secondary)" }}>{professorFicha.email || "Não informado"}</span></div>
                <div><span style={{ color: "var(--text-muted)", fontSize: 11, display: "block" }}>Turno</span><span style={{ color: "var(--text-secondary)" }}>{professorFicha.turno || "Não informado"}</span></div>
                <div><span style={{ color: "var(--text-muted)", fontSize: 11, display: "block" }}>Vínculo</span><span style={{ color: "var(--text-secondary)" }}>{professorFicha.vinculo || "Não informado"}</span></div>
                <div><span style={{ color: "var(--text-muted)", fontSize: 11, display: "block" }}>CPF</span><span style={{ color: "var(--text-secondary)" }}>{professorFicha.cpf || "Não informado"}</span></div>
              </div>
            </div>

            {/* Disciplinas (se professor) */}
            {professorFicha.cargo === "Professor" && professorFicha.disciplinas && professorFicha.disciplinas.length > 0 && (
              <div style={{ border: "1px solid var(--border-color)", background: "var(--bg-surface)", borderRadius: 10, padding: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 13, color: "var(--text-primary)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)", paddingBottom: 6 }}>
                  <i className="ti ti-books" style={{ marginRight: 6, color: "var(--primary-color, #6366f1)" }} /> Disciplinas Lecionadas
                </h4>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {professorFicha.disciplinas.map(d => (
                    <Badge key={d} color="gray">{d}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ações da Ficha */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              paddingTop: 14,
              borderTop: "1px solid var(--border-color)",
              marginTop: 4,
              flexWrap: "wrap"
            }}>
              <Btn
                variant="danger"
                onClick={() => remover(professorFicha)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <i className="ti ti-trash" /> Excluir
              </Btn>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Btn
                  variant="outline"
                  onClick={() => setProfessorFicha(null)}
                >
                  Fechar
                </Btn>
                <Btn
                  variant="primary"
                  onClick={() => {
                    const prof = professorFicha;
                    setProfessorFicha(null);
                    abrirEditar(prof);
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <i className="ti ti-edit" /> Editar
                </Btn>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

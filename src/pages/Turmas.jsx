import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getTurmas, addTurma, updateTurma, deleteTurma } from "../services/turmasService";
import { getAlunos } from "../services/alunosService";
import { getProfessores } from "../services/professoresService";
import { registrarAuditoria } from "../services/auditoriaService";
import { ANOS_LETIVOS, TURNOS, DISCIPLINAS } from "../utils/constants";
import { Badge, Btn, Modal, Input, Select, Alert, Spinner, EmptyState, ProgressBar } from "../components/ui";

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

  const [form, setForm] = useState(VAZIO);
  const [editId, setEditId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alerta, setAlerta] = useState(null);

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
      <div style={{ display:"flex",justifyContent:"flex-end",gap:8,marginBottom:16 }}>
        <Btn variant="default" onClick={() => navigate("/matriculas")}>
          <i className="ti ti-clipboard-plus" /> Matrículas & Vagas
        </Btn>
        <Btn variant="primary" onClick={abrirNovo}>
          <i className="ti ti-plus" aria-hidden="true" /> Nova turma
        </Btn>
      </div>


      {!turmas.length ? <EmptyState icon="books-off" texto="Nenhuma turma cadastrada." /> : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16 }}>
          {turmas.map(t => {
            const count = alunos.filter(a => a.turma === t.nome).length;
            const vagas = t.vagas || 30;
            const pct = Math.round((count / vagas) * 100);
            return (
              <div key={t.id} style={{ background:"white",border:"1px solid #e5e5e4",borderRadius:12,padding:20 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:24,fontWeight:700,color:"#1a1a18" }}>{t.nome}</div>
                    <div style={{ fontSize:12,color:"#888",marginTop:2 }}>{t.ano} · {t.turno}</div>
                  </div>
                  <div style={{ display:"flex",gap:4 }}>
                    <Badge color="blue">Sala {t.sala}</Badge>
                    <Btn onClick={()=>abrirEditar(t)} style={{ padding:"3px 7px",fontSize:11 }} title="Editar"><i className="ti ti-edit" /></Btn>
                    <Btn variant="danger" onClick={()=>remover(t)} style={{ padding:"3px 7px",fontSize:11 }} title="Excluir"><i className="ti ti-trash" /></Btn>
                  </div>
                </div>
                {isAnoFinal(t.ano) ? (
                  <div style={{ fontSize:12,color:"#555",marginBottom:8 }}>
                    <i className="ti ti-users" style={{ marginRight:4 }} /> Professores por disciplina
                  </div>
                ) : (
                  <>
                    {t.professor && (
                      <div style={{ fontSize:12,color:"#555",marginBottom:4 }}>
                        <i className="ti ti-user-star" style={{ marginRight:4 }} />{t.professor}
                      </div>
                    )}
                    {isAnoInfantil(t.ano) && t.auxiliar && (
                      <div style={{ fontSize:12,color:"#777",marginBottom:8 }}>
                        <i className="ti ti-user-plus" style={{ marginRight:4 }} />Auxiliar: {t.auxiliar}
                      </div>
                    )}
                  </>
                )}
                <div style={{ fontSize:12,color:"#888", marginTop: isAnoFinal(t.ano) || (!t.professor && !t.auxiliar) ? 0 : 4 }}>Alunos: <strong>{count}</strong> / {vagas}</div>
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
                <div style={{ fontSize:13, fontWeight:600, color:"#444", marginBottom:4 }}>Professores por Disciplina</div>
                {DISCIPLINAS.map(d => (
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

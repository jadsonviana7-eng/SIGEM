import { useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getProfessores, addProfessor, updateProfessor } from "../services/professoresService";
import { TURNOS, DISCIPLINAS } from "../utils/constants";
import { Card, Badge, Btn, Modal, Input, Select, Alert, Spinner, EmptyState } from "../components/ui";
import { comprimirEUploadFoto } from "../utils/upload";
import CropModal from "../components/CropModal";
import { formatCPF, formatTelefone } from "../utils/masks";

const CARGOS = ["Diretor", "Secretário", "Professor", "Coordenador", "Merendeira", "Serviços Gerais", "Vigia"];
const VAZIO = { nome:"",cpf:"",email:"",telefone:"",cargo:"Professor",turno:"Manhã",disciplinas:[],status:"Ativo",fotoUrl:"", vinculo:"Efetivo" };

export default function Professores() {
  const { user, selectedEscolaId } = useAuth();
  const activeEscolaId = user?.selectedEscolaId || "";
  
  const { dados: professores, carregando, recarregar } = useFirestore(
    useCallback(() => getProfessores(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );
  
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
      if (editId) await updateProfessor(editId, dadosParaSalvar);
      else await addProfessor(dadosParaSalvar, activeEscolaId);
      setModalAberto(false);
      setAlerta({ msg: `Servidor(a) "${form.nome}" salvo(a) com sucesso.`, tipo: "success" });
      recarregar();
    } catch (e) {
      setAlerta({ msg: "Erro: " + e.message, tipo: "error" });
    } finally { setSalvando(false); }
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
        borderBottom: "1px solid #2c3b52",
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
              color: abaAtiva === "professores" ? "#818cf8" : "#94a3b8",
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
              color: abaAtiva === "demais-servidores" ? "#818cf8" : "#94a3b8",
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

      <Card style={{ padding:0,overflow:"hidden" }}>
        {!listaFiltrada.length ? (
          <EmptyState
            icon={abaAtiva === "professores" ? "chalkboard" : "users"}
            texto={abaAtiva === "professores" ? "Nenhum professor cadastrado." : "Nenhum servidor administrativo cadastrado."}
          />
        ) : (
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background: "rgba(36, 49, 68, 0.5)" }}>
                {colunas.map(h => (
                  <th key={h} style={{ textAlign:"left",padding:"12px 14px",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid #2c3b52" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map(p => (
                <tr key={p.id} style={{ borderBottom:"1px solid #2c3b52", transition: "background 0.15s ease" }}
                  onMouseOver={e => e.currentTarget.style.background="rgba(99, 102, 241, 0.08)"}
                  onMouseOut={e => e.currentTarget.style.background="transparent"}
                >
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", background: "#243144", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #33435c", flexShrink: 0 }}>
                        {p.fotoUrl ? (
                          <img src={p.fotoUrl} alt={p.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <i className="ti ti-user" style={{ fontSize: 20, color: "#94a3b8" }} />
                        )}
                      </div>
                      <span style={{ fontWeight:600, color:"#ffffff", fontSize: 13 }}>{p.nome}</span>
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
                  <td style={{ padding:"12px 14px",fontSize:13,color:"#cbd5e1" }}>{p.turno}</td>
                  <td style={{ padding:"12px 14px",fontSize:12,color:"#94a3b8" }}>{p.telefone}<br />{p.email}</td>
                  <td style={{ padding:"12px 14px" }}><Badge color={p.status==="Ativo"?"green":"amber"}>{p.status}</Badge></td>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Btn onClick={() => setProfessorFicha(p)} style={{ padding:"5px 9px",fontSize:12, background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)" }} title="Visualizar Ficha">
                        <i className="ti ti-eye" style={{ fontSize: 13 }} aria-hidden="true" />
                      </Btn>
                      <Btn onClick={()=>abrirEditar(p)} style={{ padding:"5px 9px",fontSize:12 }} title="Editar">
                        <i className="ti ti-edit" style={{ fontSize: 13 }} aria-hidden="true" />
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {modalAberto && (
        <Modal titulo={editId?"Editar Servidor":"Novo Servidor"} onClose={()=>setModalAberto(false)} onSave={salvar} salvando={salvando}>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {/* Upload de Foto */}
            <div style={{ display:"flex", alignItems: "center", gap: 16, background: "#243144", padding: 12, borderRadius: 10, border: "1px solid #33435c", marginBottom: 4 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #6366f1", flexShrink: 0 }}>
                {form.fotoUrl ? (
                  <img src={form.fotoUrl} alt="Visualização" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <i className="ti ti-camera" style={{ fontSize: 22, color: "#94a3b8" }} />
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
                  {DISCIPLINAS.map(d => {
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
          titulo="Ficha do Servidor"
          onClose={() => setProfessorFicha(null)}
          onSave={() => setProfessorFicha(null)}
          width={600}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header / Foto */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#243144", padding: 12, borderRadius: 8, border: "1px solid #33435c" }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #33435c", flexShrink: 0 }}>
                {professorFicha.fotoUrl ? (
                  <img src={professorFicha.fotoUrl} alt={professorFicha.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <i className="ti ti-user" style={{ fontSize: 28, color: "#94a3b8" }} />
                )}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#ffffff", marginBottom: 4 }}>{professorFicha.nome}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge color="blue">{professorFicha.cargo || "Professor"}</Badge>
                  <Badge color={professorFicha.status === "Ativo" ? "green" : "amber"}>{professorFicha.status}</Badge>
                </div>
              </div>
            </div>

            {/* Dados Pessoais e Contato */}
            <div style={{ border: "1px solid #33435c", background: "#243144", borderRadius: 8, padding: 16 }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 13, color: "#ffffff", textTransform: "uppercase", borderBottom: "1px solid #33435c", paddingBottom: 6 }}>
                <i className="ti ti-address-book" style={{ marginRight: 6, color: "#6366f1" }} /> Contato e Lotação
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
                <div><span style={{ color: "#94a3b8", fontSize: 11, display: "block" }}>Telefone</span><span style={{ color: "#cbd5e1" }}>{professorFicha.telefone || "Não informado"}</span></div>
                <div><span style={{ color: "#94a3b8", fontSize: 11, display: "block" }}>E-mail</span><span style={{ color: "#cbd5e1" }}>{professorFicha.email || "Não informado"}</span></div>
                <div><span style={{ color: "#94a3b8", fontSize: 11, display: "block" }}>Turno</span><span style={{ color: "#cbd5e1" }}>{professorFicha.turno || "Não informado"}</span></div>
                <div><span style={{ color: "#94a3b8", fontSize: 11, display: "block" }}>Vínculo</span><span style={{ color: "#cbd5e1" }}>{professorFicha.vinculo || "Não informado"}</span></div>
              </div>
            </div>

            {/* Disciplinas (se professor) */}
            {professorFicha.cargo === "Professor" && professorFicha.disciplinas && professorFicha.disciplinas.length > 0 && (
              <div style={{ border: "1px solid #33435c", background: "#243144", borderRadius: 8, padding: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 13, color: "#ffffff", textTransform: "uppercase", borderBottom: "1px solid #33435c", paddingBottom: 6 }}>
                  <i className="ti ti-books" style={{ marginRight: 6, color: "#6366f1" }} /> Disciplinas Lecionadas
                </h4>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {professorFicha.disciplinas.map(d => (
                    <Badge key={d} color="gray">{d}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

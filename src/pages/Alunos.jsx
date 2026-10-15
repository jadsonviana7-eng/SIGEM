import { useState, Fragment, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getAlunos, addAluno, updateAluno, deleteAluno } from "../services/alunosService";
import { getOcorrenciasAluno, addOcorrencia, deleteOcorrencia } from "../services/ocorrenciasService";
import { getTurmas } from "../services/turmasService";
import { uploadDocumento } from "../services/documentosService";
import { registrarAuditoria } from "../services/auditoriaService";
import {
  ANOS_LETIVOS, STATUS_ALUNO, CORES_RACAS, ZONAS,
  ETAPAS_ENSINO, TURNOS_MATRICULA, NACIONALIDADES, SITUACOES_ANTERIOR, VINCULOS_RESPONSAVEL, DEFICIENCIAS_INEP_2026,
  TIPOS_OCORRENCIA, TIPOS_DOCUMENTOS_ALUNO
} from "../utils/constants";
import { Card, Badge, Btn, Modal, Input, Select, Alert, Spinner, EmptyState } from "../components/ui";
import { comprimirEUploadFoto } from "../utils/upload";
import CropModal from "../components/CropModal";
import DocumentoViewerModal from "../components/DocumentoViewerModal";
import { formatCPF, formatSUS, formatNIS, formatCEP, formatTelefone } from "../utils/masks";

const VAZIO = {
  // 1. DADOS DA ETAPA E ESCOLA
  escolaNome: "",
  escolaInep: "",
  etapaEnsino: "Ensino Fundamental (Anos Iniciais / 1º ao 5º ano)",
  ano: "1º Ano",
  turno: "Matutino",
  status: "Ativo",
  matricula: "",

  // 2. DADOS PESSOAIS DO ALUNO
  nome: "",
  nascimento: "",
  sexo: "Masculino",
  corRaca: "Não declarado",
  nacionalidade: "Brasileira",
  paisOrigem: "",
  ufNascimento: "",
  municipioNascimento: "",
  cpf: "",
  rg: "",
  rgOrgaoEmissor: "",
  registroCivil: "",
  cartaoSus: "",
  nis: "",
  fotoUrl: "",

  // 3. CONTATO E ENDEREÇO DO ESTUDANTE
  cep: "",
  endereco: "",
  enderecoNumero: "",
  complemento: "",
  bairro: "",
  municipio: "Maceió",
  uf: "AL",
  zona: "Urbana",
  telefone: "",
  email: "",

  // 4. DADOS DOS RESPONSÁVEIS
  mae: "",
  pai: "",
  responsavel: "",
  responsavelCpf: "",
  responsavelRg: "",
  responsavelVinculo: "Mãe",

  // 5. HISTÓRICO ESCOLAR / PROCEDÊNCIA
  escolaOrigem: "",
  escolaOrigemCidadeUf: "",
  anoAnterior: "",
  situacaoAnterior: "Nunca frequentou a escola",

  // 6. INFORMAÇÕES ESPECÍFICAS (EXIGÊNCIAS INEP)
  transporteEscolar: "Não",
  transporteEsfera: "Municipal",
  possuiDeficiencia: "Não",
  deficienciasSelecionadas: [],
  recebeAee: "Não",

  // 7. DOCUMENTOS ANEXOS
  documentos: {}
};

export default function Alunos() {
  const navigate = useNavigate();
  const { user, selectedEscolaId, escolas } = useAuth();
  const activeEscolaId = user?.selectedEscolaId || "";

  const { dados: alunos, carregando, recarregar } = useFirestore(
    useCallback(() => getAlunos(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );
  const { dados: turmas } = useFirestore(
    useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  const [form, setForm] = useState(VAZIO);
  const [editId, setEditId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("escola");
  const [salvando, setSalvando] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [docVisualizando, setDocVisualizando] = useState(null);

  // Estados de Ocorrências
  const [alunoOcorrencia, setAlunoOcorrencia] = useState(null);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [novaOcorrencia, setNovaOcorrencia] = useState({ data: new Date().toISOString().split('T')[0], tipo: "", descricao: "" });
  const [salvandoOcorrencia, setSalvandoOcorrencia] = useState(false);

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
      const url = await comprimirEUploadFoto(croppedFile, "alunos", editId || Date.now().toString());
      set("fotoUrl", url);
    } catch (error) {
      alert("Erro ao carregar foto: " + error.message);
    } finally {
      setCarregandoFoto(false);
    }
  }

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })); }

  function abrirNovo() {
    const escolaLogada = (escolas || []).find(e => e.id === activeEscolaId);
    setForm({
      ...VAZIO,
      escolaNome: escolaLogada ? escolaLogada.nome : "",
      escolaInep: escolaLogada ? (escolaLogada.inep || "") : "",
      turma: turmas.length > 0 ? turmas[0].nome : ""
    });
    setEditId(null);
    setAbaAtiva("escola");
    setModalAberto(true);
  }

  function abrirEditar(a) {
    setForm({ ...VAZIO, ...a });
    setEditId(a.id);
    setAbaAtiva("escola");
    setModalAberto(true);
  }

  async function handleUploadDocModal(e, tipoDocId) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDocId(tipoDocId);
    try {
      const docMetadata = await uploadDocumento(file, editId || "novo", tipoDocId);
      setForm(f => ({
        ...f,
        documentos: {
          ...(f.documentos || {}),
          [tipoDocId]: docMetadata
        }
      }));
    } catch (err) {
      alert("Erro ao anexar documento: " + err.message);
    } finally {
      setUploadingDocId(null);
      e.target.value = "";
    }
  }

  function handleRemoverDocModal(tipoDocId) {
    setForm(f => {
      const novos = { ...(f.documentos || {}) };
      delete novos[tipoDocId];
      return { ...f, documentos: novos };
    });
  }

  async function salvar() {
    if (!form.nome) { alert("Preencha o nome completo."); return; }
    if (!form.nascimento) { alert("Preencha a data de nascimento."); return; }
    if (!form.turma) { alert("Preencha a turma."); return; }
    if (!form.cpf) { alert("Preencha o CPF (obrigatório para o Censo Escolar 2026)."); return; }
    if (!form.mae) { alert("Preencha o nome da mãe (obrigatório para o Censo Escolar 2026)."); return; }
    setSalvando(true);
    try {
      if (editId) {
        const alunoAntigo = alunos.find(a => a.id === editId) || {};
        await updateAluno(editId, form);

        // Gera diff legível para auditoria
        const alteracoes = [];
        if (alunoAntigo.turma !== form.turma) alteracoes.push(`Turma: ${alunoAntigo.turma || '—'} → ${form.turma}`);
        if (alunoAntigo.turno !== form.turno) alteracoes.push(`Turno: ${alunoAntigo.turno || '—'} → ${form.turno}`);
        if (alunoAntigo.status !== form.status) alteracoes.push(`Status: ${alunoAntigo.status || 'Ativo'} → ${form.status}`);
        if (alunoAntigo.cpf !== form.cpf) alteracoes.push(`CPF: ${alunoAntigo.cpf || '—'} → ${form.cpf}`);
        if (alunoAntigo.cartaoSus !== form.cartaoSus) alteracoes.push(`SUS: ${alunoAntigo.cartaoSus || '—'} → ${form.cartaoSus}`);
        if (alunoAntigo.nome !== form.nome) alteracoes.push(`Nome: ${alunoAntigo.nome || '—'} → ${form.nome}`);

        const anteriorResumo = alteracoes.length > 0 ? alteracoes.map(a => a.split(" → ")[0]).join(", ") : (alunoAntigo.turma || "Dados anteriores");
        const novoResumo = alteracoes.length > 0 ? alteracoes.map(a => a.split(" → ")[1]).join(", ") : (form.turma || "Dados atualizados");

        await registrarAuditoria({
          usuario: user,
          escolaId: activeEscolaId,
          escolaNome: form.escolaNome || "Escola Municipal",
          modulo: "Alunos",
          acao: "EDICAO_ALUNO",
          entidade: "Aluno",
          entidadeId: editId,
          entidadeNome: form.nome,
          registroAnterior: anteriorResumo,
          registroNovo: novoResumo,
          descricao: `${user?.displayName || 'Secretaria'} editou o cadastro do aluno ${form.nome} (${alteracoes.join("; ") || 'Dados atualizados'})`
        });
      } else {
        const novoDoc = await addAluno(form, activeEscolaId);
        await registrarAuditoria({
          usuario: user,
          escolaId: activeEscolaId,
          escolaNome: form.escolaNome || "Escola Municipal",
          modulo: "Alunos",
          acao: "CADASTRO_ALUNO",
          entidade: "Aluno",
          entidadeId: novoDoc?.id || "",
          entidadeNome: form.nome,
          registroAnterior: "—",
          registroNovo: `Cadastrado na Turma ${form.turma} (${form.turno})`,
          descricao: `${user?.displayName || 'Secretaria'} cadastrou o aluno ${form.nome} na Turma ${form.turma}`
        });
      }
      setModalAberto(false);
      setAlerta({ msg: `Aluno "${form.nome}" salvo com sucesso.`, tipo: "success" });
      recarregar();
    } catch (e) {
      setAlerta({ msg: "Erro ao salvar: " + e.message, tipo: "error" });
    } finally {
      setSalvando(false);
    }
  }

  async function remover(aluno) {
    if (!window.confirm(`Remover "${aluno.nome}"?`)) return;
    try {
      await deleteAluno(aluno.id);
      await registrarAuditoria({
        usuario: user,
        escolaId: activeEscolaId,
        modulo: "Alunos",
        acao: "EXCLUSAO_ALUNO",
        entidade: "Aluno",
        entidadeId: aluno.id,
        entidadeNome: aluno.nome,
        registroAnterior: `Turma ${aluno.turma} (${aluno.status || 'Ativo'})`,
        registroNovo: "Excluído do Sistema",
        descricao: `${user?.displayName || 'Administrador'} removeu o cadastro do aluno ${aluno.nome}`
      });
      setAlerta({ msg: "Aluno removido.", tipo: "success" });
      recarregar();
    } catch (e) {
      setAlerta({ msg: "Erro: " + e.message, tipo: "error" });
    }
  }

  async function abrirOcorrencias(aluno) {
    setAlunoOcorrencia(aluno);
    setOcorrencias([]);
    setNovaOcorrencia({ data: new Date().toISOString().split('T')[0], tipo: "", descricao: "" });
    try {
      const list = await getOcorrenciasAluno(aluno.id, activeEscolaId);
      setOcorrencias(list);
    } catch(e) {
      setAlerta({ msg: "Erro ao buscar ocorrências.", tipo: "error" });
    }
  }

  async function salvarNovaOcorrencia() {
    if (!novaOcorrencia.data || !novaOcorrencia.tipo || !novaOcorrencia.descricao.trim()) {
      alert("Preencha todos os campos da ocorrência.");
      return;
    }
    setSalvandoOcorrencia(true);
    try {
      const nova = {
        ...novaOcorrencia,
        alunoId: alunoOcorrencia.id,
        registradoPor: user?.displayName || user?.email || "Usuário"
      };
      const id = await addOcorrencia(nova, activeEscolaId);
      await registrarAuditoria({
        usuario: user,
        escolaId: activeEscolaId,
        modulo: "Ocorrências",
        acao: "NOVA_OCORRENCIA",
        entidade: "Ocorrência",
        entidadeId: id,
        entidadeNome: `${alunoOcorrencia.nome} (${novaOcorrencia.tipo})`,
        registroAnterior: "—",
        registroNovo: novaOcorrencia.descricao.substring(0, 40) + "...",
        descricao: `${user?.displayName || 'Coordenação'} registrou ocorrência para ${alunoOcorrencia.nome}: "${novaOcorrencia.tipo}"`
      });
      setOcorrencias(prev => [{ id, ...nova }, ...prev]);
      setNovaOcorrencia({ data: new Date().toISOString().split('T')[0], tipo: "", descricao: "" });
    } catch(e) {
      alert("Erro ao salvar ocorrência: " + e.message);
    } finally {
      setSalvandoOcorrencia(false);
    }
  }

  async function removerOcorrencia(id) {
    if (!window.confirm("Deseja realmente excluir esta ocorrência?")) return;
    try {
      await deleteOcorrencia(id);
      setOcorrencias(prev => prev.filter(o => o.id !== id));
    } catch(e) {
      alert("Erro ao excluir ocorrência.");
    }
  }

  const filtrados = alunos.filter(a => {
    const matchBusca = a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
                       a.matricula?.includes(busca) ||
                       a.turma?.toLowerCase().includes(busca.toLowerCase());
    const matchTurma = filtroTurma === "" || a.turma === filtroTurma;
    return matchBusca && matchTurma;
  });

  if (carregando) return <Spinner />;

  return (
    <div>
      {alerta && <Alert tipo={alerta.tipo}>{alerta.msg}</Alert>}

      <div style={{ display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,background:"var(--bg-surface)",border:"1px solid var(--border-color)",borderRadius:10,padding:"8px 12px",flex:"1 1 240px",maxWidth:"100%" }}>
          <i className="ti ti-search" style={{ color:"var(--text-muted)",fontSize:16 }} />
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por nome, matrícula ou turma..."
            style={{ border:"none",background:"none",fontSize:13,outline:"none",width:"100%",color:"var(--text-primary)" }} />
        </div>
        <select
          value={filtroTurma}
          onChange={e => setFiltroTurma(e.target.value)}
          style={{ padding: "8.5px 12px", border: "1px solid var(--border-color)", borderRadius: 10, fontSize: 13, outline: "none", background: "var(--bg-surface)", color: "var(--text-primary)", cursor: "pointer", flex: "1 1 140px" }}
        >
          <option value="">Todas as Turmas</option>
          {(turmas || []).map(t => (
            <option key={t.id} value={t.nome}>{t.nome}</option>
          ))}
        </select>
        <Btn variant="primary" onClick={abrirNovo} style={{ flex: "0 0 auto" }}>
          <i className="ti ti-plus" aria-hidden="true" /> Novo aluno
        </Btn>
      </div>

      {!filtrados.length ? (
        <EmptyState icon="users-off" texto="Nenhum aluno encontrado." />
      ) : (
        <>
          {/* Visualização Desktop: Tabela Estruturada Completa */}
          <div className="sigem-desktop-table">
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface)" }}>
                      {["Matrícula", "Nome do Aluno", "Ano / Turma", "Turno", "Mãe / Resp.", "Docs Anexos", "Status", "Ações"].map(h => (
                        <th key={h} style={{ textAlign:"left",padding:"12px 14px",fontSize:11,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid var(--border-color)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map(a => {
                      const censoCompleto = !!(a.cpf && a.mae && a.nascimento);
                      const qtdDocs = Object.keys(a.documentos || {}).length;

                      return (
                        <Fragment key={a.id}>
                          <tr
                            onClick={() => navigate(`/alunos/${a.id}`)}
                            style={{ cursor: "pointer", borderBottom: "1px solid var(--border-color)", transition: "background 0.15s ease" }}
                            onMouseOver={e => e.currentTarget.style.background="var(--bg-surface)"}
                            onMouseOut={e => e.currentTarget.style.background="transparent"}
                          >
                            <td style={{ padding:"12px 14px",fontFamily:"monospace",fontSize:12,color:"var(--text-muted)" }}>{a.matricula || "—"}</td>
                            <td style={{ padding:"12px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", background: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-color)", flexShrink: 0 }}>
                                  {a.fotoUrl ? (
                                    <img src={a.fotoUrl} alt={a.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  ) : (
                                    <i className="ti ti-user" style={{ fontSize: 20, color: "var(--text-muted)" }} />
                                  )}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontWeight:600, color: "var(--text-primary)", fontSize: 13 }}>{a.nome}</span>
                                    {!censoCompleto && <span style={{ color: "#ef4444", fontSize: 10, cursor: "help" }} title="Dados obrigatórios do Censo Escolar pendentes (CPF/Mãe/Nascimento)">⚠️</span>}
                                  </div>
                                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>CPF: {a.cpf || "Não informado"}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding:"12px 14px" }}><Badge>{a.turma}</Badge> <span style={{ fontSize:11,color:"var(--text-muted)",marginLeft:4 }}>{a.ano}</span></td>
                            <td style={{ padding:"12px 14px",fontSize:13,color:"var(--text-secondary)" }}>{a.turno}</td>
                            <td style={{ padding:"12px 14px",fontSize:12,color:"var(--text-secondary)" }}>
                              <div>{a.mae || <span style={{ color: "#f87171" }}>Sem Mãe</span>}</div>
                              {a.responsavel && a.responsavel !== a.mae && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Resp: {a.responsavel}</div>}
                            </td>
                            <td style={{ padding:"12px 14px" }}>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "3px 9px",
                                borderRadius: 10,
                                background: qtdDocs >= 4 ? "var(--badge-green-bg, rgba(16, 185, 129, 0.15))" : "var(--badge-amber-bg, rgba(245, 158, 11, 0.15))",
                                color: qtdDocs >= 4 ? "var(--badge-green-text, #34d399)" : "var(--badge-amber-text, #fbbf24)",
                                border: qtdDocs >= 4 ? "1px solid var(--badge-green-border, rgba(16, 185, 129, 0.3))" : "1px solid var(--badge-amber-border, rgba(245, 158, 11, 0.3))"
                              }}>
                                <i className="ti ti-folder" /> {qtdDocs} / {TIPOS_DOCUMENTOS_ALUNO.length}
                              </span>
                            </td>
                            <td style={{ padding:"12px 14px" }}><Badge color={a.status==="Ativo"?"green":a.status==="Transferido"?"amber":"gray"}>{a.status || "Ativo"}</Badge></td>
                            <td style={{ padding:"12px 14px" }}>
                              <div style={{ display:"flex",gap:4 }}>
                                <Btn
                                  onClick={(e) => { e.stopPropagation(); navigate(`/alunos/${a.id}`); }}
                                  style={{ padding:"5px 10px",fontSize:12, background: "var(--badge-blue-bg, rgba(56, 189, 248, 0.12))", color: "var(--badge-blue-text, #0369a1)", border: "1px solid var(--badge-blue-border, rgba(56, 189, 248, 0.3))", fontWeight: 600 }}
                                  title="Abrir Ficha Expandida do Aluno"
                                >
                                  <i className="ti ti-id" style={{ fontSize: 13 }} aria-hidden="true" /> Ficha
                                </Btn>
                                <Btn onClick={(e) => { e.stopPropagation(); abrirOcorrencias(a); }} style={{ padding:"5px 8px",fontSize:12, background: "var(--badge-purple-bg, rgba(192, 132, 252, 0.12))", color: "var(--badge-purple-text, #6d28d9)", border: "1px solid var(--badge-purple-border, rgba(192, 132, 252, 0.3))" }} title="Ocorrências"><i className="ti ti-clipboard-text" style={{ fontSize: 13 }} aria-hidden="true" /></Btn>
                                <Btn onClick={(e) => { e.stopPropagation(); abrirEditar(a); }} style={{ padding:"5px 8px",fontSize:12 }} title="Editar Aluno"><i className="ti ti-edit" style={{ fontSize: 13 }} aria-hidden="true" /></Btn>
                                <Btn variant="danger" onClick={(e) => { e.stopPropagation(); remover(a); }} style={{ padding:"5px 8px",fontSize:12 }} title="Excluir Aluno"><i className="ti ti-trash" style={{ fontSize: 13 }} aria-hidden="true" /></Btn>
                              </div>
                            </td>
                          </tr>
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Visualização Mobile: Cards Otimizados (Foto, Nome, Turma, Matrícula e Toque) */}
          <div className="sigem-mobile-cards">
            {filtrados.map((a) => {
              const censoCompleto = !!(a.cpf && a.mae && a.nascimento);
              return (
                <div
                  key={`mob-${a.id}`}
                  onClick={() => navigate(`/alunos/${a.id}`)}
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
                  {/* Foto do Aluno */}
                  <div
                    style={{
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
                    }}
                  >
                    {a.fotoUrl ? (
                      <img src={a.fotoUrl} alt={a.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <i className="ti ti-user" style={{ fontSize: 24, color: "var(--text-muted)" }} />
                    )}
                  </div>

                  {/* Informações Essenciais */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          fontSize: 13.5,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {a.nome}
                      </span>
                      {!censoCompleto && <span style={{ color: "#ef4444", fontSize: 11 }} title="Censo pendente">⚠️</span>}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Badge color="blue">{a.turma || "Sem Turma"}</Badge>
                      {a.ano && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.ano}</span>}
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)", marginLeft: "auto" }}>
                        #{a.matricula || "S/N"}
                      </span>
                    </div>
                  </div>

                  {/* Status & Indicador de Navegação */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <Badge color={a.status === "Ativo" ? "green" : a.status === "Transferido" ? "amber" : "gray"}>
                      {a.status || "Ativo"}
                    </Badge>
                    <div style={{ color: "var(--text-muted)", fontSize: 18, display: "flex", alignItems: "center" }}>
                      <i className="ti ti-chevron-right" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal de Cadastro / Edição com aba Documentos */}
      {modalAberto && (
        <Modal
          titulo={editId ? "Editar Aluno" : "Novo Aluno"}
          onClose={() => setModalAberto(false)}
          onSave={salvar}
          salvando={salvando}
          width={960}
        >
          <div className="sigem-modal-container" style={{ display: "flex", gap: 16, minHeight: 440 }}>
            {/* Navegação Lateral (Sidebar) / Abas no Mobile */}
            <div className="sigem-modal-tabs" style={{
              width: 190,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              borderRight: "1px solid var(--border-color)",
              paddingRight: 12,
              flexShrink: 0
            }}>
              {[
                { id: "escola", label: "Escola / Etapa", icon: "school" },
                { id: "pessoais", label: "Dados Pessoais", icon: "user" },
                { id: "endereco", label: "Endereço / Contato", icon: "map-pin" },
                { id: "responsaveis", label: "Responsáveis", icon: "users" },
                { id: "historico_censo", label: "Histórico / Censo", icon: "file-text" },
                { id: "documentos", label: "Documentos Anexos", icon: "folder" }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  className="sigem-modal-tab-btn"
                  onClick={() => setAbaAtiva(t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 12px",
                    border: "none",
                    borderRadius: 8,
                    background: abaAtiva === t.id ? "var(--badge-purple-bg, rgba(99, 102, 241, 0.15))" : "transparent",
                    fontSize: 13,
                    fontWeight: abaAtiva === t.id ? 700 : 500,
                    color: abaAtiva === t.id ? "var(--accent-indigo, #818cf8)" : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "left"
                  }}
                >
                  <i className={`ti ti-${t.icon}`} style={{ fontSize: 16 }} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Conteúdo à Direita */}
            <div
              className="no-scrollbar"
              style={{
                flex: 1,
                paddingRight: 8,
                overflowY: "auto",
                maxHeight: 460,
                scrollbarWidth: "none",
                msOverflowStyle: "none"
              }}
            >
              {abaAtiva === "escola" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Nome da Unidade Escolar *</label>
                      <Select
                        value={form.escolaNome}
                        disabled={user?.role !== "Administrador"}
                        onChange={e => {
                          const escNome = e.target.value;
                          const esc = (escolas || []).find(x => x.nome === escNome);
                          setForm(f => ({
                            ...f,
                            escolaNome: escNome,
                            escolaInep: esc ? (esc.inep || "") : ""
                          }));
                        }}
                      >
                        <option value="">Selecione uma escola...</option>
                        {(escolas || []).map(esc => (
                          <option key={esc.id} value={esc.nome}>{esc.nome}</option>
                        ))}
                      </Select>
                    </div>
                    <Input label="Código INEP da Escola" value={form.escolaInep} disabled placeholder="Automático" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                    <Select label="Etapa de Ensino *" value={form.etapaEnsino} onChange={e => set("etapaEnsino", e.target.value)}>
                      {ETAPAS_ENSINO.map(et => <option key={et}>{et}</option>)}
                    </Select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Select label="Ano/Série Pretendida *" value={form.ano} onChange={e => set("ano", e.target.value)}>
                      {ANOS_LETIVOS.map(a => <option key={a}>{a}</option>)}
                    </Select>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Turma *</label>
                      <Select value={form.turma} onChange={e => set("turma", e.target.value)}>
                        <option value="">Selecione uma turma...</option>
                        {(turmas || []).map(t => (
                          <option key={t.id} value={t.nome}>{t.nome}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Select label="Turno *" value={form.turno} onChange={e => set("turno", e.target.value)}>
                      {TURNOS_MATRICULA.map(t => <option key={t}>{t}</option>)}
                    </Select>
                    <Select label="Status Operacional *" value={form.status} onChange={e => set("status", e.target.value)}>
                      {STATUS_ALUNO.map(s => <option key={s}>{s}</option>)}
                    </Select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                    <Input label="Nº de Matrícula (Opcional)" value={form.matricula} onChange={e => set("matricula", e.target.value)} placeholder="Ex: 20260001" />
                  </div>
                </div>
              )}

              {abaAtiva === "pessoais" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Upload de Foto */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#243144", padding: 14, borderRadius: 10, border: "1px solid #33435c" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #6366f1", flexShrink: 0 }}>
                      {form.fotoUrl ? (
                        <img src={form.fotoUrl} alt="Visualização" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <i className="ti ti-camera" style={{ fontSize: 22, color: "#94a3b8" }} />
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>Foto do Aluno</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <label style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 14px",
                          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          color: "#ffffff",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: carregandoFoto ? "not-allowed" : "pointer",
                          opacity: carregandoFoto ? 0.7 : 1,
                          border: "none",
                          boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)"
                        }}>
                          <i className="ti ti-upload" />
                          {carregandoFoto ? "Carregando..." : "Enviar Foto"}
                          <input type="file" accept="image/*" onChange={handleFotoSelect} disabled={carregandoFoto} style={{ display: "none" }} />
                        </label>
                        {form.fotoUrl && (
                          <Btn variant="danger" onClick={() => set("fotoUrl", "")} style={{ padding: "5px 10px", fontSize: 12 }}>
                            <i className="ti ti-trash" /> Remover
                          </Btn>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                    <Input label="Nome completo (sem abreviações) *" value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome completo do aluno" />
                    <Input label="Data de nascimento *" type="date" value={form.nascimento} onChange={e => set("nascimento", e.target.value)} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Select label="Sexo *" value={form.sexo} onChange={e => set("sexo", e.target.value)}>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </Select>
                    <Select label="Cor/Raça (Padrão IBGE/INEP) *" value={form.corRaca} onChange={e => set("corRaca", e.target.value)}>
                      {CORES_RACAS.map(c => <option key={c}>{c}</option>)}
                    </Select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Select label="Nacionalidade *" value={form.nacionalidade} onChange={e => set("nacionalidade", e.target.value)}>
                      {NACIONALIDADES.map(n => <option key={n}>{n}</option>)}
                    </Select>
                    {form.nacionalidade === "Estrangeira" ? (
                      <Input label="País de Origem *" value={form.paisOrigem} onChange={e => set("paisOrigem", e.target.value)} placeholder="Ex: Venezuela" />
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
                        <Input label="UF Nascimento" value={form.ufNascimento} onChange={e => set("ufNascimento", e.target.value)} placeholder="AL" />
                        <Input label="Município Nascimento" value={form.municipioNascimento} onChange={e => set("municipioNascimento", e.target.value)} placeholder="Maceió" />
                      </div>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="CPF do Aluno *" value={form.cpf} onChange={e => set("cpf", formatCPF(e.target.value))} placeholder="000.000.000-00" />
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                      <Input label="RG do Aluno" value={form.rg} onChange={e => set("rg", e.target.value)} placeholder="0000000" />
                      <Input label="Órgão" value={form.rgOrgaoEmissor} onChange={e => set("rgOrgaoEmissor", e.target.value)} placeholder="SSP" />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="Nº do Registro Civil (Certidão)" value={form.registroCivil} onChange={e => set("registroCivil", e.target.value)} placeholder="Certidão de nascimento" />
                    <Input label="Nº do Cartão SUS" value={form.cartaoSus} onChange={e => set("cartaoSus", formatSUS(e.target.value))} placeholder="000.0000.0000.0000" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                    <Input label="Nº do NIS / Bolsa Família (se houver)" value={form.nis} onChange={e => set("nis", formatNIS(e.target.value))} placeholder="Número de Identificação Social" />
                  </div>
                </div>
              )}

              {abaAtiva === "endereco" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr 1fr", gap: 12 }}>
                    <Input label="CEP" value={form.cep} onChange={e => set("cep", formatCEP(e.target.value))} placeholder="00000-000" />
                    <Input label="Endereço Residencial/Comercial" value={form.endereco} onChange={e => set("endereco", e.target.value)} placeholder="Av. Principal, Rua, etc." />
                    <Input label="Nº" value={form.enderecoNumero} onChange={e => set("enderecoNumero", e.target.value)} placeholder="123" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="Complemento" value={form.complemento} onChange={e => set("complemento", e.target.value)} placeholder="Apto 101, Bloco B" />
                    <Input label="Bairro" value={form.bairro} onChange={e => set("bairro", e.target.value)} placeholder="Centro" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                    <Input label="Município" value={form.municipio} onChange={e => set("municipio", e.target.value)} placeholder="Maceió" />
                    <Input label="UF" value={form.uf} onChange={e => set("uf", e.target.value)} placeholder="AL" />
                    <Select label="Zona de Residência" value={form.zona} onChange={e => set("zona", e.target.value)}>
                      {ZONAS.map(z => <option key={z}>{z}</option>)}
                    </Select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="Telefone Celular (com DDD) *" value={form.telefone} onChange={e => set("telefone", formatTelefone(e.target.value))} placeholder="(82) 99999-9999" />
                    <Input label="E-mail" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="aluno@escola.com" />
                  </div>
                </div>
              )}

              {abaAtiva === "responsaveis" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: 12 }}>
                    <Input label="Nome Completo da Mãe *" value={form.mae} onChange={e => set("mae", e.target.value)} placeholder="Nome completo da mãe" />
                    <Input label="Nome Completo do Pai" value={form.pai} onChange={e => set("pai", e.target.value)} placeholder="Nome completo do pai" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                    <Input label="Nome do Responsável Legal" value={form.responsavel} onChange={e => set("responsavel", e.target.value)} placeholder="Nome do tutor/responsável legal" />
                    <Select label="Vínculo do Responsável" value={form.responsavelVinculo} onChange={e => set("responsavelVinculo", e.target.value)}>
                      {VINCULOS_RESPONSAVEL.map(v => <option key={v}>{v}</option>)}
                    </Select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="CPF do Responsável" value={form.responsavelCpf} onChange={e => set("responsavelCpf", formatCPF(e.target.value))} placeholder="000.000.000-00" />
                    <Input label="RG do Responsável" value={form.responsavelRg} onChange={e => set("responsavelRg", e.target.value)} placeholder="0000000" />
                  </div>
                </div>
              )}

              {abaAtiva === "historico_censo" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                    <Input label="Escola de Origem" value={form.escolaOrigem} onChange={e => set("escolaOrigem", e.target.value)} placeholder="Nome da escola anterior" />
                    <Input label="Município/UF de Origem" value={form.escolaOrigemCidadeUf} onChange={e => set("escolaOrigemCidadeUf", e.target.value)} placeholder="Maceió/AL" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="Ano Letivo Anterior" value={form.anoAnterior} onChange={e => set("anoAnterior", e.target.value)} placeholder="Ex: 2025" />
                    <Select label="Situação Escolar Anterior" value={form.situacaoAnterior} onChange={e => set("situacaoAnterior", e.target.value)}>
                      {SITUACOES_ANTERIOR.map(sa => <option key={sa}>{sa}</option>)}
                    </Select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Select label="Transporte Escolar Público?" value={form.transporteEscolar} onChange={e => set("transporteEscolar", e.target.value)}>
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </Select>
                    {form.transporteEscolar === "Sim" && (
                      <Select label="Esfera Responsável pelo Transporte" value={form.transporteEsfera} onChange={e => set("transporteEsfera", e.target.value)}>
                        <option value="Municipal">Municipal</option>
                        <option value="Estadual">Estadual</option>
                      </Select>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Select label="Possui Deficiência/TEA/Superdotação?" value={form.possuiDeficiencia} onChange={e => set("possuiDeficiencia", e.target.value)}>
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </Select>
                    <Select label="Recebe AEE (Atendimento Especializado)?" value={form.recebeAee} onChange={e => set("recebeAee", e.target.value)}>
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </Select>
                  </div>

                  {form.possuiDeficiencia === "Sim" && (
                    <div style={{ background: "#243144", border: "1px solid #33435c", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>Selecione as deficiências (exige laudo):</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {DEFICIENCIAS_INEP_2026.map(def => {
                          const checked = (form.deficienciasSelecionadas || []).includes(def);
                          return (
                            <label key={def} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ffffff", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  const list = form.deficienciasSelecionadas || [];
                                  if (checked) {
                                    set("deficienciasSelecionadas", list.filter(item => item !== def));
                                  } else {
                                    set("deficienciasSelecionadas", [...list, def]);
                                  }
                                }}
                              />
                              {def}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {abaAtiva === "documentos" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontSize: 13, color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(56, 189, 248, 0.25)" }}>
                    ℹ️ Você pode anexar os documentos do aluno agora ou posteriormente através da <strong>Ficha Expandida</strong> do aluno.
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {TIPOS_DOCUMENTOS_ALUNO.map(tipoDoc => {
                      const docAnexado = form.documentos?.[tipoDoc.id];
                      const isUploading = uploadingDocId === tipoDoc.id;

                      return (
                        <div key={tipoDoc.id} style={{ border: docAnexado ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #33435c", borderRadius: 10, padding: 12, background: docAnexado ? "rgba(16, 185, 129, 0.08)" : "#243144" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>{tipoDoc.label}</span>
                            {tipoDoc.obrigatorio && <span style={{ fontSize: 9, color: "#f87171", fontWeight: 700, background: "rgba(239, 68, 68, 0.15)", padding: "2px 6px", borderRadius: 4 }}>OBRIGATÓRIO</span>}
                          </div>

                          {docAnexado ? (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: "#34d399", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                                ✓ {docAnexado.nome || "Anexado"}
                              </span>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() => setDocVisualizando(docAnexado)}
                                  style={{ background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.4)", color: "#a5b4fc", padding: "4px 8px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                                >
                                  Ver
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoverDocModal(tipoDoc.id)}
                                  style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", padding: "4px 8px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 12px",
                              fontSize: 12,
                              borderRadius: 6,
                              background: "#1e293b",
                              color: "#cbd5e1",
                              cursor: isUploading ? "not-allowed" : "pointer",
                              border: "1px solid #33435c",
                              fontWeight: 500
                            }}>
                              <i className={`ti ${isUploading ? "ti-loader" : "ti-upload"}`} />
                              {isUploading ? "Enviando..." : "Anexar PDF / Foto"}
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => handleUploadDocModal(e, tipoDoc.id)}
                                disabled={isUploading}
                                style={{ display: "none" }}
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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

      {/* Visualizador de Documento */}
      {docVisualizando && (
        <DocumentoViewerModal
          documento={docVisualizando}
          onClose={() => setDocVisualizando(null)}
        />
      )}

      {/* Modal Rápido de Ocorrências */}
      {alunoOcorrencia && (
        <Modal
          titulo={`Ocorrências de ${alunoOcorrencia.nome.split(" ")[0]}`}
          onClose={() => setAlunoOcorrencia(null)}
          onSave={() => setAlunoOcorrencia(null)}
          width={700}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Lançamento */}
            <div style={{ background: "#f9fafb", padding: 16, borderRadius: 8, border: "1px solid #e5e5e4" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#1f2937" }}>Lançar Nova Ocorrência</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
                <Input label="Data" type="date" value={novaOcorrencia.data} onChange={e => setNovaOcorrencia({ ...novaOcorrencia, data: e.target.value })} />
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Tipo de Ocorrência</label>
                  <select
                    value={novaOcorrencia.tipo}
                    onChange={e => setNovaOcorrencia({ ...novaOcorrencia, tipo: e.target.value })}
                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", fontSize: 13, background: "white" }}
                  >
                    <option value="">Selecione...</option>
                    {TIPOS_OCORRENCIA.map(grupo => (
                      <optgroup key={grupo.categoria} label={grupo.categoria}>
                        {grupo.tipos.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Descrição / Detalhes</label>
                <textarea
                  value={novaOcorrencia.descricao}
                  onChange={e => setNovaOcorrencia({ ...novaOcorrencia, descricao: e.target.value })}
                  placeholder="Descreva o que aconteceu..."
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "10px", fontSize: 13, background: "white", minHeight: 60, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
              <Btn variant="primary" onClick={salvarNovaOcorrencia} disabled={salvandoOcorrencia}>
                <i className="ti ti-check" /> {salvandoOcorrencia ? "Salvando..." : "Salvar Ocorrência"}
              </Btn>
            </div>

            {/* Histórico */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#1f2937", borderBottom: "1px solid #e5e5e4", paddingBottom: 8 }}>Histórico de Ocorrências ({ocorrencias.length})</h4>
              {!ocorrencias.length ? (
                <div style={{ textAlign: "center", padding: 24, color: "#9ca3af", background: "#f9fafb", borderRadius: 8 }}>
                  Nenhuma ocorrência registrada.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
                  {ocorrencias.map(o => {
                    const dataStr = o.data ? new Date(o.data + "T12:00:00").toLocaleDateString("pt-BR") : "Data não informada";
                    const isElogio = o.tipo === "Elogio";
                    return (
                      <div key={o.id} style={{ background: "white", padding: 12, borderRadius: 8, border: `1px solid ${isElogio ? "#bbf7d0" : "#fca5a5"}`, borderLeft: `4px solid ${isElogio ? "#22c55e" : "#ef4444"}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            <span style={{ fontWeight: 600, color: "#1f2937", fontSize: 13, display: "block" }}>{o.tipo}</span>
                            <span style={{ fontSize: 11, color: "#6b7280" }}>{dataStr} · Registrado por {o.registradoPor || "Sistema"}</span>
                          </div>
                          <button onClick={() => removerOcorrencia(o.id)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }} title="Excluir Ocorrência">
                            <i className="ti ti-trash" style={{ fontSize: 16 }} />
                          </button>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: "#4b5563", whiteSpace: "pre-wrap" }}>{o.descricao}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

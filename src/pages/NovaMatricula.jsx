import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getAlunos, addAluno } from "../services/alunosService";
import { getTurmas } from "../services/turmasService";
import { uploadDocumento } from "../services/documentosService";
import { comprimirEUploadFoto } from "../utils/upload";
import CropModal from "../components/CropModal";
import DocumentoViewerModal from "../components/DocumentoViewerModal";
import {
  CORES_RACAS,
  ETAPAS_ENSINO,
  DEFICIENCIAS_INEP_2026,
  VINCULOS_RESPONSAVEL,
  ZONAS,
  ANO_LETIVO_ATUAL,
  NACIONALIDADES,
  SITUACOES_ANTERIOR,
  STATUS_ALUNO,
  TIPOS_DOCUMENTOS_ALUNO
} from "../utils/constants";
import { Card, Badge, Btn, Input, Select, Alert, Spinner, ProgressBar } from "../components/ui";
import { formatCPF, formatSUS, formatNIS, formatCEP, formatTelefone } from "../utils/masks";

const FORM_NOVA_MATRICULA = {
  // 1. Dados Escolares e Vagas
  escolaNome: "",
  escolaInep: "",
  etapaEnsino: "Ensino Fundamental (Anos Iniciais / 1º ao 5º ano)",
  ano: "1º Ano",
  turma: "",
  turno: "Matutino",
  status: "Ativo",
  matricula: "",
  situacaoMatricula: "Matricula Nova",

  // 2. Dados do Aluno
  nome: "",
  nascimento: "",
  sexo: "Masculino",
  corRaca: "Não declarada",
  nacionalidade: "Brasileira",
  paisOrigem: "",
  ufNascimento: "AL",
  municipioNascimento: "Maceió",
  cpf: "",
  rg: "",
  rgOrgaoEmissor: "SSP",
  registroCivil: "",
  cartaoSus: "",
  nis: "",
  fotoUrl: "",

  // 3. Endereço e Contato
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

  // 4. Responsáveis
  mae: "",
  pai: "",
  responsavel: "",
  responsavelVinculo: "Mãe",
  responsavelCpf: "",
  responsavelRg: "",

  // 5. Histórico Escolar e Censo / AEE
  escolaOrigem: "",
  escolaOrigemCidadeUf: "",
  anoAnterior: "",
  situacaoAnterior: "Nunca frequentou a escola",
  transporteEscolar: "Não",
  transporteEsfera: "Municipal",
  possuiDeficiencia: "Não",
  deficienciasSelecionadas: [],
  recebeAee: "Não",

  // 6. Documentos Anexos
  documentos: {}
};

const ETAPAS_FLUXO = [
  { id: "escola", numero: 1, label: "Escola & Vagas", icon: "school" },
  { id: "pessoais", numero: 2, label: "Dados Pessoais", icon: "user" },
  { id: "endereco", numero: 3, label: "Endereço & Contato", icon: "map-pin" },
  { id: "responsaveis", numero: 4, label: "Responsáveis", icon: "users" },
  { id: "historico_censo", numero: 5, label: "Histórico & Censo", icon: "file-text" },
  { id: "documentos", numero: 6, label: "Documentos Anexos", icon: "folder" }
];

export default function NovaMatricula() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const turmaParam = searchParams.get("turma") || "";

  const { user, escolas } = useAuth();
  const activeEscolaId = user?.selectedEscolaId || "";

  const { dados: alunos, carregando: cA } = useFirestore(
    useCallback(() => getAlunos(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );
  const { dados: turmas, carregando: cT } = useFirestore(
    useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  const [passoAtivo, setPassoAtivo] = useState(1);
  const [form, setForm] = useState(FORM_NOVA_MATRICULA);
  const [salvando, setSalvando] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [matriculaConcluida, setMatriculaConcluida] = useState(null);

  // Upload e Cropper
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [docVisualizando, setDocVisualizando] = useState(null);

  // Mapeamento de Ocupação de Vagas por Turma
  const mapaVagas = useMemo(() => {
    return (turmas || []).map(t => {
      const matriculados = (alunos || []).filter(a => a.turma === t.nome && a.status === "Ativo");
      const totalVagas = Number(t.vagas) || 30;
      const ocupadas = matriculados.length;
      const disponiveis = Math.max(0, totalVagas - ocupadas);
      const percentual = Math.min(100, Math.round((ocupadas / totalVagas) * 100));

      return {
        ...t,
        totalVagas,
        ocupadas,
        disponiveis,
        percentual,
        statusVaga: disponiveis === 0 ? "lotada" : disponiveis <= 5 ? "limitada" : "aberta"
      };
    });
  }, [turmas, alunos]);

  // Inicializa dados da escola e turma sugerida
  useEffect(() => {
    if (!turmas || !escolas) return;
    const escolaLogada = (escolas || []).find(e => e.id === activeEscolaId);
    const proximoNum = (alunos?.length || 0) + 1;
    const numMatricula = `${ANO_LETIVO_ATUAL}${String(proximoNum).padStart(4, "0")}`;

    const turmaObj = turmas.find(t => t.nome === turmaParam) || turmas[0];

    setForm(f => ({
      ...f,
      matricula: f.matricula || numMatricula,
      turma: f.turma || (turmaObj ? turmaObj.nome : ""),
      ano: turmaObj ? turmaObj.ano : f.ano,
      turno: turmaObj ? turmaObj.turno : f.turno,
      escolaNome: f.escolaNome || escolaLogada?.nome || "",
      escolaInep: f.escolaInep || escolaLogada?.inep || ""
    }));
  }, [turmas, escolas, alunos, activeEscolaId, turmaParam]);

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }));
  }

  // Foto do Aluno
  function handleFotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    e.target.value = "";
  }

  async function handleCroppedFoto(croppedFile) {
    setCropFile(null);
    setCarregandoFoto(true);
    try {
      const url = await comprimirEUploadFoto(croppedFile, "alunos", Date.now().toString());
      set("fotoUrl", url);
    } catch (error) {
      alert("Erro ao processar foto: " + error.message);
    } finally {
      setCarregandoFoto(false);
    }
  }

  // Anexar Documento Digital
  async function handleUploadDoc(e, tipoDocId) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDocId(tipoDocId);
    try {
      const docMetadata = await uploadDocumento(file, "matricula_nova", tipoDocId);
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

  function handleRemoverDoc(tipoDocId) {
    setForm(f => {
      const docs = { ...(f.documentos || {}) };
      delete docs[tipoDocId];
      return { ...f, documentos: docs };
    });
  }

  function avancarPasso() {
    if (passoAtivo === 1) {
      if (!form.turma) { alert("Selecione a turma pretendida."); return; }
    } else if (passoAtivo === 2) {
      if (!form.nome.trim()) { alert("Informe o nome completo do estudante."); return; }
      if (!form.nascimento) { alert("Informe a data de nascimento."); return; }
      if (!form.cpf) { alert("Informe o CPF do estudante (obrigatório Censo 2026)."); return; }
    } else if (passoAtivo === 4) {
      if (!form.mae.trim() && !form.responsavel.trim()) {
        alert("Informe ao menos o nome da mãe ou do responsável legal.");
        return;
      }
    }
    setPassoAtivo(p => Math.min(ETAPAS_FLUXO.length, p + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function voltarPasso() {
    setPassoAtivo(p => Math.max(1, p - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarMatriculaFinal() {
    if (!form.nome.trim()) { alert("Informe o nome completo do estudante."); setPassoAtivo(2); return; }
    if (!form.nascimento) { alert("Informe a data de nascimento."); setPassoAtivo(2); return; }
    if (!form.cpf) { alert("Informe o CPF do estudante."); setPassoAtivo(2); return; }
    if (!form.mae.trim() && !form.responsavel.trim()) { alert("Informe o nome da mãe ou responsável."); setPassoAtivo(4); return; }
    if (!form.turma) { alert("Selecione a turma."); setPassoAtivo(1); return; }

    const turmaAlvo = mapaVagas.find(t => t.nome === form.turma);
    if (turmaAlvo && turmaAlvo.disponiveis <= 0) {
      const confirma = window.confirm(`Atenção: A turma "${form.turma}" atingiu a capacidade máxima de ${turmaAlvo.totalVagas} vagas. Deseja matricular mesmo assim?`);
      if (!confirma) return;
    }

    setSalvando(true);
    try {
      const docRef = await addAluno(form, activeEscolaId);
      const novoAlunoCadastrado = {
        id: docRef.id,
        ...form,
        dataEfetivacao: new Date().toISOString()
      };
      setMatriculaConcluida(novoAlunoCadastrado);
      setAlerta({ msg: `Matrícula do estudante "${form.nome}" realizada com sucesso!`, tipo: "success" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setAlerta({ msg: "Erro ao realizar matrícula: " + err.message, tipo: "error" });
    } finally {
      setSalvando(false);
    }
  }

  function reiniciarFormulario() {
    const proximoNum = (alunos?.length || 0) + 2;
    const numMatricula = `${ANO_LETIVO_ATUAL}${String(proximoNum).padStart(4, "0")}`;
    setForm({
      ...FORM_NOVA_MATRICULA,
      matricula: numMatricula,
      escolaNome: form.escolaNome,
      escolaInep: form.escolaInep,
      documentos: {}
    });
    setMatriculaConcluida(null);
    setPassoAtivo(1);
  }

  if (cA || cT) return <Spinner />;

  const qtdDocsAnexados = Object.keys(form.documentos || {}).length;
  const infoTurmaAtual = mapaVagas.find(m => m.nome === form.turma);

  // =========================================================================
  // TELA DE SUCESSO E COMPROVANTE APÓS MATRICULAR
  // =========================================================================
  if (matriculaConcluida) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900, margin: "0 auto", paddingBottom: 40 }}>
        {/* Banner de Sucesso */}
        <Card style={{ padding: "30px", textAlign: "center", background: "linear-gradient(to bottom, #f0fdf4, #ffffff)", border: "1.5px solid #86efac" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>
            <i className="ti ti-check" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#166534", margin: "0 0 8px 0" }}>Matrícula Efetivada com Sucesso!</h2>
          <p style={{ fontSize: 14, color: "#475569", margin: "0 0 20px 0" }}>
            O estudante <strong>{matriculaConcluida.nome}</strong> foi matriculado na turma <strong>{matriculaConcluida.turma}</strong> ({matriculaConcluida.turno}).
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn variant="primary" onClick={() => window.print()} style={{ padding: "10px 20px", fontSize: 14 }}>
              <i className="ti ti-printer" /> Imprimir Comprovante de Matrícula
            </Btn>
            <Btn onClick={() => navigate(`/alunos/${matriculaConcluida.id}`)} style={{ padding: "10px 20px", fontSize: 14 }}>
              <i className="ti ti-id" /> Ver Ficha do Aluno
            </Btn>
            <Btn variant="default" onClick={reiniciarFormulario} style={{ padding: "10px 18px", fontSize: 14 }}>
              <i className="ti ti-plus" /> Matricular Outro Aluno
            </Btn>
            <Btn variant="default" onClick={() => navigate("/matriculas")} style={{ padding: "10px 18px", fontSize: 14 }}>
              <i className="ti ti-layout-grid" /> Painel de Matrículas
            </Btn>
          </div>
        </Card>

        {/* Modelo Imprimível do Comprovante de Matrícula */}
        <div style={{ border: "2px solid #000", padding: 28, background: "white", borderRadius: 8, fontSize: 13, lineHeight: 1.6 }}>
          <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 14, marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, textTransform: "uppercase" }}>ESTADO DE ALAGOAS · SECRETARIA MUNICIPAL DE EDUCAÇÃO</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1e3a8a", marginTop: 4 }}>{matriculaConcluida.escolaNome || "ESCOLA MUNICIPAL"}</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>COMPROVANTE OFICIAL DE MATRÍCULA ESCOLAR · ANO LETIVO {ANO_LETIVO_ATUAL}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 20 }}>
            <div><strong>Nº de Matrícula:</strong> {matriculaConcluida.matricula || "—"}</div>
            <div><strong>Data da Efetivação:</strong> {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
            <div style={{ gridColumn: "1 / -1" }}><strong>Nome do Estudante:</strong> {matriculaConcluida.nome}</div>
            <div><strong>Data de Nascimento:</strong> {matriculaConcluida.nascimento ? new Date(matriculaConcluida.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</div>
            <div><strong>CPF do Estudante:</strong> {matriculaConcluida.cpf || "—"}</div>
            <div><strong>Turma Confirmada:</strong> {matriculaConcluida.turma} ({matriculaConcluida.ano})</div>
            <div><strong>Turno:</strong> {matriculaConcluida.turno}</div>
            <div style={{ gridColumn: "1 / -1" }}><strong>Nome da Mãe:</strong> {matriculaConcluida.mae || "Não informada"}</div>
            <div style={{ gridColumn: "1 / -1" }}><strong>Responsável Legal:</strong> {matriculaConcluida.responsavel || matriculaConcluida.mae || "—"}</div>
            <div style={{ gridColumn: "1 / -1" }}><strong>Endereço Residencial:</strong> {matriculaConcluida.endereco || "—"} {matriculaConcluida.bairro ? `· Bairro ${matriculaConcluida.bairro}` : ""}</div>
            <div><strong>Telefone / Celular:</strong> {matriculaConcluida.telefone || "—"}</div>
            <div><strong>Documentos Anexados:</strong> {Object.keys(matriculaConcluida.documentos || {}).length} documento(s)</div>
          </div>

          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, textAlign: "center", fontSize: 11 }}>
            <div>
              <div style={{ borderTop: "1px solid #000", paddingTop: 6 }}>Assinatura do Pai / Mãe / Responsável</div>
            </div>
            <div>
              <div style={{ borderTop: "1px solid #000", paddingTop: 6 }}>Secretaria Escolar / Direção</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // FLUXO PRINCIPAL DE MATRÍCULA EM PÁGINA EXPANDIDA
  // =========================================================================
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100, margin: "0 auto", paddingBottom: 50 }}>
      {alerta && <Alert tipo={alerta.tipo}>{alerta.msg}</Alert>}

      {/* Barra de Navegação Superior / Voltar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <button
            type="button"
            onClick={() => navigate("/matriculas")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              color: "#1a56db",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              padding: "4px 0",
              marginBottom: 4
            }}
          >
            <i className="ti ti-arrow-left" /> Voltar ao Painel de Matrículas & Vagas
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ti ti-user-plus" style={{ color: "#1a56db" }} />
            Processo de Nova Matrícula Escolar
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>
            Ano Letivo {ANO_LETIVO_ATUAL} · Ficha completa do estudante, censo escolar e documentação obrigatória.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Btn variant="default" onClick={() => navigate("/matriculas")}>
            Cancelar
          </Btn>
          <Btn variant="primary" onClick={salvarMatriculaFinal} disabled={salvando}>
            <i className="ti ti-check" /> {salvando ? "Efetivando Matrícula..." : "Efetivar Matrícula"}
          </Btn>
        </div>
      </div>

      {/* Barra de Etapas / Stepper */}
      <Card style={{ padding: "14px 18px", background: "white" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${ETAPAS_FLUXO.length}, 1fr)`, gap: 8 }}>
          {ETAPAS_FLUXO.map((etapa) => {
            const isAtivo = passoAtivo === etapa.numero;
            const isConcluido = passoAtivo > etapa.numero;

            return (
              <button
                key={etapa.id}
                type="button"
                onClick={() => setPassoAtivo(etapa.numero)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 8px",
                  borderRadius: 8,
                  border: isAtivo ? "1.5px solid #1a56db" : "1px solid #e2e8f0",
                  background: isAtivo ? "#eff6ff" : isConcluido ? "#f0fdf4" : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "center"
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: isAtivo ? "#1a56db" : isConcluido ? "#16a34a" : "#e2e8f0",
                  color: isAtivo || isConcluido ? "white" : "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  {isConcluido ? <i className="ti ti-check" /> : etapa.numero}
                </div>
                <span style={{ fontSize: 12, fontWeight: isAtivo ? 700 : 600, color: isAtivo ? "#1a56db" : isConcluido ? "#166534" : "#475569" }}>
                  {etapa.label}
                </span>
                {etapa.id === "documentos" && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: qtdDocsAnexados >= 4 ? "#166534" : "#ca8a04" }}>
                    {qtdDocsAnexados}/{TIPOS_DOCUMENTOS_ALUNO.length} anexados
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Conteúdo da Etapa Atual */}
      <Card style={{ padding: "28px" }}>
        
        {/* ========================================================================= */}
        {/* PASSO 1: ESCOLA, ETAPA E TURMA                                            */}
        {/* ========================================================================= */}
        {passoAtivo === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                1. Escola, Etapa de Ensino e Verificação de Vagas
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                Defina a unidade de ensino e a turma para vinculação do estudante.
              </p>
            </div>

            {/* Painel de Vagas da Turma */}
            <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", padding: 18, borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1e40af" }}>
                  Disponibilidade de Vagas na Turma Pretendida
                </span>
                {infoTurmaAtual && (
                  <Badge color={infoTurmaAtual.disponiveis > 0 ? "green" : "red"}>
                    {infoTurmaAtual.disponiveis > 0 ? `${infoTurmaAtual.disponiveis} vagas livres` : "Turma Lotada"}
                  </Badge>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                    Turma Pretendida *
                  </label>
                  <Select
                    value={form.turma}
                    onChange={e => {
                      const tNome = e.target.value;
                      const tObj = turmas.find(x => x.nome === tNome);
                      setForm(f => ({
                        ...f,
                        turma: tNome,
                        ano: tObj ? tObj.ano : f.ano,
                        turno: tObj ? tObj.turno : f.turno
                      }));
                    }}
                  >
                    <option value="">Selecione uma turma...</option>
                    {turmas.map(t => {
                      const info = mapaVagas.find(m => m.nome === t.nome);
                      return (
                        <option key={t.id} value={t.nome}>
                          {t.nome} ({t.ano} - {t.turno}) · {info?.disponiveis || 0} vagas disponíveis
                        </option>
                      );
                    })}
                  </Select>
                </div>
                <Input label="Ano / Série" value={form.ano} disabled />
                <Input label="Turno" value={form.turno} disabled />
              </div>

              {infoTurmaAtual && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "#475569" }}>Ocupação da Turma</span>
                    <strong>{infoTurmaAtual.ocupadas} de {infoTurmaAtual.totalVagas} alunos ({infoTurmaAtual.percentual}%)</strong>
                  </div>
                  <ProgressBar value={infoTurmaAtual.percentual} />
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>
                  Unidade Escolar
                </label>
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
                  <option value="">Selecione a escola...</option>
                  {(escolas || []).map(esc => (
                    <option key={esc.id} value={esc.nome}>{esc.nome}</option>
                  ))}
                </Select>
              </div>
              <Input label="Código INEP da Escola" value={form.escolaInep} disabled placeholder="Automático" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              <Select
                label="Etapa de Ensino *"
                value={form.etapaEnsino}
                onChange={e => set("etapaEnsino", e.target.value)}
              >
                {ETAPAS_ENSINO.map(et => <option key={et}>{et}</option>)}
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input
                label="Nº da Matrícula (Gerado Automaticamente)"
                value={form.matricula}
                onChange={e => set("matricula", e.target.value)}
              />
              <Select
                label="Status Operacional *"
                value={form.status}
                onChange={e => set("status", e.target.value)}
              >
                {STATUS_ALUNO.map(s => <option key={s}>{s}</option>)}
              </Select>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 2: DADOS PESSOAIS DO ALUNO                                          */}
        {/* ========================================================================= */}
        {passoAtivo === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                2. Dados Pessoais do Estudante (Censo Escolar 2026)
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                Informações cadastrais e de identificação civil do aluno.
              </p>
            </div>

            {/* Foto 3x4 */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", overflow: "hidden", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #1a56db", flexShrink: 0 }}>
                {form.fotoUrl ? (
                  <img src={form.fotoUrl} alt="Foto Aluno" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <i className="ti ti-camera" style={{ fontSize: 26, color: "#94a3b8" }} />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Foto 3x4 do Estudante</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>Anexe uma foto nítida para a ficha do aluno e carteirinha escolar.</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                  <label style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    background: "#1a56db",
                    color: "white",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: carregandoFoto ? "not-allowed" : "pointer",
                    opacity: carregandoFoto ? 0.7 : 1
                  }}>
                    <i className="ti ti-upload" />
                    {carregandoFoto ? "Processando..." : "Carregar Foto"}
                    <input type="file" accept="image/*" onChange={handleFotoSelect} disabled={carregandoFoto} style={{ display: "none" }} />
                  </label>
                  {form.fotoUrl && (
                    <Btn variant="danger" onClick={() => set("fotoUrl", "")} style={{ padding: "6px 12px", fontSize: 12 }}>
                      <i className="ti ti-trash" /> Remover Foto
                    </Btn>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr", gap: 16 }}>
              <Input
                label="Nome Completo do Aluno (sem abreviações) *"
                value={form.nome}
                onChange={e => set("nome", e.target.value)}
                placeholder="Nome completo do aluno"
              />
              <Input
                label="Data de Nascimento *"
                type="date"
                value={form.nascimento}
                onChange={e => set("nascimento", e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Select
                label="Sexo *"
                value={form.sexo}
                onChange={e => set("sexo", e.target.value)}
              >
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </Select>
              <Select
                label="Cor / Raça (Padrão IBGE/INEP) *"
                value={form.corRaca}
                onChange={e => set("corRaca", e.target.value)}
              >
                {CORES_RACAS.map(c => <option key={c}>{c}</option>)}
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Select
                label="Nacionalidade *"
                value={form.nacionalidade}
                onChange={e => set("nacionalidade", e.target.value)}
              >
                {NACIONALIDADES.map(n => <option key={n}>{n}</option>)}
              </Select>
              {form.nacionalidade === "Estrangeira" ? (
                <Input
                  label="País de Origem *"
                  value={form.paisOrigem}
                  onChange={e => set("paisOrigem", e.target.value)}
                  placeholder="Ex: Venezuela"
                />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
                  <Input
                    label="UF Nasc."
                    value={form.ufNascimento}
                    onChange={e => set("ufNascimento", e.target.value)}
                    placeholder="AL"
                  />
                  <Input
                    label="Município de Nascimento"
                    value={form.municipioNascimento}
                    onChange={e => set("municipioNascimento", e.target.value)}
                    placeholder="Maceió"
                  />
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input
                label="CPF do Aluno (Obrigatório Censo 2026) *"
                value={form.cpf}
                onChange={e => set("cpf", formatCPF(e.target.value))}
                placeholder="000.000.000-00"
              />
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                <Input
                  label="RG do Aluno"
                  value={form.rg}
                  onChange={e => set("rg", e.target.value)}
                  placeholder="0000000"
                />
                <Input
                  label="Órgão"
                  value={form.rgOrgaoEmissor}
                  onChange={e => set("rgOrgaoEmissor", e.target.value)}
                  placeholder="SSP"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input
                label="Nº do Registro Civil (Certidão de Nascimento)"
                value={form.registroCivil}
                onChange={e => set("registroCivil", e.target.value)}
                placeholder="Termo, Livro e Folha"
              />
              <Input
                label="Nº do Cartão SUS"
                value={form.cartaoSus}
                onChange={e => set("cartaoSus", formatSUS(e.target.value))}
                placeholder="000.0000.0000.0000"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              <Input
                label="Nº do NIS / Bolsa Família (se houver)"
                value={form.nis}
                onChange={e => set("nis", formatNIS(e.target.value))}
                placeholder="Número de Identificação Social"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 3: ENDEREÇO E CONTATO                                               */}
        {/* ========================================================================= */}
        {passoAtivo === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                3. Endereço e Contato do Estudante
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                Endereço residencial e canais de comunicação com a família.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr 1fr", gap: 16 }}>
              <Input
                label="CEP"
                value={form.cep}
                onChange={e => set("cep", formatCEP(e.target.value))}
                placeholder="00000-000"
              />
              <Input
                label="Endereço Residencial"
                value={form.endereco}
                onChange={e => set("endereco", e.target.value)}
                placeholder="Rua, Av, Travessa..."
              />
              <Input
                label="Nº"
                value={form.enderecoNumero}
                onChange={e => set("enderecoNumero", e.target.value)}
                placeholder="123"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input
                label="Complemento"
                value={form.complemento}
                onChange={e => set("complemento", e.target.value)}
                placeholder="Apto 101, Bloco B"
              />
              <Input
                label="Bairro"
                value={form.bairro}
                onChange={e => set("bairro", e.target.value)}
                placeholder="Centro"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
              <Input
                label="Município"
                value={form.municipio}
                onChange={e => set("municipio", e.target.value)}
                placeholder="Maceió"
              />
              <Input
                label="UF"
                value={form.uf}
                onChange={e => set("uf", e.target.value)}
                placeholder="AL"
              />
              <Select
                label="Zona de Residência"
                value={form.zona}
                onChange={e => set("zona", e.target.value)}
              >
                {ZONAS.map(z => <option key={z}>{z}</option>)}
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input
                label="Telefone / WhatsApp *"
                value={form.telefone}
                onChange={e => set("telefone", formatTelefone(e.target.value))}
                placeholder="(82) 99999-9999"
              />
              <Input
                label="E-mail de Contato"
                type="email"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="aluno@escola.com"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 4: RESPONSÁVEIS                                                     */}
        {/* ========================================================================= */}
        {passoAtivo === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                4. Dados dos Pais e Responsáveis Legais
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                Filiação e identificação do responsável legal perante a instituição escolar.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input
                label="Nome Completo da Mãe *"
                value={form.mae}
                onChange={e => set("mae", e.target.value)}
                placeholder="Nome completo da mãe"
              />
              <Input
                label="Nome Completo do Pai"
                value={form.pai}
                onChange={e => set("pai", e.target.value)}
                placeholder="Nome completo do pai"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <Input
                label="Nome do Responsável Legal"
                value={form.responsavel}
                onChange={e => set("responsavel", e.target.value)}
                placeholder="Nome do tutor ou responsável legal"
              />
              <Select
                label="Vínculo do Responsável"
                value={form.responsavelVinculo}
                onChange={e => set("responsavelVinculo", e.target.value)}
              >
                {VINCULOS_RESPONSAVEL.map(v => <option key={v}>{v}</option>)}
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input
                label="CPF do Responsável"
                value={form.responsavelCpf}
                onChange={e => set("responsavelCpf", formatCPF(e.target.value))}
                placeholder="000.000.000-00"
              />
              <Input
                label="RG do Responsável"
                value={form.responsavelRg}
                onChange={e => set("responsavelRg", e.target.value)}
                placeholder="0000000"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 5: HISTÓRICO ESCOLAR E CENSO / AEE                                  */}
        {/* ========================================================================= */}
        {passoAtivo === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                5. Histórico Escolar, Procedência e Exigências do Censo (AEE)
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                Dados da trajetória escolar anterior, transporte público e atendimento educacional especializado.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <Input
                label="Escola de Origem (Procedência)"
                value={form.escolaOrigem}
                onChange={e => set("escolaOrigem", e.target.value)}
                placeholder="Nome da escola anterior"
              />
              <Input
                label="Município / UF de Origem"
                value={form.escolaOrigemCidadeUf}
                onChange={e => set("escolaOrigemCidadeUf", e.target.value)}
                placeholder="Maceió/AL"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input
                label="Ano Letivo Anterior"
                value={form.anoAnterior}
                onChange={e => set("anoAnterior", e.target.value)}
                placeholder="Ex: 2025"
              />
              <Select
                label="Situação Escolar Anterior"
                value={form.situacaoAnterior}
                onChange={e => set("situacaoAnterior", e.target.value)}
              >
                {SITUACOES_ANTERIOR.map(sa => <option key={sa}>{sa}</option>)}
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Select
                label="Utiliza Transporte Escolar Público?"
                value={form.transporteEscolar}
                onChange={e => set("transporteEscolar", e.target.value)}
              >
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
              </Select>
              {form.transporteEscolar === "Sim" && (
                <Select
                  label="Esfera Responsável pelo Transporte"
                  value={form.transporteEsfera}
                  onChange={e => set("transporteEsfera", e.target.value)}
                >
                  <option value="Municipal">Municipal</option>
                  <option value="Estadual">Estadual</option>
                </Select>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Select
                label="Possui Deficiência / TEA / Superdotação?"
                value={form.possuiDeficiencia}
                onChange={e => set("possuiDeficiencia", e.target.value)}
              >
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
              </Select>
              <Select
                label="Recebe AEE (Atendimento Educacional Especializado)?"
                value={form.recebeAee}
                onChange={e => set("recebeAee", e.target.value)}
              >
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
              </Select>
            </div>

            {form.possuiDeficiencia === "Sim" && (
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Selecione as deficiências declaradas (Exige laudo comprobatório):</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                  {DEFICIENCIAS_INEP_2026.map(def => {
                    const checked = (form.deficienciasSelecionadas || []).includes(def);
                    return (
                      <label key={def} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", background: checked ? "#eff6ff" : "white", padding: "8px 12px", borderRadius: 6, border: checked ? "1px solid #93c5fd" : "1px solid #e2e8f0" }}>
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

        {/* ========================================================================= */}
        {/* PASSO 6: DOCUMENTOS ANEXOS                                                */}
        {/* ========================================================================= */}
        {passoAtivo === 6 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                6. Documentação Digital Exigida para Matrícula
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                Anexe os arquivos digitais (PDF ou Imagem) dos documentos comprobatórios.
              </p>
            </div>

            <div style={{ fontSize: 13, color: "#1e40af", background: "#eff6ff", padding: "12px 16px", borderRadius: 8, border: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 10 }}>
              <i className="ti ti-info-circle" style={{ fontSize: 20, flexShrink: 0 }} />
              <span>
                Documentos obrigatórios estão destacados em vermelho. Documentos complementares podem ser anexados agora ou atualizados posteriormente na <strong>Ficha do Aluno</strong>.
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              {TIPOS_DOCUMENTOS_ALUNO.map(tipoDoc => {
                const docAnexado = form.documentos?.[tipoDoc.id];
                const isUploading = uploadingDocId === tipoDoc.id;

                return (
                  <div
                    key={tipoDoc.id}
                    style={{
                      border: docAnexado ? "1.5px solid #86efac" : "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: 16,
                      background: docAnexado ? "#f0fdf4" : "white",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: docAnexado ? "#dcfce7" : "#eff6ff", color: docAnexado ? "#16a34a" : "#1a56db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                            <i className={`ti ti-${tipoDoc.icone || "file"}`} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{tipoDoc.label}</span>
                        </div>
                        {tipoDoc.obrigatorio && (
                          <span style={{ fontSize: 10, color: "#dc2626", background: "#fee2e2", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                            OBRIGATÓRIO
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{tipoDoc.descricao}</div>
                    </div>

                    {docAnexado ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "8px 12px", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                        <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }} title={docAnexado.nome}>
                          ✓ {docAnexado.nome || "Anexado"}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setDocVisualizando(docAnexado)}
                            style={{ background: "#e0e7ff", border: "none", color: "#3730a3", padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                          >
                            Visualizar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoverDoc(tipoDoc.id)}
                            style={{ background: "#fee2e2", border: "none", color: "#991b1b", padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "10px 14px",
                        fontSize: 12,
                        borderRadius: 8,
                        background: "#f8fafc",
                        color: "#374151",
                        cursor: isUploading ? "not-allowed" : "pointer",
                        border: "1.5px dashed #cbd5e1",
                        fontWeight: 600,
                        transition: "all 0.15s"
                      }}>
                        <i className={`ti ${isUploading ? "ti-loader" : "ti-upload"}`} />
                        {isUploading ? "Enviando arquivo..." : "Selecionar PDF ou Foto"}
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={e => handleUploadDoc(e, tipoDoc.id)}
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

        {/* Rodapé de Ações de Navegação dos Passos */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 20, borderTop: "1px solid #e2e8f0" }}>
          <div>
            {passoAtivo > 1 && (
              <Btn variant="default" onClick={voltarPasso} style={{ padding: "10px 18px", fontSize: 13 }}>
                <i className="ti ti-arrow-left" /> Passo Anterior ({ETAPAS_FLUXO[passoAtivo - 2]?.label})
              </Btn>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {passoAtivo < ETAPAS_FLUXO.length ? (
              <Btn variant="primary" onClick={avancarPasso} style={{ padding: "10px 22px", fontSize: 13 }}>
                Próximo Passo ({ETAPAS_FLUXO[passoAtivo]?.label}) <i className="ti ti-arrow-right" />
              </Btn>
            ) : (
              <Btn variant="primary" onClick={salvarMatriculaFinal} disabled={salvando} style={{ padding: "10px 24px", fontSize: 14 }}>
                <i className="ti ti-check" /> {salvando ? "Efetivando Matrícula..." : "Finalizar e Efetivar Matrícula"}
              </Btn>
            )}
          </div>
        </div>

      </Card>

      {/* Modal de Recorte de Foto */}
      {cropFile && (
        <CropModal
          file={cropFile}
          onCrop={handleCroppedFoto}
          onClose={() => setCropFile(null)}
        />
      )}

      {/* Modal de Visualização de Documentos */}
      {docVisualizando && (
        <DocumentoViewerModal
          documento={docVisualizando}
          onClose={() => setDocVisualizando(null)}
        />
      )}
    </div>
  );
}

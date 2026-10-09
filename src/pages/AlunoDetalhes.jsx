import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getAlunoById,
  updateAluno,
  deleteAluno,
  remanejarAluno,
  salvarTrajetoriaAluno,
  adicionarMarcoTrajetoria
} from "../services/alunosService";
import { getNotasAluno } from "../services/notasService";
import { getFrequenciasAluno } from "../services/frequenciaService";
import { getOcorrenciasAluno, deleteOcorrencia } from "../services/ocorrenciasService";
import { getApontamentosAluno, addApontamento, deleteApontamento } from "../services/apontamentosService";
import { uploadDocumento, salvarDocumentoNoAluno, removerDocumentoDoAluno } from "../services/documentosService";
import { getTurmas } from "../services/turmasService";
import { registrarAuditoria } from "../services/auditoriaService";
import {
  TIPOS_DOCUMENTOS_ALUNO,
  DISCIPLINAS,
  ANO_LETIVO_ATUAL,
  MESES,
  ANOS_LETIVOS,
  STATUS_ALUNO,
  CORES_RACAS,
  ZONAS,
  ETAPAS_ENSINO,
  TURNOS_MATRICULA,
  NACIONALIDADES,
  SITUACOES_ANTERIOR,
  VINCULOS_RESPONSAVEL,
  DEFICIENCIAS_INEP_2026,
  GRAVIDADES_OCORRENCIA,
  STATUS_OCORRENCIA,
  calcularMedia,
  situacaoAluno
} from "../utils/constants";
import { Card, Badge, Btn, Modal, Input, Select, Alert, Spinner } from "../components/ui";
import { comprimirEUploadFoto } from "../utils/upload";
import CropModal from "../components/CropModal";
import DocumentoViewerModal from "../components/DocumentoViewerModal";
import { formatCPF, formatSUS, formatNIS, formatCEP, formatTelefone } from "../utils/masks";

export default function AlunoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, escolas } = useAuth();
  const activeEscolaId = user?.selectedEscolaId || "";

  // Estados principais do aluno
  const [aluno, setAluno] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("ficha"); // ficha, documentos, boletim, frequencia, ocorrencias, apontamentos
  const [alerta, setAlerta] = useState(null);

  // Estados acadêmicos
  const [notas, setNotas] = useState([]);
  const [frequencias, setFrequencias] = useState([]);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [apontamentos, setApontamentos] = useState([]);
  const [turmas, setTurmas] = useState([]);

  // Estados de Upload / Documentos
  const [docVisualizando, setDocVisualizando] = useState(null);
  const [docTituloVisualizando, setDocTituloVisualizando] = useState("");
  const [uploadingDocId, setUploadingDocId] = useState(null);

  // Estados do Modal de Edição Geral
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [abaModalEditar, setAbaModalEditar] = useState("escola");
  const [form, setForm] = useState({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [carregandoFoto, setCarregandoFoto] = useState(false);

  // Estados de Remanejamento de Turma
  const [modalRemanejarAberto, setModalRemanejarAberto] = useState(false);
  const [turmaDestinoRemanejamento, setTurmaDestinoRemanejamento] = useState("");
  const [motivoRemanejamento, setMotivoRemanejamento] = useState("Ajuste de Turno / Horário");
  const [dataRemanejamento, setDataRemanejamento] = useState(new Date().toISOString().split("T")[0]);
  const [obsRemanejamento, setObsRemanejamento] = useState("");
  const [salvandoRemanejamento, setSalvandoRemanejamento] = useState(false);
  const [comprovanteRemanejamento, setComprovanteRemanejamento] = useState(null);

  // Estados de Trajetória Escolar (Histórico)
  const [modalNovoMarcoAberto, setModalNovoMarcoAberto] = useState(false);
  const [novoMarco, setNovoMarco] = useState({
    anoLetivo: "2024",
    serieAno: "6º Ano",
    escola: "",
    cidadeUf: "Maceió - AL",
    situacaoFinal: "Aprovado",
    frequenciaPercentual: "95",
    mediaFinal: "8.0",
    observacoes: ""
  });
  const [salvandoMarco, setSalvandoMarco] = useState(false);




  // Estados de Novo Apontamento
  const [modalApontamentoAberto, setModalApontamentoAberto] = useState(false);
  const [novoApontamento, setNovoApontamento] = useState({
    data: new Date().toISOString().split("T")[0],
    categoria: "Pedagógico",
    texto: ""
  });
  const [salvandoApontamento, setSalvandoApontamento] = useState(false);


  // Carrega dados completos do aluno
  const carregarDadosCompletos = useCallback(async () => {
    if (!id) return;
    setCarregando(true);
    try {
      const [alunoData, notasData, freqData, ocorData, apontaData, turmasData] = await Promise.all([
        getAlunoById(id),
        getNotasAluno(id, activeEscolaId),
        getFrequenciasAluno(id, activeEscolaId),
        getOcorrenciasAluno(id, activeEscolaId),
        getApontamentosAluno(id, activeEscolaId),
        getTurmas(activeEscolaId)
      ]);

      if (!alunoData) {
        setAlerta({ msg: "Aluno não encontrado.", tipo: "error" });
        return;
      }

      setAluno(alunoData);
      setForm(alunoData);
      setNotas(notasData || []);
      setFrequencias(freqData || []);
      setOcorrencias(ocorData || []);
      setApontamentos(apontaData || []);
      setTurmas(turmasData || []);
    } catch (err) {
      console.error("Erro ao carregar dados do aluno:", err);
      setAlerta({ msg: "Erro ao carregar informações: " + err.message, tipo: "error" });
    } finally {
      setCarregando(false);
    }
  }, [id, activeEscolaId]);

  useEffect(() => {
    carregarDadosCompletos();
  }, [carregarDadosCompletos]);

  // Upload de Documento
  async function handleFileUpload(e, tipoDocId, tipoDocLabel) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("O arquivo selecionado é muito grande. O limite máximo é 10 MB.");
      e.target.value = "";
      return;
    }

    setUploadingDocId(tipoDocId);
    try {
      const docMetadata = await uploadDocumento(file, aluno.id, tipoDocId);
      await salvarDocumentoNoAluno(aluno.id, tipoDocId, docMetadata);

      setAluno(prev => ({
        ...prev,
        documentos: {
          ...(prev?.documentos || {}),
          [tipoDocId]: docMetadata
        }
      }));

      setAlerta({ msg: `Documento "${tipoDocLabel}" anexado com sucesso!`, tipo: "success" });
    } catch (err) {
      console.error("Erro ao fazer upload do documento:", err);
      alert("Erro ao anexar documento: " + err.message);
    } finally {
      setUploadingDocId(null);
      e.target.value = "";
    }
  }

  // Remoção de Documento
  async function handleRemoverDocumento(tipoDocId, tipoDocLabel) {
    if (!window.confirm(`Deseja realmente remover o anexo de "${tipoDocLabel}"?`)) return;
    try {
      await removerDocumentoDoAluno(aluno.id, tipoDocId);
      setAluno(prev => {
        const novosDocs = { ...(prev?.documentos || {}) };
        delete novosDocs[tipoDocId];
        return { ...prev, documentos: novosDocs };
      });
      setAlerta({ msg: `Documento "${tipoDocLabel}" removido com sucesso.`, tipo: "success" });
    } catch (err) {
      console.error("Erro ao remover documento:", err);
      alert("Erro ao remover documento: " + err.message);
    }
  }

  // Foto do Aluno
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
      const url = await comprimirEUploadFoto(croppedFile, "alunos", aluno.id);
      setForm(f => ({ ...f, fotoUrl: url }));
      await updateAluno(aluno.id, { fotoUrl: url });
      setAluno(prev => ({ ...prev, fotoUrl: url }));
      setAlerta({ msg: "Foto atualizada com sucesso!", tipo: "success" });
    } catch (error) {
      alert("Erro ao carregar foto: " + error.message);
    } finally {
      setCarregandoFoto(false);
    }
  }

  // Salvar Edição Completa do Aluno
  async function salvarEdicao() {
    if (!form.nome) { alert("Preencha o nome completo."); return; }
    if (!form.nascimento) { alert("Preencha a data de nascimento."); return; }
    if (!form.turma) { alert("Preencha a turma."); return; }
    if (!form.cpf) { alert("Preencha o CPF (obrigatório para o Censo Escolar 2026)."); return; }
    if (!form.mae) { alert("Preencha o nome da mãe (obrigatório para o Censo Escolar 2026)."); return; }

    setSalvandoEdicao(true);
    try {
      await updateAluno(aluno.id, form);

      const alteracoes = [];
      if (aluno.turma !== form.turma) alteracoes.push(`Turma: ${aluno.turma || '—'} → ${form.turma}`);
      if (aluno.turno !== form.turno) alteracoes.push(`Turno: ${aluno.turno || '—'} → ${form.turno}`);
      if (aluno.status !== form.status) alteracoes.push(`Status: ${aluno.status || 'Ativo'} → ${form.status}`);
      if (aluno.cpf !== form.cpf) alteracoes.push(`CPF: ${aluno.cpf || '—'} → ${form.cpf}`);
      if (aluno.cartaoSus !== form.cartaoSus) alteracoes.push(`SUS: ${aluno.cartaoSus || '—'} → ${form.cartaoSus}`);
      if (aluno.nome !== form.nome) alteracoes.push(`Nome: ${aluno.nome || '—'} → ${form.nome}`);

      const anteriorResumo = alteracoes.length > 0 ? alteracoes.map(a => a.split(" → ")[0]).join(", ") : (aluno.turma || "Dados anteriores");
      const novoResumo = alteracoes.length > 0 ? alteracoes.map(a => a.split(" → ")[1]).join(", ") : (form.turma || "Dados atualizados");

      await registrarAuditoria({
        usuario: user,
        escolaId: activeEscolaId,
        escolaNome: form.escolaNome || "Escola Municipal",
        modulo: "Alunos",
        acao: "EDICAO_ALUNO",
        entidade: "Aluno",
        entidadeId: aluno.id,
        entidadeNome: form.nome,
        registroAnterior: anteriorResumo,
        registroNovo: novoResumo,
        descricao: `${user?.displayName || 'Secretaria'} atualizou a ficha cadastral de ${form.nome} (${alteracoes.join("; ") || 'Dados atualizados'})`
      });

      setAluno(prev => ({ ...prev, ...form }));
      setModalEditarAberto(false);
      setAlerta({ msg: "Cadastro do aluno atualizado com sucesso!", tipo: "success" });
    } catch (err) {
      setAlerta({ msg: "Erro ao atualizar aluno: " + err.message, tipo: "error" });
    } finally {
      setSalvandoEdicao(false);
    }
  }

  // Executar Remanejamento Individual do Aluno
  async function executarRemanejamento() {
    if (!turmaDestinoRemanejamento) { alert("Selecione a nova turma de destino."); return; }
    if (turmaDestinoRemanejamento === aluno.turma) {
      alert("A nova turma selecionada é idêntica à turma atual.");
      return;
    }

    const turmaAlvo = turmas.find(t => t.nome === turmaDestinoRemanejamento);
    setSalvandoRemanejamento(true);
    try {
      await remanejarAluno(aluno.id, {
        novaTurma: turmaDestinoRemanejamento,
        novoAno: turmaAlvo?.ano || aluno.ano,
        novoTurno: turmaAlvo?.turno || aluno.turno,
        turmaOrigem: aluno.turma,
        motivo: motivoRemanejamento,
        observacoes: obsRemanejamento,
        dataRemanejamento: dataRemanejamento,
        usuarioNome: user?.displayName || user?.email || "Secretaria Escolar"
      });

      await registrarAuditoria({
        usuario: user,
        escolaId: activeEscolaId,
        escolaNome: aluno.escolaNome || "Escola Municipal",
        modulo: "Alunos",
        acao: "REMANEJAMENTO_TURMA",
        entidade: "Aluno",
        entidadeId: aluno.id,
        entidadeNome: aluno.nome,
        registroAnterior: `Turma ${aluno.turma} (${aluno.turno || 'Matutino'})`,
        registroNovo: `Turma ${turmaDestinoRemanejamento} (${turmaAlvo?.turno || aluno.turno || 'Matutino'})`,
        descricao: `${user?.displayName || 'Secretaria'} remanejou o aluno ${aluno.nome} da Turma ${aluno.turma} para a Turma ${turmaDestinoRemanejamento}. Motivo: ${motivoRemanejamento}`
      });

      const novoRegistro = {
        id: "rem_" + Date.now(),
        data: dataRemanejamento,
        turmaOrigem: aluno.turma,
        turmaDestino: turmaDestinoRemanejamento,
        ano: turmaAlvo?.ano || aluno.ano,
        turno: turmaAlvo?.turno || aluno.turno,
        motivo: motivoRemanejamento,
        observacoes: obsRemanejamento,
        usuarioNome: user?.displayName || user?.email || "Secretaria Escolar",
        registradoEm: new Date().toISOString()
      };

      const alunoAtualizado = {
        ...aluno,
        turma: turmaDestinoRemanejamento,
        ano: turmaAlvo?.ano || aluno.ano,
        turno: turmaAlvo?.turno || aluno.turno,
        historicoRemanejamento: [novoRegistro, ...(aluno.historicoRemanejamento || [])]
      };

      setAluno(alunoAtualizado);
      setModalRemanejarAberto(false);
      setAlerta({ msg: `Estudante remanejado para a turma "${turmaDestinoRemanejamento}" com sucesso!`, tipo: "success" });

      // Abre comprovante / guia oficial
      setComprovanteRemanejamento({
        ...alunoAtualizado,
        turmaAnterior: aluno.turma,
        novaTurma: turmaDestinoRemanejamento,
        motivo: motivoRemanejamento,
        observacoes: obsRemanejamento,
        dataRemanejamento: dataRemanejamento,
        usuarioNome: user?.displayName || user?.email || "Secretaria Escolar"
      });
    } catch (err) {
      alert("Erro ao remanejar estudante: " + err.message);
    } finally {
      setSalvandoRemanejamento(false);
    }
  }

  // Adicionar Marco à Trajetória do Aluno
  async function handleAdicionarMarco() {
    if (!novoMarco.anoLetivo || !novoMarco.serieAno || !novoMarco.escola) {
      alert("Preencha o Ano Letivo, Série/Ano e Estabelecimento de Ensino.");
      return;
    }

    setSalvandoMarco(true);
    try {
      await adicionarMarcoTrajetoria(aluno.id, novoMarco);
      const novoItemFormatado = {
        id: "traj_" + Date.now(),
        ...novoMarco
      };
      const trajetoriaAtualizada = [...(aluno.trajetoriaEscolar || []), novoItemFormatado].sort((a, b) => Number(a.anoLetivo || 0) - Number(b.anoLetivo || 0));
      setAluno(prev => ({ ...prev, trajetoriaEscolar: trajetoriaAtualizada }));
      setModalNovoMarcoAberto(false);
      setAlerta({ msg: `Ano ${novoMarco.anoLetivo} adicionado à trajetória com sucesso!`, tipo: "success" });
      setNovoMarco({
        anoLetivo: (Number(novoMarco.anoLetivo) + 1).toString(),
        serieAno: "",
        escola: novoMarco.escola,
        cidadeUf: "Maceió - AL",
        situacaoFinal: "Aprovado",
        frequenciaPercentual: "95",
        mediaFinal: "8.0",
        observacoes: ""
      });
    } catch (err) {
      alert("Erro ao salvar marco da trajetória: " + err.message);
    } finally {
      setSalvandoMarco(false);
    }
  }

  // Remover Marco da Trajetória do Aluno
  async function handleRemoverMarco(marcoId) {
    if (!window.confirm("Deseja realmente excluir este ano do histórico da trajetória?")) return;
    try {
      const novaTraj = (aluno.trajetoriaEscolar || []).filter(t => t.id !== marcoId);
      await salvarTrajetoriaAluno(aluno.id, novaTraj);
      setAluno(prev => ({ ...prev, trajetoriaEscolar: novaTraj }));
      setAlerta({ msg: "Registro da trajetória removido.", tipo: "success" });
    } catch (err) {
      alert("Erro ao remover: " + err.message);
    }
  }





  // Remover Ocorrência
  async function excluirOcorrencia(ocorrenciaId) {
    if (!window.confirm("Deseja realmente excluir esta ocorrência?")) return;
    try {
      await deleteOcorrencia(ocorrenciaId);
      setOcorrencias(prev => prev.filter(o => o.id !== ocorrenciaId));
      setAlerta({ msg: "Ocorrência removida.", tipo: "success" });
    } catch (err) {
      alert("Erro ao remover ocorrência.");
    }
  }

  // Salvar Novo Apontamento
  async function salvarApontamento() {
    if (!novoApontamento.data || !novoApontamento.texto.trim()) {
      alert("Preencha a data e o texto do apontamento.");
      return;
    }
    setSalvandoApontamento(true);
    try {
      const novo = {
        ...novoApontamento,
        alunoId: aluno.id,
        registradoPor: user?.displayName || user?.email || "Equipe Pedagógica"
      };
      const docId = await addApontamento(novo, activeEscolaId);
      setApontamentos(prev => [{ id: docId, ...novo }, ...prev]);
      setModalApontamentoAberto(false);
      setNovoApontamento({ data: new Date().toISOString().split("T")[0], categoria: "Pedagógico", texto: "" });
      setAlerta({ msg: "Apontamento salvo com sucesso!", tipo: "success" });
    } catch (err) {
      alert("Erro ao salvar apontamento: " + err.message);
    } finally {
      setSalvandoApontamento(false);
    }
  }

  // Remover Apontamento
  async function excluirApontamento(apontamentoId) {
    if (!window.confirm("Deseja realmente excluir este apontamento?")) return;
    try {
      await deleteApontamento(apontamentoId);
      setApontamentos(prev => prev.filter(a => a.id !== apontamentoId));
      setAlerta({ msg: "Apontamento removido.", tipo: "success" });
    } catch (err) {
      alert("Erro ao remover apontamento.");
    }
  }

  // Excluir Aluno
  async function handleExcluirAluno() {
    if (!window.confirm(`Tem certeza absoluta que deseja excluir o aluno "${aluno.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteAluno(aluno.id);
      navigate("/alunos");
    } catch (err) {
      alert("Erro ao excluir aluno: " + err.message);
    }
  }

  if (carregando) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
        <Spinner />
        <span style={{ color: "#6b7280", fontSize: 14 }}>Carregando ficha expandida do aluno...</span>
      </div>
    );
  }

  if (!aluno) {
    return (
      <Card style={{ textAlign: "center", padding: 40 }}>
        <h3>Aluno não encontrado</h3>
        <p style={{ color: "#6b7280", marginBottom: 20 }}>O cadastro solicitado pode ter sido removido ou não pertence a esta unidade.</p>
        <Btn variant="primary" onClick={() => navigate("/alunos")}>
          <i className="ti ti-arrow-left" /> Voltar para Alunos
        </Btn>
      </Card>
    );
  }

  // Cálculos de Resumo
  const totalDocsObrigatorios = TIPOS_DOCUMENTOS_ALUNO.filter(d => d.obrigatorio).length;
  const docsEntregues = Object.keys(aluno.documentos || {});
  const totalDocsEntregues = docsEntregues.length;
  const docsObrigatoriosEntregues = TIPOS_DOCUMENTOS_ALUNO.filter(d => d.obrigatorio && aluno.documentos?.[d.id]).length;
  const percentualDocs = Math.round((docsObrigatoriosEntregues / totalDocsObrigatorios) * 100);

  // Média Geral
  const mediasValidas = notas.map(n => n.media).filter(m => typeof m === "number" && !isNaN(m));
  const mediaGeral = mediasValidas.length > 0 ? (mediasValidas.reduce((a, b) => a + b, 0) / mediasValidas.length).toFixed(1) : null;

  // Frequência Geral
  let totalPresencas = 0;
  let totalRegistrosFreq = 0;
  frequencias.forEach(f => {
    const entradas = Object.values(f.dias || {});
    entradas.forEach(v => {
      totalRegistrosFreq++;
      if (v === "P") totalPresencas++;
    });
  });
  const percentualPresencaGeral = totalRegistrosFreq > 0 ? Math.round((totalPresencas / totalRegistrosFreq) * 100) : 100;

  const censoCompleto = !!(aluno.cpf && aluno.mae && aluno.nascimento);

  // Cálculo da Idade
  let idadeCalculada = "—";
  if (aluno.nascimento) {
    const hoje = new Date();
    const nasc = new Date(aluno.nascimento + "T12:00:00");
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    idadeCalculada = `${idade} anos`;
  }

  return (
    <div>
      {/* CSS DE IMPRESSÃO EXCLUSIVO PARA O CURRÍCULO/FICHA CADASTRAL */}
      <style>{`
        .print-curriculo {
          display: none;
        }
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: "Segoe UI", Arial, sans-serif !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-curriculo {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15px 20px !important;
            box-sizing: border-box !important;
          }
          .curriculo-box {
            border: 1px solid #333 !important;
            margin-bottom: 10px !important;
          }
          .curriculo-header {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            border-bottom: 1px solid #333 !important;
            padding: 5px 8px !important;
            font-weight: 700 !important;
            font-size: 11px !important;
            text-transform: uppercase !important;
          }
          .curriculo-body {
            padding: 8px 10px !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 📄 LAYOUT EXCLUSIVO DE IMPRESSÃO: FICHA DO ALUNO ESTILO CURRÍCULO          */}
      {/* ========================================================================= */}
      <div className="print-curriculo">
        {/* Cabeçalho Oficial do Órgão */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              ESTADO DE ALAGOAS · SECRETARIA MUNICIPAL DE EDUCAÇÃO
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a", marginTop: 2 }}>
              {aluno.escolaNome || "UNIDADE DE ENSINO FUNDAMENTAL"}
            </div>
            <div style={{ fontSize: 10, color: "#555" }}>
              Código INEP: {aluno.escolaInep || "—"} · Sistema Integrado de Gestão Escolar (SIGEM)
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "inline-block", border: "1.5px solid #000", padding: "4px 8px", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              FICHA DO ESTUDANTE
            </div>
            <div style={{ fontSize: 9, color: "#444", marginTop: 4 }}>Ano Letivo {ANO_LETIVO_ATUAL}</div>
          </div>
        </div>

        {/* Bloco Superior: Foto 3x4 + Identificação do Aluno (Estilo Currículo) */}
        <div style={{ display: "flex", gap: 16, border: "1.5px solid #000", padding: 10, marginBottom: 12, borderRadius: 4, alignItems: "stretch" }}>
          {/* Foto 3x4 */}
          <div style={{ width: 95, height: 125, border: "1px solid #444", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            {aluno.fotoUrl ? (
              <img src={aluno.fotoUrl} alt={aluno.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 10, color: "#888", fontWeight: 600, textAlign: "center" }}>FOTO 3x4</span>
            )}
          </div>

          {/* Dados Principais do Cabeçalho */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: 9, color: "#555", textTransform: "uppercase", fontWeight: 700, display: "block" }}>Nome Completo do Aluno</span>
              <div style={{ fontSize: 16, fontWeight: 800, textTransform: "uppercase", color: "#000", marginTop: 1 }}>{aluno.nome}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px 12px", fontSize: 10.5, borderTop: "1px solid #ccc", paddingTop: 6, marginTop: 6 }}>
              <div><strong style={{ color: "#444" }}>Matrícula:</strong> {aluno.matricula || "Não informada"}</div>
              <div><strong style={{ color: "#444" }}>Turma:</strong> {aluno.turma}</div>
              <div><strong style={{ color: "#444" }}>Turno:</strong> {aluno.turno}</div>
              <div><strong style={{ color: "#444" }}>Ano / Série:</strong> {aluno.ano}</div>
              <div><strong style={{ color: "#444" }}>Nascimento:</strong> {aluno.nascimento ? new Date(aluno.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</div>
              <div><strong style={{ color: "#444" }}>Idade:</strong> {idadeCalculada}</div>
              <div><strong style={{ color: "#444" }}>Sexo:</strong> {aluno.sexo}</div>
              <div><strong style={{ color: "#444" }}>Status:</strong> {aluno.status || "Ativo"}</div>
            </div>
          </div>
        </div>

        {/* 1. DADOS PESSOAIS E DOCUMENTAÇÃO CIVIL */}
        <div className="curriculo-box">
          <div className="curriculo-header">1. Dados Pessoais & Documentação Civil</div>
          <div className="curriculo-body" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px 12px" }}>
            <div><strong>CPF:</strong> {aluno.cpf || "Não informado"}</div>
            <div><strong>RG:</strong> {aluno.rg ? `${aluno.rg} ${aluno.rgOrgaoEmissor ? `(${aluno.rgOrgaoEmissor})` : ""}` : "—"}</div>
            <div><strong>Cartão SUS:</strong> {aluno.cartaoSus || "—"}</div>
            <div><strong>NIS / Bolsa Família:</strong> {aluno.nis || "—"}</div>
            <div><strong>Registro Civil (Certidão):</strong> {aluno.registroCivil || "—"}</div>
            <div><strong>Cor / Raça:</strong> {aluno.corRaca || "—"}</div>
            <div><strong>Nacionalidade:</strong> {aluno.nacionalidade || "Brasileira"}</div>
            <div style={{ gridColumn: "span 2" }}><strong>Naturalidade:</strong> {aluno.municipioNascimento ? `${aluno.municipioNascimento}/${aluno.ufNascimento || "AL"}` : (aluno.paisOrigem || "—")}</div>
          </div>
        </div>

        {/* 2. ENDEREÇO E CONTATO */}
        <div className="curriculo-box">
          <div className="curriculo-header">2. Endereço Residencial e Contatos</div>
          <div className="curriculo-body" style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr", gap: "5px 12px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <strong>Logradouro / Endereço:</strong> {aluno.endereco || "—"}{aluno.enderecoNumero ? `, Nº ${aluno.enderecoNumero}` : ""}{aluno.complemento ? ` (${aluno.complemento})` : ""}
            </div>
            <div><strong>Bairro:</strong> {aluno.bairro || "—"}</div>
            <div><strong>Município / UF:</strong> {aluno.municipio || "Maceió"} / {aluno.uf || "AL"}</div>
            <div><strong>CEP:</strong> {aluno.cep || "—"}</div>
            <div><strong>Zona:</strong> {aluno.zona || "Urbana"}</div>
            <div><strong>Telefone:</strong> {aluno.telefone || "—"}</div>
            <div><strong>E-mail:</strong> {aluno.email || "—"}</div>
          </div>
        </div>

        {/* 3. FILIAÇÃO E RESPONSÁVEIS LEGAIS */}
        <div className="curriculo-box">
          <div className="curriculo-header">3. Filiação & Responsáveis Legais</div>
          <div className="curriculo-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 12px" }}>
            <div><strong>Nome da Mãe:</strong> {aluno.mae || "Não informada"}</div>
            <div><strong>Nome do Pai:</strong> {aluno.pai || "Não informado"}</div>
            {aluno.responsavel && (
              <>
                <div><strong>Responsável Legal:</strong> {aluno.responsavel} ({aluno.responsavelVinculo || "Responsável"})</div>
                <div><strong>Documentos do Resp.:</strong> CPF: {aluno.responsavelCpf || "—"} | RG: {aluno.responsavelRg || "—"}</div>
              </>
            )}
          </div>
        </div>

        {/* 4. HISTÓRICO ESCOLAR E CENSO / AEE */}
        <div className="curriculo-box">
          <div className="curriculo-header">4. Procedência Escolar e Informações do Censo / AEE</div>
          <div className="curriculo-body" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px 12px" }}>
            <div><strong>Etapa de Ensino:</strong> {aluno.etapaEnsino || "Ensino Fundamental"}</div>
            <div><strong>Escola de Origem:</strong> {aluno.escolaOrigem || "—"}</div>
            <div><strong>Situação Anterior:</strong> {aluno.situacaoAnterior || "—"}</div>
            <div><strong>Transporte Escolar:</strong> {aluno.transporteEscolar || "Não"} {aluno.transporteEscolar === "Sim" ? `(${aluno.transporteEsfera || "Municipal"})` : ""}</div>
            <div><strong>Recebe AEE:</strong> {aluno.recebeAee || "Não"}</div>
            <div><strong>Deficiência / TEA:</strong> {aluno.possuiDeficiencia === "Sim" ? (aluno.deficienciasSelecionadas?.join(", ") || "Sim") : "Não"}</div>
          </div>
        </div>

        {/* 5. CHECKLIST DE DOCUMENTOS ENTREGUES */}
        <div className="curriculo-box">
          <div className="curriculo-header">5. Checklist de Documentos Entregues na Secretaria</div>
          <div className="curriculo-body" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px 8px", fontSize: 9.5 }}>
            {TIPOS_DOCUMENTOS_ALUNO.map(t => {
              const entregue = !!aluno.documentos?.[t.id];
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{entregue ? "[ X ]" : "[   ]"}</span>
                  <span style={{ fontWeight: entregue ? 700 : 400 }}>{t.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. TRAJETÓRIA ESCOLAR & HISTÓRICO DE ANOS ANTERIORES */}
        {Array.isArray(aluno.trajetoriaEscolar) && aluno.trajetoriaEscolar.length > 0 && (
          <div className="curriculo-box">
            <div className="curriculo-header">6. Trajetória Escolar & Histórico Acadêmico</div>
            <div className="curriculo-body" style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5 }}>
                <thead>
                  <tr style={{ background: "#f0f0f0", borderBottom: "1px solid #333" }}>
                    <th style={{ padding: "4px 6px", textAlign: "left" }}>Ano Letivo</th>
                    <th style={{ padding: "4px 6px", textAlign: "left" }}>Série / Ano</th>
                    <th style={{ padding: "4px 6px", textAlign: "left" }}>Estabelecimento de Ensino</th>
                    <th style={{ padding: "4px 6px", textAlign: "left" }}>Município/UF</th>
                    <th style={{ padding: "4px 6px", textAlign: "center" }}>Resultado Final</th>
                    <th style={{ padding: "4px 6px", textAlign: "center" }}>Média</th>
                    <th style={{ padding: "4px 6px", textAlign: "center" }}>Freq. %</th>
                  </tr>
                </thead>
                <tbody>
                  {aluno.trajetoriaEscolar.map((t, idx) => (
                    <tr key={t.id || idx} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "3px 6px", fontWeight: 700 }}>{t.anoLetivo}</td>
                      <td style={{ padding: "3px 6px" }}>{t.serieAno}</td>
                      <td style={{ padding: "3px 6px" }}>{t.escola}</td>
                      <td style={{ padding: "3px 6px" }}>{t.cidadeUf || "—"}</td>
                      <td style={{ padding: "3px 6px", textAlign: "center", fontWeight: 700 }}>{t.situacaoFinal || "Aprovado"}</td>
                      <td style={{ padding: "3px 6px", textAlign: "center" }}>{t.mediaFinal || "—"}</td>
                      <td style={{ padding: "3px 6px", textAlign: "center" }}>{t.frequenciaPercentual ? `${t.frequenciaPercentual}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Termo e Assinaturas */}
        <div style={{ marginTop: 128, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, fontSize: 10, textAlign: "center" }}>
          <div>
            <div style={{ borderTop: "1px solid #000", paddingTop: 4, width: "85%", margin: "0 auto" }}>
              <strong>Assinatura do Responsável Legal</strong>
            </div>
          </div>
          <div>
            <div style={{ borderTop: "1px solid #000", paddingTop: 4, width: "85%", margin: "0 auto" }}>
              <strong>Secretaria / Direção Escolar (Carimbo e Visto)</strong>
            </div>
          </div>
        </div>


        <div style={{ textAlign: "right", fontSize: 8.5, color: "#666", marginTop: 20 }}>
          Documento gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · SIGEM
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🖥️ INTERFACE EM TELA (WEB UI) - OCULTADA AUTOMATICAMENTE AO IMPRIMIR       */}
      {/* ========================================================================= */}
      <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {alerta && <Alert tipo={alerta.tipo}>{alerta.msg}</Alert>}

        {/* Top Header & Breadcrumb */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/alunos")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "white",
                border: "1px solid #d1d5db",
                color: "#374151",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}
              title="Voltar para a Lista de Alunos"
            >
              <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6b7280" }}>
                <Link to="/alunos" style={{ color: "#1a56db", textDecoration: "none", fontWeight: 500 }}>Alunos</Link>
                <i className="ti ti-chevron-right" style={{ fontSize: 12 }} />
                <span>Ficha Expandida</span>
              </div>
              <h1 style={{ margin: "2px 0 0 0", fontSize: 20, fontWeight: 700, color: "#111827" }}>
                {aluno.nome}
              </h1>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Btn
              variant="default"
              onClick={() => navigate("/transferencias")}
              style={{ fontWeight: 600 }}
              title="Transferências escolares e emissão de declarações"
            >
              <i className="ti ti-file-export" /> Transferência
            </Btn>
            <Btn
              variant="default"
              onClick={() => {
                setTurmaDestinoRemanejamento("");
                setMotivoRemanejamento("Ajuste de Turno / Horário");
                setDataRemanejamento(new Date().toISOString().split("T")[0]);
                setObsRemanejamento("");
                setModalRemanejarAberto(true);
              }}
              style={{ fontWeight: 600 }}
              title="Remanejar este estudante para outra turma"
            >
              <i className="ti ti-arrows-exchange" /> Remanejar Turma
            </Btn>
            <Btn
              variant="default"
              onClick={() => navigate(`/boletim`)}
              style={{ background: "#0284c7", color: "white", border: "1px solid #0369a1", fontWeight: 600 }}
              title="Acessar Boletim Escolar Digital"
            >
              <i className="ti ti-certificate" /> Boletim Escolar
            </Btn>
            <Btn
              variant="default"
              onClick={() => navigate(`/historico?alunoId=${aluno.id}`)}
              style={{ background: "#4f46e5", color: "white", border: "1px solid #4338ca", fontWeight: 600 }}
              title="Acessar Histórico Escolar Oficial com Autenticação e QR Code"
            >
              <i className="ti ti-file-certificate" /> Histórico Escolar
            </Btn>
            <Btn
              variant="default"
              onClick={() => window.print()}
              style={{ background: "#1e293b", color: "white", border: "1px solid #0f172a", fontWeight: 600 }}
              title="Imprimir Ficha Cadastral"
            >
              <i className="ti ti-printer" /> Imprimir Ficha
            </Btn>
            <Btn
              variant="primary"
              onClick={() => {
                setForm(aluno);
                setAbaModalEditar("escola");
                setModalEditarAberto(true);
              }}
            >
              <i className="ti ti-edit" /> Editar Cadastro
            </Btn>
            <Btn
              variant="danger"
              onClick={handleExcluirAluno}
              title="Excluir Aluno"
            >
              <i className="ti ti-trash" />
            </Btn>
          </div>


        </div>

        {/* Hero Profile Banner */}
        <Card style={{ padding: 24, background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            {/* Avatar Grande com Ação de Troca */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 20,
                  overflow: "hidden",
                  background: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid white",
                  boxShadow: "0 10px 20px -5px rgba(0,0,0,0.15)",
                  flexShrink: 0
                }}
              >
                {aluno.fotoUrl ? (
                  <img src={aluno.fotoUrl} alt={aluno.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <i className="ti ti-user" style={{ fontSize: 48, color: "#94a3b8" }} />
                )}
              </div>
              <label
                style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  background: "#1a56db",
                  color: "white",
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: carregandoFoto ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(26, 86, 219, 0.4)",
                  border: "2px solid white"
                }}
                title="Alterar foto do aluno"
              >
                <i className={`ti ${carregandoFoto ? "ti-loader" : "ti-camera"}`} style={{ fontSize: 15 }} />
                <input type="file" accept="image/*" onChange={handleFotoSelect} disabled={carregandoFoto} style={{ display: "none" }} />
              </label>
            </div>

            {/* Dados do Cabeçalho */}
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{aluno.nome}</h2>
                <Badge color={aluno.status === "Ativo" ? "green" : aluno.status === "Transferido" ? "amber" : "gray"}>
                  {aluno.status || "Ativo"}
                </Badge>
                {censoCompleto ? (
                  <span style={{ fontSize: 11, background: "#ecfdf5", color: "#059669", padding: "2px 8px", borderRadius: 12, fontWeight: 600, border: "1px solid #a7f3d0" }}>
                    ✓ Censo 2026 OK
                  </span>
                ) : (
                  <span style={{ fontSize: 11, background: "#fef2f2", color: "#dc2626", padding: "2px 8px", borderRadius: 12, fontWeight: 600, border: "1px solid #fecaca" }}>
                    ⚠️ Pendência Censo
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 13, color: "#475569" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <i className="ti ti-id" style={{ color: "#64748b" }} /> Matrícula: <strong>{aluno.matricula || "Não gerada"}</strong>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <i className="ti ti-chalkboard" style={{ color: "#64748b" }} /> Turma: <strong>{aluno.turma} ({aluno.ano})</strong>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <i className="ti ti-sun" style={{ color: "#64748b" }} /> Turno: <strong>{aluno.turno}</strong>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <i className="ti ti-cake" style={{ color: "#64748b" }} /> Idade: <strong>{idadeCalculada}</strong>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <i className="ti ti-school" style={{ color: "#64748b" }} /> Escola: <strong>{aluno.escolaNome || "Unidade Polo"}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Mini KPI Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 20, paddingTop: 18, borderTop: "1px solid #e2e8f0" }}>
            {/* Card Docs */}
            <div style={{ background: "white", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "#eff6ff", color: "#1a56db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                <i className="ti ti-files" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Documentos</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  {totalDocsEntregues} de {TIPOS_DOCUMENTOS_ALUNO.length} <span style={{ fontSize: 12, fontWeight: 500, color: percentualDocs === 100 ? "#16a34a" : "#ca8a04" }}>({percentualDocs}% obrig.)</span>
                </div>
              </div>
            </div>

            {/* Card Média Geral */}
            <div style={{ background: "white", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                <i className="ti ti-award" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Média Geral</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  {mediaGeral !== null ? `${mediaGeral} / 10.0` : "Sem notas"}
                </div>
              </div>
            </div>

            {/* Card Frequência */}
            <div style={{ background: "white", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "#faf5ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                <i className="ti ti-calendar-check" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Frequência</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: percentualPresencaGeral >= 75 ? "#16a34a" : "#dc2626" }}>
                  {percentualPresencaGeral}% {percentualPresencaGeral < 75 && <span style={{ fontSize: 11 }}>⚠️ Baixa</span>}
                </div>
              </div>
            </div>

            {/* Card Ocorrências */}
            <div style={{ background: "white", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                <i className="ti ti-clipboard-text" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Ocorrências / Apont.</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  {ocorrencias.length} reg. / {apontamentos.length} apont.
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs de Navegação da Ficha Expandida */}
        <div style={{ display: "flex", gap: 8, borderBottom: "2px solid #e2e8f0", overflowX: "auto", paddingBottom: 2 }}>
          {[
            { id: "ficha", label: "Ficha Cadastral", icon: "user-circle", badge: null },
            { id: "documentos", label: "Documentos Anexados", icon: "folder", badge: `${totalDocsEntregues}/${TIPOS_DOCUMENTOS_ALUNO.length}` },
            { id: "boletim", label: "Boletim & Notas", icon: "file-certificate", badge: null },
            { id: "frequencia", label: "Frequência Escolar", icon: "calendar-stats", badge: `${percentualPresencaGeral}%` },
            { id: "ocorrencias", label: "Ocorrências", icon: "alert-circle", badge: ocorrencias.length > 0 ? ocorrencias.length : null },
            { id: "apontamentos", label: "Apontamentos Pedagógicos", icon: "notes", badge: apontamentos.length > 0 ? apontamentos.length : null }
          ].map(tab => {
            const ativa = abaAtiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAbaAtiva(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  border: "none",
                  background: "transparent",
                  borderBottom: ativa ? "3px solid #1a56db" : "3px solid transparent",
                  marginBottom: -4,
                  color: ativa ? "#1a56db" : "#64748b",
                  fontWeight: ativa ? 700 : 500,
                  fontSize: 14,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease"
                }}
              >
                <i className={`ti ti-${tab.icon}`} style={{ fontSize: 17 }} />
                {tab.label}
                {tab.badge !== null && (
                  <span style={{
                    fontSize: 11,
                    padding: "1px 7px",
                    borderRadius: 10,
                    background: ativa ? "#1a56db" : "#e2e8f0",
                    color: ativa ? "white" : "#475569",
                    fontWeight: 600
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CONTEÚDO DA ABA 1: FICHA CADASTRAL */}
        {abaAtiva === "ficha" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: 16 }}>
              {/* Bloco 1: Dados Pessoais & Documentação Civil */}
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-id-badge" style={{ color: "#1a56db", fontSize: 18 }} />
                    Dados Pessoais & Registro Civil
                  </h3>
                  <Btn variant="default" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => { setForm(aluno); setAbaModalEditar("pessoais"); setModalEditarAberto(true); }}>
                    <i className="ti ti-edit" /> Editar
                  </Btn>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", fontSize: 13 }}>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Nome Completo</span>
                    <strong style={{ color: "#0f172a" }}>{aluno.nome}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Data de Nascimento</span>
                    <span style={{ color: "#0f172a" }}>{aluno.nascimento ? new Date(aluno.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"} ({idadeCalculada})</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Sexo</span>
                    <span style={{ color: "#0f172a" }}>{aluno.sexo || "—"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Cor / Raça</span>
                    <span style={{ color: "#0f172a" }}>{aluno.corRaca || "Não declarada"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Nacionalidade / Origem</span>
                    <span style={{ color: "#0f172a" }}>{aluno.nacionalidade || "Brasileira"} {aluno.paisOrigem ? `(${aluno.paisOrigem})` : ""}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Naturalidade (Cidade/UF)</span>
                    <span style={{ color: "#0f172a" }}>{aluno.municipioNascimento ? `${aluno.municipioNascimento} / ${aluno.ufNascimento || "AL"}` : "—"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>CPF do Aluno</span>
                    <strong style={{ color: aluno.cpf ? "#0f172a" : "#dc2626" }}>{aluno.cpf || "⚠️ Não informado"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>RG / Órgão Emissor</span>
                    <span style={{ color: "#0f172a" }}>{aluno.rg ? `${aluno.rg} ${aluno.rgOrgaoEmissor ? `(${aluno.rgOrgaoEmissor})` : ""}` : "—"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Certidão / Registro Civil</span>
                    <span style={{ color: "#0f172a" }}>{aluno.registroCivil || "—"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Cartão Nacional SUS</span>
                    <span style={{ color: "#0f172a" }}>{aluno.cartaoSus || "—"}</span>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>NIS (Número de Identificação Social / Bolsa Família)</span>
                    <span style={{ color: "#0f172a" }}>{aluno.nis || "Não informado"}</span>
                  </div>
                </div>
              </Card>

              {/* Bloco 2: Endereço & Contato */}
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-map-pin" style={{ color: "#1a56db", fontSize: 18 }} />
                    Endereço & Contato
                  </h3>
                  <Btn variant="default" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => { setForm(aluno); setAbaModalEditar("endereco"); setModalEditarAberto(true); }}>
                    <i className="ti ti-edit" /> Editar
                  </Btn>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", fontSize: 13 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Logradouro / Endereço</span>
                    <strong style={{ color: "#0f172a" }}>
                      {aluno.endereco || "—"}{aluno.enderecoNumero ? `, Nº ${aluno.enderecoNumero}` : ""}{aluno.complemento ? ` (${aluno.complemento})` : ""}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Bairro</span>
                    <span style={{ color: "#0f172a" }}>{aluno.bairro || "—"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Zona de Localização</span>
                    <span style={{ color: "#0f172a" }}>{aluno.zona || "Urbana"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Município / UF</span>
                    <span style={{ color: "#0f172a" }}>{aluno.municipio || "Maceió"} / {aluno.uf || "AL"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>CEP</span>
                    <span style={{ color: "#0f172a" }}>{aluno.cep || "—"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Telefone / WhatsApp</span>
                    <strong style={{ color: "#1a56db" }}>{aluno.telefone || "Não informado"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>E-mail</span>
                    <span style={{ color: "#0f172a" }}>{aluno.email || "Não informado"}</span>
                  </div>
                </div>
              </Card>

              {/* Bloco 3: Filiação & Responsáveis */}
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-users" style={{ color: "#1a56db", fontSize: 18 }} />
                    Filiação & Responsáveis Legais
                  </h3>
                  <Btn variant="default" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => { setForm(aluno); setAbaModalEditar("responsaveis"); setModalEditarAberto(true); }}>
                    <i className="ti ti-edit" /> Editar
                  </Btn>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                  <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Nome da Mãe (Obrigatório Censo)</span>
                    <strong style={{ color: aluno.mae ? "#0f172a" : "#dc2626", fontSize: 14 }}>{aluno.mae || "⚠️ Não informada"}</strong>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Nome do Pai</span>
                    <span style={{ color: "#0f172a", fontSize: 14 }}>{aluno.pai || "Não informado"}</span>
                  </div>

                  {aluno.responsavel && (
                    <div style={{ background: "#eff6ff", padding: "10px 14px", borderRadius: 8, border: "1px solid #bfdbfe" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#1e40af", textTransform: "uppercase", fontWeight: 600 }}>
                          Responsável Legal ({aluno.responsavelVinculo || "Responsável"})
                        </span>
                      </div>
                      <strong style={{ color: "#1e3a8a", fontSize: 14, display: "block", marginTop: 2 }}>{aluno.responsavel}</strong>
                      <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12, color: "#3b82f6" }}>
                        <span>CPF: {aluno.responsavelCpf || "—"}</span>
                        <span>RG: {aluno.responsavelRg || "—"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Bloco 4: Dados Escolares, Procedência & Censo */}
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-school" style={{ color: "#1a56db", fontSize: 18 }} />
                    Dados Escolares & Inep 2026
                  </h3>
                  <Btn variant="default" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => { setForm(aluno); setAbaModalEditar("historico_censo"); setModalEditarAberto(true); }}>
                    <i className="ti ti-edit" /> Editar
                  </Btn>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", fontSize: 13 }}>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Etapa de Ensino</span>
                    <span style={{ color: "#0f172a" }}>{aluno.etapaEnsino || "Ensino Fundamental"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Ano / Série Pretendida</span>
                    <strong style={{ color: "#0f172a" }}>{aluno.ano}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Escola Anterior / Origem</span>
                    <span style={{ color: "#0f172a" }}>{aluno.escolaOrigem || "—"} {aluno.escolaOrigemCidadeUf ? `(${aluno.escolaOrigemCidadeUf})` : ""}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Situação Anterior</span>
                    <span style={{ color: "#0f172a" }}>{aluno.situacaoAnterior || "—"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Transporte Escolar Público</span>
                    <span style={{ color: "#0f172a" }}>{aluno.transporteEscolar || "Não"} {aluno.transporteEscolar === "Sim" ? `(${aluno.transporteEsfera || "Municipal"})` : ""}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Atendimento Especializado (AEE)</span>
                    <span style={{ color: "#0f172a" }}>{aluno.recebeAee || "Não"}</span>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Deficiência / TEA / Superdotação</span>
                    {aluno.possuiDeficiencia === "Sim" ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(aluno.deficienciasSelecionadas || []).map(def => (
                          <span key={def} style={{ background: "#ede9fe", color: "#6b21a8", fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>
                            {def}
                          </span>
                        ))}
                        {(!aluno.deficienciasSelecionadas || aluno.deficienciasSelecionadas.length === 0) && (
                          <span style={{ color: "#6b21a8", fontSize: 12 }}>Declarou deficiência (especificações pendentes de laudo)</span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "#64748b" }}>Não possui deficiência declarada</span>
                    )}
                  </div>
                </div>
              </Card>

              {/* 5. HISTÓRICO DE REMANEJAMENTOS E MUDANÇAS DE TURMA */}
              <Card style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-arrows-exchange" style={{ color: "#1a56db" }} /> 5. Histórico de Remanejamentos de Turma
                  </h3>
                  <Btn
                    variant="secondary"
                    style={{ padding: "4px 10px", fontSize: 11 }}
                    onClick={() => {
                      setTurmaDestinoRemanejamento("");
                      setMotivoRemanejamento("Ajuste de Turno / Horário");
                      setDataRemanejamento(new Date().toISOString().split("T")[0]);
                      setObsRemanejamento("");
                      setModalRemanejarAberto(true);
                    }}
                  >
                    <i className="ti ti-arrows-exchange" /> Novo Remanejamento
                  </Btn>
                </div>

                {(!aluno.historicoRemanejamento || aluno.historicoRemanejamento.length === 0) ? (
                  <div style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 10 }}>
                    <i className="ti ti-info-circle" style={{ fontSize: 18, color: "#94a3b8" }} />
                    <span>O estudante permanece em sua turma de enturmação inicial (<strong>{aluno.turma}</strong>). Não há registros de remanejamento interno.</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {aluno.historicoRemanejamento.map((item, idx) => (
                      <div key={item.id || idx} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                              {item.data ? new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR") : "Data não informada"}
                            </span>
                            <Badge color="gray">{item.turmaOrigem}</Badge>
                            <i className="ti ti-arrow-right" style={{ fontSize: 12, color: "#94a3b8" }} />
                            <Badge color="green">{item.turmaDestino}</Badge>
                          </div>
                          <div style={{ fontSize: 12, color: "#1e293b" }}>
                            <strong>Motivo:</strong> {item.motivo}
                          </div>
                          {item.observacoes && (
                            <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", marginTop: 2 }}>
                              {item.observacoes}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                            Registrado por: {item.usuarioNome || "Secretaria"}
                          </div>
                        </div>

                        <Btn
                          variant="default"
                          style={{ padding: "4px 8px", fontSize: 11 }}
                          onClick={() => {
                            setComprovanteRemanejamento({
                              ...aluno,
                              turmaAnterior: item.turmaOrigem,
                              novaTurma: item.turmaDestino,
                              motivo: item.motivo,
                              observacoes: item.observacoes,
                              dataRemanejamento: item.data,
                              usuarioNome: item.usuarioNome
                            });
                          }}
                        >
                          <i className="ti ti-printer" /> Imprimir Guia
                        </Btn>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* 6. TRAJETÓRIA ESCOLAR & HISTÓRICO ACADÊMICO */}
              <Card style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                      <i className="ti ti-timeline" style={{ color: "#1a56db" }} /> 6. Trajetória Escolar & Histórico Acadêmico
                    </h3>
                    <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                      Linha do tempo cronológica com a trajetória do aluno ano a ano para boletins e histórico escolar.
                    </p>
                  </div>
                  <Btn
                    variant="primary"
                    style={{ padding: "4px 10px", fontSize: 11 }}
                    onClick={() => {
                      setNovoMarco({
                        anoLetivo: new Date().getFullYear().toString(),
                        serieAno: aluno.ano || "6º Ano",
                        escola: aluno.escolaNome || "Escola Municipal",
                        cidadeUf: "Maceió - AL",
                        situacaoFinal: "Aprovado",
                        frequenciaPercentual: "95",
                        mediaFinal: "8.0",
                        observacoes: ""
                      });
                      setModalNovoMarcoAberto(true);
                    }}
                  >
                    <i className="ti ti-plus" /> Adicionar Ano / Série
                  </Btn>
                </div>

                {(!aluno.trajetoriaEscolar || aluno.trajetoriaEscolar.length === 0) ? (
                  <div style={{ padding: "16px 18px", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1", fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <i className="ti ti-info-circle" style={{ fontSize: 18, color: "#94a3b8" }} />
                      <span>Nenhum histórico anterior de anos letivos cadastrado para este estudante.</span>
                    </div>
                    <Btn
                      variant="default"
                      style={{ fontSize: 11 }}
                      onClick={() => setModalNovoMarcoAberto(true)}
                    >
                      + Cadastrar Ano
                    </Btn>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {aluno.trajetoriaEscolar.map((item, idx) => {
                      const isAprovado = item.situacaoFinal === "Aprovado";
                      const isTransferido = item.situacaoFinal === "Transferido";
                      const isReprovado = item.situacaoFinal === "Reprovado";

                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "110px 1fr 140px auto",
                            gap: 14,
                            alignItems: "center",
                            padding: "12px 16px",
                            background: "#f8fafc",
                            borderRadius: 8,
                            border: "1px solid #e2e8f0"
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e3a8a" }}>{item.anoLetivo}</div>
                            <Badge color="blue">{item.serieAno}</Badge>
                          </div>

                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.escola}</div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{item.cidadeUf || "—"}</div>
                            {item.observacoes && (
                              <div style={{ fontSize: 11, color: "#475569", fontStyle: "italic", marginTop: 2 }}>{item.observacoes}</div>
                            )}
                          </div>

                          <div>
                            <Badge color={isAprovado ? "green" : isTransferido ? "purple" : isReprovado ? "red" : "amber"}>
                              {item.situacaoFinal || "Aprovado"}
                            </Badge>
                            {item.mediaFinal && (
                              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                                Média: <strong>{item.mediaFinal}</strong> {item.frequenciaPercentual ? `· Freq: ${item.frequenciaPercentual}%` : ""}
                              </div>
                            )}
                          </div>

                          <div>
                            <button
                              onClick={() => handleRemoverMarco(item.id)}
                              style={{ border: "none", background: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
                              title="Remover este ano"
                            >
                              <i className="ti ti-trash" style={{ fontSize: 15 }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}



        {/* CONTEÚDO DA ABA 2: DOCUMENTOS ANEXADOS */}
        {abaAtiva === "documentos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 18px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Pasta Digital de Documentos do Aluno</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  Anexe cópias digitalizadas (PDF ou Imagem) dos documentos exigidos para a matrícula e arquivo permanente.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: percentualDocs === 100 ? "#16a34a" : "#ca8a04" }}>
                  {docsObrigatoriosEntregues} de {totalDocsObrigatorios} Obrigatórios
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
              {TIPOS_DOCUMENTOS_ALUNO.map(tipoDoc => {
                const docAnexado = aluno.documentos?.[tipoDoc.id];
                const isUploading = uploadingDocId === tipoDoc.id;
                const isPdf = docAnexado?.tipo === "application/pdf" || docAnexado?.url?.startsWith("data:application/pdf") || docAnexado?.nome?.toLowerCase().endsWith(".pdf");

                return (
                  <Card
                    key={tipoDoc.id}
                    style={{
                      padding: 16,
                      border: docAnexado ? "1px solid #cbd5e1" : "1px dashed #cbd5e1",
                      background: docAnexado ? "white" : "#fafafa",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 14,
                      position: "relative"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 8,
                              background: docAnexado ? (isPdf ? "#fee2e2" : "#e0e7ff") : "#f1f5f9",
                              color: docAnexado ? (isPdf ? "#dc2626" : "#4338ca") : "#94a3b8",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 18
                            }}
                          >
                            <i className={`ti ti-${tipoDoc.icone || "file"}`} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                              {tipoDoc.label}
                            </h4>
                            <span style={{ fontSize: 11, color: "#64748b" }}>{tipoDoc.descricao}</span>
                          </div>
                        </div>

                        <div>
                          {tipoDoc.obrigatorio ? (
                            <span style={{ fontSize: 10, background: "#fee2e2", color: "#991b1b", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                              Obrigatório
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, background: "#f1f5f9", color: "#64748b", padding: "2px 6px", borderRadius: 4, fontWeight: 500 }}>
                              Opcional
                            </span>
                          )}
                        </div>
                      </div>

                      {docAnexado ? (
                        <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0", marginTop: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#16a34a", fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                            <i className="ti ti-check" /> Documento Entregue
                          </div>
                          <div style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            📄 {docAnexado.nome || "documento_anexo"}
                          </div>
                          {docAnexado.dataEnvio && (
                            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                              Enviado em {new Date(docAnexado.dataEnvio).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ background: "#fffbeb", padding: "8px 12px", borderRadius: 6, border: "1px solid #fef3c7", marginTop: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#b45309", fontSize: 12, fontWeight: 500 }}>
                            <i className="ti ti-clock" /> Nenhum arquivo anexado
                          </div>
                          <div style={{ fontSize: 10, color: "#92400e", marginTop: 2 }}>{tipoDoc.dica}</div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                      {docAnexado ? (
                        <>
                          <Btn
                            variant="primary"
                            onClick={() => {
                              setDocVisualizando(docAnexado);
                              setDocTituloVisualizando(tipoDoc.label);
                            }}
                            style={{ flex: 1, padding: "6px 10px", fontSize: 12, justifyContent: "center" }}
                          >
                            <i className="ti ti-eye" /> Visualizar
                          </Btn>

                          <label
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "6px 10px",
                              borderRadius: 6,
                              fontSize: 12,
                              background: "white",
                              color: "#374151",
                              border: "1px solid #d1d5db",
                              cursor: isUploading ? "not-allowed" : "pointer",
                              opacity: isUploading ? 0.6 : 1
                            }}
                            title="Substituir arquivo"
                          >
                            <i className="ti ti-refresh" />
                            {isUploading ? "Enviando..." : "Substituir"}
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileUpload(e, tipoDoc.id, tipoDoc.label)}
                              disabled={isUploading}
                              style={{ display: "none" }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoverDocumento(tipoDoc.id, tipoDoc.label)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              border: "1px solid #fca5a5",
                              background: "#fee2e2",
                              color: "#991b1b",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer"
                            }}
                            title="Remover documento"
                          >
                            <i className="ti ti-trash" style={{ fontSize: 14 }} />
                          </button>
                        </>
                      ) : (
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            background: "#1a56db",
                            color: "white",
                            border: "1px solid #1a56db",
                            cursor: isUploading ? "not-allowed" : "pointer",
                            opacity: isUploading ? 0.7 : 1
                          }}
                        >
                          <i className={`ti ${isUploading ? "ti-loader" : "ti-upload"}`} />
                          {isUploading ? "Enviando Arquivo..." : "Anexar Documento (PDF / Foto)"}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleFileUpload(e, tipoDoc.id, tipoDoc.label)}
                            disabled={isUploading}
                            style={{ display: "none" }}
                          />
                        </label>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 3: BOLETIM & NOTAS */}
        {abaAtiva === "boletim" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 18px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Boletim de Rendimento Escolar · {ANO_LETIVO_ATUAL}</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  Acompanhe o desempenho bimestral em todas as disciplinas curriculares.
                </p>
              </div>
              <Btn variant="default" onClick={() => navigate("/notas")}>
                <i className="ti ti-edit" /> Lançar / Gerenciar Notas
              </Btn>
            </div>

            <Card style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#475569" }}>Disciplina</th>
                    <th style={{ textAlign: "center", padding: "12px 12px", fontSize: 12, fontWeight: 600, color: "#475569" }}>1º Bim</th>
                    <th style={{ textAlign: "center", padding: "12px 12px", fontSize: 12, fontWeight: 600, color: "#475569" }}>2º Bim</th>
                    <th style={{ textAlign: "center", padding: "12px 12px", fontSize: 12, fontWeight: 600, color: "#475569" }}>3º Bim</th>
                    <th style={{ textAlign: "center", padding: "12px 12px", fontSize: 12, fontWeight: 600, color: "#475569" }}>4º Bim</th>
                    <th style={{ textAlign: "center", padding: "12px 12px", fontSize: 12, fontWeight: 600, color: "#475569" }}>Média</th>
                    <th style={{ textAlign: "center", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#475569" }}>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {DISCIPLINAS.map(disc => {
                    const notaDoc = notas.find(n => n.disciplina === disc);
                    const bim = notaDoc?.bimestres || {};
                    const media = notaDoc?.media ?? calcularMedia(bim);
                    const sit = situacaoAluno(media);

                    return (
                      <tr key={disc} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b", fontSize: 13 }}>
                          {disc}
                        </td>
                        {["b1", "b2", "b3", "b4"].map(b => (
                          <td key={b} style={{ textAlign: "center", padding: "12px", fontSize: 13, color: bim[b] ? "#0f172a" : "#94a3b8" }}>
                            {bim[b] !== undefined && bim[b] !== null && bim[b] !== "" ? bim[b] : "—"}
                          </td>
                        ))}
                        <td style={{ textAlign: "center", padding: "12px", fontWeight: 700, fontSize: 13, color: media !== null ? (media >= 7 ? "#16a34a" : media >= 5 ? "#ca8a04" : "#dc2626") : "#94a3b8" }}>
                          {media !== null ? media : "—"}
                        </td>
                        <td style={{ textAlign: "center", padding: "12px 16px" }}>
                          <Badge color={sit.cor}>{sit.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* CONTEÚDO DA ABA 4: FREQUÊNCIA ESCOLAR */}
        {abaAtiva === "frequencia" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 18px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Histórico de Presença & Frequência Escolar</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  Percentual de assiduidade e detalhamento mensal de presenças e faltas.
                </p>
              </div>
              <Btn variant="default" onClick={() => navigate("/frequencia")}>
                <i className="ti ti-calendar-check" /> Abrir Diário de Classe
              </Btn>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              {MESES.map((mesNome, index) => {
                const freqDoc = frequencias.find(f => Number(f.mes) === index);
                const dias = freqDoc?.dias || {};
                const totalDias = Object.keys(dias).length;
                const presencas = Object.values(dias).filter(v => v === "P").length;
                const faltas = Object.values(dias).filter(v => v === "F").length;
                const faltasJust = Object.values(dias).filter(v => v === "FJ").length;
                const perc = totalDias > 0 ? Math.round((presencas / totalDias) * 100) : null;

                return (
                  <Card key={mesNome} style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{mesNome}</h4>
                      {perc !== null ? (
                        <Badge color={perc >= 75 ? "green" : "red"}>{perc}%</Badge>
                      ) : (
                        <Badge color="gray">Sem registros</Badge>
                      )}
                    </div>

                    {totalDias > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12, textAlign: "center", background: "#f8fafc", padding: 8, borderRadius: 8 }}>
                        <div>
                          <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 14, display: "block" }}>{presencas}</span>
                          <span style={{ color: "#64748b", fontSize: 10 }}>Presenças</span>
                        </div>
                        <div>
                          <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 14, display: "block" }}>{faltas}</span>
                          <span style={{ color: "#64748b", fontSize: 10 }}>Faltas</span>
                        </div>
                        <div>
                          <span style={{ color: "#ca8a04", fontWeight: 700, fontSize: 14, display: "block" }}>{faltasJust}</span>
                          <span style={{ color: "#64748b", fontSize: 10 }}>Justificadas</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>
                        Nenhum dia letivo registrado neste mês.
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 5: OCORRÊNCIAS */}
        {abaAtiva === "ocorrencias" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 18px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Acompanhamento de Ocorrências e Conduta</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  Histórico de fatos disciplinares, mediações, termos de compromisso e acompanhamento contínuo.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="default" onClick={() => navigate(`/ocorrencias?alunoId=${aluno.id}`)}>
                  <i className="ti ti-timeline" /> Ver Painel Geral de Ocorrências
                </Btn>
                <Btn variant="primary" onClick={() => navigate(`/ocorrencias?alunoId=${aluno.id}`)}>
                  <i className="ti ti-plus" /> Registrar Nova Ocorrência
                </Btn>
              </div>
            </div>

            {!ocorrencias.length ? (
              <Card style={{ textAlign: "center", padding: 36, color: "#64748b" }}>
                <i className="ti ti-circle-check" style={{ fontSize: 36, color: "#16a34a", marginBottom: 8, display: "block" }} />
                <h4 style={{ margin: "0 0 4px 0", color: "#1e293b" }}>Nenhuma ocorrência registrada</h4>
                <p style={{ margin: 0, fontSize: 13 }}>O aluno não possui anotações disciplinares ou restritivas registradas no sistema.</p>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ocorrencias.map(o => {
                  const gravidadeInfo = GRAVIDADES_OCORRENCIA.find(g => g.id === o.gravidade) || GRAVIDADES_OCORRENCIA[1];
                  const statusInfo = STATUS_OCORRENCIA.find(s => s.id === o.status) || STATUS_OCORRENCIA[0];
                  const qtdAcompanhamentos = (o.historicoAcompanhamento || []).length;
                  const qtdAnexos = (o.anexos || []).length;
                  const dataStr = o.data ? o.data.split("-").reverse().join("/") : "Data não informada";

                  return (
                    <Card
                      key={o.id}
                      style={{
                        padding: 16,
                        borderLeft: `4px solid ${gravidadeInfo.cor === "green" ? "#22c55e" : gravidadeInfo.cor === "red" ? "#ef4444" : "#f59e0b"}`,
                        background: "white"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{o.tipo}</span>
                            <Badge color={gravidadeInfo.cor}>
                              {gravidadeInfo.label}
                            </Badge>
                            <Badge color={statusInfo.cor}>
                              {statusInfo.label}
                            </Badge>
                            <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 4 }}>
                              {dataStr} {o.hora ? `às ${o.hora}` : ""}
                            </span>
                            {o.codigo && (
                              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: "#2563eb" }}>
                                {o.codigo}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                            Registrado por: <strong>{o.responsavelRegistro || o.registradoPor || "Equipe Escolar"}</strong> ({o.cargoResponsavel || "Servidor"})
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <Btn variant="default" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => navigate(`/ocorrencias?alunoId=${aluno.id}`)}>
                            <i className="ti ti-eye" /> Acompanhar / Linha do Tempo ({qtdAcompanhamentos})
                          </Btn>
                          <button
                            onClick={() => excluirOcorrencia(o.id)}
                            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
                            title="Excluir Ocorrência"
                          >
                            <i className="ti ti-trash" style={{ fontSize: 16 }} />
                          </button>
                        </div>
                      </div>

                      <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#334155", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                        {o.descricao}
                      </p>

                      {o.envolvidos && (
                        <div style={{ marginTop: 6, fontSize: 11, color: "#64748b" }}>
                          <strong>Envolvidos / Testemunhas:</strong> {o.envolvidos}
                        </div>
                      )}

                      {qtdAnexos > 0 && (
                        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {o.anexos.map(anx => (
                            <a
                              key={anx.id}
                              href={anx.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontSize: "0.7rem",
                                color: "#1e40af",
                                fontWeight: 600
                              }}
                            >
                              <i className="ti ti-paperclip" /> {anx.nome}
                            </a>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONTEÚDO DA ABA 6: APONTAMENTOS PEDAGÓGICOS */}
        {abaAtiva === "apontamentos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 18px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Apontamentos Pedagógicos & Acompanhamento</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  Anotações de reuniões com pais, orientações pedagógicas, plano de AEE e observações do corpo docente.
                </p>
              </div>
              <Btn variant="primary" onClick={() => setModalApontamentoAberto(true)}>
                <i className="ti ti-plus" /> Novo Apontamento
              </Btn>
            </div>

            {!apontamentos.length ? (
              <Card style={{ textAlign: "center", padding: 36, color: "#64748b" }}>
                <i className="ti ti-notebook" style={{ fontSize: 36, color: "#94a3b8", marginBottom: 8, display: "block" }} />
                <h4 style={{ margin: "0 0 4px 0", color: "#1e293b" }}>Nenhum apontamento pedagógico</h4>
                <p style={{ margin: 0, fontSize: 13 }}>Adicione observações para acompanhar o desenvolvimento do estudante.</p>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {apontamentos.map(ap => {
                  const dataStr = ap.data ? new Date(ap.data + "T12:00:00").toLocaleDateString("pt-BR") : "Data não informada";

                  return (
                    <Card key={ap.id} style={{ padding: 16, borderLeft: "4px solid #1a56db" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, color: "#1a56db", fontSize: 13 }}>{ap.categoria || "Pedagógico"}</span>
                            <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 4 }}>
                              {dataStr}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            Autor: <strong>{ap.registradoPor || "Equipe Pedagógica"}</strong>
                          </span>
                        </div>
                        <button
                          onClick={() => excluirApontamento(ap.id)}
                          style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
                          title="Excluir Apontamento"
                        >
                          <i className="ti ti-trash" style={{ fontSize: 16 }} />
                        </button>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "#334155", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                        {ap.texto}
                      </p>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE VISUALIZAÇÃO DE DOCUMENTO (PDF / IMAGEM) */}
      {docVisualizando && (
        <DocumentoViewerModal
          documento={docVisualizando}
          titulo={docTituloVisualizando}
          onClose={() => setDocVisualizando(null)}
        />
      )}

      {/* MODAL DE EDIÇÃO CADASTRAL COMPLETA */}
      {modalEditarAberto && (
        <Modal
          titulo={`Editar Cadastro · ${aluno.nome}`}
          onClose={() => setModalEditarAberto(false)}
          onSave={salvarEdicao}
          salvando={salvandoEdicao}
          width={960}
        >
          <div style={{ display: "flex", gap: 20, minHeight: 460 }}>
            {/* Sidebar de Abas do Modal */}
            <div style={{ width: 190, display: "flex", flexDirection: "column", gap: 6, borderRight: "1px solid #e5e7eb", paddingRight: 12, flexShrink: 0 }}>
              {[
                { id: "escola", label: "Escola / Etapa", icon: "school" },
                { id: "pessoais", label: "Dados Pessoais", icon: "user" },
                { id: "endereco", label: "Endereço & Contato", icon: "map-pin" },
                { id: "responsaveis", label: "Responsáveis", icon: "users" },
                { id: "historico_censo", label: "Histórico / Censo", icon: "file-text" }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAbaModalEditar(t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    border: "none",
                    borderRadius: 8,
                    background: abaModalEditar === t.id ? "#eff6ff" : "transparent",
                    fontSize: 13,
                    fontWeight: abaModalEditar === t.id ? 600 : 500,
                    color: abaModalEditar === t.id ? "#1a56db" : "#4b5563",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <i className={`ti ti-${t.icon}`} style={{ fontSize: 16 }} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form Fields */}
            <div style={{ flex: 1, overflowY: "auto", maxHeight: 460, paddingRight: 6 }}>
              {abaModalEditar === "escola" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                    <Input label="Unidade Escolar" value={form.escolaNome || ""} disabled />
                    <Input label="Código INEP da Escola" value={form.escolaInep || ""} disabled />
                  </div>
                  <Select label="Etapa de Ensino *" value={form.etapaEnsino || ""} onChange={e => setForm(f => ({ ...f, etapaEnsino: e.target.value }))}>
                    {ETAPAS_ENSINO.map(et => <option key={et}>{et}</option>)}
                  </Select>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Select label="Ano/Série *" value={form.ano || ""} onChange={e => setForm(f => ({ ...f, ano: e.target.value }))}>
                      {ANOS_LETIVOS.map(a => <option key={a}>{a}</option>)}
                    </Select>
                    <Select label="Turma *" value={form.turma || ""} onChange={e => setForm(f => ({ ...f, turma: e.target.value }))}>
                      <option value="">Selecione...</option>
                      {turmas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                    </Select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Select label="Turno *" value={form.turno || ""} onChange={e => setForm(f => ({ ...f, turno: e.target.value }))}>
                      {TURNOS_MATRICULA.map(t => <option key={t}>{t}</option>)}
                    </Select>
                    <Select label="Status Operacional *" value={form.status || "Ativo"} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {STATUS_ALUNO.map(s => <option key={s}>{s}</option>)}
                    </Select>
                  </div>
                  <Input label="Nº de Matrícula" value={form.matricula || ""} onChange={e => setForm(f => ({ ...f, matricula: e.target.value }))} />
                </div>
              )}

              {abaModalEditar === "pessoais" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                    <Input label="Nome Completo *" value={form.nome || ""} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                    <Input label="Data de Nascimento *" type="date" value={form.nascimento || ""} onChange={e => setForm(f => ({ ...f, nascimento: e.target.value }))} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Select label="Sexo *" value={form.sexo || "Masculino"} onChange={e => setForm(f => ({ ...f, sexo: e.target.value }))}>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </Select>
                    <Select label="Cor / Raça *" value={form.corRaca || "Não declarada"} onChange={e => setForm(f => ({ ...f, corRaca: e.target.value }))}>
                      {CORES_RACAS.map(c => <option key={c}>{c}</option>)}
                    </Select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Select label="Nacionalidade *" value={form.nacionalidade || "Brasileira"} onChange={e => setForm(f => ({ ...f, nacionalidade: e.target.value }))}>
                      {NACIONALIDADES.map(n => <option key={n}>{n}</option>)}
                    </Select>
                    {form.nacionalidade === "Estrangeira" ? (
                      <Input label="País de Origem" value={form.paisOrigem || ""} onChange={e => setForm(f => ({ ...f, paisOrigem: e.target.value }))} />
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
                        <Input label="UF Nascimento" value={form.ufNascimento || ""} onChange={e => setForm(f => ({ ...f, ufNascimento: e.target.value }))} />
                        <Input label="Município Nascimento" value={form.municipioNascimento || ""} onChange={e => setForm(f => ({ ...f, municipioNascimento: e.target.value }))} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="CPF do Aluno *" value={form.cpf || ""} onChange={e => setForm(f => ({ ...f, cpf: formatCPF(e.target.value) }))} placeholder="000.000.000-00" />
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                      <Input label="RG" value={form.rg || ""} onChange={e => setForm(f => ({ ...f, rg: e.target.value }))} />
                      <Input label="Órgão" value={form.rgOrgaoEmissor || ""} onChange={e => setForm(f => ({ ...f, rgOrgaoEmissor: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="Certidão de Nascimento (Registro Civil)" value={form.registroCivil || ""} onChange={e => setForm(f => ({ ...f, registroCivil: e.target.value }))} />
                    <Input label="Cartão SUS" value={form.cartaoSus || ""} onChange={e => setForm(f => ({ ...f, cartaoSus: formatSUS(e.target.value) }))} />
                  </div>
                  <Input label="Nº NIS / Bolsa Família" value={form.nis || ""} onChange={e => setForm(f => ({ ...f, nis: formatNIS(e.target.value) }))} />
                </div>
              )}

              {abaModalEditar === "endereco" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr 1fr", gap: 12 }}>
                    <Input label="CEP" value={form.cep || ""} onChange={e => setForm(f => ({ ...f, cep: formatCEP(e.target.value) }))} />
                    <Input label="Endereço" value={form.endereco || ""} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} />
                    <Input label="Nº" value={form.enderecoNumero || ""} onChange={e => setForm(f => ({ ...f, enderecoNumero: e.target.value }))} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="Complemento" value={form.complemento || ""} onChange={e => setForm(f => ({ ...f, complemento: e.target.value }))} />
                    <Input label="Bairro" value={form.bairro || ""} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                    <Input label="Município" value={form.municipio || ""} onChange={e => setForm(f => ({ ...f, municipio: e.target.value }))} />
                    <Input label="UF" value={form.uf || ""} onChange={e => setForm(f => ({ ...f, uf: e.target.value }))} />
                    <Select label="Zona" value={form.zona || "Urbana"} onChange={e => setForm(f => ({ ...f, zona: e.target.value }))}>
                      {ZONAS.map(z => <option key={z}>{z}</option>)}
                    </Select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="Telefone *" value={form.telefone || ""} onChange={e => setForm(f => ({ ...f, telefone: formatTelefone(e.target.value) }))} />
                    <Input label="E-mail" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
              )}

              {abaModalEditar === "responsaveis" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="Nome da Mãe *" value={form.mae || ""} onChange={e => setForm(f => ({ ...f, mae: e.target.value }))} />
                    <Input label="Nome do Pai" value={form.pai || ""} onChange={e => setForm(f => ({ ...f, pai: e.target.value }))} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                    <Input label="Nome do Responsável Legal" value={form.responsavel || ""} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} />
                    <Select label="Vínculo" value={form.responsavelVinculo || "Mãe"} onChange={e => setForm(f => ({ ...f, responsavelVinculo: e.target.value }))}>
                      {VINCULOS_RESPONSAVEL.map(v => <option key={v}>{v}</option>)}
                    </Select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="CPF do Responsável" value={form.responsavelCpf || ""} onChange={e => setForm(f => ({ ...f, responsavelCpf: formatCPF(e.target.value) }))} />
                    <Input label="RG do Responsável" value={form.responsavelRg || ""} onChange={e => setForm(f => ({ ...f, responsavelRg: e.target.value }))} />
                  </div>
                </div>
              )}

              {abaModalEditar === "historico_censo" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                    <Input label="Escola de Origem" value={form.escolaOrigem || ""} onChange={e => setForm(f => ({ ...f, escolaOrigem: e.target.value }))} />
                    <Input label="Cidade/UF Origem" value={form.escolaOrigemCidadeUf || ""} onChange={e => setForm(f => ({ ...f, escolaOrigemCidadeUf: e.target.value }))} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="Ano Anterior" value={form.anoAnterior || ""} onChange={e => setForm(f => ({ ...f, anoAnterior: e.target.value }))} />
                    <Select label="Situação Anterior" value={form.situacaoAnterior || ""} onChange={e => setForm(f => ({ ...f, situacaoAnterior: e.target.value }))}>
                      {SITUACOES_ANTERIOR.map(sa => <option key={sa}>{sa}</option>)}
                    </Select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Select label="Transporte Escolar Público?" value={form.transporteEscolar || "Não"} onChange={e => setForm(f => ({ ...f, transporteEscolar: e.target.value }))}>
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </Select>
                    {form.transporteEscolar === "Sim" && (
                      <Select label="Esfera do Transporte" value={form.transporteEsfera || "Municipal"} onChange={e => setForm(f => ({ ...f, transporteEsfera: e.target.value }))}>
                        <option value="Municipal">Municipal</option>
                        <option value="Estadual">Estadual</option>
                      </Select>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Select label="Possui Deficiência/TEA?" value={form.possuiDeficiencia || "Não"} onChange={e => setForm(f => ({ ...f, possuiDeficiencia: e.target.value }))}>
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </Select>
                    <Select label="Recebe AEE?" value={form.recebeAee || "Não"} onChange={e => setForm(f => ({ ...f, recebeAee: e.target.value }))}>
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </Select>
                  </div>

                  {form.possuiDeficiencia === "Sim" && (
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Selecione as deficiências diagnosticadas:</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {DEFICIENCIAS_INEP_2026.map(def => {
                          const checked = (form.deficienciasSelecionadas || []).includes(def);
                          return (
                            <label key={def} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  const list = form.deficienciasSelecionadas || [];
                                  if (checked) {
                                    setForm(f => ({ ...f, deficienciasSelecionadas: list.filter(i => i !== def) }));
                                  } else {
                                    setForm(f => ({ ...f, deficienciasSelecionadas: [...list, def] }));
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
            </div>
          </div>
        </Modal>
      )}



      {/* MODAL DE NOVO APONTAMENTO */}
      {modalApontamentoAberto && (
        <Modal
          titulo={`Novo Apontamento Pedagógico · ${aluno.nome.split(" ")[0]}`}
          onClose={() => setModalApontamentoAberto(false)}
          onSave={salvarApontamento}
          salvando={salvandoApontamento}
          width={600}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
              <Input
                label="Data *"
                type="date"
                value={novoApontamento.data}
                onChange={e => setNovoApontamento(a => ({ ...a, data: e.target.value }))}
              />
              <Select
                label="Categoria *"
                value={novoApontamento.categoria}
                onChange={e => setNovoApontamento(a => ({ ...a, categoria: e.target.value }))}
              >
                <option value="Pedagógico">Pedagógico / Aprendizagem</option>
                <option value="Atendimento AEE">Atendimento Educacional Especializado (AEE)</option>
                <option value="Reunião com Responsáveis">Reunião com Pais / Responsáveis</option>
                <option value="Psicologia / Psicopedagogia">Psicopedagogia / Orientação</option>
                <option value="Saúde / Encaminhamento">Encaminhamento de Saúde</option>
                <option value="Outros">Outros</option>
              </Select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Observação / Registro *</label>
              <textarea
                value={novoApontamento.texto}
                onChange={e => setNovoApontamento(a => ({ ...a, texto: e.target.value }))}
                placeholder="Insira as observações pedagógicas e acordos estabelecidos..."
                style={{ width: "100%", minHeight: 100, border: "1px solid #d1d5db", borderRadius: 6, padding: "10px", fontSize: 13, fontFamily: "inherit" }}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL DE CROP DE FOTO */}
      {cropFile && (
        <CropModal
          file={cropFile}
          onClose={() => setCropFile(null)}
          onCrop={handleCroppedFoto}
        />
      )}

      {/* MODAL: REMANEJAMENTO DE TURMA DO ALUNO */}
      {modalRemanejarAberto && (
        <Modal
          titulo={`Remanejar Estudante · ${aluno.nome}`}
          onClose={() => setModalRemanejarAberto(false)}
          onSave={executarRemanejamento}
          salvando={salvandoRemanejamento}
          textSave="Efetivar Remanejamento"
          width={620}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#eff6ff", padding: 14, borderRadius: 8, border: "1px solid #bfdbfe" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", textTransform: "uppercase" }}>Estudante</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e3a8a", marginTop: 2 }}>{aluno.nome}</div>
                  <div style={{ fontSize: 12, color: "#3b82f6" }}>Matrícula: {aluno.matricula || "—"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Turma Atual:</div>
                  <Badge color="blue">{aluno.turma}</Badge>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Turno: {aluno.turno || "—"}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Nova Turma de Destino *
                </label>
                <Select
                  value={turmaDestinoRemanejamento}
                  onChange={e => setTurmaDestinoRemanejamento(e.target.value)}
                >
                  <option value="">Selecione a nova turma...</option>
                  {turmas.map(t => {
                    const isMesmaTurma = t.nome === aluno.turma;
                    return (
                      <option key={t.id} value={t.nome} disabled={isMesmaTurma}>
                        {t.nome} ({t.ano} - {t.turno}) {isMesmaTurma ? "— (Turma Atual)" : ""}
                      </option>
                    );
                  })}
                </Select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Motivo do Remanejamento *
                </label>
                <Select
                  value={motivoRemanejamento}
                  onChange={e => setMotivoRemanejamento(e.target.value)}
                >
                  <option value="Ajuste de Turno / Horário">Ajuste de Turno / Horário</option>
                  <option value="Adequação Pedagógica / Nível de Ensino">Adequação Pedagógica / Nível de Ensino</option>
                  <option value="Solicitação da Família / Responsável Legal">Solicitação da Família / Responsável Legal</option>
                  <option value="Equilíbrio de Vagas e Enturmação">Equilíbrio de Vagas e Enturmação</option>
                  <option value="Adaptação e Convivência Escolar">Adaptação e Convivência Escolar</option>
                  <option value="Acessibilidade / Necessidades Especiais">Acessibilidade / Necessidades Especiais</option>
                  <option value="Decisão Administrativa da Direção">Decisão Administrativa da Direção</option>
                  <option value="Outro">Outro</option>
                </Select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Data do Remanejamento *
                </label>
                <Input
                  type="date"
                  value={dataRemanejamento}
                  onChange={e => setDataRemanejamento(e.target.value)}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Observações / Parecer da Secretaria (Opcional)
                </label>
                <Input
                  value={obsRemanejamento}
                  onChange={e => setObsRemanejamento(e.target.value)}
                  placeholder="Justificativa pedagógica ou detalhamento do pedido..."
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: GUIA OFICIAL DE REMANEJAMENTO / TRANSFERÊNCIA INTERNA */}
      {comprovanteRemanejamento && (
        <Modal
          titulo="Guia Oficial de Transferência Interna / Remanejamento"
          onClose={() => setComprovanteRemanejamento(null)}
          onSave={() => window.print()}
          textSave="Imprimir Guia"
          width={680}
        >
          <div style={{ border: "1.5px solid #000", padding: 20, background: "white", borderRadius: 6, fontSize: 12, lineHeight: 1.6 }}>
            <div style={{ textAlign: "center", borderBottom: "1.5px solid #000", paddingBottom: 10, marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>ESTADO DE ALAGOAS · SECRETARIA MUNICIPAL DE EDUCAÇÃO</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e3a8a" }}>{comprovanteRemanejamento.escolaNome || "ESCOLA MUNICIPAL"}</div>
              <div style={{ fontSize: 10, color: "#555" }}>GUIA OFICIAL DE TRANSFERÊNCIA INTERNA & REMANEJAMENTO DE TURMA · ANO {ANO_LETIVO_ATUAL}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 14 }}>
              <div><strong>Nº de Matrícula:</strong> {comprovanteRemanejamento.matricula || "—"}</div>
              <div><strong>Data do Remanejamento:</strong> {comprovanteRemanejamento.dataRemanejamento ? new Date(comprovanteRemanejamento.dataRemanejamento + "T12:00:00").toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>Nome do Estudante:</strong> {comprovanteRemanejamento.nome}</div>
              <div><strong>Data de Nascimento:</strong> {comprovanteRemanejamento.nascimento ? new Date(comprovanteRemanejamento.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</div>
              <div><strong>CPF do Estudante:</strong> {comprovanteRemanejamento.cpf || "—"}</div>
              <div style={{ gridColumn: "1 / -1", background: "#f8fafc", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><strong>Turma Anterior (Origem):</strong> {comprovanteRemanejamento.turmaAnterior || comprovanteRemanejamento.turmaOrigem}</div>
                  <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
                  <div><strong>Nova Turma (Destino):</strong> {comprovanteRemanejamento.novaTurma || comprovanteRemanejamento.turmaDestino}</div>
                </div>
              </div>
              <div><strong>Motivo do Remanejamento:</strong> {comprovanteRemanejamento.motivo}</div>
              <div><strong>Registrado Por:</strong> {comprovanteRemanejamento.usuarioNome || "Secretaria Escolar"}</div>
              {comprovanteRemanejamento.observacoes && (
                <div style={{ gridColumn: "1 / -1" }}><strong>Observações / Justificativa:</strong> {comprovanteRemanejamento.observacoes}</div>
              )}
              <div style={{ gridColumn: "1 / -1" }}><strong>Responsável Legal:</strong> {comprovanteRemanejamento.mae || comprovanteRemanejamento.responsavel || "—"}</div>
              <div><strong>Telefone de Contato:</strong> {comprovanteRemanejamento.telefone || "—"}</div>
              <div><strong>Emissão:</strong> {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>

            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, textAlign: "center", fontSize: 10 }}>
              <div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 4 }}>Assinatura do Responsável</div>
              </div>
              <div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 4 }}>Secretaria Escolar / Direção</div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: ADICIONAR ANO À TRAJETÓRIA ESCOLAR */}
      {modalNovoMarcoAberto && (
        <Modal
          titulo={`Adicionar Ano à Trajetória · ${aluno.nome}`}
          onClose={() => setModalNovoMarcoAberto(false)}
          onSave={handleAdicionarMarco}
          salvando={salvandoMarco}
          textSave="Salvar Ano no Histórico"
          width={580}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Ano Letivo *"
                placeholder="Ex: 2023"
                value={novoMarco.anoLetivo}
                onChange={e => setNovoMarco(m => ({ ...m, anoLetivo: e.target.value }))}
              />
              <Input
                label="Série / Ano Escolar *"
                placeholder="Ex: 6º Ano"
                value={novoMarco.serieAno}
                onChange={e => setNovoMarco(m => ({ ...m, serieAno: e.target.value }))}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <Input
                label="Estabelecimento de Ensino (Escola) *"
                placeholder="Ex: Escola Municipal Maria da Silva"
                value={novoMarco.escola}
                onChange={e => setNovoMarco(m => ({ ...m, escola: e.target.value }))}
              />
              <Input
                label="Cidade / UF"
                placeholder="Ex: Maceió - AL"
                value={novoMarco.cidadeUf}
                onChange={e => setNovoMarco(m => ({ ...m, cidadeUf: e.target.value }))}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Select
                label="Situação Final *"
                value={novoMarco.situacaoFinal}
                onChange={e => setNovoMarco(m => ({ ...m, situacaoFinal: e.target.value }))}
              >
                <option value="Aprovado">Aprovado</option>
                <option value="Reprovado">Reprovado</option>
                <option value="Transferido">Transferido</option>
                <option value="Cursando">Cursando</option>
                <option value="Desistente">Desistente</option>
              </Select>

              <Input
                label="Média Final"
                placeholder="Ex: 8.5"
                value={novoMarco.mediaFinal}
                onChange={e => setNovoMarco(m => ({ ...m, mediaFinal: e.target.value }))}
              />

              <Input
                label="Frequência %"
                placeholder="Ex: 95"
                value={novoMarco.frequenciaPercentual}
                onChange={e => setNovoMarco(m => ({ ...m, frequenciaPercentual: e.target.value }))}
              />
            </div>

            <Input
              label="Observações Adicionais"
              placeholder="Ex: Cursou o ano completo nesta unidade..."
              value={novoMarco.observacoes}
              onChange={e => setNovoMarco(m => ({ ...m, observacoes: e.target.value }))}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}



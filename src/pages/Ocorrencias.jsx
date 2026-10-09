import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getAlunos } from "../services/alunosService";
import { getTurmas } from "../services/turmasService";
import {
  getOcorrenciasEscola,
  addOcorrencia,
  updateOcorrencia,
  adicionarDespachoAcompanhamento,
  deleteOcorrencia
} from "../services/ocorrenciasService";
import {
  TIPOS_OCORRENCIA,
  GRAVIDADES_OCORRENCIA,
  STATUS_OCORRENCIA,
  ACOES_ENCAMINHAMENTO_OCORRENCIA
} from "../utils/constants";
import { Card, Badge, Btn, Modal, Spinner, EmptyState } from "../components/ui";

export default function Ocorrencias() {
  const [searchParams] = useSearchParams();
  const urlAlunoId = searchParams.get("alunoId");

  const { user, escolas, selectedEscolaId } = useAuth();
  const activeEscolaId = selectedEscolaId || user?.selectedEscolaId || "";
  const escolaAtual = (escolas || []).find(e => e.id === activeEscolaId) || {
    nome: "Escola Municipal de Ensino Fundamental",
    inep: "27012345",
    cidade: "Porto Calvo",
    uf: "AL"
  };

  // Estados de Filtros
  const [busca, setBusca] = useState("");
  const [turmaFiltro, setTurmaFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [gravidadeFiltro, setGravidadeFiltro] = useState("");

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalAcompanhamentoAberto, setModalAcompanhamentoAberto] = useState(false);
  const [modalImprimirAberto, setModalImprimirAberto] = useState(false);

  // Ocorrência selecionada para Acompanhamento ou Impressão
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState(null);

  // Estado do Formulário de Nova Ocorrência
  const agora = new Date();
  const dataHojeStr = agora.toISOString().split("T")[0];
  const horaAtualStr = agora.toTimeString().slice(0, 5);

  const nomeUsuarioLogado = user?.nome || user?.displayName || user?.email || "Coordenação Pedagógica";
  const cargoUsuarioLogado = user?.role || user?.cargo || "Servidor(a)";

  const formInicial = {
    alunoId: urlAlunoId || "",
    alunoNome: "",
    alunoMatricula: "",
    alunoFotoUrl: "",
    turma: "",
    ano: "",
    escolaId: activeEscolaId,
    escolaNome: escolaAtual.nome,
    data: dataHojeStr,
    hora: horaAtualStr,
    tipo: TIPOS_OCORRENCIA[0],
    gravidade: "media",
    descricao: "",
    envolvidos: "",
    responsavelRegistro: nomeUsuarioLogado,
    cargoResponsavel: cargoUsuarioLogado,
    acaoImediata: "Conversa de Orientação com Aluno",
    status: "Aberta",
    anexos: []
  };

  const [formNovo, setFormNovo] = useState(formInicial);
  const [salvando, setSalvando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  // Estado do Novo Despacho / Acompanhamento
  const [novoDespacho, setNovoDespacho] = useState({
    tipoAcao: "Registro de Acompanhamento",
    descricao: "",
    novoStatus: "",
    autor: user?.displayName || user?.email || "Coordenação Pedagógica",
    cargo: user?.role || "Equipe Gestora",
    anexoUrl: ""
  });
  const [salvandoDespacho, setSalvandoDespacho] = useState(false);

  // Carrega Dados do Firestore
  const { dados: turmas } = useFirestore(
    useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  const { dados: alunos } = useFirestore(
    useCallback(() => getAlunos(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  const { dados: ocorrencias, recarregar: recarregarOcorrencias, carregando } = useFirestore(
    useCallback(() => getOcorrenciasEscola(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  // Se veio alunoId na URL, abre automaticamente o formulário pré-selecionado
  useEffect(() => {
    if (urlAlunoId && alunos && alunos.length > 0) {
      const al = alunos.find(a => a.id === urlAlunoId);
      if (al) {
        setFormNovo(prev => ({
          ...prev,
          alunoId: al.id,
          alunoNome: al.nome,
          alunoMatricula: al.matricula || "",
          alunoFotoUrl: al.fotoUrl || "",
          turma: al.turma || "",
          ano: al.ano || ""
        }));
        setModalNovoAberto(true);
      }
    }
  }, [urlAlunoId, alunos]);

  // Handler de seleção de aluno no formulário de cadastro
  function handleSelecionarAluno(alunoId) {
    const al = (alunos || []).find(a => a.id === alunoId);
    if (al) {
      setFormNovo(prev => ({
        ...prev,
        alunoId: al.id,
        alunoNome: al.nome,
        alunoMatricula: al.matricula || "",
        alunoFotoUrl: al.fotoUrl || "",
        turma: al.turma || "",
        ano: al.ano || ""
      }));
    } else {
      setFormNovo(prev => ({
        ...prev,
        alunoId: "",
        alunoNome: "",
        alunoMatricula: "",
        alunoFotoUrl: "",
        turma: "",
        ano: ""
      }));
    }
  }

  // Upload/Inclusão de Anexo (convertido para Data URL base64)
  function handleAdicionarAnexo(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setFormNovo(prev => ({
          ...prev,
          anexos: [
            ...(prev.anexos || []),
            {
              id: "anx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
              nome: file.name,
              tamanho: (file.size / 1024).toFixed(1) + " KB",
              tipo: file.type,
              url: reader.result,
              criadoEm: new Date().toISOString()
            }
          ]
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  function handleRemoverAnexo(anexoId) {
    setFormNovo(prev => ({
      ...prev,
      anexos: (prev.anexos || []).filter(a => a.id !== anexoId)
    }));
  }

  // Submissão do Novo Registro
  async function handleSalvarNovaOcorrencia(e) {
    e.preventDefault();
    if (!formNovo.alunoId) {
      alert("Selecione o estudante envolvido.");
      return;
    }
    if (!formNovo.descricao.trim()) {
      alert("Informe a descrição detalhada do fato ocorrido.");
      return;
    }

    setSalvando(true);
    try {
      await addOcorrencia(
        {
          ...formNovo,
          responsavelRegistro: nomeUsuarioLogado,
          cargoResponsavel: cargoUsuarioLogado,
          escolaNome: escolaAtual.nome,
          escolaInep: escolaAtual.inep || "27012345"
        },
        activeEscolaId
      );

      setAlerta({ msg: "Ocorrência registrada e acompanhamento iniciado com sucesso!", tipo: "success" });
      setModalNovoAberto(false);
      setFormNovo(formInicial);
      recarregarOcorrencias();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar ocorrência: " + err.message);
    } finally {
      setSalvando(false);
    }
  }

  // Adicionar Despacho / Acompanhamento à ocorrência existente
  async function handleSalvarDespacho() {
    if (!novoDespacho.descricao.trim()) {
      alert("Descreva o acompanhamento ou providência adotada.");
      return;
    }

    setSalvandoDespacho(true);
    try {
      const statusFinal = novoDespacho.novoStatus || ocorrenciaSelecionada.status;
      const despachoSalvo = await adicionarDespachoAcompanhamento(
        ocorrenciaSelecionada.id,
        ocorrenciaSelecionada,
        {
          ...novoDespacho,
          novoStatus: statusFinal
        }
      );

      // Atualiza estado local da ocorrência selecionada
      const novaLista = [...(ocorrenciaSelecionada.historicoAcompanhamento || []), despachoSalvo];
      setOcorrenciaSelecionada(prev => ({
        ...prev,
        status: statusFinal,
        historicoAcompanhamento: novaLista
      }));

      setNovoDespacho({
        tipoAcao: "Registro de Acompanhamento",
        descricao: "",
        novoStatus: "",
        autor: user?.displayName || user?.email || "Coordenação Pedagógica",
        cargo: user?.role || "Equipe Gestora",
        anexoUrl: ""
      });

      setAlerta({ msg: "Despacho de acompanhamento registrado com sucesso!", tipo: "success" });
      recarregarOcorrencias();
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar despacho: " + err.message);
    } finally {
      setSalvandoDespacho(false);
    }
  }

  // Alterar Status Rápido
  async function handleAlterarStatusRapido(id, novoStatus) {
    try {
      await updateOcorrencia(id, { status: novoStatus });
      if (ocorrenciaSelecionada && ocorrenciaSelecionada.id === id) {
        setOcorrenciaSelecionada(prev => ({ ...prev, status: novoStatus }));
      }
      recarregarOcorrencias();
    } catch (err) {
      alert("Erro ao alterar status: " + err.message);
    }
  }

  // Excluir Ocorrência
  async function handleExcluirOcorrencia(id, e) {
    if (e) e.stopPropagation();
    if (!window.confirm("Deseja realmente excluir este registro de ocorrência? Esta ação não pode ser desfeita.")) {
      return;
    }
    try {
      await deleteOcorrencia(id);
      if (modalAcompanhamentoAberto && ocorrenciaSelecionada?.id === id) {
        setModalAcompanhamentoAberto(false);
      }
      setAlerta({ msg: "Registro excluído com sucesso.", tipo: "success" });
      recarregarOcorrencias();
    } catch (err) {
      alert("Erro ao excluir ocorrência: " + err.message);
    }
  }

  // Filtros aplicados à lista
  const ocorrenciasFiltradas = useMemo(() => {
    if (!ocorrencias) return [];
    return ocorrencias.filter(o => {
      const matchTurma = !turmaFiltro || o.turma === turmaFiltro;
      const matchTipo = !tipoFiltro || o.tipo === tipoFiltro;
      const matchStatus = !statusFiltro || o.status === statusFiltro;
      const matchGravidade = !gravidadeFiltro || o.gravidade === gravidadeFiltro;
      const matchBusca = !busca ||
        (o.alunoNome || "").toLowerCase().includes(busca.toLowerCase()) ||
        (o.codigo || "").toLowerCase().includes(busca.toLowerCase()) ||
        (o.descricao || "").toLowerCase().includes(busca.toLowerCase()) ||
        (o.envolvidos || "").toLowerCase().includes(busca.toLowerCase()) ||
        (o.responsavelRegistro || "").toLowerCase().includes(busca.toLowerCase());

      return matchTurma && matchTipo && matchStatus && matchGravidade && matchBusca;
    });
  }, [ocorrencias, turmaFiltro, tipoFiltro, statusFiltro, gravidadeFiltro, busca]);

  // Estatísticas Rápidas
  const total = (ocorrencias || []).length;
  const abertas = (ocorrencias || []).filter(o => o.status === "Aberta" || o.status === "Em Apuracao").length;
  const notificadas = (ocorrencias || []).filter(o => o.status === "Responsaveis Notificados").length;
  const resolvidas = (ocorrencias || []).filter(o => o.status === "Resolvida").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "3rem" }}>
      {/* CSS DE IMPRESSÃO A4 DO TERMO DE OCORRÊNCIA */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #000000 !important;
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .termo-ocorrencia-print, .termo-ocorrencia-print * {
            visibility: visible !important;
          }
          .termo-ocorrencia-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 15mm 2cm 15mm 2cm !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            display: block !important;
          }
          .termo-box {
            border: 1px solid #000 !important;
            padding: 10px 14px !important;
            margin-bottom: 12px !important;
          }
          .termo-titulo-box {
            font-size: 11px !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
            border-bottom: 1px solid #000 !important;
            padding-bottom: 4px !important;
            margin-bottom: 8px !important;
            background: #f1f5f9 !important;
            padding: 4px 6px !important;
          }
          .termo-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 6px !important;
            font-size: 10.5px !important;
          }
          .termo-assinaturas {
            display: flex !important;
            justify-content: space-between !important;
            margin-top: 50px !important;
            text-align: center !important;
            font-size: 9px !important;
            page-break-inside: avoid !important;
          }
          .termo-linha-ass {
            width: 180px !important;
            border-top: 1px solid #000 !important;
            margin: 0 auto 4px !important;
          }
        }
      `}</style>

      {/* CABEÇALHO DA PÁGINA */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.6rem" }}>📋</span>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--text-primary, #1e293b)" }}>
              Acompanhamento de Ocorrências Escolares
            </h1>
          </div>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary, #64748b)", fontSize: "0.9rem" }}>
            Registro minucioso, acompanhamento contínuo de conduta, linha do tempo de despachos e emissão de termos oficiais.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Btn variant="primary" onClick={() => { setFormNovo(formInicial); setModalNovoAberto(true); }}>
            <i className="ti ti-plus" />
            Nova Ocorrência
          </Btn>
        </div>
      </div>

      {/* ALERTA FEEDBACK */}
      {alerta && (
        <div className="no-print" style={{
          padding: "10px 16px",
          borderRadius: 8,
          background: alerta.tipo === "success" ? "#dcfce7" : "#fee2e2",
          color: alerta.tipo === "success" ? "#166534" : "#991b1b",
          border: `1px solid ${alerta.tipo === "success" ? "#bbf7d0" : "#fecaca"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>{alerta.msg}</span>
          <button onClick={() => setAlerta(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* CARDS DE RESUMO KPI */}
      <div className="no-print" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <Card style={{ padding: "1.25rem", borderLeft: "4px solid #2563eb", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
            <i className="ti ti-clipboard-list" />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total Registrado</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1e293b" }}>{total}</div>
          </div>
        </Card>

        <Card style={{ padding: "1.25rem", borderLeft: "4px solid #f59e0b", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
            <i className="ti ti-clock-pause" />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Em Apuração / Abertas</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#b45309" }}>{abertas}</div>
          </div>
        </Card>

        <Card style={{ padding: "1.25rem", borderLeft: "4px solid #8b5cf6", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: "10px", background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
            <i className="ti ti-bell-ringing" />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Família Notificada</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#6d28d9" }}>{notificadas}</div>
          </div>
        </Card>

        <Card style={{ padding: "1.25rem", borderLeft: "4px solid #10b981", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: "10px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
            <i className="ti ti-circle-check" />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Resolvidas / Concluídas</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#047857" }}>{resolvidas}</div>
          </div>
        </Card>
      </div>

      {/* PAINEL PRINCIPAL DE CONSULTA E ACOMPANHAMENTO */}
      <Card className="no-print">
        {/* BARRA DE FILTROS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            {/* Filtro Turma */}
            <select
              value={turmaFiltro}
              onChange={(e) => setTurmaFiltro(e.target.value)}
              style={{ padding: "0.45rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white", color: "#334155" }}
            >
              <option value="">Todas as Turmas</option>
              {(turmas || []).map(t => (
                <option key={t.id || t.nome} value={t.nome}>{t.nome}</option>
              ))}
            </select>

            {/* Filtro Tipo */}
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              style={{ padding: "0.45rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white", color: "#334155" }}
            >
              <option value="">Todos os Tipos</option>
              {TIPOS_OCORRENCIA.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Filtro Status */}
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              style={{ padding: "0.45rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white", color: "#334155" }}
            >
              <option value="">Todos os Status</option>
              {STATUS_OCORRENCIA.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            {/* Filtro Gravidade */}
            <select
              value={gravidadeFiltro}
              onChange={(e) => setGravidadeFiltro(e.target.value)}
              style={{ padding: "0.45rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white", color: "#334155" }}
            >
              <option value="">Todas as Gravidades</option>
              {GRAVIDADES_OCORRENCIA.map(g => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </div>

          {/* Campo de Busca */}
          <div style={{ position: "relative", minWidth: 260, flex: "1 1 260px", maxWidth: 380 }}>
            <i className="ti ti-search" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Buscar aluno, código, relato, envolvidos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.75rem 0.45rem 2rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
          </div>
        </div>

        {/* TABELA DE OCORRÊNCIAS */}
        {carregando ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <Spinner />
            <p style={{ marginTop: "0.5rem", color: "#64748b" }}>Carregando acompanhamentos...</p>
          </div>
        ) : ocorrenciasFiltradas.length === 0 ? (
          <EmptyState
            icone="clipboard-check"
            titulo="Nenhuma ocorrência encontrada"
            descricao={busca || turmaFiltro || tipoFiltro ? "Tente ajustar os filtros de pesquisa." : "Nenhuma ocorrência foi registrada para esta escola até o momento."}
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", width: "130px" }}>Código / Data</th>
                  <th style={{ padding: "10px 12px" }}>Estudante / Turma</th>
                  <th style={{ padding: "10px 12px" }}>Tipo & Gravidade</th>
                  <th style={{ padding: "10px 12px" }}>Descrição do Fato</th>
                  <th style={{ padding: "10px 12px" }}>Envolvidos</th>
                  <th style={{ padding: "10px 12px" }}>Registrado Por</th>
                  <th style={{ padding: "10px 12px", width: "130px" }}>Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", width: "140px" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {ocorrenciasFiltradas.map((oc, index) => {
                  const gravidadeInfo = GRAVIDADES_OCORRENCIA.find(g => g.id === oc.gravidade) || GRAVIDADES_OCORRENCIA[1];
                  const statusInfo = STATUS_OCORRENCIA.find(s => s.id === oc.status) || STATUS_OCORRENCIA[0];
                  const qtdAcompanhamentos = (oc.historicoAcompanhamento || []).length;
                  const qtdAnexos = (oc.anexos || []).length;

                  return (
                    <tr
                      key={oc.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: index % 2 === 0 ? "white" : "#fafbfc",
                        transition: "background 0.15s"
                      }}
                    >
                      {/* Código e Data/Hora */}
                      <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: 700, color: "#1e293b", fontFamily: "monospace", fontSize: "0.85rem" }}>
                          {oc.codigo || "OCO-2026"}
                        </div>
                        <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 2 }}>
                          {oc.data ? oc.data.split("-").reverse().join("/") : "—"} · {oc.hora || "—"}
                        </div>
                      </td>

                      {/* Estudante e Turma */}
                      <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {oc.alunoFotoUrl ? (
                              <img src={oc.alunoFotoUrl} alt={oc.alunoNome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <i className="ti ti-user" style={{ color: "#94a3b8", fontSize: "1rem" }} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#1e293b" }}>{oc.alunoNome}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                              Turma: <strong style={{ color: "#334155" }}>{oc.turma || "—"}</strong> {oc.alunoMatricula ? `· Mat: ${oc.alunoMatricula}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tipo e Gravidade */}
                      <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: 600, color: "#334155", maxWidth: "200px", lineHeight: "1.2" }}>
                          {oc.tipo}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <Badge color={gravidadeInfo.cor}>
                            <i className={`ti ti-${gravidadeInfo.icone}`} style={{ marginRight: 3 }} />
                            {gravidadeInfo.label}
                          </Badge>
                        </div>
                      </td>

                      {/* Descrição com Anexos */}
                      <td style={{ padding: "10px 12px", verticalAlign: "top", maxWidth: "260px" }}>
                        <div style={{ color: "#475569", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: "1.3" }}>
                          {oc.descricao}
                        </div>
                        {qtdAnexos > 0 && (
                          <div style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.7rem", color: "#2563eb", background: "#eff6ff", padding: "1px 6px", borderRadius: 4 }}>
                            <i className="ti ti-paperclip" /> {qtdAnexos} {qtdAnexos === 1 ? "anexo" : "anexos"}
                          </div>
                        )}
                      </td>

                      {/* Envolvidos */}
                      <td style={{ padding: "10px 12px", verticalAlign: "top", maxWidth: "160px" }}>
                        <div style={{ color: "#64748b", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {oc.envolvidos || <span style={{ color: "#cbd5e1" }}>Nenhum</span>}
                        </div>
                      </td>

                      {/* Responsável pelo Registro */}
                      <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: 600, color: "#334155" }}>{oc.responsavelRegistro}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{oc.cargoResponsavel || "Servidor(a)"}</div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                        <Badge color={statusInfo.cor}>
                          {statusInfo.label}
                        </Badge>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 3 }}>
                          <i className="ti ti-history" style={{ marginRight: 2 }} /> {qtdAcompanhamentos} {qtdAcompanhamentos === 1 ? "despacho" : "despachos"}
                        </div>
                      </td>

                      {/* Ações */}
                      <td style={{ padding: "10px 12px", verticalAlign: "top", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                          <button
                            onClick={() => {
                              setOcorrenciaSelecionada(oc);
                              setModalAcompanhamentoAberto(true);
                            }}
                            title="Acompanhar ocorrência e ver timeline"
                            style={{
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              color: "#2563eb",
                              padding: "5px 8px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4
                            }}
                          >
                            <i className="ti ti-eye" /> Acompanhar
                          </button>

                          <button
                            onClick={() => {
                              setOcorrenciaSelecionada(oc);
                              setModalImprimirAberto(true);
                            }}
                            title="Imprimir Termo de Ocorrência Oficial"
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #cbd5e1",
                              color: "#334155",
                              padding: "5px 8px",
                              borderRadius: "6px",
                              cursor: "pointer"
                            }}
                          >
                            <i className="ti ti-printer" />
                          </button>

                          <button
                            onClick={(e) => handleExcluirOcorrencia(oc.id, e)}
                            title="Excluir Ocorrência"
                            style={{
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              color: "#dc2626",
                              padding: "5px 8px",
                              borderRadius: "6px",
                              cursor: "pointer"
                            }}
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* 📝 MODAL: NOVO REGISTRO COMPLETO DE OCORRÊNCIA                            */}
      {/* ========================================================================= */}
      {modalNovoAberto && (
        <Modal
          titulo="📝 Registrar Nova Ocorrência Escolar"
          onClose={() => setModalNovoAberto(false)}
          semRodape
          width="740px"
        >
          <form onSubmit={handleSalvarNovaOcorrencia} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Bloco 1: Seleção do Aluno e Turma */}
            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-user" style={{ color: "#2563eb" }} /> Identificação do Estudante
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                    Estudante *
                  </label>
                  <select
                    required
                    value={formNovo.alunoId}
                    onChange={(e) => handleSelecionarAluno(e.target.value)}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }}
                  >
                    <option value="">Selecione o estudante...</option>
                    {(alunos || []).map(a => (
                      <option key={a.id} value={a.id}>
                        {a.nome} — {a.turma || "Sem Turma"} {a.matricula ? `(Mat: ${a.matricula})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                    Turma Atual
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formNovo.turma ? `${formNovo.turma} (${formNovo.ano || ""})` : "—"}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: "0.85rem", background: "#f1f5f9", color: "#64748b" }}
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Data, Hora, Tipo e Gravidade */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                  Data do Fato *
                </label>
                <input
                  type="date"
                  required
                  value={formNovo.data}
                  onChange={(e) => setFormNovo(prev => ({ ...prev, data: e.target.value }))}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                  Hora do Fato *
                </label>
                <input
                  type="time"
                  required
                  value={formNovo.hora}
                  onChange={(e) => setFormNovo(prev => ({ ...prev, hora: e.target.value }))}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                  Tipo de Ocorrência *
                </label>
                <select
                  value={formNovo.tipo}
                  onChange={(e) => setFormNovo(prev => ({ ...prev, tipo: e.target.value }))}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }}
                >
                  {TIPOS_OCORRENCIA.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                  Gravidade *
                </label>
                <select
                  value={formNovo.gravidade}
                  onChange={(e) => setFormNovo(prev => ({ ...prev, gravidade: e.target.value }))}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }}
                >
                  {GRAVIDADES_OCORRENCIA.map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bloco 3: Descrição e Envolvidos */}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                Descrição Detalhada do Fato Ocorrido *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Relate com precisão o que aconteceu, contexto, comportamento observado, local e circunstâncias..."
                value={formNovo.descricao}
                onChange={(e) => setFormNovo(prev => ({ ...prev, descricao: e.target.value }))}
                style={{ width: "100%", padding: "0.65rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                Outros Envolvidos / Testemunhas
              </label>
              <input
                type="text"
                placeholder="Ex: Aluno Pedro Santos (7º B), Profª Mariana, Inspetor Carlos..."
                value={formNovo.envolvidos}
                onChange={(e) => setFormNovo(prev => ({ ...prev, envolvidos: e.target.value }))}
                style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
              />
            </div>

            {/* Bloco 4: Responsável pelo Registro & Encaminhamento Inicial */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.2fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: 3 }}>
                  <i className="ti ti-lock" style={{ color: "#2563eb", fontSize: "0.85rem" }} /> Responsável pelo Registro
                </label>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={formNovo.responsavelRegistro || user?.displayName || user?.email || "Usuário Autenticado"}
                  title="Campo bloqueado: preenchido automaticamente com seu usuário logado no SIGEM."
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    background: "#f1f5f9",
                    color: "#334155",
                    fontWeight: 600,
                    cursor: "not-allowed"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: 3 }}>
                  <i className="ti ti-lock" style={{ color: "#2563eb", fontSize: "0.85rem" }} /> Cargo / Perfil
                </label>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={formNovo.cargoResponsavel || user?.role || "Servidor(a)"}
                  title="Campo bloqueado: preenchido automaticamente com seu perfil de acesso."
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    background: "#f1f5f9",
                    color: "#334155",
                    fontWeight: 600,
                    cursor: "not-allowed"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                  Ação / Encaminhamento Imediato
                </label>
                <select
                  value={formNovo.acaoImediata}
                  onChange={(e) => setFormNovo(prev => ({ ...prev, acaoImediata: e.target.value }))}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }}
                >
                  {ACOES_ENCAMINHAMENTO_OCORRENCIA.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bloco 5: Anexos e Documentos */}
            <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>
                  📎 Anexos (Fotos do ocorrido, termos, atestados, relatórios)
                </span>
                <label style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#2563eb",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}>
                  <i className="ti ti-upload" /> Adicionar Anexos
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleAdicionarAnexo}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {formNovo.anexos && formNovo.anexos.length > 0 ? (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {formNovo.anexos.map(anx => (
                    <div
                      key={anx.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "white",
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.75rem"
                      }}
                    >
                      <i className="ti ti-file" style={{ color: "#2563eb" }} />
                      <span style={{ maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {anx.nome}
                      </span>
                      <span style={{ color: "#94a3b8" }}>({anx.tamanho})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoverAnexo(anx.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0 2px" }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", textAlign: "center", padding: "0.5rem 0" }}>
                  Nenhum anexo adicionado. Suporta fotos e arquivos PDF.
                </div>
              )}
            </div>

            {/* Botões do Rodapé */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Btn variant="default" onClick={() => setModalNovoAberto(false)}>
                Cancelar
              </Btn>
              <Btn variant="primary" type="submit" disabled={salvando}>
                {salvando ? "Registrando..." : "Registrar Ocorrência & Iniciar Acompanhamento"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 🔍 MODAL: PAINEL DE ACOMPANHAMENTO, TIMELINE E DESPACHOS                   */}
      {/* ========================================================================= */}
      {modalAcompanhamentoAberto && ocorrenciaSelecionada && (
        <Modal
          titulo={`🔍 Acompanhamento de Ocorrência — ${ocorrenciaSelecionada.codigo || "OCO-2026"}`}
          onClose={() => setModalAcompanhamentoAberto(false)}
          semRodape
          width="820px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Header da Ocorrência com Status e Ações */}
            <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {ocorrenciaSelecionada.alunoFotoUrl ? (
                      <img src={ocorrenciaSelecionada.alunoFotoUrl} alt={ocorrenciaSelecionada.alunoNome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <i className="ti ti-user" style={{ color: "#94a3b8", fontSize: "1.4rem" }} />
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#1e293b" }}>
                      {ocorrenciaSelecionada.alunoNome}
                    </h3>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>
                      Turma: <strong>{ocorrenciaSelecionada.turma || "—"}</strong> {ocorrenciaSelecionada.alunoMatricula ? `· Matrícula: ${ocorrenciaSelecionada.alunoMatricula}` : ""}
                    </div>
                  </div>
                </div>

                {/* Seletor de Alteração de Status */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Status Atual:</span>
                  <select
                    value={ocorrenciaSelecionada.status}
                    onChange={(e) => handleAlterarStatusRapido(ocorrenciaSelecionada.id, e.target.value)}
                    style={{
                      padding: "0.4rem 0.75rem",
                      borderRadius: "6px",
                      border: "2px solid #2563eb",
                      fontWeight: 700,
                      color: "#1e293b",
                      background: "#eff6ff",
                      fontSize: "0.85rem",
                      cursor: "pointer"
                    }}
                  >
                    {STATUS_OCORRENCIA.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ficha Resumo dos Dados do Fato */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #e2e8f0", fontSize: "0.8rem" }}>
                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Data e Horário</span>
                  <strong style={{ color: "#1e293b" }}>{ocorrenciaSelecionada.data ? ocorrenciaSelecionada.data.split("-").reverse().join("/") : "—"} às {ocorrenciaSelecionada.hora}</strong>
                </div>

                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Tipo da Ocorrência</span>
                  <strong style={{ color: "#1e293b" }}>{ocorrenciaSelecionada.tipo}</strong>
                </div>

                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Gravidade</span>
                  <Badge color={GRAVIDADES_OCORRENCIA.find(g => g.id === ocorrenciaSelecionada.gravidade)?.cor || "blue"}>
                    {GRAVIDADES_OCORRENCIA.find(g => g.id === ocorrenciaSelecionada.gravidade)?.label || "Média"}
                  </Badge>
                </div>

                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Registrado Por</span>
                  <strong style={{ color: "#1e293b" }}>{ocorrenciaSelecionada.responsavelRegistro}</strong>
                </div>
              </div>

              {/* Relato do Fato */}
              <div style={{ marginTop: "0.85rem", background: "white", padding: "0.85rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
                  Relato do Fato
                </div>
                <div style={{ fontSize: "0.85rem", color: "#334155", lineHeight: "1.4" }}>
                  {ocorrenciaSelecionada.descricao}
                </div>
                {ocorrenciaSelecionada.envolvidos && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#64748b" }}>
                    <strong>Envolvidos / Testemunhas:</strong> {ocorrenciaSelecionada.envolvidos}
                  </div>
                )}
              </div>

              {/* Anexos Registrados */}
              {ocorrenciaSelecionada.anexos && ocorrenciaSelecionada.anexos.length > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                    📎 Anexos e Documentos Comprobatórios ({ocorrenciaSelecionada.anexos.length}):
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {ocorrenciaSelecionada.anexos.map(anx => (
                      <a
                        key={anx.id}
                        href={anx.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: "0.75rem",
                          color: "#1e40af",
                          fontWeight: 600
                        }}
                      >
                        <i className="ti ti-download" /> {anx.nome}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* LINHA DO TEMPO DE ACOMPANHAMENTO (TIMELINE) */}
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-timeline" style={{ color: "#2563eb" }} /> Linha do Tempo & Despachos de Acompanhamento
              </div>

              <div style={{ borderLeft: "2px solid #cbd5e1", marginLeft: "1rem", paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {(ocorrenciaSelecionada.historicoAcompanhamento || []).map((desp, i) => (
                  <div key={desp.id || i} style={{ position: "relative" }}>
                    {/* Marcador do Ponto na Timeline */}
                    <div style={{
                      position: "absolute",
                      left: "-1.65rem",
                      top: "2px",
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: i === (ocorrenciaSelecionada.historicoAcompanhamento.length - 1) ? "#2563eb" : "#94a3b8",
                      border: "3px solid white",
                      boxShadow: "0 0 0 1px #cbd5e1"
                    }} />

                    <div style={{ background: "#ffffff", padding: "0.85rem", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.85rem" }}>
                          {desp.tipoAcao || "Despacho"}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          {desp.dataHora ? new Date(desp.dataHora).toLocaleString("pt-BR") : "—"}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.85rem", color: "#475569", lineHeight: "1.4" }}>
                        {desp.descricao}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", paddingTop: "0.4rem", borderTop: "1px solid #f1f5f9", fontSize: "0.75rem" }}>
                        <span style={{ color: "#64748b" }}>
                          Por: <strong>{desp.autor}</strong> ({desp.cargo || "Equipe"})
                        </span>
                        {desp.statusResultante && (
                          <Badge color={STATUS_OCORRENCIA.find(s => s.id === desp.statusResultante)?.cor || "blue"}>
                            {STATUS_OCORRENCIA.find(s => s.id === desp.statusResultante)?.label || desp.statusResultante}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FORMULÁRIO PARA ADICIONAR NOVO DESPACHO */}
            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-plus" style={{ color: "#2563eb" }} /> Adicionar Novo Despacho / Encaminhamento
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                    Tipo de Ação / Encaminhamento
                  </label>
                  <select
                    value={novoDespacho.tipoAcao}
                    onChange={(e) => setNovoDespacho(prev => ({ ...prev, tipoAcao: e.target.value }))}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }}
                  >
                    {ACOES_ENCAMINHAMENTO_OCORRENCIA.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                    Alterar Status Para (Opcional)
                  </label>
                  <select
                    value={novoDespacho.novoStatus}
                    onChange={(e) => setNovoDespacho(prev => ({ ...prev, novoStatus: e.target.value }))}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }}
                  >
                    <option value="">Manter Status Atual ({ocorrenciaSelecionada.status})</option>
                    {STATUS_OCORRENCIA.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                  Relato do Acompanhamento / Providência Adotada *
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Responsável compareceu à escola, tomou ciência do fato e assinou termo de compromisso..."
                  value={novoDespacho.descricao}
                  onChange={(e) => setNovoDespacho(prev => ({ ...prev, descricao: e.target.value }))}
                  style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Autor: <strong>{novoDespacho.autor}</strong>
                </div>
                <Btn variant="primary" onClick={handleSalvarDespacho} disabled={salvandoDespacho || !novoDespacho.descricao.trim()}>
                  {salvandoDespacho ? "Salvando..." : "Salvar Despacho"}
                </Btn>
              </div>
            </div>

            {/* Ações do Rodapé do Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid #e2e8f0" }}>
              <Btn variant="default" onClick={() => { setModalAcompanhamentoAberto(false); setModalImprimirAberto(true); }}>
                <i className="ti ti-printer" /> Imprimir Termo Oficial
              </Btn>
              <Btn variant="default" onClick={() => setModalAcompanhamentoAberto(false)}>
                Fechar
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 📄 MODAL E LAYOUT OFICIAL DE IMPRESSÃO DO TERMO DE OCORRÊNCIA              */}
      {/* ========================================================================= */}
      {modalImprimirAberto && ocorrenciaSelecionada && (
        <Modal
          titulo="📄 Termo Oficial de Ocorrência Escolar"
          onClose={() => setModalImprimirAberto(false)}
          semRodape
          width="780px"
        >
          <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "1rem" }}>
            <Btn variant="primary" onClick={() => window.print()}>
              <i className="ti ti-printer" /> Imprimir Termo (A4)
            </Btn>
            <Btn variant="default" onClick={() => setModalImprimirAberto(false)}>
              Fechar
            </Btn>
          </div>

          {/* VISUALIZAÇÃO E ÁREA DE IMPRESSÃO */}
          <div className="termo-ocorrencia-print" style={{ background: "white", padding: "1.5rem", border: "1px solid #cbd5e1" }}>
            {/* Cabeçalho Institucional */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "14px" }}>
              <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>
                ESTADO DE ALAGOAS · PREFEITURA MUNICIPAL DE PORTO CALVO
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e3a8a", marginTop: 2 }}>
                SECRETARIA MUNICIPAL DE EDUCAÇÃO · {ocorrenciaSelecionada.escolaNome || escolaAtual.nome}
              </div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
                Código INEP: {ocorrenciaSelecionada.escolaInep || "27012345"} · Sistema Integrado de Gestão Escolar (SIGEM)
              </div>
              <div style={{ display: "inline-block", marginTop: 8, border: "1.5px solid #000", padding: "4px 12px", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                TERMO OFICIAL DE OCORRÊNCIA DISCIPLINAR / NOTIFICAÇÃO ESCOLAR
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 700, marginTop: 4, fontFamily: "monospace" }}>
                Registro Nº: {ocorrenciaSelecionada.codigo || "OCO-2026-0001"}
              </div>
            </div>

            {/* Bloco 1: Identificação do Estudante */}
            <div className="termo-box">
              <div className="termo-titulo-box">1. IDENTIFICAÇÃO DO ESTUDANTE</div>
              <div className="termo-grid">
                <div><strong>Nome do Aluno:</strong> {ocorrenciaSelecionada.alunoNome}</div>
                <div><strong>Matrícula:</strong> {ocorrenciaSelecionada.alunoMatricula || "20260012"}</div>
                <div><strong>Turma:</strong> {ocorrenciaSelecionada.turma || "—"} ({ocorrenciaSelecionada.ano || "Ensino Fundamental"})</div>
                <div><strong>Turno:</strong> Matutino / Regular</div>
              </div>
            </div>

            {/* Bloco 2: Dados do Fato Ocorrido */}
            <div className="termo-box">
              <div className="termo-titulo-box">2. DADOS DO FATO REGISTRADO</div>
              <div className="termo-grid" style={{ marginBottom: 6 }}>
                <div><strong>Data:</strong> {ocorrenciaSelecionada.data ? ocorrenciaSelecionada.data.split("-").reverse().join("/") : "—"}</div>
                <div><strong>Horário:</strong> {ocorrenciaSelecionada.hora || "—"}</div>
                <div><strong>Classificação:</strong> {ocorrenciaSelecionada.tipo}</div>
                <div><strong>Gravidade:</strong> {GRAVIDADES_OCORRENCIA.find(g => g.id === ocorrenciaSelecionada.gravidade)?.label || "Média"}</div>
              </div>
              <div style={{ fontSize: 10, marginTop: 6, lineHeight: "1.4" }}>
                <strong>Relato Circunstanciado:</strong><br />
                {ocorrenciaSelecionada.descricao}
              </div>
              {ocorrenciaSelecionada.envolvidos && (
                <div style={{ fontSize: 9.5, marginTop: 4 }}>
                  <strong>Outros Envolvidos / Testemunhas:</strong> {ocorrenciaSelecionada.envolvidos}
                </div>
              )}
            </div>

            {/* Bloco 3: Despachos e Acompanhamentos */}
            <div className="termo-box">
              <div className="termo-titulo-box">3. MEDIDAS PEDAGÓGICAS E ENCAMINHAMENTOS ADOTADOS</div>
              <div style={{ fontSize: 9.5, lineHeight: "1.4" }}>
                {(ocorrenciaSelecionada.historicoAcompanhamento || []).map((h, i) => (
                  <div key={i} style={{ marginBottom: 4, paddingBottom: 4, borderBottom: i < ocorrenciaSelecionada.historicoAcompanhamento.length - 1 ? "1px dashed #ccc" : "none" }}>
                    • <strong>{h.dataHora ? new Date(h.dataHora).toLocaleDateString("pt-BR") : "Data"}:</strong> {h.tipoAcao} — {h.descricao} <em>({h.autor})</em>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloco 4: Termo de Ciência dos Responsáveis */}
            <div className="termo-box">
              <div className="termo-titulo-box">4. CIÊNCIA E COMPROMISSO DA FAMÍLIA</div>
              <div style={{ fontSize: 9.5, lineHeight: "1.4", textAlign: "justify" }}>
                Declaro que fui informado(a) e tomei pleno conhecimento dos fatos descritos nesta ocorrência escolar, comprometendo-me a orientar o(a) estudante e a colaborar ativamente com a equipe gestora e pedagógica no cumprimento do regimento escolar municipal.
              </div>
            </div>

            {/* Assinaturas */}
            <div className="termo-assinaturas">
              <div>
                <div className="termo-linha-ass" />
                <div>Assinatura do(a) Estudante</div>
              </div>
              <div>
                <div className="termo-linha-ass" />
                <div>Pai / Mãe / Responsável Legal</div>
              </div>
              <div>
                <div className="termo-linha-ass" />
                <div>Direção / Coordenação Pedagógica</div>
              </div>
            </div>

            <div style={{ textAlign: "center", fontSize: 8.5, color: "#666", marginTop: 24 }}>
              Documento emitido em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")} via SIGEM.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

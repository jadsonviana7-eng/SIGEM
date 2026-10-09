import { useState, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getAlunos } from "../services/alunosService";
import { getTurmas } from "../services/turmasService";
import { getBoletimCompleto } from "../services/boletimService";
import { ANO_LETIVO_ATUAL } from "../utils/constants";
import { Card, Badge, Btn, Modal, Spinner, EmptyState } from "../components/ui";

export default function Boletim() {
  const { user, escolas, selectedEscolaId } = useAuth();
  const activeEscolaId = selectedEscolaId || user?.selectedEscolaId || "";
  const escolaAtual = (escolas || []).find(e => e.id === activeEscolaId) || {
    nome: "Escola Municipal de Ensino Fundamental",
    inep: "27012345",
    cidade: "Porto Calvo",
    uf: "AL"
  };

  const [anoLetivo, setAnoLetivo] = useState(String(ANO_LETIVO_ATUAL || 2026));
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [carregandoBoletins, setCarregandoBoletins] = useState(false);
  const [boletinsCalculados, setBoletinsCalculados] = useState([]);

  // Modais
  const [alunoBoletimModal, setAlunoBoletimModal] = useState(null); // Modal de Visualização Individual
  const [modalLoteAberto, setModalLoteAberto] = useState(false); // Modal de Impressão em Lote

  // Busca Turmas
  const { dados: turmas, carregando: cTurmas } = useFirestore(
    useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  // Busca Alunos
  const { dados: todosAlunos, carregando: cAlunos } = useFirestore(
    useCallback(() => getAlunos(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  // Inicializa turma padrão
  useEffect(() => {
    if (!turmaSelecionada && turmas && turmas.length > 0) {
      setTurmaSelecionada(turmas[0].nome);
    }
  }, [turmas, turmaSelecionada]);

  // Alunos da Turma Selecionada
  const alunosDaTurma = useMemo(() => {
    if (!todosAlunos || !turmaSelecionada) return [];
    return todosAlunos.filter(a => a.turma === turmaSelecionada && a.status !== "Transferido" && a.status !== "Inativo");
  }, [todosAlunos, turmaSelecionada]);

  // Carrega e calcula boletins para os alunos da turma
  useEffect(() => {
    let ativo = true;

    async function processarBoletins() {
      if (!alunosDaTurma || alunosDaTurma.length === 0) {
        setBoletinsCalculados([]);
        return;
      }

      setCarregandoBoletins(true);
      try {
        const promessas = alunosDaTurma.map(aluno => getBoletimCompleto(aluno, activeEscolaId, anoLetivo));
        const resultados = await Promise.all(promessas);
        if (ativo) {
          setBoletinsCalculados(resultados.filter(Boolean));
        }
      } catch (err) {
        console.error("Erro ao calcular boletins:", err);
      } finally {
        if (ativo) setCarregandoBoletins(false);
      }
    }

    processarBoletins();

    return () => {
      ativo = false;
    };
  }, [alunosDaTurma, activeEscolaId, anoLetivo]);

  // Contadores / Indicadores do Painel
  const contadores = useMemo(() => {
    const total = boletinsCalculados.length;
    const aprovados = boletinsCalculados.filter(b => b.resultadoFinal === "Aprovado").length;
    const recuperacao = boletinsCalculados.filter(b => b.resultadoFinal === "Recuperação").length;
    const reprovados = boletinsCalculados.filter(b => b.resultadoFinal === "Reprovado" || b.resultadoFinal === "Reprovado por Falta").length;
    const cursando = boletinsCalculados.filter(b => b.resultadoFinal === "Cursando").length;

    return { total, aprovados, recuperacao, reprovados, cursando };
  }, [boletinsCalculados]);

  // Filtragem da Lista
  const boletinsFiltrados = useMemo(() => {
    return boletinsCalculados.filter(b => {
      const matchBusca = !busca ||
        (b.alunoNome || "").toLowerCase().includes(busca.toLowerCase()) ||
        (b.alunoMatricula || "").toLowerCase().includes(busca.toLowerCase());

      const matchStatus =
        filtroStatus === "TODOS" ||
        (filtroStatus === "APROVADO" && b.resultadoFinal === "Aprovado") ||
        (filtroStatus === "RECUPERACAO" && b.resultadoFinal === "Recuperação") ||
        (filtroStatus === "REPROVADO" && (b.resultadoFinal === "Reprovado" || b.resultadoFinal === "Reprovado por Falta")) ||
        (filtroStatus === "CURSANDO" && b.resultadoFinal === "Cursando");

      return matchBusca && matchStatus;
    });
  }, [boletinsCalculados, busca, filtroStatus]);

  // Funções de Ação
  function handleVisualizar(boletim) {
    setAlunoBoletimModal(boletim);
  }

  function handleImprimirIndividual() {
    window.print();
  }

  function handleBaixarPDF() {
    // Abre a janela de impressão do navegador onde o usuário salva como PDF em alta resolução
    window.print();
  }

  function handleImprimirLote() {
    setModalLoteAberto(true);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "3rem" }}>
      {/* CSS DE IMPRESSÃO / PDF A4: MARGENS LATERAIS DE 2CM EXCLUSIVAS NA IMPRESSÃO */}
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
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Oculta absolutamente tudo da página, menus, layout, modais e fundos */
          body * {
            visibility: hidden !important;
          }

          /* Exibe exclusivamente o documento oficial de dados do boletim */
          .boletim-print-target,
          .boletim-print-target * {
            visibility: visible !important;
          }

          .boletim-print-target {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 12mm 2cm 12mm 2cm !important; /* 2cm EXATOS DE MARGEM EM CADA LADO */
            box-sizing: border-box !important;
            background: #ffffff !important;
            display: block !important;
          }

          .boletim-container-a4 {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            page-break-after: always !important;
            font-size: 9.5px !important;
            color: #000 !important;
            background: #fff !important;
          }
          .boletim-cabecalho {
            margin-bottom: 6px !important;
            padding-bottom: 4px !important;
            border-bottom: 1.5px solid #000 !important;
            text-align: center !important;
          }
          .boletim-cabecalho h2 {
            font-size: 11px !important;
            margin: 0 !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
            letter-spacing: 0.02em !important;
          }
          .boletim-cabecalho h3 {
            font-size: 9.5px !important;
            margin: 1px 0 !important;
            font-weight: bold !important;
          }
          .boletim-cabecalho p {
            font-size: 8.5px !important;
            margin: 1px 0 !important;
          }
          .boletim-titulo-tag {
            display: inline-block !important;
            border: 1.2px solid #000 !important;
            padding: 2px 8px !important;
            font-weight: bold !important;
            font-size: 9px !important;
            margin-top: 3px !important;
          }
          .boletim-dados-grid {
            display: grid !important;
            grid-template-columns: 2fr 1fr 1fr !important;
            gap: 2px 8px !important;
            background: #f8fafc !important;
            border: 1px solid #000 !important;
            padding: 4px 6px !important;
            font-size: 8.5px !important;
            margin-bottom: 6px !important;
          }
          .boletim-tabela {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 8.5px !important;
            border: 1px solid #000 !important;
            margin-bottom: 6px !important;
          }
          .boletim-tabela th, .boletim-tabela td {
            border: 1px solid #000 !important;
            padding: 2.5px 4px !important;
            line-height: 1.15 !important;
          }
          .boletim-tabela th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
          }
          .boletim-resumo-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 4px !important;
            border: 1.2px solid #000 !important;
            padding: 4px 6px !important;
            margin-bottom: 6px !important;
            background: #f8fafc !important;
            text-align: center !important;
          }
          .boletim-criterios {
            font-size: 7.5px !important;
            border: 1px solid #000 !important;
            padding: 3px 5px !important;
            margin-bottom: 8px !important;
            line-height: 1.2 !important;
          }
          .boletim-assinaturas {
            display: flex !important;
            justify-content: space-around !important;
            margin-top: 50px !important; /* Espaçamento generoso */
            text-align: center !important;
            font-size: 8.5px !important;
            page-break-inside: avoid !important;
          }
          .boletim-assinaturas .linha-assinatura {
            width: 150px !important;
            border-top: 1px solid #000 !important;
            margin: 0 auto 3px !important;
          }
        }
      `}</style>

      {/* CABEÇALHO */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.6rem" }}>📑</span>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--text-primary, #1e293b)" }}>
              Boletim Escolar Digital
            </h1>
          </div>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary, #64748b)", fontSize: "0.9rem" }}>
            Geração automática de boletins, cálculo de médias, frequências e emissão em PDF / Impressão.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Seletor de Turma */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#ffffff", padding: "0.4rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
            <i className="ti ti-books" style={{ color: "#3b82f6" }} />
            <select
              value={turmaSelecionada}
              onChange={(e) => setTurmaSelecionada(e.target.value)}
              style={{ background: "transparent", border: "none", fontWeight: 600, color: "#1e293b", cursor: "pointer", outline: "none", fontSize: "0.9rem" }}
            >
              {(turmas || []).map(t => (
                <option key={t.id || t.nome} value={t.nome}>{t.nome} ({t.turno})</option>
              ))}
            </select>
          </div>

          {/* Botão Impressão em Lote */}
          <Btn
            variante="primario"
            onClick={handleImprimirLote}
            desabilitado={boletinsCalculados.length === 0}
          >
            <i className="ti ti-printer" />
            Imprimir Turma em Lote
          </Btn>
        </div>
      </div>

      {/* CARDS DE SITUAÇÃO AUTOMÁTICA (EXATAMENTE CONFORME SOLICITADO) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {/* 🟢 APROVADOS */}
        <div
          onClick={() => setFiltroStatus("APROVADO")}
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "1.1rem 1.25rem",
            border: "1px solid #bbf7d0",
            boxShadow: "0 2px 6px rgba(34, 197, 94, 0.06)",
            cursor: "pointer",
            borderLeft: "5px solid #22c55e",
            transition: "transform 0.15s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#166534" }}>
              🟢 Aprovados
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
              <i className="ti ti-circle-check" />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#16a34a", marginTop: "0.25rem" }}>
            {contadores.aprovados}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
            Média ≥ 6.0 e Presença ≥ 75%
          </div>
        </div>

        {/* 🟡 RECUPERAÇÃO */}
        <div
          onClick={() => setFiltroStatus("RECUPERACAO")}
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "1.1rem 1.25rem",
            border: "1px solid #fde68a",
            boxShadow: "0 2px 6px rgba(245, 158, 11, 0.06)",
            cursor: "pointer",
            borderLeft: "5px solid #f59e0b",
            transition: "transform 0.15s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#92400e" }}>
              🟡 Recuperação
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
              <i className="ti ti-alert-circle" />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#d97706", marginTop: "0.25rem" }}>
            {contadores.recuperacao}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
            Média entre 4.0 e 5.9
          </div>
        </div>

        {/* 🔴 REPROVADOS */}
        <div
          onClick={() => setFiltroStatus("REPROVADO")}
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "1.1rem 1.25rem",
            border: "1px solid #fecaca",
            boxShadow: "0 2px 6px rgba(239, 68, 68, 0.06)",
            cursor: "pointer",
            borderLeft: "5px solid #ef4444",
            transition: "transform 0.15s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#991b1b" }}>
              🔴 Reprovados
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
              <i className="ti ti-circle-x" />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ef4444", marginTop: "0.25rem" }}>
            {contadores.reprovados}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
            Média &lt; 4.0 ou Faltas &gt; 25%
          </div>
        </div>

        {/* 🔵 CURSANDO */}
        <div
          onClick={() => setFiltroStatus("CURSANDO")}
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "1.1rem 1.25rem",
            border: "1px solid #bfdbfe",
            boxShadow: "0 2px 6px rgba(59, 130, 246, 0.06)",
            cursor: "pointer",
            borderLeft: "5px solid #3b82f6",
            transition: "transform 0.15s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e40af" }}>
              🔵 Cursando
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
              <i className="ti ti-school" />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2563eb", marginTop: "0.25rem" }}>
            {contadores.cursando}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
            Período letivo em andamento
          </div>
        </div>
      </div>

      {/* PAINEL PRINCIPAL DE ALUNOS & BOLETINS */}
      <Card>
        {/* BARRA DE FILTROS & BUSCA */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => setFiltroStatus("TODOS")}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "20px",
                border: filtroStatus === "TODOS" ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                background: filtroStatus === "TODOS" ? "#eff6ff" : "#ffffff",
                color: filtroStatus === "TODOS" ? "#1d4ed8" : "#64748b",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              Todos ({contadores.total})
            </button>
            <button
              onClick={() => setFiltroStatus("APROVADO")}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "20px",
                border: filtroStatus === "APROVADO" ? "1px solid #22c55e" : "1px solid #e2e8f0",
                background: filtroStatus === "APROVADO" ? "#f0fdf4" : "#ffffff",
                color: filtroStatus === "APROVADO" ? "#15803d" : "#64748b",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              🟢 Aprovados ({contadores.aprovados})
            </button>
            <button
              onClick={() => setFiltroStatus("RECUPERACAO")}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "20px",
                border: filtroStatus === "RECUPERACAO" ? "1px solid #f59e0b" : "1px solid #e2e8f0",
                background: filtroStatus === "RECUPERACAO" ? "#fffbeb" : "#ffffff",
                color: filtroStatus === "RECUPERACAO" ? "#d97706" : "#64748b",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              🟡 Recuperação ({contadores.recuperacao})
            </button>
            <button
              onClick={() => setFiltroStatus("REPROVADO")}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "20px",
                border: filtroStatus === "REPROVADO" ? "1px solid #ef4444" : "1px solid #e2e8f0",
                background: filtroStatus === "REPROVADO" ? "#fef2f2" : "#ffffff",
                color: filtroStatus === "REPROVADO" ? "#dc2626" : "#64748b",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              🔴 Reprovados ({contadores.reprovados})
            </button>
            <button
              onClick={() => setFiltroStatus("CURSANDO")}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "20px",
                border: filtroStatus === "CURSANDO" ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                background: filtroStatus === "CURSANDO" ? "#eff6ff" : "#ffffff",
                color: filtroStatus === "CURSANDO" ? "#2563eb" : "#64748b",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              🔵 Cursando ({contadores.cursando})
            </button>
          </div>

          <div style={{ position: "relative", minWidth: 260 }}>
            <i className="ti ti-search" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Buscar aluno ou matrícula..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.75rem 0.45rem 2.2rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
          </div>
        </div>

        {/* TABELA DE ALUNOS COM BOLETIM */}
        {carregandoBoletins || cAlunos ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <Spinner />
            <p style={{ marginTop: "1rem", color: "#64748b" }}>Calculando médias, faltas e gerando boletins...</p>
          </div>
        ) : boletinsFiltrados.length === 0 ? (
          <EmptyState
            icone="certificate"
            titulo="Nenhum boletim encontrado"
            descricao="Não há alunos matriculados ou correspondentes aos filtros selecionados nesta turma."
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Aluno / Matrícula</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Turma & Ano</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "center" }}>Média Geral</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "center" }}>Total Faltas</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "center" }}>% Presença</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Situação / Resultado</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "right" }}>Ações do Boletim</th>
                </tr>
              </thead>
              <tbody>
                {boletinsFiltrados.map((b) => {
                  const isAprovado = b.resultadoFinal === "Aprovado";
                  const isRecuperacao = b.resultadoFinal === "Recuperação";
                  const isReprovado = b.resultadoFinal === "Reprovado" || b.resultadoFinal === "Reprovado por Falta";
                  const isCursando = b.resultadoFinal === "Cursando";

                  return (
                    <tr
                      key={b.alunoId}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.15s"
                      }}
                    >
                      {/* NOME & MATRICULA */}
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>
                          {b.alunoNome}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          Matrícula: {b.alunoMatricula}
                        </span>
                      </td>

                      {/* TURMA */}
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 600, color: "#334155" }}>
                          {b.turma}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          Ano Letivo {b.anoLetivo} · {b.turno}
                        </span>
                      </td>

                      {/* MEDIA GERAL */}
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: "1rem",
                            color: b.mediaGeral === null ? "#94a3b8" : b.mediaGeral >= 6.0 ? "#16a34a" : b.mediaGeral >= 4.0 ? "#d97706" : "#ef4444"
                          }}
                        >
                          {b.mediaGeral !== null ? b.mediaGeral.toFixed(1) : "—"}
                        </span>
                      </td>

                      {/* TOTAL FALTAS */}
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span style={{ fontWeight: 600, color: b.totalFaltas > 40 ? "#ef4444" : "#334155" }}>
                          {b.totalFaltas} {b.totalFaltas === 1 ? "falta" : "faltas"}
                        </span>
                      </td>

                      {/* FREQUÊNCIA */}
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span style={{ fontWeight: 700, color: b.frequenciaPerc >= 75 ? "#16a34a" : "#ef4444" }}>
                          {b.frequenciaPerc}%
                        </span>
                      </td>

                      {/* SITUAÇÃO / RESULTADO COM BADGE COLORIDO */}
                      <td style={{ padding: "1rem" }}>
                        {isAprovado && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#f0fdf4", color: "#166534", padding: "0.3rem 0.75rem", borderRadius: "16px", fontWeight: 700, fontSize: "0.8rem", border: "1px solid #bbf7d0" }}>
                            <span style={{ fontSize: "0.9rem" }}>🟢</span>
                            Aprovado
                          </div>
                        )}
                        {isRecuperacao && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#fffbeb", color: "#b45309", padding: "0.3rem 0.75rem", borderRadius: "16px", fontWeight: 700, fontSize: "0.8rem", border: "1px solid #fde68a" }}>
                            <span style={{ fontSize: "0.9rem" }}>🟡</span>
                            Recuperação
                          </div>
                        )}
                        {isReprovado && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#fef2f2", color: "#b91c1c", padding: "0.3rem 0.75rem", borderRadius: "16px", fontWeight: 700, fontSize: "0.8rem", border: "1px solid #fecaca" }}>
                            <span style={{ fontSize: "0.9rem" }}>🔴</span>
                            Reprovado
                          </div>
                        )}
                        {isCursando && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#eff6ff", color: "#1d4ed8", padding: "0.3rem 0.75rem", borderRadius: "16px", fontWeight: 700, fontSize: "0.8rem", border: "1px solid #bfdbfe" }}>
                            <span style={{ fontSize: "0.9rem" }}>🔵</span>
                            Cursando
                          </div>
                        )}
                      </td>

                      {/* BOTÕES: VISUALIZAR, BAIXAR PDF, IMPRIMIR */}
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem", flexWrap: "wrap" }}>
                          {/* VISUALIZAR */}
                          <button
                            onClick={() => handleVisualizar(b)}
                            title="Visualizar Boletim Escolar"
                            style={{
                              padding: "0.35rem 0.65rem",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#334155",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem"
                            }}
                          >
                            <i className="ti ti-eye" style={{ color: "#3b82f6" }} />
                            Visualizar
                          </button>

                          {/* BAIXAR PDF */}
                          <button
                            onClick={() => {
                              handleVisualizar(b);
                              setTimeout(() => handleBaixarPDF(), 300);
                            }}
                            title="Baixar Boletim em PDF"
                            style={{
                              padding: "0.35rem 0.65rem",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#334155",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem"
                            }}
                          >
                            <i className="ti ti-file-download" style={{ color: "#ef4444" }} />
                            Baixar PDF
                          </button>

                          {/* IMPRIMIR */}
                          <button
                            onClick={() => {
                              handleVisualizar(b);
                              setTimeout(() => handleImprimirIndividual(), 300);
                            }}
                            title="Imprimir Boletim Oficial"
                            style={{
                              padding: "0.35rem 0.65rem",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#334155",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem"
                            }}
                          >
                            <i className="ti ti-printer" style={{ color: "#16a34a" }} />
                            Imprimir
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

      {/* ================= MODAL: VISUALIZAR BOLETIM ESCOLAR OFICIAL ================= */}
      {alunoBoletimModal && (
        <Modal
          titulo={`Boletim Escolar Oficial · ${alunoBoletimModal.alunoNome}`}
          aberto={!!alunoBoletimModal}
          onClose={() => setAlunoBoletimModal(null)}
          width="860px"
          larguraMax="860px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* BOTÕES DE CONTROLE NO TOPO DO MODAL */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem" }}>
              <Btn variante="secundario" onClick={() => handleBaixarPDF()}>
                <i className="ti ti-file-download" /> Baixar PDF
              </Btn>
              <Btn variante="primario" onClick={() => handleImprimirIndividual()}>
                <i className="ti ti-printer" /> Imprimir
              </Btn>
            </div>

            {/* DOCUMENTO DO BOLETIM (FORMATO OFICIAL IMPRESSO TIMBRADO A4) */}
            <div
              id="documento-boletim"
              className="boletim-container-a4 boletim-print-target"
              style={{
                background: "#ffffff",
                padding: "1rem 1.25rem",
                color: "#000000",
                fontFamily: "Arial, sans-serif",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box"
              }}
            >
              {/* CABEÇALHO OFICIAL */}
              <div className="boletim-cabecalho" style={{ textAlign: "center", borderBottom: "1.5px solid #000", paddingBottom: "0.4rem", marginBottom: "0.5rem" }}>
                <h2 style={{ fontSize: "0.9rem", fontWeight: "bold", margin: 0, textTransform: "uppercase" }}>
                  ESTADO DE ALAGOAS · PREFEITURA MUNICIPAL DE PORTO CALVO
                </h2>
                <h3 style={{ fontSize: "0.8rem", fontWeight: "bold", margin: "0.1rem 0", color: "#222" }}>
                  SECRETARIA MUNICIPAL DE EDUCAÇÃO
                </h3>
                <p style={{ fontSize: "0.72rem", margin: "0.1rem 0" }}>
                  <strong>{escolaAtual.nome}</strong> · CÓDIGO INEP: {escolaAtual.inep}
                </p>
                <div className="boletim-titulo-tag" style={{ marginTop: "0.25rem", display: "inline-block", border: "1.2px solid #000", padding: "0.15rem 0.8rem", fontWeight: "bold", fontSize: "0.78rem", letterSpacing: "0.03em" }}>
                  BOLETIM ESCOLAR INDIVIDUAL · ANO LETIVO {alunoBoletimModal.anoLetivo}
                </div>
              </div>

              {/* DADOS CADASTRAIS DO ALUNO */}
              <div className="boletim-dados-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.3rem 0.6rem", background: "#f8fafc", border: "1px solid #000", padding: "0.4rem 0.6rem", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                <div>
                  <strong>Aluno(a):</strong> {alunoBoletimModal.alunoNome.toUpperCase()}
                </div>
                <div>
                  <strong>Matrícula:</strong> {alunoBoletimModal.alunoMatricula}
                </div>
                <div>
                  <strong>Nascimento:</strong> {alunoBoletimModal.nascimento || "01/01/2012"}
                </div>
                <div>
                  <strong>Turma:</strong> {alunoBoletimModal.turma}
                </div>
                <div>
                  <strong>Turno:</strong> {alunoBoletimModal.turno}
                </div>
                <div>
                  <strong>Ano Letivo:</strong> {alunoBoletimModal.anoLetivo}
                </div>
              </div>

              {/* TABELA DE DISCIPLINAS, NOTAS E FALTAS */}
              <table className="boletim-tabela" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.74rem", border: "1px solid #000", marginBottom: "0.5rem" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "center" }}>
                    <th style={{ border: "1px solid #000", padding: "3px 5px", textAlign: "left" }}>Componente Curricular</th>
                    <th style={{ border: "1px solid #000", padding: "3px", width: "42px" }}>1º Bim</th>
                    <th style={{ border: "1px solid #000", padding: "3px", width: "42px" }}>2º Bim</th>
                    <th style={{ border: "1px solid #000", padding: "3px", width: "42px" }}>3º Bim</th>
                    <th style={{ border: "1px solid #000", padding: "3px", width: "42px" }}>4º Bim</th>
                    <th style={{ border: "1px solid #000", padding: "3px", width: "52px" }}>Média Anual</th>
                    <th style={{ border: "1px solid #000", padding: "3px", width: "42px" }}>Recup.</th>
                    <th style={{ border: "1px solid #000", padding: "3px", width: "52px" }}>Média Final</th>
                    <th style={{ border: "1px solid #000", padding: "3px", width: "42px" }}>Faltas</th>
                    <th style={{ border: "1px solid #000", padding: "3px", width: "80px" }}>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {alunoBoletimModal.disciplinas.map((d) => (
                    <tr key={d.disciplina} style={{ textAlign: "center" }}>
                      <td style={{ border: "1px solid #000", padding: "2.5px 5px", textAlign: "left", fontWeight: "bold" }}>
                        {d.disciplina}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "2.5px" }}>{d.b1 !== null ? Number(d.b1).toFixed(1) : "—"}</td>
                      <td style={{ border: "1px solid #000", padding: "2.5px" }}>{d.b2 !== null ? Number(d.b2).toFixed(1) : "—"}</td>
                      <td style={{ border: "1px solid #000", padding: "2.5px" }}>{d.b3 !== null ? Number(d.b3).toFixed(1) : "—"}</td>
                      <td style={{ border: "1px solid #000", padding: "2.5px" }}>{d.b4 !== null ? Number(d.b4).toFixed(1) : "—"}</td>
                      <td style={{ border: "1px solid #000", padding: "2.5px", fontWeight: "bold", background: "#fafafa" }}>
                        {d.media !== null ? Number(d.media).toFixed(1) : "—"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "2.5px" }}>{d.rec !== null ? Number(d.rec).toFixed(1) : "—"}</td>
                      <td style={{ border: "1px solid #000", padding: "2.5px", fontWeight: "bold", background: "#f1f5f9" }}>
                        {d.mediaFinal !== null ? Number(d.mediaFinal).toFixed(1) : "—"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "2.5px" }}>{d.faltas}</td>
                      <td style={{ border: "1px solid #000", padding: "2.5px", fontWeight: "bold", fontSize: "0.68rem" }}>
                        {d.badge}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* QUADRO DE RESULTADO FINAL & FREQUÊNCIA GERAL */}
              <div className="boletim-resumo-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem", border: "1.2px solid #000", padding: "0.4rem", marginBottom: "0.5rem", background: "#f8fafc" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.65rem", color: "#444", textTransform: "uppercase" }}>Média Geral do Aluno</div>
                  <div style={{ fontSize: "1rem", fontWeight: "bold", color: alunoBoletimModal.mediaGeral >= 6.0 ? "#16a34a" : "#ef4444" }}>
                    {alunoBoletimModal.mediaGeral !== null ? alunoBoletimModal.mediaGeral.toFixed(1) : "—"}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.65rem", color: "#444", textTransform: "uppercase" }}>Frequência Global (% Presença)</div>
                  <div style={{ fontSize: "1rem", fontWeight: "bold", color: alunoBoletimModal.frequenciaPerc >= 75 ? "#16a34a" : "#ef4444" }}>
                    {alunoBoletimModal.frequenciaPerc}% ({alunoBoletimModal.totalFaltas} faltas)
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.65rem", color: "#444", textTransform: "uppercase" }}>Resultado Final</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "bold", textTransform: "uppercase" }}>
                    {alunoBoletimModal.resultadoBadge}
                  </div>
                </div>
              </div>

              {/* CRITÉRIOS DE AVALIAÇÃO & OBSERVAÇÕES */}
              <div className="boletim-criterios" style={{ fontSize: "0.68rem", border: "1px solid #000", padding: "0.3rem 0.5rem", marginBottom: "0.75rem", lineHeight: 1.25 }}>
                <strong>CRITÉRIOS DE AVALIAÇÃO:</strong> Média Mínima para Aprovação Direta: <strong>6.0</strong> | Frequência Mínima Exigida por Lei: <strong>75%</strong> da Carga Horária.
                <br />
                <strong>OBSERVAÇÕES:</strong> Documento oficial emitido eletronicamente pelo Sistema de Gestão Escolar Municipal (SIGEM).
              </div>

              {/* ASSINATURAS MOVIDAS 50PX PARA BAIXO */}
              <div
                className="boletim-assinaturas"
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  marginTop: "50px", /* 50px de espaçamento para as assinaturas */
                  textAlign: "center",
                  fontSize: "0.72rem"
                }}
              >
                <div>
                  <div className="linha-assinatura" style={{ width: "160px", borderTop: "1px solid #000", margin: "0 auto 3px" }} />
                  <strong>Professor(a) Regente</strong>
                </div>
                <div>
                  <div className="linha-assinatura" style={{ width: "160px", borderTop: "1px solid #000", margin: "0 auto 3px" }} />
                  <strong>Coordenação Pedagógica</strong>
                </div>
                <div>
                  <div className="linha-assinatura" style={{ width: "160px", borderTop: "1px solid #000", margin: "0 auto 3px" }} />
                  <strong>Direção Escolar</strong>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: IMPRESSÃO EM LOTE DE TODA A TURMA ================= */}
      {modalLoteAberto && (
        <Modal
          titulo={`Impressão em Lote · Boletins da Turma ${turmaSelecionada}`}
          aberto={modalLoteAberto}
          onClose={() => setModalLoteAberto(false)}
          larguraMax="900px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="no-print" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.85rem", borderRadius: "8px", fontSize: "0.85rem", color: "#1e40af" }}>
              <i className="ti ti-info-circle" style={{ marginRight: 6 }} />
              Pronto para imprimir <strong>{boletinsCalculados.length} boletins escolares</strong> da turma <strong>{turmaSelecionada}</strong> no formato oficial A4.
            </div>

            {/* LISTAGEM NA TELA */}
            <div className="no-print" style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.5rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "6px" }}>Aluno</th>
                    <th style={{ padding: "6px" }}>Matrícula</th>
                    <th style={{ padding: "6px", textAlign: "center" }}>Média</th>
                    <th style={{ padding: "6px", textAlign: "center" }}>% Presença</th>
                    <th style={{ padding: "6px" }}>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {boletinsCalculados.map(b => (
                    <tr key={b.alunoId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "6px", fontWeight: "bold" }}>{b.alunoNome}</td>
                      <td style={{ padding: "6px" }}>{b.alunoMatricula}</td>
                      <td style={{ padding: "6px", textAlign: "center", fontWeight: "bold" }}>{b.mediaGeral !== null ? b.mediaGeral.toFixed(1) : "—"}</td>
                      <td style={{ padding: "6px", textAlign: "center" }}>{b.frequenciaPerc}%</td>
                      <td style={{ padding: "6px" }}>{b.resultadoBadge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CONTAINER VISÍVEL EXCLUSIVAMENTE NA IMPRESSÃO EM LOTE (1 ALUNO POR FOLHA A4) */}
            <div className="print-lote-folhas boletim-print-target" style={{ display: "none" }}>
              {boletinsCalculados.map((b) => (
                <div key={b.alunoId} className="boletim-container-a4">
                  {/* CABEÇALHO */}
                  <div className="boletim-cabecalho">
                    <h2>ESTADO DE ALAGOAS · PREFEITURA MUNICIPAL DE PORTO CALVO</h2>
                    <h3>SECRETARIA MUNICIPAL DE EDUCAÇÃO</h3>
                    <p><strong>{escolaAtual.nome}</strong> · CÓDIGO INEP: {escolaAtual.inep}</p>
                    <div className="boletim-titulo-tag">
                      BOLETIM ESCOLAR INDIVIDUAL · ANO LETIVO {b.anoLetivo}
                    </div>
                  </div>

                  {/* DADOS CADASTRAIS */}
                  <div className="boletim-dados-grid">
                    <div><strong>Aluno(a):</strong> {b.alunoNome.toUpperCase()}</div>
                    <div><strong>Matrícula:</strong> {b.alunoMatricula}</div>
                    <div><strong>Nascimento:</strong> {b.nascimento || "01/01/2012"}</div>
                    <div><strong>Turma:</strong> {b.turma}</div>
                    <div><strong>Turno:</strong> {b.turno}</div>
                    <div><strong>Ano Letivo:</strong> {b.anoLetivo}</div>
                  </div>

                  {/* TABELA */}
                  <table className="boletim-tabela">
                    <thead>
                      <tr style={{ background: "#f1f5f9", textAlign: "center" }}>
                        <th style={{ textAlign: "left" }}>Componente Curricular</th>
                        <th style={{ width: "45px" }}>1º Bim</th>
                        <th style={{ width: "45px" }}>2º Bim</th>
                        <th style={{ width: "45px" }}>3º Bim</th>
                        <th style={{ width: "45px" }}>4º Bim</th>
                        <th style={{ width: "55px" }}>Média Anual</th>
                        <th style={{ width: "45px" }}>Recup.</th>
                        <th style={{ width: "55px" }}>Média Final</th>
                        <th style={{ width: "45px" }}>Faltas</th>
                        <th style={{ width: "85px" }}>Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {b.disciplinas.map((d) => (
                        <tr key={d.disciplina} style={{ textAlign: "center" }}>
                          <td style={{ textAlign: "left", fontWeight: "bold" }}>{d.disciplina}</td>
                          <td>{d.b1 !== null ? Number(d.b1).toFixed(1) : "—"}</td>
                          <td>{d.b2 !== null ? Number(d.b2).toFixed(1) : "—"}</td>
                          <td>{d.b3 !== null ? Number(d.b3).toFixed(1) : "—"}</td>
                          <td>{d.b4 !== null ? Number(d.b4).toFixed(1) : "—"}</td>
                          <td style={{ fontWeight: "bold", background: "#fafafa" }}>{d.media !== null ? Number(d.media).toFixed(1) : "—"}</td>
                          <td>{d.rec !== null ? Number(d.rec).toFixed(1) : "—"}</td>
                          <td style={{ fontWeight: "bold", background: "#f1f5f9" }}>{d.mediaFinal !== null ? Number(d.mediaFinal).toFixed(1) : "—"}</td>
                          <td>{d.faltas}</td>
                          <td style={{ fontWeight: "bold", fontSize: "0.72rem" }}>{d.badge}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* RESUMO */}
                  <div className="boletim-resumo-grid">
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "#444", textTransform: "uppercase" }}>Média Geral</div>
                      <div style={{ fontSize: "1.15rem", fontWeight: "bold", color: b.mediaGeral >= 6.0 ? "#16a34a" : "#ef4444" }}>
                        {b.mediaGeral !== null ? b.mediaGeral.toFixed(1) : "—"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "#444", textTransform: "uppercase" }}>Frequência Global</div>
                      <div style={{ fontSize: "1.15rem", fontWeight: "bold", color: b.frequenciaPerc >= 75 ? "#16a34a" : "#ef4444" }}>
                        {b.frequenciaPerc}% ({b.totalFaltas} faltas)
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "#444", textTransform: "uppercase" }}>Resultado Final</div>
                      <div style={{ fontSize: "1rem", fontWeight: "bold", textTransform: "uppercase" }}>
                        {b.resultadoBadge}
                      </div>
                    </div>
                  </div>

                  {/* CRITERIOS */}
                  <div className="boletim-criterios">
                    <strong>CRITÉRIOS DE AVALIAÇÃO:</strong> Média Mínima para Aprovação Direta: <strong>6.0</strong> | Frequência Mínima Exigida por Lei: <strong>75%</strong> da Carga Horária.
                    <br />
                    <strong>OBSERVAÇÕES:</strong> Documento oficial emitido eletronicamente pelo Sistema de Gestão Escolar Municipal (SIGEM).
                  </div>

                  {/* ASSINATURAS MOVIDAS 50PX PARA BAIXO */}
                  <div className="boletim-assinaturas">
                    <div>
                      <div className="linha-assinatura" />
                      <strong>Professor(a) Regente</strong>
                    </div>
                    <div>
                      <div className="linha-assinatura" />
                      <strong>Coordenação Pedagógica</strong>
                    </div>
                    <div>
                      <div className="linha-assinatura" />
                      <strong>Direção Escolar</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Btn variante="secundario" onClick={() => setModalLoteAberto(false)}>
                Fechar
              </Btn>
              <Btn variante="primario" onClick={() => window.print()}>
                <i className="ti ti-printer" /> Imprimir Todos os {boletinsCalculados.length} Boletins
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

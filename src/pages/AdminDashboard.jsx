import React, { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getEscolas, addEscola, updateEscola, deleteEscola } from "../services/escolasService";
import { getAllAlunos } from "../services/alunosService";
import { getAllProfessores } from "../services/professoresService";
import { getAllTurmas } from "../services/turmasService";
import { getAllTransacoes } from "../services/financeiroService";
import { Card, Badge, Btn, Modal, Input, Select, Spinner, EmptyState } from "../components/ui";
import { formatCNPJ } from "../utils/masks";
import { comprimirEUploadFoto } from "../utils/upload";
import CropModal from "../components/CropModal";
import { useNavigate } from "react-router-dom";

import AlertasSecretaria from "./gestaoSecretaria/components/AlertasSecretaria";
import KpisCentroComando from "./gestaoSecretaria/components/KpisCentroComando";
import GraficosComparativosRede from "./gestaoSecretaria/components/GraficosComparativosRede";

const VAZIO_ESCOLA = {
  nome: "",
  cnpj: "",
  inep: "",
  municipio: "Maceió",
  uf: "AL",
  status: "Ativa",
  fotoUrl: "",
  endereco: "",
  zona: "Urbana",
  telefone: "",
  email: "",
  diretor: ""
};

export default function AdminDashboard({ onSelecionarVisaoEscola }) {
  const { selectedEscolaId, alterarEscolaAtiva, recarregarEscolas } = useAuth();
  const navigate = useNavigate();

  // Estados de dados da rede
  const { dados: escolas, carregando: cEsc, recarregar: recarregarEscolasLocais } = useFirestore(getEscolas);
  const { dados: todosAlunos, carregando: cAlunos, recarregar: recarregarAlunos } = useFirestore(getAllAlunos);
  const { dados: todosProfessores, carregando: cProf, recarregar: recarregarProfessores } = useFirestore(getAllProfessores);
  const { dados: todasTurmas, carregando: cTurmas, recarregar: recarregarTurmas } = useFirestore(getAllTurmas);
  const { dados: todasTransacoes } = useFirestore(getAllTransacoes);

  // Estados de Filtros e Busca
  const [busca, setBusca] = useState("");
  const [filtroZona, setFiltroZona] = useState("Todas");
  const [filtroStatus, setFiltroStatus] = useState("Todas");
  const [filtroMunicipio, setFiltroMunicipio] = useState("Todos");
  const [modoVisualizacao, setModoVisualizacao] = useState("cards"); // 'cards' ou 'tabela'
  const [ordenacao, setOrdenacao] = useState("nome"); // 'nome', 'alunos', 'turmas', 'professores'

  // Estados do Modal de Criação / Edição de Escola
  const [modalAberto, setModalAberto] = useState(false);
  const [escolaEditando, setEscolaEditando] = useState(null);
  const [formEscola, setFormEscola] = useState(VAZIO_ESCOLA);
  const [salvando, setSalvando] = useState(false);

  // Crop de Foto
  const [cropFile, setCropFile] = useState(null);

  // Função para recarregar tudo
  const recarregarTodosDados = async () => {
    await Promise.all([
      recarregarEscolasLocais(),
      recarregarEscolas(),
      recarregarAlunos(),
      recarregarProfessores(),
      recarregarTurmas()
    ]);
  };

  // Handlers do Modal de Escola
  const abrirNovaEscola = () => {
    setFormEscola(VAZIO_ESCOLA);
    setEscolaEditando(null);
    setModalAberto(true);
  };

  const abrirEditarEscola = (escola, e) => {
    if (e) e.stopPropagation();
    setFormEscola({ ...VAZIO_ESCOLA, ...escola });
    setEscolaEditando(escola.id);
    setModalAberto(true);
  };

  const handleSalvarEscola = async () => {
    if (!formEscola.nome.trim()) {
      alert("O nome da escola é obrigatório.");
      return;
    }
    setSalvando(true);
    try {
      if (escolaEditando) {
        await updateEscola(escolaEditando, formEscola);
      } else {
        await addEscola(formEscola);
      }
      setModalAberto(false);
      await recarregarTodosDados();
    } catch (err) {
      console.error("Erro ao salvar escola:", err);
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleRemoverEscola = async (escola, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Deseja realmente remover a escola "${escola.nome}"? Os dados associados a ela permanecerão no banco de dados.`)) return;
    try {
      await deleteEscola(escola.id);
      await recarregarTodosDados();
    } catch (err) {
      alert("Erro ao remover escola: " + err.message);
    }
  };

  const handleSelecionarEscolaAtiva = (escolaId, rotaDestino = null) => {
    alterarEscolaAtiva(escolaId);
    if (rotaDestino) {
      navigate(rotaDestino);
    } else if (onSelecionarVisaoEscola) {
      onSelecionarVisaoEscola(escolaId);
    }
  };

  // Processamento de Fotos
  const handleCropConfirm = async (croppedBlob) => {
    setCropFile(null);
    try {
      const url = await comprimirEUploadFoto(croppedBlob, "escolas", escolaEditando || Date.now().toString());
      setFormEscola((f) => ({ ...f, fotoUrl: url }));
    } catch (err) {
      alert("Erro ao processar imagem: " + err.message);
    }
  };

  // Mapeamento e Estatísticas por Escola
  const estatisticasPorEscola = useMemo(() => {
    const mapa = {};
    (escolas || []).forEach((esc) => {
      mapa[esc.id] = {
        escola: esc,
        totalAlunos: 0,
        alunosAtivos: 0,
        alunosTransferidos: 0,
        totalProfessores: 0,
        professoresAtivos: 0,
        totalTurmas: 0,
        receitas: 0,
        despesas: 0,
        saldo: 0
      };
    });

    (todosAlunos || []).forEach((a) => {
      if (mapa[a.escolaId]) {
        mapa[a.escolaId].totalAlunos += 1;
        if (a.status === "Ativo" || !a.status) mapa[a.escolaId].alunosAtivos += 1;
        if (a.status === "Transferido") mapa[a.escolaId].alunosTransferidos += 1;
      }
    });

    (todosProfessores || []).forEach((p) => {
      if (mapa[p.escolaId]) {
        mapa[p.escolaId].totalProfessores += 1;
        if (p.status === "Ativo" || !p.status) mapa[p.escolaId].professoresAtivos += 1;
      }
    });

    (todasTurmas || []).forEach((t) => {
      if (mapa[t.escolaId]) {
        mapa[t.escolaId].totalTurmas += 1;
      }
    });

    (todasTransacoes || []).forEach((tr) => {
      if (mapa[tr.escolaId]) {
        const val = Number(tr.valor) || 0;
        if (tr.tipo === "Receita") mapa[tr.escolaId].receitas += val;
        if (tr.tipo === "Despesa") mapa[tr.escolaId].despesas += val;
      }
    });

    Object.values(mapa).forEach((item) => {
      item.saldo = item.receitas - item.despesas;
    });

    return mapa;
  }, [escolas, todosAlunos, todosProfessores, todasTurmas, todasTransacoes]);

  // Lista de Municípios Únicos
  const municipiosUnicos = useMemo(() => {
    const lista = (escolas || []).map((e) => e.municipio).filter(Boolean);
    return Array.from(new Set(lista)).sort();
  }, [escolas]);

  // Escolas Filtradas e Ordenadas
  const escolasExibicao = useMemo(() => {
    return (escolas || [])
      .filter((esc) => {
        const matchBusca =
          (esc.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
          (esc.inep || "").toLowerCase().includes(busca.toLowerCase()) ||
          (esc.municipio || "").toLowerCase().includes(busca.toLowerCase());
        const matchZona = filtroZona === "Todas" || esc.zona === filtroZona;
        const matchStatus = filtroStatus === "Todas" || (esc.status || "Ativa") === filtroStatus;
        const matchMuni = filtroMunicipio === "Todos" || esc.municipio === filtroMunicipio;
        return matchBusca && matchZona && matchStatus && matchMuni;
      })
      .sort((a, b) => {
        const statsA = estatisticasPorEscola[a.id] || {};
        const statsB = estatisticasPorEscola[b.id] || {};
        if (ordenacao === "alunos") return (statsB.totalAlunos || 0) - (statsA.totalAlunos || 0);
        if (ordenacao === "professores") return (statsB.totalProfessores || 0) - (statsA.totalProfessores || 0);
        if (ordenacao === "turmas") return (statsB.totalTurmas || 0) - (statsA.totalTurmas || 0);
        return (a.nome || "").localeCompare(b.nome || "");
      });
  }, [escolas, busca, filtroZona, filtroStatus, filtroMunicipio, ordenacao, estatisticasPorEscola]);

  const imprimirRelatorioExecutivo = () => {
    const printWin = window.open("", "_blank", "width=900,height=900");
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Executivo da Rede Municipal - Gestão da Secretaria</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 25px; }
          .title { font-size: 22px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin-top: 8px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .kpi { border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; text-align: center; background: #f8fafc; }
          .kpi-val { font-size: 22px; font-weight: bold; color: #1e3a8a; }
          .kpi-lbl { font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>SECRETARIA MUNICIPAL DE EDUCAÇÃO</h2>
          <div class="title">RELATÓRIO EXECUTIVO DA REDE MUNICIPAL — CENTRO DE COMANDO</div>
          <p style="margin: 5px 0 0 0; color: #64748b;">Posição Consolidada em ${new Date().toLocaleDateString("pt-BR")}</p>
        </div>

        <div class="grid">
          <div class="kpi"><div class="kpi-val">${escolas.length}</div><div class="kpi-lbl">Total de Escolas</div></div>
          <div class="kpi"><div class="kpi-val">${todosAlunos.length}</div><div class="kpi-lbl">Total de Alunos</div></div>
          <div class="kpi"><div class="kpi-val">${todosProfessores.length}</div><div class="kpi-lbl">Corpo Docente</div></div>
          <div class="kpi"><div class="kpi-val">${todasTurmas.length}</div><div class="kpi-lbl">Turmas Ativas</div></div>
        </div>

        <h3>Resumo das Unidades Escolares</h3>
        <table>
          <thead>
            <tr>
              <th>Escola</th>
              <th>INEP</th>
              <th>Zona</th>
              <th>Direção</th>
              <th style="text-align: center;">Alunos</th>
              <th style="text-align: center;">Professores</th>
              <th style="text-align: center;">Turmas</th>
            </tr>
          </thead>
          <tbody>
            ${escolasExibicao.map((e) => {
              const st = estatisticasPorEscola[e.id] || {};
              return `
                <tr>
                  <td><strong>${e.nome}</strong></td>
                  <td>${e.inep || "—"}</td>
                  <td>${e.zona || "Urbana"}</td>
                  <td>${e.diretor || "—"}</td>
                  <td style="text-align: center;">${st.totalAlunos || 0}</td>
                  <td style="text-align: center;">${st.totalProfessores || 0}</td>
                  <td style="text-align: center;">${st.totalTurmas || 0}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  if (cEsc || cAlunos || cProf || cTurmas) {
    return <Spinner />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. HERO BANNER DO CENTRO DE COMANDO */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)",
          borderRadius: "16px",
          padding: "26px 30px",
          color: "white",
          boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.4)",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "18px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              <i className="ti ti-dashboard" style={{ marginRight: "6px" }} /> Gestão da Secretaria
            </span>
            <span style={{ fontSize: "12px", opacity: "0.85" }}>
              Ano Letivo {new Date().getFullYear()} · Rede Municipal
            </span>
          </div>

          <h1 style={{ fontSize: "26px", fontWeight: "800", margin: "4px 0 8px 0", letterSpacing: "-0.5px" }}>
            Centro de Comando da Secretaria & Dashboard Municipal
          </h1>

          <p style={{ fontSize: "14px", opacity: "0.9", margin: 0, maxWidth: "700px", lineHeight: "1.5" }}>
            Painel executivo de monitoramento integrado da educação municipal. Acompanhe indicadores de
            matrículas, frequência, corpo docente, rendimento escolar e alertas em tempo real.
          </p>
        </div>

        {/* Ações Rápidas do Topo */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={abrirNovaEscola}
            style={{
              background: "#fff",
              color: "#1e3a8a",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              transition: "transform 0.15s ease"
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <i className="ti ti-plus" style={{ fontSize: "16px" }} /> Cadastrar Nova Escola
          </button>

          <button
            onClick={imprimirRelatorioExecutivo}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <i className="ti ti-printer" /> Relatório Executivo
          </button>

          <button
            onClick={recarregarTodosDados}
            title="Recarregar dados da rede"
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            <i className="ti ti-refresh" />
          </button>
        </div>
      </div>

      {/* 2. ÁREA DE ALERTAS INTELIGENTES DA REDE */}
      <AlertasSecretaria
        alunos={todosAlunos}
        turmas={todasTurmas}
        professores={todosProfessores}
        escolas={escolas}
      />

      {/* 3. CARDS DE KPIS DO CENTRO DE COMANDO */}
      <KpisCentroComando
        escolas={escolas}
        alunos={todosAlunos}
        professores={todosProfessores}
        turmas={todasTurmas}
      />

      {/* 4. DISTRIBUIÇÃO POR ETAPAS E GRÁFICOS COMPARATIVOS ENTRE ESCOLAS */}
      <GraficosComparativosRede
        escolas={escolas}
        alunos={todosAlunos}
        turmas={todasTurmas}
        estatisticasPorEscola={estatisticasPorEscola}
      />

      {/* 5. BARRA DE FILTROS E BUSCA DE UNIDADES ESCOLARES */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          padding: "16px 20px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          border: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: "220px" }}>
          <i
            className="ti ti-search"
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
              fontSize: "15px"
            }}
          />
          <input
            type="text"
            placeholder="Buscar por nome da escola, INEP ou município..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
              outline: "none",
              color: "#1f2937",
              boxSizing: "border-box"
            }}
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#9ca3af"
              }}
            >
              <i className="ti ti-x" />
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
              background: "white",
              color: "#374151",
              cursor: "pointer"
            }}
          >
            <option value="Todas">Todas as Zonas</option>
            <option value="Urbana">Zona Urbana</option>
            <option value="Rural">Zona Rural</option>
          </select>

          {municipiosUnicos.length > 1 && (
            <select
              value={filtroMunicipio}
              onChange={(e) => setFiltroMunicipio(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "13px",
                background: "white",
                color: "#374151",
                cursor: "pointer"
              }}
            >
              <option value="Todos">Todos os Municípios</option>
              {municipiosUnicos.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
              background: "white",
              color: "#374151",
              cursor: "pointer"
            }}
          >
            <option value="Todas">Todos os Status</option>
            <option value="Ativa">Ativas</option>
            <option value="Inativa">Inativas</option>
          </select>

          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
              background: "white",
              color: "#374151",
              cursor: "pointer"
            }}
          >
            <option value="nome">Ordenar por Nome</option>
            <option value="alunos">Maior nº de Alunos</option>
            <option value="turmas">Maior nº de Turmas</option>
            <option value="professores">Maior nº de Professores</option>
          </select>

          <div style={{ display: "flex", border: "1px solid #d1d5db", borderRadius: "8px", overflow: "hidden" }}>
            <button
              onClick={() => setModoVisualizacao("cards")}
              style={{
                padding: "7px 12px",
                border: "none",
                background: modoVisualizacao === "cards" ? "#1e3a8a" : "white",
                color: modoVisualizacao === "cards" ? "white" : "#6b7280",
                cursor: "pointer",
                fontSize: "13px"
              }}
              title="Visualização em Cartões"
            >
              <i className="ti ti-layout-grid" />
            </button>
            <button
              onClick={() => setModoVisualizacao("tabela")}
              style={{
                padding: "7px 12px",
                border: "none",
                background: modoVisualizacao === "tabela" ? "#1e3a8a" : "white",
                color: modoVisualizacao === "tabela" ? "white" : "#6b7280",
                cursor: "pointer",
                fontSize: "13px"
              }}
              title="Visualização em Tabela"
            >
              <i className="ti ti-table" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. LISTA / GRADE DE ESCOLAS DA REDE */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#111827", margin: 0 }}>
            Unidades Escolares da Rede ({escolasExibicao.length})
          </h2>
          <span style={{ fontSize: "13px", color: "#6b7280" }}>
            Clique em <b>Acessar Escola</b> para gerenciar turmas, alunos e cadernetas da unidade.
          </span>
        </div>

        {escolasExibicao.length === 0 ? (
          <EmptyState
            icon="ti ti-school"
            title="Nenhuma escola encontrada"
            description="Não há unidades correspondentes aos filtros aplicados."
          />
        ) : modoVisualizacao === "cards" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "18px"
            }}
          >
            {escolasExibicao.map((escola) => {
              const stats = estatisticasPorEscola[escola.id] || {};
              const isAtivaSelecionada = selectedEscolaId === escola.id;

              return (
                <div
                  key={escola.id}
                  style={{
                    background: "white",
                    borderRadius: "14px",
                    border: isAtivaSelecionada ? "2px solid #2563eb" : "1px solid #e5e7eb",
                    boxShadow: isAtivaSelecionada
                      ? "0 10px 25px -5px rgba(37, 99, 235, 0.2)"
                      : "0 4px 16px rgba(0, 0, 0, 0.04)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative"
                  }}
                >
                  {isAtivaSelecionada && (
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "#2563eb",
                        color: "white",
                        fontSize: "10px",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <i className="ti ti-check" /> ESCOLA ATIVA
                    </div>
                  )}

                  <div style={{ padding: "18px 20px", display: "flex", gap: "14px", alignItems: "center" }}>
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "12px",
                        background: escola.fotoUrl ? "transparent" : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        fontWeight: "700",
                        flexShrink: 0,
                        overflow: "hidden",
                        border: "1px solid #e2e8f0"
                      }}
                    >
                      {escola.fotoUrl ? (
                        <img src={escola.fotoUrl} alt={escola.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        escola.nome?.slice(0, 2).toUpperCase() || "EM"
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "#111827",
                          margin: "0 0 2px 0",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {escola.nome}
                      </h3>

                      <div style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                        <i className="ti ti-map-pin" style={{ fontSize: "13px", color: "#9ca3af" }} />
                        <span>
                          {escola.municipio || "Maceió"} - {escola.uf || "AL"}
                        </span>
                        <span style={{ color: "#d1d5db" }}>•</span>
                        <Badge variant={escola.zona === "Rural" ? "warning" : "blue"}>
                          {escola.zona || "Urbana"}
                        </Badge>
                      </div>

                      {escola.inep && (
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                          INEP: <span style={{ fontFamily: "monospace", color: "#4b5563" }}>{escola.inep}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px 20px",
                      background: "#f9fafb",
                      borderTop: "1px solid #f3f4f6",
                      borderBottom: "1px solid #f3f4f6",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "8px",
                      textAlign: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" }}>Alunos</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#1e3a8a" }}>{stats.totalAlunos || 0}</div>
                      <div style={{ fontSize: "10px", color: "#10b981" }}>{stats.alunosAtivos || 0} ativos</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" }}>Professores</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#d97706" }}>{stats.totalProfessores || 0}</div>
                      <div style={{ fontSize: "10px", color: "#6b7280" }}>docentes</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" }}>Turmas</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#7c3aed" }}>{stats.totalTurmas || 0}</div>
                      <div style={{ fontSize: "10px", color: "#6b7280" }}>em curso</div>
                    </div>
                  </div>

                  {(escola.diretor || escola.telefone) && (
                    <div style={{ padding: "10px 20px", fontSize: "12px", color: "#4b5563", display: "flex", flexDirection: "column", gap: "3px" }}>
                      {escola.diretor && (
                        <div>
                          <i className="ti ti-user" style={{ marginRight: "6px", color: "#9ca3af" }} />
                          <b>Diretor(a):</b> {escola.diretor}
                        </div>
                      )}
                      {escola.telefone && (
                        <div>
                          <i className="ti ti-phone" style={{ marginRight: "6px", color: "#9ca3af" }} />
                          {escola.telefone}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "auto",
                      padding: "14px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px"
                    }}
                  >
                    <button
                      onClick={() => handleSelecionarEscolaAtiva(escola.id)}
                      style={{
                        flex: 1,
                        background: isAtivaSelecionada ? "#1e3a8a" : "#eff6ff",
                        color: isAtivaSelecionada ? "white" : "#1d4ed8",
                        border: isAtivaSelecionada ? "1px solid #1e3a8a" : "1px solid #bfdbfe",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <i className="ti ti-layout-dashboard" />
                      {isAtivaSelecionada ? "Gerenciando Esta Escola" : "Acessar Painel da Escola"}
                    </button>

                    <button
                      onClick={(e) => abrirEditarEscola(escola, e)}
                      title="Editar dados da escola"
                      style={{
                        padding: "8px 10px",
                        background: "white",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        color: "#4b5563",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      <i className="ti ti-pencil" />
                    </button>

                    <button
                      onClick={(e) => handleRemoverEscola(escola, e)}
                      title="Excluir escola"
                      style={{
                        padding: "8px 10px",
                        background: "white",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        color: "#dc2626",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Escola</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>INEP</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Município</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>Zona</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569", textAlign: "center" }}>Alunos</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569", textAlign: "center" }}>Professores</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569", textAlign: "center" }}>Turmas</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#475569", textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {escolasExibicao.map((escola) => {
                    const stats = estatisticasPorEscola[escola.id] || {};
                    const isAtiva = selectedEscolaId === escola.id;

                    return (
                      <tr key={escola.id} style={{ borderBottom: "1px solid #f1f5f9", background: isAtiva ? "#f0fdf4" : "white" }}>
                        <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1e293b" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px",
                                background: "#e2e8f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: "700",
                                color: "#1e3a8a",
                                overflow: "hidden"
                              }}
                            >
                              {escola.fotoUrl ? (
                                <img src={escola.fotoUrl} alt={escola.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                escola.nome?.slice(0, 2).toUpperCase() || "EM"
                              )}
                            </div>
                            <div>
                              <div>{escola.nome}</div>
                              {isAtiva && <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: "700" }}>● Ativa</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#64748b" }}>{escola.inep || "-"}</td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>
                          {escola.municipio} - {escola.uf}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <Badge variant={escola.zona === "Rural" ? "warning" : "blue"}>{escola.zona || "Urbana"}</Badge>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: "600", color: "#1e3a8a" }}>
                          {stats.totalAlunos || 0}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: "600", color: "#d97706" }}>
                          {stats.totalProfessores || 0}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: "600", color: "#7c3aed" }}>
                          {stats.totalTurmas || 0}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <Btn variant="primary" onClick={() => handleSelecionarEscolaAtiva(escola.id)} style={{ padding: "4px 10px", fontSize: "12px" }}>
                              <i className="ti ti-arrow-right" /> Acessar
                            </Btn>
                            <Btn onClick={(e) => abrirEditarEscola(escola, e)} style={{ padding: "4px 8px", fontSize: "12px" }}>
                              <i className="ti ti-pencil" />
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
        )}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO DE ESCOLA */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={escolaEditando ? "Editar Unidade Escolar" : "Cadastrar Nova Escola na Rede"}
        maxWidth="640px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>
              Nome da Escola *
            </label>
            <Input
              required
              placeholder="Ex: Escola Municipal Senador Teotônio Vilela"
              value={formEscola.nome}
              onChange={(e) => setFormEscola({ ...formEscola, nome: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>
                Código INEP
              </label>
              <Input
                placeholder="Ex: 27012345"
                value={formEscola.inep}
                onChange={(e) => setFormEscola({ ...formEscola, inep: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>
                CNPJ
              </label>
              <Input
                placeholder="00.000.000/0000-00"
                value={formEscola.cnpj}
                onChange={(e) => setFormEscola({ ...formEscola, cnpj: formatCNPJ(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>
                Zona
              </label>
              <Select
                value={formEscola.zona}
                onChange={(e) => setFormEscola({ ...formEscola, zona: e.target.value })}
                options={[
                  { value: "Urbana", label: "Zona Urbana" },
                  { value: "Rural", label: "Zona Rural" }
                ]}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>
                Status
              </label>
              <Select
                value={formEscola.status}
                onChange={(e) => setFormEscola({ ...formEscola, status: e.target.value })}
                options={[
                  { value: "Ativa", label: "Ativa" },
                  { value: "Inativa", label: "Inativa" }
                ]}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>
                Diretor(a) Responsável
              </label>
              <Input
                placeholder="Nome completo do diretor(a)"
                value={formEscola.diretor}
                onChange={(e) => setFormEscola({ ...formEscola, diretor: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>
                Telefone / Contato
              </label>
              <Input
                placeholder="(82) 3214-0000"
                value={formEscola.telefone}
                onChange={(e) => setFormEscola({ ...formEscola, telefone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <Btn variant="ghost" onClick={() => setModalAberto(false)}>
              Cancelar
            </Btn>
            <Btn variant="primary" onClick={handleSalvarEscola} disabled={salvando}>
              {salvando ? "Salvando..." : escolaEditando ? "Atualizar Escola" : "Salvar Escola"}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* CROP MODAL */}
      {cropFile && (
        <CropModal
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
          aspectRatio={1}
          titulo="Ajustar Foto da Escola"
        />
      )}
    </div>
  );
}

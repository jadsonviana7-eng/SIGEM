import React, { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getEscolas, addEscola, updateEscola, deleteEscola } from "../services/escolasService";
import { getAllAlunos } from "../services/alunosService";
import { getAllProfessores } from "../services/professoresService";
import { getAllTurmas } from "../services/turmasService";
import { getAllTransacoes } from "../services/financeiroService";
import { Badge, Btn, Modal, Input, Select, Spinner, EmptyState } from "../components/ui";
import { formatCNPJ } from "../utils/masks";
import { comprimirEUploadFoto } from "../utils/upload";
import CropModal from "../components/CropModal";
import { useNavigate } from "react-router-dom";

import AlertasSecretaria from "./gestaoSecretaria/components/AlertasSecretaria";
import KpisCentroComando from "./gestaoSecretaria/components/KpisCentroComando";
import GraficosComparativosRede from "./gestaoSecretaria/components/GraficosComparativosRede";
import VisaoGeralModelo from "../components/dashboard/VisaoGeralModelo";

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
  const [ordenacao, setOrdenacao] = useState("nome"); // 'nome', 'alunos', 'turmas', 'professores'
  const [modoVisualizacao, setModoVisualizacao] = useState("cards"); // 'cards' | 'tabela'
  const [abaAtiva, setAbaAtiva] = useState("visaoGeral"); // 'visaoGeral' | 'escolas' | 'alertas' | 'comparativos'

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
      let targetEscolaId = a.escolaId;
      if (!mapa[targetEscolaId]) {
        if (a.escolaNome) {
          const escMatch = (escolas || []).find((e) => e.nome?.trim().toLowerCase() === a.escolaNome?.trim().toLowerCase());
          if (escMatch) targetEscolaId = escMatch.id;
        }
        if (!mapa[targetEscolaId] && escolas && escolas.length === 1) {
          targetEscolaId = escolas[0].id;
        }
      }

      if (mapa[targetEscolaId]) {
        mapa[targetEscolaId].totalAlunos += 1;
        if (a.status === "Ativo" || !a.status) mapa[targetEscolaId].alunosAtivos += 1;
        if (a.status === "Transferido") mapa[targetEscolaId].alunosTransferidos += 1;
      }
    });

    (todosProfessores || []).forEach((p) => {
      let targetEscolaId = p.escolaId;
      if (!mapa[targetEscolaId] && p.escolaNome) {
        const escMatch = (escolas || []).find((e) => e.nome?.trim().toLowerCase() === p.escolaNome?.trim().toLowerCase());
        if (escMatch) targetEscolaId = escMatch.id;
      }
      if (mapa[targetEscolaId]) {
        mapa[targetEscolaId].totalProfessores += 1;
        if (p.status === "Ativo" || !p.status) mapa[targetEscolaId].professoresAtivos += 1;
      }
    });

    (todasTurmas || []).forEach((t) => {
      let targetEscolaId = t.escolaId;
      if (!mapa[targetEscolaId] && t.escolaNome) {
        const escMatch = (escolas || []).find((e) => e.nome?.trim().toLowerCase() === t.escolaNome?.trim().toLowerCase());
        if (escMatch) targetEscolaId = escMatch.id;
      }
      if (mapa[targetEscolaId]) {
        mapa[targetEscolaId].totalTurmas += 1;
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
      {/* 1. VISÃO GERAL DO MODELO (DASHBOARD FIEL À IMAGEM) */}
      <VisaoGeralModelo
        alunos={todosAlunos}
        professores={todosProfessores}
        turmas={todasTurmas}
        pendencias={0}
      />

      {/* 2. BARRA DE FERRAMENTAS E ABAS DO SIGEM (DARK PREMIUM) */}
      <div
        style={{
          background: "#131924",
          borderRadius: "16px",
          border: "1px solid #1c2433",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)"
        }}
      >
        {/* Abas Pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "visaoGeral", label: "Visão Geral", icon: "ti ti-layout-dashboard" },
            { id: "escolas", label: `Unidades Escolares (${escolas.length})`, icon: "ti ti-building" },
            { id: "alertas", label: "Alertas & Pendências", icon: "ti ti-alert-triangle" },
            { id: "comparativos", label: "Comparativos da Rede", icon: "ti ti-chart-arrows" }
          ].map((tab) => {
            const ativa = abaAtiva === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAbaAtiva(tab.id)}
                style={{
                  background: ativa ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "#243144",
                  color: ativa ? "#ffffff" : "#cbd5e1",
                  border: ativa ? "none" : "1px solid #33435c",
                  borderRadius: "10px",
                  padding: "8px 16px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  transition: "all 0.15s ease",
                  boxShadow: ativa ? "0 4px 12px rgba(99, 102, 241, 0.35)" : "none"
                }}
              >
                <i className={tab.icon} style={{ fontSize: "15px" }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Ações Rápidas */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={abrirNovaEscola}
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#ffffff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
            }}
          >
            <i className="ti ti-plus" /> Cadastrar Escola
          </button>

          <button
            onClick={imprimirRelatorioExecutivo}
            style={{
              background: "#243144",
              color: "#cbd5e1",
              border: "1px solid #33435c",
              padding: "8px 14px",
              borderRadius: "10px",
              fontSize: "12px",
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
            title="Recarregar dados"
            style={{
              background: "#243144",
              color: "#cbd5e1",
              border: "1px solid #33435c",
              padding: "8px 12px",
              borderRadius: "10px",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            <i className="ti ti-refresh" />
          </button>
        </div>
      </div>

      {/* 3. CONTEÚDO BASEADO NA ABA SELECIONADA */}
      {abaAtiva === "alertas" && (
        <AlertasSecretaria
          alunos={todosAlunos}
          turmas={todasTurmas}
          professores={todosProfessores}
          escolas={escolas}
        />
      )}

      {abaAtiva === "comparativos" && (
        <>
          <KpisCentroComando
            escolas={escolas}
            alunos={todosAlunos}
            professores={todosProfessores}
            turmas={todasTurmas}
          />
          <GraficosComparativosRede
            escolas={escolas}
            alunos={todosAlunos}
            turmas={todasTurmas}
            estatisticasPorEscola={estatisticasPorEscola}
          />
        </>
      )}

      {(abaAtiva === "visaoGeral" || abaAtiva === "escolas") && (
        <>
          {abaAtiva === "visaoGeral" && (
            <AlertasSecretaria
              alunos={todosAlunos}
              turmas={todasTurmas}
              professores={todosProfessores}
              escolas={escolas}
            />
          )}

      {/* 5. BARRA DE FILTROS E BUSCA DE UNIDADES ESCOLARES (SLATE NAVY) */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: "16px",
          padding: "16px 20px",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)",
          border: "1px solid #2c3b52",
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
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
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
              padding: "10px 14px 10px 38px",
              borderRadius: "10px",
              border: "1px solid #33435c",
              background: "#243144",
              fontSize: "13px",
              outline: "none",
              color: "#ffffff",
              boxSizing: "border-box"
            }}
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#94a3b8"
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
              padding: "9px 12px",
              borderRadius: "10px",
              border: "1px solid #33435c",
              fontSize: "13px",
              background: "#243144",
              color: "#cbd5e1",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="Todas" style={{ background: "#1e293b" }}>Todas as Zonas</option>
            <option value="Urbana" style={{ background: "#1e293b" }}>Zona Urbana</option>
            <option value="Rural" style={{ background: "#1e293b" }}>Zona Rural</option>
          </select>

          {municipiosUnicos.length > 1 && (
            <select
              value={filtroMunicipio}
              onChange={(e) => setFiltroMunicipio(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: "10px",
                border: "1px solid #33435c",
                fontSize: "13px",
                background: "#243144",
                color: "#cbd5e1",
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="Todos" style={{ background: "#1e293b" }}>Todos os Municípios</option>
              {municipiosUnicos.map((m) => (
                <option key={m} value={m} style={{ background: "#1e293b" }}>
                  {m}
                </option>
              ))}
            </select>
          )}

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: "10px",
              border: "1px solid #33435c",
              fontSize: "13px",
              background: "#243144",
              color: "#cbd5e1",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="Todas" style={{ background: "#1e293b" }}>Todos os Status</option>
            <option value="Ativa" style={{ background: "#1e293b" }}>Ativas</option>
            <option value="Inativa" style={{ background: "#1e293b" }}>Inativas</option>
          </select>

          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: "10px",
              border: "1px solid #33435c",
              fontSize: "13px",
              background: "#243144",
              color: "#cbd5e1",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="nome" style={{ background: "#1e293b" }}>Ordenar por Nome</option>
            <option value="alunos" style={{ background: "#1e293b" }}>Maior nº de Alunos</option>
            <option value="turmas" style={{ background: "#1e293b" }}>Maior nº de Turmas</option>
            <option value="professores" style={{ background: "#1e293b" }}>Maior nº de Professores</option>
          </select>

          <div style={{ display: "flex", border: "1px solid #33435c", borderRadius: "10px", overflow: "hidden" }}>
            <button
              onClick={() => setModoVisualizacao("cards")}
              style={{
                padding: "8px 12px",
                border: "none",
                background: modoVisualizacao === "cards" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#243144",
                color: modoVisualizacao === "cards" ? "white" : "#94a3b8",
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
                padding: "8px 12px",
                border: "none",
                background: modoVisualizacao === "tabela" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#243144",
                color: modoVisualizacao === "tabela" ? "white" : "#94a3b8",
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

      {/* 6. LISTA / GRADE DE ESCOLAS DA REDE (DARK PREMIUM) */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#ffffff", margin: 0 }}>
            Unidades Escolares da Rede ({escolasExibicao.length})
          </h2>
          <span style={{ fontSize: "13px", color: "#718096" }}>
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
                    background: "#1e293b",
                    borderRadius: "18px",
                    border: isAtivaSelecionada ? "2px solid #6366f1" : "1px solid #2c3b52",
                    boxShadow: isAtivaSelecionada
                      ? "0 10px 25px -5px rgba(99, 102, 241, 0.3)"
                      : "0 6px 20px rgba(0, 0, 0, 0.18)",
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
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
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
                        borderRadius: "14px",
                        background: escola.fotoUrl ? "transparent" : "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        fontWeight: "700",
                        flexShrink: 0,
                        overflow: "hidden",
                        border: "1px solid #33435c"
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
                          color: "#ffffff",
                          margin: "0 0 2px 0",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {escola.nome}
                      </h3>

                      <div style={{ fontSize: "12px", color: "#8896ab", display: "flex", alignItems: "center", gap: "6px" }}>
                        <i className="ti ti-map-pin" style={{ fontSize: "13px", color: "#64748b" }} />
                        <span>
                          {escola.municipio || "Maceió"} - {escola.uf || "AL"}
                        </span>
                        <span style={{ color: "#334155" }}>•</span>
                        <Badge variant={escola.zona === "Rural" ? "warning" : "blue"}>
                          {escola.zona || "Urbana"}
                        </Badge>
                      </div>

                      {escola.inep && (
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          INEP: <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>{escola.inep}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px 20px",
                      background: "#243144",
                      borderTop: "1px solid #2c3b52",
                      borderBottom: "1px solid #2c3b52",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "8px",
                      textAlign: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600" }}>Alunos</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#38bdf8" }}>{stats.totalAlunos || 0}</div>
                      <div style={{ fontSize: "10px", color: "#10b981" }}>{stats.alunosAtivos || 0} ativos</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600" }}>Professores</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#fbbf24" }}>{stats.totalProfessores || 0}</div>
                      <div style={{ fontSize: "10px", color: "#94a3b8" }}>docentes</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600" }}>Turmas</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#c084fc" }}>{stats.totalTurmas || 0}</div>
                      <div style={{ fontSize: "10px", color: "#94a3b8" }}>em curso</div>
                    </div>
                  </div>

                  {(escola.diretor || escola.telefone) && (
                    <div style={{ padding: "10px 20px", fontSize: "12px", color: "#8896ab", display: "flex", flexDirection: "column", gap: "3px" }}>
                      {escola.diretor && (
                        <div>
                          <i className="ti ti-user" style={{ marginRight: "6px", color: "#64748b" }} />
                          <b>Diretor(a):</b> {escola.diretor}
                        </div>
                      )}
                      {escola.telefone && (
                        <div>
                          <i className="ti ti-phone" style={{ marginRight: "6px", color: "#64748b" }} />
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
                        background: isAtivaSelecionada ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#243144",
                        color: isAtivaSelecionada ? "white" : "#cbd5e1",
                        border: isAtivaSelecionada ? "none" : "1px solid #33435c",
                        padding: "8px 14px",
                        borderRadius: "10px",
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
                        background: "#243144",
                        border: "1px solid #33435c",
                        borderRadius: "10px",
                        color: "#cbd5e1",
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
                        background: "#243144",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        borderRadius: "8px",
                        color: "#f87171",
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
          <div style={{ background: "#1e293b", border: "1px solid #2c3b52", borderRadius: "16px", padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#243144", borderBottom: "1px solid #2c3b52" }}>
                    <th style={{ padding: "14px 16px", fontWeight: "600", color: "#94a3b8" }}>Escola</th>
                    <th style={{ padding: "14px 16px", fontWeight: "600", color: "#94a3b8" }}>INEP</th>
                    <th style={{ padding: "14px 16px", fontWeight: "600", color: "#94a3b8" }}>Município</th>
                    <th style={{ padding: "14px 16px", fontWeight: "600", color: "#94a3b8" }}>Zona</th>
                    <th style={{ padding: "14px 16px", fontWeight: "600", color: "#94a3b8", textAlign: "center" }}>Alunos</th>
                    <th style={{ padding: "14px 16px", fontWeight: "600", color: "#94a3b8", textAlign: "center" }}>Professores</th>
                    <th style={{ padding: "14px 16px", fontWeight: "600", color: "#94a3b8", textAlign: "center" }}>Turmas</th>
                    <th style={{ padding: "14px 16px", fontWeight: "600", color: "#94a3b8", textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {escolasExibicao.map((escola) => {
                    const stats = estatisticasPorEscola[escola.id] || {};
                    const isAtiva = selectedEscolaId === escola.id;

                    return (
                      <tr key={escola.id} style={{ borderBottom: "1px solid #1c2433", background: isAtiva ? "rgba(16, 185, 129, 0.08)" : "transparent" }}>
                        <td style={{ padding: "14px 16px", fontWeight: "600", color: "#f8fafc" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "#1e293b",
                                display: "flex",
                                alignItems: "center",
                                justifyItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: "700",
                                color: "#6366f1",
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
                              <div style={{ color: "#f8fafc" }}>{escola.nome}</div>
                              {isAtiva && <span style={{ fontSize: "10px", color: "#10b981", fontWeight: "700" }}>● Ativa</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#94a3b8" }}>{escola.inep || "-"}</td>
                        <td style={{ padding: "14px 16px", color: "#cbd5e1" }}>
                          {escola.municipio} - {escola.uf}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ 
                            padding: "4px 8px", 
                            borderRadius: "6px", 
                            fontSize: "11px", 
                            fontWeight: "600",
                            background: escola.zona === "Rural" ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 102, 241, 0.15)",
                            color: escola.zona === "Rural" ? "#f59e0b" : "#818cf8"
                          }}>
                            {escola.zona || "Urbana"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "700", color: "#38bdf8" }}>
                          {stats.totalAlunos || 0}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "700", color: "#a855f7" }}>
                          {stats.totalProfessores || 0}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "700", color: "#f59e0b" }}>
                          {stats.totalTurmas || 0}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button 
                              onClick={() => handleSelecionarEscolaAtiva(escola.id)} 
                              style={{ 
                                padding: "6px 12px", 
                                fontSize: "12px",
                                fontWeight: "600",
                                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <i className="ti ti-arrow-right" /> Acessar
                            </button>
                            <button 
                              onClick={(e) => abrirEditarEscola(escola, e)} 
                              style={{ 
                                padding: "6px 10px", 
                                fontSize: "12px",
                                background: "#18202d",
                                border: "1px solid #232d3f",
                                color: "#94a3b8",
                                borderRadius: "8px",
                                cursor: "pointer"
                              }}
                            >
                              <i className="ti ti-pencil" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
        </>
      )}

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

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getCaixas, getCategorias, getTransacoes } from "../../services/financeiroService";
import { getEscolas } from "../../services/escolasService";
import { Spinner } from "../../components/ui";
import { injectMockData } from "../../utils/mockDataGenerator";
import styles from "./Financeiro.module.css";

import DashboardFinanceiro from "./components/DashboardFinanceiro";
import CaixasFinanceiras from "./components/CaixasFinanceiras";
import CategoriasFinanceiras from "./components/CategoriasFinanceiras";
import TransacoesFinanceiras from "./components/TransacoesFinanceiras";
import RelatoriosFinanceiros from "./components/RelatoriosFinanceiros";

export default function Financeiro() {
  const { user, selectedEscolaId } = useAuth();
  const activeEscolaId = selectedEscolaId || user?.escolaId || "";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [resumoMobileAberto, setResumoMobileAberto] = useState(false);
  const mobileTabContainerRef = useRef(null);

  const [caixas, setCaixas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [escolas, setEscolas] = useState([]);

  useEffect(() => {
    if (activeEscolaId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [activeEscolaId]);

  const fetchData = async () => {
    if (!activeEscolaId) return;
    setLoading(true);
    try {
      const [cx, cat, trans, escolasList] = await Promise.all([
        getCaixas(activeEscolaId),
        getCategorias(activeEscolaId),
        getTransacoes(activeEscolaId),
        getEscolas()
      ]);
      setCaixas(cx || []);
      setCategorias(cat || []);
      setTransacoes(trans || []);
      setEscolas(escolasList || []);
    } catch (err) {
      console.error("Erro ao carregar dados financeiros:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedEscola = useMemo(() => {
    return escolas.find((e) => e.id === activeEscolaId) || { nome: "Escola Municipal Modelo" };
  }, [escolas, activeEscolaId]);

  const handleGerarMock = async () => {
    if (
      !window.confirm(
        "Deseja gerar dados financeiros de demonstração (contas bancárias, categorias, receitas de PDDE e despesas dos últimos meses)?"
      )
    ) {
      return;
    }
    setGerando(true);
    try {
      await injectMockData(activeEscolaId);
      await fetchData();
      alert("Dados financeiros gerados com sucesso!");
    } catch (e) {
      alert("Erro ao gerar dados: " + e.message);
    } finally {
      setGerando(false);
    }
  };

  // Grupos do Menu Lateral Desktop
  const gruposMenu = useMemo(
    () => [
      {
        titulo: "Visão Geral",
        itens: [
          {
            id: "dashboard",
            label: "Painel Principal",
            subtitulo: "Indicadores e saldos",
            icon: "layout-dashboard",
            badge: null
          }
        ]
      },
      {
        titulo: "Movimentação & Caixa",
        itens: [
          {
            id: "transacoes",
            label: "Extrato de Transações",
            subtitulo: "Receitas e despesas",
            icon: "receipt",
            badge: transacoes.length
          },
          {
            id: "caixas",
            label: "Contas & Caixas",
            subtitulo: "Bancos e saldos",
            icon: "building-bank",
            badge: caixas.length
          }
        ]
      },
      {
        titulo: "Contabilidade & Gestão",
        itens: [
          {
            id: "categorias",
            label: "Categorias Orçamentárias",
            subtitulo: "Rubricas e planos",
            icon: "tags",
            badge: categorias.length
          },
          {
            id: "relatorios",
            label: "Balancete & Fluxo",
            subtitulo: "Relatórios e conciliação",
            icon: "chart-pie",
            badge: "Balanço"
          }
        ]
      }
    ],
    [transacoes, caixas, categorias]
  );

  // Auto-scroll da barra touch de abas no mobile
  useEffect(() => {
    if (mobileTabContainerRef.current) {
      const activeEl = mobileTabContainerRef.current.querySelector(
        `.${styles.mobileTabChipActive}`
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest"
        });
      }
    }
  }, [activeTab]);

  const itemAtivoObj = useMemo(() => {
    for (const g of gruposMenu) {
      const found = g.itens.find((i) => i.id === activeTab);
      if (found) return found;
    }
    return gruposMenu[0].itens[0];
  }, [gruposMenu, activeTab]);

  // Resumo Financeiro para o Painel Mobile
  const resumoFinanceiro = useMemo(() => {
    const formatar = (v) =>
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0));

    const saldoInicial = caixas.reduce((acc, c) => acc + Number(c.saldoInicial || 0), 0);
    const recTotal = transacoes
      .filter((t) => t.tipo === "Receita")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const desTotal = transacoes
      .filter((t) => t.tipo === "Despesa")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const saldoGlobal = saldoInicial + recTotal - desTotal;

    const mesAtual = new Date().toISOString().slice(0, 7);
    const txMes = transacoes.filter((t) => (t.data || "").startsWith(mesAtual));
    const recMes = txMes
      .filter((t) => t.tipo === "Receita")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const desMes = txMes
      .filter((t) => t.tipo === "Despesa")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);

    return {
      saldoGlobal: formatar(saldoGlobal),
      recMes: formatar(recMes),
      desMes: formatar(desMes),
      totalContas: caixas.length
    };
  }, [caixas, transacoes]);

  if (loading) {
    return <Spinner texto="Carregando dados financeiros e contas da escola..." />;
  }

  if (!activeEscolaId) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Por favor, selecione uma escola no menu superior para gerenciar os dados financeiros e caixas.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ═════════════════════════════════════════════════════ */}
      {/* ── NAVEGAÇÃO MOBILE INTELIGENTE & ABAS DESLIZANTES ── */}
      {/* ═════════════════════════════════════════════════════ */}
      <div className={styles.mobileNavHeader}>
        {/* Topo do Módulo Mobile */}
        <div className={styles.mobileBarTop}>
          <div className={styles.mobileModuleTitle}>
            <div className={styles.mobileIconBadge}>
              <i className="ti ti-coin" />
            </div>
            <div className={styles.mobileTitleText}>
              <span className={styles.mobileTitleMain}>Gestão Financeira</span>
              <span className={styles.mobileTitleSub}>{itemAtivoObj?.label || "Caixa Escolar"}</span>
            </div>
          </div>

          <div className={styles.mobileBarActions}>
            <button
              type="button"
              className={`${styles.mobileActionButton} ${resumoMobileAberto ? styles.mobileActionButtonActive : ""}`}
              onClick={() => setResumoMobileAberto(!resumoMobileAberto)}
              title="Resumo Financeiro"
            >
              <i className="ti ti-chart-pie" />
              <span>Resumo</span>
            </button>

            <button
              type="button"
              className={styles.mobileActionButton}
              onClick={fetchData}
              title="Recarregar Dados"
            >
              <i className="ti ti-refresh" />
            </button>
          </div>
        </div>

        {/* Resumo Colapsável no Mobile */}
        {resumoMobileAberto && (
          <div className={styles.mobileSummaryPanel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-wallet" style={{ color: "#34d399" }} /> Balanço em Tempo Real
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Mês Corrente</span>
            </div>

            <div className={styles.mobileSummaryGrid}>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Saldo Global</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#34d399" }}>
                  {resumoFinanceiro.saldoGlobal}
                </span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Receitas no Mês</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#60a5fa" }}>
                  {resumoFinanceiro.recMes}
                </span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Despesas no Mês</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#f87171" }}>
                  {resumoFinanceiro.desMes}
                </span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Contas Bancárias</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#ffffff" }}>
                  {resumoFinanceiro.totalContas}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Abas Deslizante no Topo (Touch Chips Sticky) */}
        <div className={styles.mobileTabsSticky}>
          <div className={styles.mobileTabsScroll} ref={mobileTabContainerRef}>
            {gruposMenu.flatMap((g) => g.itens).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.mobileTabChip} ${isActive ? styles.mobileTabChipActive : ""}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <i className={`ti ti-${item.icon}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className={styles.mobileTabBadge}>{item.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── CONTEÚDO DA ABA ATIVA (COLUNA PRINCIPAL) ──────── */}
      {/* ═════════════════════════════════════════════════════ */}
      <main className={styles.contentCol}>
        {activeTab === "dashboard" && (
          <DashboardFinanceiro
            caixas={caixas}
            categorias={categorias}
            transacoes={transacoes}
            selectedEscola={selectedEscola}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "transacoes" && (
          <TransacoesFinanceiras
            caixas={caixas}
            categorias={categorias}
            transacoes={transacoes}
            onReload={fetchData}
            escolaId={activeEscolaId}
          />
        )}

        {activeTab === "caixas" && (
          <CaixasFinanceiras
            caixas={caixas}
            transacoes={transacoes}
            onReload={fetchData}
            escolaId={activeEscolaId}
          />
        )}

        {activeTab === "categorias" && (
          <CategoriasFinanceiras
            categorias={categorias}
            onReload={fetchData}
            escolaId={activeEscolaId}
          />
        )}

        {activeTab === "relatorios" && (
          <RelatoriosFinanceiros
            caixas={caixas}
            categorias={categorias}
            transacoes={transacoes}
          />
        )}
      </main>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── MENU LATERAL DIREITO DESKTOP (STICKY DOCK) ────── */}
      {/* ═════════════════════════════════════════════════════ */}
      <aside className={styles.desktopAside}>
        <div className={styles.sideCard}>
          <div className={styles.sideHeader}>
            <div className={styles.sideTitleWrap}>
              <div className={styles.sideLogo}>
                <i className="ti ti-coin" />
              </div>
              <div>
                <div className={styles.sideTitle}>Gestão Financeira</div>
                <div className={styles.sideSubtitle}>Caixa & Prestação</div>
              </div>
            </div>

            <button
              type="button"
              className={styles.sideRefreshBtn}
              onClick={fetchData}
              title="Recarregar Dados"
            >
              <i className="ti ti-refresh" />
            </button>
          </div>

          <div className={styles.sideNavList}>
            {gruposMenu.map((grupo) => (
              <div key={grupo.titulo} style={{ marginBottom: 10 }}>
                <div className={styles.sideGroupTitle}>{grupo.titulo}</div>
                {grupo.itens.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.sideNavItem} ${isActive ? styles.sideNavItemActive : ""}`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <div className={styles.sideItemLeft}>
                        <i className={`ti ti-${item.icon} ${styles.sideItemIcon}`} />
                        <span className={styles.sideItemText}>{item.label}</span>
                      </div>
                      {item.badge !== null && item.badge !== undefined && (
                        <span className={styles.sideItemBadge}>{item.badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className={styles.sideFooter}>
            <div className={styles.sideFooterLabel}>Seção Ativa</div>
            <div className={styles.sideFooterTitle}>{itemAtivoObj?.label}</div>
            <div className={styles.sideFooterSub}>{itemAtivoObj?.subtitulo}</div>
          </div>
        </div>

        {/* Card Mock / Ações Rápidas */}
        <div className={styles.mockCard}>
          <div className={styles.mockHeader}>
            <i className="ti ti-sparkles" style={{ color: "#34d399", fontSize: 18 }} />
            <span className={styles.mockTitle}>Ambiente de Testes</span>
          </div>
          <p className={styles.mockDesc}>
            Gere lançamentos de receitas e despesas simuladas dos últimos meses para visualização dos gráficos e fluxos.
          </p>
          <button
            type="button"
            className={styles.sideRefreshBtn}
            onClick={handleGerarMock}
            disabled={gerando}
            style={{ width: "100%", justifyContent: "center" }}
          >
            <i className="ti ti-database-import" style={{ marginRight: 6 }} />
            {gerando ? "Gerando..." : "Gerar Dados Fictícios"}
          </button>
        </div>
      </aside>
    </div>
  );
}

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAlunos } from "../services/alunosService";
import { getProfessores } from "../services/professoresService";
import { getTurmas } from "../services/turmasService";
import { getEscolas } from "../services/escolasService";
import { Spinner } from "../components/ui";
import styles from "./relatorios/Relatorios.module.css";

import DashboardRelatorios from "./relatorios/components/DashboardRelatorios";
import RelatorioMatriculas from "./relatorios/components/RelatorioMatriculas";
import RelatorioRendimento from "./relatorios/components/RelatorioRendimento";
import RelatorioFrequencia from "./relatorios/components/RelatorioFrequencia";
import RelatorioDocentes from "./relatorios/components/RelatorioDocentes";
import DocumentosOficiais from "./relatorios/components/DocumentosOficiais";

export default function Relatorios() {
  const { user, selectedEscolaId } = useAuth();
  const activeEscolaId = selectedEscolaId || user?.escolaId || "";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [resumoMobileAberto, setResumoMobileAberto] = useState(false);
  const mobileTabContainerRef = useRef(null);

  // Estados de Dados
  const [alunos, setAlunos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [turmas, setTurmas] = useState([]);
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
      const [alunosList, professoresList, turmasList, escolasList] = await Promise.all([
        getAlunos(activeEscolaId),
        getProfessores(activeEscolaId),
        getTurmas(activeEscolaId),
        getEscolas()
      ]);

      setAlunos(alunosList || []);
      setProfessores(professoresList || []);
      setTurmas(turmasList || []);
      setEscolas(escolasList || []);
    } catch (err) {
      console.error("Erro ao carregar módulo de relatórios:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedEscola = useMemo(() => {
    return escolas.find((e) => e.id === activeEscolaId) || { nome: "Escola Municipal Modelo" };
  }, [escolas, activeEscolaId]);

  // Grupos do Menu de Navegação na lateral direita (Desktop)
  const gruposMenu = useMemo(
    () => [
      {
        titulo: "Visão Geral",
        itens: [
          {
            id: "dashboard",
            label: "Painel Executivo",
            subtitulo: "Indicadores gerais",
            icon: "layout-dashboard",
            badge: null
          }
        ]
      },
      {
        titulo: "Discentes & Movimentação",
        itens: [
          {
            id: "matriculas",
            label: "Relação de Matrículas",
            subtitulo: "Lista nominal e Censo",
            icon: "file-text",
            badge: alunos.length
          },
          {
            id: "frequencia",
            label: "Frequência & Busca Ativa",
            subtitulo: "Prevenção de evasão",
            icon: "calendar-stats",
            badge: "Alerta"
          }
        ]
      },
      {
        titulo: "Pedagógico & Gestão",
        itens: [
          {
            id: "rendimento",
            label: "Rendimento & Notas",
            subtitulo: "Médias por disciplina",
            icon: "chart-line",
            badge: null
          },
          {
            id: "docentes",
            label: "Quadro Docente",
            subtitulo: "Professores e turmas",
            icon: "id-badge-2",
            badge: professores.length
          },
          {
            id: "documentos",
            label: "Atas & Documentos",
            subtitulo: "Impressão oficial",
            icon: "printer",
            badge: "Oficial"
          }
        ]
      }
    ],
    [alunos, professores]
  );

  // Auto-scroll da barra touch de abas no mobile ao mudar de aba
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

  if (loading) {
    return <Spinner texto="Carregando relatórios e estatísticas municipais..." />;
  }

  if (!activeEscolaId) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Por favor, selecione uma escola no menu superior para visualizar os relatórios e indicadores da unidade.
      </div>
    );
  }

  const totalAtivos = alunos.filter((a) => a.status === "Ativo").length;

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
              <i className="ti ti-chart-bar" />
            </div>
            <div className={styles.mobileTitleText}>
              <span className={styles.mobileTitleMain}>Relatórios & Censo</span>
              <span className={styles.mobileTitleSub}>{itemAtivoObj?.label || "Indicadores"}</span>
            </div>
          </div>

          <div className={styles.mobileBarActions}>
            <button
              type="button"
              className={`${styles.mobileActionButton} ${resumoMobileAberto ? styles.mobileActionButtonActive : ""}`}
              onClick={() => setResumoMobileAberto(!resumoMobileAberto)}
              title="Resumo dos Indicadores"
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
                <i className="ti ti-chart-dots" style={{ color: "#38bdf8" }} /> Indicadores Municipais
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Dados em Tempo Real</span>
            </div>

            <div className={styles.mobileSummaryGrid}>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Total de Alunos</span>
                <span className={styles.mobileSummaryValue}>{alunos.length}</span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Matrículas Ativas</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#34d399" }}>
                  {totalAtivos}
                </span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Turmas Ofertadas</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#38bdf8" }}>
                  {turmas.length}
                </span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Professores</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#c084fc" }}>
                  {professores.length}
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
          <DashboardRelatorios
            alunos={alunos}
            turmas={turmas}
            professores={professores}
            selectedEscola={selectedEscola}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "matriculas" && (
          <RelatorioMatriculas
            alunos={alunos}
            turmas={turmas}
            selectedEscola={selectedEscola}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "rendimento" && (
          <RelatorioRendimento
            alunos={alunos}
            turmas={turmas}
            selectedEscola={selectedEscola}
          />
        )}

        {activeTab === "frequencia" && (
          <RelatorioFrequencia
            alunos={alunos}
            turmas={turmas}
            selectedEscola={selectedEscola}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "docentes" && (
          <RelatorioDocentes
            professores={professores}
            turmas={turmas}
            alunos={alunos}
            selectedEscola={selectedEscola}
          />
        )}

        {activeTab === "documentos" && (
          <DocumentosOficiais
            alunos={alunos}
            turmas={turmas}
            professores={professores}
            selectedEscola={selectedEscola}
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
                <i className="ti ti-chart-bar" />
              </div>
              <div>
                <div className={styles.sideTitle}>Relatórios & Censo</div>
                <div className={styles.sideSubtitle}>Inteligência Municipal</div>
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
                        <span
                          className={`${styles.sideItemBadge} ${
                            item.badge === "Alerta" ? styles.sideItemBadgeOnline : ""
                          }`}
                        >
                          {item.badge}
                        </span>
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

        {/* Card Informativo */}
        <div className={styles.mockCard}>
          <div className={styles.mockHeader}>
            <i className="ti ti-info-circle" style={{ color: "#38bdf8", fontSize: 18 }} />
            <span className={styles.mockTitle}>Censo & Diretrizes INEP</span>
          </div>
          <p className={styles.mockDesc}>
            Os relatórios estatísticos deste módulo utilizam os padrões oficiais do Censo Escolar e do Ministério da Educação (MEC).
          </p>
          <button
            type="button"
            className={styles.sideRefreshBtn}
            onClick={() => setActiveTab("documentos")}
            style={{ width: "100%", justifyContent: "center" }}
          >
            <i className="ti ti-printer" style={{ marginRight: 6 }} /> Emitir Atas da Escola
          </button>
        </div>
      </aside>
    </div>
  );
}

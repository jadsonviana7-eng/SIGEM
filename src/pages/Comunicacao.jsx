import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getAvisos,
  getReunioes,
  getEventos,
  getMensagens,
  injectComunicacaoMockData
} from "../services/comunicacaoService";
import { getAlunos } from "../services/alunosService";
import { getTurmas } from "../services/turmasService";
import { getEscolas } from "../services/escolasService";
import { Spinner, Btn } from "../components/ui";
import styles from "./comunicacao/Comunicacao.module.css";

import DashboardComunicacao from "./comunicacao/components/DashboardComunicacao";
import AvisosComunicados from "./comunicacao/components/AvisosComunicados";
import ReunioesPais from "./comunicacao/components/ReunioesPais";
import EventosCalendario from "./comunicacao/components/EventosCalendario";
import NotificacoesAutomaticas from "./comunicacao/components/NotificacoesAutomaticas";
import MensagensEscola from "./comunicacao/components/MensagensEscola";
import MuralPublicoResponsavel from "./comunicacao/components/MuralPublicoResponsavel";

export default function Comunicacao() {
  const { user, selectedEscolaId } = useAuth();
  const activeEscolaId = selectedEscolaId || user?.escolaId || "";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [resumoMobileAberto, setResumoMobileAberto] = useState(false);
  const mobileTabContainerRef = useRef(null);

  // Estados de Dados
  const [avisos, setAvisos] = useState([]);
  const [reunioes, setReunioes] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [escolas, setEscolas] = useState([]);

  useEffect(() => {
    if (activeEscolaId) {
      fetchData();
    }
  }, [activeEscolaId]);

  const fetchData = async () => {
    if (!activeEscolaId) return;
    setLoading(true);
    try {
      const [
        avisosList,
        reunioesList,
        eventosList,
        mensagensList,
        alunosList,
        turmasList,
        escolasList
      ] = await Promise.all([
        getAvisos(activeEscolaId),
        getReunioes(activeEscolaId),
        getEventos(activeEscolaId),
        getMensagens(activeEscolaId),
        getAlunos(activeEscolaId),
        getTurmas(activeEscolaId),
        getEscolas()
      ]);

      setAvisos(avisosList);
      setReunioes(reunioesList);
      setEventos(eventosList);
      setMensagens(mensagensList);
      setAlunos(alunosList);
      setTurmas(turmasList);
      setEscolas(escolasList);
    } catch (err) {
      console.error("Erro ao carregar módulo de comunicação:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedEscola = useMemo(() => {
    return escolas.find((e) => e.id === activeEscolaId) || { nome: "Escola Municipal" };
  }, [escolas, activeEscolaId]);

  const handleGerarMock = async () => {
    if (
      !window.confirm(
        "Deseja injetar dados de demonstração de Comunicação Escolar (avisos com confirmação de leitura, reuniões de pais com pauta e ata, eventos no calendário e disparos de boletim/frequência)?"
      )
    ) {
      return;
    }
    setGerando(true);
    try {
      await injectComunicacaoMockData(activeEscolaId, turmas, alunos);
      await fetchData();
      alert("Dados de comunicação injetados com sucesso!");
    } catch (err) {
      console.error("Erro ao injetar dados mock:", err);
      alert("Erro ao injetar dados: " + err.message);
    } finally {
      setGerando(false);
    }
  };

  // Grupos do Menu de Navegação na lateral direita
  const gruposMenu = useMemo(
    () => [
      {
        titulo: "Visão Geral",
        itens: [
          {
            id: "dashboard",
            label: "Painel de Comunicação",
            subtitulo: "Indicadores e canais",
            icon: "layout-dashboard",
            badge: null
          }
        ]
      },
      {
        titulo: "Publicações & Encontros",
        itens: [
          {
            id: "avisos",
            label: "Avisos & Comunicados",
            subtitulo: "Mural e confirmações",
            icon: "speakerphone",
            badge: avisos.length
          },
          {
            id: "reunioes",
            label: "Reuniões de Pais",
            subtitulo: "Pautas, atas e presença",
            icon: "users",
            badge: reunioes.length
          },
          {
            id: "eventos",
            label: "Eventos & Calendário",
            subtitulo: "Atividades e mostras",
            icon: "calendar-event",
            badge: eventos.length
          }
        ]
      },
      {
        titulo: "Disparos & Atendimento",
        itens: [
          {
            id: "notificacoes",
            label: "Boletim & Frequência",
            subtitulo: "Alertas automáticos",
            icon: "bell-ringing",
            badge: null
          },
          {
            id: "mensagens",
            label: "Mensagens da Escola",
            subtitulo: "WhatsApp e recados",
            icon: "messages",
            badge: mensagens.length
          },
          {
            id: "mural",
            label: "Mural do Responsável",
            subtitulo: "Portal das famílias",
            icon: "device-mobile",
            badge: "Online"
          }
        ]
      }
    ],
    [avisos, reunioes, eventos, mensagens]
  );

  // Item ativo atual
  const itemAtivoObj = useMemo(() => {
    for (const g of gruposMenu) {
      const found = g.itens.find((i) => i.id === activeTab);
      if (found) return found;
    }
    return gruposMenu[0].itens[0];
  }, [gruposMenu, activeTab]);

  if (!activeEscolaId) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Por favor, selecione uma escola vinculada no menu superior para gerenciar a comunicação com as famílias.
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
              <i className="ti ti-speakerphone" />
            </div>
            <div className={styles.mobileTitleText}>
              <span className={styles.mobileTitleMain}>Comunicação Escolar</span>
              <span className={styles.mobileTitleSub}>{itemAtivoObj?.label || "Escola → Família"}</span>
            </div>
          </div>

          <div className={styles.mobileBarActions}>
            <button
              type="button"
              className={`${styles.mobileActionButton} ${resumoMobileAberto ? styles.mobileActionButtonActive : ""}`}
              onClick={() => setResumoMobileAberto(!resumoMobileAberto)}
              title="Resumo da Comunicação"
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
                <i className="ti ti-speakerphone" style={{ color: "#38bdf8" }} /> Canais de Comunicação
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Indicadores Atuais</span>
            </div>

            <div className={styles.mobileSummaryGrid}>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Comunicados Ativos</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#38bdf8" }}>{avisos.length}</span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Reuniões de Pais</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#34d399" }}>{reunioes.length}</span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Eventos no Mês</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#60a5fa" }}>{eventos.length}</span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Recados & WhatsApp</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#fbbf24" }}>{mensagens.length}</span>
              </div>
            </div>

            <div style={{ paddingTop: 4 }}>
              <Btn
                onClick={handleGerarMock}
                disabled={gerando}
                style={{ width: "100%", justifyContent: "center", fontSize: 11, padding: "8px 10px" }}
              >
                <i className="ti ti-database-import" /> {gerando ? "Gerando..." : "Injetar Dados de Demonstração"}
              </Btn>
            </div>
          </div>
        )}

        {/* Barra de Abas Deslizante no Topo (Sticky Touch Chips) */}
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
                  {item.badge !== null && (
                    <span className={styles.mobileTabBadge}>{item.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── COLUNA ESQUERDA: CONTEÚDO PRINCIPAL DO MÓDULO ── */}
      {/* ═════════════════════════════════════════════════════ */}
      <div className={styles.contentCol}>
        {loading ? (
          <Spinner />
        ) : (
          <div>
            {activeTab === "dashboard" && (
              <DashboardComunicacao
                avisos={avisos}
                reunioes={reunioes}
                eventos={eventos}
                mensagens={mensagens}
                alunos={alunos}
                turmas={turmas}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === "avisos" && (
              <AvisosComunicados
                avisos={avisos}
                turmas={turmas}
                alunos={alunos}
                escolaId={activeEscolaId}
                selectedEscola={selectedEscola}
                usuario={user}
                onReload={fetchData}
              />
            )}

            {activeTab === "reunioes" && (
              <ReunioesPais
                reunioes={reunioes}
                turmas={turmas}
                alunos={alunos}
                escolaId={activeEscolaId}
                selectedEscola={selectedEscola}
                usuario={user}
                onReload={fetchData}
              />
            )}

            {activeTab === "eventos" && (
              <EventosCalendario
                eventos={eventos}
                turmas={turmas}
                escolaId={activeEscolaId}
                selectedEscola={selectedEscola}
                usuario={user}
                onReload={fetchData}
              />
            )}

            {activeTab === "notificacoes" && (
              <NotificacoesAutomaticas
                turmas={turmas}
                alunos={alunos}
                escolaId={activeEscolaId}
                selectedEscola={selectedEscola}
                onRefresh={fetchData}
              />
            )}

            {activeTab === "mensagens" && (
              <MensagensEscola
                mensagens={mensagens}
                alunos={alunos}
                turmas={turmas}
                escolaId={activeEscolaId}
                selectedEscola={selectedEscola}
                usuario={user}
                onRefresh={fetchData}
              />
            )}

            {activeTab === "mural" && (
              <MuralPublicoResponsavel
                avisos={avisos}
                reunioes={reunioes}
                eventos={eventos}
                alunos={alunos}
                selectedEscola={selectedEscola}
                onRefresh={fetchData}
              />
            )}
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── COLUNA DIREITA: MENU MODERNO DE NAVEGAÇÃO ────── */}
      {/* ═════════════════════════════════════════════════════ */}
      <aside className={styles.desktopAside}>
        {/* Painel do Menu */}
        <div className={styles.sideCard}>
          {/* Header do Menu */}
          <div className={styles.sideHeader}>
            <div className={styles.sideTitleWrap}>
              <div className={styles.sideLogo}>
                <i className="ti ti-speakerphone" />
              </div>
              <div>
                <div className={styles.sideTitle}>Comunicação</div>
                <div className={styles.sideSubtitle}>Escola → Família</div>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchData}
              title="Recarregar Dados"
              className={styles.sideRefreshBtn}
            >
              <i className="ti ti-refresh" />
            </button>
          </div>

          {/* Lista de Grupos e Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {gruposMenu.map((grupo, gIdx) => (
              <div key={gIdx}>
                <div className={styles.sideGroupTitle}>
                  {grupo.titulo}
                </div>

                <div className={styles.sideNavList}>
                  {grupo.itens.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`${styles.sideNavItem} ${isActive ? styles.sideNavItemActive : ""}`}
                      >
                        <div className={styles.sideItemLeft}>
                          <i className={`ti ti-${item.icon} ${styles.sideItemIcon}`} />
                          <span className={styles.sideItemText}>
                            {item.label}
                          </span>
                        </div>

                        {item.badge !== null && (
                          <span
                            className={`${styles.sideItemBadge} ${
                              item.badge === "Online" ? styles.sideItemBadgeOnline : ""
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé Informativo da Aba Selecionada */}
          <div className={styles.sideFooter}>
            <div className={styles.sideFooterLabel}>Seção Atual</div>
            <div className={styles.sideFooterTitle}>
              {itemAtivoObj.label}
            </div>
            <div className={styles.sideFooterSub}>
              {itemAtivoObj.subtitulo}
            </div>
          </div>
        </div>

        {/* Card de Demonstração & Mock Data */}
        <div className={styles.mockCard}>
          <div className={styles.mockHeader}>
            <span style={{ fontSize: 18 }}>📢</span>
            <div className={styles.mockTitle}>
              Dados de Demonstração
            </div>
          </div>
          <p className={styles.mockDesc}>
            Gere dados realistas de comunicados, reuniões de pais com atas, feiras escolares e notificações de boletim.
          </p>
          <Btn
            variant="outline"
            size="sm"
            onClick={handleGerarMock}
            disabled={gerando}
            style={{
              width: "100%",
              background: "var(--bg-surface, #243144)",
              color: "#34d399",
              borderColor: "var(--border-subtle, #33435c)",
              fontWeight: 600,
              fontSize: 12,
              justifyContent: "center"
            }}
          >
            <i className="ti ti-database-import" style={{ marginRight: 6 }} />
            {gerando ? "Injetando..." : "Injetar Dados de Teste"}
          </Btn>
        </div>
      </aside>
    </div>
  );
}

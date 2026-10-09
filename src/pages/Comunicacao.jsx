import { useState, useEffect, useMemo } from "react";
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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 290px",
        gap: 24,
        alignItems: "start"
      }}
    >
      {/* ═════════════════════════════════════════════════════ */}
      {/* ── COLUNA ESQUERDA: CONTEÚDO PRINCIPAL DO MÓDULO ── */}
      {/* ═════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
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
                onRefresh={fetchData}
              />
            )}

            {activeTab === "reunioes" && (
              <ReunioesPais
                reunioes={reunioes}
                turmas={turmas}
                alunos={alunos}
                escolaId={activeEscolaId}
                selectedEscola={selectedEscola}
                onRefresh={fetchData}
              />
            )}

            {activeTab === "eventos" && (
              <EventosCalendario
                eventos={eventos}
                turmas={turmas}
                escolaId={activeEscolaId}
                selectedEscola={selectedEscola}
                onRefresh={fetchData}
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
      <div
        style={{
          position: "sticky",
          top: 0,
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}
      >
        {/* Painel do Menu */}
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: 16,
            boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.05)"
          }}
        >
          {/* Header do Menu */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 12,
              marginBottom: 12,
              borderBottom: "1px solid #f1f5f9"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  boxShadow: "0 2px 6px rgba(2, 132, 199, 0.3)"
                }}
              >
                <i className="ti ti-speakerphone" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Comunicação</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Escola → Família</div>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchData}
              title="Recarregar Dados"
              style={{
                padding: "6px 8px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                color: "#475569",
                cursor: "pointer",
                fontSize: 12,
                display: "flex",
                alignItems: "center"
              }}
            >
              <i className="ti ti-refresh" />
            </button>
          </div>

          {/* Lista de Grupos e Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {gruposMenu.map((grupo, gIdx) => (
              <div key={gIdx}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    color: "#94a3b8",
                    padding: "0 8px 6px 8px"
                  }}
                >
                  {grupo.titulo}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {grupo.itens.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: isActive ? "#f0f9ff" : "transparent",
                          color: isActive ? "#0284c7" : "#334155",
                          fontWeight: isActive ? 700 : 500,
                          fontSize: 13,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                          borderLeft: isActive ? "3px solid #0284c7" : "3px solid transparent"
                        }}
                        onMouseOver={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = "#f8fafc";
                            e.currentTarget.style.color = "#1e293b";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#334155";
                          }
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                          <i
                            className={`ti ti-${item.icon}`}
                            style={{
                              fontSize: 16,
                              color: isActive ? "#0284c7" : "#64748b",
                              flexShrink: 0
                            }}
                          />
                          <span
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                          >
                            {item.label}
                          </span>
                        </div>

                        {item.badge !== null && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: 10,
                              background: isActive ? "#0284c7" : item.badge === "Online" ? "#dcfce7" : "#f1f5f9",
                              color: isActive ? "white" : item.badge === "Online" ? "#15803d" : "#64748b",
                              flexShrink: 0
                            }}
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
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid #f1f5f9",
              background: "#f8fafc",
              borderRadius: 8,
              padding: "10px 12px"
            }}
          >
            <div style={{ fontSize: 11, color: "#64748b" }}>Seção Atual</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
              {itemAtivoObj.label}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              {itemAtivoObj.subtitulo}
            </div>
          </div>
        </div>

        {/* Card de Demonstração & Mock Data */}
        <div
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            border: "1px solid #bbf7d0",
            borderRadius: 14,
            padding: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>📢</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
              Dados de Demonstração
            </div>
          </div>
          <p style={{ fontSize: 11, color: "#166534", margin: "0 0 12px 0", lineHeight: 1.4 }}>
            Gere dados realistas de comunicados, reuniões de pais com atas, feiras escolares e notificações de boletim.
          </p>
          <Btn
            variant="outline"
            size="sm"
            onClick={handleGerarMock}
            disabled={gerando}
            style={{
              width: "100%",
              background: "white",
              color: "#15803d",
              borderColor: "#86efac",
              fontWeight: 600,
              fontSize: 12,
              justifyContent: "center"
            }}
          >
            <i className="ti ti-database-import" style={{ marginRight: 6 }} />
            {gerando ? "Injetando..." : "Injetar Dados de Teste"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

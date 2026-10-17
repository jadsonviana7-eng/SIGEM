import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getRotas,
  getVeiculos,
  getMotoristas,
  getAlunosTransporte,
  getPontosEmbarque,
  getManutencoes,
  getCustosTransporte,
  getViagensDiario,
  injectTransporteMockData
} from "../services/transporteService";
import { getAlunos } from "../services/alunosService";
import { Spinner, Btn, Badge } from "../components/ui";

import DashboardTransporte from "./transporte/components/DashboardTransporte";
import RotasTransporte from "./transporte/components/RotasTransporte";
import VeiculosTransporte from "./transporte/components/VeiculosTransporte";
import MotoristasTransporte from "./transporte/components/MotoristasTransporte";
import AlunosTransporte from "./transporte/components/AlunosTransporte";
import PontosEmbarque from "./transporte/components/PontosEmbarque";
import FrequenciaTransporte from "./transporte/components/FrequenciaTransporte";
import ManutencaoTransporte from "./transporte/components/ManutencaoTransporte";
import CustosTransporte from "./transporte/components/CustosTransporte";
import styles from "./transporte/Transporte.module.css";

export default function Transporte() {
  const { user, selectedEscolaId } = useAuth();
  const activeEscolaId = selectedEscolaId || user?.escolaId || "";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  // Estados dos Dados
  const [rotas, setRotas] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [alunosTransporte, setAlunosTransporte] = useState([]);
  const [alunosEscola, setAlunosEscola] = useState([]);
  const [pontos, setPontos] = useState([]);
  const [manutencoes, setManutencoes] = useState([]);
  const [custos, setCustos] = useState([]);
  const [viagens, setViagens] = useState([]);

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
        rotasList,
        veiculosList,
        motoristasList,
        alunosTranspList,
        alunosGeralList,
        pontosList,
        manutencoesList,
        custosList,
        viagensList
      ] = await Promise.all([
        getRotas(activeEscolaId),
        getVeiculos(activeEscolaId),
        getMotoristas(activeEscolaId),
        getAlunosTransporte(activeEscolaId),
        getAlunos(activeEscolaId),
        getPontosEmbarque(activeEscolaId),
        getManutencoes(activeEscolaId),
        getCustosTransporte(activeEscolaId),
        getViagensDiario(activeEscolaId)
      ]);

      setRotas(rotasList);
      setVeiculos(veiculosList);
      setMotoristas(motoristasList);
      setAlunosTransporte(alunosTranspList);
      setAlunosEscola(alunosGeralList);
      setPontos(pontosList);
      setManutencoes(manutencoesList);
      setCustos(custosList);
      setViagens(viagensList);
    } catch (err) {
      console.error("Erro ao carregar dados do transporte escolar:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGerarMock = async () => {
    if (!window.confirm("Deseja injetar dados de demonstração de transporte escolar (rotas, veículos, motoristas, pontos, alunos, diário de bordo, manutenções e abastecimentos)?")) {
      return;
    }
    setGerando(true);
    try {
      await injectTransporteMockData(activeEscolaId, alunosEscola);
      await fetchData();
      alert("Dados de teste de Transporte Escolar gerados com sucesso!");
    } catch (e) {
      alert("Erro ao gerar dados fictícios: " + e.message);
    } finally {
      setGerando(false);
    }
  };

  // Grupos do Menu Lateral Direito
  const gruposMenu = useMemo(() => [
    {
      titulo: "Visão Geral",
      itens: [
        {
          id: "dashboard",
          label: "Painel Principal",
          subtitulo: "Indicadores & Alertas",
          icon: "layout-dashboard",
          badge: null
        }
      ]
    },
    {
      titulo: "Frota & Logística",
      itens: [
        {
          id: "rotas",
          label: "Rotas & Itinerários",
          subtitulo: "Linhas e percursos",
          icon: "route",
          badge: rotas.length
        },
        {
          id: "veiculos",
          label: "Veículos da Frota",
          subtitulo: "Ônibus, vans e barcos",
          icon: "bus",
          badge: veiculos.length
        },
        {
          id: "pontos",
          label: "Pontos de Embarque",
          subtitulo: "Paradas e referências",
          icon: "map-pin",
          badge: pontos.length
        },
        {
          id: "alunos",
          label: "Alunos Atendidos",
          subtitulo: "Passageiros e PCD",
          icon: "users",
          badge: alunosTransporte.length
        },
        {
          id: "motoristas",
          label: "Motoristas & Monitores",
          subtitulo: "Equipe e CNHs",
          icon: "steering-wheel",
          badge: motoristas.length
        }
      ]
    },
    {
      titulo: "Operação & Despesas",
      itens: [
        {
          id: "frequencia",
          label: "Frequência & Diário",
          subtitulo: "Chamada e viagens",
          icon: "clipboard-check",
          badge: viagens.length
        },
        {
          id: "manutencao",
          label: "Manutenções",
          subtitulo: "Revisões e oficinas",
          icon: "wrench",
          badge: manutencoes.length
        },
        {
          id: "custos",
          label: "Custos & Combustível",
          subtitulo: "Abastecimento e gastos",
          icon: "coin",
          badge: custos.length
        }
      ]
    }
  ], [rotas, veiculos, pontos, alunosTransporte, motoristas, viagens, manutencoes, custos]);

  // Custo Total acumulado para o card da lateral
  const totalDespesas = useMemo(() => {
    const comb = custos.reduce((acc, c) => acc + (Number(c.valorTotal) || 0), 0);
    const man = manutencoes.reduce((acc, m) => acc + (Number(m.custoTotal) || 0), 0);
    return comb + man;
  }, [custos, manutencoes]);

  // Item ativo atual
  const itemAtivoObj = useMemo(() => {
    for (const g of gruposMenu) {
      const found = g.itens.find(i => i.id === activeTab);
      if (found) return found;
    }
    return gruposMenu[0].itens[0];
  }, [gruposMenu, activeTab]);

  // Estados Móveis
  const [resumoMobileAberto, setResumoMobileAberto] = useState(false);
  const mobileTabContainerRef = useRef(null);

  // Lista plana de todos os itens de menu para a barra móvel de abas
  const todosItensMenu = useMemo(() => {
    return gruposMenu.flatMap(g => g.itens);
  }, [gruposMenu]);

  // Rolagem automática suave para manter o chip ativo visível no celular
  useEffect(() => {
    if (mobileTabContainerRef.current) {
      const activeEl = mobileTabContainerRef.current.querySelector(`[data-tab-id="${activeTab}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeTab]);

  if (!activeEscolaId) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Por favor, selecione uma escola vinculada no menu superior para gerenciar o transporte escolar.
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
              <i className="ti ti-bus" />
            </div>
            <div className={styles.mobileTitleText}>
              <span className={styles.mobileTitleMain}>Transporte Escolar</span>
              <span className={styles.mobileTitleSub}>{itemAtivoObj?.label || "Módulo Integrado"}</span>
            </div>
          </div>

          <div className={styles.mobileBarActions}>
            <button
              type="button"
              className={`${styles.mobileActionButton} ${resumoMobileAberto ? styles.mobileActionButtonActive : ""}`}
              onClick={() => setResumoMobileAberto(!resumoMobileAberto)}
              title="Resumo da Frota"
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
                <i className="ti ti-chart-pie" style={{ color: "#60a5fa" }} /> Resumo Geral da Frota
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Indicadores Rápidos</span>
            </div>

            <div className={styles.mobileSummaryGrid}>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Rotas Ativas</span>
                <span className={styles.mobileSummaryValue}>{rotas.length}</span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Veículos</span>
                <span className={styles.mobileSummaryValue}>{veiculos.length}</span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Alunos Transportados</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#34d399" }}>{alunosTransporte.length}</span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Gastos Acumulados</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#f87171", fontSize: 13 }}>
                  {totalDespesas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>

            <div style={{ paddingTop: 4 }}>
              <Btn
                onClick={handleGerarMock}
                disabled={gerando}
                style={{ width: "100%", justifyContent: "center", fontSize: 11, padding: "8px 10px" }}
              >
                <i className="ti ti-database-import" /> {gerando ? "Gerando..." : "Gerar Dados Fictícios de Demonstração"}
              </Btn>
            </div>
          </div>
        )}

        {/* Barra de Abas Deslizante no Topo (Sticky Touch Chips) */}
        <div className={styles.mobileTabsSticky}>
          <div className={styles.mobileTabsScroll} ref={mobileTabContainerRef}>
            {todosItensMenu.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={`mob-tab-${item.id}`}
                  data-tab-id={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`${styles.mobileTabChip} ${isActive ? styles.mobileTabChipActive : ""}`}
                >
                  <i className={`ti ti-${item.icon}`} style={{ fontSize: 15 }} />
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
      {/* ── COLUNA ESQUERDA: CONTEÚDO PRINCIPAL DO MÓDULO ── */}
      {/* ═════════════════════════════════════════════════════ */}
      <div className={styles.contentCol}>
        {/* Conteúdo Dinâmico da Aba Selecionada */}
        {loading ? (
          <Spinner />
        ) : (
          <div>
            {activeTab === "dashboard" && (
              <DashboardTransporte
                rotas={rotas}
                veiculos={veiculos}
                motoristas={motoristas}
                alunos={alunosTransporte}
                pontos={pontos}
                manutencoes={manutencoes}
                custos={custos}
                viagens={viagens}
                onNavigateTab={(tabName) => setActiveTab(tabName)}
              />
            )}

            {activeTab === "rotas" && (
              <RotasTransporte
                rotas={rotas}
                veiculos={veiculos}
                motoristas={motoristas}
                pontos={pontos}
                alunos={alunosTransporte}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "veiculos" && (
              <VeiculosTransporte
                veiculos={veiculos}
                rotas={rotas}
                manutencoes={manutencoes}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "motoristas" && (
              <MotoristasTransporte
                motoristas={motoristas}
                rotas={rotas}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "alunos" && (
              <AlunosTransporte
                alunosTransporte={alunosTransporte}
                alunosEscola={alunosEscola}
                rotas={rotas}
                pontos={pontos}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "pontos" && (
              <PontosEmbarque
                pontos={pontos}
                rotas={rotas}
                alunos={alunosTransporte}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "frequencia" && (
              <FrequenciaTransporte
                rotas={rotas}
                veiculos={veiculos}
                motoristas={motoristas}
                alunos={alunosTransporte}
                viagens={viagens}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "manutencao" && (
              <ManutencaoTransporte
                manutencoes={manutencoes}
                veiculos={veiculos}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "custos" && (
              <CustosTransporte
                custos={custos}
                veiculos={veiculos}
                motoristas={motoristas}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── COLUNA DIREITA: MENU VERTICAL & RESUMO DA FROTA ── */}
      {/* ═════════════════════════════════════════════════════ */}
      <aside className={styles.desktopAside}>
        {/* Cartão de Navegação Vertical */}
        <div style={{
          background: "#1e293b",
          borderRadius: 14,
          padding: "16px",
          border: "1px solid #2c3b52",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 12,
            marginBottom: 12,
            borderBottom: "1px solid #2c3b52"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
              }}>
                <i className="ti ti-bus" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>Menu de Transporte</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Selecione o módulo</div>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchData}
              title="Recarregar Dados"
              style={{
                padding: "6px 8px",
                background: "#243144",
                border: "1px solid #33435c",
                borderRadius: 6,
                color: "#cbd5e1",
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
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  color: "#94a3b8",
                  padding: "0 8px 6px 8px"
                }}>
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
                          background: isActive ? "rgba(59, 130, 246, 0.15)" : "transparent",
                          color: isActive ? "#60a5fa" : "#cbd5e1",
                          fontWeight: isActive ? 700 : 500,
                          fontSize: 13,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                          borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent"
                        }}
                        onMouseOver={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = "#243144";
                            e.currentTarget.style.color = "#ffffff";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#cbd5e1";
                          }
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                          <i
                            className={`ti ti-${item.icon}`}
                            style={{
                              fontSize: 16,
                              color: isActive ? "#60a5fa" : "#94a3b8",
                              flexShrink: 0
                            }}
                          />
                          <span style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}>
                            {item.label}
                          </span>
                        </div>

                        {item.badge !== null && (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 10,
                            background: isActive ? "#3b82f6" : "#243144",
                            color: isActive ? "white" : "#94a3b8",
                            flexShrink: 0
                          }}>
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
        </div>

        {/* Cartão de Resumo Rápido da Frota & Ações */}
        <div style={{
          background: "#1e293b",
          borderRadius: 14,
          padding: "14px 16px",
          border: "1px solid #2c3b52",
          fontSize: 12
        }}>
          <div style={{ fontWeight: 700, color: "#f8fafc", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-chart-pie" style={{ color: "#60a5fa" }} /> Resumo Geral da Frota
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, color: "#94a3b8" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Rotas em Operação:</span>
              <strong style={{ color: "#f8fafc" }}>{rotas.length}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Veículos Cadastrados:</span>
              <strong style={{ color: "#f8fafc" }}>{veiculos.length}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Alunos Transportados:</span>
              <strong style={{ color: "#34d399" }}>{alunosTransporte.length}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #2c3b52", paddingTop: 6, marginTop: 2 }}>
              <span>Gastos Acumulados:</span>
              <strong style={{ color: "#f87171" }}>
                {totalDespesas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </strong>
            </div>
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #2c3b52" }}>
            <Btn
              onClick={handleGerarMock}
              disabled={gerando}
              style={{ width: "100%", justifyContent: "center", fontSize: 11, padding: "7px 10px" }}
            >
              <i className="ti ti-database-import" /> {gerando ? "Gerando..." : "Gerar Dados Fictícios"}
            </Btn>
          </div>
        </div>
      </aside>
    </div>
  );
}

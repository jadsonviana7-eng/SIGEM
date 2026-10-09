import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getItensEstoque,
  getEntradas,
  getSaidas,
  getCardapios,
  getMerendaServida,
  getFornecedores,
  injectAlimentacaoMockData
} from "../services/alimentacaoService";
import { Spinner, Btn, Badge } from "../components/ui";

import DashboardAlimentacao from "./alimentacao/components/DashboardAlimentacao";
import CardapiosAlimentacao from "./alimentacao/components/CardapiosAlimentacao";
import MerendaDiaria from "./alimentacao/components/MerendaDiaria";
import EstoqueAlimentacao from "./alimentacao/components/EstoqueAlimentacao";
import EntradasAlimentacao from "./alimentacao/components/EntradasAlimentacao";
import SaidasAlimentacao from "./alimentacao/components/SaidasAlimentacao";
import ConsumoEscolas from "./alimentacao/components/ConsumoEscolas";
import FornecedoresAlimentacao from "./alimentacao/components/FornecedoresAlimentacao";
import ControleEstoque from "./alimentacao/components/ControleEstoque";

export default function Alimentacao() {
  const { user, selectedEscolaId } = useAuth();
  const activeEscolaId = selectedEscolaId || user?.escolaId || "";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  // Estados dos Dados
  const [itensEstoque, setItensEstoque] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const [cardapios, setCardapios] = useState([]);
  const [merendaServida, setMerendaServida] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);

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
        itensList,
        entradasList,
        saidasList,
        cardapiosList,
        merendaList,
        fornecedoresList
      ] = await Promise.all([
        getItensEstoque(activeEscolaId),
        getEntradas(activeEscolaId),
        getSaidas(activeEscolaId),
        getCardapios(activeEscolaId),
        getMerendaServida(activeEscolaId),
        getFornecedores(activeEscolaId)
      ]);

      setItensEstoque(itensList);
      setEntradas(entradasList);
      setSaidas(saidasList);
      setCardapios(cardapiosList);
      setMerendaServida(merendaList);
      setFornecedores(fornecedoresList);
    } catch (err) {
      console.error("Erro ao carregar dados da alimentação escolar:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGerarMock = async () => {
    if (!window.confirm("Deseja injetar dados de demonstração de Alimentação Escolar (cardápios, estoque da despensa, fornecedores PNAE, entradas, saídas e registros diários de merenda)?")) {
      return;
    }
    setGerando(true);
    try {
      await injectAlimentacaoMockData(activeEscolaId);
      await fetchData();
      alert("Dados de teste de Alimentação Escolar gerados com sucesso!");
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
      titulo: "Cardápio & Refeições",
      itens: [
        {
          id: "cardapios",
          label: "Cardápios Escolares",
          subtitulo: "Planejamento nutricional",
          icon: "clipboard-list",
          badge: cardapios.length
        },
        {
          id: "merenda",
          label: "Merenda Servida",
          subtitulo: "Registro diário e adesão",
          icon: "soup",
          badge: merendaServida.length
        }
      ]
    },
    {
      titulo: "Despensa & Estoque",
      itens: [
        {
          id: "estoque",
          label: "Estoque da Despensa",
          subtitulo: "Catálogo e saldos",
          icon: "packages",
          badge: itensEstoque.length
        },
        {
          id: "entradas",
          label: "Entradas / Compras",
          subtitulo: "Recebimento e NF-e",
          icon: "arrow-down-left",
          badge: entradas.length
        },
        {
          id: "saidas",
          label: "Saídas para Cozinha",
          subtitulo: "Requisições diárias",
          icon: "arrow-up-right",
          badge: saidas.length
        },
        {
          id: "controle",
          label: "Controle & Balanço",
          subtitulo: "Validades e inventário",
          icon: "checklist",
          badge: null
        }
      ]
    },
    {
      titulo: "Gestão & Fornecedores",
      itens: [
        {
          id: "consumo",
          label: "Consumo por Escola",
          subtitulo: "Relatórios e custos PNAE",
          icon: "chart-bar",
          badge: null
        },
        {
          id: "fornecedores",
          label: "Fornecedores PNAE",
          subtitulo: "Agricultura familiar",
          icon: "truck",
          badge: fornecedores.length
        }
      ]
    }
  ], [cardapios, merendaServida, itensEstoque, entradas, saidas, fornecedores]);

  // Cálculos rápidos para o card de resumo
  const totalValorEstoque = useMemo(() => {
    return itensEstoque.reduce((acc, item) => {
      const q = Number(item.quantidadeAtual) || 0;
      const p = Number(item.ultimoPreco) || 0;
      return acc + (q * p);
    }, 0);
  }, [itensEstoque]);

  const totalRefeicoes = useMemo(() => {
    return merendaServida.reduce((acc, m) => acc + (Number(m.refeicoesServidas) || 0), 0);
  }, [merendaServida]);

  if (!activeEscolaId) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Por favor, selecione uma escola vinculada no menu superior para gerenciar a alimentação escolar.
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) 290px",
      gap: 24,
      alignItems: "start"
    }}>
      {/* ═════════════════════════════════════════════════════ */}
      {/* ── COLUNA ESQUERDA: CONTEÚDO PRINCIPAL DO MÓDULO ── */}
      {/* ═════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        {loading ? (
          <Spinner />
        ) : (
          <div>
            {activeTab === "dashboard" && (
              <DashboardAlimentacao
                itensEstoque={itensEstoque}
                entradas={entradas}
                saidas={saidas}
                cardapios={cardapios}
                merendaServida={merendaServida}
                fornecedores={fornecedores}
                onNavigateTab={(tabName) => setActiveTab(tabName)}
              />
            )}

            {activeTab === "cardapios" && (
              <CardapiosAlimentacao
                cardapios={cardapios}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "merenda" && (
              <MerendaDiaria
                merendaServida={merendaServida}
                cardapios={cardapios}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "estoque" && (
              <EstoqueAlimentacao
                itensEstoque={itensEstoque}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "entradas" && (
              <EntradasAlimentacao
                entradas={entradas}
                itensEstoque={itensEstoque}
                fornecedores={fornecedores}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "saidas" && (
              <SaidasAlimentacao
                saidas={saidas}
                itensEstoque={itensEstoque}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "controle" && (
              <ControleEstoque
                itensEstoque={itensEstoque}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "consumo" && (
              <ConsumoEscolas
                itensEstoque={itensEstoque}
                entradas={entradas}
                saidas={saidas}
                merendaServida={merendaServida}
                fornecedores={fornecedores}
              />
            )}

            {activeTab === "fornecedores" && (
              <FornecedoresAlimentacao
                fornecedores={fornecedores}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── COLUNA DIREITA: MENU VERTICAL & RESUMO DESPENSA ── */}
      {/* ═════════════════════════════════════════════════════ */}
      <aside style={{
        position: "sticky",
        top: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}>
        {/* Cartão de Navegação Vertical */}
        <div style={{
          background: "white",
          borderRadius: 14,
          padding: "16px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 12,
            marginBottom: 12,
            borderBottom: "1px solid #f1f5f9"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "linear-gradient(135deg, #047857 0%, #10b981 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                boxShadow: "0 2px 6px rgba(4, 120, 87, 0.3)"
              }}>
                <i className="ti ti-salad" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Alimentação Escolar</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>PNAE & Merenda</div>
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
                          background: isActive ? "#ecfdf5" : "transparent",
                          color: isActive ? "#047857" : "#334155",
                          fontWeight: isActive ? 700 : 500,
                          fontSize: 13,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                          borderLeft: isActive ? "3px solid #059669" : "3px solid transparent"
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
                              color: isActive ? "#047857" : "#64748b",
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
                            background: isActive ? "#059669" : "#f1f5f9",
                            color: isActive ? "white" : "#64748b",
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

        {/* Cartão de Resumo Rápido da Despensa & Ações */}
        <div style={{
          background: "#f8fafc",
          borderRadius: 14,
          padding: "14px 16px",
          border: "1px solid #e2e8f0",
          fontSize: 12
        }}>
          <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-chart-pie" style={{ color: "#059669" }} /> Resumo da Despensa
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, color: "#475569" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Itens Cadastrados:</span>
              <strong style={{ color: "#1e293b" }}>{itensEstoque.length}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Refeições Servidas:</span>
              <strong style={{ color: "#059669" }}>{totalRefeicoes}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Fornecedores Ativos:</span>
              <strong style={{ color: "#1e293b" }}>{fornecedores.length}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: 6, marginTop: 2 }}>
              <span>Valor Estocado:</span>
              <strong style={{ color: "#047857" }}>
                {totalValorEstoque.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </strong>
            </div>
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
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

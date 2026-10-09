import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getCaixas, getCategorias, getTransacoes } from "../../services/financeiroService";
import { Card, Spinner, Btn } from "../../components/ui";
import { injectMockData } from "../../utils/mockDataGenerator";
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
  const [caixas, setCaixas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [transacoes, setTransacoes] = useState([]);

  useEffect(() => {
    if (activeEscolaId) {
      fetchData();
    }
  }, [activeEscolaId]);

  const fetchData = async () => {
    if (!activeEscolaId) return;
    setLoading(true);
    try {
      const [cx, cat, trans] = await Promise.all([
        getCaixas(activeEscolaId),
        getCategorias(activeEscolaId),
        getTransacoes(activeEscolaId)
      ]);
      setCaixas(cx);
      setCategorias(cat);
      setTransacoes(trans);
    } catch (err) {
      console.error("Erro ao carregar dados financeiros", err);
    }
    setLoading(false);
  };

  const handleGerarMock = async () => {
    if (!window.confirm("Deseja gerar dados financeiros fictícios (contas, categorias, receitas e despesas dos últimos meses) para apresentação?")) return;
    setGerando(true);
    try {
      await injectMockData(activeEscolaId);
      await fetchData();
    } catch (e) {
      alert("Erro ao gerar dados: " + e.message);
    } finally {
      setGerando(false);
    }
  };

  if (!activeEscolaId) return <div style={{ padding: 24 }}>Selecione uma escola para ver os dados financeiros.</div>;

  const tabs = [
    { id: "dashboard", label: "Painel Principal", icon: "dashboard" },
    { id: "transacoes", label: "Transações", icon: "receipt" },
    { id: "caixas", label: "Caixas/Contas", icon: "building-bank" },
    { id: "categorias", label: "Categorias", icon: "tags" },
    { id: "relatorios", label: "Relatórios", icon: "chart-pie" }
  ];

  return (
    <div style={{ padding: "0" }}>
      {/* Menu de Abas */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", gap: 16 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 16px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #1a56db" : "2px solid transparent",
                color: activeTab === tab.id ? "#1a56db" : "#6b7280",
                fontWeight: activeTab === tab.id ? 600 : 500,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <i className={`ti ti-${tab.icon}`} /> {tab.label}
            </button>
          ))}
        </div>
        <Btn onClick={handleGerarMock} disabled={gerando} style={{ marginBottom: 6, fontSize: 12 }}>
          <i className="ti ti-database-import" /> {gerando ? "Gerando..." : "Gerar Dados Fictícios"}
        </Btn>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div>
          {activeTab === "dashboard" && <DashboardFinanceiro caixas={caixas} categorias={categorias} transacoes={transacoes} />}
          {activeTab === "transacoes" && <TransacoesFinanceiras caixas={caixas} categorias={categorias} transacoes={transacoes} onReload={fetchData} escolaId={activeEscolaId} />}
          {activeTab === "caixas" && <CaixasFinanceiras caixas={caixas} onReload={fetchData} escolaId={activeEscolaId} transacoes={transacoes} />}
          {activeTab === "categorias" && <CategoriasFinanceiras categorias={categorias} onReload={fetchData} escolaId={activeEscolaId} />}
          {activeTab === "relatorios" && <RelatoriosFinanceiros caixas={caixas} categorias={categorias} transacoes={transacoes} />}
        </div>
      )}
    </div>
  );
}

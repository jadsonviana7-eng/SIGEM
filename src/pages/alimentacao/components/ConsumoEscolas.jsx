import { useMemo } from "react";
import { Card, Badge, Btn } from "../../../components/ui";

export default function ConsumoEscolas({
  itensEstoque = [],
  entradas = [],
  saidas = [],
  merendaServida = [],
  fornecedores = []
}) {
  const analise = useMemo(() => {
    // Total de refeições servidas
    const totalRefeicoes = merendaServida.reduce((acc, m) => acc + (Number(m.refeicoesServidas) || 0), 0);

    // Total financeiro investido em compras/entradas
    const totalGastoEntradas = entradas.reduce((acc, e) => acc + (Number(e.valorTotal) || 0), 0);

    // Compras da Agricultura Familiar vs Convencional
    let gastoPnaeFamiliar = 0;
    let gastoConvencional = 0;

    entradas.forEach(e => {
      const forn = fornecedores.find(f => f.nome === e.fornecedorNome);
      const isPnae = (forn?.tipo || "").toLowerCase().includes("familiar") || (e.fornecedorNome || "").toLowerCase().includes("familiar") || (e.fornecedorNome || "").toLowerCase().includes("coop");
      if (isPnae) {
        gastoPnaeFamiliar += Number(e.valorTotal) || 0;
      } else {
        gastoConvencional += Number(e.valorTotal) || 0;
      }
    });

    const percentualPnae = totalGastoEntradas > 0 ? Math.round((gastoPnaeFamiliar / totalGastoEntradas) * 100) : 35;

    // Custo médio por refeição
    const custoMedioPorRefeicao = totalRefeicoes > 0 ? (totalGastoEntradas / totalRefeicoes) : 0;

    // Total de sobras limpas e restos
    const totalSobrasLimpas = merendaServida.reduce((acc, m) => acc + (Number(m.sobrasLimpasKg) || 0), 0);
    const totalRestoIngesta = merendaServida.reduce((acc, m) => acc + (Number(m.restoIngestaKg) || 0), 0);

    // Consumo por categoria de alimento (baseado nas saídas)
    const categoriasConsumo = {};
    saidas.forEach(s => {
      const item = itensEstoque.find(i => i.id === s.itemId) || { categoria: "Não Perecíveis" };
      const cat = item.categoria || "Outros";
      categoriasConsumo[cat] = (categoriasConsumo[cat] || 0) + (Number(s.quantidade) || 0);
    });

    return {
      totalRefeicoes,
      totalGastoEntradas,
      gastoPnaeFamiliar,
      gastoConvencional,
      percentualPnae,
      custoMedioPorRefeicao,
      totalSobrasLimpas,
      totalRestoIngesta,
      categoriasConsumo
    };
  }, [itensEstoque, entradas, saidas, merendaServida, fornecedores]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Cards de Indicadores de Consumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Card style={{ padding: "16px 20px", borderLeft: "4px solid #10b981" }}>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Refeições Totais</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#065f46", marginTop: 4 }}>
            {analise.totalRefeicoes.toLocaleString("pt-BR")}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Atendimentos registrados</div>
        </Card>

        <Card style={{ padding: "16px 20px", borderLeft: "4px solid #3b82f6" }}>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Custo Médio / Refeição</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1e40af", marginTop: 4 }}>
            {analise.custoMedioPorRefeicao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Investimento per capita</div>
        </Card>

        <Card style={{ padding: "16px 20px", borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Meta PNAE Familiar</span>
            <Badge color={analise.percentualPnae >= 30 ? "green" : "amber"}>
              {analise.percentualPnae >= 30 ? "Meta Atingida" : "Abaixo da Meta"}
            </Badge>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#6b21a8", marginTop: 4 }}>
            {analise.percentualPnae}% <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>(mín. legal 30%)</span>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
            {analise.gastoPnaeFamiliar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em compras da agricultura familiar
          </div>
        </Card>

        <Card style={{ padding: "16px 20px", borderLeft: "4px solid #ef4444" }}>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Controle de Desperdício</span>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#991b1b", marginTop: 4 }}>
            {analise.totalRestoIngesta.toFixed(1)} kg <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>de restos</span>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
            Sobras limpas reaproveitáveis: {analise.totalSobrasLimpas.toFixed(1)} kg
          </div>
        </Card>
      </div>

      {/* Seção Gráfica e Resumo por Categoria */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Distribuição do Consumo de Alimentos */}
        <Card>
          <h4 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#1f2937", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-chart-bar" style={{ color: "#059669" }} /> Volume de Consumo por Categoria
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Object.keys(analise.categoriasConsumo).length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                Nenhum dado de saída registrado até o momento.
              </div>
            ) : (
              Object.entries(analise.categoriasConsumo).map(([cat, qtd], idx) => {
                const maxQtd = Math.max(...Object.values(analise.categoriasConsumo), 1);
                const pct = Math.round((qtd / maxQtd) * 100);

                return (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: "#334155" }}>{cat}</span>
                      <strong style={{ color: "#047857" }}>{qtd.toFixed(1)} un/kg</strong>
                    </div>
                    <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "#10b981",
                          borderRadius: 4
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Prestação de Contas & Cumprimento PNAE */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1f2937", display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-file-certificate" style={{ color: "#7c3aed" }} /> Relatório PNAE / CAE Municipal
            </h4>
            <button
              onClick={() => window.print()}
              style={{
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <i className="ti ti-printer" /> Imprimir Relatório
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "#475569" }}>
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
              <span>Total Gasto em Gêneros Alimentícios:</span>
              <strong style={{ color: "#1e293b" }}>{analise.totalGastoEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
            </div>

            <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#166534" }}>Compras Diretas da Agricultura Familiar (30%+):</span>
              <strong style={{ color: "#166534" }}>{analise.gastoPnaeFamiliar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} ({analise.percentualPnae}%)</strong>
            </div>

            <div style={{ background: "#eff6ff", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#1e40af" }}>Compras Atacadistas Convencionais:</span>
              <strong style={{ color: "#1e40af" }}>{analise.gastoConvencional.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6, fontStyle: "italic" }}>
              * Conforme a Lei nº 11.947/2009 (PNAE), no mínimo 30% do valor repassado pelo FNDE deve ser investido na aquisição de alimentos da agricultura familiar e empreendedor familiar rural.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

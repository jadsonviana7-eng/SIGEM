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
        <Card style={{ padding: "16px 20px", borderLeft: "4px solid #10b981", background: "#1e293b", borderColor: "#2c3b52" }}>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Refeições Totais</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#34d399", marginTop: 4 }}>
            {analise.totalRefeicoes.toLocaleString("pt-BR")}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Atendimentos registrados</div>
        </Card>

        <Card style={{ padding: "16px 20px", borderLeft: "4px solid #3b82f6", background: "#1e293b", borderColor: "#2c3b52" }}>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Custo Médio / Refeição</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#60a5fa", marginTop: 4 }}>
            {analise.custoMedioPorRefeicao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Investimento per capita</div>
        </Card>

        <Card style={{ padding: "16px 20px", borderLeft: "4px solid #8b5cf6", background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Meta PNAE Familiar</span>
            <Badge color={analise.percentualPnae >= 30 ? "green" : "amber"}>
              {analise.percentualPnae >= 30 ? "Meta Atingida" : "Abaixo da Meta"}
            </Badge>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#a78bfa", marginTop: 4 }}>
            {analise.percentualPnae}% <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>(mín. legal 30%)</span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            {analise.gastoPnaeFamiliar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em compras da agricultura familiar
          </div>
        </Card>

        <Card style={{ padding: "16px 20px", borderLeft: "4px solid #ef4444", background: "#1e293b", borderColor: "#2c3b52" }}>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Controle de Desperdício</span>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f87171", marginTop: 4 }}>
            {analise.totalRestoIngesta.toFixed(1)} kg <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>de restos</span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            Sobras limpas reaproveitáveis: {analise.totalSobrasLimpas.toFixed(1)} kg
          </div>
        </Card>
      </div>

      {/* Seção Gráfica e Resumo por Categoria */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Distribuição do Consumo de Alimentos */}
        <Card style={{ background: "#1e293b", borderColor: "#2c3b52" }}>
          <h4 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#f8fafc", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-chart-bar" style={{ color: "#34d399" }} /> Volume de Consumo por Categoria
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Object.keys(analise.categoriasConsumo).length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                Nenhum dado de saída registrado até o momento.
              </div>
            ) : (
              Object.entries(analise.categoriasConsumo).map(([cat, qtd], idx) => {
                const maxQtd = Math.max(...Object.values(analise.categoriasConsumo), 1);
                const pct = Math.round((qtd / maxQtd) * 100);

                return (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: "#cbd5e1" }}>{cat}</span>
                      <strong style={{ color: "#34d399" }}>{qtd.toFixed(1)} un/kg</strong>
                    </div>
                    <div style={{ width: "100%", height: 8, background: "#0f172a", borderRadius: 4, overflow: "hidden", border: "1px solid #33415c" }}>
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
        <Card style={{ background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f8fafc", display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-file-certificate" style={{ color: "#a78bfa" }} /> Relatório PNAE / CAE Municipal
            </h4>
            <button
              onClick={() => window.print()}
              style={{
                background: "#243144",
                border: "1px solid #33435c",
                color: "#e2e8f0",
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <i className="ti ti-printer" /> Imprimir Relatório
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "#94a3b8" }}>
            <div style={{ background: "#243144", border: "1px solid #2c3b52", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
              <span>Total Gasto em Gêneros Alimentícios:</span>
              <strong style={{ color: "#f8fafc" }}>{analise.totalGastoEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
            </div>

            <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6ee7b7" }}>Compras Diretas da Agricultura Familiar (30%+):</span>
              <strong style={{ color: "#34d399" }}>{analise.gastoPnaeFamiliar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} ({analise.percentualPnae}%)</strong>
            </div>

            <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.25)", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#93c5fd" }}>Compras Atacadistas Convencionais:</span>
              <strong style={{ color: "#60a5fa" }}>{analise.gastoConvencional.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
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

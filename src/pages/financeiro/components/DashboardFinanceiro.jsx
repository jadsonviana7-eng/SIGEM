import { Card } from "../../../components/ui";

function MetricCard({ label, value, sub, icon, colors }) {
  const { bg = "#FFFFFF", border = "#e5e5e4", text = "#1a1a18", icon: iconColor = "#888" } = colors || {};
  return (
    <div style={{ background: bg, borderRadius: 8, padding: "20px", border: "none", boxShadow: "0 8px 24px rgba(149, 157, 165, 0.15)", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${iconColor}15`, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
        <i className={`ti ti-${icon}`} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: text }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardFinanceiro({ caixas, categorias, transacoes }) {
  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor));

  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);

  // Cálculos globais
  const saldoInicialGlobal = caixas.reduce((acc, c) => acc + Number(c.saldoInicial || 0), 0);
  const receitasTotais = transacoes.filter(t => t.tipo === "Receita").reduce((acc, t) => acc + Number(t.valor), 0);
  const despesasTotais = transacoes.filter(t => t.tipo === "Despesa").reduce((acc, t) => acc + Number(t.valor), 0);
  const saldoGlobal = saldoInicialGlobal + receitasTotais - despesasTotais;

  // Cálculos do Mês
  const txMes = transacoes.filter(t => t.data.startsWith(mesAtual));
  const receitasMes = txMes.filter(t => t.tipo === "Receita").reduce((acc, t) => acc + Number(t.valor), 0);
  const despesasMes = txMes.filter(t => t.tipo === "Despesa").reduce((acc, t) => acc + Number(t.valor), 0);

  // Últimas Transações
  const ultimasTransacoes = [...transacoes].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
        <MetricCard label="Saldo Global" value={formatarMoeda(saldoGlobal)} sub="Soma de todas as contas" icon="wallet" colors={{ text: saldoGlobal >= 0 ? "#1e3a8a" : "#991b1b", icon: "#3b82f6" }} />
        <MetricCard label="Receitas no Mês" value={formatarMoeda(receitasMes)} sub="Entradas em caixa" icon="arrow-down" colors={{ text: "#14532d", icon: "#10b981" }} />
        <MetricCard label="Despesas no Mês" value={formatarMoeda(despesasMes)} sub="Saídas pagas" icon="arrow-up" colors={{ text: "#7f1d1d", icon: "#ef4444" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#374151" }}>Saldos por Conta / Caixa</h3>
          {caixas.length === 0 ? (
            <p style={{ fontSize: 13, color: "#6b7280" }}>Nenhuma conta cadastrada.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {caixas.map(c => {
                const txCaixa = transacoes.filter(t => t.caixaId === c.id);
                const rec = txCaixa.filter(t => t.tipo === "Receita").reduce((acc, curr) => acc + Number(curr.valor), 0);
                const des = txCaixa.filter(t => t.tipo === "Despesa").reduce((acc, curr) => acc + Number(curr.valor), 0);
                const saldo = Number(c.saldoInicial) + rec - des;
                return (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#1f2937" }}>{c.nome}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{c.banco || "Caixa Físico"}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: saldo < 0 ? "#ef4444" : "#10b981" }}>
                      {formatarMoeda(saldo)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Últimas Transações</h3>
          </div>
          {ultimasTransacoes.length === 0 ? (
            <p style={{ fontSize: 13, color: "#6b7280" }}>Nenhuma transação registrada.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ultimasTransacoes.map(t => {
                const isReceita = t.tipo === "Receita";
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: isReceita ? "#dcfce7" : "#fee2e2", color: isReceita ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      <i className={isReceita ? "ti ti-arrow-down" : "ti ti-arrow-up"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1f2937" }}>{t.descricao}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{t.data.split('-').reverse().join('/')} • {categorias.find(c => c.id === t.categoriaId)?.nome || "S/ Categoria"}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isReceita ? "#10b981" : "#ef4444" }}>
                      {isReceita ? "+" : "-"} {formatarMoeda(t.valor)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

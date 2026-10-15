import { Card } from "../../../components/ui";

function MetricCard({ label, value, sub, icon, colors }) {
  const { text = "var(--text-primary)", icon: iconColor = "#38bdf8", bg = "var(--bg-card)", border = "var(--border-color)" } = colors || {};
  return (
    <div style={{ background: bg, borderRadius: 10, padding: "20px", border: `1px solid ${border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${iconColor}22`, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, border: `1px solid ${iconColor}44` }}>
        <i className={`ti ti-${icon}`} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: text }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{sub}</div>}
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
        <MetricCard
          label="Saldo Global"
          value={formatarMoeda(saldoGlobal)}
          sub="Soma de todas as contas"
          icon="wallet"
          colors={{ text: saldoGlobal >= 0 ? "var(--badge-blue-text, #0369a1)" : "var(--badge-red-text, #b91c1c)", icon: "#3b82f6" }}
        />
        <MetricCard
          label="Receitas no Mês"
          value={formatarMoeda(receitasMes)}
          sub="Entradas em caixa"
          icon="arrow-down"
          colors={{ text: "var(--badge-green-text, #15803d)", icon: "#10b981" }}
        />
        <MetricCard
          label="Despesas no Mês"
          value={formatarMoeda(despesasMes)}
          sub="Saídas pagas"
          icon="arrow-up"
          colors={{ text: "var(--badge-red-text, #b91c1c)", icon: "#ef4444" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>Saldos por Conta / Caixa</h3>
          {caixas.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Nenhuma conta cadastrada.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {caixas.map(c => {
                const txCaixa = transacoes.filter(t => t.caixaId === c.id);
                const rec = txCaixa.filter(t => t.tipo === "Receita").reduce((acc, curr) => acc + Number(curr.valor), 0);
                const des = txCaixa.filter(t => t.tipo === "Despesa").reduce((acc, curr) => acc + Number(curr.valor), 0);
                const saldo = Number(c.saldoInicial) + rec - des;
                return (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{c.nome}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.banco || "Caixa Físico"}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: saldo < 0 ? "var(--badge-red-text, #b91c1c)" : "var(--badge-green-text, #15803d)" }}>
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
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Últimas Transações</h3>
          </div>
          {ultimasTransacoes.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Nenhuma transação registrada.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ultimasTransacoes.map(t => {
                const isReceita = t.tipo === "Receita";
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: isReceita ? "var(--badge-green-bg, rgba(16, 185, 129, 0.15))" : "var(--badge-red-bg, rgba(239, 68, 68, 0.15))", color: isReceita ? "var(--badge-green-text, #15803d)" : "var(--badge-red-text, #b91c1c)", border: `1px solid ${isReceita ? "var(--badge-green-border, rgba(16, 185, 129, 0.3))" : "var(--badge-red-border, rgba(239, 68, 68, 0.3))"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      <i className={isReceita ? "ti ti-arrow-down" : "ti ti-arrow-up"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{t.descricao}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.data.split('-').reverse().join('/')} • {categorias.find(c => c.id === t.categoriaId)?.nome || "S/ Categoria"}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isReceita ? "var(--badge-green-text, #15803d)" : "var(--badge-red-text, #b91c1c)" }}>
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

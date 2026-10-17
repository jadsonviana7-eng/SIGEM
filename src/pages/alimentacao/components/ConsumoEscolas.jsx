import { useMemo } from "react";
import { Badge } from "../../../components/ui";
import styles from "./ConsumoEscolas.module.css";

const CATEGORY_COLORS = [
  "#10b981", // verde
  "#3b82f6", // azul
  "#8b5cf6", // roxo
  "#f59e0b", // âmbar
  "#ec4899", // rosa
  "#06b6d4", // ciano
  "#14b8a6"  // teal
];

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
      const isPnae = (forn?.tipo || "").toLowerCase().includes("familiar") ||
        (e.fornecedorNome || "").toLowerCase().includes("familiar") ||
        (e.fornecedorNome || "").toLowerCase().includes("coop");
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
    <div className={styles.container}>
      {/* Header com Título e Subtítulo */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>
            <i className="ti ti-chart-bar" style={{ color: "#10b981", fontSize: 20 }} />
            Consumo & Relatórios Nutricionais por Escola
          </h3>
          <div className={styles.headerSubtitle}>
            Consolidação do volume de consumo por categoria, índice de desperdício e prestação de contas PNAE.
          </div>
        </div>
      </div>

      {/* Cards de Indicadores de Consumo (Em 1 coluna no mobile para não espremer o texto) */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard} style={{ borderLeft: "4px solid #10b981" }}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Refeições Totais</span>
            <Badge color="green">Atendimentos</Badge>
          </div>
          <div className={styles.kpiValue} style={{ color: "#34d399" }}>
            {analise.totalRefeicoes.toLocaleString("pt-BR")}
          </div>
          <div className={styles.kpiSub}>
            <i className="ti ti-soup" style={{ color: "#10b981" }} />
            <span>Refeições servidas aos estudantes</span>
          </div>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: "4px solid #3b82f6" }}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Custo Médio / Prato</span>
            <Badge color="blue">Per Capita</Badge>
          </div>
          <div className={styles.kpiValue} style={{ color: "#60a5fa" }}>
            {analise.custoMedioPorRefeicao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div className={styles.kpiSub}>
            <i className="ti ti-coin" style={{ color: "#3b82f6" }} />
            <span>Investimento médio por refeição servida</span>
          </div>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Meta PNAE Familiar</span>
            <Badge color={analise.percentualPnae >= 30 ? "green" : "amber"}>
              {analise.percentualPnae >= 30 ? "Meta Atingida" : "Abaixo da Meta"}
            </Badge>
          </div>
          <div className={styles.kpiValue} style={{ color: "#a78bfa" }}>
            {analise.percentualPnae}%{" "}
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>(mín. legal 30%)</span>
          </div>
          <div className={styles.kpiSub}>
            <i className="ti ti-plant" style={{ color: "#a78bfa" }} />
            <span>{analise.gastoPnaeFamiliar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em agricultura familiar</span>
          </div>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: "4px solid #ef4444" }}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Controle de Desperdício</span>
            <Badge color="red">Resíduos</Badge>
          </div>
          <div className={styles.kpiValue} style={{ color: "#f87171" }}>
            {analise.totalRestoIngesta.toFixed(1)} kg{" "}
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>de restos</span>
          </div>
          <div className={styles.kpiSub}>
            <i className="ti ti-recycle" style={{ color: "#34d399" }} />
            <span>Sobras limpas reaproveitáveis: {analise.totalSobrasLimpas.toFixed(1)} kg</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          Seção Principal: No desktop é 2 colunas, no mobile vira 1 coluna
          ══════════════════════════════════════════════════════════════════ */}
      <div className={styles.mainGrid}>
        {/* Card 1: Distribuição do Consumo de Alimentos por Categoria */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>
              <i className="ti ti-chart-bar" style={{ color: "#34d399" }} />
              Volume de Consumo por Categoria
            </h4>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Baseado nas requisições da cozinha
            </span>
          </div>

          <div className={styles.categoryList}>
            {Object.keys(analise.categoriasConsumo).length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                <i className="ti ti-packages" style={{ fontSize: 24, display: "block", marginBottom: 6, opacity: 0.5 }} />
                Nenhum dado de saída registrado até o momento.
              </div>
            ) : (
              Object.entries(analise.categoriasConsumo).map(([cat, qtd], idx) => {
                const maxQtd = Math.max(...Object.values(analise.categoriasConsumo), 1);
                const pct = Math.round((qtd / maxQtd) * 100);
                const barColor = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

                return (
                  <div key={idx} className={styles.categoryItem}>
                    <div className={styles.categoryTop}>
                      <span className={styles.categoryName}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: barColor, display: "inline-block" }} />
                        {cat}
                      </span>
                      <strong className={styles.categoryVal} style={{ color: barColor }}>
                        {qtd.toFixed(1)} un/kg
                      </strong>
                    </div>

                    <div className={styles.progressBarTrack}>
                      <div
                        className={styles.progressBarFill}
                        style={{
                          width: `${pct}%`,
                          background: barColor
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Card 2: Prestação de Contas & Cumprimento PNAE */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>
              <i className="ti ti-file-certificate" style={{ color: "#a78bfa" }} />
              Relatório PNAE / CAE Municipal
            </h4>
            <button
              onClick={() => window.print()}
              className={styles.btnPrint}
              title="Imprimir relatório analítico para o Conselho de Alimentação Escolar"
            >
              <i className="ti ti-printer" /> Imprimir Relatório
            </button>
          </div>

          {/* Barra de Progresso da Meta PNAE (30%) */}
          <div className={styles.pnaeMeterBox}>
            <div className={styles.pnaeMeterHeader}>
              <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                Meta Agricultura Familiar: <strong>{analise.percentualPnae}%</strong> alcançado
              </span>
              <span style={{ color: analise.percentualPnae >= 30 ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                Mínimo exigido: 30%
              </span>
            </div>

            <div className={styles.progressBarTrack} style={{ height: 10 }}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${Math.min(analise.percentualPnae, 100)}%`,
                  background: analise.percentualPnae >= 30 ? "#10b981" : "#f59e0b"
                }}
              />
            </div>
          </div>

          {/* Detalhamento Financeiro */}
          <div className={styles.pnaeItemsList}>
            <div className={styles.pnaeRow}>
              <span className={styles.pnaeLabel}>
                <i className="ti ti-receipt-2" style={{ color: "#94a3b8" }} /> Total em Gêneros Alimentícios:
              </span>
              <strong className={styles.pnaeVal}>
                {analise.totalGastoEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </strong>
            </div>

            <div className={`${styles.pnaeRow} ${styles.pnaeRowHighlightGreen}`}>
              <span className={styles.pnaeLabel} style={{ color: "#6ee7b7" }}>
                <i className="ti ti-leaf" style={{ color: "#34d399" }} /> Agricultura Familiar (30%+):
              </span>
              <strong style={{ color: "#34d399" }}>
                {analise.gastoPnaeFamiliar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}{" "}
                <span style={{ fontSize: 12, opacity: 0.9 }}>({analise.percentualPnae}%)</span>
              </strong>
            </div>

            <div className={`${styles.pnaeRow} ${styles.pnaeRowHighlightBlue}`}>
              <span className={styles.pnaeLabel} style={{ color: "#93c5fd" }}>
                <i className="ti ti-truck-delivery" style={{ color: "#60a5fa" }} /> Compras Convencionais:
              </span>
              <strong style={{ color: "#60a5fa" }}>
                {analise.gastoConvencional.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </strong>
            </div>
          </div>

          <div className={styles.legalNotice}>
            <i className="ti ti-info-circle" style={{ marginRight: 4, color: "#8b5cf6" }} />
            Conforme a <strong>Lei Federal nº 11.947/2009 (PNAE)</strong>, no mínimo 30% dos recursos repassados pelo FNDE devem ser aplicados diretamente na aquisição de alimentos da agricultura familiar e do empreendedor familiar rural.
          </div>
        </div>
      </div>

      {/* Histórico Recente de Refeições Servidas */}
      {merendaServida.length > 0 && (
        <div className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <i className="ti ti-calendar-event" style={{ color: "#10b981" }} />
            Histórico Recente de Refeições Registradas
          </div>

          {/* Versão Desktop */}
          <div className="sigem-desktop-table" style={{ overflowX: "auto" }}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Turno</th>
                  <th>Cardápio Servido</th>
                  <th>Refeições Servidas</th>
                  <th>Aceitabilidade</th>
                  <th>Resíduos (Restos)</th>
                </tr>
              </thead>
              <tbody>
                {merendaServida.slice(0, 6).map((m, idx) => (
                  <tr key={m.id || idx}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {m.data ? new Date(m.data + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                    </td>
                    <td>
                      <Badge color="blue">{m.turno || "Geral"}</Badge>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {m.cardapioRef || "Alimentação balanceada"}
                    </td>
                    <td style={{ fontWeight: 700, color: "#34d399" }}>
                      {m.refeicoesServidas || 0} alunos
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {m.aceitabilidade || "Ótima"}
                    </td>
                    <td style={{ color: Number(m.restoIngestaKg) > 2 ? "#f87171" : "var(--text-muted)" }}>
                      {Number(m.restoIngestaKg || 0).toFixed(1)} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Versão Mobile em Cards */}
          <div className="sigem-mobile-cards">
            <div className={styles.historyMobileList}>
              {merendaServida.slice(0, 5).map((m, idx) => (
                <div key={`mob-hist-${m.id || idx}`} className={styles.historyMobileCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13.5 }}>
                      📅 {m.data ? new Date(m.data + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                    </span>
                    <Badge color="blue">{m.turno || "Geral"}</Badge>
                  </div>

                  <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                    {m.cardapioRef || "Alimentação balanceada"}
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px dashed var(--border-color)",
                    paddingTop: 6,
                    fontSize: 12
                  }}>
                    <span style={{ color: "#34d399", fontWeight: 700 }}>
                      🍽️ {m.refeicoesServidas || 0} refeições
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      Restos: {Number(m.restoIngestaKg || 0).toFixed(1)} kg
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

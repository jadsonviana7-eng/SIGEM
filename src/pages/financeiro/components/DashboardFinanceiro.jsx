import React, { useMemo } from "react";
import styles from "./DashboardFinanceiro.module.css";

export default function DashboardFinanceiro({
  caixas = [],
  categorias = [],
  transacoes = [],
  selectedEscola = {},
  onNavigateTab
}) {
  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));

  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);

  // Cálculos globais
  const stats = useMemo(() => {
    const saldoInicialGlobal = caixas.reduce((acc, c) => acc + Number(c.saldoInicial || 0), 0);
    const receitasTotais = transacoes
      .filter((t) => t.tipo === "Receita")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const despesasTotais = transacoes
      .filter((t) => t.tipo === "Despesa")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const saldoGlobal = saldoInicialGlobal + receitasTotais - despesasTotais;

    // Cálculos do Mês
    const txMes = transacoes.filter((t) => (t.data || "").startsWith(mesAtual));
    const receitasMes = txMes
      .filter((t) => t.tipo === "Receita")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const despesasMes = txMes
      .filter((t) => t.tipo === "Despesa")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const saldoMes = receitasMes - despesasMes;

    return {
      saldoGlobal,
      receitasMes,
      despesasMes,
      saldoMes,
      totalCaixas: caixas.length
    };
  }, [caixas, transacoes, mesAtual]);

  // Últimas Transações
  const ultimasTransacoes = useMemo(() => {
    return [...transacoes]
      .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
      .slice(0, 5);
  }, [transacoes]);

  return (
    <div className={styles.container}>
      {/* 1. BANNER INSTITUCIONAL */}
      <div className={styles.banner}>
        <div>
          <span className={styles.bannerTag}>CONTROLE & PRESTAÇÃO DE CONTAS</span>
          <h2 className={styles.bannerTitle}>Gestão Financeira & Caixa Escolar</h2>
          <p className={styles.bannerSubtitle}>
            Acompanhe saldos bancários, verbas federais/municipais (PDDE, FNDE), entradas e despesas operacionais da unidade <strong>{selectedEscola.nome || "Escola Municipal"}</strong>.
          </p>
        </div>

        <div className={styles.bannerActions}>
          <button
            type="button"
            className={styles.bannerBtnPrimary}
            onClick={() => onNavigateTab && onNavigateTab("transacoes")}
          >
            <i className="ti ti-plus" />
            <span>Nova Transação</span>
          </button>
          <button
            type="button"
            className={styles.bannerBtnSecondary}
            onClick={() => onNavigateTab && onNavigateTab("relatorios")}
          >
            <i className="ti ti-chart-pie" />
            <span>Fluxo de Caixa</span>
          </button>
        </div>
      </div>

      {/* 2. GRADE DE KPIS PRINCIPAIS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{
              background: stats.saldoGlobal >= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: stats.saldoGlobal >= 0 ? "#34d399" : "#f87171"
            }}
          >
            <i className="ti ti-wallet" />
          </div>
          <div className={styles.statInfo}>
            <span
              className={styles.statValue}
              style={{ color: stats.saldoGlobal >= 0 ? "#34d399" : "#f87171" }}
            >
              {formatarMoeda(stats.saldoGlobal)}
            </span>
            <span className={styles.statLabel}>Saldo Global Disponível</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}
          >
            <i className="ti ti-arrow-down" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{formatarMoeda(stats.receitasMes)}</span>
            <span className={styles.statLabel}>Receitas no Mês Atual</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}
          >
            <i className="ti ti-arrow-up" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{formatarMoeda(stats.despesasMes)}</span>
            <span className={styles.statLabel}>Despesas no Mês Atual</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}
          >
            <i className="ti ti-building-bank" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalCaixas}</span>
            <span className={styles.statLabel}>Contas Bancárias / Caixas</span>
          </div>
        </div>
      </div>

      {/* 3. GRIDS DE CONTEÚDO (DUAS COLUNAS NO DESKTOP / 1 NO MOBILE) */}
      <div className={styles.splitGrid}>
        {/* Saldos por Conta */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionCardHeader}>
            <h3 className={styles.sectionCardTitle}>
              <i className="ti ti-building-bank" style={{ color: "#38bdf8" }} />
              Saldos por Conta / Caixa
            </h3>
            <button
              type="button"
              className={styles.btnLink}
              onClick={() => onNavigateTab && onNavigateTab("caixas")}
            >
              Gerenciar Contas →
            </button>
          </div>

          {caixas.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)" }}>
              Nenhuma conta bancária ou caixa cadastrado.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {caixas.map((c) => {
                const txCaixa = transacoes.filter((t) => t.caixaId === c.id);
                const rec = txCaixa
                  .filter((t) => t.tipo === "Receita")
                  .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
                const des = txCaixa
                  .filter((t) => t.tipo === "Despesa")
                  .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
                const saldo = Number(c.saldoInicial || 0) + rec - des;

                return (
                  <div key={c.id} className={styles.caixaItem}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #ffffff)" }}>
                        {c.nome}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                        {c.banco || "Caixa Operacional"} {c.agencia ? `· Ag: ${c.agencia}` : ""} {c.conta ? `· CC: ${c.conta}` : ""}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: saldo < 0 ? "#f87171" : "#34d399"
                      }}
                    >
                      {formatarMoeda(saldo)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimas Transações */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionCardHeader}>
            <h3 className={styles.sectionCardTitle}>
              <i className="ti ti-receipt" style={{ color: "#34d399" }} />
              Últimas Transações Registradas
            </h3>
            <button
              type="button"
              className={styles.btnLink}
              onClick={() => onNavigateTab && onNavigateTab("transacoes")}
            >
              Ver Extrato Completo →
            </button>
          </div>

          {ultimasTransacoes.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)" }}>
              Nenhuma transação financeira registrada até o momento.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ultimasTransacoes.map((t) => {
                const isReceita = t.tipo === "Receita";
                const cat = categorias.find((c) => c.id === t.categoriaId);
                const dataFormatada = (t.data || "").split("-").reverse().join("/");

                return (
                  <div key={t.id} className={styles.txItem}>
                    <div
                      className={styles.txIcon}
                      style={{
                        background: isReceita ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: isReceita ? "#34d399" : "#f87171",
                        border: `1px solid ${isReceita ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                      }}
                    >
                      <i className={isReceita ? "ti ti-arrow-down" : "ti ti-arrow-up"} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text-primary, #ffffff)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {t.descricao}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                        {dataFormatada} · {cat?.nome || "Geral"}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: isReceita ? "#34d399" : "#f87171",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {isReceita ? "+" : "-"} {formatarMoeda(t.valor)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

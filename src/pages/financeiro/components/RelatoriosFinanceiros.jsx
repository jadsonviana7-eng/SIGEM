import React, { useState } from "react";
import { Select } from "../../../components/ui";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale/pt-BR";
import styles from "./RelatoriosFinanceiros.module.css";
registerLocale("pt-BR", ptBR);

export default function RelatoriosFinanceiros({ transacoes = [], caixas = [], categorias = [] }) {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [tipoRelatorio, setTipoRelatorio] = useState("fluxo"); // fluxo, categoria, caixa

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));

  const dataInicioStr = startDate ? startDate.toISOString().split("T")[0] : "";
  const dataFimStr = endDate ? endDate.toISOString().split("T")[0] : "";

  // Filtragem Global por Data
  const txFiltradas = transacoes.filter((t) => {
    if (dataInicioStr && (t.data || "") < dataInicioStr) return false;
    if (dataFimStr && (t.data || "") > dataFimStr) return false;
    return true;
  });

  // Funções Geradoras de Relatório
  const gerarFluxoCaixa = () => {
    const receitas = txFiltradas
      .filter((t) => t.tipo === "Receita")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const despesas = txFiltradas
      .filter((t) => t.tipo === "Despesa")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);
    return { receitas, despesas, saldo: receitas - despesas };
  };

  const gerarPorCategoria = () => {
    const resumo = {};
    txFiltradas.forEach((t) => {
      const catNome = categorias.find((c) => c.id === t.categoriaId)?.nome || "Sem Categoria";
      if (!resumo[catNome]) resumo[catNome] = { Receita: 0, Despesa: 0 };
      resumo[catNome][t.tipo] += Number(t.valor || 0);
    });
    return Object.entries(resumo)
      .map(([nome, vals]) => ({ nome, ...vals }))
      .sort((a, b) => b.Despesa - a.Despesa || b.Receita - a.Receita);
  };

  const gerarPorCaixa = () => {
    const resumo = {};
    txFiltradas.forEach((t) => {
      const cxNome = caixas.find((c) => c.id === t.caixaId)?.nome || "Conta Geral";
      if (!resumo[cxNome]) resumo[cxNome] = { Receita: 0, Despesa: 0 };
      resumo[cxNome][t.tipo] += Number(t.valor || 0);
    });
    return Object.entries(resumo)
      .map(([nome, vals]) => ({ nome, ...vals }))
      .sort((a, b) => b.Despesa - a.Despesa || b.Receita - a.Receita);
  };

  const dados = tipoRelatorio === "categoria" ? gerarPorCategoria() : gerarPorCaixa();
  const fluxo = gerarFluxoCaixa();

  return (
    <div className={styles.container}>
      {/* 1. BARRA DE CABEÇALHO */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-chart-pie-2" style={{ color: "#34d399" }} />
            Relatórios Financeiros & Balancete
          </div>
          <p className={styles.headerSubtitle}>
            Consolidação do fluxo de caixa e demonstrativo sintético de receitas e despesas por rubrica ou conta bancária.
          </p>
        </div>

        <button
          type="button"
          className={styles.btnPrint}
          onClick={() => window.print()}
        >
          <i className="ti ti-printer" />
          <span>Imprimir Balancete</span>
        </button>
      </div>

      {/* 2. BARRA DE FILTROS */}
      <div className={styles.filtersBar}>
        <div>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", marginBottom: 6 }}>
            Filtrar Período de Apuração
          </label>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => setDateRange(update)}
            locale="pt-BR"
            dateFormat="dd/MM/yyyy"
            isClearable={true}
            placeholderText="Clique para selecionar o período"
            customInput={
              <input
                style={{
                  border: "1px solid var(--border-subtle, #33435c)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  width: "100%",
                  outline: "none",
                  fontFamily: "inherit",
                  background: "var(--bg-surface, #243144)",
                  color: "#ffffff"
                }}
              />
            }
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", marginBottom: 6 }}>
            Modelo de Demonstrativo
          </label>
          <Select value={tipoRelatorio} onChange={(e) => setTipoRelatorio(e.target.value)}>
            <option value="fluxo">Fluxo de Caixa (Resumo Geral)</option>
            <option value="categoria">Receitas e Despesas por Categoria</option>
            <option value="caixa">Movimentação por Conta / Caixa</option>
          </Select>
        </div>
      </div>

      {/* 3. RELATÓRIO DO TIPO FLUXO DE CAIXA */}
      {tipoRelatorio === "fluxo" && (
        <div className={styles.fluxoGrid}>
          <div
            className={styles.fluxoCard}
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)"
            }}
          >
            <span className={styles.fluxoLabel} style={{ color: "#34d399" }}>
              Total de Entradas (Receitas)
            </span>
            <span className={styles.fluxoValue} style={{ color: "#34d399" }}>
              {formatarMoeda(fluxo.receitas)}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
              Repasses e rendimentos creditados
            </span>
          </div>

          <div
            className={styles.fluxoCard}
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)"
            }}
          >
            <span className={styles.fluxoLabel} style={{ color: "#f87171" }}>
              Total de Saídas (Despesas)
            </span>
            <span className={styles.fluxoValue} style={{ color: "#f87171" }}>
              {formatarMoeda(fluxo.despesas)}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
              Pagamentos de custeio e capital
            </span>
          </div>

          <div
            className={styles.fluxoCard}
            style={{
              background: fluxo.saldo >= 0 ? "rgba(59, 130, 246, 0.12)" : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${fluxo.saldo >= 0 ? "rgba(59, 130, 246, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
            }}
          >
            <span className={styles.fluxoLabel} style={{ color: fluxo.saldo >= 0 ? "#60a5fa" : "#fca5a5" }}>
              Resultado Operacional Líquido
            </span>
            <span className={styles.fluxoValue} style={{ color: fluxo.saldo >= 0 ? "#60a5fa" : "#f87171" }}>
              {formatarMoeda(fluxo.saldo)}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
              {fluxo.saldo >= 0 ? "Superávit do período apurado" : "Déficit do período apurado"}
            </span>
          </div>
        </div>
      )}

      {/* 4. RELATÓRIO POR CATEGORIA OU CONTA */}
      {tipoRelatorio !== "fluxo" && (
        <>
          {/* Tabela em Desktop */}
          <div className={styles.tableContainer}>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>{tipoRelatorio === "categoria" ? "Categoria / Rubrica" : "Conta / Caixa"}</th>
                    <th style={{ textAlign: "right" }}>Entradas (Receitas)</th>
                    <th style={{ textAlign: "right" }}>Saídas (Despesas)</th>
                    <th style={{ textAlign: "right" }}>Saldo Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: 28, color: "var(--text-muted, #94a3b8)" }}>
                        Nenhuma movimentação registrada no período selecionado.
                      </td>
                    </tr>
                  ) : (
                    dados.map((d) => {
                      const saldo = d.Receita - d.Despesa;
                      return (
                        <tr key={d.nome}>
                          <td style={{ fontWeight: 700, color: "var(--text-primary, #ffffff)" }}>
                            {d.nome}
                          </td>
                          <td style={{ textAlign: "right", color: "#34d399", fontWeight: 700 }}>
                            {d.Receita > 0 ? formatarMoeda(d.Receita) : "—"}
                          </td>
                          <td style={{ textAlign: "right", color: "#f87171", fontWeight: 700 }}>
                            {d.Despesa > 0 ? formatarMoeda(d.Despesa) : "—"}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              fontWeight: 800,
                              color: saldo >= 0 ? "#34d399" : "#f87171"
                            }}
                          >
                            {formatarMoeda(saldo)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards em Mobile */}
          <div className={styles.mobileCards}>
            {dados.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, background: "var(--bg-card, #1e293b)", borderRadius: 14, color: "var(--text-muted, #94a3b8)" }}>
                Nenhuma movimentação registrada no período selecionado.
              </div>
            ) : (
              dados.map((d) => {
                const saldo = d.Receita - d.Despesa;
                return (
                  <div key={d.nome} className={styles.relCardMobile}>
                    <div className={styles.relCardTop}>
                      <span style={{ fontWeight: 700, color: "#ffffff", fontSize: 14 }}>{d.nome}</span>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 14,
                          color: saldo >= 0 ? "#34d399" : "#f87171"
                        }}
                      >
                        {formatarMoeda(saldo)}
                      </span>
                    </div>

                    <div className={styles.relCardValues}>
                      <span>
                        Entradas: <strong style={{ color: "#34d399" }}>{d.Receita > 0 ? formatarMoeda(d.Receita) : "—"}</strong>
                      </span>
                      <span>
                        Saídas: <strong style={{ color: "#f87171" }}>{d.Despesa > 0 ? formatarMoeda(d.Despesa) : "—"}</strong>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

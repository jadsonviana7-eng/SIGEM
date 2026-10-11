import { useState } from "react";
import { Card, Input, Select, Btn, EmptyState } from "../../../components/ui";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale/pt-BR";
registerLocale("pt-BR", ptBR);

export default function RelatoriosFinanceiros({ transacoes, caixas, categorias }) {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [tipoRelatorio, setTipoRelatorio] = useState("fluxo"); // fluxo, categoria, caixa

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor));

  const dataInicioStr = startDate ? startDate.toISOString().split("T")[0] : "";
  const dataFimStr = endDate ? endDate.toISOString().split("T")[0] : "";

  // Filtragem Global por Data
  const txFiltradas = transacoes.filter(t => {
    if (dataInicioStr && t.data < dataInicioStr) return false;
    if (dataFimStr && t.data > dataFimStr) return false;
    return true;
  });

  // Funções Geradoras de Relatório
  const gerarFluxoCaixa = () => {
    const receitas = txFiltradas.filter(t => t.tipo === "Receita").reduce((acc, t) => acc + Number(t.valor), 0);
    const despesas = txFiltradas.filter(t => t.tipo === "Despesa").reduce((acc, t) => acc + Number(t.valor), 0);
    return { receitas, despesas, saldo: receitas - despesas };
  };

  const gerarPorCategoria = () => {
    const resumo = {};
    txFiltradas.forEach(t => {
      const catNome = categorias.find(c => c.id === t.categoriaId)?.nome || "Sem Categoria";
      if (!resumo[catNome]) resumo[catNome] = { Receita: 0, Despesa: 0 };
      resumo[catNome][t.tipo] += Number(t.valor);
    });
    return Object.entries(resumo).map(([nome, vals]) => ({ nome, ...vals })).sort((a, b) => b.Despesa - a.Despesa || b.Receita - a.Receita);
  };

  const gerarPorCaixa = () => {
    const resumo = {};
    txFiltradas.forEach(t => {
      const cxNome = caixas.find(c => c.id === t.caixaId)?.nome || "Conta Desconhecida";
      if (!resumo[cxNome]) resumo[cxNome] = { Receita: 0, Despesa: 0 };
      resumo[cxNome][t.tipo] += Number(t.valor);
    });
    return Object.entries(resumo).map(([nome, vals]) => ({ nome, ...vals })).sort((a, b) => b.Despesa - a.Despesa || b.Receita - a.Receita);
  };

  const renderizarRelatorio = () => {
    if (txFiltradas.length === 0) return <EmptyState icon="chart-pie" texto="Nenhuma transação encontrada neste período." />;

    if (tipoRelatorio === "fluxo") {
      const fluxo = gerarFluxoCaixa();
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: 20, borderRadius: 8, border: "1px solid rgba(16, 185, 129, 0.25)" }}>
            <div style={{ fontSize: 13, color: "#34d399", fontWeight: 600, textTransform: "uppercase" }}>Total de Receitas</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#34d399", marginTop: 8 }}>{formatarMoeda(fluxo.receitas)}</div>
          </div>
          <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: 20, borderRadius: 8, border: "1px solid rgba(239, 68, 68, 0.25)" }}>
            <div style={{ fontSize: 13, color: "#f87171", fontWeight: 600, textTransform: "uppercase" }}>Total de Despesas</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#f87171", marginTop: 8 }}>{formatarMoeda(fluxo.despesas)}</div>
          </div>
          <div style={{ background: fluxo.saldo >= 0 ? "rgba(59, 130, 246, 0.12)" : "rgba(239, 68, 68, 0.15)", padding: 20, borderRadius: 8, border: `1px solid ${fluxo.saldo >= 0 ? "rgba(59, 130, 246, 0.3)" : "rgba(239, 68, 68, 0.3)"}` }}>
            <div style={{ fontSize: 13, color: fluxo.saldo >= 0 ? "#60a5fa" : "#fca5a5", fontWeight: 600, textTransform: "uppercase" }}>Resultado Líquido</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: fluxo.saldo >= 0 ? "#60a5fa" : "#f87171", marginTop: 8 }}>{formatarMoeda(fluxo.saldo)}</div>
          </div>
        </div>
      );
    }

    const dados = tipoRelatorio === "categoria" ? gerarPorCategoria() : gerarPorCaixa();
    
    return (
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
        <thead>
          <tr style={{ background: "#243144", borderBottom: "1px solid #33435c", color: "#cbd5e1" }}>
            <th style={{ padding: "12px 16px", fontWeight: 600 }}>{tipoRelatorio === "categoria" ? "Categoria" : "Conta / Caixa"}</th>
            <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Entradas (Receitas)</th>
            <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Saídas (Despesas)</th>
            <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Saldo Líquido</th>
          </tr>
        </thead>
        <tbody>
          {dados.map(d => {
            const saldo = d.Receita - d.Despesa;
            return (
              <tr key={d.nome} style={{ borderBottom: "1px solid #2c3b52" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#f8fafc" }}>{d.nome}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", color: "#34d399", fontWeight: 600 }}>{d.Receita > 0 ? formatarMoeda(d.Receita) : "-"}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", color: "#f87171", fontWeight: 600 }}>{d.Despesa > 0 ? formatarMoeda(d.Despesa) : "-"}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, color: saldo >= 0 ? "#34d399" : "#f87171" }}>{formatarMoeda(saldo)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", margin: 0 }}>Relatórios Financeiros</h3>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, padding: 16, background: "#243144", borderRadius: 8, border: "1px solid #33435c", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 4 }}>Período (Clique na data inicial e arraste até a final)</label>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => setDateRange(update)}
            locale="pt-BR"
            dateFormat="dd/MM/yyyy"
            isClearable={true}
            placeholderText="Selecione as datas"
            customInput={<input style={{ border: "1px solid #33435c", borderRadius: 6, padding: "7px 10px", fontSize: 13, width: "100%", outline: "none", fontFamily: "inherit", background: "#1e293b", color: "#ffffff" }} />}
          />
        </div>
        <div style={{ width: 220 }}>
          <Select label="Tipo de Relatório" value={tipoRelatorio} onChange={e => setTipoRelatorio(e.target.value)}>
            <option value="fluxo">Fluxo de Caixa (Resumo Geral)</option>
            <option value="categoria">Receitas e Despesas por Categoria</option>
            <option value="caixa">Movimentação por Conta/Caixa</option>
          </Select>
        </div>
        <Btn onClick={() => { setDateRange([null, null]); setTipoRelatorio("fluxo"); }}>Limpar Filtros</Btn>
      </div>

      {renderizarRelatorio()}
    </Card>
  );
}

import React, { useState, useMemo } from "react";
import { addTransacao, updateTransacao, deleteTransacao } from "../../../services/financeiroService";
import { Input, Modal, Select, Badge } from "../../../components/ui";
import styles from "./TransacoesFinanceiras.module.css";

export default function TransacoesFinanceiras({ transacoes = [], caixas = [], categorias = [], onReload, escolaId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const hoje = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    id: null,
    descricao: "",
    valor: "",
    data: hoje,
    tipo: "Despesa",
    categoriaId: "",
    caixaId: ""
  });
  const [salvando, setSalvando] = useState(false);

  const [filtroMes, setFiltroMes] = useState(hoje.slice(0, 7)); // YYYY-MM
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCaixa, setFiltroCaixa] = useState("");

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));

  const handleOpenNew = (tipoPadrao = "Despesa") => {
    setFormData({
      id: null,
      descricao: "",
      valor: "",
      data: hoje,
      tipo: tipoPadrao,
      categoriaId: categorias[0]?.id || "",
      caixaId: caixas[0]?.id || ""
    });
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setFormData({ ...t });
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.descricao || !formData.valor || !formData.categoriaId || !formData.caixaId) {
      return alert("Preencha todos os campos obrigatórios.");
    }
    setSalvando(true);
    try {
      if (isEditing) {
        const { id, ...dados } = formData;
        await updateTransacao(id, { ...dados, valor: Number(dados.valor) });
      } else {
        await addTransacao({
          escolaId,
          ...formData,
          valor: Number(formData.valor)
        });
      }
      setModalOpen(false);
      onReload();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar transação: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir esta transação? A alteração do saldo será recalculada automaticamente.")) {
      await deleteTransacao(id);
      onReload();
    }
  };

  // Filtragem
  const txFiltradas = useMemo(() => {
    return transacoes
      .filter((t) => {
        if (filtroMes && !(t.data || "").startsWith(filtroMes)) return false;
        if (filtroTipo && t.tipo !== filtroTipo) return false;
        if (filtroCaixa && t.caixaId !== filtroCaixa) return false;
        return true;
      })
      .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
  }, [transacoes, filtroMes, filtroTipo, filtroCaixa]);

  // KPIs do Período
  const kpis = useMemo(() => {
    const totalCount = txFiltradas.length;
    const receitas = txFiltradas
      .filter((t) => t.tipo === "Receita")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const despesas = txFiltradas
      .filter((t) => t.tipo === "Despesa")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const saldo = receitas - despesas;

    return {
      totalCount,
      receitas,
      despesas,
      saldo
    };
  }, [txFiltradas]);

  return (
    <div className={styles.container}>
      {/* 1. KPIS DO EXTRATO */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}
          >
            <i className="ti ti-receipt" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.totalCount}</span>
            <span className={styles.statLabel}>Lançamentos no Período</span>
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
            <span className={styles.statValue} style={{ color: "#34d399" }}>
              {formatarMoeda(kpis.receitas)}
            </span>
            <span className={styles.statLabel}>Entradas (Receitas)</span>
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
            <span className={styles.statValue} style={{ color: "#f87171" }}>
              {formatarMoeda(kpis.despesas)}
            </span>
            <span className={styles.statLabel}>Saídas (Despesas)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{
              background: kpis.saldo >= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: kpis.saldo >= 0 ? "#34d399" : "#f87171"
            }}
          >
            <i className="ti ti-scale" />
          </div>
          <div className={styles.statInfo}>
            <span
              className={styles.statValue}
              style={{ color: kpis.saldo >= 0 ? "#34d399" : "#f87171" }}
            >
              {formatarMoeda(kpis.saldo)}
            </span>
            <span className={styles.statLabel}>Resultado do Período</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE CABEÇALHO */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-receipt-2" style={{ color: "#34d399" }} />
            Registro & Extrato de Transações Financeiras
          </div>
          <p className={styles.headerSubtitle}>
            Consulte, filtre e registre entradas de repasses (PDDE, FNDE, Cantina) e despesas de custeio/capital.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnReceita}
            onClick={() => handleOpenNew("Receita")}
          >
            <i className="ti ti-arrow-down" />
            <span>Nova Receita</span>
          </button>

          <button
            type="button"
            className={styles.btnDespesa}
            onClick={() => handleOpenNew("Despesa")}
          >
            <i className="ti ti-arrow-up" />
            <span>Nova Despesa</span>
          </button>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS */}
      <div className={styles.filtersBar}>
        <Input
          type="month"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
        />

        <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">Todos os Tipos</option>
          <option value="Receita">Apenas Receitas (+)</option>
          <option value="Despesa">Apenas Despesas (-)</option>
        </Select>

        <Select value={filtroCaixa} onChange={(e) => setFiltroCaixa(e.target.value)}>
          <option value="">Todas as Contas / Caixas</option>
          {caixas.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </Select>

        {(filtroTipo || filtroCaixa || filtroMes !== hoje.slice(0, 7)) && (
          <button
            type="button"
            className={styles.btnClearFilters}
            onClick={() => {
              setFiltroMes(hoje.slice(0, 7));
              setFiltroTipo("");
              setFiltroCaixa("");
            }}
          >
            <i className="ti ti-x" /> Limpar
          </button>
        )}
      </div>

      {/* 4. TABELA EM DESKTOP */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição do Lançamento</th>
                <th>Categoria</th>
                <th>Conta / Caixa</th>
                <th style={{ textAlign: "right" }}>Valor</th>
                <th style={{ textAlign: "center", width: 90 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {txFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 28, color: "var(--text-muted, #94a3b8)" }}>
                    Nenhuma transação financeira encontrada para este período.
                  </td>
                </tr>
              ) : (
                txFiltradas.map((t) => {
                  const isReceita = t.tipo === "Receita";
                  const cat = categorias.find((c) => c.id === t.categoriaId);
                  const cx = caixas.find((c) => c.id === t.caixaId);
                  const dataFormatada = (t.data || "").split("-").reverse().join("/");

                  return (
                    <tr key={t.id}>
                      <td style={{ color: "var(--text-muted, #94a3b8)", whiteSpace: "nowrap" }}>
                        {dataFormatada}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: isReceita ? "#34d399" : "#f87171",
                              flexShrink: 0
                            }}
                          />
                          <span style={{ fontWeight: 600, color: "var(--text-primary, #ffffff)" }}>
                            {t.descricao}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge variant={isReceita ? "success" : "danger"}>
                          {cat?.nome || "Sem Categoria"}
                        </Badge>
                      </td>
                      <td>{cx?.nome || "Caixa Geral"}</td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 800,
                          color: isReceita ? "#34d399" : "#f87171",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {isReceita ? "+" : "-"} {formatarMoeda(t.valor)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => handleOpenEdit(t)}
                            title="Editar lançamento"
                          >
                            <i className="ti ti-edit" />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => handleDelete(t.id)}
                            title="Excluir lançamento"
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODO CARDS EM MOBILE */}
      <div className={styles.mobileCards}>
        {txFiltradas.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted, #94a3b8)", background: "var(--bg-card, #1e293b)", borderRadius: 14 }}>
            Nenhuma transação financeira encontrada para este período.
          </div>
        ) : (
          txFiltradas.map((t) => {
            const isReceita = t.tipo === "Receita";
            const cat = categorias.find((c) => c.id === t.categoriaId);
            const cx = caixas.find((c) => c.id === t.caixaId);
            const dataFormatada = (t.data || "").split("-").reverse().join("/");

            return (
              <div key={t.id} className={styles.txCardMobile}>
                <div className={styles.cardTop}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: isReceita ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: isReceita ? "#34d399" : "#f87171",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 15,
                        flexShrink: 0
                      }}
                    >
                      <i className={isReceita ? "ti ti-arrow-down" : "ti ti-arrow-up"} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#ffffff", fontSize: 13.5 }}>
                        {t.descricao}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                        {dataFormatada} · {cx?.nome || "Caixa Geral"}
                      </div>
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

                <div className={styles.cardBody}>
                  <span>Categoria: <strong>{cat?.nome || "Sem Categoria"}</strong></span>
                  <span>Conta: <strong>{cx?.nome || "Caixa Geral"}</strong></span>
                </div>

                <div className={styles.cardFooter}>
                  <Badge variant={isReceita ? "success" : "danger"}>{t.tipo}</Badge>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => handleOpenEdit(t)}
                    >
                      <i className="ti ti-edit" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => handleDelete(t.id)}
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE TRANSAÇÃO */}
      {modalOpen && (
        <Modal
          titulo={isEditing ? "Editar Lançamento Financeiro" : `Novo Registro de ${formData.tipo}`}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          salvando={salvando}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                Tipo de Transação
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: "Receita" })}
                  style={{
                    padding: "10px",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    border: "1px solid",
                    background: formData.tipo === "Receita" ? "#059669" : "var(--bg-surface, #243144)",
                    color: formData.tipo === "Receita" ? "#ffffff" : "var(--text-secondary, #cbd5e1)",
                    borderColor: formData.tipo === "Receita" ? "#34d399" : "var(--border-subtle, #33435c)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <i className="ti ti-arrow-down" /> Receita (Entrada)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: "Despesa" })}
                  style={{
                    padding: "10px",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    border: "1px solid",
                    background: formData.tipo === "Despesa" ? "#dc2626" : "var(--bg-surface, #243144)",
                    color: formData.tipo === "Despesa" ? "#ffffff" : "var(--text-secondary, #cbd5e1)",
                    borderColor: formData.tipo === "Despesa" ? "#f87171" : "var(--border-subtle, #33435c)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <i className="ti ti-arrow-up" /> Despesa (Saída)
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                Descrição Detalhada *
              </label>
              <Input
                placeholder="Ex: Compra de materiais de limpeza, Repasse PDDE 2ª parcela"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                  Valor (R$) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                  Data do Evento *
                </label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                  Categoria *
                </label>
                <Select
                  value={formData.categoriaId}
                  onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                >
                  <option value="">Selecione a Categoria</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.tipo})</option>
                  ))}
                </Select>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                  Conta / Caixa *
                </label>
                <Select
                  value={formData.caixaId}
                  onChange={(e) => setFormData({ ...formData, caixaId: e.target.value })}
                >
                  <option value="">Selecione o Caixa</option>
                  {caixas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

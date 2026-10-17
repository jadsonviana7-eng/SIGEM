import React, { useState } from "react";
import { addCaixa, updateCaixa, deleteCaixa } from "../../../services/financeiroService";
import { Input, Modal } from "../../../components/ui";
import styles from "./CaixasFinanceiras.module.css";

export default function CaixasFinanceiras({ caixas = [], transacoes = [], onReload, escolaId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nome: "",
    banco: "",
    agencia: "",
    conta: "",
    saldoInicial: 0
  });
  const [salvando, setSalvando] = useState(false);

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));

  const getSaldoAtual = (caixaId, saldoInicial) => {
    const tx = transacoes.filter((t) => t.caixaId === caixaId);
    const receitas = tx
      .filter((t) => t.tipo === "Receita")
      .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
    const despesas = tx
      .filter((t) => t.tipo === "Despesa")
      .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
    return Number(saldoInicial || 0) + receitas - despesas;
  };

  const handleOpenNew = () => {
    setFormData({ id: null, nome: "", banco: "", agencia: "", conta: "", saldoInicial: 0 });
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setFormData({ ...c });
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome) return alert("O nome da conta é obrigatório.");
    setSalvando(true);
    try {
      if (isEditing) {
        const { id, ...dados } = formData;
        await updateCaixa(id, dados);
      } else {
        await addCaixa({
          escolaId,
          nome: formData.nome,
          banco: formData.banco || "",
          agencia: formData.agencia || "",
          conta: formData.conta || "",
          saldoInicial: Number(formData.saldoInicial) || 0
        });
      }
      setModalOpen(false);
      onReload();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar conta bancária/caixa: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (id) => {
    const temTransacao = transacoes.some((t) => t.caixaId === id);
    if (temTransacao) {
      return alert("Não é possível excluir uma conta que já possui transações vinculadas.");
    }
    if (window.confirm("Deseja realmente excluir esta conta?")) {
      await deleteCaixa(id);
      onReload();
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. BARRA DE CABEÇALHO */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-building-bank" style={{ color: "#34d399" }} />
            Contas Bancárias & Caixas Operacionais
          </div>
          <p className={styles.headerSubtitle}>
            Cadastre e acompanhe os saldos das contas correntes da escola, verbas de programas governamentais (PDDE) e caixa físico.
          </p>
        </div>

        <button
          type="button"
          className={styles.btnNovo}
          onClick={handleOpenNew}
        >
          <i className="ti ti-plus" />
          <span>Nova Conta / Caixa</span>
        </button>
      </div>

      {/* 2. GRADE DE CARDS */}
      <div className={styles.caixasGrid}>
        {caixas.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, background: "var(--bg-card, #1e293b)", borderRadius: 16, border: "1px dashed var(--border-color, #2c3b52)", gridColumn: "1 / -1", color: "var(--text-muted, #94a3b8)" }}>
            Nenhuma conta ou caixa cadastrado nesta unidade escolar.
          </div>
        ) : (
          caixas.map((c) => {
            const saldo = getSaldoAtual(c.id, c.saldoInicial);
            return (
              <div key={c.id} className={styles.caixaCard}>
                <div className={styles.cardTop}>
                  <div>
                    <h4 className={styles.caixaTitle}>{c.nome}</h4>
                    <div className={styles.caixaMeta}>
                      {c.banco || "Caixa Físico"}
                      {c.agencia ? ` · Agência: ${c.agencia}` : ""}
                      {c.conta ? ` · Conta: ${c.conta}` : ""}
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => handleOpenEdit(c)}
                      title="Editar conta"
                    >
                      <i className="ti ti-edit" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => handleDelete(c.id)}
                      title="Excluir conta"
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>

                <div className={styles.balanceSection}>
                  <span className={styles.balanceLabel}>Saldo Atual Consolidado</span>
                  <span
                    className={styles.balanceValue}
                    style={{ color: saldo < 0 ? "#f87171" : "#34d399" }}
                  >
                    {formatarMoeda(saldo)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE CONTA */}
      {modalOpen && (
        <Modal
          titulo={isEditing ? "Editar Conta Bancária / Caixa" : "Nova Conta Bancária / Caixa"}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          salvando={salvando}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                Nome da Conta / Identificação *
              </label>
              <Input
                placeholder="Ex: PDDE Básico, Caixa Escolar, Cantina"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                  Instituição Financeira / Banco
                </label>
                <Input
                  placeholder="Ex: Banco do Brasil, Caixa"
                  value={formData.banco}
                  onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                  Agência
                </label>
                <Input
                  placeholder="Ex: 1234-5"
                  value={formData.agencia}
                  onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                  Número da Conta Corrente
                </label>
                <Input
                  placeholder="Ex: 56789-0"
                  value={formData.conta}
                  onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                  Saldo Inicial (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.saldoInicial}
                  onChange={(e) => setFormData({ ...formData, saldoInicial: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { addCategoria, updateCategoria, deleteCategoria } from "../../../services/financeiroService";
import { Input, Modal, Select, Badge } from "../../../components/ui";
import styles from "./CategoriasFinanceiras.module.css";

export default function CategoriasFinanceiras({ categorias = [], onReload, escolaId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, nome: "", tipo: "Despesa" });
  const [salvando, setSalvando] = useState(false);

  const handleOpenNew = () => {
    setFormData({ id: null, nome: "", tipo: "Despesa" });
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setFormData({ ...c });
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome) return alert("O nome da categoria é obrigatório.");
    setSalvando(true);
    try {
      if (isEditing) {
        const { id, ...dados } = formData;
        await updateCategoria(id, dados);
      } else {
        await addCategoria({
          escolaId,
          nome: formData.nome,
          tipo: formData.tipo
        });
      }
      setModalOpen(false);
      onReload();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar categoria: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir esta categoria orçamentária?")) {
      await deleteCategoria(id);
      onReload();
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. BARRA DE CABEÇALHO */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-tags" style={{ color: "#34d399" }} />
            Plano de Contas & Categorias Orçamentárias
          </div>
          <p className={styles.headerSubtitle}>
            Classifique suas receitas e despesas por rubricas (Merenda, Material Pedagógico, Manutenção, PDDE Custeio/Capital).
          </p>
        </div>

        <button
          type="button"
          className={styles.btnNovo}
          onClick={handleOpenNew}
        >
          <i className="ti ti-plus" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* 2. TABELA EM DESKTOP */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Nome da Categoria / Rubrica</th>
                <th>Tipo de Movimentação</th>
                <th style={{ textAlign: "center", width: 100 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categorias.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: 28, color: "var(--text-muted, #94a3b8)" }}>
                    Nenhuma categoria cadastrada até o momento.
                  </td>
                </tr>
              ) : (
                categorias.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary, #ffffff)" }}>
                        {c.nome}
                      </div>
                    </td>
                    <td>
                      <Badge variant={c.tipo === "Receita" ? "success" : "danger"}>
                        {c.tipo === "Receita" ? "Receita (Entrada)" : "Despesa (Saída)"}
                      </Badge>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => handleOpenEdit(c)}
                          title="Editar categoria"
                        >
                          <i className="ti ti-edit" />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          onClick={() => handleDelete(c.id)}
                          title="Excluir categoria"
                        >
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MODO CARDS EM MOBILE */}
      <div className={styles.mobileCards}>
        {categorias.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, background: "var(--bg-card, #1e293b)", borderRadius: 14, color: "var(--text-muted, #94a3b8)" }}>
            Nenhuma categoria cadastrada.
          </div>
        ) : (
          categorias.map((c) => (
            <div key={c.id} className={styles.catCardMobile}>
              <div>
                <div style={{ fontWeight: 700, color: "#ffffff", fontSize: 14, marginBottom: 4 }}>
                  {c.nome}
                </div>
                <Badge variant={c.tipo === "Receita" ? "success" : "danger"}>
                  {c.tipo}
                </Badge>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => handleOpenEdit(c)}
                >
                  <i className="ti ti-edit" />
                </button>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                  onClick={() => handleDelete(c.id)}
                >
                  <i className="ti ti-trash" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE CATEGORIA */}
      {modalOpen && (
        <Modal
          titulo={isEditing ? "Editar Categoria Orçamentária" : "Nova Categoria Orçamentária"}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          salvando={salvando}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                Nome da Categoria / Rubrica *
              </label>
              <Input
                placeholder="Ex: Material Pedagógico, Merenda Escolar, PDDE Custeio"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                Natureza da Movimentação *
              </label>
              <Select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              >
                <option value="Despesa">Despesa (Saída)</option>
                <option value="Receita">Receita (Entrada)</option>
              </Select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

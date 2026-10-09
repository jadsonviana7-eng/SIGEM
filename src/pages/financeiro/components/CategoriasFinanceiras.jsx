import { useState } from "react";
import { addCategoria, updateCategoria, deleteCategoria } from "../../../services/financeiroService";
import { Card, Btn, Input, Modal, Select, EmptyState, Badge } from "../../../components/ui";

export default function CategoriasFinanceiras({ categorias, onReload, escolaId }) {
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
      alert("Erro ao salvar categoria.");
    }
    setSalvando(false);
  };

  const handleDelete = async (id) => {
    // Idealmente, checaríamos se há transações com esta categoria.
    if (window.confirm("Deseja realmente excluir esta categoria?")) {
      await deleteCategoria(id);
      onReload();
    }
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Categorias Financeiras</h3>
        <Btn variant="primary" onClick={handleOpenNew}><i className="ti ti-plus" /> Nova Categoria</Btn>
      </div>

      {categorias.length === 0 ? (
        <EmptyState icon="tags" texto="Nenhuma categoria cadastrada." />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280" }}>
                <th style={{ padding: "12px 16px", fontWeight: 500 }}>Nome da Categoria</th>
                <th style={{ padding: "12px 16px", fontWeight: 500 }}>Tipo</th>
                <th style={{ padding: "12px 16px", fontWeight: 500, width: 100 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: "#1f2937" }}>{c.nome}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge color={c.tipo === "Receita" ? "green" : "red"}>{c.tipo}</Badge>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn onClick={() => handleOpenEdit(c)} style={{ padding: "4px 8px" }}><i className="ti ti-edit" /></Btn>
                      <Btn variant="danger" onClick={() => handleDelete(c.id)} style={{ padding: "4px 8px" }}><i className="ti ti-trash" /></Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal titulo={isEditing ? "Editar Categoria" : "Nova Categoria"} onClose={() => setModalOpen(false)} onSave={handleSave} salvando={salvando}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Nome da Categoria (ex: Merenda, Material, PDDE Custeio)" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
            <Select label="Tipo" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
              <option value="Despesa">Despesa (Saída)</option>
              <option value="Receita">Receita (Entrada)</option>
            </Select>
          </div>
        </Modal>
      )}
    </Card>
  );
}

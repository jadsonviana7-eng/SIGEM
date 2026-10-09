import { useState } from "react";
import { addTransacao, updateTransacao, deleteTransacao } from "../../../services/financeiroService";
import { Card, Btn, Input, Modal, Select, EmptyState, Badge } from "../../../components/ui";

export default function TransacoesFinanceiras({ transacoes, caixas, categorias, onReload, escolaId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const hoje = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({ id: null, descricao: "", valor: "", data: hoje, tipo: "Despesa", categoriaId: "", caixaId: "" });
  const [salvando, setSalvando] = useState(false);

  const [filtroMes, setFiltroMes] = useState(hoje.slice(0, 7)); // YYYY-MM
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCaixa, setFiltroCaixa] = useState("");

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor));

  const handleOpenNew = (tipoPadrao = "Despesa") => {
    setFormData({ id: null, descricao: "", valor: "", data: hoje, tipo: tipoPadrao, categoriaId: "", caixaId: "" });
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
      alert("Erro ao salvar transação.");
    }
    setSalvando(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir esta transação? A alteração do saldo será automática.")) {
      await deleteTransacao(id);
      onReload();
    }
  };

  // Filtragem
  const txFiltradas = transacoes.filter(t => {
    if (filtroMes && !t.data.startsWith(filtroMes)) return false;
    if (filtroTipo && t.tipo !== filtroTipo) return false;
    if (filtroCaixa && t.caixaId !== filtroCaixa) return false;
    return true;
  }).sort((a, b) => new Date(b.data) - new Date(a.data));

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Registro de Transações</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="primary" onClick={() => handleOpenNew("Receita")} style={{ background: "#10b981", borderColor: "#10b981" }}><i className="ti ti-arrow-down" /> Nova Receita</Btn>
          <Btn variant="danger" onClick={() => handleOpenNew("Despesa")}><i className="ti ti-arrow-up" /> Nova Despesa</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
        <div style={{ width: 150 }}>
          <Input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)} />
        </div>
        <div style={{ width: 160 }}>
          <Select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="">Todos os Tipos</option>
            <option value="Receita">Receitas</option>
            <option value="Despesa">Despesas</option>
          </Select>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Select value={filtroCaixa} onChange={e => setFiltroCaixa(e.target.value)}>
            <option value="">Todas as Contas</option>
            {caixas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
        </div>
      </div>

      {txFiltradas.length === 0 ? (
        <EmptyState icon="receipt" texto="Nenhuma transação encontrada para este período/filtro." />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280" }}>
                <th style={{ padding: "12px 16px", fontWeight: 500 }}>Data</th>
                <th style={{ padding: "12px 16px", fontWeight: 500 }}>Descrição</th>
                <th style={{ padding: "12px 16px", fontWeight: 500 }}>Categoria</th>
                <th style={{ padding: "12px 16px", fontWeight: 500 }}>Conta/Caixa</th>
                <th style={{ padding: "12px 16px", fontWeight: 500, textAlign: "right" }}>Valor</th>
                <th style={{ padding: "12px 16px", fontWeight: 500, width: 80 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {txFiltradas.map(t => {
                const isReceita = t.tipo === "Receita";
                const cat = categorias.find(c => c.id === t.categoriaId);
                const cx = caixas.find(c => c.id === t.caixaId);
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{t.data.split('-').reverse().join('/')}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 500, color: "#1f2937" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: isReceita ? "#10b981" : "#ef4444" }} />
                        {t.descricao}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{cat?.nome || "---"}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{cx?.nome || "---"}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: isReceita ? "#10b981" : "#ef4444" }}>
                      {isReceita ? "+" : "-"} {formatarMoeda(t.valor)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Btn onClick={() => handleOpenEdit(t)} style={{ padding: "4px 6px" }}><i className="ti ti-edit" /></Btn>
                        <Btn variant="danger" onClick={() => handleDelete(t.id)} style={{ padding: "4px 6px" }}><i className="ti ti-trash" /></Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal titulo={isEditing ? `Editar ${formData.tipo}` : `Nova ${formData.tipo}`} onClose={() => setModalOpen(false)} onSave={handleSave} salvando={salvando}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 2 }}><Input label="Descrição" value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} /></div>
              <div style={{ flex: 1 }}><Input label="Data" type="date" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} /></div>
            </div>
            
            <Select label="Tipo" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value, categoriaId: "" })}>
              <option value="Despesa">Despesa (Saída)</option>
              <option value="Receita">Receita (Entrada)</option>
            </Select>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Select label="Categoria" value={formData.categoriaId} onChange={e => setFormData({ ...formData, categoriaId: e.target.value })}>
                  <option value="">Selecione...</option>
                  {categorias.filter(c => c.tipo === formData.tipo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </Select>
              </div>
              <div style={{ flex: 1 }}>
                <Select label="Conta / Caixa" value={formData.caixaId} onChange={e => setFormData({ ...formData, caixaId: e.target.value })}>
                  <option value="">Selecione...</option>
                  {caixas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </Select>
              </div>
            </div>

            <Input label="Valor (R$)" type="number" step="0.01" min="0" value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} />
          </div>
        </Modal>
      )}
    </Card>
  );
}

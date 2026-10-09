import { useState } from "react";
import { addCaixa, updateCaixa, deleteCaixa } from "../../../services/financeiroService";
import { Card, Btn, Input, Modal, Badge, EmptyState } from "../../../components/ui";

export default function CaixasFinanceiras({ caixas, transacoes, onReload, escolaId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, nome: "", banco: "", agencia: "", conta: "", saldoInicial: 0 });
  const [salvando, setSalvando] = useState(false);

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const getSaldoAtual = (caixaId, saldoInicial) => {
    const tx = transacoes.filter(t => t.caixaId === caixaId);
    const receitas = tx.filter(t => t.tipo === "Receita").reduce((acc, curr) => acc + Number(curr.valor), 0);
    const despesas = tx.filter(t => t.tipo === "Despesa").reduce((acc, curr) => acc + Number(curr.valor), 0);
    return Number(saldoInicial) + receitas - despesas;
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
      alert("Erro ao salvar caixa.");
    }
    setSalvando(false);
  };

  const handleDelete = async (id) => {
    const temTransacao = transacoes.some(t => t.caixaId === id);
    if (temTransacao) return alert("Não é possível excluir um caixa que possui transações. Exclua as transações primeiro.");
    if (window.confirm("Deseja realmente excluir esta conta?")) {
      await deleteCaixa(id);
      onReload();
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Contas e Caixas</h3>
        <Btn variant="primary" onClick={handleOpenNew}><i className="ti ti-plus" /> Nova Conta</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {caixas.length === 0 ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <EmptyState icon="building-bank" texto="Nenhuma conta cadastrada." />
          </div>
        ) : caixas.map(c => {
          const saldo = getSaldoAtual(c.id, c.saldoInicial);
          return (
            <Card key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: "#1f2937", marginBottom: 4 }}>{c.nome}</h4>
                  {(c.banco || c.conta) && <div style={{ fontSize: 12, color: "#6b7280" }}>{c.banco} • Ag {c.agencia} • Cc {c.conta}</div>}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn onClick={() => handleOpenEdit(c)} style={{ padding: "4px 8px" }}><i className="ti ti-edit" /></Btn>
                  <Btn variant="danger" onClick={() => handleDelete(c.id)} style={{ padding: "4px 8px" }}><i className="ti ti-trash" /></Btn>
                </div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px dashed #e5e7eb" }}>
                <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Saldo Atual</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: saldo < 0 ? "#ef4444" : "#10b981", marginTop: 4 }}>
                  {formatarMoeda(saldo)}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {modalOpen && (
        <Modal titulo={isEditing ? "Editar Conta/Caixa" : "Nova Conta/Caixa"} onClose={() => setModalOpen(false)} onSave={handleSave} salvando={salvando}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Nome da Conta (ex: PDDE, Caixa Escolar)" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}><Input label="Banco" value={formData.banco} onChange={e => setFormData({ ...formData, banco: e.target.value })} /></div>
              <div style={{ width: 100 }}><Input label="Agência" value={formData.agencia} onChange={e => setFormData({ ...formData, agencia: e.target.value })} /></div>
            </div>
            <Input label="Número da Conta" value={formData.conta} onChange={e => setFormData({ ...formData, conta: e.target.value })} />
            <Input label="Saldo Inicial (R$)" type="number" step="0.01" value={formData.saldoInicial} onChange={e => setFormData({ ...formData, saldoInicial: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
}

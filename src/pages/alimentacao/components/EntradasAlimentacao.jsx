import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addEntrada, deleteEntrada } from "../../../services/alimentacaoService";

export default function EntradasAlimentacao({
  entradas = [],
  itensEstoque = [],
  fornecedores = [],
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const hojeStr = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    data: hojeStr,
    itemId: "",
    itemNome: "",
    unidade: "Quilos (kg)",
    quantidade: "",
    valorUnitario: "",
    valorTotal: "",
    fornecedorNome: "",
    numeroNotaFiscal: "",
    dataValidade: "",
    lote: "",
    responsavelRecebimento: "Nutricionista / Merendeira Chefe",
    observacoes: ""
  });

  const abrirNovo = () => {
    const itemPadrao = itensEstoque[0];
    const fornPadrao = fornecedores[0];

    setForm({
      data: hojeStr,
      itemId: itemPadrao?.id || "",
      itemNome: itemPadrao?.nome || "",
      unidade: itemPadrao?.unidade || "Quilos (kg)",
      quantidade: 10,
      valorUnitario: itemPadrao?.ultimoPreco || "10.00",
      valorTotal: ((Number(itemPadrao?.ultimoPreco) || 10) * 10).toFixed(2),
      fornecedorNome: fornPadrao?.nome || "",
      numeroNotaFiscal: "",
      dataValidade: "",
      lote: "",
      responsavelRecebimento: "Nutricionista / Merendeira Chefe",
      observacoes: ""
    });
    setErro("");
    setModalAberto(true);
  };

  const handleItemSelect = (id) => {
    const itemObj = itensEstoque.find(i => i.id === id);
    if (itemObj) {
      const q = Number(form.quantidade) || 1;
      const preco = Number(itemObj.ultimoPreco) || 0;
      setForm(prev => ({
        ...prev,
        itemId: itemObj.id,
        itemNome: itemObj.nome,
        unidade: itemObj.unidade || "Quilos (kg)",
        valorUnitario: itemObj.ultimoPreco || prev.valorUnitario,
        valorTotal: (q * preco).toFixed(2)
      }));
    }
  };

  const handleQtdOuPreco = (qtd, preco) => {
    const q = Number(qtd) || 0;
    const p = Number(preco) || 0;
    setForm(prev => ({
      ...prev,
      quantidade: qtd,
      valorUnitario: preco,
      valorTotal: (q * p).toFixed(2)
    }));
  };

  const handleSalvar = async () => {
    if (!form.itemNome || !form.quantidade || Number(form.quantidade) <= 0) {
      setErro("Selecione o alimento e informe a quantidade recebida.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const payload = {
        ...form,
        quantidade: Number(form.quantidade) || 0,
        valorUnitario: Number(form.valorUnitario) || 0,
        valorTotal: Number(form.valorTotal) || 0
      };

      await addEntrada(payload, escolaId);
      setModalAberto(false);
      onReload();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar entrada: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (entrada) => {
    if (window.confirm(`Deseja realmente excluir a entrada de ${entrada.quantidade} ${entrada.unidade} de ${entrada.itemNome}? (O estoque será recalculado)`)) {
      try {
        await deleteEntrada(entrada.id, entrada);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const entradasFiltradas = useMemo(() => {
    return entradas.filter(e => {
      const termo = busca.toLowerCase();
      return (
        (e.itemNome || "").toLowerCase().includes(termo) ||
        (e.fornecedorNome || "").toLowerCase().includes(termo) ||
        (e.numeroNotaFiscal || "").toLowerCase().includes(termo)
      );
    });
  }, [entradas, busca]);

  const totalFinanceiroEntradas = useMemo(() => {
    return entradasFiltradas.reduce((acc, e) => acc + (Number(e.valorTotal) || 0), 0);
  }, [entradasFiltradas]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Barra de Filtros e Resumo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 460 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Buscar por alimento, fornecedor ou nota fiscal..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                outline: "none"
              }}
            />
            <i className="ti ti-search" style={{ position: "absolute", left: 12, top: 11, color: "#9ca3af" }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 13, color: "#475569" }}>
            Total Entradas: <strong style={{ color: "#047857", fontSize: 15 }}>{totalFinanceiroEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
          </div>
          <Btn variant="primary" onClick={abrirNovo}>
            <i className="ti ti-plus" /> Registrar Entrada / Compra
          </Btn>
        </div>
      </div>

      {/* Tabela de Entradas */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {entradasFiltradas.length === 0 ? (
          <EmptyState icon="arrow-down-left" texto="Nenhum registro de entrada de alimentos." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>Data do Recebimento</th>
                  <th style={{ padding: "12px 16px" }}>Alimento / Gênero</th>
                  <th style={{ padding: "12px 16px" }}>Qtd Recebida</th>
                  <th style={{ padding: "12px 16px" }}>Fornecedor</th>
                  <th style={{ padding: "12px 16px" }}>Doc / NF-e</th>
                  <th style={{ padding: "12px 16px" }}>Validade / Lote</th>
                  <th style={{ padding: "12px 16px" }}>Valor Total</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {entradasFiltradas.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                      {new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#047857" }}>{e.itemNome}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Rec: {e.responsavelRecebimento || "-"}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color="green">+{e.quantidade} {e.unidade}</Badge>
                    </td>
                    <td style={{ padding: "12px 16px", maxWidth: 220 }}>
                      <div style={{ fontWeight: 500, color: "#1e293b" }}>{e.fornecedorNome || "Prefeitura / PNAE"}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#475569" }}>
                      {e.numeroNotaFiscal || "-"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      {e.dataValidade ? (
                        <div>{new Date(e.dataValidade + "T00:00:00").toLocaleDateString("pt-BR")}</div>
                      ) : "-"}
                      {e.lote && <div style={{ fontSize: 10, color: "#64748b" }}>{e.lote}</div>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#047857" }}>
                        {(Number(e.valorTotal) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>
                        {(Number(e.valorUnitario) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / un
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <Btn variant="danger" onClick={() => handleExcluir(e)} style={{ padding: "4px 8px", fontSize: 12 }}>
                        <i className="ti ti-trash" />
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Registro de Entrada */}
      {modalAberto && (
        <Modal
          titulo="Registrar Entrada de Alimentos na Despensa"
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={620}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
              <Select
                label="Selecione o Alimento do Estoque *"
                value={form.itemId}
                onChange={(e) => handleItemSelect(e.target.value)}
              >
                <option value="">Selecione o item...</option>
                {itensEstoque.map(i => (
                  <option key={i.id} value={i.id}>{i.nome} (Atual: {i.quantidadeAtual} {i.unidade})</option>
                ))}
              </Select>

              <Input
                label="Data de Recebimento *"
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input
                label="Quantidade Recebida *"
                type="number"
                placeholder="Ex: 50"
                value={form.quantidade}
                onChange={(e) => handleQtdOuPreco(e.target.value, form.valorUnitario)}
              />
              <Input
                label="Valor Unitário (R$)"
                type="number"
                step="0.01"
                placeholder="Ex: 12.50"
                value={form.valorUnitario}
                onChange={(e) => handleQtdOuPreco(form.quantidade, e.target.value)}
              />
              <Input
                label="Valor Total (R$)"
                type="number"
                step="0.01"
                value={form.valorTotal}
                onChange={(e) => setForm({ ...form, valorTotal: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
              <Select
                label="Fornecedor / Produtor"
                value={form.fornecedorNome}
                onChange={(e) => setForm({ ...form, fornecedorNome: e.target.value })}
              >
                <option value="">Selecione o fornecedor...</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.nome}>{f.nome} ({f.tipo})</option>
                ))}
              </Select>

              <Input
                label="Nº da Nota Fiscal / Recibo"
                placeholder="Ex: NF-e 048910"
                value={form.numeroNotaFiscal}
                onChange={(e) => setForm({ ...form, numeroNotaFiscal: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Data de Validade do Lote"
                type="date"
                value={form.dataValidade}
                onChange={(e) => setForm({ ...form, dataValidade: e.target.value })}
              />
              <Input
                label="Número do Lote"
                placeholder="Ex: LT-2026/089"
                value={form.lote}
                onChange={(e) => setForm({ ...form, lote: e.target.value })}
              />
            </div>

            <Input
              label="Responsável pelo Recebimento e Conferência"
              placeholder="Ex: Merendeira Chefe Maria do Socorro"
              value={form.responsavelRecebimento}
              onChange={(e) => setForm({ ...form, responsavelRecebimento: e.target.value })}
            />

            <Input
              label="Observações / Laudo de Conferência"
              placeholder="Ex: Alimentos entregues em embalagem íntegra e temperatura adequada."
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

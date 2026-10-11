import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addItemEstoque, updateItemEstoque, deleteItemEstoque } from "../../../services/alimentacaoService";

export default function EstoqueAlimentacao({
  itensEstoque = [],
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    nome: "",
    categoria: "Não Perecíveis",
    unidade: "Quilos (kg)",
    quantidadeAtual: "",
    estoqueMinimo: 10,
    localArmazenamento: "Despensa Seca",
    dataValidade: "",
    lote: "",
    ultimoPreco: "",
    perecivel: false
  });

  const abrirNovo = () => {
    setItemEditando(null);
    setForm({
      nome: "",
      categoria: "Não Perecíveis",
      unidade: "Quilos (kg)",
      quantidadeAtual: 20,
      estoqueMinimo: 10,
      localArmazenamento: "Despensa Seca",
      dataValidade: "",
      lote: "",
      ultimoPreco: "",
      perecivel: false
    });
    setErro("");
    setModalAberto(true);
  };

  const abrirEditar = (item) => {
    setItemEditando(item);
    setForm({
      nome: item.nome || "",
      categoria: item.categoria || "Não Perecíveis",
      unidade: item.unidade || "Quilos (kg)",
      quantidadeAtual: item.quantidadeAtual || "",
      estoqueMinimo: item.estoqueMinimo || 10,
      localArmazenamento: item.localArmazenamento || "",
      dataValidade: item.dataValidade || "",
      lote: item.lote || "",
      ultimoPreco: item.ultimoPreco || "",
      perecivel: !!item.perecivel
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      setErro("Informe o nome do alimento.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const payload = {
        ...form,
        quantidadeAtual: Number(form.quantidadeAtual) || 0,
        estoqueMinimo: Number(form.estoqueMinimo) || 0,
        ultimoPreco: Number(form.ultimoPreco) || 0
      };

      if (itemEditando) {
        await updateItemEstoque(itemEditando.id, payload);
      } else {
        await addItemEstoque(payload, escolaId);
      }

      setModalAberto(false);
      onReload();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar alimento: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id, nome) => {
    if (window.confirm(`Deseja realmente remover o alimento "${nome}" do cadastro de estoque?`)) {
      try {
        await deleteItemEstoque(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const hoje = new Date();
  const itensFiltrados = useMemo(() => {
    return itensEstoque.filter(item => {
      const termo = busca.toLowerCase();
      const matchBusca = (item.nome || "").toLowerCase().includes(termo) ||
        (item.lote || "").toLowerCase().includes(termo) ||
        (item.localArmazenamento || "").toLowerCase().includes(termo);

      const matchCat = !filtroCategoria || item.categoria === filtroCategoria;
      return matchBusca && matchCat;
    });
  }, [itensEstoque, busca, filtroCategoria]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Barra de Filtros e Ações */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 520 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Buscar por nome do produto, lote ou despensa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: 8,
                border: "1px solid #33435c",
                background: "#1e293b",
                color: "#ffffff",
                fontSize: 13,
                outline: "none"
              }}
            />
            <i className="ti ti-search" style={{ position: "absolute", left: 12, top: 11, color: "#94a3b8" }} />
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #33435c", fontSize: 13, background: "#1e293b", color: "#ffffff" }}
          >
            <option value="" style={{ background: "#1e293b", color: "#94a3b8" }}>Todas as Categorias</option>
            <option value="Não Perecíveis" style={{ background: "#1e293b", color: "#ffffff" }}>Não Perecíveis</option>
            <option value="Carnes & Frios" style={{ background: "#1e293b", color: "#ffffff" }}>Carnes & Frios</option>
            <option value="Hortifrúti & Frutas" style={{ background: "#1e293b", color: "#ffffff" }}>Hortifrúti & Frutas</option>
            <option value="Laticínios" style={{ background: "#1e293b", color: "#ffffff" }}>Laticínios</option>
            <option value="Panificação & Biscoitos" style={{ background: "#1e293b", color: "#ffffff" }}>Panificação & Biscoitos</option>
            <option value="Temperos & Óleos" style={{ background: "#1e293b", color: "#ffffff" }}>Temperos & Óleos</option>
          </select>
        </div>

        <Btn variant="primary" onClick={abrirNovo}>
          <i className="ti ti-plus" /> Cadastrar Alimento no Estoque
        </Btn>
      </div>

      {/* Tabela do Estoque */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {itensFiltrados.length === 0 ? (
          <EmptyState icon="packages" texto="Nenhum item encontrado no estoque da despensa." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#161f2e", borderBottom: "1px solid #33435c", color: "#cbd5e1" }}>
                  <th style={{ padding: "12px 16px" }}>Alimento / Produto</th>
                  <th style={{ padding: "12px 16px" }}>Categoria</th>
                  <th style={{ padding: "12px 16px" }}>Saldo em Estoque</th>
                  <th style={{ padding: "12px 16px" }}>Estoque Mínimo</th>
                  <th style={{ padding: "12px 16px" }}>Armazenamento</th>
                  <th style={{ padding: "12px 16px" }}>Validade / Lote</th>
                  <th style={{ padding: "12px 16px" }}>Valor Estocado</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.map((item) => {
                  const qtd = Number(item.quantidadeAtual) || 0;
                  const min = Number(item.estoqueMinimo) || 0;
                  const isBaixo = qtd <= min;
                  const dVal = item.dataValidade ? new Date(item.dataValidade + "T00:00:00") : null;
                  const isVencido = dVal && dVal < hoje;

                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #243144" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#ffffff" }}>{item.nome}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Unidade: {item.unidade}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Badge color="blue">{item.categoria}</Badge>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: isBaixo ? "#f87171" : "#34d399" }}>
                            {qtd} {item.unidade?.split(" ")[0]}
                          </span>
                          {isBaixo && (
                            <span title="Estoque abaixo do mínimo!" style={{ color: "#f87171", fontSize: 13 }}>⚠️</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8" }}>
                        {min} {item.unidade?.split(" ")[0]}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#cbd5e1" }}>
                        {item.localArmazenamento || "Despensa Principal"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12 }}>
                        {dVal ? (
                          <div style={{ fontWeight: 600, color: isVencido ? "#f87171" : "#ffffff" }}>
                            {dVal.toLocaleDateString("pt-BR")}
                            {isVencido && " (Vencido)"}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>-</span>
                        )}
                        {item.lote && <div style={{ fontSize: 10, color: "#94a3b8" }}>Lote: {item.lote}</div>}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#ffffff" }}>
                        {(qtd * (Number(item.ultimoPreco) || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <Btn onClick={() => abrirEditar(item)} style={{ padding: "4px 8px", fontSize: 12 }}>
                            <i className="ti ti-edit" />
                          </Btn>
                          <Btn variant="danger" onClick={() => handleExcluir(item.id, item.nome)} style={{ padding: "4px 8px", fontSize: 12 }}>
                            <i className="ti ti-trash" />
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Cadastro/Edição de Alimento */}
      {modalAberto && (
        <Modal
          titulo={itemEditando ? "Editar Alimento da Despensa" : "Cadastrar Alimento no Estoque"}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={600}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              label="Nome do Alimento / Gênero *"
              placeholder="Ex: Arroz Polido Tipo 1 (Pacote 5kg)"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Categoria do Gênero"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              >
                <option value="Não Perecíveis">Não Perecíveis (Grãos, massas, farinhas)</option>
                <option value="Carnes & Frios">Carnes & Frios (Frango, bovino, peixe)</option>
                <option value="Hortifrúti & Frutas">Hortifrúti & Frutas (Verduras, legumes, polpas)</option>
                <option value="Laticínios">Laticínios (Leite, queijo, manteiga)</option>
                <option value="Panificação & Biscoitos">Panificação & Biscoitos</option>
                <option value="Temperos & Óleos">Temperos & Óleos</option>
              </Select>

              <Select
                label="Unidade de Medida"
                value={form.unidade}
                onChange={(e) => setForm({ ...form, unidade: e.target.value })}
              >
                <option value="Quilos (kg)">Quilos (kg)</option>
                <option value="Litros (L)">Litros (L)</option>
                <option value="Pacotes (5kg)">Pacotes (5kg)</option>
                <option value="Pacotes (1kg)">Pacotes (1kg)</option>
                <option value="Pacotes (500g)">Pacotes (500g)</option>
                <option value="Caixas">Caixas</option>
                <option value="Dúzias">Dúzias</option>
                <option value="Unidades">Unidades</option>
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input
                label="Quantidade Atual em Estoque"
                type="number"
                placeholder="Ex: 25"
                value={form.quantidadeAtual}
                onChange={(e) => setForm({ ...form, quantidadeAtual: e.target.value })}
              />
              <Input
                label="Estoque Mínimo (Alerta)"
                type="number"
                placeholder="Ex: 10"
                value={form.estoqueMinimo}
                onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })}
              />
              <Input
                label="Preço Unitário Médio (R$)"
                type="number"
                step="0.01"
                placeholder="Ex: 15.90"
                value={form.ultimoPreco}
                onChange={(e) => setForm({ ...form, ultimoPreco: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Local de Armazenamento"
                placeholder="Ex: Despensa Seca - Prateleira A1"
                value={form.localArmazenamento}
                onChange={(e) => setForm({ ...form, localArmazenamento: e.target.value })}
              />
              <Input
                label="Lote do Fabricante / Produtor"
                placeholder="Ex: LT-2026/089"
                value={form.lote}
                onChange={(e) => setForm({ ...form, lote: e.target.value })}
              />
            </div>

            <Input
              label="Data de Validade Principal"
              type="date"
              value={form.dataValidade}
              onChange={(e) => setForm({ ...form, dataValidade: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

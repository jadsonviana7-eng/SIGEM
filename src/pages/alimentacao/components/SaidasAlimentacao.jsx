import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addSaida, deleteSaida } from "../../../services/alimentacaoService";

export default function SaidasAlimentacao({
  saidas = [],
  itensEstoque = [],
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
    destino: "Preparo Almoço Escolar",
    responsavelRetirada: "Merendeira Chefe",
    motivo: "Consumo Regular - Cardápio Semanal",
    refeicoesEstimadas: "180"
  });

  const abrirNovo = () => {
    const itemPadrao = itensEstoque[0];
    setForm({
      data: hojeStr,
      itemId: itemPadrao?.id || "",
      itemNome: itemPadrao?.nome || "",
      unidade: itemPadrao?.unidade || "Quilos (kg)",
      quantidade: 5,
      destino: "Preparo Almoço Escolar",
      responsavelRetirada: "Merendeira Chefe",
      motivo: "Consumo Regular - Cardápio Semanal",
      refeicoesEstimadas: "180"
    });
    setErro("");
    setModalAberto(true);
  };

  const handleItemSelect = (id) => {
    const itemObj = itensEstoque.find(i => i.id === id);
    if (itemObj) {
      setForm(prev => ({
        ...prev,
        itemId: itemObj.id,
        itemNome: itemObj.nome,
        unidade: itemObj.unidade || "Quilos (kg)"
      }));
    }
  };

  const handleSalvar = async () => {
    if (!form.itemNome || !form.quantidade || Number(form.quantidade) <= 0) {
      setErro("Selecione o alimento e informe a quantidade retirada para a cozinha.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const payload = {
        ...form,
        quantidade: Number(form.quantidade) || 0,
        refeicoesEstimadas: Number(form.refeicoesEstimadas) || 0
      };

      await addSaida(payload, escolaId);
      setModalAberto(false);
      onReload();
    } catch (e) {
      console.error(e);
      setErro("Erro ao registrar saída: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (saida) => {
    if (window.confirm(`Deseja cancelar esta saída de ${saida.quantidade} ${saida.unidade} de ${saida.itemNome}? (A quantidade retornará ao estoque)`)) {
      try {
        await deleteSaida(saida.id, saida);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const saidasFiltradas = useMemo(() => {
    return saidas.filter(s => {
      const termo = busca.toLowerCase();
      return (
        (s.itemNome || "").toLowerCase().includes(termo) ||
        (s.destino || "").toLowerCase().includes(termo) ||
        (s.responsavelRetirada || "").toLowerCase().includes(termo)
      );
    });
  }, [saidas, busca]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Barra Superior */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 460 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Buscar por alimento, destino da refeição ou responsável..."
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

        <Btn variant="primary" onClick={abrirNovo}>
          <i className="ti ti-arrow-up-right" /> Registrar Baixa / Saída para Cozinha
        </Btn>
      </div>

      {/* Tabela de Saídas */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {saidasFiltradas.length === 0 ? (
          <EmptyState icon="arrow-up-right" texto="Nenhuma saída de alimentos registrada para a cozinha." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>Data da Retirada</th>
                  <th style={{ padding: "12px 16px" }}>Alimento / Gênero</th>
                  <th style={{ padding: "12px 16px" }}>Qtd Retirada</th>
                  <th style={{ padding: "12px 16px" }}>Destino / Refeição</th>
                  <th style={{ padding: "12px 16px" }}>Refeições Estimadas</th>
                  <th style={{ padding: "12px 16px" }}>Responsável pela Cozinha</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {saidasFiltradas.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                      {new Date(s.data + "T00:00:00").toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{s.itemNome}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{s.motivo || "Cardápio do dia"}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color="amber">-{s.quantidade} {s.unidade}</Badge>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#047857", fontWeight: 500 }}>
                      {s.destino}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 600 }}>{s.refeicoesEstimadas || "-"}</span> porções
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569", fontSize: 12 }}>
                      {s.responsavelRetirada}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <Btn variant="danger" onClick={() => handleExcluir(s)} style={{ padding: "4px 8px", fontSize: 12 }}>
                        <i className="ti ti-trash" /> Estornar
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Registro de Saída */}
      {modalAberto && (
        <Modal
          titulo="Registrar Baixa de Alimentos para a Cozinha"
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={580}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
              <Select
                label="Selecione o Alimento a Retirar *"
                value={form.itemId}
                onChange={(e) => handleItemSelect(e.target.value)}
              >
                <option value="">Selecione o item...</option>
                {itensEstoque.map(i => (
                  <option key={i.id} value={i.id}>{i.nome} (Disponível: {i.quantidadeAtual} {i.unidade})</option>
                ))}
              </Select>

              <Input
                label="Data da Saída *"
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Quantidade a Retirar *"
                type="number"
                placeholder="Ex: 5"
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
              />
              <Input
                label="Refeições Previstas / Porções"
                type="number"
                placeholder="Ex: 180"
                value={form.refeicoesEstimadas}
                onChange={(e) => setForm({ ...form, refeicoesEstimadas: e.target.value })}
              />
            </div>

            <Select
              label="Destino da Preparação"
              value={form.destino}
              onChange={(e) => setForm({ ...form, destino: e.target.value })}
            >
              <option value="Preparo Almoço Escolar">Preparo Almoço Escolar (Fundamental I e II)</option>
              <option value="Lanche da Manhã">Lanche da Manhã</option>
              <option value="Lanche da Tarde">Lanche da Tarde</option>
              <option value="Jantar EJA (Educação de Jovens e Adultos)">Jantar EJA (Educação de Jovens e Adultos)</option>
              <option value="Alimentação Diferenciada / PCD">Alimentação Diferenciada / Restrição Médica</option>
            </Select>

            <Input
              label="Responsável pela Retirada (Merendeira)"
              placeholder="Ex: Merendeira Josefa Maria"
              value={form.responsavelRetirada}
              onChange={(e) => setForm({ ...form, responsavelRetirada: e.target.value })}
            />

            <Input
              label="Motivo / Observação"
              placeholder="Ex: Preparo da refeição conforme cardápio de terça-feira."
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

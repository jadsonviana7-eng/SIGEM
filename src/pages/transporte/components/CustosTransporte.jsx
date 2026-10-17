import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addCustoTransporte, updateCustoTransporte, deleteCustoTransporte, updateVeiculo } from "../../../services/transporteService";

export default function CustosTransporte({
  custos = [],
  veiculos = [],
  motoristas = [],
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroVeiculo, setFiltroVeiculo] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [custoEditando, setCustoEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const hojeStr = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    tipo: "Abastecimento", // "Abastecimento" | "Outros Custos"
    categoria: "Combustível",
    veiculoId: "",
    data: hojeStr,
    posto: "Posto Aliança de Combustíveis",
    combustivel: "Diesel S10",
    litros: "",
    valorUnitario: "5.99",
    valorTotal: "",
    kmAbastecimento: "",
    motoristaNome: "",
    formaPagamento: "Faturamento Prefeitura",
    descricao: ""
  });

  const abrirNovo = (tipoInicial = "Abastecimento") => {
    setCustoEditando(null);
    const veiculoPadrao = veiculos[0];
    const motoristaPadrao = motoristas.find(m => m.tipo === "Motorista") || motoristas[0];

    setForm({
      tipo: tipoInicial,
      categoria: tipoInicial === "Abastecimento" ? "Combustível" : "Seguro Obrigatório & Frota",
      veiculoId: veiculoPadrao?.id || "",
      data: hojeStr,
      posto: "Posto Aliança de Combustíveis",
      combustivel: veiculoPadrao?.combustivel || "Diesel S10",
      litros: "",
      valorUnitario: "5.99",
      valorTotal: "",
      kmAbastecimento: veiculoPadrao?.kmAtual || "",
      motoristaNome: motoristaPadrao?.nome || "",
      formaPagamento: "Faturamento Prefeitura",
      descricao: ""
    });
    setErro("");
    setModalAberto(true);
  };

  const abrirEditar = (c) => {
    setCustoEditando(c);
    setForm({
      tipo: c.tipo || "Abastecimento",
      categoria: c.categoria || "Combustível",
      veiculoId: c.veiculoId || "",
      data: c.data || hojeStr,
      posto: c.posto || "",
      combustivel: c.combustivel || "Diesel S10",
      litros: c.litros || "",
      valorUnitario: c.valorUnitario || "",
      valorTotal: c.valorTotal || "",
      kmAbastecimento: c.kmAbastecimento || "",
      motoristaNome: c.motoristaNome || "",
      formaPagamento: c.formaPagamento || "Faturamento Prefeitura",
      descricao: c.descricao || ""
    });
    setErro("");
    setModalAberto(true);
  };

  // Cálculo automático de valor total ao mudar litros ou valor unitário
  const handleLitrosOuPrecoChange = (novoLitros, novoPreco) => {
    const l = Number(novoLitros) || 0;
    const p = Number(novoPreco) || 0;
    const total = (l * p).toFixed(2);
    setForm(prev => ({
      ...prev,
      litros: novoLitros,
      valorUnitario: novoPreco,
      valorTotal: total > 0 ? total : prev.valorTotal
    }));
  };

  const handleSalvar = async () => {
    if (!form.veiculoId || !form.valorTotal) {
      setErro("Selecione o veículo e informe o valor da despesa.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const veiculoObj = veiculos.find(v => v.id === form.veiculoId);
      const litrosNum = Number(form.litros) || 0;
      const valorTotalNum = Number(form.valorTotal) || 0;
      const valorUnitarioNum = Number(form.valorUnitario) || 0;
      const kmAbastecimentoNum = Number(form.kmAbastecimento) || 0;

      const payload = {
        ...form,
        veiculoPlaca: veiculoObj ? veiculoObj.placa : "",
        litros: litrosNum,
        valorTotal: valorTotalNum,
        valorUnitario: valorUnitarioNum,
        kmAbastecimento: kmAbastecimentoNum
      };

      if (custoEditando) {
        await updateCustoTransporte(custoEditando.id, payload);
      } else {
        await addCustoTransporte(payload, escolaId);
        // Atualiza km do veículo se abastecimento
        if (veiculoObj && kmAbastecimentoNum > Number(veiculoObj.kmAtual || 0)) {
          await updateVeiculo(veiculoObj.id, { kmAtual: kmAbastecimentoNum });
        }
      }

      setModalAberto(false);
      onReload();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar custo: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Deseja realmente excluir este lançamento financeiro?")) {
      try {
        await deleteCustoTransporte(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const custosFiltrados = useMemo(() => {
    return custos.filter(c => {
      const termo = busca.toLowerCase();
      const matchBusca = (c.veiculoPlaca || "").toLowerCase().includes(termo) ||
        (c.categoria || "").toLowerCase().includes(termo) ||
        (c.posto || "").toLowerCase().includes(termo) ||
        (c.descricao || "").toLowerCase().includes(termo) ||
        (c.motoristaNome || "").toLowerCase().includes(termo);

      const matchTipo = !filtroTipo || c.tipo === filtroTipo;
      const matchVeiculo = !filtroVeiculo || c.veiculoId === filtroVeiculo;

      return matchBusca && matchTipo && matchVeiculo;
    });
  }, [custos, busca, filtroTipo, filtroVeiculo]);

  // Resumo financeiro
  const totais = useMemo(() => {
    const totalGeral = custosFiltrados.reduce((acc, c) => acc + (Number(c.valorTotal) || 0), 0);
    const totalCombustivel = custosFiltrados
      .filter(c => c.tipo === "Abastecimento" || c.categoria === "Combustível")
      .reduce((acc, c) => acc + (Number(c.valorTotal) || 0), 0);
    const totalLitros = custosFiltrados
      .filter(c => c.tipo === "Abastecimento" || c.categoria === "Combustível")
      .reduce((acc, c) => acc + (Number(c.litros) || 0), 0);
    const outrosCustos = totalGeral - totalCombustivel;

    return { totalGeral, totalCombustivel, totalLitros, outrosCustos };
  }, [custosFiltrados]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Cards de Resumo Financeiro */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Card style={{ padding: "18px 20px", background: "#1e293b", border: "1px solid #2c3b52", borderLeft: "4px solid #10b981" }}>
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Gasto Total Filtrado</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#34d399", marginTop: 6 }}>
            {totais.totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{custosFiltrados.length} lançamentos</div>
        </Card>

        <Card style={{ padding: "18px 20px", background: "#1e293b", border: "1px solid #2c3b52", borderLeft: "4px solid #3b82f6" }}>
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Combustível (Diesel/Gasolina)</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#60a5fa", marginTop: 6 }}>
            {totais.totalCombustivel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{totais.totalLitros.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} Litros abastecidos</div>
        </Card>

        <Card style={{ padding: "18px 20px", background: "#1e293b", border: "1px solid #2c3b52", borderLeft: "4px solid #f59e0b" }}>
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Outras Despesas Operacionais</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fbbf24", marginTop: 6 }}>
            {totais.outrosCustos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Seguros, taxas, higienização e peças</div>
        </Card>
      </div>

      {/* Barra de Filtros e Ações */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flex: 1 }}>
          <div style={{ position: "relative", minWidth: 260 }}>
            <input
              type="text"
              placeholder="Buscar por placa, posto, motorista ou categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                borderRadius: 10,
                border: "1px solid #2c3b52",
                background: "#1e293b",
                color: "#f8fafc",
                fontSize: 13,
                outline: "none"
              }}
            />
            <i className="ti ti-search" style={{ position: "absolute", left: 12, top: 12, color: "#64748b" }} />
          </div>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #2c3b52", fontSize: 13, background: "#1e293b", color: "#f8fafc", outline: "none" }}
          >
            <option value="">Todos os Tipos</option>
            <option value="Abastecimento">Abastecimento</option>
            <option value="Outros Custos">Outras Despesas</option>
          </select>

          <select
            value={filtroVeiculo}
            onChange={(e) => setFiltroVeiculo(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #2c3b52", fontSize: 13, background: "#1e293b", color: "#f8fafc", outline: "none" }}
          >
            <option value="">Todos os Veículos</option>
            {veiculos.map(v => (
              <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => abrirNovo("Outros Custos")}>
            <i className="ti ti-receipt" /> Outra Despesa
          </Btn>
          <Btn variant="primary" onClick={() => abrirNovo("Abastecimento")}>
            <i className="ti ti-gas-station" /> Registrar Abastecimento
          </Btn>
        </div>
      </div>

      {/* Tabela de Custos */}
      <Card style={{ padding: 0, overflow: "hidden", background: "#1e293b", border: "1px solid #2c3b52" }}>
        {custosFiltrados.length === 0 ? (
          <EmptyState icon="receipt-2" texto="Nenhum lançamento de custo de transporte encontrado." />
        ) : (
          <>
            {/* Visualização Desktop: Tabela Tradicional */}
            <div className="sigem-desktop-table" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#243144", borderBottom: "1px solid #2c3b52", color: "#f8fafc" }}>
                    <th style={{ padding: "12px 16px" }}>Data / Tipo</th>
                    <th style={{ padding: "12px 16px" }}>Veículo / Motorista</th>
                    <th style={{ padding: "12px 16px" }}>Categoria / Detalhes</th>
                    <th style={{ padding: "12px 16px" }}>Litros / Preço Unit.</th>
                    <th style={{ padding: "12px 16px" }}>KM Odômetro</th>
                    <th style={{ padding: "12px 16px" }}>Valor Total</th>
                    <th style={{ padding: "12px 16px" }}>Forma Pgto</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {custosFiltrados.map((c, idx) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #2c3b52", background: idx % 2 === 0 ? "#1e293b" : "#161f2e" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#ffffff" }}>
                          {new Date(c.data + "T00:00:00").toLocaleDateString("pt-BR")}
                        </div>
                        <Badge color={c.tipo === "Abastecimento" ? "blue" : "amber"}>
                          {c.tipo}
                        </Badge>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#60a5fa" }}>{c.veiculoPlaca}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.motoristaNome || "-"}</div>
                      </td>
                      <td style={{ padding: "12px 16px", maxWidth: 260 }}>
                        <div style={{ fontWeight: 500, color: "#f8fafc" }}>{c.categoria}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.posto || c.descricao || "-"}</div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                        {c.tipo === "Abastecimento" ? (
                          <div>
                            <strong style={{ color: "#ffffff" }}>{c.litros} L</strong> ({c.combustivel})
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {(Number(c.valorUnitario) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / L
                            </div>
                          </div>
                        ) : "-"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                        {c.kmAbastecimento ? `${Number(c.kmAbastecimento).toLocaleString("pt-BR")} km` : "-"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#f87171", fontSize: 14 }}>
                          {(Number(c.valorTotal) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#cbd5e1" }}>
                        {c.formaPagamento || "Prefeitura"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <Btn onClick={() => abrirEditar(c)} style={{ padding: "4px 8px", fontSize: 12 }}>
                            <i className="ti ti-edit" />
                          </Btn>
                          <Btn variant="danger" onClick={() => handleExcluir(c.id)} style={{ padding: "4px 8px", fontSize: 12 }}>
                            <i className="ti ti-trash" />
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Visualização Mobile: Cards Otimizados */}
            <div className="sigem-mobile-cards" style={{ padding: "10px" }}>
              {custosFiltrados.map((c) => (
                <div
                  key={`mob-custo-${c.id}`}
                  style={{
                    background: "var(--bg-card, #1e293b)",
                    border: "1px solid var(--border-color, #2c3b52)",
                    borderRadius: 14,
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, color: "#60a5fa", fontSize: 14 }}>{c.veiculoPlaca}</span>
                        <Badge color={c.tipo === "Abastecimento" ? "blue" : "amber"}>{c.tipo}</Badge>
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                        {new Date(c.data + "T00:00:00").toLocaleDateString("pt-BR")} · {c.motoristaNome || "Sem motorista"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, color: "#f87171", fontSize: 15 }}>
                        {(Number(c.valorTotal) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{c.formaPagamento || "Prefeitura"}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "#161f2e", padding: "10px 12px", borderRadius: 10, border: "1px solid #243144", fontSize: 12, color: "#cbd5e1" }}>
                    <div>
                      <span style={{ color: "#94a3b8" }}>Categoria / Detalhe:</span>
                      <div style={{ fontWeight: 600, color: "#ffffff", marginTop: 1 }}>{c.categoria}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.posto || c.descricao || "-"}</div>
                    </div>
                    <div>
                      <span style={{ color: "#94a3b8" }}>
                        {c.tipo === "Abastecimento" ? "Combustível:" : "Odômetro:"}
                      </span>
                      {c.tipo === "Abastecimento" ? (
                        <div style={{ fontWeight: 600, color: "#34d399", marginTop: 1 }}>
                          {c.litros} L ({c.combustivel})
                        </div>
                      ) : (
                        <div style={{ fontWeight: 600, color: "#ffffff", marginTop: 1 }}>
                          {c.kmAbastecimento ? `${c.kmAbastecimento} km` : "-"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 2 }}>
                    <Btn onClick={() => abrirEditar(c)} style={{ padding: "6px 12px", fontSize: 12 }}>
                      <i className="ti ti-edit" /> Editar
                    </Btn>
                    <Btn variant="danger" onClick={() => handleExcluir(c.id)} style={{ padding: "6px 12px", fontSize: 12 }}>
                      <i className="ti ti-trash" /> Excluir
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Modal de Lançamento de Custos / Abastecimento */}
      {modalAberto && (
        <Modal
          titulo={custoEditando ? "Editar Lançamento Financeiro" : form.tipo === "Abastecimento" ? "Registrar Abastecimento de Frota" : "Registrar Despesa Operacional"}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={620}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Tipo de Lançamento"
                value={form.tipo}
                onChange={(e) => {
                  const novoTipo = e.target.value;
                  setForm({
                    ...form,
                    tipo: novoTipo,
                    categoria: novoTipo === "Abastecimento" ? "Combustível" : "Seguro Obrigatório & Frota"
                  });
                }}
              >
                <option value="Abastecimento">Abastecimento (Combustível)</option>
                <option value="Outros Custos">Outras Despesas Operacionais</option>
              </Select>

              <Input
                label="Data da Despesa *"
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Veículo *"
                value={form.veiculoId}
                onChange={(e) => {
                  const vId = e.target.value;
                  const vObj = veiculos.find(v => v.id === vId);
                  setForm({
                    ...form,
                    veiculoId: vId,
                    combustivel: vObj?.combustivel || form.combustivel,
                    kmAbastecimento: vObj?.kmAtual || form.kmAbastecimento
                  });
                }}
              >
                <option value="">Selecione o veículo...</option>
                {veiculos.map(v => (
                  <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>
                ))}
              </Select>

              <Select
                label="Motorista Responsável"
                value={form.motoristaNome}
                onChange={(e) => setForm({ ...form, motoristaNome: e.target.value })}
              >
                <option value="">Selecione o motorista...</option>
                {motoristas.filter(m => m.tipo === "Motorista" || !m.tipo).map(m => (
                  <option key={m.id} value={m.nome}>{m.nome}</option>
                ))}
              </Select>
            </div>

            {form.tipo === "Abastecimento" ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input
                    label="Posto de Abastecimento"
                    placeholder="Ex: Posto Aliança de Combustíveis"
                    value={form.posto}
                    onChange={(e) => setForm({ ...form, posto: e.target.value })}
                  />
                  <Select
                    label="Combustível"
                    value={form.combustivel}
                    onChange={(e) => setForm({ ...form, combustivel: e.target.value })}
                  >
                    <option value="Diesel S10">Diesel S10</option>
                    <option value="Diesel Comum S500">Diesel Comum (S500)</option>
                    <option value="Gasolina">Gasolina</option>
                    <option value="Etanol">Etanol</option>
                    <option value="GNV">GNV</option>
                  </Select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <Input
                    label="Litros Abastecidos *"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 80.00"
                    value={form.litros}
                    onChange={(e) => handleLitrosOuPrecoChange(e.target.value, form.valorUnitario)}
                  />
                  <Input
                    label="Preço por Litro (R$)"
                    type="number"
                    step="0.01"
                    placeholder="5.99"
                    value={form.valorUnitario}
                    onChange={(e) => handleLitrosOuPrecoChange(form.litros, e.target.value)}
                  />
                  <Input
                    label="Valor Total (R$) *"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.valorTotal}
                    onChange={(e) => setForm({ ...form, valorTotal: e.target.value })}
                  />
                </div>

                <Input
                  label="KM do Veículo no Momento do Abastecimento"
                  type="number"
                  placeholder="Ex: 68150"
                  value={form.kmAbastecimento}
                  onChange={(e) => setForm({ ...form, kmAbastecimento: e.target.value })}
                />
              </>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Select
                    label="Categoria da Despesa"
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  >
                    <option value="Seguro Obrigatório & Frota">Seguro Obrigatório & Frota</option>
                    <option value="IPVA / Licenciamento / Taxas">IPVA / Licenciamento / Taxas</option>
                    <option value="Higienização & Lavagem">Higienização & Lavagem</option>
                    <option value="Pedágio">Pedágio</option>
                    <option value="Peças & Acessórios Rápidos">Peças & Acessórios Rápidos</option>
                    <option value="Diárias / Refeição Motorista">Diárias / Refeição Motorista</option>
                    <option value="Outros">Outros</option>
                  </Select>

                  <Input
                    label="Valor Total da Despesa (R$) *"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.valorTotal}
                    onChange={(e) => setForm({ ...form, valorTotal: e.target.value })}
                  />
                </div>

                <Input
                  label="Descrição da Despesa"
                  placeholder="Ex: Renovação da apólice de seguro contra acidentes e terceiros da van."
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </>
            )}

            <Select
              label="Forma de Pagamento / Centro de Custo"
              value={form.formaPagamento}
              onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}
            >
              <option value="Faturamento Prefeitura">Faturamento / Empenho Prefeitura</option>
              <option value="Caixa Escolar / PDDE">Caixa Escolar / Recursos PDDE</option>
              <option value="Boleto Bancário">Boleto Bancário</option>
              <option value="Cartão Corporativo">Cartão Corporativo</option>
              <option value="Dinheiro / Adiantamento">Dinheiro / Fundo Fixo</option>
            </Select>
          </div>
        </Modal>
      )}
    </div>
  );
}

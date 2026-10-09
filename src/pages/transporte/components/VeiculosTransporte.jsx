import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addVeiculo, updateVeiculo, deleteVeiculo } from "../../../services/transporteService";

export default function VeiculosTransporte({
  veiculos = [],
  rotas = [],
  manutencoes = [],
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [veiculoEditando, setVeiculoEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    placa: "",
    modelo: "",
    tipo: "Micro-ônibus",
    ano: new Date().getFullYear().toString(),
    capacidade: 28,
    kmAtual: "",
    combustivel: "Diesel S10",
    status: "Operacional",
    acessibilidade: false,
    seguroVencimento: "",
    vistoriaVencimento: "",
    observacoes: ""
  });

  const abrirNovo = () => {
    setVeiculoEditando(null);
    setForm({
      placa: "",
      modelo: "",
      tipo: "Micro-ônibus",
      ano: new Date().getFullYear().toString(),
      capacidade: 28,
      kmAtual: "",
      combustivel: "Diesel S10",
      status: "Operacional",
      acessibilidade: false,
      seguroVencimento: "",
      vistoriaVencimento: "",
      observacoes: ""
    });
    setErro("");
    setModalAberto(true);
  };

  const abrirEditar = (veiculo) => {
    setVeiculoEditando(veiculo);
    setForm({
      placa: veiculo.placa || "",
      modelo: veiculo.modelo || "",
      tipo: veiculo.tipo || "Micro-ônibus",
      ano: veiculo.ano || "",
      capacidade: veiculo.capacidade || 28,
      kmAtual: veiculo.kmAtual || "",
      combustivel: veiculo.combustivel || "Diesel S10",
      status: veiculo.status || "Operacional",
      acessibilidade: !!veiculo.acessibilidade,
      seguroVencimento: veiculo.seguroVencimento || "",
      vistoriaVencimento: veiculo.vistoriaVencimento || "",
      observacoes: veiculo.observacoes || ""
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.placa.trim() || !form.modelo.trim()) {
      setErro("Informe a placa e o modelo do veículo.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const payload = {
        ...form,
        placa: form.placa.toUpperCase().trim(),
        capacidade: Number(form.capacidade) || 0,
        kmAtual: Number(form.kmAtual) || 0
      };

      if (veiculoEditando) {
        await updateVeiculo(veiculoEditando.id, payload);
      } else {
        await addVeiculo(payload, escolaId);
      }

      setModalAberto(false);
      onReload();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar veículo: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id, placa) => {
    if (window.confirm(`Deseja realmente excluir o veículo ${placa}?`)) {
      try {
        await deleteVeiculo(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const veiculosFiltrados = useMemo(() => {
    return veiculos.filter(v => {
      const termo = busca.toLowerCase();
      return (
        (v.placa || "").toLowerCase().includes(termo) ||
        (v.modelo || "").toLowerCase().includes(termo) ||
        (v.tipo || "").toLowerCase().includes(termo)
      );
    });
  }, [veiculos, busca]);

  const hoje = new Date();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Barra de Filtros e Novo Veículo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 460 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Buscar por placa, modelo ou tipo..."
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
          <i className="ti ti-plus" /> Cadastrar Veículo
        </Btn>
      </div>

      {/* Grid de Veículos */}
      {veiculosFiltrados.length === 0 ? (
        <EmptyState icon="bus" texto="Nenhum veículo cadastrado na frota escolar." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18 }}>
          {veiculosFiltrados.map((veiculo) => {
            const rotaVinculada = rotas.find(r => r.veiculoId === veiculo.id);
            const totalManutencoes = manutencoes.filter(m => m.veiculoId === veiculo.id).length;
            const vistoriaVencida = veiculo.vistoriaVencimento && new Date(veiculo.vistoriaVencimento) < hoje;

            return (
              <Card key={veiculo.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        background: veiculo.tipo === "Ônibus" ? "#dbeafe" : veiculo.tipo === "Van" ? "#fef3c7" : "#e0e7ff",
                        color: veiculo.tipo === "Ônibus" ? "#1e40af" : veiculo.tipo === "Van" ? "#b45309" : "#4338ca",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24
                      }}>
                        <i className={`ti ti-${veiculo.tipo === "Van" ? "car" : veiculo.tipo === "Barco" ? "sailboat" : "bus"}`} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: "0.5px" }}>
                            {veiculo.placa}
                          </span>
                          {veiculo.acessibilidade && (
                            <span title="Acessível para PCD" style={{ color: "#2563eb", fontSize: 14 }}>
                              ♿
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          {veiculo.tipo} · Ano {veiculo.ano}
                        </div>
                      </div>
                    </div>

                    <Badge color={veiculo.status === "Operacional" ? "green" : veiculo.status === "Em Manutenção" ? "amber" : "gray"}>
                      {veiculo.status || "Operacional"}
                    </Badge>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "10px 0 6px 0" }}>
                    {veiculo.modelo}
                  </div>

                  {/* Detalhes Técnicos */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#4b5563", background: "#f8fafc", padding: "10px 12px", borderRadius: 8, marginTop: 8 }}>
                    <div>
                      <span style={{ color: "#6b7280" }}>Capacidade:</span>
                      <div style={{ fontWeight: 600, color: "#1f2937" }}>{veiculo.capacidade} assentos</div>
                    </div>
                    <div>
                      <span style={{ color: "#6b7280" }}>KM Atual:</span>
                      <div style={{ fontWeight: 600, color: "#1f2937" }}>{veiculo.kmAtual ? `${Number(veiculo.kmAtual).toLocaleString("pt-BR")} km` : "-"}</div>
                    </div>
                    <div>
                      <span style={{ color: "#6b7280" }}>Combustível:</span>
                      <div style={{ fontWeight: 600, color: "#1f2937" }}>{veiculo.combustivel || "Diesel"}</div>
                    </div>
                    <div>
                      <span style={{ color: "#6b7280" }}>Vistoria DETRAN:</span>
                      <div style={{ fontWeight: 600, color: vistoriaVencida ? "#dc2626" : "#059669" }}>
                        {veiculo.vistoriaVencimento ? new Date(veiculo.vistoriaVencimento + "T00:00:00").toLocaleDateString("pt-BR") : "Não inf."}
                        {vistoriaVencida && " ⚠️"}
                      </div>
                    </div>
                  </div>

                  {rotaVinculada && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#1e40af", background: "#eff6ff", padding: "6px 10px", borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <i className="ti ti-route" /> Vinculado a: <strong>{rotaVinculada.nome}</strong>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    <i className="ti ti-wrench" /> {totalManutencoes} manutenções
                  </span>

                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn onClick={() => abrirEditar(veiculo)} style={{ padding: "6px 10px", fontSize: 12 }}>
                      <i className="ti ti-edit" /> Editar
                    </Btn>
                    <Btn variant="danger" onClick={() => handleExcluir(veiculo.id, veiculo.placa)} style={{ padding: "6px 10px", fontSize: 12 }}>
                      <i className="ti ti-trash" />
                    </Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro/Edição de Veículo */}
      {modalAberto && (
        <Modal
          titulo={veiculoEditando ? "Editar Veículo da Frota" : "Cadastrar Novo Veículo Escolar"}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={580}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Placa do Veículo *"
                placeholder="Ex: ABC-1234 ou ABC1D23"
                value={form.placa}
                onChange={(e) => setForm({ ...form, placa: e.target.value })}
              />
              <Select
                label="Tipo de Veículo"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option value="Ônibus">Ônibus Escolar (ORE)</option>
                <option value="Micro-ônibus">Micro-ônibus</option>
                <option value="Van">Van / Utilitário</option>
                <option value="Kombi">Kombi</option>
                <option value="Barco">Barco / Lancha Escolar</option>
              </Select>
            </div>

            <Input
              label="Marca e Modelo *"
              placeholder="Ex: Mercedes-Benz Marcopolo Senior / VW 15.190"
              value={form.modelo}
              onChange={(e) => setForm({ ...form, modelo: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input
                label="Ano Fabricação"
                placeholder="Ex: 2022"
                value={form.ano}
                onChange={(e) => setForm({ ...form, ano: e.target.value })}
              />
              <Input
                label="Capacidade (Lugares)"
                type="number"
                placeholder="Ex: 32"
                value={form.capacidade}
                onChange={(e) => setForm({ ...form, capacidade: e.target.value })}
              />
              <Input
                label="KM Atual (Odômetro)"
                type="number"
                placeholder="Ex: 45000"
                value={form.kmAtual}
                onChange={(e) => setForm({ ...form, kmAtual: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Tipo de Combustível"
                value={form.combustivel}
                onChange={(e) => setForm({ ...form, combustivel: e.target.value })}
              >
                <option value="Diesel S10">Diesel S10</option>
                <option value="Diesel Comum S500">Diesel Comum (S500)</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Etanol">Etanol</option>
                <option value="GNV">GNV</option>
                <option value="Elétrico / Híbrido">Elétrico / Híbrido</option>
              </Select>

              <Select
                label="Status Operacional"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Operacional">Operacional (Em tráfego)</option>
                <option value="Em Manutenção">Em Manutenção / Oficina</option>
                <option value="Reserva">Reserva Técnica</option>
                <option value="Inativo">Inativo / Baixado</option>
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Vencimento da Vistoria DETRAN"
                type="date"
                value={form.vistoriaVencimento}
                onChange={(e) => setForm({ ...form, vistoriaVencimento: e.target.value })}
              />
              <Input
                label="Vencimento do Seguro Frota"
                type="date"
                value={form.seguroVencimento}
                onChange={(e) => setForm({ ...form, seguroVencimento: e.target.value })}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "6px 0" }}>
              <input
                type="checkbox"
                checked={form.acessibilidade}
                onChange={(e) => setForm({ ...form, acessibilidade: e.target.checked })}
              />
              <span><strong>Possui Acessibilidade PCD</strong> (Plataforma elevatória / rampa de acesso)</span>
            </label>

            <Input
              label="Observações Adicionais"
              placeholder="Ex: Equipado com tacógrafo digital aferido pelo INMETRO."
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

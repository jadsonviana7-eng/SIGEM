import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addManutencao, updateManutencao, deleteManutencao, updateVeiculo } from "../../../services/transporteService";

export default function ManutencaoTransporte({
  manutencoes = [],
  veiculos = [],
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [manutencaoEditando, setManutencaoEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const hojeStr = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    veiculoId: "",
    tipo: "Preventiva",
    descricao: "",
    fornecedor: "",
    data: hojeStr,
    kmMomento: "",
    proximaRevisaoKm: "",
    proximaRevisaoData: "",
    custoPecas: "",
    custoMaoDeObra: "",
    status: "Concluída",
    numeroNota: ""
  });

  const abrirNovo = () => {
    setManutencaoEditando(null);
    const veiculoPadrao = veiculos[0];
    setForm({
      veiculoId: veiculoPadrao?.id || "",
      tipo: "Preventiva",
      descricao: "",
      fornecedor: "",
      data: hojeStr,
      kmMomento: veiculoPadrao?.kmAtual || "",
      proximaRevisaoKm: veiculoPadrao?.kmAtual ? Number(veiculoPadrao.kmAtual) + 10000 : "",
      proximaRevisaoData: "",
      custoPecas: "",
      custoMaoDeObra: "",
      status: "Concluída",
      numeroNota: ""
    });
    setErro("");
    setModalAberto(true);
  };

  const abrirEditar = (m) => {
    setManutencaoEditando(m);
    setForm({
      veiculoId: m.veiculoId || "",
      tipo: m.tipo || "Preventiva",
      descricao: m.descricao || "",
      fornecedor: m.fornecedor || "",
      data: m.data || hojeStr,
      kmMomento: m.kmMomento || "",
      proximaRevisaoKm: m.proximaRevisaoKm || "",
      proximaRevisaoData: m.proximaRevisaoData || "",
      custoPecas: m.custoPecas || "",
      custoMaoDeObra: m.custoMaoDeObra || "",
      status: m.status || "Concluída",
      numeroNota: m.numeroNota || ""
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.veiculoId || !form.descricao.trim()) {
      setErro("Selecione o veículo e descreva o serviço de manutenção.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const veiculoObj = veiculos.find(v => v.id === form.veiculoId);
      const cPecas = Number(form.custoPecas) || 0;
      const cMao = Number(form.custoMaoDeObra) || 0;
      const custoTotal = cPecas + cMao;

      const payload = {
        ...form,
        veiculoPlaca: veiculoObj ? veiculoObj.placa : "",
        veiculoModelo: veiculoObj ? veiculoObj.modelo : "",
        kmMomento: Number(form.kmMomento) || 0,
        proximaRevisaoKm: Number(form.proximaRevisaoKm) || 0,
        custoPecas: cPecas,
        custoMaoDeObra: cMao,
        custoTotal
      };

      if (manutencaoEditando) {
        await updateManutencao(manutencaoEditando.id, payload);
      } else {
        await addManutencao(payload, escolaId);
        // Atualiza km do veículo se informado
        if (veiculoObj && form.kmMomento && Number(form.kmMomento) > Number(veiculoObj.kmAtual || 0)) {
          await updateVeiculo(veiculoObj.id, { kmAtual: Number(form.kmMomento) });
        }
      }

      setModalAberto(false);
      onReload();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar manutenção: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Deseja realmente excluir este registro de manutenção?")) {
      try {
        await deleteManutencao(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const manutencoesFiltradas = useMemo(() => {
    return manutencoes.filter(m => {
      const termo = busca.toLowerCase();
      const matchBusca = (m.veiculoPlaca || "").toLowerCase().includes(termo) ||
        (m.descricao || "").toLowerCase().includes(termo) ||
        (m.fornecedor || "").toLowerCase().includes(termo);

      const matchTipo = !filtroTipo || m.tipo === filtroTipo;
      return matchBusca && matchTipo;
    });
  }, [manutencoes, busca, filtroTipo]);

  const totalGastoManutencoes = useMemo(() => {
    return manutencoesFiltradas.reduce((acc, m) => acc + (Number(m.custoTotal) || 0), 0);
  }, [manutencoesFiltradas]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Barra de Filtros e Totalizadores */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 520 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Buscar por placa, descrição ou oficina..."
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

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "white" }}
          >
            <option value="">Todos os Tipos</option>
            <option value="Preventiva">Preventiva</option>
            <option value="Corretiva">Corretiva</option>
            <option value="Vistoria / Inspeção">Vistoria / Inspeção</option>
            <option value="Preditiva">Preditiva</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 13, color: "#475569" }}>
            Total em Manutenções: <strong style={{ color: "#991b1b", fontSize: 15 }}>{totalGastoManutencoes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
          </div>
          <Btn variant="primary" onClick={abrirNovo}>
            <i className="ti ti-plus" /> Registrar Manutenção
          </Btn>
        </div>
      </div>

      {/* Tabela de Manutenções */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {manutencoesFiltradas.length === 0 ? (
          <EmptyState icon="wrench" texto="Nenhum registro de manutenção veicular encontrado." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>Data / Tipo</th>
                  <th style={{ padding: "12px 16px" }}>Veículo</th>
                  <th style={{ padding: "12px 16px" }}>Serviço / Descrição</th>
                  <th style={{ padding: "12px 16px" }}>Oficina / Fornecedor</th>
                  <th style={{ padding: "12px 16px" }}>KM no Serviço</th>
                  <th style={{ padding: "12px 16px" }}>Próx. Revisão</th>
                  <th style={{ padding: "12px 16px" }}>Valor Total</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {manutencoesFiltradas.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>
                        {new Date(m.data + "T00:00:00").toLocaleDateString("pt-BR")}
                      </div>
                      <Badge color={m.tipo === "Preventiva" ? "green" : m.tipo === "Corretiva" ? "red" : "blue"}>
                        {m.tipo}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1e40af" }}>{m.veiculoPlaca}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{m.veiculoModelo}</div>
                    </td>
                    <td style={{ padding: "12px 16px", maxWidth: 280 }}>
                      <div style={{ fontWeight: 500, color: "#1e293b" }}>{m.descricao}</div>
                      {m.numeroNota && (
                        <div style={{ fontSize: 11, color: "#64748b" }}>Doc: {m.numeroNota}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>
                      {m.fornecedor || "Mecânica da Prefeitura"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {m.kmMomento ? `${Number(m.kmMomento).toLocaleString("pt-BR")} km` : "-"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      {m.proximaRevisaoKm ? (
                        <div>{Number(m.proximaRevisaoKm).toLocaleString("pt-BR")} km</div>
                      ) : null}
                      {m.proximaRevisaoData ? (
                        <div style={{ color: "#64748b" }}>{new Date(m.proximaRevisaoData + "T00:00:00").toLocaleDateString("pt-BR")}</div>
                      ) : null}
                      {!m.proximaRevisaoKm && !m.proximaRevisaoData && "-"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#991b1b" }}>
                        {(Number(m.custoTotal) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>
                        Peças: {(Number(m.custoPecas) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color={m.status === "Concluída" ? "green" : m.status === "Em Andamento" ? "amber" : "gray"}>
                        {m.status || "Concluída"}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                        <Btn onClick={() => abrirEditar(m)} style={{ padding: "4px 8px", fontSize: 12 }}>
                          <i className="ti ti-edit" />
                        </Btn>
                        <Btn variant="danger" onClick={() => handleExcluir(m.id)} style={{ padding: "4px 8px", fontSize: 12 }}>
                          <i className="ti ti-trash" />
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Cadastro/Edição de Manutenção */}
      {modalAberto && (
        <Modal
          titulo={manutencaoEditando ? "Editar Registro de Manutenção" : "Registrar Manutenção de Veículo"}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={620}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Select
                label="Veículo *"
                value={form.veiculoId}
                onChange={(e) => {
                  const vId = e.target.value;
                  const vObj = veiculos.find(v => v.id === vId);
                  setForm({
                    ...form,
                    veiculoId: vId,
                    kmMomento: vObj?.kmAtual || form.kmMomento
                  });
                }}
              >
                <option value="">Selecione o veículo...</option>
                {veiculos.map(v => (
                  <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>
                ))}
              </Select>

              <Select
                label="Tipo de Manutenção"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option value="Preventiva">Preventiva (Revisão periódica)</option>
                <option value="Corretiva">Corretiva (Reparo de avaria)</option>
                <option value="Vistoria / Inspeção">Vistoria / Inspeção DETRAN</option>
                <option value="Preditiva">Preditiva / Pneus / Suspensão</option>
              </Select>

              <Input
                label="Data da Manutenção *"
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>

            <Input
              label="Descrição Detalhada do Serviço / Peças Trocadas *"
              placeholder="Ex: Troca de pastilhas de freio, filtro de combustível e alinhamento da direção"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Oficina / Prestador de Serviço"
                placeholder="Ex: Auto Mecânica Central / Garagem Municipal"
                value={form.fornecedor}
                onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
              />
              <Input
                label="Nº da Nota Fiscal / Ordem de Serviço"
                placeholder="Ex: NF-e 004812"
                value={form.numeroNota}
                onChange={(e) => setForm({ ...form, numeroNota: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input
                label="KM no Momento do Serviço"
                type="number"
                placeholder="Ex: 45000"
                value={form.kmMomento}
                onChange={(e) => setForm({ ...form, kmMomento: e.target.value })}
              />
              <Input
                label="Próxima Revisão (KM)"
                type="number"
                placeholder="Ex: 55000"
                value={form.proximaRevisaoKm}
                onChange={(e) => setForm({ ...form, proximaRevisaoKm: e.target.value })}
              />
              <Input
                label="Próxima Revisão (Data)"
                type="date"
                value={form.proximaRevisaoData}
                onChange={(e) => setForm({ ...form, proximaRevisaoData: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input
                label="Custo das Peças (R$)"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.custoPecas}
                onChange={(e) => setForm({ ...form, custoPecas: e.target.value })}
              />
              <Input
                label="Custo da Mão de Obra (R$)"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.custoMaoDeObra}
                onChange={(e) => setForm({ ...form, custoMaoDeObra: e.target.value })}
              />
              <Select
                label="Status da Manutenção"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Concluída">Concluída</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Agendada">Agendada</option>
                <option value="Cancelada">Cancelada</option>
              </Select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

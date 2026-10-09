import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addMerendaServida, updateMerendaServida, deleteMerendaServida } from "../../../services/alimentacaoService";

export default function MerendaDiaria({
  merendaServida = [],
  cardapios = [],
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [merendaEditando, setMerendaEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const hojeStr = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    data: hojeStr,
    turno: "Manhã",
    cardapioRef: "",
    refeicoesPrevistas: "",
    refeicoesServidas: "",
    alunosAtendidos: "",
    aceitabilidade: "Excelente (90%+)",
    sobrasLimpasKg: "",
    restoIngestaKg: "",
    merendeiras: "",
    observacoes: ""
  });

  const abrirNovo = () => {
    setMerendaEditando(null);
    const cardapioAtivo = cardapios.find(c => c.status === "Ativo") || cardapios[0];
    setForm({
      data: hojeStr,
      turno: "Manhã",
      cardapioRef: cardapioAtivo?.diasSemana?.segunda?.almoco || cardapioAtivo?.titulo || "Arroz, feijão, frango e legumes",
      refeicoesPrevistas: 180,
      refeicoesServidas: 175,
      alunosAtendidos: 175,
      aceitabilidade: "Excelente (90%+)",
      sobrasLimpasKg: 0.8,
      restoIngestaKg: 0.5,
      merendeiras: "Josefa Maria e Maria do Socorro",
      observacoes: ""
    });
    setErro("");
    setModalAberto(true);
  };

  const abrirEditar = (m) => {
    setMerendaEditando(m);
    setForm({
      data: m.data || hojeStr,
      turno: m.turno || "Manhã",
      cardapioRef: m.cardapioRef || "",
      refeicoesPrevistas: m.refeicoesPrevistas || "",
      refeicoesServidas: m.refeicoesServidas || "",
      alunosAtendidos: m.alunosAtendidos || "",
      aceitabilidade: m.aceitabilidade || "Excelente (90%+)",
      sobrasLimpasKg: m.sobrasLimpasKg || "",
      restoIngestaKg: m.restoIngestaKg || "",
      merendeiras: m.merendeiras || "",
      observacoes: m.observacoes || ""
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.data || !form.cardapioRef.trim() || !form.refeicoesServidas) {
      setErro("Informe a data, o prato servido e o número de refeições servidas.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const payload = {
        ...form,
        refeicoesPrevistas: Number(form.refeicoesPrevistas) || 0,
        refeicoesServidas: Number(form.refeicoesServidas) || 0,
        alunosAtendidos: Number(form.alunosAtendidos) || Number(form.refeicoesServidas) || 0,
        sobrasLimpasKg: Number(form.sobrasLimpasKg) || 0,
        restoIngestaKg: Number(form.restoIngestaKg) || 0
      };

      if (merendaEditando) {
        await updateMerendaServida(merendaEditando.id, payload);
      } else {
        await addMerendaServida(payload, escolaId);
      }

      setModalAberto(false);
      onReload();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Deseja excluir este registro de merenda servida?")) {
      try {
        await deleteMerendaServida(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const merendasFiltradas = useMemo(() => {
    return merendaServida.filter(m => {
      const termo = busca.toLowerCase();
      const matchBusca = (m.cardapioRef || "").toLowerCase().includes(termo) ||
        (m.merendeiras || "").toLowerCase().includes(termo) ||
        (m.observacoes || "").toLowerCase().includes(termo);

      const matchTurno = !filtroTurno || m.turno === filtroTurno;
      return matchBusca && matchTurno;
    });
  }, [merendaServida, busca, filtroTurno]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Barra de Filtros e Ações */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 480 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Buscar por prato servido, merendeiras ou observações..."
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
            value={filtroTurno}
            onChange={(e) => setFiltroTurno(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "white" }}
          >
            <option value="">Todos os Turnos</option>
            <option value="Manhã">Manhã</option>
            <option value="Tarde">Tarde</option>
            <option value="Noite">Noite</option>
            <option value="Integral">Integral</option>
          </select>
        </div>

        <Btn variant="primary" onClick={abrirNovo}>
          <i className="ti ti-plus" /> Registrar Merenda Servida
        </Btn>
      </div>

      {/* Tabela de Merenda Servida */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {merendasFiltradas.length === 0 ? (
          <EmptyState icon="soup" texto="Nenhum registro de merenda servida encontrado." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>Data / Turno</th>
                  <th style={{ padding: "12px 16px" }}>Refeição / Prato do Dia</th>
                  <th style={{ padding: "12px 16px" }}>Alunos Atendidos</th>
                  <th style={{ padding: "12px 16px" }}>Aceitabilidade</th>
                  <th style={{ padding: "12px 16px" }}>Sobras / Desperdício</th>
                  <th style={{ padding: "12px 16px" }}>Equipe / Merendeiras</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {merendasFiltradas.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>
                        {new Date(m.data + "T00:00:00").toLocaleDateString("pt-BR")}
                      </div>
                      <Badge color="blue">{m.turno}</Badge>
                    </td>
                    <td style={{ padding: "12px 16px", maxWidth: 280 }}>
                      <div style={{ fontWeight: 600, color: "#047857" }}>{m.cardapioRef}</div>
                      {m.observacoes && (
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{m.observacoes}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <strong style={{ fontSize: 14, color: "#111827" }}>{m.refeicoesServidas}</strong>
                      <span style={{ fontSize: 11, color: "#64748b" }}> / previstos {m.refeicoesPrevistas || m.refeicoesServidas}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color={m.aceitabilidade?.includes("Excelente") ? "green" : m.aceitabilidade?.includes("Ótima") ? "blue" : "amber"}>
                        {m.aceitabilidade}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      <div>Sobras limpas: <strong>{m.sobrasLimpasKg || 0} kg</strong></div>
                      <div style={{ color: "#991b1b" }}>Resto-ingesta: <strong>{m.restoIngestaKg || 0} kg</strong></div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569", fontSize: 12 }}>
                      {m.merendeiras || "Equipe da Cozinha"}
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

      {/* Modal de Registro de Merenda */}
      {modalAberto && (
        <Modal
          titulo={merendaEditando ? "Editar Registro de Merenda" : "Registrar Merenda Servida do Dia"}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={620}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Data da Refeição *"
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
              <Select
                label="Turno"
                value={form.turno}
                onChange={(e) => setForm({ ...form, turno: e.target.value })}
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
                <option value="Integral">Integral</option>
              </Select>
            </div>

            <Input
              label="Prato / Alimentos Servidos *"
              placeholder="Ex: Arroz, feijão, frango em cubos com legumes e banana prata"
              value={form.cardapioRef}
              onChange={(e) => setForm({ ...form, cardapioRef: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input
                label="Refeições Previstas"
                type="number"
                placeholder="Ex: 180"
                value={form.refeicoesPrevistas}
                onChange={(e) => setForm({ ...form, refeicoesPrevistas: e.target.value })}
              />
              <Input
                label="Refeições Servidas *"
                type="number"
                placeholder="Ex: 175"
                value={form.refeicoesServidas}
                onChange={(e) => setForm({ ...form, refeicoesServidas: e.target.value, alunosAtendidos: e.target.value })}
              />
              <Select
                label="Índice de Aceitabilidade"
                value={form.aceitabilidade}
                onChange={(e) => setForm({ ...form, aceitabilidade: e.target.value })}
              >
                <option value="Excelente (90%+)">Excelente (Aprovação acima de 90%)</option>
                <option value="Ótima (80% a 90%)">Ótima (80% a 90%)</option>
                <option value="Regular (60% a 80%)">Regular (60% a 80%)</option>
                <option value="Baixa Aceitação (<60%)">Baixa Aceitação (Abaixo de 60%)</option>
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Sobras Limpas / Não Servidas (kg)"
                type="number"
                step="0.1"
                placeholder="Ex: 1.0"
                value={form.sobrasLimpasKg}
                onChange={(e) => setForm({ ...form, sobrasLimpasKg: e.target.value })}
              />
              <Input
                label="Resto-Ingesta / Sobras no Prato (kg)"
                type="number"
                step="0.1"
                placeholder="Ex: 0.5"
                value={form.restoIngestaKg}
                onChange={(e) => setForm({ ...form, restoIngestaKg: e.target.value })}
              />
            </div>

            <Input
              label="Merendeiras de Plantão / Responsáveis"
              placeholder="Ex: Josefa Maria e Maria do Socorro"
              value={form.merendeiras}
              onChange={(e) => setForm({ ...form, merendeiras: e.target.value })}
            />

            <Input
              label="Observações / Intercorrências"
              placeholder="Ex: Distribuição pontual, excelente aceitação da sobremesa de frutas."
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

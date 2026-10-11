import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addRota, updateRota, deleteRota } from "../../../services/transporteService";

export default function RotasTransporte({
  rotas = [],
  veiculos = [],
  motoristas = [],
  pontos = [],
  alunos = [],
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [rotaEditando, setRotaEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // Modal de Detalhes / Impressão
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [rotaSelecionada, setRotaSelecionada] = useState(null);

  const [form, setForm] = useState({
    nome: "",
    tipo: "Ida e Volta",
    turnos: ["Manhã"],
    extensaoKm: "",
    tempoEstimadoMin: "",
    veiculoId: "",
    motoristaId: "",
    monitorId: "",
    status: "Ativa",
    diasSemana: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
    pontosIds: [],
    observacoes: ""
  });

  const abrirNovo = () => {
    setRotaEditando(null);
    setForm({
      nome: "",
      tipo: "Ida e Volta",
      turnos: ["Manhã"],
      extensaoKm: "",
      tempoEstimadoMin: "",
      veiculoId: veiculos[0]?.id || "",
      motoristaId: motoristas.find(m => m.tipo === "Motorista")?.id || "",
      monitorId: "",
      status: "Ativa",
      diasSemana: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
      pontosIds: [],
      observacoes: ""
    });
    setErro("");
    setModalAberto(true);
  };

  const abrirEditar = (rota) => {
    setRotaEditando(rota);
    setForm({
      nome: rota.nome || "",
      tipo: rota.tipo || "Ida e Volta",
      turnos: rota.turnos || ["Manhã"],
      extensaoKm: rota.extensaoKm || "",
      tempoEstimadoMin: rota.tempoEstimadoMin || "",
      veiculoId: rota.veiculoId || "",
      motoristaId: rota.motoristaId || "",
      monitorId: rota.monitorId || "",
      status: rota.status || "Ativa",
      diasSemana: rota.diasSemana || ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
      pontosIds: rota.pontosIds || [],
      observacoes: rota.observacoes || ""
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      setErro("Informe o nome ou código da rota.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const veiculoObj = veiculos.find(v => v.id === form.veiculoId);
      const motoristaObj = motoristas.find(m => m.id === form.motoristaId);
      const monitorObj = motoristas.find(m => m.id === form.monitorId);
      const pontosNomes = (form.pontosIds || []).map(pid => pontos.find(p => p.id === pid)?.nome).filter(Boolean);

      const payload = {
        ...form,
        extensaoKm: Number(form.extensaoKm) || 0,
        tempoEstimadoMin: Number(form.tempoEstimadoMin) || 0,
        veiculoPlaca: veiculoObj ? `${veiculoObj.placa} (${veiculoObj.tipo})` : "",
        motoristaNome: motoristaObj ? motoristaObj.nome : "",
        monitorNome: monitorObj ? monitorObj.nome : "",
        pontosNomes
      };

      if (rotaEditando) {
        await updateRota(rotaEditando.id, payload);
      } else {
        await addRota(payload, escolaId);
      }

      setModalAberto(false);
      onReload();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar rota: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id, nome) => {
    if (window.confirm(`Deseja realmente excluir a rota "${nome}"?`)) {
      try {
        await deleteRota(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const toggleTurno = (turno) => {
    if (form.turnos.includes(turno)) {
      setForm(prev => ({ ...prev, turnos: prev.turnos.filter(t => t !== turno) }));
    } else {
      setForm(prev => ({ ...prev, turnos: [...prev.turnos, turno] }));
    }
  };

  const togglePonto = (pontoId) => {
    if (form.pontosIds.includes(pontoId)) {
      setForm(prev => ({ ...prev, pontosIds: prev.pontosIds.filter(p => p !== pontoId) }));
    } else {
      setForm(prev => ({ ...prev, pontosIds: [...prev.pontosIds, pontoId] }));
    }
  };

  const rotasFiltradas = useMemo(() => {
    return rotas.filter(r => {
      const termo = busca.toLowerCase();
      return (
        (r.nome || "").toLowerCase().includes(termo) ||
        (r.motoristaNome || "").toLowerCase().includes(termo) ||
        (r.veiculoPlaca || "").toLowerCase().includes(termo)
      );
    });
  }, [rotas, busca]);

  const imprimirFichaRota = (rota) => {
    setRotaSelecionada(rota);
    setModalDetalhes(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Barra Superior com Pesquisa e Ação de Cadastro */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 460 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Buscar rota, motorista ou veículo..."
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
        </div>

        <Btn variant="primary" onClick={abrirNovo}>
          <i className="ti ti-plus" /> Nova Rota Escolar
        </Btn>
      </div>

      {/* Grid de Cards de Rotas */}
      {rotasFiltradas.length === 0 ? (
        <EmptyState icon="route" texto="Nenhuma rota de transporte cadastrada." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 18 }}>
          {rotasFiltradas.map((rota) => {
            const alunosDaRota = alunos.filter(a => a.rotaId === rota.id && (a.status === "Ativo" || !a.status));
            const veiculo = veiculos.find(v => v.id === rota.veiculoId);
            const capacidade = Number(veiculo?.capacidade) || 30;
            const lotacao = alunosDaRota.length;
            const pct = Math.min(Math.round((lotacao / capacidade) * 100), 100);
            const isSuperlotado = lotacao > capacidade;

            return (
              <Card key={rota.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20, background: "#1e293b", border: "1px solid #2c3b52" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 700, color: "#ffffff" }}>
                        {rota.nome}
                      </h4>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                        <Badge color={rota.status === "Ativa" ? "green" : "gray"}>{rota.status || "Ativa"}</Badge>
                        <Badge color="blue">{rota.tipo || "Ida e Volta"}</Badge>
                        {(rota.turnos || []).map((t, idx) => (
                          <Badge key={idx} color="amber">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Informações Operacionais */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "#cbd5e1", marginTop: 12, padding: "12px", background: "#161f2e", borderRadius: 10, border: "1px solid #243144" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <i className="ti ti-steering-wheel" style={{ color: "#60a5fa", fontSize: 16 }} />
                      <span><strong style={{ color: "#f8fafc" }}>Motorista:</strong> {rota.motoristaNome || "Não atribuído"}</span>
                    </div>
                    {rota.monitorNome && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="ti ti-user-heart" style={{ color: "#f472b6", fontSize: 16 }} />
                        <span><strong style={{ color: "#f8fafc" }}>Monitor(a):</strong> {rota.monitorNome}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <i className="ti ti-bus" style={{ color: "#34d399", fontSize: 16 }} />
                      <span><strong style={{ color: "#f8fafc" }}>Veículo:</strong> {rota.veiculoPlaca || (veiculo ? `${veiculo.placa} (${veiculo.tipo})` : "Não definido")}</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, color: "#94a3b8", fontSize: 12, paddingTop: 4, borderTop: "1px solid #243144" }}>
                      <span><i className="ti ti-ruler-2" /> {rota.extensaoKm ? `${rota.extensaoKm} km` : "-"}</span>
                      <span><i className="ti ti-clock" /> {rota.tempoEstimadoMin ? `~${rota.tempoEstimadoMin} min` : "-"}</span>
                      <span><i className="ti ti-map-pin" /> {(rota.pontosIds || []).length} paradas</span>
                    </div>
                  </div>

                  {/* Lotação do Veículo */}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: "#cbd5e1" }}>Lotação de Estudantes</span>
                      <span style={{ fontWeight: 700, color: isSuperlotado ? "#f87171" : pct > 80 ? "#fbbf24" : "#34d399" }}>
                        {lotacao} / {capacidade} passageiros ({pct}%)
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 7, background: "#161f2e", borderRadius: 4, overflow: "hidden", border: "1px solid #2c3b52" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: isSuperlotado ? "#ef4444" : pct > 80 ? "#f59e0b" : "#10b981",
                          borderRadius: 4
                        }}
                      />
                    </div>
                    {isSuperlotado && (
                      <div style={{ fontSize: 11, color: "#f87171", fontWeight: 600, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        <i className="ti ti-alert-triangle" /> Alerta: A rota excede a capacidade do veículo!
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações da Rota */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 14, borderTop: "1px solid #2c3b52" }}>
                  <button
                    onClick={() => imprimirFichaRota(rota)}
                    style={{
                      background: "rgba(59, 130, 246, 0.15)",
                      color: "#93c5fd",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      padding: "7px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <i className="ti ti-printer" /> Ficha & Lista
                  </button>

                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn onClick={() => abrirEditar(rota)} style={{ padding: "6px 12px", fontSize: 12 }}>
                      <i className="ti ti-edit" /> Editar
                    </Btn>
                    <Btn variant="danger" onClick={() => handleExcluir(rota.id, rota.nome)} style={{ padding: "6px 10px", fontSize: 12 }}>
                      <i className="ti ti-trash" />
                    </Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro/Edição de Rota */}
      {modalAberto && (
        <Modal
          titulo={rotaEditando ? "Editar Rota Escolar" : "Nova Rota de Transporte"}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={640}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              label="Nome da Rota / Linha *"
              placeholder="Ex: Linha 01 — Sítio Barra & Boa Vista"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Tipo de Trajeto"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option value="Ida e Volta">Ida e Volta</option>
                <option value="Somente Ida">Somente Ida (Embarque Casa → Escola)</option>
                <option value="Somente Volta">Somente Volta (Escola → Casa)</option>
                <option value="Especial / Noturno">Especial / Noturno</option>
              </Select>

              <Select
                label="Status da Rota"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Ativa">Ativa</option>
                <option value="Inativa">Inativa</option>
                <option value="Em Manutenção">Em Manutenção / Suspensa</option>
              </Select>
            </div>

            {/* Turnos */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#cbd5e1", marginBottom: 6, display: "block" }}>
                Turnos de Atendimento:
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                {["Manhã", "Tarde", "Noite", "Integral"].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTurno(t)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: form.turnos.includes(t) ? "1px solid #3b82f6" : "1px solid #2c3b52",
                      background: form.turnos.includes(t) ? "rgba(59, 130, 246, 0.2)" : "#1e293b",
                      color: form.turnos.includes(t) ? "#93c5fd" : "#94a3b8"
                    }}
                  >
                    {form.turnos.includes(t) && <i className="ti ti-check" style={{ marginRight: 4 }} />}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Extensão Estimada (KM)"
                type="number"
                placeholder="Ex: 28"
                value={form.extensaoKm}
                onChange={(e) => setForm({ ...form, extensaoKm: e.target.value })}
              />
              <Input
                label="Tempo Médio de Percurso (Minutos)"
                type="number"
                placeholder="Ex: 45"
                value={form.tempoEstimadoMin}
                onChange={(e) => setForm({ ...form, tempoEstimadoMin: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Veículo Vinculado"
                value={form.veiculoId}
                onChange={(e) => setForm({ ...form, veiculoId: e.target.value })}
              >
                <option value="">Selecione um veículo...</option>
                {veiculos.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.placa} — {v.tipo} ({v.capacidade} lugares) {v.acessibilidade ? "♿" : ""}
                  </option>
                ))}
              </Select>

              <Select
                label="Motorista Titular"
                value={form.motoristaId}
                onChange={(e) => setForm({ ...form, motoristaId: e.target.value })}
              >
                <option value="">Selecione um motorista...</option>
                {motoristas.filter(m => m.tipo === "Motorista" || !m.tipo).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nome} (CNH: {m.categoriaCnh || "D"})
                  </option>
                ))}
              </Select>
            </div>

            <Select
              label="Monitor(a) de Transporte (Opcional)"
              value={form.monitorId}
              onChange={(e) => setForm({ ...form, monitorId: e.target.value })}
            >
              <option value="">Nenhum(a) monitor(a) vinculado(a)</option>
              {motoristas.filter(m => m.tipo === "Monitor(a)").map(m => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </Select>

            {/* Pontos de Parada */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#cbd5e1", marginBottom: 6, display: "block" }}>
                Pontos de Embarque Atendidos por esta Rota:
              </label>
              {pontos.length === 0 ? (
                <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                  Nenhum ponto cadastrado na aba "Pontos de Embarque".
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 150, overflowY: "auto", border: "1px solid #2c3b52", background: "#161f2e", padding: 8, borderRadius: 8 }}>
                  {pontos.map(p => (
                    <label
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        padding: "5px 8px",
                        borderRadius: 6,
                        background: form.pontosIds.includes(p.id) ? "rgba(16, 185, 129, 0.15)" : "transparent",
                        border: form.pontosIds.includes(p.id) ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
                        color: form.pontosIds.includes(p.id) ? "#6ee7b7" : "#cbd5e1",
                        cursor: "pointer"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.pontosIds.includes(p.id)}
                        onChange={() => togglePonto(p.id)}
                      />
                      <span><strong>{p.nome}</strong> {p.horarioIda ? `(${p.horarioIda})` : ""}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <Input
              label="Observações / Detalhes do Percurso"
              placeholder="Ex: Trecho com estrada vicinal não pavimentada após o trevo."
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>
        </Modal>
      )}

      {/* Modal de Ficha e Impressão da Rota */}
      {modalDetalhes && rotaSelecionada && (
        <Modal
          titulo={`Ficha Operacional: ${rotaSelecionada.nome}`}
          onClose={() => setModalDetalhes(false)}
          larguraMax={780}
          semRodape
        >
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #ficha-impressao-transporte, #ficha-impressao-transporte * { visibility: visible; color: #000 !important; }
              #ficha-impressao-transporte {
                position: absolute; left: 0; top: 0; width: 100%;
                background: #fff !important;
                padding: 20px !important;
              }
              #ficha-impressao-transporte .no-print { display: none !important; }
              #ficha-impressao-transporte .print-box { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
              #ficha-impressao-transporte table th { background: #f1f5f9 !important; color: #1e293b !important; }
            }
          `}</style>
          <div id="ficha-impressao-transporte" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #3b82f6", paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, color: "#60a5fa", fontSize: 18, fontWeight: 700 }}>SIGEM — Transporte Escolar Municipal</h3>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>Ficha Oficial da Linha e Relação de Passageiros</div>
              </div>
              <button
                className="no-print"
                onClick={() => window.print()}
                style={{
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
                }}
              >
                <i className="ti ti-printer" /> Imprimir Documento
              </button>
            </div>

            {/* Dados do Veículo e Equipe */}
            <div className="print-box" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, background: "#161f2e", padding: 14, borderRadius: 10, fontSize: 12, border: "1px solid #2c3b52" }}>
              <div>
                <strong style={{ color: "#94a3b8" }}>Rota / Linha:</strong>
                <div style={{ color: "#ffffff", fontWeight: 600, marginTop: 2 }}>{rotaSelecionada.nome}</div>
              </div>
              <div>
                <strong style={{ color: "#94a3b8" }}>Veículo / Placa:</strong>
                <div style={{ color: "#ffffff", fontWeight: 600, marginTop: 2 }}>{rotaSelecionada.veiculoPlaca || "Não definido"}</div>
              </div>
              <div>
                <strong style={{ color: "#94a3b8" }}>Motorista:</strong>
                <div style={{ color: "#ffffff", fontWeight: 600, marginTop: 2 }}>{rotaSelecionada.motoristaNome || "Não definido"}</div>
              </div>
              <div>
                <strong style={{ color: "#94a3b8" }}>Turnos:</strong>
                <div style={{ color: "#ffffff", fontWeight: 600, marginTop: 2 }}>{(rotaSelecionada.turnos || []).join(", ") || "Manhã"}</div>
              </div>
              <div>
                <strong style={{ color: "#94a3b8" }}>Extensão / Tempo:</strong>
                <div style={{ color: "#ffffff", fontWeight: 600, marginTop: 2 }}>{rotaSelecionada.extensaoKm ? `${rotaSelecionada.extensaoKm} km` : "-"} / {rotaSelecionada.tempoEstimadoMin ? `~${rotaSelecionada.tempoEstimadoMin} min` : "-"}</div>
              </div>
              <div>
                <strong style={{ color: "#94a3b8" }}>Monitor(a):</strong>
                <div style={{ color: "#ffffff", fontWeight: 600, marginTop: 2 }}>{rotaSelecionada.monitorNome || "Sem monitor(a)"}</div>
              </div>
            </div>

            {/* Pontos de Parada */}
            <div>
              <h5 style={{ margin: "0 0 8px 0", fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                Itinerário & Pontos de Embarque:
              </h5>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(rotaSelecionada.pontosNomes || []).map((pt, idx) => (
                  <span key={idx} style={{ padding: "5px 12px", background: "rgba(59, 130, 246, 0.15)", color: "#93c5fd", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: 16, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                    <i className="ti ti-map-pin" /> {idx + 1}. {pt}
                  </span>
                ))}
              </div>
            </div>

            {/* Lista de Alunos Transportados */}
            <div>
              <h5 style={{ margin: "14px 0 8px 0", fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                Alunos Transportados Nesta Rota ({alunos.filter(a => a.rotaId === rotaSelecionada.id && (a.status === "Ativo" || !a.status)).length} estudantes):
              </h5>
              <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #2c3b52" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#243144", color: "#f8fafc" }}>
                      <th style={{ padding: "8px 10px", width: 30 }}>#</th>
                      <th style={{ padding: "8px 10px" }}>Nome do Aluno</th>
                      <th style={{ padding: "8px 10px" }}>Turma / Ano</th>
                      <th style={{ padding: "8px 10px" }}>Ponto de Embarque</th>
                      <th style={{ padding: "8px 10px" }}>Responsável / Telefone</th>
                      <th style={{ padding: "8px 10px" }}>Necessidades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunos.filter(a => a.rotaId === rotaSelecionada.id && (a.status === "Ativo" || !a.status)).length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 18, textAlign: "center", color: "#64748b" }}>
                          Nenhum aluno vinculado a esta rota até o momento.
                        </td>
                      </tr>
                    ) : (
                      alunos
                        .filter(a => a.rotaId === rotaSelecionada.id && (a.status === "Ativo" || !a.status))
                        .map((al, idx) => (
                          <tr key={al.id} style={{ borderBottom: "1px solid #2c3b52", background: idx % 2 === 0 ? "#1e293b" : "#161f2e" }}>
                            <td style={{ padding: "8px 10px", fontWeight: 600, color: "#94a3b8" }}>{idx + 1}</td>
                            <td style={{ padding: "8px 10px", fontWeight: 600, color: "#ffffff" }}>{al.nomeAluno}</td>
                            <td style={{ padding: "8px 10px", color: "#cbd5e1" }}>{al.turma}</td>
                            <td style={{ padding: "8px 10px", color: "#cbd5e1" }}>{al.pontoNome || "-"}</td>
                            <td style={{ padding: "8px 10px", color: "#cbd5e1" }}>{al.responsavel || "-"} ({al.telefoneContato || "-"})</td>
                            <td style={{ padding: "8px 10px" }}>
                              {al.necessidadeEspecial && al.necessidadeEspecial !== "Nenhuma" ? (
                                <Badge color="red">{al.necessidadeEspecial}</Badge>
                              ) : "-"}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Assinatura do Motorista */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 24, paddingTop: 20, borderTop: "1px dashed #33435c", textAlign: "center", fontSize: 12 }}>
              <div>
                <div style={{ borderBottom: "1px solid #64748b", width: "80%", margin: "0 auto 6px" }} />
                <div style={{ color: "#cbd5e1" }}>Assinatura do Motorista Titular</div>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>{rotaSelecionada.motoristaNome}</div>
              </div>
              <div>
                <div style={{ borderBottom: "1px solid #64748b", width: "80%", margin: "0 auto 6px" }} />
                <div style={{ color: "#cbd5e1" }}>Coordenação de Transporte Escolar</div>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>Secretaria Municipal de Educação</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

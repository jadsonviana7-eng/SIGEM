import { useState, useEffect, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import {
  getFrequenciasTransporte,
  saveFrequenciaTransporte,
  addViagemDiario,
  updateViagemDiario,
  deleteViagemDiario
} from "../../../services/transporteService";

export default function FrequenciaTransporte({
  rotas = [],
  veiculos = [],
  motoristas = [],
  alunos = [],
  viagens = [],
  escolaId,
  onReload
}) {
  const [subAba, setSubAba] = useState("chamada"); // "chamada" | "diario"

  // Estado da Chamada
  const hojeStr = new Date().toISOString().split("T")[0];
  const [rotaSelecionadaId, setRotaSelecionadaId] = useState(rotas[0]?.id || "");
  const [dataChamada, setDataChamada] = useState(hojeStr);
  const [turnoChamada, setTurnoChamada] = useState("Manhã");
  const [presencas, setPresencas] = useState({}); // { [alunoId]: "P" | "F" | "J" }
  const [justificativas, setJustificativas] = useState({});
  const [salvandoChamada, setSalvandoChamada] = useState(false);
  const [msgSucessoChamada, setMsgSucessoChamada] = useState("");

  // Estado do Diário de Bordo
  const [modalViagem, setModalViagem] = useState(false);
  const [viagemEditando, setViagemEditando] = useState(null);
  const [salvandoViagem, setSalvandoViagem] = useState(false);
  const [erroViagem, setErroViagem] = useState("");

  const [formViagem, setFormViagem] = useState({
    data: hojeStr,
    turno: "Manhã",
    rotaId: "",
    veiculoId: "",
    motoristaNome: "",
    monitorNome: "",
    horarioSaida: "06:20",
    horarioChegada: "07:30",
    kmInicial: "",
    kmFinal: "",
    alunosEmbarcados: "",
    statusViagem: "Concluída",
    ocorrencias: ""
  });

  // Atualiza rota padrão se mudar
  useEffect(() => {
    if (!rotaSelecionadaId && rotas.length > 0) {
      setRotaSelecionadaId(rotas[0].id);
    }
  }, [rotas, rotaSelecionadaId]);

  // Alunos vinculados à rota selecionada
  const alunosDaRota = useMemo(() => {
    if (!rotaSelecionadaId) return [];
    return alunos.filter(a => a.rotaId === rotaSelecionadaId && (a.status === "Ativo" || !a.status));
  }, [alunos, rotaSelecionadaId]);

  // Carregar chamada salva quando mudar rota, data ou turno
  useEffect(() => {
    async function carregarFrequencia() {
      if (!escolaId || !rotaSelecionadaId) return;
      try {
        const registros = await getFrequenciasTransporte(escolaId, rotaSelecionadaId, dataChamada);
        const registroAtual = registros.find(r => r.turno === turnoChamada);

        if (registroAtual && registroAtual.alunos) {
          const mapP = {};
          const mapJ = {};
          registroAtual.alunos.forEach(al => {
            mapP[al.alunoId] = al.status;
            if (al.justificativa) mapJ[al.alunoId] = al.justificativa;
          });
          setPresencas(mapP);
          setJustificativas(mapJ);
        } else {
          // Inicializa todos como Presentes por padrão
          const mapP = {};
          alunosDaRota.forEach(al => {
            mapP[al.id] = "P";
          });
          setPresencas(mapP);
          setJustificativas({});
        }
      } catch (e) {
        console.error("Erro ao carregar frequência", e);
      }
    }
    carregarFrequencia();
  }, [escolaId, rotaSelecionadaId, dataChamada, turnoChamada, alunosDaRota]);

  const togglePresenca = (alunoId, status) => {
    setPresencas(prev => ({ ...prev, [alunoId]: status }));
  };

  const marcarTodos = (status) => {
    const novoMap = {};
    alunosDaRota.forEach(al => {
      novoMap[al.id] = status;
    });
    setPresencas(novoMap);
  };

  const handleSalvarChamada = async () => {
    if (!rotaSelecionadaId) return;
    setSalvandoChamada(true);
    setMsgSucessoChamada("");

    try {
      const rotaObj = rotas.find(r => r.id === rotaSelecionadaId);
      const listaAlunos = alunosDaRota.map(al => ({
        alunoId: al.id,
        nomeAluno: al.nomeAluno,
        turma: al.turma || "",
        status: presencas[al.id] || "P",
        justificativa: justificativas[al.id] || ""
      }));

      const totalPresentes = listaAlunos.filter(a => a.status === "P").length;
      const totalAusentes = listaAlunos.filter(a => a.status === "F").length;
      const totalJustificados = listaAlunos.filter(a => a.status === "J").length;

      const payload = {
        rotaId: rotaSelecionadaId,
        rotaNome: rotaObj ? rotaObj.nome : "",
        data: dataChamada,
        turno: turnoChamada,
        totalAlunos: listaAlunos.length,
        totalPresentes,
        totalAusentes,
        totalJustificados,
        alunos: listaAlunos
      };

      await saveFrequenciaTransporte(payload, escolaId);
      setMsgSucessoChamada("Frequência de transporte salva com sucesso!");
      setTimeout(() => setMsgSucessoChamada(""), 4000);
      onReload();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar frequência: " + e.message);
    } finally {
      setSalvandoChamada(false);
    }
  };

  // --- DIÁRIO DE BORDO ---
  const abrirNovaViagem = () => {
    setViagemEditando(null);
    const rotaPadrao = rotas[0];
    const veiculoPadrao = veiculos.find(v => v.id === rotaPadrao?.veiculoId) || veiculos[0];

    setFormViagem({
      data: hojeStr,
      turno: "Manhã",
      rotaId: rotaPadrao?.id || "",
      veiculoId: veiculoPadrao?.id || "",
      motoristaNome: rotaPadrao?.motoristaNome || motoristas[0]?.nome || "",
      monitorNome: rotaPadrao?.monitorNome || "",
      horarioSaida: "06:20",
      horarioChegada: "07:30",
      kmInicial: veiculoPadrao?.kmAtual || "",
      kmFinal: veiculoPadrao?.kmAtual ? Number(veiculoPadrao.kmAtual) + (Number(rotaPadrao?.extensaoKm) || 25) : "",
      alunosEmbarcados: alunos.filter(a => a.rotaId === rotaPadrao?.id).length || "",
      statusViagem: "Concluída",
      ocorrencias: ""
    });
    setErroViagem("");
    setModalViagem(true);
  };

  const abrirEditarViagem = (vg) => {
    setViagemEditando(vg);
    setFormViagem({
      data: vg.data || hojeStr,
      turno: vg.turno || "Manhã",
      rotaId: vg.rotaId || "",
      veiculoId: vg.veiculoId || "",
      motoristaNome: vg.motoristaNome || "",
      monitorNome: vg.monitorNome || "",
      horarioSaida: vg.horarioSaida || "",
      horarioChegada: vg.horarioChegada || "",
      kmInicial: vg.kmInicial || "",
      kmFinal: vg.kmFinal || "",
      alunosEmbarcados: vg.alunosEmbarcados || "",
      statusViagem: vg.statusViagem || "Concluída",
      ocorrencias: vg.ocorrencias || ""
    });
    setErroViagem("");
    setModalViagem(true);
  };

  const handleSalvarViagem = async () => {
    if (!formViagem.rotaId || !formViagem.data) {
      setErroViagem("Selecione a rota e a data da viagem.");
      return;
    }

    setSalvandoViagem(true);
    setErroViagem("");

    try {
      const rotaObj = rotas.find(r => r.id === formViagem.rotaId);
      const veiculoObj = veiculos.find(v => v.id === formViagem.veiculoId);
      const kmIni = Number(formViagem.kmInicial) || 0;
      const kmFin = Number(formViagem.kmFinal) || 0;
      const kmPercorrido = kmFin >= kmIni && kmIni > 0 ? kmFin - kmIni : Number(rotaObj?.extensaoKm) || 0;

      const payload = {
        ...formViagem,
        rotaNome: rotaObj ? rotaObj.nome : "",
        veiculoPlaca: veiculoObj ? veiculoObj.placa : "",
        kmInicial: kmIni,
        kmFinal: kmFin,
        kmPercorrido,
        alunosEmbarcados: Number(formViagem.alunosEmbarcados) || 0
      };

      if (viagemEditando) {
        await updateViagemDiario(viagemEditando.id, payload);
      } else {
        await addViagemDiario(payload, escolaId);
      }

      setModalViagem(false);
      onReload();
    } catch (e) {
      console.error(e);
      setErroViagem("Erro ao salvar viagem: " + e.message);
    } finally {
      setSalvandoViagem(false);
    }
  };

  const handleExcluirViagem = async (id) => {
    if (window.confirm("Deseja excluir este registro de viagem?")) {
      try {
        await deleteViagemDiario(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  // Contadores da Chamada
  const contadores = useMemo(() => {
    let p = 0;
    let f = 0;
    let j = 0;
    alunosDaRota.forEach(al => {
      const status = presencas[al.id] || "P";
      if (status === "P") p++;
      else if (status === "F") f++;
      else if (status === "J") j++;
    });
    const total = alunosDaRota.length;
    const taxa = total > 0 ? Math.round((p / total) * 100) : 0;
    return { p, f, j, total, taxa };
  }, [alunosDaRota, presencas]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Sub-navegação entre Chamada de Presença e Diário de Bordo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: 10 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setSubAba("chamada")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: subAba === "chamada" ? "#1e40af" : "#f1f5f9",
              color: subAba === "chamada" ? "white" : "#475569",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <i className="ti ti-checklist" /> Chamada de Embarque dos Alunos
          </button>
          <button
            onClick={() => setSubAba("diario")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: subAba === "diario" ? "#1e40af" : "#f1f5f9",
              color: subAba === "diario" ? "white" : "#475569",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <i className="ti ti-book" /> Diário de Bordo & Ocorrências de Viagem
          </button>
        </div>

        {subAba === "diario" && (
          <Btn variant="primary" onClick={abrirNovaViagem}>
            <i className="ti ti-plus" /> Registrar Viagem no Diário
          </Btn>
        )}
      </div>

      {/* ======================================= */}
      {/* SUB-ABA 1: CHAMADA DE EMBARQUE DOS ALUNOS */}
      {/* ======================================= */}
      {subAba === "chamada" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {msgSucessoChamada && <Alert tipo="success">{msgSucessoChamada}</Alert>}

          {/* Filtros da Chamada */}
          <Card style={{ padding: "16px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 14, alignItems: "flex-end" }}>
              <Select
                label="Selecione a Rota / Linha Escolar"
                value={rotaSelecionadaId}
                onChange={(e) => setRotaSelecionadaId(e.target.value)}
              >
                {rotas.map(r => (
                  <option key={r.id} value={r.id}>{r.nome} ({r.tipo})</option>
                ))}
              </Select>

              <Input
                label="Data da Chamada"
                type="date"
                value={dataChamada}
                onChange={(e) => setDataChamada(e.target.value)}
              />

              <Select
                label="Turno"
                value={turnoChamada}
                onChange={(e) => setTurnoChamada(e.target.value)}
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
                <option value="Integral">Integral</option>
              </Select>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => marcarTodos("P")}
                  style={{ padding: "8px 12px", background: "#dcfce7", color: "#166534", border: "1px solid #86efac", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Todos Presentes
                </button>
                <Btn variant="primary" onClick={handleSalvarChamada} disabled={salvandoChamada}>
                  <i className="ti ti-device-floppy" /> {salvandoChamada ? "Salvando..." : "Salvar Frequência"}
                </Btn>
              </div>
            </div>

            {/* Resumo de Presença da Rota */}
            <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 14, borderTop: "1px solid #f1f5f9", fontSize: 13 }}>
              <span>Total na Rota: <strong>{contadores.total}</strong></span>
              <span style={{ color: "#166534" }}>Embarcados (Presentes): <strong>{contadores.p}</strong></span>
              <span style={{ color: "#991b1b" }}>Ausentes: <strong>{contadores.f}</strong></span>
              <span style={{ color: "#854d0e" }}>Justificados: <strong>{contadores.j}</strong></span>
              <span style={{ marginLeft: "auto", fontWeight: 700, color: "#1e40af" }}>Taxa de Ocupação/Embarque: {contadores.taxa}%</span>
            </div>
          </Card>

          {/* Lista de Alunos para Chamada */}
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {alunosDaRota.length === 0 ? (
              <EmptyState icon="users" texto="Nenhum aluno ativo vinculado a esta rota escolar." />
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                    <th style={{ padding: "12px 16px", width: 40 }}>#</th>
                    <th style={{ padding: "12px 16px" }}>Estudante</th>
                    <th style={{ padding: "12px 16px" }}>Turma</th>
                    <th style={{ padding: "12px 16px" }}>Ponto de Parada</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: 280 }}>Status de Embarque</th>
                    <th style={{ padding: "12px 16px" }}>Justificativa / Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosDaRota.map((al, idx) => {
                    const status = presencas[al.id] || "P";
                    return (
                      <tr key={al.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>{al.nomeAluno}</div>
                          {al.necessidadeEspecial && al.necessidadeEspecial !== "Nenhuma" && (
                            <span style={{ fontSize: 11, color: "#dc2626" }}>♿ {al.necessidadeEspecial}</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>{al.turma || "-"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 12, color: "#475569" }}>
                            <i className="ti ti-map-pin" style={{ color: "#2563eb", marginRight: 4 }} />
                            {al.pontoNome || "Ponto Padrão"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", borderRadius: 8, overflow: "hidden", border: "1px solid #d1d5db" }}>
                            <button
                              type="button"
                              onClick={() => togglePresenca(al.id, "P")}
                              style={{
                                padding: "6px 14px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                                background: status === "P" ? "#16a34a" : "white",
                                color: status === "P" ? "white" : "#4b5563"
                              }}
                            >
                              Presente
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePresenca(al.id, "F")}
                              style={{
                                padding: "6px 14px",
                                border: "none",
                                borderLeft: "1px solid #d1d5db",
                                borderRight: "1px solid #d1d5db",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                                background: status === "F" ? "#dc2626" : "white",
                                color: status === "F" ? "white" : "#4b5563"
                              }}
                            >
                              Ausente
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePresenca(al.id, "J")}
                              style={{
                                padding: "6px 14px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                                background: status === "J" ? "#d97706" : "white",
                                color: status === "J" ? "white" : "#4b5563"
                              }}
                            >
                              Justificado
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <input
                            type="text"
                            placeholder="Motivo da ausência..."
                            value={justificativas[al.id] || ""}
                            onChange={(e) => setJustificativas({ ...justificativas, [al.id]: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              fontSize: 12,
                              borderRadius: 6,
                              border: "1px solid #e2e8f0",
                              outline: "none"
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {/* ======================================= */}
      {/* SUB-ABA 2: DIÁRIO DE BORDO DAS VIAGENS */}
      {/* ======================================= */}
      {subAba === "diario" && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {viagens.length === 0 ? (
            <EmptyState icon="book" texto="Nenhum registro no diário de bordo. Clique no botão acima para registrar uma viagem." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                    <th style={{ padding: "12px 16px" }}>Data / Turno</th>
                    <th style={{ padding: "12px 16px" }}>Linha / Rota</th>
                    <th style={{ padding: "12px 16px" }}>Veículo / Motorista</th>
                    <th style={{ padding: "12px 16px" }}>Horários</th>
                    <th style={{ padding: "12px 16px" }}>Odômetro (KM)</th>
                    <th style={{ padding: "12px 16px" }}>Passageiros</th>
                    <th style={{ padding: "12px 16px" }}>Ocorrências / Trânsito</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {viagens.map((vg) => (
                    <tr key={vg.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>
                          {new Date(vg.data + "T00:00:00").toLocaleDateString("pt-BR")}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{vg.turno}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#1e40af" }}>{vg.rotaNome}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div><Badge color="blue">{vg.veiculoPlaca}</Badge></div>
                        <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{vg.motoristaNome}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12 }}>
                        <div>Saída: <strong>{vg.horarioSaida || "-"}</strong></div>
                        <div>Chegada: <strong>{vg.horarioChegada || "-"}</strong></div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600 }}>{vg.kmPercorrido ? `${vg.kmPercorrido} km rodados` : "-"}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{vg.kmInicial} → {vg.kmFinal} km</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontWeight: 600, color: "#059669" }}>{vg.alunosEmbarcados || 0} alunos</span>
                      </td>
                      <td style={{ padding: "12px 16px", maxWidth: 220 }}>
                        <div style={{ fontSize: 12, color: vg.ocorrencias ? "#334155" : "#9ca3af" }}>
                          {vg.ocorrencias || "Sem incidentes registrados"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <Btn onClick={() => abrirEditarViagem(vg)} style={{ padding: "4px 8px", fontSize: 12 }}>
                            <i className="ti ti-edit" />
                          </Btn>
                          <Btn variant="danger" onClick={() => handleExcluirViagem(vg.id)} style={{ padding: "4px 8px", fontSize: 12 }}>
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
      )}

      {/* Modal de Registro de Viagem no Diário */}
      {modalViagem && (
        <Modal
          titulo={viagemEditando ? "Editar Registro de Viagem" : "Registrar Viagem no Diário de Bordo"}
          onClose={() => setModalViagem(false)}
          onSave={handleSalvarViagem}
          salvando={salvandoViagem}
          larguraMax={620}
        >
          {erroViagem && <Alert tipo="error">{erroViagem}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
              <Select
                label="Rota / Linha Percorrida *"
                value={formViagem.rotaId}
                onChange={(e) => {
                  const rId = e.target.value;
                  const rObj = rotas.find(r => r.id === rId);
                  setFormViagem({
                    ...formViagem,
                    rotaId: rId,
                    veiculoId: rObj?.veiculoId || formViagem.veiculoId,
                    motoristaNome: rObj?.motoristaNome || formViagem.motoristaNome,
                    monitorNome: rObj?.monitorNome || formViagem.monitorNome
                  });
                }}
              >
                <option value="">Selecione a rota...</option>
                {rotas.map(r => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </Select>

              <Input
                label="Data da Viagem *"
                type="date"
                value={formViagem.data}
                onChange={(e) => setFormViagem({ ...formViagem, data: e.target.value })}
              />

              <Select
                label="Turno"
                value={formViagem.turno}
                onChange={(e) => setFormViagem({ ...formViagem, turno: e.target.value })}
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
                <option value="Integral">Integral</option>
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Veículo Utilizado"
                value={formViagem.veiculoId}
                onChange={(e) => setFormViagem({ ...formViagem, veiculoId: e.target.value })}
              >
                <option value="">Selecione o veículo...</option>
                {veiculos.map(v => (
                  <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>
                ))}
              </Select>

              <Input
                label="Nome do Motorista"
                value={formViagem.motoristaNome}
                onChange={(e) => setFormViagem({ ...formViagem, motoristaNome: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input
                label="Horário de Saída"
                type="time"
                value={formViagem.horarioSaida}
                onChange={(e) => setFormViagem({ ...formViagem, horarioSaida: e.target.value })}
              />
              <Input
                label="Horário de Chegada"
                type="time"
                value={formViagem.horarioChegada}
                onChange={(e) => setFormViagem({ ...formViagem, horarioChegada: e.target.value })}
              />
              <Input
                label="Passageiros Embarcados"
                type="number"
                value={formViagem.alunosEmbarcados}
                onChange={(e) => setFormViagem({ ...formViagem, alunosEmbarcados: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="KM Inicial (Saída)"
                type="number"
                placeholder="Ex: 68060"
                value={formViagem.kmInicial}
                onChange={(e) => setFormViagem({ ...formViagem, kmInicial: e.target.value })}
              />
              <Input
                label="KM Final (Retorno)"
                type="number"
                placeholder="Ex: 68100"
                value={formViagem.kmFinal}
                onChange={(e) => setFormViagem({ ...formViagem, kmFinal: e.target.value })}
              />
            </div>

            <Input
              label="Ocorrências / Trânsito / Intercorrências Mecânicas"
              placeholder="Ex: Chuva forte na vicinal do sítio; trecho com desvio de 10 min."
              value={formViagem.ocorrencias}
              onChange={(e) => setFormViagem({ ...formViagem, ocorrencias: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import {
  addReuniao,
  updateReuniao,
  deleteReuniao
} from "../../../services/comunicacaoService";
import { Card, Btn, Badge, Modal, Input, Select, Alert, EmptyState } from "../../../components/ui";

export default function ReunioesPais({
  reunioes = [],
  turmas = [],
  escolaId,
  usuario,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [reuniaoEditando, setReuniaoEditando] = useState(null);
  const [modalAta, setModalAta] = useState(null);
  const [modalExclusao, setModalExclusao] = useState(null);

  const [form, setForm] = useState({
    titulo: "",
    turmaAlvo: "Toda a Escola",
    dataReuniao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    horarioInicio: "18:30",
    horarioFim: "20:00",
    local: "Quadra Poliesportiva Coberta",
    modalidade: "Presencial",
    pauta: "Apresentação do rendimento pedagógico, frequência escolar, metas do bimestre e alinhamento com os responsáveis.",
    organizador: usuario?.nome || "Direção & Coordenação Pedagógica",
    totalConvidados: 60,
    status: "Agendada"
  });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [copiadoId, setCopiadoId] = useState(null);

  const reunioesFiltradas = useMemo(() => {
    return reunioes.filter(r => {
      const matchBusca =
        (r.titulo || "").toLowerCase().includes(busca.toLowerCase()) ||
        (r.pauta || "").toLowerCase().includes(busca.toLowerCase()) ||
        (r.local || "").toLowerCase().includes(busca.toLowerCase());
      const matchTurma = !filtroTurma || r.turmaAlvo === filtroTurma;
      return matchBusca && matchTurma;
    });
  }, [reunioes, busca, filtroTurma]);

  const handleAbrirNovo = () => {
    setReuniaoEditando(null);
    setForm({
      titulo: "Reunião de Pais e Mestres — 2º Bimestre",
      turmaAlvo: "Toda a Escola",
      dataReuniao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      horarioInicio: "18:30",
      horarioFim: "20:00",
      local: "Quadra Poliesportiva Coberta",
      modalidade: "Presencial",
      pauta: "Apresentação dos boletins digitais, projetos pedagógicos, acompanhamento de frequência e esclarecimento de dúvidas.",
      organizador: usuario?.nome || "Coordenação Pedagógica",
      totalConvidados: 60,
      status: "Agendada"
    });
    setErro("");
    setModalAberto(true);
  };

  const handleAbrirEdicao = (item) => {
    setReuniaoEditando(item);
    setForm({
      titulo: item.titulo || "",
      turmaAlvo: item.turmaAlvo || "Toda a Escola",
      dataReuniao: item.dataReuniao || new Date().toISOString().split("T")[0],
      horarioInicio: item.horarioInicio || "18:30",
      horarioFim: item.horarioFim || "20:00",
      local: item.local || "",
      modalidade: item.modalidade || "Presencial",
      pauta: item.pauta || "",
      organizador: item.organizador || usuario?.nome || "Direção",
      totalConvidados: item.totalConvidados || 60,
      status: item.status || "Agendada"
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.dataReuniao || !form.pauta.trim()) {
      setErro("Preencha o título, a data e a pauta da reunião.");
      return;
    }

    setSalvando(true);
    setErro("");
    try {
      if (reuniaoEditando) {
        await updateReuniao(reuniaoEditando.id, form);
      } else {
        await addReuniao(form, escolaId);
      }
      setModalAberto(false);
      onReload();
    } catch (err) {
      setErro("Erro ao salvar reunião: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!modalExclusao) return;
    try {
      await deleteReuniao(modalExclusao.id);
      setModalExclusao(null);
      onReload();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const handleCopiarWhatsApp = (reuniao) => {
    const texto = `*👥 CONVOCAÇÃO — REUNIÃO DE PAIS E MESTRES*\n*${reuniao.titulo}*\n\n📅 Data: ${new Date(reuniao.dataReuniao).toLocaleDateString("pt-BR")}\n⏰ Horário: ${reuniao.horarioInicio} às ${reuniao.horarioFim}\n📍 Local: ${reuniao.local}\n🎯 Público: ${reuniao.turmaAlvo}\n\n*Pauta:*\n${reuniao.pauta}\n\n_Sua presença é fundamental para o desenvolvimento do seu filho!_\n*Secretaria Municipal de Educação*`;
    navigator.clipboard.writeText(texto);
    setCopiadoId(reuniao.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* BARRA SUPERIOR */}
      <div style={{
        background: "white",
        borderRadius: 14,
        padding: "16px 20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12
      }}>
        <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 280, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              placeholder="Buscar reuniões por pauta, local ou título..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              icon="ti ti-search"
            />
          </div>

          <Select
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
            style={{ width: 200 }}
          >
            <option value="">Todos os Públicos</option>
            <option value="Toda a Escola">Toda a Escola</option>
            {turmas.map(t => (
              <option key={t.id || t.nome} value={t.nome}>{t.nome}</option>
            ))}
          </Select>
        </div>

        <Btn variant="primary" onClick={handleAbrirNovo} style={{ padding: "8px 16px" }}>
          <i className="ti ti-calendar-plus" /> Agendar Reunião de Pais
        </Btn>
      </div>

      {/* GRID DE CARDS DE REUNIÕES */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: 16
      }}>
        {reunioesFiltradas.length === 0 ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <EmptyState icon="users-group" texto="Nenhuma reunião de pais agendada no momento." />
          </div>
        ) : (
          reunioesFiltradas.map((r) => {
            const confirmadosCount = (r.confirmados || []).length;
            const justificadosCount = (r.justificados || []).length;

            return (
              <div
                key={r.id}
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderTop: "4px solid #8b5cf6"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>
                      👥 Reunião de Pais & Mestres
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: r.status === "Realizada" ? "#dcfce7" : "#f5f3ff",
                      color: r.status === "Realizada" ? "#166534" : "#6b21a8"
                    }}>
                      {r.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>
                    {r.titulo}
                  </h3>

                  <div style={{
                    background: "#f8fafc",
                    padding: 12,
                    borderRadius: 10,
                    fontSize: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    color: "#334155",
                    marginBottom: 12
                  }}>
                    <div>📅 <strong>Data:</strong> {r.dataReuniao ? new Date(r.dataReuniao).toLocaleDateString("pt-BR") : ""} ({r.horarioInicio} às {r.horarioFim})</div>
                    <div>📍 <strong>Local:</strong> {r.local} ({r.modalidade})</div>
                    <div>🎯 <strong>Público:</strong> {r.turmaAlvo}</div>
                  </div>

                  <div style={{ fontSize: 12, color: "#475569", marginBottom: 14 }}>
                    <strong>Pauta:</strong> {r.pauta}
                  </div>
                </div>

                {/* Confirmados & Botões */}
                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#fdf4ff",
                    padding: "8px 12px",
                    borderRadius: 8,
                    marginBottom: 12,
                    fontSize: 12
                  }}>
                    <span style={{ color: "#701a75", fontWeight: 600 }}>Presença Confirmada:</span>
                    <strong style={{ color: "#16a34a" }}>{confirmadosCount} confirmados</strong>
                    {justificadosCount > 0 && <span style={{ color: "#b45309" }}>({justificadosCount} justificaram)</span>}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                    <Btn
                      size="sm"
                      variant="outline"
                      onClick={() => setModalAta(r)}
                      style={{ fontSize: 11 }}
                    >
                      <i className="ti ti-printer" /> Imprimir Ata & Presença
                    </Btn>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleCopiarWhatsApp(r)}
                        title="Copiar Convocação WhatsApp"
                        style={{
                          padding: "5px 8px",
                          borderRadius: 6,
                          background: copiadoId === r.id ? "#dcfce7" : "#f8fafc",
                          color: copiadoId === r.id ? "#166534" : "#475569",
                          border: "1px solid #e2e8f0",
                          cursor: "pointer",
                          fontSize: 12
                        }}
                      >
                        <i className={copiadoId === r.id ? "ti ti-check" : "ti ti-brand-whatsapp"} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAbrirEdicao(r)}
                        title="Editar"
                        style={{
                          padding: "5px 8px",
                          borderRadius: 6,
                          background: "#f8fafc",
                          color: "#475569",
                          border: "1px solid #e2e8f0",
                          cursor: "pointer",
                          fontSize: 12
                        }}
                      >
                        <i className="ti ti-edit" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalExclusao(r)}
                        title="Excluir"
                        style={{
                          padding: "5px 8px",
                          borderRadius: 6,
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "1px solid #fecaca",
                          cursor: "pointer",
                          fontSize: 12
                        }}
                      >
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE AGENDAMENTO / EDIÇÃO */}
      {modalAberto && (
        <Modal
          isOpen={modalAberto}
          titulo={reuniaoEditando ? "Editar Reunião de Pais" : "Agendar Reunião de Pais & Mestres"}
          onClose={() => setModalAberto(false)}
          width={640}
          esconderRodape
        >
          <form onSubmit={handleSalvar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {erro && <Alert tipo="error">{erro}</Alert>}

            <Input
              label="Título / Objetivo da Reunião *"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Público / Turma Alvo *"
                value={form.turmaAlvo}
                onChange={(e) => setForm({ ...form, turmaAlvo: e.target.value })}
              >
                <option value="Toda a Escola">Toda a Escola (Todos os Pais)</option>
                {turmas.map(t => (
                  <option key={t.id || t.nome} value={t.nome}>{t.nome} ({t.turno})</option>
                ))}
              </Select>

              <Select
                label="Modalidade *"
                value={form.modalidade}
                onChange={(e) => setForm({ ...form, modalidade: e.target.value })}
              >
                <option value="Presencial">Presencial na Unidade Escolar</option>
                <option value="Online / Videoconferência">Online / Videoconferência</option>
                <option value="Híbrido">Híbrido</option>
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input
                label="Data da Reunião *"
                type="date"
                value={form.dataReuniao}
                onChange={(e) => setForm({ ...form, dataReuniao: e.target.value })}
              />

              <Input
                label="Horário Início *"
                type="time"
                value={form.horarioInicio}
                onChange={(e) => setForm({ ...form, horarioInicio: e.target.value })}
              />

              <Input
                label="Horário Término *"
                type="time"
                value={form.horarioFim}
                onChange={(e) => setForm({ ...form, horarioFim: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <Input
                label="Local / Espaço Físico *"
                placeholder="Ex: Quadra Poliesportiva, Pátio, Sala dos Professores..."
                value={form.local}
                onChange={(e) => setForm({ ...form, local: e.target.value })}
              />

              <Input
                label="Estimativa de Pais"
                type="number"
                value={form.totalConvidados}
                onChange={(e) => setForm({ ...form, totalConvidados: parseInt(e.target.value) || 30 })}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                Pauta Pedagógica & Assuntos a Tratar *
              </label>
              <textarea
                rows={4}
                value={form.pauta}
                onChange={(e) => setForm({ ...form, pauta: e.target.value })}
                placeholder="Descreva detalhadamente os tópicos da reunião..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Btn onClick={() => setModalAberto(false)}>
                Cancelar
              </Btn>
              <Btn variant="primary" type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : reuniaoEditando ? "Salvar Alterações" : "Agendar Reunião"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL DE VISUALIZAÇÃO E IMPRESSÃO DE ATA & LISTA DE PRESENÇA */}
      {modalAta && (
        <Modal
          isOpen={!!modalAta}
          titulo="Ata Oficial de Reunião & Lista de Presença"
          onClose={() => setModalAta(null)}
          width={760}
          esconderRodape
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Folha Oficial da Ata */}
            <div style={{
              background: "white",
              padding: 24,
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 13,
              color: "#0f172a"
            }}>
              {/* Cabeçalho Oficial */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #0f172a", paddingBottom: 12, marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, textTransform: "uppercase" }}>
                  SECRETARIA MUNICIPAL DE EDUCAÇÃO · SIGEM
                </h4>
                <h3 style={{ margin: "4px 0 0 0", fontSize: 16, fontWeight: 800 }}>
                  ATA DE REUNIÃO DE PAIS E MESTRES
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#475569" }}>
                  {modalAta.titulo} · Ano Letivo {new Date().getFullYear()}
                </p>
              </div>

              {/* Informações da Reunião */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "#f8fafc", padding: 12, borderRadius: 6, marginBottom: 14, fontSize: 12 }}>
                <div><strong>Data:</strong> {modalAta.dataReuniao ? new Date(modalAta.dataReuniao).toLocaleDateString("pt-BR") : ""}</div>
                <div><strong>Horário:</strong> {modalAta.horarioInicio} às {modalAta.horarioFim}</div>
                <div><strong>Local:</strong> {modalAta.local}</div>
                <div><strong>Público:</strong> {modalAta.turmaAlvo}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <h5 style={{ margin: "0 0 4px 0", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>1. PAUTA DOS TRABALHOS:</h5>
                <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>{modalAta.pauta}</p>
              </div>

              <div>
                <h5 style={{ margin: "0 0 8px 0", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>2. LISTA DE PRESENÇA DOS RESPONSÁVEIS:</h5>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                      <th style={{ padding: 6, width: 30, border: "1px solid #cbd5e1" }}>Nº</th>
                      <th style={{ padding: 6, border: "1px solid #cbd5e1" }}>Nome do Responsável</th>
                      <th style={{ padding: 6, border: "1px solid #cbd5e1" }}>Estudante</th>
                      <th style={{ padding: 6, border: "1px solid #cbd5e1", width: 220 }}>Assinatura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                      <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1", textAlign: "center" }}>{i}</td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}></td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}></td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Btn onClick={() => setModalAta(null)}>
                Fechar
              </Btn>
              <Btn variant="primary" onClick={() => window.print()}>
                <i className="ti ti-printer" /> Imprimir Ata Oficial
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {modalExclusao && (
        <Modal
          isOpen={!!modalExclusao}
          titulo="Confirmar Exclusão de Reunião"
          onClose={() => setModalExclusao(null)}
          width={450}
          esconderRodape
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
              Tem certeza de que deseja remover a reunião <strong>"{modalExclusao.titulo}"</strong>?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Btn onClick={() => setModalExclusao(null)}>
                Cancelar
              </Btn>
              <Btn variant="danger" onClick={handleExcluir}>
                Sim, Excluir Reunião
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

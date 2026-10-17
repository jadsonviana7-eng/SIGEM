import React, { useState, useMemo } from "react";
import {
  addReuniao,
  updateReuniao,
  deleteReuniao
} from "../../../services/comunicacaoService";
import {
  Btn,
  Modal,
  Input,
  Select,
  Alert
} from "../../../components/ui";
import styles from "./ReunioesPais.module.css";

export default function ReunioesPais({
  reunioes = [],
  turmas = [],
  escolaId,
  selectedEscola,
  usuario,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

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

  // Cálculos de Indicadores Rápidos (KPIs)
  const kpis = useMemo(() => {
    const total = reunioes.length;
    const agendadas = reunioes.filter(r => r.status === "Agendada").length;
    const realizadas = reunioes.filter(r => r.status === "Realizada").length;
    
    let totalConfirmados = 0;
    let totalEstimado = 0;
    reunioes.forEach(r => {
      totalConfirmados += (r.confirmados || []).length;
      totalEstimado += (r.totalConvidados || 40);
    });

    const taxaAdesao = totalEstimado > 0 ? Math.round((totalConfirmados / totalEstimado) * 100) : 0;

    return {
      total,
      agendadas,
      realizadas,
      totalConfirmados,
      taxaAdesao
    };
  }, [reunioes]);

  const reunioesFiltradas = useMemo(() => {
    return reunioes.filter(r => {
      const matchBusca =
        (r.titulo || "").toLowerCase().includes(busca.toLowerCase()) ||
        (r.pauta || "").toLowerCase().includes(busca.toLowerCase()) ||
        (r.local || "").toLowerCase().includes(busca.toLowerCase()) ||
        (r.turmaAlvo || "").toLowerCase().includes(busca.toLowerCase());
      const matchTurma = !filtroTurma || r.turmaAlvo === filtroTurma;
      const matchStatus = !filtroStatus || r.status === filtroStatus;
      return matchBusca && matchTurma && matchStatus;
    });
  }, [reunioes, busca, filtroTurma, filtroStatus]);

  const handleAbrirNovo = () => {
    setReuniaoEditando(null);
    setForm({
      titulo: "Reunião de Pais e Mestres — Alinhamento Pedagógico",
      turmaAlvo: "Toda a Escola",
      dataReuniao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      horarioInicio: "18:30",
      horarioFim: "20:00",
      local: "Quadra Poliesportiva Coberta",
      modalidade: "Presencial",
      pauta: "Apresentação dos boletins bimestrais, acompanhamento da frequência escolar, projetos pedagógicos e alinhamento com a família.",
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
      if (onReload) onReload();
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
      if (onReload) onReload();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const handleCopiarWhatsApp = (reuniao) => {
    const nomeEscola = selectedEscola?.nome || "Escola Municipal";
    const dataFmt = reuniao.dataReuniao
      ? new Date(reuniao.dataReuniao + "T00:00:00").toLocaleDateString("pt-BR")
      : "";
    const texto = `*👥 CONVOCAÇÃO — REUNIÃO DE PAIS E MESTRES*\n*${reuniao.titulo}*\n🏫 *${nomeEscola}*\n\n📅 *Data:* ${dataFmt}\n⏰ *Horário:* ${reuniao.horarioInicio} às ${reuniao.horarioFim}\n📍 *Local:* ${reuniao.local} (${reuniao.modalidade})\n🎯 *Público:* ${reuniao.turmaAlvo}\n\n*Pauta dos Trabalhos:*\n${reuniao.pauta}\n\n_Sua presença e acompanhamento são indispensáveis para o sucesso escolar do seu filho!_\n*Secretaria Municipal de Educação · SIGEM*`;
    
    navigator.clipboard.writeText(texto);
    setCopiadoId(reuniao.id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const limparFiltros = () => {
    setBusca("");
    setFiltroTurma("");
    setFiltroStatus("");
  };

  return (
    <div className={styles.container}>
      {/* 1. INDICADORES RÁPIDOS (KPIS) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
            <i className="ti ti-calendar-event" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.agendadas}</span>
            <span className={styles.statLabel}>Reuniões Agendadas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <i className="ti ti-user-check" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.totalConfirmados}</span>
            <span className={styles.statLabel}>Presenças Confirmadas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8" }}>
            <i className="ti ti-chart-arrows" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.taxaAdesao}%</span>
            <span className={styles.statLabel}>Adesão Média dos Pais</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <i className="ti ti-certificate" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.realizadas}</span>
            <span className={styles.statLabel}>Atas Concluídas</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE CABEÇALHO */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-users-group" style={{ color: "#a78bfa" }} />
            Reuniões de Pais & Mestres
          </div>
          <p className={styles.headerSubtitle}>
            Convocações oficiais com controle de presenças, envio por WhatsApp e geração automática de ata e lista de assinaturas.
          </p>
        </div>

        <button type="button" className={styles.btnNovo} onClick={handleAbrirNovo}>
          <i className="ti ti-calendar-plus" />
          Agendar Reunião de Pais
        </button>
      </div>

      {/* 3. BARRA DE FILTROS */}
      <div className={styles.filtersBar}>
        <Input
          placeholder="Buscar por pauta, local, público ou título..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          icon="ti ti-search"
        />

        <Select
          value={filtroTurma}
          onChange={(e) => setFiltroTurma(e.target.value)}
        >
          <option value="">Todos os Públicos</option>
          <option value="Toda a Escola">Toda a Escola (Geral)</option>
          {turmas.map(t => (
            <option key={t.id || t.nome} value={t.nome}>{t.nome}</option>
          ))}
        </Select>

        <Select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="Agendada">Agendada</option>
          <option value="Realizada">Realizada</option>
          <option value="Cancelada">Cancelada</option>
        </Select>

        {(busca || filtroTurma || filtroStatus) && (
          <button type="button" className={styles.btnClearFilters} onClick={limparFiltros}>
            <i className="ti ti-x" />
            Limpar Filtros
          </button>
        )}
      </div>

      {/* 4. CABEÇALHO DA SEÇÃO */}
      <div className={styles.sectionHeader}>
        <div>
          <h3 className={styles.sectionTitle}>
            <i className="ti ti-list-details" style={{ color: "#a78bfa" }} />
            Reuniões Cadastradas ({reunioesFiltradas.length})
          </h3>
          <p className={styles.sectionSubtitle}>
            {filtroTurma ? `Filtrando pelo público: ${filtroTurma}` : "Visualizando todas as reuniões escolares"}
          </p>
        </div>
      </div>

      {/* 5. GRADE DE CARDS */}
      <div className={styles.reunioesGrid}>
        {reunioesFiltradas.length === 0 ? (
          <div style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            padding: "48px 20px",
            background: "var(--bg-card, #1e293b)",
            border: "1px dashed var(--border-color, #2c3b52)",
            borderRadius: 16
          }}>
            <i className="ti ti-calendar-off" style={{ fontSize: 40, color: "#64748b", marginBottom: 12, display: "inline-block" }} />
            <h4 style={{ margin: "0 0 6px 0", color: "#f8fafc", fontSize: 16 }}>Nenhuma reunião encontrada</h4>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
              {busca || filtroTurma || filtroStatus
                ? "Tente ajustar os termos de busca ou remover os filtros."
                : "Clique em 'Agendar Reunião de Pais' para marcar um novo encontro pedagógico."}
            </p>
          </div>
        ) : (
          reunioesFiltradas.map((r) => {
            const confirmadosCount = (r.confirmados || []).length;
            const justificadosCount = (r.justificados || []).length;
            const dataFmt = r.dataReuniao
              ? new Date(r.dataReuniao + "T00:00:00").toLocaleDateString("pt-BR")
              : "A definir";

            return (
              <div
                key={r.id}
                className={`${styles.reuniaoCard} ${r.status === "Realizada" ? styles.reuniaoCardRealizada : ""}`}
              >
                <div>
                  <div className={styles.cardTop}>
                    <span className={styles.badgeCategory}>
                      <i className="ti ti-users" /> Reunião de Pais
                    </span>
                    <span
                      className={`${styles.badgeStatus} ${
                        r.status === "Realizada" ? styles.statusRealizada : styles.statusAgendada
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{r.titulo}</h3>

                  <div className={styles.infoBox}>
                    <div className={styles.infoRow}>
                      <span>📅</span>
                      <span><strong>Data:</strong> {dataFmt} ({r.horarioInicio} às {r.horarioFim})</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>📍</span>
                      <span><strong>Local:</strong> {r.local} ({r.modalidade})</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>🎯</span>
                      <span><strong>Público:</strong> {r.turmaAlvo}</span>
                    </div>
                  </div>

                  <p className={styles.pautaText} title={r.pauta}>
                    <strong>Pauta:</strong> {r.pauta}
                  </p>
                </div>

                <div>
                  <div className={styles.attendanceBar}>
                    <span className={styles.attendanceLabel}>Confirmações de Presença:</span>
                    <span className={styles.attendanceValue}>
                      {confirmadosCount} pais
                      {justificadosCount > 0 && ` (${justificadosCount} justificativas)`}
                    </span>
                  </div>

                  <div className={styles.cardFooter}>
                    <Btn
                      size="sm"
                      variant="outline"
                      onClick={() => setModalAta(r)}
                      style={{ fontSize: 11 }}
                    >
                      <i className="ti ti-printer" /> Ata & Presença
                    </Btn>

                    <div className={styles.actionBtnGroup}>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${copiadoId === r.id ? styles.iconBtnSuccess : ""}`}
                        onClick={() => handleCopiarWhatsApp(r)}
                        title="Copiar Convocação Formatada para WhatsApp"
                      >
                        <i className={copiadoId === r.id ? "ti ti-check" : "ti ti-brand-whatsapp"} />
                      </button>

                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => handleAbrirEdicao(r)}
                        title="Editar Informações da Reunião"
                      >
                        <i className="ti ti-pencil" />
                      </button>

                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => setModalExclusao(r)}
                        title="Excluir Reunião"
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

      {/* =========================================================
          MODAL DE AGENDAMENTO / EDIÇÃO (CAMPOS UM ABAIXO DO OUTRO)
          ========================================================= */}
      {modalAberto && (
        <Modal
          isOpen={modalAberto}
          titulo={reuniaoEditando ? "Editar Reunião de Pais" : "Agendar Reunião de Pais & Mestres"}
          onClose={() => setModalAberto(false)}
          width={640}
          esconderRodape
        >
          <form onSubmit={handleSalvar} className={styles.modalForm}>
            {erro && (
              <div style={{ marginLeft: 16, marginRight: 8 }}>
                <Alert tipo="error">{erro}</Alert>
              </div>
            )}

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Título / Tema Central da Reunião <span className={styles.fieldRequired}>*</span>
              </label>
              <Input
                placeholder="Ex: Reunião Pedagógica de Entrega de Boletins — 2º Bimestre"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Público / Turma Convocada <span className={styles.fieldRequired}>*</span>
              </label>
              <Select
                value={form.turmaAlvo}
                onChange={(e) => setForm({ ...form, turmaAlvo: e.target.value })}
              >
                <option value="Toda a Escola">Toda a Escola (Todos os Responsáveis)</option>
                {turmas.map(t => (
                  <option key={t.id || t.nome} value={t.nome}>{t.nome} ({t.turno || "Integral"})</option>
                ))}
              </Select>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Modalidade de Realização <span className={styles.fieldRequired}>*</span>
              </label>
              <Select
                value={form.modalidade}
                onChange={(e) => setForm({ ...form, modalidade: e.target.value })}
              >
                <option value="Presencial">Presencial na Unidade Escolar</option>
                <option value="Online / Videoconferência">Online / Videoconferência</option>
                <option value="Híbrido">Híbrido</option>
              </Select>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Data da Reunião <span className={styles.fieldRequired}>*</span>
              </label>
              <Input
                type="date"
                value={form.dataReuniao}
                onChange={(e) => setForm({ ...form, dataReuniao: e.target.value })}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Horário de Início <span className={styles.fieldRequired}>*</span>
              </label>
              <Input
                type="time"
                value={form.horarioInicio}
                onChange={(e) => setForm({ ...form, horarioInicio: e.target.value })}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Horário Previsto de Término <span className={styles.fieldRequired}>*</span>
              </label>
              <Input
                type="time"
                value={form.horarioFim}
                onChange={(e) => setForm({ ...form, horarioFim: e.target.value })}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Local / Espaço Físico <span className={styles.fieldRequired}>*</span>
              </label>
              <Input
                placeholder="Ex: Ginásio Coberto, Pátio Principal, Sala de Recursos..."
                value={form.local}
                onChange={(e) => setForm({ ...form, local: e.target.value })}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Estimativa de Pais Convocados
              </label>
              <Input
                type="number"
                min="5"
                max="500"
                value={form.totalConvidados}
                onChange={(e) => setForm({ ...form, totalConvidados: parseInt(e.target.value, 10) || 30 })}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Status da Reunião
              </label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Agendada">Agendada</option>
                <option value="Realizada">Realizada</option>
                <option value="Cancelada">Cancelada</option>
              </Select>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Pauta Pedagógica & Assuntos a Tratar <span className={styles.fieldRequired}>*</span>
              </label>
              <textarea
                rows={4}
                className={styles.formTextarea}
                value={form.pauta}
                onChange={(e) => setForm({ ...form, pauta: e.target.value })}
                placeholder="Descreva detalhadamente os tópicos da reunião (ex: notas bimestrais, calendário de provas, eventos, regras da escola)..."
                required
              />
            </div>

            <div className={styles.modalFooter}>
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

      {/* =========================================================
          MODAL DE ATA OFICIAL & LISTA DE PRESENÇA (IMPRESSÃO)
          ========================================================= */}
      {modalAta && (
        <Modal
          isOpen={!!modalAta}
          titulo="Ata Oficial de Reunião & Lista de Presença"
          onClose={() => setModalAta(null)}
          width={760}
          esconderRodape
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className={styles.ataDocument}>
              {/* Cabeçalho Oficial */}
              <div className={styles.ataHeader}>
                <h4 className={styles.ataPreTitle}>
                  {selectedEscola?.nome ? selectedEscola.nome.toUpperCase() : "SECRETARIA MUNICIPAL DE EDUCAÇÃO · SIGEM"}
                </h4>
                <h3 className={styles.ataMainTitle}>
                  ATA OFICIAL DE REUNIÃO DE PAIS E MESTRES
                </h3>
                <p className={styles.ataSubTitle}>
                  {modalAta.titulo} · Ano Letivo {new Date().getFullYear()}
                </p>
              </div>

              {/* Informações da Reunião */}
              <div className={styles.ataMetaGrid}>
                <div><strong>Data:</strong> {modalAta.dataReuniao ? new Date(modalAta.dataReuniao + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</div>
                <div><strong>Horário:</strong> {modalAta.horarioInicio} às {modalAta.horarioFim}</div>
                <div><strong>Local:</strong> {modalAta.local} ({modalAta.modalidade})</div>
                <div><strong>Público Convocado:</strong> {modalAta.turmaAlvo}</div>
              </div>

              {/* Pauta */}
              <div>
                <h5 className={styles.ataSectionTitle}>1. PAUTA DOS TRABALHOS:</h5>
                <div className={styles.ataPautaContent}>
                  {modalAta.pauta}
                </div>
              </div>

              {/* Lista de Presença */}
              <div>
                <h5 className={styles.ataSectionTitle}>2. LISTA DE PRESENÇA E ASSINATURA DOS RESPONSÁVEIS:</h5>
                <table className={styles.ataTable}>
                  <thead>
                    <tr>
                      <th style={{ width: 36, textAlign: "center" }}>Nº</th>
                      <th>Nome do Responsável Legal</th>
                      <th>Estudante</th>
                      <th style={{ width: 220 }}>Assinatura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(modalAta.confirmados && modalAta.confirmados.length > 0)
                      ? modalAta.confirmados.map((c, i) => (
                          <tr key={i}>
                            <td style={{ textAlign: "center", fontWeight: 700 }}>{i + 1}</td>
                            <td>{c.responsavelNome}</td>
                            <td>{c.alunoNome || "—"}</td>
                            <td></td>
                          </tr>
                        ))
                      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                          <tr key={i}>
                            <td style={{ textAlign: "center", fontWeight: 700 }}>{i}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Btn onClick={() => setModalAta(null)}>
                Fechar
              </Btn>
              <Btn variant="primary" onClick={() => window.print()}>
                <i className="ti ti-printer" /> Imprimir Folha da Ata
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================
          MODAL DE CONFIRMAÇÃO DE EXCLUSÃO
          ========================================================= */}
      {modalExclusao && (
        <Modal
          isOpen={!!modalExclusao}
          titulo="Confirmar Exclusão de Reunião"
          onClose={() => setModalExclusao(null)}
          width={460}
          esconderRodape
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary, #cbd5e1)", margin: 0, lineHeight: 1.5 }}>
              Tem certeza de que deseja remover a convocação da reunião <strong>"{modalExclusao.titulo}"</strong>?
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

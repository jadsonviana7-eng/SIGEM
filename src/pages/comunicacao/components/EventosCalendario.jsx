import React, { useState, useMemo } from "react";
import {
  addEvento,
  updateEvento,
  deleteEvento
} from "../../../services/comunicacaoService";
import {
  Btn,
  Modal,
  Input,
  Select,
  Alert
} from "../../../components/ui";
import styles from "./EventosCalendario.module.css";

const CATEGORIAS = [
  "Cultural & Festivo",
  "Acadêmico & Mostra Científica",
  "Esportivo & Recreativo",
  "Comunitário & Família",
  "Pedagógico & Formativo",
  "Outros"
];

const PUBLICOS = [
  "Toda a Comunidade Escolar",
  "Educação Infantil",
  "Ensino Fundamental I",
  "Ensino Fundamental II",
  "Turma Específica"
];

export default function EventosCalendario({
  eventos = [],
  turmas = [],
  escolaId,
  selectedEscola,
  onRefresh
}) {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroPublico, setFiltroPublico] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [modalExclusao, setModalExclusao] = useState(null);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [copiadoId, setCopiadoId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    titulo: "",
    categoria: "Cultural & Festivo",
    publicoAlvo: "Toda a Comunidade Escolar",
    turmaAlvo: "",
    dataEvento: new Date().toISOString().split("T")[0],
    horaInicio: "08:00",
    horaFim: "11:30",
    local: "Pátio Principal / Quadra Coberta",
    descricao: "",
    organizador: "Equipe Gestora & Docentes",
    abertoFamilia: true,
    status: "Confirmado"
  });

  // KPIs
  const kpis = useMemo(() => {
    const total = eventos.length;
    const abertosFamilia = eventos.filter(e => e.abertoFamilia !== false).length;
    const confirmados = eventos.filter(e => e.status === "Confirmado").length;
    const culturais = eventos.filter(e => (e.categoria || "").includes("Cultural")).length;

    return {
      total,
      abertosFamilia,
      confirmados,
      culturais
    };
  }, [eventos]);

  // Filtragem
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((ev) => {
      const matchBusca =
        (ev.titulo || "").toLowerCase().includes(busca.toLowerCase()) ||
        (ev.descricao || "").toLowerCase().includes(busca.toLowerCase()) ||
        (ev.local || "").toLowerCase().includes(busca.toLowerCase());
      const matchCat = !filtroCategoria || ev.categoria === filtroCategoria;
      const matchPub = !filtroPublico || ev.publicoAlvo === filtroPublico;
      return matchBusca && matchCat && matchPub;
    });
  }, [eventos, busca, filtroCategoria, filtroPublico]);

  const abrirNovo = () => {
    setForm({
      titulo: "",
      categoria: "Cultural & Festivo",
      publicoAlvo: "Toda a Comunidade Escolar",
      turmaAlvo: "",
      dataEvento: new Date().toISOString().split("T")[0],
      horaInicio: "08:00",
      horaFim: "11:30",
      local: "Pátio Principal / Quadra Coberta",
      descricao: "",
      organizador: "Equipe Gestora & Docentes",
      abertoFamilia: true,
      status: "Confirmado"
    });
    setIsEditing(false);
    setSelectedEvento(null);
    setModalOpen(true);
  };

  const abrirEditar = (ev) => {
    setSelectedEvento(ev);
    setForm({
      titulo: ev.titulo || "",
      categoria: ev.categoria || "Cultural & Festivo",
      publicoAlvo: ev.publicoAlvo || "Toda a Comunidade Escolar",
      turmaAlvo: ev.turmaAlvo || "",
      dataEvento: ev.dataEvento || "",
      horaInicio: ev.horaInicio || "08:00",
      horaFim: ev.horaFim || "11:30",
      local: ev.local || "",
      descricao: ev.descricao || "",
      organizador: ev.organizador || "Equipe Gestora & Docentes",
      abertoFamilia: ev.abertoFamilia !== false,
      status: ev.status || "Confirmado"
    });
    setIsEditing(true);
    setModalOpen(true);
  };

  const abrirDetalhes = (ev) => {
    setSelectedEvento(ev);
    setModalDetalhesOpen(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.dataEvento) {
      alert("Por favor, preencha o título e a data do evento.");
      return;
    }
    setSalvando(true);
    try {
      if (isEditing && selectedEvento) {
        await updateEvento(selectedEvento.id, form);
      } else {
        await addEvento(form, escolaId);
      }
      setModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar evento: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!modalExclusao) return;
    try {
      await deleteEvento(modalExclusao.id);
      setModalExclusao(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir: " + err.message);
    }
  };

  const formatarDataBR = (dt) => {
    if (!dt) return "—";
    const [y, m, d] = dt.split("-");
    return `${d}/${m}/${y}`;
  };

  const handleCopiarWhatsApp = (ev) => {
    const escolaNome = selectedEscola?.nome || "Escola Municipal";
    const textoWA = `*🎪 CONVITE ESPECIAL — ${ev.titulo.toUpperCase()}*\n` +
      `🏫 *${escolaNome}*\n\n` +
      `📅 *Data:* ${formatarDataBR(ev.dataEvento)}\n` +
      `⏰ *Horário:* ${ev.horaInicio} às ${ev.horaFim}\n` +
      `📍 *Local:* ${ev.local}\n` +
      `🎯 *Público:* ${ev.publicoAlvo} ${ev.turmaAlvo ? `(${ev.turmaAlvo})` : ""}\n` +
      `👨‍👩‍👧‍👦 *Presença dos Pais:* ${ev.abertoFamilia ? "Sim, presença muito bem-vinda!" : "Atividade pedagógica interna de alunos"}\n\n` +
      `*Programação & Atividades:*\n${ev.descricao || "Participe e prestigie nossos estudantes!"}\n\n` +
      `_Contamos com a sua valorosa presença!_\n*Secretaria Municipal de Educação · SIGEM*`;

    navigator.clipboard.writeText(textoWA);
    setCopiadoId(ev.id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const limparFiltros = () => {
    setBusca("");
    setFiltroCategoria("");
    setFiltroPublico("");
  };

  return (
    <div className={styles.container}>
      {/* 1. INDICADORES RÁPIDOS (KPIS) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8" }}>
            <i className="ti ti-calendar" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.total}</span>
            <span className={styles.statLabel}>Eventos no Calendário</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <i className="ti ti-calendar-check" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.confirmados}</span>
            <span className={styles.statLabel}>Atividades Confirmadas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
            <i className="ti ti-users" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.abertosFamilia}</span>
            <span className={styles.statLabel}>Abertos às Famílias</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <i className="ti ti-sparkles" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.culturais}</span>
            <span className={styles.statLabel}>Mostras & Projetos Culturais</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE CABEÇALHO */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-calendar-star" style={{ color: "#38bdf8" }} />
            Eventos & Calendário Cultural
          </div>
          <p className={styles.headerSubtitle}>
            Planejamento e convite para feiras pedagógicas, mostras científicas, apresentações cívicas e celebrações escolares.
          </p>
        </div>

        <button type="button" className={styles.btnNovo} onClick={abrirNovo}>
          <i className="ti ti-calendar-plus" />
          Novo Evento Escolar
        </button>
      </div>

      {/* 3. BARRA DE FILTROS */}
      <div className={styles.filtersBar}>
        <Input
          placeholder="Buscar por nome do evento, local ou programação..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          icon="ti ti-search"
        />

        <Select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          <option value="">Todas as Categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        <Select
          value={filtroPublico}
          onChange={(e) => setFiltroPublico(e.target.value)}
        >
          <option value="">Todos os Públicos</option>
          {PUBLICOS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>

        {(busca || filtroCategoria || filtroPublico) && (
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
            <i className="ti ti-list-details" style={{ color: "#38bdf8" }} />
            Eventos Programados ({eventosFiltrados.length})
          </h3>
          <p className={styles.sectionSubtitle}>
            {filtroCategoria ? `Exibindo categoria: ${filtroCategoria}` : "Visualizando calendário geral de eventos"}
          </p>
        </div>
      </div>

      {/* 5. GRADE DE CARDS */}
      <div className={styles.eventosGrid}>
        {eventosFiltrados.length === 0 ? (
          <div style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            padding: "48px 20px",
            background: "var(--bg-card, #1e293b)",
            border: "1px dashed var(--border-color, #2c3b52)",
            borderRadius: 16
          }}>
            <i className="ti ti-calendar-event" style={{ fontSize: 40, color: "#64748b", marginBottom: 12, display: "inline-block" }} />
            <h4 style={{ margin: "0 0 6px 0", color: "#f8fafc", fontSize: 16 }}>Nenhum evento encontrado</h4>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
              {busca || filtroCategoria || filtroPublico
                ? "Tente ajustar os critérios de busca ou limpar os filtros."
                : "Clique em 'Novo Evento Escolar' para cadastrar atividades e comemorações."}
            </p>
          </div>
        ) : (
          eventosFiltrados.map((ev) => {
            return (
              <div key={ev.id} className={styles.eventoCard}>
                <div>
                  <div className={styles.cardTop}>
                    <span className={styles.badgeCategory}>
                      <i className="ti ti-sparkles" /> {ev.categoria || "Geral"}
                    </span>
                    <span
                      className={`${styles.badgeStatus} ${
                        ev.status === "Confirmado"
                          ? styles.statusConfirmado
                          : ev.status === "Em Planejamento"
                          ? styles.statusPlanejamento
                          : styles.statusCancelado
                      }`}
                    >
                      {ev.status || "Confirmado"}
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{ev.titulo}</h3>

                  <div className={styles.infoBox}>
                    <div className={styles.infoRow}>
                      <span>📅</span>
                      <span><strong>Data:</strong> {formatarDataBR(ev.dataEvento)} ({ev.horaInicio} às {ev.horaFim})</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>📍</span>
                      <span><strong>Local:</strong> {ev.local}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>👥</span>
                      <span><strong>Público:</strong> {ev.publicoAlvo} {ev.turmaAlvo && `(${ev.turmaAlvo})`}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>👨‍👩‍👧‍👦</span>
                      <span><strong>Famílias:</strong> {ev.abertoFamilia ? "Presença incentivada" : "Atividade interna de alunos"}</span>
                    </div>
                  </div>

                  <p className={styles.descText} title={ev.descricao}>
                    {ev.descricao || "Sem detalhes adicionais cadastrados."}
                  </p>
                </div>

                <div className={styles.cardFooter}>
                  <Btn
                    size="sm"
                    variant="outline"
                    onClick={() => abrirDetalhes(ev)}
                    style={{ fontSize: 11 }}
                  >
                    <i className="ti ti-eye" /> Detalhes & Cartaz
                  </Btn>

                  <div className={styles.actionBtnGroup}>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${copiadoId === ev.id ? styles.iconBtnSuccess : ""}`}
                      onClick={() => handleCopiarWhatsApp(ev)}
                      title="Copiar Convocação Formatada para WhatsApp"
                    >
                      <i className={copiadoId === ev.id ? "ti ti-check" : "ti ti-brand-whatsapp"} />
                    </button>

                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => abrirEditar(ev)}
                      title="Editar Evento"
                    >
                      <i className="ti ti-pencil" />
                    </button>

                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => setModalExclusao(ev)}
                      title="Excluir Evento"
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================
          MODAL DE CADASTRO / EDIÇÃO (CAMPOS UM ABAIXO DO OUTRO)
          ========================================================= */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          titulo={isEditing ? "Editar Evento Escolar" : "Agendar Novo Evento Escolar"}
          onClose={() => setModalOpen(false)}
          width={640}
          esconderRodape
        >
          <form onSubmit={handleSalvar} className={styles.modalForm}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Título do Evento Escolar <span className={styles.fieldRequired}>*</span>
              </label>
              <Input
                placeholder="Ex: Feira de Ciências, Robótica & Meio Ambiente 2026"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Categoria <span className={styles.fieldRequired}>*</span>
              </label>
              <Select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Status da Atividade
              </label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Confirmado">Confirmado</option>
                <option value="Em Planejamento">Em Planejamento</option>
                <option value="Adiado">Adiado</option>
                <option value="Cancelado">Cancelado</option>
              </Select>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Data do Evento <span className={styles.fieldRequired}>*</span>
              </label>
              <Input
                type="date"
                value={form.dataEvento}
                onChange={(e) => setForm({ ...form, dataEvento: e.target.value })}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Horário de Início <span className={styles.fieldRequired}>*</span>
              </label>
              <Input
                type="time"
                value={form.horaInicio}
                onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Horário de Término <span className={styles.fieldRequired}>*</span>
              </label>
              <Input
                type="time"
                value={form.horaFim}
                onChange={(e) => setForm({ ...form, horaFim: e.target.value })}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Local / Espaço Físico <span className={styles.fieldRequired}>*</span>
              </label>
              <Input
                placeholder="Ex: Ginásio Coberto, Auditório Municipal, Pátio Central..."
                value={form.local}
                onChange={(e) => setForm({ ...form, local: e.target.value })}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Público Convidado <span className={styles.fieldRequired}>*</span>
              </label>
              <Select
                value={form.publicoAlvo}
                onChange={(e) => setForm({ ...form, publicoAlvo: e.target.value })}
              >
                {PUBLICOS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>

            {form.publicoAlvo === "Turma Específica" && (
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  Turma Específica <span className={styles.fieldRequired}>*</span>
                </label>
                <Select
                  value={form.turmaAlvo}
                  onChange={(e) => setForm({ ...form, turmaAlvo: e.target.value })}
                >
                  <option value="">-- Selecione a Turma --</option>
                  {turmas.map((t) => (
                    <option key={t.id || t.nome} value={t.nome}>{t.nome}</option>
                  ))}
                </Select>
              </div>
            )}

            <div className={styles.formField}>
              <label className={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={form.abertoFamilia}
                  onChange={(e) => setForm({ ...form, abertoFamilia: e.target.checked })}
                  style={{ width: 17, height: 17, accentColor: "#0284c7" }}
                />
                <span>Evento aberto à participação dos pais e responsáveis</span>
              </label>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Equipe Organizadora / Responsável
              </label>
              <Input
                value={form.organizador}
                onChange={(e) => setForm({ ...form, organizador: e.target.value })}
                placeholder="Ex: Corpo Docente do Ensino Fundamental"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Programação & Descrição dos Trabalhos
              </label>
              <textarea
                rows={4}
                className={styles.formTextarea}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descreva as atividades, estandes, exposições ou apresentações artísticas previstas..."
              />
            </div>

            <div className={styles.modalFooter}>
              <Btn onClick={() => setModalOpen(false)}>
                Cancelar
              </Btn>
              <Btn variant="primary" type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar Evento"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================
          MODAL DE DETALHES & CARTAZ OFICIAL
          ========================================================= */}
      {modalDetalhesOpen && selectedEvento && (
        <Modal
          isOpen={modalDetalhesOpen}
          titulo="Cartaz & Detalhes do Evento Escolar"
          onClose={() => setModalDetalhesOpen(false)}
          width={720}
          esconderRodape
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className={styles.eventoDocument}>
              <div className={styles.eventoHeader}>
                <h4 className={styles.eventoPreTitle}>
                  {selectedEscola?.nome ? selectedEscola.nome.toUpperCase() : "SECRETARIA MUNICIPAL DE EDUCAÇÃO · SIGEM"}
                </h4>
                <h3 className={styles.eventoMainTitle}>
                  {selectedEvento.titulo}
                </h3>
                <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
                  Categoria: {selectedEvento.categoria} · {formatarDataBR(selectedEvento.dataEvento)}
                </p>
              </div>

              <div className={styles.eventoMetaGrid}>
                <div><strong>📅 Data:</strong> {formatarDataBR(selectedEvento.dataEvento)}</div>
                <div><strong>⏰ Horário:</strong> {selectedEvento.horaInicio} às {selectedEvento.horaFim}</div>
                <div><strong>📍 Local:</strong> {selectedEvento.local}</div>
                <div><strong>👥 Convocados:</strong> {selectedEvento.publicoAlvo} {selectedEvento.turmaAlvo && `(${selectedEvento.turmaAlvo})`}</div>
                <div><strong>👨‍🏫 Organizador:</strong> {selectedEvento.organizador || "Equipe Escolar"}</div>
                <div><strong>👨‍👩‍👧‍👦 Famílias:</strong> {selectedEvento.abertoFamilia ? "Presença incentivada" : "Evento interno de alunos"}</div>
              </div>

              <div>
                <h5 style={{ margin: "0 0 6px 0", fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#1e293b" }}>
                  PROGRAMAÇÃO & INFORMAÇÕES GERAIS:
                </h5>
                <div className={styles.eventoDescContent}>
                  {selectedEvento.descricao || "Participe e prestigie o trabalho e a dedicação de nossos estudantes e de toda a comunidade escolar!"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Btn onClick={() => setModalDetalhesOpen(false)}>
                Fechar
              </Btn>
              <Btn variant="primary" onClick={() => window.print()}>
                <i className="ti ti-printer" /> Imprimir Cartaz / Comunicado
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
          titulo="Confirmar Exclusão de Evento"
          onClose={() => setModalExclusao(null)}
          width={460}
          esconderRodape
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary, #cbd5e1)", margin: 0, lineHeight: 1.5 }}>
              Tem certeza de que deseja remover o evento <strong>"{modalExclusao.titulo}"</strong> do calendário escolar?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Btn onClick={() => setModalExclusao(null)}>
                Cancelar
              </Btn>
              <Btn variant="danger" onClick={handleExcluir}>
                Sim, Excluir Evento
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

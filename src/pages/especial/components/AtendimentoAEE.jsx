import React, { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Table,
  Badge,
  Modal,
  Pagination,
  NotificationModal
} from "../../../components/ui";
import styles from "./AtendimentoAEE.module.css";

const DIAS_SEMANA = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira"
];

const DIAS_ORDEM = {
  "Segunda-feira": 1,
  "Terça-feira": 2,
  "Quarta-feira": 3,
  "Quinta-feira": 4,
  "Sexta-feira": 5
};

export default function AtendimentoAEE({
  atendimentos = [],
  alunos = [],
  salas = [],
  profissionais = [],
  onSalvar,
  onExcluir,
  escolaId,
  usuario
}) {
  // Modos de visualização: "grade" (Quadro Semanal por Dia) | "tabela" (Lista Detalhada Paginada)
  const [modoVisualizacao, setModoVisualizacao] = useState("grade");

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroDia, setFiltroDia] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");
  const [filtroSala, setFiltroSala] = useState("");
  const [filtroProfissional, setFiltroProfissional] = useState("");
  const [filtroModalidade, setFiltroModalidade] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  // Paginação da Tabela
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modais
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEdicao, setItemEdicao] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, id: null });
  const [notificacao, setNotificacao] = useState(null);

  // Formulário de Cadastro/Edição
  const [formData, setFormData] = useState({
    alunoId: "",
    alunoNome: "",
    salaId: "",
    salaNome: "",
    profissionalId: "",
    profissionalNome: "",
    diaSemana: "Segunda-feira",
    horarioInicio: "13:30",
    horarioFim: "14:20",
    modalidade: "Individual",
    focoPedagogico: "",
    objetivos: "",
    recursosUtilizados: "",
    status: "Ativo",
    observacoes: ""
  });

  // Auxiliar para obter turno
  const getTurno = (horario) => {
    if (!horario) return "Tarde";
    const hora = parseInt(horario.split(":")[0], 10);
    return hora < 12 ? "Manhã" : "Tarde";
  };

  // Auxiliar para obter diagnóstico do aluno
  const getDiagnosticoAluno = (alunoId, alunoNome) => {
    const al = alunos.find(
      (a) =>
        (alunoId && a.id === alunoId) ||
        (alunoNome && (a.nomeAluno === alunoNome || a.nome === alunoNome))
    );
    return al?.diagnosticoPrincipal || al?.diagnostico || "";
  };

  // Filtragem e Ordenação dos Atendimentos
  const atendimentosFiltrados = useMemo(() => {
    return atendimentos
      .filter((a) => {
        const aluno = a.alunoNome || "";
        const foco = a.focoPedagogico || a.objetivoSessao || "";
        const prof = a.profissionalNome || a.professorAEE || "";
        const sala = a.salaNome || a.salaRecursos || "";
        const termo = busca.toLowerCase();

        const matchBusca =
          !busca ||
          aluno.toLowerCase().includes(termo) ||
          foco.toLowerCase().includes(termo) ||
          prof.toLowerCase().includes(termo) ||
          sala.toLowerCase().includes(termo);

        const matchDia = !filtroDia || a.diaSemana === filtroDia;
        const matchTurno = !filtroTurno || getTurno(a.horarioInicio) === filtroTurno;
        const matchSala = !filtroSala || (a.salaId === filtroSala || sala.toLowerCase().includes(filtroSala.toLowerCase()));
        const matchProf = !filtroProfissional || (a.profissionalId === filtroProfissional || prof.toLowerCase().includes(filtroProfissional.toLowerCase()));
        const matchMod = !filtroModalidade || (a.modalidade || "").toLowerCase().includes(filtroModalidade.toLowerCase());
        const matchStatus = !filtroStatus || (a.status || "Ativo") === filtroStatus;

        return matchBusca && matchDia && matchTurno && matchSala && matchProf && matchMod && matchStatus;
      })
      .sort((a, b) => {
        const dA = DIAS_ORDEM[a.diaSemana] || 99;
        const dB = DIAS_ORDEM[b.diaSemana] || 99;
        if (dA !== dB) return dA - dB;
        return (a.horarioInicio || "").localeCompare(b.horarioInicio || "");
      });
  }, [atendimentos, busca, filtroDia, filtroTurno, filtroSala, filtroProfissional, filtroModalidade, filtroStatus]);

  // Paginação para a visão em tabela
  const totalPages = Math.max(1, Math.ceil(atendimentosFiltrados.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const atendimentosPaginados = useMemo(() => {
    return atendimentosFiltrados.slice(startIndex, startIndex + itemsPerPage);
  }, [atendimentosFiltrados, startIndex, itemsPerPage]);

  // Estatísticas Rápidas do Cronograma
  const estatisticas = useMemo(() => {
    const totalSessoes = atendimentos.length;
    const alunosUnicos = new Set(atendimentos.map((a) => a.alunoId || a.alunoNome)).size;
    const manha = atendimentos.filter((a) => getTurno(a.horarioInicio) === "Manhã").length;
    const tarde = atendimentos.filter((a) => getTurno(a.horarioInicio) === "Tarde").length;
    const salasOcupadas = new Set(atendimentos.map((a) => a.salaNome || a.salaRecursos).filter(Boolean)).size;

    return { totalSessoes, alunosUnicos, manha, tarde, salasOcupadas };
  }, [atendimentos]);

  // Detecção de Conflitos / Sobreposições de Horário
  const temConflitoHorario = (item) => {
    return atendimentos.some((outro) => {
      if (outro.id === item.id) return false;
      if (outro.diaSemana !== item.diaSemana) return false;

      const mesmaSala =
        item.salaId && outro.salaId
          ? item.salaId === outro.salaId
          : (item.salaNome || item.salaRecursos) &&
            (item.salaNome || item.salaRecursos) === (outro.salaNome || outro.salaRecursos);

      const mesmoProf =
        item.profissionalId && outro.profissionalId
          ? item.profissionalId === outro.profissionalId
          : (item.profissionalNome || item.professorAEE) &&
            (item.profissionalNome || item.professorAEE) === (outro.profissionalNome || outro.professorAEE);

      if (!mesmaSala && !mesmoProf) return false;

      const [hIni1, mIni1] = (item.horarioInicio || "00:00").split(":").map(Number);
      const [hFim1, mFim1] = (item.horarioFim || "00:00").split(":").map(Number);
      const [hIni2, mIni2] = (outro.horarioInicio || "00:00").split(":").map(Number);
      const [hFim2, mFim2] = (outro.horarioFim || "00:00").split(":").map(Number);

      const minIni1 = hIni1 * 60 + mIni1;
      const minFim1 = hFim1 * 60 + mFim1;
      const minIni2 = hIni2 * 60 + mIni2;
      const minFim2 = hFim2 * 60 + mFim2;

      return Math.max(minIni1, minIni2) < Math.min(minFim1, minFim2);
    });
  };

  // Abertura do Modal de Novo Agendamento
  const abrirModalNovo = (diaPredefinido = null) => {
    setItemEdicao(null);
    setFormData({
      alunoId: alunos[0]?.id || "",
      alunoNome: alunos[0]?.nomeAluno || alunos[0]?.nome || "",
      salaId: salas[0]?.id || "",
      salaNome: salas[0]?.nome || "",
      profissionalId: profissionais[0]?.id || "",
      profissionalNome: profissionais[0]?.nome || "",
      diaSemana: diaPredefinido || filtroDia || "Segunda-feira",
      horarioInicio: "13:30",
      horarioFim: "14:20",
      modalidade: "Individual",
      focoPedagogico: "Desenvolvimento de funções cognitivas e comunicação alternativa (CAA)",
      objetivos: "Estimular raciocínio lógico, atenção sustentada e autonomia escolar nas atividades do contraturno.",
      recursosUtilizados: "Prancha de CAA, Jogos sensoriais, Software acessível e materiais táteis",
      status: "Ativo",
      observacoes: ""
    });
    setModalAberto(true);
  };

  // Abertura do Modal de Edição
  const abrirModalEdicao = (item) => {
    setItemEdicao(item);
    setFormData({
      alunoId: item.alunoId || "",
      alunoNome: item.alunoNome || "",
      salaId: item.salaId || "",
      salaNome: item.salaNome || item.salaRecursos || "",
      profissionalId: item.profissionalId || "",
      profissionalNome: item.profissionalNome || item.professorAEE || "",
      diaSemana: item.diaSemana || "Segunda-feira",
      horarioInicio: item.horarioInicio || "13:30",
      horarioFim: item.horarioFim || "14:20",
      modalidade: item.modalidade || "Individual",
      focoPedagogico: item.focoPedagogico || item.objetivoSessao || "",
      objetivos: item.objetivos || "",
      recursosUtilizados: item.recursosUtilizados || "",
      status: item.status || "Ativo",
      observacoes: item.observacoes || ""
    });
    setModalAberto(true);
  };

  // Salvar
  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      await onSalvar(formData, itemEdicao?.id);
      setModalAberto(false);
      setNotificacao({
        tipo: "sucesso",
        titulo: "Sucesso",
        mensagem: itemEdicao
          ? "Horário de atendimento AEE atualizado com sucesso!"
          : "Novo atendimento AEE agendado com sucesso no cronograma!"
      });
    } catch (err) {
      setNotificacao({
        tipo: "erro",
        titulo: "Erro",
        mensagem: "Erro ao salvar atendimento de AEE: " + err.message
      });
    }
  };

  // Excluir
  const handleExcluir = async () => {
    try {
      await onExcluir(modalConfirmacao.id);
      setModalConfirmacao({ aberto: false, id: null });
      setNotificacao({
        tipo: "sucesso",
        titulo: "Excluído",
        mensagem: "Horário de atendimento AEE removido com sucesso!"
      });
    } catch (err) {
      setNotificacao({
        tipo: "erro",
        titulo: "Erro",
        mensagem: "Erro ao excluir atendimento: " + err.message
      });
    }
  };

  // Limpeza de Filtros
  const limparFiltros = () => {
    setBusca("");
    setFiltroDia("");
    setFiltroTurno("");
    setFiltroSala("");
    setFiltroProfissional("");
    setFiltroModalidade("");
    setFiltroStatus("");
    setCurrentPage(1);
  };

  const temFiltroAtivo =
    busca || filtroDia || filtroTurno || filtroSala || filtroProfissional || filtroModalidade || filtroStatus;

  // Impressão da Grade
  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      {/* 1. Indicadores / Estatísticas do Cronograma */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
            <i className="ti ti-calendar-time" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.totalSessoes}</span>
            <span className={styles.statLabel}>Sessões Semanais</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <i className="ti ti-users" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.alunosUnicos}</span>
            <span className={styles.statLabel}>Estudantes no AEE</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8" }}>
            <i className="ti ti-sun" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.manha}</span>
            <span className={styles.statLabel}>Turno Matutino</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <i className="ti ti-sunset-2" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.tarde}</span>
            <span className={styles.statLabel}>Turno Vespertino</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}>
            <i className="ti ti-door-enter" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{salas.length || estatisticas.salasOcupadas}</span>
            <span className={styles.statLabel}>Salas SRM Ativas</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Modos de Visualização & Ações Rápidas (4 Botões Quadrados) */}
      <div className={styles.squareActionsContainer}>
        <div className={styles.squareActionsInfo}>
          <div className={styles.squareActionsTitle}>
            <i className="ti ti-calendar-time text-indigo-400" />
            <span>Gestão e Visualização do Cronograma</span>
          </div>
          <p className={styles.squareActionsSubtitle}>
            Alterne o modo de exibição, exporte os horários ou cadastre novas sessões de AEE
          </p>
        </div>

        <div className={styles.actionsGrid4}>
          {/* 1. Grade Semanal */}
          <button
            type="button"
            className={`${styles.squareActionBtn} ${
              modoVisualizacao === "grade" ? styles.squareBtnActive : styles.squareBtnDefault
            }`}
            onClick={() => setModoVisualizacao("grade")}
            title="Visualizar em grade semanal com colunas por dia"
          >
            <i className="ti ti-layout-grid" />
            <span>Grade Semanal</span>
          </button>

          {/* 2. Lista Detalhada */}
          <button
            type="button"
            className={`${styles.squareActionBtn} ${
              modoVisualizacao === "tabela" ? styles.squareBtnActive : styles.squareBtnDefault
            }`}
            onClick={() => setModoVisualizacao("tabela")}
            title="Visualizar em formato de lista e tabela detalhada"
          >
            <i className="ti ti-list-details" />
            <span>Lista Detalhada</span>
          </button>

          {/* 3. Imprimir Grade */}
          <button
            type="button"
            className={`${styles.squareActionBtn} ${styles.squareBtnPrint}`}
            onClick={handleImprimir}
            title="Imprimir quadro de horários do AEE"
          >
            <i className="ti ti-printer" />
            <span>Imprimir Grade</span>
          </button>

          {/* 4. Agendar Atendimento */}
          <button
            type="button"
            className={`${styles.squareActionBtn} ${styles.squareBtnPrimary}`}
            onClick={() => abrirModalNovo()}
            title="Cadastrar novo agendamento de atendimento AEE"
          >
            <i className="ti ti-calendar-plus" />
            <span>Agendar Atendimento</span>
          </button>
        </div>
      </div>

      {/* 3. Seletor Rápido de Dias e Filtros */}
      <div className={styles.filtersSection}>
        {/* Pílulas Rápidas de Dias da Semana */}
        <div className={styles.dayPillsScroll}>
          <button
            type="button"
            className={`${styles.dayPill} ${filtroDia === "" ? styles.dayPillActive : ""}`}
            onClick={() => setFiltroDia("")}
          >
            <span>Semana Completa</span>
            <span className={styles.dayPillCount}>{atendimentos.length}</span>
          </button>

          {DIAS_SEMANA.map((dia) => {
            const count = atendimentos.filter((a) => a.diaSemana === dia).length;
            const isAtivo = filtroDia === dia;
            return (
              <button
                key={dia}
                type="button"
                className={`${styles.dayPill} ${isAtivo ? styles.dayPillActive : ""}`}
                onClick={() => setFiltroDia(isAtivo ? "" : dia)}
              >
                <span>{dia.split("-")[0]}</span>
                <span className={styles.dayPillCount}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Grade de Filtros Detalhados */}
        <div className={styles.filtersGrid}>
          <div>
            <Input
              placeholder="Buscar aluno, foco pedagógico, professor ou sala..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setCurrentPage(1);
              }}
              icon="ti ti-search"
            />
          </div>

          <div>
            <Select
              value={filtroTurno}
              onChange={(e) => {
                setFiltroTurno(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Todos os Turnos</option>
              <option value="Manhã">☀️ Manhã (até 12h)</option>
              <option value="Tarde">🌅 Tarde (após 12h)</option>
            </Select>
          </div>

          <div>
            <Select
              value={filtroModalidade}
              onChange={(e) => {
                setFiltroModalidade(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Todas as Modalidades</option>
              <option value="Individual">Individual</option>
              <option value="Dupla">Dupla</option>
              <option value="Pequeno Grupo">Pequeno Grupo</option>
            </Select>
          </div>

          <div>
            <Select
              value={filtroSala}
              onChange={(e) => {
                setFiltroSala(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Todas as Salas SRM</option>
              {salas.map((s) => (
                <option key={s.id} value={s.nome}>
                  {s.nome}
                </option>
              ))}
            </Select>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Select
              value={filtroStatus}
              onChange={(e) => {
                setFiltroStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Todos os Status</option>
              <option value="Ativo">Ativos</option>
              <option value="Suspenso">Suspensos</option>
              <option value="Concluído">Concluídos</option>
            </Select>

            {temFiltroAtivo && (
              <button
                type="button"
                onClick={limparFiltros}
                className="p-2.5 rounded-lg border border-red-300 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold whitespace-nowrap"
                title="Limpar todos os filtros"
              >
                <i className="ti ti-x mr-1" /> Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. VISUALIZAÇÃO EM GRADE SEMANAL (CRONOGRAMA) */}
      {modoVisualizacao === "grade" && (
        <div className={styles.weeklyScheduleGrid}>
          {DIAS_SEMANA.map((dia) => {
            const sessoesDoDia = atendimentosFiltrados.filter((a) => a.diaSemana === dia);
            const isDiaFiltrado = filtroDia && filtroDia !== dia;

            // Se o usuário filtrou por um dia específico, esconde as outras colunas na visão focada
            if (filtroDia && filtroDia !== dia) {
              return null;
            }

            return (
              <div
                key={dia}
                className={styles.dayColumn}
                style={filtroDia === dia ? { gridColumn: "1 / -1", minHeight: "auto" } : {}}
              >
                {/* Header da Coluna do Dia */}
                <div className={styles.dayColumnHeader}>
                  <div className={styles.dayColumnTitle}>
                    <i className="ti ti-calendar text-indigo-500" />
                    <span>{dia}</span>
                    <span className={styles.dayColumnBadge}>{sessoesDoDia.length}</span>
                  </div>

                  <button
                    type="button"
                    className={styles.dayColumnQuickAdd}
                    onClick={() => abrirModalNovo(dia)}
                    title={`Agendar atendimento na ${dia}`}
                  >
                    <i className="ti ti-plus" />
                  </button>
                </div>

                {/* Corpo da Coluna com Sessões Ordenadas por Horário */}
                <div
                  className={styles.dayColumnBody}
                  style={
                    filtroDia === dia
                      ? {
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: 12
                        }
                      : {}
                  }
                >
                  {sessoesDoDia.length === 0 ? (
                    <div className={styles.emptyDayPlaceholder}>
                      <i className="ti ti-calendar-off" style={{ fontSize: 26, opacity: 0.6 }} />
                      <span>Nenhum atendimento agendado</span>
                      <button
                        type="button"
                        className={styles.emptyDayBtn}
                        onClick={() => abrirModalNovo(dia)}
                      >
                        + Agendar sessão
                      </button>
                    </div>
                  ) : (
                    sessoesDoDia.map((item) => {
                      const turno = getTurno(item.horarioInicio);
                      const conflito = temConflitoHorario(item);
                      const diagAluno = getDiagnosticoAluno(item.alunoId, item.alunoNome);

                      return (
                        <div key={item.id} className={styles.appointmentCard}>
                          {/* Topo do Card: Horário e Status */}
                          <div className={styles.appointmentHeader}>
                            <span
                              className={`${styles.timeTag} ${
                                turno === "Manhã" ? styles.timeTagManha : styles.timeTagTarde
                              }`}
                            >
                              <i className={turno === "Manhã" ? "ti ti-sun" : "ti ti-sunset-2"} />
                              {item.horarioInicio} - {item.horarioFim}
                            </span>

                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <Badge
                                variant={
                                  (item.modalidade || "").includes("Individual")
                                    ? "primary"
                                    : (item.modalidade || "").includes("Dupla")
                                    ? "warning"
                                    : "info"
                                }
                              >
                                {item.modalidade || "AEE"}
                              </Badge>

                              {item.status && item.status !== "Ativo" && (
                                <Badge variant="secondary">{item.status}</Badge>
                              )}
                            </div>
                          </div>

                          {/* Alerta de Conflito de Horário */}
                          {conflito && (
                            <div
                              style={{
                                background: "rgba(245, 158, 11, 0.12)",
                                border: "1px solid rgba(245, 158, 11, 0.35)",
                                borderRadius: 6,
                                padding: "4px 8px",
                                fontSize: 10.5,
                                color: "#fbbf24",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontWeight: 600
                              }}
                            >
                              <i className="ti ti-alert-triangle" />
                              <span>Possível sobreposição de horário</span>
                            </div>
                          )}

                          {/* Identificação do Aluno */}
                          <div>
                            <div className={styles.appointmentStudent}>{item.alunoNome}</div>
                            {diagAluno && (
                              <div
                                style={{
                                  fontSize: 10.5,
                                  color: "var(--text-muted, #94a3b8)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}
                              >
                                {diagAluno}
                              </div>
                            )}
                          </div>

                          {/* Foco Pedagógico & Objetivos */}
                          {(item.focoPedagogico || item.objetivoSessao) && (
                            <div className={styles.appointmentFocus} title={item.focoPedagogico || item.objetivoSessao}>
                              <strong>Foco:</strong> {item.focoPedagogico || item.objetivoSessao}
                            </div>
                          )}

                          {/* Metadados: Sala e Profissional */}
                          <div className={styles.appointmentMeta}>
                            <div className={styles.metaItem}>
                              <i className="ti ti-door text-indigo-400" />
                              <span>{item.salaNome || item.salaRecursos || "Sala SRM"}</span>
                            </div>
                            <div className={styles.metaItem}>
                              <i className="ti ti-user-check text-emerald-400" />
                              <span>{item.profissionalNome || item.professorAEE || "Prof. AEE"}</span>
                            </div>
                          </div>

                          {/* Ações Rápidas */}
                          <div className={styles.appointmentActions}>
                            <button
                              type="button"
                              className={`${styles.actionBtnMini} ${styles.actionBtnEdit}`}
                              onClick={() => abrirModalEdicao(item)}
                              title="Editar sessão"
                            >
                              <i className="ti ti-edit" />
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionBtnMini} ${styles.actionBtnDelete}`}
                              onClick={() => setModalConfirmacao({ aberto: true, id: item.id })}
                              title="Remover sessão"
                            >
                              <i className="ti ti-trash" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. VISUALIZAÇÃO EM LISTA / TABELA COMPLETA */}
      {modoVisualizacao === "tabela" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <i className="ti ti-list text-indigo-600 dark:text-indigo-400" />
                Quadro de Atendimentos Especializados
              </CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mostrando {atendimentosFiltrados.length} atendimento(s) organizados por dia e horário
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {/* Tabela Desktop */}
            <div className="sigem-desktop-table" style={{ overflowX: "auto" }}>
              <Table>
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-left text-xs uppercase tracking-wider">
                    <th className="p-3.5">Dia & Horário</th>
                    <th className="p-3.5">Estudante AEE</th>
                    <th className="p-3.5">Modalidade</th>
                    <th className="p-3.5">Foco Pedagógico & Metas</th>
                    <th className="p-3.5">Ambiente & Profissional</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  {atendimentosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        Nenhum atendimento de AEE encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    atendimentosPaginados.map((item) => {
                      const turno = getTurno(item.horarioInicio);
                      const diagAluno = getDiagnosticoAluno(item.alunoId, item.alunoNome);

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="p-3.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ background: turno === "Manhã" ? "#38bdf8" : "#fbbf24" }}
                              />
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{item.diaSemana}</p>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                  ⏱️ {item.horarioInicio} - {item.horarioFim} ({turno})
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-gray-800 dark:text-white">{item.alunoNome}</div>
                            {diagAluno && (
                              <div className="text-xs text-gray-400 truncate max-w-xs">{diagAluno}</div>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <Badge
                              variant={
                                (item.modalidade || "").includes("Individual")
                                  ? "primary"
                                  : (item.modalidade || "").includes("Dupla")
                                  ? "warning"
                                  : "info"
                              }
                            >
                              {item.modalidade || "AEE"}
                            </Badge>
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                              {item.focoPedagogico || item.objetivoSessao || "Atendimento AEE"}
                            </p>
                            {item.objetivos && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.objetivos}</p>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                              <i className="ti ti-door mr-1 text-indigo-500" />
                              {item.salaNome || item.salaRecursos || "Sala SRM"}
                            </p>
                            <p className="text-xs text-gray-500">
                              <i className="ti ti-user-check mr-1 text-emerald-500" />
                              {item.profissionalNome || item.professorAEE || "Prof. AEE"}
                            </p>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <Badge variant={item.status === "Ativo" ? "success" : "secondary"}>
                              {item.status || "Ativo"}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => abrirModalEdicao(item)}
                              className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                              title="Editar sessão"
                            >
                              <i className="ti ti-edit" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setModalConfirmacao({ aberto: true, id: item.id })}
                              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                              title="Excluir"
                            >
                              <i className="ti ti-trash" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>

            {/* Cards Mobile */}
            <div className="sigem-mobile-cards" style={{ padding: "10px 0" }}>
              {atendimentosPaginados.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  Nenhum atendimento de AEE encontrado.
                </div>
              ) : (
                atendimentosPaginados.map((item) => (
                  <div
                    key={`mob-aee-${item.id}`}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 14,
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      boxShadow: "var(--card-shadow)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>
                          {item.alunoNome}
                        </div>
                        <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 600, marginTop: 2 }}>
                          📅 {item.diaSemana} · {item.horarioInicio} - {item.horarioFim}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <Badge
                          variant={
                            (item.modalidade || "").includes("Individual")
                              ? "primary"
                              : (item.modalidade || "").includes("Dupla")
                              ? "warning"
                              : "info"
                          }
                        >
                          {item.modalidade || "AEE"}
                        </Badge>
                        <Badge variant={item.status === "Ativo" ? "success" : "secondary"}>
                          {item.status || "Ativo"}
                        </Badge>
                      </div>
                    </div>

                    {(item.focoPedagogico || item.objetivoSessao) && (
                      <div
                        style={{
                          background: "var(--bg-surface)",
                          padding: "8px 10px",
                          borderRadius: 8,
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-color)"
                        }}
                      >
                        <strong style={{ color: "var(--text-primary)" }}>Foco:</strong>{" "}
                        {item.focoPedagogico || item.objetivoSessao}
                        {item.objetivos && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            {item.objetivos}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                        fontSize: 11.5,
                        color: "var(--text-muted)",
                        paddingTop: 4,
                        borderTop: "1px dashed var(--border-color)"
                      }}
                    >
                      <span>
                        <i className="ti ti-door text-indigo-500 mr-1" />
                        {item.salaNome || item.salaRecursos || "Sala SRM"}
                      </span>
                      <span>
                        <i className="ti ti-user-check text-emerald-500 mr-1" />
                        {item.profissionalNome || item.professorAEE || "Prof. AEE"}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, paddingTop: 4 }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => abrirModalEdicao(item)}
                        className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                      >
                        <i className="ti ti-edit mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setModalConfirmacao({ aberto: true, id: item.id })}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <i className="ti ti-trash mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-end">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 6. MODAL DE CADASTRO/EDIÇÃO DE ATENDIMENTO AEE */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={itemEdicao ? "Editar Atendimento AEE" : "Novo Agendamento de Atendimento AEE"}
        size="lg"
      >
        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Aluno da Educação Especial *
              </label>
              <Select
                value={formData.alunoId}
                onChange={(e) => {
                  const sel = alunos.find((a) => a.id === e.target.value);
                  setFormData({
                    ...formData,
                    alunoId: e.target.value,
                    alunoNome: sel ? sel.nomeAluno || sel.nome : ""
                  });
                }}
                required
              >
                <option value="">Selecione o aluno...</option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nomeAluno || a.nome} ({a.diagnosticoPrincipal || "AEE"})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Modalidade de Atendimento *
              </label>
              <Select
                value={formData.modalidade}
                onChange={(e) => setFormData({ ...formData, modalidade: e.target.value })}
                required
              >
                <option value="Individual">Individual (1 aluno)</option>
                <option value="Dupla">Dupla (2 alunos)</option>
                <option value="Pequeno Grupo">Pequeno Grupo (3-4 alunos)</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Dia da Semana *
              </label>
              <Select
                value={formData.diaSemana}
                onChange={(e) => setFormData({ ...formData, diaSemana: e.target.value })}
                required
              >
                {DIAS_SEMANA.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                  Horário Início *
                </label>
                <Input
                  type="time"
                  value={formData.horarioInicio}
                  onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                  Horário Término *
                </label>
                <Input
                  type="time"
                  value={formData.horarioFim}
                  onChange={(e) => setFormData({ ...formData, horarioFim: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Sala de Recursos Multifuncionais (SRM)
              </label>
              <Select
                value={formData.salaId}
                onChange={(e) => {
                  const sel = salas.find((s) => s.id === e.target.value);
                  setFormData({
                    ...formData,
                    salaId: e.target.value,
                    salaNome: sel ? sel.nome : ""
                  });
                }}
              >
                <option value="">Selecione a sala...</option>
                {salas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} {s.tipo ? `(${s.tipo})` : ""}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Profissional Responsável (AEE)
              </label>
              <Select
                value={formData.profissionalId}
                onChange={(e) => {
                  const sel = profissionais.find((p) => p.id === e.target.value);
                  setFormData({
                    ...formData,
                    profissionalId: e.target.value,
                    profissionalNome: sel ? sel.nome : ""
                  });
                }}
              >
                <option value="">Selecione o profissional...</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - {p.funcao || "Prof. AEE"}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Foco Pedagógico Principal *
            </label>
            <Input
              value={formData.focoPedagogico}
              onChange={(e) => setFormData({ ...formData, focoPedagogico: e.target.value })}
              placeholder="Ex: Alfabetização multissensorial, estimulação cognitiva, comunicação alternativa (CAA)..."
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Objetivos Específicos do Atendimento
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
              rows={2}
              value={formData.objetivos}
              onChange={(e) => setFormData({ ...formData, objetivos: e.target.value })}
              placeholder="Descreva as metas de curto prazo e habilidades trabalhadas nestas sessões..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Recursos e Tecnologias Assistivas Utilizados
            </label>
            <Input
              value={formData.recursosUtilizados}
              onChange={(e) => setFormData({ ...formData, recursosUtilizados: e.target.value })}
              placeholder="Ex: Prancha CAA, Teclado com colmeia, Jogos em relevo, Lupa eletrônica, Materiais táteis..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Status do Agendamento
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Ativo">Ativo no Cronograma</option>
                <option value="Suspenso">Suspenso Temporariamente</option>
                <option value="Concluído">Concluído</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Observações Adicionais
              </label>
              <Input
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Ex: Contraturno escolar, acompanhado por cuidador..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {itemEdicao ? "Salvar Alterações" : "Cadastrar Atendimento"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        isOpen={modalConfirmacao.aberto}
        onClose={() => setModalConfirmacao({ aberto: false, id: null })}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tem certeza de que deseja remover este horário de atendimento AEE do cronograma?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalConfirmacao({ aberto: false, id: null })}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleExcluir}>
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* 8. MODAL DE NOTIFICAÇÕES */}
      {notificacao && (
        <NotificationModal
          isOpen={!!notificacao}
          onClose={() => setNotificacao(null)}
          tipo={notificacao.tipo}
          titulo={notificacao.titulo}
          mensagem={notificacao.mensagem}
        />
      )}
    </div>
  );
}

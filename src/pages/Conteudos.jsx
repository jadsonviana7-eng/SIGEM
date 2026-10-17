import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getTurmas } from "../services/turmasService";
import { getProfessores } from "../services/professoresService";
import {
  getConteudos,
  addConteudo,
  updateConteudo,
  deleteConteudo
} from "../services/conteudosService";
import { DISCIPLINAS, ANO_LETIVO_ATUAL } from "../utils/constants";
import { Modal, Input, Select, Alert, Spinner, Btn } from "../components/ui";
import styles from "./conteudos/Conteudos.module.css";

import DashboardDiario from "./conteudos/components/DashboardDiario";
import ListaAulas from "./conteudos/components/ListaAulas";
import LancarAula from "./conteudos/components/LancarAula";
import HabilidadesBNCC from "./conteudos/components/HabilidadesBNCC";
import CadernetaOficial from "./conteudos/components/CadernetaOficial";

const BIMESTRES = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];

export default function Conteudos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, escolas, selectedEscolaId } = useAuth();
  const activeEscolaId = selectedEscolaId || user?.selectedEscolaId || user?.escolaId || "";
  const escolaAtual = (escolas || []).find((e) => e.id === activeEscolaId) || {
    nome: "Escola Municipal Modelo",
    inep: "27000000",
    cidade: "Maceió",
    uf: "AL"
  };

  // Aba ativa: 'dashboard' | 'aulas' | 'lancar' | 'bncc' | 'caderneta'
  const [activeTab, setActiveTab] = useState("dashboard");
  const [resumoMobileAberto, setResumoMobileAberto] = useState(false);
  const mobileTabContainerRef = useRef(null);

  // Carrega Turmas e Professores
  const { dados: turmas, carregando: cT } = useFirestore(
    useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  const { dados: professores, carregando: cP } = useFirestore(
    useCallback(() => getProfessores(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  // Filtros principais
  const [turmaSelecionada, setTurmaSelecionada] = useState(searchParams.get("turma") || "");
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState("");
  const [bimestreSelecionado, setBimestreSelecionado] = useState("");
  const [busca, setBusca] = useState("");
  const [alerta, setAlerta] = useState(null);

  // Inicializa turma se houver turmas cadastradas
  useEffect(() => {
    if (!turmaSelecionada && turmas && turmas.length > 0) {
      setTurmaSelecionada(turmas[0].nome);
    }
  }, [turmas, turmaSelecionada]);

  // Carrega conteúdos da turma selecionada
  const {
    dados: conteudos,
    carregando: cC,
    recarregar
  } = useFirestore(
    useCallback(
      () =>
        getConteudos(
          activeEscolaId,
          turmaSelecionada,
          disciplinaSelecionada,
          bimestreSelecionado
        ),
      [activeEscolaId, turmaSelecionada, disciplinaSelecionada, bimestreSelecionado]
    ),
    [activeEscolaId, turmaSelecionada, disciplinaSelecionada, bimestreSelecionado]
  );

  // Detalhes da Turma Selecionada
  const dadosTurmaAtual = useMemo(() => {
    return (turmas || []).find((t) => t.nome === turmaSelecionada);
  }, [turmas, turmaSelecionada]);

  // Formulário para Nova Aula / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [modalImprimirAberto, setModalImprimirAberto] = useState(false);
  const [editId, setEditId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    turma: "",
    data: new Date().toISOString().split("T")[0],
    disciplina: "Português",
    conteudo: "",
    habilidades: "",
    observacao: "",
    aulasQtd: 1,
    bimestre: "1º Bimestre",
    professor: user?.displayName || user?.email || ""
  });

  // Filtragem dos Conteúdos por Busca
  const conteudosFiltrados = useMemo(() => {
    return (conteudos || []).filter((item) => {
      const matchBusca =
        !busca ||
        (item.conteudo || "").toLowerCase().includes(busca.toLowerCase()) ||
        (item.habilidades || "").toLowerCase().includes(busca.toLowerCase()) ||
        (item.observacao || "").toLowerCase().includes(busca.toLowerCase()) ||
        (item.professor || "").toLowerCase().includes(busca.toLowerCase());

      return matchBusca;
    });
  }, [conteudos, busca]);

  // Totais e Estatísticas
  const totalAulasRegistradas = useMemo(() => {
    return (conteudosFiltrados || []).reduce(
      (acc, c) => acc + (Number(c.aulasQtd) || 1),
      0
    );
  }, [conteudosFiltrados]);

  const totalDiasLetivos = useMemo(() => {
    const datas = new Set((conteudosFiltrados || []).map((c) => c.data).filter(Boolean));
    return datas.size;
  }, [conteudosFiltrados]);

  // Grupos de Navegação no Desktop Aside
  const gruposMenu = useMemo(
    () => [
      {
        titulo: "Visão Geral",
        itens: [
          {
            id: "dashboard",
            label: "Painel do Diário",
            subtitulo: "Indicadores e métricas",
            icon: "layout-dashboard",
            badge: null
          }
        ]
      },
      {
        titulo: "Caderneta & Diário",
        itens: [
          {
            id: "aulas",
            label: "Aulas & Conteúdos",
            subtitulo: "Linha do tempo e histórico",
            icon: "notebook",
            badge: conteudosFiltrados.length
          },
          {
            id: "lancar",
            label: "Registrar Aula",
            subtitulo: "Novo plano ou aula dada",
            icon: "plus",
            badge: "Novo"
          }
        ]
      },
      {
        titulo: "Currículo & Impressão",
        itens: [
          {
            id: "bncc",
            label: "Habilidades BNCC",
            subtitulo: "Matriz curricular",
            icon: "target-arrow",
            badge: null
          },
          {
            id: "caderneta",
            label: "Caderneta Oficial",
            subtitulo: "Folha para impressão",
            icon: "printer",
            badge: "Oficial"
          }
        ]
      }
    ],
    [conteudosFiltrados]
  );

  // Auto-scroll da barra touch de abas no mobile
  useEffect(() => {
    if (mobileTabContainerRef.current) {
      const activeEl = mobileTabContainerRef.current.querySelector(
        `.${styles.mobileTabChipActive}`
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest"
        });
      }
    }
  }, [activeTab]);

  const itemAtivoObj = useMemo(() => {
    for (const g of gruposMenu) {
      const found = g.itens.find((i) => i.id === activeTab);
      if (found) return found;
    }
    return gruposMenu[0].itens[0];
  }, [gruposMenu, activeTab]);

  // Abrir Modal para Novo Registro
  function abrirNovoRegistro() {
    setEditId(null);
    setForm({
      turma: turmaSelecionada || (turmas?.[0]?.nome || ""),
      data: new Date().toISOString().split("T")[0],
      disciplina: disciplinaSelecionada || "Português",
      conteudo: "",
      habilidades: "",
      observacao: "",
      aulasQtd: 1,
      bimestre: bimestreSelecionado || "1º Bimestre",
      professor: user?.displayName || user?.email || ""
    });
    setModalAberto(true);
  }

  // Abrir Modal para Edição
  function abrirEditarRegistro(item) {
    setEditId(item.id);
    setForm({
      turma: item.turma || turmaSelecionada,
      data: item.data || new Date().toISOString().split("T")[0],
      disciplina: item.disciplina || "Português",
      conteudo: item.conteudo || "",
      habilidades: item.habilidades || "",
      observacao: item.observacao || "",
      aulasQtd: item.aulasQtd || 1,
      bimestre: item.bimestre || "1º Bimestre",
      professor: item.professor || user?.displayName || ""
    });
    setModalAberto(true);
  }

  // Salvar Conteúdo
  async function handleSalvar() {
    if (!form.turma) {
      alert("Selecione a turma.");
      return;
    }
    if (!form.data) {
      alert("Informe a data da aula.");
      return;
    }
    if (!form.disciplina) {
      alert("Selecione a disciplina.");
      return;
    }
    if (!form.conteudo.trim()) {
      alert("Descreva o conteúdo ministrado na aula.");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        ...form,
        aulasQtd: Number(form.aulasQtd) || 1,
        turmaAno: dadosTurmaAtual?.ano || "",
        turmaTurno: dadosTurmaAtual?.turno || "",
        professorEmail: user?.email || ""
      };

      if (editId) {
        await updateConteudo(editId, payload);
        setAlerta({ msg: "Conteúdo da aula atualizado com sucesso!", tipo: "success" });
      } else {
        await addConteudo(payload, activeEscolaId);
        setAlerta({
          msg: "Aula e conteúdo registrados no diário com sucesso!",
          tipo: "success"
        });
      }

      setModalAberto(false);
      recarregar();

      // Se estava na aba de lançamento, limpa o formulário ou direciona para aulas
      if (activeTab === "lancar") {
        setForm({
          turma: turmaSelecionada,
          data: new Date().toISOString().split("T")[0],
          disciplina: "Português",
          conteudo: "",
          habilidades: "",
          observacao: "",
          aulasQtd: 1,
          bimestre: "1º Bimestre",
          professor: user?.displayName || ""
        });
        setActiveTab("aulas");
      }
    } catch (err) {
      alert("Erro ao salvar conteúdo: " + err.message);
    } finally {
      setSalvando(false);
    }
  }

  // Excluir Conteúdo
  async function handleExcluir(id) {
    if (
      !window.confirm(
        "Deseja realmente remover este registro de aula da caderneta da turma?"
      )
    )
      return;
    try {
      await deleteConteudo(id);
      setAlerta({ msg: "Registro de aula removido com sucesso.", tipo: "success" });
      recarregar();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  }

  if (cT || cP) {
    return <Spinner texto="Carregando caderneta e turmas da escola..." />;
  }

  return (
    <div className={styles.container}>
      {/* ═════════════════════════════════════════════════════ */}
      {/* ── NAVEGAÇÃO MOBILE INTELIGENTE & ABAS DESLIZANTES ── */}
      {/* ═════════════════════════════════════════════════════ */}
      <div className={styles.mobileNavHeader}>
        {/* Topo do Módulo Mobile */}
        <div className={styles.mobileBarTop}>
          <div className={styles.mobileModuleTitle}>
            <div className={styles.mobileIconBadge}>
              <i className="ti ti-notebook" />
            </div>
            <div className={styles.mobileTitleText}>
              <span className={styles.mobileTitleMain}>Diário / Aulas</span>
              <span className={styles.mobileTitleSub}>
                {itemAtivoObj?.label || "Caderneta Digital"} · {turmaSelecionada || "Turma"}
              </span>
            </div>
          </div>

          <div className={styles.mobileBarActions}>
            <button
              type="button"
              className={`${styles.mobileActionButton} ${
                resumoMobileAberto ? styles.mobileActionButtonActive : ""
              }`}
              onClick={() => setResumoMobileAberto(!resumoMobileAberto)}
              title="Resumo do Diário"
            >
              <i className="ti ti-chart-dots" />
              <span>Resumo</span>
            </button>

            <button
              type="button"
              className={styles.mobileActionButton}
              onClick={abrirNovoRegistro}
              style={{ background: "#6366f1", color: "#ffffff", borderColor: "#818cf8" }}
              title="Nova Aula"
            >
              <i className="ti ti-plus" />
              <span>Aula</span>
            </button>
          </div>
        </div>

        {/* Painel Expansível de Resumo no Mobile */}
        {resumoMobileAberto && (
          <div className={styles.mobileSummaryPanel}>
            <div className={styles.mobileSummaryGrid}>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Carga Horária Dadas</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#818cf8" }}>
                  {totalAulasRegistradas} h/a
                </span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Dias Letivos</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#34d399" }}>
                  {totalDiasLetivos} dias
                </span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Aulas na Turma</span>
                <span className={styles.mobileSummaryValue}>
                  {conteudosFiltrados.length} reg.
                </span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Turma Ativa</span>
                <span
                  className={styles.mobileSummaryValue}
                  style={{
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {turmaSelecionada || "Nenhuma"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Abas Deslizante no Topo (Sticky Touch Chips) */}
        <div className={styles.mobileTabsSticky}>
          <div className={styles.mobileTabsScroll} ref={mobileTabContainerRef}>
            {gruposMenu.flatMap((g) =>
              g.itens.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.mobileTabChip} ${
                    activeTab === item.id ? styles.mobileTabChipActive : ""
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <i className={`ti ti-${item.icon}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className={styles.mobileTabBadge}>{item.badge}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── CONTEÚDO PRINCIPAL (COLUNA ESQUERDA) ───────────── */}
      {/* ═════════════════════════════════════════════════════ */}
      <div className={styles.contentCol}>
        {alerta && (
          <Alert tipo={alerta.tipo} onClose={() => setAlerta(null)}>
            {alerta.msg}
          </Alert>
        )}

        {activeTab === "dashboard" && (
          <DashboardDiario
            turmaSelecionada={turmaSelecionada}
            dadosTurmaAtual={dadosTurmaAtual}
            conteudosFiltrados={conteudosFiltrados}
            totalAulasRegistradas={totalAulasRegistradas}
            abrirNovoRegistro={abrirNovoRegistro}
            setModalImprimirAberto={() => setActiveTab("caderneta")}
            onNavegarAba={(aba) => setActiveTab(aba)}
            abrirEditarRegistro={abrirEditarRegistro}
          />
        )}

        {activeTab === "aulas" && (
          <ListaAulas
            turmas={turmas}
            turmaSelecionada={turmaSelecionada}
            setTurmaSelecionada={(t) => {
              setTurmaSelecionada(t);
              setSearchParams({ turma: t });
            }}
            disciplinaSelecionada={disciplinaSelecionada}
            setDisciplinaSelecionada={setDisciplinaSelecionada}
            bimestreSelecionado={bimestreSelecionado}
            setBimestreSelecionado={setBimestreSelecionado}
            busca={busca}
            setBusca={setBusca}
            conteudosFiltrados={conteudosFiltrados}
            carregando={cC}
            abrirNovoRegistro={abrirNovoRegistro}
            abrirEditarRegistro={abrirEditarRegistro}
            handleExcluir={handleExcluir}
            setModalImprimirAberto={() => setActiveTab("caderneta")}
            DISCIPLINAS={DISCIPLINAS}
            BIMESTRES={BIMESTRES}
          />
        )}

        {activeTab === "lancar" && (
          <LancarAula
            turmas={turmas}
            form={form}
            setForm={setForm}
            handleSalvar={handleSalvar}
            salvando={salvando}
            DISCIPLINAS={DISCIPLINAS}
            BIMESTRES={BIMESTRES}
            onCancelar={() => setActiveTab("aulas")}
            editId={editId}
          />
        )}

        {activeTab === "bncc" && (
          <HabilidadesBNCC
            conteudosFiltrados={conteudosFiltrados}
            turmaSelecionada={turmaSelecionada}
            disciplinaSelecionada={disciplinaSelecionada}
            setDisciplinaSelecionada={setDisciplinaSelecionada}
            DISCIPLINAS={DISCIPLINAS}
            onNavegarAba={(aba) => setActiveTab(aba)}
          />
        )}

        {activeTab === "caderneta" && (
          <CadernetaOficial
            turmaSelecionada={turmaSelecionada}
            dadosTurmaAtual={dadosTurmaAtual}
            disciplinaSelecionada={disciplinaSelecionada}
            setDisciplinaSelecionada={setDisciplinaSelecionada}
            bimestreSelecionado={bimestreSelecionado}
            setBimestreSelecionado={setBimestreSelecionado}
            conteudosFiltrados={conteudosFiltrados}
            totalAulasRegistradas={totalAulasRegistradas}
            escolaAtual={escolaAtual}
            DISCIPLINAS={DISCIPLINAS}
            BIMESTRES={BIMESTRES}
          />
        )}
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── COLUNA LATERAL DIREITA (DESKTOP ASIDE) ─────────── */}
      {/* ═════════════════════════════════════════════════════ */}
      <aside className={styles.desktopAside}>
        {/* Card de Turma em Foco */}
        <div className={styles.sideTurmaCard}>
          <div className={styles.sideTurmaLabel}>Turma em Foco</div>
          <select
            className={styles.sideTurmaSelect}
            value={turmaSelecionada}
            onChange={(e) => {
              setTurmaSelecionada(e.target.value);
              setSearchParams({ turma: e.target.value });
            }}
          >
            {turmas.map((t) => (
              <option key={t.id} value={t.nome}>
                {t.nome} ({t.ano} - {t.turno})
              </option>
            ))}
          </select>

          <div className={styles.sideTurmaMeta}>
            <div>
              <strong>Ano / Série:</strong> {dadosTurmaAtual?.ano || "Fundamental"}
            </div>
            <div>
              <strong>Turno:</strong> {dadosTurmaAtual?.turno || "Matutino"}
            </div>
            <div>
              <strong>Carga Horária:</strong> {totalAulasRegistradas} aulas
            </div>
          </div>

          <Btn
            variant="primary"
            onClick={abrirNovoRegistro}
            style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}
          >
            <i className="ti ti-plus" /> Registrar Aula
          </Btn>
        </div>

        {/* Card do Menu de Navegação */}
        <div className={styles.sideCard}>
          <div className={styles.sideHeader}>
            <div className={styles.sideTitleWrap}>
              <div className={styles.sideLogo}>
                <i className="ti ti-notebook" />
              </div>
              <div>
                <div className={styles.sideTitle}>Caderneta Digital</div>
                <div className={styles.sideSubtitle}>Diário de Classe & Aulas</div>
              </div>
            </div>
            <button
              type="button"
              className={styles.sideRefreshBtn}
              onClick={() => recarregar()}
              title="Recarregar Diário"
            >
              <i className="ti ti-refresh" />
            </button>
          </div>

          {gruposMenu.map((grupo, gIdx) => (
            <div key={grupo.titulo} style={{ marginTop: gIdx > 0 ? 12 : 0 }}>
              <div className={styles.sideGroupTitle}>{grupo.titulo}</div>
              <div className={styles.sideNavList}>
                {grupo.itens.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.sideNavItem} ${
                      activeTab === item.id ? styles.sideNavItemActive : ""
                    }`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <div className={styles.sideItemLeft}>
                      <i className={`ti ti-${item.icon} ${styles.sideItemIcon}`} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span className={styles.sideItemText}>{item.label}</span>
                        <span
                          style={{
                            fontSize: 10,
                            color: activeTab === item.id ? "#c7d2fe" : "#64748b"
                          }}
                        >
                          {item.subtitulo}
                        </span>
                      </div>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className={styles.sideItemBadge}>{item.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Atalho para Frequência da Turma */}
          <div className={styles.sideFooter}>
            <div className={styles.sideFooterLabel}>Atalho Rápido</div>
            <div className={styles.sideFooterTitle}>Frequência de Alunos</div>
            <div className={styles.sideFooterSub}>
              Chamada diária e mapa mensal da turma {turmaSelecionada}
            </div>
            <button
              type="button"
              onClick={() => navigate("/frequencia")}
              style={{
                marginTop: 8,
                width: "100%",
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #33435c",
                background: "#1e293b",
                color: "#818cf8",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <i className="ti ti-calendar-check" /> Acessar Frequência
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR / EDITAR AULA E CONTEÚDO                                 */}
      {/* ========================================================================= */}
      {modalAberto && (
        <Modal
          titulo={
            editId
              ? `Editar Registro de Aula · Turma ${form.turma}`
              : `Registrar Conteúdo de Aula · Turma ${form.turma}`
          }
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          textSave={editId ? "Atualizar Aula" : "Salvar no Diário da Turma"}
          width={650}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxHeight: "75vh",
              overflowY: "auto",
              paddingRight: 4
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#cbd5e1",
                    display: "block",
                    marginBottom: 4
                  }}
                >
                  Turma *
                </label>
                <Select
                  value={form.turma}
                  onChange={(e) => setForm((f) => ({ ...f, turma: e.target.value }))}
                >
                  {turmas.map((t) => (
                    <option key={t.id} value={t.nome}>
                      {t.nome} ({t.ano} - {t.turno})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#cbd5e1",
                    display: "block",
                    marginBottom: 4
                  }}
                >
                  Data da Aula *
                </label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#cbd5e1",
                    display: "block",
                    marginBottom: 4
                  }}
                >
                  Disciplina *
                </label>
                <Select
                  value={form.disciplina}
                  onChange={(e) => setForm((f) => ({ ...f, disciplina: e.target.value }))}
                >
                  {DISCIPLINAS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#cbd5e1",
                    display: "block",
                    marginBottom: 4
                  }}
                >
                  Bimestre *
                </label>
                <Select
                  value={form.bimestre}
                  onChange={(e) => setForm((f) => ({ ...f, bimestre: e.target.value }))}
                >
                  {BIMESTRES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#cbd5e1",
                    display: "block",
                    marginBottom: 4
                  }}
                >
                  Nº Aulas *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="6"
                  value={form.aulasQtd}
                  onChange={(e) => setForm((f) => ({ ...f, aulasQtd: e.target.value }))}
                />
              </div>
            </div>

            {/* Conteúdo Ministrado */}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#cbd5e1",
                  display: "block",
                  marginBottom: 4
                }}
              >
                Conteúdo Ministrado (Assunto / Tema da Aula) *
              </label>
              <textarea
                value={form.conteudo}
                onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
                placeholder="Ex: Leitura e interpretação de texto poético; Estrutura de versos e estrofes..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: 80,
                  border: "1px solid #33435c",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  background: "#243144",
                  color: "#ffffff"
                }}
              />
            </div>

            {/* Habilidade / Competência */}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#cbd5e1",
                  display: "block",
                  marginBottom: 4
                }}
              >
                Habilidade / Competência Desenvolvida (BNCC / Currículo)
              </label>
              <Input
                value={form.habilidades}
                onChange={(e) => setForm((f) => ({ ...f, habilidades: e.target.value }))}
                placeholder="Ex: EF06LP01, EF06MA02..."
              />
            </div>

            {/* Docente Responsável */}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#cbd5e1",
                  display: "block",
                  marginBottom: 4
                }}
              >
                Docente Responsável
              </label>
              <Input
                value={form.professor}
                onChange={(e) => setForm((f) => ({ ...f, professor: e.target.value }))}
                placeholder="Nome do professor..."
              />
            </div>

            {/* Observações Pedagógicas */}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#cbd5e1",
                  display: "block",
                  marginBottom: 4
                }}
              >
                Observações Pedagógicas (Opcional)
              </label>
              <Input
                value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                placeholder="Ex: Atividade em grupo; Tarefa de fixação..."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

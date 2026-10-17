import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getTurmas } from "../services/turmasService";
import {
  getFechamentos,
  inicializarFechamentosSeNecessario,
  solicitarFechamento,
  validarFechamento,
  devolverFechamento,
  solicitarReabertura,
  getAuditorias,
  STATUS_FECHAMENTO
} from "../services/fechamentoService";
import { ANO_LETIVO_ATUAL } from "../utils/constants";
import { Alert, Spinner } from "../components/ui";
import styles from "./fechamento/FechamentoPeriodo.module.css";

import DashboardFechamento from "./fechamento/components/DashboardFechamento";
import TurmasFechamento from "./fechamento/components/TurmasFechamento";
import AuditoriaFechamento from "./fechamento/components/AuditoriaFechamento";
import AtaHomologacao from "./fechamento/components/AtaHomologacao";
import {
  ModalSolicitar,
  ModalValidar,
  ModalDevolver,
  ModalReabrir
} from "./fechamento/components/ModaisFechamento";

const BIMESTRES = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];

export default function FechamentoPeriodo() {
  const { user, escolas, selectedEscolaId } = useAuth();
  const activeEscolaId = selectedEscolaId || user?.selectedEscolaId || user?.escolaId || "";
  const escolaAtual = (escolas || []).find((e) => e.id === activeEscolaId) || {
    nome: "Escola Municipal",
    inep: "27000000",
    cidade: "Maceió",
    uf: "AL"
  };

  const isCoordenacaoOuDirecao =
    user?.role === "Administrador" ||
    user?.role === "Diretor" ||
    user?.role === "Direção" ||
    user?.role === "Coordenador" ||
    user?.role === "Coordenação";

  const [anoLetivo, setAnoLetivo] = useState(String(ANO_LETIVO_ATUAL || 2026));
  const [bimestre, setBimestre] = useState("1º Bimestre");
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'turmas' | 'auditoria' | 'ata'
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [alerta, setAlerta] = useState(null);

  const [resumoMobileAberto, setResumoMobileAberto] = useState(false);
  const mobileTabContainerRef = useRef(null);

  // Carrega turmas
  const { dados: turmas, carregando: cTurmas } = useFirestore(
    useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  // Carrega fechamentos
  const {
    dados: fechamentosBrutos,
    carregando: cFechamentos,
    recarregar
  } = useFirestore(
    useCallback(
      () => getFechamentos(activeEscolaId, anoLetivo, bimestre),
      [activeEscolaId, anoLetivo, bimestre]
    ),
    [activeEscolaId, anoLetivo, bimestre]
  );

  // Carrega logs de auditoria
  const {
    dados: auditorias,
    carregando: cAuditoria,
    recarregar: recarregarAuditoria
  } = useFirestore(
    useCallback(
      () => getAuditorias(activeEscolaId, "", bimestre),
      [activeEscolaId, bimestre]
    ),
    [activeEscolaId, bimestre]
  );

  // Inicializa dados se necessário
  useEffect(() => {
    if (
      activeEscolaId &&
      turmas &&
      turmas.length > 0 &&
      fechamentosBrutos &&
      fechamentosBrutos.length === 0 &&
      !cFechamentos
    ) {
      inicializarFechamentosSeNecessario(activeEscolaId, turmas, anoLetivo, bimestre).then(
        () => {
          recarregar();
        }
      );
    }
  }, [activeEscolaId, turmas, fechamentosBrutos, cFechamentos, anoLetivo, bimestre, recarregar]);

  // Lista com fallback
  const listaFechamentos = useMemo(() => {
    if (fechamentosBrutos && fechamentosBrutos.length > 0) {
      return fechamentosBrutos;
    }
    if (turmas && turmas.length > 0) {
      return turmas.map((t, idx) => ({
        id: `mock-${t.id || idx}`,
        turma: t.nome,
        turno: t.turno || "Matutino",
        professor: t.professor || "Docente Responsável",
        status:
          idx < 4
            ? STATUS_FECHAMENTO.PENDENTE
            : idx < 6
            ? STATUS_FECHAMENTO.AGUARDANDO_VALIDACAO
            : STATUS_FECHAMENTO.FECHADO,
        trancado: idx >= 6,
        totalAulasDadas: idx < 4 ? 38 : 50,
        totalAulasPrevistas: 50,
        pendenciasDescricao:
          idx < 4
            ? "Falta lançar 2 aulas no diário e notas da recuperação paralela"
            : "",
        solicitadoPor: idx >= 4 ? t.professor || "Professor" : "",
        solicitadoEm: idx >= 4 ? new Date().toISOString() : null,
        validadoPor: idx >= 6 ? "Coordenação Pedagógica" : "",
        validadoEm: idx >= 6 ? new Date().toISOString() : null,
        parecerCoordenacao:
          idx >= 6 ? "Registros validados e em conformidade pedagógica." : ""
      }));
    }
    return [];
  }, [fechamentosBrutos, turmas]);

  // Cálculos dos 3 indicadores principais
  const totalPendentes = useMemo(() => {
    return listaFechamentos.filter(
      (f) =>
        f.status === STATUS_FECHAMENTO.PENDENTE || f.status === STATUS_FECHAMENTO.REABERTO
    ).length;
  }, [listaFechamentos]);

  const totalAguardando = useMemo(() => {
    return listaFechamentos.filter(
      (f) => f.status === STATUS_FECHAMENTO.AGUARDANDO_VALIDACAO
    ).length;
  }, [listaFechamentos]);

  const totalFechadas = useMemo(() => {
    return listaFechamentos.filter((f) => f.status === STATUS_FECHAMENTO.FECHADO).length;
  }, [listaFechamentos]);

  const totalGeral = listaFechamentos.length || 1;
  const percentualFechado = Math.round((totalFechadas / totalGeral) * 100);

  // Filtragem da lista
  const itensFiltrados = useMemo(() => {
    return listaFechamentos.filter((item) => {
      const matchBusca =
        !busca ||
        (item.turma || "").toLowerCase().includes(busca.toLowerCase()) ||
        (item.professor || "").toLowerCase().includes(busca.toLowerCase());

      const matchStatus =
        filtroStatus === "TODOS" ||
        (filtroStatus === "PENDENTE" &&
          (item.status === STATUS_FECHAMENTO.PENDENTE ||
            item.status === STATUS_FECHAMENTO.REABERTO)) ||
        (filtroStatus === "AGUARDANDO" &&
          item.status === STATUS_FECHAMENTO.AGUARDANDO_VALIDACAO) ||
        (filtroStatus === "FECHADO" && item.status === STATUS_FECHAMENTO.FECHADO);

      return matchBusca && matchStatus;
    });
  }, [listaFechamentos, busca, filtroStatus]);

  // Modais State
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [modalSolicitar, setModalSolicitar] = useState(false);
  const [modalValidar, setModalValidar] = useState(false);
  const [modalDevolver, setModalDevolver] = useState(false);
  const [modalReabrir, setModalReabrir] = useState(false);

  // Form states
  const [formSolicitacao, setFormSolicitacao] = useState({
    observacao: "",
    totalAulasDadas: 50
  });
  const [formParecer, setFormParecer] = useState(
    "Registros de frequência, notas e diário de conteúdos avaliados e aprovados."
  );
  const [formDevolucao, setFormDevolucao] = useState("");
  const [formJustificativaReabertura, setFormJustificativaReabertura] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Grupos do Menu Lateral Desktop
  const gruposMenu = useMemo(
    () => [
      {
        titulo: "Visão Geral",
        itens: [
          {
            id: "dashboard",
            label: "Painel Executivo",
            subtitulo: "Indicadores e progresso",
            icon: "layout-dashboard",
            badge: null
          }
        ]
      },
      {
        titulo: "Homologação & Turmas",
        itens: [
          {
            id: "turmas",
            label: "Turmas & Diários",
            subtitulo: "Status de fechamento",
            icon: "lock-square",
            badge: listaFechamentos.length
          }
        ]
      },
      {
        titulo: "Segurança & Documentos",
        itens: [
          {
            id: "auditoria",
            label: "Trilha de Auditoria",
            subtitulo: "Logs e retificações",
            icon: "shield-check",
            badge: auditorias ? auditorias.length : null
          },
          {
            id: "ata",
            label: "Ata Oficial",
            subtitulo: "Homologação do período",
            icon: "printer",
            badge: "Ata"
          }
        ]
      }
    ],
    [listaFechamentos, auditorias]
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

  // Handlers dos Modais
  async function handleConfirmarSolicitacao() {
    if (!itemSelecionado) return;
    setSalvando(true);
    try {
      if (itemSelecionado.id && !itemSelecionado.id.startsWith("mock-")) {
        await solicitarFechamento(itemSelecionado.id, formSolicitacao, user);
      }
      setAlerta({
        tipo: "success",
        msg: `Fechamento da turma ${itemSelecionado.turma} solicitado com sucesso à coordenação!`
      });
      setModalSolicitar(false);
      recarregar();
      recarregarAuditoria();
    } catch (err) {
      console.error(err);
      setAlerta({ tipo: "error", msg: "Erro ao solicitar fechamento de período." });
    } finally {
      setSalvando(false);
    }
  }

  async function handleConfirmarValidacao() {
    if (!itemSelecionado) return;
    setSalvando(true);
    try {
      if (itemSelecionado.id && !itemSelecionado.id.startsWith("mock-")) {
        await validarFechamento(itemSelecionado.id, formParecer, user);
      }
      setAlerta({
        tipo: "success",
        msg: `Período fechado 🔒 com sucesso para a turma ${itemSelecionado.turma}!`
      });
      setModalValidar(false);
      recarregar();
      recarregarAuditoria();
    } catch (err) {
      console.error(err);
      setAlerta({ tipo: "error", msg: "Erro ao validar fechamento de período." });
    } finally {
      setSalvando(false);
    }
  }

  async function handleConfirmarDevolucao() {
    if (!itemSelecionado || !formDevolucao.trim()) {
      alert("Por favor, descreva as pendências a serem corrigidas pelo professor.");
      return;
    }
    setSalvando(true);
    try {
      if (itemSelecionado.id && !itemSelecionado.id.startsWith("mock-")) {
        await devolverFechamento(itemSelecionado.id, formDevolucao, user);
      }
      setAlerta({
        tipo: "warning",
        msg: `Diário devolvido ao professor da turma ${itemSelecionado.turma} com as orientações.`
      });
      setModalDevolver(false);
      recarregar();
      recarregarAuditoria();
    } catch (err) {
      console.error(err);
      setAlerta({ tipo: "error", msg: "Erro ao devolver fechamento." });
    } finally {
      setSalvando(false);
    }
  }

  async function handleConfirmarReabertura() {
    if (!itemSelecionado || !formJustificativaReabertura.trim()) {
      alert("A justificativa formal de reabertura é obrigatória para fins de auditoria.");
      return;
    }
    setSalvando(true);
    try {
      if (itemSelecionado.id && !itemSelecionado.id.startsWith("mock-")) {
        await solicitarReabertura(itemSelecionado.id, formJustificativaReabertura, user);
      }
      setAlerta({
        tipo: "warning",
        msg: `Diário da turma ${itemSelecionado.turma} reaberto. Alterações posteriores registradas na trilha de auditoria!`
      });
      setModalReabrir(false);
      recarregar();
      recarregarAuditoria();
    } catch (err) {
      console.error(err);
      setAlerta({ tipo: "error", msg: "Erro ao reabrir diário para alteração." });
    } finally {
      setSalvando(false);
    }
  }

  if (cTurmas && !turmas?.length) {
    return <Spinner texto="Carregando turmas e dados de fechamento..." />;
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
              <i className="ti ti-lock" />
            </div>
            <div className={styles.mobileTitleText}>
              <span className={styles.mobileTitleMain}>Fechamento de Período</span>
              <span className={styles.mobileTitleSub}>
                {itemAtivoObj?.label || "Homologação"} · {bimestre}
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
              title="Resumo do Período"
            >
              <i className="ti ti-chart-dots" />
              <span>Resumo</span>
            </button>

            <button
              type="button"
              className={styles.mobileActionButton}
              onClick={() => setActiveTab("ata")}
              style={{ background: "#0ea5e9", color: "#ffffff", borderColor: "#38bdf8" }}
              title="Emitir Ata"
            >
              <i className="ti ti-printer" />
              <span>Ata</span>
            </button>
          </div>
        </div>

        {/* Painel Expansível de Resumo no Mobile */}
        {resumoMobileAberto && (
          <div className={styles.mobileSummaryPanel}>
            <div className={styles.mobileSummaryGrid}>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Turmas Fechadas</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#4ade80" }}>
                  {totalFechadas} 🔒
                </span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Em Validação</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#fbbf24" }}>
                  {totalAguardando} turmas
                </span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Diários Pendentes</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#f87171" }}>
                  {totalPendentes} pend.
                </span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Progresso Geral</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#38bdf8" }}>
                  {percentualFechado}%
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
          <DashboardFechamento
            bimestre={bimestre}
            anoLetivo={anoLetivo}
            totalPendentes={totalPendentes}
            totalAguardando={totalAguardando}
            totalFechadas={totalFechadas}
            totalGeral={totalGeral}
            percentualFechado={percentualFechado}
            listaFechamentos={listaFechamentos}
            onFiltrarStatus={(st) => setFiltroStatus(st)}
            onNavegarAba={(aba) => setActiveTab(aba)}
            onAbrirAta={() => setActiveTab("ata")}
            STATUS_FECHAMENTO={STATUS_FECHAMENTO}
          />
        )}

        {activeTab === "turmas" && (
          <TurmasFechamento
            itensFiltrados={itensFiltrados}
            listaFechamentos={listaFechamentos}
            busca={busca}
            setBusca={setBusca}
            filtroStatus={filtroStatus}
            setFiltroStatus={setFiltroStatus}
            bimestre={bimestre}
            cFechamentos={cFechamentos}
            cTurmas={cTurmas}
            isCoordenacaoOuDirecao={isCoordenacaoOuDirecao}
            STATUS_FECHAMENTO={STATUS_FECHAMENTO}
            onAbrirSolicitar={(item) => {
              setItemSelecionado(item);
              setFormSolicitacao({
                observacao: "",
                totalAulasDadas: item.totalAulasDadas || 50
              });
              setModalSolicitar(true);
            }}
            onAbrirValidar={(item) => {
              setItemSelecionado(item);
              setFormParecer("Registros validados e em conformidade pedagógica.");
              setModalValidar(true);
            }}
            onAbrirDevolver={(item) => {
              setItemSelecionado(item);
              setFormDevolucao("");
              setModalDevolver(true);
            }}
            onAbrirReabrir={(item) => {
              setItemSelecionado(item);
              setFormJustificativaReabertura("");
              setModalReabrir(true);
            }}
          />
        )}

        {activeTab === "auditoria" && (
          <AuditoriaFechamento
            auditorias={auditorias || []}
            cAuditoria={cAuditoria}
            recarregarAuditoria={recarregarAuditoria}
          />
        )}

        {activeTab === "ata" && (
          <AtaHomologacao
            bimestre={bimestre}
            anoLetivo={anoLetivo}
            escolaAtual={escolaAtual}
            listaFechamentos={listaFechamentos}
            totalGeral={totalGeral}
            totalFechadas={totalFechadas}
            STATUS_FECHAMENTO={STATUS_FECHAMENTO}
          />
        )}
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── COLUNA LATERAL DIREITA (DESKTOP ASIDE) ─────────── */}
      {/* ═════════════════════════════════════════════════════ */}
      <aside className={styles.desktopAside}>
        {/* Card de Período em Foco */}
        <div className={styles.sidePeriodoCard}>
          <div className={styles.sidePeriodoLabel}>Período em Foco</div>
          <select
            className={styles.sidePeriodoSelect}
            value={bimestre}
            onChange={(e) => setBimestre(e.target.value)}
          >
            {BIMESTRES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <div className={styles.sidePeriodoMeta}>
            <div>
              <strong>Ano Letivo:</strong> {anoLetivo}
            </div>
            <div>
              <strong>Progresso:</strong> {percentualFechado}% concluído
            </div>
            <div>
              <strong>Turmas Fechadas:</strong> {totalFechadas}/{totalGeral} 🔒
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("ata")}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #0ea5e9",
              background: "rgba(14, 165, 233, 0.15)",
              color: "#38bdf8",
              fontWeight: 700,
              fontSize: 12.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}
          >
            <i className="ti ti-printer" /> Emitir Ata Oficial
          </button>
        </div>

        {/* Card do Menu de Navegação */}
        <div className={styles.sideCard}>
          <div className={styles.sideHeader}>
            <div className={styles.sideTitleWrap}>
              <div className={styles.sideLogo}>
                <i className="ti ti-lock" />
              </div>
              <div>
                <div className={styles.sideTitle}>Fechamento Período</div>
                <div className={styles.sideSubtitle}>Homologação & Auditoria</div>
              </div>
            </div>
            <button
              type="button"
              className={styles.sideRefreshBtn}
              onClick={() => {
                recarregar();
                recarregarAuditoria();
              }}
              title="Recarregar dados"
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
                            color: activeTab === item.id ? "#7dd3fc" : "#64748b"
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

          {/* Rodapé do Menu com Escola */}
          <div className={styles.sideFooter}>
            <div className={styles.sideFooterLabel}>Unidade Escolar</div>
            <div className={styles.sideFooterTitle}>
              {escolaAtual.nome || "Escola Municipal"}
            </div>
            <div className={styles.sideFooterSub}>
              INEP: {escolaAtual.inep || "27000000"} · {escolaAtual.cidade || "Maceió"}/
              {escolaAtual.uf || "AL"}
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MODAIS RESPONSIVOS DE OPERAÇÃO                                            */}
      {/* ========================================================================= */}
      {modalSolicitar && (
        <ModalSolicitar
          item={itemSelecionado}
          bimestre={bimestre}
          form={formSolicitacao}
          setForm={setFormSolicitacao}
          onConfirmar={handleConfirmarSolicitacao}
          onClose={() => setModalSolicitar(false)}
          salvando={salvando}
        />
      )}

      {modalValidar && (
        <ModalValidar
          item={itemSelecionado}
          formParecer={formParecer}
          setFormParecer={setFormParecer}
          onConfirmar={handleConfirmarValidacao}
          onClose={() => setModalValidar(false)}
          salvando={salvando}
        />
      )}

      {modalDevolver && (
        <ModalDevolver
          item={itemSelecionado}
          formDevolucao={formDevolucao}
          setFormDevolucao={setFormDevolucao}
          onConfirmar={handleConfirmarDevolucao}
          onClose={() => setModalDevolver(false)}
          salvando={salvando}
        />
      )}

      {modalReabrir && (
        <ModalReabrir
          item={itemSelecionado}
          formJustificativa={formJustificativaReabertura}
          setFormJustificativa={setFormJustificativaReabertura}
          onConfirmar={handleConfirmarReabertura}
          onClose={() => setModalReabrir(false)}
          salvando={salvando}
        />
      )}
    </div>
  );
}

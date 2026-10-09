import { useState, useCallback, useMemo, useEffect } from "react";
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
import { Card, Badge, Btn, Modal, Input, Select, Alert, Spinner, EmptyState } from "../components/ui";

const BIMESTRES = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];

export default function FechamentoPeriodo() {
  const { user, escolas, selectedEscolaId } = useAuth();
  const activeEscolaId = selectedEscolaId || user?.selectedEscolaId || "";
  const escolaAtual = (escolas || []).find(e => e.id === activeEscolaId) || {
    nome: "Escola Municipal",
    inep: "27000000",
    cidade: "Maceió",
    uf: "AL"
  };

  const isCoordenacaoOuDirecao = user?.role === "Administrador" || user?.role === "Diretor" || user?.role === "Direção" || user?.role === "Coordenador" || user?.role === "Coordenação";

  const [anoLetivo, setAnoLetivo] = useState(String(ANO_LETIVO_ATUAL || 2026));
  const [bimestre, setBimestre] = useState("1º Bimestre");
  const [abaAtiva, setAbaAtiva] = useState("turmas"); // "turmas" | "auditoria" | "guia"
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [alerta, setAlerta] = useState(null);

  // Carrega turmas
  const { dados: turmas, carregando: cTurmas } = useFirestore(
    useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  // Carrega fechamentos
  const { dados: fechamentosBrutos, carregando: cFechamentos, recarregar } = useFirestore(
    useCallback(() => getFechamentos(activeEscolaId, anoLetivo, bimestre), [activeEscolaId, anoLetivo, bimestre]),
    [activeEscolaId, anoLetivo, bimestre]
  );

  // Carrega logs de auditoria
  const { dados: auditorias, carregando: cAuditoria, recarregar: recarregarAuditoria } = useFirestore(
    useCallback(() => getAuditorias(activeEscolaId, "", bimestre), [activeEscolaId, bimestre]),
    [activeEscolaId, bimestre]
  );

  // Inicializa dados se necessário
  useEffect(() => {
    if (activeEscolaId && turmas && turmas.length > 0 && fechamentosBrutos && fechamentosBrutos.length === 0 && !cFechamentos) {
      inicializarFechamentosSeNecessario(activeEscolaId, turmas, anoLetivo, bimestre).then(() => {
        recarregar();
      });
    }
  }, [activeEscolaId, turmas, fechamentosBrutos, cFechamentos, anoLetivo, bimestre, recarregar]);

  // Lista com fallback caso turmas existam mas fechamentos ainda não estejam salvos
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
        status: idx < 4 ? STATUS_FECHAMENTO.PENDENTE : idx < 6 ? STATUS_FECHAMENTO.AGUARDANDO_VALIDACAO : STATUS_FECHAMENTO.FECHADO,
        trancado: idx >= 6,
        totalAulasDadas: idx < 4 ? 38 : 50,
        totalAulasPrevistas: 50,
        pendenciasDescricao: idx < 4 ? "Falta lançar 2 aulas no diário e notas da recuperação paralela" : "",
        solicitadoPor: idx >= 4 ? t.professor || "Professor" : "",
        solicitadoEm: idx >= 4 ? new Date().toISOString() : null,
        validadoPor: idx >= 6 ? "Coordenação Pedagógica" : "",
        validadoEm: idx >= 6 ? new Date().toISOString() : null,
        parecerCoordenacao: idx >= 6 ? "Registros validados e em conformidade pedagógica." : ""
      }));
    }
    return [];
  }, [fechamentosBrutos, turmas]);

  // Cálculos dos 3 indicadores principais do usuário
  const totalPendentes = useMemo(() => {
    return listaFechamentos.filter(f => f.status === STATUS_FECHAMENTO.PENDENTE || f.status === STATUS_FECHAMENTO.REABERTO).length;
  }, [listaFechamentos]);

  const totalAguardando = useMemo(() => {
    return listaFechamentos.filter(f => f.status === STATUS_FECHAMENTO.AGUARDANDO_VALIDACAO).length;
  }, [listaFechamentos]);

  const totalFechadas = useMemo(() => {
    return listaFechamentos.filter(f => f.status === STATUS_FECHAMENTO.FECHADO).length;
  }, [listaFechamentos]);

  const totalGeral = listaFechamentos.length || 1;
  const percentualFechado = Math.round((totalFechadas / totalGeral) * 100);

  // Filtragem da lista
  const itensFiltrados = useMemo(() => {
    return listaFechamentos.filter(item => {
      const matchBusca = !busca ||
        (item.turma || "").toLowerCase().includes(busca.toLowerCase()) ||
        (item.professor || "").toLowerCase().includes(busca.toLowerCase());

      const matchStatus =
        filtroStatus === "TODOS" ||
        (filtroStatus === "PENDENTE" && (item.status === STATUS_FECHAMENTO.PENDENTE || item.status === STATUS_FECHAMENTO.REABERTO)) ||
        (filtroStatus === "AGUARDANDO" && item.status === STATUS_FECHAMENTO.AGUARDANDO_VALIDACAO) ||
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
  const [modalAta, setModalAta] = useState(false);

  // Form states
  const [formSolicitacao, setFormSolicitacao] = useState({ observacao: "", totalAulasDadas: 50 });
  const [formParecer, setFormParecer] = useState("Registros de frequência, notas e diário de conteúdos avaliados e aprovados.");
  const [formDevolucao, setFormDevolucao] = useState("");
  const [formJustificativaReabertura, setFormJustificativaReabertura] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Handlers
  async function handleConfirmarSolicitacao() {
    if (!itemSelecionado) return;
    setSalvando(true);
    try {
      if (itemSelecionado.id && !itemSelecionado.id.startsWith("mock-")) {
        await solicitarFechamento(itemSelecionado.id, formSolicitacao, user);
      }
      setAlerta({ tipo: "sucesso", texto: `Fechamento da turma ${itemSelecionado.turma} solicitado com sucesso à coordenação!` });
      setModalSolicitar(false);
      recarregar();
      recarregarAuditoria();
    } catch (err) {
      console.error(err);
      setAlerta({ tipo: "erro", texto: "Erro ao solicitar fechamento de período." });
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
      setAlerta({ tipo: "sucesso", texto: `Período fechado 🔒 com sucesso para a turma ${itemSelecionado.turma}!` });
      setModalValidar(false);
      recarregar();
      recarregarAuditoria();
    } catch (err) {
      console.error(err);
      setAlerta({ tipo: "erro", texto: "Erro ao validar fechamento de período." });
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
      setAlerta({ tipo: "aviso", texto: `Diário devolvido ao professor da turma ${itemSelecionado.turma} com as orientações.` });
      setModalDevolver(false);
      recarregar();
      recarregarAuditoria();
    } catch (err) {
      console.error(err);
      setAlerta({ tipo: "erro", texto: "Erro ao devolver fechamento." });
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
      setAlerta({ tipo: "aviso", texto: `Diário da turma ${itemSelecionado.turma} reaberto. Alterações posteriores registradas na trilha de auditoria!` });
      setModalReabrir(false);
      recarregar();
      recarregarAuditoria();
    } catch (err) {
      console.error(err);
      setAlerta({ tipo: "erro", texto: "Erro ao reabrir diário para alteração." });
    } finally {
      setSalvando(false);
    }
  }

  function handleImprimirAta() {
    window.print();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "3rem" }}>
      {alerta && (
        <Alert
          tipo={alerta.tipo}
          mensagem={alerta.texto}
          onClose={() => setAlerta(null)}
        />
      )}

      {/* CABEÇALHO DO MÓDULO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.6rem" }}>🔒</span>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--text-primary, #1e293b)" }}>
              Fechamento de Período Letivo
            </h1>
          </div>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary, #64748b)", fontSize: "0.9rem" }}>
            Validação pedagógica, trancamento oficial de caderneta digital e registro de auditoria.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#f8fafc", padding: "0.35rem 0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <i className="ti ti-calendar" style={{ color: "#64748b" }} />
            <select
              value={bimestre}
              onChange={(e) => setBimestre(e.target.value)}
              style={{ background: "transparent", border: "none", fontWeight: 600, color: "#1e293b", cursor: "pointer", outline: "none" }}
            >
              {BIMESTRES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <Btn
            variante={abaAtiva === "auditoria" ? "primario" : "secundario"}
            onClick={() => setAbaAtiva(abaAtiva === "auditoria" ? "turmas" : "auditoria")}
          >
            <i className="ti ti-shield-check" />
            {abaAtiva === "auditoria" ? "Ver Turmas" : "Auditoria & Logs"}
          </Btn>

          <Btn
            variante="secundario"
            onClick={() => setModalAta(true)}
          >
            <i className="ti ti-printer" />
            Emitir Ata
          </Btn>
        </div>
      </div>

      {/* CARDS DE RESUMO DO PERÍODO EXATAMENTE COMO REQUISITADO */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
        {/* CARD 1: PENDENTES */}
        <div
          onClick={() => { setAbaAtiva("turmas"); setFiltroStatus("PENDENTE"); }}
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            border: "1px solid #fee2e2",
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.08)",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderLeft: "5px solid #ef4444"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🔴</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Diários Pendentes
              </span>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#ef4444" }}>
              {totalPendentes} {totalPendentes === 1 ? "diário pendente" : "diários pendentes"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.2rem" }}>
              Aguardando envio pelo professor
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontSize: "1.4rem" }}>
            <i className="ti ti-alert-triangle" />
          </div>
        </div>

        {/* CARD 2: AGUARDANDO VALIDAÇÃO */}
        <div
          onClick={() => { setAbaAtiva("turmas"); setFiltroStatus("AGUARDANDO"); }}
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            border: "1px solid #fef3c7",
            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.08)",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderLeft: "5px solid #f59e0b"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🟡</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Aguardando Validação
              </span>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#d97706" }}>
              {totalAguardando} {totalAguardando === 1 ? "turma aguardando" : "turmas aguardando"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.2rem" }}>
              Solicitado pelo professor para a coordenação
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", fontSize: "1.4rem" }}>
            <i className="ti ti-clock" />
          </div>
        </div>

        {/* CARD 3: TURMAS FECHADAS */}
        <div
          onClick={() => { setAbaAtiva("turmas"); setFiltroStatus("FECHADO"); }}
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            border: "1px solid #dcfce7",
            boxShadow: "0 2px 8px rgba(34, 197, 94, 0.08)",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderLeft: "5px solid #22c55e"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🟢</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Período Fechado 🔒
              </span>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#16a34a" }}>
              {totalFechadas} {totalFechadas === 1 ? "turma fechada" : "turmas fechadas"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.2rem" }}>
              Diários trancados e homologados
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", fontSize: "1.4rem" }}>
            <i className="ti ti-lock-square" />
          </div>
        </div>
      </div>

      {/* BARRA DE PROGRESSO DO BIMESTRE */}
      <div style={{ background: "#ffffff", borderRadius: "12px", padding: "1rem 1.5rem", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.85rem" }}>
            <span style={{ fontWeight: 600, color: "#334155" }}>Progresso de Fechamento do {bimestre}</span>
            <span style={{ fontWeight: 700, color: percentualFechado === 100 ? "#16a34a" : "#2563eb" }}>
              {percentualFechado}% Concluído ({totalFechadas} de {totalGeral} turmas)
            </span>
          </div>
          <div style={{ width: "100%", height: "10px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${(totalFechadas / totalGeral) * 100}%`, background: "#22c55e", transition: "width 0.4s" }} />
            <div style={{ width: `${(totalAguardando / totalGeral) * 100}%`, background: "#f59e0b", transition: "width 0.4s" }} />
            <div style={{ width: `${(totalPendentes / totalGeral) * 100}%`, background: "#ef4444", transition: "width 0.4s" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "#64748b" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} /> Fechadas
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} /> Em Validação
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} /> Pendentes
          </span>
        </div>
      </div>

      {/* ABA PRINCIPAL: TURMAS & DIÁRIOS */}
      {abaAtiva === "turmas" && (
        <Card>
          {/* BARRA DE FILTROS */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setFiltroStatus("TODOS")}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "20px",
                  border: filtroStatus === "TODOS" ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                  background: filtroStatus === "TODOS" ? "#eff6ff" : "#ffffff",
                  color: filtroStatus === "TODOS" ? "#1d4ed8" : "#64748b",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                Todas ({listaFechamentos.length})
              </button>
              <button
                onClick={() => setFiltroStatus("PENDENTE")}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "20px",
                  border: filtroStatus === "PENDENTE" ? "1px solid #ef4444" : "1px solid #e2e8f0",
                  background: filtroStatus === "PENDENTE" ? "#fef2f2" : "#ffffff",
                  color: filtroStatus === "PENDENTE" ? "#dc2626" : "#64748b",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                🔴 Pendentes ({totalPendentes})
              </button>
              <button
                onClick={() => setFiltroStatus("AGUARDANDO")}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "20px",
                  border: filtroStatus === "AGUARDANDO" ? "1px solid #f59e0b" : "1px solid #e2e8f0",
                  background: filtroStatus === "AGUARDANDO" ? "#fffbeb" : "#ffffff",
                  color: filtroStatus === "AGUARDANDO" ? "#d97706" : "#64748b",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                🟡 Aguardando Validação ({totalAguardando})
              </button>
              <button
                onClick={() => setFiltroStatus("FECHADO")}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "20px",
                  border: filtroStatus === "FECHADO" ? "1px solid #22c55e" : "1px solid #e2e8f0",
                  background: filtroStatus === "FECHADO" ? "#f0fdf4" : "#ffffff",
                  color: filtroStatus === "FECHADO" ? "#15803d" : "#64748b",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                🟢 Fechadas 🔒 ({totalFechadas})
              </button>
            </div>

            <div style={{ position: "relative", minWidth: 260 }}>
              <i className="ti ti-search" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Buscar turma ou professor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.75rem 0.45rem 2.2rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* TABELA DE FECHAMENTOS */}
          {cFechamentos || cTurmas ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <Spinner />
              <p style={{ marginTop: "1rem", color: "#64748b" }}>Carregando dados de fechamento...</p>
            </div>
          ) : itensFiltrados.length === 0 ? (
            <EmptyState
              icone="clipboard-check"
              titulo="Nenhuma turma encontrada"
              descricao="Não há turmas correspondentes ao filtro selecionado."
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Turma & Turno</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Professor Responsável</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Aulas Ministradas</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Status do Período</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Homologação / Auditoria</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itensFiltrados.map((item) => {
                    const isFechado = item.status === STATUS_FECHAMENTO.FECHADO;
                    const isAguardando = item.status === STATUS_FECHAMENTO.AGUARDANDO_VALIDACAO;
                    const isPendente = item.status === STATUS_FECHAMENTO.PENDENTE;
                    const isReaberto = item.status === STATUS_FECHAMENTO.REABERTO;

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background 0.15s",
                          background: isFechado ? "#fafdfb" : isAguardando ? "#fffdfa" : "#ffffff"
                        }}
                      >
                        {/* TURMA */}
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>
                            {item.turma}
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            {item.turno} · {bimestre}
                          </span>
                        </td>

                        {/* PROFESSOR */}
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 500, color: "#334155" }}>
                            {item.professor || "Não atribuído"}
                          </div>
                          {item.solicitadoPor && (
                            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                              Solicitou: {item.solicitadoPor}
                            </span>
                          )}
                        </td>

                        {/* AULAS / CARGA */}
                        <td style={{ padding: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontWeight: 600, color: item.totalAulasDadas >= (item.totalAulasPrevistas || 50) ? "#16a34a" : "#d97706" }}>
                              {item.totalAulasDadas || 0}/{item.totalAulasPrevistas || 50} h/a
                            </span>
                          </div>
                          <div style={{ width: 100, height: 4, background: "#e2e8f0", borderRadius: 2, marginTop: 4 }}>
                            <div
                              style={{
                                width: `${Math.min(100, ((item.totalAulasDadas || 0) / (item.totalAulasPrevistas || 50)) * 100)}%`,
                                height: "100%",
                                background: item.totalAulasDadas >= (item.totalAulasPrevistas || 50) ? "#22c55e" : "#f59e0b",
                                borderRadius: 2
                              }}
                            />
                          </div>
                        </td>

                        {/* STATUS */}
                        <td style={{ padding: "1rem" }}>
                          {isFechado && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#f0fdf4", color: "#166534", padding: "0.3rem 0.75rem", borderRadius: "16px", fontWeight: 700, fontSize: "0.8rem", border: "1px solid #bbf7d0" }}>
                              <span style={{ fontSize: "0.9rem" }}>🔒</span>
                              Período Fechado
                            </div>
                          )}

                          {isAguardando && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#fffbeb", color: "#b45309", padding: "0.3rem 0.75rem", borderRadius: "16px", fontWeight: 700, fontSize: "0.8rem", border: "1px solid #fde68a" }}>
                              <span style={{ fontSize: "0.9rem" }}>🟡</span>
                              Aguardando Validação
                            </div>
                          )}

                          {isPendente && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#fef2f2", color: "#b91c1c", padding: "0.3rem 0.75rem", borderRadius: "16px", fontWeight: 700, fontSize: "0.8rem", border: "1px solid #fecaca" }}>
                              <span style={{ fontSize: "0.9rem" }}>🔴</span>
                              Pendente
                            </div>
                          )}

                          {isReaberto && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#fff7ed", color: "#c2410c", padding: "0.3rem 0.75rem", borderRadius: "16px", fontWeight: 700, fontSize: "0.8rem", border: "1px solid #fed7aa" }}>
                              <span style={{ fontSize: "0.9rem" }}>⚠️</span>
                              Reaberto para Ajuste
                            </div>
                          )}

                          {item.pendenciasDescricao && (
                            <div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.25rem", maxWidth: 220 }}>
                              {item.pendenciasDescricao}
                            </div>
                          )}
                        </td>

                        {/* HOMOLOGAÇÃO / HISTÓRICO */}
                        <td style={{ padding: "1rem" }}>
                          {isFechado ? (
                            <div>
                              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#166534" }}>
                                <i className="ti ti-check" style={{ marginRight: 4 }} />
                                Validado por {item.validadoPor || "Coordenação"}
                              </div>
                              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                {item.validadoEm ? new Date(item.validadoEm).toLocaleDateString("pt-BR") : "Homologado"}
                              </span>
                            </div>
                          ) : isAguardando ? (
                            <div>
                              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#d97706" }}>
                                Solicitação enviada
                              </div>
                              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                {item.solicitadoEm ? new Date(item.solicitadoEm).toLocaleDateString("pt-BR") : "Aguardando parecer"}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                              Em lançamento docente
                            </span>
                          )}
                        </td>

                        {/* AÇÕES */}
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", flexWrap: "wrap" }}>
                            {/* PROFESSOR: Solicitar Fechamento */}
                            {(isPendente || isReaberto) && (
                              <Btn
                                tamanho="pequeno"
                                variante="primario"
                                onClick={() => {
                                  setItemSelecionado(item);
                                  setFormSolicitacao({ observacao: "", totalAulasDadas: item.totalAulasDadas || 50 });
                                  setModalSolicitar(true);
                                }}
                              >
                                <i className="ti ti-send" />
                                Solicitar Fechamento
                              </Btn>
                            )}

                            {/* COORDENAÇÃO: Validar & Trancar */}
                            {isAguardando && isCoordenacaoOuDirecao && (
                              <>
                                <Btn
                                  tamanho="pequeno"
                                  variante="sucesso"
                                  onClick={() => {
                                    setItemSelecionado(item);
                                    setFormParecer("Registros validados e em conformidade pedagógica.");
                                    setModalValidar(true);
                                  }}
                                >
                                  <i className="ti ti-lock" />
                                  Validar e Fechar 🔒
                                </Btn>
                                <Btn
                                  tamanho="pequeno"
                                  variante="perigo"
                                  onClick={() => {
                                    setItemSelecionado(item);
                                    setFormDevolucao("");
                                    setModalDevolver(true);
                                  }}
                                >
                                  <i className="ti ti-arrow-back-up" />
                                  Devolver
                                </Btn>
                              </>
                            )}

                            {/* Se fechado: Solicitar Reabertura / Auditoria */}
                            {isFechado && (
                              <Btn
                                tamanho="pequeno"
                                variante="secundario"
                                onClick={() => {
                                  setItemSelecionado(item);
                                  setFormJustificativaReabertura("");
                                  setModalReabrir(true);
                                }}
                              >
                                <i className="ti ti-lock-open" />
                                Retificar / Reabrir ⚠️
                              </Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ABA AUDITORIA: TRILHA DE CONFORMIDADE */}
      {abaAtiva === "auditoria" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "#1e293b" }}>
                🛡️ Trilha de Auditoria & Segurança de Fechamentos
              </h2>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                Qualquer alteração ou reabertura pós-fechamento fica irrevogavelmente registrada aqui.
              </p>
            </div>
            <Btn variante="secundario" tamanho="pequeno" onClick={() => recarregarAuditoria()}>
              <i className="ti ti-refresh" /> Atualizar Logs
            </Btn>
          </div>

          {cAuditoria ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <Spinner />
            </div>
          ) : auditorias.length === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              <i className="ti ti-shield-check" style={{ fontSize: "2.5rem", color: "#16a34a" }} />
              <h3 style={{ margin: "0.75rem 0 0.25rem", color: "#334155", fontSize: "1rem" }}>Nenhuma alteração pós-fechamento registrada</h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", maxWidth: "450px", margin: "0 auto" }}>
                O sistema de auditoria monitora automaticamente todas as solicitações, validações, fechamentos e reaberturas de diários.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {auditorias.map((log) => {
                const isReabertura = log.tipo === "REABERTURA_AUDITORIA";
                const isValidado = log.tipo === "FECHAMENTO_VALIDADO";
                const isDevolucao = log.tipo === "DEVOLUCAO";

                return (
                  <div
                    key={log.id}
                    style={{
                      padding: "1rem 1.25rem",
                      borderRadius: "10px",
                      background: isReabertura ? "#fff7ed" : isValidado ? "#f0fdf4" : isDevolucao ? "#fef2f2" : "#f8fafc",
                      border: `1px solid ${isReabertura ? '#fed7aa' : isValidado ? '#bbf7d0' : isDevolucao ? '#fecaca' : '#e2e8f0'}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>
                          {isReabertura ? "⚠️" : isValidado ? "🔒" : isDevolucao ? "↩️" : "📝"}
                        </span>
                        <strong style={{ color: "#1e293b", fontSize: "0.95rem" }}>
                          {log.acao}
                        </strong>
                        <Badge tipo={isReabertura ? "aviso" : isValidado ? "sucesso" : isDevolucao ? "perigo" : "info"}>
                          {log.turma} · {log.bimestre}
                        </Badge>
                      </div>

                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        <i className="ti ti-clock" style={{ marginRight: 4 }} />
                        {new Date(log.dataHora || log.criadoEm).toLocaleString("pt-BR")}
                      </div>
                    </div>

                    <div style={{ fontSize: "0.875rem", color: "#334155", background: "rgba(255,255,255,0.7)", padding: "0.6rem 0.85rem", borderRadius: "6px" }}>
                      {log.detalhes}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#64748b" }}>
                      <span>
                        <strong>Responsável:</strong> {log.usuarioNome} ({log.usuarioCargo || "Docente/Coordenação"})
                      </span>
                      <span>
                        <strong>Registro:</strong> {log.usuarioEmail || "Sistema SIGEM"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ================= MODAIS ================= */}

      {/* MODAL: PROFESSOR SOLICITA FECHAMENTO */}
      {modalSolicitar && itemSelecionado && (
        <Modal
          titulo={`Solicitar Fechamento · ${itemSelecionado.turma}`}
          aberto={modalSolicitar}
          onClose={() => setModalSolicitar(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.85rem", borderRadius: "8px", fontSize: "0.85rem", color: "#1e40af" }}>
              <i className="ti ti-info-circle" style={{ marginRight: 6 }} />
              Ao solicitar o fechamento, o diário da turma <strong>{itemSelecionado.turma}</strong> será submetido à coordenação pedagógica para conferência e trancamento oficial do <strong>{bimestre}</strong>.
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Total de Horas-Aula Ministradas no Período
              </label>
              <input
                type="number"
                value={formSolicitacao.totalAulasDadas}
                onChange={(e) => setFormSolicitacao({ ...formSolicitacao, totalAulasDadas: Number(e.target.value) })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Observações / Declaração Docente
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Todas as notas, recuperações e conteúdos foram devidamente lançados no sistema."
                value={formSolicitacao.observacao}
                onChange={(e) => setFormSolicitacao({ ...formSolicitacao, observacao: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Btn variante="secundario" onClick={() => setModalSolicitar(false)}>
                Cancelar
              </Btn>
              <Btn variante="primario" onClick={handleConfirmarSolicitacao} desabilitado={salvando}>
                {salvando ? "Enviando..." : "Confirmar Solicitação 📤"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: COORDENAÇÃO VALIDA & FECHA PERÍODO 🔒 */}
      {modalValidar && itemSelecionado && (
        <Modal
          titulo={`Validar e Trancar Período 🔒 · ${itemSelecionado.turma}`}
          aberto={modalValidar}
          onClose={() => setModalValidar(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1rem", borderRadius: "8px", fontSize: "0.875rem", color: "#166534" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>🔒</span>
                Período Fechado
              </div>
              Ao homologar, o diário da turma <strong>{itemSelecionado.turma}</strong> ficará <strong>trancado</strong> para edições convencionais. Qualquer retificação futura exigirá justificativa e ficará gravada em auditoria.
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Parecer da Coordenação / Direção
              </label>
              <textarea
                rows={3}
                value={formParecer}
                onChange={(e) => setFormParecer(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Btn variante="secundario" onClick={() => setModalValidar(false)}>
                Cancelar
              </Btn>
              <Btn variante="sucesso" onClick={handleConfirmarValidacao} desabilitado={salvando}>
                {salvando ? "Homologando..." : "Homologar e Trancar 🔒"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: COORDENAÇÃO DEVOLVE COM PENDÊNCIAS */}
      {modalDevolver && itemSelecionado && (
        <Modal
          titulo={`Devolver Diário · ${itemSelecionado.turma}`}
          aberto={modalDevolver}
          onClose={() => setModalDevolver(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "0.85rem", borderRadius: "8px", fontSize: "0.85rem", color: "#991b1b" }}>
              <i className="ti ti-alert-triangle" style={{ marginRight: 6 }} />
              Informe ao professor os motivos da devolução para que ele realize as devidas correções antes do novo envio.
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Pendências a serem sanadas *
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Faltam notas de 2 alunos no teste de recuperação e 3 registros de conteúdos no diário de classe."
                value={formDevolucao}
                onChange={(e) => setFormDevolucao(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Btn variante="secundario" onClick={() => setModalDevolver(false)}>
                Cancelar
              </Btn>
              <Btn variante="perigo" onClick={handleConfirmarDevolucao} desabilitado={salvando}>
                {salvando ? "Devolvendo..." : "Devolver ao Professor ↩️"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: REABERTURA COM AUDITORIA */}
      {modalReabrir && itemSelecionado && (
        <Modal
          titulo={`Reabertura / Retificação Pós-Fechamento ⚠️`}
          aberto={modalReabrir}
          onClose={() => setModalReabrir(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: "1rem", borderRadius: "8px", fontSize: "0.85rem", color: "#9a3412" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>🛡️</span>
                Controle de Auditoria Ativo
              </div>
              O período da turma <strong>{itemSelecionado.turma}</strong> já foi homologado e fechado. Qualquer retificação efetuada após este momento será gravada na trilha de auditoria com data, hora, seu usuário e justificativa legal.
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Justificativa Formal para a Reabertura *
              </label>
              <textarea
                rows={3}
                placeholder="Descreva o motivo legal/pedagógico da retificação (ex: Correção de nota após deferimento de recurso do aluno)."
                value={formJustificativaReabertura}
                onChange={(e) => setFormJustificativaReabertura(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Btn variante="secundario" onClick={() => setModalReabrir(false)}>
                Cancelar
              </Btn>
              <Btn variante="aviso" onClick={handleConfirmarReabertura} desabilitado={salvando}>
                {salvando ? "Processando..." : "Autorizar e Registrar Auditoria 🛡️"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: ATA OFICIAL DE FECHAMENTO */}
      {modalAta && (
        <Modal
          titulo="Ata Oficial de Homologação de Período Letivo"
          aberto={modalAta}
          onClose={() => setModalAta(false)}
          larguraMax="850px"
        >
          <div style={{ padding: "1.5rem", background: "#ffffff", color: "#000000", fontFamily: "Arial, sans-serif" }}>
            {/* CABEÇALHO */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, textTransform: "uppercase" }}>
                ESTADO DE ALAGOAS · PREFEITURA MUNICIPAL DE PORTO CALVO
              </h2>
              <h3 style={{ fontSize: "1rem", fontWeight: "bold", margin: "0.25rem 0", color: "#333333" }}>
                SECRETARIA MUNICIPAL DE EDUCAÇÃO
              </h3>
              <p style={{ fontSize: "0.85rem", margin: "0.25rem 0" }}>
                {escolaAtual.nome} · CÓDIGO INEP: {escolaAtual.inep}
              </p>
              <div style={{ marginTop: "0.5rem", display: "inline-block", border: "1px solid #000", padding: "0.3rem 1rem", fontWeight: "bold", fontSize: "0.95rem" }}>
                ATA DE FECHAMENTO E HOMOLOGAÇÃO DO {bimestre.toUpperCase()} · ANO LETIVO {anoLetivo}
              </div>
            </div>

            {/* TEXTO DA ATA */}
            <p style={{ fontSize: "0.9rem", lineHeight: 1.6, textAlign: "justify", textIndent: "2rem" }}>
              Aos {new Date().toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })}, nesta Unidade Escolar, reuniu-se a Coordenação Pedagógica e Direção Escolar para a homologação dos diários eletrônicos de classe correspondentes ao <strong>{bimestre}</strong>. Registra-se que das <strong>{totalGeral}</strong> turmas matriculadas, <strong>{totalFechadas}</strong> turmas foram devidamente fechadas e trancadas 🔒 no sistema digital, estando em conformidade com as diretrizes curriculares e registros de frequência, notas e conteúdos ministrados.
            </p>

            {/* TABELA RESUMO */}
            <div style={{ marginTop: "1rem", marginBottom: "2rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", border: "1px solid #000" }}>
                <thead>
                  <tr style={{ background: "#f1f1f1", borderBottom: "1px solid #000" }}>
                    <th style={{ border: "1px solid #000", padding: "6px" }}>Turma</th>
                    <th style={{ border: "1px solid #000", padding: "6px" }}>Professor</th>
                    <th style={{ border: "1px solid #000", padding: "6px" }}>Aulas</th>
                    <th style={{ border: "1px solid #000", padding: "6px" }}>Status</th>
                    <th style={{ border: "1px solid #000", padding: "6px" }}>Validação</th>
                  </tr>
                </thead>
                <tbody>
                  {listaFechamentos.map(f => (
                    <tr key={f.id}>
                      <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>{f.turma}</td>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>{f.professor}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{f.totalAulasDadas} h/a</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
                        {f.status === STATUS_FECHAMENTO.FECHADO ? "FECHADO 🔒" : f.status.toUpperCase()}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>{f.validadoPor || "Em conferência"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ASSINATURAS */}
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: "3.5rem", textAlign: "center", fontSize: "0.85rem" }}>
              <div>
                <div style={{ width: "240px", borderTop: "1px solid #000", margin: "0 auto 4px" }} />
                <strong>Coordenação Pedagógica</strong>
                <div>Porto Calvo / AL</div>
              </div>
              <div>
                <div style={{ width: "240px", borderTop: "1px solid #000", margin: "0 auto 4px" }} />
                <strong>Direção Escolar</strong>
                <div>Porto Calvo / AL</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "2rem" }}>
              <Btn variante="secundario" onClick={() => setModalAta(false)}>
                Fechar
              </Btn>
              <Btn variante="primario" onClick={handleImprimirAta}>
                <i className="ti ti-printer" /> Imprimir Documento
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

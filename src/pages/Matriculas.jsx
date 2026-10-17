import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import {
  getAlunos,
  rematricularAlunosLote,
  rematricularAluno,
  remanejarAluno,
  remanejarAlunosLote
} from "../services/alunosService";
import { getTurmas } from "../services/turmasService";
import { getSolicitacoesMatricula } from "../services/matriculaOnlineService";
import SolicitacoesMatriculaOnline from "./matriculas/components/SolicitacoesMatriculaOnline";
import { ANO_LETIVO_ATUAL } from "../utils/constants";
import { Card, Badge, Btn, Modal, Select, Input, Alert, Spinner, EmptyState, ProgressBar } from "../components/ui";
import styles from "./Matriculas.module.css";


export default function Matriculas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeEscolaId = user?.selectedEscolaId || "";

  const { dados: alunos, carregando: cA, recarregar: recarregarAlunos } = useFirestore(
    useCallback(() => getAlunos(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );
  const { dados: turmas, carregando: cT } = useFirestore(
    useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );
  const { dados: solicitacoes, carregando: cS, recarregar: recarregarSolicitacoes } = useFirestore(
    useCallback(() => getSolicitacoesMatricula(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  const solicitacoesPendentes = useMemo(() => {
    return (solicitacoes || []).filter(s => s.status === "Pendente");
  }, [solicitacoes]);

  const [abaAtiva, setAbaAtiva] = useState("online"); // 'online', 'vagas', 'rematricula_lote', 'rematricula_individual', 'remanejamento'
  const [alerta, setAlerta] = useState(null);

  // Estados de Rematrícula em Lote
  const [turmaOrigemLote, setTurmaOrigemLote] = useState("");
  const [turmaDestinoLote, setTurmaDestinoLote] = useState("");
  const [alunosSelecionadosLote, setAlunosSelecionadosLote] = useState([]);
  const [salvandoLote, setSalvandoLote] = useState(false);

  // Estados de Rematrícula Individual
  const [alunoRematricula, setAlunoRematricula] = useState(null);
  const [novaTurmaIndividual, setNovaTurmaIndividual] = useState("");
  const [salvandoIndividual, setSalvandoIndividual] = useState(false);
  const [buscaRematricula, setBuscaRematricula] = useState("");
  const [filtroTurmaRematricula, setFiltroTurmaRematricula] = useState("");

  // Estados de Remanejamento de Turmas
  const [subAbaRemanejamento, setSubAbaRemanejamento] = useState("individual"); // 'individual', 'lote', 'historico'
  const [buscaRemanejamento, setBuscaRemanejamento] = useState("");
  const [filtroTurmaRemanejamento, setFiltroTurmaRemanejamento] = useState("");
  const [alunoRemanejamento, setAlunoRemanejamento] = useState(null);
  const [turmaDestinoRemanejamento, setTurmaDestinoRemanejamento] = useState("");
  const [motivoRemanejamento, setMotivoRemanejamento] = useState("Ajuste de Turno / Horário");
  const [dataRemanejamento, setDataRemanejamento] = useState(new Date().toISOString().split("T")[0]);
  const [obsRemanejamento, setObsRemanejamento] = useState("");
  const [salvandoRemanejamento, setSalvandoRemanejamento] = useState(false);

  // Estados de Remanejamento em Lote
  const [turmaOrigemRemLote, setTurmaOrigemRemLote] = useState("");
  const [turmaDestinoRemLote, setTurmaDestinoRemLote] = useState("");
  const [alunosSelecionadosRemLote, setAlunosSelecionadosRemLote] = useState([]);
  const [motivoRemLote, setMotivoRemLote] = useState("Equilíbrio de Vagas e Enturmação");
  const [dataRemLote, setDataRemLote] = useState(new Date().toISOString().split("T")[0]);
  const [obsRemLote, setObsRemLote] = useState("");
  const [salvandoRemLote, setSalvandoRemLote] = useState(false);

  // Comprovantes
  const [comprovanteAluno, setComprovanteAluno] = useState(null);
  const [comprovanteRemanejamento, setComprovanteRemanejamento] = useState(null);

  // Mapeamento de Ocupação de Vagas por Turma
  const mapaVagas = useMemo(() => {
    return (turmas || []).map(t => {
      const matriculados = (alunos || []).filter(a => a.turma === t.nome && a.status === "Ativo");
      const totalVagas = Number(t.vagas) || 30;
      const ocupadas = matriculados.length;
      const disponiveis = Math.max(0, totalVagas - ocupadas);
      const percentual = Math.min(100, Math.round((ocupadas / totalVagas) * 100));

      let statusVaga = "aberta";
      if (disponiveis === 0) statusVaga = "lotada";
      else if (disponiveis <= 5) statusVaga = "limitada";

      return {
        ...t,
        totalVagas,
        ocupadas,
        disponiveis,
        percentual,
        statusVaga,
        matriculados
      };
    });
  }, [turmas, alunos]);

  // Totais Gerais da Escola
  const totalCapacidade = useMemo(() => mapaVagas.reduce((acc, t) => acc + t.totalVagas, 0), [mapaVagas]);
  const totalOcupadas = useMemo(() => mapaVagas.reduce((acc, t) => acc + t.ocupadas, 0), [mapaVagas]);
  const totalDisponiveis = Math.max(0, totalCapacidade - totalOcupadas);
  const percentualOcupacaoGeral = totalCapacidade > 0 ? Math.round((totalOcupadas / totalCapacidade) * 100) : 0;

  // Alunos da Turma de Origem selecionada no lote de rematrícula
  const alunosTurmaOrigem = useMemo(() => {
    if (!turmaOrigemLote) return [];
    return (alunos || []).filter(a => a.turma === turmaOrigemLote && a.status === "Ativo");
  }, [alunos, turmaOrigemLote]);

  // Alunos da Turma de Origem selecionada no lote de remanejamento
  const alunosTurmaOrigemRemLote = useMemo(() => {
    if (!turmaOrigemRemLote) return [];
    return (alunos || []).filter(a => a.turma === turmaOrigemRemLote && a.status === "Ativo");
  }, [alunos, turmaOrigemRemLote]);

  // Dados da Turma de Destino selecionada no lote de rematrícula
  const dadosTurmaDestino = useMemo(() => {
    return mapaVagas.find(t => t.nome === turmaDestinoLote);
  }, [mapaVagas, turmaDestinoLote]);

  // Dados da Turma de Destino selecionada no lote de remanejamento
  const dadosTurmaDestinoRemLote = useMemo(() => {
    return mapaVagas.find(t => t.nome === turmaDestinoRemLote);
  }, [mapaVagas, turmaDestinoRemLote]);

  // Histórico Geral Unificado de Remanejamentos
  const historicoGeralRemanejamentos = useMemo(() => {
    const list = [];
    (alunos || []).forEach(a => {
      if (Array.isArray(a.historicoRemanejamento)) {
        a.historicoRemanejamento.forEach(reg => {
          list.push({
            ...reg,
            alunoId: a.id,
            alunoNome: a.nome,
            alunoMatricula: a.matricula,
            alunoFoto: a.fotoUrl,
            alunoNascimento: a.nascimento,
            alunoCpf: a.cpf,
            alunoMae: a.mae || a.responsavel,
            alunoTelefone: a.telefone,
            alunoEndereco: a.endereco,
            alunoBairro: a.bairro
          });
        });
      }
    });
    return list.sort((a, b) => new Date(b.data || b.registradoEm || 0) - new Date(a.data || a.registradoEm || 0));
  }, [alunos]);

  // Execução de Rematrícula em Lote
  async function executarRematriculaLote() {
    if (!turmaOrigemLote) { alert("Selecione a turma de origem."); return; }
    if (!turmaDestinoLote) { alert("Selecione a turma de destino."); return; }
    if (turmaOrigemLote === turmaDestinoLote) { alert("A turma de destino não pode ser igual à turma de origem."); return; }
    if (!alunosSelecionadosLote.length) { alert("Selecione pelo menos um aluno para rematricular."); return; }

    if (dadosTurmaDestino && alunosSelecionadosLote.length > dadosTurmaDestino.disponiveis) {
      const msg = `Você selecionou ${alunosSelecionadosLote.length} aluno(s), mas a turma "${turmaDestinoLote}" possui apenas ${dadosTurmaDestino.disponiveis} vaga(s) disponível(is).\nDeseja prosseguir excedendo a capacidade?`;
      if (!window.confirm(msg)) return;
    }

    setSalvandoLote(true);
    try {
      await rematricularAlunosLote(
        alunosSelecionadosLote,
        turmaDestinoLote,
        dadosTurmaDestino?.ano,
        dadosTurmaDestino?.turno
      );

      setAlerta({ msg: `${alunosSelecionadosLote.length} aluno(s) rematriculado(s) com sucesso para a turma "${turmaDestinoLote}"!`, tipo: "success" });
      setAlunosSelecionadosLote([]);
      setTurmaOrigemLote("");
      setTurmaDestinoLote("");
      recarregarAlunos();
    } catch (err) {
      setAlerta({ msg: "Erro na rematrícula em lote: " + err.message, tipo: "error" });
    } finally {
      setSalvandoLote(false);
    }
  }

  // Execução de Rematrícula Individual
  async function executarRematriculaIndividual() {
    if (!novaTurmaIndividual) { alert("Selecione a nova turma."); return; }

    const turmaAlvo = mapaVagas.find(t => t.nome === novaTurmaIndividual);
    if (turmaAlvo && turmaAlvo.disponiveis <= 0) {
      if (!window.confirm(`A turma "${novaTurmaIndividual}" está com a capacidade máxima ocupada. Deseja efetivar a rematrícula mesmo assim?`)) return;
    }

    setSalvandoIndividual(true);
    try {
      await rematricularAluno(alunoRematricula.id, {
        turma: novaTurmaIndividual,
        ano: turmaAlvo?.ano || alunoRematricula.ano,
        turno: turmaAlvo?.turno || alunoRematricula.turno
      });

      const alunoAtualizado = {
        ...alunoRematricula,
        turma: novaTurmaIndividual,
        ano: turmaAlvo?.ano || alunoRematricula.ano,
        turno: turmaAlvo?.turno || alunoRematricula.turno,
        tipoOperacao: "Renovação de Matrícula (Rematrícula)",
        dataEfetivacao: new Date().toISOString()
      };

      setAlerta({ msg: `Aluno "${alunoRematricula.nome}" rematriculado com sucesso na turma "${novaTurmaIndividual}"!`, tipo: "success" });
      setAlunoRematricula(null);
      setNovaTurmaIndividual("");
      recarregarAlunos();

      // Abre comprovante
      setComprovanteAluno(alunoAtualizado);
    } catch (err) {
      setAlerta({ msg: "Erro ao rematricular aluno: " + err.message, tipo: "error" });
    } finally {
      setSalvandoIndividual(false);
    }
  }

  // Execução de Remanejamento Individual
  async function executarRemanejamentoIndividual() {
    if (!alunoRemanejamento) return;
    if (!turmaDestinoRemanejamento) { alert("Selecione a nova turma de destino."); return; }
    if (turmaDestinoRemanejamento === alunoRemanejamento.turma) {
      alert("A nova turma selecionada é idêntica à turma atual do estudante.");
      return;
    }

    const turmaAlvo = mapaVagas.find(t => t.nome === turmaDestinoRemanejamento);
    if (turmaAlvo && turmaAlvo.disponiveis <= 0) {
      if (!window.confirm(`A turma "${turmaDestinoRemanejamento}" atingiu a capacidade máxima. Deseja realizar o remanejamento mesmo assim?`)) return;
    }

    setSalvandoRemanejamento(true);
    try {
      await remanejarAluno(alunoRemanejamento.id, {
        novaTurma: turmaDestinoRemanejamento,
        novoAno: turmaAlvo?.ano || alunoRemanejamento.ano,
        novoTurno: turmaAlvo?.turno || alunoRemanejamento.turno,
        turmaOrigem: alunoRemanejamento.turma,
        motivo: motivoRemanejamento,
        observacoes: obsRemanejamento,
        dataRemanejamento: dataRemanejamento,
        usuarioNome: user?.displayName || user?.email || "Secretaria Escolar"
      });

      const comprovanteData = {
        ...alunoRemanejamento,
        turmaAnterior: alunoRemanejamento.turma,
        novaTurma: turmaDestinoRemanejamento,
        ano: turmaAlvo?.ano || alunoRemanejamento.ano,
        turno: turmaAlvo?.turno || alunoRemanejamento.turno,
        motivo: motivoRemanejamento,
        observacoes: obsRemanejamento,
        dataRemanejamento: dataRemanejamento,
        dataRegistro: new Date().toISOString(),
        usuarioNome: user?.displayName || user?.email || "Secretaria Escolar"
      };

      setAlerta({
        msg: `Estudante "${alunoRemanejamento.nome}" remanejado com sucesso para a turma "${turmaDestinoRemanejamento}"!`,
        tipo: "success"
      });
      setAlunoRemanejamento(null);
      setTurmaDestinoRemanejamento("");
      setObsRemanejamento("");
      recarregarAlunos();

      // Abre comprovante / guia de remanejamento
      setComprovanteRemanejamento(comprovanteData);
    } catch (err) {
      setAlerta({ msg: "Erro ao remanejar estudante: " + err.message, tipo: "error" });
    } finally {
      setSalvandoRemanejamento(false);
    }
  }

  // Execução de Remanejamento em Lote
  async function executarRemanejamentoLote() {
    if (!turmaOrigemRemLote) { alert("Selecione a turma de origem."); return; }
    if (!turmaDestinoRemLote) { alert("Selecione a turma de destino."); return; }
    if (turmaOrigemRemLote === turmaDestinoRemLote) {
      alert("A turma de destino não pode ser igual à turma de origem.");
      return;
    }
    if (!alunosSelecionadosRemLote.length) {
      alert("Selecione pelo menos um aluno para remanejar.");
      return;
    }

    const turmaAlvo = mapaVagas.find(t => t.nome === turmaDestinoRemLote);
    if (turmaAlvo && alunosSelecionadosRemLote.length > turmaAlvo.disponiveis) {
      const msg = `Você selecionou ${alunosSelecionadosRemLote.length} aluno(s), mas a turma "${turmaDestinoRemLote}" possui apenas ${turmaAlvo.disponiveis} vaga(s) livre(s).\nDeseja continuar excedendo a capacidade?`;
      if (!window.confirm(msg)) return;
    }

    setSalvandoRemLote(true);
    try {
      await remanejarAlunosLote(alunosSelecionadosRemLote, {
        novaTurma: turmaDestinoRemLote,
        novoAno: turmaAlvo?.ano,
        novoTurno: turmaAlvo?.turno,
        turmaOrigem: turmaOrigemRemLote,
        motivo: motivoRemLote,
        observacoes: obsRemLote,
        dataRemanejamento: dataRemLote,
        usuarioNome: user?.displayName || user?.email || "Secretaria Escolar"
      });

      setAlerta({
        msg: `${alunosSelecionadosRemLote.length} estudante(s) remanejado(s) da turma "${turmaOrigemRemLote}" para "${turmaDestinoRemLote}" com sucesso!`,
        tipo: "success"
      });
      setAlunosSelecionadosRemLote([]);
      setTurmaOrigemRemLote("");
      setTurmaDestinoRemLote("");
      setObsRemLote("");
      recarregarAlunos();
    } catch (err) {
      setAlerta({ msg: "Erro no remanejamento em lote: " + err.message, tipo: "error" });
    } finally {
      setSalvandoRemLote(false);
    }
  }

  function toggleSelecionarTodosLote() {
    if (alunosSelecionadosLote.length === alunosTurmaOrigem.length) {
      setAlunosSelecionadosLote([]);
    } else {
      setAlunosSelecionadosLote(alunosTurmaOrigem.map(a => a.id));
    }
  }

  function toggleAlunoLote(alunoId) {
    if (alunosSelecionadosLote.includes(alunoId)) {
      setAlunosSelecionadosLote(prev => prev.filter(id => id !== alunoId));
    } else {
      setAlunosSelecionadosLote(prev => [...prev, alunoId]);
    }
  }

  function toggleSelecionarTodosRemLote() {
    if (alunosSelecionadosRemLote.length === alunosTurmaOrigemRemLote.length) {
      setAlunosSelecionadosRemLote([]);
    } else {
      setAlunosSelecionadosRemLote(alunosTurmaOrigemRemLote.map(a => a.id));
    }
  }

  function toggleAlunoRemLote(alunoId) {
    if (alunosSelecionadosRemLote.includes(alunoId)) {
      setAlunosSelecionadosRemLote(prev => prev.filter(id => id !== alunoId));
    } else {
      setAlunosSelecionadosRemLote(prev => [...prev, alunoId]);
    }
  }

  if (cA || cT) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {alerta && <Alert tipo={alerta.tipo}>{alerta.msg}</Alert>}

      {/* Cabeçalho Principal do Módulo */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleArea}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ti ti-clipboard-check" style={{ color: "#60a5fa", fontSize: 26 }} />
            Fluxo de Matrículas, Rematrículas & Remanejamentos
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 10, color: "#94a3b8" }}>
            Gestão inteligente de vagas por turma, admissão completa de novos estudantes, rematrícula e remanejamento entre turmas.
          </p>
        </div>

        {/* 4 Botões Quadrados Lado a Lado */}
        <div className={styles.actionsGrid}>
          <a
            href="/solicitar-matricula"
            target="_blank"
            rel="noreferrer"
            className={`${styles.squareActionBtn} ${styles.btnPortal}`}
            title="Acessar Portal do Responsável (Matrícula Online)"
          >
            <i className="ti ti-external-link" />
            <span>Portal do Responsável</span>
          </a>

          <button
            type="button"
            onClick={() => { setAbaAtiva("remanejamento"); setSubAbaRemanejamento("individual"); }}
            className={`${styles.squareActionBtn} ${styles.btnRemanejar}`}
            title="Remanejamento de turma"
          >
            <i className="ti ti-arrows-exchange" />
            <span>Remanejar Turma</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("rematricula_lote")}
            className={`${styles.squareActionBtn} ${styles.btnRematricula}`}
            title="Rematrícula de estudantes em lote"
          >
            <i className="ti ti-users-group" />
            <span>Rematrícula em Lote</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/matriculas/nova")}
            className={`${styles.squareActionBtn} ${styles.btnNovaMatricula}`}
            title="Admitir novo estudante"
          >
            <i className="ti ti-plus" />
            <span>Nova Matrícula</span>
          </button>
        </div>
      </div>

      {/* Painel Geral de Indicadores de Capacidade */}
      <div className="sigem-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            <i className="ti ti-building-community" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Capacidade Total</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#ffffff" }}>{totalCapacidade} <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>vagas</span></div>
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(52, 211, 153, 0.15)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            <i className="ti ti-user-check" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Vagas Ocupadas</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#34d399" }}>{totalOcupadas} <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>matriculados</span></div>
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: totalDisponiveis > 10 ? "rgba(251, 191, 36, 0.15)" : "rgba(248, 113, 113, 0.15)", color: totalDisponiveis > 10 ? "#fbbf24" : "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            <i className="ti ti-door-enter" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Vagas Disponíveis</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: totalDisponiveis > 0 ? "#ffffff" : "#f87171" }}>
              {totalDisponiveis} <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>livres</span>
            </div>
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            <i className="ti ti-chart-pie" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Ocupação Geral</span>
              <strong style={{ fontSize: 14, color: "#c084fc" }}>{percentualOcupacaoGeral}%</strong>
            </div>
            <ProgressBar value={percentualOcupacaoGeral} />
          </div>
        </Card>
      </div>

      {/* Tabs do Módulo */}
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "2px solid #2c3b52",
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingBottom: 2
        }}
      >
        {[
          {
            id: "online",
            label: "Matrículas Online (Solicitações)",
            icon: "clipboard-list",
            badge: solicitacoesPendentes.length > 0 ? `🟡 ${solicitacoesPendentes.length} pendente(s)` : (solicitacoes?.length || 0)
          },
          { id: "vagas", label: "Painel de Vagas por Turma", icon: "layout-grid", badge: turmas.length },
          { id: "remanejamento", label: "Remanejamento entre Turmas", icon: "arrows-exchange", badge: "Ativo" },
          { id: "rematricula_lote", label: "Rematrícula em Lote", icon: "users-group", badge: "Lote" },
          { id: "rematricula_individual", label: "Rematrícula Individual", icon: "user-star", badge: alunos.length }
        ].map(tab => {
          const ativa = abaAtiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                border: "none",
                background: "transparent",
                borderBottom: ativa ? "3px solid #3b82f6" : "3px solid transparent",
                marginBottom: -2,
                color: ativa ? "#60a5fa" : "#94a3b8",
                fontWeight: ativa ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
            >
              <i className={`ti ti-${tab.icon}`} style={{ fontSize: 17 }} />
              {tab.label}
              <span style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 10,
                background: ativa ? "#3b82f6" : (tab.id === "online" && solicitacoesPendentes.length > 0 ? "rgba(245, 158, 11, 0.2)" : "#243144"),
                color: ativa ? "#ffffff" : (tab.id === "online" && solicitacoesPendentes.length > 0 ? "#fbbf24" : "#cbd5e1"),
                fontWeight: 700
              }}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* ABA 0: SOLICITAÇÕES DE MATRÍCULA ONLINE (SECRETARIA ESCOLAR)              */}
      {/* ========================================================================= */}
      {abaAtiva === "online" && (
        <SolicitacoesMatriculaOnline
          solicitacoes={solicitacoes || []}
          turmas={turmas || []}
          alunos={alunos || []}
          escolaId={activeEscolaId}
          usuario={user}
          onReload={() => {
            if (recarregarSolicitacoes) recarregarSolicitacoes();
            if (recarregarAlunos) recarregarAlunos();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA 1: PAINEL DE VAGAS POR TURMA                                          */}
      {/* ========================================================================= */}
      {abaAtiva === "vagas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!mapaVagas.length ? (
            <EmptyState icon="books-off" texto="Nenhuma turma cadastrada para controle de vagas." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {mapaVagas.map(t => {
                const isLotada = t.statusVaga === "lotada";
                const isLimitada = t.statusVaga === "limitada";

                return (
                  <Card
                    key={t.id}
                    style={{
                      padding: 20,
                      border: isLotada ? "1.5px solid rgba(248, 113, 113, 0.5)" : isLimitada ? "1.5px solid rgba(251, 191, 36, 0.5)" : "1px solid #2c3b52",
                      background: "#1e293b",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 16
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#ffffff" }}>{t.nome}</h3>
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{t.ano} · Turno {t.turno}</span>
                        </div>
                        <Badge color={isLotada ? "red" : isLimitada ? "amber" : "green"}>
                          {isLotada ? "Turma Lotada" : isLimitada ? `${t.disponiveis} Vagas Restantes` : `${t.disponiveis} Vagas Livres`}
                        </Badge>
                      </div>

                      {/* Barra de Progresso da Turma */}
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: "#94a3b8" }}>Ocupação</span>
                          <span style={{ fontWeight: 700, color: isLotada ? "#f87171" : "#ffffff" }}>
                            {t.ocupadas} / {t.totalVagas} alunos ({t.percentual}%)
                          </span>
                        </div>
                        <ProgressBar value={t.percentual} />
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid #2c3b52", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        Matriculados: <strong style={{ color: "#ffffff" }}>{t.ocupadas}</strong>
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn
                          variant="secondary"
                          onClick={() => {
                            setTurmaOrigemRemLote(t.nome);
                            setAbaAtiva("remanejamento");
                            setSubAbaRemanejamento("lote");
                          }}
                          style={{ padding: "6px 10px", fontSize: 11 }}
                          title="Remanejar alunos desta turma"
                        >
                          <i className="ti ti-arrows-exchange" /> Remanejar
                        </Btn>
                        <Btn
                          variant={isLotada ? "default" : "primary"}
                          onClick={() => navigate(`/matriculas/nova?turma=${encodeURIComponent(t.nome)}`)}
                          style={{ padding: "6px 12px", fontSize: 11 }}
                        >
                          <i className="ti ti-user-plus" /> Matricular
                        </Btn>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: REMANEJAMENTO ENTRE TURMAS                                         */}
      {/* ========================================================================= */}
      {abaAtiva === "remanejamento" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Sub-abas de Remanejamento */}
          <div style={{ display: "flex", gap: 8, background: "#161f2e", border: "1px solid #2c3b52", padding: 4, borderRadius: 8, width: "fit-content" }}>
            {[
              { id: "individual", label: "Remanejamento Individual", icon: "user" },
              { id: "lote", label: "Remanejamento em Lote (Coletivo)", icon: "users" },
              { id: "historico", label: "Histórico de Remanejamentos", icon: "history", count: historicoGeralRemanejamentos.length }
            ].map(sub => {
              const sel = subAbaRemanejamento === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSubAbaRemanejamento(sub.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 6,
                    border: sel ? "1px solid #33435c" : "1px solid transparent",
                    background: sel ? "#1e293b" : "transparent",
                    color: sel ? "#60a5fa" : "#94a3b8",
                    fontWeight: sel ? 700 : 500,
                    fontSize: 13,
                    boxShadow: sel ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <i className={`ti ti-${sub.icon}`} />
                  {sub.label}
                  {sub.count !== undefined && (
                    <span style={{ fontSize: 11, background: sel ? "rgba(59, 130, 246, 0.2)" : "#243144", color: sel ? "#60a5fa" : "#94a3b8", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>
                      {sub.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* SUB-ABA 1: REMANEJAMENTO INDIVIDUAL */}
          {subAbaRemanejamento === "individual" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#243144", border: "1px solid #33435c", borderRadius: 10, padding: "8px 12px", flex: 1, maxWidth: 360 }}>
                  <i className="ti ti-search" style={{ color: "#94a3b8", fontSize: 16 }} />
                  <input
                    value={buscaRemanejamento}
                    onChange={e => setBuscaRemanejamento(e.target.value)}
                    placeholder="Buscar estudante por nome ou matrícula..."
                    style={{ border: "none", background: "none", fontSize: 13, outline: "none", width: "100%", color: "#ffffff" }}
                  />
                </div>
                <select
                  value={filtroTurmaRemanejamento}
                  onChange={e => setFiltroTurmaRemanejamento(e.target.value)}
                  style={{ padding: "8.5px 12px", border: "1px solid #33435c", borderRadius: 10, fontSize: 13, outline: "none", background: "#243144", color: "#ffffff", cursor: "pointer" }}
                >
                  <option value="" style={{ background: "#1e293b", color: "#ffffff" }}>Todas as Turmas Atuais</option>
                  {turmas.map(t => (
                    <option key={t.id} value={t.nome} style={{ background: "#1e293b", color: "#ffffff" }}>{t.nome}</option>
                  ))}
                </select>
              </div>

              {/* Visualização Desktop: Tabela Estruturada */}
              <div className="sigem-desktop-table">
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(36, 49, 68, 0.5)", borderBottom: "1px solid #2c3b52" }}>
                        {["Matrícula", "Estudante", "Turma Atual", "Turno", "Histórico de Mudanças", "Ação"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {alunos
                        .filter(a => {
                          const matchBusca = a.nome?.toLowerCase().includes(buscaRemanejamento.toLowerCase()) || a.matricula?.includes(buscaRemanejamento);
                          const matchTurma = !filtroTurmaRemanejamento || a.turma === filtroTurmaRemanejamento;
                          return matchBusca && matchTurma;
                        })
                        .map(a => {
                          const temHistorico = Array.isArray(a.historicoRemanejamento) && a.historicoRemanejamento.length > 0;
                          return (
                            <tr key={a.id} style={{ borderBottom: "1px solid #2c3b52", transition: "background 0.15s ease" }}
                              onMouseOver={e => e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)"}
                              onMouseOut={e => e.currentTarget.style.background = "transparent"}
                            >
                              <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{a.matricula || "—"}</td>
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ fontWeight: 600, color: "#ffffff", fontSize: 13 }}>{a.nome}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.mae || a.responsavel || "—"}</div>
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <Badge color="blue">{a.turma}</Badge>
                                <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>{a.ano}</span>
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#cbd5e1" }}>{a.turno || "—"}</td>
                              <td style={{ padding: "12px 14px" }}>
                                {temHistorico ? (
                                  <Badge color="purple">{a.historicoRemanejamento.length} remanejamento(s)</Badge>
                                ) : (
                                  <span style={{ fontSize: 12, color: "#94a3b8" }}>Enturmação inicial</span>
                                )}
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <Btn
                                  variant="primary"
                                  onClick={() => {
                                    setAlunoRemanejamento(a);
                                    setTurmaDestinoRemanejamento("");
                                    setMotivoRemanejamento("Ajuste de Turno / Horário");
                                    setDataRemanejamento(new Date().toISOString().split("T")[0]);
                                    setObsRemanejamento("");
                                  }}
                                  style={{ padding: "5px 12px", fontSize: 12 }}
                                >
                                  <i className="ti ti-arrows-exchange" /> Remanejar
                                </Btn>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </Card>
              </div>

              {/* Visualização Mobile: Cards Otimizados */}
              <div className="sigem-mobile-cards">
                {alunos
                  .filter(a => {
                    const matchBusca = a.nome?.toLowerCase().includes(buscaRemanejamento.toLowerCase()) || a.matricula?.includes(buscaRemanejamento);
                    const matchTurma = !filtroTurmaRemanejamento || a.turma === filtroTurmaRemanejamento;
                    return matchBusca && matchTurma;
                  })
                  .map(a => {
                    const temHistorico = Array.isArray(a.historicoRemanejamento) && a.historicoRemanejamento.length > 0;
                    return (
                      <div
                        key={`mob-rem-${a.id}`}
                        onClick={() => {
                          setAlunoRemanejamento(a);
                          setTurmaDestinoRemanejamento("");
                          setMotivoRemanejamento("Ajuste de Turno / Horário");
                          setDataRemanejamento(new Date().toISOString().split("T")[0]);
                          setObsRemanejamento("");
                        }}
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-color)",
                          borderRadius: 14,
                          padding: "12px 14px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          cursor: "pointer",
                          boxShadow: "var(--card-shadow)",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-indigo)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                      >
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-color)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          color: "#60a5fa",
                          flexShrink: 0
                        }}>
                          <i className="ti ti-arrows-exchange" />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>
                            {a.nome}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
                            <Badge color="blue">{a.turma}</Badge>
                            <span style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>#{a.matricula || "S/N"}</span>
                            {a.turno && <span style={{ color: "var(--text-muted)" }}>{a.turno}</span>}
                            {temHistorico && <Badge color="purple">{a.historicoRemanejamento.length} mud.</Badge>}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <Btn variant="primary" style={{ padding: "5px 10px", fontSize: 11 }}>
                            Remanejar
                          </Btn>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* SUB-ABA 2: REMANEJAMENTO EM LOTE */}
          {subAbaRemanejamento === "lote" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card style={{ padding: 20 }}>
                <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="ti ti-arrows-exchange" style={{ color: "#60a5fa" }} />
                  Remanejamento Coletivo de Estudantes entre Turmas
                </h3>
                <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#94a3b8" }}>
                  Mova um grupo de estudantes de uma turma para outra em lote mantendo o histórico de transferências internas e auditoria.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#161f2e", padding: 16, borderRadius: 8, border: "1px solid #2c3b52" }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                      1. Turma de Origem (Atual) *
                    </label>
                    <Select
                      value={turmaOrigemRemLote}
                      onChange={e => {
                        setTurmaOrigemRemLote(e.target.value);
                        setAlunosSelecionadosRemLote([]);
                      }}
                    >
                      <option value="">Selecione a turma de onde sairão os alunos...</option>
                      {turmas.map(t => (
                        <option key={t.id} value={t.nome}>{t.nome} ({t.ano} - {t.turno})</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                      2. Turma de Destino (Nova Turma) *
                    </label>
                    <Select
                      value={turmaDestinoRemLote}
                      onChange={e => setTurmaDestinoRemLote(e.target.value)}
                    >
                      <option value="">Selecione a nova turma de destino...</option>
                      {turmas.map(t => {
                        const info = mapaVagas.find(m => m.nome === t.nome);
                        return (
                          <option key={t.id} value={t.nome} disabled={t.nome === turmaOrigemRemLote}>
                            {t.nome} ({t.ano} - {t.turno}) · {info?.disponiveis || 0} vagas livres
                          </option>
                        );
                      })}
                    </Select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                      3. Motivo Principal do Remanejamento *
                    </label>
                    <Select
                      value={motivoRemLote}
                      onChange={e => setMotivoRemLote(e.target.value)}
                    >
                      <option value="Equilíbrio de Vagas e Enturmação">Equilíbrio de Vagas e Enturmação</option>
                      <option value="Ajuste de Turno / Horário">Ajuste de Turno / Horário</option>
                      <option value="Adequação Pedagógica / Nível de Ensino">Adequação Pedagógica / Nível de Ensino</option>
                      <option value="Solicitação da Família / Responsável Legal">Solicitação da Família / Responsável Legal</option>
                      <option value="Adaptação e Convivência Escolar">Adaptação e Convivência Escolar</option>
                      <option value="Decisão Administrativa da Direção">Decisão Administrativa da Direção</option>
                      <option value="Outro">Outro</option>
                    </Select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                      4. Data do Remanejamento *
                    </label>
                    <Input
                      type="date"
                      value={dataRemLote}
                      onChange={e => setDataRemLote(e.target.value)}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                      Observações / Justificativa Adicional (Opcional)
                    </label>
                    <Input
                      value={obsRemLote}
                      onChange={e => setObsRemLote(e.target.value)}
                      placeholder="Ex: Remanejamento coletivo realizado para abertura de nova sala no turno vespertino..."
                    />
                  </div>
                </div>

                {dadosTurmaDestinoRemLote && (
                  <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: dadosTurmaDestinoRemLote.disponiveis > 0 ? "var(--badge-blue-bg, rgba(59, 130, 246, 0.1))" : "var(--badge-red-bg, rgba(239, 68, 68, 0.1))", border: `1px solid ${dadosTurmaDestinoRemLote.disponiveis > 0 ? "var(--badge-blue-border, rgba(59, 130, 246, 0.3))" : "var(--badge-red-border, rgba(239, 68, 68, 0.3))"}` }}>
                    <span style={{ fontSize: 13, color: dadosTurmaDestinoRemLote.disponiveis > 0 ? "var(--badge-blue-text, #0369a1)" : "var(--badge-red-text, #b91c1c)", fontWeight: 600 }}>
                      Capacidade da Turma de Destino: {dadosTurmaDestinoRemLote.ocupadas} alunos ocupando {dadosTurmaDestinoRemLote.totalVagas} vagas ({dadosTurmaDestinoRemLote.disponiveis} livres).
                    </span>
                  </div>
                )}
              </Card>

              {turmaOrigemRemLote && (
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="checkbox"
                        checked={alunosTurmaOrigemRemLote.length > 0 && alunosSelecionadosRemLote.length === alunosTurmaOrigemRemLote.length}
                        onChange={toggleSelecionarTodosRemLote}
                        style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#3b82f6" }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
                        Selecionar Todos ({alunosSelecionadosRemLote.length} de {alunosTurmaOrigemRemLote.length} selecionados)
                      </span>
                    </div>

                    <Btn
                      variant="primary"
                      onClick={executarRemanejamentoLote}
                      disabled={salvandoRemLote || !alunosSelecionadosRemLote.length || !turmaDestinoRemLote}
                    >
                      <i className="ti ti-check" />
                      {salvandoRemLote ? "Efetivando Remanejamentos..." : `Remanejar ${alunosSelecionadosRemLote.length} Aluno(s) Selecionado(s)`}
                    </Btn>
                  </div>

                  {!alunosTurmaOrigemRemLote.length ? (
                    <div style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>
                      Nenhum aluno ativo encontrado nesta turma de origem.
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(36, 49, 68, 0.6)", borderBottom: "1px solid #2c3b52" }}>
                          <th style={{ width: 40, padding: "10px 14px" }}></th>
                          {["Matrícula", "Nome do Estudante", "Data Nasc.", "Mãe / Responsável", "Turno Atual"].map(h => (
                            <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {alunosTurmaOrigemRemLote.map(a => {
                          const selecionado = alunosSelecionadosRemLote.includes(a.id);
                          return (
                            <tr
                              key={a.id}
                              onClick={() => toggleAlunoRemLote(a.id)}
                              style={{
                                borderBottom: "1px solid #2c3b52",
                                background: selecionado ? "rgba(59, 130, 246, 0.15)" : "transparent",
                                cursor: "pointer",
                                transition: "background 0.15s ease"
                              }}
                              onMouseOver={e => !selecionado && (e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)")}
                              onMouseOut={e => !selecionado && (e.currentTarget.style.background = "transparent")}
                            >
                              <td style={{ padding: "12px 14px", textAlign: "center" }}>
                                <input
                                  type="checkbox"
                                  checked={selecionado}
                                  onChange={() => { }}
                                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#3b82f6" }}
                                />
                              </td>
                              <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{a.matricula || "—"}</td>
                              <td style={{ padding: "12px 14px", fontWeight: 600, color: "#ffffff", fontSize: 13 }}>{a.nome}</td>
                              <td style={{ padding: "12px 14px", fontSize: 12, color: "#cbd5e1" }}>
                                {a.nascimento ? new Date(a.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: 12, color: "#cbd5e1" }}>{a.mae || a.responsavel || "—"}</td>
                              <td style={{ padding: "12px 14px", fontSize: 12, color: "#cbd5e1" }}>{a.turno || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* SUB-ABA 3: HISTÓRICO GERAL DE REMANEJAMENTOS */}
          {subAbaRemanejamento === "historico" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {!historicoGeralRemanejamentos.length ? (
                <Card style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <i className="ti ti-history" style={{ fontSize: 32, display: "block", marginBottom: 8, opacity: 0.5 }} />
                  Nenhum remanejamento registrado nesta escola até o momento.
                </Card>
              ) : (
                <>
                  <div className="sigem-desktop-table">
                    <Card style={{ padding: 0, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "rgba(36, 49, 68, 0.5)", borderBottom: "1px solid #2c3b52" }}>
                            {["Data", "Estudante", "Origem → Destino", "Motivo", "Registrado Por", "Ações"].map(h => (
                              <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {historicoGeralRemanejamentos.map((item, idx) => (
                            <tr key={item.id || idx} style={{ borderBottom: "1px solid #2c3b52", transition: "background 0.15s ease" }}
                              onMouseOver={e => e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)"}
                              onMouseOut={e => e.currentTarget.style.background = "transparent"}
                            >
                              <td style={{ padding: "12px 14px", fontSize: 12, color: "#cbd5e1", whiteSpace: "nowrap" }}>
                                {item.data ? new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ fontWeight: 600, color: "#ffffff", fontSize: 13 }}>{item.alunoNome}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{item.alunoMatricula || "—"}</div>
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <Badge color="gray">{item.turmaOrigem}</Badge>
                                  <i className="ti ti-arrow-right" style={{ color: "#94a3b8", fontSize: 12 }} />
                                  <Badge color="green">{item.turmaDestino}</Badge>
                                </div>
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ fontSize: 12, fontWeight: 500, color: "#ffffff" }}>{item.motivo}</div>
                                {item.observacoes && (
                                  <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", marginTop: 2 }}>{item.observacoes}</div>
                                )}
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>{item.usuarioNome || "Secretaria"}</td>
                              <td style={{ padding: "12px 14px" }}>
                                <Btn
                                  variant="secondary"
                                  onClick={() => {
                                    setComprovanteRemanejamento({
                                      nome: item.alunoNome,
                                      matricula: item.alunoMatricula,
                                      nascimento: item.alunoNascimento,
                                      cpf: item.alunoCpf,
                                      mae: item.alunoMae,
                                      telefone: item.alunoTelefone,
                                      endereco: item.alunoEndereco,
                                      bairro: item.alunoBairro,
                                      turmaAnterior: item.turmaOrigem,
                                      novaTurma: item.turmaDestino,
                                      motivo: item.motivo,
                                      observacoes: item.observacoes,
                                      dataRemanejamento: item.data,
                                      usuarioNome: item.usuarioNome
                                    });
                                  }}
                                  style={{ padding: "4px 8px", fontSize: 11 }}
                                >
                                  <i className="ti ti-printer" /> Guia
                                </Btn>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  </div>

                  {/* Visualização Mobile: Cards Otimizados */}
                  <div className="sigem-mobile-cards">
                    {historicoGeralRemanejamentos.map((item, idx) => (
                      <div
                        key={`mob-histrem-${item.id || idx}`}
                        onClick={() => {
                          setComprovanteRemanejamento({
                            nome: item.alunoNome,
                            matricula: item.alunoMatricula,
                            nascimento: item.alunoNascimento,
                            cpf: item.alunoCpf,
                            mae: item.alunoMae,
                            telefone: item.alunoTelefone,
                            endereco: item.alunoEndereco,
                            bairro: item.alunoBairro,
                            turmaAnterior: item.turmaOrigem,
                            novaTurma: item.turmaDestino,
                            motivo: item.motivo,
                            observacoes: item.observacoes,
                            dataRemanejamento: item.data,
                            usuarioNome: item.usuarioNome
                          });
                        }}
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-color)",
                          borderRadius: 14,
                          padding: "12px 14px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          cursor: "pointer",
                          boxShadow: "var(--card-shadow)",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-indigo)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                      >
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-color)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          color: "#34d399",
                          flexShrink: 0
                        }}>
                          <i className="ti ti-history-toggle" />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {item.alunoNome}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              {item.data ? new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
                            <Badge color="gray">{item.turmaOrigem}</Badge>
                            <i className="ti ti-arrow-right" style={{ color: "var(--text-muted)", fontSize: 10 }} />
                            <Badge color="green">{item.turmaDestino}</Badge>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          <Btn variant="secondary" style={{ padding: "4px 8px", fontSize: 11 }}>
                            <i className="ti ti-printer" />
                          </Btn>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: REMATRÍCULA EM LOTE                                                */}
      {/* ========================================================================= */}
      {abaAtiva === "rematricula_lote" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700, color: "#ffffff" }}>
              Rematrícula Coletiva / Promoção de Turma
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#94a3b8" }}>
              Transfira ou promova alunos em bloco da turma do ano anterior para a nova turma do ano letivo de 2026.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#161f2e", padding: 16, borderRadius: 8, border: "1px solid #2c3b52" }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                  1. Turma de Origem (Ano Anterior) *
                </label>
                <Select
                  value={turmaOrigemLote}
                  onChange={e => {
                    setTurmaOrigemLote(e.target.value);
                    setAlunosSelecionadosLote([]);
                  }}
                >
                  <option value="">Selecione a turma de origem...</option>
                  {turmas.map(t => (
                    <option key={t.id} value={t.nome}>{t.nome} ({t.ano} - {t.turno})</option>
                  ))}
                </Select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                  2. Turma de Destino (2026) *
                </label>
                <Select
                  value={turmaDestinoLote}
                  onChange={e => setTurmaDestinoLote(e.target.value)}
                >
                  <option value="">Selecione a turma de destino...</option>
                  {turmas.map(t => {
                    const info = mapaVagas.find(m => m.nome === t.nome);
                    return (
                      <option key={t.id} value={t.nome} disabled={t.nome === turmaOrigemLote}>
                        {t.nome} ({t.ano} - {t.turno}) · {info?.disponiveis || 0} vagas livres
                      </option>
                    );
                  })}
                </Select>
              </div>
            </div>

            {dadosTurmaDestino && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: dadosTurmaDestino.disponiveis > 0 ? "var(--badge-blue-bg, rgba(59, 130, 246, 0.1))" : "var(--badge-red-bg, rgba(239, 68, 68, 0.1))", border: `1px solid ${dadosTurmaDestino.disponiveis > 0 ? "var(--badge-blue-border, rgba(59, 130, 246, 0.3))" : "var(--badge-red-border, rgba(239, 68, 68, 0.3))"}` }}>
                <span style={{ fontSize: 13, color: dadosTurmaDestino.disponiveis > 0 ? "var(--badge-blue-text, #0369a1)" : "var(--badge-red-text, #b91c1c)", fontWeight: 600 }}>
                  Capacidade da Turma de Destino: {dadosTurmaDestino.ocupadas} alunos ocupando {dadosTurmaDestino.totalVagas} vagas ({dadosTurmaDestino.disponiveis} livres).
                </span>
              </div>
            )}
          </Card>

          {turmaOrigemLote && (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={alunosTurmaOrigem.length > 0 && alunosSelecionadosLote.length === alunosTurmaOrigem.length}
                    onChange={toggleSelecionarTodosLote}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#3b82f6" }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
                    Selecionar Todos ({alunosSelecionadosLote.length} de {alunosTurmaOrigem.length} selecionados)
                  </span>
                </div>

                <Btn
                  variant="primary"
                  onClick={executarRematriculaLote}
                  disabled={salvandoLote || !alunosSelecionadosLote.length || !turmaDestinoLote}
                >
                  <i className="ti ti-check" />
                  {salvandoLote ? "Efetivando Rematrículas..." : `Efetivar Rematrícula de ${alunosSelecionadosLote.length} Aluno(s)`}
                </Btn>
              </div>

              {!alunosTurmaOrigem.length ? (
                <div style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>
                  Nenhum aluno ativo encontrado nesta turma de origem.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(36, 49, 68, 0.6)", borderBottom: "1px solid #2c3b52" }}>
                      <th style={{ width: 40, padding: "10px 14px" }}></th>
                      {["Matrícula", "Nome do Estudante", "Data Nasc.", "Mãe / Responsável", "Situação Atual"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alunosTurmaOrigem.map(a => {
                      const selecionado = alunosSelecionadosLote.includes(a.id);
                      return (
                        <tr
                          key={a.id}
                          onClick={() => toggleAlunoLote(a.id)}
                          style={{
                            borderBottom: "1px solid #2c3b52",
                            background: selecionado ? "rgba(59, 130, 246, 0.15)" : "transparent",
                            cursor: "pointer",
                            transition: "background 0.15s ease"
                          }}
                          onMouseOver={e => !selecionado && (e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)")}
                          onMouseOut={e => !selecionado && (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={selecionado}
                              onChange={() => { }}
                              style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#3b82f6" }}
                            />
                          </td>
                          <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{a.matricula || "—"}</td>
                          <td style={{ padding: "12px 14px", fontWeight: 600, color: "#ffffff", fontSize: 13 }}>{a.nome}</td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: "#cbd5e1" }}>
                            {a.nascimento ? new Date(a.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: "#cbd5e1" }}>{a.mae || a.responsavel || "—"}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <Badge color={a.situacaoMatricula === "Renovação" ? "green" : "blue"}>
                              {a.situacaoMatricula || "Regular"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: REMATRÍCULA INDIVIDUAL                                             */}
      {/* ========================================================================= */}
      {abaAtiva === "rematricula_individual" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#243144", border: "1px solid #33435c", borderRadius: 10, padding: "8px 12px", flex: 1, maxWidth: 340 }}>
              <i className="ti ti-search" style={{ color: "#94a3b8", fontSize: 16 }} />
              <input
                value={buscaRematricula}
                onChange={e => setBuscaRematricula(e.target.value)}
                placeholder="Buscar por nome ou matrícula..."
                style={{ border: "none", background: "none", fontSize: 13, outline: "none", width: "100%", color: "#ffffff" }}
              />
            </div>
            <select
              value={filtroTurmaRematricula}
              onChange={e => setFiltroTurmaRematricula(e.target.value)}
              style={{ padding: "8.5px 12px", border: "1px solid #33435c", borderRadius: 10, fontSize: 13, outline: "none", background: "#243144", color: "#ffffff", cursor: "pointer" }}
            >
              <option value="" style={{ background: "#1e293b", color: "#ffffff" }}>Todas as Turmas</option>
              {turmas.map(t => (
                <option key={t.id} value={t.nome} style={{ background: "#1e293b", color: "#ffffff" }}>{t.nome}</option>
              ))}
            </select>
          </div>

          {/* Visualização Desktop: Tabela Estruturada */}
          <div className="sigem-desktop-table">
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(36, 49, 68, 0.5)", borderBottom: "1px solid #2c3b52" }}>
                    {["Matrícula", "Estudante", "Turma Atual", "Situação Matrícula", "Ação"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alunos
                    .filter(a => {
                      const matchBusca = a.nome?.toLowerCase().includes(buscaRematricula.toLowerCase()) || a.matricula?.includes(buscaRematricula);
                      const matchTurma = !filtroTurmaRematricula || a.turma === filtroTurmaRematricula;
                      return matchBusca && matchTurma;
                    })
                    .map(a => {
                      const jaRenovado = a.situacaoMatricula === "Renovação";
                      return (
                        <tr key={a.id} style={{ borderBottom: "1px solid #2c3b52", transition: "background 0.15s ease" }}
                          onMouseOver={e => e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)"}
                          onMouseOut={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{a.matricula || "—"}</td>
                          <td style={{ padding: "12px 14px", fontWeight: 600, color: "#ffffff", fontSize: 13 }}>{a.nome}</td>
                          <td style={{ padding: "12px 14px" }}><Badge>{a.turma}</Badge> <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>{a.ano}</span></td>
                          <td style={{ padding: "12px 14px" }}>
                            <Badge color={jaRenovado ? "green" : "amber"}>
                              {jaRenovado ? "Renovada" : "Pendente de Renovação"}
                            </Badge>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <Btn
                              variant="primary"
                              onClick={() => {
                                setAlunoRematricula(a);
                                setNovaTurmaIndividual(a.turma);
                              }}
                              style={{ padding: "5px 10px", fontSize: 12 }}
                            >
                              <i className="ti ti-refresh" /> Rematricular
                            </Btn>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Visualização Mobile: Cards Otimizados */}
          <div className="sigem-mobile-cards">
            {alunos
              .filter(a => {
                const matchBusca = a.nome?.toLowerCase().includes(buscaRematricula.toLowerCase()) || a.matricula?.includes(buscaRematricula);
                const matchTurma = !filtroTurmaRematricula || a.turma === filtroTurmaRematricula;
                return matchBusca && matchTurma;
              })
              .map(a => {
                const jaRenovado = a.situacaoMatricula === "Renovação";
                return (
                  <div
                    key={`mob-remat-${a.id}`}
                    onClick={() => {
                      setAlunoRematricula(a);
                      setNovaTurmaIndividual(a.turma);
                    }}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 14,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                      boxShadow: "var(--card-shadow)",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-indigo)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                  >
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      color: "#38bdf8",
                      flexShrink: 0
                    }}>
                      <i className="ti ti-user-check" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>
                        {a.nome}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
                        <Badge color="blue">{a.turma}</Badge>
                        <span style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>#{a.matricula || "S/N"}</span>
                        {a.ano && <span style={{ color: "var(--text-muted)" }}>{a.ano}</span>}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <Badge color={jaRenovado ? "green" : "amber"}>
                        {jaRenovado ? "Renovada" : "Pendente"}
                      </Badge>
                      <div style={{ color: "var(--text-muted)", fontSize: 18, display: "flex", alignItems: "center" }}>
                        <i className="ti ti-chevron-right" />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REMATRÍCULA INDIVIDUAL                                             */}
      {/* ========================================================================= */}
      {alunoRematricula && (
        <Modal
          titulo={`Rematricular Aluno · ${alunoRematricula.nome}`}
          onClose={() => setAlunoRematricula(null)}
          onSave={executarRematriculaIndividual}
          salvando={salvandoIndividual}
          textSave="Efetivar Rematrícula"
          width={600}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#161f2e", padding: 14, borderRadius: 8, border: "1px solid #2c3b52" }}>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>Matrícula Atual: <strong style={{ color: "#ffffff" }}>{alunoRematricula.matricula || "—"}</strong></div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>{alunoRematricula.nome}</div>
              <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>
                Turma Atual: <strong style={{ color: "#60a5fa" }}>{alunoRematricula.turma} ({alunoRematricula.ano})</strong>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                Selecione a Nova Turma de Destino *
              </label>
              <Select
                value={novaTurmaIndividual}
                onChange={e => setNovaTurmaIndividual(e.target.value)}
              >
                <option value="">Selecione...</option>
                {turmas.map(t => {
                  const info = mapaVagas.find(m => m.nome === t.nome);
                  return (
                    <option key={t.id} value={t.nome}>
                      {t.nome} ({t.ano} - {t.turno}) · {info?.disponiveis || 0} vagas livres
                    </option>
                  );
                })}
              </Select>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REMANEJAMENTO INDIVIDUAL DE TURMA                                   */}
      {/* ========================================================================= */}
      {alunoRemanejamento && (
        <Modal
          titulo={`Remanejar Estudante · ${alunoRemanejamento.nome}`}
          onClose={() => setAlunoRemanejamento(null)}
          onSave={executarRemanejamentoIndividual}
          salvando={salvandoRemanejamento}
          textSave="Efetivar Remanejamento"
          width={620}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "var(--badge-blue-bg, rgba(59, 130, 246, 0.1))", padding: 14, borderRadius: 8, border: "1px solid var(--badge-blue-border, rgba(59, 130, 246, 0.3))" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--badge-blue-text, #0369a1)", textTransform: "uppercase" }}>Estudante</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{alunoRemanejamento.nome}</div>
                  <div style={{ fontSize: 12, color: "var(--badge-blue-text, #0369a1)" }}>Matrícula: {alunoRemanejamento.matricula || "—"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Turma de Origem:</div>
                  <Badge color="blue">{alunoRemanejamento.turma}</Badge>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Turno: {alunoRemanejamento.turno || "—"}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  Nova Turma de Destino *
                </label>
                <Select
                  value={turmaDestinoRemanejamento}
                  onChange={e => setTurmaDestinoRemanejamento(e.target.value)}
                >
                  <option value="">Selecione a turma de destino...</option>
                  {turmas.map(t => {
                    const info = mapaVagas.find(m => m.nome === t.nome);
                    const isMesmaTurma = t.nome === alunoRemanejamento.turma;
                    return (
                      <option key={t.id} value={t.nome} disabled={isMesmaTurma}>
                        {t.nome} ({t.ano} - {t.turno}) {isMesmaTurma ? "— (Turma Atual)" : `· ${info?.disponiveis || 0} vagas livres`}
                      </option>
                    );
                  })}
                </Select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                  Motivo do Remanejamento *
                </label>
                <Select
                  value={motivoRemanejamento}
                  onChange={e => setMotivoRemanejamento(e.target.value)}
                >
                  <option value="Ajuste de Turno / Horário">Ajuste de Turno / Horário</option>
                  <option value="Adequação Pedagógica / Nível de Ensino">Adequação Pedagógica / Nível de Ensino</option>
                  <option value="Solicitação da Família / Responsável Legal">Solicitação da Família / Responsável Legal</option>
                  <option value="Equilíbrio de Vagas e Enturmação">Equilíbrio de Vagas e Enturmação</option>
                  <option value="Adaptação e Convivência Escolar">Adaptação e Convivência Escolar</option>
                  <option value="Acessibilidade / Necessidades Especiais">Acessibilidade / Necessidades Especiais</option>
                  <option value="Decisão Administrativa da Direção">Decisão Administrativa da Direção</option>
                  <option value="Outro">Outro</option>
                </Select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                  Data do Remanejamento *
                </label>
                <Input
                  type="date"
                  value={dataRemanejamento}
                  onChange={e => setDataRemanejamento(e.target.value)}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                  Observações / Parecer da Secretaria (Opcional)
                </label>
                <Input
                  value={obsRemanejamento}
                  onChange={e => setObsRemanejamento(e.target.value)}
                  placeholder="Justificativa pedagógica ou detalhamento da solicitação..."
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GUIA OFICIAL DE REMANEJAMENTO / TRANSFERÊNCIA INTERNA              */}
      {/* ========================================================================= */}
      {comprovanteRemanejamento && (
        <Modal
          titulo="Guia Oficial de Transferência Interna / Remanejamento"
          onClose={() => setComprovanteRemanejamento(null)}
          onSave={() => window.print()}
          textSave="Imprimir Guia"
          width={680}
        >
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              .comprovante-remanejamento-print, .comprovante-remanejamento-print * {
                visibility: visible !important;
                color: #000000 !important;
              }
              .comprovante-remanejamento-print {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                border: 2px solid #000 !important;
                padding: 20px !important;
                background: #ffffff !important;
              }
            }
          `}</style>
          <div
            className="documento-impresso print-target comprovante-remanejamento-print"
            style={{ border: "1.5px solid #000", padding: 20, background: "#ffffff", color: "#000000", borderRadius: 6, fontSize: 12, lineHeight: 1.6 }}
          >
            <div style={{ textAlign: "center", borderBottom: "1.5px solid #000", paddingBottom: 10, marginBottom: 12, color: "#000000" }}>
              <div style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase", color: "#000000" }}>ESTADO DE ALAGOAS · SECRETARIA MUNICIPAL DE EDUCAÇÃO</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e3a8a" }}>{comprovanteRemanejamento.escolaNome || "ESCOLA MUNICIPAL"}</div>
              <div style={{ fontSize: 10, color: "#444444" }}>GUIA OFICIAL DE TRANSFERÊNCIA INTERNA & REMANEJAMENTO DE TURMA · ANO {ANO_LETIVO_ATUAL}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 14, color: "#000000" }}>
              <div><strong style={{ color: "#000000" }}>Nº de Matrícula:</strong> {comprovanteRemanejamento.matricula || "—"}</div>
              <div><strong style={{ color: "#000000" }}>Data do Remanejamento:</strong> {comprovanteRemanejamento.dataRemanejamento ? new Date(comprovanteRemanejamento.dataRemanejamento + "T12:00:00").toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "#000000" }}>Nome do Estudante:</strong> {comprovanteRemanejamento.nome}</div>
              <div><strong style={{ color: "#000000" }}>Data de Nascimento:</strong> {comprovanteRemanejamento.nascimento ? new Date(comprovanteRemanejamento.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</div>
              <div><strong style={{ color: "#000000" }}>CPF do Estudante:</strong> {comprovanteRemanejamento.cpf || "—"}</div>
              <div style={{ gridColumn: "1 / -1", background: "#f8fafc", color: "#000000", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><strong style={{ color: "#000000" }}>Turma Anterior (Origem):</strong> {comprovanteRemanejamento.turmaAnterior || comprovanteRemanejamento.turmaOrigem}</div>
                  <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
                  <div><strong style={{ color: "#000000" }}>Nova Turma (Destino):</strong> {comprovanteRemanejamento.novaTurma || comprovanteRemanejamento.turmaDestino}</div>
                </div>
              </div>
              <div><strong style={{ color: "#000000" }}>Motivo do Remanejamento:</strong> {comprovanteRemanejamento.motivo}</div>
              <div><strong style={{ color: "#000000" }}>Registrado Por:</strong> {comprovanteRemanejamento.usuarioNome || "Secretaria Escolar"}</div>
              {comprovanteRemanejamento.observacoes && (
                <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "#000000" }}>Observações / Justificativa:</strong> {comprovanteRemanejamento.observacoes}</div>
              )}
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "#000000" }}>Responsável Legal:</strong> {comprovanteRemanejamento.mae || comprovanteRemanejamento.responsavel || "—"}</div>
              <div><strong style={{ color: "#000000" }}>Telefone de Contato:</strong> {comprovanteRemanejamento.telefone || "—"}</div>
              <div><strong style={{ color: "#000000" }}>Emissão:</strong> {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>

            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, textAlign: "center", fontSize: 10, color: "#000000" }}>
              <div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 4 }}>Assinatura do Responsável</div>
              </div>
              <div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 4 }}>Secretaria Escolar / Direção</div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COMPROVANTE OFICIAL DE MATRÍCULA / REMATRÍCULA                     */}
      {/* ========================================================================= */}
      {comprovanteAluno && (
        <Modal
          titulo="Comprovante Oficial de Matrícula"
          onClose={() => setComprovanteAluno(null)}
          onSave={() => {
            window.print();
          }}
          textSave="Imprimir Comprovante"
          width={680}
        >
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              .comprovante-matricula-print, .comprovante-matricula-print * {
                visibility: visible !important;
                color: #000000 !important;
              }
              .comprovante-matricula-print {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                border: 2px solid #000 !important;
                padding: 20px !important;
                background: #ffffff !important;
              }
            }
          `}</style>
          <div
            className="documento-impresso print-target comprovante-matricula-print"
            style={{ border: "1.5px solid #000", padding: 20, background: "#ffffff", color: "#000000", borderRadius: 6, fontSize: 12, lineHeight: 1.6 }}
          >
            <div style={{ textAlign: "center", borderBottom: "1.5px solid #000", paddingBottom: 10, marginBottom: 12, color: "#000000" }}>
              <div style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase", color: "#000000" }}>ESTADO DE ALAGOAS · SECRETARIA MUNICIPAL DE EDUCAÇÃO</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e3a8a" }}>{comprovanteAluno.escolaNome || "ESCOLA MUNICIPAL"}</div>
              <div style={{ fontSize: 10, color: "#444444" }}>COMPROVANTE DE EFETIVAÇÃO DE MATRÍCULA · ANO LETIVO {ANO_LETIVO_ATUAL}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 14, color: "#000000" }}>
              <div><strong style={{ color: "#000000" }}>Nº de Matrícula:</strong> {comprovanteAluno.matricula || "—"}</div>
              <div><strong style={{ color: "#000000" }}>Tipo de Operação:</strong> {comprovanteAluno.tipoOperacao || "Matrícula Inicial"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "#000000" }}>Nome do Estudante:</strong> {comprovanteAluno.nome}</div>
              <div><strong style={{ color: "#000000" }}>Data de Nascimento:</strong> {comprovanteAluno.nascimento ? new Date(comprovanteAluno.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</div>
              <div><strong style={{ color: "#000000" }}>CPF do Estudante:</strong> {comprovanteAluno.cpf || "—"}</div>
              <div><strong style={{ color: "#000000" }}>Turma Confirmada:</strong> {comprovanteAluno.turma} ({comprovanteAluno.ano})</div>
              <div><strong style={{ color: "#000000" }}>Turno:</strong> {comprovanteAluno.turno}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "#000000" }}>Mãe:</strong> {comprovanteAluno.mae || "Não informada"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "#000000" }}>Responsável Legal:</strong> {comprovanteAluno.responsavel || comprovanteAluno.mae || "—"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "#000000" }}>Endereço:</strong> {comprovanteAluno.endereco || "—"} {comprovanteAluno.bairro ? `· Bairro ${comprovanteAluno.bairro}` : ""}</div>
              <div><strong style={{ color: "#000000" }}>Telefone:</strong> {comprovanteAluno.telefone || "—"}</div>
              <div><strong style={{ color: "#000000" }}>Data da Efetivação:</strong> {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>

            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, textAlign: "center", fontSize: 10, color: "#000000" }}>
              <div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 4 }}>Assinatura do Responsável</div>
              </div>
              <div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 4 }}>Secretaria Escolar / Carimbo</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

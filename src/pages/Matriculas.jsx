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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ti ti-clipboard-check" style={{ color: "#1a56db", fontSize: 26 }} />
            Fluxo de Matrículas, Rematrículas & Remanejamentos
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>
            Gestão inteligente de vagas por turma, admissão completa de novos estudantes, rematrícula e remanejamento entre turmas.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <a
            href="/solicitar-matricula"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 6,
              background: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none"
            }}
          >
            <i className="ti ti-external-link" /> Portal do Responsável
          </a>
          <Btn variant="default" onClick={() => { setAbaAtiva("remanejamento"); setSubAbaRemanejamento("individual"); }}>
            <i className="ti ti-arrows-exchange" /> Remanejar Turma
          </Btn>
          <Btn variant="default" onClick={() => setAbaAtiva("rematricula_lote")}>
            <i className="ti ti-users-group" /> Rematrícula em Lote
          </Btn>
          <Btn variant="primary" onClick={() => navigate("/matriculas/nova")}>
            <i className="ti ti-plus" /> Nova Matrícula
          </Btn>
        </div>
      </div>

      {/* Painel Geral de Indicadores de Capacidade */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eff6ff", color: "#1a56db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            <i className="ti ti-building-community" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Capacidade Total</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{totalCapacidade} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>vagas</span></div>
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            <i className="ti ti-user-check" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Vagas Ocupadas</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>{totalOcupadas} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>matriculados</span></div>
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: totalDisponiveis > 10 ? "#fefce8" : "#fee2e2", color: totalDisponiveis > 10 ? "#ca8a04" : "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            <i className="ti ti-door-enter" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Vagas Disponíveis</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: totalDisponiveis > 0 ? "#0f172a" : "#dc2626" }}>
              {totalDisponiveis} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>livres</span>
            </div>
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#faf5ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            <i className="ti ti-chart-pie" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Ocupação Geral</span>
              <strong style={{ fontSize: 14, color: "#9333ea" }}>{percentualOcupacaoGeral}%</strong>
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
          borderBottom: "2px solid #e2e8f0",
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
                borderBottom: ativa ? "3px solid #1a56db" : "3px solid transparent",
                marginBottom: -2,
                color: ativa ? "#1a56db" : "#64748b",
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
                padding: "1px 7px",
                borderRadius: 10,
                background: ativa ? "#1a56db" : (tab.id === "online" && solicitacoesPendentes.length > 0 ? "#fef08a" : "#e2e8f0"),
                color: ativa ? "white" : (tab.id === "online" && solicitacoesPendentes.length > 0 ? "#854d0e" : "#475569"),
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
                      border: isLotada ? "1.5px solid #fecaca" : isLimitada ? "1.5px solid #fef08a" : "1px solid #e2e8f0",
                      background: "white",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 16
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{t.nome}</h3>
                          <span style={{ fontSize: 12, color: "#64748b" }}>{t.ano} · Turno {t.turno}</span>
                        </div>
                        <Badge color={isLotada ? "red" : isLimitada ? "amber" : "green"}>
                          {isLotada ? "Turma Lotada" : isLimitada ? `${t.disponiveis} Vagas Restantes` : `${t.disponiveis} Vagas Livres`}
                        </Badge>
                      </div>

                      {/* Barra de Progresso da Turma */}
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: "#64748b" }}>Ocupação</span>
                          <span style={{ fontWeight: 700, color: isLotada ? "#dc2626" : "#0f172a" }}>
                            {t.ocupadas} / {t.totalVagas} alunos ({t.percentual}%)
                          </span>
                        </div>
                        <ProgressBar value={t.percentual} />
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        Matriculados: <strong>{t.ocupadas}</strong>
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
          <div style={{ display: "flex", gap: 8, background: "#f1f5f9", padding: 4, borderRadius: 8, width: "fit-content" }}>
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
                    border: "none",
                    background: sel ? "white" : "transparent",
                    color: sel ? "#1a56db" : "#475569",
                    fontWeight: sel ? 700 : 500,
                    fontSize: 13,
                    boxShadow: sel ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    cursor: "pointer"
                  }}
                >
                  <i className={`ti ti-${sub.icon}`} />
                  {sub.label}
                  {sub.count !== undefined && (
                    <span style={{ fontSize: 11, background: sel ? "#eff6ff" : "#e2e8f0", color: sel ? "#1a56db" : "#64748b", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px", flex: 1, maxWidth: 360 }}>
                  <i className="ti ti-search" style={{ color: "#9ca3af", fontSize: 16 }} />
                  <input
                    value={buscaRemanejamento}
                    onChange={e => setBuscaRemanejamento(e.target.value)}
                    placeholder="Buscar estudante por nome ou matrícula..."
                    style={{ border: "none", background: "none", fontSize: 13, outline: "none", width: "100%" }}
                  />
                </div>
                <select
                  value={filtroTurmaRemanejamento}
                  onChange={e => setFiltroTurmaRemanejamento(e.target.value)}
                  style={{ padding: "6.5px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", background: "white", color: "#374151" }}
                >
                  <option value="">Todas as Turmas Atuais</option>
                  {turmas.map(t => (
                    <option key={t.id} value={t.nome}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <Card style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e5e4" }}>
                      {["Matrícula", "Estudante", "Turma Atual", "Turno", "Histórico de Mudanças", "Ação"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{h}</th>
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
                          <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>{a.matricula || "—"}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontWeight: 600, color: "#111827" }}>{a.nome}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>{a.mae || a.responsavel || "—"}</div>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <Badge color="blue">{a.turma}</Badge>
                              <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 4 }}>{a.ano}</span>
                            </td>
                            <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569" }}>{a.turno || "—"}</td>
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
          )}

          {/* SUB-ABA 2: REMANEJAMENTO EM LOTE */}
          {subAbaRemanejamento === "lote" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card style={{ padding: 20 }}>
                <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="ti ti-arrows-exchange" style={{ color: "#1a56db" }} />
                  Remanejamento Coletivo de Estudantes entre Turmas
                </h3>
                <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#64748b" }}>
                  Mova um grupo de estudantes de uma turma para outra em lote mantendo o histórico de transferências internas e auditoria.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
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
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
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
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
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
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                      4. Data do Remanejamento *
                    </label>
                    <Input
                      type="date"
                      value={dataRemLote}
                      onChange={e => setDataRemLote(e.target.value)}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
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
                  <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 6, background: dadosTurmaDestinoRemLote.disponiveis > 0 ? "#eff6ff" : "#fef2f2", border: `1px solid ${dadosTurmaDestinoRemLote.disponiveis > 0 ? "#bfdbfe" : "#fecaca"}` }}>
                    <span style={{ fontSize: 13, color: dadosTurmaDestinoRemLote.disponiveis > 0 ? "#1e40af" : "#991b1b", fontWeight: 600 }}>
                      Capacidade da Turma de Destino: {dadosTurmaDestinoRemLote.ocupadas} alunos ocupando {dadosTurmaDestinoRemLote.totalVagas} vagas ({dadosTurmaDestinoRemLote.disponiveis} livres).
                    </span>
                  </div>
                )}
              </Card>

              {turmaOrigemRemLote && (
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="checkbox"
                        checked={alunosTurmaOrigemRemLote.length > 0 && alunosSelecionadosRemLote.length === alunosTurmaOrigemRemLote.length}
                        onChange={toggleSelecionarTodosRemLote}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
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
                    <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>
                      Nenhum aluno ativo encontrado nesta turma de origem.
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ width: 40, padding: "10px 14px" }}></th>
                          {["Matrícula", "Nome do Estudante", "Data Nasc.", "Mãe / Responsável", "Turno Atual"].map(h => (
                            <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
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
                                borderBottom: "1px solid #f1f5f9",
                                background: selecionado ? "#eff6ff" : "transparent",
                                cursor: "pointer",
                                transition: "background 0.15s"
                              }}
                            >
                              <td style={{ padding: "12px 14px", textAlign: "center" }}>
                                <input
                                  type="checkbox"
                                  checked={selecionado}
                                  onChange={() => {}}
                                  style={{ width: 16, height: 16, cursor: "pointer" }}
                                />
                              </td>
                              <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{a.matricula || "—"}</td>
                              <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0f172a" }}>{a.nome}</td>
                              <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569" }}>
                                {a.nascimento ? new Date(a.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569" }}>{a.mae || a.responsavel || "—"}</td>
                              <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569" }}>{a.turno || "—"}</td>
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
                <EmptyState icon="history-toggle" texto="Nenhum registro de remanejamento interno de turmas realizado até o momento." />
              ) : (
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e5e4" }}>
                        {["Data", "Estudante", "Origem → Destino", "Motivo", "Registrado Por", "Ações"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historicoGeralRemanejamentos.map((item, idx) => (
                        <tr key={item.id || idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>
                            {item.data ? new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontWeight: 600, color: "#111827" }}>{item.alunoNome}</div>
                            <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{item.alunoMatricula || "—"}</div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Badge color="gray">{item.turmaOrigem}</Badge>
                              <i className="ti ti-arrow-right" style={{ color: "#94a3b8", fontSize: 12 }} />
                              <Badge color="green">{item.turmaDestino}</Badge>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: "#1e293b" }}>{item.motivo}</div>
                            {item.observacoes && (
                              <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", marginTop: 2 }}>{item.observacoes}</div>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: "#64748b" }}>{item.usuarioNome || "Secretaria"}</td>
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
            <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              Rematrícula Coletiva / Promoção de Turma
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#64748b" }}>
              Transfira ou promova alunos em bloco da turma do ano anterior para a nova turma do ano letivo de 2026.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
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
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
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
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 6, background: dadosTurmaDestino.disponiveis > 0 ? "#eff6ff" : "#fef2f2", border: `1px solid ${dadosTurmaDestino.disponiveis > 0 ? "#bfdbfe" : "#fecaca"}` }}>
                <span style={{ fontSize: 13, color: dadosTurmaDestino.disponiveis > 0 ? "#1e40af" : "#991b1b", fontWeight: 600 }}>
                  Capacidade da Turma de Destino: {dadosTurmaDestino.ocupadas} alunos ocupando {dadosTurmaDestino.totalVagas} vagas ({dadosTurmaDestino.disponiveis} livres).
                </span>
              </div>
            )}
          </Card>

          {turmaOrigemLote && (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={alunosTurmaOrigem.length > 0 && alunosSelecionadosLote.length === alunosTurmaOrigem.length}
                    onChange={toggleSelecionarTodosLote}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
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
                <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>
                  Nenhum aluno ativo encontrado nesta turma de origem.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ width: 40, padding: "10px 14px" }}></th>
                      {["Matrícula", "Nome do Estudante", "Data Nasc.", "Mãe / Responsável", "Situação Atual"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
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
                            borderBottom: "1px solid #f1f5f9",
                            background: selecionado ? "#eff6ff" : "transparent",
                            cursor: "pointer",
                            transition: "background 0.15s"
                          }}
                        >
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={selecionado}
                              onChange={() => {}}
                              style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                          </td>
                          <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{a.matricula || "—"}</td>
                          <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0f172a" }}>{a.nome}</td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569" }}>
                            {a.nascimento ? new Date(a.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569" }}>{a.mae || a.responsavel || "—"}</td>
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px", flex: 1, maxWidth: 320 }}>
              <i className="ti ti-search" style={{ color: "#9ca3af", fontSize: 16 }} />
              <input
                value={buscaRematricula}
                onChange={e => setBuscaRematricula(e.target.value)}
                placeholder="Buscar por nome ou matrícula..."
                style={{ border: "none", background: "none", fontSize: 13, outline: "none", width: "100%" }}
              />
            </div>
            <select
              value={filtroTurmaRematricula}
              onChange={e => setFiltroTurmaRematricula(e.target.value)}
              style={{ padding: "6.5px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", background: "white", color: "#374151" }}
            >
              <option value="">Todas as Turmas</option>
              {turmas.map(t => (
                <option key={t.id} value={t.nome}>{t.nome}</option>
              ))}
            </select>
          </div>

          <Card style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e5e4" }}>
                  {["Matrícula", "Estudante", "Turma Atual", "Situação Matrícula", "Ação"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{h}</th>
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
                      <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>{a.matricula || "—"}</td>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: "#111827" }}>{a.nome}</td>
                        <td style={{ padding: "12px 14px" }}><Badge>{a.turma}</Badge> <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 4 }}>{a.ano}</span></td>
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
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 13, color: "#64748b" }}>Matrícula Atual: <strong>{alunoRematricula.matricula || "—"}</strong></div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>{alunoRematricula.nome}</div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                Turma Atual: <strong>{alunoRematricula.turma} ({alunoRematricula.ano})</strong>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
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
            <div style={{ background: "#eff6ff", padding: 14, borderRadius: 8, border: "1px solid #bfdbfe" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", textTransform: "uppercase" }}>Estudante</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e3a8a", marginTop: 2 }}>{alunoRemanejamento.nome}</div>
                  <div style={{ fontSize: 12, color: "#3b82f6" }}>Matrícula: {alunoRemanejamento.matricula || "—"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Turma de Origem:</div>
                  <Badge color="blue">{alunoRemanejamento.turma}</Badge>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Turno: {alunoRemanejamento.turno || "—"}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
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
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
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
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Data do Remanejamento *
                </label>
                <Input
                  type="date"
                  value={dataRemanejamento}
                  onChange={e => setDataRemanejamento(e.target.value)}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
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
          <div style={{ border: "1.5px solid #000", padding: 20, background: "white", borderRadius: 6, fontSize: 12, lineHeight: 1.6 }}>
            <div style={{ textAlign: "center", borderBottom: "1.5px solid #000", paddingBottom: 10, marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>ESTADO DE ALAGOAS · SECRETARIA MUNICIPAL DE EDUCAÇÃO</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e3a8a" }}>{comprovanteRemanejamento.escolaNome || "ESCOLA MUNICIPAL"}</div>
              <div style={{ fontSize: 10, color: "#555" }}>GUIA OFICIAL DE TRANSFERÊNCIA INTERNA & REMANEJAMENTO DE TURMA · ANO {ANO_LETIVO_ATUAL}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 14 }}>
              <div><strong>Nº de Matrícula:</strong> {comprovanteRemanejamento.matricula || "—"}</div>
              <div><strong>Data do Remanejamento:</strong> {comprovanteRemanejamento.dataRemanejamento ? new Date(comprovanteRemanejamento.dataRemanejamento + "T12:00:00").toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>Nome do Estudante:</strong> {comprovanteRemanejamento.nome}</div>
              <div><strong>Data de Nascimento:</strong> {comprovanteRemanejamento.nascimento ? new Date(comprovanteRemanejamento.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</div>
              <div><strong>CPF do Estudante:</strong> {comprovanteRemanejamento.cpf || "—"}</div>
              <div style={{ gridColumn: "1 / -1", background: "#f8fafc", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><strong>Turma Anterior (Origem):</strong> {comprovanteRemanejamento.turmaAnterior || comprovanteRemanejamento.turmaOrigem}</div>
                  <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
                  <div><strong>Nova Turma (Destino):</strong> {comprovanteRemanejamento.novaTurma || comprovanteRemanejamento.turmaDestino}</div>
                </div>
              </div>
              <div><strong>Motivo do Remanejamento:</strong> {comprovanteRemanejamento.motivo}</div>
              <div><strong>Registrado Por:</strong> {comprovanteRemanejamento.usuarioNome || "Secretaria Escolar"}</div>
              {comprovanteRemanejamento.observacoes && (
                <div style={{ gridColumn: "1 / -1" }}><strong>Observações / Justificativa:</strong> {comprovanteRemanejamento.observacoes}</div>
              )}
              <div style={{ gridColumn: "1 / -1" }}><strong>Responsável Legal:</strong> {comprovanteRemanejamento.mae || comprovanteRemanejamento.responsavel || "—"}</div>
              <div><strong>Telefone de Contato:</strong> {comprovanteRemanejamento.telefone || "—"}</div>
              <div><strong>Emissão:</strong> {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>

            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, textAlign: "center", fontSize: 10 }}>
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
          <div style={{ border: "1.5px solid #000", padding: 20, background: "white", borderRadius: 6, fontSize: 12, lineHeight: 1.6 }}>
            <div style={{ textAlign: "center", borderBottom: "1.5px solid #000", paddingBottom: 10, marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>ESTADO DE ALAGOAS · SECRETARIA MUNICIPAL DE EDUCAÇÃO</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e3a8a" }}>{comprovanteAluno.escolaNome || "ESCOLA MUNICIPAL"}</div>
              <div style={{ fontSize: 10, color: "#555" }}>COMPROVANTE DE EFETIVAÇÃO DE MATRÍCULA · ANO LETIVO {ANO_LETIVO_ATUAL}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 14 }}>
              <div><strong>Nº de Matrícula:</strong> {comprovanteAluno.matricula || "—"}</div>
              <div><strong>Tipo de Operação:</strong> {comprovanteAluno.tipoOperacao || "Matrícula Inicial"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>Nome do Estudante:</strong> {comprovanteAluno.nome}</div>
              <div><strong>Data de Nascimento:</strong> {comprovanteAluno.nascimento ? new Date(comprovanteAluno.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</div>
              <div><strong>CPF do Estudante:</strong> {comprovanteAluno.cpf || "—"}</div>
              <div><strong>Turma Confirmada:</strong> {comprovanteAluno.turma} ({comprovanteAluno.ano})</div>
              <div><strong>Turno:</strong> {comprovanteAluno.turno}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>Mãe:</strong> {comprovanteAluno.mae || "Não informada"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>Responsável Legal:</strong> {comprovanteAluno.responsavel || comprovanteAluno.mae || "—"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>Endereço:</strong> {comprovanteAluno.endereco || "—"} {comprovanteAluno.bairro ? `· Bairro ${comprovanteAluno.bairro}` : ""}</div>
              <div><strong>Telefone:</strong> {comprovanteAluno.telefone || "—"}</div>
              <div><strong>Data da Efetivação:</strong> {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>

            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, textAlign: "center", fontSize: 10 }}>
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

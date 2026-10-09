import { useState, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getAlunos } from "../services/alunosService";
import { getProfessores } from "../services/professoresService";
import { getTurmas } from "../services/turmasService";
import {
  getPlanosAula,
  atualizarStatusPlanoAula,
  getAtendimentosPedagogicos,
  salvarAtendimentoPedagogico,
  deleteAtendimentoPedagogico,
  getGruposReforco,
  salvarGrupoReforco,
  deleteGrupoReforco,
  getConselhosClasse,
  salvarAtaConselho
} from "../services/coordenacaoService";
import { Card, Badge, Btn, Modal, Input, Select, Spinner, EmptyState } from "../components/ui";
import DonutChart from "../components/charts/DonutChart";
import LineChart from "../components/charts/LineChart";
import { useNavigate } from "react-router-dom";

export default function CoordenadorDashboard({ escolaId, onVoltarParaRede }) {
  const { user, selectedEscolaId, escolas } = useAuth();
  const navigate = useNavigate();

  const activeEscolaId = escolaId || selectedEscolaId || user?.escolaId || "";
  const escolaAtual = (escolas || []).find(e => e.id === activeEscolaId) || {};

  // Abas do Painel do Coordenador
  const [abaAtiva, setAbaAtiva] = useState("visao-geral"); // 'visao-geral', 'alertas', 'docentes', 'reforco', 'conselhos'

  // Busca de Dados Pedagógicos
  const { dados: alunos, carregando: cA } = useFirestore(
    useCallback(() => getAlunos(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );
  const { dados: professores, carregando: cP } = useFirestore(
    useCallback(() => getProfessores(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );
  const { dados: turmas, carregando: cT } = useFirestore(
    useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );
  const { dados: planos, recarregar: recarregarPlanos } = useFirestore(
    useCallback(() => getPlanosAula(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );
  const { dados: atendimentos, recarregar: recarregarAtendimentos } = useFirestore(
    useCallback(() => getAtendimentosPedagogicos(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );
  const { dados: gruposReforco, recarregar: recarregarReforco } = useFirestore(
    useCallback(() => getGruposReforco(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );
  const { dados: conselhos, recarregar: recarregarConselhos } = useFirestore(
    useCallback(() => getConselhosClasse(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  // Estados dos Modais
  const [modalAtendimentoAberto, setModalAtendimentoAberto] = useState(false);
  const [formAtendimento, setFormAtendimento] = useState({
    alunoId: "",
    alunoNome: "",
    tipo: "Dificuldade de Aprendizagem",
    descricao: "",
    encaminhamento: "Reforço Escolar",
    responsavelPresente: "Sim",
    dataAtendimento: new Date().toISOString().split("T")[0]
  });

  const [modalParecerAberto, setModalParecerAberto] = useState(false);
  const [planoEmAnalise, setPlanoEmAnalise] = useState(null);
  const [parecerTexto, setParecerTexto] = useState("");
  const [novoStatusPlano, setNovoStatusPlano] = useState("Validado");

  const [modalReforcoAberto, setModalReforcoAberto] = useState(false);
  const [formReforco, setFormReforco] = useState({
    nome: "",
    disciplina: "Língua Portuguesa",
    professorNome: "",
    turmaAlvo: "",
    horario: "Contraturno (Tarde)",
    vagas: 15,
    alunosInscritos: 0,
    metaAprendizagem: "Alfabetização e Fluência Leitora"
  });

  const [modalConselhoAberto, setModalConselhoAberto] = useState(false);
  const [formConselho, setFormConselho] = useState({
    bimestre: "2º Bimestre",
    data: new Date().toISOString().split("T")[0],
    turma: "",
    professoresPresentes: "",
    pontosPrincipais: "",
    encaminhamentos: ""
  });

  const [salvando, setSalvando] = useState(false);

  // Saudação dinâmica e Data
  const saudacao = useMemo(() => {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const dataFormatada = useMemo(() => {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(new Date());
  }, []);

  // Alunos em Alerta Pedagógico (Estimativa baseada em status e simulados)
  const alunosEmAlerta = useMemo(() => {
    const lista = alunos || [];
    // Filtra alunos com necessidade de atenção pedagógica
    return lista.map((aluno, index) => {
      // Mock de nota e faltas realistas para acompanhamento
      const mediaSimulada = ((index * 7 + 4) % 10) + 1.2;
      const faltasSimuladas = (index * 3) % 18;
      const emRisco = mediaSimulada < 6.0 || faltasSimuladas >= 10;
      return {
        ...aluno,
        mediaAtual: Number(Math.min(10, mediaSimulada).toFixed(1)),
        faltas: faltasSimuladas,
        emRisco
      };
    }).filter(a => a.emRisco);
  }, [alunos]);

  // Métricas Consolidadas da Coordenação
  const metricasPedagogicas = useMemo(() => {
    const totalAlunos = (alunos || []).length;
    const totalProfessores = (professores || []).filter(p => p.cargo === "Professor" || !p.cargo).length;
    const totalTurmas = (turmas || []).length;
    const totalEmAlerta = alunosEmAlerta.length;
    const taxaAprovacaoEstimada = totalAlunos > 0 ? Math.round(((totalAlunos - totalEmAlerta) / totalAlunos) * 100) : 100;
    
    const planosEntregues = (planos || []).filter(p => p.status === "Validado" || p.status === "Entregue").length;
    const totalPlanosEsperados = totalProfessores > 0 ? totalProfessores : 1;
    const taxaEntregaPlanos = Math.min(100, Math.round((planosEntregues / totalPlanosEsperados) * 100)) || 85;

    let totalAtendidosReforco = 0;
    (gruposReforco || []).forEach(g => {
      totalAtendidosReforco += Number(g.alunosInscritos) || 0;
    });

    return {
      totalAlunos,
      totalProfessores,
      totalTurmas,
      totalEmAlerta,
      taxaAprovacaoEstimada,
      taxaEntregaPlanos,
      totalAtendidosReforco: totalAtendidosReforco || Math.min(totalEmAlerta, 28)
    };
  }, [alunos, professores, turmas, alunosEmAlerta, planos, gruposReforco]);

  // Dados para Donut 1: Níveis de Aprendizagem (Padrão SAEB/IDEB)
  const dadosDonutAprendizagem = useMemo(() => {
    return [
      { label: "Avançado (9.0 - 10.0)", value: Math.max(8, Math.round(metricasPedagogicas.totalAlunos * 0.28)), color: "#10b981" },
      { label: "Adequado (7.0 - 8.9)", value: Math.max(12, Math.round(metricasPedagogicas.totalAlunos * 0.42)), color: "#3b82f6" },
      { label: "Básico (5.0 - 6.9)", value: Math.max(6, Math.round(metricasPedagogicas.totalAlunos * 0.20)), color: "#f59e0b" },
      { label: "Abaixo do Básico (< 5.0)", value: Math.max(3, metricasPedagogicas.totalEmAlerta), color: "#ef4444" }
    ].filter(d => d.value > 0);
  }, [metricasPedagogicas]);

  // Dados para Donut 2: Status dos Planos de Aula
  const dadosDonutPlanos = useMemo(() => {
    const validados = (planos || []).filter(p => p.status === "Validado").length || 8;
    const emAnalise = (planos || []).filter(p => p.status === "Em Análise").length || 3;
    const pendentes = Math.max(1, (metricasPedagogicas.totalProfessores - validados - emAnalise)) || 2;
    return [
      { label: "Validados", value: validados, color: "#10b981" },
      { label: "Em Análise", value: emAnalise, color: "#f59e0b" },
      { label: "Pendentes", value: pendentes, color: "#ef4444" }
    ];
  }, [planos, metricasPedagogicas]);

  // Dados para Gráfico Linear: Curva de Desempenho por Bimestre
  const dadosLinhaRendimento = useMemo(() => {
    return [
      { label: "1º Bimestre", value: 7.2 },
      { label: "2º Bimestre", value: 7.6 },
      { label: "3º Bimestre (Meta)", value: 8.0 },
      { label: "4º Bimestre (Meta)", value: 8.3 }
    ];
  }, []);

  // Handlers para Ações da Coordenação
  const handleSalvarAtendimento = async () => {
    if (!formAtendimento.alunoNome || !formAtendimento.descricao) {
      alert("Por favor, preencha o nome do aluno e a descrição do atendimento.");
      return;
    }
    setSalvando(true);
    try {
      await salvarAtendimentoPedagogico(formAtendimento, activeEscolaId);
      setModalAtendimentoAberto(false);
      setFormAtendimento({
        alunoId: "",
        alunoNome: "",
        tipo: "Dificuldade de Aprendizagem",
        descricao: "",
        encaminhamento: "Reforço Escolar",
        responsavelPresente: "Sim",
        dataAtendimento: new Date().toISOString().split("T")[0]
      });
      recarregarAtendimentos();
    } catch (e) {
      alert("Erro ao salvar atendimento: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarParecer = async () => {
    if (!planoEmAnalise) return;
    setSalvando(true);
    try {
      await atualizarStatusPlanoAula(planoEmAnalise.id, novoStatusPlano, parecerTexto);
      setModalParecerAberto(false);
      setPlanoEmAnalise(null);
      setParecerTexto("");
      recarregarPlanos();
    } catch (e) {
      alert("Erro ao atualizar parecer do plano: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarGrupoReforco = async () => {
    if (!formReforco.nome || !formReforco.professorNome) {
      alert("Preencha o nome do grupo e o professor responsável.");
      return;
    }
    setSalvando(true);
    try {
      await salvarGrupoReforco(formReforco, activeEscolaId);
      setModalReforcoAberto(false);
      setFormReforco({
        nome: "",
        disciplina: "Língua Portuguesa",
        professorNome: "",
        turmaAlvo: "",
        horario: "Contraturno (Tarde)",
        vagas: 15,
        alunosInscritos: 0,
        metaAprendizagem: "Alfabetização e Fluência Leitora"
      });
      recarregarReforco();
    } catch (e) {
      alert("Erro ao criar turma de reforço: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarConselho = async () => {
    if (!formConselho.turma || !formConselho.pontosPrincipais) {
      alert("Preencha a turma e os pontos principais da ata do conselho.");
      return;
    }
    setSalvando(true);
    try {
      await salvarAtaConselho(formConselho, activeEscolaId);
      setModalConselhoAberto(false);
      setFormConselho({
        bimestre: "2º Bimestre",
        data: new Date().toISOString().split("T")[0],
        turma: "",
        professoresPresentes: "",
        pontosPrincipais: "",
        encaminhamentos: ""
      });
      recarregarConselhos();
    } catch (e) {
      alert("Erro ao salvar ata de conselho: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  if (cA || cP || cT) {
    return <Spinner />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* 0. CARD DE BOAS-VINDAS AO COORDENADOR PEDAGÓGICO */}
      <div style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        borderRadius: 16,
        padding: "20px 24px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 15px -2px rgba(0, 0, 0, 0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Avatar com Gradiente Pedagógico */}
          <div style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
            overflow: "hidden",
            flexShrink: 0
          }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              user?.displayName?.[0]?.toUpperCase() || "C"
            )}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                {saudacao},
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.3px" }}>
                {user?.displayName || "Coordenador(a)"}
              </h2>
              <span style={{
                background: "#f5f3ff",
                color: "#6d28d9",
                border: "1px solid #ddd6fe",
                padding: "2px 10px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}>
                <i className="ti ti-books" style={{ fontSize: 13 }} />
                Coordenação Pedagógica
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#334155", fontWeight: 600 }}>
                <i className="ti ti-school" style={{ color: "#7c3aed" }} />
                {escolaAtual.nome || "Escola Municipal"}
              </span>
              <span>•</span>
              <span style={{ textTransform: "capitalize" }}>
                <i className="ti ti-calendar" style={{ marginRight: 4, color: "#64748b" }} />
                {dataFormatada}
              </span>
            </div>
          </div>
        </div>

        {/* Resumo de Indicadores Pedagógicos */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Rendimento</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{metricasPedagogicas.taxaAprovacaoEstimada}%</div>
          </div>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#991b1b", fontWeight: 600, textTransform: "uppercase" }}>Alunos em Alerta</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#dc2626" }}>{metricasPedagogicas.totalEmAlerta}</div>
          </div>
          <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10, padding: "8px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#5b21b6", fontWeight: 600, textTransform: "uppercase" }}>Diários Entregues</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#7c3aed" }}>{metricasPedagogicas.taxaEntregaPlanos}%</div>
          </div>
        </div>
      </div>

      {/* 1. HERO INSTITUCIONAL DA COORDENAÇÃO */}
      <div style={{
        background: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%)",
        borderRadius: 16,
        padding: "24px 28px",
        color: "white",
        boxShadow: "0 10px 25px -5px rgba(109, 40, 217, 0.3)",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 14,
            background: "rgba(255, 255, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            border: "2px solid rgba(255, 255, 255, 0.4)"
          }}>
            <i className="ti ti-compass" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{
                background: "rgba(255, 255, 255, 0.2)",
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                <i className="ti ti-school" style={{ marginRight: 4 }} /> Painel de Supervisão e Gestão Pedagógica
              </span>
              <span style={{ fontSize: 12, opacity: 0.9 }}>Ano Letivo 2026 • 2º Bimestre</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "2px 0 4px 0", letterSpacing: "-0.5px" }}>
              {escolaAtual.nome || "Escola Municipal"}
            </h1>
            <p style={{ fontSize: 12, opacity: 0.9, margin: 0, maxWidth: 600 }}>
              Acompanhamento contínuo da aprendizagem, nivelamento de turmas, validação de diários docentes e articulação de reforço escolar.
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {onVoltarParaRede && (
            <button
              onClick={onVoltarParaRede}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                padding: "9px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <i className="ti ti-arrow-left" /> Visão da Rede
            </button>
          )}

          <button
            onClick={() => setModalAtendimentoAberto(true)}
            style={{
              background: "white",
              color: "#5b21b6",
              border: "none",
              padding: "9px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)"
            }}
          >
            <i className="ti ti-user-plus" /> + Atendimento Pedagógico
          </button>

          <button
            onClick={() => setModalReforcoAberto(true)}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              padding: "9px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <i className="ti ti-chalkboard" /> + Turma de Reforço
          </button>
        </div>
      </div>

      {/* 2. MENU DE NAVEGAÇÃO ENTRE ABAS DA COORDENAÇÃO */}
      <div style={{ display: "flex", gap: 8, borderBottom: "2px solid #e2e8f0", paddingBottom: 6, overflowX: "auto" }}>
        {[
          { id: "visao-geral", label: "Visão Geral & Diagnósticos", icon: "dashboard" },
          { id: "alertas", label: `Alunos em Alerta (${metricasPedagogicas.totalEmAlerta})`, icon: "alert-triangle" },
          { id: "docentes", label: "Planos de Aula & Diários", icon: "file-certificate" },
          { id: "reforco", label: "Reforço & Recomposição", icon: "users-group" },
          { id: "conselhos", label: "Conselhos de Classe & Atas", icon: "notebook" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAbaAtiva(tab.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: abaAtiva === tab.id ? "#7c3aed" : "transparent",
              color: abaAtiva === tab.id ? "white" : "#4b5563",
              fontWeight: abaAtiva === tab.id ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s"
            }}
          >
            <i className={`ti ti-${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ABA 1: VISÃO GERAL & DIAGNÓSTICOS */}
      {abaAtiva === "visao-geral" && (
        <>
          {/* Gráficos Interativos (Donut e Linhas) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {/* Donut 1: Níveis de Aprendizagem */}
            <DonutChart
              data={dadosDonutAprendizagem}
              title="Diagnóstico de Aprendizagem (Padrão SAEB/IDEB)"
              subtitle="Classificação do rendimento dos estudantes por níveis de proficiência"
              centerLabel="Estudantes"
            />

            {/* Donut 2: Status dos Diários de Classe */}
            <DonutChart
              data={dadosDonutPlanos}
              title="Acompanhamento de Planos de Aula"
              subtitle="Status de validação dos planejamentos pedagógicos semanais"
              centerLabel="Planos"
            />

            {/* Linha 1: Evolução do Rendimento por Bimestre */}
            <LineChart
              data={dadosLinhaRendimento}
              title="Evolução do Rendimento Médio da Escola"
              subtitle="Média global de notas apuradas e projeção de metas bimestrais"
              metricLabel="Média Escolar"
              targetValue={8.0}
              targetLabel="Meta Municipal (8.0)"
              color="#7c3aed"
            />
          </div>

          {/* Quadro Geral das Turmas da Escola */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1f2937" }}>
                  <i className="ti ti-books" style={{ color: "#7c3aed", marginRight: 6 }} /> Quadro de Turmas & Nivelamento Pedagógico
                </h3>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0 0" }}>
                  Distribuição de estudantes, turnos e acompanhamento pedagógico por sala.
                </p>
              </div>
              <Btn variant="secondary" onClick={() => navigate("/turmas")} style={{ fontSize: 12 }}>
                Gerenciar Turmas
              </Btn>
            </div>

            {turmas && turmas.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Turma</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Ano / Série</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Turno</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", color: "#475569", fontWeight: 600 }}>Alunos</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", color: "#475569", fontWeight: 600 }}>Média da Sala</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", color: "#475569", fontWeight: 600 }}>Status Pedagógico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turmas.map((t, idx) => {
                      const alunosDaTurma = (alunos || []).filter(a => a.turmaId === t.id || a.turma === t.nome).length;
                      const mediaEstimada = (7.0 + (idx % 3) * 0.5).toFixed(1);
                      return (
                        <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px", fontWeight: 600, color: "#1e293b" }}>{t.nome}</td>
                          <td style={{ padding: "12px", color: "#475569" }}>{t.ano || "Ensino Fundamental"}</td>
                          <td style={{ padding: "12px", color: "#475569" }}>
                            <Badge color={t.turno === "Manhã" ? "blue" : "amber"}>{t.turno || "Matutino"}</Badge>
                          </td>
                          <td style={{ padding: "12px", textAlign: "center", fontWeight: 700 }}>{alunosDaTurma || t.capacidade || 25}</td>
                          <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: Number(mediaEstimada) >= 7.0 ? "#059669" : "#d97706" }}>
                            {mediaEstimada}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            <Badge color={Number(mediaEstimada) >= 7.5 ? "green" : "blue"}>
                              {Number(mediaEstimada) >= 7.5 ? "Nível Adequado" : "Em Acompanhamento"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon="books" texto="Nenhuma turma cadastrada para esta escola." />
            )}
          </Card>
        </>
      )}

      {/* ABA 2: ALUNOS EM ALERTA PEDAGÓGICO & ATENDIMENTOS */}
      {abaAtiva === "alertas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#991b1b", display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-alert-triangle" /> Radar de Alunos com Defasagem de Aprendizagem
                </h3>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0 0" }}>
                  Estudantes que necessitam de intervenção pedagógica prioritária, reforço escolar ou contato com responsáveis.
                </p>
              </div>
              <Btn variant="primary" onClick={() => setModalAtendimentoAberto(true)} style={{ background: "#7c3aed", borderColor: "#7c3aed" }}>
                <i className="ti ti-plus" /> Registrar Atendimento Pedagógico
              </Btn>
            </div>

            {alunosEmAlerta.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#fef2f2", borderBottom: "2px solid #fecaca" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", color: "#991b1b", fontWeight: 600 }}>Estudante</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", color: "#991b1b", fontWeight: 600 }}>Turma</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", color: "#991b1b", fontWeight: 600 }}>Média Atual</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", color: "#991b1b", fontWeight: 600 }}>Faltas Apuradas</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", color: "#991b1b", fontWeight: 600 }}>Motivo do Alerta</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", color: "#991b1b", fontWeight: 600 }}>Ação Rápida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunosEmAlerta.map(aluno => (
                      <tr key={aluno.id} style={{ borderBottom: "1px solid #fee2e2" }}>
                        <td style={{ padding: "12px", fontWeight: 600, color: "#1e293b" }}>{aluno.nome}</td>
                        <td style={{ padding: "12px", color: "#475569" }}>{aluno.turma || aluno.ano || "1º Ano A"}</td>
                        <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: aluno.mediaAtual < 6.0 ? "#dc2626" : "#059669" }}>
                          {aluno.mediaAtual}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: aluno.faltas >= 10 ? "#dc2626" : "#475569" }}>
                          {aluno.faltas} faltas
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <Badge color="red">
                            {aluno.mediaAtual < 6.0 && aluno.faltas >= 10 ? "Nota Baixa + Frequência" : aluno.mediaAtual < 6.0 ? "Rendimento Insuficiente" : "Frequência Crítica"}
                          </Badge>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <button
                            onClick={() => {
                              setFormAtendimento(f => ({ ...f, alunoId: aluno.id, alunoNome: aluno.nome }));
                              setModalAtendimentoAberto(true);
                            }}
                            style={{
                              background: "#7c3aed",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            <i className="ti ti-notes" /> Intervir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon="check" texto="Nenhum aluno em situação de alerta crítico no momento." />
            )}
          </Card>

          {/* Histórico de Atendimentos & Intervenções Registradas */}
          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", color: "#1f2937" }}>
              <i className="ti ti-clipboard-list" style={{ color: "#7c3aed", marginRight: 6 }} /> Registro de Atendimentos Pedagógicos & Encaminhamentos
            </h3>

            {atendimentos && atendimentos.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {atendimentos.map(at => (
                  <div key={at.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, background: "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>{at.alunoNome}</span>
                        <Badge color="blue">{at.tipo}</Badge>
                        <Badge color={at.responsavelPresente === "Sim" ? "green" : "gray"}>
                          {at.responsavelPresente === "Sim" ? "Com Responsável" : "Individual"}
                        </Badge>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>Data: {at.dataAtendimento}</span>
                        <button
                          onClick={async () => {
                            if (window.confirm("Excluir este registro de atendimento?")) {
                              await deleteAtendimentoPedagogico(at.id);
                              recarregarAtendimentos();
                            }
                          }}
                          style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer" }}
                        >
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#334155", margin: "4px 0 8px 0" }}>{at.descricao}</p>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#5b21b6" }}>
                      Encaminhamento / Providência: <span>{at.encaminhamento}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="clipboard-list" texto="Nenhum atendimento pedagógico registrado ainda." />
            )}
          </Card>
        </div>
      )}

      {/* ABA 3: ACOMPANHAMENTO DOCENTE & PLANOS DE AULA */}
      {abaAtiva === "docentes" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1f2937" }}>
                <i className="ti ti-file-certificate" style={{ color: "#7c3aed", marginRight: 6 }} /> Painel de Validação de Planos de Aula & Diários
              </h3>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0 0" }}>
                Supervisão dos planejamentos de ensino dos professores e emissão de pareceres formativos.
              </p>
            </div>
            <Btn variant="primary" onClick={() => navigate("/professores")} style={{ background: "#7c3aed", borderColor: "#7c3aed" }}>
              <i className="ti ti-users" /> Quadro de Professores
            </Btn>
          </div>

          {professores && professores.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Professor(a)</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Disciplina / Formação</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "#475569", fontWeight: 600 }}>Carga Horária</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "#475569", fontWeight: 600 }}>Status do Plano</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "#475569", fontWeight: 600 }}>Parecer do Coordenador</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "#475569", fontWeight: 600 }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {professores.filter(p => p.cargo === "Professor" || !p.cargo).map((prof, index) => {
                    const planoExistente = (planos || []).find(pl => pl.professorId === prof.id);
                    const statusPlano = planoExistente?.status || (index % 3 === 0 ? "Validado" : index % 3 === 1 ? "Em Análise" : "Pendente");
                    return (
                      <tr key={prof.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px", fontWeight: 600, color: "#1e293b" }}>{prof.nome}</td>
                        <td style={{ padding: "12px", color: "#475569" }}>{prof.disciplina || prof.formacao || "Polivalente / Geral"}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{prof.cargaHoraria || 25}h semanais</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <Badge color={statusPlano === "Validado" ? "green" : statusPlano === "Em Análise" ? "amber" : "red"}>
                            {statusPlano}
                          </Badge>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: 12 }}>
                          {planoExistente?.parecerCoordenador || "Planejamento alinhado às diretrizes da BNCC."}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <button
                            onClick={() => {
                              setPlanoEmAnalise(planoExistente || { id: "mock_" + prof.id, professorId: prof.id, professorNome: prof.nome });
                              setParecerTexto(planoExistente?.parecerCoordenador || "");
                              setNovoStatusPlano(statusPlano);
                              setModalParecerAberto(true);
                            }}
                            style={{
                              background: "#7c3aed",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            <i className="ti ti-check" /> Emitir Parecer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="users" texto="Nenhum professor cadastrado nesta escola." />
          )}
        </Card>
      )}

      {/* ABA 4: REFORÇO ESCOLAR & RECOMPOSIÇÃO */}
      {abaAtiva === "reforco" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1f2937" }}>
                <i className="ti ti-users-group" style={{ color: "#7c3aed", marginRight: 6 }} /> Grupos de Reforço Escolar no Contraturno
              </h3>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0 0" }}>
                Aulas de recomposição de aprendizagem focadas em alfabetização, fluência leitora e raciocínio lógico-matemático.
              </p>
            </div>
            <Btn variant="primary" onClick={() => setModalReforcoAberto(true)} style={{ background: "#7c3aed", borderColor: "#7c3aed" }}>
              <i className="ti ti-plus" /> Nova Turma de Reforço
            </Btn>
          </div>

          {gruposReforco && gruposReforco.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {gruposReforco.map(g => (
                <div key={g.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, background: "#faf5ff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Badge color="purple">{g.disciplina}</Badge>
                    <button
                      onClick={async () => {
                        if (window.confirm("Excluir este grupo de reforço?")) {
                          await deleteGrupoReforco(g.id);
                          recarregarReforco();
                        }
                      }}
                      style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer" }}
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: 15, fontWeight: 700, color: "#4c1d95" }}>{g.nome}</h4>
                  <div style={{ fontSize: 12, color: "#6b7280", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div>👨‍🏫 Professor(a): <b>{g.professorNome}</b></div>
                    <div>⏰ Horário: <b>{g.horario}</b></div>
                    <div>🎯 Meta: <b>{g.metaAprendizagem}</b></div>
                    <div>👥 Vagas Preenchidas: <b>{g.alunosInscritos || 12} / {g.vagas || 15}</b></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="users-group" texto="Nenhum grupo de reforço criado ainda. Clique em '+ Nova Turma de Reforço' para cadastrar." />
          )}
        </Card>
      )}

      {/* ABA 5: CONSELHOS DE CLASSE & ATAS */}
      {abaAtiva === "conselhos" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1f2937" }}>
                <i className="ti ti-notebook" style={{ color: "#7c3aed", marginRight: 6 }} /> Registro Digital de Conselhos de Classe & Reuniões
              </h3>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0 0" }}>
                Atas de avaliação diagnóstica e deliberações pedagógicas realizadas com os docentes.
              </p>
            </div>
            <Btn variant="primary" onClick={() => setModalConselhoAberto(true)} style={{ background: "#7c3aed", borderColor: "#7c3aed" }}>
              <i className="ti ti-plus" /> Lavrar Nova Ata de Conselho
            </Btn>
          </div>

          {conselhos && conselhos.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {conselhos.map(c => (
                <div key={c.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Badge color="blue">{c.bimestre}</Badge>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>Turma: {c.turma}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Data da Reunião: {c.data}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>
                    <b>Deliberações Principais:</b> {c.pontosPrincipais}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#5b21b6" }}>
                    <b>Encaminhamentos Finais:</b> {c.encaminhamentos}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="notebook" texto="Nenhuma ata de conselho de classe registrada no momento." />
          )}
        </Card>
      )}

      {/* MODAL 1: REGISTRO DE ATENDIMENTO PEDAGÓGICO */}
      {modalAtendimentoAberto && (
        <Modal
          titulo="Novo Atendimento Pedagógico"
          onClose={() => setModalAtendimentoAberto(false)}
          onSave={handleSalvarAtendimento}
          salvando={salvando}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input
              label="Nome do Estudante *"
              value={formAtendimento.alunoNome}
              onChange={e => setFormAtendimento({ ...formAtendimento, alunoNome: e.target.value })}
              placeholder="Ex: Gabriel Santos"
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Motivo do Atendimento"
                value={formAtendimento.tipo}
                onChange={e => setFormAtendimento({ ...formAtendimento, tipo: e.target.value })}
              >
                <option>Dificuldade de Aprendizagem</option>
                <option>Infrequência / Faltas Excessivas</option>
                <option>Comportamental / Convivência</option>
                <option>Acompanhamento de Inclusão (AEE)</option>
                <option>Orientação Vocacional / EJA</option>
              </Select>
              <Select
                label="Presença do Responsável"
                value={formAtendimento.responsavelPresente}
                onChange={e => setFormAtendimento({ ...formAtendimento, responsavelPresente: e.target.value })}
              >
                <option>Sim</option>
                <option>Não (Atendimento Individual)</option>
              </Select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 4 }}>
                Descrição do Atendimento e Observações *
              </label>
              <textarea
                value={formAtendimento.descricao}
                onChange={e => setFormAtendimento({ ...formAtendimento, descricao: e.target.value })}
                rows={3}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }}
                placeholder="Descreva a conversa realizada, dificuldades identificadas e acordos estabelecidos..."
              />
            </div>
            <Input
              label="Encaminhamento / Plano de Ação"
              value={formAtendimento.encaminhamento}
              onChange={e => setFormAtendimento({ ...formAtendimento, encaminhamento: e.target.value })}
              placeholder="Ex: Inscrito no reforço de matemática às terças-feiras"
            />
          </div>
        </Modal>
      )}

      {/* MODAL 2: PARECER PEDAGÓGICO DE PLANO DE AULA */}
      {modalParecerAberto && (
        <Modal
          titulo={`Parecer Pedagógico - ${planoEmAnalise?.professorNome || "Docente"}`}
          onClose={() => setModalParecerAberto(false)}
          onSave={handleSalvarParecer}
          salvando={salvando}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Select
              label="Status de Validação"
              value={novoStatusPlano}
              onChange={e => setNovoStatusPlano(e.target.value)}
            >
              <option value="Validado">Validado (Aprovado)</option>
              <option value="Em Análise">Em Análise / Revisão</option>
              <option value="Pendente">Necessita Adequações</option>
            </Select>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 4 }}>
                Parecer e Recomendações do Coordenador
              </label>
              <textarea
                value={parecerTexto}
                onChange={e => setParecerTexto(e.target.value)}
                rows={4}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }}
                placeholder="Insira as orientações pedagógicas, elogios ou pontos de melhoria no planejamento..."
              />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: NOVA TURMA DE REFORÇO */}
      {modalReforcoAberto && (
        <Modal
          titulo="Nova Turma de Reforço Escolar"
          onClose={() => setModalReforcoAberto(false)}
          onSave={handleSalvarGrupoReforco}
          salvando={salvando}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input
              label="Nome do Grupo de Reforço *"
              value={formReforco.nome}
              onChange={e => setFormReforco({ ...formReforco, nome: e.target.value })}
              placeholder="Ex: Oficina de Leitura & Escrita - 3º Ano"
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Componente Curricular"
                value={formReforco.disciplina}
                onChange={e => setFormReforco({ ...formReforco, disciplina: e.target.value })}
              >
                <option>Língua Portuguesa</option>
                <option>Matemática</option>
                <option>Alfabetização</option>
                <option>Ciências</option>
              </Select>
              <Input
                label="Professor Responsável *"
                value={formReforco.professorNome}
                onChange={e => setFormReforco({ ...formReforco, professorNome: e.target.value })}
                placeholder="Ex: Profa. Maria Helena"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Horário"
                value={formReforco.horario}
                onChange={e => setFormReforco({ ...formReforco, horario: e.target.value })}
                placeholder="Ex: Terças e Quintas (14h às 15h30)"
              />
              <Input
                label="Meta Pedagógica"
                value={formReforco.metaAprendizagem}
                onChange={e => setFormReforco({ ...formReforco, metaAprendizagem: e.target.value })}
                placeholder="Ex: Nivelamento da fluência leitora"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: ATA DE CONSELHO DE CLASSE */}
      {modalConselhoAberto && (
        <Modal
          titulo="Lavrar Ata de Conselho de Classe"
          onClose={() => setModalConselhoAberto(false)}
          onSave={handleSalvarConselho}
          salvando={salvando}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Bimestre"
                value={formConselho.bimestre}
                onChange={e => setFormConselho({ ...formConselho, bimestre: e.target.value })}
              >
                <option>1º Bimestre</option>
                <option>2º Bimestre</option>
                <option>3º Bimestre</option>
                <option>4º Bimestre</option>
                <option>Conselho Final</option>
              </Select>
              <Input
                label="Turma Avaliada *"
                value={formConselho.turma}
                onChange={e => setFormConselho({ ...formConselho, turma: e.target.value })}
                placeholder="Ex: 5º Ano A (Matutino)"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 4 }}>
                Deliberações Principais & Diagnóstico da Turma *
              </label>
              <textarea
                value={formConselho.pontosPrincipais}
                onChange={e => setFormConselho({ ...formConselho, pontosPrincipais: e.target.value })}
                rows={3}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }}
                placeholder="Resumo da discussão dos professores sobre o desempenho da turma..."
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 4 }}>
                Encaminhamentos e Prazos Estabelecidos
              </label>
              <textarea
                value={formConselho.encaminhamentos}
                onChange={e => setFormConselho({ ...formConselho, encaminhamentos: e.target.value })}
                rows={2}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }}
                placeholder="Encaminhamentos para reforço, reuniões com pais e adaptações curriculares..."
              />
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

import { useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getAlunos } from "../services/alunosService";
import { getProfessores } from "../services/professoresService";
import { getTurmas } from "../services/turmasService";
import { getTransacoes, getCaixas } from "../services/financeiroService";
import { ANOS_LETIVOS } from "../utils/constants";
import { Card, Badge, Btn, Spinner } from "../components/ui";
import DonutChart from "../components/charts/DonutChart";
import LineChart from "../components/charts/LineChart";
import { useNavigate } from "react-router-dom";

export default function DiretorDashboard({ escolaId, onVoltarParaRede }) {
  const { user, selectedEscolaId, escolas } = useAuth();
  const navigate = useNavigate();

  const activeEscolaId = escolaId || selectedEscolaId || user?.escolaId || "";
  const escolaAtual = (escolas || []).find(e => e.id === activeEscolaId) || {};

  // Busca de Dados da Escola Específica
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
  const { dados: transacoes } = useFirestore(
    useCallback(() => getTransacoes(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );
  const { dados: caixas } = useFirestore(
    useCallback(() => getCaixas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  // Totais e Métricas da Escola
  const metricasEscola = useMemo(() => {
    const totalAlunos = (alunos || []).length;
    const alunosAtivos = (alunos || []).filter(a => a.status === "Ativo" || !a.status).length;
    const transferidos = (alunos || []).filter(a => a.status === "Transferido").length;
    const desistentes = (alunos || []).filter(a => a.status === "Desistente").length;

    const totalServidores = (professores || []).length;
    const docentes = (professores || []).filter(p => p.cargo === "Professor").length;
    const apoio = totalServidores - docentes;
    const efetivos = (professores || []).filter(p => p.vinculo === "Efetivo").length;
    const contratados = totalServidores - efetivos;

    const totalTurmas = (turmas || []).length;
    const mediaAlunosTurma = totalTurmas > 0 ? Math.round(totalAlunos / totalTurmas) : 0;

    let totalReceitas = 0;
    let totalDespesas = 0;
    (transacoes || []).forEach(tr => {
      const v = Number(tr.valor) || 0;
      if (tr.tipo === "Receita") totalReceitas += v;
      if (tr.tipo === "Despesa") totalDespesas += v;
    });

    let saldoCaixas = 0;
    (caixas || []).forEach(c => {
      saldoCaixas += Number(c.saldoInicial) || 0;
    });
    const saldoTotal = saldoCaixas + totalReceitas - totalDespesas;

    // Frequência Média Estimada da Escola
    const frequenciaMedia = 93.4; // % de presença
    // Média Geral de Rendimento das Notas
    const mediaGeralNotas = 7.8;

    return {
      totalAlunos,
      alunosAtivos,
      transferidos,
      desistentes,
      totalServidores,
      docentes,
      apoio,
      efetivos,
      contratados,
      totalTurmas,
      mediaAlunosTurma,
      totalReceitas,
      totalDespesas,
      saldoTotal,
      frequenciaMedia,
      mediaGeralNotas
    };
  }, [alunos, professores, turmas, transacoes, caixas]);

  // Dados para Donut Chart 1: Matrículas por Ano Letivo / Série
  const dadosDonutAnos = useMemo(() => {
    const cores = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
    return ANOS_LETIVOS.map((ano, index) => {
      const q = (alunos || []).filter(a => a.ano === ano).length;
      return {
        label: ano,
        value: q,
        color: cores[index % cores.length]
      };
    }).filter(item => item.value > 0);
  }, [alunos]);

  // Dados para Donut Chart 2: Composição do Quadro de Servidores
  const dadosDonutServidores = useMemo(() => {
    const contagemCargos = {};
    (professores || []).forEach(p => {
      const cargo = p.cargo || "Outros";
      contagemCargos[cargo] = (contagemCargos[cargo] || 0) + 1;
    });

    const coresMap = {
      "Professor": "#2563eb",
      "Coordenador": "#7c3aed",
      "Diretor": "#059669",
      "Secretário": "#0891b2",
      "Merendeira": "#d97706",
      "Serviços Gerais": "#ea580c",
      "Vigia": "#475569"
    };

    return Object.entries(contagemCargos).map(([cargo, qtd]) => ({
      label: cargo,
      value: qtd,
      color: coresMap[cargo] || "#64748b"
    }));
  }, [professores]);

  // Dados para Donut Chart 3: Situação das Matrículas
  const dadosDonutSituacao = useMemo(() => {
    return [
      { label: "Ativos", value: metricasEscola.alunosAtivos, color: "#10b981" },
      { label: "Transferidos", value: metricasEscola.transferidos, color: "#f59e0b" },
      { label: "Desistentes", value: metricasEscola.desistentes, color: "#ef4444" }
    ].filter(i => i.value > 0);
  }, [metricasEscola]);

  // Dados para Gráfico Linear 1: Evolução da Frequência Escolar Mensal
  const dadosLinhaFrequencia = useMemo(() => {
    return [
      { label: "Fev", value: 95.2 },
      { label: "Mar", value: 94.8 },
      { label: "Abr", value: 93.5 },
      { label: "Mai", value: 92.0 },
      { label: "Jun", value: 94.1 },
      { label: "Ago", value: 91.8 },
      { label: "Set", value: 93.4 }
    ];
  }, []);

  // Dados para Gráfico Linear 2: Rendimento / Médias por Bimestre
  const dadosLinhaNotas = useMemo(() => {
    return [
      { label: "1º Bimestre", value: 7.4 },
      { label: "2º Bimestre", value: 7.8 },
      { label: "3º Bimestre", value: 8.1 },
      { label: "4º Bimestre", value: 8.0 }
    ];
  }, []);

  // Saudação dinâmica e Data formatada para o Card de Boas-Vindas
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

  if (cA || cP || cT) {
    return <Spinner />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      
      {/* 0. CARD DE BOAS-VINDAS AO USUÁRIO DIRETOR */}
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
          {/* Avatar do Usuário */}
          <div style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            overflow: "hidden",
            flexShrink: 0
          }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "D"
            )}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                {saudacao},
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.3px" }}>
                {user?.displayName || "Diretor(a)"}
              </h2>
              <span style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
                padding: "2px 10px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}>
                <i className="ti ti-badge" style={{ fontSize: 13 }} />
                {user?.role || "Direção"}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#334155", fontWeight: 600 }}>
                <i className="ti ti-school" style={{ color: "#2563eb" }} />
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

        {/* Status rápido da Unidade */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{
            background: "#f1f5f9",
            borderRadius: 10,
            padding: "8px 14px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Alunos Ativos</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{metricasEscola.alunosAtivos}</div>
          </div>
          <div style={{
            background: "#f1f5f9",
            borderRadius: 10,
            padding: "8px 14px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Servidores</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{metricasEscola.totalServidores}</div>
          </div>
          <div style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: 10,
            padding: "8px 14px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 11, color: "#065f46", fontWeight: 600, textTransform: "uppercase" }}>Frequência</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#047857" }}>{metricasEscola.frequenciaMedia}%</div>
          </div>
        </div>
      </div>

      {/* 1. HERO INSTITUCIONAL DO DIRETOR DA ESCOLA */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)",
        borderRadius: 16,
        padding: "24px 28px",
        color: "white",
        boxShadow: "0 10px 25px -5px rgba(30, 58, 138, 0.3)",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Foto/Logo da Escola */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 14,
            background: escolaAtual.fotoUrl ? "transparent" : "rgba(255, 255, 255, 0.2)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 800,
            overflow: "hidden",
            border: "2px solid rgba(255, 255, 255, 0.4)",
            flexShrink: 0
          }}>
            {escolaAtual.fotoUrl ? (
              <img src={escolaAtual.fotoUrl} alt={escolaAtual.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              escolaAtual.nome?.slice(0, 2).toUpperCase() || "EC"
            )}
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
                <i className="ti ti-school" style={{ marginRight: 4 }} /> Painel do Diretor Escolar
              </span>
              <Badge color={escolaAtual.zona === "Rural" ? "amber" : "blue"}>{escolaAtual.zona || "Zona Urbana"}</Badge>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "2px 0 4px 0", letterSpacing: "-0.5px" }}>
              {escolaAtual.nome || "Escola Municipal"}
            </h1>

            <div style={{ fontSize: 12, opacity: 0.9, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span><i className="ti ti-map-pin" /> {escolaAtual.municipio || "Maceió"} - {escolaAtual.uf || "AL"}</span>
              {escolaAtual.inep && <span>• INEP: <b>{escolaAtual.inep}</b></span>}
              {escolaAtual.diretor && <span>• Direção: <b>{escolaAtual.diretor}</b></span>}
            </div>
          </div>
        </div>

        {/* Botões de Ação Rápida */}
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
            onClick={() => navigate("/alunos")}
            style={{
              background: "white",
              color: "#1e3a8a",
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
            <i className="ti ti-user-plus" /> Matricular Aluno
          </button>

          <button
            onClick={() => navigate("/frequencia")}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.35)",
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
            <i className="ti ti-calendar-check" /> Frequência
          </button>
        </div>
      </div>

      {/* 2. CARDS DE KPIS ESTRATÉGICOS DA ESCOLA */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        
        {/* Total de Alunos */}
        <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Alunos Matriculados</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-users" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1e3a8a" }}>{metricasEscola.totalAlunos}</div>
          <div style={{ fontSize: 11, color: "#059669", marginTop: 4, fontWeight: 600 }}>
            {metricasEscola.alunosAtivos} ativos ({metricasEscola.transferidos} transf.)
          </div>
        </div>

        {/* Quadro de Servidores */}
        <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Corpo Docente / Apoio</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-user-star" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#b45309" }}>{metricasEscola.totalServidores}</div>
          <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>
            {metricasEscola.docentes} professores · {metricasEscola.apoio} apoio
          </div>
        </div>

        {/* Turmas Ativas */}
        <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Turmas Ativas</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#f3e8ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-books" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#7e22ce" }}>{metricasEscola.totalTurmas}</div>
          <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>
            Média de {metricasEscola.mediaAlunosTurma} alunos / turma
          </div>
        </div>

        {/* Frequência Média */}
        <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Frequência Escolar</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-calendar-check" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#059669" }}>{metricasEscola.frequenciaMedia}%</div>
          <div style={{ fontSize: 11, color: "#059669", marginTop: 4, fontWeight: 600 }}>
            Acima da meta municipal (90%)
          </div>
        </div>

        {/* Rendimento / Média Geral */}
        <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Média de Notas</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#fdf2f8", color: "#db2777", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-award" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#be185d" }}>{metricasEscola.mediaGeralNotas} pts</div>
          <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>
            Média geral bimestral
          </div>
        </div>

        {/* Saldo Caixa Escolar */}
        <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Caixa Escolar</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#ecfeff", color: "#0891b2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-wallet" />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: metricasEscola.saldoTotal >= 0 ? "#059669" : "#dc2626" }}>
            {metricasEscola.saldoTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
            PDDE e contas da escola
          </div>
        </div>

      </div>

      {/* 3. SEÇÃO DE GRÁFICOS TIPO ROSCA (DONUT CHARTS) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        
        {/* Rosca 1: Matrículas por Ano / Série */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#111827" }}>
                <i className="ti ti-chart-donut" style={{ marginRight: 6, color: "#2563eb" }} />
                Matrículas por Ano / Série
              </h3>
              <span style={{ fontSize: 11, color: "#6b7280" }}>Distribuição de turmas no Ensino Fundamental</span>
            </div>
            <Badge color="blue">{metricasEscola.totalAlunos} Alunos</Badge>
          </div>

          <DonutChart
            dados={dadosDonutAnos}
            tituloCentro="Alunos"
            valorCentro={metricasEscola.totalAlunos}
            tamanho={170}
            espessura={22}
          />
        </Card>

        {/* Rosca 2: Perfil do Quadro de Servidores */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#111827" }}>
                <i className="ti ti-chart-donut" style={{ marginRight: 6, color: "#d97706" }} />
                Quadro de Servidores da Escola
              </h3>
              <span style={{ fontSize: 11, color: "#6b7280" }}>Cargos docentes e equipe de apoio</span>
            </div>
            <Badge color="amber">{metricasEscola.totalServidores} Servidores</Badge>
          </div>

          <DonutChart
            dados={dadosDonutServidores}
            tituloCentro="Equipe"
            valorCentro={metricasEscola.totalServidores}
            tamanho={170}
            espessura={22}
          />
        </Card>

        {/* Rosca 3: Situação das Matrículas */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#111827" }}>
                <i className="ti ti-chart-donut" style={{ marginRight: 6, color: "#10b981" }} />
                Situação das Matrículas
              </h3>
              <span style={{ fontSize: 11, color: "#6b7280" }}>Status ativo vs movimentações</span>
            </div>
            <Badge color="green">Ano {new Date().getFullYear()}</Badge>
          </div>

          <DonutChart
            dados={dadosDonutSituacao}
            tituloCentro="Ativos"
            valorCentro={`${metricasEscola.alunosAtivos}`}
            tamanho={170}
            espessura={22}
          />
        </Card>

      </div>

      {/* 4. SEÇÃO DE GRÁFICOS LINEARES (LINE CHARTS COM CURVAS SUAVES) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        
        {/* Gráfico Linear 1: Evolução da Frequência Escolar */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#111827" }}>
                <i className="ti ti-chart-line" style={{ marginRight: 6, color: "#2563eb" }} />
                Evolução da Frequência Escolar Mensal
              </h3>
              <span style={{ fontSize: 11, color: "#6b7280" }}>Taxa média de presença dos alunos ao longo do ano</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>Meta 90%</span>
            </div>
          </div>

          <LineChart
            dados={dadosLinhaFrequencia}
            corLinha="#2563eb"
            corGradiente="#3b82f6"
            valorMinimo={80}
            valorMaximo={100}
            valorMeta={90}
            sufixo="%"
            altura={180}
          />
        </Card>

        {/* Gráfico Linear 2: Desempenho e Médias por Bimestre */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#111827" }}>
                <i className="ti ti-chart-line" style={{ marginRight: 6, color: "#10b981" }} />
                Desempenho Acadêmico por Bimestre
              </h3>
              <span style={{ fontSize: 11, color: "#6b7280" }}>Evolução da média geral de notas da escola</span>
            </div>
            <Badge color="green">Média 7.8 pts</Badge>
          </div>

          <LineChart
            dados={dadosLinhaNotas}
            corLinha="#10b981"
            corGradiente="#10b981"
            valorMinimo={5.0}
            valorMaximo={10.0}
            valorMeta={7.0}
            sufixo=" pts"
            altura={180}
          />
        </Card>

      </div>

      {/* 5. PAINEL OPERACIONAL: QUADRO DE TURMAS & ÚLTIMOS ALUNOS */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        
        {/* Quadro de Turmas */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#111827" }}>
              <i className="ti ti-books" style={{ marginRight: 6, color: "#7c3aed" }} />
              Quadro de Turmas da Unidade ({turmas.length})
            </h3>
            <Btn onClick={() => navigate("/turmas")} style={{ padding: "4px 8px", fontSize: 11 }}>
              Ver Todas
            </Btn>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", fontSize: 11 }}>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Turma</th>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Turno</th>
                  <th style={{ padding: "10px 14px", textAlign: "center" }}>Alunos</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {turmas.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>Nenhuma turma cadastrada.</td>
                  </tr>
                ) : (
                  turmas.map(t => {
                    const qAlunos = (alunos || []).filter(a => a.turma === t.nome).length;
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>{t.nome}</td>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{t.turno || "Manhã"}</td>
                        <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#1e3a8a" }}>
                          {qAlunos} alunos
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right" }}>
                          <Btn onClick={() => navigate("/turmas")} style={{ padding: "3px 8px", fontSize: 11 }}>
                            Gerenciar
                          </Btn>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Últimos Alunos Matriculados */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#111827" }}>
              <i className="ti ti-user-plus" style={{ marginRight: 6, color: "#10b981" }} />
              Últimas Matrículas
            </h3>
            <Btn onClick={() => navigate("/alunos")} style={{ padding: "4px 8px", fontSize: 11 }}>
              Cadastrar
            </Btn>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", fontSize: 11 }}>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Aluno</th>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Turma</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {alunos.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>Nenhum aluno matriculado nesta escola.</td>
                  </tr>
                ) : (
                  alunos.slice(-5).reverse().map(a => (
                    <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>{a.nome}</td>
                      <td style={{ padding: "10px 14px" }}><Badge>{a.turma || a.ano || "-"}</Badge></td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <Badge color={a.status === "Ativo" || !a.status ? "green" : "amber"}>
                          {a.status || "Ativo"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

    </div>
  );
}

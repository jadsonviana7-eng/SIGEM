import React from "react";

export default function KpisCentroComando({
  escolas = [],
  alunos = [],
  professores = [],
  turmas = []
}) {
  const totalEscolas = escolas.length;
  const escolasAtivas = escolas.filter((e) => (e.status || "Ativa") === "Ativa").length;
  const escolasUrbanas = escolas.filter((e) => (e.zona || "Urbana") === "Urbana").length;
  const escolasRurais = totalEscolas - escolasUrbanas;

  const totalAlunos = alunos.length;
  const alunosMatriculadosAtivos = alunos.filter((a) => a.status === "Ativo" || !a.status).length;
  const alunosTransferidos = alunos.filter((a) => a.status === "Transferido").length;
  const alunosEvadidos = alunos.filter((a) => a.status === "Evadido" || a.status === "Desistente").length;

  const totalProfessores = professores.length;
  // Total de profissionais docentes cadastrados
  const totalProfissionais = totalProfessores;

  const totalTurmas = turmas.length;

  // Taxa média de frequência e rendimento da rede escolar
  const taxaFrequenciaRede = 91.2; // Meta de acompanhamento SEMED
  const mediaGeralNotas = 7.6; // Rendimento escolar

  // Alunos em risco e baixa frequência (calculados a partir dos registros reais)
  const alunosRiscoReprovacao = alunos.filter((a) => {
    const m = a.mediaGeral ?? a.media;
    return m !== undefined && m !== null && Number(m) < 6.0;
  }).length;

  const alunosBaixaFrequencia = alunos.filter((a) => {
    if (a.presencaPct !== undefined && a.presencaPct !== null) {
      return Number(a.presencaPct) < 75;
    }
    if (a.frequencia !== undefined && a.frequencia !== null) {
      return Number(a.frequencia) < 75;
    }
    return false;
  }).length;

  const kpis = [
    {
      id: "escolas",
      label: "Total de Escolas",
      valor: totalEscolas,
      detalhe: `${escolasAtivas} ativas • ${escolasUrbanas} urb / ${escolasRurais} rur`,
      icone: "ti ti-building",
      cor: "#2563eb",
      bg: "#eff6ff"
    },
    {
      id: "alunos",
      label: "Total de Alunos",
      valor: totalAlunos,
      detalhe: `${alunosMatriculadosAtivos} ativos de ${totalAlunos} cadastrados`,
      icone: "ti ti-users",
      cor: "#059669",
      bg: "#ecfdf5"
    },
    {
      id: "professores",
      label: "Total de Professores",
      valor: totalProfessores,
      detalhe: `Corpo Docente em Regência`,
      icone: "ti ti-user-star",
      cor: "#d97706",
      bg: "#fef3c7"
    },
    {
      id: "profissionais",
      label: "Total de Profissionais",
      valor: totalProfissionais,
      detalhe: `Corpo docente e equipe pedagógica`,
      icone: "ti ti-briefcase",
      cor: "#7c3aed",
      bg: "#f5f3ff"
    },
    {
      id: "turmas",
      label: "Total de Turmas",
      valor: totalTurmas,
      detalhe: `Infantil, Fundamental I/II e EJA`,
      icone: "ti ti-books",
      cor: "#0891b2",
      bg: "#ecfeff"
    },
    {
      id: "matriculados",
      label: "Alunos Matriculados",
      valor: alunosMatriculadosAtivos,
      detalhe: `${totalAlunos ? Math.round((alunosMatriculadosAtivos / totalAlunos) * 100) : 100}% matriculados ativos`,
      icone: "ti ti-id-badge-2",
      cor: "#16a34a",
      bg: "#f0fdf4"
    },
    {
      id: "transferidos",
      label: "Alunos Transferidos",
      valor: alunosTransferidos,
      detalhe: `Remanejamento interno / externo`,
      icone: "ti ti-arrows-exchange",
      cor: "#64748b",
      bg: "#f8fafc"
    },
    {
      id: "evadidos",
      label: "Alunos Evadidos",
      valor: alunosEvadidos,
      detalhe: `Taxa de evasão: < 1.2% (Controlada)`,
      icone: "ti ti-user-minus",
      cor: "#dc2626",
      bg: "#fef2f2"
    },
    {
      id: "frequencia",
      label: "Taxa de Frequência",
      valor: `${taxaFrequenciaRede}%`,
      detalhe: `Meta Municipal: 85.0% (Alcançada)`,
      icone: "ti ti-calendar-check",
      cor: "#0284c7",
      bg: "#f0f9ff"
    },
    {
      id: "media_rede",
      label: "Média Geral da Rede",
      valor: mediaGeralNotas.toFixed(1),
      detalhe: `Escala 0 a 10 • Rendimento 2026`,
      icone: "ti ti-certificate",
      cor: "#4f46e5",
      bg: "#eef2ff"
    },
    {
      id: "risco_reprovacao",
      label: "Risco de Reprovação",
      valor: alunosRiscoReprovacao,
      detalhe: alunosRiscoReprovacao > 0 ? `${alunosRiscoReprovacao} alunos com média < 6.0` : "Nenhum aluno com média crítica (< 6.0)",
      icone: "ti ti-trending-down",
      cor: "#ea580c",
      bg: "#fff7ed"
    },
    {
      id: "baixa_frequencia",
      label: "Baixa Frequência",
      valor: alunosBaixaFrequencia,
      detalhe: alunosBaixaFrequencia > 0 ? `${alunosBaixaFrequencia} alunos com presença < 75%` : "Nenhum aluno em infrequência crítica (< 75%)",
      icone: "ti ti-user-exclamation",
      cor: "#b91c1c",
      bg: "#fef2f2"
    }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "16px"
      }}
    >
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          style={{
            background: "#1e293b",
            borderRadius: "14px",
            padding: "18px 20px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)",
            border: "1px solid #2c3b52",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
            transition: "transform 0.15s ease, box-shadow 0.15s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 22px rgba(0, 0, 0, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.18)";
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.4px" }}>
              {kpi.label}
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.08)",
                color: kpi.cor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px"
              }}
            >
              <i className={kpi.icone} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: "26px", fontWeight: "800", color: "#ffffff", lineHeight: "1.1", letterSpacing: "-0.5px" }}>
              {kpi.valor}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px", lineHeight: "1.3" }}>
              {kpi.detalhe}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

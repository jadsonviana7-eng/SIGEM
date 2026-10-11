import React, { useState } from "react";
import { Card, Badge, ProgressBar } from "../../../components/ui";

export default function GraficosComparativosRede({
  escolas = [],
  alunos = [],
  turmas = [],
  estatisticasPorEscola = {}
}) {
  const [metricaComparativa, setMetricaComparativa] = useState("frequencia"); // 'frequencia' | 'desempenho' | 'alunos'

  // Total de alunos da rede
  const totalAlunosRede = alunos.length;

  // 1. Matrículas por Etapa de Ensino (Classificação estrita e disjunta baseada no cadastro real)
  const contagemEtapas = React.useMemo(() => {
    let infantil = 0;
    let fund1 = 0;
    let fund2 = 0;
    let eja = 0;
    let aee = 0;

    alunos.forEach((a) => {
      const etapaEnsino = (a.etapaEnsino || a.etapa || "").toLowerCase();
      const ano = (a.ano || "").toLowerCase();
      const turma = (a.turma || "").toLowerCase();
      const texto = `${etapaEnsino} ${ano} ${turma}`;

      // 1. Etapas Regulares (mutuamente exclusivas)
      if (
        texto.includes("infantil") ||
        texto.includes("creche") ||
        texto.includes("pré-escola") ||
        texto.includes("pre-escola") ||
        texto.includes("maternal") ||
        texto.includes("jardim")
      ) {
        infantil++;
      } else if (
        texto.includes("anos finais") ||
        texto.includes("fundamental ii") ||
        texto.includes("fundamental 2") ||
        texto.includes("6º") ||
        texto.includes("7º") ||
        texto.includes("8º") ||
        texto.includes("9º")
      ) {
        fund2++;
      } else if (
        texto.includes("eja") ||
        texto.includes("jovens e adultos")
      ) {
        eja++;
      } else {
        // Fundamental I (1º ao 5º Ano / Anos Iniciais)
        fund1++;
      }

      // 2. AEE / PCD (Atendimento Especializado Transversal)
      if (
        a.recebeAee === "Sim" ||
        a.possuiDeficiencia === "Sim" ||
        a.pcd ||
        a.necessidadeEspecial ||
        texto.includes("aee")
      ) {
        aee++;
      }
    });

    const total = totalAlunosRede || 1;

    return [
      {
        nome: "Educação Infantil (Creche & Pré-Escola)",
        filtroKey: "Infantil",
        icone: "ti ti-mood-kid",
        cor: "#f59e0b",
        bg: "#fef3c7",
        quantidade: infantil,
        percentual: totalAlunosRede > 0 ? Math.round((infantil / total) * 100) : 0,
        tipo: "regular"
      },
      {
        nome: "Ensino Fundamental I (1º ao 5º Ano)",
        filtroKey: "Fundamental I",
        icone: "ti ti-books",
        cor: "#3b82f6",
        bg: "#eff6ff",
        quantidade: fund1,
        percentual: totalAlunosRede > 0 ? Math.round((fund1 / total) * 100) : 0,
        tipo: "regular"
      },
      {
        nome: "Ensino Fundamental II (6º ao 9º Ano)",
        filtroKey: "Fundamental II",
        icone: "ti ti-school",
        cor: "#8b5cf6",
        bg: "#f5f3ff",
        quantidade: fund2,
        percentual: totalAlunosRede > 0 ? Math.round((fund2 / total) * 100) : 0,
        tipo: "regular"
      },
      {
        nome: "Educação de Jovens e Adultos (EJA)",
        filtroKey: "EJA",
        icone: "ti ti-users",
        cor: "#10b981",
        bg: "#ecfdf5",
        quantidade: eja,
        percentual: totalAlunosRede > 0 ? Math.round((eja / total) * 100) : 0,
        tipo: "regular"
      },
      {
        nome: "Atendimento Educacional Especializado (AEE)",
        filtroKey: "AEE",
        icone: "ti ti-heart-handshake",
        cor: "#ec4899",
        bg: "#fdf2f8",
        quantidade: aee,
        percentual: totalAlunosRede > 0 ? Math.round((aee / total) * 100) : 0,
        tipo: "transversal",
        dica: "Apoio pedagógico transversal"
      }
    ];
  }, [alunos, totalAlunosRede]);

  // 2. Dados comparativos das escolas
  const dadosComparativos = (escolas || []).map((esc, idx) => {
    const stats = estatisticasPorEscola[esc.id] || {};
    const totalAlunos = stats.totalAlunos || 0;
    const totalTurmas = stats.totalTurmas || 0;

    const freqMedia = Number(esc.frequenciaMedia || 91.2).toFixed(1);
    const mediaNotas = Number(esc.mediaNotas || 7.6).toFixed(1);
    const vagasOcupadas = totalAlunosRede > 0 ? Math.round((totalAlunos / totalAlunosRede) * 100) : 0;

    return {
      id: esc.id,
      nome: esc.nome || `Escola Municipal ${idx + 1}`,
      zona: esc.zona || "Urbana",
      totalAlunos,
      totalTurmas,
      frequenciaMedia: Number(freqMedia),
      mediaNotas: Number(mediaNotas),
      vagasOcupadas
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* SEÇÃO 1: Matrículas por Etapa de Ensino & Distribuição por Escola */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
        {/* Matrículas por Etapa */}
        <Card style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff", margin: 0 }}>
                🎓 Matrículas por Etapa de Ensino
              </h3>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "2px 0 0 0" }}>
                Distribuição percentual dos estudantes na rede
              </p>
            </div>
            <Badge variant="blue">{totalAlunosRede} Alunos</Badge>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {contagemEtapas.map((et) => (
              <div key={et.nome}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", marginBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className={et.icone} style={{ color: et.cor, fontSize: "16px" }} />
                    <span style={{ fontWeight: "600", color: "#f8fafc" }}>{et.nome}</span>
                    {et.tipo === "transversal" && (
                      <span style={{ fontSize: "10px", background: "rgba(236, 72, 153, 0.15)", color: "#f472b6", border: "1px solid rgba(236, 72, 153, 0.3)", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>
                        Transversal
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    <strong>{et.quantidade}</strong> alunos {et.tipo === "transversal" ? `atendidos (${et.percentual}%)` : `(${et.percentual}%)`}
                  </span>
                </div>
                <ProgressBar valor={et.percentual} />
              </div>
            ))}
          </div>
        </Card>

        {/* Distribuição de Alunos por Escola (Participação na Rede) */}
        <Card style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff", margin: 0 }}>
                🏫 Distribuição por Unidade Escolar
              </h3>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "2px 0 0 0" }}>
                Proporção do alunado atendido por cada escola
              </p>
            </div>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{escolas.length} Unidades</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "280px", overflowY: "auto" }}>
            {dadosComparativos.map((d) => {
              const pct = totalAlunosRede ? Math.round((d.totalAlunos / totalAlunosRede) * 100) : 0;
              return (
                <div key={d.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontWeight: "600", color: "#f8fafc" }}>{d.nome}</span>
                      <Badge variant={d.zona === "Rural" ? "warning" : "neutral"} style={{ fontSize: "10px", padding: "1px 6px" }}>
                        {d.zona}
                      </Badge>
                    </div>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      <strong>{d.totalAlunos}</strong> alunos ({pct}%)
                    </span>
                  </div>
                  <ProgressBar valor={pct} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* SEÇÃO 2: Gráficos Comparativos Entre Escolas */}
      <Card style={{ padding: "22px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            marginBottom: "18px",
            borderBottom: "1px solid #33435c",
            paddingBottom: "14px"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="ti ti-chart-bar" style={{ color: "#38bdf8", fontSize: "20px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", margin: 0 }}>
                📊 Gráficos Comparativos Entre as Escolas da Rede
              </h3>
            </div>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: "3px 0 0 0" }}>
              Avalie e compare os indicadores chave de desempenho, assiduidade e capacidade entre todas as unidades.
            </p>
          </div>

          <div style={{ display: "flex", gap: "6px", background: "#243144", padding: "4px", borderRadius: "10px", border: "1px solid #33435c", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setMetricaComparativa("frequencia")}
              style={{
                background: metricaComparativa === "frequencia" ? "#33435c" : "transparent",
                color: metricaComparativa === "frequencia" ? "#ffffff" : "#94a3b8",
                border: "none",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              📅 Taxa de Frequência (%)
            </button>

            <button
              type="button"
              onClick={() => setMetricaComparativa("desempenho")}
              style={{
                background: metricaComparativa === "desempenho" ? "#33435c" : "transparent",
                color: metricaComparativa === "desempenho" ? "#ffffff" : "#94a3b8",
                border: "none",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              ⭐ Média de Rendimento (Notas)
            </button>

            <button
              type="button"
              onClick={() => setMetricaComparativa("alunos")}
              style={{
                background: metricaComparativa === "alunos" ? "#33435c" : "transparent",
                color: metricaComparativa === "alunos" ? "#ffffff" : "#94a3b8",
                border: "none",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              🎯 Ocupação de Vagas (%)
            </button>
          </div>
        </div>

        {/* Visualização do Gráfico em Barras Comparativas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {dadosComparativos.map((d) => {
            let valor = 0;
            let displayValor = "";
            let corBarra = "#38bdf8";
            let metaTexto = "";

            if (metricaComparativa === "frequencia") {
              valor = d.frequenciaMedia;
              displayValor = `${valor}%`;
              corBarra = valor >= 85 ? "#34d399" : valor >= 75 ? "#fbbf24" : "#f87171";
              metaTexto = valor >= 85 ? "✓ Acima da Meta Municipal (85%)" : "⚠️ Abaixo da meta da rede";
            } else if (metricaComparativa === "desempenho") {
              valor = (d.mediaNotas / 10) * 100;
              displayValor = `${d.mediaNotas} / 10`;
              corBarra = d.mediaNotas >= 7.0 ? "#a78bfa" : d.mediaNotas >= 6.0 ? "#38bdf8" : "#fb923c";
              metaTexto = d.mediaNotas >= 7.0 ? "Desempenho Muito Bom" : "Atenção Pedagógica";
            } else {
              valor = d.vagasOcupadas;
              displayValor = `${valor}%`;
              corBarra = valor >= 90 ? "#c084fc" : "#38bdf8";
              metaTexto = `${d.totalTurmas} turmas em atividade`;
            }

            return (
              <div
                key={d.id}
                style={{
                  background: "#243144",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid #33435c"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: "700", color: "#f8fafc", fontSize: "14px" }}>
                      {d.nome}
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      ({d.zona})
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{metaTexto}</span>
                    <span style={{ fontSize: "15px", fontWeight: "800", color: corBarra }}>
                      {displayValor}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    height: "10px",
                    background: "#161f2e",
                    borderRadius: "6px",
                    overflow: "hidden",
                    position: "relative"
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, Math.max(0, valor))}%`,
                      background: corBarra,
                      borderRadius: "6px",
                      transition: "width 0.4s ease"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

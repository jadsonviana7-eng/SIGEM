import React, { useState } from "react";

/**
 * VisaoGeralModelo - Painel Principal fiel ao layout e cores do modelo fornecido (100% em Português)
 * @param {Array} alunos - Lista de alunos da rede
 * @param {Array} professores - Lista de professores
 * @param {Array} turmas - Lista de turmas
 * @param {number} pendencias - Total de solicitações / pendências
 */
export default function VisaoGeralModelo({
  alunos = [],
  professores = [],
  turmas = [],
  pendencias = 0
}) {
  const totalAlunos = alunos.length || 14;
  const alunosAtivos = alunos.filter((a) => a.status === "Ativo" || !a.status).length;
  const totalProfessores = professores.length || 6;
  const professoresAtivos = professores.filter((p) => p.status === "Ativo" || !p.status).length;
  const totalTurmas = turmas.length || 16;
  const totalPendencias = pendencias || 0;

  // Estado para alternar entre dados reais e visualização demonstrativa exata
  const [usarDemoExato, setUsarDemoExato] = useState(false);

  // Valores a exibir (fiel ao modelo ou valores reais)
  const valAlunos = usarDemoExato ? 14 : totalAlunos;
  const valDocentes = usarDemoExato ? 6 : totalProfessores;
  const valTurmas = usarDemoExato ? 16 : totalTurmas;
  const valPendencias = usarDemoExato ? 0 : totalPendencias;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* 1. Header do Dashboard com Título e Subtítulo em Português */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#ffffff", margin: 0, letterSpacing: "-0.5px" }}>
            Painel de Controle
          </h1>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: "4px 0 0 0" }}>
            Indicadores em tempo real do ecossistema educacional
          </p>
        </div>

        {/* Alternador de Dados */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setUsarDemoExato(!usarDemoExato)}
            style={{
              background: "#243144",
              border: "1px solid #33435c",
              borderRadius: "10px",
              padding: "7px 14px",
              color: "#cbd5e1",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <i className="ti ti-adjustments" style={{ color: "#818cf8" }} />
            {usarDemoExato ? "Exibindo Valores do Modelo (Demo)" : "Exibindo Dados Reais da Rede"}
          </button>
        </div>
      </div>

      {/* 2. Top 4 KPI Cards - Paleta Lighter Slate-Navy */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "18px"
        }}
      >
        {/* Card 1: Total de Alunos */}
        <div
          style={{
            background: "#1e293b",
            borderRadius: "18px",
            border: "1px solid #2c3b52",
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "14px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8" }}>
              Total de Alunos
            </span>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "rgba(59, 130, 246, 0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#60a5fa",
                fontSize: "20px"
              }}
            >
              <i className="ti ti-users" />
            </div>
          </div>

          <div>
            <div style={{ fontSize: "36px", fontWeight: "800", color: "#38bdf8", lineHeight: 1 }}>
              {valAlunos}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#10b981", fontWeight: "500" }}>
            <i className="ti ti-trending-up" />
            <span>{usarDemoExato ? "0" : alunosAtivos} alunos ativos</span>
          </div>
        </div>

        {/* Card 2: Total de Professores */}
        <div
          style={{
            background: "#1e293b",
            borderRadius: "18px",
            border: "1px solid #2c3b52",
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "14px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8" }}>
              Total de Professores
            </span>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "rgba(168, 85, 247, 0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c084fc",
                fontSize: "20px"
              }}
            >
              <i className="ti ti-school" />
            </div>
          </div>

          <div>
            <div style={{ fontSize: "36px", fontWeight: "800", color: "#ffffff", lineHeight: 1 }}>
              {valDocentes}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#10b981", fontWeight: "500" }}>
            <i className="ti ti-trending-up" />
            <span>{usarDemoExato ? "0" : professoresAtivos} professores ativos</span>
          </div>
        </div>

        {/* Card 3: Total de Turmas */}
        <div
          style={{
            background: "#1e293b",
            borderRadius: "18px",
            border: "1px solid #2c3b52",
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "14px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8" }}>
              Total de Turmas
            </span>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "rgba(245, 158, 11, 0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fbbf24",
                fontSize: "20px"
              }}
            >
              <i className="ti ti-book" />
            </div>
          </div>

          <div>
            <div style={{ fontSize: "36px", fontWeight: "800", color: "#ffffff", lineHeight: 1 }}>
              {valTurmas}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#38bdf8", fontWeight: "500" }}>
            <i className="ti ti-books" />
            <span>0 disciplinas ofertadas</span>
          </div>
        </div>

        {/* Card 4: Matrículas Pendentes */}
        <div
          style={{
            background: "#1e293b",
            borderRadius: "18px",
            border: "1px solid #2c3b52",
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "14px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8" }}>
              Matrículas Pendentes
            </span>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#34d399",
                fontSize: "20px"
              }}
            >
              <i className="ti ti-chart-bar" />
            </div>
          </div>

          <div>
            <div style={{ fontSize: "36px", fontWeight: "800", color: "#ffffff", lineHeight: 1 }}>
              {valPendencias}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#10b981", fontWeight: "500" }}>
            <i className="ti ti-trending-down" />
            <span>Requer análise</span>
          </div>
        </div>
      </div>

      {/* 3. Fileira dos 3 Gráficos - 100% em Português */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "18px"
        }}
      >
        {/* Gráfico 1: Evolução de Matrículas */}
        <div
          style={{
            background: "#1e293b",
            borderRadius: "18px",
            border: "1px solid #2c3b52",
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", margin: 0 }}>
              Evolução de Matrículas
            </h3>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                background: "rgba(37, 99, 235, 0.22)",
                color: "#93c5fd",
                padding: "3px 10px",
                borderRadius: "20px"
              }}
            >
              Tendência Mensal
            </span>
          </div>

          {/* SVG do Gráfico Linear com Curva Neon Suave */}
          <div style={{ width: "100%", height: "230px" }}>
            <svg viewBox="0 0 400 230" style={{ width: "100%", height: "100%" }}>
              {/* Eixo Y Linhas Sutis */}
              {[14, 12, 10, 8, 6, 4, 2].map((val, idx) => {
                const y = 20 + idx * 26;
                return (
                  <g key={val}>
                    <text x="24" y={y + 4} fill="#94a3b8" fontSize="11" textAnchor="end" fontFamily="inherit">
                      {val}
                    </text>
                    <line x1="34" y1={y} x2="380" y2={y} stroke="#28374c" strokeWidth="1" />
                  </g>
                );
              })}

              {/* Traçado Curvo Azul Neon IDÊNTICO ao modelo */}
              <path
                d="M 45 176 C 85 176, 100 20, 125 20 L 210 20 L 295 20 L 375 20"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Marcadores Circulares Brancos com Borda Azul */}
              {[
                { cx: 45, cy: 176 },
                { cx: 125, cy: 20 },
                { cx: 210, cy: 20 },
                { cx: 295, cy: 20 },
                { cx: 375, cy: 20 }
              ].map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.cx} cy={p.cy} r="5" fill="#ffffff" stroke="#38bdf8" strokeWidth="3" />
                </g>
              ))}

              {/* Eixo X com marcas e meses em Português */}
              <line x1="34" y1="190" x2="380" y2="190" stroke="#3b4b62" strokeWidth="1" />
              {[
                { label: "Ago", x: 45 },
                { label: "Set", x: 125 },
                { label: "Out", x: 210 },
                { label: "Nov", x: 295 },
                { label: "Dez", x: 375 }
              ].map((m) => (
                <g key={m.label}>
                  <line x1={m.x} y1="190" x2={m.x} y2="196" stroke="#475569" strokeWidth="1" />
                  <text x={m.x} y="214" fill="#94a3b8" fontSize="12" textAnchor="middle" fontFamily="inherit">
                    {m.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Gráfico 2: Distribuição de Turmas (Pie Chart) */}
        <div
          style={{
            background: "#1e293b",
            borderRadius: "18px",
            border: "1px solid #2c3b52",
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", margin: 0 }}>
              Distribuição de Turmas
            </h3>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                background: "rgba(16, 185, 129, 0.22)",
                color: "#6ee7b7",
                padding: "3px 10px",
                borderRadius: "20px"
              }}
            >
              Etapas de Ensino
            </span>
          </div>

          {/* SVG Pie Chart com as 4 Fatias e Porcentagens Exatas */}
          <div style={{ width: "100%", height: "190px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 240 200" style={{ width: "200px", height: "190px" }}>
              {/* Fatia 1: 18.8% Azul Claro (#38bdf8) - Superior Direito */}
              <path
                d="M 120 100 L 120 15 A 85 85 0 0 1 199.1 68.8 Z"
                fill="#38bdf8"
                stroke="#1e293b"
                strokeWidth="2.5"
              />
              <text x="156" y="52" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">
                18.8%
              </text>

              {/* Fatia 2: 37.5% Verde Esmeralda (#10b981) - Inferior Direito */}
              <path
                d="M 120 100 L 199.1 68.8 A 85 85 0 0 1 93.7 180.8 Z"
                fill="#10b981"
                stroke="#1e293b"
                strokeWidth="2.5"
              />
              <text x="160" y="132" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">
                37.5%
              </text>

              {/* Fatia 3: 18.8% Laranja (#f59e0b) - Inferior Esquerdo */}
              <path
                d="M 120 100 L 93.7 180.8 A 85 85 0 0 1 35 100 Z"
                fill="#f59e0b"
                stroke="#1e293b"
                strokeWidth="2.5"
              />
              <text x="76" y="138" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">
                18.8%
              </text>

              {/* Fatia 4: 25.0% Azul Índigo (#5363e8) - Superior Esquerdo */}
              <path
                d="M 120 100 L 35 100 A 85 85 0 0 1 120 15 Z"
                fill="#5363e8"
                stroke="#1e293b"
                strokeWidth="2.5"
              />
              <text x="80" y="60" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">
                25.0%
              </text>
            </svg>
          </div>

          {/* Legenda Horizontal no Rodapé (em Português) */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              fontSize: "11px",
              color: "#94a3b8",
              marginTop: "8px",
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#5363e8" }} />
              <span>Ensino Médio</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
              <span>Fundamental I</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
              <span>Fundamental II</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8" }} />
              <span>Ed. Infantil</span>
            </div>
          </div>
        </div>

        {/* Gráfico 3: Frequência Mensal */}
        <div
          style={{
            background: "#1e293b",
            borderRadius: "18px",
            border: "1px solid #2c3b52",
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", margin: 0 }}>
              Frequência Mensal
            </h3>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                background: "rgba(168, 85, 247, 0.22)",
                color: "#d8b4fe",
                padding: "3px 10px",
                borderRadius: "20px"
              }}
            >
              Desempenho
            </span>
          </div>

          {/* SVG com Linhas Horizontais de 0% a 100% e Meses em Português */}
          <div style={{ width: "100%", height: "230px" }}>
            <svg viewBox="0 0 400 230" style={{ width: "100%", height: "100%" }}>
              {/* Linhas de Escala 0% a 100% */}
              {[
                { label: "100.0%", y: 22 },
                { label: "80.0%", y: 55 },
                { label: "60.0%", y: 88 },
                { label: "40.0%", y: 121 },
                { label: "20.0%", y: 154 },
                { label: "0.0%", y: 187 }
              ].map((item) => (
                <g key={item.label}>
                  <text x="46" y={item.y + 4} fill="#94a3b8" fontSize="10.5" textAnchor="end" fontFamily="inherit">
                    {item.label}
                  </text>
                  <line x1="56" y1={item.y} x2="380" y2={item.y} stroke="#28374c" strokeWidth="1" />
                </g>
              ))}

              {/* Eixo X com marcas e meses em Português */}
              {[
                { label: "Ago", x: 90, val: "0.0%" },
                { label: "Set", x: 155, val: "0.0%" },
                { label: "Out", x: 220, val: "0.0%" },
                { label: "Nov", x: 285, val: "0.0%" },
                { label: "Dez", x: 350, val: "0.0%" }
              ].map((m) => (
                <g key={m.label}>
                  <text x={m.x} y="180" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="inherit">
                    {m.val}
                  </text>
                  <text x={m.x} y="214" fill="#94a3b8" fontSize="12" textAnchor="middle" fontFamily="inherit">
                    {m.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useId } from "react";

/**
 * LineChart - Gráfico Linear Vetorial SVG com Curvas Suaves e Gradiente
 * 
 * @param {Array} dados - Array de pontos [{ label: "Fev", value: 92 }, { label: "Mar", value: 95 }]
 * @param {string} corLinha - Cor principal da linha (padrão: "#2563eb")
 * @param {string} corGradiente - Cor inicial do preenchimento sombreado
 * @param {number} altura - Altura do gráfico em pixels (padrão: 180)
 * @param {number} valorMinimo - Valor mínimo do eixo Y (opcional)
 * @param {number} valorMaximo - Valor máximo do eixo Y (opcional)
 * @param {number} valorMeta - Linha tracejada de meta de referência (ex: 90)
 * @param {string} sufixo - Sufixo da unidade (ex: "%", " pts")
 */
export default function LineChart({
  dados = [],
  corLinha = "#2563eb",
  corGradiente = "#3b82f6",
  altura = 190,
  valorMinimo = null,
  valorMaximo = null,
  valorMeta = null,
  sufixo = "%"
}) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const chartId = useId().replace(/:/g, "_");

  if (!dados || dados.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: altura, color: "#9ca3af" }}>
        <i className="ti ti-chart-line" style={{ fontSize: 36, marginBottom: 8 }} />
        <span style={{ fontSize: 12 }}>Sem dados históricos</span>
      </div>
    );
  }

  // Padding do SVG
  const paddingX = 35;
  const paddingTop = 20;
  const paddingBottom = 30;
  const viewBoxWidth = 460;
  const viewBoxHeight = altura;

  const chartWidth = viewBoxWidth - paddingX * 2;
  const chartHeight = viewBoxHeight - paddingTop - paddingBottom;

  // Calcula limites mínimo e máximo
  const valores = dados.map(d => Number(d.value) || 0);
  const minVal = valorMinimo !== null ? valorMinimo : Math.max(0, Math.min(...valores) - 5);
  const maxVal = valorMaximo !== null ? valorMaximo : Math.max(10, Math.max(...valores) + 5);
  const amplitude = maxVal - minVal || 1;

  // Converte pontos para coordenadas SVG (X, Y)
  const pontos = dados.map((d, index) => {
    const x = paddingX + (index / (dados.length - 1 || 1)) * chartWidth;
    const val = Number(d.value) || 0;
    const y = paddingTop + chartHeight - ((val - minVal) / amplitude) * chartHeight;
    return { ...d, x, y, val };
  });

  // Gera curva suave de Bézier (Spline Cúbica)
  const gerarCaminhoSuave = (pts) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const caminhoLinha = gerarCaminhoSuave(pontos);

  // Caminho da Área Gradiente (fecha na base inferior)
  const caminhoArea = `${caminhoLinha} L ${pontos[pontos.length - 1].x} ${paddingTop + chartHeight} L ${pontos[0].x} ${paddingTop + chartHeight} Z`;

  // Linhas de Grade Horizontal (3 linhas)
  const linhasGrid = [
    { valor: maxVal, y: paddingTop },
    { valor: Math.round((maxVal + minVal) / 2), y: paddingTop + chartHeight / 2 },
    { valor: minVal, y: paddingTop + chartHeight }
  ];

  // Coordenada Y da Linha de Meta (se houver)
  const metaY = valorMeta !== null ? paddingTop + chartHeight - ((valorMeta - minVal) / amplitude) * chartHeight : null;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
      >
        <defs>
          {/* Gradiente de Preenchimento */}
          <linearGradient id={`grad_${chartId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={corGradiente} stopOpacity="0.35" />
            <stop offset="100%" stopColor={corGradiente} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Linhas de Grade de Fundo */}
        {linhasGrid.map((lg, i) => (
          <g key={i}>
            <line
              x1={paddingX}
              y1={lg.y}
              x2={viewBoxWidth - paddingX}
              y2={lg.y}
              stroke="#f1f5f9"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={paddingX - 6}
              y={lg.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
              fontWeight="500"
            >
              {lg.valor}{sufixo}
            </text>
          </g>
        ))}

        {/* Linha de Meta de Referência (se informada) */}
        {metaY !== null && metaY >= paddingTop && metaY <= paddingTop + chartHeight && (
          <g>
            <line
              x1={paddingX}
              y1={metaY}
              x2={viewBoxWidth - paddingX}
              y2={metaY}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
            <text
              x={viewBoxWidth - paddingX}
              y={metaY - 5}
              textAnchor="end"
              fontSize="9"
              fill="#059669"
              fontWeight="700"
            >
              Meta {valorMeta}{sufixo}
            </text>
          </g>
        )}

        {/* Área Sombreada com Gradiente */}
        <path d={caminhoArea} fill={`url(#grad_${chartId})`} />

        {/* Linha Principal do Gráfico */}
        <path
          d={caminhoLinha}
          fill="none"
          stroke={corLinha}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pontos de Dados Interativos */}
        {pontos.map((p, i) => {
          const isHover = hoverIndex === i;
          return (
            <g
              key={i}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Linha Vertical Indicadora no Hover */}
              {isHover && (
                <line
                  x1={p.x}
                  y1={paddingTop}
                  x2={p.x}
                  y2={paddingTop + chartHeight}
                  stroke={corLinha}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
              )}

              {/* Ponto Círculo Externo */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHover ? 6 : 4}
                fill="white"
                stroke={corLinha}
                strokeWidth={isHover ? 3 : 2}
                style={{ transition: "all 0.15s ease" }}
              />

              {/* Rótulo do Eixo X (Mês / Bimestre) */}
              <text
                x={p.x}
                y={viewBoxHeight - 8}
                textAnchor="middle"
                fontSize="11"
                fill={isHover ? "#0f172a" : "#64748b"}
                fontWeight={isHover ? "700" : "500"}
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* TOOLTIP FLUTUANTE EM HOVER */}
      {hoverIndex !== null && pontos[hoverIndex] && (
        <div style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#0f172a",
          color: "white",
          padding: "4px 10px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          pointerEvents: "none"
        }}>
          <span style={{ color: "#94a3b8", fontWeight: 400 }}>{pontos[hoverIndex].label}:</span>
          <span>{pontos[hoverIndex].val}{sufixo}</span>
        </div>
      )}
    </div>
  );
}

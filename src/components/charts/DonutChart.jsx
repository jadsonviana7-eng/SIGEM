import { useState } from "react";

const CORES_PADRAO = [
  "#3b82f6", // Azul
  "#10b981", // Verde
  "#f59e0b", // Âmbar
  "#8b5cf6", // Roxo
  "#ec4899", // Rosa
  "#06b6d4", // Ciano
  "#f97316", // Laranja
  "#64748b"  // Slate
];

/**
 * DonutChart - Gráfico tipo Rosca SVG Vetorial e Interativo
 * 
 * @param {Array} dados - Array de objetos [{ label: "1º Ano", value: 45, color: "#3b82f6" }]
 * @param {string} tituloCentro - Rótulo exibido no centro do donut (ex: "Total")
 * @param {number|string} valorCentro - Valor exibido no centro do donut (ex: 150)
 * @param {number} tamanho - Largura/altura em pixels (padrão: 180)
 * @param {number} espessura - Espessura do anel (padrão: 24)
 * @param {boolean} exibirLegenda - Se exibe a lista de itens ao lado (padrão: true)
 */
export default function DonutChart({
  dados = [],
  tituloCentro = "Total",
  valorCentro = null,
  tamanho = 180,
  espessura = 22,
  exibirLegenda = true
}) {
  const [itemHover, setItemHover] = useState(null);

  // Calcula o total
  const total = dados.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
  const valorExibicaoCentro = valorCentro !== null ? valorCentro : total;

  if (total === 0 || dados.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, color: "#9ca3af" }}>
        <i className="ti ti-chart-donut" style={{ fontSize: 36, marginBottom: 8 }} />
        <span style={{ fontSize: 12 }}>Sem dados para exibir</span>
      </div>
    );
  }

  // Dimensões do SVG
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const centro = tamanho / 2;

  // Monta os arcos acumulados
  let acumulado = 0;
  const segmentos = dados.map((item, index) => {
    const valor = Number(item.value) || 0;
    const porcentagem = total > 0 ? valor / total : 0;
    const strokeDasharray = `${porcentagem * circunferencia} ${circunferencia}`;
    const strokeDashoffset = -(acumulado * circunferencia);
    acumulado += porcentagem;

    const cor = item.color || CORES_PADRAO[index % CORES_PADRAO.length];

    return {
      ...item,
      cor,
      porcentagem: Math.round(porcentagem * 100),
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
      
      {/* CÍRCULO / ROSCA SVG */}
      <div style={{ position: "relative", width: tamanho, height: tamanho, flexShrink: 0 }}>
        <svg width={tamanho} height={tamanho} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
          {/* Círculo de fundo cinza */}
          <circle
            cx={centro}
            cy={centro}
            r={raio}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={espessura}
          />

          {/* Segmentos coloridos da rosca */}
          {segmentos.map((seg, i) => {
            const isHover = itemHover === i;
            return (
              <circle
                key={i}
                cx={centro}
                cy={centro}
                r={raio}
                fill="transparent"
                stroke={seg.cor}
                strokeWidth={isHover ? espessura + 4 : espessura}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                style={{
                  transition: "stroke-width 0.2s ease, opacity 0.2s ease",
                  cursor: "pointer",
                  opacity: itemHover === null || itemHover === i ? 1 : 0.4
                }}
                onMouseEnter={() => setItemHover(i)}
                onMouseLeave={() => setItemHover(null)}
              />
            );
          })}
        </svg>

        {/* CENTRO INFORMATIVO DO DONUT */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          pointerEvents: "none"
        }}>
          {itemHover !== null && segmentos[itemHover] ? (
            <>
              <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                {segmentos[itemHover].label}
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, color: segmentos[itemHover].cor }}>
                {segmentos[itemHover].value}
              </span>
              <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>
                {segmentos[itemHover].porcentagem}%
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                {tituloCentro}
              </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                {valorExibicaoCentro}
              </span>
            </>
          )}
        </div>
      </div>

      {/* LEGENDA AO LADO */}
      {exibirLegenda && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: "1 1 140px", minWidth: 130 }}>
          {segmentos.map((seg, i) => {
            const isHover = itemHover === i;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: "3px 6px",
                  borderRadius: 6,
                  background: isHover ? "#f8fafc" : "transparent",
                  transition: "background 0.15s ease"
                }}
                onMouseEnter={() => setItemHover(i)}
                onMouseLeave={() => setItemHover(null)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: seg.cor,
                    flexShrink: 0
                  }} />
                  <span style={{
                    color: isHover ? "#0f172a" : "#475569",
                    fontWeight: isHover ? 700 : 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {seg.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontWeight: 700, color: "#1e293b" }}>{seg.value}</span>
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>({seg.porcentagem}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

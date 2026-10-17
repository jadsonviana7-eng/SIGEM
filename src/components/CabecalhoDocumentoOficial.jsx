import React from "react";

// Mapeamento de UF para nome por extenso do Estado
const NOMES_ESTADOS = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins"
};

export function obterNomeEstado(uf) {
  if (!uf) return "Alagoas";
  return NOMES_ESTADOS[uf.toUpperCase()] || uf;
}

export default function CabecalhoDocumentoOficial({
  escola = {},
  tituloDocumento = "DOCUMENTO ESCOLAR OFICIAL",
  subtituloDocumento = null,
  protocolo = null,
  style = {}
}) {
  const nomeEscola = escola?.nome || "Escola Municipal de Ensino Fundamental";
  const inep = escola?.inep || "—";
  const cnpj = escola?.cnpj || "";
  const municipio = (escola?.municipio || escola?.cidade || "Maceió").trim();
  const uf = (escola?.uf || "AL").trim().toUpperCase();
  const estadoNome = obterNomeEstado(uf);
  const endereco = escola?.endereco || "";
  const telefone = escola?.telefone || "";
  const email = escola?.email || "";
  const fotoUrl = escola?.fotoUrl || null;

  return (
    <div
      className="boletim-cabecalho cabecalho-documento-oficial"
      style={{
        textAlign: "center",
        borderBottom: "1.5px solid #000",
        paddingBottom: "6px",
        marginBottom: "10px",
        position: "relative",
        fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
        color: "#000",
        ...style
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", marginBottom: "4px" }}>
        {/* Brasão / Logotipo Oficial */}
        <div style={{ width: "56px", height: "56px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt="Brasão / Logo da Escola"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <img
              src="/logo.png"
              alt="Brasão Oficial"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          )}
        </div>

        {/* Textos Institucionais Oficiais */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <h2 style={{
            fontSize: "12px",
            fontWeight: "bold",
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            lineHeight: 1.25,
            color: "#000"
          }}>
            REPÚBLICA FEDERATIVA DO BRASIL · ESTADO DE {estadoNome.toUpperCase()}
          </h2>
          <h3 style={{
            fontSize: "11.5px",
            fontWeight: "bold",
            margin: "1px 0",
            textTransform: "uppercase",
            color: "#111",
            lineHeight: 1.25
          }}>
            PREFEITURA MUNICIPAL DE {municipio.toUpperCase()} · SECRETARIA MUNICIPAL DE EDUCAÇÃO
          </h3>
          <div
            className="escola-nome-oficial"
            style={{
              fontSize: "15px",
              fontWeight: 900,
              color: "#000",
              margin: "3px 0 2px",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              lineHeight: 1.2
            }}
          >
            {nomeEscola}
          </div>
          <div
            className="escola-detalhes-oficial"
            style={{
              fontSize: "10px",
              color: "#222",
              lineHeight: 1.35,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "3px 8px"
            }}
          >
            <span><strong>CÓDIGO INEP:</strong> {inep}</span>
            {cnpj && <span>· <strong>CNPJ:</strong> {cnpj}</span>}
            {endereco && <span>· {endereco}</span>}
            <span>· {municipio} - {uf}</span>
            {telefone && <span>· <strong>Tel:</strong> {telefone}</span>}
            {email && <span>· <strong>E-mail:</strong> {email}</span>}
          </div>
        </div>
      </div>

      {/* Tarja com o Nome do Documento */}
      <div
        className="boletim-titulo-tag"
        style={{
          marginTop: "4px",
          display: "inline-block",
          border: "1.5px solid #000",
          padding: "3px 16px",
          fontWeight: "bold",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          background: "#f8fafc",
          color: "#000000"
        }}
      >
        {tituloDocumento}
      </div>

      {subtituloDocumento && (
        <div style={{ fontSize: "9.5px", marginTop: "3px", color: "#333", fontStyle: "italic" }}>
          {subtituloDocumento}
        </div>
      )}

      {protocolo && (
        <div style={{ fontSize: "9px", marginTop: "2px", color: "#444" }}>
          Autenticação Digital SIGEM: <strong>{protocolo}</strong>
        </div>
      )}
    </div>
  );
}

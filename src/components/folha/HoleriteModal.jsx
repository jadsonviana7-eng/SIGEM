import { useState } from "react";
import { Modal, Btn } from "../ui";

export default function HoleriteModal({ holerite, onClose, mes, ano }) {
  // Estado para alternar entre visualização P&B de alto contraste e colorido
  const [modoImpressao, setModoImpressao] = useState("pb"); // "pb" ou "colorido"

  if (!holerite) return null;

  const mesesExtenso = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const nomeMes = mesesExtenso[(Number(mes) || 1) - 1];

  const handleImprimir = () => {
    window.print();
  };

  const isPb = modoImpressao === "pb";
  const dataEmissao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const horaEmissao = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  // Hash de autenticidade documental simulado
  const codigoAutenticacao = `SIGEM-PB.${(holerite.matricula || "000000").replace(/\D/g, "")}.${ano}${(Number(mes) || 1).toString().padStart(2, "0")}.${(holerite.cpf || "000").replace(/\D/g, "").slice(0, 4)}`;

  const salarioBase = holerite.proventos?.find(p => p.rubrica === "001")?.valor || holerite.totalProventos || 0;

  return (
    <Modal
      titulo={`Contracheque Oficial - ${nomeMes} / ${ano}`}
      onClose={onClose}
      width={860}
      semRodape={true}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* BARRA DE FERRAMENTAS SUPERIOR (NÃO APARECE NA IMPRESSÃO) */}
        <div
          className="nao-imprimir"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            background: "#1e293b",
            border: "1px solid #33435c",
            borderRadius: 10,
            padding: "10px 16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
              Visualização em tela:
            </span>
            <div style={{ display: "inline-flex", background: "#0f172a", padding: 3, borderRadius: 8, border: "1px solid #33435c" }}>
              <button
                type="button"
                onClick={() => setModoImpressao("pb")}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: isPb ? "#ffffff" : "transparent",
                  color: isPb ? "#000000" : "#94a3b8",
                  transition: "all .15s ease"
                }}
              >
                <i className="ti ti-printer" /> Preto & Branco (P&B)
              </button>
              <button
                type="button"
                onClick={() => setModoImpressao("colorido")}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: !isPb ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" : "transparent",
                  color: !isPb ? "#ffffff" : "#94a3b8",
                  transition: "all .15s ease"
                }}
              >
                <i className="ti ti-palette" /> Colorido
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={handleImprimir} variant="primary" style={{ padding: "7px 16px", fontSize: 13, gap: 6 }}>
              <i className="ti ti-printer" /> Imprimir em P&B / Gerar PDF
            </Btn>
            <Btn onClick={onClose} variant="outline" style={{ padding: "7px 14px", fontSize: 13 }}>
              Fechar
            </Btn>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DOCUMENTO OFICIAL DO CONTRACHEQUE (PRÉ-VISUALIZAÇÃO IDÊNTICA AO A4 REAL) */}
        {/* ========================================================================= */}
        <div
          className="preview-folha-mesa nao-imprimir-wrapper"
          style={{
            background: "#334155",
            borderRadius: 12,
            padding: "20px 14px",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            overflowX: "auto"
          }}
        >
          {/* FOLHA A4 REAL COM MARGENS OFICIAIS (ÁREA DE IMPRESSÃO EXCLUSIVA) */}
          <div
            id="area-holerite-impressao"
            className={`print-target ${isPb ? "modo-pb-ativo" : "modo-colorido-ativo"}`}
            style={{
              background: "#ffffff",
              color: "#000000",
              width: "100%",
              maxWidth: 794,
              minHeight: "auto",
              padding: "15mm 20mm", // Margens oficiais A4 (1.5cm superior/inferior, 2.0cm laterais)
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
              border: "none",
              borderRadius: 2,
              fontFamily: "'Plus Jakarta Sans', Arial, Helvetica, sans-serif",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              boxSizing: "border-box"
            }}
          >

            {/* 1. CABEÇALHO OFICIAL INSTITUCIONAL */}
            <div
              style={{
                border: "1px solid #000000",
                borderRadius: 4,
                padding: "10px 14px",
                background: isPb ? "#ffffff" : "#f8fafc",
                display: "grid",
                gridTemplateColumns: "70px 1fr 180px",
                alignItems: "center",
                gap: 12
              }}
            >
              {/* Brasão / Logotipo em escala de cinza de alto contraste */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src="/logo.png"
                  alt="Brasão Municipal"
                  style={{
                    width: 56,
                    height: 56,
                    objectFit: "contain",
                    filter: isPb ? "grayscale(100%) contrast(150%)" : "none"
                  }}
                />
              </div>

              {/* Identificação da Prefeitura e Secretaria */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#000000", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  PREFEITURA MUNICIPAL · {holerite.municipio?.toUpperCase() || "MACEIÓ"}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#000000", textTransform: "uppercase", letterSpacing: "0.5px", margin: "1px 0" }}>
                  SECRETARIA MUNICIPAL DE EDUCAÇÃO
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#000000", textTransform: "uppercase" }}>
                  DEMONSTRATIVO MENSAL DE PAGAMENTO · RECIBO DE VENCIMENTOS
                </div>
                <div style={{ fontSize: 10, color: isPb ? "#222222" : "#475569" }}>
                  Recurso: <strong>{holerite.enquadramentoFundeb || "FUNDEB"}</strong> · SIGEM Sistema Integrado
                </div>
              </div>

              {/* Competência e Tipo de Folha */}
              <div
                style={{
                  borderLeft: "1px solid #000000",
                  paddingLeft: 12,
                  textAlign: "right"
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: isPb ? "#000000" : "#475569" }}>
                  COMPETÊNCIA
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#000000" }}>
                  {nomeMes.toUpperCase()} / {ano}
                </div>
                <div style={{ marginTop: 2 }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      border: "1px solid #000000",
                      borderRadius: 3,
                      background: isPb ? "#f0f0f0" : "rgba(37, 99, 235, 0.1)",
                      color: isPb ? "#000000" : "#1d4ed8"
                    }}
                  >
                    FOLHA NORMAL · {holerite.vinculo?.toUpperCase() || "EFETIVO"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. DADOS CADASTRAIS DO SERVIDOR (TABELA DE IDENTIFICAÇÃO) */}
            <div
              style={{
                border: "1px solid #000000",
                borderRadius: 4,
                overflow: "hidden"
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, color: "#000000" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #000000" }}>
                    <td style={{ padding: "5px 10px", width: "15%", borderRight: "1px solid #000000", background: isPb ? "#f5f5f5" : "#f1f5f9", fontWeight: 700 }}>
                      Matrícula:
                    </td>
                    <td style={{ padding: "5px 10px", width: "25%", borderRight: "1px solid #000000", fontFamily: "monospace", fontWeight: 700 }}>
                      {holerite.matricula || "—"}
                    </td>
                    <td style={{ padding: "5px 10px", width: "15%", borderRight: "1px solid #000000", background: isPb ? "#f5f5f5" : "#f1f5f9", fontWeight: 700 }}>
                      Nome do Servidor:
                    </td>
                    <td style={{ padding: "5px 10px", width: "45%", fontWeight: 800, textTransform: "uppercase" }}>
                      {holerite.servidorNome}
                    </td>
                  </tr>

                  <tr style={{ borderBottom: "1px solid #000000" }}>
                    <td style={{ padding: "5px 10px", borderRight: "1px solid #000000", background: isPb ? "#f5f5f5" : "#f1f5f9", fontWeight: 700 }}>
                      CPF:
                    </td>
                    <td style={{ padding: "5px 10px", borderRight: "1px solid #000000", fontWeight: 600 }}>
                      {holerite.cpf || "—"}
                    </td>
                    <td style={{ padding: "5px 10px", borderRight: "1px solid #000000", background: isPb ? "#f5f5f5" : "#f1f5f9", fontWeight: 700 }}>
                      Cargo / Função:
                    </td>
                    <td style={{ padding: "5px 10px", fontWeight: 600 }}>
                      <strong>{holerite.cargo}</strong> — Carga Horária: <strong>{holerite.cargaHoraria || "20h"}</strong>
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: "5px 10px", borderRight: "1px solid #000000", background: isPb ? "#f5f5f5" : "#f1f5f9", fontWeight: 700 }}>
                      Lotação:
                    </td>
                    <td style={{ padding: "5px 10px", borderRight: "1px solid #000000", fontWeight: 600 }}>
                      {holerite.escolaNome || "Secretaria Municipal de Educação"}
                    </td>
                    <td style={{ padding: "5px 10px", borderRight: "1px solid #000000", background: isPb ? "#f5f5f5" : "#f1f5f9", fontWeight: 700 }}>
                      Vínculo / Titulação:
                    </td>
                    <td style={{ padding: "5px 10px", fontWeight: 600 }}>
                      {holerite.vinculo || "Efetivo"} · Titulação: <strong>{holerite.titulacao || "Graduação"}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. TABELA DE PROVENTOS (VENCIMENTOS) E DESCONTOS */}
            <div
              style={{
                border: "1px solid #000000",
                borderRadius: 4,
                overflow: "hidden"
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, color: "#000000" }}>
                <thead>
                  <tr style={{ background: isPb ? "#e5e5e5" : "#f1f5f9", borderBottom: "1px solid #000000", textTransform: "uppercase", fontSize: 10 }}>
                    <th style={{ padding: "7px 10px", textAlign: "center", width: 55, borderRight: "1px solid #000000", fontWeight: 800 }}>CÓD.</th>
                    <th style={{ padding: "7px 10px", textAlign: "left", borderRight: "1px solid #000000", fontWeight: 800 }}>DESCRIÇÃO DA RUBRICA / EVENTO</th>
                    <th style={{ padding: "7px 10px", textAlign: "center", width: 85, borderRight: "1px solid #000000", fontWeight: 800 }}>REF.</th>
                    <th style={{ padding: "7px 10px", textAlign: "right", width: 140, borderRight: "1px solid #000000", fontWeight: 800 }}>VENCIMENTOS (R$)</th>
                    <th style={{ padding: "7px 10px", textAlign: "right", width: 140, fontWeight: 800 }}>DESCONTOS (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Linhas de Proventos */}
                  {(holerite.proventos || []).map((prov, i) => {
                    let refLabel = "30d";
                    if (prov.rubrica === "010") refLabel = "15%";
                    if (prov.rubrica === "015") refLabel = "10%";
                    if (prov.rubrica === "016") refLabel = "20%";
                    if (prov.rubrica === "017") refLabel = "30%";
                    if (prov.rubrica === "020") refLabel = "10%";
                    if (prov.rubrica === "025") refLabel = "Horas Ext.";

                    return (
                      <tr
                        key={`prov_${i}`}
                        style={{
                          borderBottom: "1px solid #d4d4d4",
                          background: i % 2 === 0 ? "#ffffff" : (isPb ? "#fafafa" : "#f8fafc")
                        }}
                      >
                        <td style={{ padding: "6px 10px", textAlign: "center", borderRight: "1px solid #000000", fontFamily: "monospace", fontWeight: 700 }}>
                          {prov.rubrica}
                        </td>
                        <td style={{ padding: "6px 10px", borderRight: "1px solid #000000", fontWeight: 600 }}>
                          {prov.descricao}
                        </td>
                        <td style={{ padding: "6px 10px", textAlign: "center", borderRight: "1px solid #000000", color: "#222222", fontSize: 10 }}>
                          {refLabel}
                        </td>
                        <td style={{ padding: "6px 10px", textAlign: "right", borderRight: "1px solid #000000", fontWeight: 700, fontFamily: "monospace" }}>
                          {prov.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "6px 10px", textAlign: "right", color: "#666666", fontFamily: "monospace" }}>
                          —
                        </td>
                      </tr>
                    );
                  })}

                  {/* Linhas de Descontos */}
                  {(holerite.descontos || []).map((desc, i) => {
                    let refLabel = "—";
                    if (desc.rubrica === "201") refLabel = "14%";
                    if (desc.rubrica === "202") refLabel = "Tab. INSS";
                    if (desc.rubrica === "301") refLabel = "Tab. IRRF";
                    if (desc.rubrica === "101") refLabel = `${holerite.faltasInjustificadas || 1}d`;

                    return (
                      <tr
                        key={`desc_${i}`}
                        style={{
                          borderBottom: "1px solid #d4d4d4",
                          background: (holerite.proventos?.length + i) % 2 === 0 ? "#ffffff" : (isPb ? "#fafafa" : "#f8fafc")
                        }}
                      >
                        <td style={{ padding: "6px 10px", textAlign: "center", borderRight: "1px solid #000000", fontFamily: "monospace", fontWeight: 700 }}>
                          {desc.rubrica}
                        </td>
                        <td style={{ padding: "6px 10px", borderRight: "1px solid #000000", fontWeight: 600 }}>
                          {desc.descricao}
                        </td>
                        <td style={{ padding: "6px 10px", textAlign: "center", borderRight: "1px solid #000000", color: "#222222", fontSize: 10 }}>
                          {refLabel}
                        </td>
                        <td style={{ padding: "6px 10px", textAlign: "right", borderRight: "1px solid #000000", color: "#666666", fontFamily: "monospace" }}>
                          —
                        </td>
                        <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, fontFamily: "monospace", color: isPb ? "#000000" : "#991b1b" }}>
                          {desc.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Linhas vazias para padronizar altura oficial de formulário contínuo */}
                  {Array.from({ length: Math.max(0, 5 - ((holerite.proventos?.length || 0) + (holerite.descontos?.length || 0))) }).map((_, idx) => (
                    <tr key={`vazio_${idx}`} style={{ borderBottom: "1px solid #e5e5e5", height: 26 }}>
                      <td style={{ borderRight: "1px solid #000000" }}>&nbsp;</td>
                      <td style={{ borderRight: "1px solid #000000" }}>&nbsp;</td>
                      <td style={{ borderRight: "1px solid #000000" }}>&nbsp;</td>
                      <td style={{ borderRight: "1px solid #000000" }}>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. QUADRO DE TOTAIS E VALOR LÍQUIDO A RECEBER */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1.4fr",
                gap: 12,
                marginTop: 2
              }}
            >
              {/* Total Vencimentos */}
              <div
                style={{
                  border: "1px solid #000000",
                  borderRadius: 4,
                  padding: "10px 14px",
                  background: isPb ? "#f8f8f8" : "#f0fdf4"
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#000000" }}>
                  TOTAL DE VENCIMENTOS (BRUTO)
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#000000", fontFamily: "monospace", marginTop: 2 }}>
                  R$ {(holerite.totalProventos || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Total Descontos */}
              <div
                style={{
                  border: "1px solid #000000",
                  borderRadius: 4,
                  padding: "10px 14px",
                  background: isPb ? "#f8f8f8" : "#fef2f2"
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#000000" }}>
                  TOTAL DE DESCONTOS
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: isPb ? "#000000" : "#991b1b", fontFamily: "monospace", marginTop: 2 }}>
                  R$ {(holerite.totalDescontos || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Valor Líquido - Borda dupla preta, contraste impecável para qualquer impressora P&B */}
              <div
                style={{
                  border: "2.5px solid #000000",
                  borderRadius: 4,
                  padding: "10px 16px",
                  background: isPb ? "#ffffff" : "#1e3a8a",
                  color: isPb ? "#000000" : "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center"
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  VALOR LÍQUIDO A RECEBER
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace", marginTop: 2 }}>
                  R$ {(holerite.valorLiquido || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* 5. BASES DE CÁLCULO E INFORMAÇÕES FISCAIS */}
            <div
              style={{
                border: "1px solid #000000",
                borderRadius: 4,
                overflow: "hidden"
              }}
            >
              <div style={{ background: isPb ? "#f0f0f0" : "#f8fafc", padding: "4px 10px", borderBottom: "1px solid #000000", fontSize: 9.5, fontWeight: 800, textTransform: "uppercase" }}>
                Bases de Cálculo e Encargos Sociais
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, color: "#000000", textAlign: "center" }}>
                <thead>
                  <tr style={{ background: "#ffffff", borderBottom: "1px solid #000000" }}>
                    <th style={{ padding: "4px 8px", borderRight: "1px solid #000000", fontWeight: 700 }}>Salário Base</th>
                    <th style={{ padding: "4px 8px", borderRight: "1px solid #000000", fontWeight: 700 }}>Base Cálc. Prev.</th>
                    <th style={{ padding: "4px 8px", borderRight: "1px solid #000000", fontWeight: 700 }}>Base Cálc. IRRF</th>
                    <th style={{ padding: "4px 8px", borderRight: "1px solid #000000", fontWeight: 700 }}>Dep. IRRF</th>
                    <th style={{ padding: "4px 8px", borderRight: "1px solid #000000", fontWeight: 700 }}>Dias Trab.</th>
                    <th style={{ padding: "4px 8px", borderRight: "1px solid #000000", fontWeight: 700 }}>Faltas Injust.</th>
                    <th style={{ padding: "4px 8px", fontWeight: 700 }}>Enquadramento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "5px 8px", borderRight: "1px solid #000000", fontFamily: "monospace", fontWeight: 700 }}>
                      R$ {salarioBase.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "5px 8px", borderRight: "1px solid #000000", fontFamily: "monospace", fontWeight: 700 }}>
                      R$ {(holerite.basePrevidencia || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "5px 8px", borderRight: "1px solid #000000", fontFamily: "monospace", fontWeight: 700 }}>
                      R$ {(holerite.baseIrrf || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "5px 8px", borderRight: "1px solid #000000", fontWeight: 700 }}>
                      {holerite.dependentes || 0}
                    </td>
                    <td style={{ padding: "5px 8px", borderRight: "1px solid #000000", fontWeight: 700 }}>
                      {holerite.diasTrabalhados ?? 22}
                    </td>
                    <td style={{ padding: "5px 8px", borderRight: "1px solid #000000", fontWeight: 700 }}>
                      {holerite.faltasInjustificadas || 0}
                    </td>
                    <td style={{ padding: "5px 8px", fontWeight: 700 }}>
                      {holerite.enquadramentoFundeb || "FUNDEB 70%"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6. MENSAGEM OFICIAL E AUTENTICAÇÃO */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 9,
                color: "#333333",
                padding: "4px 6px",
                borderTop: "1px dotted #999999",
                marginTop: 2
              }}
            >
              <div>
                Demonstrativo emitido via SIGEM em {dataEmissao} às {horaEmissao} · Válido como comprovante de rendimentos.
              </div>
              <div style={{ fontFamily: "monospace", fontWeight: 700 }}>
                Chave: {codigoAutenticacao}
              </div>
            </div>

            {/* 7. CANHOTO DESTACÁVEL (RECIBO DE ENTREGA COM LINHA DE CORTE) */}
            <div style={{ marginTop: 8 }}>
              {/* Linha de corte com tesoura */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 10,
                  color: "#444444",
                  marginBottom: 6,
                  fontWeight: 600
                }}
              >
                <i className="ti ti-scissors" style={{ fontSize: 13 }} />
                <div style={{ flex: 1, borderTop: "1.5px dashed #000000" }} />
                <span>Corte aqui (Via da Secretaria / Comprovante de Entrega)</span>
                <div style={{ flex: 1, borderTop: "1.5px dashed #000000" }} />
                <i className="ti ti-scissors" style={{ fontSize: 13 }} />
              </div>

              {/* Recibo do Servidor */}
              <div
                style={{
                  border: "1px solid #000000",
                  borderRadius: 4,
                  padding: "10px 14px",
                  background: isPb ? "#ffffff" : "#fafafa",
                  fontSize: 10.5,
                  color: "#000000"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, borderBottom: "1px solid #cccccc", paddingBottom: 4 }}>
                  <strong style={{ textTransform: "uppercase", fontSize: 10 }}>
                    RECIBO DE PAGAMENTO MENSAL · SECRETARIA MUNICIPAL DE EDUCAÇÃO
                  </strong>
                  <span style={{ fontWeight: 700 }}>
                    COMPETÊNCIA: {nomeMes.toUpperCase()} / {ano}
                  </span>
                </div>

                <div style={{ margin: "6px 0", lineHeight: 1.4 }}>
                  Declaro que recebi da <strong>SECRETARIA MUNICIPAL DE EDUCAÇÃO</strong> a importância líquida de{" "}
                  <strong>
                    R$ {(holerite.valorLiquido || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                  , correspondente à quitação dos meus vencimentos e vantagens do mês de referência retrocitado.
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: 16, marginTop: 16, alignItems: "flex-end" }}>
                  <div>
                    <div style={{ borderBottom: "1px solid #000000", width: "100%", height: 18 }} />
                    <div style={{ fontSize: 9.5, textAlign: "center", marginTop: 3, fontWeight: 700 }}>
                      DATA DO RECEBIMENTO: _____ / _____ / {ano}
                    </div>
                  </div>

                  <div>
                    <div style={{ borderBottom: "1px solid #000000", width: "100%", height: 18 }} />
                    <div style={{ fontSize: 9.5, textAlign: "center", marginTop: 3, fontWeight: 700, textTransform: "uppercase" }}>
                      ASSINATURA: {holerite.servidorNome} (Mat: {holerite.matricula})
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          {/* FIM DA FOLHA A4 */}

        </div>
        {/* FIM DA MESA DE PRÉ-VISUALIZAÇÃO */}

      </div>

      {/* ESTILOS DE IMPRESSÃO EM P&B DE ALTO CONTRASTE (COM MARGENS OFICIAIS A4) */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          /* 1. Força fundo branco puro em todo o documento, body e html */
          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 2. Anula COMPLETAMENTE qualquer fundo escuro, borda, sombra e overlay de modais do app */
          #root,
          .ui-modal-overlay,
          .ui-modal-card,
          .ui-modal-card > div,
          .no-scrollbar,
          .preview-folha-mesa,
          .nao-imprimir-wrapper,
          main,
          body > div {
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
          }

          /* 3. Oculta tudo que não for o documento */
          body * {
            visibility: hidden !important;
          }

          /* 4. Oculta botões, barras de ferramentas e elementos da interface */
          .nao-imprimir,
          .ui-modal-overlay button,
          button,
          nav,
          header,
          aside {
            display: none !important;
            visibility: hidden !important;
          }

          /* 5. Torna visível estritamente a folha do holerite */
          #area-holerite-impressao,
          #area-holerite-impressao * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: #000000 !important;
          }

          /* 6. Folha A4 com margens oficiais padronizadas (15mm superior/inferior e 20mm laterais) */
          #area-holerite-impressao {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm 20mm 15mm 20mm !important; /* MARGENS OFICIAIS A4: 1.5cm Superior/Inferior e 2.0cm Laterais */
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
            page-break-inside: avoid !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
          }

          /* 7. Garante imagens e brasão em escala de cinza e alto contraste */
          #area-holerite-impressao img {
            filter: grayscale(100%) contrast(150%) !important;
          }
        }
      `}</style>
    </Modal>
  );
}

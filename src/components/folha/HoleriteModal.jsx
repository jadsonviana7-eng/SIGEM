import { Modal, Btn, Badge } from "../ui";

export default function HoleriteModal({ holerite, onClose, mes, ano }) {
  if (!holerite) return null;

  const mesesExtenso = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const nomeMes = mesesExtenso[(Number(mes) || 1) - 1];

  const handleImprimir = () => {
    window.print();
  };

  return (
    <Modal
      titulo={`Contracheque / Holerite - ${nomeMes} / ${ano}`}
      onClose={onClose}
      width={780}
    >
      <div id="area-holerite-impressao" style={{ display: "flex", flexDirection: "column", gap: 16, color: "#1f2937" }}>
        
        {/* CABEÇALHO OFICIAL DO CONTRACHEQUE */}
        <div style={{
          border: "2px solid #1e3a8a",
          borderRadius: 8,
          padding: "16px 20px",
          background: "#f8fafc",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              SECRETARIA MUNICIPAL DE EDUCAÇÃO
            </div>
            <div style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>
              Prefeitura Municipal · Sistema Integrado de Gestão Escolar (SIGEM)
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
              Folha de Pagamento da Educação Básica · {holerite.enquadramentoFundeb || "FUNDEB"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Competência</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e3a8a" }}>{nomeMes} / {ano}</div>
            <Badge color="blue" style={{ marginTop: 2 }}>{holerite.vinculo || "Efetivo"}</Badge>
          </div>
        </div>

        {/* DADOS DO SERVIDOR */}
        <div style={{
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          padding: "14px 18px",
          background: "white",
          fontSize: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "10px 16px"
        }}>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: 11 }}>Servidor(a)</span>
            <b style={{ fontSize: 13, color: "#0f172a" }}>{holerite.servidorNome}</b>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: 11 }}>CPF</span>
            <b>{holerite.cpf || "Não informado"}</b>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: 11 }}>Matrícula</span>
            <b style={{ fontFamily: "monospace" }}>{holerite.matricula}</b>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: 11 }}>Cargo / Função</span>
            <b>{holerite.cargo}</b> ({holerite.cargaHoraria || "20h"})
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: 11 }}>Lotação / Unidade</span>
            <b>{holerite.escolaNome}</b>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: 11 }}>Titulação / Formação</span>
            <b>{holerite.titulacao || "Graduação"}</b>
          </div>
        </div>

        {/* TABELA DE PROVENTOS E DESCONTOS */}
        <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", color: "#334155", textTransform: "uppercase", fontSize: 11 }}>
                <th style={{ padding: "10px 12px", textAlign: "left", width: 60 }}>Cód.</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Descrição da Rubrica</th>
                <th style={{ padding: "10px 12px", textAlign: "right", width: 130 }}>Proventos</th>
                <th style={{ padding: "10px 12px", textAlign: "right", width: 130 }}>Descontos</th>
              </tr>
            </thead>
            <tbody>
              {/* Proventos */}
              {(holerite.proventos || []).map((prov, i) => (
                <tr key={`p_${i}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#64748b" }}>{prov.rubrica}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 500 }}>{prov.descricao}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#166534", fontWeight: 600 }}>
                    {prov.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>-</td>
                </tr>
              ))}

              {/* Descontos */}
              {(holerite.descontos || []).map((desc, i) => (
                <tr key={`d_${i}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#64748b" }}>{desc.rubrica}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 500 }}>{desc.descricao}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>-</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#991b1b", fontWeight: 600 }}>
                    {desc.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTAIS E VALOR LÍQUIDO */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1.3fr",
          gap: 12,
          background: "#f8fafc",
          padding: "16px 20px",
          borderRadius: 8,
          border: "1px solid #cbd5e1"
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total de Vencimentos</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#166534", marginTop: 2 }}>
              {(holerite.totalProventos || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total de Descontos</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#991b1b", marginTop: 2 }}>
              {(holerite.totalDescontos || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>

          <div style={{
            background: "#1e3a8a",
            color: "white",
            padding: "10px 16px",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(30, 58, 138, 0.2)"
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", opacity: 0.9 }}>VALOR LÍQUIDO A RECEBER</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {(holerite.valorLiquido || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>
        </div>

        {/* BASES DE CÁLCULO E FREQUÊNCIA */}
        <div style={{
          fontSize: 11,
          color: "#64748b",
          border: "1px solid #e2e8f0",
          borderRadius: 6,
          padding: "10px 14px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 8,
          background: "#fafafa"
        }}>
          <div><b>Base Previdência:</b> {(holerite.basePrevidencia || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
          <div><b>Base IRRF:</b> {(holerite.baseIrrf || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
          <div><b>Dependentes:</b> {holerite.dependentes || 0}</div>
          <div><b>Dias Trab:</b> {holerite.diasTrabalhados ?? 22}</div>
          <div><b>Faltas Injust:</b> {holerite.faltasInjustificadas || 0}</div>
          <div><b>Recurso:</b> {holerite.enquadramentoFundeb || "FUNDEB 70%"}</div>
        </div>

        {/* RODAPÉ DO COMPROVANTE */}
        <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", paddingTop: 8, borderTop: "1px dashed #cbd5e1" }}>
          Documento gerado eletronicamente pela Secretaria Municipal de Educação em {new Date().toLocaleDateString("pt-BR")}. Válido como comprovante de rendimentos.
        </div>

        {/* BOTÃO DE IMPRESSÃO */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
          <Btn onClick={handleImprimir} variant="primary" style={{ padding: "8px 16px" }}>
            <i className="ti ti-printer" /> Imprimir Holerite / Salvar PDF
          </Btn>
        </div>

      </div>

      {/* ESTILOS DE IMPRESSÃO */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #area-holerite-impressao, #area-holerite-impressao * {
            visibility: visible;
          }
          #area-holerite-impressao {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
      `}</style>
    </Modal>
  );
}

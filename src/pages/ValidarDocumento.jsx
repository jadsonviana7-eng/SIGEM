import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { validarDocumentoPorCodigo } from "../services/validacaoDocumentosService";
import { Card, Btn, Spinner } from "../components/ui";

export default function ValidarDocumento() {
  const [searchParams] = useSearchParams();
  const codigoUrl = searchParams.get("codigo") || searchParams.get("c") || "";

  const [codigoInput, setCodigoInput] = useState(codigoUrl);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  useEffect(() => {
    if (codigoUrl) {
      setCodigoInput(codigoUrl);
      executarValidacao(codigoUrl);
    }
  }, [codigoUrl]);

  async function executarValidacao(codigoParaValidar) {
    const cod = (codigoParaValidar || codigoInput || "").trim();
    if (!cod) return;

    setCarregando(true);
    setNaoEncontrado(false);
    setResultado(null);

    try {
      const docValido = await validarDocumentoPorCodigo(cod);
      if (docValido) {
        setResultado(docValido);
      } else {
        setNaoEncontrado(true);
      }
    } catch (err) {
      console.error(err);
      setNaoEncontrado(true);
    } finally {
      setCarregando(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    executarValidacao(codigoInput);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "2rem 1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* CABEÇALHO DO PORTAL DE VALIDAÇÃO */}
      <div style={{ maxWidth: "700px", width: "100%", textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "16px", background: "#eff6ff", color: "#2563eb", fontSize: "2rem", marginBottom: "1rem", boxShadow: "0 4px 12px rgba(37,99,235,0.15)" }}>
          <i className="ti ti-shield-check" />
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e293b", margin: "0 0 0.5rem" }}>
          Portal de Autenticidade Digital
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0 }}>
          SIGEM · Sistema Integrado de Gestão Escolar Municipal de Porto Calvo / AL
        </p>
      </div>

      {/* FORMULÁRIO DE CONSULTA */}
      <Card style={{ maxWidth: "700px", width: "100%", marginBottom: "1.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
              Código de Validação do Documento
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Ex: SIGEM-2026-HIST-9F8A-7B2C"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                style={{
                  flex: "1 1 280px",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "8px",
                  border: "2px solid #cbd5e1",
                  fontSize: "1rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: "#1e293b",
                  outline: "none"
                }}
              />
              <Btn variant="primary" onClick={() => executarValidacao(codigoInput)} disabled={carregando || !codigoInput.trim()}>
                {carregando ? "Validando..." : "Verificar Autenticidade 🔍"}
              </Btn>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.4rem", display: "block" }}>
              O código verificador encontra-se no rodapé ou selo digital do documento emitido.
            </span>
          </div>
        </form>
      </Card>

      {/* CARREGANDO */}
      {carregando && (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <Spinner />
          <p style={{ marginTop: "1rem", color: "#64748b" }}>Consultando base de autenticidade criptográfica...</p>
        </div>
      )}

      {/* RESULTADO: DOCUMENTO AUTÊNTICO E VÁLIDO */}
      {resultado && !carregando && (
        <Card style={{ maxWidth: "700px", width: "100%", border: "2px solid #22c55e", background: "#ffffff", boxShadow: "0 8px 30px rgba(34,197,94,0.12)" }}>
          {/* BANNER DE SUCESSO */}
          <div style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", padding: "1.25rem 1.5rem", borderRadius: "10px 10px 0 0", margin: "-1.5rem -1.5rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", flexShrink: 0 }}>
              <i className="ti ti-check" />
            </div>
            <div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#166534" }}>
                DOCUMENTO AUTÊNTICO E VÁLIDO 🔒
              </div>
              <div style={{ fontSize: "0.85rem", color: "#15803d" }}>
                Emitido oficialmente pelo SIGEM em conformidade com as diretrizes do MEC.
              </div>
            </div>
          </div>

          {/* DADOS DO DOCUMENTO */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Tipo de Documento</span>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>{resultado.tipoDescricao || "Histórico Escolar Oficial"}</div>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Código de Validação</span>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#2563eb", fontFamily: "monospace" }}>{resultado.codigoValidacao}</div>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Estudante Titular</span>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>{resultado.alunoNome}</div>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Matrícula Escolar</span>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>{resultado.alunoMatricula || "20260012"}</div>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Unidade Escolar Emissora</span>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>{resultado.escolaNome}</div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Código INEP: {resultado.escolaInep} · {resultado.escolaMunicipio}/{resultado.escolaUf}</span>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Data e Hora da Emissão</span>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>
                  {new Date(resultado.dataEmissao || resultado.criadoEm).toLocaleString("pt-BR")}
                </div>
              </div>
            </div>

            {/* SELO DE SEGURANÇA */}
            <div style={{ padding: "0.85rem", borderRadius: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "0.8rem", color: "#1e40af", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <i className="ti ti-lock" style={{ fontSize: "1.4rem" }} />
              <div>
                Este registro possui autenticidade digital garantida pelo banco de dados centralizado do município. Qualquer divergência entre o documento físico e as informações acima indica adulteração.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
              <Link to="/historico" style={{ textDecoration: "none" }}>
                <Btn variant="default">
                  <i className="ti ti-arrow-left" /> Voltar ao Painel
                </Btn>
              </Link>
              <Btn variant="primary" onClick={() => window.print()}>
                <i className="ti ti-printer" /> Imprimir Comprovante
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {/* RESULTADO: DOCUMENTO NÃO ENCONTRADO */}
      {naoEncontrado && !carregando && (
        <Card style={{ maxWidth: "700px", width: "100%", border: "2px solid #ef4444", background: "#ffffff", textAlign: "center", padding: "2rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "1rem" }}>
            <i className="ti ti-alert-triangle" />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#991b1b", margin: "0 0 0.5rem" }}>
            Documento Não Encontrado ou Inválido
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem", maxWidth: "450px", margin: "0 auto 1.5rem" }}>
            O código <strong>"{codigoInput}"</strong> não corresponde a nenhum documento emitido oficialmente pelo SIGEM. Verifique se o código foi digitado corretamente.
          </p>
          <Btn variant="default" onClick={() => setCodigoInput("")}>
            Tentar Outro Código
          </Btn>
        </Card>
      )}
    </div>
  );
}

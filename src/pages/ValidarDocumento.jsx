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
    <div style={{ minHeight: "100vh", background: "#161f2e", padding: "2.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* CABEÇALHO DO PORTAL DE VALIDAÇÃO */}
      <div style={{ maxWidth: "700px", width: "100%", textAlign: "center", marginBottom: "2rem" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 72,
          height: 72,
          borderRadius: 18,
          background: "#ffffff",
          border: "2px solid #3b82f6",
          padding: 4,
          marginBottom: "1rem",
          boxShadow: "0 8px 24px rgba(59, 130, 246, 0.25)"
        }}>
          <img
            src="/logo.png"
            alt="SIGEM"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: 14
            }}
          />
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.5rem" }}>
          Portal de Autenticidade Digital
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>
          SIGEM · Sistema Integrado de Gestão Escolar Municipal de Santana do Mundaú / AL
        </p>
      </div>

      {/* FORMULÁRIO DE CONSULTA */}
      <Card style={{ maxWidth: "700px", width: "100%", marginBottom: "1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
        <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "0.4rem" }}>
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
                  border: "2px solid #33435c",
                  background: "#243144",
                  fontSize: "1rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: "#ffffff",
                  outline: "none"
                }}
              />
              <Btn variant="primary" onClick={() => executarValidacao(codigoInput)} disabled={carregando || !codigoInput.trim()}>
                {carregando ? "Validando..." : "Verificar Autenticidade 🔍"}
              </Btn>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.5rem", display: "block" }}>
              O código verificador encontra-se no rodapé ou selo digital do documento emitido.
            </span>
          </div>
        </form>
      </Card>

      {/* CARREGANDO */}
      {carregando && (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <Spinner />
          <p style={{ marginTop: "1rem", color: "#94a3b8" }}>Consultando base de autenticidade criptográfica...</p>
        </div>
      )}

      {/* RESULTADO: DOCUMENTO AUTÊNTICO E VÁLIDO */}
      {resultado && !carregando && (
        <Card style={{ maxWidth: "700px", width: "100%", border: "2px solid rgba(34, 197, 94, 0.4)", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
          {/* BANNER DE SUCESSO */}
          <div style={{ background: "rgba(34, 197, 94, 0.12)", borderBottom: "1px solid rgba(34, 197, 94, 0.25)", padding: "1.25rem 1.5rem", borderRadius: "10px 10px 0 0", margin: "-1.5rem -1.5rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", flexShrink: 0 }}>
              <i className="ti ti-check" />
            </div>
            <div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#34d399" }}>
                DOCUMENTO AUTÊNTICO E VÁLIDO 🔒
              </div>
              <div style={{ fontSize: "0.85rem", color: "#86efac" }}>
                Emitido oficialmente pelo SIGEM em conformidade com as diretrizes do MEC.
              </div>
            </div>
          </div>

          {/* DADOS DO DOCUMENTO */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", background: "#243144", padding: "1rem", borderRadius: "8px", border: "1px solid #33435c" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Tipo de Documento</span>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>{resultado.tipoDescricao || "Histórico Escolar Oficial"}</div>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Código de Validação</span>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#38bdf8", fontFamily: "monospace" }}>{resultado.codigoValidacao}</div>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Estudante Titular</span>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>{resultado.alunoNome}</div>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Matrícula Escolar</span>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#cbd5e1" }}>{resultado.alunoMatricula || "20260012"}</div>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Unidade Escolar Emissora</span>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#cbd5e1" }}>{resultado.escolaNome}</div>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Código INEP: {resultado.escolaInep} · {resultado.escolaMunicipio}/{resultado.escolaUf}</span>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Data e Hora da Emissão</span>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#cbd5e1" }}>
                  {new Date(resultado.dataEmissao || resultado.criadoEm).toLocaleString("pt-BR")}
                </div>
              </div>
            </div>

            {/* SELO DE SEGURANÇA */}
            <div style={{ padding: "0.85rem", borderRadius: "8px", background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.25)", fontSize: "0.8rem", color: "#93c5fd", display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
        <Card style={{ maxWidth: "700px", width: "100%", border: "2px solid rgba(239, 68, 68, 0.4)", textAlign: "center", padding: "2rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "1rem" }}>
            <i className="ti ti-alert-triangle" />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fca5a5", margin: "0 0 0.5rem" }}>
            Documento Não Encontrado ou Inválido
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", maxWidth: "450px", margin: "0 auto 1.5rem" }}>
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

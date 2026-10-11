import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await login(email, senha);
      navigate("/");
    } catch {
      setErro("E-mail ou senha incorretos.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#161f2e", padding: 20 }}>
      <div style={{ background: "#1e293b", border: "1px solid #33435c", borderRadius: 16, padding: "36px 32px", width: "100%", maxWidth: 400, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "#ffffff",
            border: "2px solid #6366f1",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
            marginBottom: 14,
            boxShadow: "0 8px 24px rgba(99, 102, 241, 0.25)"
          }}>
            <img
              src="/logo.png"
              alt="SIGEM"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: 16
              }}
            />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "-0.02em" }}>SIGEM</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4, marginBottom: 0 }}>Sistema Integrado de Gestão Escolar Municipal</p>
        </div>

        {erro && (
          <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-alert-circle" /> {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 6 }}>E-mail de Acesso</label>
            <div style={{ position: "relative" }}>
              <i className="ti ti-mail" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 16 }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="coordenacao@escola.edu.br"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#243144",
                  border: "1px solid #33435c",
                  borderRadius: 8,
                  padding: "10px 12px 10px 38px",
                  fontSize: 14,
                  color: "#ffffff",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.15s"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 6 }}>Senha</label>
            <div style={{ position: "relative" }}>
              <i className="ti ti-lock" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 16 }} />
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#243144",
                  border: "1px solid #33435c",
                  borderRadius: 8,
                  padding: "10px 12px 10px 38px",
                  fontSize: 14,
                  color: "#ffffff",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.15s"
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: "11px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: carregando ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: carregando ? 0.7 : 1,
              marginTop: 6,
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              transition: "transform 0.15s ease"
            }}
          >
            {carregando ? "Autenticando..." : "Entrar no Sistema"}
          </button>
        </form>

        <p style={{ fontSize: 11, color: "#64748b", textAlign: "center", marginTop: 22, marginBottom: 0 }}>
          Plataforma Segura · Gestão Escolar & Transparência
        </p>
      </div>
    </div>
  );
}

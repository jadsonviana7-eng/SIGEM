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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f4f2" }}>
      <div style={{ background: "white", border: "1px solid #e5e5e4", borderRadius: 12, padding: 36, width: 380, boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <i className="ti ti-school" style={{ fontSize: 40, color: "#1a56db" }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 10 }}>SIGEM</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Sistema Escolar · Ensino Fundamental</p>
        </div>
        {erro && <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: "#fee2e2", color: "#991b1b", fontSize: 13 }}>{erro}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="coordenacao@escola.edu.br" required
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Senha</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: "inherit" }} />
          </div>
          <button type="submit" disabled={carregando}
            style={{ background: "#1a56db", color: "white", border: "none", borderRadius: 6, padding: "10px", fontSize: 14, fontWeight: 500, cursor: carregando ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: carregando ? .7 : 1, marginTop: 4 }}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 20 }}>Crie o usuário no Firebase Authentication antes do primeiro acesso.</p>
      </div>
    </div>
  );
}

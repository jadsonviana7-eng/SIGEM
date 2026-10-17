import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [podeDigitar, setPodeDigitar] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Garante que os campos comecem 100% vazios e impede autofill indevido do navegador
  useEffect(() => {
    setEmail("");
    setSenha("");
    const timer = setTimeout(() => {
      setPodeDigitar(true);
      setEmail("");
      setSenha("");
    }, 120);

    return () => clearTimeout(timer);
  }, []);

  // Se já estiver autenticado, redireciona diretamente para o painel principal
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !senha) return;
    setErro("");
    setCarregando(true);

    try {
      await login(email.trim(), senha);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Falha na autenticação:", err);
      let mensagem = "E-mail ou senha incorretos.";
      if (
        err?.code === "auth/invalid-credential" ||
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/user-not-found"
      ) {
        mensagem = "E-mail ou senha incorretos. Por favor, confira os dados.";
      } else if (err?.code === "auth/too-many-requests") {
        mensagem = "Muitas tentativas malsucedidas. Aguarde alguns instantes.";
      } else if (err?.code === "auth/network-request-failed") {
        mensagem = "Falha de conexão com a rede. Verifique seu sinal de internet.";
      }
      setErro(mensagem);
      setCarregando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.62) 50%, rgba(15, 23, 42, 0.85) 100%), url("${encodeURI('/Educação em Foco ao Amanhecer.png')}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        padding: 20,
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          background: "rgba(30, 41, 59, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 20,
          padding: "36px 32px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
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
            }}
          >
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
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              margin: 0,
              color: "#ffffff",
              letterSpacing: "-0.02em"
            }}
          >
            SIGEM
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#94a3b8",
              marginTop: 4,
              marginBottom: 0
            }}
          >
            Sistema Integrado de Gestão Escolar Municipal
          </p>
        </div>

        {erro && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 16,
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <i className="ti ti-alert-circle" /> {erro}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Campos ocultos para interceptar o preenchimento automático indesejado dos navegadores */}
          <input
            type="text"
            name="prevent_autofill_user"
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />
          <input
            type="password"
            name="prevent_autofill_pass"
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#cbd5e1",
                display: "block",
                marginBottom: 6
              }}
            >
              E-mail de Acesso
            </label>
            <div style={{ position: "relative" }}>
              <i
                className="ti ti-mail"
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  fontSize: 16
                }}
              />
              <input
                type="email"
                name="sigem_login_email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                required
                readOnly={!podeDigitar}
                onFocus={() => setPodeDigitar(true)}
                autoComplete="new-password"
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
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#cbd5e1",
                display: "block",
                marginBottom: 6
              }}
            >
              Senha
            </label>
            <div style={{ position: "relative" }}>
              <i
                className="ti ti-lock"
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  fontSize: 16
                }}
              />
              <input
                type={mostrarSenha ? "text" : "password"}
                name="sigem_login_senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                required
                readOnly={!podeDigitar}
                onFocus={() => setPodeDigitar(true)}
                autoComplete="new-password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#243144",
                  border: "1px solid #33435c",
                  borderRadius: 8,
                  padding: "10px 40px 10px 38px",
                  fontSize: 14,
                  color: "#ffffff",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.15s"
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: 18,
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <i className={mostrarSenha ? "ti ti-eye-off" : "ti ti-eye"} />
              </button>
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

        <p
          style={{
            fontSize: 11,
            color: "#64748b",
            textAlign: "center",
            marginTop: 22,
            marginBottom: 0
          }}
        >
          Plataforma Segura · Gestão Escolar & Transparência
        </p>
      </div>
    </div>
  );
}

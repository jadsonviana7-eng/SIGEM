import { NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Badge } from "./ui";
import styles from "./Layout.module.css";

const navItems = [
  { to: "/", label: "Gestão Secretaria", icon: "layout-dashboard", exact: true },
  { to: "/alunos", label: "Alunos", icon: "users" },
  { to: "/matriculas", label: "Matrículas & Vagas", icon: "clipboard-plus" },
  { to: "/transferencias", label: "Transferências", icon: "file-export" },
  { to: "/historico", label: "Histórico Escolar", icon: "certificate" },
  { to: "/ocorrencias", label: "Ocorrências", icon: "clipboard-list" },
  { to: "/transporte", label: "Transporte Escolar", icon: "bus" },
  { to: "/alimentacao", label: "Alimentação Escolar", icon: "salad" },
  { to: "/educacao-especial", label: "Educação Especial", icon: "heart-handshake" },
  { to: "/comunicacao", label: "Comunicação", icon: "speakerphone" },
  { to: "/professores", label: "Servidores", icon: "user-star" },
  { to: "/turmas", label: "Turmas", icon: "books" },
  { to: "/conteudos", label: "Conteúdos Aplicados", icon: "notebook" },
  { to: "/frequencia", label: "Frequência", icon: "calendar-check" },
  { to: "/notas", label: "Notas", icon: "clipboard-check" },
  { to: "/boletim", label: "Boletim Escolar", icon: "certificate" },
  { to: "/fechamento", label: "Fechamento de Período", icon: "lock" },
  { to: "/relatorios", label: "Relatórios", icon: "chart-bar" },
  { to: "/financeiro", label: "Financeiro", icon: "coin" },
  { to: "/folha-pagamento", label: "Folha & Ponto", icon: "cash" },
  { to: "/auditoria", label: "LOGs / Auditoria", icon: "shield-check" },
  { to: "/configuracoes", label: "Configurações", icon: "settings" },
];


export default function Layout({ children, titulo }) {
  const { user, logout, selectedEscolaId, alterarEscolaAtiva, escolas } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  async function handleLogout() {
    setIsDropdownOpen(false);
    try {
      await logout();
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
    navigate("/login");
  }

  return (
    <div className={styles.app}>
      <nav className={styles.sidebar}>
        <div className={styles.logo}>
          <h1>
            <i className="ti ti-school" aria-hidden="true" /> SIGEM - Mundaú
          </h1>
          <p>Ensino Fundamental · {new Date().getFullYear()}</p>
        </div>

        <div className={styles.navSection}>Gestão Secretaria</div>
        {navItems.slice(0, 1).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
          >
            <i className={`ti ti-${item.icon}`} aria-hidden="true" />
            Centro de Comando
          </NavLink>
        ))}

        <div className={styles.navSection}>Gestão Escolar</div>
        {navItems.filter(item => ["/alunos", "/matriculas", "/transferencias", "/historico", "/ocorrencias", "/transporte", "/alimentacao", "/educacao-especial", "/comunicacao", "/professores", "/turmas"].includes(item.to)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
          >
            <i className={`ti ti-${item.icon}`} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}



        <div className={styles.navSection}>Caderneta Digital</div>
        {navItems.filter(item => ["/conteudos", "/frequencia", "/notas", "/boletim", "/fechamento"].includes(item.to)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
          >
            <i className={`ti ti-${item.icon}`} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}

        <div className={styles.navSection}>Análises</div>
        {navItems.filter(item => ["/relatorios"].includes(item.to)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
          >
            <i className={`ti ti-${item.icon}`} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}

        {(user?.role === "Administrador" || user?.role === "Diretor" || user?.role === "Direção") && (
          <>
            <div className={styles.navSection}>Gestão Escolar</div>
            {navItems.filter(item => ["/financeiro", "/folha-pagamento"].includes(item.to)).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ""}`
                }
              >
                <i className={`ti ti-${item.icon}`} aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </>
        )}

        <div className={styles.navSection}>Sistema & Auditoria</div>
        {navItems.filter(item => ["/auditoria", "/configuracoes"].includes(item.to)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
          >
            <i className={`ti ti-${item.icon}`} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}

      </nav>

      <div className={styles.main}>
        <header className={styles.topbar} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>{titulo}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {user?.role === "Administrador" && (escolas || []).length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#4b5563" }}>
                  <i className="ti ti-school" style={{ marginRight: 4 }} />
                  Escola Ativa:
                </span>
                <select
                  value={selectedEscolaId}
                  onChange={(e) => alterarEscolaAtiva(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    fontSize: 13,
                    fontWeight: 500,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    outline: "none",
                    backgroundColor: "white",
                    cursor: "pointer",
                    color: "#1f2937",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  }}
                >
                  {(escolas || []).map((esc) => (
                    <option key={esc.id} value={esc.id}>
                      {esc.nome} ({esc.municipio})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {user?.role !== "Administrador" && (
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#1e40af",
                background: "#eff6ff",
                border: "1px solid #dbeafe",
                padding: "6px 14px",
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
              }}>
                <i className="ti ti-school" style={{ color: "#2563eb", fontSize: 15 }} />
                <span>{(escolas || []).find(e => e.id === (user?.escolaId || selectedEscolaId))?.nome || "Escola Vinculada"}</span>
              </div>
            )}

            {/* Profile Dropdown */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button 
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0
                }}
              >
                <div style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "50%", background: "#e8f0fe", color: "#1a56db", fontWeight: "bold", fontSize: 16 }}>
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"
                  )}
                </div>
              </button>

              {isDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 240,
                  background: "white",
                  borderRadius: 8,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  zIndex: 50
                }}>
                  <div style={{ padding: "16px", borderBottom: "1px solid #f3f4f6", background: "#f8fafc" }}>
                    <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: 2 }}>{user?.displayName || "Usuário"}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{user?.email}</div>
                    <Badge color="blue" style={{ fontSize: 10 }}>{user?.role || "Usuário"}</Badge>
                  </div>
                  <div style={{ padding: 8 }}>
                    <button 
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: "100%", textAlign: "left", padding: "10px 12px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#ef4444", fontWeight: 500, fontSize: 14, borderRadius: 6
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <i className="ti ti-logout" /> Sair do Sistema
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

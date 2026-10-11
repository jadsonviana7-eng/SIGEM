import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import styles from "./Layout.module.css";

// Itens principais alinhados ao modelo da imagem (em Português)
const mainNavItems = [
  { to: "/", label: "Painel", icon: "layout-dashboard", exact: true },
  { to: "/matriculas", label: "Matrículas", icon: "user-plus" },
  { to: "/alunos", label: "Alunos", icon: "school" },
  { to: "/professores", label: "Professores", icon: "users" },
  { type: "divider" },
  { to: "/transporte", label: "Escolas", icon: "building-community" },
  { to: "/turmas", label: "Pedagógico", icon: "books" },
  { to: "/relatorios", label: "Relatórios", icon: "chart-bar" },
  { to: "/frequencia", label: "Frequência", icon: "calendar-check" },
  { to: "/financeiro", label: "Financeiro", icon: "coin" },
];

// Módulos adicionais do SIGEM acessíveis pelo menu de expansão rápida
const modulosAdicionais = [
  { to: "/notas", label: "Lançamento de Notas", icon: "clipboard-check" },
  { to: "/boletim", label: "Boletim Escolar", icon: "certificate" },
  { to: "/conteudos", label: "Conteúdos / Diário", icon: "notebook" },
  { to: "/fechamento", label: "Fechamento de Período", icon: "lock" },
  { to: "/transferencias", label: "Transferências", icon: "file-export" },
  { to: "/historico", label: "Histórico Escolar", icon: "file-certificate" },
  { to: "/ocorrencias", label: "Ocorrências", icon: "clipboard-list" },
  { to: "/alimentacao", label: "Alimentação Escolar", icon: "salad" },
  { to: "/educacao-especial", label: "Educação Especial", icon: "heart-handshake" },
  { to: "/comunicacao", label: "Comunicação Escolar", icon: "speakerphone" },
  { to: "/folha-pagamento", label: "Folha & Ponto", icon: "cash" },
  { to: "/auditoria", label: "Logs & Auditoria", icon: "shield-check" },
  { to: "/configuracoes", label: "Configurações", icon: "settings" },
];

export default function Layout({ children, titulo }) {
  const { user, logout, selectedEscolaId, alterarEscolaAtiva, escolas } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [modalModulosAberto, setModalModulosAberto] = useState(false);
  const [buscaGeral, setBuscaGeral] = useState("");
  const dropdownRef = useRef(null);

  // Escola ativa para o topo
  const escolaAtual = (escolas || []).find((e) => e.id === (user?.escolaId || selectedEscolaId)) || {
    nome: "Escola Municipal Modelo",
    municipio: "Maceió"
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setModalModulosAberto(false);
  }, [location.pathname]);

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

  // Atalho de teclado Ctrl+K ou Cmd+K para busca
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("sigem-global-search");
        if (searchInput) searchInput.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={styles.app}>
      {/* Backdrop Mobile */}
      <div
        className={`${styles.backdrop} ${isMobileMenuOpen ? styles.backdropOpen : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Compacta Estilo Icon-Dock do Modelo */}
      <nav className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ""}`}>
        {/* Logo Badge do SIGEM no Topo */}
        <div className={styles.logoContainer}>
          <div
            className={styles.logoBadge}
            onClick={() => navigate("/")}
            title="SIGEM — Início"
          >
            <img
              src="/logo.png"
              alt="SIGEM"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: 10,
                display: "block"
              }}
            />
          </div>
        </div>

        {/* Itens Principais do Dock */}
        <div className={styles.navList}>
          {mainNavItems.map((item, index) => {
            if (item.type === "divider") {
              return (
                <div
                  key={`div-${index}`}
                  className={styles.expandBtn}
                  onClick={() => setModalModulosAberto(true)}
                  title="Mais Módulos do Sistema"
                >
                  <i className="ti ti-chevron-right" />
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                }
                title={item.label}
              >
                {({ isActive }) => (
                  <>
                    <i className={`ti ti-${item.icon}`} />
                    <span>{item.label}</span>
                    {isActive && <div className={styles.activeIndicator} />}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Main Area */}
      <div className={styles.main}>
        {/* Topbar Dark Premium */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.menuBtn}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Abrir Menu"
            >
              <i className="ti ti-menu-2" />
            </button>

            {/* Emblema Circular da Escola */}
            <div className={styles.schoolEmblem}>
              <div className={styles.schoolEmblemInner}>
                {escolaAtual?.fotoUrl ? (
                  <img
                    src={escolaAtual.fotoUrl}
                    alt={escolaAtual.nome || "Escola"}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                  />
                ) : (
                  <img
                    src="/logo.png"
                    alt="SIGEM"
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", background: "#ffffff" }}
                  />
                )}
              </div>
            </div>

            {/* Nome da Escola */}
            <h1 className={styles.schoolName}>
              {escolaAtual.nome || "Escola Municipal Modelo"}
            </h1>

            {/* Dropdown Pill de Nível / Escola Ativa */}
            {(escolas || []).length > 1 && user?.role === "Administrador" ? (
              <select
                value={selectedEscolaId}
                onChange={(e) => alterarEscolaAtiva(e.target.value)}
                className={styles.academicPill}
                style={{ outline: "none", cursor: "pointer" }}
              >
                {(escolas || []).map((esc) => (
                  <option key={esc.id} value={esc.id} style={{ background: "#243144", color: "#fff" }}>
                    {esc.nome}
                  </option>
                ))}
              </select>
            ) : (
              <div
                className={styles.academicPill}
                onClick={() => setModalModulosAberto(true)}
              >
                <i className="ti ti-box" style={{ fontSize: "14px", color: "#6366f1" }} />
                <span>Ano Letivo 2026</span>
                <i className="ti ti-chevron-down" style={{ fontSize: "12px" }} />
              </div>
            )}
          </div>

          {/* Barra de Busca Universal Central */}
          <div className={styles.topbarCenter}>
            <div className={styles.searchBar}>
              <i className={`ti ti-search ${styles.searchIcon}`} />
              <input
                id="sigem-global-search"
                type="text"
                className={styles.searchInput}
                placeholder="Pesquisar alunos, turmas, servidores... (Ctrl + K)"
                value={buscaGeral}
                onChange={(e) => setBuscaGeral(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && buscaGeral.trim()) {
                    navigate(`/alunos?busca=${encodeURIComponent(buscaGeral.trim())}`);
                  }
                }}
              />
              <div className={styles.kbdShortcut}>
                <span>Ctrl</span>
                <span>K</span>
              </div>
            </div>
          </div>

          {/* Ações da Direita */}
          <div className={styles.topbarRight}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => navigate("/comunicacao")}
              title="Notificações e Avisos"
            >
              <i className="ti ti-bell" />
            </button>

            <button
              type="button"
              className={styles.iconBtn}
              style={{ color: isDark ? "#eab308" : "#6366f1" }}
              title={isDark ? "Tema Visual: Ativar Tema Claro" : "Tema Visual: Ativar Tema Escuro"}
              onClick={toggleTheme}
              aria-label="Alternar Tema Visual"
            >
              <i className={isDark ? "ti ti-sun" : "ti ti-moon"} />
            </button>

            {/* Perfil do Usuário com Dropdown */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                type="button"
                className={styles.userProfileBtn}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="Perfil do Usuário"
              >
                <div className={styles.userAvatar}>
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"
                  )}
                </div>

                <div className={styles.userInfo}>
                  <span className={styles.userName}>
                    {user?.displayName || "Administrador Geral"}
                  </span>
                  <span className={styles.userEmail}>
                    {user?.email || "admin@semed.gov.br"}
                  </span>
                </div>

                <i className="ti ti-chevron-down" style={{ color: "#94a3b8", fontSize: "14px" }} />
              </button>

              {isDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    width: 250,
                    background: "#1e293b",
                    borderRadius: 14,
                    boxShadow: "0 14px 35px rgba(0, 0, 0, 0.4), 0 0 0 1px #2c3b52",
                    border: "1px solid #2c3b52",
                    overflow: "hidden",
                    zIndex: 100
                  }}
                >
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #2c3b52", background: "#243144" }}>
                    <div style={{ fontWeight: 700, color: "#ffffff", fontSize: 13, marginBottom: 2 }}>
                      {user?.displayName || "Administrador Geral"}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
                      {user?.email || "admin@semed.gov.br"}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: "rgba(99, 102, 241, 0.2)",
                        color: "#818cf8",
                        padding: "2px 8px",
                        borderRadius: 6
                      }}
                    >
                      {user?.role || "Administrador"}
                    </span>
                  </div>

                  <div style={{ padding: 6 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setModalModulosAberto(true);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "9px 12px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "var(--text-secondary, #cbd5e1)",
                        fontSize: 13,
                        borderRadius: 8
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <i className="ti ti-apps" style={{ color: "#6366f1" }} /> Todos os Módulos
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        toggleTheme();
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "9px 12px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "var(--text-secondary, #cbd5e1)",
                        fontSize: 13,
                        borderRadius: 8
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <i className={isDark ? "ti ti-sun" : "ti ti-moon"} style={{ color: isDark ? "#eab308" : "#6366f1" }} />
                      Tema: {isDark ? "Modo Escuro (Mudar p/ Claro)" : "Modo Claro (Mudar p/ Escuro)"}
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "9px 12px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "#f87171",
                        fontWeight: 500,
                        fontSize: 13,
                        borderRadius: 8
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <i className="ti ti-logout" /> Sair do Sistema
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Conteúdo das Páginas */}
        <main className={styles.content}>{children}</main>

        {/* Floating Action Button (FAB) com Gradiente Roxo/Azul do Modelo */}
        <button
          type="button"
          className={styles.fab}
          onClick={() => setModalModulosAberto(true)}
          title="Ações Rápidas & Menu Completo"
        >
          <i className="ti ti-sparkles" />
        </button>
      </div>

      {/* Modal de Todos os Módulos do SIGEM */}
      {modalModulosAberto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
          onClick={() => setModalModulosAberto(false)}
        >
          <div
            style={{
              background: "#131924",
              borderRadius: 20,
              border: "1px solid #1f293b",
              width: "100%",
              maxWidth: 620,
              padding: 26,
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#ffffff",
                  padding: 2,
                  border: "2px solid #6366f1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <img src="/logo.png" alt="SIGEM" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 10 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", margin: 0 }}>
                    Navegação Completa do SIGEM
                  </h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>
                    Acesse qualquer módulo e ferramenta de gestão escolar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalModulosAberto(false)}
                style={{
                  background: "#18202d",
                  border: "1px solid #222d3f",
                  borderRadius: 10,
                  color: "#94a3b8",
                  width: 34,
                  height: 34,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <i className="ti ti-x" />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12,
                maxHeight: 380,
                overflowY: "auto",
                paddingRight: 6
              }}
            >
              {[...mainNavItems.filter((i) => !i.type), ...modulosAdicionais].map((mod) => (
                <div
                  key={mod.to}
                  onClick={() => {
                    navigate(mod.to);
                    setModalModulosAberto(false);
                  }}
                  style={{
                    background: location.pathname === mod.to ? "rgba(99, 102, 241, 0.15)" : "#18202d",
                    border: location.pathname === mod.to ? "1px solid #6366f1" : "1px solid #222d3f",
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    color: location.pathname === mod.to ? "#818cf8" : "#cbd5e1"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.12)";
                    e.currentTarget.style.borderColor = "#6366f1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = location.pathname === mod.to ? "rgba(99, 102, 241, 0.15)" : "#18202d";
                    e.currentTarget.style.borderColor = location.pathname === mod.to ? "#6366f1" : "#222d3f";
                  }}
                >
                  <i className={`ti ti-${mod.icon}`} style={{ fontSize: 18, color: "#818cf8" }} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{mod.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

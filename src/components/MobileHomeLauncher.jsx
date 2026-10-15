import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "./MobileHomeLauncher.module.css";

// ═══════════════════════════════════════════════════════════════
// ATALHOS DO MENU PRINCIPAL DO SIGEM (QUADRADOS · 3 POR LINHA)
// ═══════════════════════════════════════════════════════════════
export const mainShortcuts = [
  {
    to: "/alunos",
    label: "Alunos",
    icon: "school",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    shadow: "rgba(59, 130, 246, 0.35)",
    categoria: "Secretaria"
  },
  {
    to: "/matriculas",
    label: "Matrículas",
    icon: "user-plus",
    gradient: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
    shadow: "rgba(99, 102, 241, 0.35)",
    categoria: "Secretaria"
  },
  {
    to: "/turmas",
    label: "Turmas",
    icon: "chalkboard",
    gradient: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
    shadow: "rgba(16, 185, 129, 0.35)",
    categoria: "Pedagógico"
  },
  {
    to: "/professores",
    label: "Professores",
    icon: "users",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    shadow: "rgba(139, 92, 246, 0.35)",
    categoria: "Pedagógico"
  },
  {
    to: "/frequencia",
    label: "Frequência",
    icon: "calendar-check",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
    shadow: "rgba(245, 158, 11, 0.35)",
    categoria: "Pedagógico"
  },
  {
    to: "/notas",
    label: "Notas",
    icon: "clipboard-check",
    gradient: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
    shadow: "rgba(20, 184, 166, 0.35)",
    categoria: "Pedagógico"
  },
  {
    to: "/boletim",
    label: "Boletim",
    icon: "certificate",
    gradient: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
    shadow: "rgba(244, 63, 94, 0.35)",
    categoria: "Documentos"
  },
  {
    to: "/historico",
    label: "Histórico",
    icon: "file-certificate",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)",
    shadow: "rgba(6, 182, 212, 0.35)",
    categoria: "Documentos"
  },
  {
    to: "/transporte",
    label: "Transporte",
    icon: "bus",
    gradient: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
    shadow: "rgba(249, 115, 22, 0.35)",
    categoria: "Operacional"
  },
  {
    to: "/ocorrencias",
    label: "Ocorrências",
    icon: "clipboard-list",
    gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
    shadow: "rgba(239, 68, 68, 0.35)",
    categoria: "Acompanhamento"
  },
  {
    to: "/alimentacao",
    label: "Alimentação",
    icon: "salad",
    gradient: "linear-gradient(135deg, #84cc16 0%, #4d7c0f 100%)",
    shadow: "rgba(132, 204, 22, 0.35)",
    categoria: "Operacional"
  },
  {
    to: "/educacao-especial",
    label: "Ed. Especial",
    icon: "heart-handshake",
    gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    shadow: "rgba(236, 72, 153, 0.35)",
    categoria: "Pedagógico"
  },
  {
    to: "/comunicacao",
    label: "Comunicação",
    icon: "speakerphone",
    gradient: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
    shadow: "rgba(168, 85, 247, 0.35)",
    categoria: "Gestão"
  },
  {
    to: "/relatorios",
    label: "Relatórios",
    icon: "chart-bar",
    gradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    shadow: "rgba(2, 132, 199, 0.35)",
    categoria: "Gestão"
  },
  {
    to: "/financeiro",
    label: "Financeiro",
    icon: "coin",
    gradient: "linear-gradient(135deg, #eab308 0%, #a16207 100%)",
    shadow: "rgba(234, 179, 8, 0.35)",
    categoria: "Gestão"
  },
  {
    to: "/conteudos",
    label: "Diário / Aulas",
    icon: "notebook",
    gradient: "linear-gradient(135deg, #64748b 0%, #334155 100%)",
    shadow: "rgba(100, 116, 139, 0.35)",
    categoria: "Pedagógico"
  },
  {
    to: "/fechamento",
    label: "Fechamento",
    icon: "lock",
    gradient: "linear-gradient(135deg, #475569 0%, #1e293b 100%)",
    shadow: "rgba(71, 85, 105, 0.35)",
    categoria: "Secretaria"
  },
  {
    to: "/configuracoes",
    label: "Configurações",
    icon: "settings",
    gradient: "linear-gradient(135deg, #71717a 0%, #3f3f46 100%)",
    shadow: "rgba(113, 113, 122, 0.35)",
    categoria: "Sistema"
  }
];

export default function MobileHomeLauncher({ dashboardNode }) {
  const { user, selectedEscolaId, escolas } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("atalhos"); // 'atalhos' | 'indicadores'
  const [searchTerm, setSearchTerm] = useState("");

  const escolaAtual = (escolas || []).find((e) => e.id === (user?.escolaId || selectedEscolaId)) || {
    nome: "Escola Municipal Modelo",
    municipio: "Maceió"
  };

  const filteredShortcuts = mainShortcuts.filter((s) =>
    s.label.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    s.categoria.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className={styles.container}>
      {/* Card de Boas-Vindas e Identificação */}
      <div className={styles.welcomeCard}>
        <div className={styles.headerTop}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} />
              ) : (
                user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"
              )}
            </div>
            <div className={styles.userTexts}>
              <span className={styles.greeting}>
                Olá, {user?.displayName ? user.displayName.split(" ")[0] : "Gestor(a)"} 👋
              </span>
              <span className={styles.subGreeting}>
                {user?.role || "Administrador"}
              </span>
            </div>
          </div>

          <div className={styles.schoolBadge} title={escolaAtual.nome}>
            <i className="ti ti-school" />
            <span>{escolaAtual.nome || "Escola Modelo"}</span>
          </div>
        </div>

        {/* Abas: Atalhos Principais (Padrão) x Indicadores da Rede */}
        <div className={styles.tabSwitch}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "atalhos" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("atalhos")}
          >
            <i className="ti ti-grid-dots" />
            <span>Atalhos do Menu</span>
          </button>

          {dashboardNode && (
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === "indicadores" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("indicadores")}
            >
              <i className="ti ti-chart-bar" />
              <span>Indicadores</span>
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo da Aba 1: Atalhos do Menu Principal (3 por Linha, Quadrados) */}
      {activeTab === "atalhos" && (
        <>
          {/* Barra de Filtro Rápido */}
          <div className={styles.searchBox}>
            <i className="ti ti-search" />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Localizar atalho rápido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchTerm("")}
                aria-label="Limpar busca"
              >
                <i className="ti ti-x" />
              </button>
            )}
          </div>

          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <i className="ti ti-apps" /> Menu Principal
            </span>
            <span className={styles.sectionCount}>
              {filteredShortcuts.length} módulos
            </span>
          </div>

          {/* Grid de Atalhos: 3 por Linha, Quadrados */}
          <div className={styles.shortcutGrid}>
            {filteredShortcuts.map((item) => (
              <button
                key={item.to}
                type="button"
                className={styles.squareButton}
                onClick={() => navigate(item.to)}
                title={item.label}
              >
                <div
                  className={styles.squareIconBox}
                  style={{
                    background: item.gradient,
                    boxShadow: `0 4px 12px ${item.shadow}`
                  }}
                >
                  <i className={`ti ti-${item.icon}`} />
                </div>
                <span className={styles.squareLabel}>{item.label}</span>
              </button>
            ))}

            {filteredShortcuts.length === 0 && (
              <div className={styles.emptyState}>
                <i className="ti ti-search-off" />
                Nenhum módulo encontrado para "{searchTerm}".
              </div>
            )}
          </div>
        </>
      )}

      {/* Conteúdo da Aba 2: Indicadores e Painel */}
      {activeTab === "indicadores" && dashboardNode && (
        <div className={styles.indicatorsWrapper}>
          {dashboardNode}
        </div>
      )}
    </div>
  );
}

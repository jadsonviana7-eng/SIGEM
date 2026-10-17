import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

// Ícones Tabler (gratuitos)
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css";
document.head.appendChild(link);

// Reset global e otimizações para mobile/touch
const style = document.createElement("style");
style.textContent = `
  :root, html.dark {
    --bg-page: #161f2e;
    --bg-sidebar: #192333;
    --bg-card: #1e293b;
    --bg-surface: #243144;
    --bg-surface-hover: #2c3c52;
    --border-color: #2c3b52;
    --border-subtle: #33435c;
    --text-primary: #ffffff;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --text-subtle: #64748b;
    --accent-indigo: #6366f1;
    --accent-purple: #8b5cf6;
    --card-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
    --modal-overlay: rgba(10, 15, 25, 0.75);

    /* Badge tokens em modo escuro */
    --badge-blue-bg: rgba(56, 189, 248, 0.15);
    --badge-blue-text: #38bdf8;
    --badge-blue-border: rgba(56, 189, 248, 0.3);

    --badge-green-bg: rgba(16, 185, 129, 0.15);
    --badge-green-text: #34d399;
    --badge-green-border: rgba(16, 185, 129, 0.3);

    --badge-red-bg: rgba(239, 68, 68, 0.15);
    --badge-red-text: #f87171;
    --badge-red-border: rgba(239, 68, 68, 0.3);

    --badge-amber-bg: rgba(245, 158, 11, 0.15);
    --badge-amber-text: #fbbf24;
    --badge-amber-border: rgba(245, 158, 11, 0.3);

    --badge-purple-bg: rgba(168, 85, 247, 0.15);
    --badge-purple-text: #c084fc;
    --badge-purple-border: rgba(168, 85, 247, 0.3);

    --badge-gray-bg: rgba(148, 163, 184, 0.12);
    --badge-gray-text: #94a3b8;
    --badge-gray-border: rgba(148, 163, 184, 0.25);

    color-scheme: dark;
  }

  html.light {
    --bg-page: #f8fafc;
    --bg-sidebar: #ffffff;
    --bg-card: #ffffff;
    --bg-surface: #f1f5f9;
    --bg-surface-hover: #e2e8f0;
    --border-color: #e2e8f0;
    --border-subtle: #cbd5e1;
    --text-primary: #0f172a;      /* Slate 900: títulos, nomes e cabeçalhos em alto contraste */
    --text-secondary: #334155;    /* Slate 700: texto corrido e dados principais */
    --text-muted: #475569;        /* Slate 600: subtítulos, metadados e badges (contraste > 6:1) */
    --text-subtle: #64748b;       /* Slate 500: ícones e datas secundárias */
    --accent-indigo: #4f46e5;
    --accent-purple: #7c3aed;
    --card-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);
    --modal-overlay: rgba(15, 23, 42, 0.45);

    /* Badge tokens acessíveis em modo claro (WCAG AA) */
    --badge-blue-bg: #e0f2fe;
    --badge-blue-text: #0369a1;
    --badge-blue-border: #bae6fd;

    --badge-green-bg: #dcfce7;
    --badge-green-text: #15803d;
    --badge-green-border: #bbf7d0;

    --badge-red-bg: #fee2e2;
    --badge-red-text: #b91c1c;
    --badge-red-border: #fecaca;

    --badge-amber-bg: #fef3c7;
    --badge-amber-text: #b45309;
    --badge-amber-border: #fde68a;

    --badge-purple-bg: #f3e8ff;
    --badge-purple-text: #6d28d9;
    --badge-purple-border: #e9d5ff;

    --badge-gray-bg: #f1f5f9;
    --badge-gray-text: #334155;
    --badge-gray-border: #cbd5e1;

    color-scheme: light;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }
  html, body {
    width: 100%;
    height: 100%;
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background-color: var(--bg-page);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overscroll-behavior-y: none;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  input, select, textarea, button {
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  input, select, textarea {
    background-color: var(--bg-surface);
    color: var(--text-primary);
    border-color: var(--border-subtle);
  }
  select option {
    background-color: var(--bg-card);
    color: var(--text-primary);
  }
  input::placeholder, textarea::placeholder {
    color: var(--text-muted);
  }
  table {
    color: var(--text-secondary);
  }
  table th {
    color: var(--text-secondary);
  }
  table td {
    border-color: var(--border-color);
  }

  /* Adaptações estruturais para Tema Claro */
  html.light body {
    background-color: #f8fafc;
    color: #0f172a;
  }
  html.light input, html.light select, html.light textarea {
    background-color: #ffffff !important;
    color: #0f172a !important;
    border-color: #cbd5e1 !important;
  }
  html.light select option {
    background-color: #ffffff !important;
    color: #0f172a !important;
  }
  html.light input:focus, html.light select:focus, html.light textarea:focus {
    border-color: #4f46e5 !important;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) !important;
  }
  html.light input:disabled, html.light select:disabled, html.light textarea:disabled {
    background-color: #f1f5f9 !important;
    border-color: #e2e8f0 !important;
    color: #475569 !important;
    cursor: not-allowed;
  }
  html.light table {
    color: #334155;
  }
  html.light table th {
    color: #475569 !important;
    background-color: #f8fafc !important;
    border-bottom: 1px solid #e2e8f0 !important;
    font-weight: 700 !important;
  }
  html.light table td {
    border-color: #e2e8f0 !important;
    color: #1e293b !important;
  }
  html.light table tr:hover td {
    background-color: #f8fafc !important;
  }

  /* ══════════════════════════════════════════════════════════════════ */
  /* ── CORREÇÕES GLOBAIS DE CONTRASTE & CORES NO TEMA CLARO ── */
  /* ══════════════════════════════════════════════════════════════════ */

  /* Containers e Cards Escuros convertidos para fundo claro */
  html.light [style*="background: rgb(22, 31, 46)"],
  html.light [style*="background:#161f2e"],
  html.light [style*="background: #161f2e"],
  html.light [style*="backgroundColor: #161f2e"],
  html.light [style*="backgroundColor:#161f2e"] {
    background-color: #f1f5f9 !important;
    border-color: #e2e8f0 !important;
  }

  html.light [style*="background: rgb(30, 41, 59)"],
  html.light [style*="background:#1e293b"],
  html.light [style*="background: #1e293b"],
  html.light [style*="backgroundColor: #1e293b"],
  html.light [style*="backgroundColor:#1e293b"],
  html.light [style*="background: #131924"],
  html.light [style*="background:#131924"] {
    background-color: #ffffff !important;
    border-color: #e2e8f0 !important;
    color: #0f172a !important;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05) !important;
  }

  html.light [style*="background: rgb(36, 49, 68)"],
  html.light [style*="background:#243144"],
  html.light [style*="background: #243144"],
  html.light [style*="backgroundColor: #243144"],
  html.light [style*="backgroundColor:#243144"],
  html.light [style*="background: #18202d"],
  html.light [style*="background:#18202d"],
  html.light [style*="background: rgb(24, 32, 45)"] {
    background-color: #f8fafc !important;
    border-color: #e2e8f0 !important;
    color: #334155 !important;
  }

  html.light [style*="background: rgb(25, 35, 51)"],
  html.light [style*="background:#192333"],
  html.light [style*="background: #192333"] {
    background-color: #ffffff !important;
    border-color: #e2e8f0 !important;
  }

  /* Bordas Escuras convertidas para neutro suave */
  html.light [style*="border: 1px solid rgb(44, 59, 82)"],
  html.light [style*="border: 1px solid #2c3b52"],
  html.light [style*="border:1px solid #2c3b52"],
  html.light [style*="border: 1.5px solid #2c3b52"],
  html.light [style*="border: 2px solid #2c3b52"],
  html.light [style*="border: 1px solid #33435c"],
  html.light [style*="border:1px solid #33435c"],
  html.light [style*="border-color: #2c3b52"],
  html.light [style*="border-color: #33435c"],
  html.light [style*="borderBottom: 1px solid #2c3b52"],
  html.light [style*="border-bottom: 1px solid #2c3b52"],
  html.light [style*="border-bottom: 1px solid #33435c"],
  html.light [style*="borderTop: 1px solid #2c3b52"],
  html.light [style*="border-top: 1px solid #2c3b52"],
  html.light [style*="border-top: 1px solid #33435c"] {
    border-color: #e2e8f0 !important;
  }

  /* CORREÇÃO CRÍTICA: Textos e fontes brancas sobre fundo claro convertidos para alto contraste */
  html.light h1:not([style*="gradient"]):not([style*="linear-gradient"]),
  html.light h2:not([style*="gradient"]):not([style*="linear-gradient"]),
  html.light h3:not([style*="gradient"]):not([style*="linear-gradient"]),
  html.light h4:not([style*="gradient"]):not([style*="linear-gradient"]),
  html.light h5, html.light h6 {
    color: #0f172a !important;
  }

  /* Textos e fontes brancas ou quase brancas convertidos para alto contraste (Hex e RGB serializado pelo Chrome) */
  html.light span[style*="color: #ffffff"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light span[style*="color:#ffffff"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light span[style*="color: #fff"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light span[style*="color:#fff"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light span[style*="color: rgb(255, 255, 255)"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light span[style*="color:rgb(255, 255, 255)"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light span[style*="color: white"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light span[style*="color: #f8fafc"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light span[style*="color:#f8fafc"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light span[style*="color: rgb(248, 250, 252)"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light span[style*="color:rgb(248, 250, 252)"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light span[style*="color: #f1f5f9"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light span[style*="color: rgb(241, 245, 249)"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light div[style*="color: #ffffff"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light div[style*="color:#ffffff"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light div[style*="color: #fff"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light div[style*="color:#fff"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light div[style*="color: rgb(255, 255, 255)"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light div[style*="color:rgb(255, 255, 255)"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light div[style*="color: white"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light div[style*="color: #f8fafc"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light div[style*="color:#f8fafc"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light div[style*="color: rgb(248, 250, 252)"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light div[style*="color:rgb(248, 250, 252)"]:not([style*="gradient"]):not(.navItemActive *):not(.fab *),
  html.light strong[style*="color: #ffffff"]:not(.navItemActive *):not(.fab *),
  html.light strong[style*="color:#ffffff"]:not(.navItemActive *):not(.fab *),
  html.light strong[style*="color: #fff"]:not(.navItemActive *):not(.fab *),
  html.light strong[style*="color: rgb(255, 255, 255)"]:not(.navItemActive *):not(.fab *),
  html.light strong[style*="color:rgb(255, 255, 255)"]:not(.navItemActive *):not(.fab *),
  html.light strong[style*="color: white"]:not(.navItemActive *):not(.fab *),
  html.light strong[style*="color: #f8fafc"]:not(.navItemActive *):not(.fab *),
  html.light strong[style*="color: rgb(248, 250, 252)"]:not(.navItemActive *):not(.fab *),
  html.light b[style*="color: #ffffff"]:not(.navItemActive *):not(.fab *),
  html.light b[style*="color:#ffffff"]:not(.navItemActive *):not(.fab *),
  html.light b[style*="color: rgb(255, 255, 255)"]:not(.navItemActive *):not(.fab *),
  html.light b[style*="color: #f8fafc"]:not(.navItemActive *):not(.fab *),
  html.light b[style*="color: rgb(248, 250, 252)"]:not(.navItemActive *):not(.fab *),
  html.light p[style*="color: #ffffff"]:not(.navItemActive *):not(.fab *),
  html.light p[style*="color:#ffffff"]:not(.navItemActive *):not(.fab *),
  html.light p[style*="color: rgb(255, 255, 255)"]:not(.navItemActive *):not(.fab *),
  html.light p[style*="color: #f8fafc"]:not(.navItemActive *):not(.fab *),
  html.light p[style*="color: rgb(248, 250, 252)"]:not(.navItemActive *):not(.fab *),
  html.light td[style*="color: #ffffff"],
  html.light td[style*="color:#ffffff"],
  html.light td[style*="color: rgb(255, 255, 255)"],
  html.light td[style*="color: #f8fafc"],
  html.light td[style*="color: rgb(248, 250, 252)"],
  html.light th[style*="color: #ffffff"],
  html.light th[style*="color: rgb(255, 255, 255)"],
  html.light label[style*="color: #ffffff"],
  html.light label[style*="color:#ffffff"],
  html.light label[style*="color: rgb(255, 255, 255)"],
  html.light label[style*="color: #f8fafc"],
  html.light label[style*="color: rgb(248, 250, 252)"],
  html.light a[style*="color: #ffffff"]:not([style*="gradient"]):not([style*="linear-gradient"]):not(.navItemActive *):not(.fab *),
  html.light a[style*="color: rgb(255, 255, 255)"]:not([style*="gradient"]):not([style*="linear-gradient"]):not(.navItemActive *):not(.fab *) {
    color: #0f172a !important;
  }

  /* Textos secundários (slate-300 escuro) convertidos para legibilidade nítida no tema claro */
  html.light [style*="color: #cbd5e1"],
  html.light [style*="color:#cbd5e1"],
  html.light [style*="color: rgb(203, 213, 225)"],
  html.light [style*="color:rgb(203, 213, 225)"] {
    color: #334155 !important;
  }

  /* Textos mutados/subtítulos (slate-400 escuro) com contraste reforçado */
  html.light [style*="color: #94a3b8"],
  html.light [style*="color:#94a3b8"],
  html.light [style*="color: rgb(148, 163, 184)"],
  html.light [style*="color:rgb(148, 163, 184)"] {
    color: #475569 !important;
  }

  html.light [style*="color: #718096"],
  html.light [style*="color:#718096"],
  html.light [style*="color: rgb(113, 128, 150)"] {
    color: #475569 !important;
  }

  /* Cores de Destaque / Badges / Pills: adaptação para contraste rico e legível */
  /* Azul / Céu */
  html.light [style*="color: #38bdf8"],
  html.light [style*="color:#38bdf8"],
  html.light [style*="color: rgb(56, 189, 248)"],
  html.light [style*="color:rgb(56, 189, 248)"],
  html.light [style*="color: #60a5fa"],
  html.light [style*="color:#60a5fa"],
  html.light [style*="color: rgb(96, 165, 250)"],
  html.light [style*="color:rgb(96, 165, 250)"],
  html.light [style*="color: #93c5fd"],
  html.light [style*="color:#93c5fd"],
  html.light [style*="color: rgb(147, 197, 253)"],
  html.light [style*="color:rgb(147, 197, 253)"] {
    color: #0369a1 !important;
  }
  html.light [style*="background: rgba(56, 189, 248"],
  html.light [style*="background:rgba(56, 189, 248"],
  html.light [style*="background: rgba(59, 130, 246"],
  html.light [style*="background:rgba(59, 130, 246"] {
    background-color: #e0f2fe !important;
    border-color: #bae6fd !important;
  }

  /* Verde / Sucesso */
  html.light [style*="color: #34d399"],
  html.light [style*="color:#34d399"],
  html.light [style*="color: rgb(52, 211, 153)"],
  html.light [style*="color:rgb(52, 211, 153)"],
  html.light [style*="color: #4ade80"],
  html.light [style*="color:#4ade80"],
  html.light [style*="color: rgb(74, 222, 128)"],
  html.light [style*="color:rgb(74, 222, 128)"],
  html.light [style*="color: #10b981"],
  html.light [style*="color: rgb(16, 185, 129)"] {
    color: #15803d !important;
  }
  html.light [style*="background: rgba(16, 185, 129"],
  html.light [style*="background:rgba(16, 185, 129"],
  html.light [style*="background: rgba(52, 211, 153"],
  html.light [style*="background:rgba(52, 211, 153"] {
    background-color: #dcfce7 !important;
    border-color: #bbf7d0 !important;
  }

  /* Amarelo / Âmbar */
  html.light [style*="color: #fbbf24"],
  html.light [style*="color:#fbbf24"],
  html.light [style*="color: rgb(251, 191, 36)"],
  html.light [style*="color:rgb(251, 191, 36)"],
  html.light [style*="color: #f59e0b"],
  html.light [style*="color:#f59e0b"],
  html.light [style*="color: rgb(245, 158, 11)"],
  html.light [style*="color:rgb(245, 158, 11)"] {
    color: #b45309 !important;
  }
  html.light [style*="background: rgba(245, 158, 11"],
  html.light [style*="background:rgba(245, 158, 11"],
  html.light [style*="background: rgba(251, 191, 36"],
  html.light [style*="background:rgba(251, 191, 36"] {
    background-color: #fef3c7 !important;
    border-color: #fde68a !important;
  }

  /* Vermelho / Alerta */
  html.light [style*="color: #f87171"],
  html.light [style*="color:#f87171"],
  html.light [style*="color: rgb(248, 113, 113)"],
  html.light [style*="color:rgb(248, 113, 113)"],
  html.light [style*="color: #fca5a5"],
  html.light [style*="color:#fca5a5"],
  html.light [style*="color: rgb(252, 165, 165)"],
  html.light [style*="color:rgb(252, 165, 165)"],
  html.light [style*="color: #ef4444"],
  html.light [style*="color: rgb(239, 68, 68)"] {
    color: #b91c1c !important;
  }
  html.light [style*="background: rgba(239, 68, 68"],
  html.light [style*="background:rgba(239, 68, 68"],
  html.light [style*="background: rgba(248, 113, 113"],
  html.light [style*="background:rgba(248, 113, 113"] {
    background-color: #fee2e2 !important;
    border-color: #fecaca !important;
  }

  /* Roxo / Violeta */
  html.light [style*="color: #c084fc"],
  html.light [style*="color:#c084fc"],
  html.light [style*="color: rgb(192, 132, 252)"],
  html.light [style*="color:rgb(192, 132, 252)"],
  html.light [style*="color: #a855f7"],
  html.light [style*="color:#a855f7"],
  html.light [style*="color: rgb(168, 85, 247)"],
  html.light [style*="color:rgb(168, 85, 247)"] {
    color: #6d28d9 !important;
  }
  html.light [style*="background: rgba(168, 85, 247"],
  html.light [style*="background:rgba(168, 85, 247"],
  html.light [style*="background: rgba(192, 132, 252"],
  html.light [style*="background:rgba(192, 132, 252"] {
    background-color: #f3e8ff !important;
    border-color: #e9d5ff !important;
  }

  /* Índigo */
  html.light [style*="color: #818cf8"],
  html.light [style*="color:#818cf8"],
  html.light [style*="color: rgb(129, 140, 248)"],
  html.light [style*="color:rgb(129, 140, 248)"],
  html.light [style*="color: #a5b4fc"],
  html.light [style*="color:#a5b4fc"],
  html.light [style*="color: rgb(165, 180, 252)"],
  html.light [style*="color:rgb(165, 180, 252)"] {
    color: #4338ca !important;
  }
  html.light [style*="background: rgba(99, 102, 241, 0.15)"],
  html.light [style*="background:rgba(99, 102, 241, 0.15)"],
  html.light [style*="background: rgba(99, 102, 241, 0.12)"],
  html.light [style*="background: rgba(99, 102, 241, 0.2)"] {
    background-color: #e0e7ff !important;
    border-color: #c7d2fe !important;
  }

  /* GARANTIA ABSOLUTA: Botões com Gradiente, Primários, FAB e Itens Ativos SEMPRE conservam texto branco */
  html.light button[style*="linear-gradient"],
  html.light button[style*="linear-gradient"] *,
  html.light button[style*="gradient"],
  html.light button[style*="gradient"] *,
  html.light a[style*="linear-gradient"],
  html.light a[style*="linear-gradient"] *,
  html.light a[style*="gradient"],
  html.light a[style*="gradient"] *,
  html.light label[style*="linear-gradient"],
  html.light label[style*="linear-gradient"] *,
  html.light [style*="background: linear-gradient"],
  html.light [style*="background: linear-gradient"] *,
  html.light [style*="background:linear-gradient"],
  html.light [style*="background:linear-gradient"] *,
  html.light button[style*="background: #6366f1"],
  html.light button[style*="background: #6366f1"] *,
  html.light button[style*="background:#6366f1"],
  html.light button[style*="background:#6366f1"] *,
  html.light button[style*="background: #4f46e5"],
  html.light button[style*="background: #4f46e5"] *,
  html.light button[style*="background:#4f46e5"],
  html.light button[style*="background:#4f46e5"] *,
  html.light .navItemActive,
  html.light .navItemActive *,
  html.light .fab,
  html.light .fab * {
    color: #ffffff !important;
  }

  /* Modais no Tema Claro */
  html.light .ui-modal-overlay {
    background: rgba(15, 23, 42, 0.45) !important;
  }
  html.light .ui-modal-card {
    background: #ffffff !important;
    border-color: #e2e8f0 !important;
    color: #0f172a !important;
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.12) !important;
  }
  html.light .ui-modal-card h2,
  html.light .ui-modal-card h3,
  html.light .ui-modal-card h4 {
    color: #0f172a !important;
  }

  /* ══════════════════════════════════════════════════════════ */
  /* ── OTIMIZAÇÃO GLOBAL MOBILE & TOUCH (TELAS <= 768px) ── */
  /* ══════════════════════════════════════════════════════════ */
  @media (max-width: 768px) {
    /* Touch target confortáveis */
    button, input, select, textarea, a {
      touch-action: manipulation;
    }

    /* Modais Responsivos no Mobile */
    .ui-modal-card {
      width: 100% !important;
      max-width: 96vw !important;
      max-height: 90vh !important;
      padding: 16px 14px !important;
      border-radius: 16px !important;
      margin: 0 auto !important;
    }

    /* Modais com Abas Laterais (ex: Alunos, Escolas): Empilhar em Coluna Única */
    div[style*="display: flex"][style*="minHeight: 460"],
    div[style*="display: flex"][style*="min-height: 460"],
    div[style*="display:flex"][style*="minHeight:460"],
    div[style*="display: flex"][style*="gap: 20"][style*="minHeight: 460"] {
      flex-direction: column !important;
      min-height: auto !important;
      gap: 12px !important;
    }

    /* Coluna lateral de navegação interna vira barra de abas horizontal com swipe */
    div[style*="width: 190"],
    div[style*="width: 190px"],
    div[style*="width:190px"] {
      width: 100% !important;
      flex-direction: row !important;
      overflow-x: auto !important;
      white-space: nowrap !important;
      border-right: none !important;
      border-bottom: 1px solid var(--border-color) !important;
      padding-right: 0 !important;
      padding-bottom: 8px !important;
      scrollbar-width: none !important;
      -webkit-overflow-scrolling: touch !important;
    }
    div[style*="width: 190"] button,
    div[style*="width: 190px"] button,
    div[style*="width:190px"] button {
      flex-shrink: 0 !important;
      white-space: nowrap !important;
    }

    /* Abas Globais e Filtros: Rolagem Horizontal Fluida em Touch */
    .tabs-scroll,
    div[style*="overflow-x: auto"],
    div[style*="overflowX: \"auto\""] {
      display: flex !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
      max-width: 100% !important;
      flex-wrap: nowrap !important;
    }
    .tabs-scroll button,
    div[style*="overflow-x: auto"] button,
    div[style*="overflowX: \"auto\""] button {
      flex-shrink: 0 !important;
      white-space: nowrap !important;
    }
    .tabs-scroll::-webkit-scrollbar,
    div[style*="overflow-x: auto"]::-webkit-scrollbar,
    div[style*="overflowX: \"auto\""]::-webkit-scrollbar {
      display: none !important;
    }

    /* Cards e Indicadores KPI: EXATAMENTE 2 POR LINHA NO MOBILE */
    .sigem-kpi-grid,
    .sigem-indicator-cards,
    div[style*="minmax(240px"],
    div[style*="minmax(220px"],
    div[style*="minmax(210px"],
    div[style*="minmax(200px"],
    div[style*="minmax(180px"],
    div[style*="minmax(160px"],
    div[style*="minmax(150px"],
    div[style*="minmax(140px"] {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
    }

    /* Otimização interna dos cards de indicadores (2 por linha) */
    .sigem-kpi-grid > div,
    .sigem-kpi-grid .ui-card,
    .sigem-indicator-cards > div,
    div[style*="minmax(240px"] > div,
    div[style*="minmax(220px"] > div,
    div[style*="minmax(200px"] > div,
    div[style*="minmax(180px"] > div {
      padding: 10px 10px !important;
      border-radius: 12px !important;
      gap: 6px !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
    }

    /* Títulos dos cards KPI no mobile: reduzido */
    .sigem-kpi-grid span,
    .sigem-kpi-grid div[style*="uppercase"],
    .sigem-kpi-grid div[style*="0.8rem"],
    .sigem-indicator-cards span,
    div[style*="minmax(240px"] > div span,
    div[style*="minmax(220px"] > div span {
      font-size: 10px !important;
      line-height: 1.2 !important;
      letter-spacing: 0.2px !important;
      display: -webkit-box !important;
      -webkit-line-clamp: 2 !important;
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
    }

    /* Números de destaque dos cards KPI: reduzido para 18px */
    .sigem-kpi-grid div[style*="36px"],
    .sigem-kpi-grid div[style*="fontSize: 36px"],
    .sigem-kpi-grid div[style*="26px"],
    .sigem-kpi-grid div[style*="24px"],
    .sigem-kpi-grid div[style*="22px"],
    .sigem-kpi-grid div[style*="1.4rem"],
    .sigem-indicator-cards div[style*="36px"],
    div[style*="minmax(240px"] div[style*="36px"],
    div[style*="minmax(220px"] div[style*="26px"],
    div[style*="minmax(220px"] div[style*="22px"],
    div[style*="minmax(200px"] div[style*="1.4rem"] {
      font-size: 18px !important;
      font-weight: 800 !important;
      line-height: 1.1 !important;
    }

    /* Legendas e subtítulos dos cards KPI: reduzido */
    .sigem-kpi-grid div[style*="trending"],
    .sigem-kpi-grid div[style*="fontSize: \"12px\""],
    .sigem-kpi-grid div[style*="fontSize: 12"],
    .sigem-kpi-grid span[style*="fontSize: 12"],
    .sigem-kpi-grid div[style*="fontSize: 11"] {
      font-size: 9.5px !important;
    }

    /* Ícones dos cards KPI mais compactos */
    .sigem-kpi-grid div[style*="42px"],
    .sigem-kpi-grid div[style*="44px"],
    .sigem-kpi-grid div[style*="48px"],
    .sigem-indicator-cards div[style*="42px"],
    div[style*="minmax(240px"] div[style*="42px"],
    div[style*="minmax(200px"] div[style*="44px"],
    div[style*="minmax(220px"] div[style*="48px"] {
      width: 28px !important;
      height: 28px !important;
      min-width: 28px !important;
      font-size: 13px !important;
      border-radius: 8px !important;
    }

    /* Gráficos e Seções Grandes: 1 coluna no celular */
    div[style*="gridTemplateColumns: \"repeat(auto-fit, minmax(320px, 1fr))\""],
    div[style*="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))"],
    div[style*="gridTemplateColumns: \"repeat(auto-fill, minmax(340px, 1fr))\""],
    div[style*="grid-template-columns: repeat(auto-fill, minmax(340px, 1fr))"],
    div[style*="gridTemplateColumns: \"repeat(auto-fill, minmax(360px, 1fr))\""],
    div[style*="grid-template-columns: repeat(auto-fill, minmax(360px, 1fr))"] {
      grid-template-columns: 1fr !important;
      gap: 14px !important;
    }

    /* Módulos com Barra Lateral (Transporte, Comunicação): Empilhar */
    div[style*="minmax(0, 1fr) 290px"],
    div[style*="minmax(0,1fr) 290px"],
    div[style*="minmax(0, 1fr) 320px"],
    div[style*="320px 1fr"] {
      display: flex !important;
      flex-direction: column !important;
      gap: 16px !important;
    }

    /* Formulários: Quebra de linhas em grids de inputs para evitar campos espremidos */
    div[style*="gridTemplateColumns: \"1fr 1fr\""],
    div[style*="grid-template-columns: 1fr 1fr"],
    div[style*="gridTemplateColumns: \"2fr 1fr\""],
    div[style*="grid-template-columns: 2fr 1fr"],
    div[style*="gridTemplateColumns: \"1.5fr 1fr\""],
    div[style*="grid-template-columns: 1.5fr 1fr"],
    div[style*="gridTemplateColumns: \"1fr 1fr 1fr\""],
    div[style*="grid-template-columns: 1fr 1fr 1fr"],
    div[style*="gridTemplateColumns: \"repeat(4, 1fr)\""],
    div[style*="grid-template-columns: repeat(4, 1fr)"],
    div[style*="gridTemplateColumns: \"repeat(3, 1fr)\""],
    div[style*="grid-template-columns: repeat(3, 1fr)"] {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }

    /* Tabelas no mobile */
    table {
      font-size: 12px !important;
    }
    table th, table td {
      padding: 10px 8px !important;
    }

    /* Grid e Colunas adaptativas para telas mobile */
    div[style*="minmax(0, 1fr) 290px"],
    div[style*="minmax(0, 1fr) 300px"],
    div[style*="minmax(0, 1fr) 280px"],
    div[style*="minmax(0,1fr) 290px"] {
      display: flex !important;
      flex-direction: column-reverse !important;
      gap: 16px !important;
    }

    div[style*="minmax(340px"],
    div[style*="minmax(360px"],
    div[style*="minmax(320px"],
    div[style*="minmax(300px"] {
      grid-template-columns: 1fr !important;
    }

    /* Barras de pesquisa e filtros: expandir 100% da largura */
    div[style*="maxWidth: 340"],
    div[style*="max-width: 340px"],
    div[style*="maxWidth: 440"],
    div[style*="max-width: 440px"] {
      max-width: 100% !important;
      width: 100% !important;
    }

    /* Ações de linha em tabelas */
    td div[style*="display: flex"],
    td div[style*="display:flex"] {
      flex-wrap: wrap !important;
      gap: 4px !important;
    }

    /* Otimização de Listas e Tabelas para Mobile */
    .sigem-desktop-table {
      display: none !important;
    }
    .sigem-mobile-cards {
      display: flex !important;
      flex-direction: column !important;
      gap: 10px !important;
    }

    /* Otimização de Modais e Abas no Mobile */
    .sigem-modal-container {
      flex-direction: column !important;
      gap: 14px !important;
      min-height: auto !important;
    }
    .sigem-modal-tabs {
      width: 100% !important;
      flex-direction: row !important;
      overflow-x: auto !important;
      border-right: none !important;
      border-bottom: 1px solid var(--border-color) !important;
      padding-bottom: 8px !important;
      padding-right: 0 !important;
      flex-wrap: nowrap !important;
      scrollbar-width: none !important;
    }
    .sigem-modal-tabs::-webkit-scrollbar {
      display: none !important;
    }
    .sigem-modal-tab-btn {
      white-space: nowrap !important;
      flex-shrink: 0 !important;
      padding: 8px 12px !important;
      font-size: 12px !important;
    }
    .sigem-form-grid {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }

    /* Modal sizing no mobile */
    .ui-modal-card {
      width: 100% !important;
      max-width: 100% !important;
      max-height: 94vh !important;
      padding: 14px 12px !important;
      border-radius: 14px !important;
    }

    /* Garantir botões e filtros sem estouro no mobile */
    .sigem-header-actions {
      flex-wrap: wrap !important;
      gap: 8px !important;
      width: 100% !important;
    }
  }

  .sigem-desktop-table {
    display: block;
  }
  .sigem-mobile-cards {
    display: none;
  }
  .sigem-modal-container {
    display: flex;
  }
  .sigem-modal-tabs {
    display: flex;
    flex-direction: column;
  }
  .sigem-form-grid {
    display: grid;
  }

  @media (max-width: 480px) {
    h1 {
      font-size: 22px !important;
    }
    h2 {
      font-size: 18px !important;
    }
    h3 {
      font-size: 15px !important;
    }
  }

  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* ══════════════════════════════════════════════════════════════════ */
  /* ── DOCUMENTOS IMPRESSOS, FOLHAS TIMBRADAS & PREVIEW A4 ────────── */
  /* ══════════════════════════════════════════════════════════════════ */
  .documento-impresso,
  .print-target,
  .print-sheet,
  .document-sheet,
  .boletim-container-a4,
  .historico-print-target,
  .print-curriculo,
  .area-holerite-impressao,
  [class*="documentSheet"],
  [class*="paperWrap"] [class*="paper"],
  .declaracao-transferencia-print,
  .comprovante-remanejamento-print,
  .comprovante-matricula-print {
    color: #000000 !important;
    background-color: #ffffff !important;
  }

  /* Forçar que títulos, tabelas, células e parágrafos dentro de folhas impressas fiquem pretos */
  .documento-impresso *:not([style*="color: rgb(30, 58, 138)"]):not([style*="color: #1e3a8a"]):not([style*="color: #16a34a"]):not([style*="color: #ef4444"]):not([style*="color: #2563eb"]):not([style*="color: #dc2626"]),
  .print-target *:not([style*="color: rgb(30, 58, 138)"]):not([style*="color: #1e3a8a"]):not([style*="color: #16a34a"]):not([style*="color: #ef4444"]):not([style*="color: #2563eb"]):not([style*="color: #dc2626"]),
  .boletim-container-a4 *:not([style*="color: rgb(30, 58, 138)"]):not([style*="color: #1e3a8a"]):not([style*="color: #16a34a"]):not([style*="color: #ef4444"]):not([style*="color: #2563eb"]):not([style*="color: #dc2626"]),
  .historico-print-target *:not([style*="color: rgb(30, 58, 138)"]):not([style*="color: #1e3a8a"]):not([style*="color: #16a34a"]):not([style*="color: #ef4444"]):not([style*="color: #2563eb"]):not([style*="color: #dc2626"]),
  .print-curriculo *:not([style*="color: rgb(30, 58, 138)"]):not([style*="color: #1e3a8a"]):not([style*="color: #16a34a"]):not([style*="color: #ef4444"]):not([style*="color: #2563eb"]):not([style*="color: #dc2626"]),
  [class*="documentSheet"] *:not([style*="color: rgb(30, 58, 138)"]):not([style*="color: #1e3a8a"]):not([style*="color: #16a34a"]):not([style*="color: #ef4444"]):not([style*="color: #2563eb"]):not([style*="color: #dc2626"]),
  [class*="paperWrap"] [class*="paper"] *:not([style*="color: rgb(30, 58, 138)"]):not([style*="color: #1e3a8a"]):not([style*="color: #16a34a"]):not([style*="color: #ef4444"]):not([style*="color: #2563eb"]):not([style*="color: #dc2626"]),
  .declaracao-transferencia-print *,
  .comprovante-remanejamento-print *,
  .comprovante-matricula-print * {
    color: #000000;
  }

  .boletim-tabela,
  .historico-tabela,
  .documento-impresso table,
  .print-target table {
    color: #000000 !important;
  }

  .boletim-tabela th,
  .historico-tabela th,
  .documento-impresso table th,
  .print-target table th {
    color: #000000 !important;
    background-color: #f1f5f9 !important;
  }

  .boletim-tabela td,
  .historico-tabela td,
  .documento-impresso table td,
  .print-target table td {
    color: #000000 !important;
  }

  /* ══════════════════════════════════════════════════════════════════ */
  /* ── REGRA GLOBAL DE IMPRESSÃO (@MEDIA PRINT) ───────────────────── */
  /* ══════════════════════════════════════════════════════════════════ */
  @media print {
    *, *::before, *::after {
      text-shadow: none !important;
      box-shadow: none !important;
    }
    html, body {
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #000000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Esconder elementos de navegação e layout padrão ao imprimir */
    .no-print,
    nav,
    aside,
    header.sigem-header,
    .sigem-sidebar,
    .sigem-nav,
    .sigem-header-actions,
    button:not(.btn-permitir-print),
    .ui-modal-overlay > div:has(.print-target) ~ * {
      display: none !important;
    }

    /* Quando um print-target estiver ativo na tela (modal ou página) */
    body:has(.print-target) * {
      visibility: hidden;
    }
    body:has(.print-target) .print-target,
    body:has(.print-target) .print-target * {
      visibility: visible !important;
      color: #000000 !important;
    }
    body:has(.print-target) .print-target {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 15mm 20mm !important;
      background: #ffffff !important;
      box-shadow: none !important;
      border: none !important;
      display: block !important;
    }

    /* Impressão direta de tabelas e textos com contraste total */
    table {
      color: #000000 !important;
    }
    table th, table td {
      color: #000000 !important;
      border-color: #000000 !important;
    }
    h1, h2, h3, h4, h5, h6, p, span, div, strong, b, label {
      color: #000000 !important;
    }
  }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);

// Ativar PWA Service Worker
serviceWorkerRegistration.register();


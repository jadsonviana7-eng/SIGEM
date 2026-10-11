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
    --accent-indigo: #6366f1;
    --accent-purple: #8b5cf6;
    --card-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
    --modal-overlay: rgba(10, 15, 25, 0.75);
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
    --text-primary: #0f172a;
    --text-secondary: #334155;
    --text-muted: #64748b;
    --accent-indigo: #4f46e5;
    --accent-purple: #7c3aed;
    --card-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
    --modal-overlay: rgba(15, 23, 42, 0.45);
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

  /* Adaptações específicas para Tema Claro */
  html.light body {
    background-color: #f8fafc;
    color: #0f172a;
  }
  html.light input, html.light select, html.light textarea {
    background-color: #ffffff;
    color: #0f172a;
    border-color: #cbd5e1;
  }
  html.light select option {
    background-color: #ffffff;
    color: #0f172a;
  }
  html.light table {
    color: #334155;
  }
  html.light table th {
    color: #475569;
    background-color: #f1f5f9;
  }
  html.light table td {
    border-color: #e2e8f0;
  }
  html.light table tr:hover td {
    background-color: #f8fafc;
  }

  /* Previne zoom acidental em inputs no iOS */
  @media (max-width: 768px) {
    input, select, textarea {
      font-size: 16px !important;
    }
  }
  .no-scrollbar::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
  .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
  .modal-scroll::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
  .modal-scroll { -ms-overflow-style: none !important; scrollbar-width: none !important; }

  /* Scrollbars estilizadas sutis */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: var(--bg-page);
  }
  ::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--border-subtle);
  }

  html.light ::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  html.light ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
  }
  html.light ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Regras de transição suave e override de containers escuros quando em Tema Claro */
  html.light [style*="background: rgb(22, 31, 46)"],
  html.light [style*="background:#161f2e"],
  html.light [style*="background: #161f2e"] {
    background-color: #f8fafc !important;
  }

  html.light [style*="background: rgb(30, 41, 59)"],
  html.light [style*="background:#1e293b"],
  html.light [style*="background: #1e293b"] {
    background-color: #ffffff !important;
    border-color: #e2e8f0 !important;
    color: #0f172a !important;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05) !important;
  }

  html.light [style*="background: rgb(36, 49, 68)"],
  html.light [style*="background:#243144"],
  html.light [style*="background: #243144"] {
    background-color: #f1f5f9 !important;
    border-color: #e2e8f0 !important;
    color: #334155 !important;
  }

  html.light [style*="background: rgb(25, 35, 51)"],
  html.light [style*="background:#192333"],
  html.light [style*="background: #192333"],
  html.light [style*="background: rgb(24, 32, 45)"],
  html.light [style*="background:#18202d"],
  html.light [style*="background: #18202d"] {
    background-color: #f8fafc !important;
    border-color: #e2e8f0 !important;
  }

  html.light [style*="border: 1px solid rgb(44, 59, 82)"],
  html.light [style*="border: 1px solid #2c3b52"],
  html.light [style*="border: 1px solid #33435c"],
  html.light [style*="border-color: #2c3b52"],
  html.light [style*="border-color: #33435c"] {
    border-color: #e2e8f0 !important;
  }

  html.light h1:not([style*="color: #6366f1"]):not([style*="color: #818cf8"]),
  html.light h2:not([style*="color: #6366f1"]):not([style*="color: #818cf8"]),
  html.light h3:not([style*="color: #6366f1"]):not([style*="color: #818cf8"]),
  html.light h4:not([style*="color: #6366f1"]):not([style*="color: #818cf8"]) {
    color: #0f172a !important;
  }

  html.light p[style*="color: rgb(148, 163, 184)"],
  html.light p[style*="color: #94a3b8"],
  html.light p[style*="color:#94a3b8"],
  html.light span[style*="color: rgb(148, 163, 184)"],
  html.light span[style*="color: #94a3b8"],
  html.light span[style*="color:#94a3b8"] {
    color: #64748b !important;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);

// Ativar PWA Service Worker
serviceWorkerRegistration.register();


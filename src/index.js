import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Ícones Tabler (gratuitos)
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css";
document.head.appendChild(link);

// Reset global mínimo e ocultação de scrollbars indesejadas
const style = document.createElement("style");
style.textContent = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; }
  .no-scrollbar::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
  .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
  .modal-scroll::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
  .modal-scroll { -ms-overflow-style: none !important; scrollbar-width: none !important; }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);

import { useState } from "react";
import { Btn } from "./ui";

export default function DocumentoViewerModal({ documento, titulo, onClose }) {
  const [zoom, setZoom] = useState(1);

  if (!documento) return null;

  const isPdf = documento.tipo === "application/pdf" || documento.url?.startsWith("data:application/pdf") || documento.nome?.toLowerCase().endsWith(".pdf");
  const isImage = documento.tipo?.startsWith("image/") || documento.url?.startsWith("data:image/") || !isPdf;

  function baixarArquivo() {
    const link = document.createElement("a");
    link.href = documento.url;
    link.download = documento.nome || `${titulo || "documento"}.${isPdf ? "pdf" : "jpg"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function imprimir() {
    const win = window.open(documento.url, "_blank");
    if (win) {
      win.focus();
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
        zIndex: 300,
        padding: "20px 24px",
        boxSizing: "border-box"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#1e293b",
          padding: "12px 20px",
          borderRadius: 12,
          color: "white",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
          marginBottom: 16
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: isPdf ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)",
              color: isPdf ? "#f87171" : "#60a5fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18
            }}
          >
            <i className={`ti ${isPdf ? "ti-file-type-pdf" : "ti-photo"}`} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>
              {titulo || documento.nome || "Visualização de Documento"}
            </h3>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              {documento.nome} {documento.dataEnvio ? `· Enviado em ${new Date(documento.dataEnvio).toLocaleDateString("pt-BR")}` : ""}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isImage && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#334155", padding: "4px 8px", borderRadius: 8, marginRight: 8 }}>
              <button
                type="button"
                onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                style={{ background: "none", border: "none", color: "#e2e8f0", cursor: "pointer", padding: "4px 6px" }}
                title="Diminuir Zoom"
              >
                <i className="ti ti-zoom-out" style={{ fontSize: 16 }} />
              </button>
              <span style={{ fontSize: 12, minWidth: 42, textAlign: "center", color: "#cbd5e1" }}>{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))}
                style={{ background: "none", border: "none", color: "#e2e8f0", cursor: "pointer", padding: "4px 6px" }}
                title="Aumentar Zoom"
              >
                <i className="ti ti-zoom-in" style={{ fontSize: 16 }} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px 6px", fontSize: 11 }}
                title="Redefinir Zoom"
              >
                Reset
              </button>
            </div>
          )}

          <Btn
            variant="default"
            onClick={baixarArquivo}
            style={{ background: "#334155", border: "1px solid #475569", color: "white" }}
          >
            <i className="ti ti-download" /> Baixar
          </Btn>

          <Btn
            variant="default"
            onClick={imprimir}
            style={{ background: "#334155", border: "1px solid #475569", color: "white" }}
          >
            <i className="ti ti-printer" /> Abrir em Nova Aba
          </Btn>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#ef4444",
              border: "none",
              color: "white",
              width: 34,
              height: 34,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              marginLeft: 8,
              transition: "transform 0.1s"
            }}
            title="Fechar Visualizador"
          >
            <i className="ti ti-x" style={{ fontSize: 18 }} />
          </button>
        </div>
      </div>

      {/* Main Preview Body */}
      <div
        style={{
          flex: 1,
          background: "#0f172a",
          borderRadius: 12,
          overflow: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          position: "relative"
        }}
      >
        {isPdf ? (
          <iframe
            src={documento.url}
            title={documento.nome || "Documento PDF"}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              borderRadius: 8,
              background: "white"
            }}
          />
        ) : (
          <div style={{ textAlign: "center", overflow: "auto", maxHeight: "100%", maxWidth: "100%" }}>
            <img
              src={documento.url}
              alt={documento.nome || "Visualização"}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                transition: "transform 0.2s ease-out",
                maxWidth: "100%",
                maxHeight: "80vh",
                borderRadius: 8,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
                objectFit: "contain",
                background: "white"
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

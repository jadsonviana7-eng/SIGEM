import React from "react";

// Componentes reutilizáveis de UI

export function Card({ children, className = "", style }) {
  return (
    <div
      className={className}
      style={{
        background: "white",
        borderRadius: 14,
        padding: 20,
        boxShadow: "0 8px 24px rgba(149, 157, 165, 0.08)",
        ...style
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", style }) {
  return (
    <div className={`mb-4 ${className}`} style={{ ...style }}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", style }) {
  return (
    <h3 className={`text-base font-bold text-gray-800 ${className}`} style={{ margin: 0, ...style }}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = "", style }) {
  return (
    <div className={className} style={{ ...style }}>
      {children}
    </div>
  );
}

export function Badge({ children, color = "blue", variant, className = "" }) {
  const variantMap = {
    primary: "blue",
    success: "green",
    danger: "red",
    warning: "amber",
    secondary: "gray",
    info: "blue"
  };
  const activeColor = variant ? (variantMap[variant] || "blue") : color;

  const colors = {
    blue:  { bg: "#e8f0fe", color: "#1a56db" },
    green: { bg: "#dcfce7", color: "#166534" },
    red:   { bg: "#fee2e2", color: "#991b1b" },
    amber: { bg: "#fef9c3", color: "#854d0e" },
    gray:  { bg: "#f3f4f6", color: "#374151" },
  };
  const c = colors[activeColor] || colors.blue;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
      }}
    >
      {children}
    </span>
  );
}

export function Btn({ children, onClick, variant = "default", type = "button", disabled, style, className = "", size = "md", title }) {
  const variants = {
    default: { background: "white", color: "#374151", border: "1px solid #d1d5db" },
    primary: { background: "#1a56db", color: "white", border: "1px solid #1a56db" },
    danger:  { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" },
    outline: { background: "transparent", color: "#4b5563", border: "1px solid #d1d5db" },
    ghost:   { background: "transparent", color: "#4b5563", border: "none" }
  };
  const v = variants[variant] || variants.default;
  const padding = size === "sm" ? "4px 8px" : "7px 14px";
  const fontSize = size === "sm" ? 12 : 13;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding,
        borderRadius: 6,
        fontSize,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        transition: "all .15s",
        opacity: disabled ? 0.5 : 1,
        ...v,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export const Button = Btn;

export function Table({ children, className = "", style }) {
  return (
    <table className={`w-full text-left border-collapse ${className}`} style={{ width: "100%", ...style }}>
      {children}
    </table>
  );
}

export function Input({ label, icon, className = "", ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</label>}
      <div style={{ position: "relative", width: "100%" }}>
        {icon && (
          <i
            className={icon}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
              fontSize: 14,
            }}
          />
        )}
        <input
          {...props}
          className={className}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 8,
            padding: icon ? "8px 12px 8px 32px" : "8px 12px",
            fontSize: 13,
            fontFamily: "inherit",
            background: "white",
            color: "#111",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            ...props.style,
          }}
        />
      </div>
    </div>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</label>}
      <select
        {...props}
        className={className}
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 13,
          fontFamily: "inherit",
          background: "white",
          color: "#111",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          ...props.style,
        }}
      >
        {children}
      </select>
    </div>
  );
}

export function Modal({
  isOpen,
  title,
  titulo,
  onClose,
  aoFechar,
  fechar,
  onSave,
  aoSalvar,
  salvando,
  children,
  width,
  larguraMax,
  size = "md",
  textSave = "Salvar",
  semRodape,
  esconderRodape
}) {
  const isModalOpen = isOpen !== undefined ? isOpen : true;
  if (!isModalOpen) return null;

  const handleClose = onClose || aoFechar || fechar || (() => {});
  const handleSave = onSave || aoSalvar;

  const sizeWidthMap = {
    sm: 420,
    md: 560,
    lg: 760,
    xl: 960
  };
  const modalWidth = width || larguraMax || (size ? sizeWidthMap[size] || 560 : 560);
  const modalTitle = title || titulo;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && typeof handleClose === "function") {
          handleClose();
        }
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 14,
          padding: "20px 24px",
          width: modalWidth,
          maxWidth: "96vw",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 12px 36px rgba(0,0,0,.2)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1f2937" }}>{modalTitle}</h3>
          <Btn onClick={handleClose} variant="ghost" style={{ padding: "4px 8px" }}>
            <i className="ti ti-x text-lg" aria-hidden="true" />
          </Btn>
        </div>
        <div
          className="no-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            paddingRight: 4,
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}
        >
          {children}
        </div>
        {!semRodape && !esconderRodape && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px solid #f3f4f6", flexShrink: 0, background: "white" }}>
            <Btn onClick={handleClose} variant="outline">Fechar</Btn>
            {handleSave && (
              <Btn variant="primary" onClick={handleSave} disabled={salvando}>
                {salvando ? "Salvando..." : textSave}
              </Btn>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Alert({ children, tipo = "success" }) {
  const cores = {
    success: { bg: "#dcfce7", color: "#166534", border: "#86efac" },
    error:   { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
    info:    { bg: "#e8f0fe", color: "#1a56db", border: "#93c5fd" },
  };
  const c = cores[tipo] || cores.info;
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {children}
    </div>
  );
}

export function Spinner({ size = "md" }) {
  const fontSize = size === "lg" ? 36 : size === "sm" ? 18 : 28;
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
      <i className="ti ti-loader-2" style={{ fontSize, color: "#1a56db", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export const LoadingSpinner = Spinner;

export function EmptyState({ icon = "inbox", texto = "Nenhum item encontrado." }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "#9ca3af" }}>
      <i className={`ti ti-${icon}`} style={{ fontSize: 40, display: "block", marginBottom: 12 }} />
      <p style={{ fontSize: 13 }}>{texto}</p>
    </div>
  );
}

export function ProgressBar({ valor, max = 100 }) {
  const pct = Math.min(Math.round((valor / max) * 100), 100);
  const cor = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ height: 5, background: "#f3f4f6", borderRadius: 4, marginTop: 4 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: cor, borderRadius: 4, transition: "width .3s" }} />
    </div>
  );
}

export function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
      <Btn
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <i className="ti ti-chevron-left" /> Anterior
      </Btn>
      <span style={{ padding: "0 8px", color: "#6b7280", fontWeight: 600 }}>
        Página {currentPage} de {totalPages}
      </span>
      <Btn
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Próxima <i className="ti ti-chevron-right" />
      </Btn>
    </div>
  );
}

export function NotificationModal({ isOpen, onClose, tipo = "sucesso", titulo = "Notificação", mensagem = "" }) {
  if (!isOpen) return null;
  const isSucesso = tipo === "sucesso" || tipo === "success";

  return (
    <Modal isOpen={isOpen} onClose={onClose} width={420} esconderRodape>
      <div style={{ textAlign: "center", padding: "12px 8px" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: isSucesso ? "#dcfce7" : "#fee2e2",
            color: isSucesso ? "#166534" : "#991b1b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            fontSize: 24,
          }}
        >
          <i className={isSucesso ? "ti ti-check" : "ti ti-alert-triangle"} />
        </div>
        <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "#1f2937" }}>
          {titulo}
        </h4>
        <p style={{ fontSize: 13, color: "#4b5563", margin: "0 0 18px", lineHeight: 1.5 }}>
          {mensagem}
        </p>
        <Btn
          variant={isSucesso ? "primary" : "danger"}
          onClick={onClose}
          style={{ width: "100%", justifyContent: "center" }}
        >
          Entendido
        </Btn>
      </div>
    </Modal>
  );
}

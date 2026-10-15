import React from "react";

// Componentes reutilizáveis de UI

export function Card({ children, className = "", style = {} }) {
  const customBg = style?.background || style?.backgroundColor;
  const bg = customBg || "var(--bg-card, #1e293b)";

  const customBorder = style?.border;
  const border = customBorder || "1px solid var(--border-color, #2c3b52)";

  return (
    <div
      className={className}
      style={{
        borderRadius: 16,
        padding: "clamp(12px, 2.5vw, 20px)",
        boxShadow: "var(--card-shadow, 0 6px 20px rgba(0, 0, 0, 0.18))",
        background: bg,
        border: border,
        color: style?.color || "var(--text-primary, #ffffff)",
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
    <h3 className={`text-base font-bold ${className}`} style={{ margin: 0, color: "var(--text-primary, #ffffff)", ...style }}>
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
    info: "blue",
    purple: "purple"
  };
  const activeColor = variant ? (variantMap[variant] || "blue") : color;

  const colors = {
    blue:   { bg: "var(--badge-blue-bg, rgba(56, 189, 248, 0.15))", color: "var(--badge-blue-text, #38bdf8)", border: "1px solid var(--badge-blue-border, rgba(56, 189, 248, 0.3))" },
    green:  { bg: "var(--badge-green-bg, rgba(16, 185, 129, 0.15))", color: "var(--badge-green-text, #34d399)", border: "1px solid var(--badge-green-border, rgba(16, 185, 129, 0.3))" },
    red:    { bg: "var(--badge-red-bg, rgba(239, 68, 68, 0.15))", color: "var(--badge-red-text, #f87171)", border: "1px solid var(--badge-red-border, rgba(239, 68, 68, 0.3))" },
    amber:  { bg: "var(--badge-amber-bg, rgba(245, 158, 11, 0.15))", color: "var(--badge-amber-text, #fbbf24)", border: "1px solid var(--badge-amber-border, rgba(245, 158, 11, 0.3))" },
    purple: { bg: "var(--badge-purple-bg, rgba(168, 85, 247, 0.15))", color: "var(--badge-purple-text, #c084fc)", border: "1px solid var(--badge-purple-border, rgba(168, 85, 247, 0.3))" },
    gray:   { bg: "var(--badge-gray-bg, rgba(148, 163, 184, 0.12))", color: "var(--badge-gray-text, #94a3b8)", border: "1px solid var(--badge-gray-border, rgba(148, 163, 184, 0.25))" },
  };
  const c = colors[activeColor] || colors.blue;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        border: c.border,
      }}
    >
      {children}
    </span>
  );
}

export function Btn({ children, onClick, variant = "default", type = "button", disabled, style, className = "", size = "md", title }) {
  const variants = {
    default: { background: "var(--bg-surface, #243144)", color: "var(--text-secondary, #cbd5e1)", border: "1px solid var(--border-subtle, #33435c)" },
    primary: { background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#ffffff", border: "none", boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)" },
    danger:  { background: "var(--badge-red-bg, rgba(239, 68, 68, 0.15))", color: "var(--badge-red-text, #f87171)", border: "1px solid var(--badge-red-border, rgba(239, 68, 68, 0.35))" },
    outline: { background: "transparent", color: "var(--text-secondary, #cbd5e1)", border: "1px solid var(--border-subtle, #33435c)" },
    ghost:   { background: "transparent", color: "var(--text-muted, #94a3b8)", border: "none" }
  };
  const v = variants[variant] || variants.default;
  const padding = size === "sm" ? "5px 10px" : "8px 16px";
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
        justifyContent: "center",
        gap: 6,
        padding,
        borderRadius: 10,
        fontSize,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        transition: "all .15s ease",
        opacity: disabled ? 0.5 : 1,
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
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
    <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: 14, background: "var(--bg-card, #1e293b)", border: "1px solid var(--border-color, #2c3b52)" }}>
      <table className={`w-full text-left border-collapse ${className}`} style={{ width: "100%", minWidth: "560px", ...style }}>
        {children}
      </table>
    </div>
  );
}

export function Input({ label, icon, className = "", ...props }) {
  const { style = {}, ...restProps } = props;
  const customBg = style?.background || style?.backgroundColor;
  const bg = customBg || "var(--bg-surface, #243144)";

  const customBorder = style?.border;
  const border = customBorder || "1px solid var(--border-subtle, #33435c)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)" }}>{label}</label>}
      <div style={{ position: "relative", width: "100%" }}>
        {icon && (
          <i
            className={icon}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted, #94a3b8)",
              fontSize: 15,
            }}
          />
        )}
        <input
          {...restProps}
          className={className}
          style={{
            borderRadius: 10,
            padding: icon ? "9px 12px 9px 36px" : "9px 12px",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            background: bg,
            border: border,
            color: style?.color || "var(--text-primary, #ffffff)",
            ...style,
          }}
        />
      </div>
    </div>
  );
}

export function Select({ label, children, className = "", ...props }) {
  const { style = {}, ...restProps } = props;
  const customBg = style?.background || style?.backgroundColor;
  const bg = customBg || "var(--bg-surface, #243144)";

  const customBorder = style?.border;
  const border = customBorder || "1px solid var(--border-subtle, #33435c)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)" }}>{label}</label>}
      <select
        {...restProps}
        className={className}
        style={{
          borderRadius: 10,
          padding: "9px 12px",
          fontSize: 13,
          fontFamily: "inherit",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          cursor: "pointer",
          background: bg,
          border: border,
          color: style?.color || "var(--text-primary, #ffffff)",
          ...style,
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
      className="ui-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 15, 25, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: "clamp(8px, 2vw, 16px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && typeof handleClose === "function") {
          handleClose();
        }
      }}
    >
      <div
        className="ui-modal-card"
        style={{
          background: "var(--bg-card, #1e293b)",
          border: "1px solid var(--border-color, #2c3b52)",
          color: "var(--text-primary, #f8fafc)",
          borderRadius: 16,
          padding: "clamp(14px, 3vw, 24px)",
          width: modalWidth,
          maxWidth: "96vw",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--card-shadow, 0 25px 50px -12px rgba(0, 0, 0, 0.5))",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexShrink: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary, #ffffff)" }}>{modalTitle}</h3>
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
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}
        >
          {children}
        </div>
        {!semRodape && !esconderRodape && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border-color, #2c3b52)", flexShrink: 0, background: "var(--bg-card, #1e293b)", flexWrap: "wrap" }}>
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
    success: { bg: "var(--badge-green-bg, rgba(16, 185, 129, 0.15))", color: "var(--badge-green-text, #34d399)", border: "var(--badge-green-border, rgba(16, 185, 129, 0.35))" },
    error:   { bg: "var(--badge-red-bg, rgba(239, 68, 68, 0.15))", color: "var(--badge-red-text, #f87171)", border: "var(--badge-red-border, rgba(239, 68, 68, 0.35))" },
    info:    { bg: "var(--badge-blue-bg, rgba(56, 189, 248, 0.15))", color: "var(--badge-blue-text, #38bdf8)", border: "var(--badge-blue-border, rgba(56, 189, 248, 0.35))" },
  };
  const c = cores[tipo] || cores.info;
  return (
    <div style={{
      padding: "11px 16px", borderRadius: 10, fontSize: 13, marginBottom: 16,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      display: "flex", alignItems: "center", gap: 8
    }}>
      {children}
    </div>
  );
}

export function Spinner({ size = "md" }) {
  const fontSize = size === "lg" ? 36 : size === "sm" ? 18 : 28;
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
      <i className="ti ti-loader-2" style={{ fontSize, color: "#818cf8", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export const LoadingSpinner = Spinner;

export function EmptyState({ icon = "inbox", texto = "Nenhum item encontrado." }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted, #94a3b8)" }}>
      <i className={`ti ti-${icon}`} style={{ fontSize: 40, display: "block", marginBottom: 12 }} />
      <p style={{ fontSize: 13 }}>{texto}</p>
    </div>
  );
}

export function ProgressBar({ valor, max = 100 }) {
  const pct = Math.min(Math.round((valor / max) * 100), 100);
  const cor = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ height: 6, background: "var(--bg-surface-hover, #243144)", borderRadius: 4, marginTop: 4, overflow: "hidden" }}>
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
      <span style={{ padding: "0 8px", color: "var(--text-muted, #94a3b8)", fontWeight: 600 }}>
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
    <Modal isOpen={isOpen} onClose={onClose} width={420} menuLateral={false} esconderRodape>
      <div style={{ textAlign: "center", padding: "12px 8px" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: isSucesso ? "var(--badge-green-bg, rgba(16, 185, 129, 0.15))" : "var(--badge-red-bg, rgba(239, 68, 68, 0.15))",
            border: isSucesso ? "1px solid var(--badge-green-border, rgba(16, 185, 129, 0.3))" : "1px solid var(--badge-red-border, rgba(239, 68, 68, 0.3))",
            color: isSucesso ? "var(--badge-green-text, #34d399)" : "var(--badge-red-text, #f87171)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
            fontSize: 26,
          }}
        >
          <i className={isSucesso ? "ti ti-check" : "ti ti-alert-triangle"} />
        </div>
        <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "var(--text-primary, #ffffff)" }}>
          {titulo}
        </h4>
        <p style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)", margin: "0 0 18px", lineHeight: 1.5 }}>
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

import { Btn, Badge, Spinner } from "../../../components/ui";
import styles from "./AuditoriaFechamento.module.css";

export default function AuditoriaFechamento({
  auditorias = [],
  cAuditoria = false,
  recarregarAuditoria
}) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              <i className="ti ti-shield-check" style={{ color: "#38bdf8" }} />
              Trilha de Auditoria & Segurança de Fechamentos
            </h2>
            <p className={styles.subtitle}>
              Qualquer alteração ou reabertura pós-fechamento fica irrevogavelmente registrada aqui.
            </p>
          </div>

          <Btn variant="default" onClick={() => recarregarAuditoria()} style={{ fontWeight: 600 }}>
            <i className="ti ti-refresh" /> Atualizar Logs
          </Btn>
        </div>

        {cAuditoria ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <Spinner texto="Carregando logs de auditoria..." />
          </div>
        ) : !auditorias.length ? (
          <div
            style={{
              padding: "2.5rem 1.5rem",
              textAlign: "center",
              background: "var(--bg-surface)",
              borderRadius: 12,
              border: "1px dashed #33435c"
            }}
          >
            <i
              className="ti ti-shield-check"
              style={{ fontSize: 44, color: "#34d399", display: "block", marginBottom: 12 }}
            />
            <h3 style={{ margin: "0 0 6px 0", color: "#ffffff", fontSize: 15, fontWeight: 700 }}>
              Nenhuma alteração pós-fechamento registrada
            </h3>
            <p
              style={{
                color: "#94a3b8",
                fontSize: 12.5,
                maxWidth: 450,
                margin: "0 auto",
                lineHeight: 1.5
              }}
            >
              O sistema monitora automaticamente todas as solicitações, validações, homologações e
              reaberturas de diários para conformidade legal e pedagógica.
            </p>
          </div>
        ) : (
          <div className={styles.logList}>
            {auditorias.map((log) => {
              const isReabertura = log.tipo === "REABERTURA_AUDITORIA";
              const isValidado = log.tipo === "FECHAMENTO_VALIDADO";
              const isDevolucao = log.tipo === "DEVOLUCAO";

              return (
                <div
                  key={log.id}
                  className={styles.logCard}
                  style={{
                    borderColor: isReabertura
                      ? "rgba(249, 115, 22, 0.4)"
                      : isValidado
                      ? "rgba(34, 197, 94, 0.4)"
                      : isDevolucao
                      ? "rgba(239, 68, 68, 0.4)"
                      : "#33435c"
                  }}
                >
                  <div className={styles.logTop}>
                    <div className={styles.logTopLeft}>
                      <span style={{ fontSize: 18 }}>
                        {isReabertura ? "⚠️" : isValidado ? "🔒" : isDevolucao ? "↩️" : "📝"}
                      </span>
                      <span className={styles.logAcao}>{log.acao}</span>
                      <Badge
                        color={
                          isReabertura
                            ? "yellow"
                            : isValidado
                            ? "green"
                            : isDevolucao
                            ? "red"
                            : "blue"
                        }
                      >
                        {log.turma} · {log.bimestre}
                      </Badge>
                    </div>

                    <div className={styles.logTime}>
                      <i className="ti ti-clock" />
                      {new Date(log.dataHora || log.criadoEm).toLocaleString("pt-BR")}
                    </div>
                  </div>

                  <div className={styles.logDetails}>{log.detalhes}</div>

                  <div className={styles.logFooter}>
                    <span>
                      <strong style={{ color: "#cbd5e1" }}>Responsável:</strong> {log.usuarioNome} (
                      {log.usuarioCargo || "Docente/Coordenação"})
                    </span>
                    <span>
                      <strong style={{ color: "#cbd5e1" }}>Registro:</strong>{" "}
                      {log.usuarioEmail || "Sistema SIGEM"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

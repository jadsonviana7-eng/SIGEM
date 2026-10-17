import { useMemo } from "react";
import styles from "./DashboardComunicacao.module.css";

export default function DashboardComunicacao({
  avisos = [],
  reunioes = [],
  eventos = [],
  mensagens = [],
  onNavigateTab
}) {
  const stats = useMemo(() => {
    const totalAvisos = avisos.length;
    const avisosUrgentes = avisos.filter(a => a.prioridade === "Urgente" || a.prioridade === "Importante").length;
    const totalReunioes = reunioes.length;
    const reunioesAgendadas = reunioes.filter(r => r.status === "Agendada").length;
    const totalEventos = eventos.length;
    const totalMensagens = mensagens.length;
    const alertasFrequencia = mensagens.filter(m => m.tipo === "Alerta de Frequência").length;
    const notificacoesBoletim = mensagens.filter(m => m.tipo === "Boletim Disponível").length;

    let totalConfirmados = 0;
    let totalConvidados = 0;
    reunioes.forEach(r => {
      totalConfirmados += (r.confirmados || []).length;
      totalConvidados += (r.totalConvidados || 30);
    });
    const taxaConfirmacao = totalConvidados > 0 ? Math.round((totalConfirmados / totalConvidados) * 100) : 0;

    return {
      totalAvisos,
      avisosUrgentes,
      totalReunioes,
      reunioesAgendadas,
      totalEventos,
      totalMensagens,
      alertasFrequencia,
      notificacoesBoletim,
      taxaConfirmacao
    };
  }, [avisos, reunioes, eventos, mensagens]);

  return (
    <div className={styles.container}>
      {/* BANNER DE BOAS-VINDAS / IDENTIDADE */}
      <div className={styles.banner}>
        <div style={{ maxWidth: 580 }}>
          <span className={styles.bannerTag}>
            CANAL DIRETO ESCOLA ↔ FAMÍLIA
          </span>
          <h2 className={styles.bannerTitle}>
            Central de Comunicação & Engajamento Familiar
          </h2>
          <p className={styles.bannerSubtitle}>
            Envio ágil de comunicados oficiais, convocações de reuniões de pais, avisos de boletim digital liberado e alertas preventivos de frequência escolar.
          </p>
        </div>

        <div className={styles.bannerActions}>
          <button
            type="button"
            className={styles.bannerBtnPrimary}
            onClick={() => onNavigateTab("avisos")}
          >
            <i className="ti ti-plus" /> Novo Comunicado
          </button>
          <button
            type="button"
            className={styles.bannerBtnSecondary}
            onClick={() => onNavigateTab("notificacoes")}
          >
            <i className="ti ti-bell-ringing" /> Disparar Notificações
          </button>
        </div>
      </div>

      {/* CARDS DE INDICADORES / METRICAS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8" }}>
            <i className="ti ti-speakerphone" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalAvisos}</span>
            <span className={styles.statLabel}>Avisos & Circulares</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
            <i className="ti ti-users-group" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.reunioesAgendadas}</span>
            <span className={styles.statLabel}>Reuniões de Pais</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <i className="ti ti-certificate" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.notificacoesBoletim}</span>
            <span className={styles.statLabel}>Boletins Liberados</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <i className="ti ti-alert-triangle" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.alertasFrequencia}</span>
            <span className={styles.statLabel}>Alertas de Frequência</span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2 COLUNAS: COMUNICADOS RECENTES & PRÓXIMAS REUNIÕES/EVENTOS */}
      <div className={styles.splitGrid}>
        {/* Comunicados Recentes */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionCardHeader}>
            <h3 className={styles.sectionCardTitle}>
              <i className="ti ti-news" style={{ color: "#38bdf8" }} /> Comunicados Recentes
            </h3>
            <button
              type="button"
              className={styles.btnLink}
              onClick={() => onNavigateTab("avisos")}
            >
              Ver todos →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {avisos.slice(0, 3).map((av) => (
              <div key={av.id} className={styles.feedItem}>
                <div className={styles.feedItemTop}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8" }}>
                    {av.categoria || "Geral"}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 8,
                    background: av.prioridade === "Urgente" ? "rgba(239, 68, 68, 0.2)" : "rgba(2, 132, 199, 0.2)",
                    color: av.prioridade === "Urgente" ? "#f87171" : "#38bdf8"
                  }}>
                    {av.prioridade}
                  </span>
                </div>
                <div className={styles.feedItemTitle}>
                  {av.titulo}
                </div>
                <div className={styles.feedItemDesc}>
                  {av.conteudo}
                </div>
              </div>
            ))}
            {avisos.length === 0 && (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 20 }}>
                Nenhum comunicado recente.
              </div>
            )}
          </div>
        </div>

        {/* Próximas Reuniões e Eventos */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionCardHeader}>
            <h3 className={styles.sectionCardTitle}>
              <i className="ti ti-calendar" style={{ color: "#a78bfa" }} /> Próximos Encontros & Reuniões
            </h3>
            <button
              type="button"
              className={styles.btnLink}
              onClick={() => onNavigateTab("reunioes")}
            >
              Ver agenda →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reunioes.slice(0, 3).map((r) => (
              <div key={r.id} className={styles.feedItem}>
                <div className={styles.feedItemTop}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>
                    📅 {r.dataReuniao ? new Date(r.dataReuniao + "T00:00:00").toLocaleDateString("pt-BR") : ""} ({r.horarioInicio})
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#34d399" }}>
                    {(r.confirmados || []).length} confirmados
                  </span>
                </div>
                <div className={styles.feedItemTitle}>
                  {r.titulo}
                </div>
                <div className={styles.feedItemDesc}>
                  📍 {r.local} · Público: {r.turmaAlvo}
                </div>
              </div>
            ))}
            {reunioes.length === 0 && (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 20 }}>
                Nenhuma reunião agendada no momento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

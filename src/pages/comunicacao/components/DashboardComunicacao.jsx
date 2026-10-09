import { useMemo } from "react";
import { Card, Badge, Btn } from "../../../components/ui";

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

    // Cálculo de confirmações de reuniões
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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* BANNER DE BOAS-VINDAS / IDENTIDADE */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
        color: "white",
        borderRadius: 16,
        padding: "24px 28px",
        boxShadow: "0 8px 24px rgba(37, 99, 235, 0.2)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div style={{ maxWidth: 580 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              background: "rgba(255,255,255,0.2)",
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5
            }}>
              CANAL DIRETO ESCOLA ↔ FAMÍLIA
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px 0" }}>
            Central de Comunicação & Engajamento Familiar
          </h2>
          <p style={{ fontSize: 13, color: "#dbeafe", margin: 0, lineHeight: 1.5 }}>
            Envio ágil de comunicados oficiais, convocações de reuniões de pais, avisos de boletim digital liberado e alertas preventivos de frequência escolar.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onNavigateTab("avisos")}
            style={{
              background: "white",
              color: "#1e3a8a",
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <i className="ti ti-plus" /> Novo Comunicado
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("notificacoes")}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <i className="ti ti-bell-ringing" /> Disparar Notificações
          </button>
        </div>
      </div>

      {/* CARDS DE INDICADORES / METRICAS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: 16
      }}>
        <Card style={{ padding: 18, borderLeft: "4px solid #3b82f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Avisos & Circulares
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                {stats.totalAvisos}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              <i className="ti ti-speakerphone" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: stats.avisosUrgentes > 0 ? "#dc2626" : "#64748b", marginTop: 8, fontWeight: 600 }}>
            {stats.avisosUrgentes > 0 ? `🚨 ${stats.avisosUrgentes} aviso(s) prioritário(s)` : "Todos informativos"}
          </div>
        </Card>

        <Card style={{ padding: 18, borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Reuniões de Pais
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                {stats.reunioesAgendadas}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f5f3ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              <i className="ti ti-users-group" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
            Taxa média de confirmação: <strong>{stats.taxaConfirmacao}%</strong>
          </div>
        </Card>

        <Card style={{ padding: 18, borderLeft: "4px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Boletins Liberados
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                {stats.notificacoesBoletim}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              <i className="ti ti-certificate" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#059669", marginTop: 8, fontWeight: 600 }}>
            Disparos automáticos com link digital
          </div>
        </Card>

        <Card style={{ padding: 18, borderLeft: "4px solid #f59e0b" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Alertas de Frequência
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                {stats.alertasFrequencia}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fffbeb", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              <i className="ti ti-alert-triangle" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#d97706", marginTop: 8, fontWeight: 600 }}>
            Notificações de faltas enviadas aos pais
          </div>
        </Card>
      </div>

      {/* SEÇÃO 2 COLUNAS: COMUNICADOS RECENTES & PRÓXIMAS REUNIÕES/EVENTOS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Comunicados Recentes */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-news" style={{ color: "#2563eb" }} /> Comunicados Recentes
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("avisos")}
              style={{ background: "none", border: "none", color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Ver todos →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {avisos.slice(0, 3).map((av) => (
              <div
                key={av.id}
                style={{
                  background: "#f8fafc",
                  borderRadius: 10,
                  padding: 12,
                  border: "1px solid #e2e8f0"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb" }}>
                    {av.categoria || "Geral"}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 8,
                    background: av.prioridade === "Urgente" ? "#fee2e2" : av.prioridade === "Importante" ? "#fef3c7" : "#e2e8f0",
                    color: av.prioridade === "Urgente" ? "#991b1b" : av.prioridade === "Importante" ? "#92400e" : "#475569"
                  }}>
                    {av.prioridade}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                  {av.titulo}
                </div>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineClamp: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {av.conteudo}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
                  <span>Público: {av.publicoAlvo} {av.turmaAlvo ? `(${av.turmaAlvo})` : ""}</span>
                  <span>{av.dataPublicacao ? new Date(av.dataPublicacao).toLocaleDateString("pt-BR") : ""}</span>
                </div>
              </div>
            ))}
            {avisos.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                Nenhum comunicado publicado no momento.
              </div>
            )}
          </div>
        </Card>

        {/* Próximas Reuniões e Eventos */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-calendar-event" style={{ color: "#8b5cf6" }} /> Próximas Reuniões & Eventos
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("reunioes")}
              style={{ background: "none", border: "none", color: "#8b5cf6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Agenda Completa →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reunioes.slice(0, 2).map((r) => (
              <div
                key={r.id}
                style={{
                  background: "#faf5ff",
                  borderRadius: 10,
                  padding: 12,
                  border: "1px solid #e9d5ff"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>
                    👥 REUNIÃO DE PAIS
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#d1fae5", padding: "1px 6px", borderRadius: 8 }}>
                    {(r.confirmados || []).length} confirmados
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>
                  {r.titulo}
                </div>
                <div style={{ fontSize: 12, color: "#6b21a8" }}>
                  📅 {r.dataReuniao ? new Date(r.dataReuniao).toLocaleDateString("pt-BR") : ""} às {r.horarioInicio} · 📍 {r.local}
                </div>
              </div>
            ))}

            {eventos.slice(0, 2).map((ev) => (
              <div
                key={ev.id}
                style={{
                  background: "#f0fdf4",
                  borderRadius: 10,
                  padding: 12,
                  border: "1px solid #bbf7d0"
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", marginBottom: 2 }}>
                  🎉 EVENTO ESCOLAR
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#14532d" }}>
                  {ev.titulo}
                </div>
                <div style={{ fontSize: 12, color: "#15803d" }}>
                  📅 {ev.dataEvento ? new Date(ev.dataEvento).toLocaleDateString("pt-BR") : ""} · {ev.horario}
                </div>
              </div>
            ))}

            {reunioes.length === 0 && eventos.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                Nenhum evento ou reunião agendada.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* CANAIS DE TRANSMISSÃO INTEGRADOS */}
      <Card style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-broadcast" style={{ color: "#10b981" }} /> Canais de Transmissão Ativos
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#25d366", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                <i className="ti ti-brand-whatsapp" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>WhatsApp Direto</div>
                <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Disparo Rápido com 1-Clique</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              Gera mensagens personalizadas prontas para envio com link individual para cada família.
            </p>
          </div>

          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#3b82f6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                <i className="ti ti-device-mobile" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Mural Digital da Família</div>
                <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>Portal Web sem Necessidade de App</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              Os pais consultam circulares, notas, frequência e convocações via web em qualquer smartphone.
            </p>
          </div>

          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#8b5cf6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                <i className="ti ti-mail" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>E-mail & SMS Escolar</div>
                <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600 }}>Notificações Oficiais</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              Registro formal de convocações pedagógicas e atas de reuniões do conselho de classe.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

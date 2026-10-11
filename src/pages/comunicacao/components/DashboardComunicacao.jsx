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
        <Card style={{ padding: 18, borderLeft: "4px solid #3b82f6", background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                Avisos & Circulares
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", marginTop: 4 }}>
                {stats.totalAvisos}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#243144", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              <i className="ti ti-speakerphone" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: stats.avisosUrgentes > 0 ? "#f87171" : "#94a3b8", marginTop: 8, fontWeight: 600 }}>
            {stats.avisosUrgentes > 0 ? `🚨 ${stats.avisosUrgentes} aviso(s) prioritário(s)` : "Todos informativos"}
          </div>
        </Card>

        <Card style={{ padding: 18, borderLeft: "4px solid #8b5cf6", background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                Reuniões de Pais
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", marginTop: 4 }}>
                {stats.reunioesAgendadas}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#243144", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              <i className="ti ti-users-group" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
            Taxa média de confirmação: <strong style={{ color: "#ffffff" }}>{stats.taxaConfirmacao}%</strong>
          </div>
        </Card>

        <Card style={{ padding: 18, borderLeft: "4px solid #10b981", background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                Boletins Liberados
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", marginTop: 4 }}>
                {stats.notificacoesBoletim}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#243144", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              <i className="ti ti-certificate" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#34d399", marginTop: 8, fontWeight: 600 }}>
            Disparos automáticos com link digital
          </div>
        </Card>

        <Card style={{ padding: 18, borderLeft: "4px solid #f59e0b", background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                Alertas de Frequência
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", marginTop: 4 }}>
                {stats.alertasFrequencia}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#243144", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              <i className="ti ti-alert-triangle" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 8, fontWeight: 600 }}>
            Notificações de faltas enviadas aos pais
          </div>
        </Card>
      </div>

      {/* SEÇÃO 2 COLUNAS: COMUNICADOS RECENTES & PRÓXIMAS REUNIÕES/EVENTOS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Comunicados Recentes */}
        <Card style={{ padding: 20, background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-news" style={{ color: "#60a5fa" }} /> Comunicados Recentes
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("avisos")}
              style={{ background: "none", border: "none", color: "#60a5fa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Ver todos →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {avisos.slice(0, 3).map((av) => (
              <div
                key={av.id}
                style={{
                  background: "#243144",
                  borderRadius: 10,
                  padding: 12,
                  border: "1px solid #2c3b52"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa" }}>
                    {av.categoria || "Geral"}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 8,
                    background: av.prioridade === "Urgente" ? "rgba(239, 68, 68, 0.2)" : av.prioridade === "Importante" ? "rgba(245, 158, 11, 0.2)" : "#33415c",
                    color: av.prioridade === "Urgente" ? "#f87171" : av.prioridade === "Importante" ? "#fbbf24" : "#cbd5e1"
                  }}>
                    {av.prioridade}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", marginBottom: 4 }}>
                  {av.titulo}
                </div>
                <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0, lineClamp: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {av.conteudo}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
                  <span>Público: {av.publicoAlvo} {av.turmaAlvo ? `(${av.turmaAlvo})` : ""}</span>
                  <span>{av.dataPublicacao ? new Date(av.dataPublicacao).toLocaleDateString("pt-BR") : ""}</span>
                </div>
              </div>
            ))}
            {avisos.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                Nenhum comunicado publicado no momento.
              </div>
            )}
          </div>
        </Card>

        {/* Próximas Reuniões e Eventos */}
        <Card style={{ padding: 20, background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-calendar-event" style={{ color: "#a78bfa" }} /> Próximas Reuniões & Eventos
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("reunioes")}
              style={{ background: "none", border: "none", color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Agenda Completa →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reunioes.slice(0, 2).map((r) => (
              <div
                key={r.id}
                style={{
                  background: "rgba(139, 92, 246, 0.12)",
                  borderRadius: 10,
                  padding: 12,
                  border: "1px solid rgba(139, 92, 246, 0.25)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>
                    👥 REUNIÃO DE PAIS
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#34d399", background: "rgba(16, 185, 129, 0.15)", padding: "1px 6px", borderRadius: 8 }}>
                    {(r.confirmados || []).length} confirmados
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", marginBottom: 2 }}>
                  {r.titulo}
                </div>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                  📅 {r.dataReuniao ? new Date(r.dataReuniao).toLocaleDateString("pt-BR") : ""} às {r.horarioInicio} · 📍 {r.local}
                </div>
              </div>
            ))}

            {eventos.slice(0, 2).map((ev) => (
              <div
                key={ev.id}
                style={{
                  background: "rgba(16, 185, 129, 0.12)",
                  borderRadius: 10,
                  padding: 12,
                  border: "1px solid rgba(16, 185, 129, 0.25)"
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#34d399", marginBottom: 2 }}>
                  🎉 EVENTO ESCOLAR
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                  {ev.titulo}
                </div>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                  📅 {ev.dataEvento ? new Date(ev.dataEvento).toLocaleDateString("pt-BR") : ""} · {ev.horario}
                </div>
              </div>
            ))}

            {reunioes.length === 0 && eventos.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                Nenhum evento ou reunião agendada.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* CANAIS DE TRANSMISSÃO INTEGRADOS */}
      <Card style={{ padding: 20, background: "#1e293b", borderColor: "#2c3b52" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-broadcast" style={{ color: "#34d399" }} /> Canais de Transmissão Ativos
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <div style={{ background: "#243144", padding: 14, borderRadius: 10, border: "1px solid #2c3b52" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#25d366", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                <i className="ti ti-brand-whatsapp" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>WhatsApp Direto</div>
                <div style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>Disparo Rápido com 1-Clique</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
              Gera mensagens personalizadas prontas para envio com link individual para cada família.
            </p>
          </div>

          <div style={{ background: "#243144", padding: 14, borderRadius: 10, border: "1px solid #2c3b52" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#3b82f6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                <i className="ti ti-device-mobile" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>Mural Digital da Família</div>
                <div style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600 }}>Portal Web sem Necessidade de App</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
              Os pais consultam circulares, notas, frequência e convocações via web em qualquer smartphone.
            </p>
          </div>

          <div style={{ background: "#243144", padding: 14, borderRadius: 10, border: "1px solid #2c3b52" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#8b5cf6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                <i className="ti ti-mail" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>E-mail & SMS Escolar</div>
                <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600 }}>Notificações Oficiais</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
              Registro formal de convocações pedagógicas e atas de reuniões do conselho de classe.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

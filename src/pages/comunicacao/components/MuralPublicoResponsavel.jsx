import React, { useState } from "react";
import { Card, Btn, Badge, Input, Select, Alert, EmptyState } from "../../../components/ui";
import { updateAviso, updateReuniao } from "../../../services/comunicacaoService";

export default function MuralPublicoResponsavel({
  avisos = [],
  reunioes = [],
  eventos = [],
  alunos = [],
  selectedEscola,
  onRefresh
}) {
  const [alunoFiltro, setAlunoFiltro] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [feedTipo, setFeedTipo] = useState("TODOS"); // TODOS | AVISOS | REUNIOES | EVENTOS
  const [sucessoMsg, setSucessoMsg] = useState(null);

  const formatarDataBR = (dt) => {
    if (!dt) return "—";
    const [y, m, d] = dt.split("-");
    return `${d}/${m}/${y}`;
  };

  const handleConfirmarLeituraAviso = async (aviso) => {
    const nomeResp = responsavelNome.trim() || prompt("Por favor, digite seu nome completo para confirmar leitura:") || "";
    if (!nomeResp) return;

    try {
      const confirmacoesAtuais = aviso.confirmacoesLeitura || [];
      const jaConfirmou = confirmacoesAtuais.some((c) => (c.responsavelNome || "").toLowerCase() === nomeResp.toLowerCase());

      if (jaConfirmou) {
        alert("Você já confirmou a leitura deste comunicado anteriormente. Obrigado!");
        return;
      }

      const novaLista = [
        ...confirmacoesAtuais,
        {
          responsavelNome: nomeResp,
          data: new Date().toISOString()
        }
      ];

      await updateAviso(aviso.id, { confirmacoesLeitura: novaLista });
      setSucessoMsg(`Leitura do aviso "${aviso.titulo}" confirmada com sucesso por ${nomeResp}!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao confirmar leitura: " + err.message);
    }
  };

  const handleConfirmarPresencaReuniao = async (reuniao, statusPresenca) => {
    const nomeResp = responsavelNome.trim() || prompt("Por favor, digite seu nome completo:") || "";
    if (!nomeResp) return;

    try {
      let confirmados = (reuniao.confirmados || []).filter((c) => (c.responsavelNome || "").toLowerCase() !== nomeResp.toLowerCase());
      let justificados = (reuniao.justificados || []).filter((j) => (j.responsavelNome || "").toLowerCase() !== nomeResp.toLowerCase());

      if (statusPresenca === "CONFIRMADO") {
        confirmados.push({
          responsavelNome: nomeResp,
          data: new Date().toISOString()
        });
        setSucessoMsg(`Presença CONFIRMADA na reunião de ${formatarDataBR(reuniao.dataReuniao)}!`);
      } else {
        const motivo = prompt("Motivo da ausência (opcional):") || "Compromisso pessoal";
        justificados.push({
          responsavelNome: nomeResp,
          motivo,
          data: new Date().toISOString()
        });
        setSucessoMsg(`Ausência JUSTIFICADA para a reunião de ${formatarDataBR(reuniao.dataReuniao)}.`);
      }

      await updateReuniao(reuniao.id, { confirmados, justificados });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Mural */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          padding: "24px 28px",
          borderRadius: "16px",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.4)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>📱</span>
            <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>
              Mural Digital do Responsável & Família
            </h2>
          </div>
          <p style={{ margin: 0, opacity: 0.85, fontSize: "14px", maxWidth: "620px" }}>
            Visão pública e transparente de todos os comunicados escolares, convocações de reuniões,
            calendário de eventos e confirmação de leitura online.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Badge variant="blue" style={{ fontSize: "13px", padding: "8px 14px", background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>
            🏫 {selectedEscola?.nome || "Escola Municipal"}
          </Badge>
        </div>
      </div>

      {sucessoMsg && (
        <Alert type="success" onClose={() => setSucessoMsg(null)}>
          {sucessoMsg}
        </Alert>
      )}

      {/* Barra de Identificação do Responsável para Confirmações */}
      <Card style={{ padding: "18px 22px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "16px", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
              👤 Seu Nome (Pai/Mãe/Responsável)
            </label>
            <Input
              placeholder="Ex: Maria das Dores Silva"
              value={responsavelNome}
              onChange={(e) => setResponsavelNome(e.target.value)}
              prefixIcon="ti ti-user"
            />
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
              Filtrar Tipo de Conteúdo
            </label>
            <Select
              value={feedTipo}
              onChange={(e) => setFeedTipo(e.target.value)}
              options={[
                { value: "TODOS", label: "Tudo (Avisos, Reuniões e Eventos)" },
                { value: "AVISOS", label: "Somente Avisos & Comunicados" },
                { value: "REUNIOES", label: "Somente Reuniões de Pais" },
                { value: "EVENTOS", label: "Somente Eventos & Festas" }
              ]}
            />
          </div>

          <div>
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
              🔗 Link público para as famílias:
            </div>
            <Btn
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Link do mural copiado para a área de transferência!");
              }}
              style={{ width: "100%", height: "38px" }}
            >
              <i className="ti ti-copy" style={{ marginRight: "6px" }}></i> Copiar Link do Portal
            </Btn>
          </div>
        </div>
      </Card>

      {/* Feed Unificado */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* 1. SEÇÃO DE REUNIÕES */}
        {(feedTipo === "TODOS" || feedTipo === "REUNIOES") && reunioes.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1e293b", margin: "10px 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="ti ti-users" style={{ color: "#7c3aed" }}></i> Próximas Reuniões de Pais & Mestres
            </h3>

            {reunioes.slice(0, 3).map((r) => {
              const confirmadosCount = (r.confirmados || []).length;
              return (
                <Card
                  key={r.id}
                  style={{
                    padding: "20px",
                    borderLeft: "5px solid #7c3aed",
                    borderRadius: "12px",
                    background: "#fff"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                    <div>
                      <Badge variant="purple">{r.tipo || "Reunião Pedagógica"}</Badge>
                      <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: "6px 0 4px 0" }}>
                        {r.titulo}
                      </h4>
                      <div style={{ fontSize: "13px", color: "#64748b" }}>
                        Público: <strong>{r.publicoAlvo} {r.turmaAlvo && `(${r.turmaAlvo})`}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", background: "#f5f3ff", padding: "8px 14px", borderRadius: "10px" }}>
                      <div style={{ fontSize: "12px", color: "#7c3aed", fontWeight: "600" }}>DATA & HORÁRIO</div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#5b21b6" }}>
                        📅 {formatarDataBR(r.dataReuniao)} às {r.horarioInicio}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>📍 {r.local}</div>
                    </div>
                  </div>

                  <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.5", margin: "0 0 16px 0" }}>
                    {r.pauta || r.objetivo || "Reunião de alinhamento com a equipe docente."}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: "14px",
                      flexWrap: "wrap",
                      gap: "12px"
                    }}
                  >
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      👥 <strong>{confirmadosCount}</strong> responsáveis confirmaram presença
                    </span>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <Btn
                        variant="secondary"
                        size="sm"
                        onClick={() => handleConfirmarPresencaReuniao(r, "CONFIRMADO")}
                        style={{ background: "#22c55e", color: "#fff", borderColor: "#22c55e" }}
                      >
                        <i className="ti ti-check" style={{ marginRight: "4px" }}></i> Confirmar Presença
                      </Btn>

                      <Btn
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfirmarPresencaReuniao(r, "JUSTIFICADO")}
                        style={{ color: "#64748b" }}
                      >
                        Justificar Ausência
                      </Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* 2. SEÇÃO DE AVISOS & COMUNICADOS */}
        {(feedTipo === "TODOS" || feedTipo === "AVISOS") && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1e293b", margin: "14px 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="ti ti-bell-ringing" style={{ color: "#0284c7" }}></i> Comunicados Oficiais
            </h3>

            {avisos.length === 0 ? (
              <EmptyState title="Nenhum comunicado no momento" description="A escola ainda não publicou avisos para este período." />
            ) : (
              avisos.map((av) => {
                const cientesCount = (av.confirmacoesLeitura || []).length;
                return (
                  <Card
                    key={av.id}
                    style={{
                      padding: "20px",
                      borderLeft: `5px solid ${av.prioridade === "Urgente" ? "#ef4444" : av.prioridade === "Importante" ? "#f59e0b" : "#0284c7"}`,
                      borderRadius: "12px",
                      background: "#fff"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                      <div>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                          <Badge variant={av.prioridade === "Urgente" ? "danger" : av.prioridade === "Importante" ? "warning" : "blue"}>
                            {av.prioridade}
                          </Badge>
                          <Badge variant="neutral">{av.categoria || "Geral"}</Badge>
                        </div>
                        <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: "4px 0" }}>
                          {av.titulo}
                        </h4>
                      </div>

                      <div style={{ fontSize: "12px", color: "#64748b", textAlign: "right" }}>
                        Publicado em: <strong>{formatarDataBR(av.dataPublicacao)}</strong>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>{av.autor}</div>
                      </div>
                    </div>

                    <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6", margin: "0 0 16px 0", whiteSpace: "pre-line" }}>
                      {av.conteudo}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid #f1f5f9",
                        paddingTop: "14px",
                        flexWrap: "wrap",
                        gap: "12px"
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "#64748b" }}>
                        👁️ <strong>{cientesCount}</strong> confirmações de leitura registradas
                      </span>

                      {av.exigeConfirmacaoLeitura && (
                        <Btn
                          variant="primary"
                          size="sm"
                          onClick={() => handleConfirmarLeituraAviso(av)}
                          style={{ background: "#0284c7", borderColor: "#0284c7" }}
                        >
                          <i className="ti ti-check" style={{ marginRight: "6px" }}></i>
                          Estou Ciente / Confirmar Leitura
                        </Btn>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* 3. SEÇÃO DE EVENTOS */}
        {(feedTipo === "TODOS" || feedTipo === "EVENTOS") && eventos.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1e293b", margin: "14px 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="ti ti-calendar-event" style={{ color: "#16a34a" }}></i> Eventos & Calendário Escolar
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
              {eventos.slice(0, 4).map((ev) => (
                <Card key={ev.id} style={{ padding: "18px", borderRadius: "12px" }}>
                  <Badge variant="green" style={{ marginBottom: "8px" }}>{ev.categoria}</Badge>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 6px 0" }}>
                    {ev.titulo}
                  </h4>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px 0", lineHeight: "1.4" }}>
                    {ev.descricao}
                  </p>
                  <div style={{ fontSize: "12px", color: "#334155", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px" }}>
                    <div>📅 <strong>Data:</strong> {formatarDataBR(ev.dataEvento)} ({ev.horaInicio} às {ev.horaFim})</div>
                    <div>📍 <strong>Local:</strong> {ev.local}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

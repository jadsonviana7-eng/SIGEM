import React, { useState, useMemo } from "react";
import {
  Btn,
  Badge,
  Input,
  Select,
  Alert
} from "../../../components/ui";
import { updateAviso, updateReuniao } from "../../../services/comunicacaoService";
import styles from "./MuralPublicoResponsavel.module.css";

export default function MuralPublicoResponsavel({
  avisos = [],
  reunioes = [],
  eventos = [],
  alunos = [],
  selectedEscola,
  onRefresh
}) {
  const [responsavelNome, setResponsavelNome] = useState("");
  const [feedTipo, setFeedTipo] = useState("TODOS"); // TODOS | AVISOS | REUNIOES | EVENTOS
  const [sucessoMsg, setSucessoMsg] = useState(null);

  const formatarDataBR = (dt) => {
    if (!dt) return "—";
    const [y, m, d] = dt.split("-");
    return `${d}/${m}/${y}`;
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalAvisos = avisos.length;
    const totalReunioes = reunioes.length;
    const totalEventos = eventos.length;
    let totalConfirmacoes = 0;
    avisos.forEach(a => {
      totalConfirmacoes += (a.confirmacoesLeitura || []).length;
    });
    reunioes.forEach(r => {
      totalConfirmacoes += (r.confirmados || []).length;
    });

    return {
      totalAvisos,
      totalReunioes,
      totalEventos,
      totalConfirmacoes
    };
  }, [avisos, reunioes, eventos]);

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
    <div className={styles.container}>
      {/* 1. INDICADORES RÁPIDOS (KPIS) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8" }}>
            <i className="ti ti-speakerphone" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.totalAvisos}</span>
            <span className={styles.statLabel}>Avisos Ativos</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
            <i className="ti ti-calendar-time" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.totalReunioes}</span>
            <span className={styles.statLabel}>Reuniões Convocadas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <i className="ti ti-calendar-star" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.totalEventos}</span>
            <span className={styles.statLabel}>Eventos Escolares</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <i className="ti ti-checklist" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.totalConfirmacoes}</span>
            <span className={styles.statLabel}>Ciências & Presenças</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE CABEÇALHO */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-device-mobile" style={{ color: "#38bdf8" }} />
            Mural Digital do Responsável & Família
          </div>
          <p className={styles.headerSubtitle}>
            Canal público e transparente com todos os comunicados escolares, convocações de reuniões e confirmação de leitura online.
          </p>
        </div>
      </div>

      {sucessoMsg && (
        <Alert tipo="success">
          {sucessoMsg}
        </Alert>
      )}

      {/* 3. IDENTIFICAÇÃO E FILTRO */}
      <div className={styles.idCard}>
        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
            👤 Seu Nome Completo (Pai, Mãe ou Responsável)
          </label>
          <Input
            placeholder="Ex: Maria das Dores Silva"
            value={responsavelNome}
            onChange={(e) => setResponsavelNome(e.target.value)}
            icon="ti ti-user"
          />
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
            Filtrar Publicações
          </label>
          <Select
            value={feedTipo}
            onChange={(e) => setFeedTipo(e.target.value)}
          >
            <option value="TODOS">Todas as Publicações (Geral)</option>
            <option value="AVISOS">Somente Avisos & Comunicados</option>
            <option value="REUNIOES">Somente Reuniões de Pais</option>
            <option value="EVENTOS">Somente Eventos & Mostras</option>
          </Select>
        </div>

        <div>
          <Btn
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Link do mural copiado para a área de transferência!");
            }}
            style={{ height: 38, whiteSpace: "nowrap" }}
          >
            <i className="ti ti-copy" />
            Copiar Link do Mural
          </Btn>
        </div>
      </div>

      {/* 4. FEED UNIFICADO */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* REUNIÕES */}
        {(feedTipo === "TODOS" || feedTipo === "REUNIOES") && reunioes.length > 0 && (
          <div className={styles.feedSection}>
            <div className={styles.feedSectionHeader}>
              <i className="ti ti-users" style={{ color: "#a78bfa" }} />
              Próximas Reuniões de Pais & Mestres
            </div>

            {reunioes.map((r) => {
              const confirmadosCount = (r.confirmados || []).length;
              return (
                <div key={r.id} className={`${styles.feedCard} ${styles.feedCardReuniao}`}>
                  <div className={styles.feedCardTop}>
                    <div>
                      <Badge variant="purple">{r.modalidade || "Reunião de Pais"}</Badge>
                      <h4 className={styles.feedCardTitle}>{r.titulo}</h4>
                      <div className={styles.feedCardMeta}>
                        Público Convocado: <strong>{r.turmaAlvo}</strong>
                      </div>
                    </div>

                    <div className={styles.feedDateBadge}>
                      <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700 }}>DATA & HORÁRIO</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
                        📅 {formatarDataBR(r.dataReuniao)} às {r.horarioInicio}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#94a3b8" }}>📍 {r.local}</div>
                    </div>
                  </div>

                  <p className={styles.feedCardBody}>
                    {r.pauta}
                  </p>

                  <div className={styles.feedCardFooter}>
                    <span style={{ fontSize: 12.5, color: "#94a3b8" }}>
                      👥 <strong>{confirmadosCount}</strong> responsáveis já confirmaram presença
                    </span>

                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn
                        size="sm"
                        onClick={() => handleConfirmarPresencaReuniao(r, "CONFIRMADO")}
                        style={{ background: "#059669", color: "#fff", borderColor: "#34d399", fontSize: 12 }}
                      >
                        <i className="ti ti-check" /> Confirmar Presença
                      </Btn>

                      <Btn
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfirmarPresencaReuniao(r, "JUSTIFICADO")}
                        style={{ fontSize: 12 }}
                      >
                        Justificar Ausência
                      </Btn>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AVISOS & COMUNICADOS */}
        {(feedTipo === "TODOS" || feedTipo === "AVISOS") && avisos.length > 0 && (
          <div className={styles.feedSection}>
            <div className={styles.feedSectionHeader}>
              <i className="ti ti-speakerphone" style={{ color: "#38bdf8" }} />
              Avisos & Comunicados Oficiais
            </div>

            {avisos.map((aviso) => {
              const confirmacoesCount = (aviso.confirmacoesLeitura || []).length;
              return (
                <div key={aviso.id} className={`${styles.feedCard} ${styles.feedCardAviso}`}>
                  <div className={styles.feedCardTop}>
                    <div>
                      <Badge variant={aviso.prioridade === "Urgente" ? "danger" : "blue"}>
                        {aviso.categoria || "Geral"}
                      </Badge>
                      <h4 className={styles.feedCardTitle}>{aviso.titulo}</h4>
                      <div className={styles.feedCardMeta}>
                        Publicado em: <strong>{formatarDataBR(aviso.dataPublicacao)}</strong> · Autor: {aviso.autor || "Direção"}
                      </div>
                    </div>
                  </div>

                  <p className={styles.feedCardBody}>
                    {aviso.conteudo}
                  </p>

                  <div className={styles.feedCardFooter}>
                    <span style={{ fontSize: 12.5, color: "#94a3b8" }}>
                      👁️ <strong>{confirmacoesCount}</strong> pais confirmaram a leitura
                    </span>

                    {aviso.exigeConfirmacaoLeitura && (
                      <Btn
                        size="sm"
                        onClick={() => handleConfirmarLeituraAviso(aviso)}
                        style={{ background: "#0284c7", color: "#fff", borderColor: "#38bdf8", fontSize: 12 }}
                      >
                        <i className="ti ti-check" /> Confirmar Leitura
                      </Btn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* EVENTOS */}
        {(feedTipo === "TODOS" || feedTipo === "EVENTOS") && eventos.length > 0 && (
          <div className={styles.feedSection}>
            <div className={styles.feedSectionHeader}>
              <i className="ti ti-calendar-star" style={{ color: "#fbbf24" }} />
              Eventos e Atividades Culturais da Escola
            </div>

            {eventos.map((ev) => (
              <div key={ev.id} className={`${styles.feedCard} ${styles.feedCardEvento}`}>
                <div className={styles.feedCardTop}>
                  <div>
                    <Badge variant="warning">{ev.categoria || "Evento Cultural"}</Badge>
                    <h4 className={styles.feedCardTitle}>{ev.titulo}</h4>
                    <div className={styles.feedCardMeta}>
                      Público: <strong>{ev.publicoAlvo}</strong>
                    </div>
                  </div>

                  <div className={styles.feedDateBadge}>
                    <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>DATA</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
                      📅 {formatarDataBR(ev.dataEvento)} ({ev.horaInicio} às {ev.horaFim})
                    </div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>📍 {ev.local}</div>
                  </div>
                </div>

                <p className={styles.feedCardBody}>
                  {ev.descricao || "Participe e prestigie nossos estudantes!"}
                </p>

                <div className={styles.feedCardFooter}>
                  <span style={{ fontSize: 12.5, color: ev.abertoFamilia ? "#34d399" : "#94a3b8", fontWeight: 600 }}>
                    {ev.abertoFamilia ? "👨‍👩‍👧‍👦 Evento com presença de famílias incentivada" : "🔒 Atividade pedagógica interna"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

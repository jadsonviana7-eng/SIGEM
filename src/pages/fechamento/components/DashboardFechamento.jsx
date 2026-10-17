import { useMemo } from "react";
import { Btn } from "../../../components/ui";
import styles from "./DashboardFechamento.module.css";

export default function DashboardFechamento({
  bimestre,
  anoLetivo,
  totalPendentes = 0,
  totalAguardando = 0,
  totalFechadas = 0,
  totalGeral = 1,
  percentualFechado = 0,
  listaFechamentos = [],
  onFiltrarStatus,
  onNavegarAba,
  onAbrirAta
}) {
  // Lista de turmas com pendências declaradas
  const turmasComPendencias = useMemo(() => {
    return listaFechamentos.filter((f) => f.pendenciasDescricao && f.pendenciasDescricao.trim());
  }, [listaFechamentos]);

  return (
    <div className={styles.dashboard}>
      {/* Banner Executivo */}
      <div className={styles.banner}>
        <div className={styles.bannerInfo}>
          <h2 className={styles.bannerTitle}>
            <i className="ti ti-lock" style={{ color: "#38bdf8" }} />
            Homologação & Fechamento de Período · {bimestre}
          </h2>
          <p className={styles.bannerSubtitle}>
            Ano Letivo {anoLetivo} · Trancamento oficial de notas, frequências e diários eletrônicos
            municipais.
          </p>
        </div>

        <div className={styles.bannerActions}>
          <Btn variant="default" onClick={onAbrirAta} style={{ fontWeight: 600 }}>
            <i className="ti ti-printer" /> Emitir Ata Oficial
          </Btn>
          <Btn
            variant="primary"
            onClick={() => onNavegarAba("turmas")}
            style={{ fontWeight: 700 }}
          >
            <i className="ti ti-checklist" /> Ver Todas as Turmas
          </Btn>
        </div>
      </div>

      {/* 3 Cartões de KPI Principais */}
      <div className={styles.kpiGrid}>
        {/* CARD 1: PENDENTES */}
        <div
          className={styles.kpiCard}
          style={{ borderLeft: "5px solid #ef4444" }}
          onClick={() => {
            onFiltrarStatus("PENDENTE");
            onNavegarAba("turmas");
          }}
        >
          <div className={styles.kpiLeft}>
            <div className={styles.kpiLabelRow}>
              <span>🔴</span>
              <span className={styles.kpiLabel} style={{ color: "#f87171" }}>
                Diários Pendentes
              </span>
            </div>
            <span className={styles.kpiValue} style={{ color: "#f87171" }}>
              {totalPendentes} {totalPendentes === 1 ? "turma" : "turmas"}
            </span>
            <span className={styles.kpiSub}>Em lançamento ou ajuste docente</span>
          </div>
          <div
            className={styles.kpiIconWrap}
            style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}
          >
            <i className="ti ti-alert-triangle" />
          </div>
        </div>

        {/* CARD 2: AGUARDANDO VALIDAÇÃO */}
        <div
          className={styles.kpiCard}
          style={{ borderLeft: "5px solid #f59e0b" }}
          onClick={() => {
            onFiltrarStatus("AGUARDANDO");
            onNavegarAba("turmas");
          }}
        >
          <div className={styles.kpiLeft}>
            <div className={styles.kpiLabelRow}>
              <span>🟡</span>
              <span className={styles.kpiLabel} style={{ color: "#fbbf24" }}>
                Aguardando Validação
              </span>
            </div>
            <span className={styles.kpiValue} style={{ color: "#fbbf24" }}>
              {totalAguardando} {totalAguardando === 1 ? "turma" : "turmas"}
            </span>
            <span className={styles.kpiSub}>Enviado à coordenação pedagógica</span>
          </div>
          <div
            className={styles.kpiIconWrap}
            style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}
          >
            <i className="ti ti-clock" />
          </div>
        </div>

        {/* CARD 3: FECHADAS */}
        <div
          className={styles.kpiCard}
          style={{ borderLeft: "5px solid #22c55e" }}
          onClick={() => {
            onFiltrarStatus("FECHADO");
            onNavegarAba("turmas");
          }}
        >
          <div className={styles.kpiLeft}>
            <div className={styles.kpiLabelRow}>
              <span>🟢</span>
              <span className={styles.kpiLabel} style={{ color: "#4ade80" }}>
                Período Fechado 🔒
              </span>
            </div>
            <span className={styles.kpiValue} style={{ color: "#4ade80" }}>
              {totalFechadas} {totalFechadas === 1 ? "turma" : "turmas"}
            </span>
            <span className={styles.kpiSub}>Diários homologados e trancados</span>
          </div>
          <div
            className={styles.kpiIconWrap}
            style={{ background: "rgba(34, 197, 94, 0.15)", color: "#4ade80" }}
          >
            <i className="ti ti-lock-square" />
          </div>
        </div>
      </div>

      {/* Barra de Progresso do Fechamento */}
      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span style={{ fontWeight: 600, color: "#cbd5e1" }}>
            Progresso de Fechamento do {bimestre}
          </span>
          <span
            style={{
              fontWeight: 800,
              color: percentualFechado === 100 ? "#4ade80" : "#38bdf8"
            }}
          >
            {percentualFechado}% Concluído ({totalFechadas} de {totalGeral} turmas homologadas)
          </span>
        </div>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{
              width: `${(totalFechadas / totalGeral) * 100}%`,
              background: "#22c55e"
            }}
          />
          <div
            className={styles.progressBar}
            style={{
              width: `${(totalAguardando / totalGeral) * 100}%`,
              background: "#f59e0b"
            }}
          />
          <div
            className={styles.progressBar}
            style={{
              width: `${(totalPendentes / totalGeral) * 100}%`,
              background: "#ef4444"
            }}
          />
        </div>

        <div className={styles.legendRow}>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: "#22c55e" }} />
            <span>Fechadas / Trancadas ({totalFechadas})</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: "#f59e0b" }} />
            <span>Em Validação ({totalAguardando})</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: "#ef4444" }} />
            <span>Pendentes ({totalPendentes})</span>
          </div>
        </div>
      </div>

      {/* Grade 2 Colunas: Pendências Docentes + Protocolo de Segurança */}
      <div className={styles.splitGrid}>
        {/* Turmas com Pendências */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <i className="ti ti-clipboard-list" style={{ color: "#f87171" }} />
              Turmas com Pendências Reportadas
            </h3>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              {turmasComPendencias.length} turma(s)
            </span>
          </div>

          {!turmasComPendencias.length ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              Nenhuma pendência reportada para o período. Todas as turmas em conformidade.
            </div>
          ) : (
            <div className={styles.pendingList}>
              {turmasComPendencias.map((item) => (
                <div key={item.id} className={styles.pendingItem}>
                  <div className={styles.pendingText}>
                    <span className={styles.pendingTurma}>{item.turma}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      Prof. {item.professor || "Não atribuído"} · Turno {item.turno || "Manhã"}
                    </span>
                    <span className={styles.pendingDesc}>{item.pendenciasDescricao}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Protocolo de Auditoria e Conformidade */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <i className="ti ti-shield-check" style={{ color: "#38bdf8" }} />
              Protocolo de Segurança & Auditoria
            </h3>
          </div>

          <div className={styles.auditBox}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#38bdf8", fontWeight: 700 }}>
              <i className="ti ti-lock" /> Trancamento Oficial de Caderneta
            </div>
            <div>
              Quando uma turma é validada e fechada pela Coordenação Pedagógica, suas notas,
              frequências e diários são protegidos contra edições convencionais.
            </div>
            <div style={{ borderTop: "1px solid rgba(14, 165, 233, 0.2)", paddingTop: 8, marginTop: 4 }}>
              Qualquer retificação posterior exige <strong>justificativa formal</strong> e fica
              irreversivelmente registrada na <strong>Trilha de Auditoria</strong> com horário e
              responsável.
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavegarAba("auditoria")}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #33435c",
              background: "#243144",
              color: "#38bdf8",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%"
            }}
          >
            <i className="ti ti-shield" /> Consultar Trilha de Auditoria
          </button>
        </div>
      </div>
    </div>
  );
}

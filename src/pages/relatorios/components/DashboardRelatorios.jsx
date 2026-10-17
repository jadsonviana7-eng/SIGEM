import React, { useMemo } from "react";
import { Badge } from "../../../components/ui";
import { ANOS_LETIVOS, TURNOS } from "../../../utils/constants";
import styles from "./DashboardRelatorios.module.css";

export default function DashboardRelatorios({
  alunos = [],
  turmas = [],
  professores = [],
  selectedEscola = {},
  onNavigateTab
}) {
  const stats = useMemo(() => {
    const totalAlunos = alunos.length;
    const ativos = alunos.filter((a) => a.status === "Ativo").length;
    const transferidos = alunos.filter((a) => a.status === "Transferido").length;
    const inativos = alunos.filter((a) => a.status === "Inativo" || a.status === "Evadido").length;
    const concluidos = alunos.filter((a) => a.status === "Concluído").length;

    const taxaAtivos = totalAlunos > 0 ? Math.round((ativos / totalAlunos) * 100) : 0;
    const totalTurmas = turmas.length;
    const totalProfessores = professores.length;

    const mediaAlunosTurma = totalTurmas > 0 ? (totalAlunos / totalTurmas).toFixed(1) : 0;
    const proporcaoAlunoProf = totalProfessores > 0 ? (totalAlunos / totalProfessores).toFixed(1) : 0;

    return {
      totalAlunos,
      ativos,
      transferidos,
      inativos,
      concluidos,
      taxaAtivos,
      totalTurmas,
      totalProfessores,
      mediaAlunosTurma,
      proporcaoAlunoProf
    };
  }, [alunos, turmas, professores]);

  const anosDistribuicao = useMemo(() => {
    const total = alunos.length || 1;
    return (ANOS_LETIVOS || []).map((ano) => {
      const count = alunos.filter((a) => (a.ano || "").toLowerCase() === ano.toLowerCase()).length;
      const pct = Math.round((count / total) * 100);
      return { ano, count, pct };
    });
  }, [alunos]);

  const turnosDistribuicao = useMemo(() => {
    const total = alunos.length || 1;
    return (TURNOS || []).map((turno) => {
      const count = alunos.filter((a) => (a.turno || "").toLowerCase() === turno.toLowerCase()).length;
      const pct = Math.round((count / total) * 100);
      return { turno, count, pct };
    });
  }, [alunos]);

  return (
    <div className={styles.container}>
      {/* 1. BANNER EXECUTIVO */}
      <div className={styles.banner}>
        <div>
          <span className={styles.bannerTag}>SÍNTESE & INTELIGÊNCIA ESCOLAR</span>
          <h2 className={styles.bannerTitle}>
            Painel Executivo de Relatórios & Censo
          </h2>
          <p className={styles.bannerSubtitle}>
            Consolidação em tempo real de matrículas, distribuição por turmas, corpo docente e indicadores estatísticos da unidade <strong>{selectedEscola.nome || "Escola Municipal"}</strong>.
          </p>
        </div>

        <div className={styles.bannerActions}>
          <button
            type="button"
            className={styles.bannerBtnPrimary}
            onClick={() => onNavigateTab && onNavigateTab("documentos")}
          >
            <i className="ti ti-printer" />
            <span>Emitir Documentos Oficiais</span>
          </button>
          <button
            type="button"
            className={styles.bannerBtnSecondary}
            onClick={() => onNavigateTab && onNavigateTab("matriculas")}
          >
            <i className="ti ti-users" />
            <span>Relação de Alunos</span>
          </button>
        </div>
      </div>

      {/* 2. GRADE DE KPIS PRINCIPAIS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}
          >
            <i className="ti ti-users" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalAlunos}</span>
            <span className={styles.statLabel}>Total de Alunos</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}
          >
            <i className="ti ti-user-check" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.ativos} ({stats.taxaAtivos}%)</span>
            <span className={styles.statLabel}>Alunos Ativos</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(14, 165, 233, 0.15)", color: "#38bdf8" }}
          >
            <i className="ti ti-chalkboard" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalTurmas}</span>
            <span className={styles.statLabel}>Turmas Ofertadas ({stats.mediaAlunosTurma} alunos/turma)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(139, 92, 246, 0.15)", color: "#c084fc" }}
          >
            <i className="ti ti-school" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalProfessores}</span>
            <span className={styles.statLabel}>Professores ({stats.proporcaoAlunoProf} alunos/prof)</span>
          </div>
        </div>
      </div>

      {/* 3. GRIDS DE DISTRIBUIÇÃO ESTATÍSTICA */}
      <div className={styles.splitGrid}>
        {/* Distribuição por Ano / Etapa */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionCardHeader}>
            <h3 className={styles.sectionCardTitle}>
              <i className="ti ti-chart-bar" style={{ color: "#38bdf8" }} />
              Matrículas por Ano / Série
            </h3>
            <button
              type="button"
              className={styles.btnLink}
              onClick={() => onNavigateTab && onNavigateTab("matriculas")}
            >
              Ver Detalhes →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {anosDistribuicao.map(({ ano, count, pct }) => (
              <div key={ano} className={styles.distItem}>
                <div className={styles.distItemHeader}>
                  <span className={styles.distItemLabel}>{ano}</span>
                  <span className={styles.distItemMeta}>
                    <strong>{count}</strong> alunos ({pct}%)
                  </span>
                </div>
                <div className={styles.distBarBg}>
                  <div
                    className={styles.distBarFill}
                    style={{
                      width: `${pct}%`,
                      background: "linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por Turno & Situação */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionCardHeader}>
            <h3 className={styles.sectionCardTitle}>
              <i className="ti ti-clock" style={{ color: "#fbbf24" }} />
              Matrículas por Turno
            </h3>
            <button
              type="button"
              className={styles.btnLink}
              onClick={() => onNavigateTab && onNavigateTab("matriculas")}
            >
              Ver Turmas →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {turnosDistribuicao.map(({ turno, count, pct }) => (
              <div key={turno} className={styles.distItem}>
                <div className={styles.distItemHeader}>
                  <span className={styles.distItemLabel}>{turno}</span>
                  <span className={styles.distItemMeta}>
                    <strong>{count}</strong> estudantes ({pct}%)
                  </span>
                </div>
                <div className={styles.distBarBg}>
                  <div
                    className={styles.distBarFill}
                    style={{
                      width: `${pct}%`,
                      background: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, paddingTop: 14, borderTop: "1px solid var(--border-color, #2c3b52)" }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", margin: "0 0 10px 0" }}>
              Situação Cadastral dos Alunos
            </h4>
            <div className={styles.statusChipsWrap}>
              <div className={styles.statusChip}>
                <Badge variant="success">Ativos</Badge>
                <span><strong>{stats.ativos}</strong> ({stats.taxaAtivos}%)</span>
              </div>
              <div className={styles.statusChip}>
                <Badge variant="warning">Transferidos</Badge>
                <span><strong>{stats.transferidos}</strong></span>
              </div>
              <div className={styles.statusChip}>
                <Badge variant="danger">Inativos / Evadidos</Badge>
                <span><strong>{stats.inativos}</strong></span>
              </div>
              {stats.concluidos > 0 && (
                <div className={styles.statusChip}>
                  <Badge variant="info">Concluídos</Badge>
                  <span><strong>{stats.concluidos}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

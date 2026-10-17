import { useMemo } from "react";
import { Btn, Badge } from "../../../components/ui";
import styles from "./DashboardDiario.module.css";

export default function DashboardDiario({
  turmaSelecionada,
  dadosTurmaAtual,
  conteudosFiltrados = [],
  totalAulasRegistradas = 0,
  abrirNovoRegistro,
  setModalImprimirAberto,
  onNavegarAba,
  abrirEditarRegistro
}) {
  // Total de dias letivos únicos
  const totalDiasLetivos = useMemo(() => {
    const datas = new Set(conteudosFiltrados.map((c) => c.data).filter(Boolean));
    return datas.size;
  }, [conteudosFiltrados]);

  // Contagem de disciplinas com aula registrada
  const disciplinasComAulas = useMemo(() => {
    const map = {};
    conteudosFiltrados.forEach((c) => {
      const d = c.disciplina || "Geral";
      map[d] = (map[d] || 0) + (Number(c.aulasQtd) || 1);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [conteudosFiltrados]);

  // Contagem de habilidades BNCC cadastradas
  const totalHabilidadesBNCC = useMemo(() => {
    return conteudosFiltrados.filter((c) => c.habilidades && c.habilidades.trim()).length;
  }, [conteudosFiltrados]);

  // Aulas mais recentes (até 5)
  const aulasRecentes = useMemo(() => {
    return conteudosFiltrados.slice(0, 5);
  }, [conteudosFiltrados]);

  return (
    <div className={styles.dashboard}>
      {/* Banner Executivo com Informações da Turma e Ações */}
      <div className={styles.banner}>
        <div className={styles.bannerInfo}>
          <h2 className={styles.bannerTitle}>
            <i className="ti ti-notebook" style={{ color: "#818cf8" }} />
            Caderneta Digital · Turma {turmaSelecionada || "Selecione uma turma"}
          </h2>
          <p className={styles.bannerSubtitle}>
            Ano Letivo {new Date().getFullYear()} · {dadosTurmaAtual?.ano || "Ensino Fundamental"} · Turno{" "}
            {dadosTurmaAtual?.turno || "Matutino"}
          </p>
        </div>

        <div className={styles.bannerActions}>
          <Btn
            variant="default"
            onClick={() => setModalImprimirAberto(true)}
            disabled={!conteudosFiltrados.length}
            style={{ fontWeight: 600 }}
          >
            <i className="ti ti-printer" /> Imprimir Caderneta
          </Btn>
          <Btn variant="primary" onClick={abrirNovoRegistro} style={{ fontWeight: 700 }}>
            <i className="ti ti-plus" /> Registrar Aula
          </Btn>
        </div>
      </div>

      {/* Grade de Indicadores (KPIs) */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrap}
            style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}
          >
            <i className="ti ti-clock-play" />
          </div>
          <div className={styles.kpiText}>
            <span className={styles.kpiLabel}>Carga Horária</span>
            <span className={styles.kpiValue}>{totalAulasRegistradas}</span>
            <span className={styles.kpiSub}>horas-aula ministradas</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrap}
            style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399" }}
          >
            <i className="ti ti-calendar-event" />
          </div>
          <div className={styles.kpiText}>
            <span className={styles.kpiLabel}>Dias Letivos</span>
            <span className={styles.kpiValue} style={{ color: "#34d399" }}>
              {totalDiasLetivos}
            </span>
            <span className={styles.kpiSub}>com diário preenchido</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrap}
            style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}
          >
            <i className="ti ti-books" />
          </div>
          <div className={styles.kpiText}>
            <span className={styles.kpiLabel}>Disciplinas</span>
            <span className={styles.kpiValue} style={{ color: "#c084fc" }}>
              {disciplinasComAulas.length}
            </span>
            <span className={styles.kpiSub}>componentes com aulas</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrap}
            style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}
          >
            <i className="ti ti-target-arrow" />
          </div>
          <div className={styles.kpiText}>
            <span className={styles.kpiLabel}>Habilidades BNCC</span>
            <span className={styles.kpiValue} style={{ color: "#38bdf8" }}>
              {totalHabilidadesBNCC}
            </span>
            <span className={styles.kpiSub}>registros vinculados</span>
          </div>
        </div>
      </div>

      {/* Grade de 2 Colunas: Componentes Curriculares + Aulas Recentes */}
      <div className={styles.splitGrid}>
        {/* Componentes Curriculares */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <i className="ti ti-book-2" style={{ color: "#818cf8" }} />
              Aulas por Componente Curricular
            </h3>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Total: {totalAulasRegistradas} h/a
            </span>
          </div>

          {!disciplinasComAulas.length ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              Nenhum componente com aula lançada nesta turma.
            </div>
          ) : (
            <div className={styles.subjectList}>
              {disciplinasComAulas.map(([disc, qtd]) => {
                const percent =
                  totalAulasRegistradas > 0
                    ? Math.round((qtd / totalAulasRegistradas) * 100)
                    : 0;
                return (
                  <div key={disc} className={styles.subjectItem}>
                    <div className={styles.subjectRow}>
                      <span>{disc}</span>
                      <span style={{ color: "#818cf8" }}>
                        {qtd} aula(s) <span style={{ color: "#94a3b8", fontSize: 11 }}>({percent}%)</span>
                      </span>
                    </div>
                    <div className={styles.subjectProgress}>
                      <div className={styles.subjectBar} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Aulas Recentes Registradas */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <i className="ti ti-history" style={{ color: "#818cf8" }} />
              Últimas Aulas Registradas
            </h3>
            <button
              type="button"
              onClick={() => onNavegarAba("aulas")}
              style={{
                background: "none",
                border: "none",
                color: "#818cf8",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              Ver todas <i className="ti ti-chevron-right" />
            </button>
          </div>

          {!aulasRecentes.length ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              Nenhuma aula registrada ainda para esta turma.
            </div>
          ) : (
            <div className={styles.recentList}>
              {aulasRecentes.map((item) => (
                <div key={item.id} className={styles.recentCard}>
                  <div className={styles.dateBadge}>
                    <span className={styles.dateDay}>
                      {item.data ? new Date(item.data + "T12:00:00").getDate() : "—"}
                    </span>
                    <span className={styles.dateMonth}>
                      {item.data
                        ? new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR", {
                            month: "short"
                          })
                        : ""}
                    </span>
                  </div>

                  <div className={styles.recentContent}>
                    <div className={styles.recentHeader}>
                      <span className={styles.recentSubject}>{item.disciplina}</span>
                      <Badge color="blue">{item.bimestre || "1º Bimestre"}</Badge>
                      <Badge color="gray">{item.aulasQtd || 1} aula(s)</Badge>
                    </div>
                    <div className={styles.recentSnippet}>{item.conteudo}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      Prof. {item.professor || "Regente"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => abrirEditarRegistro(item)}
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid #33435c",
                      borderRadius: 6,
                      color: "#cbd5e1",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: 11,
                      alignSelf: "center",
                      flexShrink: 0
                    }}
                    title="Editar aula"
                  >
                    <i className="ti ti-edit" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

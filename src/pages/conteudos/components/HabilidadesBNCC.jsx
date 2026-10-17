import { useMemo } from "react";
import { Badge, Select, EmptyState, Btn } from "../../../components/ui";
import styles from "./HabilidadesBNCC.module.css";

export default function HabilidadesBNCC({
  conteudosFiltrados = [],
  turmaSelecionada = "",
  disciplinaSelecionada = "",
  setDisciplinaSelecionada,
  DISCIPLINAS = [],
  onNavegarAba
}) {
  // Extrai todas as aulas que possuem habilidades cadastradas
  const aulasComBNCC = useMemo(() => {
    return conteudosFiltrados.filter((c) => c.habilidades && c.habilidades.trim());
  }, [conteudosFiltrados]);

  // Contagem de componentes distintos
  const componentesDistintos = useMemo(() => {
    const s = new Set(aulasComBNCC.map((c) => c.disciplina));
    return s.size;
  }, [aulasComBNCC]);

  return (
    <div className={styles.container}>
      {/* Top Card com Indicadores e Filtro de Componente */}
      <div className={styles.topCard}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              <i className="ti ti-target-arrow" style={{ color: "#38bdf8" }} />
              Matriz de Habilidades & Competências (BNCC)
            </h2>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Turma: <strong style={{ color: "#ffffff" }}>{turmaSelecionada || "—"}</strong>
            </span>
          </div>

          <div style={{ minWidth: 200 }}>
            <Select
              value={disciplinaSelecionada}
              onChange={(e) => setDisciplinaSelecionada(e.target.value)}
            >
              <option value="">Todas as Disciplinas</option>
              {DISCIPLINAS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Linha de KPIs Rápidos */}
        <div className={styles.kpiRow}>
          <div className={styles.kpiBox}>
            <span className={styles.kpiLabel}>Habilidades Registradas</span>
            <span className={styles.kpiValue} style={{ color: "#38bdf8" }}>
              {aulasComBNCC.length}
            </span>
          </div>
          <div className={styles.kpiBox}>
            <span className={styles.kpiLabel}>Componentes com BNCC</span>
            <span className={styles.kpiValue} style={{ color: "#818cf8" }}>
              {componentesDistintos}
            </span>
          </div>
          <div className={styles.kpiBox}>
            <span className={styles.kpiLabel}>Aulas Totais da Turma</span>
            <span className={styles.kpiValue} style={{ color: "#34d399" }}>
              {conteudosFiltrados.length}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Registros de Habilidades */}
      {!aulasComBNCC.length ? (
        <EmptyState
          icon="target-arrow"
          texto={`Nenhuma habilidade BNCC cadastrada para a turma "${turmaSelecionada}" com os filtros atuais.`}
        >
          <div style={{ marginTop: 12 }}>
            <Btn variant="primary" onClick={() => onNavegarAba("lancar")}>
              <i className="ti ti-plus" /> Lançar Aula com Habilidade BNCC
            </Btn>
          </div>
        </EmptyState>
      ) : (
        <div className={styles.skillList}>
          {aulasComBNCC.map((item, idx) => (
            <div key={item.id || idx} className={styles.skillCard}>
              <div className={styles.skillHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className={styles.skillTag}>
                    <i className="ti ti-bookmark" />
                    {item.disciplina}
                  </span>
                  <Badge color="blue">{item.bimestre || "1º Bimestre"}</Badge>
                </div>
                <div className={styles.skillMeta}>
                  Aula em{" "}
                  <strong style={{ color: "#cbd5e1" }}>
                    {item.data
                      ? new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR")
                      : "—"}
                  </strong>{" "}
                  · Prof. {item.professor || "Regente"}
                </div>
              </div>

              <div className={styles.skillDesc}>{item.habilidades}</div>

              <div className={styles.classSnippet}>
                <strong style={{ color: "#cbd5e1" }}>Tema da aula:</strong> {item.conteudo}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

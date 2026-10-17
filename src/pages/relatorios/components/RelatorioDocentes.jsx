import React, { useState, useMemo } from "react";
import { Badge, Input, Select } from "../../../components/ui";
import { TURNOS } from "../../../utils/constants";
import styles from "./RelatorioDocentes.module.css";

const DISCIPLINAS_LISTA = [
  "Língua Portuguesa",
  "Matemática",
  "Ciências",
  "História",
  "Geografia",
  "Artes",
  "Educação Física",
  "Língua Inglesa"
];

export default function RelatorioDocentes({
  professores = [],
  turmas = [],
  alunos = [],
  selectedEscola = {}
}) {
  const [searchNome, setSearchNome] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");
  const [filtroDisciplina, setFiltroDisciplina] = useState("");

  const professoresFiltrados = useMemo(() => {
    return professores.filter((p) => {
      if (searchNome) {
        const q = searchNome.toLowerCase().trim();
        const nomeMatch = (p.nome || "").toLowerCase().includes(q);
        const emailMatch = (p.email || "").toLowerCase().includes(q);
        if (!nomeMatch && !emailMatch) return false;
      }
      if (filtroTurno && (p.turno || "").toLowerCase() !== filtroTurno.toLowerCase()) {
        return false;
      }
      if (filtroDisciplina) {
        const discs = p.disciplinas || [];
        const temDisc = discs.some((d) => d.toLowerCase() === filtroDisciplina.toLowerCase());
        if (!temDisc) return false;
      }
      return true;
    });
  }, [professores, searchNome, filtroTurno, filtroDisciplina]);

  // KPIs
  const kpis = useMemo(() => {
    const totalProfessores = professoresFiltrados.length;
    const totalAlunos = alunos.length;
    const proporcao = totalProfessores > 0 ? (totalAlunos / totalProfessores).toFixed(1) : "—";

    let todasDisciplinas = new Set();
    professores.forEach((p) => {
      (p.disciplinas || []).forEach((d) => todasDisciplinas.add(d));
    });

    const cargaHorariaMedia = "30h / sem";

    return {
      totalProfessores,
      disciplinasCobertas: todasDisciplinas.size || 8,
      proporcao,
      cargaHorariaMedia
    };
  }, [professoresFiltrados, professores, alunos.length]);

  return (
    <div className={styles.container}>
      {/* 1. KPIS DE DOCENTES */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(124, 58, 237, 0.15)", color: "#a78bfa" }}
          >
            <i className="ti ti-users" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.totalProfessores}</span>
            <span className={styles.statLabel}>Professores Cadastrados</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}
          >
            <i className="ti ti-book" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.disciplinasCobertas}</span>
            <span className={styles.statLabel}>Componentes Curriculares</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}
          >
            <i className="ti ti-clock" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.cargaHorariaMedia}</span>
            <span className={styles.statLabel}>Carga Horária Média</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}
          >
            <i className="ti ti-scale" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.proporcao}</span>
            <span className={styles.statLabel}>Proporção Aluno / Docente</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE CABEÇALHO */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-id-badge-2" style={{ color: "#a78bfa" }} />
            Quadro do Corpo Docente & Lotação Escolar
          </div>
          <p className={styles.headerSubtitle}>
            Distribuição dos educadores por componente curricular, turnos de atendimento e turmas vinculadas na escola <strong>{selectedEscola.nome || "Escola Municipal"}</strong>.
          </p>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS */}
      <div className={styles.filtersBar}>
        <Input
          placeholder="Buscar professor por nome ou e-mail..."
          value={searchNome}
          onChange={(e) => setSearchNome(e.target.value)}
          icon="ti ti-search"
        />

        <Select value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value)}>
          <option value="">Todos os Turnos</option>
          {(TURNOS || []).map((turno) => (
            <option key={turno} value={turno}>{turno}</option>
          ))}
        </Select>

        <Select value={filtroDisciplina} onChange={(e) => setFiltroDisciplina(e.target.value)}>
          <option value="">Todas as Disciplinas</option>
          {DISCIPLINAS_LISTA.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>

        {(searchNome || filtroTurno || filtroDisciplina) && (
          <button
            type="button"
            className={styles.btnClearFilters}
            onClick={() => {
              setSearchNome("");
              setFiltroTurno("");
              setFiltroDisciplina("");
            }}
          >
            <i className="ti ti-x" /> Limpar
          </button>
        )}
      </div>

      {/* 4. TABELA DE PROFESSORES EM DESKTOP */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Professor(a)</th>
                <th>Disciplinas Ministradas</th>
                <th>Turno</th>
                <th>Contato / E-mail</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {professoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 28, color: "var(--text-muted, #94a3b8)" }}>
                    Nenhum professor encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                professoresFiltrados.map((p) => {
                  const initials = (p.nome || "PR")
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className={styles.profAvatar}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#ffffff" }}>{p.nome}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                              {p.formacao || "Docência na Educação Básica"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {(p.disciplinas && p.disciplinas.length > 0 ? p.disciplinas : ["Polivalente / Anos Iniciais"]).map((d) => (
                            <Badge key={d} variant="purple">{d}</Badge>
                          ))}
                        </div>
                      </td>
                      <td>
                        <strong>{p.turno || "Matutino"}</strong>
                      </td>
                      <td>
                        <div>{p.email || "—"}</div>
                        {p.telefone && (
                          <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                            📞 {p.telefone}
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge variant={p.status === "Ativo" || !p.status ? "success" : "warning"}>
                          {p.status || "Ativo"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODO CARDS EM MOBILE */}
      <div className={styles.mobileCards}>
        {professoresFiltrados.map((p) => {
          const initials = (p.nome || "PR")
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")
            .toUpperCase();

          return (
            <div key={p.id} className={styles.profCardMobile}>
              <div className={styles.cardTop}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className={styles.profAvatar}>{initials}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#ffffff", fontSize: 14 }}>{p.nome}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                      Turno: {p.turno || "Matutino"}
                    </div>
                  </div>
                </div>
                <Badge variant={p.status === "Ativo" || !p.status ? "success" : "warning"}>
                  {p.status || "Ativo"}
                </Badge>
              </div>

              <div className={styles.cardBody}>
                <span>Disciplinas: <strong>{(p.disciplinas || ["Polivalente"]).join(", ")}</strong></span>
                <span>Contato: <strong>{p.email || p.telefone || "—"}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

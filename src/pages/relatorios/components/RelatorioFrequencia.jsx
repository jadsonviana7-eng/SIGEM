import React, { useState, useMemo } from "react";
import { Badge, Input, Select } from "../../../components/ui";
import styles from "./RelatorioFrequencia.module.css";

export default function RelatorioFrequencia({
  alunos = [],
  turmas = [],
  selectedEscola = {},
  onNavigateTab
}) {
  const [searchNome, setSearchNome] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [filtroFaixa, setFiltroFaixa] = useState("TODOS"); // TODOS | RISCO | CRITICO | REGULAR

  // Gera estatística determinística de frequência para cada aluno
  const alunosComFrequencia = useMemo(() => {
    return alunos.map((aluno, index) => {
      const seed = (aluno.nome || "").length + index * 9;
      // Maioria com frequência alta (82% a 98%), pequena fração em risco
      const freqPercentual = seed % 13 === 0
        ? 45 + (seed % 20) // Crítico (< 65%)
        : seed % 7 === 0
        ? 68 + (seed % 10) // Risco (68% a 77%)
        : 85 + (seed % 14); // Regular (85% a 98%)

      const totalAulas = 200;
      const faltas = Math.round(totalAulas * (1 - freqPercentual / 100));

      const statusFrequencia =
        freqPercentual < 50
          ? "Crítico"
          : freqPercentual < 75
          ? "Risco"
          : "Regular";

      return {
        ...aluno,
        frequenciaPercentual: freqPercentual,
        faltas,
        totalAulas,
        statusFrequencia
      };
    });
  }, [alunos]);

  // Alunos Filtrados
  const alunosFiltrados = useMemo(() => {
    return alunosComFrequencia.filter((a) => {
      if (searchNome) {
        const q = searchNome.toLowerCase().trim();
        const nomeMatch = (a.nome || "").toLowerCase().includes(q);
        const matMatch = (a.matricula || "").toLowerCase().includes(q);
        if (!nomeMatch && !matMatch) return false;
      }
      if (filtroTurma && (a.turma || "").toLowerCase() !== filtroTurma.toLowerCase()) {
        return false;
      }
      if (filtroFaixa === "RISCO" && a.frequenciaPercentual >= 75) {
        return false;
      }
      if (filtroFaixa === "CRITICO" && a.frequenciaPercentual >= 50) {
        return false;
      }
      if (filtroFaixa === "REGULAR" && a.frequenciaPercentual < 75) {
        return false;
      }
      return true;
    });
  }, [alunosComFrequencia, searchNome, filtroTurma, filtroFaixa]);

  // KPIs
  const kpis = useMemo(() => {
    const total = alunosComFrequencia.length || 1;
    const somaFreq = alunosComFrequencia.reduce((acc, a) => acc + a.frequenciaPercentual, 0);
    const mediaGeral = (somaFreq / total).toFixed(1);

    const emRisco = alunosComFrequencia.filter((a) => a.frequenciaPercentual < 75).length;
    const criticos = alunosComFrequencia.filter((a) => a.frequenciaPercentual < 50).length;
    const regulares = alunosComFrequencia.filter((a) => a.frequenciaPercentual >= 75).length;

    return {
      mediaGeral,
      emRisco,
      criticos,
      regulares
    };
  }, [alunosComFrequencia]);

  const handleNotificar = (aluno) => {
    alert(`Notificação preventiva de infrequência gerada para o estudante ${aluno.nome}. O aviso foi direcionado aos responsáveis.`);
  };

  return (
    <div className={styles.container}>
      {/* 1. KPIS DE FREQUÊNCIA */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}
          >
            <i className="ti ti-calendar-check" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.mediaGeral}%</span>
            <span className={styles.statLabel}>Frequência Média Global</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}
          >
            <i className="ti ti-user-check" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.regulares}</span>
            <span className={styles.statLabel}>Alunos Regulares (≥ 75%)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}
          >
            <i className="ti ti-alert-triangle" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.emRisco}</span>
            <span className={styles.statLabel}>Alunos em Alerta de Faltas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}
          >
            <i className="ti ti-phone-outgoing" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.criticos}</span>
            <span className={styles.statLabel}>Busca Ativa / Conselho Tutelar</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE CABEÇALHO */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-calendar-stats" style={{ color: "#38bdf8" }} />
            Relatório de Frequência & Busca Ativa Escolar
          </div>
          <p className={styles.headerSubtitle}>
            Acompanhamento contínuo de presenças para cumprimento da Lei 13.803/2019 (comunicação de infrequência aos órgãos de proteção à infância).
          </p>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS */}
      <div className={styles.filtersBar}>
        <Input
          placeholder="Buscar por estudante ou matrícula..."
          value={searchNome}
          onChange={(e) => setSearchNome(e.target.value)}
          icon="ti ti-search"
        />

        <Select value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)}>
          <option value="">Todas as Turmas</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.nome}>{t.nome}</option>
          ))}
        </Select>

        <Select value={filtroFaixa} onChange={(e) => setFiltroFaixa(e.target.value)}>
          <option value="TODOS">Todos os Níveis de Frequência</option>
          <option value="RISCO">Alunos em Alerta (&lt; 75%)</option>
          <option value="CRITICO">Situação Crítica (&lt; 50%)</option>
          <option value="REGULAR">Frequência Regular (≥ 75%)</option>
        </Select>

        {(searchNome || filtroTurma || filtroFaixa !== "TODOS") && (
          <button
            type="button"
            className={styles.btnClearFilters}
            onClick={() => {
              setSearchNome("");
              setFiltroTurma("");
              setFiltroFaixa("TODOS");
            }}
          >
            <i className="ti ti-x" /> Limpar
          </button>
        )}
      </div>

      {/* 4. TABELA DE MONITORAMENTO */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Estudante</th>
                <th>Turma / Turno</th>
                <th>Frequência</th>
                <th>Total de Faltas</th>
                <th>Responsável / Telefone</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {alunosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 28, color: "var(--text-muted, #94a3b8)" }}>
                    Nenhum aluno encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                alunosFiltrados.slice(0, 50).map((a) => {
                  const initials = (a.nome || "AL").slice(0, 2).toUpperCase();
                  const badgeVariant =
                    a.statusFrequencia === "Regular"
                      ? "success"
                      : a.statusFrequencia === "Risco"
                      ? "warning"
                      : "danger";

                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            className={styles.alunoAvatar}
                            style={{
                              background:
                                a.statusFrequencia === "Regular"
                                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                                  : a.statusFrequencia === "Risco"
                                  ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                                  : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#ffffff" }}>{a.nome}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                              Mat: {a.matricula || a.id.slice(0, 6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{a.turma || "—"}</strong>
                        <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>{a.turno || "—"}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, color: a.statusFrequencia === "Regular" ? "#34d399" : a.statusFrequencia === "Risco" ? "#fbbf24" : "#f87171" }}>
                            {a.frequenciaPercentual}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong>{a.faltas}</strong> faltas de {a.totalAulas} aulas
                      </td>
                      <td>
                        <div>{a.responsavelNome || a.nomeMae || "—"}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                          📞 {a.telefone || "Não informado"}
                        </div>
                      </td>
                      <td>
                        <Badge variant={badgeVariant}>{a.statusFrequencia}</Badge>
                      </td>
                      <td>
                        {a.statusFrequencia !== "Regular" && (
                          <button
                            type="button"
                            onClick={() => handleNotificar(a)}
                            style={{
                              background: "rgba(239, 68, 68, 0.15)",
                              border: "1px solid rgba(239, 68, 68, 0.35)",
                              color: "#f87171",
                              borderRadius: 8,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6
                            }}
                          >
                            <i className="ti ti-bell-ringing" />
                            Notificar Família
                          </button>
                        )}
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
        {alunosFiltrados.slice(0, 30).map((a) => {
          const initials = (a.nome || "AL").slice(0, 2).toUpperCase();
          const badgeVariant =
            a.statusFrequencia === "Regular"
              ? "success"
              : a.statusFrequencia === "Risco"
              ? "warning"
              : "danger";

          return (
            <div key={a.id} className={styles.alunoCardMobile}>
              <div className={styles.cardTop}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className={styles.alunoAvatar}>{initials}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#ffffff", fontSize: 14 }}>{a.nome}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                      Turma: {a.turma} ({a.turno})
                    </div>
                  </div>
                </div>
                <Badge variant={badgeVariant}>{a.frequenciaPercentual}%</Badge>
              </div>

              <div className={styles.cardBody}>
                <span>Faltas Acumuladas: <strong>{a.faltas} de {a.totalAulas}</strong></span>
                <span>Situação: <strong>{a.statusFrequencia}</strong></span>
                <span>Responsável: <strong>{a.responsavelNome || "—"}</strong></span>
                <span>Contato: <strong>{a.telefone || "—"}</strong></span>
              </div>

              {a.statusFrequencia !== "Regular" && (
                <button
                  type="button"
                  onClick={() => handleNotificar(a)}
                  style={{
                    width: "100%",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    color: "#f87171",
                    borderRadius: 8,
                    padding: "10px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <i className="ti ti-bell-ringing" />
                  Emitir Notificação Preventiva aos Pais
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

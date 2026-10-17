import React, { useState, useMemo } from "react";
import { Badge, Input, Select } from "../../../components/ui";
import { ANOS_LETIVOS, TURNOS } from "../../../utils/constants";
import styles from "./RelatorioMatriculas.module.css";

export default function RelatorioMatriculas({
  alunos = [],
  turmas = [],
  selectedEscola = {},
  onNavigateTab
}) {
  const [searchNome, setSearchNome] = useState("");
  const [filtroAno, setFiltroAno] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const formatarDataBR = (dt) => {
    if (!dt) return "—";
    const [y, m, d] = dt.split("-");
    if (d && m && y) return `${d}/${m}/${y}`;
    return dt;
  };

  // Alunos Filtrados
  const alunosFiltrados = useMemo(() => {
    return alunos.filter((aluno) => {
      if (searchNome) {
        const query = searchNome.toLowerCase().trim();
        const nomeMatch = (aluno.nome || "").toLowerCase().includes(query);
        const matMatch = (aluno.matricula || "").toLowerCase().includes(query);
        const respMatch = (aluno.responsavelNome || "").toLowerCase().includes(query);
        if (!nomeMatch && !matMatch && !respMatch) return false;
      }
      if (filtroAno && (aluno.ano || "").toLowerCase() !== filtroAno.toLowerCase()) {
        return false;
      }
      if (filtroTurma && (aluno.turma || "").toLowerCase() !== filtroTurma.toLowerCase()) {
        return false;
      }
      if (filtroTurno && (aluno.turno || "").toLowerCase() !== filtroTurno.toLowerCase()) {
        return false;
      }
      if (filtroStatus && (aluno.status || "").toLowerCase() !== filtroStatus.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [alunos, searchNome, filtroAno, filtroTurma, filtroTurno, filtroStatus]);

  // KPIs
  const kpis = useMemo(() => {
    const total = alunosFiltrados.length;
    const ativos = alunosFiltrados.filter((a) => a.status === "Ativo").length;
    const transferidos = alunosFiltrados.filter((a) => a.status === "Transferido").length;
    const inativos = alunosFiltrados.filter((a) => a.status === "Inativo" || a.status === "Evadido").length;
    const pctAtivos = total > 0 ? Math.round((ativos / total) * 100) : 0;

    return {
      total,
      ativos,
      transferidos,
      inativos,
      pctAtivos
    };
  }, [alunosFiltrados]);

  // Exportar para CSV com UTF-8 BOM para o Excel não quebrar acentos
  const handleExportCSV = () => {
    if (!alunosFiltrados.length) {
      alert("Nenhum dado para exportar com os filtros atuais.");
      return;
    }

    const headers = [
      "Matrícula",
      "Nome do Estudante",
      "Data Nasc.",
      "Ano/Série",
      "Turma",
      "Turno",
      "Status",
      "Nome do Responsável",
      "Telefone Contato",
      "Data Matrícula"
    ];

    const rows = alunosFiltrados.map((a) => [
      `"${a.matricula || "—"}"`,
      `"${a.nome || ""}"`,
      `"${formatarDataBR(a.dataNascimento)}"`,
      `"${a.ano || ""}"`,
      `"${a.turma || ""}"`,
      `"${a.turno || ""}"`,
      `"${a.status || "Ativo"}"`,
      `"${a.responsavelNome || a.nomeMae || "—"}"`,
      `"${a.telefone || a.telefoneMae || "—"}"`,
      `"${formatarDataBR(a.dataMatricula || a.criadoEm)}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_Matriculas_${selectedEscola.nome || "Escola"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearFilters = () => {
    setSearchNome("");
    setFiltroAno("");
    setFiltroTurma("");
    setFiltroTurno("");
    setFiltroStatus("");
  };

  return (
    <div className={styles.container}>
      {/* 1. KPIS DA RELAÇÃO */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}
          >
            <i className="ti ti-users" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.total}</span>
            <span className={styles.statLabel}>Estudantes Filtrados</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}
          >
            <i className="ti ti-check" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.ativos} ({kpis.pctAtivos}%)</span>
            <span className={styles.statLabel}>Matrículas Ativas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}
          >
            <i className="ti ti-arrows-left-right" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.transferidos}</span>
            <span className={styles.statLabel}>Transferências Registradas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}
          >
            <i className="ti ti-user-x" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.inativos}</span>
            <span className={styles.statLabel}>Inativos / Evadidos</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE CABEÇALHO */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-file-text" style={{ color: "#38bdf8" }} />
            Relação Nominal & Movimentação de Alunos
          </div>
          <p className={styles.headerSubtitle}>
            Filtre os dados escolares para emissão de listagens para o Censo Escolar (INEP) e conferência de turmas.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnExport}
            onClick={handleExportCSV}
            title="Exportar planilha compatível com Excel"
          >
            <i className="ti ti-file-spreadsheet" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            className={styles.btnPrint}
            onClick={() => onNavigateTab && onNavigateTab("documentos")}
            title="Gerar documento oficial para impressão"
          >
            <i className="ti ti-printer" />
            <span>Emitir Documento</span>
          </button>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS */}
      <div className={styles.filtersBar}>
        <Input
          placeholder="Buscar por nome, matrícula ou responsável..."
          value={searchNome}
          onChange={(e) => setSearchNome(e.target.value)}
          icon="ti ti-search"
        />

        <Select value={filtroAno} onChange={(e) => setFiltroAno(e.target.value)}>
          <option value="">Todos os Anos</option>
          {(ANOS_LETIVOS || []).map((ano) => (
            <option key={ano} value={ano}>{ano}</option>
          ))}
        </Select>

        <Select value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)}>
          <option value="">Todas as Turmas</option>
          {(turmas || []).map((t) => (
            <option key={t.id} value={t.nome}>{t.nome}</option>
          ))}
        </Select>

        <Select value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value)}>
          <option value="">Todos os Turnos</option>
          {(TURNOS || []).map((turno) => (
            <option key={turno} value={turno}>{turno}</option>
          ))}
        </Select>

        <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todos os Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Transferido">Transferido</option>
          <option value="Inativo">Inativo</option>
          <option value="Concluído">Concluído</option>
        </Select>

        {(searchNome || filtroAno || filtroTurma || filtroTurno || filtroStatus) && (
          <button
            type="button"
            className={styles.btnClearFilters}
            onClick={handleClearFilters}
          >
            <i className="ti ti-x" /> Limpar
          </button>
        )}
      </div>

      {/* 4. TABELA EM DESKTOP */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Estudante</th>
                <th>Matrícula</th>
                <th>Ano / Turma</th>
                <th>Turno</th>
                <th>Responsável / Contato</th>
                <th>Data Nasc.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {alunosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-muted, #94a3b8)" }}>
                    Nenhum aluno encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                alunosFiltrados.map((aluno) => {
                  const initials = (aluno.nome || "AL")
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <tr key={aluno.id}>
                      <td>
                        <div className={styles.alunoNomeCell}>
                          <div className={styles.alunoAvatar}>{initials}</div>
                          <div>
                            <div>{aluno.nome}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)", fontWeight: 400 }}>
                              {aluno.cpf ? `CPF: ${aluno.cpf}` : `ID: ${aluno.id.slice(0, 8)}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code style={{ background: "rgba(255, 255, 255, 0.06)", padding: "2px 6px", borderRadius: 6, fontSize: 11.5 }}>
                          {aluno.matricula || "—"}
                        </code>
                      </td>
                      <td>
                        <strong>{aluno.ano || "—"}</strong> {aluno.turma ? `(${aluno.turma})` : ""}
                      </td>
                      <td>{aluno.turno || "—"}</td>
                      <td>
                        <div>{aluno.responsavelNome || aluno.nomeMae || "—"}</div>
                        {aluno.telefone && (
                          <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                            📞 {aluno.telefone}
                          </div>
                        )}
                      </td>
                      <td>{formatarDataBR(aluno.dataNascimento)}</td>
                      <td>
                        <Badge
                          variant={
                            aluno.status === "Ativo"
                              ? "success"
                              : aluno.status === "Transferido"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {aluno.status || "Ativo"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <span>Exibindo <strong>{alunosFiltrados.length}</strong> de <strong>{alunos.length}</strong> estudantes cadastrados</span>
          <span>Atualizado em tempo real via SIGEM</span>
        </div>
      </div>

      {/* 5. MODO CARDS EM MOBILE */}
      <div className={styles.mobileCards}>
        {alunosFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted, #94a3b8)", background: "var(--bg-card, #1e293b)", borderRadius: 14 }}>
            Nenhum aluno encontrado para os filtros selecionados.
          </div>
        ) : (
          alunosFiltrados.map((aluno) => {
            const initials = (aluno.nome || "AL")
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            return (
              <div key={aluno.id} className={styles.alunoCardMobile}>
                <div className={styles.cardTop}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className={styles.alunoAvatar}>{initials}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#ffffff", fontSize: 14 }}>{aluno.nome}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                        Matrícula: {aluno.matricula || "—"}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      aluno.status === "Ativo"
                        ? "success"
                        : aluno.status === "Transferido"
                        ? "warning"
                        : "danger"
                    }
                  >
                    {aluno.status || "Ativo"}
                  </Badge>
                </div>

                <div className={styles.cardBody}>
                  <span>Ano / Turma: <strong>{aluno.ano || "—"} {aluno.turma ? `(${aluno.turma})` : ""}</strong></span>
                  <span>Turno: <strong>{aluno.turno || "—"}</strong></span>
                  <span>Nascimento: <strong>{formatarDataBR(aluno.dataNascimento)}</strong></span>
                  <span>Contato: <strong>{aluno.telefone || "—"}</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

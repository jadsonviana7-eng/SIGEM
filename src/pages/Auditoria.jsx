import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getAuditoriaLogs,
  inicializarLogsExemploSeVazio,
  MODULOS_AUDITORIA,
  formatarDataHoraLog
} from "../services/auditoriaService";
import { Card, Badge, Btn, Select, Spinner, EmptyState, Modal } from "../components/ui";

export default function Auditoria() {
  const { user, escolas } = useAuth();
  const activeEscolaId = user?.selectedEscolaId || "";
  const escolaAtual = useMemo(() => {
    return (escolas || []).find((e) => e.id === activeEscolaId) || {
      nome: "Rede Municipal de Ensino de Mundaú",
      municipio: "Santana do Mundaú",
      uf: "AL"
    };
  }, [escolas, activeEscolaId]);

  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("Todos");
  const [usuarioFiltro, setUsuarioFiltro] = useState("Todos");
  const [periodoFiltro, setPeriodoFiltro] = useState("Todos");
  const [visao, setVisao] = useState("tabela"); // "tabela" ou "feed"
  const [logSelecionado, setLogSelecionado] = useState(null);
  const [modalImprimirAberto, setModalImprimirAberto] = useState(false);

  const carregarLogs = useCallback(async () => {
    setCarregando(true);
    try {
      let lista = await getAuditoriaLogs({ escolaId: activeEscolaId });
      if (lista.length === 0) {
        lista = await inicializarLogsExemploSeVazio(activeEscolaId, escolaAtual.nome);
      }
      setLogs(lista);
    } catch (err) {
      console.error("Erro ao carregar logs:", err);
    } finally {
      setCarregando(false);
    }
  }, [activeEscolaId, escolaAtual.nome]);

  useEffect(() => {
    carregarLogs();
  }, [carregarLogs]);

  // Lista única de usuários para o filtro
  const usuariosUnicos = useMemo(() => {
    const map = new Map();
    logs.forEach((l) => {
      if (l.usuarioNome) {
        map.set(l.usuarioNome, {
          nome: l.usuarioNome,
          email: l.usuarioEmail,
          role: l.usuarioRole
        });
      }
    });
    return Array.from(map.values());
  }, [logs]);

  // Filtros combinados
  const logsFiltrados = useMemo(() => {
    const hojeStr = formatarDataHoraLog(new Date()).data;
    const agoraTime = Date.now();

    return logs.filter((l) => {
      // Filtro de Módulo
      if (moduloFiltro !== "Todos" && l.modulo?.toLowerCase() !== moduloFiltro.toLowerCase()) {
        return false;
      }

      // Filtro de Usuário
      if (usuarioFiltro !== "Todos" && l.usuarioNome !== usuarioFiltro) {
        return false;
      }

      // Filtro de Período
      if (periodoFiltro === "Hoje" && l.data !== hojeStr) {
        return false;
      }
      if (periodoFiltro === "7dias") {
        const logTime = new Date(l.criadoEm || 0).getTime();
        if (agoraTime - logTime > 7 * 24 * 60 * 60 * 1000) return false;
      }
      if (periodoFiltro === "30dias") {
        const logTime = new Date(l.criadoEm || 0).getTime();
        if (agoraTime - logTime > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // Filtro de Busca Textual
      if (termoBusca.trim()) {
        const busca = termoBusca.toLowerCase().trim();
        const textoCompleto = `
          ${l.usuarioNome || ""} 
          ${l.usuarioEmail || ""} 
          ${l.entidadeNome || ""} 
          ${l.descricao || ""} 
          ${l.modulo || ""} 
          ${l.registroAnterior || ""} 
          ${l.registroNovo || ""} 
          ${l.dataHoraFormatada || ""}
        `.toLowerCase();

        if (!textoCompleto.includes(busca)) return false;
      }

      return true;
    });
  }, [logs, moduloFiltro, usuarioFiltro, periodoFiltro, termoBusca]);

  // Estatísticas Rápidas
  const totalLogs = logs.length;
  const logsHoje = logs.filter((l) => l.data === formatarDataHoraLog(new Date()).data).length;
  const logsNotas = logs.filter((l) => l.modulo === "Notas").length;
  const logsAlunos = logs.filter((l) => l.modulo === "Alunos" || l.modulo === "Matrículas").length;

  function imprimirRelatorio() {
    window.print();
  }

  const getModuloColor = (mod) => {
    switch (mod) {
      case "Notas":
        return "#a78bfa";
      case "Alunos":
      case "Matrículas":
        return "#60a5fa";
      case "Frequência":
        return "#34d399";
      case "Fechamento":
        return "#fbbf24";
      case "Transferências":
        return "#fb923c";
      case "Servidores":
        return "#38bdf8";
      case "Turmas":
        return "#94a3b8";
      default:
        return "#cbd5e1";
    }
  };

  const getModuloBg = (mod) => {
    switch (mod) {
      case "Notas":
        return "rgba(139, 92, 246, 0.15)";
      case "Alunos":
      case "Matrículas":
        return "rgba(59, 130, 246, 0.15)";
      case "Frequência":
        return "rgba(16, 185, 129, 0.15)";
      case "Fechamento":
        return "rgba(245, 158, 11, 0.15)";
      case "Transferências":
        return "rgba(249, 115, 22, 0.15)";
      case "Servidores":
        return "rgba(14, 165, 233, 0.15)";
      case "Turmas":
        return "rgba(148, 163, 184, 0.15)";
      default:
        return "rgba(255, 255, 255, 0.05)";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Cabeçalho do Módulo */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#ffffff" }}>
              <i className="ti ti-shield-check" style={{ color: "#38bdf8", marginRight: 6 }} />
              LOGs e Auditoria do Sistema
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#93c5fd",
                background: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                padding: "2px 8px",
                borderRadius: 12
              }}
            >
              Módulo Transversal · Rastreabilidade
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
            Registro imutável de quem alterou, o que alterou, data, hora, registro anterior e novo valor.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={carregarLogs} style={{ fontSize: 13 }} title="Recarregar Logs">
            <i className="ti ti-refresh" /> Atualizar
          </Btn>
          <Btn variant="primary" onClick={() => setModalImprimirAberto(true)} style={{ fontSize: 13 }}>
            <i className="ti ti-printer" /> Relatório Oficial
          </Btn>
        </div>
      </div>

      {/* Cards de Métricas / Indicadores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <Card style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "rgba(59, 130, 246, 0.15)",
              color: "#60a5fa",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22
            }}
          >
            <i className="ti ti-history" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#ffffff" }}>{totalLogs}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Total de Operações</div>
          </div>
        </Card>

        <Card style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "rgba(139, 92, 246, 0.15)",
              color: "#a78bfa",
              border: "1px solid rgba(139, 92, 246, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22
            }}
          >
            <i className="ti ti-clipboard-check" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#ffffff" }}>{logsNotas}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Alterações em Notas</div>
          </div>
        </Card>

        <Card style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22
            }}
          >
            <i className="ti ti-user-check" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#ffffff" }}>{logsAlunos}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Alunos / Matrículas</div>
          </div>
        </Card>

        <Card style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "rgba(245, 158, 11, 0.15)",
              color: "#fbbf24",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22
            }}
          >
            <i className="ti ti-clock-hour-4" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#ffffff" }}>{logsHoje}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Registros Hoje</div>
          </div>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          {/* Busca Textual */}
          <div style={{ flex: 2, minWidth: 240 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
              Buscar no Log (Aluno, Usuário, Disciplina ou Ação)
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#243144",
                border: "1px solid #33435c",
                borderRadius: 6,
                padding: "6px 10px"
              }}
            >
              <i className="ti ti-search" style={{ color: "#94a3b8", fontSize: 16 }} />
              <input
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Ex: Maria Santos, João Silva, 7,0, Matemática..."
                style={{ border: "none", background: "none", fontSize: 13, outline: "none", width: "100%", color: "#ffffff" }}
              />
              {termoBusca && (
                <button
                  type="button"
                  onClick={() => setTermoBusca("")}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filtro Módulo */}
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
              Módulo
            </label>
            <Select value={moduloFiltro} onChange={(e) => setModuloFiltro(e.target.value)}>
              <option value="Todos">Todos os Módulos</option>
              {MODULOS_AUDITORIA.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>

          {/* Filtro Usuário */}
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
              Quem alterou (Usuário)
            </label>
            <Select value={usuarioFiltro} onChange={(e) => setUsuarioFiltro(e.target.value)}>
              <option value="Todos">Todos os Usuários</option>
              {usuariosUnicos.map((u) => (
                <option key={u.nome} value={u.nome}>
                  {u.nome} ({u.role || "Operador"})
                </option>
              ))}
            </Select>
          </div>

          {/* Filtro Período */}
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
              Período
            </label>
            <Select value={periodoFiltro} onChange={(e) => setPeriodoFiltro(e.target.value)}>
              <option value="Todos">Todo o Histórico</option>
              <option value="Hoje">Hoje</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
            </Select>
          </div>

          {/* Alternador de Visualização */}
          <div style={{ display: "flex", gap: 4, background: "#243144", padding: 3, borderRadius: 6, border: "1px solid #33435c" }}>
            <button
              type="button"
              onClick={() => setVisao("tabela")}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: visao === "tabela" ? "#33435c" : "transparent",
                color: visao === "tabela" ? "#ffffff" : "#94a3b8",
                boxShadow: visao === "tabela" ? "0 1px 2px rgba(0,0,0,0.2)" : "none"
              }}
            >
              <i className="ti ti-table" style={{ marginRight: 4 }} /> Tabela
            </button>
            <button
              type="button"
              onClick={() => setVisao("feed")}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: visao === "feed" ? "#33435c" : "transparent",
                color: visao === "feed" ? "#ffffff" : "#94a3b8",
                boxShadow: visao === "feed" ? "0 1px 2px rgba(0,0,0,0.2)" : "none"
              }}
            >
              <i className="ti ti-list-details" style={{ marginRight: 4 }} /> Linha do Tempo
            </button>
          </div>
        </div>
      </Card>

      {/* Conteúdo Principal: Tabela ou Linha do Tempo */}
      {carregando ? (
        <Spinner />
      ) : logsFiltrados.length === 0 ? (
        <Card>
          <EmptyState
            icon="shield-search"
            texto="Nenhum registro de auditoria encontrado para os filtros selecionados."
          />
        </Card>
      ) : visao === "tabela" ? (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#243144", borderBottom: "1px solid #33435c" }}>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase" }}>
                    Data & Hora
                  </th>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase" }}>
                    Quem alterou
                  </th>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase" }}>
                    Módulo / O que alterou
                  </th>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase" }}>
                    Registro Anterior
                  </th>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", textAlign: "center" }}>
                    →
                  </th>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase" }}>
                    Registro Novo
                  </th>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", textAlign: "right" }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {logsFiltrados.map((log) => {
                  const modColor = getModuloColor(log.modulo);
                  const modBg = getModuloBg(log.modulo);

                  return (
                    <tr
                      key={log.id}
                      style={{ borderBottom: "1px solid #2c3b52", transition: "background 0.15s" }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Data e Hora */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#f8fafc" }}>{log.data}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 3 }}>
                          <i className="ti ti-clock" style={{ fontSize: 12 }} />
                          {log.hora}
                        </div>
                      </td>

                      {/* Quem alterou */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background: "#243144",
                              border: "1px solid #33435c",
                              color: "#cbd5e1",
                              fontWeight: 700,
                              fontSize: 13,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}
                          >
                            {log.usuarioNome ? log.usuarioNome[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#f8fafc" }}>{log.usuarioNome}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{log.usuarioRole || log.usuarioEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Módulo e O que alterou */}
                      <td style={{ padding: "12px 14px", maxWidth: 260 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: modColor,
                              background: modBg,
                              border: `1px solid ${modColor}33`,
                              padding: "1px 6px",
                              borderRadius: 4,
                              textTransform: "uppercase"
                            }}
                          >
                            {log.modulo}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#cbd5e1", lineHeight: 1.3 }}>
                          {log.entidadeNome || log.descricao}
                        </div>
                        {log.entidadeNome && log.descricao && log.descricao !== log.entidadeNome && (
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{log.descricao}</div>
                        )}
                      </td>

                      {/* Registro Anterior */}
                      <td style={{ padding: "12px 14px" }}>
                        <div
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#f87171",
                            fontWeight: 600,
                            fontSize: 13,
                            fontFamily: log.modulo === "Notas" ? "monospace" : "inherit"
                          }}
                        >
                          {log.registroAnterior || "—"}
                        </div>
                      </td>

                      {/* Seta */}
                      <td style={{ padding: "12px 8px", textAlign: "center", color: "#64748b" }}>
                        <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
                      </td>

                      {/* Registro Novo */}
                      <td style={{ padding: "12px 14px" }}>
                        <div
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: "rgba(16, 185, 129, 0.12)",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            color: "#34d399",
                            fontWeight: 700,
                            fontSize: 13,
                            fontFamily: log.modulo === "Notas" ? "monospace" : "inherit"
                          }}
                        >
                          {log.registroNovo || "—"}
                        </div>
                      </td>

                      {/* Ações */}
                      <td style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          onClick={() => setLogSelecionado(log)}
                          style={{
                            background: "#243144",
                            border: "1px solid #33435c",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#cbd5e1",
                            cursor: "pointer"
                          }}
                          title="Ver detalhes completos do log"
                        >
                          <i className="ti ti-eye" style={{ marginRight: 4 }} /> Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Modo Linha do Tempo / Feed Visual */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {logsFiltrados.map((log) => {
            const modColor = getModuloColor(log.modulo);
            const modBg = getModuloBg(log.modulo);

            return (
              <Card key={log.id} style={{ padding: 16, borderLeft: `4px solid ${modColor}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: modBg,
                        color: modColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 16,
                        flexShrink: 0
                      }}
                    >
                      {log.usuarioNome ? log.usuarioNome[0].toUpperCase() : "U"}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#f8fafc" }}>{log.usuarioNome}</span>
                        <Badge color="blue" style={{ fontSize: 10 }}>
                          {log.usuarioRole || "Operador"}
                        </Badge>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: modColor,
                            background: modBg,
                            padding: "2px 6px",
                            borderRadius: 4
                          }}
                        >
                          {log.modulo}
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4 }}>
                        {log.descricao || `${log.usuarioNome} realizou alteração`}
                      </div>

                      {/* Comparativo Visual Antes → Depois */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 10,
                          marginTop: 10,
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "#243144",
                          border: "1px solid #33435c"
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Anterior:</span>
                        <span
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#f87171",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: 13
                          }}
                        >
                          {log.registroAnterior}
                        </span>
                        <i className="ti ti-arrow-right" style={{ color: "#64748b", fontSize: 14 }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Novo:</span>
                        <span
                          style={{
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "#34d399",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: 13
                          }}
                        >
                          {log.registroNovo}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>
                      <i className="ti ti-calendar" style={{ marginRight: 4, color: "#94a3b8" }} />
                      {log.data}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      <i className="ti ti-clock" style={{ marginRight: 4 }} />
                      {log.hora}
                    </div>
                    <button
                      type="button"
                      onClick={() => setLogSelecionado(log)}
                      style={{
                        marginTop: 8,
                        background: "none",
                        border: "none",
                        color: "#60a5fa",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline"
                      }}
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes do Log */}
      {logSelecionado && (
        <Modal
          titulo="Detalhes do Registro de Auditoria"
          onClose={() => setLogSelecionado(null)}
          onSave={() => setLogSelecionado(null)}
          width={650}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "#243144",
                border: "1px solid #33435c",
                borderRadius: 8,
                padding: 14,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>QUEM ALTEROU</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>{logSelecionado.usuarioNome}</div>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>{logSelecionado.usuarioEmail || "Sem e-mail informado"}</div>
                <div style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600, marginTop: 2 }}>
                  Cargo: {logSelecionado.usuarioRole || "Operador"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>DATA & HORA</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>{logSelecionado.dataHoraFormatada}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  Origem: {logSelecionado.origem || "Portal Web"}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  Escola: {logSelecionado.escolaNome || escolaAtual.nome}
                </div>
              </div>
            </div>

            {/* Quadro Comparativo */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                MODIFICAÇÃO REGISTRADA ({logSelecionado.modulo.toUpperCase()})
              </div>
              <div
                style={{
                  border: "1px solid #33435c",
                  borderRadius: 8,
                  overflow: "hidden"
                }}
              >
                <div style={{ padding: 12, background: "#161f2e", fontWeight: 600, fontSize: 13, color: "#f8fafc" }}>
                  {logSelecionado.entidadeNome || logSelecionado.descricao}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#1e293b" }}>
                  <div style={{ padding: 14, borderRight: "1px solid #33435c", background: "rgba(239, 68, 68, 0.1)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>
                      VALOR ANTERIOR
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fca5a5" }}>
                      {logSelecionado.registroAnterior}
                    </div>
                  </div>
                  <div style={{ padding: 14, background: "rgba(16, 185, 129, 0.1)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#34d399", marginBottom: 4 }}>
                      NOVO VALOR (ATUAL)
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#86efac" }}>
                      {logSelecionado.registroNovo}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadados Técnicos / Hash de Integridade */}
            <div style={{ fontSize: 11, color: "#94a3b8", borderTop: "1px solid #33435c", paddingTop: 8 }}>
              <div>ID do Registro: <code style={{ color: "#cbd5e1", background: "#161f2e", padding: "1px 4px", borderRadius: 4 }}>{logSelecionado.id}</code></div>
              <div style={{ marginTop: 2 }}>Data de Criação ISO: <code style={{ color: "#cbd5e1", background: "#161f2e", padding: "1px 4px", borderRadius: 4 }}>{logSelecionado.criadoEm}</code></div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Impressão de Relatório Oficial de Auditoria */}
      {modalImprimirAberto && (
        <Modal
          titulo="Relatório Oficial de Auditoria & Conformidade"
          onClose={() => setModalImprimirAberto(false)}
          onSave={imprimirRelatorio}
          saveText="Imprimir / Salvar PDF"
          width={800}
        >
          <div id="relatorio-auditoria-impressao" style={{ display: "flex", flexDirection: "column", gap: 16, background: "#ffffff", color: "#1e293b", padding: 24, borderRadius: 8 }}>
            {/* Cabeçalho Oficial */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #1e293b", paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, textTransform: "uppercase", color: "#0f172a" }}>
                Prefeitura Municipal de Santana do Mundaú - AL
              </h3>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                Secretaria Municipal de Educação · SIGEM
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {escolaAtual.nome}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e40af", marginTop: 8 }}>
                RELATÓRIO DE AUDITORIA, RASTREABILIDADE E LOGS DE ALTERAÇÃO
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                Emitido em: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")} · Filtro: {moduloFiltro} · Total: {logsFiltrados.length} registros
              </div>
            </div>

            {/* Tabela Zebrada para Impressão */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginTop: 10 }}>
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>Data/Hora</th>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>Responsável</th>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>Módulo</th>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>Descrição da Alteração</th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>Anterior</th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>Novo</th>
                </tr>
              </thead>
              <tbody>
                {logsFiltrados.map((l, idx) => (
                  <tr key={l.id || idx} style={{ borderBottom: "1px solid #e2e8f0", background: idx % 2 === 0 ? "white" : "#f8fafc" }}>
                    <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>{l.dataHoraFormatada || `${l.data} ${l.hora}`}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <strong>{l.usuarioNome}</strong> ({l.usuarioRole || "Op"})
                    </td>
                    <td style={{ padding: "6px 8px" }}>{l.modulo}</td>
                    <td style={{ padding: "6px 8px" }}>{l.entidadeNome || l.descricao}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center", color: "#991b1b", fontWeight: 600 }}>{l.registroAnterior}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center", color: "#166534", fontWeight: 700 }}>{l.registroNovo}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Rodapé de Validação Institucional */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px dashed #94a3b8", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, textAlign: "center" }}>
              <div>
                <div style={{ borderTop: "1px solid #000", margin: "30px 20px 4px 20px" }} />
                <div style={{ fontSize: 11, fontWeight: 700 }}>Direção Escolar / Secretaria</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>Assinatura e Carimbo</div>
              </div>
              <div>
                <div style={{ borderTop: "1px solid #000", margin: "30px 20px 4px 20px" }} />
                <div style={{ fontSize: 11, fontWeight: 700 }}>Controle Interno Municipal / Auditoria</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>Conformidade Técnica TCE/MEC</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

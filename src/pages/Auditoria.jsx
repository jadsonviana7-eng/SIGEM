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
        return "#7c3aed";
      case "Alunos":
      case "Matrículas":
        return "#2563eb";
      case "Frequência":
        return "#059669";
      case "Fechamento":
        return "#d97706";
      case "Transferências":
        return "#ea580c";
      case "Servidores":
        return "#0891b2";
      case "Turmas":
        return "#4b5563";
      default:
        return "#1f2937";
    }
  };

  const getModuloBg = (mod) => {
    switch (mod) {
      case "Notas":
        return "#f5f3ff";
      case "Alunos":
      case "Matrículas":
        return "#eff6ff";
      case "Frequência":
        return "#ecfdf5";
      case "Fechamento":
        return "#fffbeb";
      case "Transferências":
        return "#fff7ed";
      case "Servidores":
        return "#ecfeff";
      case "Turmas":
        return "#f3f4f6";
      default:
        return "#f9fafb";
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
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827" }}>
              <i className="ti ti-shield-check" style={{ color: "#2563eb", marginRight: 6 }} />
              LOGs e Auditoria do Sistema
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#1e40af",
                background: "#dbeafe",
                padding: "2px 8px",
                borderRadius: 12
              }}
            >
              Módulo Transversal · Rastreabilidade
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
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
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22
            }}
          >
            <i className="ti ti-history" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{totalLogs}</div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Total de Operações</div>
          </div>
        </Card>

        <Card style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#f5f3ff",
              color: "#7c3aed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22
            }}
          >
            <i className="ti ti-clipboard-check" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{logsNotas}</div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Alterações em Notas</div>
          </div>
        </Card>

        <Card style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#ecfdf5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22
            }}
          >
            <i className="ti ti-user-check" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{logsAlunos}</div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Alunos / Matrículas</div>
          </div>
        </Card>

        <Card style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#fffbeb",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22
            }}
          >
            <i className="ti ti-clock-hour-4" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{logsHoje}</div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Registros Hoje</div>
          </div>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          {/* Busca Textual */}
          <div style={{ flex: 2, minWidth: 240 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
              Buscar no Log (Aluno, Usuário, Disciplina ou Ação)
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "white",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "6px 10px"
              }}
            >
              <i className="ti ti-search" style={{ color: "#9ca3af", fontSize: 16 }} />
              <input
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Ex: Maria Santos, João Silva, 7,0, Matemática..."
                style={{ border: "none", background: "none", fontSize: 13, outline: "none", width: "100%" }}
              />
              {termoBusca && (
                <button
                  type="button"
                  onClick={() => setTermoBusca("")}
                  style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 14 }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filtro Módulo */}
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
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
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
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
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
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
          <div style={{ display: "flex", gap: 4, background: "#f3f4f6", padding: 3, borderRadius: 6 }}>
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
                background: visao === "tabela" ? "white" : "transparent",
                color: visao === "tabela" ? "#1f2937" : "#6b7280",
                boxShadow: visao === "tabela" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
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
                background: visao === "feed" ? "white" : "transparent",
                color: visao === "feed" ? "#1f2937" : "#6b7280",
                boxShadow: visao === "feed" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
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
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Data & Hora
                  </th>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Quem alterou
                  </th>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Módulo / O que alterou
                  </th>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Registro Anterior
                  </th>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", textAlign: "center" }}>
                    →
                  </th>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Registro Novo
                  </th>
                  <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", textAlign: "right" }}>
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
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Data e Hora */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{log.data}</div>
                        <div style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 3 }}>
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
                              background: "#e2e8f0",
                              color: "#1e293b",
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
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{log.usuarioNome}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{log.usuarioRole || log.usuarioEmail}</div>
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
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", lineHeight: 1.3 }}>
                          {log.entidadeNome || log.descricao}
                        </div>
                        {log.entidadeNome && log.descricao && log.descricao !== log.entidadeNome && (
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{log.descricao}</div>
                        )}
                      </td>

                      {/* Registro Anterior */}
                      <td style={{ padding: "12px 14px" }}>
                        <div
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#991b1b",
                            fontWeight: 600,
                            fontSize: 13,
                            fontFamily: log.modulo === "Notas" ? "monospace" : "inherit"
                          }}
                        >
                          {log.registroAnterior || "—"}
                        </div>
                      </td>

                      {/* Seta */}
                      <td style={{ padding: "12px 8px", textAlign: "center", color: "#94a3b8" }}>
                        <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
                      </td>

                      {/* Registro Novo */}
                      <td style={{ padding: "12px 14px" }}>
                        <div
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            color: "#166534",
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
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#334155",
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
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{log.usuarioNome}</span>
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

                      <div style={{ fontSize: 13, color: "#334155", marginTop: 4 }}>
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
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0"
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Anterior:</span>
                        <span
                          style={{
                            background: "#fee2e2",
                            color: "#991b1b",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: 13
                          }}
                        >
                          {log.registroAnterior}
                        </span>
                        <i className="ti ti-arrow-right" style={{ color: "#94a3b8", fontSize: 14 }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Novo:</span>
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#166534",
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
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                      <i className="ti ti-calendar" style={{ marginRight: 4, color: "#64748b" }} />
                      {log.data}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
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
                        color: "#2563eb",
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
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 14,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>QUEM ALTEROU</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{logSelecionado.usuarioNome}</div>
                <div style={{ fontSize: 12, color: "#475569" }}>{logSelecionado.usuarioEmail || "Sem e-mail informado"}</div>
                <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 600, marginTop: 2 }}>
                  Cargo: {logSelecionado.usuarioRole || "Operador"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>DATA & HORA</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{logSelecionado.dataHoraFormatada}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Origem: {logSelecionado.origem || "Portal Web"}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  Escola: {logSelecionado.escolaNome || escolaAtual.nome}
                </div>
              </div>
            </div>

            {/* Quadro Comparativo */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                MODIFICAÇÃO REGISTRADA ({logSelecionado.modulo.toUpperCase()})
              </div>
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  overflow: "hidden"
                }}
              >
                <div style={{ padding: 12, background: "#f1f5f9", fontWeight: 600, fontSize: 13, color: "#1e293b" }}>
                  {logSelecionado.entidadeNome || logSelecionado.descricao}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "white" }}>
                  <div style={{ padding: 14, borderRight: "1px solid #e2e8f0", background: "#fef2f2" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", marginBottom: 4 }}>
                      VALOR ANTERIOR
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#b91c1c" }}>
                      {logSelecionado.registroAnterior}
                    </div>
                  </div>
                  <div style={{ padding: 14, background: "#f0fdf4" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 4 }}>
                      NOVO VALOR (ATUAL)
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#15803d" }}>
                      {logSelecionado.registroNovo}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadados Técnicos / Hash de Integridade */}
            <div style={{ fontSize: 11, color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: 8 }}>
              <div>ID do Registro: <code>{logSelecionado.id}</code></div>
              <div>Data de Criação ISO: <code>{logSelecionado.criadoEm}</code></div>
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
          <div id="relatorio-auditoria-impressao" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

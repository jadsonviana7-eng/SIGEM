import { useState, useMemo } from "react";
import {
  aprovarMatriculaOnline,
  indeferirMatriculaOnline,
  solicitarCorrecaoMatriculaOnline,
  injectSolicitacoesMockData
} from "../../../services/matriculaOnlineService";
import { Btn, Modal, Select, Input, Alert } from "../../../components/ui";

export default function SolicitacoesMatriculaOnline({
  solicitacoes = [],
  turmas = [],
  alunos = [],
  escolaId,
  usuario,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Pendente"); // 'Pendente', 'Aprovada', 'Aguardando Correção', 'Indeferida', 'Todos'
  const [filtroSerie, setFiltroSerie] = useState("");

  // Modal de Análise
  const [solicitacaoAnalise, setSolicitacaoAnalise] = useState(null);
  const [acaoTipo, setAcaoTipo] = useState("aprovar"); // 'aprovar', 'correcao', 'indeferir'
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [motivoTexto, setMotivoTexto] = useState("");
  const [processando, setProcessando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState("");
  const [erroMsg, setErroMsg] = useState("");

  const [gerandoMock, setGerandoMock] = useState(false);

  // Filtros
  const solicitacoesFiltradas = useMemo(() => {
    return solicitacoes.filter(s => {
      const matchBusca =
        (s.alunoNome || "").toLowerCase().includes(busca.toLowerCase()) ||
        (s.protocolo || "").toLowerCase().includes(busca.toLowerCase()) ||
        (s.responsavelNome || "").toLowerCase().includes(busca.toLowerCase());
      const matchStatus = filtroStatus === "Todos" ? true : s.status === filtroStatus;
      const matchSerie = !filtroSerie || s.serieAno === filtroSerie;
      return matchBusca && matchStatus && matchSerie;
    });
  }, [solicitacoes, busca, filtroStatus, filtroSerie]);

  // Contadores
  const contadores = useMemo(() => {
    const pendentes = solicitacoes.filter(s => s.status === "Pendente").length;
    const aprovadas = solicitacoes.filter(s => s.status === "Aprovada").length;
    const correcao = solicitacoes.filter(s => s.status === "Aguardando Correção").length;
    const indeferidas = solicitacoes.filter(s => s.status === "Indeferida").length;
    return { pendentes, aprovadas, correcao, indeferidas, total: solicitacoes.length };
  }, [solicitacoes]);

  // Abrir Modal de Análise
  const handleAbrirAnalise = (sol, tipo = "aprovar") => {
    setSolicitacaoAnalise(sol);
    setAcaoTipo(tipo);
    setMotivoTexto("");
    setErroMsg("");
    setSucessoMsg("");

    // Tentar sugerir uma turma correspondente à série solicitada
    const turmaSugerida = turmas.find(t =>
      (t.nome || "").toLowerCase().includes((sol.serieAno || "").toLowerCase().slice(0, 3))
    );
    setTurmaSelecionada(turmaSugerida?.nome || (turmas[0]?.nome || ""));
  };

  // Executar Aprovação / Indeferimento
  const handleExecutarAcao = async () => {
    if (!solicitacaoAnalise) return;
    setProcessando(true);
    setErroMsg("");
    setSucessoMsg("");

    try {
      if (acaoTipo === "aprovar") {
        if (!turmaSelecionada) {
          throw new Error("Selecione a turma para enturmação do estudante.");
        }
        const turmaObj = turmas.find(t => t.nome === turmaSelecionada);
        const dadosAprovacao = {
          turmaNome: turmaSelecionada,
          turno: turmaObj?.turno || solicitacaoAnalise.serieTurno || "Matutino",
          anoEscolar: turmaObj?.ano || solicitacaoAnalise.serieAno || "1º Ano"
        };
        const res = await aprovarMatriculaOnline(solicitacaoAnalise.id, dadosAprovacao, escolaId, usuario);
        setSucessoMsg(`Matrícula Aprovada com sucesso! Aluno cadastrado com Matrícula nº ${res.matriculaOficial} na turma ${res.turma}.`);
      } else if (acaoTipo === "indeferir") {
        if (!motivoTexto.trim()) {
          throw new Error("Informe o motivo do indeferimento da solicitação.");
        }
        await indeferirMatriculaOnline(solicitacaoAnalise.id, motivoTexto, usuario);
        setSucessoMsg("Solicitação indeferida com justificativa registrada.");
      } else if (acaoTipo === "correcao") {
        if (!motivoTexto.trim()) {
          throw new Error("Descreva a pendência documental ou correção necessária.");
        }
        await solicitarCorrecaoMatriculaOnline(solicitacaoAnalise.id, motivoTexto, usuario);
        setSucessoMsg("Status atualizado para 'Aguardando Correção'.");
      }

      await onReload();
      setTimeout(() => {
        setSolicitacaoAnalise(null);
        setSucessoMsg("");
      }, 1500);
    } catch (err) {
      setErroMsg(err.message);
    } finally {
      setProcessando(false);
    }
  };

  const handleInjetarMock = async () => {
    if (!window.confirm("Deseja gerar solicitações de teste para análise da Secretaria?")) return;
    setGerandoMock(true);
    try {
      await injectSolicitacoesMockData(escolaId);
      await onReload();
    } catch (e) {
      alert("Erro ao injetar dados: " + e.message);
    } finally {
      setGerandoMock(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* CABEÇALHO & CARDS DE RESUMO */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 14
      }}>
        <div
          onClick={() => setFiltroStatus("Pendente")}
          style={{
            background: filtroStatus === "Pendente" ? "rgba(251, 191, 36, 0.15)" : "#1e293b",
            border: filtroStatus === "Pendente" ? "2px solid #fbbf24" : "1px solid #2c3b52",
            borderRadius: 12,
            padding: "16px 18px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase" }}>
              🟡 Pendentes de Análise
            </span>
            <i className="ti ti-clock" style={{ fontSize: 18, color: "#fbbf24" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fbbf24", marginTop: 4 }}>
            {contadores.pendentes}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Aguardando deferimento</div>
        </div>

        <div
          onClick={() => setFiltroStatus("Aprovada")}
          style={{
            background: filtroStatus === "Aprovada" ? "rgba(52, 211, 153, 0.15)" : "#1e293b",
            border: filtroStatus === "Aprovada" ? "2px solid #34d399" : "1px solid #2c3b52",
            borderRadius: 12,
            padding: "16px 18px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#34d399", textTransform: "uppercase" }}>
              🟢 Matrículas Aprovadas
            </span>
            <i className="ti ti-check" style={{ fontSize: 18, color: "#34d399" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#34d399", marginTop: 4 }}>
            {contadores.aprovadas}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Efetivadas no SIGEM</div>
        </div>

        <div
          onClick={() => setFiltroStatus("Aguardando Correção")}
          style={{
            background: filtroStatus === "Aguardando Correção" ? "rgba(56, 189, 248, 0.15)" : "#1e293b",
            border: filtroStatus === "Aguardando Correção" ? "2px solid #38bdf8" : "1px solid #2c3b52",
            borderRadius: 12,
            padding: "16px 18px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase" }}>
              🔵 Aguardando Correção
            </span>
            <i className="ti ti-file-alert" style={{ fontSize: 18, color: "#38bdf8" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#38bdf8", marginTop: 4 }}>
            {contadores.correcao}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Pendência de documentos</div>
        </div>

        <div
          onClick={() => setFiltroStatus("Indeferida")}
          style={{
            background: filtroStatus === "Indeferida" ? "rgba(248, 113, 113, 0.15)" : "#1e293b",
            border: filtroStatus === "Indeferida" ? "2px solid #f87171" : "1px solid #2c3b52",
            borderRadius: 12,
            padding: "16px 18px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#f87171", textTransform: "uppercase" }}>
              🔴 Indeferidas
            </span>
            <i className="ti ti-x" style={{ fontSize: 18, color: "#f87171" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#f87171", marginTop: 4 }}>
            {contadores.indeferidas}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Sem vaga ou recusa</div>
        </div>
      </div>

      {/* BARRA DE AÇÕES E FILTROS */}
      <div style={{
        background: "#1e293b",
        borderRadius: 14,
        padding: "16px 20px",
        border: "1px solid #2c3b52",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12
      }}>
        <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 280 }}>
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Buscar por aluno, protocolo ou responsável..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              icon="ti ti-search"
            />
          </div>
          <Select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            style={{ width: 180 }}
          >
            <option value="Todos">Todos os Status</option>
            <option value="Pendente">🟡 Pendentes</option>
            <option value="Aprovada">🟢 Aprovadas</option>
            <option value="Aguardando Correção">🔵 Com Pendência</option>
            <option value="Indeferida">🔴 Indeferidas</option>
          </Select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {solicitacoes.length === 0 && (
            <Btn onClick={handleInjetarMock} disabled={gerandoMock} style={{ fontSize: 12 }}>
              <i className="ti ti-database-import" />
              {gerandoMock ? "Gerando..." : "Gerar Exemplos de Solicitação"}
            </Btn>
          )}

          <a
            href="/solicitar-matricula"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              background: "rgba(59, 130, 246, 0.15)",
              color: "#93c5fd",
              border: "1px solid #2c3b52",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease"
            }}
          >
            <i className="ti ti-external-link" />
            Portal do Responsável
          </a>
        </div>
      </div>

      {/* TABELA DE SOLICITAÇÕES */}
      <div style={{
        background: "#1e293b",
        borderRadius: 14,
        border: "1px solid #2c3b52",
        overflow: "hidden"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(36, 49, 68, 0.6)", borderBottom: "1px solid #2c3b52", color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "12px 16px" }}>Protocolo / Data</th>
                <th style={{ padding: "12px 16px" }}>Estudante</th>
                <th style={{ padding: "12px 16px" }}>Responsável Legal</th>
                <th style={{ padding: "12px 16px" }}>Série & Turno Desejado</th>
                <th style={{ padding: "12px 16px" }}>Documentos</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {solicitacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                    Nenhuma solicitação de matrícula encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                solicitacoesFiltradas.map((sol) => (
                  <tr
                    key={sol.id}
                    style={{
                      borderBottom: "1px solid #2c3b52",
                      transition: "background 0.15s ease"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#60a5fa", fontFamily: "monospace", fontSize: 13 }}>
                        {sol.protocolo}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {sol.criadoEm ? new Date(sol.criadoEm).toLocaleString("pt-BR") : "Recente"}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#ffffff" }}>{sol.alunoNome}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {sol.alunoDataNasc ? `Nasc: ${sol.alunoDataNasc}` : ""} {sol.alunoPcd ? "· ♿ PCD/TEA" : ""}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#cbd5e1" }}>{sol.responsavelNome}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {sol.responsavelParentesco} · {sol.responsavelTelefone}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#ffffff" }}>{sol.serieAno}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Turno: {sol.serieTurno}</div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        fontSize: 11,
                        padding: "3px 8px",
                        borderRadius: 8,
                        background: "#243144",
                        color: "#cbd5e1",
                        fontWeight: 600,
                        border: "1px solid #33435c"
                      }}>
                        {sol.documentos?.length || 0} doc(s) anexados
                      </span>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      {sol.status === "Pendente" && (
                        <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", border: "1px solid rgba(251, 191, 36, 0.3)" }}>
                          🟡 Pendente
                        </span>
                      )}
                      {sol.status === "Aprovada" && (
                        <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: "rgba(52, 211, 153, 0.15)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.3)" }}>
                          🟢 Aprovada
                        </span>
                      )}
                      {sol.status === "Aguardando Correção" && (
                        <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                          🔵 Pendência
                        </span>
                      )}
                      {sol.status === "Indeferida" && (
                        <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: "rgba(248, 113, 113, 0.15)", color: "#f87171", border: "1px solid rgba(248, 113, 113, 0.3)" }}>
                          🔴 Indeferida
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                        <Btn
                          size="sm"
                          variant="primary"
                          onClick={() => handleAbrirAnalise(sol, "aprovar")}
                          title="Analisar e Deferir"
                        >
                          <i className="ti ti-clipboard-check" />
                          {sol.status === "Pendente" ? "Analisar" : "Ver Detalhes"}
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ANÁLISE, APROVAÇÃO E ENTURMAÇÃO */}
      {solicitacaoAnalise && (
        <Modal
          isOpen={!!solicitacaoAnalise}
          titulo={`Análise de Solicitação: ${solicitacaoAnalise.protocolo}`}
          onClose={() => setSolicitacaoAnalise(null)}
          width={700}
          esconderRodape
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sucessoMsg && <Alert tipo="success">{sucessoMsg}</Alert>}
            {erroMsg && <Alert tipo="error">{erroMsg}</Alert>}

            {/* Resumo da Solicitação */}
            <div style={{
              background: "#161f2e",
              borderRadius: 12,
              padding: 16,
              border: "1px solid #2c3b52",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              fontSize: 13
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8" }}>Aluno</span>
                <div style={{ fontWeight: 800, color: "#ffffff" }}>{solicitacaoAnalise.alunoNome}</div>
                <div style={{ color: "#cbd5e1", fontSize: 12 }}>
                  Nasc: {solicitacaoAnalise.alunoDataNasc} · Sexo: {solicitacaoAnalise.alunoSexo} · Cor: {solicitacaoAnalise.alunoCorRaca}
                </div>
                {solicitacaoAnalise.alunoPcd && (
                  <div style={{ color: "#fbbf24", fontWeight: 600, fontSize: 12, marginTop: 4 }}>
                    ♿ Necessidade Especial: {solicitacaoAnalise.alunoTipoPcd || "Sim"}
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8" }}>Responsável Legal</span>
                <div style={{ fontWeight: 700, color: "#ffffff" }}>{solicitacaoAnalise.responsavelNome} ({solicitacaoAnalise.responsavelParentesco})</div>
                <div style={{ color: "#cbd5e1", fontSize: 12 }}>
                  CPF: {solicitacaoAnalise.responsavelCpf || "Não informado"} · Tel: {solicitacaoAnalise.responsavelTelefone}
                </div>
              </div>

              <div style={{ gridColumn: "span 2", borderTop: "1px solid #2c3b52", paddingTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8" }}>Endereço Residencial</span>
                <div style={{ color: "#cbd5e1" }}>
                  {solicitacaoAnalise.enderecoRua}, {solicitacaoAnalise.enderecoNumero} - {solicitacaoAnalise.enderecoBairro}, {solicitacaoAnalise.enderecoCidade}/{solicitacaoAnalise.enderecoUf}
                </div>
              </div>

              <div style={{ gridColumn: "span 2", borderTop: "1px solid #2c3b52", paddingTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8" }}>Série Solicitada</span>
                <div style={{ fontWeight: 700, color: "#60a5fa" }}>
                  {solicitacaoAnalise.serieAno} (Turno: {solicitacaoAnalise.serieTurno})
                </div>
              </div>
            </div>

            {/* Documentos Anexados */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", margin: "0 0 8px" }}>
                Documentos Enviados pelo Responsável:
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(solicitacaoAnalise.documentos || []).map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#243144",
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      border: "1px solid #33435c",
                      color: "#cbd5e1"
                    }}
                  >
                    <i className="ti ti-file-text" style={{ color: "#60a5fa" }} />
                    <span><strong>{doc.tipo}:</strong> {doc.nomeArquivo}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Seletor de Ação da Secretaria */}
            {solicitacaoAnalise.status === "Pendente" || solicitacaoAnalise.status === "Aguardando Correção" ? (
              <div style={{ borderTop: "1px solid #2c3b52", paddingTop: 14 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <button
                    type="button"
                    onClick={() => setAcaoTipo("aprovar")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: acaoTipo === "aprovar" ? "2px solid #34d399" : "1px solid #2c3b52",
                      background: acaoTipo === "aprovar" ? "rgba(52, 211, 153, 0.15)" : "#161f2e",
                      color: acaoTipo === "aprovar" ? "#34d399" : "#cbd5e1",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 13,
                      transition: "all 0.15s ease"
                    }}
                  >
                    <i className="ti ti-check" /> 1. Aprovar & Efetivar
                  </button>

                  <button
                    type="button"
                    onClick={() => setAcaoTipo("correcao")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: acaoTipo === "correcao" ? "2px solid #38bdf8" : "1px solid #2c3b52",
                      background: acaoTipo === "correcao" ? "rgba(56, 189, 248, 0.15)" : "#161f2e",
                      color: acaoTipo === "correcao" ? "#38bdf8" : "#cbd5e1",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 13,
                      transition: "all 0.15s ease"
                    }}
                  >
                    <i className="ti ti-file-alert" /> 2. Solicitar Correção
                  </button>

                  <button
                    type="button"
                    onClick={() => setAcaoTipo("indeferir")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: acaoTipo === "indeferir" ? "2px solid #f87171" : "1px solid #2c3b52",
                      background: acaoTipo === "indeferir" ? "rgba(248, 113, 113, 0.15)" : "#161f2e",
                      color: acaoTipo === "indeferir" ? "#f87171" : "#cbd5e1",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 13,
                      transition: "all 0.15s ease"
                    }}
                  >
                    <i className="ti ti-x" /> 3. Indeferir
                  </button>
                </div>

                {acaoTipo === "aprovar" && (
                  <div style={{ background: "rgba(52, 211, 153, 0.1)", padding: 14, borderRadius: 10, border: "1px solid rgba(52, 211, 153, 0.3)" }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#34d399", display: "block", marginBottom: 6 }}>
                      Selecione a Turma da Escola para Enturmação do Estudante:
                    </label>
                    <Select
                      value={turmaSelecionada}
                      onChange={(e) => setTurmaSelecionada(e.target.value)}
                    >
                      {turmas.map(t => {
                        const matriculados = (alunos || []).filter(a => a.turma === t.nome && a.status === "Ativo").length;
                        const vagasTotal = Number(t.vagas) || 30;
                        const disponiveis = Math.max(0, vagasTotal - matriculados);
                        return (
                          <option key={t.id || t.nome} value={t.nome}>
                            {t.nome} ({t.turno}) · {disponiveis} vagas livres (Capacidade: {vagasTotal})
                          </option>
                        );
                      })}
                    </Select>
                    <p style={{ fontSize: 12, color: "#a7f3d0", margin: "6px 0 0" }}>
                      Ao aprovar, o estudante será cadastrado automaticamente como Aluno Ativo com geração do número oficial de matrícula.
                    </p>
                  </div>
                )}

                {acaoTipo === "correcao" && (
                  <div style={{ background: "rgba(56, 189, 248, 0.1)", padding: 14, borderRadius: 10, border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", display: "block", marginBottom: 6 }}>
                      Descreva o documento faltante ou instrução para o Responsável:
                    </label>
                    <textarea
                      rows={3}
                      value={motivoTexto}
                      onChange={(e) => setMotivoTexto(e.target.value)}
                      placeholder="Ex: Favor anexar o Cartão de Vacinação legível e o comprovante de residência atualizado..."
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #33435c",
                        background: "#161f2e",
                        color: "#ffffff",
                        fontSize: 13,
                        boxSizing: "border-box",
                        outline: "none"
                      }}
                    />
                  </div>
                )}

                {acaoTipo === "indeferir" && (
                  <div style={{ background: "rgba(248, 113, 113, 0.1)", padding: 14, borderRadius: 10, border: "1px solid rgba(248, 113, 113, 0.3)" }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#f87171", display: "block", marginBottom: 6 }}>
                      Justificativa do Indeferimento:
                    </label>
                    <textarea
                      rows={3}
                      value={motivoTexto}
                      onChange={(e) => setMotivoTexto(e.target.value)}
                      placeholder="Ex: Ausência de vagas disponíveis na série solicitada nesta unidade escolar..."
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #33435c",
                        background: "#161f2e",
                        color: "#ffffff",
                        fontSize: 13,
                        boxSizing: "border-box",
                        outline: "none"
                      }}
                    />
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                  <Btn onClick={() => setSolicitacaoAnalise(null)}>
                    Cancelar
                  </Btn>
                  <Btn
                    variant={acaoTipo === "aprovar" ? "primary" : acaoTipo === "indeferir" ? "danger" : "default"}
                    onClick={handleExecutarAcao}
                    disabled={processando}
                  >
                    {processando ? "Processando..." : (
                      acaoTipo === "aprovar" ? "Confirmar Aprovação & Matrícula" :
                      acaoTipo === "indeferir" ? "Confirmar Indeferimento" : "Salvar Pendência"
                    )}
                  </Btn>
                </div>
              </div>
            ) : (
              <div style={{
                background: solicitacaoAnalise.status === "Aprovada" ? "rgba(52, 211, 153, 0.1)" : "rgba(248, 113, 113, 0.1)",
                padding: 14,
                borderRadius: 10,
                border: `1px solid ${solicitacaoAnalise.status === "Aprovada" ? "rgba(52, 211, 153, 0.3)" : "rgba(248, 113, 113, 0.3)"}`
              }}>
                <div style={{ fontWeight: 700, color: solicitacaoAnalise.status === "Aprovada" ? "#34d399" : "#f87171" }}>
                  Status: {solicitacaoAnalise.status}
                </div>
                {solicitacaoAnalise.matriculaOficial && (
                  <div style={{ fontSize: 13, color: "#34d399", marginTop: 4 }}>
                    Estudante matriculado sob o número <strong>{solicitacaoAnalise.matriculaOficial}</strong> na turma <strong>{solicitacaoAnalise.turmaAprovada}</strong>.
                  </div>
                )}
                {solicitacaoAnalise.motivoIndeferimento && (
                  <div style={{ fontSize: 13, color: "#f87171", marginTop: 4 }}>
                    Motivo: {solicitacaoAnalise.motivoIndeferimento}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

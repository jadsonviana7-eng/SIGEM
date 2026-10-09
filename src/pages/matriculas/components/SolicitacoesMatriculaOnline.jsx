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
            background: filtroStatus === "Pendente" ? "#fef9c3" : "white",
            border: filtroStatus === "Pendente" ? "2px solid #ca8a04" : "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "16px 18px",
            cursor: "pointer",
            transition: "all 0.15s",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#854d0e", textTransform: "uppercase" }}>
              🟡 Pendentes de Análise
            </span>
            <i className="ti ti-clock" style={{ fontSize: 18, color: "#ca8a04" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#854d0e", marginTop: 4 }}>
            {contadores.pendentes}
          </div>
          <div style={{ fontSize: 11, color: "#a16207", marginTop: 2 }}>Aguardando deferimento</div>
        </div>

        <div
          onClick={() => setFiltroStatus("Aprovada")}
          style={{
            background: filtroStatus === "Aprovada" ? "#dcfce7" : "white",
            border: filtroStatus === "Aprovada" ? "2px solid #16a34a" : "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "16px 18px",
            cursor: "pointer",
            transition: "all 0.15s",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
              🟢 Matrículas Aprovadas
            </span>
            <i className="ti ti-check" style={{ fontSize: 18, color: "#16a34a" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#166534", marginTop: 4 }}>
            {contadores.aprovadas}
          </div>
          <div style={{ fontSize: 11, color: "#15803d", marginTop: 2 }}>Efetivadas no SIGEM</div>
        </div>

        <div
          onClick={() => setFiltroStatus("Aguardando Correção")}
          style={{
            background: filtroStatus === "Aguardando Correção" ? "#e0f2fe" : "white",
            border: filtroStatus === "Aguardando Correção" ? "2px solid #0284c7" : "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "16px 18px",
            cursor: "pointer",
            transition: "all 0.15s",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#075985", textTransform: "uppercase" }}>
              🔵 Aguardando Correção
            </span>
            <i className="ti ti-file-alert" style={{ fontSize: 18, color: "#0284c7" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#075985", marginTop: 4 }}>
            {contadores.correcao}
          </div>
          <div style={{ fontSize: 11, color: "#0369a1", marginTop: 2 }}>Pendência de documentos</div>
        </div>

        <div
          onClick={() => setFiltroStatus("Indeferida")}
          style={{
            background: filtroStatus === "Indeferida" ? "#fee2e2" : "white",
            border: filtroStatus === "Indeferida" ? "2px solid #dc2626" : "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "16px 18px",
            cursor: "pointer",
            transition: "all 0.15s",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", textTransform: "uppercase" }}>
              🔴 Indeferidas
            </span>
            <i className="ti ti-x" style={{ fontSize: 18, color: "#dc2626" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#991b1b", marginTop: 4 }}>
            {contadores.indeferidas}
          </div>
          <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 2 }}>Sem vaga ou recusa</div>
        </div>
      </div>

      {/* BARRA DE AÇÕES E FILTROS */}
      <div style={{
        background: "white",
        borderRadius: 14,
        padding: "16px 20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
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
              borderRadius: 6,
              background: "#1e40af",
              color: "white",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <i className="ti ti-external-link" />
            Portal do Responsável
          </a>
        </div>
      </div>

      {/* TABELA DE SOLICITAÇÕES */}
      <div style={{
        background: "white",
        borderRadius: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        overflow: "hidden"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>
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
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"}
                    onMouseOut={(e) => e.currentTarget.style.background = "white"}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#1e40af", fontFamily: "monospace", fontSize: 13 }}>
                        {sol.protocolo}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {sol.criadoEm ? new Date(sol.criadoEm).toLocaleString("pt-BR") : "Recente"}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{sol.alunoNome}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {sol.alunoDataNasc ? `Nasc: ${sol.alunoDataNasc}` : ""} {sol.alunoPcd ? "· ♿ PCD/TEA" : ""}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#334155" }}>{sol.responsavelNome}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {sol.responsavelParentesco} · {sol.responsavelTelefone}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{sol.serieAno}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Turno: {sol.serieTurno}</div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 8,
                        background: "#f1f5f9",
                        color: "#475569",
                        fontWeight: 600
                      }}>
                        {sol.documentos?.length || 0} doc(s) anexados
                      </span>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      {sol.status === "Pendente" && (
                        <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: "#fef9c3", color: "#854d0e" }}>
                          🟡 Pendente
                        </span>
                      )}
                      {sol.status === "Aprovada" && (
                        <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#166534" }}>
                          🟢 Aprovada
                        </span>
                      )}
                      {sol.status === "Aguardando Correção" && (
                        <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: "#e0f2fe", color: "#0369a1" }}>
                          🔵 Pendência
                        </span>
                      )}
                      {sol.status === "Indeferida" && (
                        <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: "#fee2e2", color: "#991b1b" }}>
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
              background: "#f8fafc",
              borderRadius: 12,
              padding: 16,
              border: "1px solid #e2e8f0",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              fontSize: 13
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Aluno</span>
                <div style={{ fontWeight: 800, color: "#0f172a" }}>{solicitacaoAnalise.alunoNome}</div>
                <div style={{ color: "#475569", fontSize: 12 }}>
                  Nasc: {solicitacaoAnalise.alunoDataNasc} · Sexo: {solicitacaoAnalise.alunoSexo} · Cor: {solicitacaoAnalise.alunoCorRaca}
                </div>
                {solicitacaoAnalise.alunoPcd && (
                  <div style={{ color: "#b45309", fontWeight: 600, fontSize: 12, marginTop: 4 }}>
                    ♿ Necessidade Especial: {solicitacaoAnalise.alunoTipoPcd || "Sim"}
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Responsável Legal</span>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>{solicitacaoAnalise.responsavelNome} ({solicitacaoAnalise.responsavelParentesco})</div>
                <div style={{ color: "#475569", fontSize: 12 }}>
                  CPF: {solicitacaoAnalise.responsavelCpf || "Não informado"} · Tel: {solicitacaoAnalise.responsavelTelefone}
                </div>
              </div>

              <div style={{ gridColumn: "span 2", borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Endereço Residencial</span>
                <div style={{ color: "#334155" }}>
                  {solicitacaoAnalise.enderecoRua}, {solicitacaoAnalise.enderecoNumero} - {solicitacaoAnalise.enderecoBairro}, {solicitacaoAnalise.enderecoCidade}/{solicitacaoAnalise.enderecoUf}
                </div>
              </div>

              <div style={{ gridColumn: "span 2", borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Série Solicitada</span>
                <div style={{ fontWeight: 700, color: "#1d4ed8" }}>
                  {solicitacaoAnalise.serieAno} (Turno: {solicitacaoAnalise.serieTurno})
                </div>
              </div>
            </div>

            {/* Documentos Anexados */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: "0 0 8px" }}>
                Documentos Enviados pelo Responsável:
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(solicitacaoAnalise.documentos || []).map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#f1f5f9",
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      border: "1px solid #e2e8f0"
                    }}
                  >
                    <i className="ti ti-file-text" style={{ color: "#3b82f6" }} />
                    <span><strong>{doc.tipo}:</strong> {doc.nomeArquivo}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Seletor de Ação da Secretaria */}
            {solicitacaoAnalise.status === "Pendente" || solicitacaoAnalise.status === "Aguardando Correção" ? (
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <button
                    type="button"
                    onClick={() => setAcaoTipo("aprovar")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: acaoTipo === "aprovar" ? "2px solid #16a34a" : "1px solid #e2e8f0",
                      background: acaoTipo === "aprovar" ? "#dcfce7" : "white",
                      color: acaoTipo === "aprovar" ? "#166534" : "#475569",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 13
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
                      border: acaoTipo === "correcao" ? "2px solid #0284c7" : "1px solid #e2e8f0",
                      background: acaoTipo === "correcao" ? "#e0f2fe" : "white",
                      color: acaoTipo === "correcao" ? "#0369a1" : "#475569",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 13
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
                      border: acaoTipo === "indeferir" ? "2px solid #dc2626" : "1px solid #e2e8f0",
                      background: acaoTipo === "indeferir" ? "#fee2e2" : "white",
                      color: acaoTipo === "indeferir" ? "#991b1b" : "#475569",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 13
                    }}
                  >
                    <i className="ti ti-x" /> 3. Indeferir
                  </button>
                </div>

                {acaoTipo === "aprovar" && (
                  <div style={{ background: "#f0fdf4", padding: 14, borderRadius: 10, border: "1px solid #bbf7d0" }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#166534", display: "block", marginBottom: 6 }}>
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
                    <p style={{ fontSize: 12, color: "#15803d", margin: "6px 0 0" }}>
                      Ao aprovar, o estudante será cadastrado automaticamente como Aluno Ativo com geração do número oficial de matrícula.
                    </p>
                  </div>
                )}

                {acaoTipo === "correcao" && (
                  <div style={{ background: "#f0f9ff", padding: 14, borderRadius: 10, border: "1px solid #bae6fd" }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", display: "block", marginBottom: 6 }}>
                      Descreva o documento faltante ou instrução para o Responsável:
                    </label>
                    <textarea
                      rows={3}
                      value={motivoTexto}
                      onChange={(e) => setMotivoTexto(e.target.value)}
                      placeholder="Ex: Favor anexar o Cartão de Vacinação legível e o comprovante de residência atualizado..."
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #7dd3fc",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                )}

                {acaoTipo === "indeferir" && (
                  <div style={{ background: "#fef2f2", padding: 14, borderRadius: 10, border: "1px solid #fecaca" }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#991b1b", display: "block", marginBottom: 6 }}>
                      Justificativa do Indeferimento:
                    </label>
                    <textarea
                      rows={3}
                      value={motivoTexto}
                      onChange={(e) => setMotivoTexto(e.target.value)}
                      placeholder="Ex: Ausência de vagas disponíveis na série solicitada nesta unidade escolar..."
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #fca5a5",
                        fontSize: 13,
                        boxSizing: "border-box"
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
                background: solicitacaoAnalise.status === "Aprovada" ? "#ecfdf5" : "#fef2f2",
                padding: 14,
                borderRadius: 10,
                border: `1px solid ${solicitacaoAnalise.status === "Aprovada" ? "#a7f3d0" : "#fecaca"}`
              }}>
                <div style={{ fontWeight: 700, color: solicitacaoAnalise.status === "Aprovada" ? "#065f46" : "#991b1b" }}>
                  Status: {solicitacaoAnalise.status}
                </div>
                {solicitacaoAnalise.matriculaOficial && (
                  <div style={{ fontSize: 13, color: "#047857", marginTop: 4 }}>
                    Estudante matriculado sob o número <strong>{solicitacaoAnalise.matriculaOficial}</strong> na turma <strong>{solicitacaoAnalise.turmaAprovada}</strong>.
                  </div>
                )}
                {solicitacaoAnalise.motivoIndeferimento && (
                  <div style={{ fontSize: 13, color: "#b91c1c", marginTop: 4 }}>
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

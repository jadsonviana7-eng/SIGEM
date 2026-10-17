import { useState, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getAlunos, salvarTrajetoriaAluno, adicionarMarcoTrajetoria } from "../services/alunosService";
import {
  getTransferencias,
  addTransferencia,
  updateTransferencia,
  deleteTransferencia
} from "../services/transferenciasService";
import { ANO_LETIVO_ATUAL } from "../utils/constants";
import { Card, Badge, Btn, Modal, Input, Select, Alert, Spinner, EmptyState } from "../components/ui";

export default function Transferencias() {
  const navigate = useNavigate();
  const { user, escolas } = useAuth();
  const activeEscolaId = user?.selectedEscolaId || "";
  const escolaAtual = (escolas || []).find(e => e.id === activeEscolaId) || { nome: "Escola Municipal", inep: "27000000", cidade: "Maceió", uf: "AL" };

  const { dados: transferencias, carregando: cT, recarregar: recarregarTransf } = useFirestore(
    useCallback(() => getTransferencias(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  const { dados: alunos, carregando: cA, recarregar: recarregarAlunos } = useFirestore(
    useCallback(() => getAlunos(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  const [abaAtiva, setAbaAtiva] = useState("todas"); // 'todas', 'saida', 'entrada', 'trajetoria'
  const [alerta, setAlerta] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("");

  // Modal Nova Transferência
  const [modalNovaAberto, setModalNovaAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    alunoId: "",
    tipo: "Saída (Expedida)",
    escolaOrigem: escolaAtual.nome || "Escola Municipal",
    escolaOrigemCidadeUf: `${escolaAtual.cidade || "Maceió"} - ${escolaAtual.uf || "AL"}`,
    escolaDestino: "",
    escolaDestinoCidadeUf: "Maceió - AL",
    data: new Date().toISOString().split("T")[0],
    motivo: "Mudança de Domicílio / Residência",
    responsavel: "",
    responsavelCpf: "",
    responsavelParentesco: "Mãe",
    responsavelTelefone: "",
    documentacao: "Declaração Provisória Emitida (Validade 30 dias)",
    situacao: "Concluída",
    serieAno: "",
    observacoes: ""
  });

  // Visualização e Impressão de Documento Oficial de Transferência
  const [docTransferencia, setDocTransferencia] = useState(null);

  // Estados para Gerenciamento de Trajetória na Aba Trajetória
  const [alunoTrajetoriaSel, setAlunoTrajetoriaSel] = useState(null);
  const [modalNovoMarcoAberto, setModalNovoMarcoAberto] = useState(false);
  const [novoMarco, setNovoMarco] = useState({
    anoLetivo: "2024",
    serieAno: "6º Ano",
    escola: "",
    cidadeUf: "Maceió - AL",
    situacaoFinal: "Aprovado",
    frequenciaPercentual: "95",
    mediaFinal: "8.0",
    observacoes: ""
  });
  const [salvandoMarco, setSalvandoMarco] = useState(false);

  // Aluno Selecionado no Formulário de Transferência
  const alunoFormSelecionado = useMemo(() => {
    return (alunos || []).find(a => a.id === form.alunoId);
  }, [alunos, form.alunoId]);

  // Ao selecionar aluno no form, preenche dados automaticamente
  function handleSelectAlunoForm(alunoId) {
    const a = (alunos || []).find(x => x.id === alunoId);
    if (a) {
      setForm(prev => ({
        ...prev,
        alunoId: a.id,
        alunoNome: a.nome,
        alunoMatricula: a.matricula,
        alunoCpf: a.cpf,
        alunoNascimento: a.nascimento,
        alunoMae: a.mae || a.responsavel,
        alunoTurma: a.turma,
        serieAno: a.ano || "",
        responsavel: a.responsavel || a.mae || "",
        responsavelCpf: a.responsavelCpf || "",
        responsavelParentesco: a.responsavelParentesco || "Mãe",
        responsavelTelefone: a.telefone || ""
      }));
    } else {
      setForm(prev => ({ ...prev, alunoId: "" }));
    }
  }

  // Estatísticas de Transferência
  const totalGeral = (transferencias || []).length;
  const totalSaida = (transferencias || []).filter(t => t.tipo?.includes("Saída")).length;
  const totalEntrada = (transferencias || []).filter(t => t.tipo?.includes("Entrada")).length;
  const totalPendentes = (transferencias || []).filter(t => t.situacao === "Em Andamento" || t.documentacao?.includes("Pendente")).length;

  // Filtragem da Lista
  const transferenciasFiltradas = useMemo(() => {
    return (transferencias || []).filter(t => {
      const matchBusca =
        (t.alunoNome || "").toLowerCase().includes(busca.toLowerCase()) ||
        (t.alunoMatricula || "").includes(busca) ||
        (t.escolaDestino || "").toLowerCase().includes(busca.toLowerCase()) ||
        (t.escolaOrigem || "").toLowerCase().includes(busca.toLowerCase());

      const matchAba =
        abaAtiva === "todas" ? true :
          abaAtiva === "saida" ? t.tipo?.includes("Saída") :
            abaAtiva === "entrada" ? t.tipo?.includes("Entrada") : true;

      const matchSituacao = !filtroSituacao || t.situacao === filtroSituacao;

      return matchBusca && matchAba && matchSituacao;
    });
  }, [transferencias, busca, abaAtiva, filtroSituacao]);

  // Salvar Transferência
  async function handleSalvarTransferencia() {
    if (!form.alunoId) { alert("Selecione o estudante."); return; }
    if (!form.escolaOrigem) { alert("Informe a escola de origem."); return; }
    if (!form.escolaDestino) { alert("Informe a escola de destino."); return; }
    if (!form.data) { alert("Informe a data da transferência."); return; }

    setSalvando(true);
    try {
      const dadosCompletos = {
        ...form,
        alunoNome: alunoFormSelecionado?.nome || form.alunoNome,
        alunoMatricula: alunoFormSelecionado?.matricula || form.alunoMatricula,
        alunoCpf: alunoFormSelecionado?.cpf || form.alunoCpf,
        alunoNascimento: alunoFormSelecionado?.nascimento || form.alunoNascimento,
        alunoMae: alunoFormSelecionado?.mae || form.alunoMae,
        alunoTurma: alunoFormSelecionado?.turma || form.alunoTurma,
        escolaNome: escolaAtual.nome,
        escolaInep: escolaAtual.inep,
        usuarioNome: user?.displayName || user?.email || "Secretaria Escolar",
        protocolo: `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      };

      const transfId = await addTransferencia(dadosCompletos, activeEscolaId);

      setAlerta({
        msg: `Transferência do estudante "${dadosCompletos.alunoNome}" registrada com sucesso!`,
        tipo: "success"
      });
      setModalNovaAberto(false);
      recarregarTransf();
      recarregarAlunos();

      // Abre automaticamente a declaração oficial gerada para impressão
      setDocTransferencia({ id: transfId, ...dadosCompletos });
    } catch (err) {
      alert("Erro ao salvar transferência: " + err.message);
    } finally {
      setSalvando(false);
    }
  }

  // Excluir Transferência
  async function handleExcluirTransferencia(transfId) {
    if (!window.confirm("Deseja realmente remover este registro de transferência?")) return;
    try {
      await deleteTransferencia(transfId);
      setAlerta({ msg: "Registro de transferência removido.", tipo: "success" });
      recarregarTransf();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  }

  // Adicionar Marco à Trajetória do Aluno
  async function handleAdicionarMarco() {
    if (!alunoTrajetoriaSel) return;
    if (!novoMarco.anoLetivo || !novoMarco.serieAno || !novoMarco.escola) {
      alert("Preencha o Ano Letivo, Série/Ano e Nome da Escola.");
      return;
    }

    setSalvandoMarco(true);
    try {
      await adicionarMarcoTrajetoria(alunoTrajetoriaSel.id, novoMarco);
      setAlerta({ msg: `Ano ${novoMarco.anoLetivo} adicionado à trajetória de ${alunoTrajetoriaSel.nome}!`, tipo: "success" });
      setModalNovoMarcoAberto(false);
      setNovoMarco({
        anoLetivo: (Number(novoMarco.anoLetivo) + 1).toString(),
        serieAno: "",
        escola: novoMarco.escola,
        cidadeUf: "Maceió - AL",
        situacaoFinal: "Aprovado",
        frequenciaPercentual: "95",
        mediaFinal: "8.0",
        observacoes: ""
      });
      recarregarAlunos();
      // Atualiza aluno selecionado localmente
      const alunoAtualizado = (alunos || []).find(a => a.id === alunoTrajetoriaSel.id);
      if (alunoAtualizado) setAlunoTrajetoriaSel(alunoAtualizado);
    } catch (err) {
      alert("Erro ao salvar marco: " + err.message);
    } finally {
      setSalvandoMarco(false);
    }
  }

  if (cT || cA) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {alerta && <Alert tipo={alerta.tipo}>{alerta.msg}</Alert>}

      {/* Cabeçalho Principal */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ti ti-file-export" style={{ color: "#818cf8", fontSize: 26 }} />
            Transferências Escolares & Trajetória
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#94a3b8" }}>
            Registro de transferências de entrada/saída, emissão de declarações oficiais e acompanhamento do histórico acadêmico ano a ano.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Btn variant="default" onClick={() => setAbaAtiva("trajetoria")}>
            <i className="ti ti-timeline" /> Consultar Trajetórias
          </Btn>
          <Btn
            variant="primary"
            onClick={() => {
              setForm({
                alunoId: "",
                tipo: "Saída (Expedida)",
                escolaOrigem: escolaAtual.nome || "Escola Municipal",
                escolaOrigemCidadeUf: `${escolaAtual.cidade || "Maceió"} - ${escolaAtual.uf || "AL"}`,
                escolaDestino: "",
                escolaDestinoCidadeUf: "Maceió - AL",
                data: new Date().toISOString().split("T")[0],
                motivo: "Mudança de Domicílio / Residência",
                responsavel: "",
                responsavelCpf: "",
                responsavelParentesco: "Mãe",
                responsavelTelefone: "",
                documentacao: "Declaração Provisória Emitida (Validade 30 dias)",
                situacao: "Concluída",
                serieAno: "",
                observacoes: ""
              });
              setModalNovaAberto(true);
            }}
          >
            <i className="ti ti-plus" /> Registrar Transferência
          </Btn>
        </div>
      </div>

      {/* Painel de Indicadores (KPIs) */}
      <div className="sigem-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <Card style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(99, 102, 241, 0.15)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            <i className="ti ti-files" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Total de Transferências</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#ffffff" }}>{totalGeral} <span style={{ fontSize: 10, fontWeight: 500, color: "#94a3b8" }}>registros</span></div>
          </div>
        </Card>

        <Card style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(239, 68, 68, 0.15)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            <i className="ti ti-arrow-up-right" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Transferências de Saída</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f87171" }}>{totalSaida} <span style={{ fontSize: 10, fontWeight: 500, color: "#94a3b8" }}>expedidas</span></div>
          </div>
        </Card>

        <Card style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(52, 211, 153, 0.15)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            <i className="ti ti-arrow-down-left" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Transferências de Entrada</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#34d399" }}>{totalEntrada} <span style={{ fontSize: 10, fontWeight: 500, color: "#94a3b8" }}>recebidas</span></div>
          </div>
        </Card>

        <Card style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: totalPendentes > 0 ? "rgba(245, 158, 11, 0.15)" : "#243144", color: totalPendentes > 0 ? "#fbbf24" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            <i className="ti ti-clock" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Documentos Pendentes</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: totalPendentes > 0 ? "#fbbf24" : "#ffffff" }}>
              {totalPendentes} <span style={{ fontSize: 10, fontWeight: 500, color: "#94a3b8" }}>em andamento</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "2px solid #2c3b52",
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingBottom: 2
        }}
      >
        {[
          { id: "todas", label: "Todas as Transferências", icon: "file-text", badge: totalGeral },
          { id: "saida", label: "Saída / Expedidas", icon: "arrow-up-right", badge: totalSaida },
          { id: "entrada", label: "Entrada / Recebidas", icon: "arrow-down-left", badge: totalEntrada },
          { id: "trajetoria", label: "Histórico & Trajetória Escolar", icon: "timeline", badge: alunos.length }
        ].map(tab => {
          const ativa = abaAtiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                border: "none",
                background: "transparent",
                borderBottom: ativa ? "3px solid #6366f1" : "3px solid transparent",
                marginBottom: -2,
                color: ativa ? "#818cf8" : "#94a3b8",
                fontWeight: ativa ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
            >
              <i className={`ti ti-${tab.icon}`} style={{ fontSize: 17 }} />
              {tab.label}
              <span style={{
                fontSize: 11,
                padding: "1px 7px",
                borderRadius: 10,
                background: ativa ? "#6366f1" : "#243144",
                color: ativa ? "#ffffff" : "#cbd5e1",
                fontWeight: 600
              }}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* ABAS 1, 2, 3: LISTAGEM DE TRANSFERÊNCIAS                                  */}
      {/* ========================================================================= */}
      {abaAtiva !== "trajetoria" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Barra de Filtros */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#243144", border: "1px solid #33435c", borderRadius: 8, padding: "8px 12px", flex: 1, maxWidth: 360 }}>
              <i className="ti ti-search" style={{ color: "#818cf8", fontSize: 16 }} />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por estudante, matrícula ou escola..."
                style={{ border: "none", background: "transparent", fontSize: 13, color: "#ffffff", outline: "none", width: "100%" }}
              />
            </div>

            <select
              value={filtroSituacao}
              onChange={e => setFiltroSituacao(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #33435c", borderRadius: 8, fontSize: 13, outline: "none", background: "#243144", color: "#ffffff", cursor: "pointer" }}
            >
              <option value="" style={{ background: "#243144" }}>Todas as Situações</option>
              <option value="Concluída" style={{ background: "#243144" }}>Concluída / Efetivada</option>
              <option value="Em Andamento" style={{ background: "#243144" }}>Em Andamento / Aguardando</option>
              <option value="Cancelada" style={{ background: "#243144" }}>Cancelada</option>
            </select>
          </div>

          {!transferenciasFiltradas.length ? (
            <EmptyState
              icon="files-off"
              texto="Nenhum registro de transferência encontrado para os critérios selecionados."
            />
          ) : (
            <>
              <div className="sigem-desktop-table">
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#243144", borderBottom: "1px solid #2c3b52" }}>
                        {["Data", "Estudante", "Tipo", "Origem → Destino", "Motivo", "Documentação", "Situação", "Ações"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#cbd5e1", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transferenciasFiltradas.map(t => {
                        const isSaida = t.tipo?.includes("Saída");
                        return (
                          <tr key={t.id} style={{ borderBottom: "1px solid #2c3b52" }}>
                            <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
                              {t.data ? new Date(t.data + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontWeight: 600, color: "#ffffff" }}>{t.alunoNome}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>Matrícula: {t.alunoMatricula || "—"}</div>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <Badge color={isSaida ? "red" : "green"}>
                                <i className={`ti ti-${isSaida ? "arrow-up-right" : "arrow-down-left"}`} style={{ marginRight: 4 }} />
                                {isSaida ? "Saída" : "Entrada"}
                              </Badge>
                            </td>
                            <td style={{ padding: "12px 14px", maxWidth: 260 }}>
                              <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                                <strong>De:</strong> {t.escolaOrigem || "—"}
                              </div>
                              <div style={{ fontSize: 12, color: "#818cf8", marginTop: 2 }}>
                                <strong>Para:</strong> {t.escolaDestino || "—"}
                              </div>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontSize: 12, color: "#ffffff", fontWeight: 500 }}>{t.motivo}</div>
                              {t.responsavel && (
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>Req.: {t.responsavel}</div>
                              )}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ fontSize: 12, color: t.documentacao?.includes("Oficial") ? "#34d399" : "#cbd5e1" }}>
                                {t.documentacao || "Declaração Emitida"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <Badge color={t.situacao === "Concluída" ? "green" : t.situacao === "Cancelada" ? "red" : "amber"}>
                                {t.situacao || "Concluída"}
                              </Badge>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", gap: 6 }}>
                                <Btn
                                  variant="secondary"
                                  onClick={() => setDocTransferencia(t)}
                                  style={{ padding: "5px 9px", fontSize: 11 }}
                                  title="Imprimir Declaração Oficial de Transferência"
                                >
                                  <i className="ti ti-printer" /> Declaração
                                </Btn>
                                <Btn
                                  variant="danger"
                                  onClick={() => handleExcluirTransferencia(t.id)}
                                  style={{ padding: "5px 8px", fontSize: 11 }}
                                  title="Remover Registro"
                                >
                                  <i className="ti ti-trash" />
                                </Btn>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              </div>

              {/* Visualização Mobile: Cards Otimizados */}
              <div className="sigem-mobile-cards">
                {transferenciasFiltradas.map(t => {
                  const isSaida = t.tipo?.includes("Saída");
                  return (
                    <div
                      key={`mob-transf-${t.id}`}
                      onClick={() => setDocTransferencia(t)}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: 14,
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        boxShadow: "var(--card-shadow)",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-indigo)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                    >
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: isSaida ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                        color: isSaida ? "#f87171" : "#34d399",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        flexShrink: 0
                      }}>
                        <i className={`ti ti-${isSaida ? "arrow-up-right" : "arrow-down-left"}`} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {t.alunoNome}
                          </span>
                          <Badge color={isSaida ? "red" : "green"}>
                            {isSaida ? "Saída" : "Entrada"}
                          </Badge>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
                          <span style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>#{t.alunoMatricula || "S/N"}</span>
                          <span style={{ color: "var(--text-muted)" }}>· {t.data ? new Date(t.data + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <Badge color={t.situacao === "Concluída" ? "green" : "amber"}>
                          {t.situacao || "Concluída"}
                        </Badge>
                        <div style={{ color: "var(--text-muted)", fontSize: 18, display: "flex", alignItems: "center" }}>
                          <i className="ti ti-chevron-right" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: HISTÓRICO & TRAJETÓRIA ESCOLAR                                     */}
      {/* ========================================================================= */}
      {abaAtiva === "trajetoria" && (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
          {/* Coluna 1: Lista de Estudantes para Seleção */}
          <Card style={{ padding: 16 }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 700, color: "#ffffff" }}>
              Selecione o Estudante
            </h3>
            <div style={{ marginBottom: 12 }}>
              <Input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nome ou matrícula..."
              />
            </div>

            <div style={{ maxHeight: 480, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {alunos
                .filter(a => (a.nome || "").toLowerCase().includes(busca.toLowerCase()) || (a.matricula || "").includes(busca))
                .map(a => {
                  const sel = alunoTrajetoriaSel?.id === a.id;
                  const totalAnos = Array.isArray(a.trajetoriaEscolar) ? a.trajetoriaEscolar.length : 0;
                  return (
                    <div
                      key={a.id}
                      onClick={() => setAlunoTrajetoriaSel(a)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: sel ? "rgba(99, 102, 241, 0.2)" : "#243144",
                        border: sel ? "1.5px solid #818cf8" : "1px solid #33435c",
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, color: sel ? "#818cf8" : "#ffffff" }}>{a.nome}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                        <span>{a.turma} ({a.ano})</span>
                        <span style={{ fontWeight: 600, color: totalAnos > 0 ? "#34d399" : "#94a3b8" }}>
                          {totalAnos} ano(s) registrado(s)
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* Coluna 2: Linha do Tempo da Trajetória Escolar */}
          <Card style={{ padding: 24 }}>
            {!alunoTrajetoriaSel ? (
              <EmptyState
                icon="user-search"
                texto="Selecione um estudante na coluna ao lado para visualizar e gerenciar sua trajetória acadêmica."
              />
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #2c3b52", paddingBottom: 16, marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase" }}>Trajetória Acadêmica do Estudante</span>
                    <h2 style={{ margin: "2px 0 0 0", fontSize: 20, fontWeight: 800, color: "#ffffff" }}>
                      {alunoTrajetoriaSel.nome}
                    </h2>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                      Matrícula: <strong style={{ color: "#cbd5e1" }}>{alunoTrajetoriaSel.matricula || "—"}</strong> · Turma Atual: <strong style={{ color: "#cbd5e1" }}>{alunoTrajetoriaSel.turma} ({alunoTrajetoriaSel.ano})</strong> · Status: <strong style={{ color: "#cbd5e1" }}>{alunoTrajetoriaSel.status || "Ativo"}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn
                      variant="primary"
                      onClick={() => {
                        setNovoMarco({
                          anoLetivo: new Date().getFullYear().toString(),
                          serieAno: alunoTrajetoriaSel.ano || "6º Ano",
                          escola: escolaAtual.nome || "Escola Municipal",
                          cidadeUf: `${escolaAtual.cidade || "Maceió"} - ${escolaAtual.uf || "AL"}`,
                          situacaoFinal: "Aprovado",
                          frequenciaPercentual: "95",
                          mediaFinal: "8.0",
                          observacoes: ""
                        });
                        setModalNovoMarcoAberto(true);
                      }}
                    >
                      <i className="ti ti-plus" /> Adicionar Ano / Série
                    </Btn>
                    <Btn
                      variant="default"
                      onClick={() => navigate(`/alunos/${alunoTrajetoriaSel.id}`)}
                      title="Ver Ficha Completa"
                    >
                      <i className="ti ti-user" /> Ver Ficha
                    </Btn>
                  </div>
                </div>

                {/* Timeline Visual da Trajetória */}
                {(!alunoTrajetoriaSel.trajetoriaEscolar || alunoTrajetoriaSel.trajetoriaEscolar.length === 0) ? (
                  <div style={{ padding: 24, textAlign: "center", background: "#243144", borderRadius: 8, border: "1px dashed #33435c", color: "#94a3b8" }}>
                    <i className="ti ti-timeline" style={{ fontSize: 32, color: "#818cf8", display: "block", marginBottom: 8 }} />
                    Nenhum histórico anterior registrado para este estudante.
                    <div style={{ marginTop: 10 }}>
                      <Btn variant="primary" onClick={() => setModalNovoMarcoAberto(true)} style={{ fontSize: 12 }}>
                        Cadastrar Primeiro Ano na Trajetória
                      </Btn>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {alunoTrajetoriaSel.trajetoriaEscolar.map((item, index) => {
                      const isAprovado = item.situacaoFinal === "Aprovado";
                      const isTransferido = item.situacaoFinal === "Transferido";
                      const isReprovado = item.situacaoFinal === "Reprovado";

                      return (
                        <div
                          key={item.id || index}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "110px 1fr 140px auto",
                            gap: 16,
                            alignItems: "center",
                            padding: "14px 18px",
                            background: "#243144",
                            border: "1px solid #33435c",
                            borderRadius: 10
                          }}
                        >
                          {/* Ano & Série */}
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#818cf8" }}>
                              {item.anoLetivo}
                            </div>
                            <Badge color="blue">{item.serieAno}</Badge>
                          </div>

                          {/* Escola & Local */}
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>
                              {item.escola}
                            </div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                              <i className="ti ti-map-pin" style={{ fontSize: 12, marginRight: 4 }} />
                              {item.cidadeUf || "Não informada"}
                            </div>
                            {item.observacoes && (
                              <div style={{ fontSize: 11, color: "#cbd5e1", fontStyle: "italic", marginTop: 4 }}>
                                {item.observacoes}
                              </div>
                            )}
                          </div>

                          {/* Situação Final */}
                          <div>
                            <Badge color={isAprovado ? "green" : isTransferido ? "purple" : isReprovado ? "red" : "amber"}>
                              {item.situacaoFinal || "Aprovado"}
                            </Badge>
                            {item.mediaFinal && (
                              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                                Média: <strong style={{ color: "#ffffff" }}>{item.mediaFinal}</strong> {item.frequenciaPercentual ? `· Freq: ${item.frequenciaPercentual}%` : ""}
                              </div>
                            )}
                          </div>

                          {/* Ações */}
                          <div>
                            <button
                              onClick={async () => {
                                if (!window.confirm(`Remover o registro do ano ${item.anoLetivo}?`)) return;
                                const novaTraj = alunoTrajetoriaSel.trajetoriaEscolar.filter(t => t.id !== item.id);
                                await salvarTrajetoriaAluno(alunoTrajetoriaSel.id, novaTraj);
                                recarregarAlunos();
                                setAlunoTrajetoriaSel(prev => ({ ...prev, trajetoriaEscolar: novaTraj }));
                              }}
                              style={{ border: "none", background: "none", color: "#94a3b8", cursor: "pointer", padding: 6 }}
                              title="Excluir este ano"
                            >
                              <i className="ti ti-trash" style={{ fontSize: 16 }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR NOVA TRANSFERÊNCIA                                       */}
      {/* ========================================================================= */}
      {modalNovaAberto && (
        <Modal
          titulo="Registrar Transferência Escolar"
          onClose={() => setModalNovaAberto(false)}
          onSave={handleSalvarTransferencia}
          salvando={salvando}
          textSave="Efetivar & Gerar Declaração"
          width={700}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Tipo de Transferência */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
                  Tipo de Transferência *
                </label>
                <Select
                  value={form.tipo}
                  onChange={e => {
                    const novoTipo = e.target.value;
                    if (novoTipo === "Saída (Expedida)") {
                      setForm(f => ({
                        ...f,
                        tipo: novoTipo,
                        escolaOrigem: escolaAtual.nome || "Esta Unidade",
                        escolaOrigemCidadeUf: `${escolaAtual.cidade || "Maceió"} - ${escolaAtual.uf || "AL"}`,
                        escolaDestino: ""
                      }));
                    } else {
                      setForm(f => ({
                        ...f,
                        tipo: novoTipo,
                        escolaOrigem: "",
                        escolaOrigemCidadeUf: "Maceió - AL",
                        escolaDestino: escolaAtual.nome || "Esta Unidade",
                        escolaDestinoCidadeUf: `${escolaAtual.cidade || "Maceió"} - ${escolaAtual.uf || "AL"}`
                      }));
                    }
                  }}
                >
                  <option value="Saída (Expedida)">Transferência de Saída (Expedida por esta escola)</option>
                  <option value="Entrada (Recebida)">Transferência de Entrada (Recebida de outra escola)</option>
                </Select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
                  Data do Pedido / Efetivação *
                </label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                />
              </div>
            </div>

            {/* Seleção do Estudante */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
                Selecione o Estudante *
              </label>
              <Select
                value={form.alunoId}
                onChange={e => handleSelectAlunoForm(e.target.value)}
              >
                <option value="">Selecione o estudante...</option>
                {alunos.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nome} — Turma: {a.turma} ({a.ano}) {a.matricula ? `· Matr: ${a.matricula}` : ""}
                  </option>
                ))}
              </Select>
            </div>

            {/* Escolas Origem e Destino */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
                  Escola de Origem (De onde sai) *
                </label>
                <Input
                  value={form.escolaOrigem}
                  onChange={e => setForm(f => ({ ...f, escolaOrigem: e.target.value }))}
                  placeholder="Nome da Escola de Origem..."
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
                  Escola de Destino (Para onde vai) *
                </label>
                <Input
                  value={form.escolaDestino}
                  onChange={e => setForm(f => ({ ...f, escolaDestino: e.target.value }))}
                  placeholder="Nome da Escola de Destino..."
                />
              </div>
            </div>

            {/* Motivo e Responsável */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
                  Motivo da Transferência *
                </label>
                <Select
                  value={form.motivo}
                  onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                >
                  <option value="Mudança de Domicílio / Residência">Mudança de Domicílio / Residência</option>
                  <option value="Solicitação dos Pais / Responsáveis">Solicitação dos Pais / Responsáveis</option>
                  <option value="Distância da Residência / Transporte">Distância da Residência / Transporte</option>
                  <option value="Adaptação e Convivência Escolar">Adaptação e Convivência Escolar</option>
                  <option value="Conclusão do Ensino Fundamental">Conclusão do Ensino Fundamental</option>
                  <option value="Ajuste Pedagógico / Turno">Ajuste Pedagógico / Turno</option>
                  <option value="Outro">Outro</option>
                </Select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
                  Responsável Requerente *
                </label>
                <Input
                  value={form.responsavel}
                  onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}
                  placeholder="Nome do Pai, Mãe ou Responsável Legal..."
                />
              </div>
            </div>

            {/* Documentação e Situação */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
                  Status da Documentação Escolar *
                </label>
                <Select
                  value={form.documentacao}
                  onChange={e => setForm(f => ({ ...f, documentacao: e.target.value }))}
                >
                  <option value="Declaração Provisória Emitida (Validade 30 dias)">Declaração Provisória Emitida (Validade 30 dias)</option>
                  <option value="Histórico Escolar Oficial Entregue">Histórico Escolar Oficial Entregue</option>
                  <option value="Declaração + Histórico Escolar">Declaração + Histórico Escolar Completo</option>
                  <option value="Pendente de Documentação">Pendente de Documentação</option>
                </Select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
                  Situação do Processo *
                </label>
                <Select
                  value={form.situacao}
                  onChange={e => setForm(f => ({ ...f, situacao: e.target.value }))}
                >
                  <option value="Concluída">Concluída / Efetivada</option>
                  <option value="Em Andamento">Em Andamento / Aguardando</option>
                  <option value="Cancelada">Cancelada</option>
                </Select>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: 4 }}>
                Observações / Parecer da Secretaria Escolar (Opcional)
              </label>
              <Input
                value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                placeholder="Ex: Aluno cursou até o 2º bimestre com notas regulares. Histórico definitivo em confecção..."
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADICIONAR MARCO À TRAJETÓRIA DO ALUNO                              */}
      {/* ========================================================================= */}
      {modalNovoMarcoAberto && alunoTrajetoriaSel && (
        <Modal
          titulo={`Adicionar Ano à Trajetória · ${alunoTrajetoriaSel.nome}`}
          onClose={() => setModalNovoMarcoAberto(false)}
          onSave={handleAdicionarMarco}
          salvando={salvandoMarco}
          textSave="Salvar Ano na Trajetória"
          width={580}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Ano Letivo *"
                placeholder="Ex: 2023"
                value={novoMarco.anoLetivo}
                onChange={e => setNovoMarco(m => ({ ...m, anoLetivo: e.target.value }))}
              />
              <Input
                label="Série / Ano Escolar *"
                placeholder="Ex: 6º Ano"
                value={novoMarco.serieAno}
                onChange={e => setNovoMarco(m => ({ ...m, serieAno: e.target.value }))}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <Input
                label="Nome da Escola *"
                placeholder="Ex: Escola Municipal Maria da Silva"
                value={novoMarco.escola}
                onChange={e => setNovoMarco(m => ({ ...m, escola: e.target.value }))}
              />
              <Input
                label="Cidade / UF"
                placeholder="Ex: Maceió - AL"
                value={novoMarco.cidadeUf}
                onChange={e => setNovoMarco(m => ({ ...m, cidadeUf: e.target.value }))}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Select
                label="Situação Final *"
                value={novoMarco.situacaoFinal}
                onChange={e => setNovoMarco(m => ({ ...m, situacaoFinal: e.target.value }))}
              >
                <option value="Aprovado">Aprovado</option>
                <option value="Reprovado">Reprovado</option>
                <option value="Transferido">Transferido</option>
                <option value="Cursando">Cursando</option>
                <option value="Desistente">Desistente</option>
              </Select>

              <Input
                label="Média Final"
                placeholder="Ex: 8.5"
                value={novoMarco.mediaFinal}
                onChange={e => setNovoMarco(m => ({ ...m, mediaFinal: e.target.value }))}
              />

              <Input
                label="Frequência %"
                placeholder="Ex: 95"
                value={novoMarco.frequenciaPercentual}
                onChange={e => setNovoMarco(m => ({ ...m, frequenciaPercentual: e.target.value }))}
              />
            </div>

            <Input
              label="Observações Adicionais"
              placeholder="Ex: Cursou o ano completo com bom desempenho..."
              value={novoMarco.observacoes}
              onChange={e => setNovoMarco(m => ({ ...m, observacoes: e.target.value }))}
            />
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DECLARAÇÃO OFICIAL DE TRANSFERÊNCIA (GERADO AUTOMATICAMENTE)       */}
      {/* ========================================================================= */}
      {docTransferencia && (
        <Modal
          titulo="Declaração Oficial de Transferência Escolar"
          onClose={() => setDocTransferencia(null)}
          onSave={() => window.print()}
          textSave="Imprimir Declaração"
          width={720}
        >
          {/* Estilos dedicados de impressão da declaração de transferência */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              .declaracao-transferencia-print,
              .declaracao-transferencia-print * {
                visibility: visible !important;
                color: #000000 !important;
              }
              .declaracao-transferencia-print {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                border: 2px solid #000 !important;
                padding: 24px 28px !important;
                background: #ffffff !important;
                box-shadow: none !important;
              }
            }
          `}</style>

          <div
            className="documento-impresso print-target declaracao-transferencia-print"
            style={{
              border: "2px solid #000",
              padding: "24px 28px",
              background: "#ffffff",
              color: "#000000",
              borderRadius: 4,
              fontSize: 12,
              lineHeight: 1.6
            }}
          >
            {/* Cabeçalho Oficial */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 12, marginBottom: 16, color: "#000000" }}>
              <div style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase", color: "#000000" }}>ESTADO DE ALAGOAS · SECRETARIA MUNICIPAL DE EDUCAÇÃO</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1e3a8a", marginTop: 2 }}>{docTransferencia.escolaNome || escolaAtual.nome || "ESCOLA MUNICIPAL"}</div>
              <div style={{ fontSize: 11, color: "#333333" }}>CÓDIGO INEP: {docTransferencia.escolaInep || escolaAtual.inep || "27000000"} · {escolaAtual.cidade || "Santana do Mundaú"} - {escolaAtual.uf || "AL"}</div>
              <div style={{ fontWeight: 800, fontSize: 14, textTransform: "uppercase", marginTop: 10, letterSpacing: 0.5, borderTop: "1px solid #aaa", paddingTop: 8, color: "#000000" }}>
                DECLARAÇÃO DE TRANSFERÊNCIA ESCOLAR
              </div>
              <div style={{ fontSize: 10, color: "#444444" }}>PROTOCOLO: <strong style={{ color: "#000000" }}>{docTransferencia.protocolo || "TRF-2026-0001"}</strong></div>
            </div>

            {/* Corpo da Declaração */}
            <div style={{ textAlign: "justify", fontSize: 12.5, lineHeight: 1.8, marginBottom: 16, color: "#000000" }}>
              Declaramos para os devidos fins de direito e matrícula em outra instituição de ensino, que o(a) estudante <strong style={{ color: "#000000" }}>{docTransferencia.alunoNome}</strong>,
              {docTransferencia.alunoNascimento ? ` nascido(a) em ${new Date(docTransferencia.alunoNascimento + "T12:00:00").toLocaleDateString("pt-BR")},` : ""}
              {docTransferencia.alunoCpf ? ` portador(a) do CPF nº ${docTransferencia.alunoCpf},` : ""}
              {docTransferencia.alunoMae ? ` filho(a) de ${docTransferencia.alunoMae},` : ""}
              {docTransferencia.alunoMatricula ? ` registrado(a) sob o Registro de Matrícula nº ${docTransferencia.alunoMatricula},` : ""}
              esteve regularmente matriculado(a) nesta unidade escolar no <strong style={{ color: "#000000" }}>{docTransferencia.serieAno || docTransferencia.alunoTurma || "Ensino Fundamental"}</strong>,
              tendo requerido sua <strong style={{ color: "#000000" }}>TRANSFERÊNCIA</strong> para a instituição de ensino <strong style={{ color: "#000000" }}>{docTransferencia.escolaDestino}</strong>.
            </div>

            {/* Quadro de Detalhes da Transferência */}
            <div style={{ border: "1px solid #000", padding: "10px 14px", background: "#f8fafc", color: "#000000", borderRadius: 4, marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", fontSize: 11.5 }}>
              <div><strong style={{ color: "#000000" }}>Tipo de Transferência:</strong> {docTransferencia.tipo}</div>
              <div><strong style={{ color: "#000000" }}>Data da Expedição:</strong> {docTransferencia.data ? new Date(docTransferencia.data + "T12:00:00").toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}</div>
              <div><strong style={{ color: "#000000" }}>Escola de Origem:</strong> {docTransferencia.escolaOrigem}</div>
              <div><strong style={{ color: "#000000" }}>Escola de Destino:</strong> {docTransferencia.escolaDestino}</div>
              <div><strong style={{ color: "#000000" }}>Motivo do Desligamento:</strong> {docTransferencia.motivo}</div>
              <div><strong style={{ color: "#000000" }}>Responsável Requerente:</strong> {docTransferencia.responsavel || docTransferencia.alunoMae || "—"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "#000000" }}>Documentação Anexa / Status:</strong> {docTransferencia.documentacao}</div>
              {docTransferencia.observacoes && (
                <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "#000000" }}>Observações da Secretaria:</strong> {docTransferencia.observacoes}</div>
              )}
            </div>

            {/* Aviso Legal sobre Validade */}
            <div style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: 8, borderRadius: 4, fontSize: 10, color: "#1e293b", textAlign: "center", marginBottom: 24 }}>
              <strong>AVISO LEGAL:</strong> Esta declaração provisória tem validade de <strong>30 (trinta) dias</strong> a contar de sua data de emissão, prazo no qual o Histórico Escolar oficial definitivo será expedido e entregue nos termos do Art. 24 da Lei Federal nº 9.394/96 (LDB).
            </div>

            <div style={{ textAlign: "right", fontSize: 11, marginBottom: 30, color: "#000000" }}>
              {escolaAtual.cidade || "Santana do Mundaú"} - {escolaAtual.uf || "AL"}, {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}.
            </div>

            {/* Campos de Assinaturas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, textAlign: "center", fontSize: 10, color: "#000000" }}>
              <div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 4 }}>Assinatura do Responsável</div>
              </div>
              <div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 4 }}>Secretaria Escolar</div>
              </div>
              <div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 4 }}>Direção Escolar / Carimbo</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

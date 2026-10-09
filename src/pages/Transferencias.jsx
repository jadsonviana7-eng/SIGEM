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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ti ti-file-export" style={{ color: "#1a56db", fontSize: 26 }} />
            Transferências Escolares & Trajetória
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eff6ff", color: "#1a56db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            <i className="ti ti-files" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Total de Transferências</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{totalGeral} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>registros</span></div>
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            <i className="ti ti-arrow-up-right" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Transferências de Saída</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}>{totalSaida} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>expedidas</span></div>
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            <i className="ti ti-arrow-down-left" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Transferências de Entrada</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>{totalEntrada} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>recebidas</span></div>
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: totalPendentes > 0 ? "#fffbeb" : "#f8fafc", color: totalPendentes > 0 ? "#b45309" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            <i className="ti ti-clock" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Documentos Pendentes</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: totalPendentes > 0 ? "#b45309" : "#0f172a" }}>
              {totalPendentes} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>em andamento</span>
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
          borderBottom: "2px solid #e2e8f0",
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
                borderBottom: ativa ? "3px solid #1a56db" : "3px solid transparent",
                marginBottom: -2,
                color: ativa ? "#1a56db" : "#64748b",
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
                background: ativa ? "#1a56db" : "#e2e8f0",
                color: ativa ? "white" : "#475569",
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px", flex: 1, maxWidth: 360 }}>
              <i className="ti ti-search" style={{ color: "#9ca3af", fontSize: 16 }} />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por estudante, matrícula ou escola..."
                style={{ border: "none", background: "none", fontSize: 13, outline: "none", width: "100%" }}
              />
            </div>

            <select
              value={filtroSituacao}
              onChange={e => setFiltroSituacao(e.target.value)}
              style={{ padding: "6.5px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", background: "white", color: "#374151" }}
            >
              <option value="">Todas as Situações</option>
              <option value="Concluída">Concluída / Efetivada</option>
              <option value="Em Andamento">Em Andamento / Aguardando</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          {!transferenciasFiltradas.length ? (
            <EmptyState
              icon="files-off"
              texto="Nenhum registro de transferência encontrado para os critérios selecionados."
            />
          ) : (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e5e4" }}>
                    {["Data", "Estudante", "Tipo", "Origem → Destino", "Motivo", "Documentação", "Situação", "Ações"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transferenciasFiltradas.map(t => {
                    const isSaida = t.tipo?.includes("Saída");
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>
                          {t.data ? new Date(t.data + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 600, color: "#111827" }}>{t.alunoNome}</div>
                          <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>Matrícula: {t.alunoMatricula || "—"}</div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <Badge color={isSaida ? "red" : "green"}>
                            <i className={`ti ti-${isSaida ? "arrow-up-right" : "arrow-down-left"}`} style={{ marginRight: 4 }} />
                            {isSaida ? "Saída" : "Entrada"}
                          </Badge>
                        </td>
                        <td style={{ padding: "12px 14px", maxWidth: 260 }}>
                          <div style={{ fontSize: 12, color: "#334155" }}>
                            <strong>De:</strong> {t.escolaOrigem || "—"}
                          </div>
                          <div style={{ fontSize: 12, color: "#1e40af", marginTop: 2 }}>
                            <strong>Para:</strong> {t.escolaDestino || "—"}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontSize: 12, color: "#1e293b", fontWeight: 500 }}>{t.motivo}</div>
                          {t.responsavel && (
                            <div style={{ fontSize: 11, color: "#64748b" }}>Req.: {t.responsavel}</div>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 12, color: t.documentacao?.includes("Oficial") ? "#16a34a" : "#475569" }}>
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
            <h3 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
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
                        background: sel ? "#eff6ff" : "#f8fafc",
                        border: sel ? "1.5px solid #3b82f6" : "1px solid #e2e8f0",
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, color: sel ? "#1e40af" : "#111827" }}>{a.nome}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginTop: 4 }}>
                        <span>{a.turma} ({a.ano})</span>
                        <span style={{ fontWeight: 600, color: totalAnos > 0 ? "#16a34a" : "#94a3b8" }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e2e8f0", paddingBottom: 16, marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1a56db", textTransform: "uppercase" }}>Trajetória Acadêmica do Estudante</span>
                    <h2 style={{ margin: "2px 0 0 0", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                      {alunoTrajetoriaSel.nome}
                    </h2>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      Matrícula: <strong>{alunoTrajetoriaSel.matricula || "—"}</strong> · Turma Atual: <strong>{alunoTrajetoriaSel.turma} ({alunoTrajetoriaSel.ano})</strong> · Status: <strong>{alunoTrajetoriaSel.status || "Ativo"}</strong>
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
                  <div style={{ padding: 24, textAlign: "center", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1", color: "#64748b" }}>
                    <i className="ti ti-timeline" style={{ fontSize: 32, color: "#94a3b8", display: "block", marginBottom: 8 }} />
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
                            background: "white",
                            border: "1.5px solid #e2e8f0",
                            borderRadius: 10,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                          }}
                        >
                          {/* Ano & Série */}
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e3a8a" }}>
                              {item.anoLetivo}
                            </div>
                            <Badge color="blue">{item.serieAno}</Badge>
                          </div>

                          {/* Escola & Local */}
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                              {item.escola}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                              <i className="ti ti-map-pin" style={{ fontSize: 12, marginRight: 4 }} />
                              {item.cidadeUf || "Não informada"}
                            </div>
                            {item.observacoes && (
                              <div style={{ fontSize: 11, color: "#475569", fontStyle: "italic", marginTop: 4 }}>
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
                              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                                Média: <strong>{item.mediaFinal}</strong> {item.frequenciaPercentual ? `· Freq: ${item.frequenciaPercentual}%` : ""}
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
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
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
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
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
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
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
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  Escola de Origem (De onde sai) *
                </label>
                <Input
                  value={form.escolaOrigem}
                  onChange={e => setForm(f => ({ ...f, escolaOrigem: e.target.value }))}
                  placeholder="Nome da Escola de Origem..."
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
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
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
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
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
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
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
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
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
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
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
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
          <div style={{ border: "2px solid #000", padding: "24px 28px", background: "white", borderRadius: 4, fontSize: 12, lineHeight: 1.6 }}>
            {/* Cabeçalho Oficial */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>ESTADO DE ALAGOAS · SECRETARIA MUNICIPAL DE EDUCAÇÃO</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1e3a8a", marginTop: 2 }}>{docTransferencia.escolaNome || escolaAtual.nome || "ESCOLA MUNICIPAL"}</div>
              <div style={{ fontSize: 11, color: "#444" }}>CÓDIGO INEP: {docTransferencia.escolaInep || escolaAtual.inep || "27000000"} · {escolaAtual.cidade || "Maceió"} - {escolaAtual.uf || "AL"}</div>
              <div style={{ fontWeight: 800, fontSize: 14, textTransform: "uppercase", marginTop: 10, letterSpacing: 0.5, borderTop: "1px solid #aaa", paddingTop: 8 }}>
                DECLARAÇÃO DE TRANSFERÊNCIA ESCOLAR
              </div>
              <div style={{ fontSize: 10, color: "#666" }}>PROTOCOLO: <strong>{docTransferencia.protocolo || "TRF-2026-0001"}</strong></div>
            </div>

            {/* Corpo da Declaração */}
            <div style={{ textAlign: "justify", fontSize: 12.5, lineHeight: 1.8, marginBottom: 16 }}>
              Declaramos para os devidos fins de direito e matrícula em outra instituição de ensino, que o(a) estudante <strong>{docTransferencia.alunoNome}</strong>,
              {docTransferencia.alunoNascimento ? ` nascido(a) em ${new Date(docTransferencia.alunoNascimento + "T12:00:00").toLocaleDateString("pt-BR")},` : ""}
              {docTransferencia.alunoCpf ? ` portador(a) do CPF nº ${docTransferencia.alunoCpf},` : ""}
              {docTransferencia.alunoMae ? ` filho(a) de ${docTransferencia.alunoMae},` : ""}
              {docTransferencia.alunoMatricula ? ` registrado(a) sob o Registro de Matrícula nº ${docTransferencia.alunoMatricula},` : ""}
              esteve regularmente matriculado(a) nesta unidade escolar no <strong>{docTransferencia.serieAno || docTransferencia.alunoTurma || "Ensino Fundamental"}</strong>,
              tendo requerido sua <strong>TRANSFERÊNCIA</strong> para a instituição de ensino <strong>{docTransferencia.escolaDestino}</strong>.
            </div>

            {/* Quadro de Detalhes da Transferência */}
            <div style={{ border: "1px solid #000", padding: "10px 14px", background: "#f8fafc", borderRadius: 4, marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", fontSize: 11.5 }}>
              <div><strong>Tipo de Transferência:</strong> {docTransferencia.tipo}</div>
              <div><strong>Data da Expedição:</strong> {docTransferencia.data ? new Date(docTransferencia.data + "T12:00:00").toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}</div>
              <div><strong>Escola de Origem:</strong> {docTransferencia.escolaOrigem}</div>
              <div><strong>Escola de Destino:</strong> {docTransferencia.escolaDestino}</div>
              <div><strong>Motivo do Desligamento:</strong> {docTransferencia.motivo}</div>
              <div><strong>Responsável Requerente:</strong> {docTransferencia.responsavel || docTransferencia.alunoMae || "—"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>Documentação Anexa / Status:</strong> {docTransferencia.documentacao}</div>
              {docTransferencia.observacoes && (
                <div style={{ gridColumn: "1 / -1" }}><strong>Observações da Secretaria:</strong> {docTransferencia.observacoes}</div>
              )}
            </div>

            {/* Aviso Legal sobre Validade */}
            <div style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: 8, borderRadius: 4, fontSize: 10, color: "#334155", textAlign: "center", marginBottom: 24 }}>
              <strong>AVISO LEGAL:</strong> Esta declaração provisória tem validade de <strong>30 (trinta) dias</strong> a contar de sua data de emissão, prazo no qual o Histórico Escolar oficial definitivo será expedido e entregue nos termos do Art. 24 da Lei Federal nº 9.394/96 (LDB).
            </div>

            <div style={{ textAlign: "right", fontSize: 11, marginBottom: 30 }}>
              {escolaAtual.cidade || "Maceió"} - {escolaAtual.uf || "AL"}, {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}.
            </div>

            {/* Campos de Assinaturas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, textAlign: "center", fontSize: 10 }}>
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

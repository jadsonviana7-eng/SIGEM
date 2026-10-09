import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getTurmas } from "../services/turmasService";
import { getProfessores } from "../services/professoresService";
import {
  getConteudos,
  addConteudo,
  updateConteudo,
  deleteConteudo
} from "../services/conteudosService";
import { DISCIPLINAS, ANO_LETIVO_ATUAL } from "../utils/constants";
import { Card, Badge, Btn, Modal, Input, Select, Alert, Spinner, EmptyState } from "../components/ui";

const BIMESTRES = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];

export default function Conteudos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, escolas, selectedEscolaId } = useAuth();
  const activeEscolaId = selectedEscolaId || user?.selectedEscolaId || "";
  const escolaAtual = (escolas || []).find(e => e.id === activeEscolaId) || { nome: "Escola Municipal", inep: "27000000", cidade: "Maceió", uf: "AL" };

  const { dados: turmas, carregando: cT } = useFirestore(
    useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  const { dados: professores, carregando: cP } = useFirestore(
    useCallback(() => getProfessores(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  // Filtros principais
  const [turmaSelecionada, setTurmaSelecionada] = useState(searchParams.get("turma") || "");
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState("");
  const [bimestreSelecionado, setBimestreSelecionado] = useState("");
  const [busca, setBusca] = useState("");
  const [alerta, setAlerta] = useState(null);

  // Inicializa turma se houver turmas cadastradas
  useEffect(() => {
    if (!turmaSelecionada && turmas && turmas.length > 0) {
      setTurmaSelecionada(turmas[0].nome);
    }
  }, [turmas, turmaSelecionada]);

  // Carrega conteúdos da turma selecionada
  const { dados: conteudos, carregando: cC, recarregar } = useFirestore(
    useCallback(() => getConteudos(activeEscolaId, turmaSelecionada, disciplinaSelecionada, bimestreSelecionado), [activeEscolaId, turmaSelecionada, disciplinaSelecionada, bimestreSelecionado]),
    [activeEscolaId, turmaSelecionada, disciplinaSelecionada, bimestreSelecionado]
  );

  // Modal de Registro / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [editId, setEditId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    turma: "",
    data: new Date().toISOString().split("T")[0],
    disciplina: "Português",
    conteudo: "",
    habilidades: "",
    observacao: "",
    aulasQtd: 1,
    bimestre: "1º Bimestre",
    professor: user?.displayName || user?.email || ""
  });

  // Modal de Impressão do Diário de Conteúdos
  const [modalImprimirAberto, setModalImprimirAberto] = useState(false);

  // Detalhes da Turma Selecionada
  const dadosTurmaAtual = useMemo(() => {
    return (turmas || []).find(t => t.nome === turmaSelecionada);
  }, [turmas, turmaSelecionada]);

  // Filtragem dos Conteúdos por Busca
  const conteudosFiltrados = useMemo(() => {
    return (conteudos || []).filter(item => {
      const matchBusca =
        !busca ||
        (item.conteudo || "").toLowerCase().includes(busca.toLowerCase()) ||
        (item.habilidades || "").toLowerCase().includes(busca.toLowerCase()) ||
        (item.observacao || "").toLowerCase().includes(busca.toLowerCase()) ||
        (item.professor || "").toLowerCase().includes(busca.toLowerCase());

      return matchBusca;
    });
  }, [conteudos, busca]);

  // Totais e Estatísticas
  const totalAulasRegistradas = useMemo(() => {
    return (conteudosFiltrados || []).reduce((acc, c) => acc + (Number(c.aulasQtd) || 1), 0);
  }, [conteudosFiltrados]);

  // Abrir Modal para Novo Registro
  function abrirNovoRegistro() {
    setEditId(null);
    setForm({
      turma: turmaSelecionada || (turmas?.[0]?.nome || ""),
      data: new Date().toISOString().split("T")[0],
      disciplina: disciplinaSelecionada || "Português",
      conteudo: "",
      habilidades: "",
      observacao: "",
      aulasQtd: 1,
      bimestre: bimestreSelecionado || "1º Bimestre",
      professor: user?.displayName || user?.email || ""
    });
    setModalAberto(true);
  }

  // Abrir Modal para Edição
  function abrirEditarRegistro(item) {
    setEditId(item.id);
    setForm({
      turma: item.turma || turmaSelecionada,
      data: item.data || new Date().toISOString().split("T")[0],
      disciplina: item.disciplina || "Português",
      conteudo: item.conteudo || "",
      habilidades: item.habilidades || "",
      observacao: item.observacao || "",
      aulasQtd: item.aulasQtd || 1,
      bimestre: item.bimestre || "1º Bimestre",
      professor: item.professor || user?.displayName || ""
    });
    setModalAberto(true);
  }

  // Salvar Conteúdo
  async function handleSalvar() {
    if (!form.turma) { alert("Selecione a turma."); return; }
    if (!form.data) { alert("Informe a data da aula."); return; }
    if (!form.disciplina) { alert("Selecione a disciplina."); return; }
    if (!form.conteudo.trim()) { alert("Descreva o conteúdo ministrado na aula."); return; }

    setSalvando(true);
    try {
      const payload = {
        ...form,
        aulasQtd: Number(form.aulasQtd) || 1,
        turmaAno: dadosTurmaAtual?.ano || "",
        turmaTurno: dadosTurmaAtual?.turno || "",
        professorEmail: user?.email || ""
      };

      if (editId) {
        await updateConteudo(editId, payload);
        setAlerta({ msg: "Conteúdo da aula atualizado com sucesso!", tipo: "success" });
      } else {
        await addConteudo(payload, activeEscolaId);
        setAlerta({ msg: "Aula e conteúdo registrados no diário da turma com sucesso!", tipo: "success" });
      }

      setModalAberto(false);
      recarregar();
    } catch (err) {
      alert("Erro ao salvar conteúdo: " + err.message);
    } finally {
      setSalvando(false);
    }
  }

  // Excluir Conteúdo
  async function handleExcluir(id) {
    if (!window.confirm("Deseja realmente remover este registro de aula do diário da turma?")) return;
    try {
      await deleteConteudo(id);
      setAlerta({ msg: "Registro de aula removido com sucesso.", tipo: "success" });
      recarregar();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  }

  if (cT || cP) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {alerta && <Alert tipo={alerta.tipo}>{alerta.msg}</Alert>}

      {/* Cabeçalho Principal */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ti ti-notebook" style={{ color: "#1a56db", fontSize: 26 }} />
            Caderneta Digital · Conteúdos Aplicados
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>
            Diário de classe eletrônico: registro diário de aulas, conteúdos ministrados, habilidades (BNCC) e histórico pedagógico da turma.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Btn
            variant="default"
            onClick={() => setModalImprimirAberto(true)}
            disabled={!conteudosFiltrados.length}
            style={{ fontWeight: 600 }}
          >
            <i className="ti ti-printer" /> Imprimir Diário
          </Btn>
          <Btn variant="primary" onClick={abrirNovoRegistro}>
            <i className="ti ti-plus" /> Registrar Aula / Conteúdo
          </Btn>
        </div>
      </div>

      {/* Barra Superior de Seleção de Turma, Disciplina e Bimestre */}
      <Card style={{ padding: "16px 20px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, alignItems: "end" }}>
          {/* Seletor de Turma */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              1. Turma *
            </label>
            <Select
              value={turmaSelecionada}
              onChange={e => {
                setTurmaSelecionada(e.target.value);
                setSearchParams({ turma: e.target.value });
              }}
            >
              {turmas.map(t => (
                <option key={t.id} value={t.nome}>
                  {t.nome} ({t.ano} - {t.turno})
                </option>
              ))}
            </Select>
          </div>

          {/* Seletor de Disciplina */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              2. Disciplina / Componente
            </label>
            <Select
              value={disciplinaSelecionada}
              onChange={e => setDisciplinaSelecionada(e.target.value)}
            >
              <option value="">Todas as Disciplinas</option>
              {DISCIPLINAS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>

          {/* Seletor de Bimestre */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              3. Bimestre Letivo
            </label>
            <Select
              value={bimestreSelecionado}
              onChange={e => setBimestreSelecionado(e.target.value)}
            >
              <option value="">Todos os Bimestres</option>
              {BIMESTRES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
          </div>

          {/* Campo de Busca Rápida */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              4. Buscar no Diário
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #d1d5db", borderRadius: 6, padding: "6.5px 10px" }}>
              <i className="ti ti-search" style={{ color: "#9ca3af", fontSize: 16 }} />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Tema, habilidade BNCC, docente..."
                style={{ border: "none", background: "none", fontSize: 13, outline: "none", width: "100%" }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Cards de Resumo da Turma e Carga Horária */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Card style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", color: "#1a56db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            <i className="ti ti-chalkboard" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Turma Selecionada</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{turmaSelecionada || "—"}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{dadosTurmaAtual?.ano || "Ensino Fundamental"} · Turno {dadosTurmaAtual?.turno || "Manhã"}</div>
          </div>
        </Card>

        <Card style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            <i className="ti ti-calendar-event" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Registros no Diário</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>
              {conteudosFiltrados.length} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>dias letivos</span>
            </div>
          </div>
        </Card>

        <Card style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#faf5ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            <i className="ti ti-clock-play" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Horas-Aula Ministradas</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#9333ea" }}>
              {totalAulasRegistradas} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>aulas dadas</span>
            </div>
          </div>
        </Card>

        <Card style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fffbeb", color: "#b45309", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            <i className="ti ti-book-2" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Componente / Filtro</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              {disciplinaSelecionada || "Geral (Todas)"}
            </div>
            <div style={{ fontSize: 11, color: "#b45309" }}>{bimestreSelecionado || "Todos os Bimestres"}</div>
          </div>
        </Card>
      </div>

      {/* Linha do Tempo e Tabela do Diário de Conteúdos */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-history" style={{ color: "#1a56db" }} />
            Histórico Pedagógico de Aulas Ministradas · Turma {turmaSelecionada}
          </h2>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Exibindo <strong>{conteudosFiltrados.length}</strong> registro(s)
          </span>
        </div>

        {cC ? (
          <Spinner />
        ) : !conteudosFiltrados.length ? (
          <EmptyState
            icon="notebook"
            texto={`Nenhum conteúdo registrado para a turma "${turmaSelecionada}" com os filtros atuais.`}
          >
            <div style={{ marginTop: 12 }}>
              <Btn variant="primary" onClick={abrirNovoRegistro}>
                + Registrar Primeira Aula
              </Btn>
            </div>
          </EmptyState>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {conteudosFiltrados.map((item, idx) => (
              <Card
                key={item.id || idx}
                style={{
                  padding: "16px 20px",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  {/* Bloco Esquerda: Data, Disciplina e Bimestre */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: 8,
                      padding: "6px 12px",
                      minWidth: 70
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#1e40af", lineHeight: 1 }}>
                        {item.data ? new Date(item.data + "T12:00:00").getDate() : "—"}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#3b82f6", marginTop: 2 }}>
                        {item.data ? new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" }) : ""}
                      </span>
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                          {item.disciplina}
                        </span>
                        <Badge color="blue">{item.bimestre || "1º Bimestre"}</Badge>
                        <Badge color="gray">{item.aulasQtd || 1} aula(s)</Badge>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        Data: <strong>{item.data ? new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</strong> · Docente: <strong>{item.professor || "Professor Regente"}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn
                      variant="default"
                      onClick={() => abrirEditarRegistro(item)}
                      style={{ padding: "4px 8px", fontSize: 11 }}
                      title="Editar Aula"
                    >
                      <i className="ti ti-edit" /> Editar
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={() => handleExcluir(item.id)}
                      style={{ padding: "4px 8px", fontSize: 11 }}
                      title="Excluir Registro"
                    >
                      <i className="ti ti-trash" />
                    </Btn>
                  </div>
                </div>

                {/* Bloco Central: Conteúdo Ministrado */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
                    Conteúdo Ministrado:
                  </div>
                  <div style={{ fontSize: 13.5, color: "#1e293b", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                    {item.conteudo}
                  </div>
                </div>

                {/* Habilidade / Competência (BNCC) */}
                {item.habilidades && (
                  <div style={{ marginTop: 10, background: "#f8fafc", padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0284c7", textTransform: "uppercase", display: "inline-block", marginRight: 6 }}>
                      <i className="ti ti-target-arrow" style={{ marginRight: 4 }} />
                      Habilidade / Competência (BNCC):
                    </span>
                    <span style={{ fontSize: 12, color: "#334155" }}>
                      {item.habilidades}
                    </span>
                  </div>
                )}

                {/* Observações Pedagógicas */}
                {item.observacao && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#64748b", fontStyle: "italic", display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <i className="ti ti-info-circle" style={{ fontSize: 14, color: "#94a3b8", marginTop: 2 }} />
                    <span><strong>Observações:</strong> {item.observacao}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR / EDITAR AULA E CONTEÚDO                                 */}
      {/* ========================================================================= */}
      {modalAberto && (
        <Modal
          titulo={editId ? `Editar Registro de Aula · Turma ${form.turma}` : `Registrar Conteúdo de Aula · Turma ${form.turma}`}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          textSave={editId ? "Atualizar Aula" : "Salvar no Diário da Turma"}
          width={650}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  Turma *
                </label>
                <Select
                  value={form.turma}
                  onChange={e => setForm(f => ({ ...f, turma: e.target.value }))}
                >
                  {turmas.map(t => (
                    <option key={t.id} value={t.nome}>{t.nome} ({t.ano} - {t.turno})</option>
                  ))}
                </Select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  Data da Aula *
                </label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 100px", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  Disciplina / Componente *
                </label>
                <Select
                  value={form.disciplina}
                  onChange={e => setForm(f => ({ ...f, disciplina: e.target.value }))}
                >
                  {DISCIPLINAS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  Bimestre *
                </label>
                <Select
                  value={form.bimestre}
                  onChange={e => setForm(f => ({ ...f, bimestre: e.target.value }))}
                >
                  {BIMESTRES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  Nº Aulas *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="6"
                  value={form.aulasQtd}
                  onChange={e => setForm(f => ({ ...f, aulasQtd: e.target.value }))}
                />
              </div>
            </div>

            {/* Conteúdo Ministrado */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                Conteúdo Ministrado (Assunto / Tema da Aula) *
              </label>
              <textarea
                value={form.conteudo}
                onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
                placeholder="Ex: Leitura e interpretação de texto poético; Estrutura de versos e estrofes; Resolução de exercícios da página 45 a 48..."
                style={{
                  width: "100%",
                  minHeight: 80,
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "10px",
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none"
                }}
              />
            </div>

            {/* Habilidade / Competência */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                Habilidade / Competência Desenvolvida (BNCC / Currículo)
              </label>
              <Input
                value={form.habilidades}
                onChange={e => setForm(f => ({ ...f, habilidades: e.target.value }))}
                placeholder="Ex: EF06LP01, EF06MA02 - Identificar a função social de textos que circulam em campos da vida social..."
              />
            </div>

            {/* Professor e Observações */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  Docente Responsável
                </label>
                <Input
                  value={form.professor}
                  onChange={e => setForm(f => ({ ...f, professor: e.target.value }))}
                  placeholder="Nome do professor..."
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  Observações Pedagógicas (Opcional)
                </label>
                <Input
                  value={form.observacao}
                  onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                  placeholder="Ex: Atividade em grupo; Tarefa de casa nº 3..."
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMPRESSÃO DO DIÁRIO DE CLASSE / CONTEÚDOS MINISTRADOS              */}
      {/* ========================================================================= */}
      {modalImprimirAberto && (
        <Modal
          titulo="Diário de Classe Oficial · Conteúdos Ministrados"
          onClose={() => setModalImprimirAberto(false)}
          onSave={() => window.print()}
          textSave="Imprimir Diário"
          width={760}
        >
          <div style={{ border: "2px solid #000", padding: "20px 24px", background: "white", borderRadius: 4, fontSize: 11, lineHeight: 1.5 }}>
            {/* Cabeçalho Oficial */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>ESTADO DE ALAGOAS · SECRETARIA MUNICIPAL DE EDUCAÇÃO</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#1e3a8a", marginTop: 2 }}>{escolaAtual.nome || "ESCOLA MUNICIPAL"}</div>
              <div style={{ fontSize: 10, color: "#555" }}>CADERNETA DIGITAL · DIÁRIO DE REGISTRO DE CONTEÚDOS E HABILIDADES TRABALHADAS · ANO {ANO_LETIVO_ATUAL}</div>
            </div>

            {/* Quadro de Identificação */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px 12px", background: "#f8fafc", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 4, marginBottom: 14, fontSize: 11 }}>
              <div><strong>Turma:</strong> {turmaSelecionada} ({dadosTurmaAtual?.ano || "—"})</div>
              <div><strong>Turno:</strong> {dadosTurmaAtual?.turno || "Manhã"}</div>
              <div><strong>Componente:</strong> {disciplinaSelecionada || "Todas as Disciplinas"}</div>
              <div><strong>Bimestre:</strong> {bimestreSelecionado || "Todos os Bimestres"}</div>
              <div><strong>Total de Aulas Dadas:</strong> {totalAulasRegistradas} hora(s)-aula</div>
              <div><strong>Emissão:</strong> {new Date().toLocaleDateString("pt-BR")}</div>
            </div>

            {/* Tabela de Aulas */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr style={{ background: "#f0f0f0", borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", width: 70 }}>Data</th>
                  <th style={{ padding: "6px 8px", textAlign: "center", width: 45 }}>Aulas</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", width: 95 }}>Disciplina</th>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>Conteúdo Ministrado</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", width: 140 }}>Habilidade (BNCC)</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", width: 110 }}>Docente</th>
                </tr>
              </thead>
              <tbody>
                {conteudosFiltrados.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: "1px solid #ccc" }}>
                    <td style={{ padding: "5px 8px", whiteSpace: "nowrap" }}>
                      {item.data ? new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td style={{ padding: "5px 8px", textAlign: "center", fontWeight: 700 }}>
                      {item.aulasQtd || 1}
                    </td>
                    <td style={{ padding: "5px 8px", fontWeight: 600 }}>
                      {item.disciplina}
                    </td>
                    <td style={{ padding: "5px 8px" }}>
                      <div>{item.conteudo}</div>
                      {item.observacao && (
                        <div style={{ fontSize: 9, color: "#666", fontStyle: "italic", marginTop: 2 }}>Obs: {item.observacao}</div>
                      )}
                    </td>
                    <td style={{ padding: "5px 8px", fontSize: 9.5 }}>
                      {item.habilidades || "—"}
                    </td>
                    <td style={{ padding: "5px 8px", fontSize: 9.5 }}>
                      {item.professor || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Assinaturas */}
            <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, textAlign: "center", fontSize: 9.5 }}>
              <div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 4 }}>Assinatura do(a) Professor(a) Regente</div>
              </div>
              <div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 4 }}>Coordenação Pedagógica / Visto</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

import React, { useState, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import {
  getDisciplinas,
  addDisciplina,
  updateDisciplina,
  deleteDisciplina,
  seedDisciplinasPadrao,
  AREAS_CONHECIMENTO,
  TIPOS_COMPONENTE,
  CORES_DISCIPLINA,
  ICONES_DISCIPLINA
} from "../services/disciplinasService";
import { registrarAuditoria } from "../services/auditoriaService";
import { ANOS_LETIVOS } from "../utils/constants";
import { Badge, Btn, Modal, Input, Select, Alert, Spinner, EmptyState, Card } from "../components/ui";

const VAZIO_DISCIPLINA = {
  nome: "",
  codigo: "",
  areaConhecimento: "Linguagens",
  tipo: "Base Nacional Comum Curricular (BNCC)",
  cargaHorariaSemanal: 2,
  cargaHorariaAnual: 80,
  anos: ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano"],
  obrigatoria: true,
  reprova: true,
  cor: "#3b82f6",
  icone: "ti-book",
  status: "Ativa",
  ordem: 10,
  descricao: ""
};

export default function Disciplinas() {
  const { user, selectedEscolaId, escolas } = useAuth();
  const activeEscolaId = user?.selectedEscolaId || selectedEscolaId || "";
  const escolaAtual = (escolas || []).find(e => e.id === activeEscolaId);

  // Carregamento reativo das disciplinas
  const {
    dados: disciplinas = [],
    carregando,
    recarregar
  } = useFirestore(
    useCallback(() => getDisciplinas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  // Estados locais de interface
  const [busca, setBusca] = useState("");
  const [filtroArea, setFiltroArea] = useState("TODAS");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroAno, setFiltroAno] = useState("TODOS");

  const [visualizacao, setVisualizacao] = useState(() => {
    return localStorage.getItem("sigem_disciplinas_view") || "bloco";
  });

  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [disciplinaExcluindo, setDisciplinaExcluindo] = useState(null);

  const [form, setForm] = useState(VAZIO_DISCIPLINA);
  const [editId, setEditId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  function alterarVisualizacao(modo) {
    setVisualizacao(modo);
    localStorage.setItem("sigem_disciplinas_view", modo);
  }

  function abrirNova() {
    setForm({
      ...VAZIO_DISCIPLINA,
      ordem: (disciplinas.length + 1) * 10
    });
    setEditId(null);
    setModalFormAberto(true);
  }

  function abrirEditar(d) {
    setForm({
      nome: d.nome || "",
      codigo: d.codigo || "",
      areaConhecimento: d.areaConhecimento || "Linguagens",
      tipo: d.tipo || "Base Nacional Comum Curricular (BNCC)",
      cargaHorariaSemanal: d.cargaHorariaSemanal || 2,
      cargaHorariaAnual: d.cargaHorariaAnual || 80,
      anos: Array.isArray(d.anos) ? d.anos : ["1º Ano"],
      obrigatoria: d.obrigatoria !== false,
      reprova: d.reprova !== false,
      cor: d.cor || "#3b82f6",
      icone: d.icone || "ti-book",
      status: d.status || "Ativa",
      ordem: d.ordem || 10,
      descricao: d.descricao || ""
    });
    setEditId(d.id);
    setModalFormAberto(true);
  }

  function confirmarExclusao(d) {
    setDisciplinaExcluindo(d);
    setModalExcluirAberto(true);
  }

  async function handleSalvar() {
    if (!form.nome?.trim()) {
      setAlerta({ tipo: "error", msg: "Informe o nome da disciplina." });
      return;
    }
    if (!form.codigo?.trim()) {
      setAlerta({ tipo: "error", msg: "Informe uma sigla ou código abreviado (Ex: MAT, PORT)." });
      return;
    }

    setSalvando(true);
    try {
      if (editId && !editId.startsWith("padrao_")) {
        await updateDisciplina(editId, form);
        await registrarAuditoria({
          usuario: user,
          escolaId: activeEscolaId,
          escolaNome: escolaAtual?.nome || "Rede Municipal de Ensino",
          modulo: "Disciplinas",
          acao: "EDICAO_DISCIPLINA",
          entidade: "Disciplina",
          entidadeId: editId,
          entidadeNome: form.nome,
          registroNovo: `${form.nome} (${form.codigo} · ${form.areaConhecimento} · ${form.cargaHorariaSemanal}h/sem)`,
          descricao: `${user?.displayName || "Administrador"} atualizou o componente curricular ${form.nome}`
        });
        setAlerta({ tipo: "success", msg: `Disciplina "${form.nome}" atualizada com sucesso!` });
      } else {
        const docRef = await addDisciplina(form, activeEscolaId);
        await registrarAuditoria({
          usuario: user,
          escolaId: activeEscolaId,
          escolaNome: escolaAtual?.nome || "Rede Municipal de Ensino",
          modulo: "Disciplinas",
          acao: "CRIACAO_DISCIPLINA",
          entidade: "Disciplina",
          entidadeId: docRef?.id || "",
          entidadeNome: form.nome,
          registroNovo: `${form.nome} (${form.codigo} · ${form.areaConhecimento} · ${form.cargaHorariaSemanal}h/sem)`,
          descricao: `${user?.displayName || "Administrador"} criou o novo componente curricular ${form.nome}`
        });
        setAlerta({ tipo: "success", msg: `Disciplina "${form.nome}" cadastrada com sucesso!` });
      }
      setModalFormAberto(false);
      recarregar();
    } catch (err) {
      console.error(err);
      setAlerta({ tipo: "error", msg: "Erro ao salvar disciplina: " + err.message });
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir() {
    if (!disciplinaExcluindo) return;
    setSalvando(true);
    try {
      if (!disciplinaExcluindo.id.startsWith("padrao_")) {
        await deleteDisciplina(disciplinaExcluindo.id);
      }
      await registrarAuditoria({
        usuario: user,
        escolaId: activeEscolaId,
        escolaNome: escolaAtual?.nome || "Rede Municipal de Ensino",
        modulo: "Disciplinas",
        acao: "EXCLUSAO_DISCIPLINA",
        entidade: "Disciplina",
        entidadeId: disciplinaExcluindo.id,
        entidadeNome: disciplinaExcluindo.nome,
        registroNovo: "Excluída do Sistema",
        descricao: `${user?.displayName || "Administrador"} removeu a disciplina ${disciplinaExcluindo.nome}`
      });
      setAlerta({ tipo: "success", msg: `Disciplina "${disciplinaExcluindo.nome}" removida.` });
      setModalExcluirAberto(false);
      setDisciplinaExcluindo(null);
      recarregar();
    } catch (err) {
      setAlerta({ tipo: "error", msg: "Erro ao excluir: " + err.message });
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlternarStatus(d) {
    const novoStatus = d.status === "Ativa" ? "Inativa" : "Ativa";
    try {
      if (!d.id.startsWith("padrao_")) {
        await updateDisciplina(d.id, { status: novoStatus });
      } else {
        await addDisciplina({ ...d, status: novoStatus }, activeEscolaId);
      }
      setAlerta({ tipo: "success", msg: `Disciplina "${d.nome}" alterada para ${novoStatus}.` });
      recarregar();
    } catch (err) {
      setAlerta({ tipo: "error", msg: "Erro ao alterar status: " + err.message });
    }
  }

  async function handleGravarBasePadraoBNCC() {
    if (!window.confirm("Deseja gravar a matriz inicial com todas as disciplinas oficiais da BNCC no banco de dados da rede?")) return;
    setSalvando(true);
    try {
      await seedDisciplinasPadrao(activeEscolaId || "rede");
      setAlerta({ tipo: "success", msg: "Matriz Curricular BNCC oficial gravada com sucesso!" });
      recarregar();
    } catch (err) {
      setAlerta({ tipo: "error", msg: "Erro ao gravar disciplinas padrão: " + err.message });
    } finally {
      setSalvando(false);
    }
  }

  // Filtragem inteligente de disciplinas
  const disciplinasFiltradas = useMemo(() => {
    return disciplinas.filter((d) => {
      // Busca por nome ou código
      const termo = busca.toLowerCase();
      const matchBusca =
        !termo ||
        (d.nome && d.nome.toLowerCase().includes(termo)) ||
        (d.codigo && d.codigo.toLowerCase().includes(termo)) ||
        (d.areaConhecimento && d.areaConhecimento.toLowerCase().includes(termo));

      // Filtro por Área
      const matchArea = filtroArea === "TODAS" || d.areaConhecimento === filtroArea;

      // Filtro por Tipo
      const matchTipo = filtroTipo === "TODOS" || d.tipo === filtroTipo;

      // Filtro por Status
      const matchStatus = filtroStatus === "TODOS" || d.status === filtroStatus;

      // Filtro por Ano/Etapa
      const matchAno =
        filtroAno === "TODOS" ||
        (Array.isArray(d.anos) && d.anos.includes(filtroAno));

      return matchBusca && matchArea && matchTipo && matchStatus && matchAno;
    });
  }, [disciplinas, busca, filtroArea, filtroTipo, filtroStatus, filtroAno]);

  // Estatísticas e Métricas da Matriz Curricular
  const estatisticas = useMemo(() => {
    const total = disciplinas.length;
    const ativas = disciplinas.filter(d => d.status === "Ativa").length;
    const bncc = disciplinas.filter(d => d.tipo?.includes("BNCC")).length;
    const diversificada = disciplinas.filter(d => !d.tipo?.includes("BNCC")).length;
    const totalAulasSemanais = disciplinas
      .filter(d => d.status === "Ativa")
      .reduce((acc, curr) => acc + (Number(curr.cargaHorariaSemanal) || 0), 0);

    return { total, ativas, bncc, diversificada, totalAulasSemanais };
  }, [disciplinas]);

  // Manipulação de seleção rápida de anos
  function toggleAno(ano) {
    setForm(f => {
      const jaTem = f.anos.includes(ano);
      return {
        ...f,
        anos: jaTem ? f.anos.filter(a => a !== ano) : [...f.anos, ano]
      };
    });
  }

  function selecionarTodosAnos() {
    setForm(f => ({ ...f, anos: [...ANOS_LETIVOS] }));
  }

  function selecionarAnosIniciais() {
    setForm(f => ({ ...f, anos: ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano"] }));
  }

  function selecionarAnosFinais() {
    setForm(f => ({ ...f, anos: ["6º Ano", "7º Ano", "8º Ano", "9º Ano"] }));
  }

  function limparAnos() {
    setForm(f => ({ ...f, anos: [] }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Alerta de Feedback */}
      {alerta && (
        <Alert tipo={alerta.tipo} onClose={() => setAlerta(null)}>
          {alerta.msg}
        </Alert>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 1. CABEÇALHO & CARDS DE INDICADORES (KPIS)                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16
      }}>
        {/* Card 1: Total de Disciplinas */}
        <Card style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
            color: "#818cf8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            border: "1px solid rgba(99, 102, 241, 0.3)"
          }}>
            <i className="ti ti-books" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Total de Componentes
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
              {estatisticas.total}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
              {estatisticas.ativas} ativas no currículo
            </div>
          </div>
        </Card>

        {/* Card 2: BNCC Obrigatória */}
        <Card style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)",
            color: "#34d399",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            border: "1px solid rgba(16, 185, 129, 0.3)"
          }}>
            <i className="ti ti-certificate" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Base Nacional (BNCC)
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
              {estatisticas.bncc}
            </div>
            <div style={{ fontSize: 11, color: "#10b981", marginTop: 2 }}>
              Disciplinas obrigatórias
            </div>
          </div>
        </Card>

        {/* Card 3: Parte Diversificada / Eletivas */}
        <Card style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)",
            color: "#fbbf24",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            border: "1px solid rgba(245, 158, 11, 0.3)"
          }}>
            <i className="ti ti-sparkles" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Parte Diversificada
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
              {estatisticas.diversificada}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
              Eletivas & Itinerários
            </div>
          </div>
        </Card>

        {/* Card 4: Matriz Semanal Total */}
        <Card style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(2, 132, 199, 0.2) 100%)",
            color: "#38bdf8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            border: "1px solid rgba(14, 165, 233, 0.3)"
          }}>
            <i className="ti ti-clock-hour-4" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Aulas Cadastradas
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
              {estatisticas.totalAulasSemanais}h/sem
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
              Carga horária semanal total
            </div>
          </div>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 2. BARRA DE CONTROLE, FILTROS & AÇÕES                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Card style={{ padding: "16px 20px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14
        }}>
          {/* Esquerda: Campo de Busca com Ícone */}
          <div style={{ flex: "1 1 280px", maxWidth: 360 }}>
            <Input
              icon="ti ti-search"
              placeholder="Buscar por nome, sigla ou área..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {/* Centro: Filtros Rápidos */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {/* Filtro por Área de Conhecimento */}
            <div style={{ minWidth: 150 }}>
              <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
                <option value="TODAS">Todas as Áreas</option>
                {AREAS_CONHECIMENTO.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </Select>
            </div>

            {/* Filtro por Tipo de Componente */}
            <div style={{ minWidth: 150 }}>
              <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="TODOS">Todos os Tipos</option>
                {TIPOS_COMPONENTE.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </Select>
            </div>

            {/* Filtro por Ano / Etapa */}
            <div style={{ minWidth: 140 }}>
              <Select value={filtroAno} onChange={(e) => setFiltroAno(e.target.value)}>
                <option value="TODOS">Todos os Anos</option>
                {ANOS_LETIVOS.map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </Select>
            </div>

            {/* Filtro por Status */}
            <div style={{ minWidth: 120 }}>
              <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                <option value="TODOS">Status: Todos</option>
                <option value="Ativa">Ativas</option>
                <option value="Inativa">Inativas</option>
              </Select>
            </div>
          </div>

          {/* Direita: Alternador de Visualização & Botão Nova Disciplina */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Alternador Segmentado: Blocos / Lista */}
            <div style={{
              display: "inline-flex",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              padding: 3,
              gap: 2
            }}>
              <button
                type="button"
                onClick={() => alterarVisualizacao("bloco")}
                title="Visualização em Blocos"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: visualizacao === "bloco" ? 700 : 500,
                  background: visualizacao === "bloco" ? "var(--bg-card)" : "transparent",
                  color: visualizacao === "bloco" ? "var(--accent-indigo, #818cf8)" : "var(--text-muted)",
                  boxShadow: visualizacao === "bloco" ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                <i className="ti ti-layout-grid" />
                <span>Blocos</span>
              </button>
              <button
                type="button"
                onClick={() => alterarVisualizacao("lista")}
                title="Visualização em Tabela"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: visualizacao === "lista" ? 700 : 500,
                  background: visualizacao === "lista" ? "var(--bg-card)" : "transparent",
                  color: visualizacao === "lista" ? "var(--accent-indigo, #818cf8)" : "var(--text-muted)",
                  boxShadow: visualizacao === "lista" ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                <i className="ti ti-list" />
                <span>Lista</span>
              </button>
            </div>

            {/* Botão + Nova Disciplina */}
            <Btn variant="primary" onClick={abrirNova} style={{ padding: "9px 16px", fontWeight: 700 }}>
              <i className="ti ti-plus" />
              <span>Nova Disciplina</span>
            </Btn>
          </div>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 3. CONTEÚDO PRINCIPAL (BLOCOS OU LISTA)                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {carregando ? (
        <Spinner />
      ) : disciplinasFiltradas.length === 0 ? (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <EmptyState
            icone="ti ti-books"
            titulo="Nenhuma disciplina encontrada"
            descricao={
              busca || filtroArea !== "TODAS" || filtroStatus !== "TODOS" || filtroAno !== "TODOS"
                ? "Tente ajustar os filtros ou a busca digitada acima."
                : "Cadastre novas disciplinas curriculares ou inicialize com a matriz oficial padrão da BNCC."
            }
            acao={
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
                <Btn variant="primary" onClick={abrirNova}>
                  <i className="ti ti-plus" /> Criar Primeira Disciplina
                </Btn>
                <Btn variant="default" onClick={handleGravarBasePadraoBNCC} disabled={salvando}>
                  <i className="ti ti-sparkles" /> Restaurar Padrão BNCC
                </Btn>
              </div>
            }
          />
        </Card>
      ) : visualizacao === "bloco" ? (
        /* VISUALIZAÇÃO EM BLOCOS (CARDS INTERATIVOS) */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 18
        }}>
          {disciplinasFiltradas.map((d) => {
            const corTema = d.cor || "#3b82f6";
            const icone = d.icone ? (d.icone.startsWith("ti-") ? `ti ${d.icone}` : d.icone) : "ti ti-book";
            const isAtiva = d.status === "Ativa";

            return (
              <div
                key={d.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  position: "relative"
                }}
              >
                {/* Faixa superior de cor personalizada da disciplina */}
                <div style={{ height: 6, background: corTema, width: "100%" }} />

                <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Topo do Card: Ícone, Código e Badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${corTema}20`,
                        color: corTema,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        border: `1px solid ${corTema}40`,
                        flexShrink: 0
                      }}>
                        <i className={icone} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            padding: "2px 6px",
                            borderRadius: 6,
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-secondary)"
                          }}>
                            {d.codigo || "DISC"}
                          </span>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: isAtiva ? "#10b981" : "var(--text-muted)"
                          }}>
                            ● {isAtiva ? "Ativa" : "Inativa"}
                          </span>
                        </div>
                        <h4 style={{
                          margin: "4px 0 0",
                          fontSize: 16,
                          fontWeight: 800,
                          color: "var(--text-primary)",
                          lineHeight: 1.25
                        }}>
                          {d.nome}
                        </h4>
                      </div>
                    </div>

                    {/* Botão de Menu/Ação Rápida */}
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => abrirEditar(d)}
                        title="Editar Disciplina"
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-secondary)",
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <i className="ti ti-edit" style={{ fontSize: 15 }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmarExclusao(d)}
                        title="Excluir Disciplina"
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-color)",
                          color: "#f87171",
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <i className="ti ti-trash" style={{ fontSize: 15 }} />
                      </button>
                    </div>
                  </div>

                  {/* Informações de Carga Horária e Área */}
                  <div style={{
                    background: "var(--bg-surface)",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border-subtle)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    fontSize: 11.5
                  }}>
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block", fontSize: 10, textTransform: "uppercase" }}>
                        Área de Conhecimento
                      </span>
                      <strong style={{ color: "var(--text-primary)" }}>{d.areaConhecimento || "Linguagens"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block", fontSize: 10, textTransform: "uppercase" }}>
                        Carga Horária
                      </span>
                      <strong style={{ color: "var(--text-primary)" }}>
                        {d.cargaHorariaSemanal}h/sem ({d.cargaHorariaAnual}h/ano)
                      </strong>
                    </div>
                  </div>

                  {/* Descrição / Ementa (se houver) */}
                  {d.descricao && (
                    <p style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      margin: 0,
                      lineHeight: 1.45,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}>
                      {d.descricao}
                    </p>
                  )}

                  {/* Anos / Séries atendidas */}
                  <div>
                    <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>
                      Etapas Curriculares ({Array.isArray(d.anos) ? d.anos.length : 0} séries):
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {(Array.isArray(d.anos) ? d.anos : []).map((ano) => (
                        <span
                          key={ano}
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 6,
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-secondary)"
                          }}
                        >
                          {ano}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rodapé com tags de obrigatoriedade e alternador rápido de status */}
                  <div style={{
                    marginTop: "auto",
                    paddingTop: 10,
                    borderTop: "1px solid var(--border-color)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {d.obrigatoria ? (
                        <Badge color="blue">Obrigatória</Badge>
                      ) : (
                        <Badge color="gray">Optativa / Eletiva</Badge>
                      )}
                      {d.reprova && (
                        <Badge color="red">Reprova</Badge>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAlternarStatus(d)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: isAtiva ? "#f87171" : "#34d399",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <i className={isAtiva ? "ti ti-toggle-right" : "ti ti-toggle-left"} style={{ fontSize: 18 }} />
                      <span>{isAtiva ? "Desativar" : "Ativar"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM LISTA (TABELA DETALHADA) */
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{
                  background: "var(--bg-surface)",
                  borderBottom: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em"
                }}>
                  <th style={{ padding: "14px 18px", width: 90 }}>Código</th>
                  <th style={{ padding: "14px 18px" }}>Disciplina</th>
                  <th style={{ padding: "14px 18px" }}>Área de Conhecimento</th>
                  <th style={{ padding: "14px 18px" }}>Carga Horária</th>
                  <th style={{ padding: "14px 18px" }}>Etapas Atendidas</th>
                  <th style={{ padding: "14px 18px" }}>Tipo</th>
                  <th style={{ padding: "14px 18px", width: 100 }}>Status</th>
                  <th style={{ padding: "14px 18px", textAlign: "right", width: 120 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {disciplinasFiltradas.map((d) => {
                  const corTema = d.cor || "#3b82f6";
                  const icone = d.icone ? (d.icone.startsWith("ti-") ? `ti ${d.icone}` : d.icone) : "ti ti-book";
                  const isAtiva = d.status === "Ativa";

                  return (
                    <tr
                      key={d.id}
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        transition: "background 0.15s ease"
                      }}
                    >
                      <td style={{ padding: "12px 18px" }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: `${corTema}20`,
                          color: corTema,
                          border: `1px solid ${corTema}40`
                        }}>
                          {d.codigo || "DISC"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: `${corTema}15`,
                            color: corTema,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                            flexShrink: 0
                          }}>
                            <i className={icone} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{d.nome}</div>
                            {d.descricao && (
                              <div style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 300, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {d.descricao}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 18px", color: "var(--text-secondary)" }}>
                        {d.areaConhecimento || "Linguagens"}
                      </td>
                      <td style={{ padding: "12px 18px", color: "var(--text-primary)" }}>
                        <strong>{d.cargaHorariaSemanal}h</strong>/sem <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({d.cargaHorariaAnual}h/ano)</span>
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 220 }}>
                          {(Array.isArray(d.anos) ? d.anos : []).slice(0, 3).map((a) => (
                            <span
                              key={a}
                              style={{
                                fontSize: 10,
                                padding: "2px 5px",
                                borderRadius: 4,
                                background: "var(--bg-surface)",
                                border: "1px solid var(--border-color)",
                                color: "var(--text-secondary)"
                              }}
                            >
                              {a}
                            </span>
                          ))}
                          {(Array.isArray(d.anos) ? d.anos : []).length > 3 && (
                            <span style={{ fontSize: 10, color: "var(--text-muted)", alignSelf: "center" }}>
                              +{(d.anos.length - 3)} mais
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        <Badge color={d.obrigatoria ? "blue" : "gray"}>
                          {d.obrigatoria ? "BNCC Obrigatória" : "Optativa"}
                        </Badge>
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        <Badge color={isAtiva ? "green" : "red"}>
                          {isAtiva ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => abrirEditar(d)}
                            title="Editar Disciplina"
                            style={{
                              background: "var(--bg-surface)",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-secondary)",
                              width: 30,
                              height: 30,
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer"
                            }}
                          >
                            <i className="ti ti-edit" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmarExclusao(d)}
                            title="Excluir Disciplina"
                            style={{
                              background: "var(--bg-surface)",
                              border: "1px solid var(--border-color)",
                              color: "#f87171",
                              width: 30,
                              height: 30,
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer"
                            }}
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 4. MODAL: CRIAR / EDITAR DISCIPLINA CURRICULAR                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {modalFormAberto && (
        <Modal
          titulo={editId ? `Editar Disciplina: ${form.nome}` : "Cadastrar Nova Disciplina"}
          onClose={() => setModalFormAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          textSave={editId ? "Salvar Alterações" : "Criar Disciplina"}
          size="lg"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Bloco 1: Identificação Básica */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
              <Input
                label="Nome do Componente Curricular *"
                placeholder="Ex: Língua Portuguesa, Robótica Educacional..."
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
              <Input
                label="Código / Sigla *"
                placeholder="Ex: PORT, MAT, ROB"
                value={form.codigo}
                maxLength={6}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
              />
            </div>

            {/* Bloco 2: Área de Conhecimento e Tipo */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Select
                label="Área de Conhecimento (BNCC) *"
                value={form.areaConhecimento}
                onChange={(e) => setForm((f) => ({ ...f, areaConhecimento: e.target.value }))}
              >
                {AREAS_CONHECIMENTO.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </Select>

              <Select
                label="Tipo de Componente Curricular"
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              >
                {TIPOS_COMPONENTE.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </Select>
            </div>

            {/* Bloco 3: Cargas Horárias e Status */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <Input
                label="Carga Semanal (Aulas/sem) *"
                type="number"
                min={1}
                max={20}
                value={form.cargaHorariaSemanal}
                onChange={(e) => setForm((f) => ({ ...f, cargaHorariaSemanal: e.target.value }))}
              />
              <Input
                label="Carga Anual Estimada (Horas) *"
                type="number"
                min={10}
                max={400}
                value={form.cargaHorariaAnual}
                onChange={(e) => setForm((f) => ({ ...f, cargaHorariaAnual: e.target.value }))}
              />
              <Select
                label="Status da Disciplina"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="Ativa">Ativa</option>
                <option value="Inativa">Inativa</option>
              </Select>
            </div>

            {/* Bloco 4: Regras de Avaliação e Obrigatoriedade */}
            <div style={{
              background: "var(--bg-surface)",
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: 16
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-primary)" }}>
                <input
                  type="checkbox"
                  checked={form.obrigatoria}
                  onChange={(e) => setForm((f) => ({ ...f, obrigatoria: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: "#6366f1" }}
                />
                <span><strong>Componente Obrigatório</strong> (Exigido na matriz da série)</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-primary)" }}>
                <input
                  type="checkbox"
                  checked={form.reprova}
                  onChange={(e) => setForm((f) => ({ ...f, reprova: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: "#ef4444" }}
                />
                <span><strong>Gera Reprovação</strong> por nota ou frequência</span>
              </label>
            </div>

            {/* Bloco 5: Séries / Etapas Atendidas */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
                  Séries & Etapas que cursam este Componente ({form.anos.length} selecionadas):
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn size="sm" variant="default" onClick={selecionarTodosAnos}>Todos</Btn>
                  <Btn size="sm" variant="default" onClick={selecionarAnosIniciais}>1º ao 5º</Btn>
                  <Btn size="sm" variant="default" onClick={selecionarAnosFinais}>6º ao 9º</Btn>
                  <Btn size="sm" variant="ghost" onClick={limparAnos}>Limpar</Btn>
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: 8,
                background: "var(--bg-surface)",
                padding: 12,
                borderRadius: 10,
                border: "1px solid var(--border-subtle)"
              }}>
                {ANOS_LETIVOS.map((ano) => {
                  const selecionado = form.anos.includes(ano);
                  return (
                    <button
                      key={ano}
                      type="button"
                      onClick={() => toggleAno(ano)}
                      style={{
                        padding: "6px 8px",
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: selecionado ? 700 : 500,
                        border: selecionado ? "1px solid #6366f1" : "1px solid var(--border-color)",
                        background: selecionado ? "rgba(99, 102, 241, 0.2)" : "var(--bg-card)",
                        color: selecionado ? "#818cf8" : "var(--text-secondary)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textAlign: "center"
                      }}
                    >
                      {selecionado ? "✓ " : ""}{ano}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloco 6: Identidade Visual (Cor & Ícone) */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
                  Cor Temática do Componente
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CORES_DISCIPLINA.map((c) => {
                    const ativa = form.cor === c.valor;
                    return (
                      <button
                        key={c.valor}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, cor: c.valor }))}
                        title={c.nome}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: c.valor,
                          border: ativa ? "3px solid #ffffff" : "2px solid transparent",
                          boxShadow: ativa ? "0 0 0 2px #6366f1" : "none",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
                  Ícone Representativo
                </label>
                <Select
                  value={form.icone}
                  onChange={(e) => setForm((f) => ({ ...f, icone: e.target.value }))}
                >
                  {ICONES_DISCIPLINA.map((i) => (
                    <option key={i.icon} value={i.icon}>
                      {i.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Bloco 7: Ementa / Descrição Curricular */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Ementa / Objetivos Pedagógicos (Opcional)
              </label>
              <textarea
                rows={3}
                placeholder="Descreva brevemente os objetivos da disciplina, habilidades prioritárias ou diretrizes pedagógicas..."
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  resize: "vertical"
                }}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 5. MODAL: CONFIRMAÇÃO DE EXCLUSÃO                             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {modalExcluirAberto && disciplinaExcluindo && (
        <Modal
          titulo="Confirmar Exclusão de Disciplina"
          onClose={() => setModalExcluirAberto(false)}
          onSave={handleExcluir}
          salvando={salvando}
          textSave="Sim, Excluir Disciplina"
          size="sm"
        >
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              margin: "0 auto 16px"
            }}>
              <i className="ti ti-alert-triangle" />
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
              Excluir "{disciplinaExcluindo.nome}"?
            </h4>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
              Esta ação removerá o componente curricular do cadastro geral da rede.
              Turmas e notas já consolidadas com este nome permanecerão nos registros históricos.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

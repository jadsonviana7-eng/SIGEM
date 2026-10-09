import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAllProfessores, getProfessores } from "../services/professoresService";
import {
  getFolhaCompetencia,
  processarFolhaCompetencia,
  getParametrosFolha,
  salvarParametrosFolha,
  PARAMETROS_PADRAO_FOLHA
} from "../services/folhaPagamentoService";
import {
  getPontosCompetencia,
  salvarPontosEmLote,
  atualizarStatusPontoEscola
} from "../services/pontoService";
import { Card, Badge, Btn, Input, Spinner, EmptyState } from "../components/ui";
import HoleriteModal from "../components/folha/HoleriteModal";

const MESES = [
  { valor: 1, nome: "Janeiro" },
  { valor: 2, nome: "Fevereiro" },
  { valor: 3, nome: "Março" },
  { valor: 4, nome: "Abril" },
  { valor: 5, nome: "Maio" },
  { valor: 6, nome: "Junho" },
  { valor: 7, nome: "Julho" },
  { valor: 8, nome: "Agosto" },
  { valor: 9, nome: "Setembro" },
  { valor: 10, nome: "Outubro" },
  { valor: 11, nome: "Novembro" },
  { valor: 12, nome: "Dezembro" }
];

const ANOS = [2024, 2025, 2026, 2027];

export default function FolhaPagamento() {
  const { user, selectedEscolaId, escolas } = useAuth();
  const isAdmin = user?.role === "Administrador";

  // Competência selecionada
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  
  // Identificação e isolamento da escola do diretor
  const escolaDiretorId = user?.escolaId || selectedEscolaId || "";
  
  // Escola ativa para filtro: Se admin, pode escolher "todas" ou escola específica; Se diretor, a escola vinculada
  const [escolaFiltro, setEscolaFiltro] = useState(isAdmin ? "" : escolaDiretorId);


  useEffect(() => {
    if (!isAdmin && escolaDiretorId && escolaFiltro !== escolaDiretorId) {
      setEscolaFiltro(escolaDiretorId);
    }
  }, [isAdmin, escolaDiretorId, escolaFiltro]);

  // Abas do Módulo
  const [abaAtiva, setAbaAtiva] = useState("folha"); // 'folha', 'ponto', 'parametros'

  // Estados de Dados da Folha
  const [folhaLancamentos, setFolhaLancamentos] = useState([]);
  const [pontosServidores, setPontosServidores] = useState([]);
  const [parametros, setParametros] = useState(PARAMETROS_PADRAO_FOLHA);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [salvandoPonto, setSalvandoPonto] = useState(false);
  const [salvandoParams, setSalvandoParams] = useState(false);
  const [alerta, setAlerta] = useState(null);

  // Filtros da Tabela
  const [busca, setBusca] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("Todos");
  const [filtroVinculo, setFiltroVinculo] = useState("Todos");

  // Holerite Modal
  const [holeriteSelecionado, setHoleriteSelecionado] = useState(null);

  // Lista de Servidores (professores e funcionários)
  const [servidoresLista, setServidoresLista] = useState([]);

  // Carrega dados da competência
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const targetEscolaId = isAdmin ? (escolaFiltro || null) : (escolaDiretorId || null);
      const [folha, pontos, params, servidores] = await Promise.all([
        getFolhaCompetencia(mesSelecionado, anoSelecionado, targetEscolaId),
        getPontosCompetencia(mesSelecionado, anoSelecionado, targetEscolaId),
        getParametrosFolha(),
        targetEscolaId ? getProfessores(targetEscolaId) : getAllProfessores()
      ]);

      setFolhaLancamentos(folha || []);
      setPontosServidores(pontos || []);
      setParametros(params || PARAMETROS_PADRAO_FOLHA);
      setServidoresLista(servidores || []);

      // Se a folha ainda não foi calculada nesta competência e existem servidores, calcula automaticamente
      if ((!folha || folha.length === 0) && servidores && servidores.length > 0) {
        const novaFolha = await processarFolhaCompetencia(mesSelecionado, anoSelecionado, targetEscolaId);
        setFolhaLancamentos(novaFolha || []);
      }
    } catch (e) {
      console.error("Erro ao carregar dados da folha:", e);
      setAlerta({ tipo: "error", msg: "Erro ao carregar folha de pagamento: " + e.message });
    } finally {
      setCarregando(false);
    }
  }, [mesSelecionado, anoSelecionado, escolaFiltro, isAdmin, escolaDiretorId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Handler para Processar / Recalcular Folha
  const handleRecalcularFolha = async () => {
    setProcessando(true);
    setAlerta(null);
    try {
      const targetEscolaId = isAdmin ? (escolaFiltro || null) : (escolaDiretorId || null);
      const novaFolha = await processarFolhaCompetencia(mesSelecionado, anoSelecionado, targetEscolaId);
      setFolhaLancamentos(novaFolha);
      setAlerta({ tipo: "success", msg: "Folha de pagamento da competência recalculada com sucesso!" });
    } catch (e) {
      setAlerta({ tipo: "error", msg: "Erro ao processar folha: " + e.message });
    } finally {
      setProcessando(false);
    }
  };

  // Handler para Salvar Ponto de um Servidor Individual
  const handleAtualizarPontoServidor = (servidorId, campo, valor) => {
    setPontosServidores(atuais => {
      const index = atuais.findIndex(p => p.servidorId === servidorId);
      if (index >= 0) {
        const copia = [...atuais];
        copia[index] = { ...copia[index], [campo]: valor };
        return copia;
      } else {
        const serv = servidoresLista.find(s => s.id === servidorId);
        return [
          ...atuais,
          {
            servidorId,
            servidorNome: serv?.nome || "",
            escolaId: serv?.escolaId || escolaFiltro,
            mes: mesSelecionado,
            ano: anoSelecionado,
            diasUteis: 22,
            diasTrabalhados: campo === "diasTrabalhados" ? valor : 22,
            faltasJustificadas: campo === "faltasJustificadas" ? valor : 0,
            faltasInjustificadas: campo === "faltasInjustificadas" ? valor : 0,
            horasExtras: campo === "horasExtras" ? valor : 0,
            [campo]: valor
          }
        ];
      }
    });
  };

  // Handler para Salvar Todos os Pontos
  const handleSalvarTodosPontos = async () => {
    setSalvandoPonto(true);
    setAlerta(null);
    try {
      // Monta lista completa de pontos para todos os servidores da lista
      const listaParaSalvar = servidoresLista.map(serv => {
        const pontoExistente = pontosServidores.find(p => p.servidorId === serv.id);
        return {
          servidorId: serv.id,
          servidorNome: serv.nome,
          escolaId: serv.escolaId,
          mes: mesSelecionado,
          ano: anoSelecionado,
          diasUteis: pontoExistente?.diasUteis ?? 22,
          diasTrabalhados: Number(pontoExistente?.diasTrabalhados ?? 22),
          faltasJustificadas: Number(pontoExistente?.faltasJustificadas ?? 0),
          faltasInjustificadas: Number(pontoExistente?.faltasInjustificadas ?? 0),
          horasExtras: Number(pontoExistente?.horasExtras ?? 0),
          statusEnvio: pontoExistente?.statusEnvio || "Preenchido"
        };
      });

      await salvarPontosEmLote(listaParaSalvar);
      // Recalcula a folha com os novos pontos
      const targetEscolaId = isAdmin ? (escolaFiltro || null) : (escolaDiretorId || null);
      const novaFolha = await processarFolhaCompetencia(mesSelecionado, anoSelecionado, targetEscolaId);
      setFolhaLancamentos(novaFolha);
      setAlerta({ tipo: "success", msg: "Apuração de ponto salva e folha atualizada com sucesso!" });
    } catch (e) {
      setAlerta({ tipo: "error", msg: "Erro ao salvar ponto: " + e.message });
    } finally {
      setSalvandoPonto(false);
    }
  };

  // Handler para Preenchimento Rápido: Todos 100% Presentes
  const handlePreencherTodos100 = () => {
    const listaAtualizada = servidoresLista.map(serv => ({
      servidorId: serv.id,
      servidorNome: serv.nome,
      escolaId: serv.escolaId,
      mes: mesSelecionado,
      ano: anoSelecionado,
      diasUteis: 22,
      diasTrabalhados: 22,
      faltasJustificadas: 0,
      faltasInjustificadas: 0,
      horasExtras: 0,
      statusEnvio: "Preenchido"
    }));
    setPontosServidores(listaAtualizada);
  };

  // Handler para Enviar Ponto à SEMED
  const handleEnviarPontoSecretaria = async () => {
    const targetEscolaId = isAdmin ? escolaFiltro : escolaDiretorId;
    if (!targetEscolaId) {
      alert("Selecione uma escola específica para enviar a folha de ponto à Secretaria.");
      return;
    }
    setSalvandoPonto(true);
    try {
      await handleSalvarTodosPontos();
      await atualizarStatusPontoEscola(mesSelecionado, anoSelecionado, targetEscolaId, "Enviado à SEMED");
      setAlerta({ tipo: "success", msg: "Folha de ponto enviada com sucesso para a Secretaria Municipal de Educação!" });
      await carregarDados();
    } catch (e) {
      setAlerta({ tipo: "error", msg: "Erro ao transmitir ponto: " + e.message });
    } finally {
      setSalvandoPonto(false);
    }
  };

  // Handler para Salvar Parâmetros Salariais
  const handleSalvarParametros = async () => {
    setSalvandoParams(true);
    setAlerta(null);
    try {
      await salvarParametrosFolha(parametros);
      // Recalcula folha com novos parâmetros
      const targetEscolaId = isAdmin ? (escolaFiltro || null) : (escolaDiretorId || null);
      const novaFolha = await processarFolhaCompetencia(mesSelecionado, anoSelecionado, targetEscolaId);
      setFolhaLancamentos(novaFolha);
      setAlerta({ tipo: "success", msg: "Parâmetros salariais e alíquotas atualizados com sucesso!" });
    } catch (e) {
      setAlerta({ tipo: "error", msg: "Erro ao salvar parâmetros: " + e.message });
    } finally {
      setSalvandoParams(false);
    }
  };

  // Estatísticas e Totais Executivos da Folha
  const totaisFolha = useMemo(() => {
    let bruto = 0;
    let descontos = 0;
    let liquido = 0;
    let totalFundeb70 = 0;
    let totalFundeb30 = 0;

    folhaLancamentos.forEach(l => {
      const p = Number(l.totalProventos) || 0;
      const d = Number(l.totalDescontos) || 0;
      const liq = Number(l.valorLiquido) || 0;

      bruto += p;
      descontos += d;
      liquido += liq;

      if (l.enquadramentoFundeb === "FUNDEB 70%") {
        totalFundeb70 += p;
      } else {
        totalFundeb30 += p;
      }
    });

    const percentualFundeb70 = bruto > 0 ? Math.round((totalFundeb70 / bruto) * 100) : 0;
    const totalServidores = folhaLancamentos.length;

    return {
      bruto,
      descontos,
      liquido,
      totalFundeb70,
      totalFundeb30,
      percentualFundeb70,
      totalServidores
    };
  }, [folhaLancamentos]);

  // Lista Filtrada da Folha
  const folhaExibicao = useMemo(() => {
    return folhaLancamentos.filter(item => {
      const matchBusca = (item.servidorNome || "").toLowerCase().includes(busca.toLowerCase()) ||
        (item.cpf || "").toLowerCase().includes(busca.toLowerCase()) ||
        (item.matricula || "").toLowerCase().includes(busca.toLowerCase()) ||
        (item.escolaNome || "").toLowerCase().includes(busca.toLowerCase());
      const matchCargo = filtroCargo === "Todos" || item.cargo === filtroCargo;
      const matchVinculo = filtroVinculo === "Todos" || item.vinculo === filtroVinculo;
      return matchBusca && matchCargo && matchVinculo;
    });
  }, [folhaLancamentos, busca, filtroCargo, filtroVinculo]);

  const nomeMesAtual = MESES.find(m => m.valor === Number(mesSelecionado))?.nome || "Mês";
  const escolaAtualNome = (escolas || []).find(e => e.id === (isAdmin ? escolaFiltro : escolaDiretorId))?.nome || (isAdmin ? "Toda a Rede Municipal" : "Minha Escola");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* 1. HERO BANNER DA FOLHA DA EDUCAÇÃO */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)",
        borderRadius: 16,
        padding: "24px 28px",
        color: "white",
        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{
              background: "rgba(255, 255, 255, 0.2)",
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4
            }}>
              <i className={isAdmin ? "ti ti-building-community" : "ti ti-school"} />
              {isAdmin ? "Secretaria Municipal de Educação" : escolaAtualNome}
            </span>
            <span style={{ fontSize: 12, opacity: 0.85 }}>Competência {nomeMesAtual}/{anoSelecionado}</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 6px 0", letterSpacing: "-0.5px" }}>
            {isAdmin ? "Folha de Pagamento & Ponto da Educação" : `Folha de Pagamento & Ponto • ${escolaAtualNome}`}
          </h1>
          <p style={{ fontSize: 13, opacity: 0.9, margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
            {isAdmin
              ? "Gestão consolidada de remuneração, apuração de ponto escolar, gratificações do magistério e enquadramento FUNDEB (70% docentes / 30% apoio)."
              : `Gestão de remuneração, frequência e apuração de ponto dos servidores e docentes vinculados a ${escolaAtualNome}.`}
          </p>
        </div>

        {/* Seletores e Ações Rápidas do Topo */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Seletor de Competência (Mês / Ano) */}
          <div style={{ display: "flex", gap: 6, background: "rgba(255, 255, 255, 0.15)", padding: "4px 8px", borderRadius: 8 }}>
            <select
              value={mesSelecionado}
              onChange={e => setMesSelecionado(Number(e.target.value))}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                outline: "none",
                cursor: "pointer"
              }}
            >
              {MESES.map(m => (
                <option key={m.valor} value={m.valor} style={{ color: "#111827", background: "white" }}>
                  {m.nome}
                </option>
              ))}
            </select>
            <select
              value={anoSelecionado}
              onChange={e => setAnoSelecionado(Number(e.target.value))}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                outline: "none",
                cursor: "pointer"
              }}
            >
              {ANOS.map(a => (
                <option key={a} value={a} style={{ color: "#111827", background: "white" }}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Escola (para Admin) ou Badge Fixo (para Diretor) */}
          {isAdmin ? (
            <select
              value={escolaFiltro}
              onChange={e => setEscolaFiltro(e.target.value)}
              style={{
                background: "white",
                border: "none",
                color: "#1e3a8a",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="">🌐 Toda a Rede Municipal</option>
              {(escolas || []).map(esc => (
                <option key={esc.id} value={esc.id}>
                  🏫 {esc.nome}
                </option>
              ))}
            </select>
          ) : (
            <div style={{
              background: "rgba(255, 255, 255, 0.18)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "white",
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              <i className="ti ti-school" />
              <span>{escolaAtualNome}</span>
            </div>
          )}

          {/* Botão de Recalcular Folha */}
          <button
            onClick={handleRecalcularFolha}
            disabled={processando}
            style={{
              background: "#10b981",
              color: "white",
              border: "none",
              padding: "9px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: processando ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
            }}
          >
            <i className={`ti ti-${processando ? "loader" : "calculator"}`} />
            {processando ? "Calculando..." : "Processar Folha"}
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {alerta && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 8,
          fontSize: 13,
          background: alerta.tipo === "error" ? "#fee2e2" : "#dcfce7",
          color: alerta.tipo === "error" ? "#991b1b" : "#166534",
          border: `1px solid ${alerta.tipo === "error" ? "#fca5a5" : "#86efac"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>{alerta.msg}</span>
          <button onClick={() => setAlerta(null)} style={{ border: "none", background: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* 2. CARDS DE KPI DA FOLHA DE PAGAMENTO */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {/* Folha Bruta */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Folha Bruta Total</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-cash" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1e3a8a" }}>
            {totaisFolha.bruto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>
            {totaisFolha.totalServidores} servidores processados
          </div>
        </div>

        {/* Descontos Previdenciários / Legais */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Total Descontos</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-receipt-refund" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#991b1b" }}>
            {totaisFolha.descontos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
            Previdência, IRRF e Faltas
          </div>
        </div>

        {/* Folha Líquida */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Folha Líquida</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-wallet" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#059669" }}>
            {totaisFolha.liquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div style={{ fontSize: 11, color: "#059669", marginTop: 4, fontWeight: 600 }}>
            Valor líquido a depositar
          </div>
        </div>

        {/* FUNDEB 70% (Docentes) */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>FUNDEB 70% (Docentes)</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-school" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#b45309" }}>
            {totaisFolha.percentualFundeb70}%
          </div>
          <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>
            {totaisFolha.totalFundeb70.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (Magistério)
          </div>
        </div>
      </div>

      {/* 3. NAVEGAÇÃO ENTRE ABAS */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", gap: 12 }}>
        <button
          onClick={() => setAbaAtiva("folha")}
          style={{
            padding: "10px 18px",
            border: "none",
            borderBottom: abaAtiva === "folha" ? "2px solid #1e3a8a" : "2px solid transparent",
            background: "none",
            color: abaAtiva === "folha" ? "#1e3a8a" : "#6b7280",
            fontWeight: abaAtiva === "folha" ? 700 : 500,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <i className="ti ti-file-text" /> 1. Folha Mensal Processada ({folhaLancamentos.length})
        </button>

        <button
          onClick={() => setAbaAtiva("ponto")}
          style={{
            padding: "10px 18px",
            border: "none",
            borderBottom: abaAtiva === "ponto" ? "2px solid #1e3a8a" : "2px solid transparent",
            background: "none",
            color: abaAtiva === "ponto" ? "#1e3a8a" : "#6b7280",
            fontWeight: abaAtiva === "ponto" ? 700 : 500,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <i className="ti ti-clock-check" /> 2. Apuração de Ponto & Carga Horária
        </button>

        {isAdmin && (
          <button
            onClick={() => setAbaAtiva("parametros")}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom: abaAtiva === "parametros" ? "2px solid #1e3a8a" : "2px solid transparent",
              background: "none",
              color: abaAtiva === "parametros" ? "#1e3a8a" : "#6b7280",
              fontWeight: abaAtiva === "parametros" ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <i className="ti ti-settings" /> 3. Parâmetros Salariais & PCCR
          </button>
        )}
      </div>

      {carregando ? (
        <Spinner />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* ABA 1: FOLHA MENSAL PROCESSADA */}
          {/* ========================================================================= */}
          {abaAtiva === "folha" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Barra de Filtros */}
              <div style={{
                background: "white",
                borderRadius: 12,
                padding: "14px 18px",
                border: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12
              }}>
                <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
                  <i className="ti ti-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    type="text"
                    placeholder="Buscar servidor, CPF ou matrícula..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 34px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <select
                    value={filtroCargo}
                    onChange={e => setFiltroCargo(e.target.value)}
                    style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "white" }}
                  >
                    <option value="Todos">Todos os Cargos</option>
                    <option value="Professor">Professores</option>
                    <option value="Coordenador">Coordenadores</option>
                    <option value="Diretor">Diretores</option>
                    <option value="Secretário">Secretários</option>
                    <option value="Merendeira">Merendeiras</option>
                    <option value="Serviços Gerais">Serviços Gerais</option>
                    <option value="Vigia">Vigias</option>
                  </select>

                  <select
                    value={filtroVinculo}
                    onChange={e => setFiltroVinculo(e.target.value)}
                    style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "white" }}
                  >
                    <option value="Todos">Todos os Vínculos</option>
                    <option value="Efetivo">Efetivos (RPPS)</option>
                    <option value="Contratado">Contratados / PSS (INSS)</option>
                    <option value="Comissionado">Comissionados</option>
                  </select>

                  <Btn onClick={() => window.print()} style={{ padding: "7px 12px", fontSize: 12 }}>
                    <i className="ti ti-printer" /> Imprimir Folha
                  </Btn>
                </div>
              </div>

              {/* Tabela da Folha */}
              {folhaExibicao.length === 0 ? (
                <EmptyState icon="receipt" texto="Nenhum lançamento encontrado para os filtros selecionados." />
              ) : (
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textTransform: "uppercase", fontSize: 11 }}>
                          <th style={{ padding: "12px 14px", textAlign: "left" }}>Matrícula / Servidor</th>
                          <th style={{ padding: "12px 14px", textAlign: "left" }}>Cargo / Vínculo</th>
                          <th style={{ padding: "12px 14px", textAlign: "left" }}>Lotação</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Venc. Base</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Proventos</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Descontos</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Valor Líquido</th>
                          <th style={{ padding: "12px 14px", textAlign: "center" }}>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {folhaExibicao.map(l => (
                          <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>{l.servidorNome}</div>
                              <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{l.matricula} · CPF: {l.cpf || "-"}</div>
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ fontWeight: 500, color: "#334155" }}>{l.cargo} ({l.cargaHoraria || "20h"})</div>
                              <Badge color={l.vinculo === "Efetivo" ? "blue" : "amber"}>{l.vinculo || "Efetivo"}</Badge>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#475569" }}>
                              <div>{l.escolaNome}</div>
                              <span style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>{l.enquadramentoFundeb}</span>
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#475569" }}>
                              {(l.proventos?.[0]?.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#166534", fontWeight: 600 }}>
                              {(l.totalProventos || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#991b1b", fontWeight: 600 }}>
                              {(l.totalDescontos || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#059669", fontWeight: 700, fontSize: 13 }}>
                              {(l.valorLiquido || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "center" }}>
                              <Btn
                                variant="primary"
                                onClick={() => setHoleriteSelecionado(l)}
                                style={{ padding: "4px 10px", fontSize: 11 }}
                              >
                                <i className="ti ti-file-certificate" /> Contracheque
                              </Btn>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: APURAÇÃO DE PONTO E CARGA HORÁRIA */}
          {/* ========================================================================= */}
          {abaAtiva === "ponto" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Barra de Ações do Ponto */}
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#166534", fontSize: 14 }}>
                    <i className="ti ti-calendar-check" style={{ marginRight: 6 }} />
                    Apuração de Frequência dos Servidores ({nomeMesAtual}/{anoSelecionado})
                  </div>
                  <div style={{ fontSize: 12, color: "#15803d", marginTop: 2 }}>
                    Lançamento de dias trabalhados, faltas justificadas (atestados) e faltas injustificadas com desconto salarial.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn onClick={handlePreencherTodos100} style={{ padding: "6px 12px", fontSize: 12 }}>
                    <i className="ti ti-checks" /> 100% Presentes
                  </Btn>
                  <Btn onClick={handleSalvarTodosPontos} disabled={salvandoPonto} variant="primary" style={{ padding: "6px 14px", fontSize: 12 }}>
                    <i className="ti ti-device-floppy" /> {salvandoPonto ? "Salvando..." : "Salvar Apuração"}
                  </Btn>
                  {escolaFiltro && (
                    <button
                      onClick={handleEnviarPontoSecretaria}
                      disabled={salvandoPonto}
                      style={{
                        background: "#1e3a8a",
                        color: "white",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <i className="ti ti-send" /> Transmitir para a SEMED
                    </button>
                  )}
                </div>
              </div>

              {/* Tabela de Lançamento de Ponto */}
              <Card style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textTransform: "uppercase", fontSize: 11 }}>
                        <th style={{ padding: "12px 14px", textAlign: "left" }}>Servidor / Cargo</th>
                        <th style={{ padding: "12px 14px", textAlign: "left" }}>Lotação</th>
                        <th style={{ padding: "12px 14px", textAlign: "center", width: 120 }}>Dias Trabalhados (máx 22)</th>
                        <th style={{ padding: "12px 14px", textAlign: "center", width: 120 }}>Faltas Justificadas</th>
                        <th style={{ padding: "12px 14px", textAlign: "center", width: 130 }}>Faltas Injustificadas</th>
                        <th style={{ padding: "12px 14px", textAlign: "center", width: 120 }}>Horas / Aulas Extras</th>
                      </tr>
                    </thead>
                    <tbody>
                      {servidoresLista.map(serv => {
                        const ponto = pontosServidores.find(p => p.servidorId === serv.id) || {};
                        const diasTrab = ponto.diasTrabalhados ?? 22;
                        const faltasJust = ponto.faltasJustificadas ?? 0;
                        const faltasInjust = ponto.faltasInjustificadas ?? 0;
                        const hExtras = ponto.horasExtras ?? 0;
                        const escola = (escolas || []).find(e => e.id === serv.escolaId);

                        return (
                          <tr key={serv.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>{serv.nome}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>{serv.cargo} · {serv.vinculo || "Efetivo"}</div>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#475569" }}>
                              {escola?.nome || "Escola Municipal"}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                max="30"
                                value={diasTrab}
                                onChange={e => handleAtualizarPontoServidor(serv.id, "diasTrabalhados", Number(e.target.value))}
                                style={{
                                  width: 60,
                                  padding: "5px 8px",
                                  borderRadius: 6,
                                  border: "1px solid #d1d5db",
                                  textAlign: "center",
                                  fontWeight: 600
                                }}
                              />
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                max="30"
                                value={faltasJust}
                                onChange={e => handleAtualizarPontoServidor(serv.id, "faltasJustificadas", Number(e.target.value))}
                                style={{
                                  width: 60,
                                  padding: "5px 8px",
                                  borderRadius: 6,
                                  border: "1px solid #d1d5db",
                                  textAlign: "center",
                                  color: "#d97706"
                                }}
                              />
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                max="30"
                                value={faltasInjust}
                                onChange={e => handleAtualizarPontoServidor(serv.id, "faltasInjustificadas", Number(e.target.value))}
                                style={{
                                  width: 60,
                                  padding: "5px 8px",
                                  borderRadius: 6,
                                  border: faltasInjust > 0 ? "2px solid #ef4444" : "1px solid #d1d5db",
                                  textAlign: "center",
                                  fontWeight: 700,
                                  color: faltasInjust > 0 ? "#dc2626" : "#374151"
                                }}
                              />
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                max="80"
                                value={hExtras}
                                onChange={e => handleAtualizarPontoServidor(serv.id, "horasExtras", Number(e.target.value))}
                                style={{
                                  width: 60,
                                  padding: "5px 8px",
                                  borderRadius: 6,
                                  border: "1px solid #d1d5db",
                                  textAlign: "center",
                                  color: "#2563eb",
                                  fontWeight: 600
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 3: PARÂMETROS SALARIAIS E PCCR */}
          {/* ========================================================================= */}
          {abaAtiva === "parametros" && isAdmin && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Card>
                <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 14, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#1e3a8a" }}>
                    <i className="ti ti-scale" style={{ marginRight: 6 }} />
                    Piso Salarial Nacional do Magistério & Bases Salariais
                  </h3>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    Configuração dos valores de vencimento básico por carga horária conforme legislação federal e municipal.
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                  <Input
                    label="Piso Nacional Magistério (40h Semanais)"
                    type="number"
                    step="0.01"
                    value={parametros.pisoNacional40h}
                    onChange={e => setParametros({ ...parametros, pisoNacional40h: Number(e.target.value) })}
                  />
                  <Input
                    label="Piso Nacional Magistério (30h Semanais)"
                    type="number"
                    step="0.01"
                    value={parametros.pisoNacional30h}
                    onChange={e => setParametros({ ...parametros, pisoNacional30h: Number(e.target.value) })}
                  />
                  <Input
                    label="Piso Nacional Magistério (20h Semanais)"
                    type="number"
                    step="0.01"
                    value={parametros.pisoNacional20h}
                    onChange={e => setParametros({ ...parametros, pisoNacional20h: Number(e.target.value) })}
                  />
                  <Input
                    label="Salário Base Coordenador / Diretor"
                    type="number"
                    step="0.01"
                    value={parametros.salarioBaseCoordenador}
                    onChange={e => setParametros({ ...parametros, salarioBaseCoordenador: Number(e.target.value) })}
                  />
                  <Input
                    label="Salário Base Secretário Escolar"
                    type="number"
                    step="0.01"
                    value={parametros.salarioBaseSecretario}
                    onChange={e => setParametros({ ...parametros, salarioBaseSecretario: Number(e.target.value) })}
                  />
                  <Input
                    label="Salário Base Apoio (Merendeira / ASG)"
                    type="number"
                    step="0.01"
                    value={parametros.salarioBaseApoio}
                    onChange={e => setParametros({ ...parametros, salarioBaseApoio: Number(e.target.value) })}
                  />
                </div>
              </Card>

              <Card>
                <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 14, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#1e3a8a" }}>
                    <i className="ti ti-award" style={{ marginRight: 6 }} />
                    Gratificações, Titulação & Alíquotas Previdenciárias
                  </h3>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    Adicionais de carreira do magistério e encargos legais.
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                  <Input
                    label="Gratificação de Regência de Classe (%)"
                    type="number"
                    value={parametros.percentualRegencia}
                    onChange={e => setParametros({ ...parametros, percentualRegencia: Number(e.target.value) })}
                  />
                  <Input
                    label="Adicional Especialização / Pós (%)"
                    type="number"
                    value={parametros.percentualEspecializacao}
                    onChange={e => setParametros({ ...parametros, percentualEspecializacao: Number(e.target.value) })}
                  />
                  <Input
                    label="Adicional Mestrado (%)"
                    type="number"
                    value={parametros.percentualMestrado}
                    onChange={e => setParametros({ ...parametros, percentualMestrado: Number(e.target.value) })}
                  />
                  <Input
                    label="Adicional Doutorado (%)"
                    type="number"
                    value={parametros.percentualDoutorado}
                    onChange={e => setParametros({ ...parametros, percentualDoutorado: Number(e.target.value) })}
                  />
                  <Input
                    label="Adicional Difícil Acesso / Zona Rural (%)"
                    type="number"
                    value={parametros.percentualAdicionalRural}
                    onChange={e => setParametros({ ...parametros, percentualAdicionalRural: Number(e.target.value) })}
                  />
                  <Input
                    label="Alíquota Previdência RPPS Efetivo (%)"
                    type="number"
                    value={parametros.aliquotaRppsEfetivo}
                    onChange={e => setParametros({ ...parametros, aliquotaRppsEfetivo: Number(e.target.value) })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                  <Btn variant="primary" onClick={handleSalvarParametros} disabled={salvandoParams} style={{ padding: "8px 18px" }}>
                    <i className="ti ti-device-floppy" /> {salvandoParams ? "Salvando..." : "Salvar e Atualizar Parâmetros"}
                  </Btn>
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* MODAL DE CONTRACHEQUE */}
      {holeriteSelecionado && (
        <HoleriteModal
          holerite={holeriteSelecionado}
          mes={mesSelecionado}
          ano={anoSelecionado}
          onClose={() => setHoleriteSelecionado(null)}
        />
      )}

    </div>
  );
}

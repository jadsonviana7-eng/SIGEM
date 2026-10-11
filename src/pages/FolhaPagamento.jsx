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
        background: "linear-gradient(135deg, #1e293b 0%, #1e1b4b 60%, #0f172a 100%)",
        borderRadius: 16,
        padding: "24px 28px",
        color: "white",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
        border: "1px solid #33435c",
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
              background: "rgba(99, 102, 241, 0.2)",
              color: "#a5b4fc",
              border: "1px solid rgba(99, 102, 241, 0.35)",
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
            <span style={{ fontSize: 12, color: "#cbd5e1" }}>Competência {nomeMesAtual}/{anoSelecionado}</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 6px 0", letterSpacing: "-0.5px", color: "#ffffff" }}>
            {isAdmin ? "Folha de Pagamento & Ponto da Educação" : `Folha de Pagamento & Ponto • ${escolaAtualNome}`}
          </h1>
          <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
            {isAdmin
              ? "Gestão consolidada de remuneração, apuração de ponto escolar, gratificações do magistério e enquadramento FUNDEB (70% docentes / 30% apoio)."
              : `Gestão de remuneração, frequência e apuração de ponto dos servidores e docentes vinculados a ${escolaAtualNome}.`}
          </p>
        </div>

        {/* Seletores e Ações Rápidas do Topo */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Seletor de Competência (Mês / Ano) */}
          <div style={{ display: "flex", gap: 6, background: "#243144", border: "1px solid #33435c", padding: "4px 8px", borderRadius: 8 }}>
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
                <option key={m.valor} value={m.valor} style={{ color: "#ffffff", background: "#1e293b" }}>
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
                <option key={a} value={a} style={{ color: "#ffffff", background: "#1e293b" }}>
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
                background: "#243144",
                border: "1px solid #33435c",
                color: "#ffffff",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="" style={{ background: "#1e293b" }}>🌐 Toda a Rede Municipal</option>
              {(escolas || []).map(esc => (
                <option key={esc.id} value={esc.id} style={{ background: "#1e293b" }}>
                  🏫 {esc.nome}
                </option>
              ))}
            </select>
          ) : (
            <div style={{
              background: "#243144",
              border: "1px solid #33435c",
              color: "white",
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              <i className="ti ti-school" style={{ color: "#60a5fa" }} />
              <span>{escolaAtualNome}</span>
            </div>
          )}

          {/* Botão de Recalcular Folha */}
          <button
            onClick={handleRecalcularFolha}
            disabled={processando}
            style={{
              background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
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
          background: alerta.tipo === "error" ? "rgba(248, 113, 113, 0.15)" : "rgba(52, 211, 153, 0.15)",
          color: alerta.tipo === "error" ? "#f87171" : "#34d399",
          border: `1px solid ${alerta.tipo === "error" ? "rgba(248, 113, 113, 0.3)" : "rgba(52, 211, 153, 0.3)"}`,
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
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 18, border: "1px solid #2c3b52", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Folha Bruta Total</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-cash" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#ffffff" }}>
            {totaisFolha.bruto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            {totaisFolha.totalServidores} servidores processados
          </div>
        </div>

        {/* Descontos Previdenciários / Legais */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 18, border: "1px solid #2c3b52", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Total Descontos</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(248, 113, 113, 0.15)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-receipt-refund" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#f87171" }}>
            {totaisFolha.descontos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            Previdência, IRRF e Faltas
          </div>
        </div>

        {/* Folha Líquida */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 18, border: "1px solid #2c3b52", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Folha Líquida</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(52, 211, 153, 0.15)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-wallet" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#34d399" }}>
            {totaisFolha.liquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div style={{ fontSize: 11, color: "#34d399", marginTop: 4, fontWeight: 600 }}>
            Valor líquido a depositar
          </div>
        </div>

        {/* FUNDEB 70% (Docentes) */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 18, border: "1px solid #2c3b52", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>FUNDEB 70% (Docentes)</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <i className="ti ti-school" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fbbf24" }}>
            {totaisFolha.percentualFundeb70}%
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            {totaisFolha.totalFundeb70.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (Magistério)
          </div>
        </div>
      </div>

      {/* 3. NAVEGAÇÃO ENTRE ABAS */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #2c3b52", paddingBottom: 10, overflowX: "auto" }}>
        {[
          { id: "folha", label: `1. Folha Mensal Processada (${folhaLancamentos.length})`, icon: "ti ti-file-text" },
          { id: "ponto", label: "2. Apuração de Ponto & Carga Horária", icon: "ti ti-clock-check" },
          ...(isAdmin ? [{ id: "parametros", label: "3. Parâmetros Salariais & PCCR", icon: "ti ti-settings" }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAbaAtiva(tab.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: abaAtiva === tab.id ? "none" : "1px solid #33435c",
              background: abaAtiva === tab.id ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "#243144",
              color: abaAtiva === tab.id ? "white" : "#cbd5e1",
              fontWeight: abaAtiva === tab.id ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s",
              boxShadow: abaAtiva === tab.id ? "0 4px 12px rgba(99, 102, 241, 0.35)" : "none"
            }}
          >
            <i className={tab.icon} />
            {tab.label}
          </button>
        ))}
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
                background: "#1e293b",
                borderRadius: 12,
                padding: "14px 18px",
                border: "1px solid #2c3b52",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12
              }}>
                <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
                  <i className="ti ti-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    placeholder="Buscar servidor, CPF ou matrícula..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 34px",
                      borderRadius: 8,
                      border: "1px solid #33435c",
                      background: "#243144",
                      color: "#ffffff",
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
                    style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #33435c", fontSize: 13, background: "#243144", color: "#ffffff", outline: "none" }}
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
                    style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #33435c", fontSize: 13, background: "#243144", color: "#ffffff", outline: "none" }}
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
                        <tr style={{ background: "#243144", borderBottom: "1px solid #33435c", color: "#94a3b8", textTransform: "uppercase", fontSize: 11 }}>
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
                          <tr key={l.id} style={{ borderBottom: "1px solid #2c3b52" }}>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ fontWeight: 600, color: "#ffffff", fontSize: 13 }}>{l.servidorNome}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{l.matricula} · CPF: {l.cpf || "-"}</div>
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ fontWeight: 500, color: "#cbd5e1" }}>{l.cargo} ({l.cargaHoraria || "20h"})</div>
                              <Badge color={l.vinculo === "Efetivo" ? "blue" : "amber"}>{l.vinculo || "Efetivo"}</Badge>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>
                              <div>{l.escolaNome}</div>
                              <span style={{ fontSize: 10, color: "#34d399", fontWeight: 600 }}>{l.enquadramentoFundeb}</span>
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>
                              {(l.proventos?.[0]?.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#34d399", fontWeight: 600 }}>
                              {(l.totalProventos || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#f87171", fontWeight: 600 }}>
                              {(l.totalDescontos || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#38bdf8", fontWeight: 700, fontSize: 13 }}>
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
                background: "#1e293b",
                border: "1px solid #2c3b52",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#34d399", fontSize: 14 }}>
                    <i className="ti ti-calendar-check" style={{ marginRight: 6 }} />
                    Apuração de Frequência dos Servidores ({nomeMesAtual}/{anoSelecionado})
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
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
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        color: "white",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
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
                      <tr style={{ background: "#243144", borderBottom: "1px solid #33435c", color: "#94a3b8", textTransform: "uppercase", fontSize: 11 }}>
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
                          <tr key={serv.id} style={{ borderBottom: "1px solid #2c3b52" }}>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ fontWeight: 600, color: "#ffffff", fontSize: 13 }}>{serv.nome}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{serv.cargo} · {serv.vinculo || "Efetivo"}</div>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>
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
                                  border: "1px solid #33435c",
                                  background: "#161f2e",
                                  color: "#ffffff",
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
                                  border: "1px solid #33435c",
                                  background: "#161f2e",
                                  color: "#fbbf24",
                                  textAlign: "center"
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
                                  border: faltasInjust > 0 ? "2px solid #f87171" : "1px solid #33435c",
                                  background: "#161f2e",
                                  textAlign: "center",
                                  fontWeight: 700,
                                  color: faltasInjust > 0 ? "#f87171" : "#cbd5e1"
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
                                  border: "1px solid #33435c",
                                  background: "#161f2e",
                                  textAlign: "center",
                                  color: "#38bdf8",
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
                <div style={{ borderBottom: "1px solid #2c3b52", paddingBottom: 14, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#ffffff" }}>
                    <i className="ti ti-scale" style={{ marginRight: 6, color: "#60a5fa" }} />
                    Piso Salarial Nacional do Magistério & Bases Salariais
                  </h3>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
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
                <div style={{ borderBottom: "1px solid #2c3b52", paddingBottom: 14, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#ffffff" }}>
                    <i className="ti ti-award" style={{ marginRight: 6, color: "#fbbf24" }} />
                    Gratificações, Titulação & Alíquotas Previdenciárias
                  </h3>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
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


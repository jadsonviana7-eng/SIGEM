import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Badge, EmptyState, Alert } from "../../../components/ui";
import { updateItemEstoque, addAuditoriaEstoque } from "../../../services/alimentacaoService";
import styles from "./ControleEstoque.module.css";

export default function ControleEstoque({
  itensEstoque = [],
  escolaId,
  onReload
}) {
  const [modalBalanco, setModalBalanco] = useState(false);
  const [ajustes, setAjustes] = useState({}); // { [itemId]: novaQtd }
  const [salvando, setSalvando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState("");
  const [responsavelBalanco, setResponsavelBalanco] = useState("Nutricionista / Merendeira Chefe");

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos"); // "todos" | "criticos" | "vencendo" | "vencidos" | "adequados"
  const [modalBusca, setModalBusca] = useState("");

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const emQuinzeDias = useMemo(() => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + 15);
    return d;
  }, [hoje]);

  // Alertas de Validade
  const itensVencidos = useMemo(() => {
    return itensEstoque.filter(item => {
      if (!item.dataValidade) return false;
      const d = new Date(item.dataValidade + "T00:00:00");
      return d < hoje;
    });
  }, [itensEstoque, hoje]);

  const itensVencendo15Dias = useMemo(() => {
    return itensEstoque.filter(item => {
      if (!item.dataValidade) return false;
      const d = new Date(item.dataValidade + "T00:00:00");
      return d >= hoje && d <= emQuinzeDias;
    });
  }, [itensEstoque, hoje, emQuinzeDias]);

  // Itens com Estoque Baixo / Crítico
  const itensCriticos = useMemo(() => {
    return itensEstoque.filter(item => {
      const qtd = Number(item.quantidadeAtual) || 0;
      const min = Number(item.estoqueMinimo) || 0;
      return qtd <= min;
    });
  }, [itensEstoque]);

  // Itens em Nível Adequado
  const itensAdequados = useMemo(() => {
    return itensEstoque.filter(item => {
      const qtd = Number(item.quantidadeAtual) || 0;
      const min = Number(item.estoqueMinimo) || 0;
      const isBaixo = qtd <= min;
      const d = item.dataValidade ? new Date(item.dataValidade + "T00:00:00") : null;
      const isVencido = d && d < hoje;
      return !isBaixo && !isVencido;
    });
  }, [itensEstoque, hoje]);

  // Lista de Categorias Únicas
  const categorias = useMemo(() => {
    const set = new Set();
    itensEstoque.forEach(i => {
      if (i.categoria) set.add(i.categoria);
    });
    return Array.from(set).sort();
  }, [itensEstoque]);

  // Itens Filtrados
  const itensFiltrados = useMemo(() => {
    return itensEstoque.filter(item => {
      const termo = busca.toLowerCase().trim();
      const matchBusca = !termo ||
        (item.nome || "").toLowerCase().includes(termo) ||
        (item.categoria || "").toLowerCase().includes(termo) ||
        (item.localArmazenamento || "").toLowerCase().includes(termo) ||
        (item.lote || "").toLowerCase().includes(termo);

      const matchCat = !filtroCategoria || item.categoria === filtroCategoria;

      const qtd = Number(item.quantidadeAtual) || 0;
      const min = Number(item.estoqueMinimo) || 0;
      const isBaixo = qtd <= min;
      const d = item.dataValidade ? new Date(item.dataValidade + "T00:00:00") : null;
      const isVencido = d && d < hoje;
      const isVencendo = d && d >= hoje && d <= emQuinzeDias;

      let matchStatus = true;
      if (filtroStatus === "criticos") {
        matchStatus = isBaixo;
      } else if (filtroStatus === "vencendo") {
        matchStatus = isVencendo;
      } else if (filtroStatus === "vencidos") {
        matchStatus = isVencido;
      } else if (filtroStatus === "adequados") {
        matchStatus = !isBaixo && !isVencido;
      }

      return matchBusca && matchCat && matchStatus;
    });
  }, [itensEstoque, busca, filtroCategoria, filtroStatus, hoje, emQuinzeDias]);

  // Abrir Balanço Geral ou Focado
  const abrirBalanco = (itemEspecifico = null) => {
    const map = {};
    itensEstoque.forEach(i => {
      map[i.id] = i.quantidadeAtual;
    });
    setAjustes(map);
    setModalBusca(itemEspecifico ? itemEspecifico.nome : "");
    setModalBalanco(true);
  };

  const handleSalvarBalanco = async () => {
    setSalvando(true);
    setSucessoMsg("");

    try {
      const diferencas = [];

      for (const item of itensEstoque) {
        const novaQtd = Number(ajustes[item.id]);
        const qtdAnterior = Number(item.quantidadeAtual) || 0;

        if (!isNaN(novaQtd) && novaQtd !== qtdAnterior) {
          await updateItemEstoque(item.id, { quantidadeAtual: novaQtd });
          diferencas.push({
            itemId: item.id,
            itemNome: item.nome,
            anterior: qtdAnterior,
            contado: novaQtd,
            diferenca: novaQtd - qtdAnterior
          });
        }
      }

      // Registra no histórico de auditoria
      await addAuditoriaEstoque({
        data: new Date().toISOString().split("T")[0],
        responsavel: responsavelBalanco,
        totalItensContados: itensEstoque.length,
        itensAjustados: diferencas.length,
        diferencas
      }, escolaId);

      setModalBalanco(false);
      setSucessoMsg(`Balanço concluído com sucesso! ${diferencas.length} ${diferencas.length === 1 ? "alimento teve seu saldo atualizado" : "alimentos tiveram seus saldos atualizados"}.`);
      setTimeout(() => setSucessoMsg(""), 6000);
      onReload();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar balanço: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  // Helper para formatação de validade
  const getValidadeInfo = (dataStr) => {
    if (!dataStr) return { texto: "Não informada", tipo: "normal", badge: null };
    const dVal = new Date(dataStr + "T00:00:00");
    const diffDias = Math.ceil((dVal - hoje) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return {
        texto: dVal.toLocaleDateString("pt-BR"),
        sub: `Vencido há ${Math.abs(diffDias)} ${Math.abs(diffDias) === 1 ? "dia" : "dias"}`,
        tipo: "vencido",
        badge: "Vencido",
        badgeColor: "red"
      };
    } else if (diffDias === 0) {
      return {
        texto: dVal.toLocaleDateString("pt-BR"),
        sub: "Vence hoje!",
        tipo: "urgente",
        badge: "Vence Hoje",
        badgeColor: "red"
      };
    } else if (diffDias <= 15) {
      return {
        texto: dVal.toLocaleDateString("pt-BR"),
        sub: `Vence em ${diffDias} ${diffDias === 1 ? "dia" : "dias"}`,
        tipo: "alerta",
        badge: `< ${diffDias}d`,
        badgeColor: "amber"
      };
    }
    return {
      texto: dVal.toLocaleDateString("pt-BR"),
      sub: null,
      tipo: "ok",
      badge: null
    };
  };

  // Itens no modal de balanço
  const modalItensFiltrados = useMemo(() => {
    if (!modalBusca.trim()) return itensEstoque;
    const t = modalBusca.toLowerCase().trim();
    return itensEstoque.filter(i =>
      (i.nome || "").toLowerCase().includes(t) ||
      (i.categoria || "").toLowerCase().includes(t)
    );
  }, [itensEstoque, modalBusca]);

  // Contagem de itens com ajuste
  const totalItensComDiferenca = useMemo(() => {
    return itensEstoque.filter(i => {
      const digitado = Number(ajustes[i.id]);
      const atual = Number(i.quantidadeAtual) || 0;
      return !isNaN(digitado) && digitado !== atual;
    }).length;
  }, [itensEstoque, ajustes]);

  return (
    <div className={styles.container}>
      {sucessoMsg && <Alert tipo="success">{sucessoMsg}</Alert>}

      {/* Header e Barra de Ações */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>
            <i className="ti ti-clipboard-data" style={{ color: "#10b981", fontSize: 20 }} />
            Controle & Balanço de Estoque
          </h3>
          <div className={styles.headerSubtitle}>
            Auditoria física da despensa, controle preventivo de validades e conciliação de saldos.
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={() => window.print()}
            className={styles.btnPrint}
            title="Imprimir folha de balanço físico para conferência na despensa"
          >
            <i className="ti ti-printer" /> Imprimir Balanço
          </button>

          <Btn variant="primary" onClick={() => abrirBalanco()}>
            <i className="ti ti-checklist" /> Realizar Balanço Físico
          </Btn>
        </div>
      </div>

      {/* Grid de Cards de Auditoria & Indicadores Rápidos (Clicáveis para Filtrar) */}
      <div className={styles.kpiGrid}>
        {/* Card Vencidos */}
        <div
          className={`${styles.kpiCard} ${filtroStatus === "vencidos" ? styles.kpiCardActive : ""}`}
          onClick={() => setFiltroStatus(filtroStatus === "vencidos" ? "todos" : "vencidos")}
          style={{ borderLeft: "4px solid #ef4444" }}
          title="Clique para filtrar apenas os produtos vencidos"
        >
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconWrap} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}>
              <i className="ti ti-alert-octagon" />
            </div>
            <Badge color={itensVencidos.length > 0 ? "red" : "gray"}>
              {itensVencidos.length > 0 ? "Crítico" : "Em dia"}
            </Badge>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue} style={{ color: itensVencidos.length > 0 ? "#f87171" : "var(--text-primary)" }}>
              {itensVencidos.length}
            </div>
            <div className={styles.kpiLabel}>Produtos Vencidos</div>
            <div className={styles.kpiSub}>
              {itensVencidos.length === 0 ? (
                <span style={{ color: "#34d399" }}>✓ Nenhum item vencido</span>
              ) : (
                <span style={{ color: "#fca5a5" }}>⚠️ Requer descarte / baixa</span>
              )}
            </div>
          </div>
        </div>

        {/* Card Validade Próxima (< 15 dias) */}
        <div
          className={`${styles.kpiCard} ${filtroStatus === "vencendo" ? styles.kpiCardActive : ""}`}
          onClick={() => setFiltroStatus(filtroStatus === "vencendo" ? "todos" : "vencendo")}
          style={{ borderLeft: "4px solid #f59e0b" }}
          title="Clique para filtrar alimentos com validade nos próximos 15 dias"
        >
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconWrap} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
              <i className="ti ti-clock-hour-4" />
            </div>
            <Badge color={itensVencendo15Dias.length > 0 ? "amber" : "gray"}>
              {itensVencendo15Dias.length > 0 ? "Atenção" : "Seguro"}
            </Badge>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue} style={{ color: itensVencendo15Dias.length > 0 ? "#fbbf24" : "var(--text-primary)" }}>
              {itensVencendo15Dias.length}
            </div>
            <div className={styles.kpiLabel}>Validade Próxima (&lt; 15 dias)</div>
            <div className={styles.kpiSub}>
              {itensVencendo15Dias.length === 0 ? (
                <span style={{ color: "#34d399" }}>✓ Nenhuma data crítica</span>
              ) : (
                <span style={{ color: "#fcd34d" }}>⚡ Priorizar no cardápio</span>
              )}
            </div>
          </div>
        </div>

        {/* Card Reposição / Estoque Baixo */}
        <div
          className={`${styles.kpiCard} ${filtroStatus === "criticos" ? styles.kpiCardActive : ""}`}
          onClick={() => setFiltroStatus(filtroStatus === "criticos" ? "todos" : "criticos")}
          style={{ borderLeft: "4px solid #3b82f6" }}
          title="Clique para filtrar itens abaixo do estoque mínimo"
        >
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconWrap} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
              <i className="ti ti-package-off" />
            </div>
            <Badge color={itensCriticos.length > 0 ? "blue" : "gray"}>
              {itensCriticos.length > 0 ? "Repor" : "Adequado"}
            </Badge>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue} style={{ color: itensCriticos.length > 0 ? "#60a5fa" : "var(--text-primary)" }}>
              {itensCriticos.length}
            </div>
            <div className={styles.kpiLabel}>Necessitam Reposição</div>
            <div className={styles.kpiSub}>
              {itensCriticos.length === 0 ? (
                <span style={{ color: "#34d399" }}>✓ Todos acima do mínimo</span>
              ) : (
                <span style={{ color: "#93c5fd" }}>📦 Solicitar compras</span>
              )}
            </div>
          </div>
        </div>

        {/* Card Total de Alimentos Cadastrados */}
        <div
          className={`${styles.kpiCard} ${filtroStatus === "todos" && !filtroCategoria && !busca ? styles.kpiCardActive : ""}`}
          onClick={() => { setFiltroStatus("todos"); setFiltroCategoria(""); setBusca(""); }}
          style={{ borderLeft: "4px solid #10b981" }}
          title="Clique para limpar filtros e ver todos os alimentos"
        >
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
              <i className="ti ti-packages" />
            </div>
            <Badge color="green">Total</Badge>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue} style={{ color: "#34d399" }}>
              {itensEstoque.length}
            </div>
            <div className={styles.kpiLabel}>Total na Despensa</div>
            <div className={styles.kpiSub}>
              <span style={{ color: "var(--text-muted)" }}>{itensAdequados.length} em nível regular</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca Rápida */}
      <div className={styles.filterBar}>
        <div className={styles.filterInputsRow}>
          <div className={styles.searchWrap}>
            <input
              type="text"
              placeholder="Buscar por alimento, categoria, local de guarda..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={styles.searchInput}
            />
            <i className={`ti ti-search ${styles.searchIcon}`} />
            {busca && (
              <button
                onClick={() => setBusca("")}
                style={{
                  position: "absolute",
                  right: 10,
                  top: 9,
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 14
                }}
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className={styles.categorySelect}
          >
            <option value="">Todas as Categorias</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Chips de Status para visualização focada */}
        <div className={styles.statusChipsRow}>
          <button
            className={`${styles.chipBtn} ${filtroStatus === "todos" ? styles.chipBtnActive : ""}`}
            onClick={() => setFiltroStatus("todos")}
          >
            Todos ({itensEstoque.length})
          </button>

          <button
            className={`${styles.chipBtn} ${filtroStatus === "criticos" ? styles.chipBtnActive : ""}`}
            onClick={() => setFiltroStatus("criticos")}
            style={filtroStatus === "criticos" ? { borderColor: "#3b82f6", color: "#60a5fa" } : {}}
          >
            <i className="ti ti-package-off" /> Abaixo do Mínimo ({itensCriticos.length})
          </button>

          <button
            className={`${styles.chipBtn} ${filtroStatus === "vencendo" ? styles.chipBtnActive : ""}`}
            onClick={() => setFiltroStatus("vencendo")}
            style={filtroStatus === "vencendo" ? { borderColor: "#f59e0b", color: "#fbbf24" } : {}}
          >
            <i className="ti ti-clock-hour-4" /> Vencendo &lt; 15d ({itensVencendo15Dias.length})
          </button>

          <button
            className={`${styles.chipBtn} ${filtroStatus === "vencidos" ? styles.chipBtnActive : ""}`}
            onClick={() => setFiltroStatus("vencidos")}
            style={filtroStatus === "vencidos" ? { borderColor: "#ef4444", color: "#f87171" } : {}}
          >
            <i className="ti ti-alert-octagon" /> Vencidos ({itensVencidos.length})
          </button>

          <button
            className={`${styles.chipBtn} ${filtroStatus === "adequados" ? styles.chipBtnActive : ""}`}
            onClick={() => setFiltroStatus("adequados")}
            style={filtroStatus === "adequados" ? { borderColor: "#10b981", color: "#34d399" } : {}}
          >
            <i className="ti ti-check" /> Nível Regular ({itensAdequados.length})
          </button>
        </div>
      </div>

      {/* Card Principal: Tabela no Desktop e Cards no Mobile (Elimina colunas amontoadas) */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderBar}>
          <div className={styles.tableHeaderTitle}>
            <i className="ti ti-building-warehouse" style={{ color: "#10b981" }} />
            Posição Consolidada da Despensa
          </div>
          <div className={styles.tableHeaderBadge}>
            Exibindo <strong>{itensFiltrados.length}</strong> de {itensEstoque.length} produtos
          </div>
        </div>

        {itensFiltrados.length === 0 ? (
          <EmptyState
            icon="packages"
            texto="Nenhum alimento encontrado com os filtros selecionados."
          />
        ) : (
          <>
            {/* Visualização Desktop: Tabela estruturada com largura mínima fixa para evitar texto em colunas estreitas */}
            <div className="sigem-desktop-table" style={{ overflowX: "auto" }}>
              <table className={styles.desktopTable}>
                <thead>
                  <tr>
                    <th>Alimento / Produto</th>
                    <th>Categoria</th>
                    <th>Local de Guarda</th>
                    <th>Saldo Atual</th>
                    <th>Estoque Mínimo</th>
                    <th>Status do Nível</th>
                    <th>Data de Validade</th>
                    <th style={{ textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itensFiltrados.map((item) => {
                    const qtd = Number(item.quantidadeAtual) || 0;
                    const min = Number(item.estoqueMinimo) || 0;
                    const isCritico = qtd <= min;
                    const pct = min > 0 ? Math.min(Math.round((qtd / min) * 100), 200) : 100;
                    const valInfo = getValidadeInfo(item.dataValidade);

                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13.5 }}>
                            {item.nome}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            Unidade: {item.unidade} {item.lote ? `· Lote: ${item.lote}` : ""}
                          </div>
                        </td>

                        <td>
                          <Badge color="blue">{item.categoria}</Badge>
                        </td>

                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-secondary)", fontSize: 12.5 }}>
                            <i className="ti ti-map-pin" style={{ color: "#10b981", fontSize: 13 }} />
                            {item.localArmazenamento || "Despensa Seca"}
                          </span>
                        </td>

                        <td>
                          <div style={{
                            display: "inline-block",
                            fontWeight: 800,
                            fontSize: 14,
                            color: isCritico ? "#f87171" : "#34d399",
                            background: isCritico ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                            padding: "3px 8px",
                            borderRadius: 6
                          }}>
                            {qtd} {item.unidade?.split(" ")[0]}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>
                            {min} {item.unidade?.split(" ")[0]}
                          </div>
                          <div className={styles.stockBarWrap} title={`Estoque em ${pct}% da meta mínima`}>
                            <div
                              className={styles.stockBarFill}
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                background: isCritico ? "#ef4444" : pct < 150 ? "#f59e0b" : "#10b981"
                              }}
                            />
                          </div>
                        </td>

                        <td>
                          <Badge color={isCritico ? "red" : pct < 150 ? "amber" : "green"}>
                            {isCritico ? "Crítico / Repor" : pct < 150 ? "Atenção" : "Adequado"}
                          </Badge>
                        </td>

                        <td>
                          <div style={{
                            fontWeight: 600,
                            fontSize: 12.5,
                            color: valInfo.tipo === "vencido" ? "#f87171" : valInfo.tipo === "alerta" ? "#fbbf24" : "var(--text-secondary)"
                          }}>
                            {valInfo.texto}
                          </div>
                          {valInfo.sub && (
                            <div style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              color: valInfo.tipo === "vencido" ? "#fca5a5" : "#fcd34d"
                            }}>
                              {valInfo.sub}
                            </div>
                          )}
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => abrirBalanco(item)}
                            style={{
                              background: "var(--bg-surface)",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-primary)",
                              padding: "5px 10px",
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5
                            }}
                            title="Conferir ou ajustar contagem deste item"
                          >
                            <i className="ti ti-edit" /> Conferir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Visualização Mobile: Cards Modernos (Elimina o monte de texto em colunas) */}
            <div className="sigem-mobile-cards">
              <div className={styles.mobileCardsList}>
                {itensFiltrados.map((item) => {
                  const qtd = Number(item.quantidadeAtual) || 0;
                  const min = Number(item.estoqueMinimo) || 0;
                  const isCritico = qtd <= min;
                  const pct = min > 0 ? Math.min(Math.round((qtd / min) * 100), 200) : 100;
                  const valInfo = getValidadeInfo(item.dataValidade);

                  const statusColor = valInfo.tipo === "vencido" || isCritico ? "#ef4444" : valInfo.tipo === "alerta" ? "#f59e0b" : "#10b981";
                  const statusBg = valInfo.tipo === "vencido" || isCritico ? "rgba(239, 68, 68, 0.15)" : valInfo.tipo === "alerta" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)";

                  return (
                    <div key={`mob-ctrl-${item.id}`} className={styles.mobileCard}>
                      {/* Top Header do Card */}
                      <div className={styles.mobileCardHeader}>
                        <div className={styles.mobileCardIcon} style={{ background: statusBg, color: statusColor }}>
                          <i className={isCritico ? "ti ti-package-off" : valInfo.tipo === "vencido" ? "ti ti-alert-octagon" : "ti ti-package"} />
                        </div>

                        <div className={styles.mobileCardTitleBox}>
                          <div className={styles.mobileCardTitle}>
                            {item.nome}
                          </div>
                          <div className={styles.mobileCardBadges}>
                            <Badge color="blue">{item.categoria}</Badge>
                            <Badge color={isCritico ? "red" : pct < 150 ? "amber" : "green"}>
                              {isCritico ? "Crítico / Repor" : pct < 150 ? "Atenção" : "Adequado"}
                            </Badge>
                            {valInfo.badge && (
                              <Badge color={valInfo.badgeColor}>
                                {valInfo.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Métricas de Estoque Lado a Lado (Legíveis e Claras) */}
                      <div className={styles.mobileMetricsGrid}>
                        <div className={styles.mobileMetricItem}>
                          <span className={styles.mobileMetricLabel}>Saldo Atual</span>
                          <span className={styles.mobileMetricValue} style={{ color: isCritico ? "#f87171" : "#34d399" }}>
                            {qtd} {item.unidade?.split(" ")[0]}
                          </span>
                        </div>

                        <div className={styles.mobileMetricItem}>
                          <span className={styles.mobileMetricLabel}>Estoque Mínimo</span>
                          <span className={styles.mobileMetricValue} style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                            {min} {item.unidade?.split(" ")[0]}
                          </span>
                          <div className={styles.stockBarWrap}>
                            <div
                              className={styles.stockBarFill}
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                background: isCritico ? "#ef4444" : pct < 150 ? "#f59e0b" : "#10b981"
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Metadados: Local de Guarda e Validade */}
                      <div className={styles.mobileMetaRow}>
                        <span className={styles.mobileMetaItem}>
                          <i className={`ti ti-map-pin ${styles.mobileMetaIcon}`} />
                          <span>{item.localArmazenamento || "Despensa Seca"}</span>
                        </span>

                        <span className={styles.mobileMetaItem}>
                          <i className={`ti ti-calendar ${styles.mobileMetaIcon}`} style={{ color: valInfo.tipo === "vencido" ? "#f87171" : valInfo.tipo === "alerta" ? "#fbbf24" : "#10b981" }} />
                          <span style={{ fontWeight: valInfo.tipo !== "ok" ? 700 : 500, color: valInfo.tipo === "vencido" ? "#f87171" : valInfo.tipo === "alerta" ? "#fbbf24" : "var(--text-secondary)" }}>
                            Validade: {valInfo.texto}
                          </span>
                        </span>
                      </div>

                      {/* Botão de Conferência / Ajuste Rápido */}
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => abrirBalanco(item)}
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-primary)",
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <i className="ti ti-checklist" /> Realizar Contagem Deste Item
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Balanço Físico / Inventário com Design Responsivo */}
      {modalBalanco && (
        <Modal
          titulo="Balanço Físico & Conciliação da Despensa"
          onClose={() => setModalBalanco(false)}
          onSave={handleSalvarBalanco}
          salvando={salvando}
          larguraMax={760}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              Insira a contagem física real dos alimentos apurada na despensa. Ao salvar, as quantidades no sistema serão conciliadas com a contagem.
            </p>

            <Input
              label="Responsável pela Contagem / Conferência"
              value={responsavelBalanco}
              onChange={(e) => setResponsavelBalanco(e.target.value)}
            />

            {/* Barra de Busca de Alimentos no Modal */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Filtrar alimento por nome na contagem..."
                value={modalBusca}
                onChange={(e) => setModalBusca(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none"
                }}
              />
              <i className="ti ti-search" style={{ position: "absolute", left: 12, top: 9, color: "var(--text-muted)" }} />
              {modalBusca && (
                <button
                  onClick={() => setModalBusca("")}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: 8,
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Lista com Rolagem Otimizada */}
            <div className={styles.modalCountList}>
              {/* Modo Desktop: Tabela de Conferência */}
              <div className="sigem-desktop-table">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, color: "var(--text-secondary)", zIndex: 2 }}>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>Produto</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", width: 120 }}>Saldo Sistema</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", width: 150 }}>Contagem Real</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", width: 120 }}>Diferença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalItensFiltrados.map(i => {
                      const saldoAtual = Number(i.quantidadeAtual) || 0;
                      const contado = Number(ajustes[i.id] ?? saldoAtual);
                      const dif = contado - saldoAtual;

                      return (
                        <tr key={i.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "10px 14px" }}>
                            <strong style={{ color: "var(--text-primary)" }}>{i.nome}</strong>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              {i.categoria} · {i.unidade}
                            </div>
                          </td>

                          <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600 }}>
                            {saldoAtual} {i.unidade?.split(" ")[0]}
                          </td>

                          <td style={{ padding: "10px 14px", textAlign: "center" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <button
                                type="button"
                                className={styles.stepBtn}
                                onClick={() => {
                                  const cur = Number(ajustes[i.id] ?? saldoAtual);
                                  setAjustes({ ...ajustes, [i.id]: Math.max(0, cur - 1) });
                                }}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={ajustes[i.id] ?? saldoAtual}
                                onChange={(e) => setAjustes({ ...ajustes, [i.id]: e.target.value })}
                                style={{
                                  width: 70,
                                  padding: "6px 8px",
                                  textAlign: "center",
                                  borderRadius: 6,
                                  border: "1px solid var(--border-color)",
                                  background: "var(--bg-card)",
                                  color: "var(--text-primary)",
                                  fontWeight: 700,
                                  fontSize: 13
                                }}
                              />
                              <button
                                type="button"
                                className={styles.stepBtn}
                                onClick={() => {
                                  const cur = Number(ajustes[i.id] ?? saldoAtual);
                                  setAjustes({ ...ajustes, [i.id]: cur + 1 });
                                }}
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td style={{ padding: "10px 14px", textAlign: "center" }}>
                            {dif === 0 ? (
                              <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600 }}>✓ Correto</span>
                            ) : dif > 0 ? (
                              <span style={{ color: "#60a5fa", fontSize: 12, fontWeight: 700 }}>+{dif} (Sobra)</span>
                            ) : (
                              <span style={{ color: "#f87171", fontSize: 12, fontWeight: 700 }}>{dif} (Falta)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modo Mobile: Cards de Contagem Individual (Fácil de Tocar e Sem Colunas Estreitas) */}
              <div className="sigem-mobile-cards" style={{ padding: 10 }}>
                {modalItensFiltrados.map(i => {
                  const saldoAtual = Number(i.quantidadeAtual) || 0;
                  const contado = Number(ajustes[i.id] ?? saldoAtual);
                  const dif = contado - saldoAtual;

                  return (
                    <div key={`modal-mob-${i.id}`} className={styles.modalMobileItem}>
                      <div className={styles.modalItemHeader}>
                        <div>
                          <strong style={{ color: "var(--text-primary)", fontSize: 14 }}>{i.nome}</strong>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            {i.categoria} · {i.unidade}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Saldo Sistema:</span>
                          <div style={{ fontWeight: 700, color: "var(--text-secondary)", fontSize: 13 }}>
                            {saldoAtual} {i.unidade?.split(" ")[0]}
                          </div>
                        </div>
                      </div>

                      <div className={styles.modalItemInputRow}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                          Contagem Real:
                        </span>

                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <button
                            type="button"
                            className={styles.stepBtn}
                            onClick={() => {
                              const cur = Number(ajustes[i.id] ?? saldoAtual);
                              setAjustes({ ...ajustes, [i.id]: Math.max(0, cur - 1) });
                            }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={ajustes[i.id] ?? saldoAtual}
                            onChange={(e) => setAjustes({ ...ajustes, [i.id]: e.target.value })}
                            style={{
                              width: 75,
                              padding: "6px 8px",
                              textAlign: "center",
                              borderRadius: 6,
                              border: "1px solid var(--border-color)",
                              background: "var(--bg-surface)",
                              color: "var(--text-primary)",
                              fontWeight: 700,
                              fontSize: 14
                            }}
                          />
                          <button
                            type="button"
                            className={styles.stepBtn}
                            onClick={() => {
                              const cur = Number(ajustes[i.id] ?? saldoAtual);
                              setAjustes({ ...ajustes, [i.id]: cur + 1 });
                            }}
                          >
                            +
                          </button>
                        </div>

                        <div>
                          {dif === 0 ? (
                            <Badge color="green">✓ Correto</Badge>
                          ) : dif > 0 ? (
                            <Badge color="blue">+{dif} Sobra</Badge>
                          ) : (
                            <Badge color="red">{dif} Falta</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rodapé com Resumo de Conciliação */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-surface)",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 12.5
            }}>
              <span style={{ color: "var(--text-secondary)" }}>
                Total de itens auditados: <strong>{itensEstoque.length}</strong>
              </span>
              <span style={{ color: totalItensComDiferenca > 0 ? "#fbbf24" : "#34d399", fontWeight: 700 }}>
                {totalItensComDiferenca > 0
                  ? `⚡ ${totalItensComDiferenca} ${totalItensComDiferenca === 1 ? "item com diferença" : "itens com diferença"}`
                  : "✓ Todos os itens conciliados"}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

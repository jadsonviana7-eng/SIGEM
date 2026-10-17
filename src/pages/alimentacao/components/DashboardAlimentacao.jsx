import { useState, useMemo } from "react";
import { Badge } from "../../../components/ui";
import styles from "./DashboardAlimentacao.module.css";

export default function DashboardAlimentacao({
  itensEstoque = [],
  entradas = [],
  saidas = [],
  cardapios = [],
  merendaServida = [],
  fornecedores = [],
  onNavigateTab
}) {
  const [tipoMovimento, setTipoMovimento] = useState("todos"); // "todos" | "entradas" | "saidas"

  const stats = useMemo(() => {
    // Total de itens cadastrados
    const totalItens = itensEstoque.length;

    // Valor financeiro total estocado na despensa
    const valorTotalEstocado = itensEstoque.reduce((acc, item) => {
      const q = Number(item.quantidadeAtual) || 0;
      const p = Number(item.ultimoPreco) || 0;
      return acc + (q * p);
    }, 0);

    // Itens com estoque baixo (menor ou igual ao estoque mínimo)
    const itensEstoqueBaixo = itensEstoque.filter(item => {
      const atual = Number(item.quantidadeAtual) || 0;
      const min = Number(item.estoqueMinimo) || 0;
      return atual <= min;
    });

    // Alertas de validade
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const emQuinzeDias = new Date(hoje);
    emQuinzeDias.setDate(hoje.getDate() + 15);

    const alertasValidade = [];
    itensEstoque.forEach(item => {
      if (item.dataValidade) {
        const dVal = new Date(item.dataValidade + "T00:00:00");
        if (dVal < hoje) {
          alertasValidade.push({
            tipo: "danger",
            titulo: `Produto Vencido: ${item.nome}`,
            descricao: `Venceu em ${dVal.toLocaleDateString("pt-BR")} (Lote: ${item.lote || "-"}). Descartar com laudo.`,
            tab: "controle"
          });
        } else if (dVal <= emQuinzeDias) {
          alertasValidade.push({
            tipo: "warning",
            titulo: `Vence em menos de 15 dias: ${item.nome}`,
            descricao: `Data limite: ${dVal.toLocaleDateString("pt-BR")} (Estoque: ${item.quantidadeAtual} ${item.unidade}). Priorizar preparo.`,
            tab: "controle"
          });
        }
      }
    });

    // Total de refeições servidas
    const totalRefeicoes = merendaServida.reduce((acc, m) => acc + (Number(m.refeicoesServidas) || 0), 0);

    // Fornecedores da Agricultura Familiar PNAE
    const fornsPnae = fornecedores.filter(f =>
      (f.tipo || "").toLowerCase().includes("familiar") ||
      (f.tipo || "").toLowerCase().includes("pnae")
    ).length;

    return {
      totalItens,
      valorTotalEstocado,
      itensEstoqueBaixo,
      alertasValidade,
      totalRefeicoes,
      fornsPnae
    };
  }, [itensEstoque, merendaServida, fornecedores]);

  // Lista unificada de movimentações recentes
  const movimentacoesRecentes = useMemo(() => {
    const lista = [];

    if (tipoMovimento === "todos" || tipoMovimento === "entradas") {
      entradas.forEach(e => {
        lista.push({
          id: `ent-${e.id}`,
          tipo: "entrada",
          itemNome: e.itemNome,
          data: e.data,
          quantidade: e.quantidade,
          unidade: e.unidade || "un",
          extra: e.fornecedorNome || "Fornecedor Registrado"
        });
      });
    }

    if (tipoMovimento === "todos" || tipoMovimento === "saidas") {
      saidas.forEach(s => {
        lista.push({
          id: `sai-${s.id}`,
          tipo: "saida",
          itemNome: s.itemNome,
          data: s.data,
          quantidade: s.quantidade,
          unidade: s.unidade || "un",
          extra: s.destino || s.responsavel || "Cozinha da Escola"
        });
      });
    }

    // Ordenar pelas datas mais recentes
    return lista
      .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
      .slice(0, 6);
  }, [entradas, saidas, tipoMovimento]);

  const cardapioAtivo = cardapios[0] || null;

  return (
    <div className={styles.container}>
      {/* 1. Banner Principal de Ações Rápidas */}
      <div className={styles.banner}>
        <div className={styles.bannerInfo}>
          <h2 className={styles.bannerTitle}>
            <i className="ti ti-salad" style={{ fontSize: 26 }} />
            Módulo de Alimentação & Merenda Escolar
          </h2>
          <p className={styles.bannerSubtitle}>
            Controle de cardápios nutricionais, despensa escolar, compras PNAE da agricultura familiar, entradas, saídas e combate ao desperdício.
          </p>
        </div>

        <div className={styles.bannerActions}>
          <button
            onClick={() => onNavigateTab("merenda")}
            className={styles.bannerBtnPrimary}
          >
            <i className="ti ti-soup" /> Lançar Merenda do Dia
          </button>
          <button
            onClick={() => onNavigateTab("cardapios")}
            className={styles.bannerBtnSecondary}
          >
            <i className="ti ti-file-text" /> Ver Cardápio Oficial
          </button>
        </div>
      </div>

      {/* 2. Grid de Cards de Estatísticas Principais (KPIs) */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard} style={{ borderLeft: "4px solid #10b981" }}>
          <div className={styles.kpiHeader}>
            <div>
              <span className={styles.kpiLabel}>Refeições Servidas</span>
              <div className={styles.kpiValue} style={{ color: "#34d399" }}>
                {stats.totalRefeicoes.toLocaleString("pt-BR")}
              </div>
            </div>
            <div className={styles.kpiIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
              <i className="ti ti-soup" />
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <i className="ti ti-check" style={{ color: "#10b981" }} />
            <span>{merendaServida.length} registros de refeição realizados</span>
          </div>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: "4px solid #3b82f6" }}>
          <div className={styles.kpiHeader}>
            <div>
              <span className={styles.kpiLabel}>Itens na Despensa</span>
              <div className={styles.kpiValue} style={{ color: "#60a5fa" }}>
                {stats.totalItens} <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>produtos</span>
              </div>
            </div>
            <div className={styles.kpiIconWrap} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
              <i className="ti ti-packages" />
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Valor estocado: <strong style={{ color: "#60a5fa" }}>{stats.valorTotalEstocado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></span>
          </div>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: "4px solid #f59e0b" }}>
          <div className={styles.kpiHeader}>
            <div>
              <span className={styles.kpiLabel}>Estoque Baixo / Repor</span>
              <div className={styles.kpiValue} style={{ color: stats.itensEstoqueBaixo.length > 0 ? "#fbbf24" : "var(--text-primary)" }}>
                {stats.itensEstoqueBaixo.length} <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>itens</span>
              </div>
            </div>
            <div className={styles.kpiIconWrap} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
              <i className="ti ti-alert-triangle" />
            </div>
          </div>
          <div className={styles.kpiFooter}>
            {stats.itensEstoqueBaixo.length > 0 ? (
              <span style={{ color: "#fcd34d" }}>⚠️ Necessitam reposição ou compra</span>
            ) : (
              <span style={{ color: "#34d399" }}>✓ Todos acima da meta mínima</span>
            )}
          </div>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div className={styles.kpiHeader}>
            <div>
              <span className={styles.kpiLabel}>Agricultura Familiar</span>
              <div className={styles.kpiValue} style={{ color: "#a78bfa" }}>
                {stats.fornsPnae} <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>produtores</span>
              </div>
            </div>
            <div className={styles.kpiIconWrap} style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
              <i className="ti ti-plant" />
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span style={{ color: "var(--text-secondary)" }}>Meta PNAE: compra direta $\ge$ 30%</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. Layout em Cards Modulares (Substituindo Colunas Lado a Lado)
          ══════════════════════════════════════════════════════════════════ */}
      <div className={styles.cardsStack}>
        {/* CARD 1: Cardápio Escolar Vigente (Destaque do Dia) */}
        <div className={styles.modularCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <i className="ti ti-clipboard-list" style={{ color: "#10b981", fontSize: 20 }} />
              Cardápio Escolar Vigente & Refeições do Dia
            </h3>
            <button
              onClick={() => onNavigateTab("cardapios")}
              className={styles.cardLinkBtn}
            >
              Ver Todos os Cardápios <i className="ti ti-chevron-right" />
            </button>
          </div>

          {!cardapioAtivo ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              Nenhum cardápio cadastrado no momento.
            </div>
          ) : (
            <div className={styles.menuHighlightBox}>
              <div className={styles.menuMetaRow}>
                <div>
                  <div className={styles.menuTitle}>{cardapioAtivo.titulo}</div>
                  <div className={styles.menuSub}>
                    {cardapioAtivo.faixaEtaria} · {cardapioAtivo.nutricionistaResponsavel}
                  </div>
                </div>
                <Badge color="green">Vigente</Badge>
              </div>

              {cardapioAtivo.diasSemana?.segunda && (
                <div className={styles.menuMealsGrid}>
                  {cardapioAtivo.diasSemana.segunda.lancheManha && (
                    <div className={styles.mealItem}>
                      <span className={styles.mealLabel}>☕ Lanche da Manhã</span>
                      <span className={styles.mealText}>"{cardapioAtivo.diasSemana.segunda.lancheManha}"</span>
                    </div>
                  )}

                  {cardapioAtivo.diasSemana.segunda.almoco && (
                    <div className={styles.mealItem} style={{ borderLeft: "3px solid #10b981" }}>
                      <span className={styles.mealLabel} style={{ color: "#34d399" }}>🍽️ Almoço Principal</span>
                      <span className={styles.mealText}>"{cardapioAtivo.diasSemana.segunda.almoco}"</span>
                    </div>
                  )}

                  {cardapioAtivo.diasSemana.segunda.sobremesa && (
                    <div className={styles.mealItem}>
                      <span className={styles.mealLabel} style={{ color: "#fbbf24" }}>🍎 Sobremesa</span>
                      <span className={styles.mealText}>"{cardapioAtivo.diasSemana.segunda.sobremesa}"</span>
                    </div>
                  )}

                  {cardapioAtivo.diasSemana.segunda.lancheTarde && (
                    <div className={styles.mealItem}>
                      <span className={styles.mealLabel}>🥛 Lanche da Tarde</span>
                      <span className={styles.mealText}>"{cardapioAtivo.diasSemana.segunda.lancheTarde}"</span>
                    </div>
                  )}
                </div>
              )}

              {cardapioAtivo.restricoesAlimentares && (
                <div className={styles.dietNotice}>
                  <i className="ti ti-info-circle" style={{ fontSize: 16, marginTop: 1, flexShrink: 0, color: "#fde047" }} />
                  <span><strong>Adaptações & Restrições Atendidas:</strong> {cardapioAtivo.restricoesAlimentares}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CARD 2: Alertas de Validade & Auditoria da Despensa */}
        <div className={styles.modularCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <i className="ti ti-bell-ringing" style={{ color: "#f87171", fontSize: 20 }} />
              Alertas de Validade & Auditoria da Despensa
            </h3>
            <button
              onClick={() => onNavigateTab("controle")}
              className={styles.cardLinkBtn}
            >
              Ir para Controle & Balanço <i className="ti ti-chevron-right" />
            </button>
          </div>

          {stats.alertasValidade.length === 0 ? (
            <div style={{
              padding: "26px 18px",
              textAlign: "center",
              color: "#34d399",
              background: "rgba(16, 185, 129, 0.1)",
              borderRadius: 10,
              border: "1px solid rgba(16, 185, 129, 0.25)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6
            }}>
              <i className="ti ti-circle-check" style={{ fontSize: 32 }} />
              <div style={{ fontWeight: 700, fontSize: 14 }}>Despensa Saudável e Segura!</div>
              <div style={{ fontSize: 12, color: "#a7f3d0" }}>
                Nenhum alimento vencido ou com validade crítica identificado no momento.
              </div>
            </div>
          ) : (
            <div className={styles.alertsList}>
              {stats.alertasValidade.map((al, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateTab(al.tab)}
                  className={`${styles.alertCardItem} ${al.tipo === "danger" ? styles.alertDanger : styles.alertWarning}`}
                  title="Clique para ir à aba de controle deste produto"
                >
                  <div className={styles.alertInfo}>
                    <div className={styles.alertTitle} style={{ color: al.tipo === "danger" ? "#fca5a5" : "#fcd34d" }}>
                      <i className={al.tipo === "danger" ? "ti ti-alert-octagon" : "ti ti-clock-hour-4"} style={{ marginRight: 6 }} />
                      {al.titulo}
                    </div>
                    <div className={styles.alertDesc}>{al.descricao}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge color={al.tipo === "danger" ? "red" : "amber"}>
                      {al.tipo === "danger" ? "Vencido" : "Validade Próxima"}
                    </Badge>
                    <i className="ti ti-chevron-right" style={{ color: "var(--text-muted)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CARD 3: Movimentações Recentes da Despensa (Entradas e Saídas em Cards) */}
        <div className={styles.modularCard}>
          <div className={styles.cardHeader}>
            <div className={styles.filterSegmentRow} style={{ width: "100%" }}>
              <h3 className={styles.cardTitle}>
                <i className="ti ti-arrows-exchange" style={{ color: "#3b82f6", fontSize: 20 }} />
                Movimentações Recentes da Despensa
              </h3>

              {/* Botões Segmentados para Alternar Tipo de Movimentação */}
              <div className={styles.segmentedBtns}>
                <button
                  type="button"
                  className={`${styles.segBtn} ${tipoMovimento === "todos" ? styles.segBtnActive : ""}`}
                  onClick={() => setTipoMovimento("todos")}
                >
                  Todos ({entradas.length + saidas.length})
                </button>
                <button
                  type="button"
                  className={`${styles.segBtn} ${tipoMovimento === "entradas" ? styles.segBtnActive : ""}`}
                  onClick={() => setTipoMovimento("entradas")}
                >
                  <i className="ti ti-arrow-down-left" style={{ color: "#34d399" }} /> Entradas ({entradas.length})
                </button>
                <button
                  type="button"
                  className={`${styles.segBtn} ${tipoMovimento === "saidas" ? styles.segBtnActive : ""}`}
                  onClick={() => setTipoMovimento("saidas")}
                >
                  <i className="ti ti-arrow-up-right" style={{ color: "#fbbf24" }} /> Baixas ({saidas.length})
                </button>
              </div>
            </div>
          </div>

          {movimentacoesRecentes.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              Nenhuma movimentação registrada no filtro selecionado.
            </div>
          ) : (
            <div className={styles.movementsList}>
              {movimentacoesRecentes.map(m => {
                const isEntrada = m.tipo === "entrada";
                return (
                  <div key={m.id} className={styles.movementCard}>
                    <div
                      className={styles.movementIconWrap}
                      style={{
                        background: isEntrada ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: isEntrada ? "#34d399" : "#fbbf24"
                      }}
                    >
                      <i className={isEntrada ? "ti ti-arrow-down-left" : "ti ti-arrow-up-right"} />
                    </div>

                    <div className={styles.movementContent}>
                      <div className={styles.movementTitle}>{m.itemNome}</div>
                      <div className={styles.movementSub}>
                        {m.data ? new Date(m.data + "T00:00:00").toLocaleDateString("pt-BR") : "-"} · {m.extra}
                      </div>
                    </div>

                    <div>
                      <Badge color={isEntrada ? "green" : "amber"}>
                        {isEntrada ? `+${m.quantidade}` : `-${m.quantidade}`} {m.unidade}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Links para Histórico Completo */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid var(--border-color)", paddingTop: 10 }}>
            <button
              onClick={() => onNavigateTab("entradas")}
              className={styles.cardLinkBtn}
            >
              Ver Todas as Entradas <i className="ti ti-arrow-right" />
            </button>
            <button
              onClick={() => onNavigateTab("saidas")}
              className={styles.cardLinkBtn}
              style={{ color: "#fbbf24" }}
            >
              Ver Todas as Saídas <i className="ti ti-arrow-right" />
            </button>
          </div>
        </div>

        {/* CARD 4: Acessos Rápidos às Rotinas da Alimentação Escolar */}
        <div className={styles.modularCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <i className="ti ti-layout-grid" style={{ color: "#10b981", fontSize: 20 }} />
              Acessos Rápidos & Rotinas da Alimentação
            </h3>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Atalhos diretos</span>
          </div>

          <div className={styles.shortcutsGrid}>
            <div className={styles.shortcutCard} onClick={() => onNavigateTab("merenda")}>
              <div className={styles.shortcutIcon} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
                <i className="ti ti-soup" />
              </div>
              <div className={styles.shortcutTitle}>Lançar Merenda</div>
              <div className={styles.shortcutDesc}>Registro diário e aceitabilidade</div>
            </div>

            <div className={styles.shortcutCard} onClick={() => onNavigateTab("cardapios")}>
              <div className={styles.shortcutIcon} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
                <i className="ti ti-clipboard-list" />
              </div>
              <div className={styles.shortcutTitle}>Cardápios</div>
              <div className={styles.shortcutDesc}>Planejamento nutricional</div>
            </div>

            <div className={styles.shortcutCard} onClick={() => onNavigateTab("estoque")}>
              <div className={styles.shortcutIcon} style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
                <i className="ti ti-packages" />
              </div>
              <div className={styles.shortcutTitle}>Estoque Despensa</div>
              <div className={styles.shortcutDesc}>Catálogo e saldos atuais</div>
            </div>

            <div className={styles.shortcutCard} onClick={() => onNavigateTab("entradas")}>
              <div className={styles.shortcutIcon} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                <i className="ti ti-arrow-down-left" />
              </div>
              <div className={styles.shortcutTitle}>Entradas / NF-e</div>
              <div className={styles.shortcutDesc}>Recebimento de compras</div>
            </div>

            <div className={styles.shortcutCard} onClick={() => onNavigateTab("saidas")}>
              <div className={styles.shortcutIcon} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
                <i className="ti ti-arrow-up-right" />
              </div>
              <div className={styles.shortcutTitle}>Saídas Cozinha</div>
              <div className={styles.shortcutDesc}>Baixas para refeições</div>
            </div>

            <div className={styles.shortcutCard} onClick={() => onNavigateTab("controle")}>
              <div className={styles.shortcutIcon} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}>
                <i className="ti ti-checklist" />
              </div>
              <div className={styles.shortcutTitle}>Controle & Balanço</div>
              <div className={styles.shortcutDesc}>Auditoria e validades</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

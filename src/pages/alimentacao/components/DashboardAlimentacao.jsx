import { useMemo } from "react";
import { Card, Badge, Btn } from "../../../components/ui";

export default function DashboardAlimentacao({
  itensEstoque = [],
  entradas = [],
  saidas = [],
  cardapios = [],
  merendaServida = [],
  fornecedores = [],
  onNavigateTab
}) {
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
    const emQuinzeDias = new Date();
    emQuinzeDias.setDate(hoje.getDate() + 15);
    const emTrintaDias = new Date();
    emTrintaDias.setDate(hoje.getDate() + 30);

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
    const fornsPnae = fornecedores.filter(f => (f.tipo || "").toLowerCase().includes("familiar") || (f.tipo || "").toLowerCase().includes("pnae")).length;

    return {
      totalItens,
      valorTotalEstocado,
      itensEstoqueBaixo,
      alertasValidade,
      totalRefeicoes,
      fornsPnae
    };
  }, [itensEstoque, merendaServida, fornecedores]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Banner de Boas-Vindas */}
      <div style={{
        background: "linear-gradient(135deg, #047857 0%, #10b981 100%)",
        color: "white",
        padding: "24px 28px",
        borderRadius: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        boxShadow: "0 10px 25px -5px rgba(4, 120, 87, 0.3)"
      }}>
        <div>
          <h2 style={{ margin: "0 0 6px 0", fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ti ti-salad" style={{ fontSize: 26 }} /> Módulo de Alimentação & Merenda Escolar
          </h2>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
            Controle de cardápios nutricionais, despensa escolar, compras PNAE da agricultura familiar, entradas, saídas e combate ao desperdício.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => onNavigateTab("merenda")}
            style={{
              background: "white",
              color: "#047857",
              border: "none",
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
            }}
          >
            <i className="ti ti-soup" /> Lançar Merenda do Dia
          </button>
          <button
            onClick={() => onNavigateTab("cardapios")}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <i className="ti ti-file-text" /> Ver Cardápio Oficial
          </button>
        </div>
      </div>

      {/* Grid de Cards de Estatísticas Principais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Card style={{ padding: "18px 20px", borderLeft: "4px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Refeições Servidas</span>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1f2937", marginTop: 4 }}>
                {stats.totalRefeicoes.toLocaleString("pt-BR")}
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              <i className="ti ti-soup" />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#4b5563" }}>
            Em {merendaServida.length} registros diários de refeição
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Itens na Despensa</span>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1f2937", marginTop: 4 }}>
                {stats.totalItens} <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>produtos</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              <i className="ti ti-packages" />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#4b5563" }}>
            Valor estocado: <strong>{stats.valorTotalEstocado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Estoque Baixo / Repor</span>
              <div style={{ fontSize: 26, fontWeight: 700, color: stats.itensEstoqueBaixo.length > 0 ? "#b45309" : "#1f2937", marginTop: 4 }}>
                {stats.itensEstoqueBaixo.length} <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>itens</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              <i className="ti ti-alert-triangle" />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#4b5563" }}>
            Necessitam de pedido ou reposição de compra
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Agricultura Familiar PNAE</span>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1f2937", marginTop: 4 }}>
                {stats.fornsPnae} <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>produtores</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              <i className="ti ti-plant" />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#4b5563" }}>
            Meta legal PNAE: mínimo de 30% da compra direta
          </div>
        </Card>
      </div>

      {/* Seção Central: Alertas de Validade & Cardápio do Dia */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Painel de Alertas de Validade & Despensa */}
        <Card style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-bell-ringing" style={{ color: "#ef4444" }} /> Alertas de Validade & Despensa
            </h3>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
              {stats.alertasValidade.length} notificações
            </span>
          </div>

          {stats.alertasValidade.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#10b981", background: "#f0fdf4", borderRadius: 8, margin: "auto 0" }}>
              <i className="ti ti-circle-check" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>Despensa Saudável e Segura!</div>
              <div style={{ fontSize: 12, color: "#047857" }}>Nenhum produto vencido ou com validade crítica identificado.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto" }}>
              {stats.alertasValidade.map((al, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateTab(al.tab)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: al.tipo === "danger" ? "#fef2f2" : "#fffbeb",
                    borderLeft: `4px solid ${al.tipo === "danger" ? "#ef4444" : "#f59e0b"}`,
                    cursor: "pointer",
                    transition: "transform 0.1s ease"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = "translateX(3px)"}
                  onMouseOut={(e) => e.currentTarget.style.transform = "translateX(0)"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: al.tipo === "danger" ? "#991b1b" : "#92400e" }}>
                      {al.titulo}
                    </span>
                    <Badge color={al.tipo === "danger" ? "red" : "amber"}>Atenção</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: "#4b5563" }}>
                    {al.descricao}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Cardápio Ativo em Destaque */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-clipboard-list" style={{ color: "#059669" }} /> Cardápio Escolar Vigente
            </h3>
            <button
              onClick={() => onNavigateTab("cardapios")}
              style={{ background: "none", border: "none", color: "#059669", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Ver Todos <i className="ti ti-chevron-right" />
            </button>
          </div>

          {cardapios.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#9ca3af" }}>
              Nenhum cardápio cadastrado no momento.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: 8, borderLeft: "4px solid #10b981" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                  {cardapios[0].titulo}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {cardapios[0].faixaEtaria} · {cardapios[0].nutricionistaResponsavel}
                </div>

                {cardapios[0].diasSemana?.segunda && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #e2e8f0", fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: "#059669", marginBottom: 4 }}>
                      🍽️ Sugestão do Dia (Almoço):
                    </div>
                    <div style={{ color: "#334155", fontStyle: "italic" }}>
                      "{cardapios[0].diasSemana.segunda.almoco}"
                    </div>
                    <div style={{ color: "#64748b", marginTop: 4 }}>
                      Sobremesa: {cardapios[0].diasSemana.segunda.sobremesa}
                    </div>
                  </div>
                )}
              </div>

              {cardapios[0].restricoesAlimentares && (
                <div style={{ fontSize: 12, background: "#fef9c3", color: "#854d0e", padding: "10px 12px", borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <i className="ti ti-info-circle" style={{ fontSize: 16, marginTop: 1, flexShrink: 0 }} />
                  <span><strong>Restrições Especiais Atendidas:</strong> {cardapios[0].restricoesAlimentares}</span>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Tabela de Últimas Movimentações (Entradas e Saídas Recentes) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Últimas Entradas */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1f2937", display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-arrow-down-left" style={{ color: "#059669" }} /> Últimas Entradas na Despensa
            </h4>
            <button
              onClick={() => onNavigateTab("entradas")}
              style={{ background: "none", border: "none", color: "#059669", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Ver Todas
            </button>
          </div>

          {entradas.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Nenhuma entrada registrada.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {entradas.slice(0, 4).map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f8fafc", borderRadius: 6, fontSize: 12 }}>
                  <div>
                    <strong style={{ color: "#1e293b" }}>{e.itemNome}</strong>
                    <div style={{ color: "#64748b", fontSize: 11 }}>{new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR")} · {e.fornecedorNome}</div>
                  </div>
                  <Badge color="green">+{e.quantidade} {e.unidade}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Últimas Saídas para a Cozinha */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1f2937", display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-arrow-up-right" style={{ color: "#d97706" }} /> Últimas Baixas para Cozinha
            </h4>
            <button
              onClick={() => onNavigateTab("saidas")}
              style={{ background: "none", border: "none", color: "#d97706", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Ver Todas
            </button>
          </div>

          {saidas.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Nenhuma saída registrada.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {saidas.slice(0, 4).map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f8fafc", borderRadius: 6, fontSize: 12 }}>
                  <div>
                    <strong style={{ color: "#1e293b" }}>{s.itemNome}</strong>
                    <div style={{ color: "#64748b", fontSize: 11 }}>{new Date(s.data + "T00:00:00").toLocaleDateString("pt-BR")} · {s.destino}</div>
                  </div>
                  <Badge color="amber">-{s.quantidade} {s.unidade}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

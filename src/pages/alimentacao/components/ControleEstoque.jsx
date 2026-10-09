import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Badge, EmptyState, Alert } from "../../../components/ui";
import { updateItemEstoque, addAuditoriaEstoque } from "../../../services/alimentacaoService";

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

  const hoje = new Date();
  const emQuinzeDias = new Date();
  emQuinzeDias.setDate(hoje.getDate() + 15);
  const emTrintaDias = new Date();
  emTrintaDias.setDate(hoje.getDate() + 30);

  // Alertas de Validade
  const itensVencidos = useMemo(() => {
    return itensEstoque.filter(item => item.dataValidade && new Date(item.dataValidade + "T00:00:00") < hoje);
  }, [itensEstoque, hoje]);

  const itensVencendo15Dias = useMemo(() => {
    return itensEstoque.filter(item => {
      if (!item.dataValidade) return false;
      const d = new Date(item.dataValidade + "T00:00:00");
      return d >= hoje && d <= emQuinzeDias;
    });
  }, [itensEstoque, hoje, emQuinzeDias]);

  // Itens com Estoque Baixo
  const itensCriticos = useMemo(() => {
    return itensEstoque.filter(item => {
      const qtd = Number(item.quantidadeAtual) || 0;
      const min = Number(item.estoqueMinimo) || 0;
      return qtd <= min;
    });
  }, [itensEstoque]);

  const abrirBalanco = () => {
    const map = {};
    itensEstoque.forEach(i => {
      map[i.id] = i.quantidadeAtual;
    });
    setAjustes(map);
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
      setSucessoMsg("Contagem de inventário salva e saldos da despensa atualizados com sucesso!");
      setTimeout(() => setSucessoMsg(""), 5000);
      onReload();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar balanço: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {sucessoMsg && <Alert tipo="success">{sucessoMsg}</Alert>}

      {/* Barra de Ações Rápidas */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
            Painel de Controle e Auditoria de Estoque
          </h3>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Monitoramento preventivo de validades, reposições urgentes e contagem física da despensa.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{
              background: "#f8fafc",
              border: "1px solid #d1d5db",
              padding: "8px 14px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <i className="ti ti-printer" /> Imprimir Balanço
          </button>

          <Btn variant="primary" onClick={abrirBalanco}>
            <i className="ti ti-checklist" /> Realizar Balanço / Inventário
          </Btn>
        </div>
      </div>

      {/* Grid de Alertas de Auditoria */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* Card Itens Vencidos */}
        <Card style={{ borderLeft: "4px solid #ef4444", padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>
              <i className="ti ti-alert-octagon" style={{ marginRight: 4 }} /> Produtos Vencidos
            </span>
            <Badge color="red">{itensVencidos.length}</Badge>
          </div>
          {itensVencidos.length === 0 ? (
            <div style={{ fontSize: 12, color: "#059669" }}>✓ Nenhum produto vencido na despensa.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#4b5563" }}>
              {itensVencidos.map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", background: "#fef2f2", padding: "4px 8px", borderRadius: 4 }}>
                  <span>{i.nome}</span>
                  <strong style={{ color: "#991b1b" }}>{new Date(i.dataValidade + "T00:00:00").toLocaleDateString("pt-BR")}</strong>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Card Itens a Vencer em 15 Dias */}
        <Card style={{ borderLeft: "4px solid #f59e0b", padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>
              <i className="ti ti-clock-hour-4" style={{ marginRight: 4 }} /> Validade Próxima (&lt; 15 dias)
            </span>
            <Badge color="amber">{itensVencendo15Dias.length}</Badge>
          </div>
          {itensVencendo15Dias.length === 0 ? (
            <div style={{ fontSize: 12, color: "#059669" }}>✓ Nenhum produto com validade crítica.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#4b5563" }}>
              {itensVencendo15Dias.map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", background: "#fffbeb", padding: "4px 8px", borderRadius: 4 }}>
                  <span>{i.nome} ({i.quantidadeAtual} {i.unidade?.split(" ")[0]})</span>
                  <strong style={{ color: "#b45309" }}>{new Date(i.dataValidade + "T00:00:00").toLocaleDateString("pt-BR")}</strong>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Card Estoque Baixo / Reposição */}
        <Card style={{ borderLeft: "4px solid #3b82f6", padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e40af" }}>
              <i className="ti ti-package-off" style={{ marginRight: 4 }} /> Necessitam Reposição
            </span>
            <Badge color="blue">{itensCriticos.length}</Badge>
          </div>
          {itensCriticos.length === 0 ? (
            <div style={{ fontSize: 12, color: "#059669" }}>✓ Estoque de todos os itens em nível seguro.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#4b5563" }}>
              {itensCriticos.slice(0, 3).map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", background: "#eff6ff", padding: "4px 8px", borderRadius: 4 }}>
                  <span>{i.nome}</span>
                  <strong style={{ color: "#dc2626" }}>{i.quantidadeAtual} / mín {i.estoqueMinimo}</strong>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Tabela de Conciliação Geral de Estoque */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: 700, color: "#1f2937", fontSize: 14 }}>
          Posição Consolidada de Inventário da Despensa
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "12px 16px" }}>Produto</th>
                <th style={{ padding: "12px 16px" }}>Categoria</th>
                <th style={{ padding: "12px 16px" }}>Local de Guarda</th>
                <th style={{ padding: "12px 16px" }}>Saldo Atual</th>
                <th style={{ padding: "12px 16px" }}>Estoque Mín.</th>
                <th style={{ padding: "12px 16px" }}>Status do Nível</th>
                <th style={{ padding: "12px 16px" }}>Data de Validade</th>
              </tr>
            </thead>
            <tbody>
              {itensEstoque.map((item) => {
                const qtd = Number(item.quantidadeAtual) || 0;
                const min = Number(item.estoqueMinimo) || 0;
                const isCritico = qtd <= min;
                const pct = min > 0 ? Math.min(Math.round((qtd / min) * 100), 100) : 100;

                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>{item.nome}</td>
                    <td style={{ padding: "12px 16px" }}>{item.categoria}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{item.localArmazenamento || "Despensa Seca"}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: isCritico ? "#dc2626" : "#059669" }}>
                      {qtd} {item.unidade?.split(" ")[0]}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{min} {item.unidade?.split(" ")[0]}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color={isCritico ? "red" : pct < 150 ? "amber" : "green"}>
                        {isCritico ? "Crítico / Repor" : "Adequado"}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      {item.dataValidade ? new Date(item.dataValidade + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Balanço Físico / Inventário */}
      {modalBalanco && (
        <Modal
          titulo="Realizar Balanço Físico de Estoque da Merenda"
          onClose={() => setModalBalanco(false)}
          onSave={handleSalvarBalanco}
          salvando={salvando}
          larguraMax={720}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: "#4b5563", margin: 0 }}>
              Insira a contagem física real dos alimentos apurada na despensa. Ao salvar, as quantidades no sistema serão conciliadas com a contagem.
            </p>

            <Input
              label="Responsável pela Contagem / Conferência"
              value={responsavelBalanco}
              onChange={(e) => setResponsavelBalanco(e.target.value)}
            />

            <div style={{ maxHeight: 380, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0 }}>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Produto</th>
                    <th style={{ padding: "8px 12px", textAlign: "center", width: 120 }}>Saldo Atual</th>
                    <th style={{ padding: "8px 12px", textAlign: "center", width: 140 }}>Contagem Física Real</th>
                  </tr>
                </thead>
                <tbody>
                  {itensEstoque.map(i => (
                    <tr key={i.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 12px" }}>
                        <strong>{i.nome}</strong>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{i.categoria} · {i.unidade}</div>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", color: "#64748b" }}>
                        {i.quantidadeAtual}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <input
                          type="number"
                          value={ajustes[i.id] ?? i.quantidadeAtual}
                          onChange={(e) => setAjustes({ ...ajustes, [i.id]: e.target.value })}
                          style={{
                            width: 90,
                            padding: "6px 8px",
                            textAlign: "center",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            fontWeight: 600,
                            fontSize: 13
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

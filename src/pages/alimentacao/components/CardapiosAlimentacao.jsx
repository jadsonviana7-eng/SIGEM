import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addCardapio, updateCardapio, deleteCardapio } from "../../../services/alimentacaoService";

export default function CardapiosAlimentacao({
  cardapios = [],
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [cardapioEditando, setCardapioEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // Impressão
  const [modalImpressao, setModalImpressao] = useState(false);
  const [cardapioSelecionado, setCardapioSelecionado] = useState(null);

  const [form, setForm] = useState({
    titulo: "",
    periodo: "Mensal - Outubro/2026",
    faixaEtaria: "6 a 14 anos (Ensino Fundamental I e II)",
    nutricionistaResponsavel: "Dra. Ana Paula Cavalcante (CRN-6 12845)",
    diasSemana: {
      segunda: { lancheManha: "", almoco: "", sobremesa: "", lancheTarde: "" },
      terca:   { lancheManha: "", almoco: "", sobremesa: "", lancheTarde: "" },
      quarta:  { lancheManha: "", almoco: "", sobremesa: "", lancheTarde: "" },
      quinta:  { lancheManha: "", almoco: "", sobremesa: "", lancheTarde: "" },
      sexta:   { lancheManha: "", almoco: "", sobremesa: "", lancheTarde: "" }
    },
    restricoesAlimentares: "",
    status: "Ativo"
  });

  const abrirNovo = () => {
    setCardapioEditando(null);
    setForm({
      titulo: "",
      periodo: "Mensal - " + new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      faixaEtaria: "6 a 14 anos (Ensino Fundamental I e II)",
      nutricionistaResponsavel: "Nutricionista Escolar (CRN-6)",
      diasSemana: {
        segunda: { lancheManha: "Leite com cacau e biscoito integral", almoco: "Arroz enriquecido, feijão carioca, frango em cubos e salada", sobremesa: "Banana Prata", lancheTarde: "Suco natural e bolo de cenoura" },
        terca:   { lancheManha: "Iogurte natural batido com frutas", almoco: "Macarronada nutritiva com carne moída magra e legumes", sobremesa: "Melancia em fatias", lancheTarde: "Vitamina de frutas com aveia" },
        quarta:  { lancheManha: "Mingau de aveia com maçã picada", almoco: "Arroz com cenoura, feijão verde e ensopado de carne com batata", sobremesa: "Laranja fatiada", lancheTarde: "Suco de manga e biscoito de polvilho" },
        quinta:  { lancheManha: "Leite integral e pão com queijo branco", almoco: "Arroz, feijão tropeiro leve, filé de frango grelhado e vinagrete", sobremesa: "Mamão fatiado", lancheTarde: "Salada de frutas da estação" },
        sexta:   { lancheManha: "Cuscuz de milho tradicional com leite", almoco: "Risoto de legumes com frango desfiado e salada de beterraba", sobremesa: "Abacaxi doce", lancheTarde: "Suco de maracujá e biscoito caseiro" }
      },
      restricoesAlimentares: "Opção sem lactose e sem glúten disponível mediante laudo médico.",
      status: "Ativo"
    });
    setErro("");
    setModalAberto(true);
  };

  const abrirEditar = (c) => {
    setCardapioEditando(c);
    setForm({
      titulo: c.titulo || "",
      periodo: c.periodo || "",
      faixaEtaria: c.faixaEtaria || "",
      nutricionistaResponsavel: c.nutricionistaResponsavel || "",
      diasSemana: c.diasSemana || {
        segunda: { lancheManha: "", almoco: "", sobremesa: "", lancheTarde: "" },
        terca:   { lancheManha: "", almoco: "", sobremesa: "", lancheTarde: "" },
        quarta:  { lancheManha: "", almoco: "", sobremesa: "", lancheTarde: "" },
        quinta:  { lancheManha: "", almoco: "", sobremesa: "", lancheTarde: "" },
        sexta:   { lancheManha: "", almoco: "", sobremesa: "", lancheTarde: "" }
      },
      restricoesAlimentares: c.restricoesAlimentares || "",
      status: c.status || "Ativo"
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.titulo.trim()) {
      setErro("Informe o título do cardápio.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const payload = { ...form };

      if (cardapioEditando) {
        await updateCardapio(cardapioEditando.id, payload);
      } else {
        await addCardapio(payload, escolaId);
      }

      setModalAberto(false);
      onReload();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar cardápio: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id, titulo) => {
    if (window.confirm(`Deseja realmente excluir o cardápio "${titulo}"?`)) {
      try {
        await deleteCardapio(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const cardapiosFiltrados = useMemo(() => {
    return cardapios.filter(c => {
      const termo = busca.toLowerCase();
      return (
        (c.titulo || "").toLowerCase().includes(termo) ||
        (c.faixaEtaria || "").toLowerCase().includes(termo) ||
        (c.nutricionistaResponsavel || "").toLowerCase().includes(termo)
      );
    });
  }, [cardapios, busca]);

  const imprimirCardapio = (c) => {
    setCardapioSelecionado(c);
    setModalImpressao(true);
  };

  const diasNomes = [
    { key: "segunda", label: "Segunda-feira" },
    { key: "terca",   label: "Terça-feira" },
    { key: "quarta",  label: "Quarta-feira" },
    { key: "quinta",  label: "Quinta-feira" },
    { key: "sexta",   label: "Sexta-feira" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Barra de Filtros & Ações */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 460 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Buscar cardápios por título ou nutricionista..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                outline: "none"
              }}
            />
            <i className="ti ti-search" style={{ position: "absolute", left: 12, top: 11, color: "#9ca3af" }} />
          </div>
        </div>

        <Btn variant="primary" onClick={abrirNovo}>
          <i className="ti ti-plus" /> Elaborar Novo Cardápio
        </Btn>
      </div>

      {/* Lista de Cardápios */}
      {cardapiosFiltrados.length === 0 ? (
        <EmptyState icon="clipboard-list" texto="Nenhum cardápio cadastrado no momento." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {cardapiosFiltrados.map((cardapio) => (
            <Card key={cardapio.id} style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1f2937" }}>
                      {cardapio.titulo}
                    </h3>
                    <Badge color={cardapio.status === "Ativo" ? "green" : "gray"}>
                      {cardapio.status || "Ativo"}
                    </Badge>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    <strong>Público:</strong> {cardapio.faixaEtaria} · <strong>Vigência:</strong> {cardapio.periodo} · <strong>Responsável:</strong> {cardapio.nutricionistaResponsavel}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => imprimirCardapio(cardapio)}
                    style={{
                      background: "#ecfdf5",
                      color: "#059669",
                      border: "1px solid #a7f3d0",
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <i className="ti ti-printer" /> Imprimir Cardápio
                  </button>
                  <Btn onClick={() => abrirEditar(cardapio)} style={{ padding: "6px 10px", fontSize: 12 }}>
                    <i className="ti ti-edit" /> Editar
                  </Btn>
                  <Btn variant="danger" onClick={() => handleExcluir(cardapio.id, cardapio.titulo)} style={{ padding: "6px 10px", fontSize: 12 }}>
                    <i className="ti ti-trash" />
                  </Btn>
                </div>
              </div>

              {/* Tabela da Semana */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left", borderRadius: 8, overflow: "hidden" }}>
                  <thead>
                    <tr style={{ background: "#047857", color: "white" }}>
                      <th style={{ padding: "10px 12px", width: "16%" }}>Refeição</th>
                      {diasNomes.map(d => (
                        <th key={d.key} style={{ padding: "10px 12px", width: "16.8%" }}>{d.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#047857" }}>Lanche da Manhã</td>
                      {diasNomes.map(d => (
                        <td key={d.key} style={{ padding: "10px 12px", color: "#334155" }}>
                          {cardapio.diasSemana?.[d.key]?.lancheManha || "-"}
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#047857" }}>Almoço Completo</td>
                      {diasNomes.map(d => (
                        <td key={d.key} style={{ padding: "10px 12px", color: "#1e293b", fontWeight: 500 }}>
                          {cardapio.diasSemana?.[d.key]?.almoco || "-"}
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#047857" }}>Sobremesa / Fruta</td>
                      {diasNomes.map(d => (
                        <td key={d.key} style={{ padding: "10px 12px", color: "#059669" }}>
                          🍌 {cardapio.diasSemana?.[d.key]?.sobremesa || "-"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#047857" }}>Lanche da Tarde</td>
                      {diasNomes.map(d => (
                        <td key={d.key} style={{ padding: "10px 12px", color: "#334155" }}>
                          {cardapio.diasSemana?.[d.key]?.lancheTarde || "-"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {cardapio.restricoesAlimentares && (
                <div style={{ marginTop: 14, fontSize: 12, background: "#fef9c3", color: "#854d0e", padding: "10px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="ti ti-heart-handshake" style={{ fontSize: 16 }} />
                  <span><strong>Adaptações para Restrições Alimentares:</strong> {cardapio.restricoesAlimentares}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Cadastro/Edição de Cardápio */}
      {modalAberto && (
        <Modal
          titulo={cardapioEditando ? "Editar Cardápio Escolar" : "Elaborar Novo Cardápio Nutricional"}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={780}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              label="Título do Cardápio *"
              placeholder="Ex: Cardápio Padrão Ensino Fundamental (Novembro/2026)"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input
                label="Período / Vigência"
                placeholder="Ex: 01/11/2026 a 30/11/2026"
                value={form.periodo}
                onChange={(e) => setForm({ ...form, periodo: e.target.value })}
              />
              <Input
                label="Faixa Etária / Nível"
                placeholder="Ex: 6 a 14 anos (Fund. I e II)"
                value={form.faixaEtaria}
                onChange={(e) => setForm({ ...form, faixaEtaria: e.target.value })}
              />
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Ativo">Ativo (Em vigor)</option>
                <option value="Planejado">Planejado (Próximo mês)</option>
                <option value="Arquivado">Arquivado</option>
              </Select>
            </div>

            <Input
              label="Nutricionista Responsável (com Registro CRN)"
              placeholder="Ex: Dra. Ana Paula Cavalcante (CRN-6 12845)"
              value={form.nutricionistaResponsavel}
              onChange={(e) => setForm({ ...form, nutricionistaResponsavel: e.target.value })}
            />

            {/* Configuração Diária dos Pratos */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 8, display: "block" }}>
                Composição Nutricional Semanal (Segunda a Sexta):
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {diasNomes.map(d => (
                  <div key={d.key} style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 700, color: "#047857", fontSize: 13, marginBottom: 8 }}>
                      📅 {d.label}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr", gap: 8 }}>
                      <Input
                        placeholder="Lanche da manhã"
                        value={form.diasSemana?.[d.key]?.lancheManha || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm(prev => ({
                            ...prev,
                            diasSemana: {
                              ...prev.diasSemana,
                              [d.key]: { ...prev.diasSemana[d.key], lancheManha: val }
                            }
                          }));
                        }}
                      />
                      <Input
                        placeholder="Almoço completo"
                        value={form.diasSemana?.[d.key]?.almoco || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm(prev => ({
                            ...prev,
                            diasSemana: {
                              ...prev.diasSemana,
                              [d.key]: { ...prev.diasSemana[d.key], almoco: val }
                            }
                          }));
                        }}
                      />
                      <Input
                        placeholder="Sobremesa / Fruta"
                        value={form.diasSemana?.[d.key]?.sobremesa || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm(prev => ({
                            ...prev,
                            diasSemana: {
                              ...prev.diasSemana,
                              [d.key]: { ...prev.diasSemana[d.key], sobremesa: val }
                            }
                          }));
                        }}
                      />
                      <Input
                        placeholder="Lanche da tarde"
                        value={form.diasSemana?.[d.key]?.lancheTarde || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm(prev => ({
                            ...prev,
                            diasSemana: {
                              ...prev.diasSemana,
                              [d.key]: { ...prev.diasSemana[d.key], lancheTarde: val }
                            }
                          }));
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Input
              label="Orientações para Restrições Alimentares / Alergias"
              placeholder="Ex: Leite vegetal para intolerantes à lactose e opções sem glúten para celíacos."
              value={form.restricoesAlimentares}
              onChange={(e) => setForm({ ...form, restricoesAlimentares: e.target.value })}
            />
          </div>
        </Modal>
      )}

      {/* Modal de Impressão do Cardápio */}
      {modalImpressao && cardapioSelecionado && (
        <Modal
          titulo="Imprimir Cardápio Oficial da Merenda Escolar"
          onClose={() => setModalImpressao(false)}
          larguraMax={780}
          semRodape
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #047857", paddingBottom: 10 }}>
              <div>
                <h3 style={{ margin: 0, color: "#047857", fontSize: 18 }}>SIGEM — Programa Nacional de Alimentação Escolar (PNAE)</h3>
                <div style={{ fontSize: 13, color: "#4b5563" }}>Cardápio Semanal Nutricional Oficial</div>
              </div>
              <button
                onClick={() => window.print()}
                style={{
                  background: "#047857",
                  color: "white",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <i className="ti ti-printer" /> Imprimir Documento
              </button>
            </div>

            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: 12 }}>
              <div><strong>Título:</strong> {cardapioSelecionado.titulo}</div>
              <div><strong>Público-Alvo:</strong> {cardapioSelecionado.faixaEtaria} · <strong>Período:</strong> {cardapioSelecionado.periodo}</div>
              <div><strong>Responsável Técnico:</strong> {cardapioSelecionado.nutricionistaResponsavel}</div>
            </div>

            {/* Tabela de Impressão */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left", border: "1px solid #cbd5e1" }}>
              <thead>
                <tr style={{ background: "#047857", color: "white" }}>
                  <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Refeição</th>
                  {diasNomes.map(d => (
                    <th key={d.key} style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "8px 10px", fontWeight: 700, border: "1px solid #cbd5e1" }}>Lanche Manhã</td>
                  {diasNomes.map(d => (
                    <td key={d.key} style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>{cardapioSelecionado.diasSemana?.[d.key]?.lancheManha || "-"}</td>
                  ))}
                </tr>
                <tr style={{ background: "#f8fafc" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 700, border: "1px solid #cbd5e1" }}>Almoço</td>
                  {diasNomes.map(d => (
                    <td key={d.key} style={{ padding: "8px 10px", fontWeight: 600, border: "1px solid #cbd5e1" }}>{cardapioSelecionado.diasSemana?.[d.key]?.almoco || "-"}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: "8px 10px", fontWeight: 700, border: "1px solid #cbd5e1" }}>Sobremesa</td>
                  {diasNomes.map(d => (
                    <td key={d.key} style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>{cardapioSelecionado.diasSemana?.[d.key]?.sobremesa || "-"}</td>
                  ))}
                </tr>
                <tr style={{ background: "#f8fafc" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 700, border: "1px solid #cbd5e1" }}>Lanche Tarde</td>
                  {diasNomes.map(d => (
                    <td key={d.key} style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>{cardapioSelecionado.diasSemana?.[d.key]?.lancheTarde || "-"}</td>
                  ))}
                </tr>
              </tbody>
            </table>

            {cardapioSelecionado.restricoesAlimentares && (
              <div style={{ fontSize: 11, color: "#334155", border: "1px dashed #cbd5e1", padding: 8, borderRadius: 6 }}>
                <strong>Observações Nutricionais / Restrições:</strong> {cardapioSelecionado.restricoesAlimentares}
              </div>
            )}

            {/* Assinaturas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 24, paddingTop: 20, borderTop: "1px dashed #cbd5e1", textAlign: "center", fontSize: 11 }}>
              <div>
                <div style={{ borderBottom: "1px solid #475569", width: "80%", margin: "0 auto 6px" }} />
                <div>Nutricionista Responsável Técnica</div>
                <div style={{ color: "#64748b" }}>{cardapioSelecionado.nutricionistaResponsavel}</div>
              </div>
              <div>
                <div style={{ borderBottom: "1px solid #475569", width: "80%", margin: "0 auto 6px" }} />
                <div>Direção Escolar / Coordenação de Merenda</div>
                <div style={{ color: "#64748b" }}>Conselho de Alimentação Escolar (CAE)</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

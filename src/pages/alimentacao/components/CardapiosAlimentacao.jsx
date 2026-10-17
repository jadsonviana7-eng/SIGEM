import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addCardapio, updateCardapio, deleteCardapio } from "../../../services/alimentacaoService";
import styles from "./CardapiosAlimentacao.module.css";

const DIAS_SEMANA_INFO = [
  { key: "segunda", label: "Segunda-feira", short: "Seg" },
  { key: "terca",   label: "Terça-feira",   short: "Ter" },
  { key: "quarta",  label: "Quarta-feira",  short: "Qua" },
  { key: "quinta",  label: "Quinta-feira",  short: "Qui" },
  { key: "sexta",   label: "Sexta-feira",   short: "Sex" }
];
const diasNomes = DIAS_SEMANA_INFO;

const TIPOS_REFEICAO = [
  {
    key: "lancheManha",
    label: "Lanche da Manhã",
    icon: "ti-sun",
    cor: "#fbbf24"
  },
  {
    key: "almoco",
    label: "Almoço Completo",
    icon: "ti-soup",
    cor: "#34d399"
  },
  {
    key: "sobremesa",
    label: "Sobremesa / Fruta",
    icon: "ti-apple",
    cor: "#facc15"
  },
  {
    key: "lancheTarde",
    label: "Lanche da Tarde",
    icon: "ti-coffee",
    cor: "#818cf8"
  }
];

function getDiaHojeKey() {
  const d = new Date().getDay(); // 0 Dom, 1 Seg, 2 Ter, 3 Qua, 4 Qui, 5 Sex, 6 Sab
  if (d === 1) return "segunda";
  if (d === 2) return "terca";
  if (d === 3) return "quarta";
  if (d === 4) return "quinta";
  if (d === 5) return "sexta";
  return "segunda";
}

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
  const [diaSelecionadoPorCardapio, setDiaSelecionadoPorCardapio] = useState({});

  const getDiaAtivo = (cardapioId) => {
    return diaSelecionadoPorCardapio[cardapioId] || getDiaHojeKey();
  };

  const setDiaAtivo = (cardapioId, diaKey) => {
    setDiaSelecionadoPorCardapio(prev => ({
      ...prev,
      [cardapioId]: diaKey
    }));
  };

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
                border: "1px solid #33435c",
                background: "#1e293b",
                color: "#ffffff",
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
          {cardapiosFiltrados.map((cardapio) => {
            const diaAtivo = getDiaAtivo(cardapio.id);

            return (
              <div key={cardapio.id} className={styles.cardapioCard}>
                {/* Cabeçalho do Cardápio */}
                <div className={styles.cardapioHeader}>
                  <div className={styles.headerInfo}>
                    <div className={styles.tituloRow}>
                      <h3 className={styles.titulo}>{cardapio.titulo}</h3>
                      <Badge color={cardapio.status === "Ativo" ? "green" : "gray"}>
                        {cardapio.status || "Ativo"}
                      </Badge>
                    </div>

                    <div className={styles.metaGrid}>
                      <span className={styles.metaItem}>
                        <i className={`ti ti-school ${styles.metaIcon}`} />
                        <span><strong>Público:</strong> {cardapio.faixaEtaria}</span>
                      </span>
                      <span className={styles.metaItem}>
                        <i className={`ti ti-calendar ${styles.metaIcon}`} />
                        <span><strong>Vigência:</strong> {cardapio.periodo}</span>
                      </span>
                      <span className={styles.metaItem}>
                        <i className={`ti ti-user-check ${styles.metaIcon}`} />
                        <span><strong>Nutricionista:</strong> {cardapio.nutricionistaResponsavel}</span>
                      </span>
                    </div>
                  </div>

                  <div className={styles.headerActions}>
                    <button
                      type="button"
                      onClick={() => imprimirCardapio(cardapio)}
                      className={styles.btnPrint}
                      title="Imprimir Cardápio Oficial"
                    >
                      <i className="ti ti-printer" />
                      <span>Imprimir Cardápio</span>
                    </button>
                    <Btn
                      onClick={() => abrirEditar(cardapio)}
                      style={{ padding: "7px 12px", fontSize: "12.5px" }}
                      title="Editar Cardápio"
                    >
                      <i className="ti ti-edit" /> Editar
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={() => handleExcluir(cardapio.id, cardapio.titulo)}
                      style={{ padding: "7px 10px", fontSize: "12.5px" }}
                      title="Excluir Cardápio"
                    >
                      <i className="ti ti-trash" />
                    </Btn>
                  </div>
                </div>

                {/* 1. VISUALIZAÇÃO MOBILE INTELIGENTE (Cards de Refeição por Dia) */}
                <div className={styles.mobileMenuViewer}>
                  {/* Seletor de Dias em Chips Táteis */}
                  <div className={styles.dayChipsBar}>
                    {DIAS_SEMANA_INFO.map(d => {
                      const isDiaAtivo = diaAtivo === d.key;
                      const isHoje = getDiaHojeKey() === d.key;
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => setDiaAtivo(cardapio.id, d.key)}
                          className={`${styles.dayChip} ${isDiaAtivo ? styles.dayChipActive : ""}`}
                        >
                          <span>{d.short}</span>
                          {isHoje && <span className={styles.todayBadge}>Hoje</span>}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setDiaAtivo(cardapio.id, "todos")}
                      className={`${styles.dayChip} ${diaAtivo === "todos" ? styles.dayChipActive : ""}`}
                    >
                      <i className="ti ti-calendar-week" />
                      <span>Semana Toda</span>
                    </button>
                  </div>

                  {/* Refeições do Dia Ativo */}
                  {diaAtivo !== "todos" ? (
                    <div className={styles.dayCardContent}>
                      <div className={styles.dayTitleRow}>
                        <div className={styles.dayTitle}>
                          <i className="ti ti-calendar-event" style={{ color: "#34d399", fontSize: 18 }} />
                          <span>{DIAS_SEMANA_INFO.find(d => d.key === diaAtivo)?.label || "Cardápio"}</span>
                        </div>
                        {diaAtivo === getDiaHojeKey() && (
                          <Badge color="green">Hoje</Badge>
                        )}
                      </div>

                      {TIPOS_REFEICAO.map(refeicao => {
                        const valor = cardapio.diasSemana?.[diaAtivo]?.[refeicao.key];
                        return (
                          <div key={refeicao.key} className={styles.mealItemCard}>
                            <div className={styles.mealItemHeader}>
                              <span className={styles.mealTypeBadge} style={{ color: refeicao.cor }}>
                                <i className={`ti ${refeicao.icon}`} /> {refeicao.label}
                              </span>
                            </div>
                            {valor ? (
                              <div className={styles.mealContentText}>
                                {refeicao.key === "sobremesa" && !valor.startsWith("🍌") ? `🍌 ${valor}` : valor}
                              </div>
                            ) : (
                              <div className={styles.mealContentEmpty}>
                                Não informado para este dia.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Visão Semana Toda Empilhada */
                    <div className={styles.allDaysStack}>
                      {DIAS_SEMANA_INFO.map(d => (
                        <div key={d.key} className={styles.allDayBlock}>
                          <div className={styles.allDayHeader}>
                            <i className="ti ti-calendar" />
                            <span>{d.label}</span>
                            {d.key === getDiaHojeKey() && <Badge color="green" style={{ marginLeft: 6 }}>Hoje</Badge>}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {TIPOS_REFEICAO.map(refeicao => {
                              const valor = cardapio.diasSemana?.[d.key]?.[refeicao.key];
                              return (
                                <div key={refeicao.key} style={{ display: "flex", flexDirection: "column", gap: 3, background: "var(--bg-card)", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border-color)" }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: refeicao.cor, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
                                    <i className={`ti ${refeicao.icon}`} /> {refeicao.label}
                                  </span>
                                  <span style={{ fontSize: 13, color: valor ? "var(--text-primary)" : "var(--text-muted)", lineHeight: 1.4 }}>
                                    {valor || "—"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. VISUALIZAÇÃO DESKTOP: TABELA SEMANAL COMPLETA */}
                <div className={styles.desktopTableView}>
                  <table className={styles.desktopTable}>
                    <thead>
                      <tr>
                        <th className={styles.tableHeaderCell} style={{ width: "16%" }}>Refeição</th>
                        {DIAS_SEMANA_INFO.map(d => (
                          <th key={d.key} className={styles.tableHeaderCell} style={{ width: "16.8%" }}>
                            {d.label} {d.key === getDiaHojeKey() && <span style={{ color: "#34d399", fontSize: 11 }}>(Hoje)</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={styles.tableRow} style={{ background: "#243144" }}>
                        <td className={styles.mealLabelCell} style={{ color: "#fbbf24" }}>
                          <i className="ti ti-sun" style={{ marginRight: 6 }} /> Lanche da Manhã
                        </td>
                        {DIAS_SEMANA_INFO.map(d => (
                          <td key={d.key} className={styles.mealContentCell}>
                            {cardapio.diasSemana?.[d.key]?.lancheManha || "—"}
                          </td>
                        ))}
                      </tr>
                      <tr className={styles.tableRow} style={{ background: "#1e293b" }}>
                        <td className={styles.mealLabelCell} style={{ color: "#34d399" }}>
                          <i className="ti ti-soup" style={{ marginRight: 6 }} /> Almoço Completo
                        </td>
                        {DIAS_SEMANA_INFO.map(d => (
                          <td key={d.key} className={styles.mealContentCell} style={{ color: "#ffffff", fontWeight: 500 }}>
                            {cardapio.diasSemana?.[d.key]?.almoco || "—"}
                          </td>
                        ))}
                      </tr>
                      <tr className={styles.tableRow} style={{ background: "#243144" }}>
                        <td className={styles.mealLabelCell} style={{ color: "#facc15" }}>
                          <i className="ti ti-apple" style={{ marginRight: 6 }} /> Sobremesa / Fruta
                        </td>
                        {DIAS_SEMANA_INFO.map(d => (
                          <td key={d.key} className={styles.mealContentCell} style={{ color: "#facc15" }}>
                            {cardapio.diasSemana?.[d.key]?.sobremesa ? `🍌 ${cardapio.diasSemana[d.key].sobremesa}` : "—"}
                          </td>
                        ))}
                      </tr>
                      <tr className={styles.tableRow} style={{ background: "#1e293b" }}>
                        <td className={styles.mealLabelCell} style={{ color: "#818cf8" }}>
                          <i className="ti ti-coffee" style={{ marginRight: 6 }} /> Lanche da Tarde
                        </td>
                        {DIAS_SEMANA_INFO.map(d => (
                          <td key={d.key} className={styles.mealContentCell}>
                            {cardapio.diasSemana?.[d.key]?.lancheTarde || "—"}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {cardapio.restricoesAlimentares && (
                  <div className={styles.restricoesBox}>
                    <i className="ti ti-heart-handshake" style={{ fontSize: 18, color: "#fde047", flexShrink: 0 }} />
                    <span><strong>Adaptações para Restrições Alimentares:</strong> {cardapio.restricoesAlimentares}</span>
                  </div>
                )}
              </div>
            );
          })}
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

            <div className={styles.modalMetaGrid}>
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
              <label style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", marginBottom: 8, display: "block" }}>
                Composição Nutricional Semanal (Segunda a Sexta):
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {diasNomes.map(d => (
                  <div key={d.key} style={{ background: "#243144", padding: 14, borderRadius: 10, border: "1px solid #33435c" }}>
                    <div style={{ fontWeight: 700, color: "#34d399", fontSize: 13.5, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <i className="ti ti-calendar" /> {d.label}
                    </div>
                    <div className={styles.modalDiasSemanaGrid}>
                      <Input
                        label="Lanche da manhã"
                        placeholder="Ex: Frutas e pão"
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
                        label="Almoço completo"
                        placeholder="Ex: Arroz, feijão e carne"
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
                        label="Sobremesa / Fruta"
                        placeholder="Ex: Banana ou maçã"
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
                        label="Lanche da tarde"
                        placeholder="Ex: Suco e biscoito"
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
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: "560px", borderCollapse: "collapse", fontSize: 12, textAlign: "left", border: "1px solid #cbd5e1" }}>
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
                      <td key={d.key} style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>{cardapioSelecionado.diasSemana?.[d.key]?.almoco || "-"}</td>
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
            </div>

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

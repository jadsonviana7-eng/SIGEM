import { useState, useMemo } from "react";
import {
  addAviso,
  updateAviso,
  deleteAviso
} from "../../../services/comunicacaoService";
import { Card, Btn, Badge, Modal, Input, Select, Alert, EmptyState } from "../../../components/ui";

const CATEGORIAS_AVISO = [
  "Pedagógico",
  "Saúde & Prevenção",
  "Projetos Escolares",
  "Calendário & Feriados",
  "Transporte / Merenda",
  "Administrativo",
  "Urgente"
];

export default function AvisosComunicados({
  avisos = [],
  turmas = [],
  escolaId,
  usuario,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [filtroPublico, setFiltroPublico] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [avisoEditando, setAvisoEditando] = useState(null);
  const [modalConfirmacoes, setModalConfirmacoes] = useState(null);
  const [modalExclusao, setModalExclusao] = useState(null);

  const [form, setForm] = useState({
    titulo: "",
    categoria: "Pedagógico",
    prioridade: "Normal", // Normal, Importante, Urgente
    publicoAlvo: "Toda a Escola", // Toda a Escola, Turma Específica
    turmaAlvo: "",
    conteudo: "",
    dataPublicacao: new Date().toISOString().split("T")[0],
    autor: usuario?.nome || "Direção Escolar",
    exigeConfirmacaoLeitura: false,
    anexoNome: ""
  });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [copiadoId, setCopiadoId] = useState(null);

  const avisosFiltrados = useMemo(() => {
    return avisos.filter(a => {
      const matchBusca =
        (a.titulo || "").toLowerCase().includes(busca.toLowerCase()) ||
        (a.conteudo || "").toLowerCase().includes(busca.toLowerCase()) ||
        (a.autor || "").toLowerCase().includes(busca.toLowerCase());
      const matchCat = !filtroCategoria || a.categoria === filtroCategoria;
      const matchPrio = !filtroPrioridade || a.prioridade === filtroPrioridade;
      const matchPub = !filtroPublico || a.publicoAlvo === filtroPublico;
      return matchBusca && matchCat && matchPrio && matchPub;
    });
  }, [avisos, busca, filtroCategoria, filtroPrioridade, filtroPublico]);

  const handleAbrirNovo = () => {
    setAvisoEditando(null);
    setForm({
      titulo: "",
      categoria: "Pedagógico",
      prioridade: "Normal",
      publicoAlvo: "Toda a Escola",
      turmaAlvo: turmas[0]?.nome || "",
      conteudo: "",
      dataPublicacao: new Date().toISOString().split("T")[0],
      autor: usuario?.nome || "Coordenação Pedagógica",
      exigeConfirmacaoLeitura: false,
      anexoNome: ""
    });
    setErro("");
    setModalAberto(true);
  };

  const handleAbrirEdicao = (item) => {
    setAvisoEditando(item);
    setForm({
      titulo: item.titulo || "",
      categoria: item.categoria || "Pedagógico",
      prioridade: item.prioridade || "Normal",
      publicoAlvo: item.publicoAlvo || "Toda a Escola",
      turmaAlvo: item.turmaAlvo || "",
      conteudo: item.conteudo || "",
      dataPublicacao: item.dataPublicacao || new Date().toISOString().split("T")[0],
      autor: item.autor || usuario?.nome || "Direção",
      exigeConfirmacaoLeitura: item.exigeConfirmacaoLeitura || false,
      anexoNome: item.anexoNome || ""
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.conteudo.trim()) {
      setErro("Preencha o título e o conteúdo do comunicado.");
      return;
    }

    setSalvando(true);
    setErro("");
    try {
      if (avisoEditando) {
        await updateAviso(avisoEditando.id, form);
      } else {
        await addAviso(form, escolaId);
      }
      setModalAberto(false);
      onReload();
    } catch (err) {
      setErro("Erro ao salvar comunicado: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!modalExclusao) return;
    try {
      await deleteAviso(modalExclusao.id);
      setModalExclusao(null);
      onReload();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const handleCopiarWhatsApp = (aviso) => {
    const texto = `*📢 COMUNICADO ESCOLAR*\n*${aviso.titulo}*\n\n${aviso.conteudo}\n\n📅 Data: ${new Date(aviso.dataPublicacao).toLocaleDateString("pt-BR")}\n🏫 Emitido por: ${aviso.autor}\n_Secretaria Municipal de Educação_`;
    navigator.clipboard.writeText(texto);
    setCopiadoId(aviso.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* BARRA SUPERIOR: BUSCA E NOVO AVISO */}
      <div style={{
        background: "white",
        borderRadius: 14,
        padding: "16px 20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12
      }}>
        <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 280, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              placeholder="Buscar comunicados por título, autor ou conteúdo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              icon="ti ti-search"
            />
          </div>

          <Select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            style={{ width: 170 }}
          >
            <option value="">Todas as Categorias</option>
            {CATEGORIAS_AVISO.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>

          <Select
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
            style={{ width: 150 }}
          >
            <option value="">Todas as Prioridades</option>
            <option value="Normal">Normal</option>
            <option value="Importante">Importante</option>
            <option value="Urgente">Urgente</option>
          </Select>
        </div>

        <Btn variant="primary" onClick={handleAbrirNovo} style={{ padding: "8px 16px" }}>
          <i className="ti ti-plus" /> Novo Comunicado
        </Btn>
      </div>

      {/* GRID DE CARDS DE COMUNICADOS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        gap: 16
      }}>
        {avisosFiltrados.length === 0 ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <EmptyState icon="news" texto="Nenhum comunicado encontrado com os filtros aplicados." />
          </div>
        ) : (
          avisosFiltrados.map((aviso) => (
            <div
              key={aviso.id}
              style={{
                background: "white",
                borderRadius: 14,
                padding: 18,
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderTop: aviso.prioridade === "Urgente" ? "4px solid #ef4444" : aviso.prioridade === "Importante" ? "4px solid #f59e0b" : "4px solid #3b82f6"
              }}
            >
              <div>
                {/* Header do Card */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>
                      {aviso.categoria}
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "2px 0 0" }}>
                      {aviso.titulo}
                    </h3>
                  </div>

                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: aviso.prioridade === "Urgente" ? "#fee2e2" : aviso.prioridade === "Importante" ? "#fef3c7" : "#eff6ff",
                    color: aviso.prioridade === "Urgente" ? "#991b1b" : aviso.prioridade === "Importante" ? "#92400e" : "#1e40af"
                  }}>
                    {aviso.prioridade}
                  </span>
                </div>

                {/* Conteúdo */}
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, margin: "8px 0 14px", whiteSpace: "pre-line" }}>
                  {aviso.conteudo}
                </p>

                {/* Anexo se houver */}
                {aviso.anexoNome && (
                  <div style={{
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#3b82f6",
                    border: "1px solid #e2e8f0",
                    marginBottom: 10
                  }}>
                    <i className="ti ti-paperclip" /> Anexo: {aviso.anexoNome}
                  </div>
                )}
              </div>

              {/* Rodapé e Ações */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#64748b" }}>
                <div>
                  <div><strong>Destino:</strong> {aviso.publicoAlvo} {aviso.turmaAlvo ? `(${aviso.turmaAlvo})` : ""}</div>
                  <div>📅 {aviso.dataPublicacao ? new Date(aviso.dataPublicacao).toLocaleDateString("pt-BR") : ""} · {aviso.autor}</div>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  {aviso.exigeConfirmacaoLeitura && (
                    <button
                      type="button"
                      onClick={() => setModalConfirmacoes(aviso)}
                      title="Ver Confirmações de Leitura"
                      style={{
                        padding: "5px 8px",
                        borderRadius: 6,
                        background: "#ecfdf5",
                        color: "#059669",
                        border: "1px solid #a7f3d0",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <i className="ti ti-check-double" /> {(aviso.confirmacoesLeitura || []).length} cientes
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopiarWhatsApp(aviso)}
                    title="Copiar para WhatsApp"
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      background: copiadoId === aviso.id ? "#dcfce7" : "#f8fafc",
                      color: copiadoId === aviso.id ? "#166534" : "#475569",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    <i className={copiadoId === aviso.id ? "ti ti-check" : "ti ti-brand-whatsapp"} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAbrirEdicao(aviso)}
                    title="Editar"
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      background: "#f8fafc",
                      color: "#475569",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    <i className="ti ti-edit" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalExclusao(aviso)}
                    title="Excluir"
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      background: "#fee2e2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {modalAberto && (
        <Modal
          isOpen={modalAberto}
          titulo={avisoEditando ? "Editar Comunicado Oficial" : "Publicar Novo Comunicado"}
          onClose={() => setModalAberto(false)}
          width={640}
          esconderRodape
        >
          <form onSubmit={handleSalvar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {erro && <Alert tipo="error">{erro}</Alert>}

            <Input
              label="Título do Comunicado *"
              placeholder="Ex: Reunião de Pais, Vacinação, Início do Bimestre..."
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Categoria *"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              >
                {CATEGORIAS_AVISO.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>

              <Select
                label="Nível de Prioridade *"
                value={form.prioridade}
                onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
              >
                <option value="Normal">Normal (Informativo)</option>
                <option value="Importante">Importante</option>
                <option value="Urgente">Urgente (Destaque Vermelho)</option>
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Público-Alvo *"
                value={form.publicoAlvo}
                onChange={(e) => setForm({ ...form, publicoAlvo: e.target.value })}
              >
                <option value="Toda a Escola">Toda a Escola (Todos os Pais)</option>
                <option value="Turma Específica">Turma Específica</option>
              </Select>

              {form.publicoAlvo === "Turma Específica" ? (
                <Select
                  label="Selecione a Turma *"
                  value={form.turmaAlvo}
                  onChange={(e) => setForm({ ...form, turmaAlvo: e.target.value })}
                >
                  {turmas.map(t => (
                    <option key={t.id || t.nome} value={t.nome}>{t.nome} ({t.turno})</option>
                  ))}
                </Select>
              ) : (
                <Input
                  label="Emissor / Autor *"
                  value={form.autor}
                  onChange={(e) => setForm({ ...form, autor: e.target.value })}
                />
              )}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                Conteúdo do Comunicado *
              </label>
              <textarea
                rows={5}
                value={form.conteudo}
                onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                placeholder="Escreva a mensagem clara e objetiva para os responsáveis..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                  boxSizing: "border-box"
                }}
              />
            </div>

            <Input
              label="Nome do Documento Anexo (opcional)"
              placeholder="Ex: circular_março_2026.pdf"
              value={form.anexoNome}
              onChange={(e) => setForm({ ...form, anexoNome: e.target.value })}
            />

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", background: "#f8fafc", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <input
                type="checkbox"
                checked={form.exigeConfirmacaoLeitura}
                onChange={(e) => setForm({ ...form, exigeConfirmacaoLeitura: e.target.checked })}
              />
              <span>Exigir confirmação de leitura ("Ciente") do responsável no portal da família</span>
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Btn onClick={() => setModalAberto(false)}>
                Cancelar
              </Btn>
              <Btn variant="primary" type="submit" disabled={salvando}>
                {salvando ? "Publicando..." : avisoEditando ? "Salvar Alterações" : "Publicar Comunicado"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL DE CONFIRMAÇÕES DE LEITURA */}
      {modalConfirmacoes && (
        <Modal
          isOpen={!!modalConfirmacoes}
          titulo={`Confirmações de Leitura: ${modalConfirmacoes.titulo}`}
          onClose={() => setModalConfirmacoes(null)}
          width={500}
          esconderRodape
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              Lista de pais e responsáveis que confirmaram ciência deste comunicado:
            </p>

            <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {(modalConfirmacoes.confirmacoesLeitura || []).length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
                  Nenhum responsável confirmou leitura até o momento.
                </div>
              ) : (
                modalConfirmacoes.confirmacoesLeitura.map((c, i) => (
                  <div key={i} style={{ background: "#f8fafc", padding: 10, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>👤 {c.responsavelNome}</span>
                    <span style={{ color: "#64748b", fontSize: 11 }}>{c.data ? new Date(c.data).toLocaleString("pt-BR") : "Confirmado"}</span>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <Btn onClick={() => setModalConfirmacoes(null)}>
                Fechar
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {modalExclusao && (
        <Modal
          isOpen={!!modalExclusao}
          titulo="Confirmar Exclusão de Comunicado"
          onClose={() => setModalExclusao(null)}
          width={450}
          esconderRodape
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
              Tem certeza de que deseja excluir o comunicado <strong>"{modalExclusao.titulo}"</strong>? Os responsáveis não terão mais acesso a esta publicação.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Btn onClick={() => setModalExclusao(null)}>
                Cancelar
              </Btn>
              <Btn variant="danger" onClick={handleExcluir}>
                Sim, Excluir Comunicado
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

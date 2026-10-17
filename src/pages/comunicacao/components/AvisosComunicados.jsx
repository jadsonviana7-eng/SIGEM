import React, { useState, useMemo } from "react";
import {
  addAviso,
  updateAviso,
  deleteAviso
} from "../../../services/comunicacaoService";
import {
  Button,
  Input,
  Select,
  Badge,
  Modal,
  Alert,
  NotificationModal
} from "../../../components/ui";
import styles from "./AvisosComunicados.module.css";

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
  alunos = [],
  escolaId,
  selectedEscola,
  usuario,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [avisoEditando, setAvisoEditando] = useState(null);
  const [modalConfirmacoes, setModalConfirmacoes] = useState(null);
  const [modalExclusao, setModalExclusao] = useState(null);
  const [notificacao, setNotificacao] = useState(null);

  const [form, setForm] = useState({
    titulo: "",
    categoria: "Pedagógico",
    prioridade: "Normal",
    publicoAlvo: "Toda a Escola",
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

  // Filtros
  const avisosFiltrados = useMemo(() => {
    return avisos.filter((a) => {
      const matchBusca =
        (a.titulo || "").toLowerCase().includes(busca.toLowerCase()) ||
        (a.conteudo || "").toLowerCase().includes(busca.toLowerCase()) ||
        (a.autor || "").toLowerCase().includes(busca.toLowerCase());
      const matchCat = !filtroCategoria || a.categoria === filtroCategoria;
      const matchPrio = !filtroPrioridade || a.prioridade === filtroPrioridade;
      return matchBusca && matchCat && matchPrio;
    });
  }, [avisos, busca, filtroCategoria, filtroPrioridade]);

  const temFiltroAtivo = busca !== "" || filtroCategoria !== "" || filtroPrioridade !== "";

  const limparFiltros = () => {
    setBusca("");
    setFiltroCategoria("");
    setFiltroPrioridade("");
  };

  // KPIs
  const totalConfirmacoes = useMemo(() => {
    return avisos.reduce((acc, curr) => acc + (curr.confirmacoesLeitura || []).length, 0);
  }, [avisos]);

  const totalUrgentes = useMemo(() => {
    return avisos.filter((a) => a.prioridade === "Urgente" || a.prioridade === "Importante").length;
  }, [avisos]);

  const totalAnexos = useMemo(() => {
    return avisos.filter((a) => (a.anexoNome || "").trim().length > 0).length;
  }, [avisos]);

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
      exigeConfirmacaoLeitura: true,
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
      setNotificacao({
        tipo: "sucesso",
        titulo: "Sucesso",
        mensagem: avisoEditando ? "Comunicado atualizado!" : "Novo comunicado publicado com sucesso!"
      });
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
      setNotificacao({
        tipo: "sucesso",
        titulo: "Excluído",
        mensagem: "Comunicado removido com sucesso!"
      });
    } catch (err) {
      setNotificacao({
        tipo: "erro",
        titulo: "Erro",
        mensagem: "Erro ao excluir: " + err.message
      });
    }
  };

  const handleCopiarWhatsApp = (aviso) => {
    const dataFmt = aviso.dataPublicacao
      ? new Date(aviso.dataPublicacao).toLocaleDateString("pt-BR")
      : "Hoje";
    const texto = `*📢 COMUNICADO ESCOLAR*\n*${aviso.titulo}*\n\n${aviso.conteudo}\n\n📅 Data: ${dataFmt}\n🏫 Emitido por: ${aviso.autor}\n_Secretaria Municipal de Educação_`;
    navigator.clipboard.writeText(texto);
    setCopiadoId(aviso.id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const getPriorityClass = (prioridade) => {
    if (prioridade === "Urgente") return styles.borderUrgente;
    if (prioridade === "Importante") return styles.borderImportante;
    return styles.borderNormal;
  };

  const getBadgeVariant = (prioridade) => {
    if (prioridade === "Urgente") return "danger";
    if (prioridade === "Importante") return "warning";
    return "primary";
  };

  return (
    <div className={styles.container}>
      {/* 1. Indicadores Rápidos (KPIs) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8" }}>
            <i className="ti ti-speakerphone" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{avisos.length}</span>
            <span className={styles.statLabel}>Total de Comunicados</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <i className="ti ti-checks" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalConfirmacoes}</span>
            <span className={styles.statLabel}>Ciências dos Pais</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}>
            <i className="ti ti-alert-triangle" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalUrgentes}</span>
            <span className={styles.statLabel}>Alta Prioridade / Urgentes</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <i className="ti ti-paperclip" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalAnexos}</span>
            <span className={styles.statLabel}>Circulares Anexadas</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Cabeçalho */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <h2 className={styles.headerTitle}>
            <i className="ti ti-speakerphone text-sky-500" />
            <span>Mural de Avisos & Comunicados Escolares</span>
          </h2>
          <p className={styles.headerSubtitle}>
            Publicações oficiais com confirmação de leitura das famílias e disparos automáticos
          </p>
        </div>

        <button type="button" onClick={handleAbrirNovo} className={styles.btnNovo}>
          <i className="ti ti-plus" />
          <span>Novo Comunicado</span>
        </button>
      </div>

      {/* 3. Barra de Filtros */}
      <div className={styles.filtersBar}>
        <div>
          <Input
            placeholder="Buscar por título, conteúdo ou emissor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            icon="ti ti-search"
          />
        </div>

        <div>
          <Select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="">Todas as Categorias</option>
            {CATEGORIAS_AVISO.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Select value={filtroPrioridade} onChange={(e) => setFiltroPrioridade(e.target.value)}>
            <option value="">Todas as Prioridades</option>
            <option value="Normal">Normal</option>
            <option value="Importante">Importante</option>
            <option value="Urgente">Urgente</option>
          </Select>
        </div>

        {temFiltroAtivo && (
          <button type="button" onClick={limparFiltros} className={styles.btnClearFilters} title="Limpar Filtros">
            <i className="ti ti-x" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* 4. Grade de Cards de Comunicados */}
      <div className={styles.sectionHeader}>
        <div>
          <h3 className={styles.sectionTitle}>
            <i className="ti ti-news text-sky-500" />
            <span>Comunicados Publicados</span>
          </h3>
          <p className={styles.sectionSubtitle}>
            Exibindo {avisosFiltrados.length} comunicado(s) ativo(s)
          </p>
        </div>
      </div>

      <div className={styles.avisosGrid}>
        {avisosFiltrados.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="ti ti-news-off" />
            <div className={styles.emptyStateTitle}>Nenhum comunicado encontrado</div>
            <p className={styles.emptyStateSub}>
              {temFiltroAtivo
                ? "Tente ajustar os filtros de pesquisa ou categoria."
                : "Publique o primeiro comunicado oficial para notificar as famílias de forma ágil."}
            </p>
            {temFiltroAtivo ? (
              <button
                type="button"
                onClick={limparFiltros}
                className="mt-2 text-xs font-semibold text-sky-400 underline hover:text-sky-300"
              >
                Limpar filtros de pesquisa
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAbrirNovo}
                className={styles.btnNovo}
                style={{ marginTop: 8 }}
              >
                <i className="ti ti-plus" /> Novo Comunicado
              </button>
            )}
          </div>
        ) : (
          avisosFiltrados.map((aviso) => {
            const dataFmt = aviso.dataPublicacao
              ? new Date(aviso.dataPublicacao).toLocaleDateString("pt-BR")
              : "Data não definida";
            const confirmacoesCount = (aviso.confirmacoesLeitura || []).length;
            const isCopiado = copiadoId === aviso.id;

            return (
              <div key={aviso.id} className={`${styles.avisoCard} ${getPriorityClass(aviso.prioridade)}`}>
                {/* Topo do Card */}
                <div className={styles.cardTop}>
                  <div className={styles.cardTopLeft}>
                    <span className={styles.categoryTag}>{aviso.categoria || "Geral"}</span>
                    <h3 className={styles.cardTitle}>{aviso.titulo}</h3>
                  </div>

                  <div className={styles.cardActions}>
                    <Badge variant={getBadgeVariant(aviso.prioridade)}>
                      {aviso.prioridade || "Normal"}
                    </Badge>
                    <button
                      type="button"
                      className={`${styles.btnAction} ${styles.btnActionZap}`}
                      onClick={() => handleCopiarWhatsApp(aviso)}
                      title={isCopiado ? "Copiado!" : "Copiar Texto Formatado para WhatsApp"}
                    >
                      <i className={isCopiado ? "ti ti-check text-emerald-400" : "ti ti-brand-whatsapp"} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnAction} ${styles.btnActionEdit}`}
                      onClick={() => handleAbrirEdicao(aviso)}
                      title="Editar Comunicado"
                    >
                      <i className="ti ti-edit" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnAction} ${styles.btnActionDelete}`}
                      onClick={() => setModalExclusao(aviso)}
                      title="Excluir Comunicado"
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>

                {/* Corpo do Card */}
                <div className={styles.cardBody}>
                  <p className={styles.cardContentText}>{aviso.conteudo}</p>

                  {aviso.anexoNome && (
                    <div className={styles.attachmentBadge}>
                      <i className="ti ti-paperclip" />
                      <span>{aviso.anexoNome}</span>
                    </div>
                  )}
                </div>

                {/* Rodapé do Card */}
                <div className={styles.cardFooter}>
                  <div className={styles.metaInfo}>
                    <span className={styles.metaTarget}>
                      Destino: {aviso.publicoAlvo === "Turma Específica" && aviso.turmaAlvo ? aviso.turmaAlvo : "Toda a Escola"}
                    </span>
                    <span>
                      📅 {dataFmt} • {aviso.autor || "Coordenação"}
                    </span>
                  </div>

                  {aviso.exigeConfirmacaoLeitura ? (
                    <button
                      type="button"
                      className={styles.readBadge}
                      onClick={() => setModalConfirmacoes(aviso)}
                      title="Clique para ver quem confirmou ciência"
                    >
                      <i className="ti ti-eye-check" />
                      <span>{confirmacoesCount} {confirmacoesCount === 1 ? "ciente" : "cientes"}</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                      Apenas informativo
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL DE CRIAÇÃO / EDIÇÃO (CAMPOS EM COLUNA ÚNICA) */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={avisoEditando ? "Editar Comunicado Oficial" : "Publicar Novo Comunicado"}
        size="lg"
        semRodape
      >
        <form onSubmit={handleSalvar} className={styles.modalForm}>
          {erro && <Alert tipo="error">{erro}</Alert>}

          {/* 1. Título do Comunicado */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Título do Comunicado <span className={styles.fieldRequired}>*</span>
            </label>
            <Input
              placeholder="Ex: Calendário do 2º Bimestre, Campanha de Vacinação Infantil..."
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
          </div>

          {/* 2. Categoria */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Categoria do Comunicado <span className={styles.fieldRequired}>*</span>
            </label>
            <Select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              required
            >
              {CATEGORIAS_AVISO.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          {/* 3. Nível de Prioridade */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Nível de Prioridade <span className={styles.fieldRequired}>*</span>
            </label>
            <Select
              value={form.prioridade}
              onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
              required
            >
              <option value="Normal">Normal (Informativo Geral)</option>
              <option value="Importante">Importante (Destaque Amarelo)</option>
              <option value="Urgente">Urgente (Destaque Vermelho com Alerta)</option>
            </Select>
          </div>

          {/* 4. Público-Alvo */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Público-Alvo Destinatário <span className={styles.fieldRequired}>*</span>
            </label>
            <Select
              value={form.publicoAlvo}
              onChange={(e) => setForm({ ...form, publicoAlvo: e.target.value })}
              required
            >
              <option value="Toda a Escola">Toda a Escola (Todos os Responsáveis)</option>
              <option value="Turma Específica">Turma Específica</option>
            </Select>
          </div>

          {/* 5. Turma Específica (se selecionada) */}
          {form.publicoAlvo === "Turma Específica" && (
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Selecione a Turma Destinatária <span className={styles.fieldRequired}>*</span>
              </label>
              <Select
                value={form.turmaAlvo}
                onChange={(e) => setForm({ ...form, turmaAlvo: e.target.value })}
                required
              >
                <option value="">Selecione a turma...</option>
                {turmas.map((t) => (
                  <option key={t.id || t.nome} value={t.nome}>
                    {t.nome} ({t.turno || "Turno Regular"})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* 6. Emissor / Autor */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Emissor / Responsável pelo Comunicado <span className={styles.fieldRequired}>*</span>
            </label>
            <Input
              placeholder="Ex: Direção Escolar, Coordenação Pedagógica..."
              value={form.autor}
              onChange={(e) => setForm({ ...form, autor: e.target.value })}
              required
            />
          </div>

          {/* 7. Data de Publicação */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Data de Publicação <span className={styles.fieldRequired}>*</span>
            </label>
            <Input
              type="date"
              value={form.dataPublicacao}
              onChange={(e) => setForm({ ...form, dataPublicacao: e.target.value })}
              required
            />
          </div>

          {/* 8. Conteúdo do Comunicado */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Conteúdo do Comunicado <span className={styles.fieldRequired}>*</span>
            </label>
            <textarea
              className={styles.formTextarea}
              rows={5}
              value={form.conteudo}
              onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
              placeholder="Escreva a mensagem clara, objetiva e formatada para os pais e responsáveis..."
              required
            />
          </div>

          {/* 9. Nome do Documento Anexo */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Nome do Documento Anexo / Circular (Opcional)
            </label>
            <Input
              placeholder="Ex: circular_março_2026.pdf ou guia_vacinacao.pdf"
              value={form.anexoNome}
              onChange={(e) => setForm({ ...form, anexoNome: e.target.value })}
            />
            <span className={styles.fieldHint}>
              Informe o nome do documento ou link de download da circular informativa.
            </span>
          </div>

          {/* 10. Checkbox de Confirmação de Leitura */}
          <div className={styles.formField}>
            <label className={styles.checkboxCard}>
              <input
                type="checkbox"
                checked={form.exigeConfirmacaoLeitura}
                onChange={(e) => setForm({ ...form, exigeConfirmacaoLeitura: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: "#0284c7" }}
              />
              <span>Exigir confirmação de leitura ("Ciente") do responsável no portal da família</span>
            </label>
          </div>

          {/* Rodapé do Modal */}
          <div className={styles.modalFooter}>
            <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={salvando}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold"
            >
              {salvando ? "Publicando..." : avisoEditando ? "Salvar Alterações" : "Publicar Comunicado"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. MODAL DE CONFIRMAÇÕES DE LEITURA */}
      <Modal
        isOpen={!!modalConfirmacoes}
        onClose={() => setModalConfirmacoes(null)}
        title={modalConfirmacoes ? `Ciência: ${modalConfirmacoes.titulo}` : "Confirmações de Leitura"}
        size="md"
      >
        {modalConfirmacoes && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Relação de responsáveis que confirmaram ciência deste comunicado oficial:
            </p>

            <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {(modalConfirmacoes.confirmacoesLeitura || []).length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 13, background: "var(--bg-surface, #243144)", borderRadius: 8 }}>
                  Nenhum responsável confirmou leitura até o momento.
                </div>
              ) : (
                modalConfirmacoes.confirmacoesLeitura.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--bg-surface, #243144)",
                      border: "1px solid var(--border-subtle, #33435c)",
                      padding: "10px 14px",
                      borderRadius: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 12.5
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: "#f8fafc", display: "block" }}>
                        {c.responsavelNome || "Responsável Legal"}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        Aluno(a): {c.alunoNome || "Aluno"} • Turma: {c.turma || "Regular"}
                      </span>
                    </div>

                    <span style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>
                      ✔ Ciente em {c.dataHora ? new Date(c.dataHora).toLocaleString("pt-BR") : "Recentemente"}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-700">
              <Button onClick={() => setModalConfirmacoes(null)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 7. MODAL DE EXCLUSÃO */}
      <Modal
        isOpen={!!modalExclusao}
        onClose={() => setModalExclusao(null)}
        title="Confirmar Exclusão de Comunicado"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Tem certeza de que deseja excluir permanentemente o comunicado{" "}
            <strong>"{modalExclusao?.titulo}"</strong>? Esta ação não poderá ser desfeita.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalExclusao(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleExcluir}>
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* 8. NOTIFICAÇÃO MODAL */}
      {notificacao && (
        <NotificationModal
          isOpen={!!notificacao}
          onClose={() => setNotificacao(null)}
          tipo={notificacao.tipo}
          titulo={notificacao.titulo}
          mensagem={notificacao.mensagem}
        />
      )}
    </div>
  );
}

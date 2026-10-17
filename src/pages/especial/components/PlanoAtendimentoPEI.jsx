import React, { useState, useMemo } from "react";
import {
  Button,
  Input,
  Select,
  Badge,
  Modal,
  Pagination,
  NotificationModal
} from "../../../components/ui";
import styles from "./PlanoAtendimentoPEI.module.css";

export default function PlanoAtendimentoPEI({
  planos = [],
  alunos = [],
  profissionais = [],
  onSalvar,
  onExcluir,
  escolaId,
  usuario
}) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [modalAberto, setModalAberto] = useState(false);
  const [modalImpressao, setModalImpressao] = useState({ aberto: false, plano: null });
  const [itemEdicao, setItemEdicao] = useState(null);
  const [formData, setFormData] = useState({
    alunoId: "",
    alunoNome: "",
    anoLetivo: new Date().getFullYear().toString(),
    turma: "",
    professorResponsavel: "",
    status: "Vigente",
    dataElaboracao: new Date().toISOString().split("T")[0],
    dataRevisao: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    habilidadesAtuais: "",
    metasCurtoPrazo: "",
    metasMedioPrazo: "",
    estrategiasPedagogicas: "",
    recursosAcessibilidade: "",
    avaliacoesAdaptadas: "",
    participantesElaboracao: "",
    observacoesGerais: ""
  });

  const [notificacao, setNotificacao] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, id: null });

  // Funções auxiliares para dados dinâmicos e mock
  const getProfessor = (p) =>
    p.professorResponsavel || p.professorAEEResponsavel || "Professora Especialista AEE";
  const getMetasCurto = (p) =>
    p.metasCurtoPrazo || p.metasPedagogicasCurtoPrazo || "";
  const getMetasMedio = (p) =>
    p.metasMedioPrazo || p.metasPedagogicasMedioPrazo || "";
  const getEstrategias = (p) =>
    p.estrategiasPedagogicas || p.adaptacoesCurriculares || "";
  const getRecursos = (p) =>
    p.recursosAcessibilidade || p.recursosNecessarios || "";
  const getDataRevisao = (p) =>
    p.dataRevisao || p.dataProximaRevisao || "";
  const getStatus = (p) => {
    const s = p.status || p.statusPlano || "Vigente";
    const sLower = s.toLowerCase();
    if (sLower.includes("andamento") || sLower.includes("vigente") || sLower.includes("positivo"))
      return "Vigente";
    if (sLower.includes("revis")) return "Em Revisão";
    if (sLower.includes("elabora")) return "Em Elaboração";
    if (sLower.includes("conclu")) return "Concluído";
    return s;
  };
  const getTurma = (p) => {
    if (p.turma) return p.turma;
    const a = (alunos || []).find((al) => al.id === p.alunoId || al.nomeAluno === p.alunoNome);
    return a?.turma || a?.turmaRegular || "Ensino Fundamental";
  };

  // Filtragem
  const planosFiltrados = useMemo(() => {
    return planos.filter((p) => {
      const aluno = (p.alunoNome || "").toLowerCase();
      const turma = getTurma(p).toLowerCase();
      const prof = getProfessor(p).toLowerCase();
      const termo = busca.toLowerCase().trim();

      const matchBusca =
        !termo ||
        aluno.includes(termo) ||
        turma.includes(termo) ||
        prof.includes(termo);

      const statusCalculado = getStatus(p);
      const matchStatus = !filtroStatus || statusCalculado === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [planos, busca, filtroStatus, alunos]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(planosFiltrados.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const planosPaginados = useMemo(() => {
    return planosFiltrados.slice(startIndex, startIndex + itemsPerPage);
  }, [planosFiltrados, startIndex, itemsPerPage]);

  // Estatísticas Rápidas
  const estatisticas = useMemo(() => {
    const total = planos.length;
    const vigentes = planos.filter((p) => getStatus(p) === "Vigente").length;
    const emRevisao = planos.filter((p) => getStatus(p) === "Em Revisão").length;
    const alunosComPEI = new Set(planos.map((p) => p.alunoId || p.alunoNome).filter(Boolean)).size;

    return { total, vigentes, emRevisao, alunosComPEI };
  }, [planos]);

  const temFiltroAtivo = busca || filtroStatus;

  const limparFiltros = () => {
    setBusca("");
    setFiltroStatus("");
    setCurrentPage(1);
  };

  const abrirModalNovo = () => {
    setItemEdicao(null);
    const alunoPadrao = alunos[0];
    setFormData({
      alunoId: alunoPadrao?.id || "",
      alunoNome: alunoPadrao?.nomeAluno || (alunoPadrao?.nome || ""),
      anoLetivo: new Date().getFullYear().toString(),
      turma: alunoPadrao?.turma || alunoPadrao?.turmaRegular || "4º Ano A - Ensino Fundamental",
      professorResponsavel: profissionais[0]?.nome || "Profª Helena Ramos da Silva",
      status: "Vigente",
      dataElaboracao: new Date().toISOString().split("T")[0],
      dataRevisao: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      habilidadesAtuais: "Compreende comandos verbais diretos, boa sociabilidade com apoio, letramento inicial.",
      metasCurtoPrazo: "Aumentar tempo de foco para 20 minutos; utilizar prancha de rotina visual com autonomia.",
      metasMedioPrazo: "Consolidar escrita de palavras simples (sílabas canônicas) e operações básicas até 20.",
      estrategiasPedagogicas: "Uso de pistas visuais coloridas, segmentação de tarefas complexas em etapas curtas, mediação por pares.",
      recursosAcessibilidade: "Prancha de CAA, Plano inclinado para leitura, fones abafadores de ruído em momentos de pico sonoro.",
      avaliacoesAdaptadas: "Avaliações orais gravadas, tempo estendido (50% a mais) e questões com enunciados ilustrados.",
      participantesElaboracao: "Prof. Regente, Professora de AEE, Psicopedagoga e Responsável Legal",
      observacoesGerais: "Reavaliação trimestral em reunião multidisciplinar de alinhamento."
    });
    setModalAberto(true);
  };

  const abrirModalEdicao = (item) => {
    setItemEdicao(item);
    setFormData({
      alunoId: item.alunoId || "",
      alunoNome: item.alunoNome || "",
      anoLetivo: item.anoLetivo || new Date().getFullYear().toString(),
      turma: getTurma(item),
      professorResponsavel: getProfessor(item),
      status: getStatus(item),
      dataElaboracao: item.dataElaboracao || new Date().toISOString().split("T")[0],
      dataRevisao: getDataRevisao(item) || "",
      habilidadesAtuais: item.habilidadesAtuais || "",
      metasCurtoPrazo: getMetasCurto(item),
      metasMedioPrazo: getMetasMedio(item),
      estrategiasPedagogicas: getEstrategias(item),
      recursosAcessibilidade: getRecursos(item),
      avaliacoesAdaptadas: item.avaliacoesAdaptadas || item.adaptacoesCurriculares || "",
      participantesElaboracao: item.participantesElaboracao || item.equipeMultidisciplinar || "",
      observacoesGerais: item.observacoesGerais || item.reunioesFamiliaRealizadas || ""
    });
    setModalAberto(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      await onSalvar(formData, itemEdicao?.id);
      setModalAberto(false);
      setNotificacao({
        tipo: "sucesso",
        titulo: "Sucesso",
        mensagem: itemEdicao
          ? "Plano PEI atualizado com sucesso!"
          : "Novo Plano PEI registrado com sucesso!"
      });
    } catch (err) {
      setNotificacao({
        tipo: "erro",
        titulo: "Erro",
        mensagem: "Erro ao salvar PEI: " + err.message
      });
    }
  };

  const handleExcluir = async () => {
    try {
      await onExcluir(modalConfirmacao.id);
      setModalConfirmacao({ aberto: false, id: null });
      setNotificacao({
        tipo: "sucesso",
        titulo: "Excluído",
        mensagem: "Plano PEI removido com sucesso!"
      });
    } catch (err) {
      setNotificacao({
        tipo: "erro",
        titulo: "Erro",
        mensagem: "Erro ao excluir: " + err.message
      });
    }
  };

  const imprimirPEI = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      {/* 1. Indicadores Rápidos (KPIs) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
            <i className="ti ti-file-certificate" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.total}</span>
            <span className={styles.statLabel}>Total de Planos PEI</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <i className="ti ti-check" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.vigentes}</span>
            <span className={styles.statLabel}>Planos Vigentes</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <i className="ti ti-calendar-time" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.emRevisao}</span>
            <span className={styles.statLabel}>Em Revisão</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8" }}>
            <i className="ti ti-users" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.alunosComPEI}</span>
            <span className={styles.statLabel}>Alunos com PEI Ativo</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Cabeçalho & Botão de Cadastro */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-file-certificate text-indigo-400" />
            <span>Plano Educacional Individualizado (PEI / PDI)</span>
          </div>
          <p className={styles.headerSubtitle}>
            Planejamento pedagógico individualizado, metas de curto/médio prazo, adaptações curriculares e cronograma de revisão
          </p>
        </div>

        <button type="button" onClick={abrirModalNovo} className={styles.btnNovo}>
          <i className="ti ti-plus" />
          <span>Novo Plano PEI</span>
        </button>
      </div>

      {/* 3. Barra de Filtros */}
      <div className={styles.filtersBar}>
        <div>
          <Input
            placeholder="Buscar por nome do aluno, turma ou professor..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setCurrentPage(1);
            }}
            icon="ti ti-search"
          />
        </div>

        <div>
          <Select
            value={filtroStatus}
            onChange={(e) => {
              setFiltroStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Todos os status</option>
            <option value="Vigente">Vigente (Em Execução)</option>
            <option value="Em Revisão">Em Revisão</option>
            <option value="Em Elaboração">Em Elaboração</option>
            <option value="Concluído">Concluído</option>
          </Select>
        </div>

        {temFiltroAtivo && (
          <button type="button" onClick={limparFiltros} className={styles.btnClearFilters} title="Limpar Filtros">
            <i className="ti ti-x" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* 4. Grade de Cards dos Planos PEI */}
      <div className={styles.sectionHeader}>
        <div>
          <h3 className={styles.sectionTitle}>
            <i className="ti ti-files text-indigo-500" />
            <span>Quadro de Planos PEI Cadastrados</span>
          </h3>
          <p className={styles.sectionSubtitle}>
            Listando {planosFiltrados.length} plano(s) em vigência / acompanhamento
          </p>
        </div>
      </div>

      <div className={styles.planosGrid}>
        {planosFiltrados.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="ti ti-file-off" />
            <div className={styles.emptyStateTitle}>Nenhum Plano PEI encontrado</div>
            <p className={styles.emptyStateSub}>
              {temFiltroAtivo
                ? "Tente ajustar os filtros de pesquisa para localizar os planos desejados."
                : "Cadastre o primeiro Plano Educacional Individualizado para acompanhar os educandos da Educação Especial."}
            </p>
            {temFiltroAtivo ? (
              <button
                type="button"
                onClick={limparFiltros}
                className="mt-2 text-xs font-semibold text-indigo-400 underline hover:text-indigo-300"
              >
                Limpar filtros de pesquisa
              </button>
            ) : (
              <button
                type="button"
                onClick={abrirModalNovo}
                className={styles.btnNovo}
                style={{ marginTop: 8 }}
              >
                <i className="ti ti-plus" /> Cadastrar Primeiro PEI
              </button>
            )}
          </div>
        ) : (
          planosPaginados.map((plano) => {
            const statusCalculado = getStatus(plano);
            const statusVariant =
              statusCalculado === "Vigente"
                ? "success"
                : statusCalculado === "Em Revisão"
                ? "warning"
                : statusCalculado === "Concluído"
                ? "secondary"
                : "primary";

            const turmaDesc = getTurma(plano);
            const profDesc = getProfessor(plano);
            const metasCurtoDesc = getMetasCurto(plano);
            const estrategiasDesc = getEstrategias(plano);
            const dataRevDesc = getDataRevisao(plano);

            return (
              <div key={plano.id} className={styles.planoCard}>
                {/* Topo do Card */}
                <div className={styles.cardTop}>
                  <div className={styles.cardTopLeft}>
                    <div className={styles.studentAvatar}>
                      {plano.alunoNome ? plano.alunoNome.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div className={styles.studentIdentity}>
                      <div className={styles.studentName}>{plano.alunoNome}</div>
                      <div className={styles.turmaTag}>
                        <i className="ti ti-school text-indigo-400" />
                        <span>{turmaDesc} · Ano {plano.anoLetivo || "2026"}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardTopActions}>
                    <Badge variant={statusVariant}>{statusCalculado}</Badge>
                    <button
                      type="button"
                      className={`${styles.btnActionIcon} ${styles.btnActionPrint}`}
                      onClick={() => setModalImpressao({ aberto: true, plano })}
                      title="Visualizar / Imprimir PEI Oficial"
                    >
                      <i className="ti ti-printer" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnActionIcon} ${styles.btnActionEdit}`}
                      onClick={() => abrirModalEdicao(plano)}
                      title="Editar Plano PEI"
                    >
                      <i className="ti ti-edit" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnActionIcon} ${styles.btnActionDelete}`}
                      onClick={() => setModalConfirmacao({ aberto: true, id: plano.id })}
                      title="Excluir Plano PEI"
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>

                {/* Grid de Datas de Vigência & Revisão */}
                <div className={styles.datesGrid}>
                  <div className={styles.dateTile}>
                    <span className={styles.dateTileLabel}>📅 Elaborado em:</span>
                    <span className={styles.dateTileValue}>
                      {plano.dataElaboracao
                        ? new Date(plano.dataElaboracao).toLocaleDateString("pt-BR")
                        : "Não informada"}
                    </span>
                  </div>
                  <div className={styles.dateTile}>
                    <span className={styles.dateTileLabel}>⏳ Próxima Revisão:</span>
                    <span className={styles.dateTileValue} style={{ color: "#fbbf24" }}>
                      {dataRevDesc
                        ? new Date(dataRevDesc).toLocaleDateString("pt-BR")
                        : "Não agendada"}
                    </span>
                  </div>
                </div>

                {/* Conteúdo Pedagógico */}
                <div className={styles.contentSection}>
                  {metasCurtoDesc && (
                    <div className={styles.pedagogyBox}>
                      <div className={styles.pedagogyHeader}>
                        <i className="ti ti-target" />
                        <span>Metas de Curto Prazo (Trimestre)</span>
                      </div>
                      <p className={styles.pedagogyText} title={metasCurtoDesc}>
                        {metasCurtoDesc}
                      </p>
                    </div>
                  )}

                  {estrategiasDesc && (
                    <div className={styles.pedagogyBox}>
                      <div className={styles.pedagogyHeader} style={{ color: "#38bdf8" }}>
                        <i className="ti ti-bulb" />
                        <span>Estratégias Pedagógicas</span>
                      </div>
                      <p className={styles.pedagogyText} title={estrategiasDesc}>
                        {estrategiasDesc}
                      </p>
                    </div>
                  )}
                </div>

                {/* Rodapé do Card */}
                <div className={styles.cardFooter}>
                  <div className={styles.profBadge} title={`Responsável: ${profDesc}`}>
                    <i className="ti ti-user-check text-indigo-400" />
                    <span>{profDesc}</span>
                  </div>

                  <button
                    type="button"
                    className={styles.btnViewDoc}
                    onClick={() => setModalImpressao({ aberto: true, plano })}
                  >
                    <i className="ti ti-file-text" />
                    <span>Ver Documento</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* 5. MODAL DE CADASTRO / EDIÇÃO DO PEI (CAMPOS EM COLUNA ÚNICA) */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={itemEdicao ? "Editar Plano PEI / PDI" : "Novo Plano de Atendimento Individualizado (PEI)"}
        size="lg"
        semRodape
      >
        <form onSubmit={handleSalvar} className={styles.modalForm}>
          {/* 1. Aluno Atendido */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Aluno Atendido na Educação Especial <span className={styles.fieldRequired}>*</span>
            </label>
            <Select
              value={formData.alunoId}
              onChange={(e) => {
                const sel = alunos.find((a) => a.id === e.target.value);
                setFormData({
                  ...formData,
                  alunoId: e.target.value,
                  alunoNome: sel ? (sel.nomeAluno || sel.nome || "") : "",
                  turma: sel ? (sel.turma || sel.turmaRegular || formData.turma) : formData.turma
                });
              }}
              required
            >
              <option value="">Selecione o aluno atendido...</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nomeAluno || a.nome} {a.turma || a.turmaRegular ? `- ${a.turma || a.turmaRegular}` : ""}
                </option>
              ))}
            </Select>
          </div>

          {/* 2. Turma / Etapa */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Turma Regular / Etapa de Ensino <span className={styles.fieldRequired}>*</span>
            </label>
            <Input
              value={formData.turma}
              onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
              placeholder="Ex: 4º Ano A (Ensino Fundamental)"
              required
            />
          </div>

          {/* 3. Ano Letivo */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Ano Letivo de Vigência <span className={styles.fieldRequired}>*</span>
            </label>
            <Input
              value={formData.anoLetivo}
              onChange={(e) => setFormData({ ...formData, anoLetivo: e.target.value })}
              placeholder="Ex: 2026"
              required
            />
          </div>

          {/* 4. Professor(a) Responsável / AEE */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Professor(a) Especialista Responsável / AEE <span className={styles.fieldRequired}>*</span>
            </label>
            <Select
              value={formData.professorResponsavel}
              onChange={(e) => setFormData({ ...formData, professorResponsavel: e.target.value })}
              required
            >
              <option value="">Selecione o(a) professor(a)...</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.nome}>
                  {p.nome} ({p.funcao || p.cargo || "Especialista AEE"})
                </option>
              ))}
            </Select>
          </div>

          {/* 5. Data de Elaboração */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Data de Elaboração do Plano <span className={styles.fieldRequired}>*</span>
            </label>
            <Input
              type="date"
              value={formData.dataElaboracao}
              onChange={(e) => setFormData({ ...formData, dataElaboracao: e.target.value })}
              required
            />
          </div>

          {/* 6. Data Prevista para Próxima Revisão */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Data Prevista para Próxima Revisão Trimestral <span className={styles.fieldRequired}>*</span>
            </label>
            <Input
              type="date"
              value={formData.dataRevisao}
              onChange={(e) => setFormData({ ...formData, dataRevisao: e.target.value })}
              required
            />
          </div>

          {/* 7. Diagnóstico Pedagógico & Habilidades Atuais */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Diagnóstico Pedagógico & Habilidades Atuais do Aluno
            </label>
            <textarea
              className={styles.formTextarea}
              rows={3}
              value={formData.habilidadesAtuais}
              onChange={(e) => setFormData({ ...formData, habilidadesAtuais: e.target.value })}
              placeholder="Descreva o que o educando já realiza de forma autônoma e com mediação pedagógica..."
            />
          </div>

          {/* 8. Metas de Curto Prazo */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Metas de Curto Prazo (Próximos 3 meses) <span className={styles.fieldRequired}>*</span>
            </label>
            <textarea
              className={styles.formTextarea}
              rows={3}
              value={formData.metasCurtoPrazo}
              onChange={(e) => setFormData({ ...formData, metasCurtoPrazo: e.target.value })}
              placeholder="Metas imediatas para aprendizagem, comunicação e autonomia no ambiente escolar..."
              required
            />
          </div>

          {/* 9. Metas de Médio / Longo Prazo */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Metas de Médio e Longo Prazo (Ano Letivo)
            </label>
            <textarea
              className={styles.formTextarea}
              rows={3}
              value={formData.metasMedioPrazo}
              onChange={(e) => setFormData({ ...formData, metasMedioPrazo: e.target.value })}
              placeholder="Objetivos curriculares ampliados, convivência e avanço nas habilidades acadêmicas..."
            />
          </div>

          {/* 10. Estratégias Pedagógicas */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Estratégias Pedagógicas e Metodológicas
            </label>
            <textarea
              className={styles.formTextarea}
              rows={3}
              value={formData.estrategiasPedagogicas}
              onChange={(e) => setFormData({ ...formData, estrategiasPedagogicas: e.target.value })}
              placeholder="Instrução direta, apoios visuais, divisão em etapas menores, tutoria por pares..."
            />
          </div>

          {/* 11. Recursos de Acessibilidade & Tecnologia Assistiva */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Recursos de Acessibilidade & Tecnologia Assistiva
            </label>
            <Input
              value={formData.recursosAcessibilidade}
              onChange={(e) => setFormData({ ...formData, recursosAcessibilidade: e.target.value })}
              placeholder="Ex: Prancha CAA, computador com leitor de tela, plano inclinado, abafadores acústicos..."
            />
          </div>

          {/* 12. Adaptações Avaliativas */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Adaptações Avaliativas
            </label>
            <Input
              value={formData.avaliacoesAdaptadas}
              onChange={(e) => setFormData({ ...formData, avaliacoesAdaptadas: e.target.value })}
              placeholder="Ex: Avaliações orais gravadas, tempo estendido (50%), enunciados com apoio pictográfico..."
            />
          </div>

          {/* 13. Equipe Participante */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Equipe Participante na Elaboração
            </label>
            <Input
              value={formData.participantesElaboracao}
              onChange={(e) => setFormData({ ...formData, participantesElaboracao: e.target.value })}
              placeholder="Ex: Prof. Regente, Professora de AEE, Psicopedagoga e Responsável Legal"
            />
          </div>

          {/* 14. Status do Plano */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Status do Plano PEI
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Vigente">Vigente (Em Execução)</option>
              <option value="Em Elaboração">Em Elaboração</option>
              <option value="Em Revisão">Em Revisão</option>
              <option value="Concluído">Concluído</option>
            </Select>
          </div>

          {/* 15. Observações Gerais */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Observações Gerais & Histórico
            </label>
            <textarea
              className={styles.formTextarea}
              rows={2}
              value={formData.observacoesGerais}
              onChange={(e) => setFormData({ ...formData, observacoesGerais: e.target.value })}
              placeholder="Reavaliações periódicas, alinhamento com família e especialistas externos..."
            />
          </div>

          {/* Rodapé do Modal */}
          <div className={styles.modalFooter}>
            <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {itemEdicao ? "Salvar Alterações" : "Registrar Plano PEI"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. MODAL DE VISUALIZAÇÃO / IMPRESSÃO DO PEI OFICIAL */}
      <Modal
        isOpen={modalImpressao.aberto}
        onClose={() => setModalImpressao({ aberto: false, plano: null })}
        title="Documento Oficial - Plano Educacional Individualizado (PEI)"
        size="xl"
        semRodape
      >
        {modalImpressao.plano && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto p-1">
            {/* Folha Oficial de Impressão */}
            <div className="bg-white text-gray-900 p-8 rounded-xl border border-gray-300 shadow-sm print:m-0 print:border-none print:p-0">
              {/* Cabeçalho */}
              <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wide">
                  SECRETARIA MUNICIPAL DE EDUCAÇÃO
                </h2>
                <h3 className="text-base font-semibold text-gray-700">
                  SISTEMA INTEGRADO DE GESTÃO ESCOLAR MUNICIPAL - SIGEM
                </h3>
                <p className="text-xs font-medium text-indigo-700 uppercase mt-1">
                  COORDENAÇÃO DE EDUCAÇÃO ESPECIAL & INCLUSIVA
                </p>
                <h1 className="text-xl font-extrabold uppercase mt-2 text-gray-900">
                  PLANO EDUCACIONAL INDIVIDUALIZADO (PEI / PDI)
                </h1>
                <p className="text-xs text-gray-500">
                  Ano Letivo: {modalImpressao.plano.anoLetivo || "2026"} • Status: {getStatus(modalImpressao.plano)}
                </p>
              </div>

              {/* Identificação do Educando */}
              <div className="border border-gray-300 rounded-lg p-4 mb-4 bg-gray-50/50">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
                  1. DADOS DE IDENTIFICAÇÃO DO ESTUDANTE
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold text-gray-600 text-xs block">Nome do Aluno:</span>
                    <span className="font-bold text-gray-900">{modalImpressao.plano.alunoNome}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 text-xs block">Turma / Etapa:</span>
                    <span className="font-bold text-gray-900">{getTurma(modalImpressao.plano)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 text-xs block">Professor(a) Especialista Responsável:</span>
                    <span>{getProfessor(modalImpressao.plano)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 text-xs block">Data de Elaboração / Vigência:</span>
                    <span>
                      {modalImpressao.plano.dataElaboracao ? new Date(modalImpressao.plano.dataElaboracao).toLocaleDateString("pt-BR") : "N/D"}{" "}
                      (Revisão: {getDataRevisao(modalImpressao.plano) ? new Date(getDataRevisao(modalImpressao.plano)).toLocaleDateString("pt-BR") : "N/D"})
                    </span>
                  </div>
                </div>
              </div>

              {/* Habilidades & Diagnóstico Pedagógico */}
              <div className="border border-gray-300 rounded-lg p-4 mb-4">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
                  2. QUADRO INICIAL DE HABILIDADES & POTENCIALIDADES
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {modalImpressao.plano.habilidadesAtuais || "Conforme avaliação pedagógica inicial realizada na SRM."}
                </p>
              </div>

              {/* Metas Pedagógicas */}
              <div className="border border-gray-300 rounded-lg p-4 mb-4">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
                  3. OBJETIVOS E METAS PEDAGÓGICAS (CURTO E MÉDIO PRAZO)
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-bold text-gray-800 text-xs block">Metas de Curto Prazo (Trimestrais):</span>
                    <p className="text-gray-700 whitespace-pre-line">{getMetasCurto(modalImpressao.plano) || "Nenhuma cadastrada."}</p>
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 text-xs block">Metas de Médio / Longo Prazo (Anuais):</span>
                    <p className="text-gray-700 whitespace-pre-line">{getMetasMedio(modalImpressao.plano) || "Nenhuma cadastrada."}</p>
                  </div>
                </div>
              </div>

              {/* Estratégias & Recursos */}
              <div className="border border-gray-300 rounded-lg p-4 mb-4">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
                  4. ESTRATÉGIAS METODOLÓGICAS, TECNOLOGIA ASSISTIVA & AVALIAÇÃO
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-xs">Estratégias:</span> {getEstrategias(modalImpressao.plano) || "Não informado."}</p>
                  <p><span className="font-semibold text-xs">Recursos / T.A.:</span> {getRecursos(modalImpressao.plano) || "Não informado."}</p>
                  <p><span className="font-semibold text-xs">Adaptação de Avaliações:</span> {modalImpressao.plano.avaliacoesAdaptadas || modalImpressao.plano.adaptacoesCurriculares || "Não informado."}</p>
                </div>
              </div>

              {/* Assinaturas */}
              <div className="mt-12 pt-6 border-t border-gray-300">
                <p className="text-xs text-center text-gray-500 mb-8">
                  Declaro que as informações e adaptações constantes neste Plano foram acordadas entre os profissionais envolvidos e a família.
                </p>
                <div className="grid grid-cols-3 gap-6 text-center text-xs text-gray-700">
                  <div className="border-t border-gray-800 pt-2">
                    <p className="font-bold">Professor(a) de AEE</p>
                    <p className="text-[11px] text-gray-500">Responsável pelo AEE</p>
                  </div>
                  <div className="border-t border-gray-800 pt-2">
                    <p className="font-bold">Professor(a) Regente</p>
                    <p className="text-[11px] text-gray-500">Sala de Aula Comum</p>
                  </div>
                  <div className="border-t border-gray-800 pt-2">
                    <p className="font-bold">Responsável Legal</p>
                    <p className="text-[11px] text-gray-500">Pai / Mãe / Tutor</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
              <Button variant="outline" onClick={() => setModalImpressao({ aberto: false, plano: null })}>
                Fechar
              </Button>
              <Button onClick={imprimirPEI} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
                <i className="ti ti-printer" />
                Imprimir Documento Oficial
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 7. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        isOpen={modalConfirmacao.aberto}
        onClose={() => setModalConfirmacao({ aberto: false, id: null })}
        title="Confirmar Exclusão"
        semRodape
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tem certeza de que deseja remover este Plano PEI? Esta ação não poderá ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalConfirmacao({ aberto: false, id: null })}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleExcluir}>
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* 8. MODAL DE NOTIFICAÇÕES */}
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

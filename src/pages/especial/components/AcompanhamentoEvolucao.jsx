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
import styles from "./AcompanhamentoEvolucao.module.css";

const PERIODOS_AVALIACAO = [
  "1º Bimestre / Trimestre",
  "2º Bimestre / Trimestre",
  "3º Bimestre / Trimestre",
  "4º Bimestre / Trimestre",
  "Avaliação Diagnóstica Inicial",
  "Relatório de Transição de Ano"
];

export default function AcompanhamentoEvolucao({
  acompanhamentos = [],
  alunos = [],
  profissionais = [],
  onSalvar,
  onExcluir,
  escolaId,
  usuario
}) {
  const [busca, setBusca] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [modalAberto, setModalAberto] = useState(false);
  const [modalImpressao, setModalImpressao] = useState({ aberto: false, item: null });
  const [itemEdicao, setItemEdicao] = useState(null);
  const [formData, setFormData] = useState({
    alunoId: "",
    alunoNome: "",
    periodo: "1º Bimestre / Trimestre",
    dataRegistro: new Date().toISOString().split("T")[0],
    responsavelRegistro: "",
    evolucaoCognitiva: "",
    evolucaoComunicacao: "",
    evolucaoMotora: "",
    evolucaoSocialAutonomia: "",
    conquistasRelevantes: "",
    desafiosPendentes: "",
    orientacoesFamilia: "",
    orientacoesSalaRegular: "",
    parecerGeral: ""
  });

  const [notificacao, setNotificacao] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, id: null });

  // Funções de apoio
  const getAlunoNome = (item) => item.alunoNome || item.nomeAluno || "Aluno Atendido";
  const getResponsavel = (item) => item.responsavelRegistro || item.professorResponsavel || "Professora Especialista AEE";
  const getConquistas = (item) => item.conquistasRelevantes || item.destaques || "";
  const getParecer = (item) => item.parecerGeral || item.parecerSintese || item.observacoes || "";

  // Filtros
  const acompanhamentosFiltrados = useMemo(() => {
    return acompanhamentos.filter((a) => {
      const matchBusca =
        getAlunoNome(a).toLowerCase().includes(busca.toLowerCase()) ||
        getParecer(a).toLowerCase().includes(busca.toLowerCase()) ||
        getResponsavel(a).toLowerCase().includes(busca.toLowerCase());
      const matchPeriodo = !filtroPeriodo || a.periodo === filtroPeriodo;
      return matchBusca && matchPeriodo;
    });
  }, [acompanhamentos, busca, filtroPeriodo]);

  // Paginação
  const totalPages = Math.ceil(acompanhamentosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const acompanhamentosPaginados = acompanhamentosFiltrados.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const temFiltroAtivo = busca !== "" || filtroPeriodo !== "";

  const limparFiltros = () => {
    setBusca("");
    setFiltroPeriodo("");
    setCurrentPage(1);
  };

  // KPIs
  const totalAlunosAtendidos = useMemo(() => {
    const ids = new Set(acompanhamentos.map((a) => a.alunoId || a.alunoNome).filter(Boolean));
    return ids.size;
  }, [acompanhamentos]);

  const totalComConquistas = useMemo(() => {
    return acompanhamentos.filter((a) => (a.conquistasRelevantes || "").trim().length > 0).length;
  }, [acompanhamentos]);

  const totalPrimeiroPeriodo = useMemo(() => {
    return acompanhamentos.filter((a) => (a.periodo || "").includes("1º")).length;
  }, [acompanhamentos]);

  const abrirModalNovo = () => {
    setItemEdicao(null);
    const alunoPadrao = alunos[0];
    const profPadrao = profissionais[0];
    setFormData({
      alunoId: alunoPadrao?.id || "",
      alunoNome: alunoPadrao?.nomeAluno || alunoPadrao?.nome || "",
      periodo: "1º Bimestre / Trimestre",
      dataRegistro: new Date().toISOString().split("T")[0],
      responsavelRegistro: profPadrao?.nome || "Professora Especialista AEE",
      evolucaoCognitiva: "Apresentou avanço consistente no reconhecimento de grafemas e na associação número-quantidade até 15.",
      evolucaoComunicacao: "Aumento do vocabulário funcional e maior utilização da prancha de CAA para expressar preferências alimentares e necessidades.",
      evolucaoMotora: "Melhoria na preensão do lápis após uso de adaptador ergonômico.",
      evolucaoSocialAutonomia: "Maior tolerância a mudanças de rotina e interação espontânea nos momentos de recreio monitorado.",
      conquistasRelevantes: "Completou atividades de pareamento de imagens de forma autônoma sem necessidade de redirecionamento contínuo.",
      desafiosPendentes: "Necessita de apoio na regulação emocional em momentos de transição de ambiente (ex: pátio para sala).",
      orientacoesFamilia: "Manter rotina visual consistente em casa e incentivar a autonomia no momento do banho e vestuário.",
      orientacoesSalaRegular: "Avisar com 5 minutos de antecedência antes de mudanças de atividade e manter apoio pictográfico nas instruções.",
      parecerGeral: "Desenvolvimento positivo e satisfatório no período, demonstrando excelente engajamento com os recursos adaptados."
    });
    setModalAberto(true);
  };

  const abrirModalEdicao = (item) => {
    setItemEdicao(item);
    setFormData({
      alunoId: item.alunoId || "",
      alunoNome: getAlunoNome(item),
      periodo: item.periodo || "1º Bimestre / Trimestre",
      dataRegistro: item.dataRegistro || new Date().toISOString().split("T")[0],
      responsavelRegistro: getResponsavel(item),
      evolucaoCognitiva: item.evolucaoCognitiva || "",
      evolucaoComunicacao: item.evolucaoComunicacao || "",
      evolucaoMotora: item.evolucaoMotora || "",
      evolucaoSocialAutonomia: item.evolucaoSocialAutonomia || "",
      conquistasRelevantes: getConquistas(item),
      desafiosPendentes: item.desafiosPendentes || "",
      orientacoesFamilia: item.orientacoesFamilia || "",
      orientacoesSalaRegular: item.orientacoesSalaRegular || "",
      parecerGeral: getParecer(item)
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
          ? "Parecer descritivo atualizado com sucesso!"
          : "Novo parecer descritivo de evolução registrado com sucesso!"
      });
    } catch (err) {
      setNotificacao({
        tipo: "erro",
        titulo: "Erro",
        mensagem: "Erro ao salvar parecer descritivo: " + err.message
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
        mensagem: "Parecer descritivo removido com sucesso!"
      });
    } catch (err) {
      setNotificacao({
        tipo: "erro",
        titulo: "Erro",
        mensagem: "Erro ao excluir: " + err.message
      });
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Indicadores Rápidos (KPIs) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
            <i className="ti ti-chart-line" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{acompanhamentos.length}</span>
            <span className={styles.statLabel}>Total de Pareceres</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
            <i className="ti ti-users" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalAlunosAtendidos}</span>
            <span className={styles.statLabel}>Alunos Acompanhados</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <i className="ti ti-trophy" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalComConquistas}</span>
            <span className={styles.statLabel}>Com Marcos & Conquistas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <i className="ti ti-calendar-stats" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalPrimeiroPeriodo}</span>
            <span className={styles.statLabel}>Avaliações 1º Bimestre</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Cabeçalho */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <h2 className={styles.headerTitle}>
            <i className="ti ti-chart-line text-indigo-500" />
            <span>Acompanhamento de Evolução & Pareceres Descritivos</span>
          </h2>
          <p className={styles.headerSubtitle}>
            Registros periódicos do desenvolvimento integral, ganhos de autonomia e orientações pedagógicas
          </p>
        </div>

        <button type="button" onClick={abrirModalNovo} className={styles.btnNovo}>
          <i className="ti ti-plus" />
          <span>Novo Parecer Descritivo</span>
        </button>
      </div>

      {/* 3. Barra de Filtros */}
      <div className={styles.filtersBar}>
        <div>
          <Input
            placeholder="Buscar por aluno, parecer ou profissional responsável..."
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
            value={filtroPeriodo}
            onChange={(e) => {
              setFiltroPeriodo(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Todos os períodos avaliativos</option>
            {PERIODOS_AVALIACAO.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>

        {temFiltroAtivo && (
          <button type="button" onClick={limparFiltros} className={styles.btnClearFilters} title="Limpar Filtros">
            <i className="ti ti-x" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* 4. Grade de Cards de Pareceres */}
      <div className={styles.sectionHeader}>
        <div>
          <h3 className={styles.sectionTitle}>
            <i className="ti ti-file-text text-indigo-500" />
            <span>Pareceres Registrados</span>
          </h3>
          <p className={styles.sectionSubtitle}>
            Exibindo {acompanhamentosFiltrados.length} registro(s) pedagógico(s)
          </p>
        </div>
      </div>

      <div className={styles.pareceresGrid}>
        {acompanhamentosFiltrados.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="ti ti-file-dislike" />
            <div className={styles.emptyStateTitle}>Nenhum parecer encontrado</div>
            <p className={styles.emptyStateSub}>
              {temFiltroAtivo
                ? "Tente ajustar os filtros de busca ou período avaliativo."
                : "Cadastre o primeiro parecer descritivo para registrar o progresso educacional dos educandos."}
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
                <i className="ti ti-plus" /> Novo Parecer Descritivo
              </button>
            )}
          </div>
        ) : (
          acompanhamentosPaginados.map((item) => {
            const alunoNome = getAlunoNome(item);
            const initial = alunoNome.charAt(0).toUpperCase() || "A";
            const conquistas = getConquistas(item);
            const parecer = getParecer(item);
            const responsavel = getResponsavel(item);
            const dataFormatada = item.dataRegistro
              ? new Date(item.dataRegistro).toLocaleDateString("pt-BR")
              : "Data não definida";

            return (
              <div key={item.id} className={styles.parecerCard}>
                {/* Topo do Card */}
                <div className={styles.cardTop}>
                  <div className={styles.cardTopLeft}>
                    <div className={styles.studentAvatar}>
                      {initial}
                    </div>
                    <div className={styles.studentInfo}>
                      <span className={styles.studentName} title={alunoNome}>
                        {alunoNome}
                      </span>
                      <div className={styles.periodWrap}>
                        <Badge variant="primary">{item.periodo || "1º Bimestre"}</Badge>
                        <span style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                          • {dataFormatada}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={`${styles.btnAction} ${styles.btnActionPrint}`}
                      onClick={() => setModalImpressao({ aberto: true, item })}
                      title="Documento Oficial / Imprimir"
                    >
                      <i className="ti ti-printer" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnAction} ${styles.btnActionEdit}`}
                      onClick={() => abrirModalEdicao(item)}
                      title="Editar Parecer"
                    >
                      <i className="ti ti-edit" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnAction} ${styles.btnActionDelete}`}
                      onClick={() => setModalConfirmacao({ aberto: true, id: item.id })}
                      title="Excluir Parecer"
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>

                {/* Corpo do Card */}
                <div className={styles.cardBody}>
                  {conquistas && (
                    <div className={styles.conquistasBox}>
                      <div className={styles.conquistasHeader}>
                        <i className="ti ti-trophy" />
                        <span>Conquistas Observadas no Período</span>
                      </div>
                      <p className={styles.conquistasText}>{conquistas}</p>
                    </div>
                  )}

                  {parecer && (
                    <div className={styles.parecerBox}>
                      <div className={styles.parecerHeader}>
                        <i className="ti ti-file-text" />
                        <span>Parecer Síntese</span>
                      </div>
                      <p className={styles.parecerText}>{parecer}</p>
                    </div>
                  )}
                </div>

                {/* Rodapé do Card */}
                <div className={styles.cardFooter}>
                  <div className={styles.profBadge} title={`Responsável: ${responsavel}`}>
                    <i className="ti ti-user-check text-indigo-400" />
                    <span>{responsavel}</span>
                  </div>

                  <button
                    type="button"
                    className={styles.btnViewDoc}
                    onClick={() => setModalImpressao({ aberto: true, item })}
                  >
                    <i className="ti ti-file-certificate" />
                    <span>Parecer Oficial</span>
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

      {/* 5. MODAL DE CADASTRO / EDIÇÃO DO PARECER (CAMPOS EM COLUNA ÚNICA) */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={itemEdicao ? "Editar Parecer Descritivo de Evolução" : "Novo Registro de Parecer Descritivo"}
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
                  alunoNome: sel ? (sel.nomeAluno || sel.nome || "") : ""
                });
              }}
              required
            >
              <option value="">Selecione o educando...</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nomeAluno || a.nome} {a.turma ? `- ${a.turma}` : ""}
                </option>
              ))}
            </Select>
          </div>

          {/* 2. Período Avaliativo */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Período Avaliativo de Referência <span className={styles.fieldRequired}>*</span>
            </label>
            <Select
              value={formData.periodo}
              onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
              required
            >
              {PERIODOS_AVALIACAO.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>

          {/* 3. Data do Registro */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Data do Registro do Parecer <span className={styles.fieldRequired}>*</span>
            </label>
            <Input
              type="date"
              value={formData.dataRegistro}
              onChange={(e) => setFormData({ ...formData, dataRegistro: e.target.value })}
              required
            />
          </div>

          {/* 4. Profissional Responsável */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Profissional Especialista Responsável pelo Parecer <span className={styles.fieldRequired}>*</span>
            </label>
            <Select
              value={formData.responsavelRegistro}
              onChange={(e) => setFormData({ ...formData, responsavelRegistro: e.target.value })}
              required
            >
              <option value="">Selecione o(a) especialista...</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.nome}>
                  {p.nome} ({p.funcao || p.cargo || "Especialista AEE"})
                </option>
              ))}
            </Select>
          </div>

          {/* 5. Desenvolvimento Cognitivo & Aprendizagem */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              1. Desenvolvimento Cognitivo & Aprendizagem
            </label>
            <textarea
              className={styles.formTextarea}
              rows={3}
              value={formData.evolucaoCognitiva}
              onChange={(e) => setFormData({ ...formData, evolucaoCognitiva: e.target.value })}
              placeholder="Avanços em raciocínio lógico, retenção, atenção compartilhada, leitura, escrita e resolução de problemas..."
            />
          </div>

          {/* 6. Comunicação, Linguagem & Expressão */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              2. Comunicação, Linguagem & Expressão
            </label>
            <textarea
              className={styles.formTextarea}
              rows={3}
              value={formData.evolucaoComunicacao}
              onChange={(e) => setFormData({ ...formData, evolucaoComunicacao: e.target.value })}
              placeholder="Uso de fala funcional, pranchas de CAA, gestos, Libras, intencionalidade comunicativa e compreensão..."
            />
          </div>

          {/* 7. Psicomotricidade & Habilidades Motoras */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              3. Psicomotricidade & Habilidades Motoras
            </label>
            <textarea
              className={styles.formTextarea}
              rows={2}
              value={formData.evolucaoMotora}
              onChange={(e) => setFormData({ ...formData, evolucaoMotora: e.target.value })}
              placeholder="Coordenação motora fina/ampla, preensão de instrumentos, equilíbrio e tônus muscular..."
            />
          </div>

          {/* 8. Autonomia & Convivência Social */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              4. Autonomia (AVDs) & Interação Social
            </label>
            <textarea
              className={styles.formTextarea}
              rows={2}
              value={formData.evolucaoSocialAutonomia}
              onChange={(e) => setFormData({ ...formData, evolucaoSocialAutonomia: e.target.value })}
              placeholder="Convivência com pares, regulação emocional, autonomia em alimentação, higiene e atividades de vida diária..."
            />
          </div>

          {/* 9. Conquistas e Marcos Relevantes */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Conquistas e Marcos Relevantes no Período <span className={styles.fieldRequired}>*</span>
            </label>
            <Input
              value={formData.conquistasRelevantes}
              onChange={(e) => setFormData({ ...formData, conquistasRelevantes: e.target.value })}
              placeholder="Destaque as principais conquistas e marcos pedagógicos atingidos pelo aluno..."
              required
            />
          </div>

          {/* 10. Desafios e Metas em Desenvolvimento */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Desafios e Metas em Desenvolvimento
            </label>
            <Input
              value={formData.desafiosPendentes}
              onChange={(e) => setFormData({ ...formData, desafiosPendentes: e.target.value })}
              placeholder="Pontos de atenção para as próximas intervenções pedagógicas..."
            />
          </div>

          {/* 11. Orientações para Sala Regular */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Orientações para os Professores da Sala de Aula Regular
            </label>
            <textarea
              className={styles.formTextarea}
              rows={2}
              value={formData.orientacoesSalaRegular}
              onChange={(e) => setFormData({ ...formData, orientacoesSalaRegular: e.target.value })}
              placeholder="Orientações e mediações práticas aplicáveis no cotidiano da sala regular..."
            />
          </div>

          {/* 12. Orientações para a Família */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Orientações para o Núcleo Familiar
            </label>
            <textarea
              className={styles.formTextarea}
              rows={2}
              value={formData.orientacoesFamilia}
              onChange={(e) => setFormData({ ...formData, orientacoesFamilia: e.target.value })}
              placeholder="Sugestões de estímulos e rotina visual em ambiente domiciliar..."
            />
          </div>

          {/* 13. Parecer Conclusivo Síntese */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Parecer Conclusivo Síntese do Período <span className={styles.fieldRequired}>*</span>
            </label>
            <textarea
              className={styles.formTextarea}
              rows={3}
              value={formData.parecerGeral}
              onChange={(e) => setFormData({ ...formData, parecerGeral: e.target.value })}
              placeholder="Síntese avaliativa global da evolução biopsicossocial do educando..."
              required
            />
          </div>

          {/* Rodapé do Modal */}
          <div className={styles.modalFooter}>
            <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {itemEdicao ? "Salvar Alterações" : "Registrar Parecer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. MODAL DE VISUALIZAÇÃO / IMPRESSÃO DO PARECER OFICIAL */}
      <Modal
        isOpen={modalImpressao.aberto}
        onClose={() => setModalImpressao({ aberto: false, item: null })}
        title="Documento Oficial - Parecer Descritivo de Evolução Pedagógica"
        size="lg"
      >
        {modalImpressao.item && (
          <div className="space-y-4">
            <div className={styles.docContainer}>
              {/* Cabeçalho Oficial */}
              <div className={styles.docHeader}>
                <div className={styles.docLogo}>
                  <i className="ti ti-certificate" />
                </div>
                <div className={styles.docHeaderDetails}>
                  <span className={styles.docMunicipality}>
                    Secretaria Municipal de Educação • Coordenação de Educação Especial & AEE
                  </span>
                  <h3 className={styles.docMainTitle}>
                    Parecer Descritivo de Evolução e Desenvolvimento Integral
                  </h3>
                  <p className={styles.docSubTitle}>
                    Documento Pedagógico de Avaliação e Acompanhamento Individualizado
                  </p>
                </div>
              </div>

              {/* Informações Gerais */}
              <div className={styles.docInfoGrid}>
                <div className={styles.docInfoItem}>
                  <span className={styles.docInfoLabel}>Educando(a) Atendido(a)</span>
                  <span className={styles.docInfoValue}>{getAlunoNome(modalImpressao.item)}</span>
                </div>
                <div className={styles.docInfoItem}>
                  <span className={styles.docInfoLabel}>Período de Avaliação</span>
                  <span className={styles.docInfoValue}>{modalImpressao.item.periodo || "1º Bimestre"}</span>
                </div>
                <div className={styles.docInfoItem}>
                  <span className={styles.docInfoLabel}>Data de Registro</span>
                  <span className={styles.docInfoValue}>
                    {modalImpressao.item.dataRegistro
                      ? new Date(modalImpressao.item.dataRegistro).toLocaleDateString("pt-BR")
                      : "-"}
                  </span>
                </div>
                <div className={styles.docInfoItem}>
                  <span className={styles.docInfoLabel}>Especialista Responsável</span>
                  <span className={styles.docInfoValue}>{getResponsavel(modalImpressao.item)}</span>
                </div>
              </div>

              {/* Seção 1: Desenvolvimento Cognitivo */}
              <div className={styles.docSection}>
                <div className={styles.docSectionHeading}>
                  <i className="ti ti-brain text-indigo-600" />
                  <span>1. Desenvolvimento Cognitivo & Aprendizagem</span>
                </div>
                <p className={styles.docSectionContent}>
                  {modalImpressao.item.evolucaoCognitiva || "Sem observações registradas."}
                </p>
              </div>

              {/* Seção 2: Comunicação & Linguagem */}
              <div className={styles.docSection}>
                <div className={styles.docSectionHeading}>
                  <i className="ti ti-messages text-indigo-600" />
                  <span>2. Comunicação, Linguagem & Expressão</span>
                </div>
                <p className={styles.docSectionContent}>
                  {modalImpressao.item.evolucaoComunicacao || "Sem observações registradas."}
                </p>
              </div>

              {/* Seção 3: Psicomotricidade & Autonomia */}
              <div className={styles.docSection}>
                <div className={styles.docSectionHeading}>
                  <i className="ti ti-run text-indigo-600" />
                  <span>3. Psicomotricidade & Autonomia de Vida Diária (AVD)</span>
                </div>
                <p className={styles.docSectionContent}>
                  {modalImpressao.item.evolucaoMotora
                    ? `Psicomotricidade: ${modalImpressao.item.evolucaoMotora}\n`
                    : ""}
                  {modalImpressao.item.evolucaoSocialAutonomia
                    ? `Autonomia & Socialização: ${modalImpressao.item.evolucaoSocialAutonomia}`
                    : "Sem observações registradas."}
                </p>
              </div>

              {/* Seção 4: Conquistas & Destaques */}
              <div className={styles.docSection}>
                <div className={styles.docSectionHeading}>
                  <i className="ti ti-trophy text-emerald-600" />
                  <span>4. Conquistas e Marcos Relevantes no Período</span>
                </div>
                <p className={styles.docSectionContent} style={{ color: "#065f46", background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                  {getConquistas(modalImpressao.item) || "Avanço no ritmo previsto."}
                </p>
              </div>

              {/* Seção 5: Orientações */}
              <div className={styles.docSection}>
                <div className={styles.docSectionHeading}>
                  <i className="ti ti-compass text-indigo-600" />
                  <span>5. Orientações Pedagógicas (Sala Regular & Família)</span>
                </div>
                <p className={styles.docSectionContent}>
                  {modalImpressao.item.orientacoesSalaRegular
                    ? `Sala Regular: ${modalImpressao.item.orientacoesSalaRegular}\n`
                    : ""}
                  {modalImpressao.item.orientacoesFamilia
                    ? `Família: ${modalImpressao.item.orientacoesFamilia}`
                    : "Sem orientações adicionais."}
                </p>
              </div>

              {/* Seção 6: Parecer Síntese */}
              <div className={styles.docSection}>
                <div className={styles.docSectionHeading}>
                  <i className="ti ti-file-certificate text-indigo-600" />
                  <span>6. Parecer Conclusivo Síntese</span>
                </div>
                <p className={styles.docSectionContent} style={{ fontWeight: 600 }}>
                  {getParecer(modalImpressao.item) || "Desenvolvimento satisfatório de acordo com o PEI."}
                </p>
              </div>

              {/* Assinaturas */}
              <div className={styles.docSignatures}>
                <div className={styles.docSignItem}>
                  <div className={styles.docSignLine} />
                  <span className={styles.docSignName}>{getResponsavel(modalImpressao.item)}</span>
                  <span className={styles.docSignRole}>Professor(a) Especialista em AEE</span>
                </div>
                <div className={styles.docSignItem}>
                  <div className={styles.docSignLine} />
                  <span className={styles.docSignName}>Equipe Gestora / Coordenação</span>
                  <span className={styles.docSignRole}>Direção Escolar & Coordenação</span>
                </div>
                <div className={styles.docSignItem}>
                  <div className={styles.docSignLine} />
                  <span className={styles.docSignName}>Responsável Legal</span>
                  <span className={styles.docSignRole}>Pai / Mãe / Tutor(a)</span>
                </div>
              </div>
            </div>

            {/* Ações de Impressão */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setModalImpressao({ aberto: false, item: null })}
              >
                Fechar
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                onClick={() => window.print()}
              >
                <i className="ti ti-printer" />
                <span>Imprimir Parecer Descritivo</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 7. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        isOpen={modalConfirmacao.aberto}
        onClose={() => setModalConfirmacao({ aberto: false, id: null })}
        title="Confirmar Exclusão de Parecer"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Tem certeza de que deseja remover permanentemente este parecer descritivo de evolução?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalConfirmacao({ aberto: false, id: null })}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleExcluir}>
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* 8. MODAL DE NOTIFICAÇÃO */}
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

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  Pagination,
  NotificationModal
} from "../../../components/ui";

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

  const planosFiltrados = planos.filter(p => {
    const matchBusca =
      (p.alunoNome || "").toLowerCase().includes(busca.toLowerCase()) ||
      (p.turma || "").toLowerCase().includes(busca.toLowerCase()) ||
      (p.professorResponsavel || "").toLowerCase().includes(busca.toLowerCase());
    const matchStatus = !filtroStatus || p.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const totalPages = Math.ceil(planosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const planosPaginados = planosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const abrirModalNovo = () => {
    setItemEdicao(null);
    const alunoPadrao = alunos[0];
    setFormData({
      alunoId: alunoPadrao?.id || "",
      alunoNome: alunoPadrao?.nomeAluno || "",
      anoLetivo: new Date().getFullYear().toString(),
      turma: alunoPadrao?.turma || "3º Ano B - Ensino Fundamental",
      professorResponsavel: profissionais[0]?.nome || "Professora Especialista AEE",
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
      turma: item.turma || "",
      professorResponsavel: item.professorResponsavel || "",
      status: item.status || "Vigente",
      dataElaboracao: item.dataElaboracao || "",
      dataRevisao: item.dataRevisao || "",
      habilidadesAtuais: item.habilidadesAtuais || "",
      metasCurtoPrazo: item.metasCurtoPrazo || "",
      metasMedioPrazo: item.metasMedioPrazo || "",
      estrategiasPedagogicas: item.estrategiasPedagogicas || "",
      recursosAcessibilidade: item.recursosAcessibilidade || "",
      avaliacoesAdaptadas: item.avaliacoesAdaptadas || "",
      participantesElaboracao: item.participantesElaboracao || "",
      observacoesGerais: item.observacoesGerais || ""
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
        mensagem: itemEdicao ? "Plano PEI atualizado com sucesso!" : "Novo Plano PEI registrado com sucesso!"
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
        mensagem: "Plano PEI removido!"
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <i className="ti ti-file-certificate text-blue-600 dark:text-blue-400" />
              Plano de Atendimento Individualizado (PEI / PDI)
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Planejamento pedagógico individualizado, metas de curto/médio prazo, adaptações curriculares e cronograma de revisão
            </p>
          </div>
          <Button onClick={abrirModalNovo} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm">
            <i className="ti ti-plus" />
            Novo Plano PEI
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar por nome do aluno, turma ou professor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                icon="ti ti-search"
              />
            </div>
            <div>
              <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                <option value="">Todos os status</option>
                <option value="Vigente">Vigente</option>
                <option value="Em Revisão">Em Revisão</option>
                <option value="Em Elaboração">Em Elaboração</option>
                <option value="Concluído">Concluído</option>
              </Select>
            </div>
          </div>

          {/* Cards dos Planos PEI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {planosPaginados.length === 0 ? (
              <div className="col-span-full p-8 text-center border-2 border-dashed rounded-xl text-gray-400">
                Nenhum Plano PEI cadastrado.
              </div>
            ) : (
              planosPaginados.map((plano) => (
                <div
                  key={plano.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {plano.alunoNome}
                          </h3>
                          <Badge
                            variant={
                              plano.status === "Vigente"
                                ? "success"
                                : plano.status === "Em Revisão"
                                ? "warning"
                                : "primary"
                            }
                          >
                            {plano.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {plano.turma || "Ensino Fundamental"} • Ano Letivo {plano.anoLetivo}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setModalImpressao({ aberto: true, plano })}
                          className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                          title="Visualizar / Imprimir PEI Oficial"
                        >
                          <i className="ti ti-printer" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => abrirModalEdicao(plano)}
                          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="Editar"
                        >
                          <i className="ti ti-edit" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setModalConfirmacao({ aberto: true, id: plano.id })}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Excluir"
                        >
                          <i className="ti ti-trash" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 dark:bg-gray-700/40 p-2.5 rounded-xl mb-3">
                      <div>
                        <span className="text-gray-400 block">Elaborado em:</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {plano.dataElaboracao ? new Date(plano.dataElaboracao).toLocaleDateString("pt-BR") : "N/D"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Próxima Revisão:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {plano.dataRevisao ? new Date(plano.dataRevisao).toLocaleDateString("pt-BR") : "N/D"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs mb-3">
                      <div>
                        <span className="font-bold text-gray-700 dark:text-gray-300">Metas de Curto Prazo:</span>
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{plano.metasCurtoPrazo || "Nenhuma cadastrada."}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 dark:text-gray-300">Estratégias Pedagógicas:</span>
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{plano.estrategiasPedagogicas || "Nenhuma cadastrada."}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate max-w-[200px]">
                      <i className="ti ti-user-check mr-1 text-blue-500" />
                      {plano.professorResponsavel || "Prof. AEE"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setModalImpressao({ aberto: true, plano })}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <i className="ti ti-file-text" />
                      Ver Documento PEI
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-end">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={itemEdicao ? "Editar Plano PEI / PDI" : "Novo Plano de Atendimento Individualizado (PEI)"}
        size="lg"
      >
        <form onSubmit={handleSalvar} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Aluno Atendido *
              </label>
              <Select
                value={formData.alunoId}
                onChange={(e) => {
                  const sel = alunos.find(a => a.id === e.target.value);
                  setFormData({
                    ...formData,
                    alunoId: e.target.value,
                    alunoNome: sel ? sel.nomeAluno : "",
                    turma: sel ? sel.turma : formData.turma
                  });
                }}
                required
              >
                <option value="">Selecione o aluno...</option>
                {alunos.map(a => (
                  <option key={a.id} value={a.id}>{a.nomeAluno} - {a.turma}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Turma / Etapa *
              </label>
              <Input
                value={formData.turma}
                onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Ano Letivo
              </label>
              <Input
                value={formData.anoLetivo}
                onChange={(e) => setFormData({ ...formData, anoLetivo: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Professor(a) Responsável / AEE
              </label>
              <Select
                value={formData.professorResponsavel}
                onChange={(e) => setFormData({ ...formData, professorResponsavel: e.target.value })}
              >
                <option value="">Selecione o professor...</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.nome}>{p.nome} ({p.funcao})</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Data de Elaboração
              </label>
              <Input
                type="date"
                value={formData.dataElaboracao}
                onChange={(e) => setFormData({ ...formData, dataElaboracao: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Data Prevista para Próxima Revisão
              </label>
              <Input
                type="date"
                value={formData.dataRevisao}
                onChange={(e) => setFormData({ ...formData, dataRevisao: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Diagnóstico Pedagógico & Habilidades Atuais do Aluno
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
              rows={2}
              value={formData.habilidadesAtuais}
              onChange={(e) => setFormData({ ...formData, habilidadesAtuais: e.target.value })}
              placeholder="Descreva o que o educando já realiza de forma autônoma e com mediação..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Metas de Curto Prazo (Próximos 3 meses) *
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
                rows={3}
                value={formData.metasCurtoPrazo}
                onChange={(e) => setFormData({ ...formData, metasCurtoPrazo: e.target.value })}
                placeholder="Metas imediatas para aprendizagem e autonomia escolar..."
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Metas de Médio/Longo Prazo (Ano Letivo)
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
                rows={3}
                value={formData.metasMedioPrazo}
                onChange={(e) => setFormData({ ...formData, metasMedioPrazo: e.target.value })}
                placeholder="Metas curriculares e de convivência até o final do ano..."
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Estratégias Pedagógicas e Metodológicas
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
              rows={2}
              value={formData.estrategiasPedagogicas}
              onChange={(e) => setFormData({ ...formData, estrategiasPedagogicas: e.target.value })}
              placeholder="Instrução direta, apoios visuais, divisão em etapas menores, pares tutores..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Recursos de Acessibilidade & Tecnologia Assistiva
              </label>
              <Input
                value={formData.recursosAcessibilidade}
                onChange={(e) => setFormData({ ...formData, recursosAcessibilidade: e.target.value })}
                placeholder="Ex: Prancha CAA, computador adaptado, fones abafadores..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Adaptações Avaliativas
              </label>
              <Input
                value={formData.avaliacoesAdaptadas}
                onChange={(e) => setFormData({ ...formData, avaliacoesAdaptadas: e.target.value })}
                placeholder="Ex: Avaliação oral, tempo adicional, enunciados simplificados..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Equipe Participante na Elaboração
              </label>
              <Input
                value={formData.participantesElaboracao}
                onChange={(e) => setFormData({ ...formData, participantesElaboracao: e.target.value })}
                placeholder="Ex: Prof. Regente, AEE, Coordenação e Responsáveis"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Status do Plano
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
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              {itemEdicao ? "Salvar Alterações" : "Registrar Plano PEI"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE VISUALIZAÇÃO / IMPRESSÃO DO PEI OFICIAL */}
      <Modal
        isOpen={modalImpressao.aberto}
        onClose={() => setModalImpressao({ aberto: false, plano: null })}
        title="Documento Oficial - Plano Educacional Individualizado (PEI)"
        size="xl"
      >
        {modalImpressao.plano && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto p-2">
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
                <p className="text-xs font-medium text-blue-700 uppercase mt-1">
                  COORDENAÇÃO DE EDUCAÇÃO ESPECIAL & INCLUSIVA
                </p>
                <h1 className="text-xl font-extrabold uppercase mt-2 text-gray-900">
                  PLANO EDUCACIONAL INDIVIDUALIZADO (PEI / PDI)
                </h1>
                <p className="text-xs text-gray-500">
                  Ano Letivo: {modalImpressao.plano.anoLetivo || "2026"} • Status: {modalImpressao.plano.status}
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
                    <span className="font-bold text-gray-900">{modalImpressao.plano.turma || "Regular"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 text-xs block">Professor(a) Especialista Responsável:</span>
                    <span>{modalImpressao.plano.professorResponsavel || "Prof. AEE"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 text-xs block">Data de Elaboração / Vigência:</span>
                    <span>{modalImpressao.plano.dataElaboracao ? new Date(modalImpressao.plano.dataElaboracao).toLocaleDateString("pt-BR") : "N/D"} (Revisão: {modalImpressao.plano.dataRevisao ? new Date(modalImpressao.plano.dataRevisao).toLocaleDateString("pt-BR") : "N/D"})</span>
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
                    <p className="text-gray-700 whitespace-pre-line">{modalImpressao.plano.metasCurtoPrazo}</p>
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 text-xs block">Metas de Médio / Longo Prazo (Anuais):</span>
                    <p className="text-gray-700 whitespace-pre-line">{modalImpressao.plano.metasMedioPrazo}</p>
                  </div>
                </div>
              </div>

              {/* Estratégias & Recursos */}
              <div className="border border-gray-300 rounded-lg p-4 mb-4">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
                  4. ESTRATÉGIAS METODOLÓGICAS, TECNOLOGIA ASSISTIVA & AVALIAÇÃO
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-xs">Estratégias:</span> {modalImpressao.plano.estrategiasPedagogicas}</p>
                  <p><span className="font-semibold text-xs">Recursos / T.A.:</span> {modalImpressao.plano.recursosAcessibilidade}</p>
                  <p><span className="font-semibold text-xs">Adaptação de Avaliações:</span> {modalImpressao.plano.avaliacoesAdaptadas}</p>
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
              <Button onClick={imprimirPEI} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
                <i className="ti ti-printer" />
                Imprimir Documento Oficial
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        isOpen={modalConfirmacao.aberto}
        onClose={() => setModalConfirmacao({ aberto: false, id: null })}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tem certeza de que deseja remover este Plano PEI?
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

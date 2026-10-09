import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Table,
  Badge,
  Modal,
  Pagination,
  NotificationModal
} from "../../../components/ui";

const DIAS_SEMANA = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira"
];

export default function AtendimentoAEE({
  atendimentos = [],
  alunos = [],
  salas = [],
  profissionais = [],
  onSalvar,
  onExcluir,
  escolaId,
  usuario
}) {
  const [busca, setBusca] = useState("");
  const [filtroDia, setFiltroDia] = useState("");
  const [filtroModalidade, setFiltroModalidade] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [modalAberto, setModalAberto] = useState(false);
  const [itemEdicao, setItemEdicao] = useState(null);
  const [formData, setFormData] = useState({
    alunoId: "",
    alunoNome: "",
    salaId: "",
    salaNome: "",
    profissionalId: "",
    profissionalNome: "",
    diaSemana: "Segunda-feira",
    horarioInicio: "13:30",
    horarioFim: "14:20",
    modalidade: "Individual", // Individual, Dupla, Pequeno Grupo
    focoPedagogico: "",
    objetivos: "",
    recursosUtilizados: "",
    status: "Ativo",
    observacoes: ""
  });

  const [notificacao, setNotificacao] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, id: null });

  const atendimentosFiltrados = atendimentos.filter(a => {
    const matchBusca =
      (a.alunoNome || "").toLowerCase().includes(busca.toLowerCase()) ||
      (a.focoPedagogico || "").toLowerCase().includes(busca.toLowerCase()) ||
      (a.profissionalNome || "").toLowerCase().includes(busca.toLowerCase());
    const matchDia = !filtroDia || a.diaSemana === filtroDia;
    const matchMod = !filtroModalidade || a.modalidade === filtroModalidade;
    return matchBusca && matchDia && matchMod;
  });

  const totalPages = Math.ceil(atendimentosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const atendimentosPaginados = atendimentosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const abrirModalNovo = () => {
    setItemEdicao(null);
    setFormData({
      alunoId: alunos[0]?.id || "",
      alunoNome: alunos[0]?.nomeAluno || "",
      salaId: salas[0]?.id || "",
      salaNome: salas[0]?.nome || "",
      profissionalId: profissionais[0]?.id || "",
      profissionalNome: profissionais[0]?.nome || "",
      diaSemana: "Segunda-feira",
      horarioInicio: "13:30",
      horarioFim: "14:20",
      modalidade: "Individual",
      focoPedagogico: "Desenvolvimento de funções cognitivas e comunicação alternativa",
      objetivos: "Estimular raciocínio lógico, atenção sustentada e autonomia escolar.",
      recursosUtilizados: "Prancha de CAA, Jogos sensoriais, Software acessível",
      status: "Ativo",
      observacoes: ""
    });
    setModalAberto(true);
  };

  const abrirModalEdicao = (item) => {
    setItemEdicao(item);
    setFormData({
      alunoId: item.alunoId || "",
      alunoNome: item.alunoNome || "",
      salaId: item.salaId || "",
      salaNome: item.salaNome || "",
      profissionalId: item.profissionalId || "",
      profissionalNome: item.profissionalNome || "",
      diaSemana: item.diaSemana || "Segunda-feira",
      horarioInicio: item.horarioInicio || "13:30",
      horarioFim: item.horarioFim || "14:20",
      modalidade: item.modalidade || "Individual",
      focoPedagogico: item.focoPedagogico || "",
      objetivos: item.objetivos || "",
      recursosUtilizados: item.recursosUtilizados || "",
      status: item.status || "Ativo",
      observacoes: item.observacoes || ""
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
        mensagem: itemEdicao ? "Atendimento AEE atualizado com sucesso!" : "Novo atendimento AEE agendado com sucesso!"
      });
    } catch (err) {
      setNotificacao({
        tipo: "erro",
        titulo: "Erro",
        mensagem: "Erro ao salvar atendimento de AEE: " + err.message
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
        mensagem: "Atendimento AEE removido com sucesso!"
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <i className="ti ti-calendar-event text-blue-600 dark:text-blue-400" />
              Quadro de Atendimento Educacional Especializado (AEE)
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestão de cronogramas, sessões na Sala de Recursos, profissionais e metas de atendimento
            </p>
          </div>
          <Button onClick={abrirModalNovo} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm">
            <i className="ti ti-plus" />
            Agendar Atendimento AEE
          </Button>
        </CardHeader>
        <CardContent>
          {/* Grade de Resumo por Dia */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {DIAS_SEMANA.map((dia) => {
              const count = atendimentos.filter(a => a.diaSemana === dia).length;
              return (
                <div
                  key={dia}
                  onClick={() => setFiltroDia(filtroDia === dia ? "" : dia)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-center ${
                    filtroDia === dia
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold shadow-sm"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 bg-white dark:bg-gray-800"
                  }`}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">{dia.split("-")[0]}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{count}</p>
                  <p className="text-[11px] text-gray-400">sessões</p>
                </div>
              );
            })}
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar por aluno, foco pedagógico ou profissional..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                icon="ti ti-search"
              />
            </div>
            <div>
              <Select value={filtroDia} onChange={(e) => setFiltroDia(e.target.value)}>
                <option value="">Todos os dias</option>
                {DIAS_SEMANA.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </div>
            <div>
              <Select value={filtroModalidade} onChange={(e) => setFiltroModalidade(e.target.value)}>
                <option value="">Todas as modalidades</option>
                <option value="Individual">Individual</option>
                <option value="Dupla">Dupla</option>
                <option value="Pequeno Grupo">Pequeno Grupo</option>
              </Select>
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <Table>
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-left text-xs uppercase tracking-wider">
                  <th className="p-3.5">Dia & Horário</th>
                  <th className="p-3.5">Aluno Atendido</th>
                  <th className="p-3.5">Modalidade</th>
                  <th className="p-3.5">Foco Pedagógico & Objetivos</th>
                  <th className="p-3.5">Sala & Profissional</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {atendimentosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      Nenhum atendimento de AEE encontrado.
                    </td>
                  </tr>
                ) : (
                  atendimentosPaginados.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="p-3.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <div>
                            <p className="font-semibold">{item.diaSemana}</p>
                            <p className="text-xs text-gray-500">{item.horarioInicio} - {item.horarioFim}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-gray-800 dark:text-white">{item.alunoNome}</div>
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            item.modalidade === "Individual"
                              ? "primary"
                              : item.modalidade === "Dupla"
                              ? "warning"
                              : "info"
                          }
                        >
                          {item.modalidade}
                        </Badge>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.focoPedagogico}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.objetivos}</p>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                          <i className="ti ti-door mr-1 text-blue-500" />
                          {item.salaNome || "Sala SRM"}
                        </p>
                        <p className="text-xs text-gray-500">
                          <i className="ti ti-user-check mr-1 text-emerald-500" />
                          {item.profissionalNome || "Prof. AEE"}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <Badge variant={item.status === "Ativo" ? "success" : "secondary"}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => abrirModalEdicao(item)}
                          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="Editar sessão"
                        >
                          <i className="ti ti-edit" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setModalConfirmacao({ aberto: true, id: item.id })}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Excluir"
                        >
                          <i className="ti ti-trash" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-end">
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
        title={itemEdicao ? "Editar Atendimento AEE" : "Novo Horário de Atendimento AEE"}
        size="lg"
      >
        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Aluno da Educação Especial *
              </label>
              <Select
                value={formData.alunoId}
                onChange={(e) => {
                  const sel = alunos.find(a => a.id === e.target.value);
                  setFormData({
                    ...formData,
                    alunoId: e.target.value,
                    alunoNome: sel ? sel.nomeAluno : ""
                  });
                }}
                required
              >
                <option value="">Selecione o aluno...</option>
                {alunos.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nomeAluno} ({a.diagnosticoPrincipal || "AEE"})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Modalidade de Atendimento *
              </label>
              <Select
                value={formData.modalidade}
                onChange={(e) => setFormData({ ...formData, modalidade: e.target.value })}
                required
              >
                <option value="Individual">Individual (1 aluno)</option>
                <option value="Dupla">Dupla (2 alunos)</option>
                <option value="Pequeno Grupo">Pequeno Grupo (3-4 alunos)</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Dia da Semana *
              </label>
              <Select
                value={formData.diaSemana}
                onChange={(e) => setFormData({ ...formData, diaSemana: e.target.value })}
                required
              >
                {DIAS_SEMANA.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                  Horário Início *
                </label>
                <Input
                  type="time"
                  value={formData.horarioInicio}
                  onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                  Horário Término *
                </label>
                <Input
                  type="time"
                  value={formData.horarioFim}
                  onChange={(e) => setFormData({ ...formData, horarioFim: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Sala de Recursos Multifuncionais (SRM)
              </label>
              <Select
                value={formData.salaId}
                onChange={(e) => {
                  const sel = salas.find(s => s.id === e.target.value);
                  setFormData({
                    ...formData,
                    salaId: e.target.value,
                    salaNome: sel ? sel.nome : ""
                  });
                }}
              >
                <option value="">Selecione a sala...</option>
                {salas.map(s => (
                  <option key={s.id} value={s.id}>{s.nome} ({s.tipo})</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Profissional Responsável (AEE)
              </label>
              <Select
                value={formData.profissionalId}
                onChange={(e) => {
                  const sel = profissionais.find(p => p.id === e.target.value);
                  setFormData({
                    ...formData,
                    profissionalId: e.target.value,
                    profissionalNome: sel ? sel.nome : ""
                  });
                }}
              >
                <option value="">Selecione o profissional...</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} - {p.funcao}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Foco Pedagógico Principal *
            </label>
            <Input
              value={formData.focoPedagogico}
              onChange={(e) => setFormData({ ...formData, focoPedagogico: e.target.value })}
              placeholder="Ex: Alfabetização multissensorial, estimulação cognitiva, comunicação alternativa..."
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Objetivos Específicos do Atendimento
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
              rows={2}
              value={formData.objetivos}
              onChange={(e) => setFormData({ ...formData, objetivos: e.target.value })}
              placeholder="Descreva as metas de curto prazo trabalhadas nestas sessões..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Recursos e Tecnologias Assistivas Utilizados
            </label>
            <Input
              value={formData.recursosUtilizados}
              onChange={(e) => setFormData({ ...formData, recursosUtilizados: e.target.value })}
              placeholder="Ex: Prancha CAA, Teclado com colmeia, Jogos em relevo, Lupa eletrônica..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Ativo">Ativo</option>
                <option value="Suspenso">Suspenso Temporariamente</option>
                <option value="Concluído">Concluído</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Observações Adicionais
              </label>
              <Input
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Ex: Atendimento no contraturno escolar"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              {itemEdicao ? "Salvar Alterações" : "Cadastrar Atendimento"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        isOpen={modalConfirmacao.aberto}
        onClose={() => setModalConfirmacao({ aberto: false, id: null })}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tem certeza de que deseja remover este horário de atendimento AEE?
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

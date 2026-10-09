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

const FUNCOES_ESPECIALIZADAS = [
  "Professor(a) de AEE",
  "Tradutor(a) e Intérprete de Libras (TILS)",
  "Profissional de Apoio Escolar / Mediador(a)",
  "Psicopedagogo(a) Institucional",
  "Terapeuta Ocupacional",
  "Fonoaudiólogo(a) Educacional",
  "Guia-Intérprete",
  "Instrutor(a) de Braille / Soroban"
];

export default function ProfissionaisEspecial({
  profissionais = [],
  onSalvar,
  onExcluir,
  escolaId,
  usuario
}) {
  const [busca, setBusca] = useState("");
  const [filtroFuncao, setFiltroFuncao] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [modalAberto, setModalAberto] = useState(false);
  const [itemEdicao, setItemEdicao] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    funcao: "Professor(a) de AEE",
    especializacao: "",
    registroProfissional: "",
    email: "",
    telefone: "",
    cargaHorariaSemanal: "40h",
    turnos: "Manhã e Tarde",
    qtdAlunosAtendidos: 0,
    status: "Ativo",
    observacoes: ""
  });

  const [notificacao, setNotificacao] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, id: null });

  const profissionaisFiltrados = profissionais.filter(p => {
    const matchBusca =
      (p.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
      (p.especializacao || "").toLowerCase().includes(busca.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(busca.toLowerCase());
    const matchFuncao = !filtroFuncao || p.funcao === filtroFuncao;
    const matchStatus = !filtroStatus || p.status === filtroStatus;
    return matchBusca && matchFuncao && matchStatus;
  });

  const totalPages = Math.ceil(profissionaisFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const profissionaisPaginados = profissionaisFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const abrirModalNovo = () => {
    setItemEdicao(null);
    setFormData({
      nome: "",
      funcao: "Professor(a) de AEE",
      especializacao: "Pós-graduação em Educação Especial e Inclusiva",
      registroProfissional: "",
      email: "",
      telefone: "",
      cargaHorariaSemanal: "40h",
      turnos: "Manhã e Tarde",
      qtdAlunosAtendidos: 0,
      status: "Ativo",
      observacoes: ""
    });
    setModalAberto(true);
  };

  const abrirModalEdicao = (item) => {
    setItemEdicao(item);
    setFormData({
      nome: item.nome || "",
      funcao: item.funcao || "Professor(a) de AEE",
      especializacao: item.especializacao || "",
      registroProfissional: item.registroProfissional || "",
      email: item.email || "",
      telefone: item.telefone || "",
      cargaHorariaSemanal: item.cargaHorariaSemanal || "40h",
      turnos: item.turnos || "Manhã e Tarde",
      qtdAlunosAtendidos: item.qtdAlunosAtendidos || 0,
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
        mensagem: itemEdicao ? "Profissional atualizado!" : "Profissional cadastrado com sucesso!"
      });
    } catch (err) {
      setNotificacao({
        tipo: "erro",
        titulo: "Erro",
        mensagem: "Erro ao salvar profissional: " + err.message
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
        mensagem: "Profissional removido com sucesso!"
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
              <i className="ti ti-users-group text-blue-600 dark:text-blue-400" />
              Equipe de Educação Especial & Apoio Multidisciplinar
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Professores de AEE, Tradutores de Libras (TILS), Mediadores escolares, Psicopedagogos e Especialistas
            </p>
          </div>
          <Button onClick={abrirModalNovo} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm">
            <i className="ti ti-user-plus" />
            Cadastrar Profissional
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar por nome, especialização ou email..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                icon="ti ti-search"
              />
            </div>
            <div>
              <Select value={filtroFuncao} onChange={(e) => setFiltroFuncao(e.target.value)}>
                <option value="">Todas as funções</option>
                {FUNCOES_ESPECIALIZADAS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
            </div>
            <div>
              <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                <option value="">Todos os status</option>
                <option value="Ativo">Ativo</option>
                <option value="Licença">Em Licença</option>
                <option value="Inativo">Inativo</option>
              </Select>
            </div>
          </div>

          {/* Tabela de Profissionais */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <Table>
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-left text-xs uppercase tracking-wider">
                  <th className="p-3.5">Profissional</th>
                  <th className="p-3.5">Função & Especialização</th>
                  <th className="p-3.5">Carga Horária & Turnos</th>
                  <th className="p-3.5">Reg. Profissional</th>
                  <th className="p-3.5">Contato</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {profissionaisPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      Nenhum profissional encontrado.
                    </td>
                  </tr>
                ) : (
                  profissionaisPaginados.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="p-3.5 font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                            {p.nome ? p.nome.charAt(0) : "P"}
                          </div>
                          <div>
                            <p className="font-semibold">{p.nome}</p>
                            {p.qtdAlunosAtendidos > 0 && (
                              <span className="text-[11px] text-gray-400">
                                Atende {p.qtdAlunosAtendidos} alunos
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-blue-600 dark:text-blue-400">{p.funcao}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{p.especializacao || "-"}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{p.cargaHorariaSemanal || "40h"}</p>
                        <p className="text-xs text-gray-500">{p.turnos || "Integral"}</p>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                          {p.registroProfissional || "N/D"}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs text-gray-600 dark:text-gray-300">
                        {p.email && <div className="truncate max-w-[150px]"><i className="ti ti-mail mr-1 text-gray-400" />{p.email}</div>}
                        {p.telefone && <div><i className="ti ti-phone mr-1 text-gray-400" />{p.telefone}</div>}
                      </td>
                      <td className="p-3.5">
                        <Badge variant={p.status === "Ativo" ? "success" : p.status === "Licença" ? "warning" : "secondary"}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => abrirModalEdicao(p)}
                          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <i className="ti ti-edit" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setModalConfirmacao({ aberto: true, id: p.id })}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
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

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={itemEdicao ? "Editar Profissional Especializado" : "Cadastrar Novo Profissional da Educação Especial"}
        size="lg"
      >
        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Nome Completo *
              </label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Função Especializada *
              </label>
              <Select
                value={formData.funcao}
                onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                required
              >
                {FUNCOES_ESPECIALIZADAS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Formação Acadêmica & Especializações
              </label>
              <Input
                value={formData.especializacao}
                onChange={(e) => setFormData({ ...formData, especializacao: e.target.value })}
                placeholder="Ex: Pós-graduação em TEA, Libras, Neuropsicopedagogia..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Registro no Conselho de Classe / Matrícula
              </label>
              <Input
                value={formData.registroProfissional}
                onChange={(e) => setFormData({ ...formData, registroProfissional: e.target.value })}
                placeholder="Ex: CRP 06/12345, CRFa 4567, CAS/Libras..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                E-mail Institucional
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Telefone de Contato / WhatsApp
              </label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Carga Horária Semanal
              </label>
              <Select
                value={formData.cargaHorariaSemanal}
                onChange={(e) => setFormData({ ...formData, cargaHorariaSemanal: e.target.value })}
              >
                <option value="20h">20 horas semanais</option>
                <option value="30h">30 horas semanais</option>
                <option value="40h">40 horas semanais (Dedicação)</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Turnos de Atuação
              </label>
              <Select
                value={formData.turnos}
                onChange={(e) => setFormData({ ...formData, turnos: e.target.value })}
              >
                <option value="Manhã e Tarde">Manhã e Tarde</option>
                <option value="Manhã">Apenas Manhã</option>
                <option value="Tarde">Apenas Tarde</option>
                <option value="Noite">Apenas Noite</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Ativo">Ativo</option>
                <option value="Licença">Em Licença</option>
                <option value="Inativo">Inativo</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Quantidade de Alunos Acompanhados
              </label>
              <Input
                type="number"
                min="0"
                value={formData.qtdAlunosAtendidos}
                onChange={(e) => setFormData({ ...formData, qtdAlunosAtendidos: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Observações / Histórico de Atuação
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
              rows={2}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Ex: Apoio exclusivo ao aluno João Silva nas aulas de Ciências e Matemática"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              {itemEdicao ? "Salvar Alterações" : "Cadastrar Profissional"}
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
            Tem certeza de que deseja remover este profissional?
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

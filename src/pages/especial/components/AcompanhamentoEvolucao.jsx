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
  const [modalVisualizar, setModalVisualizar] = useState({ aberto: false, item: null });
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

  const acompanhamentosFiltrados = acompanhamentos.filter(a => {
    const matchBusca =
      (a.alunoNome || "").toLowerCase().includes(busca.toLowerCase()) ||
      (a.parecerGeral || "").toLowerCase().includes(busca.toLowerCase()) ||
      (a.responsavelRegistro || "").toLowerCase().includes(busca.toLowerCase());
    const matchPeriodo = !filtroPeriodo || a.periodo === filtroPeriodo;
    return matchBusca && matchPeriodo;
  });

  const totalPages = Math.ceil(acompanhamentosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const acompanhamentosPaginados = acompanhamentosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const abrirModalNovo = () => {
    setItemEdicao(null);
    const alunoPadrao = alunos[0];
    setFormData({
      alunoId: alunoPadrao?.id || "",
      alunoNome: alunoPadrao?.nomeAluno || "",
      periodo: "1º Bimestre / Trimestre",
      dataRegistro: new Date().toISOString().split("T")[0],
      responsavelRegistro: profissionais[0]?.nome || "Professora Especialista AEE",
      evolucaoCognitiva: "Apresentou avanço consistente no reconhecimento de grafemas e na associação número-quantidade até 15.",
      evolucaoComunicacao: "Aumento do vocabulário funcional e maior utilização da prancha de CAA para expressar preferências alimentares e necessidades.",
      evolucaoMotora: "Melhoria na preensão do lápis após uso de adaptador ergonômico.",
      evolucaoSocialAutonomia: "Maior tolerância a mudanças de rotina e interação espontânea nos momentos de recreio monitorado.",
      conquistasRelevantes: "Completou atividades de pareamento de imagens de forma autônoma sem necessidade de redirecionamento contínuo.",
      desafiosPendentes: "Necessita de apoio na regulação emocional em momentos de transição de ambiente (ex: pátio para sala).",
      orientacoesFamilia: "Manter rotina visual consistente em casa e incentivar a autonomia no momento do banho e vestuário.",
      orientacoesSalaRegular: "Avisar com 5 minutos de antecedência antes de mudanças de atividade.",
      parecerGeral: "Desenvolvimento positivo e satisfatório no período, demonstrando excelente engajamento com os recursos adaptados."
    });
    setModalAberto(true);
  };

  const abrirModalEdicao = (item) => {
    setItemEdicao(item);
    setFormData({
      alunoId: item.alunoId || "",
      alunoNome: item.alunoNome || "",
      periodo: item.periodo || "1º Bimestre / Trimestre",
      dataRegistro: item.dataRegistro || "",
      responsavelRegistro: item.responsavelRegistro || "",
      evolucaoCognitiva: item.evolucaoCognitiva || "",
      evolucaoComunicacao: item.evolucaoComunicacao || "",
      evolucaoMotora: item.evolucaoMotora || "",
      evolucaoSocialAutonomia: item.evolucaoSocialAutonomia || "",
      conquistasRelevantes: item.conquistasRelevantes || "",
      desafiosPendentes: item.desafiosPendentes || "",
      orientacoesFamilia: item.orientacoesFamilia || "",
      orientacoesSalaRegular: item.orientacoesSalaRegular || "",
      parecerGeral: item.parecerGeral || ""
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
        mensagem: itemEdicao ? "Registro de evolução atualizado!" : "Novo parecer descritivo registrado com sucesso!"
      });
    } catch (err) {
      setNotificacao({
        tipo: "erro",
        titulo: "Erro",
        mensagem: "Erro ao salvar acompanhamento: " + err.message
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
        mensagem: "Registro removido com sucesso!"
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
              <i className="ti ti-chart-line text-blue-600 dark:text-blue-400" />
              Acompanhamento de Evolução & Pareceres Descritivos
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Registros periódicos do desenvolvimento integral, ganhos de autonomia e orientações pedagógicas
            </p>
          </div>
          <Button onClick={abrirModalNovo} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm">
            <i className="ti ti-plus" />
            Novo Parecer Descritivo
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar por aluno, parecer ou profissional..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                icon="ti ti-search"
              />
            </div>
            <div>
              <Select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)}>
                <option value="">Todos os períodos</option>
                {PERIODOS_AVALIACAO.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Cards de Pareceres */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {acompanhamentosPaginados.length === 0 ? (
              <div className="col-span-full p-8 text-center border-2 border-dashed rounded-xl text-gray-400">
                Nenhum parecer de evolução cadastrado.
              </div>
            ) : (
              acompanhamentosPaginados.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {item.alunoNome}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="primary">{item.periodo}</Badge>
                          <span className="text-xs text-gray-400">
                            {item.dataRegistro ? new Date(item.dataRegistro).toLocaleDateString("pt-BR") : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setModalVisualizar({ aberto: true, item })}
                          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="Visualizar Detalhes"
                        >
                          <i className="ti ti-eye" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => abrirModalEdicao(item)}
                          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="Editar"
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
                      </div>
                    </div>

                    <div className="space-y-2 text-xs mb-4">
                      {item.conquistasRelevantes && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                            <i className="ti ti-trophy mr-1" /> Conquistas Observadas:
                          </span>
                          <p className="text-emerald-900 dark:text-emerald-200 line-clamp-2">{item.conquistasRelevantes}</p>
                        </div>
                      )}

                      {item.parecerGeral && (
                        <div className="text-gray-600 dark:text-gray-300">
                          <span className="font-bold text-gray-800 dark:text-gray-200 block">Parecer Geral:</span>
                          <p className="line-clamp-2">{item.parecerGeral}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate max-w-[200px]">
                      <i className="ti ti-user-check mr-1 text-blue-500" />
                      {item.responsavelRegistro || "Prof. AEE"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setModalVisualizar({ aberto: true, item })}
                      className="text-xs flex items-center gap-1"
                    >
                      <i className="ti ti-file-description" />
                      Ler Parecer Completo
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
        title={itemEdicao ? "Editar Parecer Descritivo" : "Novo Registro de Parecer Descritivo"}
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
                    alunoNome: sel ? sel.nomeAluno : ""
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
                Período Avaliativo *
              </label>
              <Select
                value={formData.periodo}
                onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                required
              >
                {PERIODOS_AVALIACAO.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Data do Registro
              </label>
              <Input
                type="date"
                value={formData.dataRegistro}
                onChange={(e) => setFormData({ ...formData, dataRegistro: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Profissional Responsável pelo Parecer
              </label>
              <Select
                value={formData.responsavelRegistro}
                onChange={(e) => setFormData({ ...formData, responsavelRegistro: e.target.value })}
              >
                <option value="">Selecione...</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.nome}>{p.nome} ({p.funcao})</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              1. Desenvolvimento Cognitivo & Aprendizagem
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
              rows={2}
              value={formData.evolucaoCognitiva}
              onChange={(e) => setFormData({ ...formData, evolucaoCognitiva: e.target.value })}
              placeholder="Avanços em raciocínio, leitura, escrita, cálculo, memória e atenção..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              2. Comunicação, Linguagem & Expressão
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
              rows={2}
              value={formData.evolucaoComunicacao}
              onChange={(e) => setFormData({ ...formData, evolucaoComunicacao: e.target.value })}
              placeholder="Uso de fala funcional, pranchas de CAA, gestos, Libras e compreensão..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                3. Psicomotricidade & Habilidades Motoras
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
                rows={2}
                value={formData.evolucaoMotora}
                onChange={(e) => setFormData({ ...formData, evolucaoMotora: e.target.value })}
                placeholder="Coordenação motora fina/ampla, equilíbrio, preensão de objetos..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                4. Autonomia (AVD) & Interação Social
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
                rows={2}
                value={formData.evolucaoSocialAutonomia}
                onChange={(e) => setFormData({ ...formData, evolucaoSocialAutonomia: e.target.value })}
                placeholder="Convivência com pares, regulação emocional, alimentação, higiene..."
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Conquistas e Marcos Relevantes no Período
            </label>
            <Input
              value={formData.conquistasRelevantes}
              onChange={(e) => setFormData({ ...formData, conquistasRelevantes: e.target.value })}
              placeholder="Destaque os maiores progressos alcançados pelo aluno..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Orientações para os Professores da Sala Comum
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
                rows={2}
                value={formData.orientacoesSalaRegular}
                onChange={(e) => setFormData({ ...formData, orientacoesSalaRegular: e.target.value })}
                placeholder="Dicas práticas de mediação em sala..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Orientações para a Família
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
                rows={2}
                value={formData.orientacoesFamilia}
                onChange={(e) => setFormData({ ...formData, orientacoesFamilia: e.target.value })}
                placeholder="Sugestões de estímulo em ambiente domiciliar..."
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Parecer Conclusivo Síntese *
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm"
              rows={3}
              value={formData.parecerGeral}
              onChange={(e) => setFormData({ ...formData, parecerGeral: e.target.value })}
              placeholder="Síntese avaliativa global..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              {itemEdicao ? "Salvar Alterações" : "Registrar Parecer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE VISUALIZAÇÃO COMPLETA */}
      <Modal
        isOpen={modalVisualizar.aberto}
        onClose={() => setModalVisualizar({ aberto: false, item: null })}
        title="Parecer Descritivo de Evolução - Detalhes"
        size="lg"
      >
        {modalVisualizar.item && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60">
              <h3 className="text-base font-bold text-blue-900 dark:text-blue-300">
                {modalVisualizar.item.alunoNome}
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {modalVisualizar.item.periodo} • Registrado em {modalVisualizar.item.dataRegistro ? new Date(modalVisualizar.item.dataRegistro).toLocaleDateString("pt-BR") : ""} por {modalVisualizar.item.responsavelRegistro || "Prof. AEE"}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="border dark:border-gray-700 rounded-lg p-3">
                <span className="font-bold text-xs text-gray-500 uppercase block mb-1">Evolução Cognitiva & Aprendizagem</span>
                <p className="text-gray-800 dark:text-gray-200">{modalVisualizar.item.evolucaoCognitiva || "Sem registros específicos."}</p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-3">
                <span className="font-bold text-xs text-gray-500 uppercase block mb-1">Comunicação & Linguagem</span>
                <p className="text-gray-800 dark:text-gray-200">{modalVisualizar.item.evolucaoComunicacao || "Sem registros específicos."}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border dark:border-gray-700 rounded-lg p-3">
                  <span className="font-bold text-xs text-gray-500 uppercase block mb-1">Psicomotricidade</span>
                  <p className="text-gray-800 dark:text-gray-200 text-xs">{modalVisualizar.item.evolucaoMotora || "-"}</p>
                </div>
                <div className="border dark:border-gray-700 rounded-lg p-3">
                  <span className="font-bold text-xs text-gray-500 uppercase block mb-1">Autonomia & Social</span>
                  <p className="text-gray-800 dark:text-gray-200 text-xs">{modalVisualizar.item.evolucaoSocialAutonomia || "-"}</p>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 block mb-1">Conquistas & Destaques do Período</span>
                <p className="text-emerald-900 dark:text-emerald-200 text-xs">{modalVisualizar.item.conquistasRelevantes || "-"}</p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-3">
                <span className="font-bold text-xs text-gray-500 uppercase block mb-1">Parecer Geral Síntese</span>
                <p className="text-gray-800 dark:text-gray-200">{modalVisualizar.item.parecerGeral}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Orientações para Sala Regular:</span>
                  <p className="text-gray-600 dark:text-gray-400">{modalVisualizar.item.orientacoesSalaRegular || "-"}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Orientações para a Família:</span>
                  <p className="text-gray-600 dark:text-gray-400">{modalVisualizar.item.orientacoesFamilia || "-"}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t dark:border-gray-700">
              <Button onClick={() => setModalVisualizar({ aberto: false, item: null })}>
                Fechar
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
            Tem certeza de que deseja remover este parecer descritivo?
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

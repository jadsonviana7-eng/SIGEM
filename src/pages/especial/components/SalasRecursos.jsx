import React, { useState } from "react";
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
  NotificationModal
} from "../../../components/ui";

const EQUIPAMENTOS_PADRAO = [
  "Computador com leitor de tela (NVDA/DOSVOX)",
  "Teclado colmeia e mouse adaptado",
  "Impressora Braille",
  "Reglete e Punção",
  "Lupa eletrônica de mesa",
  "Software de CAA (Comunicação Aumentativa)",
  "Mobiliário ergonômico com plano inclinado",
  "Jogos de estimulação tátil e cognitiva",
  "Painel sensorial e tapete proprioceptivo",
  "Fones de cancelamento de ruído"
];

export default function SalasRecursos({
  salas = [],
  profissionais = [],
  onSalvar,
  onExcluir,
  escolaId,
  usuario
}) {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEdicao, setItemEdicao] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "Tipo I (Geral)",
    localizacao: "",
    capacidadeSimultanea: 4,
    turnos: "Manhã e Tarde",
    responsavel: "",
    equipamentos: [],
    recursosSensoriais: "",
    status: "Ativa",
    observacoes: ""
  });

  const [notificacao, setNotificacao] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, id: null });

  const salasFiltradas = salas.filter(s =>
    (s.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
    (s.tipo || "").toLowerCase().includes(busca.toLowerCase()) ||
    (s.localizacao || "").toLowerCase().includes(busca.toLowerCase())
  );

  const abrirModalNovo = () => {
    setItemEdicao(null);
    setFormData({
      nome: "Sala de Recursos Multifuncionais 01",
      tipo: "Tipo I (Geral)",
      localizacao: "Bloco Pedagógico - Térreo (Acesso Acessível)",
      capacidadeSimultanea: 4,
      turnos: "Manhã e Tarde",
      responsavel: profissionais[0]?.nome || "Professora Especialista em AEE",
      equipamentos: [
        "Computador com leitor de tela (NVDA/DOSVOX)",
        "Teclado colmeia e mouse adaptado",
        "Mobiliário ergonômico com plano inclinado",
        "Jogos de estimulação tátil e cognitiva"
      ],
      recursosSensoriais: "Iluminação dimerizável, tapete sensorial, almofadas terapêuticas e abafador acústico",
      status: "Ativa",
      observacoes: "Espaço climatizado com rampa e portas largas para cadeirantes."
    });
    setModalAberto(true);
  };

  const abrirModalEdicao = (item) => {
    setItemEdicao(item);
    setFormData({
      nome: item.nome || "",
      tipo: item.tipo || "Tipo I (Geral)",
      localizacao: item.localizacao || "",
      capacidadeSimultanea: item.capacidadeSimultanea || 4,
      turnos: item.turnos || "Manhã e Tarde",
      responsavel: item.responsavel || "",
      equipamentos: Array.isArray(item.equipamentos) ? item.equipamentos : [],
      recursosSensoriais: item.recursosSensoriais || "",
      status: item.status || "Ativa",
      observacoes: item.observacoes || ""
    });
    setModalAberto(true);
  };

  const toggleEquipamento = (equip) => {
    setFormData(prev => {
      const existe = prev.equipamentos.includes(equip);
      return {
        ...prev,
        equipamentos: existe
          ? prev.equipamentos.filter(e => e !== equip)
          : [...prev.equipamentos, equip]
      };
    });
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      await onSalvar(formData, itemEdicao?.id);
      setModalAberto(false);
      setNotificacao({
        tipo: "sucesso",
        titulo: "Sucesso",
        mensagem: itemEdicao ? "Sala de Recursos atualizada!" : "Sala de Recursos cadastrada com sucesso!"
      });
    } catch (err) {
      setNotificacao({
        tipo: "erro",
        titulo: "Erro",
        mensagem: "Erro ao salvar sala: " + err.message
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
        mensagem: "Sala de Recursos removida com sucesso!"
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
              <i className="ti ti-door-enter text-blue-600 dark:text-blue-400" />
              Salas de Recursos Multifuncionais (SRM) & Ambientes Acessíveis
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Controle de espaços adaptados, equipamentos de tecnologia assistiva e materiais pedagógicos especializados
            </p>
          </div>
          <Button onClick={abrirModalNovo} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm">
            <i className="ti ti-plus" />
            Cadastrar Nova Sala SRM
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6 max-w-md">
            <Input
              placeholder="Buscar por nome da sala, tipo ou bloco..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              icon="ti ti-search"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {salasFiltradas.length === 0 ? (
              <div className="col-span-full p-8 text-center border-2 border-dashed rounded-xl text-gray-400">
                Nenhuma Sala de Recursos cadastrada.
              </div>
            ) : (
              salasFiltradas.map((sala) => (
                <div
                  key={sala.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {sala.nome}
                          </h3>
                          <Badge variant={sala.status === "Ativa" ? "success" : "warning"}>
                            {sala.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                          {sala.tipo}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => abrirModalEdicao(sala)}
                          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <i className="ti ti-edit" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setModalConfirmacao({ aberto: true, id: sala.id })}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <i className="ti ti-trash" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl mb-4">
                      <div>
                        <span className="text-gray-400 block">Localização:</span>
                        <span className="font-semibold">{sala.localizacao || "Térreo acessível"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Capacidade Simultânea:</span>
                        <span className="font-semibold">{sala.capacidadeSimultanea || 4} alunos</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Turnos de Atendimento:</span>
                        <span className="font-semibold">{sala.turnos || "Manhã / Tarde"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Responsável Técnico:</span>
                        <span className="font-semibold truncate block">{sala.responsavel || "Prof. AEE"}</span>
                      </div>
                    </div>

                    {/* Equipamentos & Recursos */}
                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <i className="ti ti-devices text-blue-500" />
                        Tecnologias Assistivas & Equipamentos:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(sala.equipamentos) && sala.equipamentos.length > 0 ? (
                          sala.equipamentos.map((eq, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] border border-blue-200 dark:border-blue-800"
                            >
                              {eq}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Nenhum equipamento listado</span>
                        )}
                      </div>
                    </div>

                    {sala.recursosSensoriais && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/40">
                        <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-0.5">
                          <i className="ti ti-sparkles" /> Espaço / Recursos Sensoriais:
                        </span>
                        {sala.recursosSensoriais}
                      </div>
                    )}
                  </div>

                  {sala.observacoes && (
                    <p className="text-[11px] text-gray-400 mt-3 pt-2 border-t dark:border-gray-700 italic">
                      Obs: {sala.observacoes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={itemEdicao ? "Editar Sala de Recursos" : "Cadastrar Nova Sala de Recursos (SRM)"}
        size="lg"
      >
        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Nome da Sala / Identificação *
              </label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Tipo da Sala SRM *
              </label>
              <Select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                required
              >
                <option value="Tipo I (Geral - Deficiências Múltiplas/Intelectuais/TEA)">
                  Tipo I (Geral - Deficiências Intelectuais/TEA/Múltiplas)
                </option>
                <option value="Tipo II (Específica - Deficiência Visual / Cegueira)">
                  Tipo II (Específica - Deficiência Visual / Cegueira)
                </option>
                <option value="Espaço Sensorial / Regulação Terapêutica">
                  Espaço Sensorial / Regulação Terapêutica
                </option>
                <option value="Gabinete de Avaliação e Psicopedagogia">
                  Gabinete de Avaliação e Psicopedagogia
                </option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Localização / Bloco *
              </label>
              <Input
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                placeholder="Ex: Bloco Pedagógico - Térreo"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Responsável Técnico Principal
              </label>
              <Select
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              >
                <option value="">Selecione...</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.nome}>{p.nome} ({p.funcao})</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Capacidade Simultânea (Alunos)
              </label>
              <Input
                type="number"
                min="1"
                max="20"
                value={formData.capacidadeSimultanea}
                onChange={(e) => setFormData({ ...formData, capacidadeSimultanea: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Turnos de Atendimento
              </label>
              <Select
                value={formData.turnos}
                onChange={(e) => setFormData({ ...formData, turnos: e.target.value })}
              >
                <option value="Manhã e Tarde">Manhã e Tarde</option>
                <option value="Manhã">Apenas Manhã</option>
                <option value="Tarde">Apenas Tarde</option>
                <option value="Integral (Manhã, Tarde e Noite)">Integral</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-2">
              Selecione as Tecnologias Assistivas e Equipamentos Disponíveis:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl max-h-48 overflow-y-auto">
              {EQUIPAMENTOS_PADRAO.map((eq) => {
                const checked = formData.equipamentos.includes(eq);
                return (
                  <label
                    key={eq}
                    className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEquipamento(eq)}
                      className="rounded text-blue-600"
                    />
                    <span>{eq}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Recursos de Estimulação Sensorial e Regulação
            </label>
            <Input
              value={formData.recursosSensoriais}
              onChange={(e) => setFormData({ ...formData, recursosSensoriais: e.target.value })}
              placeholder="Ex: Iluminação dimerizável, tapetes táteis, almofada de peso, abafadores acústicos..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Status da Sala
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Ativa">Ativa</option>
                <option value="Em Manutenção">Em Manutenção</option>
                <option value="Em Reforma / Ampliação">Em Reforma / Ampliação</option>
                <option value="Inativa">Inativa</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Observações de Acessibilidade
              </label>
              <Input
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Ex: Rampas, portas de 90cm, piso tátil direcional"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              {itemEdicao ? "Salvar Alterações" : "Cadastrar Sala"}
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
            Tem certeza de que deseja remover esta Sala de Recursos?
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

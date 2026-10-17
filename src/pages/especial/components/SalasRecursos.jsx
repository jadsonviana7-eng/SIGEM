import React, { useState, useMemo } from "react";
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
import styles from "./SalasRecursos.module.css";

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

const TIPOS_SALA = [
  "Tipo I (Geral - Deficiências Intelectuais/TEA/Múltiplas)",
  "Tipo II (Específica - Deficiência Visual / Cegueira)",
  "Espaço Sensorial / Regulação Terapêutica",
  "Gabinete de Avaliação e Psicopedagogia"
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
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");

  // Controle de expansão de equipamentos por sala (id -> boolean)
  const [expandidoEquip, setExpandidoEquip] = useState({});

  // Modais
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEdicao, setItemEdicao] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, id: null });
  const [notificacao, setNotificacao] = useState(null);

  // Formulário
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "Tipo I (Geral - Deficiências Intelectuais/TEA/Múltiplas)",
    localizacao: "",
    capacidadeSimultanea: 4,
    turnos: "Manhã e Tarde",
    responsavel: "",
    equipamentos: [],
    recursosSensoriais: "",
    status: "Ativa",
    observacoes: ""
  });

  // Toggle de expansão de equipamentos
  const toggleVerMaisEquip = (salaId) => {
    setExpandidoEquip((prev) => ({
      ...prev,
      [salaId]: !prev[salaId]
    }));
  };

  // Filtragem
  const salasFiltradas = useMemo(() => {
    return salas.filter((s) => {
      const nome = (s.nome || "").toLowerCase();
      const tipo = (s.tipo || "").toLowerCase();
      const local = (s.localizacao || "").toLowerCase();
      const resp = (s.responsavel || "").toLowerCase();
      const termo = busca.toLowerCase();

      const matchBusca =
        !busca ||
        nome.includes(termo) ||
        tipo.includes(termo) ||
        local.includes(termo) ||
        resp.includes(termo);

      const matchTipo = !filtroTipo || (s.tipo || "").includes(filtroTipo);
      const matchStatus = !filtroStatus || (s.status || "Ativa") === filtroStatus;
      const matchTurno = !filtroTurno || (s.turnos || "").includes(filtroTurno);

      return matchBusca && matchTipo && matchStatus && matchTurno;
    });
  }, [salas, busca, filtroTipo, filtroStatus, filtroTurno]);

  // Estatísticas Rápidas
  const estatisticas = useMemo(() => {
    const totalSalas = salas.length;
    const capacidadeTotal = salas.reduce(
      (acc, s) => acc + (parseInt(s.capacidadeSimultanea, 10) || 0),
      0
    );
    const ativas = salas.filter((s) => (s.status || "Ativa") === "Ativa").length;

    // Equipamentos únicos
    const todosEquips = new Set();
    salas.forEach((s) => {
      if (Array.isArray(s.equipamentos)) {
        s.equipamentos.forEach((e) => todosEquips.add(e));
      }
    });

    return {
      totalSalas,
      capacidadeTotal,
      ativas,
      totalEquipamentos: todosEquips.size
    };
  }, [salas]);

  const temFiltroAtivo = busca || filtroTipo || filtroStatus || filtroTurno;

  const limparFiltros = () => {
    setBusca("");
    setFiltroTipo("");
    setFiltroStatus("");
    setFiltroTurno("");
  };

  const abrirModalNovo = () => {
    setItemEdicao(null);
    setFormData({
      nome: `Sala de Recursos Multifuncionais 0${salas.length + 1}`,
      tipo: "Tipo I (Geral - Deficiências Intelectuais/TEA/Múltiplas)",
      localizacao: "Bloco Pedagógico - Térreo (Acesso Adaptado)",
      capacidadeSimultanea: 4,
      turnos: "Manhã e Tarde",
      responsavel: profissionais[0]?.nome || "",
      equipamentos: [
        "Computador com leitor de tela (NVDA/DOSVOX)",
        "Teclado colmeia e mouse adaptado",
        "Mobiliário ergonômico com plano inclinado",
        "Jogos de estimulação tátil e cognitiva"
      ],
      recursosSensoriais: "Iluminação dimerizável, tapete sensorial e abafadores acústicos",
      status: "Ativa",
      observacoes: "Espaço climatizado, com rampa suave, corrimão duplo e portas de 90cm."
    });
    setModalAberto(true);
  };

  const abrirModalEdicao = (item) => {
    setItemEdicao(item);
    setFormData({
      nome: item.nome || "",
      tipo: item.tipo || "Tipo I (Geral - Deficiências Intelectuais/TEA/Múltiplas)",
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
    setFormData((prev) => {
      const existe = prev.equipamentos.includes(equip);
      return {
        ...prev,
        equipamentos: existe
          ? prev.equipamentos.filter((e) => e !== equip)
          : [...prev.equipamentos, equip]
      };
    });
  };

  const selecionarTodosEquipamentos = () => {
    setFormData((prev) => ({
      ...prev,
      equipamentos: [...EQUIPAMENTOS_PADRAO]
    }));
  };

  const desmarcarTodosEquipamentos = () => {
    setFormData((prev) => ({
      ...prev,
      equipamentos: []
    }));
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
          ? "Sala de Recursos Multifuncionais atualizada com sucesso!"
          : "Nova Sala de Recursos cadastrada com sucesso!"
      });
    } catch (err) {
      setNotificacao({
        tipo: "erro",
        titulo: "Erro",
        mensagem: "Erro ao salvar Sala de Recursos: " + err.message
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
        mensagem: "Erro ao excluir sala: " + err.message
      });
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Indicadores de Infraestrutura e Capacidade */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
            <i className="ti ti-door-enter" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.totalSalas}</span>
            <span className={styles.statLabel}>Salas SRM Cadastradas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <i className="ti ti-users" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.capacidadeTotal}</span>
            <span className={styles.statLabel}>Vagas Simultâneas (AEE)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8" }}>
            <i className="ti ti-devices" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.totalEquipamentos}</span>
            <span className={styles.statLabel}>Tecnologias Assistivas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}>
            <i className="ti ti-circle-check" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.ativas} / {estatisticas.totalSalas}</span>
            <span className={styles.statLabel}>Salas em Operação</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Cabeçalho & Botão de Cadastro */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-door text-indigo-400" />
            <span>Salas de Recursos Multifuncionais (SRM)</span>
          </div>
          <p className={styles.headerSubtitle}>
            Gestão de infraestrutura adaptada, ambientes sensoriais e tecnologias assistivas para o AEE
          </p>
        </div>

        <button type="button" onClick={abrirModalNovo} className={styles.btnNovo}>
          <i className="ti ti-plus" />
          <span>Cadastrar Nova Sala SRM</span>
        </button>
      </div>

      {/* 3. Barra de Filtros */}
      <div className={styles.filtersBar}>
        <div>
          <Input
            placeholder="Buscar por sala, tipo, localização ou responsável..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            icon="ti ti-search"
          />
        </div>

        <div>
          <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos os Tipos de Sala</option>
            <option value="Tipo I">Tipo I (Geral / TEA)</option>
            <option value="Tipo II">Tipo II (Deficiência Visual)</option>
            <option value="Espaço Sensorial">Espaço Sensorial</option>
            <option value="Gabinete">Gabinete / Avaliação</option>
          </Select>
        </div>

        <div>
          <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos os Status</option>
            <option value="Ativa">Ativas</option>
            <option value="Em Manutenção">Em Manutenção</option>
            <option value="Em Reforma / Ampliação">Em Reforma</option>
            <option value="Inativa">Inativas</option>
          </Select>
        </div>

        <div>
          <Select value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value)}>
            <option value="">Todos os Turnos</option>
            <option value="Manhã e Tarde">Manhã e Tarde</option>
            <option value="Manhã">Apenas Manhã</option>
            <option value="Tarde">Apenas Tarde</option>
            <option value="Integral">Integral</option>
          </Select>
        </div>

        {temFiltroAtivo && (
          <button type="button" onClick={limparFiltros} className={styles.btnClearFilters} title="Limpar Filtros">
            <i className="ti ti-x" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* 4. Grade de Cards das Salas de Recursos */}
      <div className={styles.salasGrid}>
        {salasFiltradas.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="ti ti-door-off" />
            <div className={styles.emptyStateTitle}>Nenhuma Sala de Recursos encontrada</div>
            <p className={styles.emptyStateSub}>
              {temFiltroAtivo
                ? "Tente ajustar os filtros de busca para encontrar as salas desejadas."
                : "Cadastre a primeira Sala de Recursos Multifuncionais para gerenciar os espaços de atendimento."}
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
                <i className="ti ti-plus" /> Cadastrar Sala SRM
              </button>
            )}
          </div>
        ) : (
          salasFiltradas.map((sala) => {
            const equips = Array.isArray(sala.equipamentos) ? sala.equipamentos : [];
            const isExpandido = !!expandidoEquip[sala.id];
            const MAX_EQUIPS_PREVIEW = 4;
            const equipsVisiveis = isExpandido ? equips : equips.slice(0, MAX_EQUIPS_PREVIEW);
            const equipsRestantes = equips.length - MAX_EQUIPS_PREVIEW;

            const statusVariant =
              sala.status === "Ativa"
                ? "success"
                : sala.status === "Em Manutenção"
                  ? "warning"
                  : sala.status === "Inativa"
                    ? "secondary"
                    : "info";

            return (
              <div key={sala.id} className={styles.salaCard}>
                {/* Topo do Card */}
                <div className={styles.cardTop}>
                  <div className={styles.cardTopLeft}>
                    <div className={styles.roomAvatar}>
                      <i className="ti ti-door-enter" />
                    </div>
                    <div className={styles.roomIdentity}>
                      <div className={styles.roomName}>{sala.nome}</div>
                      <div className={styles.roomTypeTag}>
                        <i className="ti ti-tag" />
                        <span>{sala.tipo || "Tipo I (Geral)"}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardTopActions}>
                    <Badge variant={statusVariant}>{sala.status || "Ativa"}</Badge>
                    <button
                      type="button"
                      className={`${styles.btnActionIcon} ${styles.btnActionEdit}`}
                      onClick={() => abrirModalEdicao(sala)}
                      title="Editar Sala"
                    >
                      <i className="ti ti-edit" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnActionIcon} ${styles.btnActionDelete}`}
                      onClick={() => setModalConfirmacao({ aberto: true, id: sala.id })}
                      title="Remover Sala"
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>

                {/* Grid de Especificações Técnicas */}
                <div className={styles.specsGrid}>
                  <div className={styles.specTile}>
                    <i className={`ti ti-map-pin ${styles.specTileIcon}`} />
                    <div className={styles.specTileContent}>
                      <span className={styles.specTileLabel}>Localização</span>
                      <span className={styles.specTileValue} title={sala.localizacao}>
                        {sala.localizacao || "Térreo Acessível"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.specTile}>
                    <i className={`ti ti-users ${styles.specTileIcon}`} />
                    <div className={styles.specTileContent}>
                      <span className={styles.specTileLabel}>Capacidade</span>
                      <span className={styles.specTileValue}>
                        {sala.capacidadeSimultanea || 4} alunos simultâneos
                      </span>
                    </div>
                  </div>

                  <div className={styles.specTile}>
                    <i className={`ti ti-clock ${styles.specTileIcon}`} />
                    <div className={styles.specTileContent}>
                      <span className={styles.specTileLabel}>Turnos</span>
                      <span className={styles.specTileValue}>{sala.turnos || "Manhã e Tarde"}</span>
                    </div>
                  </div>

                  <div className={styles.specTile}>
                    <i className={`ti ti-user-check ${styles.specTileIcon}`} />
                    <div className={styles.specTileContent}>
                      <span className={styles.specTileLabel}>Responsável</span>
                      <span className={styles.specTileValue} title={sala.responsavel}>
                        {sala.responsavel || "Prof. Especialista AEE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seção de Tecnologia Assistiva & Equipamentos */}
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeading}>
                    <i className="ti ti-devices text-indigo-400" />
                    <span>Tecnologias Assistivas & Equipamentos ({equips.length})</span>
                  </div>

                  <div className={styles.equipmentsWrap}>
                    {equips.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">
                        Nenhum equipamento catalogado
                      </span>
                    ) : (
                      <>
                        {equipsVisiveis.map((eq, idx) => (
                          <span key={idx} className={styles.equipTag}>
                            <i className="ti ti-check text-indigo-400" />
                            {eq}
                          </span>
                        ))}

                        {equipsRestantes > 0 && !isExpandido && (
                          <button
                            type="button"
                            onClick={() => toggleVerMaisEquip(sala.id)}
                            className={`${styles.equipTag} ${styles.equipTagMore}`}
                          >
                            +{equipsRestantes} equipamentos...
                          </button>
                        )}

                        {isExpandido && equips.length > MAX_EQUIPS_PREVIEW && (
                          <button
                            type="button"
                            onClick={() => toggleVerMaisEquip(sala.id)}
                            className={`${styles.equipTag} ${styles.equipTagMore}`}
                          >
                            Mostrar menos
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Recursos Sensoriais */}
                {sala.recursosSensoriais && (
                  <div className={styles.sensorialBox}>
                    <i className={`ti ti-sparkles ${styles.sensorialIcon}`} />
                    <div>
                      <strong style={{ color: "#fbbf24", display: "block", marginBottom: 2 }}>
                        Recursos Sensoriais & Regulação:
                      </strong>
                      <span>{sala.recursosSensoriais}</span>
                    </div>
                  </div>
                )}

                {/* Acessibilidade & Observações */}
                {sala.observacoes && (
                  <div className={styles.accessBox}>
                    <i className={`ti ti-accessible ${styles.accessIcon}`} />
                    <div>
                      <strong style={{ color: "#34d399", display: "block", marginBottom: 2 }}>
                        Acessibilidade & Estrutura:
                      </strong>
                      <span>{sala.observacoes}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL DE CADASTRO/EDIÇÃO */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={itemEdicao ? "Editar Sala de Recursos (SRM)" : "Cadastrar Nova Sala de Recursos (SRM)"}
        size="lg"
        semRodape
      >
        <form onSubmit={handleSalvar} className={styles.modalForm}>
          {/* 1. Nome da Sala */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Nome da Sala / Identificação <span className={styles.fieldRequired}>*</span>
            </label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Sala de Recursos Multifuncionais 01"
              required
            />
          </div>

          {/* 2. Tipo da Sala SRM */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Tipo da Sala SRM <span className={styles.fieldRequired}>*</span>
            </label>
            <Select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              required
            >
              {TIPOS_SALA.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          {/* 3. Localização / Bloco */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Localização / Bloco <span className={styles.fieldRequired}>*</span>
            </label>
            <Input
              value={formData.localizacao}
              onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
              placeholder="Ex: Bloco Pedagógico - Térreo (Acesso Adaptado)"
              required
            />
          </div>

          {/* 4. Responsável Técnico Principal */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Responsável Técnico Principal
            </label>
            <Select
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
            >
              <option value="">Selecione o profissional...</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.nome}>
                  {p.nome} - {p.funcao || "Prof. AEE"}
                </option>
              ))}
            </Select>
          </div>

          {/* 5. Capacidade Simultânea */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Capacidade Simultânea (Alunos por Sessão)
            </label>
            <Input
              type="number"
              min="1"
              max="20"
              value={formData.capacidadeSimultanea}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacidadeSimultanea: parseInt(e.target.value, 10) || 1
                })
              }
            />
          </div>

          {/* 6. Turnos de Atendimento */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
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

          {/* 7. Seleção de Equipamentos (1 por Linha) */}
          <div className={styles.equipmentsSection}>
            <div className={styles.equipmentsHeader}>
              <div className={styles.equipmentsTitle}>
                <i className="ti ti-devices text-indigo-400" />
                <span>Tecnologias Assistivas e Equipamentos Disponíveis ({formData.equipamentos.length})</span>
              </div>
              <div className={styles.equipmentsActions}>
                <button
                  type="button"
                  onClick={selecionarTodosEquipamentos}
                  className={styles.btnActionLink}
                >
                  Marcar todos
                </button>
                <span style={{ color: "var(--text-muted, #94a3b8)", fontSize: 12 }}>·</span>
                <button
                  type="button"
                  onClick={desmarcarTodosEquipamentos}
                  className={styles.btnActionLink}
                  style={{ color: "var(--text-muted, #94a3b8)" }}
                >
                  Desmarcar
                </button>
              </div>
            </div>

            <div className={styles.equipmentsList}>
              {EQUIPAMENTOS_PADRAO.map((eq) => {
                const checked = formData.equipamentos.includes(eq);
                return (
                  <label
                    key={eq}
                    className={`${styles.equipmentItem} ${checked ? styles.equipmentItemChecked : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEquipamento(eq)}
                      className={styles.checkboxInput}
                    />
                    <span className={styles.equipmentItemText}>{eq}</span>
                    {checked && (
                      <i className={`ti ti-check ${styles.equipmentItemCheck}`} />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* 8. Recursos Sensoriais */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              <i className="ti ti-sparkles text-amber-400" />
              Recursos de Estimulação Sensorial e Regulação Emocional
            </label>
            <Input
              value={formData.recursosSensoriais}
              onChange={(e) => setFormData({ ...formData, recursosSensoriais: e.target.value })}
              placeholder="Ex: Iluminação dimerizável, tapetes táteis, almofadas ponderadas, abafadores acústicos..."
            />
          </div>

          {/* 9. Status Operacional da Sala */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Status Operacional da Sala
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Ativa">Ativa no AEE</option>
              <option value="Em Manutenção">Em Manutenção Técnica</option>
              <option value="Em Reforma / Ampliação">Em Reforma / Ampliação</option>
              <option value="Inativa">Inativa Temporariamente</option>
            </Select>
          </div>

          {/* 10. Condições de Acessibilidade Arquitetônica */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              <i className="ti ti-accessible text-emerald-400" />
              Condições de Acessibilidade Arquitetônica
            </label>
            <Input
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Ex: Rampas de acesso, portas 90cm, climatização, piso tátil..."
            />
          </div>

          {/* Rodapé de Ações do Modal */}
          <div className={styles.modalFooter}>
            <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {itemEdicao ? "Salvar Alterações" : "Cadastrar Sala"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        isOpen={modalConfirmacao.aberto}
        onClose={() => setModalConfirmacao({ aberto: false, id: null })}
        title="Confirmar Exclusão de Sala"
        semRodape
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tem certeza de que deseja remover esta Sala de Recursos Multifuncionais?
            Esta ação não poderá ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalConfirmacao({ aberto: false, id: null })}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleExcluir}>
              Sim, Excluir Sala
            </Button>
          </div>
        </div>
      </Modal>

      {/* 7. MODAL DE NOTIFICAÇÕES */}
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

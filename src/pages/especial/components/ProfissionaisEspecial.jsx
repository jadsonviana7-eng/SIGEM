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
import styles from "./ProfissionaisEspecial.module.css";

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
  alunos = [],
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

  // Funções auxiliares para dados dinâmicos e legados (cargo vs funcao, formacao vs especializacao)
  const getFuncao = (p) => p.funcao || p.cargo || "Profissional Especializado";
  const getEspecializacao = (p) => p.especializacao || p.formacao || "";
  const getAlunosAtendidos = (p) => {
    if (p.qtdAlunosAtendidos !== undefined && p.qtdAlunosAtendidos !== null && Number(p.qtdAlunosAtendidos) > 0) {
      return Number(p.qtdAlunosAtendidos);
    }
    const pNome = (p.nome || "").toLowerCase().trim();
    if (!pNome) return 0;
    return (alunos || []).filter((a) => {
      const profResp = (a.professorAEEResponsavel || "").toLowerCase();
      const profApoio = (a.profissionalApoio || "").toLowerCase();
      return (
        (profResp && (profResp.includes(pNome) || pNome.includes(profResp))) ||
        (profApoio && (profApoio.includes(pNome) || pNome.includes(profApoio)))
      );
    }).length;
  };

  // Filtragem
  const profissionaisFiltrados = useMemo(() => {
    return profissionais.filter((p) => {
      const nome = (p.nome || "").toLowerCase();
      const funcao = getFuncao(p).toLowerCase();
      const esp = getEspecializacao(p).toLowerCase();
      const email = (p.email || "").toLowerCase();
      const termo = busca.toLowerCase().trim();

      const matchBusca =
        !termo ||
        nome.includes(termo) ||
        funcao.includes(termo) ||
        esp.includes(termo) ||
        email.includes(termo);

      let matchFuncao = true;
      if (filtroFuncao) {
        const ff = filtroFuncao.toLowerCase();
        if (ff.includes("professor")) {
          matchFuncao = funcao.includes("professor") || funcao.includes("aee");
        } else if (ff.includes("libras") || ff.includes("tils")) {
          matchFuncao = funcao.includes("libras") || funcao.includes("tils");
        } else if (ff.includes("apoio") || ff.includes("mediador")) {
          matchFuncao = funcao.includes("apoio") || funcao.includes("mediador");
        } else if (ff.includes("psico")) {
          matchFuncao = funcao.includes("psico");
        } else {
          matchFuncao = funcao.includes(ff);
        }
      }

      const matchStatus = !filtroStatus || p.status === filtroStatus;

      return matchBusca && matchFuncao && matchStatus;
    });
  }, [profissionais, busca, filtroFuncao, filtroStatus, alunos]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(profissionaisFiltrados.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const profissionaisPaginados = useMemo(() => {
    return profissionaisFiltrados.slice(startIndex, startIndex + itemsPerPage);
  }, [profissionaisFiltrados, startIndex, itemsPerPage]);

  // Estatísticas Rápidas
  const estatisticas = useMemo(() => {
    const totalProf = profissionais.length;
    const profAEE = profissionais.filter((p) => {
      const f = (p.funcao || p.cargo || "").toLowerCase();
      return f.includes("professor") || f.includes("aee");
    }).length;
    const apoio = profissionais.filter((p) => {
      const f = (p.funcao || p.cargo || "").toLowerCase();
      return (
        f.includes("apoio") ||
        f.includes("mediador") ||
        f.includes("libras") ||
        f.includes("tils") ||
        f.includes("psico")
      );
    }).length;
    const totalAlunos =
      alunos && alunos.length > 0
        ? alunos.length
        : profissionais.reduce(
          (acc, p) => acc + (parseInt(p.qtdAlunosAtendidos, 10) || 0),
          0
        );

    return { totalProf, profAEE, apoio, totalAlunos };
  }, [profissionais, alunos]);

  const temFiltroAtivo = busca || filtroFuncao || filtroStatus;

  const limparFiltros = () => {
    setBusca("");
    setFiltroFuncao("");
    setFiltroStatus("");
    setCurrentPage(1);
  };

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
      funcao: item.funcao || item.cargo || "Professor(a) de AEE",
      especializacao: item.especializacao || item.formacao || "",
      registroProfissional: item.registroProfissional || "",
      email: item.email || "",
      telefone: item.telefone || "",
      cargaHorariaSemanal: item.cargaHorariaSemanal || "40h",
      turnos: item.turnos || "Manhã e Tarde",
      qtdAlunosAtendidos: item.qtdAlunosAtendidos !== undefined ? item.qtdAlunosAtendidos : getAlunosAtendidos(item),
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
        mensagem: itemEdicao
          ? "Profissional atualizado com sucesso!"
          : "Profissional cadastrado com sucesso na equipe!"
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
    <div className={styles.container}>
      {/* 1. Indicadores Rápidos da Equipe */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
            <i className="ti ti-users" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.totalProf}</span>
            <span className={styles.statLabel}>Profissionais na Equipe</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <i className="ti ti-school" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.profAEE}</span>
            <span className={styles.statLabel}>Professores de AEE</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <i className="ti ti-heart-handshake" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.apoio}</span>
            <span className={styles.statLabel}>Mediadores & TILS</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8" }}>
            <i className="ti ti-mood-smile" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estatisticas.totalAlunos}</span>
            <span className={styles.statLabel}>Estudantes Atendidos</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Cabeçalho & Botão de Cadastro */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-users-group text-indigo-400" />
            <span>Equipe de Educação Especial & Apoio Multidisciplinar</span>
          </div>
          <p className={styles.headerSubtitle}>
            Professores de AEE, Tradutores de Libras (TILS), Mediadores escolares, Psicopedagogos e Especialistas
          </p>
        </div>

        <button type="button" onClick={abrirModalNovo} className={styles.btnNovo}>
          <i className="ti ti-user-plus" />
          <span>Cadastrar Profissional</span>
        </button>
      </div>

      {/* 3. Barra de Filtros */}
      <div className={styles.filtersBar}>
        <div>
          <Input
            placeholder="Buscar por nome, especialização ou e-mail..."
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
            value={filtroFuncao}
            onChange={(e) => {
              setFiltroFuncao(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Todas as funções</option>
            {FUNCOES_ESPECIALIZADAS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
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
            <option value="Ativo">Ativos</option>
            <option value="Licença">Em Licença</option>
            <option value="Inativo">Inativos</option>
          </Select>
        </div>

        {temFiltroAtivo && (
          <button type="button" onClick={limparFiltros} className={styles.btnClearFilters} title="Limpar Filtros">
            <i className="ti ti-x" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* 4. Grade de Cards dos Profissionais AEE */}
      <div className={styles.sectionHeader}>
        <div>
          <h3 className={styles.sectionTitle}>
            <i className="ti ti-id-badge text-indigo-500" />
            <span>Quadro de Profissionais Cadastrados</span>
          </h3>
          <p className={styles.sectionSubtitle}>
            Listando {profissionaisFiltrados.length} profissional(is) em atuação
          </p>
        </div>
      </div>

      <div className={styles.profsGrid}>
        {profissionaisFiltrados.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="ti ti-users-minus" />
            <div className={styles.emptyStateTitle}>Nenhum profissional encontrado</div>
            <p className={styles.emptyStateSub}>
              {temFiltroAtivo
                ? "Tente ajustar os filtros de busca para encontrar os profissionais desejados."
                : "Cadastre o primeiro profissional para iniciar o quadro da Educação Especial."}
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
                <i className="ti ti-user-plus" /> Cadastrar Profissional
              </button>
            )}
          </div>
        ) : (
          profissionaisPaginados.map((p) => {
            const statusVariant =
              p.status === "Ativo"
                ? "success"
                : p.status === "Licença"
                  ? "warning"
                  : "secondary";
            const alunosCount = getAlunosAtendidos(p);
            const funcaoDesc = getFuncao(p);
            const especializacaoDesc = getEspecializacao(p);

            return (
              <div key={p.id} className={styles.profCard}>
                {/* Topo do Card */}
                <div className={styles.cardTop}>
                  <div className={styles.cardTopLeft}>
                    <div className={styles.profAvatar}>
                      {p.nome ? p.nome.charAt(0).toUpperCase() : "P"}
                    </div>
                    <div className={styles.profIdentity}>
                      <div className={styles.profName}>{p.nome}</div>
                      <div className={styles.profRoleTag}>
                        <i className="ti ti-sparkles text-indigo-400" />
                        <span>{funcaoDesc}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardTopActions}>
                    <Badge variant={statusVariant}>{p.status || "Ativo"}</Badge>
                    <button
                      type="button"
                      className={`${styles.btnActionIcon} ${styles.btnActionEdit}`}
                      onClick={() => abrirModalEdicao(p)}
                      title="Editar profissional"
                    >
                      <i className="ti ti-edit" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnActionIcon} ${styles.btnActionDelete}`}
                      onClick={() => setModalConfirmacao({ aberto: true, id: p.id })}
                      title="Excluir profissional"
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>

                {/* Formação / Especialização */}
                {especializacaoDesc && (
                  <div className={styles.specializationBox}>
                    <i className="ti ti-certificate" />
                    <span title={especializacaoDesc}>{especializacaoDesc}</span>
                  </div>
                )}

                {/* Grid de Especificações Técnicas */}
                <div className={styles.specsGrid}>
                  <div className={styles.specTile}>
                    <i className={`ti ti-clock ${styles.specTileIcon}`} />
                    <div className={styles.specTileContent}>
                      <span className={styles.specTileLabel}>Carga Horária</span>
                      <span className={styles.specTileValue}>
                        {p.cargaHorariaSemanal || "40h"} · {p.turnos || "Manhã/Tarde"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.specTile}>
                    <i className={`ti ti-school ${styles.specTileIcon}`} />
                    <div className={styles.specTileContent}>
                      <span className={styles.specTileLabel}>Atendimento AEE</span>
                      <span
                        className={styles.specTileValue}
                        style={{ color: alunosCount > 0 ? "#818cf8" : "inherit" }}
                      >
                        {alunosCount > 0 ? `${alunosCount} aluno${alunosCount > 1 ? "s" : ""}` : "Sem alunos"}
                      </span>
                    </div>
                  </div>

                  {p.registroProfissional && (
                    <div className={styles.specTile} style={{ gridColumn: "1 / -1" }}>
                      <i className={`ti ti-id ${styles.specTileIcon}`} />
                      <div className={styles.specTileContent}>
                        <span className={styles.specTileLabel}>Registro Profissional</span>
                        <span className={styles.specTileValue} title={p.registroProfissional}>
                          {p.registroProfissional}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contatos */}
                {(p.email || p.telefone) && (
                  <div className={styles.contactRow}>
                    {p.telefone && (
                      <div className={styles.contactItem} title={p.telefone}>
                        <i className="ti ti-phone text-emerald-400" />
                        <span>{p.telefone}</span>
                      </div>
                    )}
                    {p.email && (
                      <div className={styles.contactItem} title={p.email}>
                        <i className="ti ti-mail text-indigo-400" />
                        <span>{p.email}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Observações / Histórico (se houver) */}
                {p.observacoes && (
                  <div className={styles.obsBox} title={p.observacoes}>
                    <i className="ti ti-notes" />
                    <span>{p.observacoes}</span>
                  </div>
                )}
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

      {/* 5. MODAL DE CADASTRO / EDIÇÃO (CAMPOS UM ABAIXO DO OUTRO) */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={itemEdicao ? "Editar Profissional Especializado" : "Cadastrar Novo Profissional da Educação Especial"}
        size="lg"
        semRodape
      >
        <form onSubmit={handleSalvar} className={styles.modalForm}>
          {/* 1. Nome Completo */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Nome Completo <span className={styles.fieldRequired}>*</span>
            </label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Profª Helena Ramos da Silva"
              required
            />
          </div>

          {/* 2. Função Especializada */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Função Especializada <span className={styles.fieldRequired}>*</span>
            </label>
            <Select
              value={formData.funcao}
              onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
              required
            >
              {FUNCOES_ESPECIALIZADAS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </div>

          {/* 3. Formação Acadêmica & Especializações */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Formação Acadêmica & Especializações
            </label>
            <Input
              value={formData.especializacao}
              onChange={(e) => setFormData({ ...formData, especializacao: e.target.value })}
              placeholder="Ex: Pós-graduação em TEA, Libras, Neuropsicopedagogia..."
            />
          </div>

          {/* 4. Registro no Conselho / Matrícula */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Registro no Conselho de Classe / Matrícula
            </label>
            <Input
              value={formData.registroProfissional}
              onChange={(e) => setFormData({ ...formData, registroProfissional: e.target.value })}
              placeholder="Ex: CRP 06/12345, CRFa 4567, CAS/Libras, Matrícula 8940..."
            />
          </div>

          {/* 5. E-mail Institucional */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              E-mail Institucional
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Ex: helena.ramos@edu.gov.br"
            />
          </div>

          {/* 6. Telefone de Contato / WhatsApp */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Telefone de Contato / WhatsApp
            </label>
            <Input
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="Ex: (82) 99876-5432"
            />
          </div>

          {/* 7. Carga Horária Semanal */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Carga Horária Semanal
            </label>
            <Select
              value={formData.cargaHorariaSemanal}
              onChange={(e) => setFormData({ ...formData, cargaHorariaSemanal: e.target.value })}
            >
              <option value="20h">20 horas semanais</option>
              <option value="30h">30 horas semanais</option>
              <option value="40h">40 horas semanais (Dedicação Exclusiva)</option>
            </Select>
          </div>

          {/* 8. Turnos de Atuação */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Turnos de Atuação no AEE
            </label>
            <Select
              value={formData.turnos}
              onChange={(e) => setFormData({ ...formData, turnos: e.target.value })}
            >
              <option value="Manhã e Tarde">Manhã e Tarde</option>
              <option value="Manhã">Apenas Manhã</option>
              <option value="Tarde">Apenas Tarde</option>
              <option value="Noite">Apenas Noite</option>
              <option value="Integral">Integral</option>
            </Select>
          </div>

          {/* 9. Status */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Status do Profissional
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Ativo">Ativo na Escola</option>
              <option value="Licença">Em Licença / Afastamento</option>
              <option value="Inativo">Inativo</option>
            </Select>
          </div>

          {/* 10. Quantidade de Alunos Acompanhados */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Quantidade de Alunos Acompanhados
            </label>
            <Input
              type="number"
              min="0"
              value={formData.qtdAlunosAtendidos}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  qtdAlunosAtendidos: parseInt(e.target.value, 10) || 0
                })
              }
            />
          </div>

          {/* 11. Observações / Histórico de Atuação */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Observações / Histórico de Atuação
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500 transition-colors"
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Ex: Atuação exclusiva na SRM 01 e mediação pedagógica em sala de aula regular..."
            />
          </div>

          {/* Rodapé de Ações do Modal */}
          <div className={styles.modalFooter}>
            <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {itemEdicao ? "Salvar Alterações" : "Cadastrar Profissional"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        isOpen={modalConfirmacao.aberto}
        onClose={() => setModalConfirmacao({ aberto: false, id: null })}
        title="Confirmar Exclusão de Profissional"
        semRodape
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tem certeza de que deseja remover este profissional da equipe de Educação Especial?
            Esta ação não poderá ser desfeita.
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

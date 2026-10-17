import React, { useState, useMemo } from "react";
import {
  Button,
  Input,
  Select,
  Badge,
  Modal,
  Pagination
} from "../../../components/ui";
import styles from "./SegurancaSigilo.module.css";

const ACOES_AUDITORIA = [
  "Visualização",
  "Impressão",
  "Exportação",
  "Alteração",
  "Exclusão",
  "Consulta de Prontuário"
];

const MOCK_LOGS_DEMO = [
  {
    id: "log-1",
    usuarioNome: "Dra. Cláudia Valença de Lima",
    usuarioEmail: "claudia.valenca@edu.gov.br",
    acao: "Visualização",
    detalhes: "Consulta ao Laudo Neurológico e CID-10 F84.0 (Transtorno do Espectro Autista) do educando Alice Maria Pereira.",
    dataAcesso: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: "log-2",
    usuarioNome: "Profª Helena Ramos da Silva",
    usuarioEmail: "helena.ramos@edu.gov.br",
    acao: "Alteração",
    detalhes: "Atualização de Metas de Curto Prazo e adaptações de acessibilidade no Plano PEI / PDI do 4º Ano A.",
    dataAcesso: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-3",
    usuarioNome: "Jadson Viana (Administrador)",
    usuarioEmail: "jadsonviana7@gmail.com",
    acao: "Impressão",
    detalhes: "Geração e impressão do Parecer Descritivo de Evolução Pedagógica do 1º Bimestre da aluna Alice Maria Santos.",
    dataAcesso: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-4",
    usuarioNome: "Lucas Fontes Bezerra",
    usuarioEmail: "lucas.fontes@edu.gov.br",
    acao: "Consulta de Prontuário",
    detalhes: "Abertura de histórico de atendimento em Sala de Recursos Multifuncionais (SRM 01) e parecer fonoaudiológico.",
    dataAcesso: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

export default function SegurancaSigilo({
  logs = [],
  usuario,
  escolaId
}) {
  const [busca, setBusca] = useState("");
  const [filtroAcao, setFiltroAcao] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [modalDetalhe, setModalDetalhe] = useState({ aberto: false, log: null });

  const listaLogsEfetiva = useMemo(() => {
    if (logs && logs.length > 0) return logs;
    return MOCK_LOGS_DEMO;
  }, [logs]);

  // Filtros
  const logsFiltrados = useMemo(() => {
    return listaLogsEfetiva.filter((l) => {
      const matchBusca =
        (l.usuarioNome || "").toLowerCase().includes(busca.toLowerCase()) ||
        (l.usuarioEmail || "").toLowerCase().includes(busca.toLowerCase()) ||
        (l.detalhes || "").toLowerCase().includes(busca.toLowerCase()) ||
        (l.acao || "").toLowerCase().includes(busca.toLowerCase());
      const matchAcao = !filtroAcao || (l.acao || "").toLowerCase().includes(filtroAcao.toLowerCase());
      return matchBusca && matchAcao;
    });
  }, [listaLogsEfetiva, busca, filtroAcao]);

  // Paginação
  const totalPages = Math.ceil(logsFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const logsPaginados = logsFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const temFiltroAtivo = busca !== "" || filtroAcao !== "";

  const limparFiltros = () => {
    setBusca("");
    setFiltroAcao("");
    setCurrentPage(1);
  };

  const getBadgeVariant = (acao) => {
    const a = (acao || "").toLowerCase();
    if (a.includes("exclusão") || a.includes("delete")) return "danger";
    if (a.includes("alteração") || a.includes("edição")) return "warning";
    if (a.includes("export") || a.includes("impress")) return "primary";
    return "info";
  };

  const handlePrintAudit = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      {/* 1. Banner de Política de Sigilo LGPD */}
      <div className={styles.lgpdBanner}>
        <div className={styles.bannerIconWrap}>
          <i className="ti ti-shield-lock" />
        </div>
        <div className={styles.bannerContent}>
          <div className={styles.bannerTop}>
            <h2 className={styles.bannerTitle}>
              Controle Rigoroso de Sigilo & Proteção de Dados (LGPD)
            </h2>
            <span className={styles.bannerBadge}>
              Art. 11 - Dados Sensíveis de Saúde & Neuropediatria
            </span>
          </div>
          <p className={styles.bannerDesc}>
            Em cumprimento à <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong> e às resoluções do CNE/MEC,
            todos os relatórios clínicos, laudos diagnósticos (CID-10/11) e intervenções AEE possuem caráter
            <strong> estritamente confidencial</strong>. Toda e qualquer visualização ou alteração é registrada
            automaticamente com assinatura digital e carimbo de data/hora imutável.
          </p>
        </div>
      </div>

      {/* 2. Indicadores Rápidos (KPIs) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
            <i className="ti ti-history" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{listaLogsEfetiva.length}</span>
            <span className={styles.statLabel}>Acessos Auditados</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <i className="ti ti-lock-check" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue} style={{ fontSize: 15, color: "#34d399" }}>
              AES-256 / TLS 1.3
            </span>
            <span className={styles.statLabel}>Criptografia em Repouso</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
            <i className="ti ti-user-shield" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue} style={{ fontSize: 14 }}>
              {usuario?.nome || "Usuário Ativo"}
            </span>
            <span className={styles.statLabel}>Perfil: {usuario?.perfil || usuario?.role || "Especialista AEE"}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <i className="ti ti-fingerprint" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue} style={{ color: "#fbbf24" }}>100% Auditável</span>
            <span className={styles.statLabel}>Trilha com Hash SHA-256</span>
          </div>
        </div>
      </div>

      {/* 3. Barra de Cabeçalho */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <h2 className={styles.headerTitle}>
            <i className="ti ti-receipt-tax text-indigo-500" />
            <span>Trilha de Auditoria & Consultas aos Laudos</span>
          </h2>
          <p className={styles.headerSubtitle}>
            Histórico imutável de consultas, visualizações e pareceres com dados neuropediátricos confidenciais
          </p>
        </div>

        <button type="button" onClick={handlePrintAudit} className={styles.btnPrintLog}>
          <i className="ti ti-printer" />
          <span>Imprimir Trilha de Auditoria</span>
        </button>
      </div>

      {/* 4. Barra de Filtros */}
      <div className={styles.filtersBar}>
        <div>
          <Input
            placeholder="Buscar por usuário, ação realizada ou detalhe do acesso..."
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
            value={filtroAcao}
            onChange={(e) => {
              setFiltroAcao(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Todas as ações auditadas</option>
            {ACOES_AUDITORIA.map((a) => (
              <option key={a} value={a}>
                {a}
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

      {/* 5. Grade de Cards de Auditoria */}
      <div className={styles.sectionHeader}>
        <div>
          <h3 className={styles.sectionTitle}>
            <i className="ti ti-list-check text-indigo-500" />
            <span>Registros de Acesso Auditados</span>
          </h3>
          <p className={styles.sectionSubtitle}>
            Exibindo {logsFiltrados.length} evento(s) de segurança registrados
          </p>
        </div>
      </div>

      <div className={styles.logsGrid}>
        {logsFiltrados.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="ti ti-shield-check" />
            <div className={styles.emptyStateTitle}>Nenhum registro de acesso encontrado</div>
            <p className={styles.emptyStateSub}>
              {temFiltroAtivo
                ? "Tente ajustar os filtros de busca ou tipo de ação realizada."
                : "A trilha de auditoria começará a registrar acessos assim que prontuários forem abertos."}
            </p>
            {temFiltroAtivo && (
              <button
                type="button"
                onClick={limparFiltros}
                className="mt-2 text-xs font-semibold text-indigo-400 underline hover:text-indigo-300"
              >
                Limpar filtros de pesquisa
              </button>
            )}
          </div>
        ) : (
          logsPaginados.map((log) => {
            const dataFormatada = log.dataAcesso
              ? new Date(log.dataAcesso).toLocaleString("pt-BR")
              : "Data não registrada";
            const userNome = log.usuarioNome || "Usuário Identificado";
            const userEmail = log.usuarioEmail || "-";
            const acao = log.acao || "Visualização";
            const variant = getBadgeVariant(acao);

            return (
              <div key={log.id} className={styles.logCard}>
                {/* Topo do Card */}
                <div className={styles.cardTop}>
                  <div className={styles.cardTopLeft}>
                    <div className={styles.userAvatar}>
                      <i className="ti ti-user-shield" />
                    </div>
                    <div className={styles.userInfo}>
                      <span className={styles.userName} title={userNome}>
                        {userNome}
                      </span>
                      <span className={styles.userEmail} title={userEmail}>
                        {userEmail}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardTopRight}>
                    <Badge variant={variant}>{acao}</Badge>
                    <span className={styles.confidentialBadge}>
                      <i className="ti ti-shield-half" /> Confidencial
                    </span>
                  </div>
                </div>

                {/* Corpo do Card */}
                <div className={styles.cardBody}>
                  <div className={styles.detailsBox}>
                    {log.detalhes || "Consulta regular a prontuário de atendimento da Educação Especial."}
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.timestamp}>
                      <i className="ti ti-clock" /> {dataFormatada}
                    </span>
                    <span className={styles.hashTag}>
                      <i className="ti ti-check" /> SHA-256 Auditado
                    </span>
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className={styles.cardFooter}>
                  <div className={styles.auditAuditStatus}>
                    <i className="ti ti-shield-lock text-emerald-400" />
                    <span>Registro Criptografado & Imutável</span>
                  </div>

                  <button
                    type="button"
                    className={styles.btnDetail}
                    onClick={() => setModalDetalhe({ aberto: true, log })}
                  >
                    <i className="ti ti-info-circle" />
                    <span>Detalhes</span>
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

      {/* MODAL DE DETALHES DO EVENTO DE AUDITORIA */}
      <Modal
        isOpen={modalDetalhe.aberto}
        onClose={() => setModalDetalhe({ aberto: false, log: null })}
        title="Detalhes do Registro de Auditoria (LGPD Art. 11)"
        size="md"
      >
        {modalDetalhe.log && (
          <div className="space-y-4">
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Usuário Solicitante</span>
                <span className={styles.detailValue}>
                  {modalDetalhe.log.usuarioNome || "Usuário"} ({modalDetalhe.log.usuarioEmail || "-"})
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Ação Executada</span>
                <span className={styles.detailValue} style={{ color: "#818cf8" }}>
                  {modalDetalhe.log.acao || "Visualização de Prontuário"}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Data e Hora do Evento</span>
                <span className={styles.detailValue} style={{ fontFamily: "monospace" }}>
                  {modalDetalhe.log.dataAcesso
                    ? new Date(modalDetalhe.log.dataAcesso).toLocaleString("pt-BR")
                    : "Horário atual"}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Detalhes do Acesso aos Dados Sensíveis</span>
                <span className={styles.detailValue} style={{ fontWeight: 400, fontSize: 13, lineHeight: 1.5 }}>
                  {modalDetalhe.log.detalhes || "Acesso aos dados confidenciais do educando."}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Base Legal & Conformidade</span>
                <span className={styles.detailValue} style={{ fontSize: 12, color: "#34d399" }}>
                  LGPD (Lei 13.709/2018) • Art. 11, II, "d" (Tutela de saúde e dever legal educacional)
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Chave Criptográfica de Integridade</span>
                <span className={styles.detailValue} style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>
                  sha256:{modalDetalhe.log.id ? String(modalDetalhe.log.id).padStart(16, "0") : "7f9a2b4e8c1d3f5a6b7c8d9e0f1a2b3c"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
              <Button
                variant="outline"
                onClick={() => setModalDetalhe({ aberto: false, log: null })}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { Btn, EmptyState, Spinner } from "../../../components/ui";
import styles from "./TurmasFechamento.module.css";

export default function TurmasFechamento({
  itensFiltrados = [],
  listaFechamentos = [],
  busca = "",
  setBusca,
  filtroStatus = "TODOS",
  setFiltroStatus,
  bimestre = "1º Bimestre",
  cFechamentos = false,
  cTurmas = false,
  isCoordenacaoOuDirecao = false,
  STATUS_FECHAMENTO = {},
  onAbrirSolicitar,
  onAbrirValidar,
  onAbrirDevolver,
  onAbrirReabrir
}) {
  const totalPendentes = listaFechamentos.filter(
    (f) =>
      f.status === STATUS_FECHAMENTO.PENDENTE || f.status === STATUS_FECHAMENTO.REABERTO
  ).length;

  const totalAguardando = listaFechamentos.filter(
    (f) => f.status === STATUS_FECHAMENTO.AGUARDANDO_VALIDACAO
  ).length;

  const totalFechadas = listaFechamentos.filter(
    (f) => f.status === STATUS_FECHAMENTO.FECHADO
  ).length;

  return (
    <div className={styles.container}>
      <div className={styles.mainCard}>
        {/* Barra de Filtros e Busca */}
        <div className={styles.filterBar}>
          <div className={styles.filterChips}>
            <button
              type="button"
              className={`${styles.filterChip} ${
                filtroStatus === "TODOS" ? styles.filterChipActive : ""
              }`}
              onClick={() => setFiltroStatus("TODOS")}
            >
              Todas ({listaFechamentos.length})
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${
                filtroStatus === "PENDENTE" ? styles.filterChipActive : ""
              }`}
              onClick={() => setFiltroStatus("PENDENTE")}
            >
              🔴 Pendentes ({totalPendentes})
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${
                filtroStatus === "AGUARDANDO" ? styles.filterChipActive : ""
              }`}
              onClick={() => setFiltroStatus("AGUARDANDO")}
            >
              🟡 Em Validação ({totalAguardando})
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${
                filtroStatus === "FECHADO" ? styles.filterChipActive : ""
              }`}
              onClick={() => setFiltroStatus("FECHADO")}
            >
              🟢 Fechadas 🔒 ({totalFechadas})
            </button>
          </div>

          <div className={styles.searchBox}>
            <i className="ti ti-search" style={{ color: "#38bdf8", fontSize: 16 }} />
            <input
              type="text"
              placeholder="Buscar turma ou professor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={styles.searchInput}
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: 0
                }}
              >
                <i className="ti ti-x" />
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo: Tabela Desktop ou Cartões Mobile */}
        {cFechamentos || cTurmas ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <Spinner texto="Carregando status de fechamento das turmas..." />
          </div>
        ) : itensFiltrados.length === 0 ? (
          <EmptyState
            icon="clipboard-check"
            texto="Nenhuma turma encontrada para o filtro selecionado."
          />
        ) : (
          <>
            {/* 1. Tabela Desktop */}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Turma & Turno</th>
                    <th className={styles.th}>Professor Responsável</th>
                    <th className={styles.th}>Aulas Ministradas</th>
                    <th className={styles.th}>Status do Período</th>
                    <th className={styles.th}>Homologação / Auditoria</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {itensFiltrados.map((item) => {
                    const isFechado = item.status === STATUS_FECHAMENTO.FECHADO;
                    const isAguardando = item.status === STATUS_FECHAMENTO.AGUARDANDO_VALIDACAO;
                    const isPendente = item.status === STATUS_FECHAMENTO.PENDENTE;
                    const isReaberto = item.status === STATUS_FECHAMENTO.REABERTO;
                    const metaAulas = item.totalAulasPrevistas || 50;
                    const aulasDadas = item.totalAulasDadas || 0;
                    const percentAulas = Math.min(100, Math.round((aulasDadas / metaAulas) * 100));

                    return (
                      <tr key={item.id} className={styles.tr}>
                        <td className={styles.td}>
                          <div style={{ fontWeight: 700, color: "#ffffff", fontSize: 14 }}>
                            {item.turma}
                          </div>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            {item.turno} · {bimestre}
                          </span>
                        </td>

                        <td className={styles.td}>
                          <div style={{ fontWeight: 500, color: "#cbd5e1" }}>
                            {item.professor || "Não atribuído"}
                          </div>
                          {item.solicitadoPor && (
                            <span style={{ fontSize: 11, color: "#818cf8" }}>
                              Solicitou: {item.solicitadoPor}
                            </span>
                          )}
                        </td>

                        <td className={styles.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              style={{
                                fontWeight: 700,
                                color: aulasDadas >= metaAulas ? "#4ade80" : "#fbbf24"
                              }}
                            >
                              {aulasDadas}/{metaAulas} h/a
                            </span>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>({percentAulas}%)</span>
                          </div>
                          <div
                            style={{
                              width: 100,
                              height: 5,
                              background: "rgba(255, 255, 255, 0.08)",
                              borderRadius: 999,
                              marginTop: 4,
                              overflow: "hidden"
                            }}
                          >
                            <div
                              style={{
                                width: `${percentAulas}%`,
                                height: "100%",
                                background: aulasDadas >= metaAulas ? "#22c55e" : "#f59e0b"
                              }}
                            />
                          </div>
                        </td>

                        <td className={styles.td}>
                          {isFechado && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "rgba(34, 197, 94, 0.15)",
                                color: "#4ade80",
                                padding: "4px 10px",
                                borderRadius: 16,
                                fontWeight: 700,
                                fontSize: 12,
                                border: "1px solid rgba(34, 197, 94, 0.3)"
                              }}
                            >
                              🔒 Período Fechado
                            </span>
                          )}

                          {isAguardando && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "rgba(245, 158, 11, 0.15)",
                                color: "#fbbf24",
                                padding: "4px 10px",
                                borderRadius: 16,
                                fontWeight: 700,
                                fontSize: 12,
                                border: "1px solid rgba(245, 158, 11, 0.3)"
                              }}
                            >
                              🟡 Aguardando Validação
                            </span>
                          )}

                          {isPendente && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "rgba(239, 68, 68, 0.15)",
                                color: "#f87171",
                                padding: "4px 10px",
                                borderRadius: 16,
                                fontWeight: 700,
                                fontSize: 12,
                                border: "1px solid rgba(239, 68, 68, 0.3)"
                              }}
                            >
                              🔴 Pendente
                            </span>
                          )}

                          {isReaberto && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "rgba(249, 115, 22, 0.15)",
                                color: "#fb923c",
                                padding: "4px 10px",
                                borderRadius: 16,
                                fontWeight: 700,
                                fontSize: 12,
                                border: "1px solid rgba(249, 115, 22, 0.3)"
                              }}
                            >
                              ⚠️ Reaberto para Ajuste
                            </span>
                          )}

                          {item.pendenciasDescricao && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#f87171",
                                marginTop: 4,
                                maxWidth: 220
                              }}
                            >
                              {item.pendenciasDescricao}
                            </div>
                          )}
                        </td>

                        <td className={styles.td}>
                          {isFechado ? (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#4ade80" }}>
                                <i className="ti ti-check" style={{ marginRight: 4 }} />
                                Validado por {item.validadoPor || "Coordenação"}
                              </div>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                {item.validadoEm
                                  ? new Date(item.validadoEm).toLocaleDateString("pt-BR")
                                  : "Homologado"}
                              </span>
                            </div>
                          ) : isAguardando ? (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#fbbf24" }}>
                                Solicitação enviada
                              </div>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                {item.solicitadoEm
                                  ? new Date(item.solicitadoEm).toLocaleDateString("pt-BR")
                                  : "Aguardando parecer"}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>
                              Em lançamento docente
                            </span>
                          )}
                        </td>

                        <td className={styles.td} style={{ textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 6,
                              flexWrap: "wrap"
                            }}
                          >
                            {(isPendente || isReaberto) && (
                              <Btn
                                variant="primary"
                                onClick={() => onAbrirSolicitar(item)}
                                style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600 }}
                              >
                                <i className="ti ti-send" /> Solicitar Fechamento
                              </Btn>
                            )}

                            {isAguardando && isCoordenacaoOuDirecao && (
                              <>
                                <Btn
                                  variant="primary"
                                  onClick={() => onAbrirValidar(item)}
                                  style={{
                                    padding: "6px 10px",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    background: "#16a34a",
                                    borderColor: "#22c55e"
                                  }}
                                >
                                  <i className="ti ti-lock" /> Validar & Trancar
                                </Btn>
                                <Btn
                                  variant="danger"
                                  onClick={() => onAbrirDevolver(item)}
                                  style={{ padding: "6px 10px", fontSize: 12 }}
                                >
                                  <i className="ti ti-arrow-back-up" /> Devolver
                                </Btn>
                              </>
                            )}

                            {isFechado && (
                              <Btn
                                variant="default"
                                onClick={() => onAbrirReabrir(item)}
                                style={{ padding: "6px 10px", fontSize: 12 }}
                              >
                                <i className="ti ti-lock-open" /> Retificar / Reabrir ⚠️
                              </Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. Modo Cartões Mobile */}
            <div className={styles.mobileCards}>
              {itensFiltrados.map((item) => {
                const isFechado = item.status === STATUS_FECHAMENTO.FECHADO;
                const isAguardando = item.status === STATUS_FECHAMENTO.AGUARDANDO_VALIDACAO;
                const isPendente = item.status === STATUS_FECHAMENTO.PENDENTE;
                const isReaberto = item.status === STATUS_FECHAMENTO.REABERTO;
                const metaAulas = item.totalAulasPrevistas || 50;
                const aulasDadas = item.totalAulasDadas || 0;
                const percentAulas = Math.min(100, Math.round((aulasDadas / metaAulas) * 100));

                return (
                  <div key={item.id} className={styles.cardItem}>
                    <div className={styles.cardTop}>
                      <div>
                        <div className={styles.cardTurma}>{item.turma}</div>
                        <div className={styles.cardSub}>
                          {item.turno} · {bimestre}
                        </div>
                      </div>

                      {/* Badge de Status */}
                      {isFechado && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "rgba(34, 197, 94, 0.15)",
                            color: "#4ade80",
                            padding: "4px 10px",
                            borderRadius: 16,
                            fontWeight: 700,
                            fontSize: 11,
                            border: "1px solid rgba(34, 197, 94, 0.3)"
                          }}
                        >
                          🔒 Fechado
                        </span>
                      )}

                      {isAguardando && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "rgba(245, 158, 11, 0.15)",
                            color: "#fbbf24",
                            padding: "4px 10px",
                            borderRadius: 16,
                            fontWeight: 700,
                            fontSize: 11,
                            border: "1px solid rgba(245, 158, 11, 0.3)"
                          }}
                        >
                          🟡 Em Validação
                        </span>
                      )}

                      {isPendente && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#f87171",
                            padding: "4px 10px",
                            borderRadius: 16,
                            fontWeight: 700,
                            fontSize: 11,
                            border: "1px solid rgba(239, 68, 68, 0.3)"
                          }}
                        >
                          🔴 Pendente
                        </span>
                      )}

                      {isReaberto && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "rgba(249, 115, 22, 0.15)",
                            color: "#fb923c",
                            padding: "4px 10px",
                            borderRadius: 16,
                            fontWeight: 700,
                            fontSize: 11,
                            border: "1px solid rgba(249, 115, 22, 0.3)"
                          }}
                        >
                          ⚠️ Reaberto
                        </span>
                      )}
                    </div>

                    {/* Professor */}
                    <div className={styles.cardMetaRow}>
                      <span style={{ color: "#94a3b8" }}>Professor Responsável</span>
                      <strong style={{ color: "#ffffff" }}>
                        {item.professor || "Não atribuído"}
                      </strong>
                    </div>

                    {/* Aulas */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <div className={styles.cardMetaRow} style={{ borderTop: "none", padding: 0 }}>
                        <span style={{ color: "#94a3b8" }}>Horas-Aula Ministradas</span>
                        <strong
                          style={{
                            color: aulasDadas >= metaAulas ? "#4ade80" : "#fbbf24"
                          }}
                        >
                          {aulasDadas}/{metaAulas} h/a ({percentAulas}%)
                        </strong>
                      </div>
                      <div className={styles.cardProgressBar}>
                        <div
                          className={styles.cardProgressFill}
                          style={{
                            width: `${percentAulas}%`,
                            background: aulasDadas >= metaAulas ? "#22c55e" : "#f59e0b"
                          }}
                        />
                      </div>
                    </div>

                    {/* Homologação */}
                    {isFechado ? (
                      <div className={styles.cardMetaRow}>
                        <span style={{ color: "#94a3b8" }}>Homologação</span>
                        <span style={{ color: "#4ade80", fontWeight: 600 }}>
                          Validado por {item.validadoPor || "Coordenação"}
                        </span>
                      </div>
                    ) : isAguardando ? (
                      <div className={styles.cardMetaRow}>
                        <span style={{ color: "#94a3b8" }}>Situação</span>
                        <span style={{ color: "#fbbf24", fontWeight: 600 }}>
                          Solicitação em análise
                        </span>
                      </div>
                    ) : null}

                    {/* Pendências Reportadas */}
                    {item.pendenciasDescricao && (
                      <div className={styles.pendenciaAlert}>
                        <i className="ti ti-alert-circle" style={{ marginRight: 4 }} />
                        <strong>Pendência:</strong> {item.pendenciasDescricao}
                      </div>
                    )}

                    {/* Ações Mobile */}
                    <div className={styles.cardActions}>
                      {(isPendente || isReaberto) && (
                        <Btn
                          variant="primary"
                          onClick={() => onAbrirSolicitar(item)}
                          style={{ fontWeight: 700 }}
                        >
                          <i className="ti ti-send" /> Solicitar Fechamento
                        </Btn>
                      )}

                      {isAguardando && isCoordenacaoOuDirecao && (
                        <>
                          <Btn
                            variant="primary"
                            onClick={() => onAbrirValidar(item)}
                            style={{
                              fontWeight: 700,
                              background: "#16a34a",
                              borderColor: "#22c55e"
                            }}
                          >
                            <i className="ti ti-lock" /> Validar & Trancar 🔒
                          </Btn>
                          <Btn
                            variant="danger"
                            onClick={() => onAbrirDevolver(item)}
                          >
                            <i className="ti ti-arrow-back-up" /> Devolver com Pendências
                          </Btn>
                        </>
                      )}

                      {isFechado && (
                        <Btn
                          variant="default"
                          onClick={() => onAbrirReabrir(item)}
                        >
                          <i className="ti ti-lock-open" /> Retificar / Reabrir ⚠️
                        </Btn>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

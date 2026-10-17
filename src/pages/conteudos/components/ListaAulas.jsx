import { Btn, Badge, Select, Spinner, EmptyState } from "../../../components/ui";
import styles from "./ListaAulas.module.css";

export default function ListaAulas({
  turmas = [],
  turmaSelecionada,
  setTurmaSelecionada,
  disciplinaSelecionada,
  setDisciplinaSelecionada,
  bimestreSelecionado,
  setBimestreSelecionado,
  busca,
  setBusca,
  conteudosFiltrados = [],
  carregando = false,
  abrirNovoRegistro,
  abrirEditarRegistro,
  handleExcluir,
  setModalImprimirAberto,
  DISCIPLINAS = [],
  BIMESTRES = []
}) {
  return (
    <div className={styles.container}>
      {/* Topo com Título e Ações Rápidas */}
      <div className={styles.topActions}>
        <h2 className={styles.topTitle}>
          <i className="ti ti-history" style={{ color: "#818cf8" }} />
          Histórico Pedagógico de Aulas · Turma {turmaSelecionada || "—"}
        </h2>

        <div className={styles.topBtns}>
          <Btn
            variant="default"
            onClick={() => setModalImprimirAberto(true)}
            disabled={!conteudosFiltrados.length}
            style={{ fontWeight: 600 }}
          >
            <i className="ti ti-printer" /> Imprimir Diário
          </Btn>
          <Btn variant="primary" onClick={abrirNovoRegistro} style={{ fontWeight: 700 }}>
            <i className="ti ti-plus" /> Registrar Aula
          </Btn>
        </div>
      </div>

      {/* Card de Filtros da Linha do Tempo */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          {/* Seletor de Turma */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>1. Turma</label>
            <Select
              value={turmaSelecionada}
              onChange={(e) => setTurmaSelecionada(e.target.value)}
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.nome}>
                  {t.nome} ({t.ano} - {t.turno})
                </option>
              ))}
            </Select>
          </div>

          {/* Seletor de Disciplina */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>2. Componente</label>
            <Select
              value={disciplinaSelecionada}
              onChange={(e) => setDisciplinaSelecionada(e.target.value)}
            >
              <option value="">Todas as Disciplinas</option>
              {DISCIPLINAS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>

          {/* Seletor de Bimestre */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>3. Bimestre</label>
            <Select
              value={bimestreSelecionado}
              onChange={(e) => setBimestreSelecionado(e.target.value)}
            >
              <option value="">Todos os Bimestres</option>
              {BIMESTRES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </div>

          {/* Campo de Busca */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>4. Busca no Diário</label>
            <div className={styles.searchBox}>
              <i className="ti ti-search" style={{ color: "#818cf8", fontSize: 16 }} />
              <input
                className={styles.searchInput}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Tema, habilidade BNCC, docente..."
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
        </div>
      </div>

      {/* Linha do Tempo de Aulas */}
      {carregando ? (
        <Spinner texto="Carregando aulas e conteúdos do diário..." />
      ) : !conteudosFiltrados.length ? (
        <EmptyState
          icon="notebook"
          texto={`Nenhum conteúdo registrado para a turma "${turmaSelecionada}" com os filtros atuais.`}
        >
          <div style={{ marginTop: 12 }}>
            <Btn variant="primary" onClick={abrirNovoRegistro}>
              <i className="ti ti-plus" /> Registrar Primeira Aula
            </Btn>
          </div>
        </EmptyState>
      ) : (
        <div className={styles.timeline}>
          {conteudosFiltrados.map((item, idx) => (
            <div key={item.id || idx} className={styles.lessonCard}>
              <div className={styles.lessonTop}>
                <div className={styles.lessonInfoLeft}>
                  <div className={styles.dateBlock}>
                    <span className={styles.dateNum}>
                      {item.data ? new Date(item.data + "T12:00:00").getDate() : "—"}
                    </span>
                    <span className={styles.dateMonth}>
                      {item.data
                        ? new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR", {
                            month: "short"
                          })
                        : ""}
                    </span>
                  </div>

                  <div className={styles.lessonMeta}>
                    <div className={styles.lessonSubjectRow}>
                      <span className={styles.lessonSubject}>{item.disciplina}</span>
                      <Badge color="blue">{item.bimestre || "1º Bimestre"}</Badge>
                      <Badge color="gray">{item.aulasQtd || 1} aula(s)</Badge>
                    </div>
                    <div className={styles.lessonDocente}>
                      Data:{" "}
                      <strong style={{ color: "#cbd5e1" }}>
                        {item.data
                          ? new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR")
                          : "—"}
                      </strong>{" "}
                      · Docente:{" "}
                      <strong style={{ color: "#cbd5e1" }}>
                        {item.professor || "Professor Regente"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className={styles.lessonActions}>
                  <Btn
                    variant="default"
                    onClick={() => abrirEditarRegistro(item)}
                    style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600 }}
                    title="Editar aula"
                  >
                    <i className="ti ti-edit" /> Editar
                  </Btn>
                  <Btn
                    variant="danger"
                    onClick={() => handleExcluir(item.id)}
                    style={{ padding: "6px 10px", fontSize: 12 }}
                    title="Excluir aula"
                  >
                    <i className="ti ti-trash" />
                  </Btn>
                </div>
              </div>

              {/* Conteúdo Ministrado */}
              <div className={styles.lessonContentBlock}>
                <div className={styles.contentTitle}>Conteúdo Ministrado:</div>
                <div className={styles.contentText}>{item.conteudo}</div>
              </div>

              {/* Habilidade / Competência BNCC */}
              {item.habilidades && (
                <div className={styles.bnccBox}>
                  <div className={styles.bnccTag}>
                    <i className="ti ti-target-arrow" />
                    BNCC:
                  </div>
                  <div className={styles.bnccDesc}>{item.habilidades}</div>
                </div>
              )}

              {/* Observação Pedagógica */}
              {item.observacao && (
                <div className={styles.obsBox}>
                  <i
                    className="ti ti-info-circle"
                    style={{ fontSize: 14, color: "#818cf8", marginTop: 2, flexShrink: 0 }}
                  />
                  <span>
                    <strong style={{ color: "#cbd5e1" }}>Observações:</strong> {item.observacao}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

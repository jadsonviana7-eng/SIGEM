import { Badge, Btn, Alert, Spinner, EmptyState } from "../../../components/ui";
import styles from "./ControleEscolas.module.css";

export default function ControleEscolas({
  escolasFiltradas = [],
  carregandoEscolas,
  buscaEscola,
  setBuscaEscola,
  abrirNovaEscola,
  abrirEditarEscola,
  removerEscola,
  alertaEscola
}) {
  return (
    <div className={styles.container}>
      {/* Cabeçalho e Filtros */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>
              <i className="ti ti-school" style={{ color: "#38bdf8" }} />
              Escolas Ativas da Rede
            </h2>
            <p className={styles.subtitle}>
              Unidades escolares cadastradas no ecossistema municipal integrado
            </p>
          </div>

          <Btn variant="primary" onClick={abrirNovaEscola}>
            <i className="ti ti-plus" /> Nova Escola
          </Btn>
        </div>

        {alertaEscola && <Alert tipo={alertaEscola.tipo}>{alertaEscola.msg}</Alert>}

        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <i className="ti ti-search" style={{ color: "#94a3b8", fontSize: 16 }} />
            <input
              type="text"
              value={buscaEscola}
              onChange={(e) => setBuscaEscola(e.target.value)}
              placeholder="Buscar por nome da escola ou município..."
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* Card da Tabela ou Lista Mobile */}
      <div className={styles.tableCard}>
        {carregandoEscolas ? (
          <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
            <Spinner />
          </div>
        ) : !escolasFiltradas.length ? (
          <EmptyState icon="school" texto="Nenhuma escola cadastrada no momento." />
        ) : (
          <>
            {/* Tabela Desktop */}
            <table className={styles.desktopTable}>
              <thead>
                <tr>
                  <th>Escola</th>
                  <th>CNPJ</th>
                  <th>Código INEP</th>
                  <th>Município</th>
                  <th>UF</th>
                  <th>Localização</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {escolasFiltradas.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div className={styles.schoolCell}>
                        <div className={styles.schoolLogo}>
                          {e.fotoUrl ? (
                            <img src={e.fotoUrl} alt={e.nome} />
                          ) : (
                            <i
                              className="ti ti-school"
                              style={{ fontSize: 14, color: "#94a3b8" }}
                            />
                          )}
                        </div>
                        <span className={styles.schoolName}>{e.nome}</span>
                      </div>
                    </td>
                    <td>{e.cnpj || "Não informado"}</td>
                    <td>{e.inep || "—"}</td>
                    <td>{e.municipio}</td>
                    <td>
                      <Badge color="blue">{e.uf}</Badge>
                    </td>
                    <td>
                      <Badge color={e.zona === "Rural" ? "amber" : "blue"}>
                        {e.zona || "Urbana"}
                      </Badge>
                    </td>
                    <td>
                      <Badge color={e.status === "Ativa" ? "green" : "gray"}>
                        {e.status}
                      </Badge>
                    </td>
                    <td>
                      <div
                        className={styles.actionsCell}
                        style={{ justifyContent: "flex-end" }}
                      >
                        <Btn
                          onClick={() => abrirEditarEscola(e)}
                          style={{ padding: "5px 10px", fontSize: 12 }}
                          title="Editar Escola"
                        >
                          <i className="ti ti-edit" />
                        </Btn>
                        <Btn
                          variant="danger"
                          onClick={() => removerEscola(e)}
                          style={{ padding: "5px 10px", fontSize: 12 }}
                          title="Excluir Escola"
                        >
                          <i className="ti ti-trash" />
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Lista em Cards para Mobile */}
            <div className={styles.mobileCards}>
              {escolasFiltradas.map((e) => (
                <div key={e.id} className={styles.schoolCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardSchoolWrap}>
                      <div className={styles.cardLogo}>
                        {e.fotoUrl ? (
                          <img src={e.fotoUrl} alt={e.nome} />
                        ) : (
                          <i
                            className="ti ti-school"
                            style={{ fontSize: 20, color: "#94a3b8" }}
                          />
                        )}
                      </div>
                      <div className={styles.cardSchoolTitle}>
                        <span className={styles.cardName}>{e.nome}</span>
                        <span className={styles.cardLocation}>
                          {e.municipio} - {e.uf}
                        </span>
                      </div>
                    </div>
                    <Badge color={e.status === "Ativa" ? "green" : "gray"}>
                      {e.status}
                    </Badge>
                  </div>

                  <div className={styles.cardGrid}>
                    <div className={styles.cardGridItem}>
                      <span className={styles.cardGridLabel}>Código INEP</span>
                      <span className={styles.cardGridValue}>{e.inep || "—"}</span>
                    </div>
                    <div className={styles.cardGridItem}>
                      <span className={styles.cardGridLabel}>CNPJ</span>
                      <span className={styles.cardGridValue}>
                        {e.cnpj || "Não informado"}
                      </span>
                    </div>
                    <div className={styles.cardGridItem}>
                      <span className={styles.cardGridLabel}>Zona / Localização</span>
                      <span className={styles.cardGridValue}>
                        <Badge color={e.zona === "Rural" ? "amber" : "blue"}>
                          {e.zona || "Urbana"}
                        </Badge>
                      </span>
                    </div>
                    <div className={styles.cardGridItem}>
                      <span className={styles.cardGridLabel}>UF</span>
                      <span className={styles.cardGridValue}>
                        <Badge color="blue">{e.uf}</Badge>
                      </span>
                    </div>
                  </div>

                  {e.endereco && (
                    <div className={styles.cardAddress}>
                      <i className="ti ti-map-pin" style={{ color: "#38bdf8" }} />
                      <span>{e.endereco}</span>
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    <Btn
                      onClick={() => abrirEditarEscola(e)}
                      style={{ padding: "8px 12px", fontSize: 12 }}
                    >
                      <i className="ti ti-edit" /> Editar
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={() => removerEscola(e)}
                      style={{ padding: "8px 12px", fontSize: 12 }}
                    >
                      <i className="ti ti-trash" /> Excluir
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

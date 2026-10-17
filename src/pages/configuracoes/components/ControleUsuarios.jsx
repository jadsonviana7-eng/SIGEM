import { Badge, Btn, Alert, Spinner, EmptyState } from "../../../components/ui";
import styles from "./ControleUsuarios.module.css";

export default function ControleUsuarios({
  usuariosFiltrados = [],
  carregando,
  buscaUsuario,
  setBuscaUsuario,
  escolaFiltroUsuario,
  setEscolaFiltroUsuario,
  isAdmin,
  escolas = [],
  abrirNovoUsuario,
  abrirEditarUsuario,
  removerUsuario,
  alertaUsuario
}) {
  return (
    <div className={styles.container}>
      {/* Cabeçalho e Barra de Filtros */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>
              <i className="ti ti-users" style={{ color: "#38bdf8" }} />
              Controle de Usuários
            </h2>
            <p className={styles.subtitle}>
              Gerencie as permissões, cargos e acessos institucionais do sistema
            </p>
          </div>

          <Btn variant="primary" onClick={abrirNovoUsuario}>
            <i className="ti ti-user-plus" /> Novo Usuário
          </Btn>
        </div>

        {alertaUsuario && <Alert tipo={alertaUsuario.tipo}>{alertaUsuario.msg}</Alert>}

        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <i className="ti ti-search" style={{ color: "#94a3b8", fontSize: 16 }} />
            <input
              type="text"
              value={buscaUsuario}
              onChange={(e) => setBuscaUsuario(e.target.value)}
              placeholder="Buscar por nome, e-mail ou perfil..."
              className={styles.searchInput}
            />
          </div>

          {isAdmin && (
            <select
              value={escolaFiltroUsuario}
              onChange={(e) => setEscolaFiltroUsuario(e.target.value)}
              className={styles.schoolSelect}
            >
              <option value="">🌐 Toda a Rede (Todas as Escolas)</option>
              {escolas.map((esc) => (
                <option key={esc.id} value={esc.id}>
                  🏫 {esc.nome}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Card da Tabela ou Lista Mobile */}
      <div className={styles.tableCard}>
        {carregando ? (
          <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
            <Spinner />
          </div>
        ) : !usuariosFiltrados.length ? (
          <EmptyState
            icon="users"
            texto="Nenhum usuário encontrado com os filtros selecionados."
          />
        ) : (
          <>
            {/* Tabela Desktop */}
            <table className={styles.desktopTable}>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Escola</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => {
                  const escolaDoc = escolas.find((esc) => esc.id === u.escolaId);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.userAvatar}>
                            {u.fotoUrl ? (
                              <img src={u.fotoUrl} alt={u.nome} />
                            ) : (
                              <i
                                className="ti ti-user"
                                style={{ fontSize: 14, color: "#94a3b8" }}
                              />
                            )}
                          </div>
                          <span className={styles.userName}>{u.nome}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <Badge color="blue">{u.perfil}</Badge>
                      </td>
                      <td>
                        {escolaDoc ? (
                          escolaDoc.nome
                        ) : (
                          <span style={{ color: "#94a3b8" }}>Global / Geral</span>
                        )}
                      </td>
                      <td>
                        <Badge color={u.status === "Ativo" ? "green" : "gray"}>
                          {u.status}
                        </Badge>
                      </td>
                      <td>
                        <div
                          className={styles.actionsCell}
                          style={{ justifyContent: "flex-end" }}
                        >
                          <Btn
                            onClick={() => abrirEditarUsuario(u)}
                            style={{ padding: "5px 10px", fontSize: 12 }}
                            title="Editar Usuário"
                          >
                            <i className="ti ti-edit" />
                          </Btn>
                          <Btn
                            variant="danger"
                            onClick={() => removerUsuario(u)}
                            style={{ padding: "5px 10px", fontSize: 12 }}
                            title="Excluir Usuário"
                          >
                            <i className="ti ti-trash" />
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Lista em Cards para Mobile */}
            <div className={styles.mobileCards}>
              {usuariosFiltrados.map((u) => {
                const escolaDoc = escolas.find((esc) => esc.id === u.escolaId);
                return (
                  <div key={u.id} className={styles.userCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardUserWrap}>
                        <div className={styles.cardAvatar}>
                          {u.fotoUrl ? (
                            <img src={u.fotoUrl} alt={u.nome} />
                          ) : (
                            <i
                              className="ti ti-user"
                              style={{ fontSize: 18, color: "#94a3b8" }}
                            />
                          )}
                        </div>
                        <div className={styles.cardUserTitle}>
                          <span className={styles.cardName}>{u.nome}</span>
                          <span className={styles.cardEmail}>{u.email}</span>
                        </div>
                      </div>
                      <Badge color={u.status === "Ativo" ? "green" : "gray"}>
                        {u.status}
                      </Badge>
                    </div>

                    <div className={styles.cardDetails}>
                      <div className={styles.cardDetailItem}>
                        <span className={styles.cardDetailLabel}>Perfil:</span>
                        <Badge color="blue">{u.perfil}</Badge>
                      </div>
                      <div className={styles.cardDetailItem}>
                        <span className={styles.cardDetailLabel}>Escola:</span>
                        <span style={{ fontWeight: 600 }}>
                          {escolaDoc ? escolaDoc.nome : "Global / Geral"}
                        </span>
                      </div>
                    </div>

                    <div className={styles.cardActions}>
                      <Btn
                        onClick={() => abrirEditarUsuario(u)}
                        style={{ padding: "8px 12px", fontSize: 12 }}
                      >
                        <i className="ti ti-edit" /> Editar
                      </Btn>
                      <Btn
                        variant="danger"
                        onClick={() => removerUsuario(u)}
                        style={{ padding: "8px 12px", fontSize: 12 }}
                      >
                        <i className="ti ti-trash" /> Excluir
                      </Btn>
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

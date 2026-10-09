import { useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getUsuarios, addUsuario, updateUsuario, deleteUsuario, criarUsuarioNoAuth } from "../services/usuariosService";
import { getEscolas, addEscola, updateEscola, deleteEscola } from "../services/escolasService";
import { Card, Badge, Btn, Modal, Input, Select, Alert, Spinner, EmptyState } from "../components/ui";
import { comprimirEUploadFoto } from "../utils/upload";
import CropModal from "../components/CropModal";
import { formatCNPJ } from "../utils/masks";
import { injectMockData } from "../utils/mockDataGenerator";

const VAZIO_USUARIO = { nome: "", email: "", senha: "", perfil: "Coordenador", status: "Ativo", fotoUrl: "", escolaId: "" };
const PERFIS = ["Direção", "Coordenador", "Secretário", "Professor", "Administrador"];
const STATUS = ["Ativo", "Inativo"];

export default function Configuracoes() {
  const { user, atualizarDadosUsuario, selectedEscolaId, escolas, recarregarEscolas } = useAuth();
  
  const isAdmin = user?.role === "Administrador";

  // Filtro de usuários: se for admin, carrega todos da rede; se for diretor, carrega da sua escola
  const activeEscolaId = isAdmin ? null : (user?.escolaId || selectedEscolaId || null);
  const { dados: usuarios, carregando, recarregar } = useFirestore(
    useCallback(() => getUsuarios(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );
  
  // Abas de Configurações
  const [abaAtiva, setAbaAtiva] = useState("minha-conta");

  // Estado Minha Conta
  const [nomePerfil, setNomePerfil] = useState(user?.displayName || "");
  const [fotoPerfil, setFotoPerfil] = useState(user?.photoURL || "");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [alertaPerfil, setAlertaPerfil] = useState(null);
  const [gerandoMock, setGerandoMock] = useState(false);

  // Estado Controle de Usuários (CRUD)
  const [formUsuario, setFormUsuario] = useState(VAZIO_USUARIO);
  const [usuarioEditId, setUsuarioEditId] = useState(null);
  const [modalUsuarioAberto, setModalUsuarioAberto] = useState(false);
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);
  const [alertaUsuario, setAlertaUsuario] = useState(null);
  const [buscaUsuario, setBuscaUsuario] = useState("");
  const [escolaFiltroUsuario, setEscolaFiltroUsuario] = useState("");

  // Estado Escolas (CRUD)
  const VAZIO_ESCOLA = { nome: "", cnpj: "", inep: "", municipio: "Maceió", uf: "AL", status: "Ativa", fotoUrl: "", endereco: "", zona: "Urbana" };
  const [formEscola, setFormEscola] = useState(VAZIO_ESCOLA);
  const [escolaEditId, setEscolaEditId] = useState(null);
  const [modalEscolaAberto, setModalEscolaAberto] = useState(false);
  const [salvandoEscola, setSalvandoEscola] = useState(false);
  const [alertaEscola, setAlertaEscola] = useState(null);
  const [buscaEscola, setBuscaEscola] = useState("");
  const { dados: escolasLista, carregando: carregandoEscolas, recarregar: recarregarEscolasLista } = useFirestore(getEscolas);

  // Estado Geral CropModal
  const [cropFile, setCropFile] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); // 'perfil', 'usuario' ou 'escola'
  const [carregandoFoto, setCarregandoFoto] = useState(false);

  function setUsuarioField(campo, valor) { setFormUsuario(f => ({ ...f, [campo]: valor })); }

  // Handlers para Crop
  function handleFileSelect(e, target) {
    const file = e.target.files[0];
    if (!file) return;
    setCropFile(file);
    setCropTarget(target);
  }

  async function handleCropConfirm(croppedFile) {
    setCropFile(null);
    setCarregandoFoto(true);
    try {
      if (cropTarget === "perfil") {
        const url = await comprimirEUploadFoto(croppedFile, "usuarios", user.uid);
        setFotoPerfil(url);
      } else if (cropTarget === "usuario") {
        const url = await comprimirEUploadFoto(croppedFile, "usuarios", usuarioEditId || Date.now().toString());
        setUsuarioField("fotoUrl", url);
      } else if (cropTarget === "escola") {
        const url = await comprimirEUploadFoto(croppedFile, "escolas", escolaEditId || Date.now().toString());
        setEscolaField("fotoUrl", url);
      }
    } catch (error) {
      alert("Erro ao enviar foto: " + error.message);
    } finally {
      setCarregandoFoto(false);
    }
  }

  // Ações Minha Conta
  async function salvarPerfil() {
    if (!nomePerfil) { alert("Nome é obrigatório."); return; }
    setSalvandoPerfil(true);
    try {
      await atualizarDadosUsuario({ nome: nomePerfil, fotoUrl: fotoPerfil });
      setAlertaPerfil({ msg: "Perfil atualizado com sucesso!", tipo: "success" });
    } catch (error) {
      setAlertaPerfil({ msg: "Erro ao atualizar perfil: " + error.message, tipo: "error" });
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function handleGerarMock() {
    if (!window.confirm("Isto adicionará Turmas, Alunos, Professores e dados Financeiros fictícios à sua escola ativa para testes. Continuar?")) return;
    setGerandoMock(true);
    try {
      await injectMockData(activeEscolaId);
      setAlertaPerfil({ msg: "Dados fictícios criados com sucesso!", tipo: "success" });
    } catch (e) {
      setAlertaPerfil({ msg: "Erro ao criar dados: " + e.message, tipo: "error" });
    } finally {
      setGerandoMock(false);
    }
  }

  // Ações Controle de Usuários
  function abrirNovoUsuario() {
    setFormUsuario({
      ...VAZIO_USUARIO,
      escolaId: user?.role === "Administrador" ? (escolaFiltroUsuario || (escolas[0]?.id || "")) : (user?.escolaId || selectedEscolaId || "")
    });
    setUsuarioEditId(null);
    setModalUsuarioAberto(true);
  }
  function abrirEditarUsuario(u) { setFormUsuario({ ...VAZIO_USUARIO, ...u, senha: "" }); setUsuarioEditId(u.id); setModalUsuarioAberto(true); }

  async function salvarUsuario() {
    if (!formUsuario.nome || !formUsuario.email) { alert("Nome e e-mail são obrigatórios."); return; }
    if (!usuarioEditId && !formUsuario.senha) { alert("Senha é obrigatória para novos usuários."); return; }

    setSalvandoUsuario(true);
    try {
      const userTargetEscolaId = user?.role === "Administrador"
        ? (formUsuario.perfil === "Administrador" ? "" : (formUsuario.escolaId || ""))
        : (user?.escolaId || selectedEscolaId || "");

      if (usuarioEditId) {
        await updateUsuario(usuarioEditId, {
          nome: formUsuario.nome,
          email: formUsuario.email,
          perfil: formUsuario.perfil,
          status: formUsuario.status,
          fotoUrl: formUsuario.fotoUrl,
          escolaId: userTargetEscolaId
        });
        setAlertaUsuario({ msg: `Usuário "${formUsuario.nome}" atualizado.`, tipo: "success" });
      } else {
        const uid = await criarUsuarioNoAuth(formUsuario.email, formUsuario.senha);
        await addUsuario(uid, {
          nome: formUsuario.nome,
          email: formUsuario.email,
          perfil: formUsuario.perfil,
          status: formUsuario.status,
          fotoUrl: formUsuario.fotoUrl,
          escolaId: userTargetEscolaId
        });
        setAlertaUsuario({ msg: `Usuário "${formUsuario.nome}" criado com sucesso!`, tipo: "success" });
      }
      setModalUsuarioAberto(false);
      recarregar();
    } catch (error) {
      setAlertaUsuario({ msg: "Erro ao salvar usuário: " + error.message, tipo: "error" });
    } finally {
      setSalvandoUsuario(false);
    }
  }

  async function removerUsuario(u) {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${u.nome}"?`)) return;
    try {
      await deleteUsuario(u.id);
      setAlertaUsuario({ msg: "Usuário removido da base.", tipo: "success" });
      recarregar();
    } catch (error) {
      setAlertaUsuario({ msg: "Erro ao remover usuário: " + error.message, tipo: "error" });
    }
  }

  // Ações Controle de Escolas (CRUD)
  function abrirNovaEscola() {
    setFormEscola(VAZIO_ESCOLA);
    setEscolaEditId(null);
    setModalEscolaAberto(true);
  }

  function abrirEditarEscola(e) {
    setFormEscola({ ...VAZIO_ESCOLA, ...e });
    setEscolaEditId(e.id);
    setModalEscolaAberto(true);
  }

  async function salvarEscola() {
    if (!formEscola.nome || !formEscola.municipio) { alert("Nome e Município são obrigatórios."); return; }
    setSalvandoEscola(true);
    setAlertaEscola(null);
    try {
      if (escolaEditId) {
        await updateEscola(escolaEditId, formEscola);
        setAlertaEscola({ msg: `Escola "${formEscola.nome}" atualizada com sucesso!`, tipo: "success" });
      } else {
        await addEscola(formEscola);
        setAlertaEscola({ msg: `Escola "${formEscola.nome}" criada com sucesso!`, tipo: "success" });
      }
      setModalEscolaAberto(false);
      recarregarEscolasLista(); // Recarrega tabela de escolas local
      await recarregarEscolas(); // Recarrega dropdown global no context
    } catch (error) {
      setAlertaEscola({ msg: "Erro ao salvar escola: " + error.message, tipo: "error" });
    } finally {
      setSalvandoEscola(false);
    }
  }

  async function removerEscola(e) {
    if (!window.confirm(`Tem certeza que deseja excluir a escola "${e.nome}"? Servidores e alunos continuarão vinculados no banco.`)) return;
    try {
      await deleteEscola(e.id);
      setAlertaEscola({ msg: "Escola removida.", tipo: "success" });
      recarregarEscolasLista();
      await recarregarEscolas();
    } catch (error) {
      setAlertaEscola({ msg: "Erro ao remover escola: " + error.message, tipo: "error" });
    }
  }

  function setEscolaField(campo, valor) {
    setFormEscola(f => ({ ...f, [campo]: valor }));
  }

  const escolasFiltradas = (escolasLista || []).filter(e =>
    e.nome?.toLowerCase().includes(buscaEscola.toLowerCase()) ||
    e.municipio?.toLowerCase().includes(buscaEscola.toLowerCase())
  );

  const usuariosFiltrados = (usuarios || []).filter(u => {
    const matchBusca = (u.nome || "").toLowerCase().includes(buscaUsuario.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(buscaUsuario.toLowerCase()) ||
      (u.perfil || "").toLowerCase().includes(buscaUsuario.toLowerCase());
    const matchEscola = !escolaFiltroUsuario || u.escolaId === escolaFiltroUsuario;
    return matchBusca && matchEscola;
  });

  const podeGerenciar = user?.role === "Administrador" || user?.role === "Direção";

  return (
    <div>
      {/* Navegação por Abas Principais */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e5e4", marginBottom: 20, gap: 12 }}>
        <button
          onClick={() => setAbaAtiva("minha-conta")}
          style={{
            padding: "10px 16px",
            border: "none",
            borderBottom: abaAtiva === "minha-conta" ? "3px solid #1a56db" : "3px solid transparent",
            background: "none",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            color: abaAtiva === "minha-conta" ? "#1a56db" : "#4b5563",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <i className="ti ti-user" aria-hidden="true" /> Minha Conta
        </button>

        {podeGerenciar && (
          <button
            onClick={() => setAbaAtiva("controle-usuarios")}
            style={{
              padding: "10px 16px",
              border: "none",
              borderBottom: abaAtiva === "controle-usuarios" ? "3px solid #1a56db" : "3px solid transparent",
              background: "none",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              color: abaAtiva === "controle-usuarios" ? "#1a56db" : "#4b5563",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <i className="ti ti-users" aria-hidden="true" /> Controle de Usuários
          </button>
        )}

        {user?.role === "Administrador" && (
          <button
            onClick={() => setAbaAtiva("controle-escolas")}
            style={{
              padding: "10px 16px",
              border: "none",
              borderBottom: abaAtiva === "controle-escolas" ? "3px solid #1a56db" : "3px solid transparent",
              background: "none",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              color: abaAtiva === "controle-escolas" ? "#1a56db" : "#4b5563",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <i className="ti ti-school" aria-hidden="true" /> Escolas Ativas
          </button>
        )}
      </div>

      {/* Conteúdo Aba 1: Minha Conta */}
      {abaAtiva === "minha-conta" && (
        <Card style={{ maxWidth: 640 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Dados do Usuário Logado</h3>

          {alertaPerfil && <Alert tipo={alertaPerfil.tipo}>{alertaPerfil.msg}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Foto de Perfil com Crop */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: 12, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e5e4" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #1a56db", flexShrink: 0 }}>
                {fotoPerfil ? (
                  <img src={fotoPerfil} alt="Perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <i className="ti ti-user" style={{ fontSize: 28, color: "#9ca3af" }} />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Foto de Perfil</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    background: "#1a56db",
                    color: "white",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: carregandoFoto ? "not-allowed" : "pointer",
                    opacity: carregandoFoto ? 0.7 : 1,
                    border: "1px solid #1a56db"
                  }}>
                    <i className="ti ti-upload" />
                    {carregandoFoto ? "Carregando..." : "Alterar Foto"}
                    <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, "perfil")} disabled={carregandoFoto} style={{ display: "none" }} />
                  </label>
                  {fotoPerfil && (
                    <Btn variant="danger" onClick={() => setFotoPerfil("")} style={{ padding: "6px 12px", fontSize: 13 }}>
                      <i className="ti ti-trash" /> Remover
                    </Btn>
                  )}
                </div>
              </div>
            </div>

            <Input label="Nome Completo" value={nomePerfil} onChange={e => setNomePerfil(e.target.value)} />
            <Input label="E-mail" value={user?.email || ""} disabled helper="O e-mail de acesso não pode ser alterado diretamente." />

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 4 }}>Perfil no Sistema</label>
                <Badge color="blue">{user?.role || "Usuário"}</Badge>
              </div>
              {user?.role !== "Administrador" && (
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 4 }}>Escola Vinculada</label>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {escolas.find(e => e.id === user?.escolaId)?.nome || "Não informada"}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="primary" onClick={salvarPerfil} loading={salvandoPerfil}>
                Salvar Alterações
              </Btn>
            </div>
          </div>

          {/* Seção Dados de Teste (Mock) */}
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #e5e5e4" }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1f2937", marginBottom: 6 }}>Ambiente de Demonstração / Testes</h4>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
              Gere dados fictícios completos (alunos, turmas, professores e fluxo de caixa) na sua escola ativa para testar e explorar todas as funcionalidades do sistema.
            </p>
            <Btn variant="secondary" onClick={handleGerarMock} loading={gerandoMock} style={{ fontSize: 13 }}>
              <i className="ti ti-database-import" /> Injetar Dados Fictícios de Teste
            </Btn>
          </div>
        </Card>
      )}

      {/* Conteúdo Aba 2: Controle de Usuários */}
      {abaAtiva === "controle-usuarios" && podeGerenciar && (
        <div>
          {alertaUsuario && <Alert tipo={alertaUsuario.tipo}>{alertaUsuario.msg}</Alert>}

          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px", flex: 1, minWidth: 200, maxWidth: 300 }}>
              <i className="ti ti-search" style={{ color: "#9ca3af", fontSize: 16 }} />
              <input value={buscaUsuario} onChange={e => setBuscaUsuario(e.target.value)} placeholder="Buscar usuários..."
                style={{ border: "none", background: "none", fontSize: 13, outline: "none", width: "100%" }} />
            </div>

            {isAdmin && (
              <select
                value={escolaFiltroUsuario}
                onChange={e => setEscolaFiltroUsuario(e.target.value)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  background: "white",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#1f2937",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="">🌐 Toda a Rede (Todas as Escolas)</option>
                {escolas.map(esc => (
                  <option key={esc.id} value={esc.id}>
                    🏫 {esc.nome}
                  </option>
                ))}
              </select>
            )}

            <Btn variant="primary" onClick={abrirNovoUsuario}>
              <i className="ti ti-plus" aria-hidden="true" /> Novo Usuário
            </Btn>
          </div>

          <Card style={{ padding: 0, overflow: "hidden" }}>
            {carregando ? <Spinner /> : !usuariosFiltrados.length ? <EmptyState icon="users" texto="Nenhum usuário encontrado." /> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Usuário", "E-mail", "Perfil", "Escola", "Status", "Ações"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", borderBottom: "1px solid #e5e5e4" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map(u => {
                    const escolaDoc = escolas.find(esc => esc.id === u.escolaId);
                    return (
                      <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e5e4" }}>
                              {u.fotoUrl ? (
                                <img src={u.fotoUrl} alt={u.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <i className="ti ti-user" style={{ fontSize: 13, color: "#9ca3af" }} />
                              )}
                            </div>
                            <span style={{ fontWeight: 500 }}>{u.nome}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 13 }}>{u.email}</td>
                        <td style={{ padding: "10px 12px" }}><Badge color="blue">{u.perfil}</Badge></td>
                        <td style={{ padding: "10px 12px", fontSize: 13 }}>{escolaDoc ? escolaDoc.nome : <span style={{ color: "#aaa" }}>Global / Geral</span>}</td>
                        <td style={{ padding: "10px 12px" }}><Badge color={u.status === "Ativo" ? "green" : "gray"}>{u.status}</Badge></td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <Btn onClick={() => abrirEditarUsuario(u)} style={{ padding: "4px 8px", fontSize: 12 }} title="Editar Usuário"><i className="ti ti-edit" aria-hidden="true" /></Btn>
                            <Btn variant="danger" onClick={() => removerUsuario(u)} style={{ padding: "4px 8px", fontSize: 12 }} title="Excluir Usuário"><i className="ti ti-trash" aria-hidden="true" /></Btn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>

          {modalUsuarioAberto && (
            <Modal titulo={usuarioEditId ? "Editar Usuário" : "Novo Usuário"} onClose={() => setModalUsuarioAberto(false)} onSave={salvarUsuario} salvando={salvandoUsuario}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Upload Foto Usuário Administrativo */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#f9fafb", padding: 12, borderRadius: 8, border: "1px solid #e5e5e4" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #1a56db", flexShrink: 0 }}>
                    {formUsuario.fotoUrl ? (
                      <img src={formUsuario.fotoUrl} alt="Visualização" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <i className="ti ti-camera" style={{ fontSize: 20, color: "#9ca3af" }} />
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Foto do Usuário</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <label style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 12px",
                        background: "#1a56db",
                        color: "white",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: carregandoFoto ? "not-allowed" : "pointer",
                        opacity: carregandoFoto ? 0.7 : 1,
                        border: "1px solid #1a56db"
                      }}>
                        <i className="ti ti-upload" />
                        {carregandoFoto ? "Carregando..." : "Enviar Foto"}
                        <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, "usuario")} disabled={carregandoFoto} style={{ display: "none" }} />
                      </label>
                      {formUsuario.fotoUrl && (
                        <Btn variant="danger" onClick={() => setUsuarioField("fotoUrl", "")} style={{ padding: "4px 10px", fontSize: 12 }}>
                          <i className="ti ti-trash" /> Remover
                        </Btn>
                      )}
                    </div>
                  </div>
                </div>

                <Input label="Nome completo *" value={formUsuario.nome} onChange={e => setUsuarioField("nome", e.target.value)} placeholder="Ex: João da Silva" />
                <Input label="E-mail *" type="email" value={formUsuario.email} onChange={e => setUsuarioField("email", e.target.value)} placeholder="usuario@escola.edu.br" disabled={!!usuarioEditId} />
                
                {!usuarioEditId && (
                  <Input label="Senha provisória *" type="password" value={formUsuario.senha} onChange={e => setUsuarioField("senha", e.target.value)} placeholder="Mínimo 6 caracteres" />
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Select label="Perfil de Acesso" value={formUsuario.perfil} onChange={e => setUsuarioField("perfil", e.target.value)}>
                    {PERFIS.map(p => <option key={p}>{p}</option>)}
                  </Select>
                  <Select label="Status" value={formUsuario.status} onChange={e => setUsuarioField("status", e.target.value)}>
                    {STATUS.map(s => <option key={s}>{s}</option>)}
                  </Select>
                </div>

                {user?.role === "Administrador" && formUsuario.perfil !== "Administrador" && (
                  <Select label="Escola / Instituição *" value={formUsuario.escolaId} onChange={e => setUsuarioField("escolaId", e.target.value)}>
                    {escolas.map(esc => <option key={esc.id} value={esc.id}>{esc.nome}</option>)}
                  </Select>
                )}
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* Conteúdo Aba 3: Controle de Escolas */}
      {abaAtiva === "controle-escolas" && user?.role === "Administrador" && (
        <div>
          {alertaEscola && <Alert tipo={alertaEscola.tipo}>{alertaEscola.msg}</Alert>}

          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px", flex: 1, maxWidth: 300 }}>
              <i className="ti ti-search" style={{ color: "#9ca3af", fontSize: 16 }} />
              <input value={buscaEscola} onChange={e => setBuscaEscola(e.target.value)} placeholder="Buscar escolas..."
                style={{ border: "none", background: "none", fontSize: 13, outline: "none", width: "100%" }} />
            </div>
            <Btn variant="primary" onClick={abrirNovaEscola}>
              <i className="ti ti-plus" aria-hidden="true" /> Nova Escola
            </Btn>
          </div>

          <Card style={{ padding: 0, overflow: "hidden" }}>
            {carregandoEscolas ? <Spinner /> : !escolasFiltradas.length ? <EmptyState icon="school" texto="Nenhuma escola cadastrada." /> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Escola", "CNPJ", "Código INEP", "Município", "UF", "Localização", "Status", "Ações"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", borderBottom: "1px solid #e5e5e4" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {escolasFiltradas.map(e => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e5e4", flexShrink: 0 }}>
                            {e.fotoUrl ? (
                              <img src={e.fotoUrl} alt={e.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <i className="ti ti-school" style={{ fontSize: 13, color: "#9ca3af" }} />
                            )}
                          </div>
                          <span style={{ fontWeight: 500 }}>{e.nome}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{e.cnpj || "Não informado"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{e.inep || "—"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{e.municipio}</td>
                      <td style={{ padding: "10px 12px" }}><Badge color="blue">{e.uf}</Badge></td>
                      <td style={{ padding: "10px 12px" }}><Badge color={e.zona === "Rural" ? "amber" : "blue"}>{e.zona || "Urbana"}</Badge></td>
                      <td style={{ padding: "10px 12px" }}><Badge color={e.status === "Ativa" ? "green" : "gray"}>{e.status}</Badge></td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <Btn onClick={() => abrirEditarEscola(e)} style={{ padding: "4px 8px", fontSize: 12 }} title="Editar Escola"><i className="ti ti-edit" aria-hidden="true" /></Btn>
                          <Btn variant="danger" onClick={() => removerEscola(e)} style={{ padding: "4px 8px", fontSize: 12 }} title="Excluir Escola"><i className="ti ti-trash" aria-hidden="true" /></Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {modalEscolaAberto && (
            <Modal titulo={escolaEditId ? "Editar Escola" : "Nova Escola"} onClose={() => setModalEscolaAberto(false)} onSave={salvarEscola} salvando={salvandoEscola}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Upload Foto Escola */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#f9fafb", padding: 12, borderRadius: 8, border: "1px solid #e5e5e4", marginBottom: 4 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #1a56db", flexShrink: 0 }}>
                    {formEscola.fotoUrl ? (
                      <img src={formEscola.fotoUrl} alt="Visualização" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <i className="ti ti-school" style={{ fontSize: 20, color: "#9ca3af" }} />
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Logo / Avatar da Escola</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <label style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 12px",
                        background: "#1a56db",
                        color: "white",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: carregandoFoto ? "not-allowed" : "pointer",
                        opacity: carregandoFoto ? 0.7 : 1,
                        border: "1px solid #1a56db"
                      }}>
                        <i className="ti ti-upload" />
                        {carregandoFoto ? "Carregando..." : "Enviar Foto"}
                        <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, "escola")} disabled={carregandoFoto} style={{ display: "none" }} />
                      </label>
                      {formEscola.fotoUrl && (
                        <Btn variant="danger" onClick={() => setEscolaField("fotoUrl", "")} style={{ padding: "4px 10px", fontSize: 12 }}>
                          <i className="ti ti-trash" /> Remover
                        </Btn>
                      )}
                    </div>
                  </div>
                </div>

                <Input label="Nome da Escola *" value={formEscola.nome} onChange={val => setEscolaField("nome", val.target.value)} placeholder="Ex: Escola Municipal Inep 2026" />
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="CNPJ" value={formEscola.cnpj} onChange={val => setEscolaField("cnpj", formatCNPJ(val.target.value))} placeholder="00.000.000/0000-00" />
                  <Input label="Código INEP da Escola" value={formEscola.inep || ""} onChange={val => setEscolaField("inep", val.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="27012345" />
                </div>

                <Input label="Endereço da Unidade Escolar" value={formEscola.endereco || ""} onChange={val => setEscolaField("endereco", val.target.value)} placeholder="Ex: Av. Principal, 123 - Centro" />
                
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                  <Input label="Município *" value={formEscola.municipio} onChange={val => setEscolaField("municipio", val.target.value)} placeholder="Maceió" />
                  <Input label="UF *" value={formEscola.uf} onChange={val => setEscolaField("uf", val.target.value)} placeholder="AL" maxLength={2} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Select label="Zona de Localização *" value={formEscola.zona || "Urbana"} onChange={val => setEscolaField("zona", val.target.value)}>
                    <option>Urbana</option>
                    <option>Rural</option>
                  </Select>
                  <Select label="Status" value={formEscola.status} onChange={val => setEscolaField("status", val.target.value)}>
                    <option>Ativa</option>
                    <option>Inativa</option>
                  </Select>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* CropModal Centralizado */}
      {cropFile && (
        <CropModal
          file={cropFile}
          onClose={() => setCropFile(null)}
          onCrop={handleCropConfirm}
        />
      )}
    </div>
  );
}

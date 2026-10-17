import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import {
  getUsuarios,
  addUsuario,
  updateUsuario,
  deleteUsuario,
  criarUsuarioNoAuth
} from "../services/usuariosService";
import {
  getEscolas,
  addEscola,
  updateEscola,
  deleteEscola
} from "../services/escolasService";
import { comprimirEUploadFoto } from "../utils/upload";
import CropModal from "../components/CropModal";
import { formatCNPJ } from "../utils/masks";
import { injectMockData } from "../utils/mockDataGenerator";
import { Badge } from "../components/ui";

import styles from "./configuracoes/Configuracoes.module.css";
import MinhaConta from "./configuracoes/components/MinhaConta";
import ControleUsuarios from "./configuracoes/components/ControleUsuarios";
import ControleEscolas from "./configuracoes/components/ControleEscolas";
import {
  ModalUsuario,
  ModalEscola
} from "./configuracoes/components/ModaisConfiguracoes";

const VAZIO_USUARIO = {
  nome: "",
  email: "",
  senha: "",
  perfil: "Coordenador",
  status: "Ativo",
  fotoUrl: "",
  escolaId: ""
};

const VAZIO_ESCOLA = {
  nome: "",
  cnpj: "",
  inep: "",
  municipio: "Maceió",
  uf: "AL",
  status: "Ativa",
  fotoUrl: "",
  endereco: "",
  zona: "Urbana"
};

const PERFIS = [
  "Direção",
  "Coordenador",
  "Secretário",
  "Professor",
  "Administrador"
];

const STATUS = ["Ativo", "Inativo"];

export default function Configuracoes() {
  const {
    user,
    atualizarDadosUsuario,
    selectedEscolaId,
    escolas = [],
    recarregarEscolas
  } = useAuth();

  const isAdmin = user?.role === "Administrador";
  const podeGerenciar =
    user?.role === "Administrador" || user?.role === "Direção";

  // Filtro de usuários: se for admin, carrega todos da rede; se for diretor, carrega da sua escola
  const activeEscolaId = isAdmin
    ? null
    : user?.escolaId || selectedEscolaId || null;

  const {
    dados: usuarios,
    carregando,
    recarregar
  } = useFirestore(
    useCallback(() => getUsuarios(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  const {
    dados: escolasLista,
    carregando: carregandoEscolas,
    recarregar: recarregarEscolasLista
  } = useFirestore(getEscolas);

  // Abas de Configurações: 'minha-conta' | 'controle-usuarios' | 'controle-escolas'
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
  const [formEscola, setFormEscola] = useState(VAZIO_ESCOLA);
  const [escolaEditId, setEscolaEditId] = useState(null);
  const [modalEscolaAberto, setModalEscolaAberto] = useState(false);
  const [salvandoEscola, setSalvandoEscola] = useState(false);
  const [alertaEscola, setAlertaEscola] = useState(null);
  const [buscaEscola, setBuscaEscola] = useState("");

  // Estado Geral CropModal
  const [cropFile, setCropFile] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); // 'perfil', 'usuario' ou 'escola'
  const [carregandoFoto, setCarregandoFoto] = useState(false);

  // Estado Mobile UI
  const [resumoMobileAberto, setResumoMobileAberto] = useState(false);
  const mobileTabContainerRef = useRef(null);

  // Sincroniza dados do perfil com o AuthContext quando mudarem
  useEffect(() => {
    if (user?.displayName && !nomePerfil) {
      setNomePerfil(user.displayName);
    }
    if (user?.photoURL && !fotoPerfil) {
      setFotoPerfil(user.photoURL);
    }
  }, [user]);

  // Handlers para Form
  function setUsuarioField(campo, valor) {
    setFormUsuario((f) => ({ ...f, [campo]: valor }));
  }

  function setEscolaField(campo, valor) {
    setFormEscola((f) => ({ ...f, [campo]: valor }));
  }

  // Handlers para Crop e Upload de Fotos
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
        const url = await comprimirEUploadFoto(
          croppedFile,
          "usuarios",
          user.uid
        );
        setFotoPerfil(url);
      } else if (cropTarget === "usuario") {
        const url = await comprimirEUploadFoto(
          croppedFile,
          "usuarios",
          usuarioEditId || Date.now().toString()
        );
        setUsuarioField("fotoUrl", url);
      } else if (cropTarget === "escola") {
        const url = await comprimirEUploadFoto(
          croppedFile,
          "escolas",
          escolaEditId || Date.now().toString()
        );
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
    if (!nomePerfil) {
      alert("Nome é obrigatório.");
      return;
    }
    setSalvandoPerfil(true);
    try {
      await atualizarDadosUsuario({ nome: nomePerfil, fotoUrl: fotoPerfil });
      setAlertaPerfil({
        msg: "Perfil atualizado com sucesso!",
        tipo: "success"
      });
    } catch (error) {
      setAlertaPerfil({
        msg: "Erro ao atualizar perfil: " + error.message,
        tipo: "error"
      });
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function handleGerarMock() {
    if (
      !window.confirm(
        "Isto adicionará Turmas, Alunos, Professores e dados Financeiros fictícios à sua escola ativa para testes. Continuar?"
      )
    )
      return;
    setGerandoMock(true);
    try {
      await injectMockData(activeEscolaId);
      setAlertaPerfil({
        msg: "Dados fictícios criados com sucesso!",
        tipo: "success"
      });
    } catch (e) {
      setAlertaPerfil({
        msg: "Erro ao criar dados: " + e.message,
        tipo: "error"
      });
    } finally {
      setGerandoMock(false);
    }
  }

  // Ações Controle de Usuários
  function abrirNovoUsuario() {
    setFormUsuario({
      ...VAZIO_USUARIO,
      escolaId:
        user?.role === "Administrador"
          ? escolaFiltroUsuario || escolas[0]?.id || ""
          : user?.escolaId || selectedEscolaId || ""
    });
    setUsuarioEditId(null);
    setModalUsuarioAberto(true);
  }

  function abrirEditarUsuario(u) {
    setFormUsuario({ ...VAZIO_USUARIO, ...u, senha: "" });
    setUsuarioEditId(u.id);
    setModalUsuarioAberto(true);
  }

  async function salvarUsuario() {
    if (!formUsuario.nome || !formUsuario.email) {
      alert("Nome e e-mail são obrigatórios.");
      return;
    }
    if (!usuarioEditId && !formUsuario.senha) {
      alert("Senha é obrigatória para novos usuários.");
      return;
    }

    setSalvandoUsuario(true);
    try {
      const userTargetEscolaId =
        user?.role === "Administrador"
          ? formUsuario.perfil === "Administrador"
            ? ""
            : formUsuario.escolaId || ""
          : user?.escolaId || selectedEscolaId || "";

      if (usuarioEditId) {
        await updateUsuario(usuarioEditId, {
          nome: formUsuario.nome,
          email: formUsuario.email,
          perfil: formUsuario.perfil,
          status: formUsuario.status,
          fotoUrl: formUsuario.fotoUrl,
          escolaId: userTargetEscolaId
        });
        setAlertaUsuario({
          msg: `Usuário "${formUsuario.nome}" atualizado.`,
          tipo: "success"
        });
      } else {
        const uid = await criarUsuarioNoAuth(
          formUsuario.email,
          formUsuario.senha
        );
        await addUsuario(uid, {
          nome: formUsuario.nome,
          email: formUsuario.email,
          perfil: formUsuario.perfil,
          status: formUsuario.status,
          fotoUrl: formUsuario.fotoUrl,
          escolaId: userTargetEscolaId
        });
        setAlertaUsuario({
          msg: `Usuário "${formUsuario.nome}" criado com sucesso!`,
          tipo: "success"
        });
      }
      setModalUsuarioAberto(false);
      recarregar();
    } catch (error) {
      setAlertaUsuario({
        msg: "Erro ao salvar usuário: " + error.message,
        tipo: "error"
      });
    } finally {
      setSalvandoUsuario(false);
    }
  }

  async function removerUsuario(u) {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${u.nome}"?`))
      return;
    try {
      await deleteUsuario(u.id);
      setAlertaUsuario({ msg: "Usuário removido da base.", tipo: "success" });
      recarregar();
    } catch (error) {
      setAlertaUsuario({
        msg: "Erro ao remover usuário: " + error.message,
        tipo: "error"
      });
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
    if (!formEscola.nome || !formEscola.municipio) {
      alert("Nome e Município são obrigatórios.");
      return;
    }
    setSalvandoEscola(true);
    setAlertaEscola(null);
    try {
      if (escolaEditId) {
        await updateEscola(escolaEditId, formEscola);
        setAlertaEscola({
          msg: `Escola "${formEscola.nome}" atualizada com sucesso!`,
          tipo: "success"
        });
      } else {
        await addEscola(formEscola);
        setAlertaEscola({
          msg: `Escola "${formEscola.nome}" criada com sucesso!`,
          tipo: "success"
        });
      }
      setModalEscolaAberto(false);
      recarregarEscolasLista();
      await recarregarEscolas();
    } catch (error) {
      setAlertaEscola({
        msg: "Erro ao salvar escola: " + error.message,
        tipo: "error"
      });
    } finally {
      setSalvandoEscola(false);
    }
  }

  async function removerEscola(e) {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir a escola "${e.nome}"? Servidores e alunos continuarão vinculados no banco.`
      )
    )
      return;
    try {
      await deleteEscola(e.id);
      setAlertaEscola({ msg: "Escola removida.", tipo: "success" });
      recarregarEscolasLista();
      await recarregarEscolas();
    } catch (error) {
      setAlertaEscola({
        msg: "Erro ao remover escola: " + error.message,
        tipo: "error"
      });
    }
  }

  // Filtragens
  const escolasFiltradas = (escolasLista || []).filter(
    (e) =>
      e.nome?.toLowerCase().includes(buscaEscola.toLowerCase()) ||
      e.municipio?.toLowerCase().includes(buscaEscola.toLowerCase())
  );

  const usuariosFiltrados = (usuarios || []).filter((u) => {
    const matchBusca =
      (u.nome || "").toLowerCase().includes(buscaUsuario.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(buscaUsuario.toLowerCase()) ||
      (u.perfil || "").toLowerCase().includes(buscaUsuario.toLowerCase());
    const matchEscola =
      !escolaFiltroUsuario || u.escolaId === escolaFiltroUsuario;
    return matchBusca && matchEscola;
  });

  const escolaAtual =
    escolas.find((e) => e.id === user?.escolaId || e.id === selectedEscolaId) ||
    escolas[0];

  // Grupos de Menu Lateral Desktop
  const gruposMenu = useMemo(() => {
    const grupos = [
      {
        titulo: "Meu Perfil",
        itens: [
          {
            id: "minha-conta",
            label: "Minha Conta",
            subtitulo: "Dados cadastrais e foto",
            icon: "user",
            badge: null
          }
        ]
      }
    ];

    const adminItens = [];
    if (podeGerenciar) {
      adminItens.push({
        id: "controle-usuarios",
        label: "Controle de Usuários",
        subtitulo: "Acessos e cargos",
        icon: "users",
        badge: usuarios ? usuarios.length : null
      });
    }
    if (isAdmin) {
      adminItens.push({
        id: "controle-escolas",
        label: "Escolas Ativas",
        subtitulo: "Unidades municipais",
        icon: "school",
        badge: escolasLista ? escolasLista.length : null
      });
    }

    if (adminItens.length > 0) {
      grupos.push({
        titulo: "Administração Geral",
        itens: adminItens
      });
    }

    return grupos;
  }, [podeGerenciar, isAdmin, usuarios, escolasLista]);

  // Objeto da aba ativa
  const itemAtivoObj = useMemo(() => {
    for (const g of gruposMenu) {
      const found = g.itens.find((i) => i.id === abaAtiva);
      if (found) return found;
    }
    return gruposMenu[0].itens[0];
  }, [gruposMenu, abaAtiva]);

  // Auto-scroll da barra de abas no mobile
  useEffect(() => {
    if (mobileTabContainerRef.current) {
      const activeEl = mobileTabContainerRef.current.querySelector(
        `.${styles.mobileTabChipActive}`
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center"
        });
      }
    }
  }, [abaAtiva]);

  return (
    <div className={styles.container}>
      {/* ═════════════════════════════════════════════════════ */}
      {/* ── NAVEGAÇÃO MOBILE INTELIGENTE & ABAS DESLIZANTES ── */}
      {/* ═════════════════════════════════════════════════════ */}
      <div className={styles.mobileNavHeader}>
        {/* Barra Superior Mobile com Título e Ações Rápidas */}
        <div className={styles.mobileBarTop}>
          <div className={styles.mobileModuleTitle}>
            <div className={styles.mobileIconBadge}>
              <i className="ti ti-settings" />
            </div>
            <div className={styles.mobileTitleText}>
              <span className={styles.mobileTitleMain}>Configurações</span>
              <span className={styles.mobileTitleSub}>
                {itemAtivoObj?.label || "Minha Conta"}
              </span>
            </div>
          </div>

          <div className={styles.mobileBarActions}>
            <button
              type="button"
              className={`${styles.mobileActionButton} ${
                resumoMobileAberto ? styles.mobileActionButtonActive : ""
              }`}
              onClick={() => setResumoMobileAberto(!resumoMobileAberto)}
              title="Resumo do Sistema"
            >
              <i className="ti ti-chart-dots" />
              <span>Resumo</span>
            </button>

            {abaAtiva === "controle-usuarios" && (
              <button
                type="button"
                className={styles.mobileActionButton}
                onClick={abrirNovoUsuario}
                style={{
                  background: "#0284c7",
                  color: "#ffffff",
                  borderColor: "#38bdf8"
                }}
                title="Novo Usuário"
              >
                <i className="ti ti-user-plus" />
                <span>+ Novo</span>
              </button>
            )}

            {abaAtiva === "controle-escolas" && (
              <button
                type="button"
                className={styles.mobileActionButton}
                onClick={abrirNovaEscola}
                style={{
                  background: "#0284c7",
                  color: "#ffffff",
                  borderColor: "#38bdf8"
                }}
                title="Nova Escola"
              >
                <i className="ti ti-plus" />
                <span>+ Escola</span>
              </button>
            )}
          </div>
        </div>

        {/* Painel de Resumo Expansível no Mobile */}
        {resumoMobileAberto && (
          <div className={styles.mobileSummaryPanel}>
            <div className={styles.mobileSummaryGrid}>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Perfil Conectado</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#38bdf8" }}>
                  {user?.role || "Usuário"}
                </span>
              </div>
              <div className={styles.mobileSummaryItem}>
                <span className={styles.mobileSummaryLabel}>Escola Ativa</span>
                <span className={styles.mobileSummaryValue} style={{ color: "#ffffff" }}>
                  {isAdmin
                    ? "Rede Municipal"
                    : escolaAtual?.nome || "Não vinculada"}
                </span>
              </div>
              {podeGerenciar && (
                <div className={styles.mobileSummaryItem}>
                  <span className={styles.mobileSummaryLabel}>Total de Usuários</span>
                  <span
                    className={styles.mobileSummaryValue}
                    style={{ color: "#4ade80" }}
                  >
                    {usuarios ? usuarios.length : 0} cadastrados
                  </span>
                </div>
              )}
              {isAdmin && (
                <div className={styles.mobileSummaryItem}>
                  <span className={styles.mobileSummaryLabel}>Escolas da Rede</span>
                  <span
                    className={styles.mobileSummaryValue}
                    style={{ color: "#fbbf24" }}
                  >
                    {escolasLista ? escolasLista.length : 0} unidades
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Barra de Abas Deslizante no Topo (Sticky Touch Chips) */}
        <div className={styles.mobileTabsSticky}>
          <div className={styles.mobileTabsScroll} ref={mobileTabContainerRef}>
            {gruposMenu.flatMap((g) =>
              g.itens.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.mobileTabChip} ${
                    abaAtiva === item.id ? styles.mobileTabChipActive : ""
                  }`}
                  onClick={() => setAbaAtiva(item.id)}
                >
                  <i className={`ti ti-${item.icon}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className={styles.mobileTabBadge}>{item.badge}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── CONTEÚDO PRINCIPAL (COLUNA ESQUERDA) ───────────── */}
      {/* ═════════════════════════════════════════════════════ */}
      <div className={styles.contentCol}>
        {abaAtiva === "minha-conta" && (
          <MinhaConta
            user={user}
            nomePerfil={nomePerfil}
            setNomePerfil={setNomePerfil}
            fotoPerfil={fotoPerfil}
            setFotoPerfil={setFotoPerfil}
            salvandoPerfil={salvandoPerfil}
            alertaPerfil={alertaPerfil}
            salvarPerfil={salvarPerfil}
            handleFileSelect={handleFileSelect}
            carregandoFoto={carregandoFoto}
            escolas={escolas}
            handleGerarMock={handleGerarMock}
            gerandoMock={gerandoMock}
          />
        )}

        {abaAtiva === "controle-usuarios" && podeGerenciar && (
          <ControleUsuarios
            usuariosFiltrados={usuariosFiltrados}
            carregando={carregando}
            buscaUsuario={buscaUsuario}
            setBuscaUsuario={setBuscaUsuario}
            escolaFiltroUsuario={escolaFiltroUsuario}
            setEscolaFiltroUsuario={setEscolaFiltroUsuario}
            isAdmin={isAdmin}
            escolas={escolas}
            abrirNovoUsuario={abrirNovoUsuario}
            abrirEditarUsuario={abrirEditarUsuario}
            removerUsuario={removerUsuario}
            alertaUsuario={alertaUsuario}
          />
        )}

        {abaAtiva === "controle-escolas" && isAdmin && (
          <ControleEscolas
            escolasFiltradas={escolasFiltradas}
            carregandoEscolas={carregandoEscolas}
            buscaEscola={buscaEscola}
            setBuscaEscola={setBuscaEscola}
            abrirNovaEscola={abrirNovaEscola}
            abrirEditarEscola={abrirEditarEscola}
            removerEscola={removerEscola}
            alertaEscola={alertaEscola}
          />
        )}
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── COLUNA LATERAL DIREITA (DESKTOP ASIDE) ─────────── */}
      {/* ═════════════════════════════════════════════════════ */}
      <aside className={styles.desktopAside}>
        {/* Card de Usuário Resumido */}
        <div className={styles.sideUserCard}>
          <div className={styles.sideAvatar}>
            {user?.photoURL || fotoPerfil ? (
              <img src={user?.photoURL || fotoPerfil} alt="Perfil" />
            ) : (
              <i className="ti ti-user" style={{ fontSize: 24, color: "#94a3b8" }} />
            )}
          </div>
          <div className={styles.sideUserInfo}>
            <span className={styles.sideUserName}>
              {user?.displayName || nomePerfil || "Usuário Conectado"}
            </span>
            <span className={styles.sideUserEmail}>{user?.email || "—"}</span>
            <div style={{ marginTop: 4 }}>
              <Badge color="blue">{user?.role || "Usuário"}</Badge>
            </div>
          </div>
        </div>

        {/* Card do Menu de Navegação */}
        <div className={styles.sideCard}>
          <div className={styles.sideHeader}>
            <div className={styles.sideTitleWrap}>
              <div className={styles.sideLogo}>
                <i className="ti ti-settings" />
              </div>
              <div>
                <div className={styles.sideTitle}>Configurações</div>
                <div className={styles.sideSubtitle}>
                  Sistema & Preferências
                </div>
              </div>
            </div>
            <button
              type="button"
              className={styles.mobileActionButton}
              onClick={() => {
                recarregar();
                recarregarEscolasLista();
              }}
              title="Recarregar dados"
              style={{ padding: "6px 8px" }}
            >
              <i className="ti ti-refresh" />
            </button>
          </div>

          {gruposMenu.map((grupo, gIdx) => (
            <div key={grupo.titulo} style={{ marginTop: gIdx > 0 ? 12 : 0 }}>
              <div className={styles.sideGroupTitle}>{grupo.titulo}</div>
              <div className={styles.sideNavList}>
                {grupo.itens.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.sideNavItem} ${
                      abaAtiva === item.id ? styles.sideNavItemActive : ""
                    }`}
                    onClick={() => setAbaAtiva(item.id)}
                  >
                    <div className={styles.sideItemLeft}>
                      <i className={`ti ti-${item.icon} ${styles.sideItemIcon}`} />
                      <span className={styles.sideItemText}>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className={styles.sideItemBadge}>{item.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Rodapé da Instituição Ativa */}
          <div className={styles.sideFooter}>
            <span className={styles.sideFooterLabel}>Ambiente Ativo</span>
            <div className={styles.sideFooterTitle}>
              {isAdmin
                ? "🌐 Gestão Geral da Rede"
                : escolaAtual?.nome || "Escola Municipal"}
            </div>
            <div className={styles.sideFooterSub}>
              {isAdmin
                ? "Acesso Irrestrito Multi-Escola"
                : `${escolaAtual?.municipio || "Maceió"} - ${
                    escolaAtual?.uf || "AL"
                  }`}
            </div>
          </div>
        </div>
      </aside>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── MODAIS DE GESTÃO (USUÁRIOS & ESCOLAS) ─────────── */}
      {/* ═════════════════════════════════════════════════════ */}
      {modalUsuarioAberto && (
        <ModalUsuario
          usuarioEditId={usuarioEditId}
          formUsuario={formUsuario}
          setUsuarioField={setUsuarioField}
          onClose={() => setModalUsuarioAberto(false)}
          salvarUsuario={salvarUsuario}
          salvandoUsuario={salvandoUsuario}
          handleFileSelect={handleFileSelect}
          carregandoFoto={carregandoFoto}
          user={user}
          escolas={escolas}
          PERFIS={PERFIS}
          STATUS={STATUS}
        />
      )}

      {modalEscolaAberto && (
        <ModalEscola
          escolaEditId={escolaEditId}
          formEscola={formEscola}
          setEscolaField={setEscolaField}
          onClose={() => setModalEscolaAberto(false)}
          salvarEscola={salvarEscola}
          salvandoEscola={salvandoEscola}
          handleFileSelect={handleFileSelect}
          carregandoFoto={carregandoFoto}
          formatCNPJ={formatCNPJ}
        />
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

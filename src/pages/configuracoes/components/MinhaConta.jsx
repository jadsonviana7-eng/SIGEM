import { Input, Badge, Btn, Alert } from "../../../components/ui";
import styles from "./MinhaConta.module.css";

export default function MinhaConta({
  user,
  nomePerfil,
  setNomePerfil,
  fotoPerfil,
  setFotoPerfil,
  salvandoPerfil,
  alertaPerfil,
  salvarPerfil,
  handleFileSelect,
  carregandoFoto,
  escolas = [],
  handleGerarMock,
  gerandoMock
}) {
  const escolaVinculada = escolas.find((e) => e.id === user?.escolaId);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              <i className="ti ti-user" style={{ color: "#38bdf8" }} />
              Minha Conta & Perfil de Acesso
            </h2>
            <p className={styles.subtitle}>
              Gerencie suas informações cadastrais, avatar e credenciais institucionais
            </p>
          </div>
        </div>

        {alertaPerfil && <Alert tipo={alertaPerfil.tipo}>{alertaPerfil.msg}</Alert>}

        {/* Foto de Perfil com Upload / Crop */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarCircle}>
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Perfil" />
            ) : (
              <i className="ti ti-user" style={{ fontSize: 32, color: "#94a3b8" }} />
            )}
          </div>

          <div className={styles.avatarInfo}>
            <span className={styles.avatarTitle}>Foto do Perfil</span>
            <div className={styles.avatarActions}>
              <label className={styles.uploadBtn}>
                <i className="ti ti-upload" />
                {carregandoFoto ? "Carregando..." : "Alterar Foto"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, "perfil")}
                  disabled={carregandoFoto}
                  style={{ display: "none" }}
                />
              </label>
              {fotoPerfil && (
                <Btn
                  variant="danger"
                  onClick={() => setFotoPerfil("")}
                  style={{ padding: "8px 14px", fontSize: 13 }}
                >
                  <i className="ti ti-trash" /> Remover
                </Btn>
              )}
            </div>
          </div>
        </div>

        {/* Formulário de Identificação */}
        <Input
          label="Nome Completo *"
          value={nomePerfil}
          onChange={(e) => setNomePerfil(e.target.value)}
          placeholder="Seu nome completo"
        />

        <Input
          label="E-mail Institucional"
          value={user?.email || ""}
          disabled
          helper="O e-mail de acesso não pode ser alterado diretamente pelo usuário."
        />

        {/* Metadados: Perfil e Escola */}
        <div className={styles.infoGrid}>
          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Perfil no Sistema</span>
            <div style={{ marginTop: 2 }}>
              <Badge color="blue">{user?.role || "Usuário"}</Badge>
            </div>
          </div>

          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Escola Vinculada</span>
            <span className={styles.metaValue}>
              {user?.role === "Administrador"
                ? "Acesso Global à Rede Municipal"
                : escolaVinculada?.nome || "Não informada"}
            </span>
          </div>
        </div>

        {/* Botão de Salvar Alterações */}
        <div className={styles.saveRow}>
          <Btn
            variant="primary"
            onClick={salvarPerfil}
            disabled={salvandoPerfil}
            style={{ fontWeight: 700 }}
          >
            <i className="ti ti-device-floppy" />{" "}
            {salvandoPerfil ? "Salvando Alterações..." : "Salvar Alterações"}
          </Btn>
        </div>

        {/* Seção de Ambiente de Testes / Mock */}
        <div className={styles.mockSection}>
          <h4 className={styles.mockTitle}>
            <i className="ti ti-database" /> Ambiente de Demonstração / Dados de Teste
          </h4>
          <p className={styles.mockText}>
            Gere dados fictícios completos (alunos, turmas, professores e fluxo financeiro) na sua
            escola ativa para validar e explorar todas as funcionalidades do sistema.
          </p>
          <div>
            <Btn
              variant="default"
              onClick={handleGerarMock}
              disabled={gerandoMock}
              style={{ fontWeight: 600 }}
            >
              <i className="ti ti-database-import" />{" "}
              {gerandoMock ? "Injetando Dados..." : "Injetar Dados Fictícios de Teste"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Modal, Input, Select, Btn } from "../../../components/ui";
import styles from "./ModaisConfiguracoes.module.css";

export function ModalUsuario({
  usuarioEditId,
  formUsuario,
  setUsuarioField,
  onClose,
  salvarUsuario,
  salvandoUsuario,
  handleFileSelect,
  carregandoFoto,
  user,
  escolas = [],
  PERFIS = [],
  STATUS = []
}) {
  return (
    <Modal
      titulo={usuarioEditId ? "Editar Usuário" : "Novo Usuário"}
      onClose={onClose}
      semRodape={true}
      size="md"
    >
      <div className={styles.modalContent}>
        {/* Upload Foto Usuário */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarPreview}>
            {formUsuario.fotoUrl ? (
              <img src={formUsuario.fotoUrl} alt="Visualização" />
            ) : (
              <i className="ti ti-camera" style={{ fontSize: 24, color: "#94a3b8" }} />
            )}
          </div>
          <div className={styles.avatarInfo}>
            <span className={styles.avatarLabel}>Foto do Usuário</span>
            <div className={styles.avatarActions}>
              <label className={styles.uploadBtn}>
                <i className="ti ti-upload" />
                {carregandoFoto ? "Carregando..." : "Enviar Foto"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, "usuario")}
                  disabled={carregandoFoto}
                  style={{ display: "none" }}
                />
              </label>
              {formUsuario.fotoUrl && (
                <Btn
                  variant="danger"
                  onClick={() => setUsuarioField("fotoUrl", "")}
                  style={{ padding: "6px 10px", fontSize: 12 }}
                >
                  <i className="ti ti-trash" /> Remover
                </Btn>
              )}
            </div>
          </div>
        </div>

        <Input
          label="Nome completo *"
          value={formUsuario.nome}
          onChange={(e) => setUsuarioField("nome", e.target.value)}
          placeholder="Ex: João da Silva"
        />

        <Input
          label="E-mail Institucional *"
          type="email"
          value={formUsuario.email}
          onChange={(e) => setUsuarioField("email", e.target.value)}
          placeholder="usuario@escola.edu.br"
          disabled={!!usuarioEditId}
          helper={
            usuarioEditId
              ? "O e-mail de acesso não pode ser alterado após a criação."
              : ""
          }
        />

        {!usuarioEditId && (
          <Input
            label="Senha provisória *"
            type="password"
            value={formUsuario.senha}
            onChange={(e) => setUsuarioField("senha", e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        )}

        <div className={styles.formGrid2}>
          <Select
            label="Perfil de Acesso"
            value={formUsuario.perfil}
            onChange={(e) => setUsuarioField("perfil", e.target.value)}
          >
            {PERFIS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>

          <Select
            label="Status"
            value={formUsuario.status}
            onChange={(e) => setUsuarioField("status", e.target.value)}
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        {user?.role === "Administrador" && formUsuario.perfil !== "Administrador" && (
          <Select
            label="Escola / Instituição Vinculada *"
            value={formUsuario.escolaId}
            onChange={(e) => setUsuarioField("escolaId", e.target.value)}
          >
            <option value="">Selecione uma escola...</option>
            {escolas.map((esc) => (
              <option key={esc.id} value={esc.id}>
                {esc.nome}
              </option>
            ))}
          </Select>
        )}

        {/* Rodapé Justificado e Responsivo */}
        <div className={styles.modalFooter}>
          <Btn variant="outline" onClick={onClose} disabled={salvandoUsuario}>
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            onClick={salvarUsuario}
            disabled={salvandoUsuario}
          >
            <i className="ti ti-device-floppy" />{" "}
            {salvandoUsuario
              ? "Salvando..."
              : usuarioEditId
              ? "Atualizar Usuário"
              : "Criar Usuário"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export function ModalEscola({
  escolaEditId,
  formEscola,
  setEscolaField,
  onClose,
  salvarEscola,
  salvandoEscola,
  handleFileSelect,
  carregandoFoto,
  formatCNPJ
}) {
  return (
    <Modal
      titulo={escolaEditId ? "Editar Escola" : "Nova Escola"}
      onClose={onClose}
      semRodape={true}
      size="md"
    >
      <div className={styles.modalContent}>
        {/* Upload Logo da Escola */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarPreview}>
            {formEscola.fotoUrl ? (
              <img src={formEscola.fotoUrl} alt="Visualização" />
            ) : (
              <i className="ti ti-school" style={{ fontSize: 24, color: "#94a3b8" }} />
            )}
          </div>
          <div className={styles.avatarInfo}>
            <span className={styles.avatarLabel}>Logo / Brasão da Escola</span>
            <div className={styles.avatarActions}>
              <label className={styles.uploadBtn}>
                <i className="ti ti-upload" />
                {carregandoFoto ? "Carregando..." : "Enviar Foto"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, "escola")}
                  disabled={carregandoFoto}
                  style={{ display: "none" }}
                />
              </label>
              {formEscola.fotoUrl && (
                <Btn
                  variant="danger"
                  onClick={() => setEscolaField("fotoUrl", "")}
                  style={{ padding: "6px 10px", fontSize: 12 }}
                >
                  <i className="ti ti-trash" /> Remover
                </Btn>
              )}
            </div>
          </div>
        </div>

        <Input
          label="Nome da Escola *"
          value={formEscola.nome}
          onChange={(val) => setEscolaField("nome", val.target.value)}
          placeholder="Ex: Escola Municipal Inep 2026"
        />

        <div className={styles.formGrid2}>
          <Input
            label="CNPJ"
            value={formEscola.cnpj}
            onChange={(val) =>
              setEscolaField("cnpj", formatCNPJ(val.target.value))
            }
            placeholder="00.000.000/0000-00"
          />
          <Input
            label="Código INEP da Escola"
            value={formEscola.inep || ""}
            onChange={(val) =>
              setEscolaField(
                "inep",
                val.target.value.replace(/\D/g, "").slice(0, 8)
              )
            }
            placeholder="27012345"
          />
        </div>

        <Input
          label="Endereço da Unidade Escolar"
          value={formEscola.endereco || ""}
          onChange={(val) => setEscolaField("endereco", val.target.value)}
          placeholder="Ex: Av. Principal, 123 - Centro"
        />

        <div className={styles.formGrid21}>
          <Input
            label="Município *"
            value={formEscola.municipio}
            onChange={(val) => setEscolaField("municipio", val.target.value)}
            placeholder="Maceió"
          />
          <Input
            label="UF *"
            value={formEscola.uf}
            onChange={(val) => setEscolaField("uf", val.target.value)}
            placeholder="AL"
            maxLength={2}
          />
        </div>

        <div className={styles.formGrid2}>
          <Select
            label="Zona de Localização *"
            value={formEscola.zona || "Urbana"}
            onChange={(val) => setEscolaField("zona", val.target.value)}
          >
            <option value="Urbana">Urbana</option>
            <option value="Rural">Rural</option>
          </Select>

          <Select
            label="Status"
            value={formEscola.status}
            onChange={(val) => setEscolaField("status", val.target.value)}
          >
            <option value="Ativa">Ativa</option>
            <option value="Inativa">Inativa</option>
          </Select>
        </div>

        {/* Rodapé Justificado e Responsivo */}
        <div className={styles.modalFooter}>
          <Btn variant="outline" onClick={onClose} disabled={salvandoEscola}>
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            onClick={salvarEscola}
            disabled={salvandoEscola}
          >
            <i className="ti ti-device-floppy" />{" "}
            {salvandoEscola
              ? "Salvando..."
              : escolaEditId
              ? "Atualizar Escola"
              : "Cadastrar Escola"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

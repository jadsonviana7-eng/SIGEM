import { Modal, Btn } from "../../../components/ui";
import styles from "./ModaisFechamento.module.css";

/**
 * Modal 1: Professor solicita fechamento de período para a coordenação
 */
export function ModalSolicitar({
  item,
  bimestre,
  form,
  setForm,
  onConfirmar,
  onClose,
  salvando
}) {
  if (!item) return null;

  return (
    <Modal
      titulo={`Solicitar Fechamento · ${item.turma}`}
      onClose={onClose}
      width={560}
      semRodape={true}
    >
      <div className={styles.modalBody}>
        <div className={`${styles.alertBox} ${styles.alertInfo}`}>
          <div className={styles.alertHeader}>
            <i className="ti ti-info-circle" /> Solicitação Pedagógica
          </div>
          <div>
            Ao solicitar o fechamento, o diário da turma <strong>{item.turma}</strong> será
            submetido à coordenação pedagógica para conferência e trancamento oficial do{" "}
            <strong>{bimestre}</strong>.
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Total de Horas-Aula Ministradas no Período *
          </label>
          <input
            type="number"
            className={styles.input}
            value={form.totalAulasDadas}
            onChange={(e) =>
              setForm({ ...form, totalAulasDadas: Number(e.target.value) })
            }
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Observações / Declaração Docente
          </label>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="Ex: Todas as notas, recuperações e conteúdos foram devidamente lançados no sistema."
            value={form.observacao}
            onChange={(e) =>
              setForm({ ...form, observacao: e.target.value })
            }
          />
        </div>

        <div className={styles.modalActions}>
          <Btn variant="default" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            onClick={onConfirmar}
            disabled={salvando}
            style={{ fontWeight: 700 }}
          >
            <i className="ti ti-send" />{" "}
            {salvando ? "Enviando Solicitação..." : "Confirmar Solicitação 📤"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Modal 2: Coordenação valida e tranca o período da turma 🔒
 */
export function ModalValidar({
  item,
  formParecer,
  setFormParecer,
  onConfirmar,
  onClose,
  salvando
}) {
  if (!item) return null;

  return (
    <Modal
      titulo={`Validar e Trancar Período 🔒 · ${item.turma}`}
      onClose={onClose}
      width={560}
      semRodape={true}
    >
      <div className={styles.modalBody}>
        <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
          <div className={styles.alertHeader}>
            <i className="ti ti-lock" /> Homologação e Trancamento
          </div>
          <div>
            Ao homologar, o diário da turma <strong>{item.turma}</strong> ficará{" "}
            <strong>trancado</strong> para edições convencionais. Qualquer retificação futura exigirá
            justificativa formal e ficará registrada na trilha de auditoria.
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Parecer da Coordenação Pedagógica / Direção *
          </label>
          <textarea
            className={styles.textarea}
            rows={3}
            value={formParecer}
            onChange={(e) => setFormParecer(e.target.value)}
          />
        </div>

        <div className={styles.modalActions}>
          <Btn variant="default" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            onClick={onConfirmar}
            disabled={salvando}
            style={{
              fontWeight: 700,
              background: "#16a34a",
              borderColor: "#22c55e"
            }}
          >
            <i className="ti ti-lock" />{" "}
            {salvando ? "Homologando..." : "Homologar e Trancar 🔒"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Modal 3: Coordenação devolve diário com pendências ao professor ↩️
 */
export function ModalDevolver({
  item,
  formDevolucao,
  setFormDevolucao,
  onConfirmar,
  onClose,
  salvando
}) {
  if (!item) return null;

  return (
    <Modal
      titulo={`Devolver Diário · ${item.turma}`}
      onClose={onClose}
      width={560}
      semRodape={true}
    >
      <div className={styles.modalBody}>
        <div className={`${styles.alertBox} ${styles.alertDanger}`}>
          <div className={styles.alertHeader}>
            <i className="ti ti-alert-triangle" /> Correções Necessárias
          </div>
          <div>
            Informe ao professor os motivos da devolução para que realize as correções antes de
            submeter novamente o fechamento da turma <strong>{item.turma}</strong>.
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Pendências a serem sanadas pelo docente *
          </label>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="Ex: Faltam notas de recuperação paralela de 2 alunos e 3 registros de aula no diário."
            value={formDevolucao}
            onChange={(e) => setFormDevolucao(e.target.value)}
          />
        </div>

        <div className={styles.modalActions}>
          <Btn variant="default" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            variant="danger"
            onClick={onConfirmar}
            disabled={salvando}
            style={{ fontWeight: 700 }}
          >
            <i className="ti ti-arrow-back-up" />{" "}
            {salvando ? "Devolvendo..." : "Devolver ao Professor ↩️"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Modal 4: Reabertura com registro de auditoria 🛡️
 */
export function ModalReabrir({
  item,
  formJustificativa,
  setFormJustificativa,
  onConfirmar,
  onClose,
  salvando
}) {
  if (!item) return null;

  return (
    <Modal
      titulo={`Reabertura / Retificação Pós-Fechamento ⚠️`}
      onClose={onClose}
      width={560}
      semRodape={true}
    >
      <div className={styles.modalBody}>
        <div className={`${styles.alertBox} ${styles.alertWarning}`}>
          <div className={styles.alertHeader}>
            <i className="ti ti-shield-alert" /> Controle de Auditoria Ativo
          </div>
          <div>
            O período da turma <strong>{item.turma}</strong> já foi homologado e fechado.
            Qualquer retificação efetuada após este momento será gravada na trilha de auditoria com
            data, hora, seu usuário e justificativa legal.
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Justificativa Formal para a Reabertura *
          </label>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="Descreva o motivo legal/pedagógico da retificação (ex: Correção de nota após deferimento de recurso do aluno)."
            value={formJustificativa}
            onChange={(e) => setFormJustificativa(e.target.value)}
          />
        </div>

        <div className={styles.modalActions}>
          <Btn variant="default" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            onClick={onConfirmar}
            disabled={salvando}
            style={{
              fontWeight: 700,
              background: "#ea580c",
              borderColor: "#f97316"
            }}
          >
            <i className="ti ti-shield" />{" "}
            {salvando ? "Processando..." : "Autorizar e Registrar Auditoria 🛡️"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

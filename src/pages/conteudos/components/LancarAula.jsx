import { Btn, Input, Select } from "../../../components/ui";
import styles from "./LancarAula.module.css";

export default function LancarAula({
  turmas = [],
  form,
  setForm,
  handleSalvar,
  salvando = false,
  DISCIPLINAS = [],
  BIMESTRES = [],
  onCancelar,
  editId = null
}) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              <i className="ti ti-plus" style={{ color: "#818cf8" }} />
              {editId ? "Editar Registro de Aula" : "Registrar Nova Aula / Conteúdo"}
            </h2>
            <p className={styles.subtitle}>
              Lançamento oficial na caderneta de diário de classe da turma
            </p>
          </div>
        </div>

        {/* Linha 1: Turma e Data */}
        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Turma *</label>
            <Select
              value={form.turma}
              onChange={(e) => setForm((f) => ({ ...f, turma: e.target.value }))}
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.nome}>
                  {t.nome} ({t.ano} - {t.turno})
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Data da Aula *</label>
            <Input
              type="date"
              value={form.data}
              onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
            />
          </div>
        </div>

        {/* Linha 2: Disciplina, Bimestre e Nº de Aulas */}
        <div className={styles.formGrid3}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Componente / Disciplina *</label>
            <Select
              value={form.disciplina}
              onChange={(e) => setForm((f) => ({ ...f, disciplina: e.target.value }))}
            >
              {DISCIPLINAS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Bimestre *</label>
            <Select
              value={form.bimestre}
              onChange={(e) => setForm((f) => ({ ...f, bimestre: e.target.value }))}
            >
              {BIMESTRES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Nº Aulas *</label>
            <Input
              type="number"
              min="1"
              max="6"
              value={form.aulasQtd}
              onChange={(e) => setForm((f) => ({ ...f, aulasQtd: e.target.value }))}
            />
          </div>
        </div>

        {/* Linha 3: Conteúdo Ministrado */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Conteúdo Ministrado (Assunto / Tema da Aula) *
          </label>
          <textarea
            className={styles.textarea}
            value={form.conteudo}
            onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
            placeholder="Ex: Leitura e interpretação de texto narrativo; Identificação de personagens, tempo e espaço; Resolução de exercícios do livro didático (págs. 22 a 26)..."
          />
        </div>

        {/* Linha 4: Habilidade BNCC */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Habilidade / Competência Desenvolvida (BNCC / Currículo)
          </label>
          <Input
            value={form.habilidades}
            onChange={(e) => setForm((f) => ({ ...f, habilidades: e.target.value }))}
            placeholder="Ex: EF06LP01, EF06MA02 - Identificar a função social de textos..."
          />
        </div>

        {/* Linha 5: Docente Responsável */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Docente Responsável</label>
          <Input
            value={form.professor}
            onChange={(e) => setForm((f) => ({ ...f, professor: e.target.value }))}
            placeholder="Nome do professor(a)..."
          />
        </div>

        {/* Linha 6: Observações */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Observações Pedagógicas (Opcional)</label>
          <Input
            value={form.observacao}
            onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
            placeholder="Ex: Alunos em recuperação participaram da atividade com apoio pedagógico..."
          />
        </div>

        {/* Botões do Rodapé */}
        <div className={styles.footerActions}>
          {onCancelar && (
            <Btn variant="default" onClick={onCancelar}>
              Cancelar
            </Btn>
          )}
          <Btn
            variant="primary"
            onClick={handleSalvar}
            disabled={salvando}
            style={{ fontWeight: 700 }}
          >
            <i className="ti ti-device-floppy" />{" "}
            {salvando
              ? "Salvando no Diário..."
              : editId
              ? "Atualizar Aula"
              : "Salvar no Diário da Turma"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

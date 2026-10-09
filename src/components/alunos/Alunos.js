import React, { useEffect, useState, useCallback } from 'react';
import { getAlunos, addAluno, updateAluno, deleteAluno } from '../../services/alunosService';
import { ANOS_ESCOLARES, TURNOS, STATUS_ALUNO, gerarMatricula } from '../../utils/constants';
import styles from './Alunos.module.css';

const VAZIO = {
  nome: '', matricula: '', ano: '1º Ano', turma: '',
  turno: 'Manhã', nascimento: '', responsavel: '',
  tel: '', email: '', status: 'Ativo', observacoes: '',
};

export default function Alunos() {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroAno, setFiltroAno] = useState('');
  const [modal, setModal] = useState(null); // null | { mode: 'novo'|'editar', data }
  const [form, setForm] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setAlunos(await getAlunos());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function flash(texto, tipo = 'ok') {
    setMsg({ texto, tipo });
    setTimeout(() => setMsg(null), 3500);
  }

  function abrirNovo() {
    setForm({ ...VAZIO, matricula: gerarMatricula(alunos.length) });
    setModal({ mode: 'novo' });
  }

  function abrirEditar(aluno) {
    setForm({ ...VAZIO, ...aluno });
    setModal({ mode: 'editar', id: aluno.id });
  }

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    setSalvando(true);
    try {
      if (modal.mode === 'novo') {
        await addAluno(form);
        flash(`Aluno "${form.nome}" cadastrado.`);
      } else {
        await updateAluno(modal.id, form);
        flash(`Dados de "${form.nome}" atualizados.`);
      }
      setModal(null);
      carregar();
    } catch (err) {
      flash('Erro ao salvar. Tente novamente.', 'erro');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(aluno) {
    if (!window.confirm(`Remover "${aluno.nome}"? Esta ação não pode ser desfeita.`)) return;
    await deleteAluno(aluno.id);
    flash(`"${aluno.nome}" removido.`);
    carregar();
  }

  const lista = alunos.filter(a => {
    const buscaOk = !busca || a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.matricula?.includes(busca) || a.turma?.toLowerCase().includes(busca.toLowerCase());
    const anoOk = !filtroAno || a.ano === filtroAno;
    return buscaOk && anoOk;
  });

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Alunos</h1>
          <p className={styles.sub}>{alunos.length} alunos cadastrados</p>
        </div>
        <button className={styles.btnPrimary} onClick={abrirNovo}>
          + Novo aluno
        </button>
      </div>

      {msg && (
        <div className={`${styles.alert} ${msg.tipo === 'erro' ? styles.alertErro : styles.alertOk}`}>
          {msg.texto}
        </div>
      )}

      <div className={styles.filtros}>
        <input
          className={styles.busca}
          placeholder="Buscar por nome, matrícula ou turma..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)}>
          <option value="">Todos os anos</option>
          {ANOS_ESCOLARES.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      {loading ? (
        <p className={styles.loading}>Carregando...</p>
      ) : lista.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum aluno encontrado.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Nome</th>
                <th>Ano / Turma</th>
                <th>Turno</th>
                <th>Responsável</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map(a => (
                <tr key={a.id}>
                  <td className={styles.mono}>{a.matricula}</td>
                  <td className={styles.nome}>{a.nome}</td>
                  <td>
                    <span className={styles.chip}>{a.turma}</span>
                    <span className={styles.anoSub}> {a.ano}</span>
                  </td>
                  <td>{a.turno}</td>
                  <td>{a.responsavel}</td>
                  <td>
                    <span className={`${styles.badge} ${styles['badge' + a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className={styles.acoes}>
                    <button className={styles.btnIcon} onClick={() => abrirEditar(a)} title="Editar">✏️</button>
                    <button className={styles.btnIcon} onClick={() => excluir(a)} title="Excluir">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{modal.mode === 'novo' ? 'Novo aluno' : 'Editar aluno'}</h2>
              <button className={styles.btnFechar} onClick={() => setModal(null)}>✕</button>
            </div>

            <form onSubmit={salvar}>
              <div className={styles.formGrid2}>
                <div className={styles.field}>
                  <label>Nome completo *</label>
                  <input required value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    placeholder="Nome do aluno" />
                </div>
                <div className={styles.field}>
                  <label>Matrícula</label>
                  <input value={form.matricula}
                    onChange={e => setForm(f => ({ ...f, matricula: e.target.value }))} />
                </div>
              </div>

              <div className={styles.formGrid3}>
                <div className={styles.field}>
                  <label>Ano</label>
                  <select value={form.ano}
                    onChange={e => setForm(f => ({ ...f, ano: e.target.value }))}>
                    {ANOS_ESCOLARES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Turma</label>
                  <input value={form.turma} placeholder="Ex: 5A"
                    onChange={e => setForm(f => ({ ...f, turma: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Turno</label>
                  <select value={form.turno}
                    onChange={e => setForm(f => ({ ...f, turno: e.target.value }))}>
                    {TURNOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.field}>
                  <label>Data de nascimento</label>
                  <input type="date" value={form.nascimento}
                    onChange={e => setForm(f => ({ ...f, nascimento: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Status</label>
                  <select value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_ALUNO.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.field}>
                  <label>Responsável</label>
                  <input value={form.responsavel} placeholder="Nome do responsável"
                    onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Telefone</label>
                  <input value={form.tel} placeholder="(82) 99999-9999"
                    onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} />
                </div>
              </div>

              <div className={styles.field}>
                <label>Observações</label>
                <textarea rows={2} value={form.observacoes} placeholder="Informações adicionais..."
                  onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModal(null)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

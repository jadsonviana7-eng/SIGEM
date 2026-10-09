import React, { useEffect, useState, useCallback } from 'react';
import { getProfessores, addProfessor, updateProfessor, deleteProfessor } from '../../services/index';
import { TURNOS, DISCIPLINAS } from '../../utils/constants';
import styles from './Professores.module.css';

const VAZIO = {
  nome: '', cpf: '', email: '', tel: '',
  disciplinas: [], turno: 'Manhã', status: 'Ativo', formacao: '',
};

export default function Professores() {
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setProfessores(await getProfessores()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function flash(texto, tipo = 'ok') {
    setMsg({ texto, tipo });
    setTimeout(() => setMsg(null), 3500);
  }

  function toggleDisciplina(d) {
    setForm(f => ({
      ...f,
      disciplinas: f.disciplinas.includes(d)
        ? f.disciplinas.filter(x => x !== d)
        : [...f.disciplinas, d],
    }));
  }

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (modal.mode === 'novo') {
        await addProfessor(form);
        flash(`Professor "${form.nome}" cadastrado.`);
      } else {
        await updateProfessor(modal.id, form);
        flash(`Dados atualizados.`);
      }
      setModal(null);
      carregar();
    } catch {
      flash('Erro ao salvar.', 'erro');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(p) {
    if (!window.confirm(`Remover "${p.nome}"?`)) return;
    await deleteProfessor(p.id);
    flash(`Professor removido.`);
    carregar();
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Professores</h1>
          <p className={styles.sub}>{professores.length} professores cadastrados</p>
        </div>
        <button className={styles.btnPrimary}
          onClick={() => { setForm(VAZIO); setModal({ mode: 'novo' }); }}>
          + Novo professor
        </button>
      </div>

      {msg && (
        <div className={`${styles.alert} ${msg.tipo === 'erro' ? styles.alertErro : styles.alertOk}`}>
          {msg.texto}
        </div>
      )}

      {loading ? <p>Carregando...</p> : (
        <div className={styles.grid}>
          {professores.map(p => (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {p.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <div className={styles.cardNome}>{p.nome}</div>
                  <div className={styles.cardSub}>{p.turno} · {p.formacao || 'Professor'}</div>
                </div>
                <span className={`${styles.badge} ${p.status === 'Ativo' ? styles.badgeAtivo : styles.badgeInativo}`}>
                  {p.status}
                </span>
              </div>

              <div className={styles.cardDisciplinas}>
                {(p.disciplinas || []).map(d => (
                  <span key={d} className={styles.disc}>{d}</span>
                ))}
              </div>

              <div className={styles.cardContato}>
                {p.email && <span>📧 {p.email}</span>}
                {p.tel && <span>📱 {p.tel}</span>}
              </div>

              <div className={styles.cardAcoes}>
                <button className={styles.btnSec}
                  onClick={() => { setForm({ ...VAZIO, ...p }); setModal({ mode: 'editar', id: p.id }); }}>
                  Editar
                </button>
                <button className={styles.btnDanger} onClick={() => excluir(p)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{modal.mode === 'novo' ? 'Novo professor' : 'Editar professor'}</h2>
              <button className={styles.btnFechar} onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={salvar}>
              <div className={styles.formGrid2}>
                <div className={styles.field}>
                  <label>Nome completo *</label>
                  <input required value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>CPF</label>
                  <input value={form.cpf} placeholder="000.000.000-00"
                    onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} />
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.field}>
                  <label>E-mail</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Telefone</label>
                  <input value={form.tel}
                    onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} />
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.field}>
                  <label>Turno</label>
                  <select value={form.turno}
                    onChange={e => setForm(f => ({ ...f, turno: e.target.value }))}>
                    {TURNOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Status</label>
                  <select value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option>Ativo</option><option>Inativo</option>
                  </select>
                </div>
              </div>
              <div className={styles.field} style={{ marginBottom: 14 }}>
                <label>Formação</label>
                <input value={form.formacao} placeholder="Ex: Licenciatura em Matemática"
                  onChange={e => setForm(f => ({ ...f, formacao: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label>Disciplinas que leciona</label>
                <div className={styles.discGrid}>
                  {DISCIPLINAS.map(d => (
                    <label key={d} className={styles.discCheck}>
                      <input type="checkbox"
                        checked={form.disciplinas?.includes(d)}
                        onChange={() => toggleDisciplina(d)} />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSec} onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar professor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

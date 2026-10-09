import React, { useEffect, useState, useCallback } from 'react';
import { getTurmas, addTurma, updateTurma, deleteTurma, getProfessores, getAlunos } from '../../services/index';
import { ANOS_ESCOLARES, TURNOS } from '../../utils/constants';
import styles from './Turmas.module.css';

const VAZIO = { nome: '', ano: '1º Ano', turno: 'Manhã', professor: '', sala: '', vagas: 30 };

export default function Turmas() {
  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const [t, a, p] = await Promise.all([getTurmas(), getAlunos(), getProfessores()]);
    setTurmas(t); setAlunos(a); setProfessores(p);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (modal.mode === 'novo') await addTurma(form);
      else await updateTurma(modal.id, form);
      setModal(null);
      carregar();
    } finally { setSalvando(false); }
  }

  async function excluir(t) {
    if (!window.confirm(`Remover turma "${t.nome}"?`)) return;
    await deleteTurma(t.id);
    carregar();
  }

  function getOcupacao(turmaNome) {
    return alunos.filter(a => a.turma === turmaNome && a.status === 'Ativo').length;
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Turmas</h1>
          <p className={styles.sub}>{turmas.length} turmas cadastradas</p>
        </div>
        <button className={styles.btnPrimary}
          onClick={() => { setForm(VAZIO); setModal({ mode: 'novo' }); }}>
          + Nova turma
        </button>
      </div>

      {loading ? <p>Carregando...</p> : (
        <div className={styles.grid}>
          {turmas.map(t => {
            const ocup = getOcupacao(t.nome);
            const pct = Math.round(ocup / (t.vagas || 1) * 100);
            const cor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e';
            return (
              <div key={t.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.turmaNome}>{t.nome}</div>
                  <span className={styles.chip}>{t.turno}</span>
                </div>
                <div className={styles.anoLabel}>{t.ano}</div>
                {t.professor && <div className={styles.prof}>👨‍🏫 {t.professor}</div>}
                {t.sala && <div className={styles.sala}>🏫 Sala {t.sala}</div>}
                <div className={styles.ocupInfo}>
                  <span>{ocup} / {t.vagas} alunos</span>
                  <span style={{ color: cor }}>{pct}%</span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${pct}%`, background: cor }} />
                </div>
                <div className={styles.cardAcoes}>
                  <button className={styles.btnSec}
                    onClick={() => { setForm({ ...VAZIO, ...t }); setModal({ mode: 'editar', id: t.id }); }}>
                    Editar
                  </button>
                  <button className={styles.btnDanger} onClick={() => excluir(t)}>Remover</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{modal.mode === 'novo' ? 'Nova turma' : 'Editar turma'}</h2>
              <button className={styles.btnFechar} onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={salvar}>
              <div className={styles.formGrid2}>
                <div className={styles.field}>
                  <label>Nome da turma *</label>
                  <input required value={form.nome} placeholder="Ex: 5A"
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Ano</label>
                  <select value={form.ano}
                    onChange={e => setForm(f => ({ ...f, ano: e.target.value }))}>
                    {ANOS_ESCOLARES.map(a => <option key={a}>{a}</option>)}
                  </select>
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
                  <label>Sala</label>
                  <input value={form.sala} placeholder="Ex: 08"
                    onChange={e => setForm(f => ({ ...f, sala: e.target.value }))} />
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.field}>
                  <label>Professor responsável</label>
                  <select value={form.professor}
                    onChange={e => setForm(f => ({ ...f, professor: e.target.value }))}>
                    <option value="">Selecionar...</option>
                    {professores.map(p => <option key={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Vagas</label>
                  <input type="number" min="1" max="60" value={form.vagas}
                    onChange={e => setForm(f => ({ ...f, vagas: +e.target.value }))} />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSec} onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

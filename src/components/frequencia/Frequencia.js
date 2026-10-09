import React, { useEffect, useState, useCallback } from 'react';
import { getAlunosByTurma } from '../../services/alunosService';
import { getTurmas, getFrequencia, setFrequencia } from '../../services/index';
import { MESES, ANO_LETIVO, calcularPresenca } from '../../utils/constants';
import styles from './Frequencia.module.css';

export default function Frequencia() {
  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [turma, setTurma] = useState('');
  const [mes, setMes] = useState(new Date().getMonth());
  const [frequencias, setFrequencias] = useState({}); // { alunoId: { dia: 'P'|'F' } }
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    getTurmas().then(t => {
      setTurmas(t);
      if (t.length) setTurma(t[0].nome);
    });
  }, []);

  const carregarFrequencias = useCallback(async () => {
    if (!turma || !alunos.length) return;
    setLoading(true);
    const mapa = {};
    await Promise.all(
      alunos.map(async a => {
        const dados = await getFrequencia(a.id, ANO_LETIVO, mes);
        mapa[a.id] = dados.dias || {};
      })
    );
    setFrequencias(mapa);
    setLoading(false);
  }, [turma, alunos, mes]);

  useEffect(() => {
    if (!turma) return;
    setLoading(true);
    getAlunosByTurma(turma).then(a => {
      setAlunos(a.filter(al => al.status === 'Ativo'));
    });
  }, [turma]);

  useEffect(() => { carregarFrequencias(); }, [carregarFrequencias]);

  function toggleDia(alunoId, dia) {
    setFrequencias(prev => {
      const atual = prev[alunoId]?.[dia];
      const novoValor = atual === undefined ? 'P' : atual === 'P' ? 'F' : undefined;
      const dias = { ...(prev[alunoId] || {}) };
      if (novoValor === undefined) delete dias[dia];
      else dias[dia] = novoValor;
      return { ...prev, [alunoId]: dias };
    });
  }

  async function salvar() {
    setSalvando(true);
    try {
      await Promise.all(
        alunos.map(a =>
          setFrequencia(a.id, turma, ANO_LETIVO, mes, frequencias[a.id] || {})
        )
      );
      setMsg({ texto: 'Frequência salva com sucesso!', tipo: 'ok' });
      setTimeout(() => setMsg(null), 3000);
    } catch {
      setMsg({ texto: 'Erro ao salvar. Tente novamente.', tipo: 'erro' });
    } finally {
      setSalvando(false);
    }
  }

  const diasNoMes = new Date(ANO_LETIVO, mes + 1, 0).getDate();
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Frequência</h1>
          <p className={styles.sub}>Clique no dia para alternar: vazio → P (presente) → F (falta)</p>
        </div>
        <button className={styles.btnPrimary} onClick={salvar} disabled={salvando || !alunos.length}>
          {salvando ? 'Salvando...' : '💾 Salvar frequência'}
        </button>
      </div>

      {msg && (
        <div className={`${styles.alert} ${msg.tipo === 'erro' ? styles.alertErro : styles.alertOk}`}>
          {msg.texto}
        </div>
      )}

      <div className={styles.filtros}>
        <div className={styles.field}>
          <label>Turma</label>
          <select value={turma} onChange={e => setTurma(e.target.value)}>
            {turmas.map(t => <option key={t.id} value={t.nome}>{t.nome} — {t.ano}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label>Mês</label>
          <select value={mes} onChange={e => setMes(+e.target.value)}>
            {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </div>
      </div>

      {loading ? <p>Carregando...</p> : alunos.length === 0 ? (
        <div className={styles.vazio}>Nenhum aluno ativo nesta turma.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thNome}>Aluno</th>
                {dias.map(d => <th key={d} className={styles.thDia}>{d}</th>)}
                <th className={styles.thPct}>% Pres.</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map(a => {
                const diasAluno = frequencias[a.id] || {};
                const pct = calcularPresenca(diasAluno);
                return (
                  <tr key={a.id}>
                    <td className={styles.tdNome}>
                      {a.nome.split(' ')[0]} {a.nome.split(' ').slice(-1)[0]}
                    </td>
                    {dias.map(d => {
                      const v = diasAluno[d];
                      return (
                        <td key={d} className={styles.tdDia}>
                          <div
                            className={`${styles.diaBtn} ${v === 'P' ? styles.presente : v === 'F' ? styles.falta : styles.neutro}`}
                            onClick={() => toggleDia(a.id, d)}
                            title={v || '—'}
                          >
                            {v || '·'}
                          </div>
                        </td>
                      );
                    })}
                    <td>
                      {pct !== null ? (
                        <span className={`${styles.badge} ${pct >= 75 ? styles.badgeOk : styles.badgeRisco}`}>
                          {pct}%
                        </span>
                      ) : <span className={styles.badgeNeutro}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

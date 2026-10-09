import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAlunos } from '../../services/alunosService';
import { getProfessores, getTurmas } from '../../services/index';
import { ANOS_ESCOLARES } from '../../utils/constants';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [alunos, setAlunos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAlunos(), getProfessores(), getTurmas()])
      .then(([a, p, t]) => { setAlunos(a); setProfessores(p); setTurmas(t); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Carregando...</div>;

  const ativos = alunos.filter(a => a.status === 'Ativo').length;
  const transferidos = alunos.filter(a => a.status === 'Transferido').length;

  return (
    <div>
      <h1 className={styles.title}>Painel</h1>
      <p className={styles.sub}>Visão geral do ano letivo 2026</p>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricIcon}>👥</div>
          <div className={styles.metricValue}>{alunos.length}</div>
          <div className={styles.metricLabel}>Total de alunos</div>
          <div className={styles.metricSub}>{ativos} ativos</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricIcon}>👨‍🏫</div>
          <div className={styles.metricValue}>{professores.length}</div>
          <div className={styles.metricLabel}>Professores</div>
          <div className={styles.metricSub}>{professores.filter(p => p.status === 'Ativo').length} ativos</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricIcon}>📚</div>
          <div className={styles.metricValue}>{turmas.length}</div>
          <div className={styles.metricLabel}>Turmas</div>
          <div className={styles.metricSub}>{ANOS_ESCOLARES.length} anos letivos</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricIcon}>📤</div>
          <div className={styles.metricValue}>{transferidos}</div>
          <div className={styles.metricLabel}>Transferidos</div>
          <div className={styles.metricSub}>em 2026</div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Alunos por ano</h2>
          {ANOS_ESCOLARES.map(ano => {
            const q = alunos.filter(a => a.ano === ano).length;
            const pct = alunos.length ? Math.round(q / alunos.length * 100) : 0;
            return (
              <div key={ano} className={styles.barRow}>
                <div className={styles.barLabel}>{ano}</div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${pct || 1}%` }} />
                </div>
                <div className={styles.barCount}>{q}</div>
              </div>
            );
          })}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Atalhos rápidos</h2>
          <div className={styles.shortcuts}>
            {[
              { to: '/alunos', icon: '➕', label: 'Cadastrar novo aluno' },
              { to: '/frequencia', icon: '📅', label: 'Lançar frequência' },
              { to: '/notas', icon: '📝', label: 'Lançar notas' },
              { to: '/relatorios', icon: '📈', label: 'Ver relatórios' },
            ].map(s => (
              <Link key={s.to} to={s.to} className={styles.shortcut}>
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

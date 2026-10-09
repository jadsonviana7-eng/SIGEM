import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Layout.module.css';

const NAV = [
  { to: '/', label: 'Painel', icon: '📊', exact: true },
  { to: '/alunos', label: 'Alunos', icon: '👥' },
  { to: '/professores', label: 'Professores', icon: '👨‍🏫' },
  { to: '/turmas', label: 'Turmas', icon: '📚' },
  { to: '/frequencia', label: 'Frequência', icon: '📅' },
  { to: '/notas', label: 'Notas', icon: '📝' },
  { to: '/relatorios', label: 'Relatórios', icon: '📈' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className={styles.app}>
      <aside className={`${styles.sidebar} ${menuOpen ? styles.open : ''}`}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🏫</span>
          <div>
            <div className={styles.brandName}>SIGEM</div>
            <div className={styles.brandSub}>Ens. Fundamental 2026</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>Geral</div>
          {NAV.slice(0, 1).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}

          <div className={styles.navSection}>Cadastros</div>
          {NAV.slice(1, 4).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}

          <div className={styles.navSection}>Acadêmico</div>
          {NAV.slice(4, 6).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}

          <div className={styles.navSection}>Relatórios</div>
          {NAV.slice(6).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.userArea}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.menuToggle}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Abrir menu"
          >
            ☰
          </button>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      {menuOpen && (
        <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}

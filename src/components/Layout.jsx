import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { path: '/', label: 'Ana Sayfa', icon: '🏠', exact: true },
  {
    label: 'Personel Yönetimi', icon: '👥',
    children: [
      { path: '/personnel',        label: 'Personel Listesi' },
      { path: '/personnel/assign', label: 'Personel Atama' },
      { path: '/personnel/bulk',   label: 'Toplu Atama' },
    ],
  },
  {
    label: 'Organizasyon', icon: '🏢',
    children: [
      { path: '/organization/units',     label: 'Birimler' },
      { path: '/organization/positions', label: 'Pozisyonlar' },
      { path: '/organization/titles',    label: 'Ünvanlar' },
      { path: '/organization/roles',     label: 'Roller' },
    ],
  },
  {
    label: 'Doküman Yönetimi', icon: '📄',
    children: [
      { path: '/dms/documents', label: 'Dokümanlar' },
      { path: '/dms/types', label: 'Doküman Türleri' },
      { path: '/dms/statuses', label: 'Durumlar' },
      { path: '/dms/distributions', label: 'Dağıtımlar' },
    ],
  },
  {
    label: 'Süreçler', icon: '⚙️',
    children: [
      { path: '/processes', label: 'Süreçler' },
      { path: '/processes/kpis', label: 'KPI\'lar' },
    ],
  },
  {
    label: 'Ayarlar', icon: '🛠️',
    children: [
      { path: '/settings/import',        label: 'Toplu Veri Aktarımı' },
      { path: '/settings/code-patterns', label: 'Süreç Kodu Yapısı' },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState({});

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoText}>KYS</span>
          <span style={styles.logoSub}>Yönetim Sistemi</span>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) =>
            item.children ? (
              <div key={item.label}>
                <button
                  style={styles.menuGroup}
                  onClick={() => toggleMenu(item.label)}
                >
                  <span>{item.icon} {item.label}</span>
                  <span>{openMenus[item.label] ? '▲' : '▼'}</span>
                </button>
                {openMenus[item.label] && (
                  <div style={styles.subMenu}>
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        style={({ isActive }) => ({
                          ...styles.subLink,
                          ...(isActive ? styles.activeLink : {}),
                        })}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                style={({ isActive }) => ({
                  ...styles.navLink,
                  ...(isActive ? styles.activeLink : {}),
                })}
              >
                {item.icon} {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div style={styles.userSection}>
          <span style={styles.username}>{user?.username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Çıkış
          </button>
        </div>
      </aside>

      {/* İçerik */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', background: '#f5f6fa' },
  sidebar: {
    width: '240px',
    background: '#1a1a2e',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  logo: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  logoText: { color: '#fff', fontSize: '22px', fontWeight: '700', letterSpacing: '3px' },
  logoSub: { color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '2px' },
  nav: { flex: 1, padding: '16px 0', overflowY: 'auto' },
  navLink: {
    display: 'block',
    padding: '11px 20px',
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  menuGroup: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '11px 20px',
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  subMenu: { background: 'rgba(0,0,0,0.2)' },
  subLink: {
    display: 'block',
    padding: '9px 20px 9px 36px',
    color: 'rgba(255,255,255,0.6)',
    textDecoration: 'none',
    fontSize: '13px',
  },
  activeLink: {
    color: '#fff',
    background: 'rgba(255,255,255,0.1)',
    borderLeft: '3px solid #e94560',
  },
  userSection: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  username: { color: 'rgba(255,255,255,0.8)', fontSize: '13px' },
  logoutBtn: {
    background: 'rgba(233,69,96,0.2)',
    border: '1px solid rgba(233,69,96,0.5)',
    color: '#e94560',
    padding: '5px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  main: { flex: 1, padding: '32px', overflowY: 'auto' },
};

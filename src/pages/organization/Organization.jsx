import { useState } from 'react';
import Units from './Units';
import Positions from './Positions';
import Titles from './Titles';
import Roles from './Roles';

const TABS = [
  { key: 'units',     label: 'Birimler',    icon: '🏢' },
  { key: 'positions', label: 'Pozisyonlar', icon: '💼' },
  { key: 'titles',    label: 'Ünvanlar',    icon: '🎖️' },
  { key: 'roles',     label: 'Roller',      icon: '👤' },
];

export default function Organization() {
  const [active, setActive] = useState('units');

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Organizasyon</h2>
        <p style={s.sub}>Yapısal tanımlamalar</p>
      </div>

      <div style={s.layout}>
        {/* Yan Sekme */}
        <aside style={s.sidebar}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              style={{ ...s.sideItem, ...(active === tab.key ? s.sideActive : {}) }}
              onClick={() => setActive(tab.key)}
            >
              <span style={s.sideIcon}>{tab.icon}</span>
              <span>{tab.label}</span>
              {active === tab.key && <span style={s.sideArrow}>›</span>}
            </button>
          ))}
        </aside>

        {/* İçerik */}
        <div style={s.content}>
          {active === 'units'     && <Units />}
          {active === 'positions' && <Positions />}
          {active === 'titles'    && <Titles />}
          {active === 'roles'     && <Roles />}
        </div>
      </div>
    </div>
  );
}

const s = {
  header:  { marginBottom: '20px' },
  title:   { margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a2e' },
  sub:     { margin: '4px 0 0', fontSize: '13px', color: '#888' },

  layout:  { display: 'flex', gap: '0', background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', minHeight: '600px' },

  sidebar: {
    width: '180px',
    flexShrink: 0,
    background: '#f8fafc',
    borderRight: '1px solid #e8e8e8',
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 0',
  },
  sideItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 16px',
    background: 'none', border: 'none',
    cursor: 'pointer', textAlign: 'left',
    fontSize: '14px', fontWeight: 500, color: '#555',
    transition: 'all 0.15s',
    position: 'relative',
  },
  sideActive: {
    color: '#0f3460',
    background: '#eff6ff',
    fontWeight: 700,
    borderLeft: '3px solid #0f3460',
  },
  sideIcon:  { fontSize: '16px', flexShrink: 0 },
  sideArrow: { marginLeft: 'auto', fontSize: '16px', color: '#0f3460' },

  content: { flex: 1, padding: '24px', overflowY: 'auto' },
};

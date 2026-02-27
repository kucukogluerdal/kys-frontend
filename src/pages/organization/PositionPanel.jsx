import { useState, useEffect } from 'react';
import { positionsApi, unitsApi, rolesApi } from '../../api/organization';

const LEVELS = {
  GOVERNANCE: 'Yönetişim',
  EXECUTIVE:  'Üst Yönetim',
  MANAGER:    'Yönetim',
  STAFF:      'Çalışan',
};

const ROLE_COLORS = { STRATEGIC: '#6d28d9', MANAGERIAL: '#0369a1', OPERATIONAL: '#059669' };

/**
 * Pozisyon detay + birim/rol atama paneli (master-detail sağ panel)
 * Props: positionId, onClose, onRefresh
 */
export default function PositionPanel({ positionId, onClose, onRefresh }) {
  const [detail, setDetail]       = useState(null);
  const [allUnits, setAllUnits]   = useState([]);
  const [allRoles, setAllRoles]   = useState([]);
  const [loading, setLoading]     = useState(true);

  // Birim atama
  const [unitSearch, setUnitSearch]   = useState('');
  const [unitMsg, setUnitMsg]         = useState('');

  // Rol atama
  const [roleSearch, setRoleSearch]   = useState('');
  const [roleMsg, setRoleMsg]         = useState('');

  const loadDetail = async () => {
    setLoading(true);
    try {
      const [detailRes, unitsRes, rolesRes] = await Promise.all([
        positionsApi.detail(positionId),
        unitsApi.list(),
        rolesApi.list(),
      ]);
      setDetail(detailRes.data);
      setAllUnits(unitsRes.data);
      setAllRoles(rolesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (positionId) loadDetail();
  }, [positionId]);

  if (!positionId) return null;

  const assignedUnitIds = new Set((detail?.units || []).map(u => u.id));
  const assignedRoleIds = new Set((detail?.roles || []).map(r => r.id));

  const availableUnits = allUnits
    .filter(u => !assignedUnitIds.has(u.id))
    .filter(u => !unitSearch || u.name.toLowerCase().includes(unitSearch.toLowerCase()) || u.code.toLowerCase().includes(unitSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const availableRoles = allRoles
    .filter(r => !assignedRoleIds.has(r.id))
    .filter(r => !roleSearch || r.name.toLowerCase().includes(roleSearch.toLowerCase()) || r.code.toLowerCase().includes(roleSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const handleAssignUnit = async (unitId) => {
    try {
      await positionsApi.assignUnits(positionId, [unitId]);
      setUnitMsg('success');
      loadDetail();
      onRefresh?.();
    } catch { setUnitMsg('error'); }
  };

  const handleRemoveUnit = async (unitId) => {
    try {
      await positionsApi.removeUnit(positionId, unitId);
      setUnitMsg('success');
      loadDetail();
      onRefresh?.();
    } catch { setUnitMsg('error'); }
  };

  const handleAssignRole = async (roleId) => {
    try {
      await positionsApi.assignRoles(positionId, [roleId]);
      setRoleMsg('success');
      loadDetail();
      onRefresh?.();
    } catch { setRoleMsg('error'); }
  };

  const handleRemoveRole = async (roleId) => {
    try {
      await positionsApi.removeRole(positionId, roleId);
      setRoleMsg('success');
      loadDetail();
      onRefresh?.();
    } catch { setRoleMsg('error'); }
  };

  if (loading) return (
    <div style={s.panel}>
      <div style={s.header}>
        <div style={s.loadingText}>Yükleniyor...</div>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>
    </div>
  );

  if (!detail) return null;

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInfo}>
          <div style={s.name}>{detail.name}</div>
          <div style={s.meta}>
            <span style={s.codeBadge}>{detail.code}</span>
            {detail.level && <span style={s.levelBadge}>{LEVELS[detail.level] || detail.level}</span>}
          </div>
        </div>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div style={s.body}>
        {/* ─── Atanmış Birimler ─── */}
        <div style={s.section}>
          <div style={s.sectionLabel}>
            Atanmış Birimler
            <span style={s.badge}>{detail.units?.length || 0}</span>
          </div>

          {detail.units?.length > 0 ? (
            <div style={s.chipList}>
              {detail.units.map(u => (
                <div key={u.id} style={s.chip}>
                  <span style={s.chipCode}>{u.code}</span>
                  <span>{u.name}</span>
                  <button style={s.chipRemove} onClick={() => handleRemoveUnit(u.id)} title="Kaldır">✕</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={s.empty}>Henüz birim atanmamış</div>
          )}

          {availableUnits.length > 0 && (
            <div style={s.addSection}>
              <div style={s.addTitle}>Birim Ekle</div>
              <input
                style={s.searchInput}
                placeholder="Ara..."
                value={unitSearch}
                onChange={e => setUnitSearch(e.target.value)}
              />
              <div style={s.addList}>
                {availableUnits.slice(0, 8).map(u => (
                  <div key={u.id} style={s.addRow} onClick={() => handleAssignUnit(u.id)}>
                    <span style={s.addCode}>{u.code}</span>
                    <span style={s.addName}>{u.name}</span>
                    <span style={s.addIcon}>+</span>
                  </div>
                ))}
                {availableUnits.length > 8 && (
                  <div style={s.moreHint}>{availableUnits.length - 8} daha var, arama yapın</div>
                )}
              </div>
            </div>
          )}
          {unitMsg === 'error' && <div style={s.errMsg}>❌ Hata oluştu</div>}
        </div>

        <div style={s.divider} />

        {/* ─── Atanmış Roller ─── */}
        <div style={s.section}>
          <div style={s.sectionLabel}>
            Atanmış Roller
            <span style={s.badge}>{detail.roles?.length || 0}</span>
          </div>

          {detail.roles?.length > 0 ? (
            <div style={s.chipList}>
              {detail.roles.map(r => (
                <div key={r.id} style={{ ...s.chip, borderColor: ROLE_COLORS[r.roleType] || '#ddd' }}>
                  <span style={{ ...s.chipCode, color: ROLE_COLORS[r.roleType] || '#888' }}>{r.code}</span>
                  <span>{r.name}</span>
                  <button style={s.chipRemove} onClick={() => handleRemoveRole(r.id)} title="Kaldır">✕</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={s.empty}>Henüz rol atanmamış</div>
          )}

          {availableRoles.length > 0 && (
            <div style={s.addSection}>
              <div style={s.addTitle}>Rol Ekle</div>
              <input
                style={s.searchInput}
                placeholder="Ara..."
                value={roleSearch}
                onChange={e => setRoleSearch(e.target.value)}
              />
              <div style={s.addList}>
                {availableRoles.slice(0, 8).map(r => (
                  <div key={r.id} style={s.addRow} onClick={() => handleAssignRole(r.id)}>
                    <span style={{ ...s.addCode, color: ROLE_COLORS[r.roleType] || '#888' }}>{r.code}</span>
                    <span style={s.addName}>{r.name}</span>
                    <span style={s.addIcon}>+</span>
                  </div>
                ))}
                {availableRoles.length > 8 && (
                  <div style={s.moreHint}>{availableRoles.length - 8} daha var, arama yapın</div>
                )}
              </div>
            </div>
          )}
          {roleMsg === 'error' && <div style={s.errMsg}>❌ Hata oluştu</div>}
        </div>
      </div>
    </div>
  );
}

const s = {
  panel:      { height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '12px', border: '1px solid #e8e8e8', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' },
  header:     { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e8e8e8', flexShrink: 0 },
  headerInfo: { flex: 1 },
  name:       { fontWeight: 700, fontSize: '16px', color: '#1a1a2e' },
  meta:       { display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' },
  codeBadge:  { fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px', fontFamily: 'monospace' },
  levelBadge: { fontSize: '11px', color: '#0f3460', background: '#eff6ff', padding: '2px 7px', borderRadius: '4px', border: '1px solid #bfdbfe' },
  closeBtn:   { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px', flexShrink: 0 },
  loadingText:{ color: '#888', fontSize: '14px' },

  body:       { flex: 1, overflowY: 'auto', padding: '20px' },
  section:    { marginBottom: '8px' },
  sectionLabel:{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#0f3460', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' },
  badge:      { background: '#e0f2fe', color: '#0369a1', fontSize: '11px', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 },
  divider:    { borderTop: '2px solid #f0f0f0', margin: '20px 0' },
  empty:      { color: '#aaa', fontSize: '13px', fontStyle: 'italic', marginBottom: '12px' },

  chipList:   { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' },
  chip:       { display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#333' },
  chipCode:   { fontSize: '10px', color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace' },
  chipRemove: { background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px', padding: '0 2px', lineHeight: 1 },

  addSection: { background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '8px', padding: '12px' },
  addTitle:   { fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  searchInput:{ width: '100%', padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' },
  addList:    { display: 'flex', flexDirection: 'column', gap: '1px' },
  addRow:     { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', cursor: 'pointer', borderRadius: '6px', fontSize: '12px' },
  addCode:    { fontSize: '10px', color: '#888', background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace', flexShrink: 0 },
  addName:    { flex: 1, color: '#333' },
  addIcon:    { color: '#22c55e', fontWeight: 700, fontSize: '16px', flexShrink: 0 },
  moreHint:   { fontSize: '11px', color: '#aaa', textAlign: 'center', padding: '4px', fontStyle: 'italic' },
  errMsg:     { padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', fontSize: '12px', marginTop: '8px' },
};

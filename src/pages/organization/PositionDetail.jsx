import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { positionsApi, unitsApi, rolesApi } from '../../api/organization';
import { useAuth } from '../../context/AuthContext';

const LEVELS = { GOVERNANCE: 'Yönetişim', EXECUTIVE: 'Üst Yönetim', MANAGER: 'Yönetim', STAFF: 'Çalışan' };
const ROLE_TYPE_LABEL = { STRATEGIC: 'Stratejik', MANAGERIAL: 'Yönetsel', OPERATIONAL: 'Operasyonel' };
const ROLE_TYPE_COLOR = { STRATEGIC: '#6d28d9', MANAGERIAL: '#0369a1', OPERATIONAL: '#0f3460' };
const LEVEL_COLOR = { GOVERNANCE: '#6d28d9', EXECUTIVE: '#0f3460', MANAGER: '#0369a1', STAFF: '#555' };

function CheckList({ items, selected, onToggle }) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div style={cl.wrap}>
      {items.length > 5 && (
        <input
          style={cl.search}
          placeholder="Ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      )}
      {filtered.length === 0
        ? <div style={cl.empty}>Eklenecek birim yok</div>
        : filtered.map(item => (
          <label key={item.id} style={cl.row}>
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => onToggle(item.id)}
              style={{ accentColor: '#0f3460' }}
            />
            <span style={cl.name}>{item.name}</span>
            <span style={cl.sub}>{item.code}</span>
          </label>
        ))
      }
    </div>
  );
}

const cl = {
  wrap: { border: '1.5px solid #e2e8f0', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', background: '#fafafa' },
  search: { width: '100%', padding: '7px 10px', border: 'none', borderBottom: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box' },
  row: { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '13px' },
  name: { flex: 1, color: '#1a1a2e', fontWeight: '500' },
  sub: { fontSize: '11px', color: '#888', background: '#f0f0f0', padding: '1px 6px', borderRadius: '8px' },
  empty: { padding: '12px', color: '#aaa', fontSize: '13px', textAlign: 'center' },
};

export default function PositionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = !user?.role || user?.role === 'ADMIN';

  const [position, setPosition] = useState(null);
  const [allUnits, setAllUnits] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState(new Set());
  const [selectedRoleIds, setSelectedRoleIds] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const [detailRes, unitsRes, rolesRes] = await Promise.all([
        positionsApi.detail(id),
        unitsApi.list(),
        rolesApi.list(),
      ]);
      setPosition(detailRes.data);
      setAllUnits(unitsRes.data);
      setAllRoles(rolesRes.data);
      setSelectedUnitIds(new Set());
      setSelectedRoleIds(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const startEdit = () => {
    setForm({
      name: position.name,
      code: position.code,
      level: position.level,
      description: position.description,
      isActive: position.isActive,
    });
    setEditMode(true);
    setError('');
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await positionsApi.update(id, form);
      setEditMode(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Hata oluştu');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`"${position.name}" pozisyonu silinsin mi? Bu işlem geri alınamaz.`)) return;
    try {
      await positionsApi.delete(id);
      navigate('/organization/positions');
    } catch (err) {
      alert('Silinemedi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAssignUnits = async () => {
    if (selectedUnitIds.size === 0) return;
    await positionsApi.assignUnits(id, Array.from(selectedUnitIds));
    load();
  };

  const handleRemoveUnit = async (unitId) => {
    if (!confirm('Birim bağlantısı kaldırılsın mı?')) return;
    await positionsApi.removeUnit(id, unitId);
    load();
  };

  const toggleUnit = (uid) => {
    setSelectedUnitIds(prev => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };

  const handleAssignRoles = async () => {
    if (selectedRoleIds.size === 0) return;
    await positionsApi.assignRoles(id, Array.from(selectedRoleIds));
    load();
  };

  const handleRemoveRole = async (roleId) => {
    if (!confirm('Rol ataması kaldırılsın mı?')) return;
    await positionsApi.removeRole(id, roleId);
    load();
  };

  const toggleRole = (rid) => {
    setSelectedRoleIds(prev => {
      const next = new Set(prev);
      next.has(rid) ? next.delete(rid) : next.add(rid);
      return next;
    });
  };

  if (loading) return <div style={styles.loading}>Yükleniyor...</div>;
  if (!position) return <div style={styles.loading}>Pozisyon bulunamadı.</div>;

  const assignedUnitIds = new Set(position.units?.map(u => u.id));
  const availableUnits = allUnits
    .filter(u => !assignedUnitIds.has(u.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const assignedRoleIds = new Set(position.roles?.map(r => r.id));
  const availableRoles = allRoles
    .filter(r => !assignedRoleIds.has(r.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const level = position.level;

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/organization/positions')}>
        ← Pozisyonlar
      </button>

      {/* Pozisyon başlığı */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ ...styles.levelBadge, background: LEVEL_COLOR[level] || '#555' }}>
                {LEVELS[level] || level}
              </span>
              <h2 style={styles.posTitle}>{position.name}</h2>
            </div>
            <span style={styles.posCode}>{position.code}</span>
            {!position.isActive && <span style={styles.pasifTag}>Pasif</span>}
            {position.description && <div style={styles.posDesc}>{position.description}</div>}
          </div>
          {isAdmin && !editMode && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={styles.editBtn} onClick={startEdit}>Düzenle</button>
              <button style={styles.deleteBtn} onClick={handleDelete}>Sil</button>
            </div>
          )}
        </div>

        {editMode && (
          <form onSubmit={saveEdit} style={styles.editForm}>
            <div style={styles.editRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Pozisyon Adı *</label>
                <input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Kod *</label>
                <input style={styles.input} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
              </div>
            </div>
            <label style={styles.label}>Seviye</label>
            <select style={styles.input} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
              {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <label style={styles.label}>Açıklama</label>
            <textarea
              style={{ ...styles.input, height: '70px', resize: 'vertical' }}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
            <label style={styles.checkLabel}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              {' '}Aktif
            </label>
            {error && <div style={styles.error}>{error}</div>}
            <div style={styles.editActions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setEditMode(false)}>İptal</button>
              <button type="submit" style={styles.saveBtn}>Kaydet</button>
            </div>
          </form>
        )}
      </div>

      {/* Atanmış Birimler */}
      <div style={styles.card}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Atanmış Birimler</h3>
          <span style={styles.badge}>{position.units?.length || 0}</span>
        </div>

        {position.units?.length === 0 && <div style={styles.emptySection}>Bu pozisyon henüz bir birime atanmamış</div>}
        <div style={styles.chipList}>
          {position.units?.map(u => (
            <div key={u.id} style={styles.chip}>
              <span
                style={styles.chipName}
                onClick={() => navigate(`/organization/units/${u.id}`)}
              >
                {u.name} <span style={styles.chipCode}>{u.code}</span>
              </span>
              {isAdmin && (
                <button style={styles.chipRemove} onClick={() => handleRemoveUnit(u.id)} title="Bağlantıyı kaldır">✕</button>
              )}
            </div>
          ))}
        </div>

        {isAdmin && availableUnits.length > 0 && (
          <div style={styles.addSection}>
            <div style={styles.addLabel}>Birim ata ({selectedUnitIds.size} seçili)</div>
            <CheckList
              items={availableUnits}
              selected={selectedUnitIds}
              onToggle={toggleUnit}
            />
            <button
              style={{ ...styles.addBtn, opacity: selectedUnitIds.size === 0 ? 0.5 : 1 }}
              onClick={handleAssignUnits}
              disabled={selectedUnitIds.size === 0}
            >
              + Seçilenleri Ata ({selectedUnitIds.size})
            </button>
          </div>
        )}
      </div>

      {/* Roller */}
      <div style={styles.card}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Atanmış Roller</h3>
          <span style={styles.badge}>{position.roles?.length || 0}</span>
        </div>

        {position.roles?.length === 0 && <div style={styles.emptySection}>Bu pozisyona henüz rol atanmamış</div>}
        <div style={styles.chipList}>
          {position.roles?.map(r => (
            <div key={r.id} style={styles.chip}>
              <span style={{
                ...styles.roleTypeDot,
                background: ROLE_TYPE_COLOR[r.roleType] || '#555'
              }} />
              <span style={styles.chipName}>{r.name}</span>
              <span style={styles.chipCode}>{r.code}</span>
              {isAdmin && (
                <button style={styles.chipRemove} onClick={() => handleRemoveRole(r.id)} title="Rolü kaldır">✕</button>
              )}
            </div>
          ))}
        </div>

        {isAdmin && availableRoles.length > 0 && (
          <div style={styles.addSection}>
            <div style={styles.addLabel}>Rol ata ({selectedRoleIds.size} seçili)</div>
            <CheckList
              items={availableRoles}
              selected={selectedRoleIds}
              onToggle={toggleRole}
            />
            <button
              style={{ ...styles.addBtn, opacity: selectedRoleIds.size === 0 ? 0.5 : 1 }}
              onClick={handleAssignRoles}
              disabled={selectedRoleIds.size === 0}
            >
              + Seçilenleri Ata ({selectedRoleIds.size})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '20px' },
  loading: { padding: '40px', textAlign: 'center', color: '#aaa' },
  backBtn: { alignSelf: 'flex-start', background: 'none', border: 'none', color: '#0f3460', cursor: 'pointer', fontSize: '14px', padding: '0', fontWeight: '500' },
  card: { background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '20px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  levelBadge: { fontSize: '12px', color: '#fff', padding: '3px 10px', borderRadius: '10px', fontWeight: '600' },
  posTitle: { margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' },
  posCode: { fontSize: '12px', color: '#888', background: '#f5f5f5', padding: '3px 10px', borderRadius: '10px', marginRight: '8px' },
  pasifTag: { fontSize: '12px', color: '#dc2626', background: '#fef2f2', padding: '3px 10px', borderRadius: '10px' },
  posDesc: { marginTop: '8px', fontSize: '13px', color: '#666' },
  editBtn: { padding: '8px 18px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  deleteBtn: { padding: '8px 18px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  editForm: { marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  editRow: { display: 'flex', gap: '12px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#555', display: 'block', marginBottom: '4px' },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '7px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  checkLabel: { fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' },
  error: { padding: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', fontSize: '13px' },
  editActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '8px 18px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '7px', cursor: 'pointer' },
  saveBtn: { padding: '8px 22px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '500' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  sectionTitle: { margin: 0, fontSize: '15px', fontWeight: '600', color: '#1a1a2e' },
  badge: { background: '#0f3460', color: '#fff', fontSize: '12px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' },
  emptySection: { color: '#aaa', fontSize: '13px', paddingBottom: '10px' },
  chipList: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' },
  chip: { display: 'flex', alignItems: 'center', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '4px 10px', gap: '6px' },
  chipName: { fontSize: '13px', color: '#1d4ed8', cursor: 'pointer', fontWeight: '500' },
  chipCode: { fontSize: '11px', color: '#60a5fa' },
  chipRemove: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', padding: '0', lineHeight: 1 },
  roleTypeDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  addSection: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' },
  addLabel: { fontSize: '13px', fontWeight: '500', color: '#555' },
  addBtn: { alignSelf: 'flex-end', padding: '8px 18px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
};

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { unitsApi, positionsApi } from '../../api/organization';
import { useAuth } from '../../context/AuthContext';

const LEVEL_LABEL = { GOVERNANCE: 'Yönetişim', EXECUTIVE: 'Üst Yönetim', MANAGER: 'Yönetim', STAFF: 'Çalışan' };
const LEVEL_COLOR = { GOVERNANCE: '#6d28d9', EXECUTIVE: '#0f3460', MANAGER: '#0369a1', STAFF: '#555' };

function CheckList({ items, selected, onToggle, labelKey = 'name', subKey = 'code', placeholder }) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(i =>
    i[labelKey].toLowerCase().includes(search.toLowerCase()) ||
    i[subKey].toLowerCase().includes(search.toLowerCase())
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
        ? <div style={cl.empty}>{placeholder || 'Eklenecek kayıt yok'}</div>
        : filtered.map(item => (
          <label key={item.id} style={cl.row}>
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => onToggle(item.id)}
              style={{ accentColor: '#0f3460' }}
            />
            <span style={cl.name}>{item[labelKey]}</span>
            <span style={cl.sub}>{item[subKey]}</span>
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

export default function UnitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = !user?.role || user?.role === 'ADMIN';

  const [unit, setUnit] = useState(null);
  const [allUnits, setAllUnits] = useState([]);
  const [allPositions, setAllPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  const [selectedChildIds, setSelectedChildIds] = useState(new Set());
  const [selectedPositionIds, setSelectedPositionIds] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const [detailRes, allRes, posRes] = await Promise.all([
        unitsApi.detail(id),
        unitsApi.list(),
        positionsApi.list(),
      ]);
      setUnit(detailRes.data);
      setAllUnits(allRes.data);
      setAllPositions(posRes.data);
      setSelectedChildIds(new Set());
      setSelectedPositionIds(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const startEdit = () => {
    setForm({ name: unit.name, code: unit.code, parentId: unit.parentId || '', isActive: unit.isActive });
    setEditMode(true);
    setError('');
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await unitsApi.update(id, { ...form, parentId: form.parentId || null });
      setEditMode(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Hata oluştu');
    }
  };

  const handleDeleteUnit = async () => {
    if (!confirm(`"${unit.name}" birimi silinsin mi? Bu işlem geri alınamaz.`)) return;
    try {
      await unitsApi.delete(id);
      navigate('/organization/units');
    } catch (err) {
      alert('Silinemedi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddChildren = async () => {
    if (selectedChildIds.size === 0) return;
    for (const childId of selectedChildIds) {
      await unitsApi.addChild(id, childId);
    }
    load();
  };

  const handleRemoveChild = async (childId) => {
    if (!confirm('Alt birim bağlantısı kaldırılsın mı?')) return;
    await unitsApi.removeChild(id, childId);
    load();
  };

  const handleAssignPositions = async () => {
    if (selectedPositionIds.size === 0) return;
    await unitsApi.assignPositions(id, Array.from(selectedPositionIds));
    load();
  };

  const handleRemovePosition = async (positionId) => {
    if (!confirm('Pozisyon ataması kaldırılsın mı?')) return;
    await unitsApi.removePosition(id, positionId);
    load();
  };

  const toggleChild = (cid) => {
    setSelectedChildIds(prev => {
      const next = new Set(prev);
      next.has(cid) ? next.delete(cid) : next.add(cid);
      return next;
    });
  };

  const togglePosition = (pid) => {
    setSelectedPositionIds(prev => {
      const next = new Set(prev);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      return next;
    });
  };

  if (loading) return <div style={styles.loading}>Yükleniyor...</div>;
  if (!unit) return <div style={styles.loading}>Birim bulunamadı.</div>;

  const assignedChildIds = new Set(unit.children?.map(c => c.id));
  const assignedPositionIds = new Set(unit.positions?.map(p => p.id));

  const availableChildren = allUnits
    .filter(u => u.id !== unit.id && !assignedChildIds.has(u.id) && u.parentId !== unit.id)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const availablePositions = allPositions
    .filter(p => !assignedPositionIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/organization/units')}>
        ← Birimler
      </button>

      {/* Birim başlığı */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.unitTitle}>{unit.name}</h2>
            <span style={styles.unitCode}>{unit.code}</span>
            {unit.parentName && (
              <span
                style={{ ...styles.parentTag, cursor: 'pointer' }}
                onClick={() => navigate(`/organization/units/${unit.parentId}`)}
                title="Üst birime git"
              >
                ↑ {unit.parentName}
              </span>
            )}
            {!unit.isActive && <span style={styles.pasifTag}>Pasif</span>}
          </div>
          {isAdmin && !editMode && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={styles.editBtn} onClick={startEdit}>Düzenle</button>
              <button style={styles.deleteBtn} onClick={handleDeleteUnit}>Sil</button>
            </div>
          )}
        </div>

        {editMode && (
          <form onSubmit={saveEdit} style={styles.editForm}>
            <div style={styles.editRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Birim Adı *</label>
                <input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Kod *</label>
                <input style={styles.input} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
              </div>
            </div>
            <label style={styles.label}>Üst Birim</label>
            <select style={styles.input} value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })}>
              <option value="">— Kök Birim —</option>
              {allUnits.filter(u => u.id !== unit.id).sort((a, b) => a.name.localeCompare(b.name, 'tr')).map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
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

      {/* Alt Birimler */}
      <div style={styles.card}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Alt Birimler</h3>
          <span style={styles.badge}>{unit.children?.length || 0}</span>
        </div>

        {unit.children?.length === 0 && <div style={styles.emptySection}>Alt birim yok</div>}
        <div style={styles.chipList}>
          {unit.children?.map(child => (
            <div key={child.id} style={styles.chip}>
              <span style={styles.chipName} onClick={() => navigate(`/organization/units/${child.id}`)}>
                {child.name} <span style={styles.chipCode}>{child.code}</span>
              </span>
              {isAdmin && (
                <button style={styles.chipRemove} onClick={() => handleRemoveChild(child.id)} title="Bağlantıyı kaldır">✕</button>
              )}
            </div>
          ))}
        </div>

        {isAdmin && availableChildren.length > 0 && (
          <div style={styles.addSection}>
            <div style={styles.addLabel}>Alt birim ekle ({selectedChildIds.size} seçili)</div>
            <CheckList
              items={availableChildren}
              selected={selectedChildIds}
              onToggle={toggleChild}
              labelKey="name"
              subKey="code"
              placeholder="Eklenecek alt birim yok"
            />
            <button
              style={{ ...styles.addBtn, opacity: selectedChildIds.size === 0 ? 0.5 : 1 }}
              onClick={handleAddChildren}
              disabled={selectedChildIds.size === 0}
            >
              + Seçilenleri Ekle ({selectedChildIds.size})
            </button>
          </div>
        )}
      </div>

      {/* Pozisyonlar */}
      <div style={styles.card}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Pozisyonlar</h3>
          <span style={styles.badge}>{unit.positions?.length || 0}</span>
        </div>

        {unit.positions?.length === 0 && <div style={styles.emptySection}>Atanmış pozisyon yok</div>}

        <div style={styles.positionList}>
          {unit.positions?.map(pos => (
            <div key={pos.id} style={styles.positionCard}>
              <div style={styles.positionHeader}>
                <div style={styles.positionLeft}>
                  <span style={{ ...styles.levelBadge, background: LEVEL_COLOR[pos.level] || '#555' }}>
                    {LEVEL_LABEL[pos.level] || pos.level}
                  </span>
                  <span
                    style={{ ...styles.positionName, cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => navigate(`/organization/positions/${pos.id}`)}
                  >
                    {pos.name}
                  </span>
                  <span style={styles.positionCode}>{pos.code}</span>
                </div>
                {isAdmin && (
                  <button style={styles.chipRemove} onClick={() => handleRemovePosition(pos.id)} title="Ataması kaldır">✕</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {isAdmin && availablePositions.length > 0 && (
          <div style={styles.addSection}>
            <div style={styles.addLabel}>Pozisyon ata ({selectedPositionIds.size} seçili)</div>
            <CheckList
              items={availablePositions}
              selected={selectedPositionIds}
              onToggle={togglePosition}
              labelKey="name"
              subKey="code"
              placeholder="Eklenecek pozisyon yok"
            />
            <button
              style={{ ...styles.addBtn, opacity: selectedPositionIds.size === 0 ? 0.5 : 1 }}
              onClick={handleAssignPositions}
              disabled={selectedPositionIds.size === 0}
            >
              + Seçilenleri Ata ({selectedPositionIds.size})
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
  unitTitle: { margin: '0 0 6px', fontSize: '22px', fontWeight: '700', color: '#1a1a2e' },
  unitCode: { fontSize: '12px', color: '#888', background: '#f5f5f5', padding: '3px 10px', borderRadius: '10px', marginRight: '8px' },
  parentTag: { fontSize: '12px', color: '#0369a1', background: '#eff6ff', padding: '3px 10px', borderRadius: '10px', marginRight: '8px' },
  pasifTag: { fontSize: '12px', color: '#dc2626', background: '#fef2f2', padding: '3px 10px', borderRadius: '10px' },
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
  addSection: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' },
  addLabel: { fontSize: '13px', fontWeight: '500', color: '#555' },
  addBtn: { alignSelf: 'flex-end', padding: '8px 18px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  positionList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' },
  positionCard: { border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', background: '#fafafa' },
  positionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  positionLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  levelBadge: { fontSize: '11px', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' },
  positionName: { fontSize: '14px', fontWeight: '600', color: '#1a1a2e' },
  positionCode: { fontSize: '12px', color: '#888', background: '#f5f5f5', padding: '2px 8px', borderRadius: '10px' },
};

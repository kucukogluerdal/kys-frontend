import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import { unitsApi } from '../../api/organization';
import { useAuth } from '../../context/AuthContext';

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────
function buildTree(units) {
  const map = {};
  units.forEach(u => { map[u.id] = { ...u, _children: [] }; });
  const roots = [];
  units.forEach(u => {
    if (u.parentId) map[u.parentId]?._children.push(map[u.id]);
    else roots.push(map[u.id]);
  });
  return roots;
}

// ─── Tab 2: Ağaç düğümü ──────────────────────────────────────────
function TreeNode({ node, depth, navigate }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node._children?.length > 0;

  return (
    <div>
      <div
        style={{ ...s.treeRow, paddingLeft: depth * 22 + 12 }}
        onClick={() => navigate(`/organization/units/${node.id}`)}
      >
        <div style={s.treeLeft}>
          {hasChildren
            ? <button style={s.toggleBtn} onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
                {open ? '▾' : '▸'}
              </button>
            : <span style={s.treeDot}>└─</span>
          }
          <span style={s.treeName}>{node.name}</span>
          <span style={s.treeCode}>{node.code}</span>
          {!node.isActive && <span style={s.pasifBadge}>Pasif</span>}
          {node.positionCount > 0 && (
            <span style={s.posBadge}>{node.positionCount} pozisyon</span>
          )}
        </div>
        <span style={s.arrowHint}>→</span>
      </div>
      {open && hasChildren && node._children.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} navigate={navigate} />
      ))}
    </div>
  );
}

// ─── Tab 3: İlişki görünümü sağ panel ────────────────────────────
function RelationPanel({ unit, allUnits, navigate }) {
  if (!unit) return (
    <div style={s.relEmpty}>
      <div style={s.relEmptyIcon}>🔍</div>
      <div>Sol listeden bir birim seçin</div>
    </div>
  );

  const parent = allUnits.find(u => u.id === unit.parentId);
  const children = allUnits.filter(u => u.parentId === unit.id);

  return (
    <div style={s.relPanel}>
      {/* Başlık */}
      <div style={s.relHeader}>
        <div style={{ flex: 1 }}>
          <div style={s.relTitle}>{unit.name}</div>
          <div style={s.relMeta}>
            <span style={s.relCode}>{unit.code}</span>
            <span style={unit.isActive ? s.activeBadge : s.pasifBadge}>
              {unit.isActive ? 'Aktif' : 'Pasif'}
            </span>
          </div>
        </div>
        <button
          style={s.detailBtn}
          onClick={() => navigate(`/organization/units/${unit.id}`)}
        >
          Detay →
        </button>
      </div>

      {/* Üst Birim */}
      <div style={s.relSection}>
        <div style={s.relSectionTitle}>Üst Birim</div>
        {parent
          ? <div style={s.relCard} onClick={() => navigate(`/organization/units/${parent.id}`)}>
              <span style={s.relCardName}>{parent.name}</span>
              <span style={s.relCardCode}>{parent.code}</span>
            </div>
          : <div style={s.relNone}>Kök birim (üst birim yok)</div>
        }
      </div>

      {/* Alt Birimler */}
      <div style={s.relSection}>
        <div style={s.relSectionTitle}>Alt Birimler <span style={s.relCount}>{children.length}</span></div>
        {children.length === 0
          ? <div style={s.relNone}>Alt birim yok</div>
          : children.map(c => (
            <div key={c.id} style={s.relCard} onClick={() => navigate(`/organization/units/${c.id}`)}>
              <span style={s.relCardName}>{c.name}</span>
              <span style={s.relCardCode}>{c.code}</span>
              {c.positionCount > 0 && <span style={s.posBadge}>{c.positionCount} poz.</span>}
            </div>
          ))
        }
      </div>

      {/* Pozisyonlar */}
      <div style={s.relSection}>
        <div style={s.relSectionTitle}>Bağlı Pozisyonlar <span style={s.relCount}>{unit.positionCount}</span></div>
        {unit.positionCount === 0
          ? <div style={s.relNone}>Pozisyon atanmamış</div>
          : <div style={s.relNone}>Detay sayfasından görüntüleyin</div>
        }
      </div>
    </div>
  );
}

// ─── Ana bileşen ──────────────────────────────────────────────────
export default function Units() {
  const { user } = useAuth();
  const isAdmin = !user?.role || user?.role === 'ADMIN';
  const navigate = useNavigate();

  const [tab, setTab] = useState('tree');
  const [data, setData] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedRelUnit, setSelectedRelUnit] = useState(null);
  const [relSearch, setRelSearch] = useState('');
  const [form, setForm] = useState({ name: '', code: '', parentId: '', isActive: true });
  const [error, setError] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const load = async () => {
    setLoading(true);
    try {
      const { data: list } = await unitsApi.list();
      list.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      setData(list);
      setTree(buildTree(list));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ name: '', code: '', parentId: '', isActive: true });
    setError('');
    setSelected(null);
    setModal('create');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, parentId: form.parentId || null };
      if (modal === 'create') await unitsApi.create(payload);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortIcon = (key) => {
    if (sortKey !== key) return <span style={s.sortFaint}> ▲</span>;
    return <span style={s.sortActive}>{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>;
  };

  const filteredList = data
    .filter(u =>
      u.name.toLowerCase().includes(listSearch.toLowerCase()) ||
      u.code.toLowerCase().includes(listSearch.toLowerCase())
    )
    .sort((a, b) => {
      let av, bv;
      if (sortKey === 'parentName') {
        av = parentMap[a.parentId] || '';
        bv = parentMap[b.parentId] || '';
      } else {
        av = a[sortKey] ?? '';
        bv = b[sortKey] ?? '';
      }
      const cmp = typeof av === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'tr', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const filteredRelList = data.filter(u =>
    u.name.toLowerCase().includes(relSearch.toLowerCase()) ||
    u.code.toLowerCase().includes(relSearch.toLowerCase())
  );

  const parentMap = {};
  data.forEach(u => { parentMap[u.id] = u.name; });

  return (
    <div>
      {/* Başlık */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Birimler</h2>
          <p style={s.sub}>Organizasyon hiyerarşisi ve pozisyon atamaları</p>
        </div>
        {isAdmin && <button style={s.addBtn} onClick={openCreate}>+ Yeni Birim</button>}
      </div>

      {/* Sekmeler */}
      <div style={s.tabs}>
        {[['tree', 'Organizasyon Haritası'], ['list', 'Birim Listesi'], ['relation', 'İlişki Görünümü']].map(([key, label]) => (
          <button
            key={key}
            style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Birim Listesi ── */}
      {tab === 'list' && (
        <div style={s.card}>
          <input
            style={s.searchInput}
            placeholder="Birim veya kod ara..."
            value={listSearch}
            onChange={e => setListSearch(e.target.value)}
          />
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  Birim {sortIcon('name')}
                </th>
                <th style={{ ...s.th, cursor: 'pointer' }} onClick={() => handleSort('parentName')}>
                  Üst Birim {sortIcon('parentName')}
                </th>
                <th style={{ ...s.th, cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('childCount')}>
                  Alt Birim {sortIcon('childCount')}
                </th>
                <th style={{ ...s.th, cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('positionCount')}>
                  Pozisyon {sortIcon('positionCount')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={s.tdCenter}>Yükleniyor...</td></tr>
              ) : filteredList.length === 0 ? (
                <tr><td colSpan={4} style={s.tdCenter}>Kayıt bulunamadı</td></tr>
              ) : filteredList.map((u, i) => (
                <tr
                  key={u.id}
                  style={i % 2 === 0 ? s.trEven : s.trOdd}
                  onClick={() => navigate(`/organization/units/${u.id}`)}
                >
                  <td style={{ ...s.td, cursor: 'pointer' }}>
                    <span style={s.unitNameCell}>{u.name}</span>
                    <span style={s.codeBadge}>{u.code}</span>
                    {!u.isActive && <span style={{ ...s.pasifBadge, marginLeft: '4px' }}>Pasif</span>}
                  </td>
                  <td style={s.td}>{parentMap[u.parentId] || <span style={s.none}>—</span>}</td>
                  <td style={{ ...s.td, textAlign: 'center' }}>
                    {u.childCount > 0
                      ? <span style={s.countBadge}>{u.childCount}</span>
                      : <span style={s.none}>—</span>
                    }
                  </td>
                  <td style={{ ...s.td, textAlign: 'center' }}>
                    {u.positionCount > 0
                      ? <span style={{ ...s.countBadge, background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>{u.positionCount}</span>
                      : <span style={s.none}>—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab 2: Organizasyon Haritası ── */}
      {tab === 'tree' && (
        <div style={s.card}>
          {loading ? (
            <div style={s.tdCenter}>Yükleniyor...</div>
          ) : tree.length === 0 ? (
            <div style={s.tdCenter}>Henüz birim eklenmemiş</div>
          ) : tree.map(node => (
            <TreeNode key={node.id} node={node} depth={0} navigate={navigate} />
          ))}
        </div>
      )}

      {/* ── Tab 3: İlişki Görünümü ── */}
      {tab === 'relation' && (
        <div style={s.relLayout}>
          {/* Sol: Birim listesi */}
          <div style={s.relLeft}>
            <input
              style={s.searchInput}
              placeholder="Birim ara..."
              value={relSearch}
              onChange={e => setRelSearch(e.target.value)}
            />
            <div style={s.relList}>
              {filteredRelList.map(u => (
                <div
                  key={u.id}
                  style={{
                    ...s.relListRow,
                    ...(selectedRelUnit?.id === u.id ? s.relListRowActive : {}),
                  }}
                  onClick={() => setSelectedRelUnit(u)}
                >
                  <span style={s.relListName}>{u.name}</span>
                  <span style={s.relListCode}>{u.code}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ: Detay */}
          <div style={s.relRight}>
            <RelationPanel
              unit={selectedRelUnit}
              allUnits={data}
              navigate={navigate}
            />
          </div>
        </div>
      )}

      {/* Yeni Birim Modal */}
      {modal && (
        <Modal title="Yeni Birim" onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} style={s.form}>
            <label style={s.label}>Birim Adı *</label>
            <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />

            <label style={s.label}>Kod *</label>
            <input style={s.input} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />

            <label style={s.label}>Üst Birim</label>
            <select style={s.input} value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })}>
              <option value="">— Yok (Kök Birim) —</option>
              {data.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>

            <label style={s.checkLabel}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              {' '}Aktif
            </label>

            {error && <div style={s.error}>{error}</div>}
            <div style={s.actions}>
              <button type="button" style={s.cancelBtn} onClick={() => setModal(null)}>İptal</button>
              <button type="submit" style={s.saveBtn}>Kaydet</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  title: { margin: 0, fontSize: '20px', fontWeight: '600', color: '#1a1a2e' },
  sub: { margin: '4px 0 0', fontSize: '13px', color: '#888' },
  addBtn: { padding: '10px 20px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' },

  tabs: { display: 'flex', gap: '4px', marginBottom: '16px', background: '#f5f5f5', borderRadius: '10px', padding: '4px', width: 'fit-content' },
  tab: { padding: '8px 18px', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: 'transparent', color: '#666' },
  tabActive: { background: '#fff', color: '#0f3460', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },

  card: { background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  searchInput: { display: 'block', width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f0f0f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: '#fafafa' },

  // Tablo
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '11px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#888', background: '#f8f9fa', borderBottom: '1px solid #eee', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '11px 16px', fontSize: '14px', color: '#333', borderBottom: '1px solid #f5f5f5' },
  tdCenter: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  trEven: { background: '#fff', cursor: 'pointer' },
  trOdd: { background: '#fafafa', cursor: 'pointer' },
  codeBadge: { fontSize: '11px', color: '#999', background: '#f0f0f0', padding: '1px 7px', borderRadius: '8px', marginLeft: '6px' },
  unitNameCell: { fontWeight: '600', color: '#0f3460', fontSize: '14px' },
  sortFaint: { fontSize: '10px', color: '#ccc' },
  sortActive: { fontSize: '10px', color: '#0f3460' },
  countBadge: { display: 'inline-block', minWidth: '22px', textAlign: 'center', fontSize: '12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' },
  none: { color: '#ccc', fontSize: '13px' },
  pasifBadge: { fontSize: '11px', color: '#dc2626', background: '#fef2f2', padding: '2px 6px', borderRadius: '8px' },
  activeBadge: { fontSize: '11px', color: '#16a34a', background: '#f0fdf4', padding: '2px 6px', borderRadius: '8px' },
  posBadge: { fontSize: '11px', color: '#6d28d9', background: '#f5f3ff', padding: '2px 7px', borderRadius: '8px', border: '1px solid #ddd6fe' },

  // Tree
  treeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f7f7f7' },
  treeLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  treeName: { fontWeight: '500', fontSize: '14px', color: '#1a1a2e' },
  treeCode: { fontSize: '12px', color: '#888', background: '#f5f5f5', padding: '2px 7px', borderRadius: '8px' },
  toggleBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#888', padding: '0 2px', lineHeight: 1 },
  treeDot: { color: '#bbb', fontSize: '12px', marginLeft: '2px' },
  arrowHint: { fontSize: '13px', color: '#ccc' },

  // İlişki Görünümü
  relLayout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', alignItems: 'start' },
  relLeft: { background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  relList: { maxHeight: '520px', overflowY: 'auto' },
  relListRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', fontSize: '13px' },
  relListRowActive: { background: '#eff6ff', borderLeft: '3px solid #0f3460' },
  relListName: { fontWeight: '500', color: '#1a1a2e' },
  relListCode: { fontSize: '11px', color: '#888', background: '#f0f0f0', padding: '1px 6px', borderRadius: '6px' },

  relRight: { background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minHeight: '300px' },
  relEmpty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '280px', color: '#bbb', gap: '10px', fontSize: '14px' },
  relEmptyIcon: { fontSize: '36px' },
  relPanel: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' },
  relHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' },
  relTitle: { fontSize: '20px', fontWeight: '700', color: '#1a1a2e', marginBottom: '6px' },
  relMeta: { display: 'flex', gap: '8px', alignItems: 'center' },
  relCode: { fontSize: '12px', color: '#888', background: '#f5f5f5', padding: '3px 10px', borderRadius: '10px' },
  detailBtn: { padding: '8px 16px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap' },
  relSection: { display: 'flex', flexDirection: 'column', gap: '8px' },
  relSectionTitle: { fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' },
  relCount: { background: '#0f3460', color: '#fff', fontSize: '11px', padding: '1px 7px', borderRadius: '10px', fontWeight: '700' },
  relCard: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' },
  relCardName: { flex: 1, fontSize: '14px', fontWeight: '500', color: '#1a1a2e' },
  relCardCode: { fontSize: '12px', color: '#888', background: '#f0f0f0', padding: '2px 8px', borderRadius: '8px' },
  relNone: { color: '#bbb', fontSize: '13px', padding: '8px 0' },

  // Form
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#555' },
  input: { padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '7px', fontSize: '14px', outline: 'none' },
  checkLabel: { fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' },
  error: { padding: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', fontSize: '13px' },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { padding: '9px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '7px', cursor: 'pointer' },
  saveBtn: { padding: '9px 24px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '500' },
};

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { processesApi } from '../../api/processes';

const LEVELS        = { L1: 'Seviye 1', L2: 'Seviye 2', L3: 'Seviye 3' };
const TYPES         = { CORE: 'Temel', SUPPORT: 'Destek', MANAGEMENT: 'Yönetim' };
const CRITICALITIES = { HIGH: 'Yüksek', MEDIUM: 'Orta', LOW: 'Düşük' };
const CRIT_COLORS   = { HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#16a34a' };

const LEVEL_STYLE = {
  L1: { borderColor: '#0f3460', bgOpen: '#eef2ff', badgeBg: '#dbeafe', badgeColor: '#1e40af', fontWeight: 700, fontSize: 15 },
  L2: { borderColor: '#0d9488', bgOpen: '#f0fdf4', badgeBg: '#d1fae5', badgeColor: '#065f46', fontWeight: 600, fontSize: 14 },
  L3: { borderColor: '#94a3b8', bgOpen: '#fafafa',  badgeBg: '#f1f5f9', badgeColor: '#475569', fontWeight: 500, fontSize: 13 },
};

// ─── Ağaç yapısı ──────────────────────────────────────────────────
function buildTree(data) {
  const map = {};
  data.forEach(p => { map[p.id] = { ...p, _children: [] }; });
  const roots = [];
  data.forEach(p => {
    if (p.parentId && map[p.parentId]) map[p.parentId]._children.push(map[p.id]);
    else roots.push(map[p.id]);
  });
  return roots;
}

function buildFilteredTree(visibleIds, byId) {
  const nodeMap = {};
  visibleIds.forEach(id => { nodeMap[id] = { ...byId[id], _children: [] }; });
  const roots = [];
  visibleIds.forEach(id => {
    const p = byId[id];
    if (p.parentId && nodeMap[p.parentId]) nodeMap[p.parentId]._children.push(nodeMap[id]);
    else roots.push(nodeMap[id]);
  });
  return roots;
}

function isDescendantOfSet(p, matchSet, byId) {
  let cur = byId[p.parentId];
  while (cur) {
    if (matchSet.has(cur.id)) return true;
    cur = byId[cur.parentId];
  }
  return false;
}

// ─── TreeNode ─────────────────────────────────────────────────────
function TreeNode({ node, depth = 0, defaultOpen, navigate }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = node._children?.length > 0;
  const lv = LEVEL_STYLE[node.level] || LEVEL_STYLE.L3;

  useEffect(() => { setOpen(defaultOpen); }, [defaultOpen]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          borderLeft: `4px solid ${lv.borderColor}`,
          marginLeft: depth * 24,
          background: open && hasChildren ? lv.bgOpen : '#fff',
          transition: 'background 0.15s',
        }}
      >
        {/* Aç/kapat */}
        <button
          style={{
            width: 32, height: 44, flexShrink: 0,
            background: 'none', border: 'none',
            cursor: hasChildren ? 'pointer' : 'default',
            fontSize: 11, color: hasChildren ? lv.borderColor : '#ddd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => hasChildren && setOpen(o => !o)}
        >
          {hasChildren ? (open ? '▼' : '▶') : ''}
        </button>

        {/* Satır içeriği — tıklayınca detay sayfasına git */}
        <div
          style={{
            flex: 1, padding: '8px 12px 8px 0',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            minWidth: 0,
          }}
          onClick={() => navigate(`/portal/${node.id}`)}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontWeight: lv.fontWeight, fontSize: lv.fontSize,
              color: '#1a1a2e', display: 'block',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {node.name}
            </span>
            {node.ownerPositionName && (
              <span style={{ fontSize: 10, color: '#0f3460', background: '#eef2ff', padding: '1px 7px', borderRadius: 6, display: 'inline-block', marginTop: 2, fontWeight: 500 }}>
                Sahibi: {node.ownerPositionName}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {node.processType && (
              <span style={{ fontSize: 10, color: '#6d28d9', background: '#f5f3ff', padding: '1px 7px', borderRadius: 8, border: '1px solid #ddd6fe' }}>
                {TYPES[node.processType] || node.processType}
              </span>
            )}
            {node.criticality && (
              <span style={{ fontSize: 10, fontWeight: 600, color: CRIT_COLORS[node.criticality] || '#888', background: (CRIT_COLORS[node.criticality] || '#888') + '15', padding: '1px 7px', borderRadius: 8 }}>
                {CRITICALITIES[node.criticality] || node.criticality}
              </span>
            )}
            <span style={{
              fontSize: 10, color: lv.badgeColor, background: lv.badgeBg,
              padding: '1px 7px', borderRadius: 8, fontWeight: 700,
            }}>
              {node.level}
            </span>
            <span style={{
              fontSize: 11, color: '#999', background: '#f4f4f4',
              padding: '2px 8px', borderRadius: 6, fontFamily: 'monospace',
            }}>
              {node.code}
            </span>
            {hasChildren && (
              <span style={{ fontSize: 10, color: '#bbb' }}>{node._children.length} alt</span>
            )}
          </div>
        </div>
      </div>

      {open && hasChildren && node._children.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} defaultOpen={defaultOpen} navigate={navigate} />
      ))}
    </div>
  );
}

// ─── Ana sayfa ────────────────────────────────────────────────────
export default function ProcessPortal({ embedded = false }) {
  const navigate = useNavigate();
  const [data, setData]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [levelFilter, setLevelFilter] = useState(null);
  const [defaultOpen, setDefaultOpen] = useState(true);
  const [treeKey, setTreeKey]         = useState(0);

  useEffect(() => {
    processesApi.list()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byId = useMemo(() => {
    const m = {};
    data.forEach(p => { m[p.id] = p; });
    return m;
  }, [data]);

  const counts = useMemo(() => ({
    L1: data.filter(p => p.level === 'L1').length,
    L2: data.filter(p => p.level === 'L2').length,
    L3: data.filter(p => p.level === 'L3').length,
  }), [data]);

  const treeRoots = useMemo(() => {
    const hasFilter = search.trim() || levelFilter;
    if (!hasFilter) return buildTree(data);

    let list = data;
    if (levelFilter === 'L1') {
      const l1Set = new Set(data.filter(p => p.level === 'L1').map(p => p.id));
      list = data.filter(p => l1Set.has(p.id) || isDescendantOfSet(p, l1Set, byId));
    } else if (levelFilter) {
      list = data.filter(p => p.level === levelFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q));
    }
    const visibleIds = new Set(list.map(p => p.id));
    return buildFilteredTree(visibleIds, byId);
  }, [data, byId, levelFilter, search]);

  const toggleAll = (open) => {
    setDefaultOpen(open);
    setTreeKey(k => k + 1);
  };

  const outerStyle = embedded
    ? { display: 'flex', flexDirection: 'column', background: '#f5f6fa', borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0', minHeight: 480 }
    : s.page;

  return (
    <div style={outerStyle}>
      {/* ── Üst araç çubuğu ── */}
      <div style={s.toolbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, flexWrap: 'wrap' }}>
          {/* Geri + Başlık */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!embedded && (
              <button style={s.backBtn} onClick={() => navigate(-1)}>← Geri</button>
            )}
            <div>
              <span style={s.title}>Süreç Haritası</span>
              <span style={s.subtitle}>{data.length} süreç</span>
            </div>
          </div>

          {/* Arama */}
          <input
            style={s.searchInput}
            placeholder="Ara... (ad veya kod)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* Level filtreleri */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[[null, 'Tümü', data.length], ['L1', 'L1', counts.L1], ['L2', 'L2', counts.L2], ['L3', 'L3', counts.L3]].map(([k, label, cnt]) => (
              <button
                key={String(k)}
                style={{ ...s.chip, ...(levelFilter === k ? s.chipActive : {}) }}
                onClick={() => setLevelFilter(k)}
              >
                {label} <span style={{ opacity: 0.7, fontSize: 10 }}>{cnt}</span>
              </button>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, marginLeft: 8 }}>
            {Object.entries(LEVEL_STYLE).map(([lv, ls]) => (
              <span key={lv} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#888' }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: ls.borderColor }} />
                {LEVELS[lv]}
              </span>
            ))}
          </div>
        </div>

        {/* Sağ: aç/kapat butonları */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button style={s.toolBtn} onClick={() => toggleAll(true)}>▼ Tümünü Aç</button>
          <button style={s.toolBtn} onClick={() => toggleAll(false)}>▶ Tümünü Kapat</button>
        </div>
      </div>

      {/* ── Ağaç ── */}
      <div style={s.treeArea}>
        {loading ? (
          <div style={s.msg}>Yükleniyor...</div>
        ) : treeRoots.length === 0 ? (
          <div style={s.msg}>Eşleşen süreç bulunamadı</div>
        ) : (
          <div key={treeKey} style={s.treeCard}>
            {treeRoots.map(node => (
              <TreeNode key={node.id} node={node} depth={0} defaultOpen={defaultOpen} navigate={navigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const s = {
  page:        { display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', background: '#f5f6fa', margin: '-32px', overflow: 'hidden' },
  toolbar:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb', flexShrink: 0, flexWrap: 'wrap' },
  title:       { fontWeight: 800, fontSize: 17, color: '#1a1a2e', marginRight: 8 },
  subtitle:    { fontSize: 12, color: '#aaa' },
  searchInput: { padding: '7px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', width: 220, background: '#fafafa' },
  chip:        { padding: '4px 11px', border: '1px solid #e0e0e0', borderRadius: 16, cursor: 'pointer', fontSize: 12, background: '#fff', color: '#555', display: 'flex', alignItems: 'center', gap: 4 },
  chipActive:  { background: '#0f3460', color: '#fff', border: '1px solid #0f3460' },
  toolBtn:     { padding: '6px 14px', border: '1px solid #e0e0e0', borderRadius: 7, cursor: 'pointer', fontSize: 12, background: '#fff', color: '#444', fontWeight: 500 },
  backBtn:     { padding: '6px 14px', border: '1px solid #e0e0e0', borderRadius: 7, cursor: 'pointer', fontSize: 12, background: '#f5f5f5', color: '#555', fontWeight: 500 },
  treeArea:    { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  treeCard:    { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' },
  msg:         { textAlign: 'center', color: '#bbb', fontSize: 14, padding: '60px 0' },
};

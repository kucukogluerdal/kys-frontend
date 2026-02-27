import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import { processesApi } from '../../api/processes';
import { rolesApi } from '../../api/organization';
import ProcessPortal from '../portal/ProcessPortal';

const LEVELS = { L1: 'Seviye 1', L2: 'Seviye 2', L3: 'Seviye 3' };
const TYPES = { CORE: 'Temel', SUPPORT: 'Destek', MANAGEMENT: 'Yönetim' };
const CRITICALITIES = { HIGH: 'Yüksek', MEDIUM: 'Orta', LOW: 'Düşük' };
const CRIT_COLORS = { HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#16a34a' };
// Level hierarchy for relation filtering: L1→L2→L3
const NEXT_LEVEL = { L1: 'L2', L2: 'L3' };
const PREV_LEVEL = { L2: 'L1', L3: 'L2' };

// ─── buildTree ─────────────────────────────────────────────────────
function buildTree(processes) {
  const map = {};
  processes.forEach(p => { map[p.id] = { ...p, _children: [] }; });
  const roots = [];
  processes.forEach(p => {
    if (p.parentId) map[p.parentId]?._children.push(map[p.id]);
    else roots.push(map[p.id]);
  });
  return roots;
}

// ─── Tab 2: Ağaç düğümü ───────────────────────────────────────────
const LEVEL_STYLE = {
  L1: { borderColor: '#0f3460', bgOpen: '#eef2ff', badgeBg: '#dbeafe', badgeColor: '#1e40af', fontWeight: 700, fontSize: 15 },
  L2: { borderColor: '#0d9488', bgOpen: '#f0fdf4', badgeBg: '#d1fae5', badgeColor: '#065f46', fontWeight: 600, fontSize: 13 },
  L3: { borderColor: '#94a3b8', bgOpen: '#fafafa',  badgeBg: '#f1f5f9', badgeColor: '#475569', fontWeight: 500, fontSize: 13 },
};

function TreeNode({ node, depth = 0, navigate, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = node._children?.length > 0;
  const lv = LEVEL_STYLE[node.level] || LEVEL_STYLE.L3;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          borderBottom: '1px solid #f0f0f0',
          borderLeft: `4px solid ${lv.borderColor}`,
          marginLeft: depth * 24,
          background: open && hasChildren ? lv.bgOpen : '#fff',
          transition: 'background 0.15s',
        }}
      >
        {/* Aç/Kapat — büyük tıklanabilir alan */}
        <button
          style={{
            width: 42, flexShrink: 0,
            background: 'none', border: 'none',
            cursor: hasChildren ? 'pointer' : 'default',
            fontSize: hasChildren ? 13 : 12,
            color: hasChildren ? lv.borderColor : '#ddd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
          }}
          onClick={() => hasChildren && setOpen(o => !o)}
          title={hasChildren ? (open ? 'Kapat' : 'Aç') : ''}
        >
          {hasChildren ? (open ? '▼' : '▶') : '─'}
        </button>

        {/* İçerik — tıklayınca sürece git */}
        <div
          style={{
            flex: 1, padding: '10px 12px 10px 0',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          }}
          onClick={() => navigate(`/processes/${node.id}`)}
        >
          <span style={{ fontWeight: lv.fontWeight, fontSize: lv.fontSize, color: '#1a1a2e' }}>
            {node.name}
          </span>
          <span style={{ fontSize: 11, color: '#888', background: '#f0f0f0', padding: '1px 7px', borderRadius: 8, fontFamily: 'monospace' }}>
            {node.code}
          </span>
          {node.level && (
            <span style={{ fontSize: 10, color: lv.badgeColor, background: lv.badgeBg, padding: '1px 6px', borderRadius: 8, fontWeight: 700, border: `1px solid ${lv.borderColor}30` }}>
              {node.level}
            </span>
          )}
          {node.processType && (
            <span style={{ fontSize: 10, color: '#6d28d9', background: '#f5f3ff', padding: '1px 6px', borderRadius: 8, border: '1px solid #ddd6fe' }}>
              {TYPES[node.processType] || node.processType}
            </span>
          )}
          {hasChildren && (
            <span style={{ fontSize: 10, color: '#aaa', marginLeft: 2 }}>
              {node._children.length} alt süreç
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#ccc' }}>→</span>
        </div>
      </div>

      {open && hasChildren && (
        <div>
          {node._children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} navigate={navigate} defaultOpen={defaultOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Hiyerarşi yardımcıları ───────────────────────────────────────
function getDescendants(procId, allProcesses) {
  const result = new Set();
  allProcesses.filter(p => p.parentId === procId).forEach(child => {
    result.add(child.id);
    getDescendants(child.id, allProcesses).forEach(id => result.add(id));
  });
  return result;
}

function getAncestors(procId, allProcesses) {
  const result = new Set();
  const proc = allProcesses.find(p => p.id === procId);
  if (proc?.parentId) {
    result.add(proc.parentId);
    getAncestors(proc.parentId, allProcesses).forEach(id => result.add(id));
  }
  return result;
}

// ─── Üst süreç arama destekli seçici ─────────────────────────────
function ParentCombobox({ value, onChange, options }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = options.find(p => String(p.id) === value);

  const filtered = query
    ? options.filter(p =>
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.code?.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const display = open ? query : (selected ? `${selected.code} — ${selected.name}` : '');

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <div style={{ position: 'relative' }}>
        <input
          style={s.comboInput}
          placeholder="Üst süreç ara (ad veya kod)..."
          value={display}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setQuery(''); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        {value && (
          <button style={s.comboClear} onMouseDown={() => { onChange(''); setOpen(false); }}>×</button>
        )}
      </div>
      {open && (
        <div style={s.comboDropdown}>
          <div style={s.comboOption} onMouseDown={() => { onChange(''); setOpen(false); setQuery(''); }}>
            — Yok (Kök Süreç) —
          </div>
          {filtered.slice(0, 120).map(p => (
            <div
              key={p.id}
              style={{ ...s.comboOption, ...(String(p.id) === value ? s.comboSelected : {}) }}
              onMouseDown={() => { onChange(String(p.id)); setOpen(false); setQuery(''); }}
            >
              <span style={{ fontSize: 11, color: '#888', marginRight: 6 }}>{p.code}</span>
              {p.name}
            </div>
          ))}
          {filtered.length > 120 && (
            <div style={s.comboMore}>... {filtered.length - 120} daha var — arama ile daraltın</div>
          )}
          {filtered.length === 0 && (
            <div style={s.comboMore}>Eşleşen süreç yok</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: İlişki düzenleme sağ panel ────────────────────────────
function RelationPanel({ proc, allProcesses, onSaved }) {
  const [parentId, setParentId] = useState('');
  const [childIds, setChildIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [childSearch, setChildSearch] = useState('');
  const [childFilter, setChildFilter] = useState('all'); // 'all' | 'assigned' | 'orphan'
  const [childSort, setChildSort] = useState('code');

  useEffect(() => {
    if (!proc) return;
    setParentId(proc.parentId ? String(proc.parentId) : '');
    setChildIds(new Set(allProcesses.filter(p => p.parentId === proc.id).map(p => p.id)));
    setChildSearch('');
    setChildFilter('all');
    setChildSort('code');
  }, [proc?.id, allProcesses]);

  if (!proc) {
    return (
      <div style={s.relEmpty}>
        <div style={{ fontSize: 36, opacity: 0.3 }}>⚙</div>
        <div>Sol listeden bir süreç seçin</div>
      </div>
    );
  }

  const descendants = getDescendants(proc.id, allProcesses);
  const ancestors   = getAncestors(proc.id, allProcesses);
  const parentLevel = PREV_LEVEL[proc.level];
  const childLevel  = NEXT_LEVEL[proc.level];

  const parentOptions = allProcesses.filter(p =>
    p.id !== proc.id && !descendants.has(p.id) &&
    (parentLevel ? p.level === parentLevel : false)
  );

  const baseChildOptions = allProcesses.filter(p =>
    p.id !== proc.id && !ancestors.has(p.id) &&
    (childLevel ? p.level === childLevel : false)
  );

  const assignedCount = baseChildOptions.filter(p => childIds.has(p.id)).length;
  const orphanCount   = baseChildOptions.filter(p => !p.parentId).length;

  const childOptions = baseChildOptions
    .filter(p => {
      if (childFilter === 'assigned') return childIds.has(p.id);
      if (childFilter === 'orphan')   return !p.parentId; // hiç kimseye atanmamış
      return true;
    })
    .filter(p => {
      if (!childSearch.trim()) return true;
      const q = childSearch.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const av = (a[childSort] || '').toLowerCase();
      const bv = (b[childSort] || '').toLowerCase();
      return av < bv ? -1 : av > bv ? 1 : 0;
    });

  const toggleChild = (id) =>
    setChildIds(prev => { const ns = new Set(prev); ns.has(id) ? ns.delete(id) : ns.add(id); return ns; });

  // Tek kaydet: üst süreç + alt süreçleri birlikte kaydeder
  const saveAll = async () => {
    setSaving(true);
    try {
      const promises = [];
      // Üst süreç değiştiyse
      const origParent = proc.parentId ? String(proc.parentId) : '';
      if (parentId !== origParent) {
        promises.push(processesApi.update(proc.id, { parentId: parentId ? Number(parentId) : null }));
      }
      // Alt süreç değişiklikleri
      const origChildIds = new Set(allProcesses.filter(p => p.parentId === proc.id).map(p => p.id));
      childIds.forEach(id => { if (!origChildIds.has(id)) promises.push(processesApi.update(id, { parentId: proc.id })); });
      origChildIds.forEach(id => { if (!childIds.has(id)) promises.push(processesApi.update(id, { parentId: null })); });
      if (promises.length > 0) await Promise.all(promises);
      onSaved();
    } finally { setSaving(false); }
  };

  const origChildIds = new Set(allProcesses.filter(p => p.parentId === proc.id).map(p => p.id));
  const origParent = proc.parentId ? String(proc.parentId) : '';
  const hasChanges = parentId !== origParent ||
    [...childIds].some(id => !origChildIds.has(id)) ||
    [...origChildIds].some(id => !childIds.has(id));

  return (
    <div style={s.relPanel}>
      <div style={s.relPanelHeader}>
        <div style={s.relPanelCode}>{proc.code}</div>
        <div style={s.relPanelName}>{proc.name}</div>
      </div>

      {/* Üst Süreç */}
      <div style={s.relSection}>
        <div style={s.relSectionTitle}>
          Üst Süreç
          {parentLevel
            ? <span style={s.relHint}> — {LEVELS[parentLevel]} süreçleri</span>
            : <span style={s.relHint}> — L1 kök süreçtir</span>}
        </div>
        {parentLevel ? (
          <ParentCombobox value={parentId} onChange={setParentId} options={parentOptions} />
        ) : (
          <div style={s.relNone}>L1 seviye süreçler kök süreçtir, üst süreç atanamaz.</div>
        )}
      </div>

      {/* Alt Süreçler */}
      <div style={s.relSection}>
        <div style={s.relSectionTitle}>
          Alt Süreçler
          {childLevel
            ? <span style={s.relHint}> — {LEVELS[childLevel]} ({baseChildOptions.length} adet)</span>
            : <span style={s.relHint}> — L3 en alt düzeydedir</span>}
        </div>
        {childLevel ? (
          <>
            {/* Filtre butonları */}
            <div style={s.childFilterRow}>
              {[
                ['all',      `Tümü (${baseChildOptions.length})`],
                ['assigned', `Bu sürece atanmış (${assignedCount})`],
                ['orphan',   `Hiç atanmamış (${orphanCount})`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  style={{ ...s.childFilterBtn, ...(childFilter === key ? s.childFilterActive : {}) }}
                  onClick={() => setChildFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sıralama + Arama + Toplu seç */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#aaa' }}>Sırala:</span>
              {[['code', 'Numara'], ['name', 'İsim']].map(([k, label]) => (
                <button key={k}
                  style={{ ...s.childFilterBtn, flex: 'none', padding: '3px 8px', ...(childSort === k ? s.childFilterActive : {}) }}
                  onClick={() => setChildSort(k)}>{label}</button>
              ))}
            </div>
            <div style={s.relRow}>
              <input
                style={{ ...s.childSearchInput, marginBottom: 0, flex: 1 }}
                placeholder="Ara (ad veya kod)..."
                value={childSearch}
                onChange={e => setChildSearch(e.target.value)}
              />
              {childFilter !== 'assigned' && (
                <button style={s.relQuickBtn}
                  onClick={() => {
                    const visible = childFilter === 'orphan'
                      ? baseChildOptions.filter(p => !p.parentId)
                      : baseChildOptions;
                    setChildIds(prev => new Set([...prev, ...visible.map(p => p.id)]));
                  }}>
                  Tümünü Seç
                </button>
              )}
              {childIds.size > 0 && (
                <button style={s.relQuickBtn} onClick={() => setChildIds(new Set())}>Temizle</button>
              )}
            </div>

            {/* Liste */}
            <div style={s.checkList}>
              {childOptions.length === 0 ? (
                <div style={s.relNone}>
                  {childSearch ? 'Eşleşen süreç yok'
                    : childFilter === 'assigned' ? 'Henüz atanmış alt süreç yok'
                    : childFilter === 'orphan'   ? 'Hiç atanmamış süreç yok (tümü bağlı)'
                    : 'Başka süreç yok'}
                </div>
              ) : (
                childOptions.map(p => (
                  <label key={p.id} style={{ ...s.checkItem, ...(childIds.has(p.id) ? s.checkItemAssigned : {}) }}>
                    <input type="checkbox" checked={childIds.has(p.id)} onChange={() => toggleChild(p.id)} />
                    <span style={s.checkName}>
                      <span style={{ color: '#888', marginRight: 4, fontSize: 11 }}>{p.code}</span>
                      {p.name}
                    </span>
                    {p.parentId && p.parentId !== proc.id && (
                      <span style={s.otherParentBadge} title="Başka bir sürece atanmış">⚠</span>
                    )}
                  </label>
                ))
              )}
            </div>
          </>
        ) : (
          <div style={s.relNone}>L3 seviye süreçler en alt düzeydedir.</div>
        )}
      </div>

      {/* Tek kaydet butonu */}
      <div style={s.relSaveBar}>
        <div style={{ fontSize: 12, color: hasChanges ? '#d97706' : '#aaa' }}>
          {hasChanges
            ? `${childIds.size} alt süreç atanacak${parentId !== origParent ? ' · üst süreç değişti' : ''}`
            : 'Değişiklik yok'}
        </div>
        <button style={{ ...s.relSaveBtn, opacity: saving ? 0.7 : 1 }} onClick={saveAll} disabled={saving || !hasChanges}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}

// ─── Tab 4: Rol atama sağ panel ───────────────────────────────────
function RolePanel({ proc, allRoles }) {
  const [roleIds, setRoleIds] = useState(new Set());
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    if (!proc) return;
    setLoadingRoles(true);
    processesApi.listRoles(proc.id)
      .then(r => setRoleIds(new Set(r.data.map(role => role.id))))
      .catch(() => setRoleIds(new Set()))
      .finally(() => setLoadingRoles(false));
  }, [proc?.id]);

  const toggleRole = async (roleId) => {
    if (roleIds.has(roleId)) {
      await processesApi.removeRole(proc.id, roleId);
      setRoleIds(prev => { const ns = new Set(prev); ns.delete(roleId); return ns; });
    } else {
      await processesApi.addRole(proc.id, roleId);
      setRoleIds(prev => new Set([...prev, roleId]));
    }
  };

  if (!proc) {
    return (
      <div style={s.relEmpty}>
        <div style={{ fontSize: 36, opacity: 0.3 }}>👤</div>
        <div>Sol listeden bir süreç seçin</div>
      </div>
    );
  }

  return (
    <div style={s.relPanel}>
      <div style={s.relPanelHeader}>
        <div style={s.relPanelCode}>{proc.code}</div>
        <div style={s.relPanelName}>{proc.name}</div>
      </div>
      <div style={s.relSection}>
        <div style={s.relSectionTitle}>
          Sorumlu Roller
          <span style={s.relHint}> — değişiklikler anında kaydedilir</span>
        </div>
        {loadingRoles ? (
          <div style={s.relNone}>Yükleniyor...</div>
        ) : allRoles.length === 0 ? (
          <div style={s.relNone}>Henüz rol tanımlanmamış</div>
        ) : (
          <div style={s.checkList}>
            {allRoles.map(role => (
              <label key={role.id} style={{ ...s.checkItem, ...(roleIds.has(role.id) ? s.checkItemAssigned : {}) }}>
                <input type="checkbox" checked={roleIds.has(role.id)} onChange={() => toggleRole(role.id)} />
                <span style={s.checkName}>{role.name}</span>
                {roleIds.has(role.id) && (
                  <span style={{ fontSize: 11, color: '#16a34a', marginLeft: 'auto' }}>✓</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Ana bileşen ──────────────────────────────────────────────────
export default function Processes() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('map');
  const [data, setData] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedRelProc, setSelectedRelProc] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', level: 'L1', processType: 'CORE',
    criticality: 'MEDIUM', status: 'ACTIVE', shortDescription: '', isActive: true,
  });
  const [createErr, setCreateErr] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [listLevelFilter, setListLevelFilter] = useState(null);
  const [relSearch, setRelSearch] = useState('');
  const [relLevelFilter, setRelLevelFilter] = useState(null);
  const [relSort, setRelSort] = useState('code'); // 'code' | 'name'
  const [selectedRoleProc, setSelectedRoleProc] = useState(null);
  const [roleSearch, setRoleSearch] = useState('');
  const [roleLevelFilter, setRoleLevelFilter] = useState(null);
  const [sort, setSort] = useState({ key: 'name', dir: 1 });
  const [autoLinkResult, setAutoLinkResult] = useState(null);
  const [autoLinking, setAutoLinking] = useState(false);
  const [treeKey, setTreeKey] = useState(0);
  const [treeDefaultOpen, setTreeDefaultOpen] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [procRes, rolesRes] = await Promise.all([processesApi.list(), rolesApi.list()]);
      setData(procRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = data;
    if (listLevelFilter) list = list.filter(p => p.level === listLevelFilter);
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = (a[sort.key] || '').toString().toLowerCase();
      const bv = (b[sort.key] || '').toString().toLowerCase();
      return av < bv ? -sort.dir : av > bv ? sort.dir : 0;
    });
  }, [data, listSearch, listLevelFilter, sort]);

  const filteredRel = useMemo(() => {
    let list = data;
    if (relLevelFilter) list = list.filter(p => p.level === relLevelFilter);
    if (relSearch.trim()) {
      const q = relSearch.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = (a[relSort] || '').toLowerCase();
      const bv = (b[relSort] || '').toLowerCase();
      return av < bv ? -1 : av > bv ? 1 : 0;
    });
  }, [data, relSearch, relLevelFilter, relSort]);

  // Kaç alt süreci var
  const childCountMap = useMemo(() => {
    const map = {};
    data.forEach(p => { if (p.parentId) map[p.parentId] = (map[p.parentId] || 0) + 1; });
    return map;
  }, [data]);

  // L2/L3 olup üst süreci olmayan (eksik atama)
  const orphanIds = useMemo(() =>
    new Set(data.filter(p => (p.level === 'L2' || p.level === 'L3') && !p.parentId).map(p => p.id))
  , [data]);

  const filteredRoleProcs = useMemo(() => {
    let list = data;
    if (roleLevelFilter) list = list.filter(p => p.level === roleLevelFilter);
    if (roleSearch.trim()) {
      const q = roleSearch.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  }, [data, roleSearch, roleLevelFilter]);

  const tree = useMemo(() => buildTree(data), [data]);

  const handleSort = (key) => {
    setSort(prev => prev.key === key ? { key, dir: -prev.dir } : { key, dir: 1 });
  };

  const openCreate = () => {
    setForm({ name: '', code: '', level: 'L1', processType: 'CORE', criticality: 'MEDIUM', status: 'ACTIVE', shortDescription: '', isActive: true });
    setCreateErr('');
    setCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateErr('');
    try {
      const res = await processesApi.create(form);
      setCreateModal(false);
      await load();
      setSelected(res.data);
      setTab('list');
    } catch (err) {
      setCreateErr(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleDelete = async (proc, e) => {
    e.stopPropagation();
    if (!confirm(`"${proc.name}" silinsin mi?`)) return;
    await processesApi.delete(proc.id);
    if (selected?.id === proc.id) setSelected(null);
    load();
  };

  const SortIcon = ({ col }) => {
    if (sort.key !== col) return <span style={s.sortFaint}>↕</span>;
    return <span style={s.sortActive}>{sort.dir > 0 ? '↑' : '↓'}</span>;
  };

  const handleAutoLink = async () => {
    const linkedCount = data.filter(p => p.parentId).length;
    const confirmed = window.confirm(
      '⚠️ KODLARA GÖRE OTOMATİK İLİŞKİLENDİR\n\n' +
      'Bu işlem TÜM süreçlerin üst-alt ilişkilerini kodlarına göre yeniden kurar.\n\n' +
      `Şu anda ${linkedCount} sürecin üst süreci atanmış — bunlar da güncellenebilir.\n\n` +
      'Nasıl çalışır:\n' +
      '  • Her süreç için koduna önek olan en uzun diğer kod bulunur\n' +
      '  • Nokta (.) veya tire (-) ayraç olarak desteklenir\n' +
      '  • Örnek: KADEM-SY-01-01 → üstü KADEM-SY-01\n' +
      '  • Örnek: KADEM-SY-01.01.001 → üstü KADEM-SY-01.01\n\n' +
      '⚠️ Mevcut ilişkileri değiştirir! Emin misiniz?'
    );
    if (!confirmed) return;
    setAutoLinking(true);
    try {
      const res = await processesApi.autoLink();
      setAutoLinkResult(res.data);
      await load();
    } catch (err) {
      alert('Hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setAutoLinking(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Başlık */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Süreçler</h2>
          <p style={s.sub}>Süreç yönetimi · {data.length} süreç · {orphanIds.size > 0 && <span style={{ color: '#d97706' }}>{orphanIds.size} bağlantısız</span>}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.addBtn} onClick={openCreate}>+ Yeni</button>
        </div>
      </div>

      {/* Sekmeler */}
      <div style={s.tabs}>
        {[['map', 'Süreç Haritası'], ['list', 'Süreç Listesi'], ['relation', 'İlişki Düzenleme'], ['roles', 'Rol Atamaları']].map(([key, label]) => (
          <button
            key={key}
            style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Süreç Haritası ── */}
      {tab === 'map' && <ProcessPortal embedded />}

      {/* ── Tab: Süreç Listesi ── */}
      {tab === 'list' && (
        <div style={s.card}>
          <input
            style={s.searchInput}
            placeholder="Ara... (ad, kod)"
            value={listSearch}
            onChange={e => setListSearch(e.target.value)}
          />
          <div style={s.levelChips}>
            {[[null, 'Tümü'], ['L1', 'L1'], ['L2', 'L2'], ['L3', 'L3']].map(([k, label]) => (
              <button
                key={String(k)}
                style={{ ...s.chip, ...(listLevelFilter === k ? s.chipActive : {}) }}
                onClick={() => setListLevelFilter(k)}
              >
                {label}
                <span style={s.chipCount}>
                  {k ? data.filter(p => p.level === k).length : data.length}
                </span>
              </button>
            ))}
          </div>
          <div style={s.colHeaders}>
            {[
              { key: 'name', label: 'Ad / Kod', flex: 2 },
              { key: 'processType', label: 'Tür', flex: 1 },
              { key: 'level', label: 'Seviye', flex: 1 },
              { key: 'criticality', label: 'Kritiklik', flex: 1 },
              { key: 'ownerPositionName', label: 'Sahibi', flex: 1 },
            ].map(col => (
              <div key={col.key} style={{ ...s.colHeader, flex: col.flex }} onClick={() => handleSort(col.key)}>
                {col.label} <SortIcon col={col.key} />
              </div>
            ))}
            <div style={{ width: 28 }} />
          </div>
          <div>
            {loading ? (
              <div style={s.listMsg}>Yükleniyor...</div>
            ) : filtered.length === 0 ? (
              <div style={s.listMsg}>Kayıt bulunamadı</div>
            ) : (
              filtered.map(proc => (
                <div
                  key={proc.id}
                  style={{ ...s.listRow, borderLeft: '3px solid transparent' }}
                  onClick={() => navigate(`/processes/${proc.id}`)}
                >
                  <div style={{ flex: 2, minWidth: 0 }}>
                    <div style={s.rowName}>{proc.name}</div>
                    <div style={s.rowCode}>{proc.code}</div>
                  </div>
                  <div style={{ flex: 1, fontSize: 12, color: '#555' }}>{TYPES[proc.processType] || proc.processType}</div>
                  <div style={{ flex: 1, fontSize: 12, color: '#555' }}>{LEVELS[proc.level] || proc.level}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: CRIT_COLORS[proc.criticality] || '#888' }}>
                      {CRITICALITIES[proc.criticality] || proc.criticality}
                    </span>
                  </div>
                  <div style={{ flex: 1, fontSize: 12, color: '#0f3460' }}>
                    {proc.ownerPositionName || '—'}
                  </div>
                  <div style={{ width: 28 }}>
                    <button style={s.delBtn} onClick={(e) => handleDelete(proc, e)} title="Sil">×</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Tab 2: İlişki Düzenleme ── */}
      {tab === 'relation' && (
        <div style={s.relLayout}>
          {/* Sol: Süreç listesi */}
          <div style={s.relLeft}>
            <input
              style={s.searchInput}
              placeholder="Süreç ara..."
              value={relSearch}
              onChange={e => setRelSearch(e.target.value)}
            />
            <div style={s.levelChips}>
              {[[null, 'Tümü'], ['L1', 'L1'], ['L2', 'L2'], ['L3', 'L3']].map(([k, label]) => (
                <button
                  key={String(k)}
                  style={{ ...s.chip, ...(relLevelFilter === k ? s.chipActive : {}) }}
                  onClick={() => setRelLevelFilter(k)}
                >
                  {label}
                  <span style={s.chipCount}>{k ? data.filter(p => p.level === k).length : data.length}</span>
                  {k && k !== 'L1' && (() => {
                    const orphCount = data.filter(p => p.level === k && !p.parentId).length;
                    return orphCount > 0 ? <span style={s.orphanChip}>{orphCount} !</span> : null;
                  })()}
                </button>
              ))}
            </div>
            {/* Sıralama */}
            <div style={s.relSortRow}>
              <span style={s.relSortLabel}>Sırala:</span>
              <button
                style={{ ...s.relSortBtn, ...(relSort === 'code' ? s.relSortActive : {}) }}
                onClick={() => setRelSort('code')}
              >
                Numara
              </button>
              <button
                style={{ ...s.relSortBtn, ...(relSort === 'name' ? s.relSortActive : {}) }}
                onClick={() => setRelSort('name')}
              >
                İsim
              </button>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#bbb' }}>
                {filteredRel.length} süreç
              </span>
            </div>
            {orphanIds.size > 0 && (
              <div style={s.orphanBanner}>
                {orphanIds.size} sürecin üst süreci atanmamış
              </div>
            )}
            {/* Kodlara Göre İlişkilendir */}
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>
              <button
                style={{
                  width: '100%', padding: '7px 0', fontSize: 12, fontWeight: 600,
                  background: autoLinking ? '#e0e0e0' : '#0f3460', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: autoLinking ? 'not-allowed' : 'pointer',
                  opacity: autoLinking ? 0.7 : 1,
                }}
                onClick={handleAutoLink}
                disabled={autoLinking}
                title="Süreç kodlarındaki nokta veya tire ayracına göre üst-alt ilişkileri otomatik kur (. veya - desteklenir)"
              >
                {autoLinking ? '⏳ İşleniyor...' : `⚡ Kodlara Göre İlişkilendir`}
              </button>
            </div>
            <div style={s.relList}>
              {filteredRel.map(proc => {
                const childCount = childCountMap[proc.id] || 0;
                const isOrphan = orphanIds.has(proc.id);
                const parentProc = proc.parentId ? data.find(p => p.id === proc.parentId) : null;
                return (
                  <div
                    key={proc.id}
                    style={{
                      ...s.relListRow,
                      ...(selectedRelProc?.id === proc.id ? s.relListRowActive : {}),
                      ...(isOrphan ? { borderLeft: '3px solid #f59e0b' } : {}),
                    }}
                    onClick={() => setSelectedRelProc(proc)}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={s.relListName}>{proc.name}</div>
                      {parentProc && (
                        <div style={s.relListParent}>↑ {parentProc.code}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                      <span style={s.relListCode}>{proc.code}</span>
                      {childCount > 0 && (
                        <span style={s.childCountBadge}>{childCount} alt</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sağ: Düzenleme paneli */}
          <div style={s.relRight}>
            <RelationPanel
              proc={selectedRelProc}
              allProcesses={data}
              onSaved={() => {
                load().then(() => {
                  if (selectedRelProc) {
                    processesApi.get(selectedRelProc.id).then(r => setSelectedRelProc(r.data)).catch(() => {});
                  }
                });
              }}
            />
          </div>
        </div>
      )}

      {/* ── Tab 4: Rol Atamaları ── */}
      {tab === 'roles' && (
        <div style={s.relLayout}>
          {/* Sol: Süreç listesi */}
          <div style={s.relLeft}>
            <input
              style={s.searchInput}
              placeholder="Süreç ara..."
              value={roleSearch}
              onChange={e => setRoleSearch(e.target.value)}
            />
            <div style={s.levelChips}>
              {[[null, 'Tümü'], ['L1', 'L1'], ['L2', 'L2'], ['L3', 'L3']].map(([k, label]) => (
                <button
                  key={String(k)}
                  style={{ ...s.chip, ...(roleLevelFilter === k ? s.chipActive : {}) }}
                  onClick={() => setRoleLevelFilter(k)}
                >
                  {label}
                  <span style={s.chipCount}>{k ? data.filter(p => p.level === k).length : data.length}</span>
                </button>
              ))}
            </div>
            <div style={{ padding: '5px 10px', fontSize: 11, color: '#bbb', borderBottom: '1px solid #f0f0f0' }}>
              {filteredRoleProcs.length} süreç
            </div>
            <div style={s.relList}>
              {filteredRoleProcs.map(proc => (
                <div
                  key={proc.id}
                  style={{
                    ...s.relListRow,
                    ...(selectedRoleProc?.id === proc.id ? s.relListRowActive : {}),
                  }}
                  onClick={() => setSelectedRoleProc(proc)}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={s.relListName}>{proc.name}</div>
                    {proc.ownerRoleNames?.length > 0 && (
                      <div style={s.relListParent}>{proc.ownerRoleNames.join(', ')}</div>
                    )}
                  </div>
                  <span style={s.relListCode}>{proc.code}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ: Rol paneli */}
          <div style={s.relRight}>
            <RolePanel proc={selectedRoleProc} allRoles={roles} />
          </div>
        </div>
      )}

      {/* Yeni Süreç Modal */}
      {createModal && (
        <Modal title="Yeni Süreç" onClose={() => setCreateModal(false)}>
          <form onSubmit={handleCreate} style={s.form}>
            <div style={s.mRow}>
              <div style={s.mCol}>
                <label style={s.mLabel}>Süreç Adı *</label>
                <input style={s.mInput} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={s.mCol}>
                <label style={s.mLabel}>Kod *</label>
                <input style={s.mInput} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
              </div>
            </div>
            <div style={s.mRow}>
              <div style={s.mCol}>
                <label style={s.mLabel}>Seviye</label>
                <select style={s.mInput} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                  {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={s.mCol}>
                <label style={s.mLabel}>Tür</label>
                <select style={s.mInput} value={form.processType} onChange={e => setForm({ ...form, processType: e.target.value })}>
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div style={s.mRow}>
              <div style={s.mCol}>
                <label style={s.mLabel}>Kritiklik</label>
                <select style={s.mInput} value={form.criticality} onChange={e => setForm({ ...form, criticality: e.target.value })}>
                  {Object.entries(CRITICALITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={s.mCol}>
                <label style={s.mLabel}>Durum</label>
                <select style={s.mInput} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">Aktif</option>
                  <option value="PASSIVE">Pasif</option>
                </select>
              </div>
            </div>
            <label style={s.mLabel}>Kısa Açıklama</label>
            <textarea
              style={{ ...s.mInput, height: 64, resize: 'vertical' }}
              value={form.shortDescription}
              onChange={e => setForm({ ...form, shortDescription: e.target.value })}
            />
            {createErr && <div style={s.errBox}>{createErr}</div>}
            <div style={s.mActions}>
              <button type="button" style={s.cancelBtn} onClick={() => setCreateModal(false)}>İptal</button>
              <button type="submit" style={s.saveBtn}>Kaydet</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Otomatik ilişkilendirme sonuç modalı */}
      {autoLinkResult && (() => {
        const r = autoLinkResult;
        const changes = r.changes || [];
        const warnings = r.warnings || [];
        const actionLabel = { linked: 'Bağlandı', relinked: 'Yeniden Bağlandı', cleared: 'Bağlantı Kaldırıldı', leveled: 'Sadece Seviye Değişti' };
        const actionColor = { linked: '#16a34a', relinked: '#0284c7', cleared: '#d97706', leveled: '#7c3aed' };
        return (
          <Modal title="Kodlara Göre İlişkilendirme Sonucu" onClose={() => setAutoLinkResult(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 640, maxWidth: '90vw' }}>

              {/* Özet istatistikler */}
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: 'Toplam', val: r.total, color: '#555' },
                  { label: 'İlişki Kuruldu', val: r.linked, color: '#16a34a' },
                  { label: 'Seviye Güncellendi', val: r.leveled, color: '#7c3aed' },
                  { label: 'Bağlantı Silindi', val: r.cleared, color: '#d97706' },
                  { label: 'Uyarı', val: warnings.length, color: '#ef4444' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', border: `2px solid ${color}20`, borderRadius: 8, background: `${color}08` }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Uyarılar */}
              {warnings.length > 0 && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#c2410c', marginBottom: 6 }}>
                    ⚠️ {warnings.length} Uyarı — Üst kodu bulunamayan süreçler:
                  </div>
                  <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {warnings.map((w, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#92400e', fontFamily: 'monospace' }}>• {w}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Değişiklik tablosu */}
              {changes.length > 0 ? (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#333', marginBottom: 6 }}>
                    Değişen Süreçler ({changes.length})
                  </div>
                  <div style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#f8f8f8', position: 'sticky', top: 0 }}>
                          <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #e0e0e0' }}>Kod</th>
                          <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #e0e0e0' }}>Süreç Adı</th>
                          <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #e0e0e0' }}>Durum</th>
                          <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #e0e0e0' }}>Üst Süreç</th>
                          <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #e0e0e0' }}>Seviye</th>
                        </tr>
                      </thead>
                      <tbody>
                        {changes.map((ch, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 600, color: '#1a1a2e' }}>{ch.code}</td>
                            <td style={{ padding: '6px 10px', color: '#444', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ch.name}>{ch.name}</td>
                            <td style={{ padding: '6px 10px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: `${actionColor[ch.action] || '#888'}18`, color: actionColor[ch.action] || '#888' }}>
                                {actionLabel[ch.action] || ch.action}
                              </span>
                            </td>
                            <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11, color: '#666' }}>
                              {ch.oldParent && ch.oldParent !== ch.newParent
                                ? <><span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{ch.oldParent}</span> → <span style={{ color: '#16a34a' }}>{ch.newParent || '—'}</span></>
                                : <span style={{ color: '#16a34a' }}>{ch.newParent || '—'}</span>
                              }
                            </td>
                            <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11, color: '#666' }}>
                              {ch.oldLevel && ch.oldLevel !== ch.newLevel
                                ? <><span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{ch.oldLevel}</span> → <span style={{ color: '#7c3aed' }}>{ch.newLevel}</span></>
                                : ch.newLevel ? <span style={{ color: '#7c3aed' }}>{ch.newLevel}</span> : '—'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: 13 }}>
                  ✓ Tüm ilişkiler zaten güncel, değişiklik yapılmadı.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={s.saveBtn} onClick={() => setAutoLinkResult(null)}>Tamam</button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

const s = {
  page:       { padding: '20px', minHeight: 'calc(100vh - 80px)' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:      { margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' },
  sub:        { margin: '4px 0 0', fontSize: 13, color: '#888' },
  addBtn:     { padding: '10px 20px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 },

  tabs:       { display: 'flex', gap: 4, marginBottom: 16, background: '#f5f5f5', borderRadius: 10, padding: 4, width: 'fit-content' },
  tab:        { padding: '8px 18px', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'transparent', color: '#666' },
  tabActive:  { background: '#fff', color: '#0f3460', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },

  // Tab 1 — split layout
  splitLayout:{ display: 'flex', height: 'calc(100vh - 180px)', border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  leftPanel:  { width: '40%', minWidth: 280, display: 'flex', flexDirection: 'column', borderRight: '1px solid #f0f0f0', overflow: 'hidden' },
  rightPanel: { flex: 1, overflow: 'hidden' },
  searchInput:{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f0f0f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fafafa' },
  colHeaders: { display: 'flex', alignItems: 'center', padding: '6px 14px', borderBottom: '1px solid #f0f0f0', background: '#f8f9fa', userSelect: 'none' },
  colHeader:  { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 },
  sortFaint:  { fontSize: 10, color: '#ccc' },
  sortActive: { fontSize: 10, color: '#0f3460' },
  listBody:   { flex: 1, overflowY: 'auto' },
  listMsg:    { padding: '40px 16px', color: '#aaa', fontSize: 13, textAlign: 'center' },
  listRow:    { display: 'flex', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8f9fa', gap: 8 },
  rowName:    { fontSize: 13, fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rowCode:    { fontSize: 11, color: '#888', marginTop: 1 },
  delBtn:     { background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16, lineHeight: 1, padding: '2px 3px', borderRadius: 4 },

  // Tab 2 — tree
  card:         { background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  treeToolBtn:  { padding: '7px 14px', border: '1px solid #e0e0e0', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: '#fff', color: '#444' },

  // Tab 3 — relation layout
  relLayout:    { display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' },
  relLeft:      { background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', maxHeight: 'calc(100vh - 220px)', display: 'flex', flexDirection: 'column' },
  relList:      { flex: 1, overflowY: 'auto' },
  relListRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', fontSize: 13, gap: 6 },
  relListRowActive: { background: '#eff6ff', borderLeft: '3px solid #0f3460' },
  relListName:  { fontWeight: 500, color: '#1a1a2e', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 },
  relListParent:{ fontSize: 11, color: '#aaa', marginTop: 1 },
  relListCode:  { fontSize: 11, color: '#888', background: '#f0f0f0', padding: '1px 6px', borderRadius: 6 },
  childCountBadge: { fontSize: 10, color: '#0f3460', background: '#e0e7ff', padding: '1px 5px', borderRadius: 5, fontWeight: 600 },
  relRight:     { background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minHeight: 300, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' },
  relEmpty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, color: '#bbb', gap: 10, fontSize: 14 },
  relPanel:     { padding: 20, display: 'flex', flexDirection: 'column', gap: 20 },
  relPanelHeader: { paddingBottom: 14, borderBottom: '1px solid #f0f0f0' },
  relPanelCode: { fontSize: 12, color: '#888', marginBottom: 3 },
  relPanelName: { fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  relSection:   { display: 'flex', flexDirection: 'column', gap: 8 },
  relSectionTitle: { fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  relRow:       { display: 'flex', gap: 8, alignItems: 'center' },
  relSelect:    { flex: 1, padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none' },
  relSaveBtn:   { padding: '8px 18px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' },
  relNone:      { color: '#bbb', fontSize: 13, padding: '4px 0' },
  childSearchInput: { display: 'block', width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 6 },
  checkList:    { display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto', padding: '4px 0' },
  relHint:      { fontSize: 11, fontWeight: 400, color: '#aaa', textTransform: 'none', letterSpacing: 0 },
  checkItem:    { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  checkName:    { color: '#333', fontSize: 13 },
  relQuickBtn:  { padding: '5px 10px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#555', whiteSpace: 'nowrap' },
  childFilterRow:  { display: 'flex', gap: 4, marginBottom: 6 },
  childFilterBtn:  { flex: 1, padding: '5px 6px', border: '1px solid #e0e0e0', borderRadius: 6, cursor: 'pointer', fontSize: 11, background: '#fff', color: '#666', textAlign: 'center' },
  childFilterActive: { background: '#0f3460', color: '#fff', border: '1px solid #0f3460', fontWeight: 600 },
  checkItemAssigned: { background: '#f0fdf4', borderRadius: 6 },
  otherParentBadge:  { marginLeft: 'auto', fontSize: 13, color: '#f59e0b', flexShrink: 0, title: 'Başka sürece atanmış' },
  relSaveBar:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f0f0f0', marginTop: 4 },
  relSortRow:   { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  relSortLabel: { fontSize: 11, color: '#aaa' },
  relSortBtn:   { padding: '3px 9px', border: '1px solid #e0e0e0', borderRadius: 12, cursor: 'pointer', fontSize: 11, background: '#fff', color: '#555' },
  relSortActive:{ background: '#0f3460', color: '#fff', border: '1px solid #0f3460', fontWeight: 600 },
  orphanBanner: { padding: '6px 12px', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontSize: 12, color: '#92400e', fontWeight: 500 },
  orphanChip:   { marginLeft: 3, fontSize: 10, background: '#f59e0b', color: '#fff', borderRadius: 8, padding: '0 4px', fontWeight: 700 },
  levelChips:   { display: 'flex', gap: 4, padding: '8px 10px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  chip:         { padding: '4px 10px', border: '1px solid #e0e0e0', borderRadius: 16, cursor: 'pointer', fontSize: 12, background: '#fff', color: '#555', display: 'flex', alignItems: 'center', gap: 4 },
  chipActive:   { background: '#0f3460', color: '#fff', border: '1px solid #0f3460' },
  chipCount:    { fontSize: 10, opacity: 0.75 },
  // ParentCombobox
  comboInput:   { width: '100%', padding: '8px 30px 8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  comboClear:   { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16, lineHeight: 1 },
  comboDropdown:{ position: 'absolute', zIndex: 100, top: 'calc(100% + 2px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 240, overflowY: 'auto' },
  comboOption:  { padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: '#333', borderBottom: '1px solid #f5f5f5' },
  comboSelected:{ background: '#eff6ff', fontWeight: 600 },
  comboMore:    { padding: '6px 12px', fontSize: 12, color: '#aaa', fontStyle: 'italic' },

  // Auto-link result
  alResultGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 },
  alStat:        { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 8px', border: '2px solid #e0e0e0', borderRadius: 10, gap: 4 },
  alStatNum:     { fontSize: 28, fontWeight: 700, color: '#0f3460' },
  alStatLabel:   { fontSize: 11, color: '#888', textAlign: 'center' },
  alWarnings:    { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12, maxHeight: 200, overflowY: 'auto' },
  alWarningsTitle:{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 6 },
  alWarningRow:  { fontSize: 12, color: '#78350f', padding: '3px 0', borderBottom: '1px solid #fef3c7' },

  // Create modal form
  form:       { display: 'flex', flexDirection: 'column', gap: 12 },
  mRow:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  mCol:       { display: 'flex', flexDirection: 'column', gap: 5 },
  mLabel:     { fontSize: 13, fontWeight: 500, color: '#555' },
  mInput:     { padding: '9px 11px', border: '1.5px solid #ddd', borderRadius: 7, fontSize: 14, outline: 'none' },
  errBox:     { padding: '9px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', fontSize: 13 },
  mActions:   { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  cancelBtn:  { padding: '9px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 7, cursor: 'pointer' },
  saveBtn:    { padding: '9px 24px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 500 },
};

import { useState, useEffect, useMemo } from 'react';
import { usersApi, unitsApi, positionsApi, titlesApi } from '../../api/organization';
import PersonnelDetail from './PersonnelDetail';

export default function PersonnelAssign() {
  const [personnel, setPersonnel] = useState([]);
  const [units, setUnits]         = useState([]);
  const [positions, setPositions] = useState([]);
  const [titles, setTitles]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);

  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [sort, setSort]           = useState({ col: 'fullName', dir: 'asc' });

  const load = async () => {
    setLoading(true);
    try {
      const [uR, unR, pR, tR] = await Promise.all([
        usersApi.list(), unitsApi.list(), positionsApi.list(), titlesApi.list(),
      ]);
      setPersonnel(uR.data);
      setUnits(unR.data);
      setPositions(pR.data);
      setTitles(tR.data);
      if (selected) {
        const fresh = uR.data.find(p => p.id === selected.id);
        if (fresh) setSelected(fresh);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sortBy = (col) =>
    setSort(prev => ({ col, dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc' }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return personnel
      .filter(p => {
        if (statusFilter === 'active'  && !p.isActive) return false;
        if (statusFilter === 'passive' &&  p.isActive) return false;
        return !q || [p.fullName, p.employeeId, p.orgUnitName]
          .some(v => v?.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sort.col === 'isActive') {
          const diff = (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
          return sort.dir === 'asc' ? diff : -diff;
        }
        const cmp = (a[sort.col] || '').localeCompare(b[sort.col] || '', 'tr');
        return sort.dir === 'asc' ? cmp : -cmp;
      });
  }, [personnel, search, statusFilter, sort]);

  const SortTh = ({ col, label }) => (
    <th
      style={{ ...s.th, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => sortBy(col)}
    >
      {label}
      <span style={{ marginLeft: '4px', color: sort.col === col ? '#0f3460' : '#ccc', fontSize: '10px' }}>
        {sort.col === col ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    </th>
  );

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Personel Atama</h2>
          <p style={s.sub}>Listeden kişi seçerek bilgilerini ve atamalarını düzenleyin</p>
        </div>
      </div>

      {/* Her zaman iki panel yan yana */}
      <div style={s.layout}>
        {/* ── Sol: Liste ── */}
        <div style={s.listPanel}>
          <div style={s.toolbar}>
            <input
              style={s.searchInput}
              placeholder="Ad, sicil, birim..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select style={s.filterSel} value={statusFilter} onChange={e => setStatus(e.target.value)}>
              <option value="all">Tümü</option>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
          </div>

          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <SortTh col="fullName"    label="Ad Soyad" />
                  <SortTh col="orgUnitName" label="Birim"    />
                  <SortTh col="isActive"    label="Durum"    />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} style={s.center}>Yükleniyor...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={3} style={s.center}>Sonuç bulunamadı</td></tr>
                ) : filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{
                      ...(i % 2 === 0 ? s.trEven : s.trOdd),
                      ...(selected?.id === p.id ? s.trSel : {}),
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelected(prev => prev?.id === p.id ? null : p)}
                  >
                    <td style={s.td}>
                      <div style={s.nameCell}>
                        <span style={s.nameText}>{p.fullName}</span>
                        {p.employeeId && <span style={s.sicil}>{p.employeeId}</span>}
                      </div>
                    </td>
                    <td style={s.td}>{p.orgUnitName || <span style={s.none}>—</span>}</td>
                    <td style={s.td}>
                      <span style={{ color: p.isActive ? '#16a34a' : '#dc2626', fontWeight: 500, fontSize: '12px' }}>
                        {p.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={s.listFooter}>{filtered.length} / {personnel.length} kişi</div>
        </div>

        {/* ── Sağ: Detay ── */}
        <div style={s.detailPanel}>
          {selected ? (
            <PersonnelDetail
              person={selected}
              units={units}
              positions={positions}
              titles={titles}
              onSaved={() => load()}
              onClose={() => setSelected(null)}
            />
          ) : (
            <div style={s.placeholder}>
              <div style={s.placeholderIcon}>👤</div>
              <div style={s.placeholderText}>Düzenlemek için listeden bir kişi seçin</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:    { display: 'flex', flexDirection: 'column' },
  header:  { marginBottom: '20px' },
  title:   { margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a2e' },
  sub:     { margin: '4px 0 0', fontSize: '13px', color: '#888' },

  layout:  { display: 'grid', gridTemplateColumns: '38% 1fr', gap: '16px' },

  listPanel:  { background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  toolbar:    { display: 'flex', gap: '8px', padding: '12px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', flexShrink: 0 },
  searchInput:{ flex: 1, padding: '8px 11px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none' },
  filterSel:  { padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none', background: '#fff' },
  tableWrap:  { flex: 1, overflowY: 'auto' },

  table:   { width: '100%', borderCollapse: 'collapse' },
  th:      { padding: '10px 13px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#888', background: '#f8f9fa', borderBottom: '1px solid #eee', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  td:      { padding: '10px 13px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle' },
  trEven:  { background: '#fff' },
  trOdd:   { background: '#fafafa' },
  trSel:   { background: '#eff6ff' },
  center:  { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  none:    { color: '#ccc' },

  nameCell:   { display: 'flex', flexDirection: 'column', gap: '2px' },
  nameText:   { fontWeight: 600, color: '#1a1a2e', fontSize: '13px' },
  sicil:      { fontSize: '11px', color: '#888', fontFamily: 'monospace' },
  listFooter: { padding: '8px 13px', fontSize: '12px', color: '#aaa', borderTop: '1px solid #f5f5f5', flexShrink: 0 },

  detailPanel: { overflow: 'hidden' },

  placeholder:     { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '12px', border: '2px dashed #e8e8e8', gap: '12px' },
  placeholderIcon: { fontSize: '48px', opacity: 0.3 },
  placeholderText: { fontSize: '14px', color: '#aaa' },
};

import { useState, useEffect, useMemo } from 'react';
import { usersApi } from '../../api/organization';

const COLS = [
  { key: 'fullName',     label: 'Ad Soyad'  },
  { key: 'employeeId',   label: 'Sicil No'  },
  { key: 'orgUnitName',  label: 'Birim'     },
  { key: 'positionName', label: 'Pozisyon'  },
  { key: 'titleName',    label: 'Ünvan'     },
  { key: 'isActive',     label: 'Durum'     },
];

export default function PersonnelList() {
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [sort, setSort]           = useState({ col: 'fullName', dir: 'asc' });

  useEffect(() => {
    usersApi.list()
      .then(r => setPersonnel(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sortBy = (col) =>
    setSort(prev => ({ col, dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc' }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return personnel
      .filter(p => {
        if (statusFilter === 'active'  && !p.isActive) return false;
        if (statusFilter === 'passive' &&  p.isActive) return false;
        return !q || [p.fullName, p.employeeId, p.orgUnitName, p.positionName, p.titleName]
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

  const Th = ({ col, label }) => (
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
          <h2 style={s.title}>Personel Listesi</h2>
          <p style={s.sub}>{personnel.length} personel kayıtlı</p>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.toolbar}>
          <input
            style={s.searchInput}
            placeholder="Ad, sicil, birim, pozisyon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={s.filterSel} value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="all">Tümü</option>
            <option value="active">Aktif</option>
            <option value="passive">Pasif</option>
          </select>
        </div>

        <table style={s.table}>
          <thead>
            <tr>
              {COLS.map(c => <Th key={c.key} col={c.key} label={c.label} />)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={s.center}>Yükleniyor...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={s.center}>Sonuç bulunamadı</td></tr>
            ) : filtered.map((p, i) => (
              <tr key={p.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                <td style={s.td}><span style={s.nameText}>{p.fullName}</span></td>
                <td style={s.td}>
                  {p.employeeId
                    ? <span style={s.sicil}>{p.employeeId}</span>
                    : <span style={s.none}>—</span>}
                </td>
                <td style={s.td}>{p.orgUnitName  || <span style={s.none}>—</span>}</td>
                <td style={s.td}>{p.positionName || <span style={s.none}>—</span>}</td>
                <td style={s.td}>
                  {p.titleName
                    ? <span style={s.titleBadge}>{p.titleName}</span>
                    : <span style={s.none}>—</span>}
                </td>
                <td style={s.td}>
                  <span style={{ color: p.isActive ? '#16a34a' : '#dc2626', fontWeight: 500, fontSize: '12px' }}>
                    {p.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={s.footer}>{filtered.length} / {personnel.length} kişi gösteriliyor</div>
      </div>
    </div>
  );
}

const s = {
  page:       { display: 'flex', flexDirection: 'column' },
  header:     { marginBottom: '20px' },
  title:      { margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a2e' },
  sub:        { margin: '4px 0 0', fontSize: '13px', color: '#888' },

  card:       { background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  toolbar:    { display: 'flex', gap: '8px', padding: '12px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' },
  searchInput:{ flex: 1, padding: '8px 11px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none' },
  filterSel:  { padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none', background: '#fff' },

  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { padding: '10px 13px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#888', background: '#f8f9fa', borderBottom: '1px solid #eee', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  td:         { padding: '10px 13px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle' },
  trEven:     { background: '#fff' },
  trOdd:      { background: '#fafafa' },
  center:     { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  none:       { color: '#ccc' },

  nameText:   { fontWeight: 600, color: '#1a1a2e' },
  sicil:      { fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' },
  titleBadge: { fontSize: '11px', color: '#0369a1', background: '#eff6ff', padding: '2px 7px', borderRadius: '6px', border: '1px solid #bfdbfe' },
  footer:     { padding: '8px 13px', fontSize: '12px', color: '#aaa', borderTop: '1px solid #f5f5f5' },
};

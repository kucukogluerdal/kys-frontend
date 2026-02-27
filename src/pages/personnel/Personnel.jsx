import { useState, useEffect, useMemo } from 'react';
import { usersApi, unitsApi, positionsApi, titlesApi } from '../../api/organization';
import PersonnelDetail from './PersonnelDetail';

export default function Personnel() {
  const [personnel, setPersonnel] = useState([]);
  const [units, setUnits]         = useState([]);
  const [positions, setPositions] = useState([]);
  const [titles, setTitles]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);

  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return personnel.filter(p => {
      if (statusFilter === 'active'  && !p.isActive) return false;
      if (statusFilter === 'passive' &&  p.isActive) return false;
      return !q || [p.fullName, p.employeeId, p.orgUnitName, p.positionName, p.titleName]
        .some(v => v?.toLowerCase().includes(q));
    });
  }, [personnel, search, statusFilter]);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Personel Listesi</h2>
          <p style={s.sub}>{personnel.length} personel kayıtlı</p>
        </div>
      </div>

      <div style={{ ...s.layout, ...(selected ? s.layoutSplit : {}) }}>
        {/* ── Liste ── */}
        <div style={s.listPanel}>
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
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Ad Soyad</th>
                  {!selected && <>
                    <th style={s.th}>Birim</th>
                    <th style={s.th}>Pozisyon</th>
                    <th style={s.th}>Ünvan</th>
                  </>}
                  <th style={s.th}>Durum</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={selected ? 2 : 5} style={s.center}>Yükleniyor...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={selected ? 2 : 5} style={s.center}>Sonuç bulunamadı</td></tr>
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
                    {!selected && <>
                      <td style={s.td}>{p.orgUnitName  || <span style={s.none}>—</span>}</td>
                      <td style={s.td}>{p.positionName || <span style={s.none}>—</span>}</td>
                      <td style={s.td}>
                        {p.titleName
                          ? <span style={s.titleBadge}>{p.titleName}</span>
                          : <span style={s.none}>—</span>}
                      </td>
                    </>}
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
          <div style={s.listFooter}>{filtered.length} / {personnel.length} kişi gösteriliyor</div>
        </div>

        {/* ── Detay Paneli ── */}
        {selected && (
          <div style={s.detailPanel}>
            <PersonnelDetail
              person={selected}
              units={units}
              positions={positions}
              titles={titles}
              onSaved={() => load()}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:    { display: 'flex', flexDirection: 'column' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  title:   { margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a2e' },
  sub:     { margin: '4px 0 0', fontSize: '13px', color: '#888' },

  layout:      { display: 'grid', gridTemplateColumns: '1fr', gap: '16px' },
  layoutSplit: { gridTemplateColumns: '45% 1fr' },

  listPanel:  { background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  toolbar:    { display: 'flex', gap: '8px', padding: '12px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' },
  searchInput:{ flex: 1, padding: '8px 11px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none' },
  filterSel:  { padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none', background: '#fff' },
  tableWrap:  { overflowY: 'auto' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { padding: '10px 13px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#888', background: '#f8f9fa', borderBottom: '1px solid #eee', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  td:         { padding: '10px 13px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle' },
  trEven:     { background: '#fff' },
  trOdd:      { background: '#fafafa' },
  trSel:      { background: '#eff6ff' },
  center:     { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  none:       { color: '#ccc' },
  nameCell:   { display: 'flex', flexDirection: 'column', gap: '2px' },
  nameText:   { fontWeight: 600, color: '#1a1a2e', fontSize: '13px' },
  sicil:      { fontSize: '11px', color: '#888', fontFamily: 'monospace' },
  titleBadge: { fontSize: '11px', color: '#0369a1', background: '#eff6ff', padding: '2px 7px', borderRadius: '6px', border: '1px solid #bfdbfe' },
  listFooter: { padding: '8px 13px', fontSize: '12px', color: '#aaa', borderTop: '1px solid #f5f5f5' },

  detailPanel:{ overflow: 'hidden' },
};

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/organization';

const LEVEL_LABEL = { GOVERNANCE: 'Yönetişim', EXECUTIVE: 'Üst Yönetim', MANAGER: 'Yönetim', STAFF: 'Çalışan' };
const ROLE_TYPE_COLOR = { STRATEGIC: '#6d28d9', MANAGERIAL: '#0369a1', OPERATIONAL: '#059669' };

const COLS = [
  { key: 'fullName',      label: 'Ad Soyad' },
  { key: 'titleName',     label: 'Ünvan' },
  { key: 'orgUnitName',   label: 'Birim' },
  { key: 'positionName',  label: 'Pozisyon' },
];

export default function OrgList() {
  const navigate = useNavigate();
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [sortKey, setSortKey] = useState('fullName');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    usersApi.list()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortIcon = (key) => sortKey === key
    ? <span style={s.sortActive}>{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
    : <span style={s.sortFaint}> ▲</span>;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data
      .filter(u =>
        u.fullName?.toLowerCase().includes(q) ||
        u.orgUnitName?.toLowerCase().includes(q) ||
        u.positionName?.toLowerCase().includes(q) ||
        u.titleName?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv), 'tr', { sensitivity: 'base' });
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [data, search, sortKey, sortDir]);

  return (
    <div>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Personel Listesi</h2>
          <p style={s.sub}>{data.length} personel kayıtlı</p>
        </div>
        <button style={s.usersBtn} onClick={() => navigate('/organization/users')}>
          Kullanıcı Yönetimi →
        </button>
      </div>

      <div style={s.card}>
        <div style={s.toolbar}>
          <input
            style={s.search}
            placeholder="Ad, birim, pozisyon veya ünvan ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={s.count}>{filtered.length} sonuç</span>
        </div>

        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {COLS.map(col => (
                  <th
                    key={col.key}
                    style={{ ...s.th, cursor: 'pointer' }}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}{sortIcon(col.key)}
                  </th>
                ))}
                <th style={s.th}>Roller</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={s.center}>Yükleniyor...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={s.center}>Sonuç bulunamadı</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                  {/* Ad Soyad */}
                  <td style={s.td}>
                    <div style={s.nameCell}>
                      <span style={s.nameText}>{u.fullName}</span>
                      {u.username && <span style={s.usernameTag}>{u.username}</span>}
                      {!u.isActive && <span style={s.pasifTag}>Pasif</span>}
                    </div>
                  </td>
                  {/* Ünvan */}
                  <td style={s.td}>
                    {u.titleName
                      ? <span style={s.titleBadge}>{u.titleName}</span>
                      : <span style={s.none}>—</span>
                    }
                  </td>
                  {/* Birim */}
                  <td style={s.td}>
                    {u.orgUnitName
                      ? <span
                          style={s.unitLink}
                          onClick={() => u.orgUnitId && navigate(`/organization/units/${u.orgUnitId}`)}
                        >{u.orgUnitName}</span>
                      : <span style={s.none}>—</span>
                    }
                  </td>
                  {/* Pozisyon */}
                  <td style={s.td}>
                    {u.positionName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {u.positionLevel && (
                          <span style={s.levelMini}>{LEVEL_LABEL[u.positionLevel] || u.positionLevel}</span>
                        )}
                        <span
                          style={s.posLink}
                          onClick={() => u.positionId && navigate(`/organization/positions/${u.positionId}`)}
                        >{u.positionName}</span>
                      </div>
                    ) : <span style={s.none}>—</span>}
                  </td>
                  {/* Roller */}
                  <td style={s.td}>
                    {u.roles?.length > 0
                      ? <div style={s.rolesCell}>
                          {u.roles.map(r => (
                            <span
                              key={r.id}
                              style={{ ...s.roleChip, borderColor: ROLE_TYPE_COLOR[r.roleType] || '#ccc', color: ROLE_TYPE_COLOR[r.roleType] || '#555' }}
                            >
                              {r.name}
                            </span>
                          ))}
                        </div>
                      : <span style={s.none}>—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  title: { margin: 0, fontSize: '20px', fontWeight: '600', color: '#1a1a2e' },
  sub: { margin: '4px 0 0', fontSize: '13px', color: '#888' },
  usersBtn: { padding: '9px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#0f3460' },

  card: { background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  search: { flex: 1, padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none' },
  count: { fontSize: '12px', color: '#aaa', whiteSpace: 'nowrap' },

  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#888', background: '#f8f9fa', borderBottom: '1px solid #eee', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  td: { padding: '11px 14px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle' },
  trEven: { background: '#fff' },
  trOdd: { background: '#fafafa' },
  center: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  sortActive: { fontSize: '10px', color: '#0f3460' },
  sortFaint: { fontSize: '10px', color: '#ddd' },

  nameCell: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  nameText: { fontWeight: '600', color: '#1a1a2e', fontSize: '14px' },
  usernameTag: { fontSize: '11px', color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: '6px' },
  pasifTag: { fontSize: '11px', color: '#dc2626', background: '#fef2f2', padding: '1px 6px', borderRadius: '6px' },

  titleBadge: { fontSize: '12px', color: '#0369a1', background: '#eff6ff', padding: '2px 8px', borderRadius: '8px', border: '1px solid #bfdbfe' },
  unitLink: { fontSize: '13px', color: '#0f3460', cursor: 'pointer', fontWeight: '500', textDecoration: 'underline', textDecorationColor: '#bfdbfe' },
  posLink: { fontSize: '13px', color: '#1a1a2e', cursor: 'pointer', fontWeight: '500', textDecoration: 'underline', textDecorationColor: '#ddd' },
  levelMini: { fontSize: '10px', color: '#888', background: '#f5f5f5', padding: '1px 6px', borderRadius: '6px', border: '1px solid #e5e5e5' },
  none: { color: '#ccc', fontSize: '13px' },

  rolesCell: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  roleChip: { fontSize: '11px', padding: '2px 7px', borderRadius: '8px', border: '1px solid', background: 'transparent', fontWeight: '500' },
};

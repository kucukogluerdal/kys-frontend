import { useState, useMemo } from 'react';

export default function DataTable({ columns, data, onEdit, onDelete, loading }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), 'tr', { numeric: true, sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  if (loading) return <div style={styles.loading}>Yükleniyor...</div>;

  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => {
              const isActive = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  style={{ ...styles.th, cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <span style={{ ...styles.sortIcon, opacity: isActive ? 1 : 0.3 }}>
                    {isActive && sortDir === 'desc' ? ' ▼' : ' ▲'}
                  </span>
                </th>
              );
            })}
            <th style={styles.th}>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} style={styles.empty}>
                Kayıt bulunamadı
              </td>
            </tr>
          ) : (
            sortedData.map((row, i) => (
              <tr key={row.id} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                {columns.map((col) => (
                  <td key={col.key} style={styles.td}>
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                  </td>
                ))}
                <td style={styles.td}>
                  <button style={styles.editBtn} onClick={() => onEdit(row)}>Düzenle</button>
                  <button style={styles.deleteBtn} onClick={() => onDelete(row)}>Sil</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  wrapper: { overflowX: 'auto', borderRadius: '8px', border: '1px solid #eee' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  th: {
    padding: '12px 16px', textAlign: 'left', fontSize: '13px',
    fontWeight: '600', color: '#555', background: '#f8f9fa',
    borderBottom: '2px solid #eee',
  },
  sortIcon: { fontSize: '11px', color: '#0f3460' },
  td: { padding: '11px 16px', fontSize: '14px', color: '#333', borderBottom: '1px solid #f0f0f0' },
  rowEven: { background: '#fff' },
  rowOdd: { background: '#fafafa' },
  empty: { padding: '32px', textAlign: 'center', color: '#999', fontSize: '14px' },
  loading: { padding: '32px', textAlign: 'center', color: '#999' },
  editBtn: {
    marginRight: '8px', padding: '5px 12px', background: '#e8f4ff',
    color: '#0f3460', border: '1px solid #b8d8f8', borderRadius: '5px',
    cursor: 'pointer', fontSize: '12px', fontWeight: '500',
  },
  deleteBtn: {
    padding: '5px 12px', background: '#fff0f0', color: '#dc2626',
    border: '1px solid #fca5a5', borderRadius: '5px',
    cursor: 'pointer', fontSize: '12px', fontWeight: '500',
  },
};

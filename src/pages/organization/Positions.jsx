import { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/Modal';
import { positionsApi } from '../../api/organization';
import PositionPanel from './PositionPanel';

const LEVELS = {
  GOVERNANCE: 'Yönetişim',
  EXECUTIVE:  'Üst Yönetim',
  MANAGER:    'Yönetim',
  STAFF:      'Çalışan',
};

const LEVEL_ORDER = { GOVERNANCE: 1, EXECUTIVE: 2, MANAGER: 3, STAFF: 4 };

const LEVEL_COLORS = {
  GOVERNANCE: { bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
  EXECUTIVE:  { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  MANAGER:    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  STAFF:      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
};

export default function Positions() {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selectedId, setSelId]  = useState(null);
  const [modal, setModal]       = useState(null);
  const [editRow, setEditRow]   = useState(null);
  const [form, setForm]         = useState({ name: '', code: '', level: 'STAFF', description: '', isActive: true });
  const [error, setError]       = useState('');
  const [sort, setSort]         = useState({ col: 'name', dir: 'asc' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await positionsApi.list();
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sortBy = (col) =>
    setSort(prev => ({ col, dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc' }));

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      let cmp = 0;
      if (sort.col === 'level') {
        cmp = (LEVEL_ORDER[a.level] || 9) - (LEVEL_ORDER[b.level] || 9);
      } else if (sort.col === 'isActive') {
        cmp = (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
      } else {
        cmp = (a[sort.col] || '').localeCompare(b[sort.col] || '', 'tr');
      }
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [data, sort]);

  const SortTh = ({ col, label, style: extra }) => (
    <th
      style={{ ...s.th, cursor: 'pointer', userSelect: 'none', ...extra }}
      onClick={() => sortBy(col)}
    >
      {label}
      <span style={{ marginLeft: '4px', color: sort.col === col ? '#0f3460' : '#ccc', fontSize: '10px' }}>
        {sort.col === col ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    </th>
  );

  const openCreate = () => {
    setForm({ name: '', code: '', level: 'STAFF', description: '', isActive: true });
    setError('');
    setModal('create');
  };

  const openEdit = (e, row) => {
    e.stopPropagation();
    setEditRow(row);
    setForm({ name: row.name, code: row.code, level: row.level, description: row.description || '', isActive: row.isActive });
    setError('');
    setModal('edit');
  };

  const handleDelete = async (e, row) => {
    e.stopPropagation();
    if (!confirm(`"${row.name}" silinsin mi?`)) return;
    await positionsApi.delete(row.id);
    if (selectedId === row.id) setSelId(null);
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (modal === 'create') await positionsApi.create(form);
      else await positionsApi.update(editRow.id, form);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Pozisyonlar</h2>
          <p style={s.sub}>{data.length} pozisyon tanımlı</p>
        </div>
        <button style={s.addBtn} onClick={openCreate}>+ Yeni Pozisyon</button>
      </div>

      <div style={{ ...s.layout, ...(selectedId ? s.layoutSplit : {}) }}>
        {/* ── Liste ── */}
        <div style={s.listCard}>
          {loading ? (
            <div style={s.center}>Yükleniyor...</div>
          ) : data.length === 0 ? (
            <div style={s.center}>Henüz pozisyon eklenmemiş</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <SortTh col="name" label="Pozisyon" />
                  {!selectedId && <SortTh col="level" label="Seviye" />}
                  <SortTh col="isActive" label="Durum" />
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => {
                  const lc = LEVEL_COLORS[row.level] || {};
                  return (
                    <tr
                      key={row.id}
                      style={{
                        ...(i % 2 === 0 ? s.trEven : s.trOdd),
                        ...(selectedId === row.id ? s.trSel : {}),
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelId(prev => prev === row.id ? null : row.id)}
                    >
                      <td style={s.td}>
                        <div style={s.nameCell}>
                          <span style={s.nameText}>{row.name}</span>
                          <span style={s.codeTag}>{row.code}</span>
                        </div>
                        {!selectedId && row.description && (
                          <div style={s.desc}>{row.description}</div>
                        )}
                      </td>
                      {!selectedId && (
                        <td style={s.td}>
                          {row.level ? (
                            <span style={{ ...s.levelBadge, background: lc.bg, color: lc.color, border: `1px solid ${lc.border}` }}>
                              {LEVELS[row.level] || row.level}
                            </span>
                          ) : <span style={s.none}>—</span>}
                        </td>
                      )}
                      <td style={s.td}>
                        <span style={{ color: row.isActive ? '#16a34a' : '#dc2626', fontWeight: 500, fontSize: '12px' }}>
                          {row.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                        <button style={s.editBtn} onClick={e => openEdit(e, row)}>✏</button>
                        <button style={s.delBtn} onClick={e => handleDelete(e, row)}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Sağ Panel ── */}
        {selectedId && (
          <div style={s.panelWrap}>
            <PositionPanel
              positionId={selectedId}
              onClose={() => setSelId(null)}
              onRefresh={load}
            />
          </div>
        )}
      </div>

      {/* Modal: Oluştur / Düzenle */}
      {modal && (
        <Modal title={modal === 'create' ? 'Yeni Pozisyon' : 'Pozisyonu Düzenle'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} style={mf.form}>
            <label style={mf.label}>Pozisyon Adı *</label>
            <input style={mf.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />

            <label style={mf.label}>Kod *</label>
            <input style={mf.input} value={form.code} onChange={e => setForm({...form, code: e.target.value})} required />

            <label style={mf.label}>Seviye</label>
            <select style={mf.input} value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
              {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>

            <label style={mf.label}>Açıklama</label>
            <textarea style={{...mf.input, height: '80px', resize: 'vertical'}} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />

            <label style={mf.checkLabel}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
              {' '}Aktif
            </label>

            {error && <div style={mf.error}>{error}</div>}
            <div style={mf.actions}>
              <button type="button" style={mf.cancelBtn} onClick={() => setModal(null)}>İptal</button>
              <button type="submit" style={mf.saveBtn}>Kaydet</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const s = {
  page:      { display: 'flex', flexDirection: 'column' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  title:     { margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a2e' },
  sub:       { margin: '4px 0 0', fontSize: '13px', color: '#888' },
  addBtn:    { padding: '10px 20px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },

  layout:     { display: 'grid', gridTemplateColumns: '1fr', gap: '16px' },
  layoutSplit:{ gridTemplateColumns: '45% 1fr' },

  listCard:  { background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#888', background: '#f8f9fa', borderBottom: '1px solid #eee', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  td:        { padding: '10px 14px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle' },
  trEven:    { background: '#fff' },
  trOdd:     { background: '#fafafa' },
  trSel:     { background: '#eff6ff' },
  center:    { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  none:      { color: '#ccc' },

  nameCell:   { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  nameText:   { fontWeight: 600, color: '#1a1a2e' },
  codeTag:    { fontSize: '10px', color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace' },
  desc:       { fontSize: '11px', color: '#888', marginTop: '3px' },
  levelBadge: { fontSize: '11px', padding: '2px 8px', borderRadius: '6px', fontWeight: 500 },

  editBtn:    { background: 'none', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', padding: '3px 7px', fontSize: '12px', color: '#64748b', marginRight: '4px' },
  delBtn:     { background: 'none', border: '1px solid #fca5a5', borderRadius: '5px', cursor: 'pointer', padding: '3px 7px', fontSize: '12px', color: '#dc2626' },

  panelWrap: { overflow: 'hidden' },
};

const mf = {
  form:       { display: 'flex', flexDirection: 'column', gap: '12px' },
  label:      { fontSize: '13px', fontWeight: 500, color: '#555' },
  input:      { padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '7px', fontSize: '14px', outline: 'none' },
  checkLabel: { fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' },
  error:      { padding: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', fontSize: '13px' },
  actions:    { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn:  { padding: '9px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '7px', cursor: 'pointer' },
  saveBtn:    { padding: '9px 24px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: 500 },
};

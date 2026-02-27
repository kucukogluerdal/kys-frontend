import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { rolesApi } from '../../api/organization';

const ROLE_TYPES = { STRATEGIC: 'Stratejik', MANAGERIAL: 'Yönetsel', OPERATIONAL: 'Operasyonel' };

export default function Roles() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', roleType: 'OPERATIONAL', description: '', isActive: true });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await rolesApi.list();
      setData(data);
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ name: '', code: '', roleType: 'OPERATIONAL', description: '', isActive: true });
    setError('');
    setModal('create');
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({ name: row.name, code: row.code, roleType: row.roleType, description: row.description, isActive: row.isActive });
    setError('');
    setModal('edit');
  };

  const handleDelete = async (row) => {
    if (!confirm(`"${row.name}" silinsin mi?`)) return;
    await rolesApi.delete(row.id);
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (modal === 'create') await rolesApi.create(form);
      else await rolesApi.update(selected.id, form);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const columns = [
    { key: 'name', label: 'Rol Adı' },
    { key: 'code', label: 'Kod' },
    { key: 'roleType', label: 'Tür', render: (v) => ROLE_TYPES[v] || v },
    { key: 'isActive', label: 'Durum', render: (v) => (
      <span style={{ color: v ? '#16a34a' : '#dc2626', fontWeight: 500 }}>{v ? 'Aktif' : 'Pasif'}</span>
    )},
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Roller</h2>
          <p style={styles.sub}>Organizasyon rol yönetimi</p>
        </div>
        <button style={styles.addBtn} onClick={openCreate}>+ Yeni Rol</button>
      </div>

      <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} />

      {modal && (
        <Modal title={modal === 'create' ? 'Yeni Rol' : 'Rolü Düzenle'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Rol Adı *</label>
            <input style={styles.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />

            <label style={styles.label}>Kod *</label>
            <input style={styles.input} value={form.code} onChange={e => setForm({...form, code: e.target.value})} required />

            <label style={styles.label}>Tür</label>
            <select style={styles.input} value={form.roleType} onChange={e => setForm({...form, roleType: e.target.value})}>
              {Object.entries(ROLE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>

            <label style={styles.label}>Açıklama</label>
            <textarea style={{...styles.input, height: '80px', resize: 'vertical'}}
              value={form.description} onChange={e => setForm({...form, description: e.target.value})} />

            <label style={styles.checkLabel}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
              {' '}Aktif
            </label>

            {error && <div style={styles.error}>{error}</div>}
            <div style={styles.actions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setModal(null)}>İptal</button>
              <button type="submit" style={styles.saveBtn}>Kaydet</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { margin: 0, fontSize: '20px', fontWeight: '600', color: '#1a1a2e' },
  sub: { margin: '4px 0 0', fontSize: '13px', color: '#888' },
  addBtn: { padding: '10px 20px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#555' },
  input: { padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '7px', fontSize: '14px', outline: 'none' },
  checkLabel: { fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' },
  error: { padding: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', fontSize: '13px' },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { padding: '9px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '7px', cursor: 'pointer' },
  saveBtn: { padding: '9px 24px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '500' },
};

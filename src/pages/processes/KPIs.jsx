import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { kpisApi, processesApi } from '../../api/processes';
import { rolesApi } from '../../api/organization';

const FREQUENCIES = { MONTHLY: 'Aylık', QUARTERLY: 'Çeyreklik', YEARLY: 'Yıllık' };

export default function KPIs() {
  const [data, setData] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    name: '', definition: '', calculationMethod: '', frequency: 'MONTHLY',
    targetValue: '', thresholds: '', processId: '', ownerRoleId: '', isActive: true,
  });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [kpisRes, procsRes, rolesRes] = await Promise.all([
        kpisApi.list(), processesApi.list(), rolesApi.list()
      ]);
      setData(kpisRes.data);
      setProcesses(procsRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ name: '', definition: '', calculationMethod: '', frequency: 'MONTHLY', targetValue: '', thresholds: '', processId: '', ownerRoleId: '', isActive: true });
    setError('');
    setModal('create');
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      name: row.name, definition: row.definition, calculationMethod: row.calculationMethod,
      frequency: row.frequency, targetValue: row.targetValue, thresholds: row.thresholds,
      processId: row.processId || '', ownerRoleId: row.ownerRoleId || '', isActive: row.isActive,
    });
    setError('');
    setModal('edit');
  };

  const handleDelete = async (row) => {
    if (!confirm(`"${row.name}" silinsin mi?`)) return;
    await kpisApi.delete(row.id);
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, processId: form.processId || null, ownerRoleId: form.ownerRoleId || null };
      if (modal === 'create') await kpisApi.create(payload);
      else await kpisApi.update(selected.id, payload);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const columns = [
    { key: 'name', label: 'KPI Adı' },
    { key: 'processName', label: 'Süreç' },
    { key: 'frequency', label: 'Ölçüm Sıklığı', render: (v) => FREQUENCIES[v] || v },
    { key: 'targetValue', label: 'Hedef Değer' },
    { key: 'ownerRoleName', label: 'Sorumlu Rol' },
    { key: 'isActive', label: 'Durum', render: (v) => (
      <span style={{ color: v ? '#16a34a' : '#dc2626', fontWeight: 500 }}>{v ? 'Aktif' : 'Pasif'}</span>
    )},
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>KPI'lar</h2>
          <p style={styles.sub}>Temel performans göstergesi yönetimi</p>
        </div>
        <button style={styles.addBtn} onClick={openCreate}>+ Yeni KPI</button>
      </div>

      <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} />

      {modal && (
        <Modal title={modal === 'create' ? 'Yeni KPI' : 'KPI Düzenle'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>KPI Adı *</label>
            <input style={styles.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />

            <label style={styles.label}>Süreç *</label>
            <select style={styles.input} value={form.processId} onChange={e => setForm({...form, processId: e.target.value})} required>
              <option value="">— Seçiniz —</option>
              {processes.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>

            <label style={styles.label}>Tanım</label>
            <textarea style={{...styles.input, height: '60px', resize: 'vertical'}}
              value={form.definition} onChange={e => setForm({...form, definition: e.target.value})} />

            <label style={styles.label}>Hesaplama Yöntemi</label>
            <input style={styles.input} value={form.calculationMethod} onChange={e => setForm({...form, calculationMethod: e.target.value})} />

            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Ölçüm Sıklığı</label>
                <select style={styles.input} value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})}>
                  {Object.entries(FREQUENCIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Hedef Değer</label>
                <input style={styles.input} value={form.targetValue} onChange={e => setForm({...form, targetValue: e.target.value})} />
              </div>
            </div>

            <label style={styles.label}>Eşik Değerleri</label>
            <input style={styles.input} value={form.thresholds} onChange={e => setForm({...form, thresholds: e.target.value})}
              placeholder="örn: Kırmızı < %70, Yeşil > %90" />

            <label style={styles.label}>Sorumlu Rol</label>
            <select style={styles.input} value={form.ownerRoleId} onChange={e => setForm({...form, ownerRoleId: e.target.value})}>
              <option value="">— Seçiniz —</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>

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
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  col: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#555' },
  input: { padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '7px', fontSize: '14px', outline: 'none' },
  checkLabel: { fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' },
  error: { padding: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', fontSize: '13px' },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { padding: '9px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '7px', cursor: 'pointer' },
  saveBtn: { padding: '9px 24px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '500' },
};

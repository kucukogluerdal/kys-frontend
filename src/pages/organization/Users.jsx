import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { usersApi, titlesApi, positionsApi, unitsApi } from '../../api/organization';

export default function Users() {
  const [data, setData] = useState([]);
  const [titles, setTitles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ fullName: '', employeeId: '', phone: '', titleId: '', positionId: '', orgUnitId: '', isActive: true });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, titlesRes, posRes, unitRes] = await Promise.all([
        usersApi.list(), titlesApi.list(), positionsApi.list(), unitsApi.list()
      ]);
      setData(usersRes.data);
      setTitles(titlesRes.data);
      setPositions(posRes.data);
      setUnits(unitRes.data);
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ fullName: '', employeeId: '', phone: '', titleId: '', positionId: '', orgUnitId: '', isActive: true });
    setError('');
    setModal('create');
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      fullName: row.fullName,
      employeeId: row.employeeId || '',
      phone: row.phone || '',
      titleId: row.titleId || '',
      positionId: row.positionId || '',
      orgUnitId: row.orgUnitId || '',
      isActive: row.isActive,
    });
    setError('');
    setModal('edit');
  };

  const handleDelete = async (row) => {
    if (!confirm(`"${row.fullName}" silinsin mi?`)) return;
    await usersApi.delete(row.id);
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        titleId: form.titleId || null,
        positionId: form.positionId || null,
        orgUnitId: form.orgUnitId || null,
      };
      if (modal === 'create') await usersApi.create(payload);
      else await usersApi.update(selected.id, payload);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const columns = [
    { key: 'fullName', label: 'Ad Soyad' },
    { key: 'username', label: 'Kullanıcı Adı' },
    { key: 'employeeId', label: 'Sicil No' },
    { key: 'titleName', label: 'Ünvan' },
    { key: 'orgUnitName', label: 'Birim' },
    { key: 'positionName', label: 'Pozisyon' },
    { key: 'phone', label: 'Telefon' },
    { key: 'isActive', label: 'Durum', render: (v) => (
      <span style={{ color: v ? '#16a34a' : '#dc2626', fontWeight: 500 }}>{v ? 'Aktif' : 'Pasif'}</span>
    )},
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Kullanıcılar</h2>
          <p style={styles.sub}>Personel profil yönetimi</p>
        </div>
        <button style={styles.addBtn} onClick={openCreate}>+ Yeni Kullanıcı</button>
      </div>

      <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} />

      {modal && (
        <Modal title={modal === 'create' ? 'Yeni Kullanıcı' : 'Kullanıcıyı Düzenle'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Ad Soyad *</label>
            <input style={styles.input} value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />

            <label style={styles.label}>Sicil No</label>
            <input style={styles.input} value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} />

            <label style={styles.label}>Telefon</label>
            <input style={styles.input} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />

            <div style={styles.sectionTitle}>Organizasyonel Bilgiler</div>

            <label style={styles.label}>Ünvan</label>
            <select style={styles.input} value={form.titleId} onChange={e => setForm({...form, titleId: e.target.value})}>
              <option value="">— Seçiniz —</option>
              {[...titles].sort((a,b) => a.name.localeCompare(b.name,'tr')).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <label style={styles.label}>Birim</label>
            <select style={styles.input} value={form.orgUnitId} onChange={e => setForm({...form, orgUnitId: e.target.value})}>
              <option value="">— Seçiniz —</option>
              {[...units].sort((a,b) => a.name.localeCompare(b.name,'tr')).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>

            <label style={styles.label}>Pozisyon</label>
            <select style={styles.input} value={form.positionId} onChange={e => setForm({...form, positionId: e.target.value})}>
              <option value="">— Seçiniz —</option>
              {[...positions].sort((a,b) => a.name.localeCompare(b.name,'tr')).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
  label: { fontSize: '13px', fontWeight: '500', color: '#555' },
  input: { padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '7px', fontSize: '14px', outline: 'none' },
  checkLabel: { fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' },
  error: { padding: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', fontSize: '13px' },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { padding: '9px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '7px', cursor: 'pointer' },
  saveBtn: { padding: '9px 24px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '500' },
  sectionTitle: { fontSize: '12px', fontWeight: '600', color: '#0f3460', textTransform: 'uppercase', letterSpacing: '0.5px', paddingTop: '4px', borderTop: '1px solid #f0f0f0', marginTop: '4px' },
};

import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { distributionsApi, documentsApi } from '../../api/dms';

const DIST_TYPES = { DEPARTMENT: 'Departman', ROLE: 'Rol', POSITION: 'Pozisyon', PERSON: 'Kişi' };

export default function Distributions() {
  const [data, setData] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ documentId: '', distributionType: 'DEPARTMENT', notes: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [distRes, docsRes] = await Promise.all([distributionsApi.list(), documentsApi.list()]);
      setData(distRes.data);
      setDocuments(docsRes.data);
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (row) => {
    if (!confirm('Bu dağıtım silinsin mi?')) return;
    await distributionsApi.delete(row.id);
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await distributionsApi.create({ ...form, documentId: form.documentId || null });
      setModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const columns = [
    { key: 'documentCode', label: 'Doküman Kodu' },
    { key: 'documentTitle', label: 'Doküman Adı' },
    { key: 'distributionType', label: 'Dağıtım Türü', render: (v) => DIST_TYPES[v] || v },
    { key: 'notes', label: 'Not' },
    { key: 'distributedAt', label: 'Tarih', render: (v) => v ? v.split('T')[0] : '' },
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Dağıtımlar</h2>
          <p style={styles.sub}>Doküman dağıtım yönetimi</p>
        </div>
        <button style={styles.addBtn} onClick={() => { setForm({ documentId: '', distributionType: 'DEPARTMENT', notes: '' }); setError(''); setModal(true); }}>
          + Yeni Dağıtım
        </button>
      </div>

      <DataTable columns={columns} data={data} onEdit={() => {}} onDelete={handleDelete} loading={loading} />

      {modal && (
        <Modal title="Yeni Dağıtım" onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Doküman *</label>
            <select style={styles.input} value={form.documentId} onChange={e => setForm({...form, documentId: e.target.value})} required>
              <option value="">— Seçiniz —</option>
              {documents.map(d => <option key={d.id} value={d.id}>{d.code} — {d.title}</option>)}
            </select>

            <label style={styles.label}>Dağıtım Türü</label>
            <select style={styles.input} value={form.distributionType} onChange={e => setForm({...form, distributionType: e.target.value})}>
              {Object.entries(DIST_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>

            <label style={styles.label}>Not</label>
            <textarea style={{...styles.input, height: '80px', resize: 'vertical'}}
              value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />

            {error && <div style={styles.error}>{error}</div>}
            <div style={styles.actions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setModal(false)}>İptal</button>
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
  error: { padding: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', fontSize: '13px' },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { padding: '9px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '7px', cursor: 'pointer' },
  saveBtn: { padding: '9px 24px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '500' },
};

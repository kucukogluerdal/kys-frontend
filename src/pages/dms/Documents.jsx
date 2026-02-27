import { useState, useEffect, useRef } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { documentsApi, documentTypesApi, documentStatusesApi } from '../../api/dms';
import client from '../../api/client';

export default function Documents() {
  const [data, setData] = useState([]);
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ code: '', title: '', docTypeId: '', statusId: '', parentId: '' });
  const [formFile, setFormFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState({});
  const fileRefs = useRef({});
  const formFileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [docsRes, typesRes, statusesRes] = await Promise.all([
        documentsApi.list(), documentTypesApi.list(), documentStatusesApi.list()
      ]);
      setData(docsRes.data);
      setTypes(typesRes.data);
      setStatuses(statusesRes.data);
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ code: '', title: '', docTypeId: '', statusId: '', parentId: '' });
    setFormFile(null);
    setError('');
    setModal('create');
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({ code: row.code, title: row.title, docTypeId: row.docTypeId || '', statusId: row.statusId || '', parentId: row.parentId || '' });
    setFormFile(null);
    setError('');
    setModal('edit');
  };

  const handleDelete = async (row) => {
    if (!confirm(`"${row.title}" silinsin mi?`)) return;
    await documentsApi.delete(row.id);
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        docTypeId: form.docTypeId || null,
        statusId: form.statusId || null,
        parentId: form.parentId || null,
      };
      let savedDoc;
      if (modal === 'create') savedDoc = (await documentsApi.create(payload)).data;
      else { await documentsApi.update(selected.id, payload); savedDoc = { id: selected.id }; }

      if (formFile) {
        await documentsApi.upload(savedDoc.id, formFile);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleFileUpload = async (docId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(prev => ({ ...prev, [docId]: true }));
    try {
      await documentsApi.upload(docId, file);
      load();
    } catch (err) {
      alert('Dosya yüklenemedi');
    } finally {
      setUploading(prev => ({ ...prev, [docId]: false }));
      e.target.value = '';
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await client.get(
        `/api/dms/documents/${doc.id}/download`,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filePath;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      alert('Dosya indirilemedi');
    }
  };

  const columns = [
    { key: 'code', label: 'Kod' },
    { key: 'title', label: 'Başlık' },
    { key: 'docTypeName', label: 'Tür' },
    { key: 'statusName', label: 'Durum', render: (v) => v ? (
      <span style={{ padding: '3px 10px', background: '#e8f4ff', borderRadius: '12px', fontSize: '12px', color: '#0f3460' }}>{v}</span>
    ) : '' },
    { key: 'revisionCount', label: 'Rev.' },
    {
      key: 'filePath', label: 'Dosya',
      render: (v, row) => (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {v ? (
            <>
              <span style={{ fontSize: '11px', color: '#555', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.originalFilename || v}>
                {row.originalFilename || v}
              </span>
              <button style={styles.dlBtn} onClick={() => handleDownload(row)}>⬇ İndir</button>
            </>
          ) : (
            <span style={{ fontSize: '11px', color: '#aaa' }}>Yok</span>
          )}
          <button
            style={styles.upBtn}
            onClick={() => fileRefs.current[row.id]?.click()}
            disabled={uploading[row.id]}
            title="Dosya yükle"
          >
            {uploading[row.id] ? '⏳' : '⬆'}
          </button>
          <input
            type="file"
            style={{ display: 'none' }}
            ref={el => fileRefs.current[row.id] = el}
            onChange={e => handleFileUpload(row.id, e)}
          />
        </div>
      ),
    },
    { key: 'createdAt', label: 'Tarih', render: (v) => v ? v.split('T')[0] : '' },
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Dokümanlar</h2>
          <p style={styles.sub}>Doküman yönetimi</p>
        </div>
        <button style={styles.addBtn} onClick={openCreate}>+ Yeni Doküman</button>
      </div>

      <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} />

      {modal && (
        <Modal title={modal === 'create' ? 'Yeni Doküman' : 'Dokümanı Düzenle'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Kod *</label>
            <input style={styles.input} value={form.code} onChange={e => setForm({...form, code: e.target.value})} required />

            <label style={styles.label}>Başlık *</label>
            <input style={styles.input} value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />

            <label style={styles.label}>Doküman Türü</label>
            <select style={styles.input} value={form.docTypeId} onChange={e => setForm({...form, docTypeId: e.target.value})}>
              <option value="">— Seçiniz —</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <label style={styles.label}>Durum</label>
            <select style={styles.input} value={form.statusId} onChange={e => setForm({...form, statusId: e.target.value})}>
              <option value="">— Seçiniz —</option>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <label style={styles.label}>Üst Doküman</label>
            <select style={styles.input} value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})}>
              <option value="">— Yok —</option>
              {data.filter(d => d.id !== selected?.id).map(d => (
                <option key={d.id} value={d.id}>{d.code} — {d.title}</option>
              ))}
            </select>

            <label style={styles.label}>Doküman Dosyası {modal === 'edit' && selected?.originalFilename && <span style={{ fontWeight: 400, color: '#888' }}>(mevcut: {selected.originalFilename})</span>}</label>
            <div style={styles.fileArea} onClick={() => formFileRef.current?.click()}>
              {formFile ? (
                <span style={{ color: '#0f3460', fontWeight: 500 }}>{formFile.name}</span>
              ) : (
                <span style={{ color: '#aaa' }}>Dosya seçmek için tıklayın (PDF, Word, Excel, vb.)</span>
              )}
              <input
                type="file"
                style={{ display: 'none' }}
                ref={formFileRef}
                onChange={e => setFormFile(e.target.files[0] || null)}
              />
            </div>

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
  error: { padding: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', fontSize: '13px' },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { padding: '9px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '7px', cursor: 'pointer' },
  saveBtn: { padding: '9px 24px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '500' },
  dlBtn: { padding: '4px 10px', background: '#e8f4ff', border: '1px solid #bfdbfe', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', color: '#0f3460' },
  upBtn: { padding: '4px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', color: '#166534' },
  fileArea: {
    padding: '10px 14px', border: '1.5px dashed #c8d8e8', borderRadius: '7px',
    cursor: 'pointer', fontSize: '13px', background: '#f8fbff',
    minHeight: '40px', display: 'flex', alignItems: 'center',
  },
};

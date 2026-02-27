import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { processesApi } from '../../api/processes';
import ProcessDetail from './ProcessDetail';

export default function ProcessPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [process, setProcess] = useState(null);
  const [allProcesses, setAllProcesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [procRes, allRes] = await Promise.all([
        processesApi.get(id),
        processesApi.list(),
      ]);
      setProcess(procRes.data);
      setAllProcesses(allRes.data);
    } catch {
      setProcess(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.loading}>Yükleniyor...</div>
      </div>
    );
  }

  if (!process) {
    return (
      <div style={s.page}>
        <button style={s.backBtn} onClick={() => navigate('/processes')}>← Süreçlere Dön</button>
        <div style={s.notFound}>Süreç bulunamadı</div>
      </div>
    );
  }

  const children = allProcesses.filter(p => String(p.parentId) === String(process.id));
  const parent   = allProcesses.find(p => String(p.id) === String(process.parentId));

  return (
    <div style={s.page}>
      {/* ── Üst çubuk ── */}
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={() => navigate('/processes')}>← Süreçlere Dön</button>
      </div>

      {/* ── Üst / Alt süreç navigasyonu ── */}
      {(parent || children.length > 0) && (
        <div style={s.navCard}>
          {/* Üst süreç */}
          {parent && (
            <div style={s.navRow}>
              <span style={s.navLabel}>Üst Süreç</span>
              <button style={s.parentBtn} onClick={() => navigate(`/processes/${parent.id}`)}>
                ↑ <span style={s.navName}>{parent.name}</span>
                <span style={s.navCode}>{parent.code}</span>
              </button>
            </div>
          )}

          {/* Alt süreçler */}
          {children.length > 0 && (
            <div style={s.navRow}>
              <span style={s.navLabel}>Alt Süreçler <span style={s.navCount}>{children.length}</span></span>
              <div style={s.childChips}>
                {children.map(c => (
                  <button key={c.id} style={s.childBtn} onClick={() => navigate(`/processes/${c.id}`)}>
                    <span style={s.navName}>{c.name}</span>
                    <span style={s.navCode}>{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Detay ── */}
      <div style={s.detailWrapper}>
        <ProcessDetail
          process={process}
          allProcesses={allProcesses}
          onUpdate={load}
        />
      </div>
    </div>
  );
}

const s = {
  page:          { padding: '20px', minHeight: 'calc(100vh - 80px)' },
  topBar:        { marginBottom: 12 },
  backBtn:       { padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: '#555', fontWeight: 500 },

  navCard:       { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '12px 16px', marginBottom: 14, maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 10 },
  navRow:        { display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' },
  navLabel:      { fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', paddingTop: 4, minWidth: 80 },
  navCount:      { background: '#e0f2fe', color: '#0369a1', fontSize: 10, padding: '1px 5px', borderRadius: 8, fontWeight: 700, marginLeft: 4 },

  parentBtn:     { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: '#0f3460', fontWeight: 500, textAlign: 'left' },
  childChips:    { display: 'flex', flexWrap: 'wrap', gap: 6 },
  childBtn:      { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, cursor: 'pointer', fontSize: 12, color: '#166534', fontWeight: 500 },
  navName:       { },
  navCode:       { fontSize: 10, color: '#888', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace' },

  detailWrapper: { background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', maxWidth: 1100 },
  loading:       { padding: '60px 20px', textAlign: 'center', color: '#aaa', fontSize: 14 },
  notFound:      { padding: '60px 20px', textAlign: 'center', color: '#aaa', fontSize: 14 },
};

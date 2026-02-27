import { useState, useRef, useCallback } from 'react';
import client from '../../api/client';

const MODULES = [
  { key: 'units',        label: 'Birimler',          icon: '🏢', color: '#3b82f6', desc: 'Ad, Kod' },
  { key: 'roles',        label: 'Roller',             icon: '👤', color: '#8b5cf6', desc: 'Ad, Kod, Tür, Açıklama' },
  { key: 'titles',       label: 'Ünvanlar',           icon: '🎖️', color: '#06b6d4', desc: 'Ad, Kod' },
  { key: 'positions',    label: 'Pozisyonlar',        icon: '💼', color: '#10b981', desc: 'Ad, Kod, Seviye, Açıklama' },
  { key: 'users',        label: 'Kullanıcılar',       icon: '👥', color: '#059669', desc: 'Ad, Soyad, Sicil No, Telefon, E-posta, İşe Giriş Tarihi, Birim Kodu, Pozisyon Kodu, Ünvan Kodu' },
  { key: 'doc-types',    label: 'Doküman Türleri',    icon: '📄', color: '#f59e0b', desc: 'Kod, Ad, Seviye, Açıklama' },
  { key: 'doc-statuses', label: 'Doküman Durumları',  icon: '🔖', color: '#ef4444', desc: 'Kod, Ad, Sıra' },
  { key: 'documents',    label: 'Dokümanlar',         icon: '📁', color: '#0f3460', desc: 'Kod, Başlık, Tür Kodu, Durum Kodu, Üst Doküman Kodu' },
  { key: 'processes',    label: 'Süreçler',           icon: '⚙️', color: '#7c3aed', desc: 'Kod, Ad, Seviye, Tür, Kritiklik, Üst Süreç Kodu, Sorumlu Rol Kodu' },
  { key: 'process-details', label: 'Süreç Detayları', icon: '📋', color: '#0f3460', desc: 'Girdi/Çıktı, Tedarikçi/Müşteri ve Adım bilgilerini toplu aktar' },
];

// Onay modalı
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={ms.overlay}>
      <div style={ms.box}>
        <div style={ms.icon}>⚠️</div>
        <div style={ms.msg}>{message}</div>
        <div style={ms.warning}>Bu işlem geri alınamaz!</div>
        <div style={ms.btns}>
          <button style={ms.cancelBtn} onClick={onCancel}>İptal</button>
          <button style={ms.confirmBtn} onClick={onConfirm}>Evet, Sil</button>
        </div>
      </div>
    </div>
  );
}

const ms = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  box:        { background: '#fff', borderRadius: '12px', padding: '32px 28px', maxWidth: '380px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' },
  icon:       { fontSize: '40px', marginBottom: '12px' },
  msg:        { fontSize: '15px', color: '#1a1a2e', fontWeight: 600, marginBottom: '8px' },
  warning:    { fontSize: '13px', color: '#dc2626', marginBottom: '24px' },
  btns:       { display: 'flex', gap: '10px', justifyContent: 'center' },
  cancelBtn:  { padding: '10px 24px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '7px', cursor: 'pointer', fontSize: '14px' },
  confirmBtn: { padding: '10px 24px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
};

export default function DataImport() {
  const [results, setResults]       = useState({});
  const [loading, setLoading]       = useState({});
  const [deleting, setDeleting]     = useState({});
  const [confirm, setConfirm]       = useState(null); // { key, label }
  const [backupResult, setBackupResult] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [detailMode, setDetailMode] = useState('append'); // 'append' | 'replace'
  const fileRefs = useRef({});
  const backupFileRef = useRef(null);

  const downloadExcel = async (url, filename) => {
    try {
      const response = await client.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (err) {
      alert('İndirilemedi: ' + (err.response?.status || err.message));
    }
  };

  const handleFileChange = async (key, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(prev => ({ ...prev, [key]: true }));
    setResults(prev => ({ ...prev, [key]: null }));
    const formData = new FormData();
    formData.append('file', file);
    const url = key === 'process-details'
      ? `/api/import/process-details?mode=${detailMode}`
      : `/api/import/${key}`;
    try {
      const { data } = await client.post(url, formData);
      setResults(prev => ({ ...prev, [key]: { success: true, ...data } }));
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || err.response?.data?.error || JSON.stringify(err.response?.data);
      setResults(prev => ({ ...prev, [key]: { success: false, message: status ? `HTTP ${status}: ${serverMsg || err.message}` : `Ağ hatası: ${err.message}` } }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
      e.target.value = '';
    }
  };

  const handleBackupRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBackupLoading(true);
    setBackupResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await client.post('/api/backup/restore', formData);
      setBackupResult({ success: true, ...data });
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || JSON.stringify(err.response?.data);
      setBackupResult({ success: false, message: err.response?.status ? `HTTP ${err.response.status}: ${serverMsg || err.message}` : `Ağ hatası: ${err.message}` });
    } finally {
      setBackupLoading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (key) => {
    setConfirm(null);
    setDeleting(prev => ({ ...prev, [key]: true }));
    setResults(prev => ({ ...prev, [key]: null }));
    try {
      const { data } = await client.delete(`/api/clear/${key}`);
      setResults(prev => ({ ...prev, [key]: { success: true, imported: 0, deleted: data.deleted, isDelete: true } }));
    } catch (err) {
      setResults(prev => ({ ...prev, [key]: { success: false, message: 'Silme başarısız: ' + (err.response?.status || err.message) } }));
    } finally {
      setDeleting(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div>
      {confirm && (
        <ConfirmModal
          message={`"${confirm.label}" modülündeki tüm veriler silinecek. Emin misiniz?`}
          onConfirm={() => handleDelete(confirm.key)}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Toplu Veri Aktarımı</h2>
          <p style={styles.sub}>Excel dosyası ile sabit verileri içe/dışa aktarın veya silin</p>
        </div>
      </div>

      {/* ─── Toplu Yedekleme ─────────────────────────────────── */}
      <div style={styles.backupCard}>
        <div style={styles.backupHeader}>
          <span style={{ fontSize: '32px' }}>💾</span>
          <div>
            <div style={styles.backupTitle}>Toplu Yedekleme</div>
            <div style={styles.backupSub}>Tüm organizasyon ve personel verilerini tek dosyada yedekleyin veya geri yükleyin</div>
          </div>
        </div>

        <div style={styles.backupBody}>
          {backupResult && (
            <div style={backupResult.success ? styles.successBox : styles.errorBox}>
              {backupResult.success ? (
                <>
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>✅ Yedek başarıyla geri yüklendi</div>
                  <div style={styles.restoreCounts}>
                    {Object.entries(backupResult.restored || {}).map(([k, v]) => (
                      <span key={k} style={styles.countBadge}><span style={{ textTransform: 'capitalize' }}>{k}</span>: <strong>{v}</strong></span>
                    ))}
                  </div>
                </>
              ) : (
                <div>❌ {backupResult.message}</div>
              )}
            </div>
          )}

          <div style={styles.backupBtnRow}>
            <div style={styles.backupBtnWrap}>
              <button
                style={styles.backupDownBtn}
                onClick={() => downloadExcel('/api/backup/download', `kys_yedek_${new Date().toISOString().slice(0, 10)}.xlsx`)}
              >
                ⬇ Yedek Al
              </button>
              <div style={styles.backupBtnDesc}>Tüm birim, rol, ünvan, pozisyon ve personel verilerini tek Excel dosyasına indir</div>
            </div>

            <div style={styles.backupSep} />

            <div style={styles.backupBtnWrap}>
              <button
                style={{ ...styles.backupUpBtn, opacity: backupLoading ? 0.7 : 1 }}
                onClick={() => backupFileRef.current?.click()}
                disabled={backupLoading}
              >
                {backupLoading ? '⏳ Yükleniyor...' : '⬆ Yedekten Geri Yükle'}
              </button>
              <div style={styles.backupBtnDesc}>Daha önce alınan yedek dosyasını seçin — mevcut veriler korunur, eksikler eklenir</div>
              <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} ref={backupFileRef} onChange={handleBackupRestore} />
            </div>
          </div>
        </div>
      </div>

      <div style={styles.infoBox}>
        <strong>Nasıl kullanılır?</strong>
        <ol style={styles.steps}>
          <li>İlgili modül için <strong>Şablon</strong>'a tıklayın ve indirin</li>
          <li>Şablonu doldurun (sarı satırlar örnek veridir, silebilirsiniz)</li>
          <li><strong>Yükle</strong>'ye tıklayın ve dosyanızı seçin</li>
          <li><strong>Mevcut</strong> butonu mevcut verileri Excel olarak indirir</li>
          <li><span style={{ color: '#dc2626', fontWeight: 600 }}>Sil</span> butonu o modülün tüm verilerini siler — dikkatli kullanın!</li>
        </ol>
      </div>

      <div style={styles.grid}>
        {MODULES.map(mod => {
          const result = results[mod.key];
          const isLoading = loading[mod.key];
          const isDeleting = deleting[mod.key];
          const isDetailMod = mod.key === 'process-details';

          return (
            <div key={mod.key} style={styles.card}>
              <div style={{ ...styles.cardHeader, borderLeft: `4px solid ${mod.color}` }}>
                <span style={styles.icon}>{mod.icon}</span>
                <div>
                  <div style={styles.cardTitle}>{mod.label}</div>
                  <div style={styles.cardDesc}>{isDetailMod ? mod.desc : `Sütunlar: ${mod.desc}`}</div>
                </div>
              </div>

              <div style={styles.cardBody}>
                {isDetailMod && (
                  <div style={styles.modeRow}>
                    <button
                      style={{ ...styles.modeBtn, ...(detailMode === 'append' ? styles.modeBtnActive : {}) }}
                      onClick={() => setDetailMode('append')}
                    >
                      Ekle
                    </button>
                    <button
                      style={{ ...styles.modeBtn, ...(detailMode === 'replace' ? styles.modeBtnReplace : {}) }}
                      onClick={() => setDetailMode('replace')}
                    >
                      Değiştir
                    </button>
                    {detailMode === 'replace' && (
                      <span style={styles.replaceWarn}>⚠️ Dosyadaki süreçlerin mevcut detayları silinir</span>
                    )}
                  </div>
                )}

                {result && (
                  <div style={result.success ? styles.successBox : styles.errorBox}>
                    {result.success ? (
                      <>
                        {result.isDelete ? (
                          <div>🗑️ <strong>{result.deleted}</strong> kayıt silindi</div>
                        ) : isDetailMod && result.io != null ? (
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <span>✅ IO: <strong>{result.io.added}</strong> eklendi</span>
                            <span>✅ Tedarikçi/Müşteri: <strong>{result.parties.added}</strong> eklendi</span>
                            <span>✅ Adımlar: <strong>{result.steps.added}</strong> eklendi</span>
                          </div>
                        ) : (
                          <div>✅ <strong>{result.imported}</strong> kayıt aktarıldı</div>
                        )}
                        {/* IO hataları */}
                        {result.io?.errors?.length > 0 && (
                          <div style={styles.errList}>
                            <strong>IO hataları:</strong>
                            {result.io.errors.map((e, i) => <div key={i}>❌ {e}</div>)}
                          </div>
                        )}
                        {/* Parti hataları */}
                        {result.parties?.errors?.length > 0 && (
                          <div style={styles.errList}>
                            <strong>Tedarikçi/Müşteri hataları:</strong>
                            {result.parties.errors.map((e, i) => <div key={i}>❌ {e}</div>)}
                          </div>
                        )}
                        {/* Adım hataları */}
                        {result.steps?.errors?.length > 0 && (
                          <div style={styles.errList}>
                            <strong>Adım hataları:</strong>
                            {result.steps.errors.map((e, i) => <div key={i}>❌ {e}</div>)}
                          </div>
                        )}
                        {/* Genel uyarılar ve hatalar */}
                        {result.warnings?.length > 0 && (
                          <div style={styles.warnList}>
                            {result.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
                          </div>
                        )}
                        {result.errors?.length > 0 && (
                          <div style={styles.errList}>
                            {result.errors.map((e, i) => <div key={i}>❌ {e}</div>)}
                          </div>
                        )}
                      </>
                    ) : (
                      <div>❌ {result.message}</div>
                    )}
                  </div>
                )}

                <div style={styles.btnGroup}>
                  <button
                    style={styles.templateBtn}
                    onClick={() => isDetailMod
                      ? downloadExcel('/api/import/process-details/template', 'surec-detaylari-sablon.xlsx')
                      : downloadExcel(`/api/templates/${mod.key}`, `${mod.key}_sablon.xlsx`)
                    }
                    title="Boş şablon indir"
                  >
                    ⬇ Şablon
                  </button>
                  {!isDetailMod && (
                    <button style={styles.exportBtn} onClick={() => downloadExcel(`/api/export/${mod.key}`, `${mod.key}_mevcut.xlsx`)} title="Mevcut kayıtları Excel olarak indir">
                      ⬇ Mevcut
                    </button>
                  )}
                  <button
                    style={{ ...styles.uploadBtn, opacity: isLoading ? 0.7 : 1 }}
                    onClick={() => fileRefs.current[mod.key]?.click()}
                    disabled={isLoading}
                  >
                    {isLoading ? '⏳' : '⬆ Yükle'}
                  </button>
                  {!isDetailMod && (
                    <button
                      style={{ ...styles.deleteBtn, opacity: isDeleting ? 0.7 : 1 }}
                      onClick={() => setConfirm({ key: mod.key, label: mod.label })}
                      disabled={isDeleting}
                      title="Tüm verileri sil"
                    >
                      {isDeleting ? '⏳' : '🗑 Sil'}
                    </button>
                  )}
                  <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} ref={el => fileRefs.current[mod.key] = el} onChange={e => handleFileChange(mod.key, e)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  header:     { marginBottom: '20px' },
  title:      { margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a2e' },
  sub:        { margin: '4px 0 0', fontSize: '13px', color: '#888' },
  infoBox:    { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px', fontSize: '14px', color: '#1e40af' },
  steps:      { margin: '8px 0 0', paddingLeft: '20px', lineHeight: '1.8' },
  grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' },
  card:       { background: '#fff', borderRadius: '10px', border: '1px solid #f0f0f0', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' },
  icon:       { fontSize: '28px' },
  cardTitle:  { fontWeight: 600, fontSize: '15px', color: '#1a1a2e' },
  cardDesc:   { fontSize: '12px', color: '#888', marginTop: '2px' },
  cardBody:   { padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' },
  successBox: { padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', fontSize: '13px', color: '#166534' },
  errorBox:   { padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '7px', fontSize: '13px', color: '#dc2626' },
  warnList:   { marginTop: '6px', fontSize: '12px', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '5px', padding: '6px 10px' },
  errList:    { marginTop: '6px', fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '5px', padding: '6px 10px' },
  btnGroup:   { display: 'flex', gap: '6px' },
  templateBtn:    { flex: 1, padding: '8px 6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: '#475569' },
  exportBtn:      { flex: 1, padding: '8px 6px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: '#166534' },
  uploadBtn:      { flex: 1, padding: '8px 6px', background: '#0f3460', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: '#fff' },
  deleteBtn:      { flex: 1, padding: '8px 6px', background: '#fff', border: '1.5px solid #fca5a5', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: '#dc2626' },
  modeRow:        { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  modeBtn:        { padding: '5px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: '#475569' },
  modeBtnActive:  { background: '#0f3460', color: '#fff', border: '1px solid #0f3460' },
  modeBtnReplace: { background: '#d97706', color: '#fff', border: '1px solid #d97706' },
  replaceWarn:    { fontSize: '11px', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '5px', padding: '3px 8px' },
  // Backup section
  backupCard:     { background: 'linear-gradient(135deg, #0f3460 0%, #1a5276 100%)', borderRadius: '12px', marginBottom: '24px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(15,52,96,0.25)' },
  backupHeader:   { display: 'flex', alignItems: 'center', gap: '14px', padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.12)' },
  backupTitle:    { fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '3px' },
  backupSub:      { fontSize: '13px', color: 'rgba(255,255,255,0.65)' },
  backupBody:     { padding: '20px 24px' },
  backupBtnRow:   { display: 'flex', gap: '0', alignItems: 'stretch' },
  backupBtnWrap:  { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  backupSep:      { width: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 28px' },
  backupDownBtn:  { padding: '11px 22px', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#fff', width: 'fit-content' },
  backupUpBtn:    { padding: '11px 22px', background: '#16a34a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#fff', width: 'fit-content' },
  backupBtnDesc:  { fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 },
  restoreCounts:  { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  countBadge:     { padding: '3px 10px', background: 'rgba(255,255,255,0.25)', borderRadius: '20px', fontSize: '13px' },
};

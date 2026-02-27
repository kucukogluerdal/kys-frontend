import { useState, useEffect } from 'react';
import client from '../../api/client';

const LEVELS     = ['L1', 'L2', 'L3'];
const EMPTY_RULE = { count: '', index: '', value: '', level: 'L1' };

export default function ProcessCodePatterns() {

  const [separator,   setSeparator]   = useState('-');
  const [fieldNames,  setFieldNames]  = useState([]);
  const [levelRules,  setLevelRules]  = useState([]);
  const [parentTplL2, setParentTplL2] = useState('');
  const [parentTplL3, setParentTplL3] = useState('');
  const [cfgSaving,   setCfgSaving]   = useState(false);
  const [cfgError,    setCfgError]    = useState('');
  const [testCode,    setTestCode]    = useState('');
  const [testResult,  setTestResult]  = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const loadCfg = () =>
    client.get('/api/process-code-config').then(r => {
      const d = r.data;
      if (d.id) {
        setSeparator(d.separator || '-');
        setFieldNames(d.fieldNames || []);
        setLevelRules((d.levelRules || []).map(rule => ({
          count: rule.count != null && rule.count >= 0 ? String(rule.count) : '',
          index: rule.index != null && rule.index >= 0 ? String(rule.index) : '',
          value: rule.value || '',
          level: rule.level || 'L1',
        })));
        setParentTplL2(d.parentTemplateL2 || '');
        setParentTplL3(d.parentTemplateL3 || '');
      }
    }).catch(() => {});

  useEffect(() => { loadCfg(); }, []);

  // ─── Alan isimleri ────────────────────────────────────────────
  const addField  = () => setFieldNames(f => [...f, '']);
  const updField  = (i, v) => setFieldNames(f => f.map((x, idx) => idx === i ? v : x));
  const delField  = i => setFieldNames(f => f.filter((_, idx) => idx !== i));
  const moveField = (i, d) => {
    const arr = [...fieldNames]; const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setFieldNames(arr);
  };

  // ─── Seviye kuralları ─────────────────────────────────────────
  const addRule  = () => setLevelRules(r => [...r, { ...EMPTY_RULE }]);
  const updRule  = (i, k, v) => setLevelRules(r => r.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const delRule  = i => setLevelRules(r => r.filter((_, idx) => idx !== i));
  const moveRule = (i, d) => {
    const arr = [...levelRules]; const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setLevelRules(arr);
  };

  // ─── Kaydet / Sıfırla / Test ──────────────────────────────────
  const handleSave = async () => {
    setCfgSaving(true); setCfgError('');
    try {
      const rules = levelRules.map(r => ({
        count: r.count !== '' ? parseInt(r.count) : -1,
        index: r.index !== '' ? parseInt(r.index) : -1,
        value: r.value.trim() || null,
        level: r.level,
      }));
      await client.post('/api/process-code-config', {
        separator,
        fieldNames: fieldNames.map(f => f.trim()).filter(Boolean),
        levelRules: rules,
        parentTemplateL2: parentTplL2,
        parentTemplateL3: parentTplL3,
      });
      await loadCfg();
    } catch (e) {
      setCfgError(e.response?.data?.message || e.message);
    } finally { setCfgSaving(false); }
  };

  const handleReset = async () => {
    if (!window.confirm('Yapılandırma sıfırlansın mı?')) return;
    await client.delete('/api/process-code-config');
    setSeparator('-'); setFieldNames([]); setLevelRules([]);
    setParentTplL2(''); setParentTplL3(''); setTestResult(null);
  };

  const handleTest = async () => {
    if (!testCode.trim()) return;
    setTestLoading(true); setTestResult(null);
    try {
      const r = await client.post('/api/process-code-config/test', { code: testCode });
      setTestResult(r.data);
    } catch (e) { setTestResult({ error: e.message }); }
    finally { setTestLoading(false); }
  };

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Süreç Kodu Yapısı</h2>
        <p style={s.sub}>
          Ayırıcı, alan isimleri, seviye kuralları ve üst kod şablonları tanımlayın.
          Kaydedildikten sonra Excel import ve "Kodlara Göre İlişkilendir" bu yapıyı kullanır.
        </p>
      </div>

      <div style={s.infoBox}>
        <strong>Örnek:</strong>&nbsp; Ayırıcı <code>-</code> | Alanlar: <code>Org, Birim, Tür, No, AltNo</code><br />
        <code>KADEM-VKF-AS-01</code> → Kural: parça sayısı=4 &amp; index[2]=AS → <b>L1</b>, üst yok<br />
        <code>KADEM-VKF-SR-01</code> → Kural: parça sayısı=4 &amp; index[2]=SR → <b>L2</b>, üst = <code>{'{Org}'}-{'{Birim}'}-AS-{'{No}'}</code><br />
        <code>KADEM-VKF-SR-01-001</code> → Kural: parça sayısı=5 → <b>L3</b>, üst = <code>{'{Org}'}-{'{Birim}'}-SR-{'{No}'}</code>
      </div>

      {/* Ayırıcı */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Ayırıcı Karakter</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            style={{ ...s.input, width: 80, fontFamily: 'monospace', textAlign: 'center', fontSize: 15 }}
            value={separator} onChange={e => setSeparator(e.target.value)} maxLength={5} placeholder="-"
          />
          <span style={s.hint}>Kod parçalarını ayıran karakter (genellikle <code>-</code>)</span>
        </div>
      </div>

      {/* Alan isimleri */}
      <div style={s.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={s.sectionTitle}>Alan Eşleme (Sıralı — 0'dan başlar)</div>
          <button style={s.addBtn} onClick={addField}>+ Alan Ekle</button>
        </div>
        {fieldNames.length === 0 && <div style={s.empty}>Henüz alan yok. "Alan Ekle" ile başlayın.</div>}
        {fieldNames.map((fn, i) => (
          <div key={i} style={s.listRow}>
            <span style={s.idxBadge}>{i}</span>
            <input
              style={{ ...s.input, flex: 1, fontFamily: 'monospace' }}
              value={fn} onChange={e => updField(i, e.target.value)}
              placeholder="Org, Birim, Tür, No, AltNo..."
            />
            <button style={s.arrowBtn} onClick={() => moveField(i, -1)} disabled={i === 0}>▲</button>
            <button style={s.arrowBtn} onClick={() => moveField(i, 1)} disabled={i === fieldNames.length - 1}>▼</button>
            <button style={s.delBtn} onClick={() => delField(i)}>✕</button>
          </div>
        ))}
      </div>

      {/* Seviye kuralları */}
      <div style={s.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={s.sectionTitle}>Seviye Kuralları (İlk Eşleşen Kazanır)</div>
          <button style={s.addBtn} onClick={addRule}>+ Kural Ekle</button>
        </div>

        {/* Açıklama */}
        <div style={s.helpBox}>
          <div style={s.helpGrid}>
            <div style={s.helpItem}>
              <span style={s.helpLabel}>Parça Sayısı</span>
              <span>Kod bölününce kaç parça? <code>KADEM-VKF-AS-01</code>=4, <code>KADEM-VKF-SR-01-001</code>=5. Boş=önemli değil.</span>
            </div>
            <div style={s.helpItem}>
              <span style={s.helpLabel}>Index</span>
              <span>Hangi pozisyon kontrol edilsin? (0'dan). <code>KADEM</code>=0, <code>VKF</code>=1, <code>AS/SR</code>=2. Boş=kontrol yok.</span>
            </div>
            <div style={s.helpItem}>
              <span style={s.helpLabel}>Beklenen Değer</span>
              <span>O pozisyondaki parça bu değere eşit mi? Boş=her değer kabul.</span>
            </div>
            <div style={s.helpItem}>
              <span style={s.helpLabel}>Seviye</span>
              <span>Koşullar sağlanınca hangi seviye atansın?</span>
            </div>
          </div>
          <div style={s.exampleTable}>
            <strong>Örnek kurallar:</strong>
            <table style={{ marginTop: 8, borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
              <thead>
                <tr style={{ color: '#6b7280' }}>
                  <th style={s.exTh}>#</th><th style={s.exTh}>Parça</th><th style={s.exTh}>Index</th>
                  <th style={s.exTh}>Değer</th><th style={s.exTh}>Seviye</th><th style={s.exTh}>Açıklama</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={s.exTd}>1</td><td style={s.exTd}><code>4</code></td><td style={s.exTd}><code>2</code></td>
                  <td style={s.exTd}><code>AS</code></td><td style={s.exTd}><span style={{ ...s.badge, background: '#dbeafe', color: '#1e40af' }}>L1</span></td>
                  <td style={s.exTd}>4 parça VE index[2]=AS → L1</td>
                </tr>
                <tr>
                  <td style={s.exTd}>2</td><td style={s.exTd}><code>4</code></td><td style={s.exTd}><code>2</code></td>
                  <td style={s.exTd}><code>SR</code></td><td style={s.exTd}><span style={{ ...s.badge, background: '#dcfce7', color: '#166534' }}>L2</span></td>
                  <td style={s.exTd}>4 parça VE index[2]=SR → L2</td>
                </tr>
                <tr>
                  <td style={s.exTd}>3</td><td style={s.exTd}><code>5</code></td><td style={s.exTd}><em style={{ color: '#94a3b8' }}>boş</em></td>
                  <td style={s.exTd}><em style={{ color: '#94a3b8' }}>boş</em></td><td style={s.exTd}><span style={{ ...s.badge, background: '#fef9c3', color: '#854d0e' }}>L3</span></td>
                  <td style={s.exTd}>Sadece 5 parça → L3</td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: 6, color: '#6b7280', fontSize: 11 }}>ℹ️ Kurallar yukarıdan aşağı sırayla denenir — ilk eşleşen uygulanır.</div>
          </div>
        </div>

        {levelRules.length === 0 && <div style={s.empty}>Kural yok — en az bir kural ekleyin.</div>}
        {levelRules.length > 0 && (
          <div style={{ ...s.listRow, fontWeight: 600, fontSize: 11, color: '#475569', background: '#f8fafc', borderRadius: 6, marginBottom: 4 }}>
            <span style={{ width: 28 }}>#</span>
            <span style={{ width: 90 }}>Parça Sayısı</span>
            <span style={{ width: 70 }}>Index</span>
            <span style={{ flex: 1 }}>Beklenen Değer</span>
            <span style={{ width: 74 }}>Seviye</span>
            <span style={{ width: 72 }}></span>
          </div>
        )}
        {levelRules.map((rule, i) => (
          <div key={i} style={{ ...s.listRow, alignItems: 'center' }}>
            <span style={s.idxBadge}>{i + 1}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 90 }}>
              <span style={s.colLabel}>Parça sayısı</span>
              <input style={{ ...s.input, padding: '5px 8px' }} value={rule.count}
                onChange={e => updRule(i, 'count', e.target.value)} placeholder="boş=hepsi" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 70 }}>
              <span style={s.colLabel}>Index</span>
              <input style={{ ...s.input, padding: '5px 8px' }} value={rule.index}
                onChange={e => updRule(i, 'index', e.target.value)} placeholder="boş=yok" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              <span style={s.colLabel}>Değer</span>
              <input style={{ ...s.input, padding: '5px 8px', fontFamily: 'monospace' }} value={rule.value}
                onChange={e => updRule(i, 'value', e.target.value.toUpperCase())} placeholder="boş=herhangi" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 74 }}>
              <span style={s.colLabel}>Seviye</span>
              <select style={{ ...s.input, padding: '5px 8px', background: '#fff' }} value={rule.level}
                onChange={e => updRule(i, 'level', e.target.value)}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={s.arrowBtn} onClick={() => moveRule(i, -1)} disabled={i === 0}>▲</button>
              <button style={s.arrowBtn} onClick={() => moveRule(i, 1)} disabled={i === levelRules.length - 1}>▼</button>
              <button style={s.delBtn} onClick={() => delRule(i)}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Parent şablonları */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Üst Süreç Kod Şablonları</div>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280' }}>
          Alan isimlerini <code>{'{AlanAdı}'}</code> şeklinde yazın.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ ...s.field, flex: 1, minWidth: 240 }}>
            <label style={s.label}>L2 Üst Süreç Şablonu</label>
            <input style={{ ...s.input, fontFamily: 'monospace' }} value={parentTplL2}
              onChange={e => setParentTplL2(e.target.value)} placeholder="{Org}-{Birim}-AS-{No}" />
          </div>
          <div style={{ ...s.field, flex: 1, minWidth: 240 }}>
            <label style={s.label}>L3 Üst Süreç Şablonu</label>
            <input style={{ ...s.input, fontFamily: 'monospace' }} value={parentTplL3}
              onChange={e => setParentTplL3(e.target.value)} placeholder="{Org}-{Birim}-SR-{No}" />
          </div>
        </div>
      </div>

      {/* Kaydet / Sıfırla */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
        <button style={s.saveBtn} onClick={handleSave} disabled={cfgSaving}>
          {cfgSaving ? '⏳ Kaydediliyor…' : '💾 Yapılandırmayı Kaydet'}
        </button>
        <button style={s.cancelBtn} onClick={handleReset}>Sıfırla</button>
      </div>
      {cfgError && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>⚠️ {cfgError}</div>}

      {/* Test */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Test — Örnek Kod ile Dene</div>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6b7280' }}>
          Kaydedilen yapılandırmayı test edin (Enter ile de çalışır).
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ ...s.field, flex: 1 }}>
            <label style={s.label}>Süreç Kodu</label>
            <input style={{ ...s.input, fontFamily: 'monospace', fontSize: 14 }} value={testCode}
              onChange={e => setTestCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTest()}
              placeholder="KADEM-VKF-SR-01" />
          </div>
          <button style={{ ...s.saveBtn, background: '#0369a1' }} onClick={handleTest} disabled={testLoading}>
            {testLoading ? '⏳' : '▶ Test Et'}
          </button>
        </div>
        {testResult && (
          <div style={s.testResult}>
            {testResult.error ? (
              <div style={{ color: '#dc2626' }}>Hata: {testResult.error}</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                <div style={s.testBox}>
                  <div style={s.testLabel}>Parçalar</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                    {(testResult.tokens || []).map((t, i) => (
                      <span key={i}>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{i}:</span>
                        <code style={s.chip}>{t}</code>
                        {i < testResult.tokens.length - 1 && <span style={{ color: '#cbd5e1', margin: '0 2px' }}>|</span>}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={s.testBox}>
                  <div style={s.testLabel}>Alan Eşleme</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Object.entries(testResult.fields || {}).map(([k, v]) => (
                      <span key={k}><span style={{ color: '#6b7280', fontSize: 11 }}>{k}=</span><code style={s.chip}>{v}</code></span>
                    ))}
                  </div>
                </div>
                <div style={s.testBox}>
                  <div style={s.testLabel}>Seviye</div>
                  <span style={{ padding: '3px 12px', borderRadius: 12, fontSize: 14, fontWeight: 700, ...levelColor(testResult.level) }}>
                    {testResult.level}
                  </span>
                </div>
                <div style={s.testBox}>
                  <div style={s.testLabel}>Üst Süreç Kodu</div>
                  <code style={{ ...s.chip, fontSize: 13 }}>{testResult.parentCode || '—'}</code>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function levelColor(lv) {
  if (lv === 'L1') return { background: '#dbeafe', color: '#1e40af' };
  if (lv === 'L2') return { background: '#dcfce7', color: '#166534' };
  return { background: '#fef9c3', color: '#854d0e' };
}

const s = {
  header:      { marginBottom: 16 },
  title:       { margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' },
  sub:         { margin: '4px 0 0', fontSize: 13, color: '#888' },
  infoBox:     { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#166534', lineHeight: 1.8 },
  section:     { background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '16px 18px', marginBottom: 16 },
  sectionTitle:{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 10 },
  hint:        { fontSize: 12, color: '#6b7280' },
  listRow:     { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 },
  idxBadge:    { minWidth: 26, height: 26, background: '#e2e8f0', borderRadius: 13, fontSize: 11, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  colLabel:    { fontSize: 10, color: '#94a3b8' },
  arrowBtn:    { background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 5, cursor: 'pointer', fontSize: 11, padding: '3px 6px', color: '#475569' },
  delBtn:      { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#dc2626', padding: '0 4px' },
  addBtn:      { padding: '6px 14px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 12 },
  saveBtn:     { padding: '8px 20px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  cancelBtn:   { padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontSize: 13 },
  field:       { display: 'flex', flexDirection: 'column', gap: 4 },
  label:       { fontSize: 12, fontWeight: 500, color: '#475569' },
  input:       { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, outline: 'none' },
  empty:       { fontSize: 13, color: '#94a3b8', padding: '10px 0' },
  badge:       { padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  helpBox:     { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '14px 16px', marginBottom: 14 },
  helpGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 },
  helpItem:    { display: 'flex', flexDirection: 'column', gap: 3, background: '#fff', borderRadius: 6, border: '1px solid #d1fae5', padding: '8px 10px', fontSize: 12, lineHeight: 1.6, color: '#374151' },
  helpLabel:   { fontWeight: 700, fontSize: 11, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' },
  exampleTable:{ background: '#fff', borderRadius: 6, padding: '10px 12px', border: '1px solid #d1fae5' },
  exTh:        { padding: '4px 8px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e2e8f0', fontSize: 11, color: '#6b7280' },
  exTd:        { padding: '5px 8px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' },
  testResult:  { marginTop: 14, background: '#f8fafc', borderRadius: 8, padding: '14px 16px', border: '1px solid #e2e8f0' },
  testBox:     { display: 'flex', flexDirection: 'column', gap: 6 },
  testLabel:   { fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
  chip:        { fontFamily: 'monospace', background: '#e0f2fe', color: '#0369a1', padding: '2px 7px', borderRadius: 5, fontSize: 12 },
};

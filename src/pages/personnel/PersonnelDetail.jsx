import { useState, useEffect } from 'react';
import SearchableSelect from '../../components/SearchableSelect';
import { usersApi, unitsApi } from '../../api/organization';

/**
 * Tekil personel detay + org atama + sistem erişimi paneli
 * Props: person, units, positions, titles, onSaved, onClose
 */
export default function PersonnelDetail({ person, units, positions, titles, onSaved, onClose }) {
  // Kişisel bilgiler + org atama formu
  const [form, setForm] = useState({});
  const [unitPositions, setUnitPos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Sistem erişimi formu
  const [accessForm, setAccessForm] = useState({});
  const [accessSaving, setAccSaving] = useState(false);
  const [accessMsg, setAccessMsg] = useState('');

  // Person değişince formları doldur
  useEffect(() => {
    if (!person) return;

    // firstName/lastName yoksa fullName'i böl
    const parts = (person.fullName || '').trim().split(/\s+/);
    const firstName = person.firstName || parts[0] || '';
    const lastName  = person.lastName  || parts.slice(1).join(' ') || '';

    setForm({
      firstName,
      lastName,
      employeeId: person.employeeId || '',
      phone:      person.phone      || '',
      email:      person.email      || '',
      hireDate:   person.hireDate   || '',
      orgUnitId:  person.orgUnitId  ? String(person.orgUnitId)  : '',
      positionId: person.positionId ? String(person.positionId) : '',
      titleId:    person.titleId    ? String(person.titleId)    : '',
    });
    setAccessForm({
      username: person.username || '',
      password: '',
      role:     person.role    || 'USER',
      isActive: person.isActive !== false,
    });
    setMsg('');
    setAccessMsg('');
  }, [person?.id]);

  // Birim değişince o birime ait pozisyonları getir
  useEffect(() => {
    if (!form.orgUnitId) { setUnitPos(positions); return; }
    unitsApi.detail(form.orgUnitId)
      .then(r => setUnitPos(r.data.positions || []))
      .catch(() => setUnitPos(positions));
  }, [form.orgUnitId]);

  if (!person) return null;

  const unitOpts  = [...units]
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    .map(u => ({ value: u.id, label: u.name, code: u.code }));

  const posOpts = (form.orgUnitId ? unitPositions : positions)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    .map(p => ({ value: p.id, label: p.name, code: p.code }));

  const titleOpts = [...titles]
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    .map(t => ({ value: t.id, label: t.name, code: t.code }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await usersApi.update(person.id, {
        firstName:  form.firstName,
        lastName:   form.lastName,
        employeeId: form.employeeId || null,
        phone:      form.phone      || null,
        email:      form.email      || null,
        hireDate:   form.hireDate   || null,
        orgUnitId:  form.orgUnitId  || null,
        positionId: form.positionId || null,
        titleId:    form.titleId    || null,
      });
      setMsg('success');
      onSaved();
    } catch { setMsg('error'); }
    finally { setSaving(false); }
  };

  const handleAccessSave = async (e) => {
    e.preventDefault();
    setAccSaving(true); setAccessMsg('');
    try {
      await usersApi.updateAccess(person.id, accessForm);
      setAccessMsg('success');
      onSaved();
    } catch { setAccessMsg('error'); }
    finally { setAccSaving(false); }
  };

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.avatar}>{(person.fullName || '?')[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={s.name}>{person.fullName || '—'}</div>
          <div style={s.sub}>
            {person.employeeId && <span style={s.badge}>{person.employeeId}</span>}
            {person.orgUnitName && <span> · {person.orgUnitName}</span>}
          </div>
        </div>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div style={s.body}>
        {/* ─── Kişisel Bilgiler + Org Atama ─── */}
        <form onSubmit={handleSave}>
          <div style={s.sectionLabel}>Kişisel Bilgiler</div>
          <div style={s.grid2}>
            <div>
              <label style={s.label}>Ad *</label>
              <input style={s.input} value={form.firstName || ''} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} required />
            </div>
            <div>
              <label style={s.label}>Soyad *</label>
              <input style={s.input} value={form.lastName || ''} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} required />
            </div>
            <div>
              <label style={s.label}>Sicil No</label>
              <input style={s.input} value={form.employeeId || ''} onChange={e => setForm(f => ({...f, employeeId: e.target.value}))} />
            </div>
            <div>
              <label style={s.label}>Telefon</label>
              <input style={s.input} value={form.phone || ''} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
            </div>
            <div>
              <label style={s.label}>E-posta</label>
              <input style={s.input} type="email" value={form.email || ''} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            </div>
            <div>
              <label style={s.label}>İşe Giriş Tarihi</label>
              <input style={s.input} type="date" value={form.hireDate || ''} onChange={e => setForm(f => ({...f, hireDate: e.target.value}))} />
            </div>
          </div>

          <div style={s.sectionLabel}>Organizasyon Ataması</div>
          <div style={s.grid1}>
            <div>
              <label style={s.label}>Birim</label>
              <SearchableSelect
                options={unitOpts}
                value={form.orgUnitId || ''}
                onChange={v => setForm(f => ({...f, orgUnitId: String(v), positionId: ''}))}
              />
            </div>
            <div>
              <label style={s.label}>
                Pozisyon
                {form.orgUnitId && <span style={s.filterHint}> (birime göre)</span>}
              </label>
              <SearchableSelect
                options={posOpts}
                value={form.positionId || ''}
                onChange={v => setForm(f => ({...f, positionId: String(v)}))}
              />
            </div>
            <div>
              <label style={s.label}>Ünvan</label>
              <SearchableSelect
                options={titleOpts}
                value={form.titleId || ''}
                onChange={v => setForm(f => ({...f, titleId: String(v)}))}
              />
            </div>
          </div>

          {msg === 'success' && <div style={s.ok}>✅ Kaydedildi</div>}
          {msg === 'error'   && <div style={s.err}>❌ Bir hata oluştu</div>}
          <div style={s.actions}>
            <button type="submit" style={s.saveBtn} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>

        <div style={s.divider} />

        {/* ─── Sistem Erişimi ─── */}
        <form onSubmit={handleAccessSave}>
          <div style={s.sectionLabel}>Sistem Erişimi</div>
          {!person.username && (
            <div style={s.infoBox}>Bu personel için henüz sistem hesabı tanımlanmamış. Kullanıcı adı ve şifre girerek oluşturabilirsiniz.</div>
          )}
          <div style={s.grid2}>
            <div>
              <label style={s.label}>Kullanıcı Adı</label>
              <input style={s.input} value={accessForm.username || ''} onChange={e => setAccessForm(f => ({...f, username: e.target.value}))} />
            </div>
            <div>
              <label style={s.label}>
                Şifre
                {person.username && <span style={s.filterHint}> (boş = değiştirme)</span>}
              </label>
              <input style={s.input} type="password" value={accessForm.password || ''} onChange={e => setAccessForm(f => ({...f, password: e.target.value}))} autoComplete="new-password" />
            </div>
            <div>
              <label style={s.label}>Sistem Rolü</label>
              <select style={s.input} value={accessForm.role || 'USER'} onChange={e => setAccessForm(f => ({...f, role: e.target.value}))}>
                <option value="USER">Kullanıcı (USER)</option>
                <option value="ADMIN">Yönetici (ADMIN)</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '22px' }}>
              <input type="checkbox" id={`active-${person.id}`} checked={!!accessForm.isActive} onChange={e => setAccessForm(f => ({...f, isActive: e.target.checked}))} />
              <label htmlFor={`active-${person.id}`} style={{ fontSize: '14px', cursor: 'pointer' }}>Sistem erişimi aktif</label>
            </div>
          </div>
          {accessMsg === 'success' && <div style={s.ok}>✅ Sistem erişimi güncellendi</div>}
          {accessMsg === 'error'   && <div style={s.err}>❌ Bir hata oluştu</div>}
          <div style={s.actions}>
            <button type="submit" style={s.saveBtn} disabled={accessSaving}>
              {accessSaving ? 'Kaydediliyor...' : person.username ? 'Erişimi Güncelle' : 'Hesap Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  panel:   { height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '12px', border: '1px solid #e8e8e8', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' },
  header:  { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e8e8e8', flexShrink: 0 },
  avatar:  { width: '40px', height: '40px', borderRadius: '50%', background: '#0f3460', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 },
  name:    { fontWeight: 700, fontSize: '16px', color: '#1a1a2e' },
  sub:     { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  badge:   { background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' },
  closeBtn:{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px', padding: '4px', marginLeft: 'auto', flexShrink: 0 },

  body:    { flex: 1, overflowY: 'auto', padding: '20px' },

  sectionLabel: { fontSize: '12px', fontWeight: 700, color: '#0f3460', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' },
  divider: { borderTop: '2px solid #f0f0f0', margin: '24px 0' },

  grid2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' },
  grid1:   { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' },
  label:   { display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '5px' },
  input:   { width: '100%', padding: '9px 11px', border: '1.5px solid #ddd', borderRadius: '7px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  filterHint: { color: '#0369a1', fontWeight: 400 },

  actions: { display: 'flex', justifyContent: 'flex-end', marginTop: '8px' },
  saveBtn: { padding: '10px 24px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
  ok:      { padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', color: '#166534', fontSize: '13px', marginBottom: '10px' },
  err:     { padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '7px', color: '#dc2626', fontSize: '13px', marginBottom: '10px' },
  infoBox: { padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '7px', color: '#1d4ed8', fontSize: '13px', marginBottom: '16px' },
};

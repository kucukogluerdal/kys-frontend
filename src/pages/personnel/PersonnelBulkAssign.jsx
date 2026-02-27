import { useState, useEffect, useMemo } from 'react';
import SearchableSelect from '../../components/SearchableSelect';
import { usersApi, unitsApi } from '../../api/organization';

/**
 * Toplu Atama – inline panel (sidebar tab içinde gösterilir)
 * Props: personnel, units, positions, titles, onSaved
 */
export default function PersonnelBulkAssign({ personnel, units, positions, titles, onSaved }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [form, setForm] = useState({ orgUnitId: '', positionId: '', titleId: '' });
  const [unitPositions, setUnitPos] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!form.orgUnitId) { setUnitPos(positions); return; }
    unitsApi.detail(form.orgUnitId)
      .then(r => setUnitPos(r.data.positions || []))
      .catch(() => setUnitPos(positions));
  }, [form.orgUnitId, positions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return personnel
      .filter(p => !q || p.fullName?.toLowerCase().includes(q) || p.employeeId?.toLowerCase().includes(q))
      .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'tr'));
  }, [personnel, search]);

  const toggleAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const toggle = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) { setMsg('select'); return; }
    if (!form.orgUnitId && !form.positionId && !form.titleId) { setMsg('nofield'); return; }

    setSaving(true); setMsg('');
    try {
      await Promise.all(
        [...selectedIds].map(id =>
          usersApi.update(id, {
            orgUnitId:  form.orgUnitId  || null,
            positionId: form.positionId || null,
            titleId:    form.titleId    || null,
          })
        )
      );
      setMsg('success');
      setSelectedIds(new Set());
      onSaved();
    } catch { setMsg('error'); }
    finally { setSaving(false); }
  };

  const unitOpts  = [...units].sort((a,b) => a.name.localeCompare(b.name,'tr')).map(u => ({ value: u.id, label: u.name, code: u.code }));
  const posOpts   = (form.orgUnitId ? unitPositions : positions).sort((a,b) => a.name.localeCompare(b.name,'tr')).map(p => ({ value: p.id, label: p.name, code: p.code }));
  const titleOpts = [...titles].sort((a,b) => a.name.localeCompare(b.name,'tr')).map(t => ({ value: t.id, label: t.name, code: t.code }));

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        {/* Header */}
        <div style={s.cardHeader}>
          <div style={s.cardTitle}>Toplu Atama</div>
          <div style={s.cardSub}>Personel seçin ve toplu organizasyon ataması yapın</div>
        </div>

        {/* Body */}
        <div style={s.body}>
          <div style={s.cols}>
            {/* Sol: Personel listesi */}
            <div style={s.leftCol}>
              <div style={s.colTitle}>
                Personel Seç
                <span style={s.selCount}> ({selectedIds.size} seçili)</span>
              </div>
              <input
                style={s.searchInput}
                placeholder="Ad veya sicil ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div style={s.listWrap}>
                <div style={s.checkRow} onClick={toggleAll}>
                  <input
                    type="checkbox"
                    readOnly
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Tümünü Seç</span>
                </div>
                {filtered.map(p => (
                  <div key={p.id} style={s.checkRow} onClick={() => toggle(p.id)}>
                    <input type="checkbox" readOnly checked={selectedIds.has(p.id)} style={{ cursor: 'pointer' }} />
                    <div>
                      <div style={s.personName}>{p.fullName}</div>
                      {p.employeeId && <div style={s.personSub}>{p.employeeId}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sağ: Atama formu */}
            <div style={s.rightCol}>
              <div style={s.colTitle}>Atama Yap</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={s.label}>Birim</label>
                  <SearchableSelect
                    options={unitOpts}
                    value={form.orgUnitId}
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
                    value={form.positionId}
                    onChange={v => setForm(f => ({...f, positionId: String(v)}))}
                  />
                </div>
                <div>
                  <label style={s.label}>Ünvan</label>
                  <SearchableSelect
                    options={titleOpts}
                    value={form.titleId}
                    onChange={v => setForm(f => ({...f, titleId: String(v)}))}
                  />
                </div>
              </div>

              {msg === 'select'  && <div style={s.warn}>⚠ Lütfen en az bir personel seçin</div>}
              {msg === 'nofield' && <div style={s.warn}>⚠ Lütfen en az bir atama alanı doldurun</div>}
              {msg === 'success' && <div style={s.ok}>✅ Atama başarıyla tamamlandı</div>}
              {msg === 'error'   && <div style={s.errMsg}>❌ Bir hata oluştu</div>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Atanıyor...' : `${selectedIds.size > 0 ? selectedIds.size + ' Personele' : 'Seçili Personele'} Ata`}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap:     { display: 'flex', flexDirection: 'column', flex: 1 },
  card:     { background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  cardHeader:{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', flexShrink: 0 },
  cardTitle: { fontSize: '15px', fontWeight: 700, color: '#1a1a2e' },
  cardSub:   { fontSize: '13px', color: '#888', marginTop: '2px' },

  body:     { flex: 1, overflowY: 'auto', padding: '20px' },
  cols:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },

  leftCol:    { display: 'flex', flexDirection: 'column', gap: '10px' },
  rightCol:   { display: 'flex', flexDirection: 'column', gap: '10px' },
  colTitle:   { fontSize: '12px', fontWeight: 700, color: '#0f3460', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' },
  selCount:   { color: '#0369a1', fontWeight: 400, textTransform: 'none', fontSize: '12px' },

  searchInput:{ padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  listWrap:   { border: '1px solid #f0f0f0', borderRadius: '8px', overflowY: 'auto', maxHeight: '400px' },
  checkRow:   { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f8f8f8' },
  personName: { fontSize: '13px', fontWeight: 600, color: '#1a1a2e' },
  personSub:  { fontSize: '11px', color: '#888' },

  label:      { display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '5px' },
  filterHint: { color: '#0369a1', fontWeight: 400, fontSize: '11px' },

  footer:   { display: 'flex', justifyContent: 'flex-end', padding: '14px 20px', borderTop: '1px solid #f0f0f0', flexShrink: 0 },
  saveBtn:  { padding: '10px 24px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },

  warn:   { padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '7px', color: '#92400e', fontSize: '13px', marginTop: '12px' },
  ok:     { padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', color: '#166534', fontSize: '13px', marginTop: '12px' },
  errMsg: { padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '7px', color: '#dc2626', fontSize: '13px', marginTop: '12px' },
};

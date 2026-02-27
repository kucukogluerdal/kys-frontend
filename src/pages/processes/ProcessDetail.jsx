import { useState, useEffect } from 'react';
import { processesApi } from '../../api/processes';
import { positionsApi } from '../../api/organization';

const LEVELS        = { L1: 'Seviye 1', L2: 'Seviye 2', L3: 'Seviye 3' };
const TYPES         = { CORE: 'Temel', SUPPORT: 'Destek', MANAGEMENT: 'Yönetim' };
const CRITICALITIES = { HIGH: 'Yüksek', MEDIUM: 'Orta', LOW: 'Düşük' };
const RISK_LEVELS   = { HIGH: 'Yüksek', MEDIUM: 'Orta', LOW: 'Düşük' };
const RISK_COLORS   = { HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#16a34a' };
const FREQUENCIES   = { MONTHLY: 'Aylık', QUARTERLY: 'Çeyreklik', YEARLY: 'Yıllık' };

const TABS = ['Kimlik', 'SIPOC', 'Adımlar', 'Riskler', 'KPI'];

function Badge({ value, colorMap, labelMap }) {
  const color = colorMap[value] || '#888';
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: color + '18', color, border: `1px solid ${color}40` }}>
      {labelMap[value] || value}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 14, color: '#1a1a2e', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}

function PositionPicker({ allPositions, currentId, currentName, onSave }) {
  const [search, setSearch]   = useState('');
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [selected, setSelected] = useState(null); // { id, name }

  useEffect(() => {
    if (currentId && allPositions.length > 0) {
      const pos = allPositions.find(p => String(p.id) === String(currentId));
      setSelected(pos || null);
    } else {
      setSelected(null);
    }
  }, [currentId, allPositions]);

  const sorted = [...allPositions]
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (pos) => {
    setSelected(pos);
    setSearch('');
    setOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected ? selected.id : null);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSelected(null);
    setSaving(true);
    try { await onSave(null); } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ fontSize: 12, color: '#666', fontWeight: 500, display: 'block', marginBottom: 5 }}>
        Süreç Sahibi (Pozisyon)
      </label>

      {/* Seçili pozisyon göster */}
      {selected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1.5px solid #0f3460', borderRadius: 7, background: '#eef2ff', marginBottom: 6 }}>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0f3460' }}>{selected.name}</span>
          <button onClick={() => setOpen(true)} style={{ fontSize: 11, color: '#0f3460', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Değiştir</button>
          <button onClick={handleClear} style={{ fontSize: 14, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>×</button>
        </div>
      ) : (
        <div
          style={{ padding: '8px 10px', border: '1.5px dashed #e5e7eb', borderRadius: 7, fontSize: 13, color: '#aaa', cursor: 'pointer', marginBottom: 6 }}
          onClick={() => setOpen(true)}
        >
          — Pozisyon seçmek için tıklayın —
        </div>
      )}

      {/* Arama + Dropdown */}
      {open && (
        <div style={{ position: 'absolute', zIndex: 100, top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          <div style={{ padding: '8px' }}>
            <input
              autoFocus
              style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              placeholder="Ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {sorted.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>Sonuç yok</div>
            )}
            {sorted.map(pos => (
              <div
                key={pos.id}
                style={{ padding: '9px 14px', fontSize: 13, cursor: 'pointer', background: selected?.id === pos.id ? '#eef2ff' : '#fff', color: selected?.id === pos.id ? '#0f3460' : '#333', fontWeight: selected?.id === pos.id ? 600 : 400 }}
                onMouseEnter={e => { if (selected?.id !== pos.id) e.currentTarget.style.background = '#f5f7ff'; }}
                onMouseLeave={e => { if (selected?.id !== pos.id) e.currentTarget.style.background = '#fff'; }}
                onClick={() => handleSelect(pos)}
              >
                {pos.name}
              </div>
            ))}
          </div>
          <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => { setOpen(false); setSearch(''); }} style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>Kapat</button>
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ padding: '7px 18px', background: saving ? '#aaa' : '#0f3460', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 500 }}
      >
        {saving ? 'Kaydediliyor...' : 'Ata'}
      </button>
    </div>
  );
}

export default function ProcessDetail({ process, allProcesses, onUpdate }) {
  const [activeTab, setActiveTab] = useState('Kimlik');
  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState({});
  const [saveErr, setSaveErr]     = useState('');
  const [allPositions, setAllPositions] = useState([]);

  // Sub-resource states
  const [ios, setIos]                   = useState([]);
  const [parties, setParties]           = useState([]);
  const [steps, setSteps]               = useState([]);
  const [risks, setRisks]               = useState([]);
  const [kpis, setKpis]                 = useState([]);
  const [stakeholders, setStakeholders] = useState([]);
  const [draftSteps, setDraftSteps]     = useState([]);

  // New item forms
  const [newInput, setNewInput]         = useState('');
  const [newOutput, setNewOutput]       = useState('');
  const [newSupplier, setNewSupplier]   = useState('');
  const [newCustomer, setNewCustomer]   = useState('');
  const [newInternalSh, setNewInternalSh] = useState('');
  const [newExternalSh, setNewExternalSh] = useState('');
  const [newStep, setNewStep]   = useState({ stepNo: '', name: '', description: '' });
  const [newRisk, setNewRisk]   = useState({ name: '', probability: 'MEDIUM', impact: 'MEDIUM', mitigation: '' });
  const [newKpi, setNewKpi]     = useState({ name: '', definition: '', calculationMethod: '', frequency: 'MONTHLY' });
  const [newDraft, setNewDraft] = useState({ stepNo: '', stepName: '', trigger: '', input: '', workDone: '', output: '', transferredRole: '', responsible: '', notes: '' });

  // Load positions once
  useEffect(() => {
    positionsApi.list().then(r => setAllPositions(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!process) return;
    setForm({
      name: process.name, code: process.code, level: process.level || 'L1',
      processType: process.processType || 'CORE', criticality: process.criticality || 'MEDIUM',
      status: process.status || 'ACTIVE', shortDescription: process.shortDescription || '',
      description: process.description || '',
      isActive: process.isActive,
      purpose: process.purpose || '',
      strategicGoal: process.strategicGoal || '',
      strategicTarget: process.strategicTarget || '',
      startPoint: process.startPoint || '',
      endPoint: process.endPoint || '',
      processScope: process.processScope || '',
      affectedBy: process.affectedBy || '',
      affects: process.affects || '',
    });
    setEditing(false);
    loadSubs(process.id);
  }, [process]);

  const loadSubs = async (id) => {
    try {
      const [iosR, partiesR, stepsR, risksR, kpisR, shR, draftR] = await Promise.all([
        processesApi.listIos(id),
        processesApi.listParties(id),
        processesApi.listSteps(id),
        processesApi.listRisks(id),
        processesApi.listKpis(id),
        processesApi.listStakeholders(id),
        processesApi.listDraftSteps(id),
      ]);
      setIos(iosR.data);
      setParties(partiesR.data);
      setSteps(stepsR.data);
      setRisks(risksR.data);
      setKpis(kpisR.data);
      setStakeholders(shR.data);
      setDraftSteps(draftR.data);
    } catch (e) { /* ignore */ }
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaveErr('');
    try {
      await processesApi.update(process.id, { ...form });
      setEditing(false);
      onUpdate();
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  // Owner position handler — ana formdan bağımsız, direkt kaydeder
  const saveOwnerPosition = async (positionId) => {
    await processesApi.update(process.id, { ownerPositionId: positionId || null });
    onUpdate();
  };

  // IO handlers
  const addIO = async (ioType, name, clear) => {
    if (!name.trim()) return;
    await processesApi.addIo(process.id, { name: name.trim(), ioType });
    clear(''); loadSubs(process.id);
  };
  const deleteIO = async (ioId) => { await processesApi.deleteIo(process.id, ioId); loadSubs(process.id); };

  // Party handlers
  const addParty = async (partyType, name, clear) => {
    if (!name.trim()) return;
    await processesApi.addParty(process.id, { name: name.trim(), partyType });
    clear(''); loadSubs(process.id);
  };
  const deleteParty = async (partyId) => { await processesApi.deleteParty(process.id, partyId); loadSubs(process.id); };

  // Step handlers
  const addStep = async () => {
    if (!newStep.name.trim()) return;
    const nextNo = newStep.stepNo || (steps.length > 0 ? Math.max(...steps.map(s => s.stepNo)) + 1 : 1);
    await processesApi.addStep(process.id, { stepNo: nextNo, name: newStep.name.trim(), description: newStep.description });
    setNewStep({ stepNo: '', name: '', description: '' }); loadSubs(process.id);
  };
  const deleteStep = async (stepId) => { await processesApi.deleteStep(process.id, stepId); loadSubs(process.id); };

  // Risk handlers
  const addRisk = async () => {
    if (!newRisk.name.trim()) return;
    await processesApi.addRisk(process.id, { ...newRisk, name: newRisk.name.trim() });
    setNewRisk({ name: '', probability: 'MEDIUM', impact: 'MEDIUM', mitigation: '' }); loadSubs(process.id);
  };
  const deleteRisk = async (riskId) => { await processesApi.deleteRisk(process.id, riskId); loadSubs(process.id); };

  // KPI handlers
  const addKpi = async () => {
    if (!newKpi.name.trim()) return;
    await processesApi.addKpi(process.id, { ...newKpi, name: newKpi.name.trim() });
    setNewKpi({ name: '', definition: '', calculationMethod: '', frequency: 'MONTHLY' }); loadSubs(process.id);
  };
  const deleteKpi = async (kpiId) => { await processesApi.deleteKpi(process.id, kpiId); loadSubs(process.id); };

  // Stakeholder handlers
  const addStakeholder = async (stakeholderType, name, clear) => {
    if (!name.trim()) return;
    await processesApi.addStakeholder(process.id, { name: name.trim(), stakeholderType });
    clear(''); loadSubs(process.id);
  };
  const deleteStakeholder = async (shId) => { await processesApi.deleteStakeholder(process.id, shId); loadSubs(process.id); };

  // Draft Step handlers
  const addDraftStep = async () => {
    if (!newDraft.stepName.trim()) return;
    await processesApi.addDraftStep(process.id, { ...newDraft });
    setNewDraft({ stepNo: '', stepName: '', trigger: '', input: '', workDone: '', output: '', transferredRole: '', responsible: '', notes: '' });
    loadSubs(process.id);
  };
  const deleteDraftStep = async (sid) => { await processesApi.deleteDraftStep(process.id, sid); loadSubs(process.id); };
  const handleDraftImport = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData(); formData.append('file', file);
    try { await processesApi.importDraftSteps(process.id, formData); loadSubs(process.id); }
    catch (err) { alert(err.response?.data?.error || 'Import sırasında hata oluştu'); }
    e.target.value = '';
  };
  const downloadDraftTemplate = async () => {
    try {
      const res = await processesApi.draftStepTemplate(process.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'taslak-adimlar-sablon.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { /* ignore */ }
  };

  // Excel handlers
  const handleExportCard = async () => {
    try {
      const res = await processesApi.exportCard(process.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `${process.code}-kimlik-karti.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { /* ignore */ }
  };
  const handleTemplateCard = async () => {
    try {
      const res = await processesApi.templateCard();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'surec-kimlik-karti-sablonu.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { /* ignore */ }
  };
  const handleImportCard = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData(); formData.append('file', file);
    try { await processesApi.importCard(formData); loadSubs(process.id); onUpdate(); }
    catch (err) { alert(err.response?.data?.message || 'Import sırasında hata oluştu'); }
    e.target.value = '';
  };

  if (!process) {
    return (
      <div style={s.empty}>
        <div style={{ fontSize: 48, opacity: 0.4 }}>⚙</div>
        <div style={{ fontSize: 14, textAlign: 'center', maxWidth: 240 }}>Detayları görüntülemek için sol taraftan bir süreç seçin</div>
      </div>
    );
  }

  const ownerPositionName = process.ownerPositionName || '';

  return (
    <div style={s.container}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <div style={s.headerCode}>{process.code}</div>
          <div style={s.headerName}>{process.name}</div>
          {ownerPositionName && !editing && (
            <div style={s.ownerBadge}>Sahibi: {ownerPositionName}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {!editing && (
            <>
              <button style={s.excelBtn} onClick={handleExportCard}>Kimlik Kartı</button>
              <button style={s.excelBtn} onClick={handleTemplateCard}>Sablon</button>
              <label style={s.excelBtn}>
                Excel Yukle
                <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportCard} />
              </label>
              <button style={s.editBtn} onClick={() => setEditing(true)}>Duzenle</button>
            </>
          )}
          {editing && (
            <>
              <button type="button" style={s.cancelBtn} onClick={() => setEditing(false)}>Iptal</button>
              <button type="button" style={s.saveBtn} onClick={handleSave}>Kaydet</button>
            </>
          )}
        </div>
      </div>

      {/* ── Sekme Çubuğu ── */}
      <div style={s.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab}
            style={{ ...s.tabBtn, ...(activeTab === tab ? s.tabBtnActive : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Sekme İçerikleri ── */}
      <div style={s.tabBody}>

        {/* ══════════ KİMLİK ══════════ */}
        {activeTab === 'Kimlik' && (
          editing ? (
            <form onSubmit={handleSave} style={s.editForm}>
              <div style={s.row2}>
                <div style={s.field}><label style={s.label}>Ad *</label>
                  <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div style={s.field}><label style={s.label}>Kod *</label>
                  <input style={s.input} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required /></div>
              </div>
              <div style={s.row3}>
                <div style={s.field}><label style={s.label}>Seviye</label>
                  <select style={s.input} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                    {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div style={s.field}><label style={s.label}>Tür</label>
                  <select style={s.input} value={form.processType} onChange={e => setForm({ ...form, processType: e.target.value })}>
                    {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div style={s.field}><label style={s.label}>Kritiklik</label>
                  <select style={s.input} value={form.criticality} onChange={e => setForm({ ...form, criticality: e.target.value })}>
                    {Object.entries(CRITICALITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
              </div>
              <div style={s.row2}>
                <div style={s.field}><label style={s.label}>Durum</label>
                  <select style={s.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="ACTIVE">Aktif</option>
                    <option value="PASSIVE">Pasif</option>
                  </select></div>
                <div style={s.field}>
                  <PositionPicker
                    allPositions={allPositions}
                    currentId={process.ownerPositionId}
                    currentName={process.ownerPositionName}
                    onSave={saveOwnerPosition}
                  />
                </div>
              </div>
              <div style={s.field}><label style={s.label}>Kısa Açıklama</label>
                <textarea style={{ ...s.input, height: 55, resize: 'vertical' }}
                  value={form.shortDescription} onChange={e => setForm({ ...form, shortDescription: e.target.value })} /></div>
              <div style={s.field}><label style={s.label}>Notlar / Açıklama</label>
                <textarea style={{ ...s.input, height: 80, resize: 'vertical' }}
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>

              <div style={s.groupTitle}>Stratejik Bağlantı</div>
              <div style={s.row2}>
                <div style={s.field}><label style={s.label}>Stratejik Amaç</label>
                  <textarea style={{ ...s.input, height: 65, resize: 'vertical' }}
                    value={form.strategicGoal} onChange={e => setForm({ ...form, strategicGoal: e.target.value })} /></div>
                <div style={s.field}><label style={s.label}>Stratejik Hedef</label>
                  <textarea style={{ ...s.input, height: 65, resize: 'vertical' }}
                    value={form.strategicTarget} onChange={e => setForm({ ...form, strategicTarget: e.target.value })} /></div>
              </div>

              <div style={s.groupTitle}>Kapsam ve Sınırlar</div>
              <div style={s.field}><label style={s.label}>Sürecin Amacı</label>
                <textarea style={{ ...s.input, height: 70, resize: 'vertical' }}
                  value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} /></div>
              <div style={s.row2}>
                <div style={s.field}><label style={s.label}>Başlangıç Noktası</label>
                  <input style={s.input} value={form.startPoint} onChange={e => setForm({ ...form, startPoint: e.target.value })} /></div>
                <div style={s.field}><label style={s.label}>Bitiş Noktası</label>
                  <input style={s.input} value={form.endPoint} onChange={e => setForm({ ...form, endPoint: e.target.value })} /></div>
              </div>
              <div style={s.field}><label style={s.label}>Kapsam</label>
                <textarea style={{ ...s.input, height: 65, resize: 'vertical' }}
                  value={form.processScope} onChange={e => setForm({ ...form, processScope: e.target.value })} /></div>
              <div style={s.row2}>
                <div style={s.field}><label style={s.label}>Etkilendiği Süreçler</label>
                  <textarea style={{ ...s.input, height: 65, resize: 'vertical' }}
                    value={form.affectedBy} onChange={e => setForm({ ...form, affectedBy: e.target.value })} /></div>
                <div style={s.field}><label style={s.label}>Etkilediği Süreçler</label>
                  <textarea style={{ ...s.input, height: 65, resize: 'vertical' }}
                    value={form.affects} onChange={e => setForm({ ...form, affects: e.target.value })} /></div>
              </div>
              {saveErr && <div style={s.errBox}>{saveErr}</div>}
              <div style={s.editActions}>
                <button type="button" style={s.cancelBtn} onClick={() => setEditing(false)}>İptal</button>
                <button type="submit" style={s.saveBtn}>Kaydet</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Temel Bilgiler */}
              <div style={s.infoGrid}>
                <InfoRow label="Seviye"      value={LEVELS[process.level] || process.level} />
                <InfoRow label="Tür"         value={TYPES[process.processType] || process.processType} />
                <InfoRow label="Kritiklik"   value={<Badge value={process.criticality} colorMap={{ HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#16a34a' }} labelMap={CRITICALITIES} />} />
                <InfoRow label="Durum"       value={<span style={{ color: process.isActive ? '#16a34a' : '#dc2626', fontWeight: 500 }}>{process.isActive ? 'Aktif' : 'Pasif'}</span>} />
                <InfoRow label="Üst Süreç"   value={process.parentName || '—'} />
                <InfoRow label="Süreç Sahibi" value={ownerPositionName || '—'} />
              </div>
              {process.shortDescription && <InfoRow label="Kısa Açıklama" value={process.shortDescription} />}
              {process.description && (
                <div>
                  <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notlar / Açıklama</span>
                  <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: 4 }}>{process.description}</p>
                </div>
              )}

              {/* Stratejik Bağlantı */}
              {(process.strategicGoal || process.strategicTarget) && (
                <div>
                  <div style={s.groupTitleView}>Stratejik Bağlantı</div>
                  <div style={s.infoGrid}>
                    {process.strategicGoal && <div style={{ gridColumn: '1 / -1' }}><InfoRow label="Stratejik Amaç" value={process.strategicGoal} /></div>}
                    {process.strategicTarget && <div style={{ gridColumn: '1 / -1' }}><InfoRow label="Stratejik Hedef" value={process.strategicTarget} /></div>}
                  </div>
                </div>
              )}

              {/* Kapsam ve Sınırlar */}
              {(process.purpose || process.startPoint || process.endPoint || process.processScope || process.affectedBy || process.affects) && (
                <div>
                  <div style={s.groupTitleView}>Kapsam ve Sınırlar</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {process.purpose && <InfoRow label="Sürecin Amacı" value={process.purpose} />}
                    {(process.startPoint || process.endPoint) && (
                      <div style={s.infoGrid}>
                        {process.startPoint && <InfoRow label="Başlangıç Noktası" value={process.startPoint} />}
                        {process.endPoint && <InfoRow label="Bitiş Noktası" value={process.endPoint} />}
                      </div>
                    )}
                    {process.processScope && <InfoRow label="Kapsam" value={process.processScope} />}
                    {(process.affectedBy || process.affects) && (
                      <div style={s.infoGrid}>
                        {process.affectedBy && <InfoRow label="Etkilendiği Süreçler" value={process.affectedBy} />}
                        {process.affects && <InfoRow label="Etkilediği Süreçler" value={process.affects} />}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* ══════════ SIPOC ══════════ */}
        {activeTab === 'SIPOC' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* SIPOC Grid */}
            <div style={s.sipocGrid}>
              {/* Sol: I + S */}
              <div style={s.sipocSideCol}>
                <div style={s.sipocHalf}>
                  <div style={{ ...s.sipocHead, background: '#dbeafe', color: '#1d4ed8' }}><span style={s.sipocLetter}>I</span> Girdiler</div>
                  <div style={s.sipocBody}>
                    {ios.filter(i => i.ioType === 'INPUT').length === 0 && <div style={s.sipocEmpty}>Henüz eklenmedi</div>}
                    {ios.filter(i => i.ioType === 'INPUT').map(io => (
                      <div key={io.id} style={{ ...s.sipocItem, borderLeft: '3px solid #3b82f6' }}>
                        <span style={s.sipocArrow}>→</span>
                        <span style={s.sipocItemText}>{io.name}</span>
                        <button style={s.xBtn} onClick={() => deleteIO(io.id)}>×</button>
                      </div>
                    ))}
                    <div style={s.sipocAddRow}>
                      <input style={s.sipocInput} placeholder="Ekle..." value={newInput} onChange={e => setNewInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIO('INPUT', newInput, setNewInput)} />
                      <button style={{ ...s.sipocAddBtn, background: '#1d4ed8' }} onClick={() => addIO('INPUT', newInput, setNewInput)}>+</button>
                    </div>
                  </div>
                </div>
                <div style={{ ...s.sipocHalf, borderTop: '2px solid #e5e7eb' }}>
                  <div style={{ ...s.sipocHead, background: '#e0f2fe', color: '#0369a1' }}><span style={s.sipocLetter}>S</span> Tedarikçiler</div>
                  <div style={s.sipocBody}>
                    {parties.filter(p => p.partyType === 'SUPPLIER').length === 0 && <div style={s.sipocEmpty}>Henüz eklenmedi</div>}
                    {parties.filter(p => p.partyType === 'SUPPLIER').map(p => (
                      <div key={p.id} style={{ ...s.sipocItem, borderLeft: '3px solid #0ea5e9' }}>
                        <span style={s.sipocItemText}>{p.name}</span>
                        <button style={s.xBtn} onClick={() => deleteParty(p.id)}>×</button>
                      </div>
                    ))}
                    <div style={s.sipocAddRow}>
                      <input style={s.sipocInput} placeholder="Ekle..." value={newSupplier} onChange={e => setNewSupplier(e.target.value)} onKeyDown={e => e.key === 'Enter' && addParty('SUPPLIER', newSupplier, setNewSupplier)} />
                      <button style={{ ...s.sipocAddBtn, background: '#0369a1' }} onClick={() => addParty('SUPPLIER', newSupplier, setNewSupplier)}>+</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orta: P */}
              <div style={s.sipocProcess}>
                <div style={s.sipocProcessInner}>
                  <div style={s.sipocProcessLabel}>P</div>
                  <div style={s.sipocProcessName}>{process.name}</div>
                  <div style={s.sipocProcessCode}>{process.code}</div>
                  {process.level && <div style={s.sipocProcessLevel}>{process.level}</div>}
                </div>
              </div>

              {/* Sağ: O + C */}
              <div style={s.sipocSideCol}>
                <div style={s.sipocHalf}>
                  <div style={{ ...s.sipocHead, background: '#dcfce7', color: '#15803d' }}><span style={s.sipocLetter}>O</span> Çıktılar</div>
                  <div style={s.sipocBody}>
                    {ios.filter(i => i.ioType === 'OUTPUT').length === 0 && <div style={s.sipocEmpty}>Henüz eklenmedi</div>}
                    {ios.filter(i => i.ioType === 'OUTPUT').map(io => (
                      <div key={io.id} style={{ ...s.sipocItem, borderLeft: '3px solid #22c55e' }}>
                        <span style={s.sipocArrow}>→</span>
                        <span style={s.sipocItemText}>{io.name}</span>
                        <button style={s.xBtn} onClick={() => deleteIO(io.id)}>×</button>
                      </div>
                    ))}
                    <div style={s.sipocAddRow}>
                      <input style={s.sipocInput} placeholder="Ekle..." value={newOutput} onChange={e => setNewOutput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIO('OUTPUT', newOutput, setNewOutput)} />
                      <button style={{ ...s.sipocAddBtn, background: '#15803d' }} onClick={() => addIO('OUTPUT', newOutput, setNewOutput)}>+</button>
                    </div>
                  </div>
                </div>
                <div style={{ ...s.sipocHalf, borderTop: '2px solid #e5e7eb' }}>
                  <div style={{ ...s.sipocHead, background: '#f3e8ff', color: '#7c3aed' }}><span style={s.sipocLetter}>C</span> Müşteriler</div>
                  <div style={s.sipocBody}>
                    {parties.filter(p => p.partyType === 'CUSTOMER').length === 0 && <div style={s.sipocEmpty}>Henüz eklenmedi</div>}
                    {parties.filter(p => p.partyType === 'CUSTOMER').map(p => (
                      <div key={p.id} style={{ ...s.sipocItem, borderLeft: '3px solid #a855f7' }}>
                        <span style={s.sipocItemText}>{p.name}</span>
                        <button style={s.xBtn} onClick={() => deleteParty(p.id)}>×</button>
                      </div>
                    ))}
                    <div style={s.sipocAddRow}>
                      <input style={s.sipocInput} placeholder="Ekle..." value={newCustomer} onChange={e => setNewCustomer(e.target.value)} onKeyDown={e => e.key === 'Enter' && addParty('CUSTOMER', newCustomer, setNewCustomer)} />
                      <button style={{ ...s.sipocAddBtn, background: '#7c3aed' }} onClick={() => addParty('CUSTOMER', newCustomer, setNewCustomer)}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Paydaşlar */}
            <div>
              <div style={s.groupTitleView}>Paydaşlar</div>
              <div style={s.twoCol}>
                <div>
                  <div style={s.colTitle}>İç Paydaşlar</div>
                  {stakeholders.filter(sh => sh.stakeholderType === 'INTERNAL').map(sh => (
                    <div key={sh.id} style={s.listItem}>
                      <span style={s.listItemText}>{sh.name}</span>
                      <button style={s.xBtn} onClick={() => deleteStakeholder(sh.id)}>×</button>
                    </div>
                  ))}
                  {stakeholders.filter(sh => sh.stakeholderType === 'INTERNAL').length === 0 && (
                    <div style={{ fontSize: 12, color: '#ccc', fontStyle: 'italic', marginBottom: 8 }}>Henüz eklenmedi</div>
                  )}
                  <div style={s.addRow}>
                    <input style={s.addInput} placeholder="İç paydaş ekle..." value={newInternalSh} onChange={e => setNewInternalSh(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStakeholder('INTERNAL', newInternalSh, setNewInternalSh)} />
                    <button style={s.addBtn} onClick={() => addStakeholder('INTERNAL', newInternalSh, setNewInternalSh)}>+</button>
                  </div>
                </div>
                <div>
                  <div style={s.colTitle}>Dış Paydaşlar</div>
                  {stakeholders.filter(sh => sh.stakeholderType === 'EXTERNAL').map(sh => (
                    <div key={sh.id} style={s.listItem}>
                      <span style={s.listItemText}>{sh.name}</span>
                      <button style={s.xBtn} onClick={() => deleteStakeholder(sh.id)}>×</button>
                    </div>
                  ))}
                  {stakeholders.filter(sh => sh.stakeholderType === 'EXTERNAL').length === 0 && (
                    <div style={{ fontSize: 12, color: '#ccc', fontStyle: 'italic', marginBottom: 8 }}>Henüz eklenmedi</div>
                  )}
                  <div style={s.addRow}>
                    <input style={s.addInput} placeholder="Dış paydaş ekle..." value={newExternalSh} onChange={e => setNewExternalSh(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStakeholder('EXTERNAL', newExternalSh, setNewExternalSh)} />
                    <button style={s.addBtn} onClick={() => addStakeholder('EXTERNAL', newExternalSh, setNewExternalSh)}>+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ ADIMLAR ══════════ */}
        {activeTab === 'Adımlar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Süreç Adımları */}
            <div>
              <div style={s.groupTitleView}>Süreç Adımları</div>
              {steps.length > 0 && (
                <table style={s.table}>
                  <thead>
                    <tr>{['No', 'Ad', 'Açıklama', ''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {steps.map(step => (
                      <tr key={step.id}>
                        <td style={{ ...s.td, width: 50, color: '#888' }}>{step.stepNo}</td>
                        <td style={s.td}>{step.name}</td>
                        <td style={{ ...s.td, color: '#666' }}>{step.description}</td>
                        <td style={{ ...s.td, width: 40, textAlign: 'center' }}>
                          <button style={s.xBtn} onClick={() => deleteStep(step.id)}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ ...s.addRow, flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <input style={{ ...s.addInput, width: 60 }} placeholder="No" type="number" value={newStep.stepNo} onChange={e => setNewStep({ ...newStep, stepNo: e.target.value })} />
                <input style={{ ...s.addInput, flex: 1, minWidth: 140 }} placeholder="Ad *" value={newStep.name} onChange={e => setNewStep({ ...newStep, name: e.target.value })} />
                <input style={{ ...s.addInput, flex: 2, minWidth: 180 }} placeholder="Açıklama" value={newStep.description} onChange={e => setNewStep({ ...newStep, description: e.target.value })} />
                <button style={s.addBtn} onClick={addStep}>+ Adım</button>
              </div>
            </div>

            {/* Taslak Adımlar */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={s.groupTitleView}>Taslak Adımlar</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={s.excelBtn} onClick={downloadDraftTemplate}>Sablon Indir</button>
                  <label style={s.excelBtn}>
                    Excel Yukle
                    <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleDraftImport} />
                  </label>
                </div>
              </div>
              {draftSteps.length > 0 && (
                <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                  <table style={{ ...s.table, minWidth: 900 }}>
                    <thead>
                      <tr>{['No', 'Adım Adı', 'Tetikleyici', 'Girdi', 'Yapılan İş', 'Çıktı', 'Devredilen Rol', 'Sorumlu', 'Açıklama', ''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {draftSteps.map(ds => (
                        <tr key={ds.id}>
                          <td style={{ ...s.td, width: 40, textAlign: 'center', fontWeight: 600, color: '#0f3460' }}>{ds.stepNo}</td>
                          <td style={{ ...s.td, fontWeight: 500 }}>{ds.stepName}</td>
                          <td style={{ ...s.td, color: '#555' }}>{ds.trigger}</td>
                          <td style={{ ...s.td, color: '#555' }}>{ds.input}</td>
                          <td style={{ ...s.td, color: '#555' }}>{ds.workDone}</td>
                          <td style={{ ...s.td, color: '#555' }}>{ds.output}</td>
                          <td style={{ ...s.td, color: '#555' }}>{ds.transferredRole}</td>
                          <td style={{ ...s.td, color: '#555' }}>{ds.responsible}</td>
                          <td style={{ ...s.td, color: '#555', maxWidth: 180 }}>{ds.notes}</td>
                          <td style={{ ...s.td, width: 40, textAlign: 'center' }}>
                            <button style={s.xBtn} onClick={() => deleteDraftStep(ds.id)}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <input style={{ ...s.addInput, width: 50 }} placeholder="No" type="number" value={newDraft.stepNo} onChange={e => setNewDraft({ ...newDraft, stepNo: e.target.value })} />
                <input style={{ ...s.addInput, flex: 2, minWidth: 120 }} placeholder="Adım Adı *" value={newDraft.stepName} onChange={e => setNewDraft({ ...newDraft, stepName: e.target.value })} />
                <input style={{ ...s.addInput, flex: 2, minWidth: 90 }} placeholder="Tetikleyici" value={newDraft.trigger} onChange={e => setNewDraft({ ...newDraft, trigger: e.target.value })} />
                <input style={{ ...s.addInput, flex: 2, minWidth: 90 }} placeholder="Girdi" value={newDraft.input} onChange={e => setNewDraft({ ...newDraft, input: e.target.value })} />
                <input style={{ ...s.addInput, flex: 2, minWidth: 90 }} placeholder="Yapılan İş" value={newDraft.workDone} onChange={e => setNewDraft({ ...newDraft, workDone: e.target.value })} />
                <input style={{ ...s.addInput, flex: 2, minWidth: 90 }} placeholder="Çıktı" value={newDraft.output} onChange={e => setNewDraft({ ...newDraft, output: e.target.value })} />
                <input style={{ ...s.addInput, flex: 2, minWidth: 90 }} placeholder="Devredilen Rol" value={newDraft.transferredRole} onChange={e => setNewDraft({ ...newDraft, transferredRole: e.target.value })} />
                <input style={{ ...s.addInput, flex: 2, minWidth: 90 }} placeholder="Sorumlu" value={newDraft.responsible} onChange={e => setNewDraft({ ...newDraft, responsible: e.target.value })} />
                <input style={{ ...s.addInput, flex: 3, minWidth: 120 }} placeholder="Açıklama" value={newDraft.notes} onChange={e => setNewDraft({ ...newDraft, notes: e.target.value })} />
                <button style={s.addBtn} onClick={addDraftStep}>+ Ekle</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ RİSKLER ══════════ */}
        {activeTab === 'Riskler' && (
          <div>
            {risks.length > 0 && (
              <table style={s.table}>
                <thead>
                  <tr>{['Ad', 'Olasılık', 'Etki', 'Önlem', ''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {risks.map(risk => (
                    <tr key={risk.id}>
                      <td style={s.td}>{risk.name}</td>
                      <td style={s.td}><Badge value={risk.probability} colorMap={RISK_COLORS} labelMap={RISK_LEVELS} /></td>
                      <td style={s.td}><Badge value={risk.impact} colorMap={RISK_COLORS} labelMap={RISK_LEVELS} /></td>
                      <td style={{ ...s.td, color: '#666', maxWidth: 200 }}>{risk.mitigation}</td>
                      <td style={{ ...s.td, width: 40, textAlign: 'center' }}>
                        <button style={s.xBtn} onClick={() => deleteRisk(risk.id)}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <div style={s.addRow}>
                <input style={{ ...s.addInput, flex: 1 }} placeholder="Risk adı *" value={newRisk.name} onChange={e => setNewRisk({ ...newRisk, name: e.target.value })} />
                <select style={s.addInput} value={newRisk.probability} onChange={e => setNewRisk({ ...newRisk, probability: e.target.value })}>
                  {Object.entries(RISK_LEVELS).map(([k, v]) => <option key={k} value={k}>{v} Olasılık</option>)}
                </select>
                <select style={s.addInput} value={newRisk.impact} onChange={e => setNewRisk({ ...newRisk, impact: e.target.value })}>
                  {Object.entries(RISK_LEVELS).map(([k, v]) => <option key={k} value={k}>{v} Etki</option>)}
                </select>
              </div>
              <div style={s.addRow}>
                <textarea style={{ ...s.addInput, flex: 1, height: 52, resize: 'vertical' }}
                  placeholder="Mevcut önlem (opsiyonel)" value={newRisk.mitigation} onChange={e => setNewRisk({ ...newRisk, mitigation: e.target.value })} />
                <button style={{ ...s.addBtn, alignSelf: 'flex-start' }} onClick={addRisk}>+ Risk</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ KPI ══════════ */}
        {activeTab === 'KPI' && (
          <div>
            {kpis.length > 0 && (
              <table style={s.table}>
                <thead>
                  <tr>{['Performans Göstergesi', 'Açıklama', 'Ölçüm Yöntemi', 'Periyot', ''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {kpis.map(kpi => (
                    <tr key={kpi.id}>
                      <td style={{ ...s.td, fontWeight: 500 }}>{kpi.name}</td>
                      <td style={{ ...s.td, color: '#555' }}>{kpi.definition}</td>
                      <td style={{ ...s.td, color: '#555' }}>{kpi.calculationMethod}</td>
                      <td style={s.td}>
                        {kpi.frequency ? (
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                            {FREQUENCIES[kpi.frequency] || kpi.frequency}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ ...s.td, width: 40, textAlign: 'center' }}>
                        <button style={s.xBtn} onClick={() => deleteKpi(kpi.id)}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ ...s.addRow, flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <input style={{ ...s.addInput, flex: 2, minWidth: 160 }} placeholder="Gösterge adı *" value={newKpi.name} onChange={e => setNewKpi({ ...newKpi, name: e.target.value })} />
              <input style={{ ...s.addInput, flex: 2, minWidth: 140 }} placeholder="Gösterge açıklaması" value={newKpi.definition} onChange={e => setNewKpi({ ...newKpi, definition: e.target.value })} />
              <input style={{ ...s.addInput, flex: 2, minWidth: 140 }} placeholder="Ölçüm yöntemi" value={newKpi.calculationMethod} onChange={e => setNewKpi({ ...newKpi, calculationMethod: e.target.value })} />
              <select style={{ ...s.addInput, minWidth: 120 }} value={newKpi.frequency} onChange={e => setNewKpi({ ...newKpi, frequency: e.target.value })}>
                {Object.entries(FREQUENCIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button style={s.addBtn} onClick={addKpi}>+ KPI</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const s = {
  container:    { display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' },
  empty:        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb', gap: 12 },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px 14px', borderBottom: '1px solid #f0f0f0', background: '#fff', position: 'sticky', top: 0, zIndex: 2 },
  headerCode:   { fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 2 },
  headerName:   { fontSize: 17, fontWeight: 700, color: '#1a1a2e' },
  ownerBadge:   { fontSize: 12, color: '#0f3460', fontWeight: 500, marginTop: 4, background: '#eef2ff', display: 'inline-block', padding: '2px 9px', borderRadius: 8 },
  editBtn:      { padding: '7px 18px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' },
  excelBtn:     { padding: '6px 14px', background: '#166534', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' },
  cancelBtn:    { padding: '8px 18px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 7, cursor: 'pointer', fontSize: 13 },
  saveBtn:      { padding: '8px 22px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 500 },

  tabBar:       { display: 'flex', borderBottom: '2px solid #f0f0f0', background: '#fafafa', position: 'sticky', top: 68, zIndex: 1 },
  tabBtn:       { padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#888', borderBottom: '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap', transition: 'color 0.15s' },
  tabBtnActive: { color: '#0f3460', borderBottomColor: '#0f3460', background: '#fff' },

  tabBody:      { padding: '20px', flex: 1 },

  editForm:     { display: 'flex', flexDirection: 'column', gap: 12 },
  row2:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  row3:         { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  field:        { display: 'flex', flexDirection: 'column', gap: 5 },
  label:        { fontSize: 12, color: '#666', fontWeight: 500 },
  input:        { padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff' },
  errBox:       { padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', fontSize: 12 },
  editActions:  { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 },

  groupTitle:     { fontSize: 12, fontWeight: 700, color: '#0f3460', textTransform: 'uppercase', letterSpacing: '0.07em', paddingTop: 8, borderTop: '1px solid #f0f0f0', marginTop: 4 },
  groupTitleView: { fontSize: 12, fontWeight: 700, color: '#0f3460', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' },

  infoGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px 20px' },

  sipocGrid:    { display: 'grid', gridTemplateColumns: '1fr 110px 1fr', gap: 0, border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' },
  sipocSideCol: { display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb' },
  sipocHalf:    { display: 'flex', flexDirection: 'column', flex: 1 },
  sipocProcess: { display: 'flex', alignItems: 'stretch', borderRight: '1px solid #e5e7eb', background: '#1a1a2e' },
  sipocProcessInner: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 8px', gap: 6, flex: 1 },
  sipocProcessLabel: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 },
  sipocProcessName:  { fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.4 },
  sipocProcessCode:  { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', textAlign: 'center' },
  sipocProcessLevel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', padding: '1px 8px', borderRadius: 8, marginTop: 2 },
  sipocHead:    { padding: '8px 10px', fontWeight: 700, fontSize: 12, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, borderBottom: '1px solid #e5e7eb' },
  sipocLetter:  { fontSize: 16, fontWeight: 900 },
  sipocBody:    { padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  sipocItem:    { display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', background: '#fff', borderRadius: 6, fontSize: 12 },
  sipocItemText:{ flex: 1, color: '#333', lineHeight: 1.3, wordBreak: 'break-word' },
  sipocArrow:   { color: '#aaa', fontSize: 11, flexShrink: 0 },
  sipocEmpty:   { fontSize: 11, color: '#ccc', fontStyle: 'italic', padding: '4px 0' },
  sipocAddRow:  { display: 'flex', gap: 4, marginTop: 6 },
  sipocInput:   { flex: 1, padding: '5px 8px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 12, outline: 'none', minWidth: 0 },
  sipocAddBtn:  { padding: '5px 10px', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 700, flexShrink: 0 },

  twoCol:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  colTitle:     { fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  listItem:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f8f9fa', borderRadius: 6, marginBottom: 5 },
  listItemText: { fontSize: 13, color: '#333' },

  xBtn:    { background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16, lineHeight: 1, padding: '0 2px' },
  addRow:  { display: 'flex', alignItems: 'center', gap: 6 },
  addInput:{ padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none', flex: 1 },
  addBtn:  { padding: '7px 14px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' },

  table:   { width: '100%', borderCollapse: 'collapse', marginBottom: 4 },
  th:      { textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 600, padding: '6px 8px', borderBottom: '1px solid #f0f0f0' },
  td:      { padding: '8px 8px', fontSize: 13, color: '#333', borderBottom: '1px solid #f8f9fa' },
};

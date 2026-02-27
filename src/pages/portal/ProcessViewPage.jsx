import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { processesApi } from '../../api/processes';

const LEVELS        = { L1: 'Seviye 1', L2: 'Seviye 2', L3: 'Seviye 3' };
const TYPES         = { CORE: 'Temel', SUPPORT: 'Destek', MANAGEMENT: 'Yönetim' };
const CRITICALITIES = { HIGH: 'Yüksek', MEDIUM: 'Orta', LOW: 'Düşük' };
const CRIT_COLORS   = { HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#16a34a' };
const RISK_LEVELS   = { HIGH: 'Yüksek', MEDIUM: 'Orta', LOW: 'Düşük' };
const RISK_COLORS   = { HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#16a34a' };
const FREQUENCIES   = { MONTHLY: 'Aylık', QUARTERLY: 'Çeyreklik', YEARLY: 'Yıllık' };
const LEVEL_BORDER  = { L1: '#0f3460', L2: '#0d9488', L3: '#94a3b8' };

function buildAncestors(proc, allById) {
  const ancestors = [];
  let cur = allById[proc?.parentId];
  while (cur) { ancestors.unshift(cur); cur = allById[cur.parentId]; }
  return ancestors;
}

// ─── Yardımcı bileşenler ──────────────────────────────────────────

function Badge({ color, children }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color,
      background: color + '18', border: `1px solid ${color}35`,
      padding: '2px 10px', borderRadius: 12, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

function SectionBlock({ title, icon, count, onEdit, children, accent }) {
  const borderColor = accent || '#0f3460';
  return (
    <div style={{ ...s.section, borderTop: `3px solid ${borderColor}` }}>
      <div style={s.sectionHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
          <span style={{ ...s.sectionTitle, color: borderColor }}>{title}</span>
          {count !== undefined && count > 0 && (
            <span style={{ ...s.countBadge, background: borderColor }}>{count}</span>
          )}
        </div>
        <button style={{ ...s.editBtn, color: borderColor, borderColor: borderColor + '40' }} onClick={onEdit}>
          Düzenle ↗
        </button>
      </div>
      <div style={s.sectionBody}>{children}</div>
    </div>
  );
}

function Field({ label, value, wide }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
      <div style={s.fieldLabel}>{label}</div>
      <div style={s.fieldValue}>{value}</div>
    </div>
  );
}

function LongField({ label, text }) {
  if (!text) return null;
  return (
    <div>
      <div style={s.fieldLabel}>{label}</div>
      <div style={s.longText}>{text}</div>
    </div>
  );
}

function SipocCol({ title, items, accent }) {
  return (
    <div style={{ ...s.sipocCol, borderTop: `3px solid ${accent}` }}>
      <div style={{ ...s.sipocColTitle, color: accent }}>{title}</div>
      {items.length === 0
        ? <div style={s.sipocEmpty}>—</div>
        : items.map((item, i) => <div key={i} style={s.sipocItem}>{item}</div>)
      }
    </div>
  );
}

function SipocProcessCol({ name, accent }) {
  return (
    <div style={{ ...s.sipocCol, borderTop: `3px solid ${accent}`, background: accent + '08' }}>
      <div style={{ ...s.sipocColTitle, color: accent }}>Süreç</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: accent, padding: '6px 0', lineHeight: 1.4 }}>{name}</div>
    </div>
  );
}

// ─── Ana bileşen ──────────────────────────────────────────────────

export default function ProcessViewPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [process,      setProcess]      = useState(null);
  const [allData,      setAllData]      = useState([]);
  const [ios,          setIos]          = useState([]);
  const [parties,      setParties]      = useState([]);
  const [steps,        setSteps]        = useState([]);
  const [risks,        setRisks]        = useState([]);
  const [kpis,         setKpis]         = useState([]);
  const [stakeholders, setStakeholders] = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      processesApi.get(id),
      processesApi.list(),
      processesApi.listIos(id),
      processesApi.listParties(id),
      processesApi.listSteps(id),
      processesApi.listRisks(id),
      processesApi.listKpis(id),
      processesApi.listStakeholders(id),
    ])
      .then(([procR, allR, iosR, partiesR, stepsR, risksR, kpisR, shR]) => {
        setProcess(procR.data);
        setAllData(allR.data);
        setIos(iosR.data);
        setParties(partiesR.data);
        setSteps(stepsR.data);
        setRisks(risksR.data);
        setKpis(kpisR.data);
        setStakeholders(shR.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const byId      = useMemo(() => { const m = {}; allData.forEach(p => { m[p.id] = p; }); return m; }, [allData]);
  const ancestors = useMemo(() => process ? buildAncestors(process, byId) : [], [process, byId]);
  const children  = useMemo(() => process ? allData.filter(p => p.parentId === process.id) : [], [process, allData]);

  const goEdit = () => navigate(`/processes/${id}`);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#aaa', fontSize: 15 }}>
      Yükleniyor...
    </div>
  );

  if (!process) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ fontSize: 48, opacity: 0.2 }}>⚙</div>
      <div style={{ fontSize: 16, color: '#888' }}>Süreç bulunamadı</div>
      <button style={s.backBtn} onClick={() => navigate('/portal')}>← Süreç Haritasına Dön</button>
    </div>
  );

  const borderColor = LEVEL_BORDER[process.level] || '#94a3b8';

  // SIPOC — doğru alan adları
  const inputs    = ios.filter(io => io.ioType === 'INPUT');
  const outputs   = ios.filter(io => io.ioType === 'OUTPUT');
  const suppliers = parties.filter(p => p.partyType === 'SUPPLIER');
  const customers = parties.filter(p => p.partyType === 'CUSTOMER');

  // Paydaşlar — doğru alan adı
  const internalSH = stakeholders.filter(sh => sh.stakeholderType === 'INTERNAL');
  const externalSH = stakeholders.filter(sh => sh.stakeholderType === 'EXTERNAL');

  // Adımlar — stepNo ile sırala
  const sortedSteps = [...steps].sort((a, b) => (a.stepNo || 0) - (b.stepNo || 0));

  const sipocCount = ios.length + parties.length;

  // Sorumlu roller
  const ownerRoles = process.ownerRoleNames?.filter(Boolean) || [];
  const ownerRole  = process.ownerRoleName || '';

  return (
    <div style={s.page}>

      {/* ── Breadcrumb ── */}
      <nav style={s.breadcrumb}>
        <button style={s.bcBtn} onClick={() => navigate('/portal')}>Süreç Haritası</button>
        {ancestors.map(anc => (
          <span key={anc.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={s.bcSep}>›</span>
            <button style={s.bcBtn} onClick={() => navigate(`/portal/${anc.id}`)}>{anc.name}</button>
          </span>
        ))}
        <span style={s.bcSep}>›</span>
        <span style={s.bcCurrent}>{process.name}</span>
      </nav>

      {/* ── Header Kartı ── */}
      <div style={{ ...s.headerCard, borderLeft: `6px solid ${borderColor}` }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          <Badge color={borderColor}>{LEVELS[process.level] || process.level}</Badge>
          {process.processType  && <Badge color="#6d28d9">{TYPES[process.processType] || process.processType}</Badge>}
          {process.criticality  && <Badge color={CRIT_COLORS[process.criticality]}>{CRITICALITIES[process.criticality] || process.criticality}</Badge>}
          <Badge color={process.isActive ? '#16a34a' : '#dc2626'}>{process.isActive ? 'Aktif' : 'Pasif'}</Badge>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h1 style={s.title}>{process.name}</h1>
            <div style={s.code}>{process.code}</div>
            {process.shortDescription && (
              <div style={s.shortDesc}>{process.shortDescription}</div>
            )}
          </div>
          <button style={s.editMainBtn} onClick={goEdit}>Düzenle →</button>
        </div>

        {/* İstatistik Satırı */}
        <div style={s.statsRow}>
          {[
            ['Alt Süreç',  children.length],
            ['Tedarikçi',  suppliers.length],
            ['Girdi',      inputs.length],
            ['Çıktı',      outputs.length],
            ['Müşteri',    customers.length],
            ['Adım',       sortedSteps.length],
            ['Risk',       risks.length],
            ['KPI',        kpis.length],
            ['Paydaş',     stakeholders.length],
          ].map(([label, val]) => (
            <div key={label} style={{ ...s.statBox, opacity: val === 0 ? 0.45 : 1 }}>
              <div style={{ ...s.statVal, color: val > 0 ? borderColor : '#aaa' }}>{val}</div>
              <div style={s.statLbl}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hiyerarşi (her zaman görünür) ── */}
      {(ancestors.length > 0 || children.length > 0) && (
        <div style={s.hierCard}>
          {ancestors.length > 0 && (
            <div style={s.hierSection}>
              <div style={s.hierLabel}>Üst Süreç{ancestors.length > 1 ? 'ler' : ''}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {ancestors.map((anc, i) => (
                  <span key={anc.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {i > 0 && <span style={{ color: '#ddd' }}>›</span>}
                    <button style={s.hierBtn} onClick={() => navigate(`/portal/${anc.id}`)}>
                      <span style={s.hierCode}>{anc.code}</span>
                      {anc.name}
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {ancestors.length > 0 && children.length > 0 && <div style={s.hierDivider} />}

          {children.length > 0 && (
            <div style={s.hierSection}>
              <div style={s.hierLabel}>
                Alt Süreçler <span style={{ color: borderColor, fontWeight: 800, marginLeft: 4 }}>{children.length}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {children.map(c => {
                  const clv = LEVEL_BORDER[c.level] || '#94a3b8';
                  return (
                    <button key={c.id}
                      style={{ ...s.childChip, borderColor: clv }}
                      onClick={() => navigate(`/portal/${c.id}`)}>
                      <span style={{ ...s.hierCode, color: clv }}>{c.code}</span>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ 1. KİMLİK BİLGİLERİ ══ */}
      <SectionBlock title="Kimlik Bilgileri" icon="📋" onEdit={goEdit} accent="#0f3460">

        {/* Temel kimlik: ad, no, sorumlu — belirgin */}
        <div style={s.identityTop}>
          <div style={s.identityMain}>
            <div style={s.identLabel}>Süreç Adı</div>
            <div style={s.identName}>{process.name}</div>
          </div>
          <div style={s.identityMeta}>
            <div>
              <div style={s.identLabel}>Süreç No</div>
              <div style={s.identCode}>{process.code}</div>
            </div>
            {(ownerRole || ownerRoles.length > 0) && (
              <div>
                <div style={s.identLabel}>Sorumlu</div>
                <div style={s.identOwner}>
                  {ownerRoles.length > 0 ? ownerRoles.join(', ') : ownerRole}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Özellikler grid */}
        <div style={{ ...s.attrGrid, marginTop: 20 }}>
          <Field label="Seviye"     value={LEVELS[process.level] || process.level} />
          <Field label="Süreç Türü" value={TYPES[process.processType] || process.processType} />
          <Field label="Kritiklik"  value={
            process.criticality
              ? <span style={{ fontWeight: 700, color: CRIT_COLORS[process.criticality] }}>
                  {CRITICALITIES[process.criticality] || process.criticality}
                </span>
              : null
          } />
          <Field label="Durum" value={
            <span style={{ fontWeight: 700, color: process.isActive ? '#16a34a' : '#dc2626' }}>
              {process.isActive ? 'Aktif' : 'Pasif'}
            </span>
          } />
        </div>

        {/* Uzun metin alanları */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          <LongField label="Amacı"             text={process.purpose} />
          <LongField label="Kapsamı"           text={process.processScope} />

          {(process.startPoint || process.endPoint) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <LongField label="Başlangıç Noktası" text={process.startPoint} />
              <LongField label="Bitiş Noktası"     text={process.endPoint} />
            </div>
          )}
          {(process.strategicGoal || process.strategicTarget) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <LongField label="Stratejik Amaç"   text={process.strategicGoal} />
              <LongField label="Stratejik Hedef"  text={process.strategicTarget} />
            </div>
          )}
          {(process.affectedBy || process.affects) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <LongField label="Etkilendiği Süreçler" text={process.affectedBy} />
              <LongField label="Etkilediği Süreçler"  text={process.affects} />
            </div>
          )}
          <LongField label="Açıklama / Notlar" text={process.description} />
        </div>
      </SectionBlock>

      {/* ══ 2. PAYDAŞLAR ══ */}
      {stakeholders.length > 0 && (
        <SectionBlock title="Paydaşlar" icon="👥" count={stakeholders.length} onEdit={goEdit} accent="#7c3aed">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* İç Paydaşlar */}
            <div>
              <div style={s.shColTitle}>
                <span style={{ ...s.shDot, background: '#7c3aed' }} />
                İç Paydaşlar
                <span style={s.shCount}>{internalSH.length}</span>
              </div>
              {internalSH.length === 0
                ? <div style={s.emptyNote}>—</div>
                : <div style={s.shList}>
                    {internalSH.map(sh => <div key={sh.id} style={s.shItem}>{sh.name}</div>)}
                  </div>
              }
            </div>
            {/* Dış Paydaşlar */}
            <div>
              <div style={s.shColTitle}>
                <span style={{ ...s.shDot, background: '#d97706' }} />
                Dış Paydaşlar
                <span style={s.shCount}>{externalSH.length}</span>
              </div>
              {externalSH.length === 0
                ? <div style={s.emptyNote}>—</div>
                : <div style={s.shList}>
                    {externalSH.map(sh => <div key={sh.id} style={{ ...s.shItem, borderLeft: '3px solid #d97706' }}>{sh.name}</div>)}
                  </div>
              }
            </div>
          </div>
        </SectionBlock>
      )}

      {/* ══ 3. SIPOC ══ */}
      <SectionBlock title="SIPOC" icon="🔄" count={sipocCount} onEdit={goEdit} accent="#0d9488">
        <div style={s.sipocGrid}>
          <SipocCol         title="Tedarikçiler" items={suppliers.map(p => p.name)} accent="#0f3460" />
          <SipocCol         title="Girdiler"     items={inputs.map(io => io.name)}  accent="#0d9488" />
          <SipocProcessCol  name={process.name}                                     accent="#6d28d9" />
          <SipocCol         title="Çıktılar"     items={outputs.map(io => io.name)} accent="#0d9488" />
          <SipocCol         title="Müşteriler"   items={customers.map(p => p.name)} accent="#0f3460" />
        </div>
      </SectionBlock>

      {/* ══ 4. SÜREÇ ADIMLARI ══ */}
      {sortedSteps.length > 0 && (
        <SectionBlock title="Süreç Adımları" icon="📌" count={sortedSteps.length} onEdit={goEdit} accent="#0369a1">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedSteps.map((step, i) => (
              <div key={step.id} style={s.stepRow}>
                <div style={s.stepNum}>{step.stepNo || i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={s.stepName}>{step.name}</div>
                  {step.description && <div style={s.stepDesc}>{step.description}</div>}
                </div>
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* ══ 5. RİSKLER ══ */}
      {risks.length > 0 && (
        <SectionBlock title="Riskler" icon="⚠️" count={risks.length} onEdit={goEdit} accent="#b45309">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {risks.map(risk => (
              <div key={risk.id} style={s.riskCard}>
                <div style={s.riskName}>{risk.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {risk.probability && (
                    <span style={{
                      ...s.levelBadge,
                      color: RISK_COLORS[risk.probability],
                      background: RISK_COLORS[risk.probability] + '18',
                      borderColor: RISK_COLORS[risk.probability] + '40',
                    }}>
                      Olasılık: {RISK_LEVELS[risk.probability] || risk.probability}
                    </span>
                  )}
                  {risk.impact && (
                    <span style={{
                      ...s.levelBadge,
                      color: RISK_COLORS[risk.impact],
                      background: RISK_COLORS[risk.impact] + '18',
                      borderColor: RISK_COLORS[risk.impact] + '40',
                    }}>
                      Etki: {RISK_LEVELS[risk.impact] || risk.impact}
                    </span>
                  )}
                </div>
                {risk.mitigation && (
                  <div style={s.mitigation}>
                    <span style={{ fontWeight: 600, color: '#555' }}>Önlem:</span> {risk.mitigation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* ══ 6. KPI'LAR ══ */}
      {kpis.length > 0 && (
        <SectionBlock title="KPI'lar" icon="📊" count={kpis.length} onEdit={goEdit} accent="#1d4ed8">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {kpis.map(kpi => (
              <div key={kpi.id} style={s.kpiCard}>
                <div style={s.kpiName}>{kpi.name}</div>
                {kpi.frequency && (
                  <span style={s.kpiBadgeBlue}>{FREQUENCIES[kpi.frequency] || kpi.frequency}</span>
                )}
                {kpi.definition && (
                  <div style={s.kpiText}><span style={{ fontWeight: 600 }}>Tanım:</span> {kpi.definition}</div>
                )}
                {kpi.calculationMethod && (
                  <div style={s.kpiText}><span style={{ fontWeight: 600 }}>Hesaplama:</span> {kpi.calculationMethod}</div>
                )}
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────

const s = {
  page:          { maxWidth: 1020, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 },

  breadcrumb:    { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  bcBtn:         { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#0f3460', padding: 0, fontWeight: 500 },
  bcSep:         { color: '#ccc', fontSize: 14 },
  bcCurrent:     { fontSize: 13, color: '#888' },
  backBtn:       { padding: '8px 18px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 },

  headerCard:    { background: '#fff', borderRadius: 12, padding: '22px 26px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' },
  title:         { margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 },
  code:          { fontSize: 13, color: '#888', fontFamily: 'monospace', marginBottom: 8 },
  shortDesc:     { fontSize: 14, color: '#555', lineHeight: 1.65, marginTop: 6, maxWidth: 600 },
  editMainBtn:   { padding: '9px 20px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0, alignSelf: 'flex-start' },

  statsRow:      { display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' },
  statBox:       { background: '#f8f9fa', borderRadius: 8, padding: '8px 13px', textAlign: 'center', border: '1px solid #f0f0f0', minWidth: 52, transition: 'opacity 0.2s' },
  statVal:       { fontSize: 20, fontWeight: 800 },
  statLbl:       { fontSize: 10, color: '#888', marginTop: 2, whiteSpace: 'nowrap' },

  hierCard:      { background: '#fff', borderRadius: 10, padding: '14px 20px', border: '1px solid #f0f0f0', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' },
  hierSection:   { display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 200 },
  hierLabel:     { fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em' },
  hierBtn:       { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#0f3460', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 },
  hierCode:      { fontSize: 10, color: '#aaa', fontFamily: 'monospace' },
  hierDivider:   { width: 1, background: '#f0f0f0', alignSelf: 'stretch', margin: '0 4px' },
  childChip:     { background: '#fff', border: '1.5px solid #94a3b8', borderRadius: 18, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 5 },

  section:       { background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' },
  sectionHead:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', background: '#f9fafb', borderBottom: '1px solid #f0f0f0' },
  sectionTitle:  { fontSize: 14, fontWeight: 700 },
  countBadge:    { fontSize: 11, fontWeight: 700, color: '#fff', borderRadius: 10, padding: '2px 8px' },
  editBtn:       { background: 'none', border: '1px solid', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  sectionBody:   { padding: '20px' },

  // Kimlik bilgileri — belirgin blok
  identityTop:   { display: 'flex', gap: 24, flexWrap: 'wrap', padding: '16px 20px', background: '#f0f5ff', borderRadius: 10, border: '1px solid #dbeafe' },
  identityMain:  { flex: 2, minWidth: 200 },
  identityMeta:  { flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' },
  identLabel:    { fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 },
  identName:     { fontSize: 20, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.3 },
  identCode:     { fontSize: 15, fontWeight: 700, color: '#0f3460', fontFamily: 'monospace' },
  identOwner:    { fontSize: 14, fontWeight: 600, color: '#1a1a2e' },

  attrGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px 20px' },
  fieldLabel:    { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 },
  fieldValue:    { fontSize: 14, color: '#1a1a2e', fontWeight: 500, lineHeight: 1.4 },
  longText:      { fontSize: 13, color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-wrap', marginTop: 2 },

  sipocGrid:     { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 },
  sipocCol:      { border: '1px solid #f0f0f0', borderRadius: 8, padding: '12px 10px', background: '#fff' },
  sipocColTitle: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 },
  sipocItem:     { fontSize: 13, color: '#334155', padding: '5px 0', borderBottom: '1px solid #f5f5f5', lineHeight: 1.4 },
  sipocEmpty:    { color: '#ccc', fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: '8px 0' },

  stepRow:       { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' },
  stepNum:       { width: 28, height: 28, borderRadius: '50%', background: '#0369a1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  stepName:      { fontSize: 14, fontWeight: 600, color: '#1a1a2e' },
  stepDesc:      { fontSize: 13, color: '#6b7280', marginTop: 3, lineHeight: 1.55 },

  riskCard:      { background: '#fffbf5', borderRadius: 10, padding: '14px 16px', border: '1px solid #fde8c8' },
  riskName:      { fontSize: 14, fontWeight: 600, color: '#1a1a2e' },
  levelBadge:    { fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 8, border: '1px solid transparent' },
  mitigation:    { fontSize: 12, color: '#555', marginTop: 10, lineHeight: 1.55, paddingTop: 10, borderTop: '1px dashed #f0e0c8' },

  kpiCard:       { background: '#f0f7ff', borderRadius: 10, padding: '14px 16px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: 6 },
  kpiName:       { fontSize: 14, fontWeight: 700, color: '#1e3a8a' },
  kpiBadgeBlue:  { fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 8, background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', alignSelf: 'flex-start' },
  kpiText:       { fontSize: 12, color: '#374151', lineHeight: 1.55 },

  shColTitle:    { fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 },
  shDot:         { width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  shCount:       { fontSize: 11, fontWeight: 700, color: '#fff', background: '#94a3b8', borderRadius: 10, padding: '1px 7px', marginLeft: 'auto' },
  shList:        { display: 'flex', flexDirection: 'column', gap: 6 },
  shItem:        { fontSize: 13, color: '#334155', padding: '8px 12px', background: '#fff', borderRadius: 7, border: '1px solid #f0f0f0', borderLeft: '3px solid #7c3aed' },
  emptyNote:     { fontSize: 13, color: '#ccc', fontStyle: 'italic' },
};

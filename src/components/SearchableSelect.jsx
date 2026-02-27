import { useState, useMemo, useRef, useEffect } from 'react';

/**
 * options: [{ value, label, code? }]
 * value: current value
 * onChange: (value) => void
 * placeholder: string
 */
export default function SearchableSelect({ options = [], value, onChange, placeholder = '— Seçiniz —' }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    return options.filter(o =>
      o.label?.toLowerCase().includes(lq) || o.code?.toLowerCase().includes(lq)
    );
  }, [options, q]);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={s.box} onClick={() => setOpen(v => !v)}>
        <span style={selected ? {} : { color: '#aaa' }}>
          {selected
            ? <>{selected.code && <span style={s.code}>{selected.code}</span>} {selected.label}</>
            : placeholder}
        </span>
        <span style={{ fontSize: '10px', color: '#aaa', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={s.drop}>
          <div style={s.searchWrap}>
            <input
              autoFocus
              style={s.searchInput}
              placeholder="Ara..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <div style={s.list}>
            <div style={s.opt} onClick={() => { onChange(''); setOpen(false); setQ(''); }}>
              <span style={{ color: '#aaa' }}>— Seçiniz —</span>
            </div>
            {filtered.map(o => (
              <div
                key={o.value}
                style={{ ...s.opt, ...(String(o.value) === String(value) ? s.optActive : {}) }}
                onClick={() => { onChange(o.value); setOpen(false); setQ(''); }}
              >
                {o.code && <span style={s.optCode}>{o.code}</span>}
                <span>{o.label}</span>
              </div>
            ))}
            {filtered.length === 0 && <div style={s.noResult}>Sonuç bulunamadı</div>}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  box:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '7px', cursor: 'pointer', fontSize: '14px', background: '#fff', userSelect: 'none', minHeight: '42px' },
  code:      { fontSize: '11px', color: '#888', background: '#f5f5f5', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' },
  drop:      { position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
  searchWrap:{ padding: '8px' },
  searchInput:{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '6px', outline: 'none', fontSize: '13px', boxSizing: 'border-box' },
  list:      { maxHeight: '220px', overflowY: 'auto' },
  opt:       { display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', cursor: 'pointer', fontSize: '13px' },
  optActive: { background: '#eff6ff', color: '#0f3460', fontWeight: 500 },
  optCode:   { fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', whiteSpace: 'nowrap', flexShrink: 0 },
  noResult:  { padding: '12px', textAlign: 'center', color: '#aaa', fontSize: '13px' },
};

import { useState, useEffect } from 'react';
import { usersApi, unitsApi, positionsApi, titlesApi } from '../../api/organization';
import PersonnelBulkAssign from './PersonnelBulkAssign';

export default function PersonnelBulk() {
  const [personnel, setPersonnel] = useState([]);
  const [units, setUnits]         = useState([]);
  const [positions, setPositions] = useState([]);
  const [titles, setTitles]       = useState([]);
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [uR, unR, pR, tR] = await Promise.all([
        usersApi.list(), unitsApi.list(), positionsApi.list(), titlesApi.list(),
      ]);
      setPersonnel(uR.data);
      setUnits(unR.data);
      setPositions(pR.data);
      setTitles(tR.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <h2 style={s.title}>Toplu Atama</h2>
        </div>
        <div style={s.loading}>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Toplu Atama</h2>
          <p style={s.sub}>Birden fazla personele aynı anda organizasyon ataması yapın</p>
        </div>
      </div>

      <PersonnelBulkAssign
        personnel={personnel}
        units={units}
        positions={positions}
        titles={titles}
        onSaved={() => load()}
      />
    </div>
  );
}

const s = {
  page:    { display: 'flex', flexDirection: 'column', height: '100%' },
  header:  { marginBottom: '20px', flexShrink: 0 },
  title:   { margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a2e' },
  sub:     { margin: '4px 0 0', fontSize: '13px', color: '#888' },
  loading: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
};

import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  const cards = [
    { label: 'Organizasyon', icon: '🏢', desc: 'Birimler, pozisyonlar ve kullanıcı yönetimi' },
    { label: 'Doküman Yönetimi', icon: '📄', desc: 'Doküman oluşturma, revizyon ve dağıtım' },
    { label: 'Süreçler', icon: '⚙️', desc: 'Süreç tanımları ve KPI takibi' },
  ];

  return (
    <div>
      <h2 style={styles.greeting}>Hoş geldiniz, {user?.username}</h2>
      <p style={styles.sub}>KYS - Kurumsal Yönetim Sistemi</p>

      <div style={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} style={styles.card}>
            <div style={styles.icon}>{card.icon}</div>
            <h3 style={styles.cardTitle}>{card.label}</h3>
            <p style={styles.cardDesc}>{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  greeting: { margin: 0, fontSize: '24px', fontWeight: '600', color: '#1a1a2e' },
  sub: { margin: '6px 0 32px', color: '#888', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '28px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #f0f0f0',
  },
  icon: { fontSize: '36px', marginBottom: '12px' },
  cardTitle: { margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: '#1a1a2e' },
  cardDesc: { margin: 0, fontSize: '13px', color: '#888', lineHeight: '1.5' },
};

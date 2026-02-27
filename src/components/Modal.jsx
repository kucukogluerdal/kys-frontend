export default function Modal({ title, onClose, children }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: '12px', width: '100%',
    maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: '1px solid #eee',
  },
  title: { margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a1a2e' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '18px',
    cursor: 'pointer', color: '#999', padding: '0',
  },
  body: { padding: '24px', overflowY: 'auto' },
};

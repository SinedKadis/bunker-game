import { motion } from 'framer-motion';

const colors = {
  success: '#5a9e6f',
  error: '#c84444',
  warning: '#c87a44',
  info: '#4a7ec8',
};

export default function Notification({ notification, onClose }) {
  if (!notification) return null;
  const color = colors[notification.type] || colors.info;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -20, x: '-50%' }}
      style={{
        position: 'fixed', top: 24, left: '50%',
        background: `rgba(10,10,11,0.95)`, border: `1px solid ${color}`,
        color: color, padding: '12px 24px', borderRadius: 4, zIndex: 999,
        fontFamily: 'var(--font-ui)', fontSize: 14, letterSpacing: '0.05em',
        boxShadow: `0 0 20px ${color}33`, display: 'flex', gap: 12, alignItems: 'center',
        maxWidth: 480, cursor: 'pointer',
      }}
      onClick={onClose}
      onAnimationComplete={() => {
        setTimeout(onClose, 3000);
      }}
    >
      {notification.text}
      <span style={{ opacity: 0.5, marginLeft: 'auto' }}>✕</span>
    </motion.div>
  );
}

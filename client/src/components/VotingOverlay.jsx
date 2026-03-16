import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function VotingOverlay() {
  const { players, playerId, votes, votingTimeLeft, votingActive, socket, roomCode } = useGameStore();
  const myVote = votes?.[playerId];
  const mins = String(Math.floor(votingTimeLeft / 60)).padStart(2, '0');
  const secs = String(votingTimeLeft % 60).padStart(2, '0');
  const alivePlayers = players.filter(p => p.isAlive !== false && p.id !== playerId);

  if (!votingActive) return null;

  function castVote(targetId) {
    if (myVote) return;
    socket?.emit('voting:vote', { roomCode, targetId });
    useGameStore.setState(st => ({ votes: { ...st.votes, [st.playerId]: targetId } }));
  }

  return (
    <motion.div
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'linear-gradient(0deg, #0a0a0b 0%, rgba(10,10,11,0.95) 100%)',
        borderTop: '1px solid #c84444', padding: '20px 32px' }}
      initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#c84444', letterSpacing: '0.1em' }}>
          ⚖ ГОЛОСОВАНИЕ
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: votingTimeLeft < 30 ? '#c84444' : 'var(--accent)',
          fontWeight: 700 }}>
          {mins}:{secs}
        </span>
        <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          Кого изгнать из бункера? Голоса анонимны.
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {alivePlayers.map(p => (
          <motion.button key={p.id}
            onClick={() => castVote(p.id)}
            disabled={!!myVote}
            whileHover={!myVote ? { scale: 1.04 } : {}}
            whileTap={!myVote ? { scale: 0.97 } : {}}
            style={{
              padding: '10px 20px', border: `1px solid ${myVote === p.id ? '#c84444' : '#3d3d50'}`,
              background: myVote === p.id ? 'rgba(200,68,68,0.15)' : 'rgba(255,255,255,0.03)',
              color: myVote === p.id ? '#c84444' : 'var(--text)',
              fontFamily: 'var(--font-ui)', fontSize: 14, letterSpacing: '0.05em', cursor: myVote ? 'default' : 'pointer',
              borderRadius: 4, transition: 'all 0.2s',
            }}
          >
            {p.name} {myVote === p.id ? '✓' : ''}
          </motion.button>
        ))}
      </div>
      {myVote && (
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 10 }}>
          Ваш голос учтён. Ожидание остальных участников...
        </p>
      )}
    </motion.div>
  );
}

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import CardPickPage from './pages/CardPickPage';
import GamePage from './pages/GamePage';
import FinalPage from './pages/FinalPage';
import Notification from './components/Notification';

const SCROLLABLE_PAGES = ['card_pick', 'final', 'discussion'];

function ReconnectingPage() {
  return (
    <div style={{
      width:'100%', height:'100%', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'radial-gradient(ellipse at 50% 30%, #1a1208 0%, #0a0a0b 60%)',
      fontFamily:'var(--font-mono)', color:'var(--text-muted)',
    }}>
      <div style={{fontSize:32, marginBottom:20, opacity:0.6}}>⌛</div>
      <div style={{fontSize:12, letterSpacing:'0.25em', textTransform:'uppercase'}}>
        восстановление соединения...
      </div>
    </div>
  );
}

export default function App() {
  const { initSocket, page, notification, clearNotification } = useGameStore();

  useEffect(() => { initSocket(); }, []);

  const isScrollable = SCROLLABLE_PAGES.includes(page);

  const renderPage = () => {
    switch (page) {
      case 'reconnecting': return <ReconnectingPage />;
      case 'home':        return <HomePage />;
      case 'lobby':       return <LobbyPage />;
      case 'card_pick':   return <CardPickPage />;
      case 'discussion':
      case 'voting':      return <GamePage />;
      case 'final':       return <FinalPage />;
      default:            return <HomePage />;
    }
  };

  return (
    <div className="noise" style={{
      width: '100vw', height: '100vh', position: 'relative',
      overflowY: isScrollable ? 'auto' : 'hidden', overflowX: 'hidden',
    }}>
      <AnimatePresence mode="wait">
        <motion.div key={page}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', minHeight: '100%', height: isScrollable ? 'auto' : '100%' }}>
          {renderPage()}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {notification && <Notification key="notif" notification={notification} onClose={clearNotification} />}
      </AnimatePresence>
    </div>
  );
}

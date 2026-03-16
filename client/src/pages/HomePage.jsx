import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import './HomePage.css';

// Тематические SVG-слайды как data URL — никаких внешних запросов
const SLIDES = [
  // Bunker hatch
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><rect width='800' height='500' fill='%230a0a0b'/><circle cx='400' cy='250' r='180' stroke='%23c8a96e' stroke-width='3' fill='none' opacity='0.3'/><circle cx='400' cy='250' r='120' stroke='%23c8a96e' stroke-width='2' fill='none' opacity='0.2'/><circle cx='400' cy='250' r='60' fill='%23c8a96e' opacity='0.1'/><line x1='400' y1='70' x2='400' y2='430' stroke='%23c8a96e' stroke-width='1.5' opacity='0.2'/><line x1='220' y1='250' x2='580' y2='250' stroke='%23c8a96e' stroke-width='1.5' opacity='0.2'/><text x='400' y='260' text-anchor='middle' font-family='monospace' font-size='14' fill='%23c8a96e' opacity='0.4' letter-spacing='8'>БУНКЕР</text></svg>`,
  // Nuclear symbol
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><rect width='800' height='500' fill='%230a0a0b'/><circle cx='400' cy='250' r='200' stroke='%23c84444' stroke-width='1' fill='none' opacity='0.15'/><circle cx='400' cy='250' r='40' fill='%23c84444' opacity='0.2'/><circle cx='400' cy='250' r='40' stroke='%23c84444' stroke-width='2' fill='none' opacity='0.4'/><path d='M400 210 L355 142 L310 210 Z' fill='%23c84444' opacity='0.15'/><path d='M440 275 L500 340 L540 270 Z' fill='%23c84444' opacity='0.15'/><path d='M360 275 L300 340 L260 270 Z' fill='%23c84444' opacity='0.15'/><text x='400' y='430' text-anchor='middle' font-family='monospace' font-size='11' fill='%23c84444' opacity='0.3' letter-spacing='6'>ОПАСНАЯ ЗОНА</text></svg>`,
  // Survival gear
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><rect width='800' height='500' fill='%230a0a0b'/><rect x='320' y='160' width='160' height='180' rx='8' stroke='%23c8a96e' stroke-width='2' fill='none' opacity='0.25'/><rect x='340' y='180' width='120' height='20' stroke='%23c8a96e' stroke-width='1' fill='%23c8a96e' fill-opacity='0.08' opacity='0.4'/><rect x='340' y='210' width='120' height='20' stroke='%23c8a96e' stroke-width='1' fill='%23c8a96e' fill-opacity='0.08' opacity='0.4'/><rect x='340' y='240' width='120' height='20' stroke='%23c8a96e' stroke-width='1' fill='%23c8a96e' fill-opacity='0.08' opacity='0.4'/><text x='400' y='130' text-anchor='middle' font-family='monospace' font-size='12' fill='%23c8a96e' opacity='0.35' letter-spacing='5'>ДОСЬЕ</text><text x='400' y='380' text-anchor='middle' font-family='monospace' font-size='10' fill='%23c8a96e' opacity='0.25' letter-spacing='4'>ВЫЖИВАНИЕ · СТРАТЕГИЯ · ВЫБОР</text></svg>`,
  // People silhouettes
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><rect width='800' height='500' fill='%230a0a0b'/><circle cx='250' cy='200' r='25' fill='%23c8a96e' opacity='0.15'/><rect x='225' y='230' width='50' height='80' rx='4' fill='%23c8a96e' opacity='0.1'/><circle cx='400' cy='190' r='28' fill='%23c8a96e' opacity='0.2'/><rect x='372' y='223' width='56' height='88' rx='4' fill='%23c8a96e' opacity='0.15'/><circle cx='550' cy='205' r='22' fill='%23c8a96e' opacity='0.12'/><rect x='528' y='232' width='44' height='76' rx='4' fill='%23c8a96e' opacity='0.08'/><line x1='100' y1='400' x2='700' y2='400' stroke='%23c8a96e' stroke-width='1' opacity='0.1'/><text x='400' y='440' text-anchor='middle' font-family='monospace' font-size='11' fill='%23c8a96e' opacity='0.3' letter-spacing='6'>КТО ВЫЖИВЕТ?</text></svg>`,
  // Timer/countdown
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><rect width='800' height='500' fill='%230a0a0b'/><circle cx='400' cy='230' r='150' stroke='%23c8a96e' stroke-width='2' fill='none' opacity='0.2'/><circle cx='400' cy='230' r='140' stroke='%23c8a96e' stroke-width='0.5' fill='none' opacity='0.1'/><line x1='400' y1='230' x2='400' y2='110' stroke='%23c8a96e' stroke-width='3' opacity='0.5' stroke-linecap='round'/><line x1='400' y1='230' x2='480' y2='270' stroke='%23c8a96e' stroke-width='2' opacity='0.35' stroke-linecap='round'/><circle cx='400' cy='230' r='8' fill='%23c8a96e' opacity='0.4'/><text x='400' y='430' text-anchor='middle' font-family='monospace' font-size='12' fill='%23c8a96e' opacity='0.3' letter-spacing='5'>ВРЕМЯ РЕШАЕТ ВСЁ</text></svg>`,
];

function useSlideshow() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 3500);
    return () => clearInterval(t);
  }, []);
  return idx;
}

export default function HomePage() {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const slideIdx = useSlideshow();

  const { setPlayerName, createRoom, joinRoom, connected, listRooms } = useGameStore();

  // Загружаем список комнат
  useEffect(() => {
    if (!connected) return;
    const load = () => listRooms(list => setRooms(list || []));
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [connected]);

  const handleCreate = () => {
    if (!name.trim()) return setError('Введи своё имя');
    setLoading(true);
    setPlayerName(name.trim());
    createRoom((r) => {
      setLoading(false);
      if (!r.success) setError(r.error || 'Ошибка');
    });
  };

  const handleJoin = (prefillCode) => {
    const c = prefillCode || code;
    if (!name.trim()) return setError('Введи своё имя');
    if (!c.trim()) return setError('Введи код комнаты');
    setLoading(true);
    setPlayerName(name.trim());
    joinRoom(c.trim(), (r) => {
      setLoading(false);
      if (!r.success) setError(r.error || 'Ошибка');
    });
  };

  const handleJoinRoom = (roomCode) => {
    if (!name.trim()) {
      setCode(roomCode);
      setMode('join');
      return;
    }
    setLoading(true);
    setPlayerName(name.trim());
    joinRoom(roomCode, (r) => {
      setLoading(false);
      if (!r.success) setError(r.error || 'Ошибка');
    });
  };

  return (
    <div className="home">
      {/* Slideshow background */}
      <div className="home__slides">
        {SLIDES.map((svg, i) => (
          <motion.div
            key={i}
            className="home__slide"
            style={{ backgroundImage: `url("data:image/svg+xml,${svg}")` }}
            animate={{ opacity: i === slideIdx ? 1 : 0 }}
            transition={{ duration: 1.2 }}
          />
        ))}
        {/* Artifact overlay */}
        <div className="home__artifacts" />
        <div className="home__scanlines" />
        <div className="home__vignette" />
      </div>

      {/* Content */}
      <div className="home__content">

        {/* Logo */}
        <motion.div className="home__logo-wrap"
          initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}>
          <h1 className="home__title">БУНКЕР</h1>
          <p className="home__subtitle">— выжить любой ценой —</p>
          <div className="home__status">
            <span className={`home__status-dot ${connected ? "on" : "off"}`} />
            {connected ? 'сервер онлайн' : 'подключение...'}
          </div>
        </motion.div>

        {/* Main panel */}
        <motion.div className="home__panel"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}>

          <AnimatePresence mode="wait">
            {!mode ? (
              <motion.div key="main"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Create button */}
                <button className="btn btn-primary home__create-btn"
                  onClick={() => { setMode('create'); setError(''); }}
                  disabled={!connected}>
                  + Создать игру
                </button>

                {/* Room list */}
                <div className="home__rooms">
                  <div className="home__rooms-title">
                    Активные игры
                    <span className="home__rooms-count">{rooms.length}</span>
                  </div>

                  {rooms.length === 0 ? (
                    <div className="home__rooms-empty">
                      Нет активных игр
                    </div>
                  ) : (
                    <div className="home__rooms-list">
                      {rooms.map(r => (
                        <motion.div key={r.code} className="home__room-item"
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                          <div className="home__room-info">
                            <span className="home__room-host">{r.hostName}</span>
                            <span className="home__room-meta">
                              {r.players}/{r.maxPlayers} игроков
                              {r.bots > 0 && ` · ${r.bots} 🤖`}
                              · {r.phase === 'lobby' ? 'лобби' : 'в игре'}
                            </span>
                          </div>
                          <div className={`home__room-phase home__room-phase--${r.phase}`}>
                            {r.phase === 'lobby' ? 'ожидание' : 'идёт игра'}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Join by code — единственный способ войти */}
                <button className="btn btn-primary home__join-code-btn"
                  onClick={() => { setMode('join'); setError(''); }}
                  disabled={!connected}>
                  Войти по коду
                </button>

                {error && <p className="home__error">{error}</p>}
              </motion.div>

            ) : mode === 'create' ? (
              <motion.div key="create" className="home__form"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="home__form-title">// Создать игру</div>
                <input className="input" placeholder="Твоё имя (ведущий)" value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  maxLength={20} autoFocus />
                {error && <p className="home__error">{error}</p>}
                <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
                  {loading ? '...' : 'Создать комнату'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setMode(null); setError(''); }}>
                  ← Назад
                </button>
              </motion.div>

            ) : (
              <motion.div key="join" className="home__form"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="home__form-title">// Войти в игру</div>
                <input className="input" placeholder="Твоё имя" value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  maxLength={20} autoFocus />
                <input className="input" placeholder="Код комнаты" value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  maxLength={4} style={{ letterSpacing: '0.3em', textAlign: 'center' }} />
                {error && <p className="home__error">{error}</p>}
                <button className="btn btn-primary" onClick={() => handleJoin()} disabled={loading}>
                  {loading ? '...' : 'Войти'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setMode(null); setError(''); }}>
                  ← Назад
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="home__footer">
          до 16 игроков · 8 характеристик · судьба решается голосованием
        </div>
      </div>
    </div>
  );
}

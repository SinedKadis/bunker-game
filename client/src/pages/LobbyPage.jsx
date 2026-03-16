import { motion } from "framer-motion";
import { useGameStore } from "../store/gameStore";
import "./LobbyPage.css";

export default function LobbyPage() {
  const { roomCode, players, isHost, playerId, roomSettings,
    updateSettings, startGame, addBot, removeBot } = useGameStore();

  function handleSettings(key, value) {
    const newSettings = { ...roomSettings, [key]: value };
    useGameStore.setState({ roomSettings: newSettings });
    updateSettings(newSettings);
  }

  const alivePlayers = players;
  const canStart = isHost && alivePlayers.length >= 2;

  return (
    <div className="lobby">
      <div className="noise-overlay" />
      <div className="lobby__bg" />

      <div className="lobby__layout">
        {/* Header */}
        <motion.header
          className="lobby__header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="lobby__header-left">
            <span className="lobby__label">БУНКЕР</span>
            <h1>Зал ожидания</h1>
          </div>
          <div className="lobby__code-block">
            <span className="lobby__code-label">КОД КОМНАТЫ</span>
            <div className="lobby__code">{roomCode}</div>
            <span className="lobby__code-hint">Поделитесь с участниками</span>
          </div>
        </motion.header>

        <div className="lobby__body">
          {/* Players */}
          <motion.section
            className="lobby__players"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="lobby__section-title">
              <span className="lobby__section-icon">◈</span>
              Выжившие
              <span className="lobby__count">{alivePlayers.length} / {roomSettings.maxPlayers}</span>
            </h2>
            <div className="glow-line" />
            <div className="lobby__player-list">
              {alivePlayers.map((p, i) => (
                <motion.div
                  key={p.id}
                  className={`lobby__player ${p.id === playerId ? "lobby__player--me" : ""} ${p.isBot ? "lobby__player--bot" : ""}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <span className="lobby__player-index">{String(i + 1).padStart(2, "0")}</span>
                  <span className="lobby__player-name">
                    {p.name}
                    {p.id === playerId && <span className="lobby__me-badge">ВЫ</span>}
                    {p.isBot && <span className="lobby__bot-badge">БОТ</span>}
                    {p.isHost && <span className="lobby__host-badge">ВЕДУЩИЙ</span>}
                  </span>
                  <span className="lobby__player-status">
                    {p.isBot ? "●" : "○"}
                  </span>
                </motion.div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: roomSettings.maxPlayers - alivePlayers.length }).map((_, i) => (
                <div key={`empty-${i}`} className="lobby__player lobby__player--empty">
                  <span className="lobby__player-index">{String(alivePlayers.length + i + 1).padStart(2, "0")}</span>
                  <span className="lobby__player-name">Ожидание...</span>
                  <span className="lobby__player-status">—</span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Settings */}
          <motion.section
            className="lobby__settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="lobby__section-title">
              <span className="lobby__section-icon">⚙</span>
              Настройки бункера
            </h2>
            <div className="glow-line" />

            <div className="lobby__settings-grid">
              {/* Max players */}
              <div className="lobby__setting">
                <label className="lobby__setting-label">
                  Слоты для игроков
                  <span className="lobby__setting-hint">Включая хоста</span>
                </label>
                <div className="lobby__setting-control">
                  {[4, 6, 8, 10, 12].map((n) => (
                    <button
                      key={n}
                      className={`lobby__num-btn ${roomSettings.maxPlayers === n ? "active" : ""}`}
                      onClick={() => isHost && handleSettings("maxPlayers", n)}
                      disabled={!isHost}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bunker slots */}
              <div className="lobby__setting">
                <label className="lobby__setting-label">
                  Мест в бункере
                  <span className="lobby__setting-hint">Сколько выживет</span>
                </label>
                <div className="lobby__setting-control">
                  {[2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      className={`lobby__num-btn ${roomSettings.bunkerSlots === n ? "active" : ""}`}
                      onClick={() => isHost && handleSettings("bunkerSlots", n)}
                      disabled={!isHost}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Host is player */}
              <div className="lobby__setting">
                <label className="lobby__setting-label">
                  Хост как игрок
                  <span className="lobby__setting-hint">Может быть изгнан</span>
                </label>
                <button
                  className={`lobby__toggle ${roomSettings.hostIsPlayer ? "active" : ""}`}
                  onClick={() => isHost && handleSettings("hostIsPlayer", !roomSettings.hostIsPlayer)}
                  disabled={!isHost}
                >
                  {roomSettings.hostIsPlayer ? "ВКЛ" : "ВЫКЛ"}
                </button>
              </div>

              {/* Bots */}
              <div className="lobby__setting">
                <label className="lobby__setting-label">
                  Боты
                  <span className="lobby__setting-hint">Занимают слоты как игроки</span>
                </label>
                <div className="lobby__setting-control" style={{ gap: 8 }}>
                  <button
                    className="lobby__num-btn"
                    onClick={() => isHost && removeBot()}
                    disabled={!isHost || !alivePlayers.some(p => p.isBot)}
                    style={{ fontSize: 18, padding: "2px 14px" }}
                  >−</button>
                  <span style={{ minWidth: 24, textAlign: "center", color: "var(--accent)", fontFamily: "var(--font-display)", fontSize: 20 }}>
                    {alivePlayers.filter(p => p.isBot).length}
                  </span>
                  <button
                    className="lobby__num-btn"
                    onClick={() => isHost && addBot()}
                    disabled={!isHost || alivePlayers.length >= roomSettings.maxPlayers}
                    style={{ fontSize: 18, padding: "2px 14px" }}
                  >+</button>
                </div>
              </div>
            </div>

            <div className="glow-line" />

            <div className="lobby__summary">
              <div className="lobby__summary-item">
                <span>Игроков</span>
                <strong>{alivePlayers.length}</strong>
              </div>
              <div className="lobby__summary-item">
                <span>Выживет</span>
                <strong className="lobby__summary-green">{roomSettings.bunkerSlots}</strong>
              </div>
              <div className="lobby__summary-item">
                <span>Изгнанят</span>
                <strong className="lobby__summary-red">{Math.max(0, alivePlayers.length - roomSettings.bunkerSlots)}</strong>
              </div>
            </div>

            {isHost ? (
              <button
                className="btn btn-large btn-success lobby__start-btn"
                onClick={startGame}
                disabled={!canStart}
              >
                {canStart ? "Начать обсуждение →" : "Ожидание игроков..."}
              </button>
            ) : (
              <div className="lobby__waiting">
                <div className="lobby__waiting-dot" />
                <span>Ожидание ведущего...</span>
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}

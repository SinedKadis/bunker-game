import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store/gameStore";
import "./LandingPage.css";

export default function LandingPage() {
  const { socket, setScreen } = useGameStore();
  const [mode, setMode] = useState(null); // null | "create" | "join"
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  function handleCreate() {
    if (!name.trim()) return;
    useGameStore.setState({ playerName: name.trim() });
    socket.emit("room:create", { playerName: name.trim() });
  }

  function handleJoin() {
    if (!name.trim() || !code.trim()) return;
    useGameStore.setState({ playerName: name.trim() });
    socket.emit("room:join", { roomCode: code.toUpperCase(), playerName: name.trim() });
  }

  return (
    <div className="landing">
      <div className="noise-overlay" />

      {/* Background layers */}
      <div className="landing__bg">
        <div className="landing__bg-radial" />
        <div className="landing__bg-grid" />
        <div className="landing__bg-vignette" />
      </div>

      <motion.div
        className="landing__content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        {/* Logo */}
        <motion.div
          className="landing__logo"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: "easeOut" }}
        >
          <div className="landing__logo-pre">ОПЕРАЦИЯ</div>
          <h1 className="landing__title display-font">БУНКЕР</h1>
          <div className="landing__title-line" />
          <p className="landing__subtitle">
            Человечество на краю. Лишь немногие достойны выжить.
          </p>
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          className="landing__warning"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span className="landing__warning-icon">⚠</span>
          <span>КРИТИЧЕСКАЯ УГРОЗА ЦИВИЛИЗАЦИИ</span>
          <span className="landing__warning-icon">⚠</span>
        </motion.div>

        {/* Buttons or form */}
        <AnimatePresence mode="wait">
          {!mode ? (
            <motion.div
              key="buttons"
              className="landing__buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <button className="btn btn-large landing__btn-primary" onClick={() => setMode("create")}>
                <span className="btn-icon">⬡</span>
                Начать сбор
                <span className="btn-sub">Создать лобби</span>
              </button>
              <button className="btn btn-large landing__btn-secondary" onClick={() => setMode("join")}>
                <span className="btn-icon">◈</span>
                Войти в сборы
                <span className="btn-sub">Присоединиться по коду</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              className="landing__form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="landing__form-title">
                {mode === "create" ? "Создание лобби" : "Вход в лобби"}
              </h3>
              <div className="glow-line" />
              <div className="landing__form-fields">
                <label>
                  <span>Ваш позывной</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Введите имя..."
                    maxLength={20}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && (mode === "create" ? handleCreate() : handleJoin())}
                  />
                </label>
                {mode === "join" && (
                  <label>
                    <span>Код комнаты</span>
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="XXXX"
                      maxLength={4}
                      style={{ textTransform: "uppercase", letterSpacing: "0.3em", fontSize: "1.4rem", textAlign: "center" }}
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    />
                  </label>
                )}
              </div>
              <div className="landing__form-actions">
                <button
                  className={`btn ${mode === "create" ? "btn-success" : ""}`}
                  onClick={mode === "create" ? handleCreate : handleJoin}
                  disabled={!name.trim() || (mode === "join" && code.length < 4)}
                >
                  {mode === "create" ? "Создать" : "Войти"}
                </button>
                <button className="btn" onClick={() => setMode(null)}>
                  ← Назад
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          className="landing__footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <span>BUNKER ©</span>
          <span className="landing__footer-sep">◆</span>
          <span>Социальная игра на выживание</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

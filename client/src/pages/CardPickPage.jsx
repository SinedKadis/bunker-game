import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store/gameStore";
import "./CardPickPage.css";

const CHAR_LABELS = {
  profession: "Профессия",
  biology:    "Биология",
  health:     "Здоровье",
  phobia:     "Фобия",
  hobby:      "Хобби",
  fact1:      "Факт I",
  fact2:      "Факт II",
  baggage:    "Багаж",
};

export default function CardPickPage() {
  const {
    availableCards, pickQueue, players, playerId, currentTurnIndex,
    myDossier, isHost, catastrophe, pickCard: pickCardAction, nextPhase,
  } = useGameStore();

  const [showCatastrophe, setShowCatastrophe] = useState(false);
  // localPicked: set immediately on click for instant flip, before server confirms
  const [localPicked, setLocalPicked] = useState(null); // index

  const isMyTurn = pickQueue[currentTurnIndex] === playerId;
  const currentPicker = players.find((p) => p.id === pickQueue[currentTurnIndex]);

  // Все подтвердили выбор когда прошли через всю очередь
  const allPicked = pickQueue.length > 0 && currentTurnIndex >= pickQueue.length;

  function pickCard(index) {
    if (!isMyTurn) return;
    const card = availableCards?.[index];
    if (!card) return;
    setLocalPicked(index);
    // Передаём cardId но traits уже известны из myDossier
    pickCardAction(card.id);
  }

  function getPickerName(card) {
    if (!card?.pickedBy) return null;
    if (card.pickedBy === playerId) return "Ваша карточка";
    if (card.pickedByName) return card.pickedByName;
    const p = players.find(p => p.id === card.pickedBy);
    return p?.name || (card.pickedBy?.startsWith("bot_") ? "🤖 БОТ" : "Участник");
  }

  return (
    <div className="cardpick">
      <div className="noise-overlay" />

      <div className="cardpick__header">
        <div>
          <div className="cardpick__label">ДОСЬЕ</div>
          <h1 className="cardpick__title">Выбор карточки</h1>
        </div>
        <div className="cardpick__header-right">
          {catastrophe && (
            <button className="btn cardpick__catastrophe-btn" onClick={() => setShowCatastrophe(true)}>
              {catastrophe.icon} О катастрофе
            </button>
          )}
          {isHost && allPicked && (
            <motion.button
              className="btn btn-success btn-large"
              onClick={nextPhase}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              Начать игру →
            </motion.button>
          )}
        </div>
      </div>

      <div className="cardpick__turn">
        {allPicked ? (
          <div className="cardpick__turn-done">
            ✓ Все карточки подтверждены
            {isHost && <span className="cardpick__turn-done-hint"> — нажмите «Начать игру»</span>}
          </div>
        ) : isMyTurn ? (
          <motion.div className="cardpick__turn-mine" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <span className="cardpick__turn-pulse" />
            Ваш ход — нажмите на любую карточку чтобы подтвердить
          </motion.div>
        ) : (
          <div className="cardpick__turn-other">
            {currentPicker ? `Подтверждает выбор: ${currentPicker.name}` : "Ожидание..."}
          </div>
        )}
      </div>

      <div className="cardpick__queue">
        {pickQueue.map((id, i) => {
          const p = players.find((pl) => pl.id === id);
          const hasPicked = availableCards?.some((c) => c.pickedBy === id);
          return (
            <div key={id} className={`cardpick__queue-item ${i === currentTurnIndex && !hasPicked ? "active" : ""} ${hasPicked ? "done" : ""}`}>
              <span>{i + 1}</span>
              <span>{p?.name ?? id}</span>
              {hasPicked && <span className="cardpick__queue-check">✓</span>}
            </div>
          );
        })}
      </div>

      <div className="cardpick__grid">
        {Array.from({ length: 20 }).map((_, i) => {
          const cardInfo = availableCards?.[i];
          const serverPicked = !!cardInfo?.pickedBy;
          // Show as flipped if server says picked OR we just clicked it
          const isFlipped = serverPicked || localPicked === i;
          const isMe = cardInfo?.pickedBy === playerId || localPicked === i;
          const pickerName = serverPicked ? getPickerName(cardInfo) : isMe ? "Ваша карточка" : null;
          const isSelectable = isMyTurn && !serverPicked && localPicked === null;

          return (
            <div
              key={i}
              className={`dossier-card ${isSelectable ? "dossier-card--selectable" : ""} ${isFlipped ? "dossier-card--picked" : ""} ${isMe ? "dossier-card--mine" : ""}`}
              onClick={() => pickCard(i)}
            >
              <div className={`dossier-card__inner${isFlipped ? " flipped" : ""}`}>

                {/* Рубашка */}
                <div className="dossier-card__face dossier-card__back">
                  <div className="dossier-card__back-grid" />
                  <div className="dossier-card__back-logo">БУНКЕР</div>
                  <div className="dossier-card__back-num">#{String(i + 1).padStart(2, "0")}</div>
                </div>

                {/* Лицо — кто выбрал */}
                <div className="dossier-card__face dossier-card__front">
                  {isFlipped && (
                    <div className={`dossier-card__picked-content ${isMe ? "mine" : "other"}`}>
                      <div className="dossier-card__picked-icon">{isMe ? "✦" : "◈"}</div>
                      <div className="dossier-card__picked-name">{pickerName}</div>
                      {isMe && myDossier && (
                        <div className="dossier-card__dots">
                          {Object.keys(CHAR_LABELS).map((k) => (
                            <span key={k} className="dossier-card__dot" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Досье — всегда видно сразу после старта */}
      <div className="cardpick__my-dossier">
        <div className="cardpick__my-dossier-title">
          <span className="cardpick__my-dossier-icon">◈</span>
          Ваши характеристики (видите только вы)
          {!isMyTurn && !allPicked && (
            <span className="cardpick__my-dossier-hint">— нажмите на любую карточку когда придёт ваш ход</span>
          )}
        </div>
        {myDossier ? (
          <motion.div
            className="cardpick__my-dossier-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {Object.entries(CHAR_LABELS).map(([key, label]) => (
              <div key={key} className="cardpick__char">
                <span className="cardpick__char-label">{label}</span>
                <span className="cardpick__char-value">{myDossier[key]?.value ?? "—"}</span>
                {myDossier[key]?.desc && (
                  <span className="cardpick__char-desc">{myDossier[key].desc}</span>
                )}
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="cardpick__my-dossier-loading">Загрузка характеристик...</div>
        )}
      </div>

      <AnimatePresence>
        {showCatastrophe && catastrophe && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCatastrophe(false)}>
            <motion.div className="catastrophe-modal" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
              <div className="catastrophe-modal__icon">{catastrophe.icon}</div>
              <h2 className="catastrophe-modal__title">{catastrophe.title}</h2>
              <div className="glow-line" />
              <p className="catastrophe-modal__desc">{catastrophe.description}</p>
              <div className="catastrophe-modal__stats">
                <div className="catastrophe-modal__stat"><span>Срок в бункере</span><strong>{catastrophe.duration || catastrophe.bunkerDuration || "—"}</strong></div>
                <div className="catastrophe-modal__stat"><span>Выжившее население</span><strong>{catastrophe.population || catastrophe.populationLeft || "—"}</strong></div>
                <div className="catastrophe-modal__stat" style={{ gridColumn: "1/-1" }}><span>Угрозы / условия снаружи</span><strong>{catastrophe.extra || catastrophe.threats?.join(" · ") || catastrophe.surfaceCondition || "—"}</strong></div>
              </div>
              <button className="btn" onClick={() => setShowCatastrophe(false)}>Закрыть</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

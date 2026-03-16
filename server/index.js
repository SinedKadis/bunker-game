import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Хранилище комнат
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateBotName() {
  const names = ['Агент-7', 'НПС-Альфа', 'Симулянт', 'Бот-999', 'Призрак', 'Тень-X'];
  return names[Math.floor(Math.random() * names.length)] + '-' + Math.floor(Math.random() * 100);
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Создать комнату
  socket.on('create_room', ({ playerName }, callback) => {
    let code;
    do { code = generateRoomCode(); } while (rooms.has(code));

    const room = {
      code,
      hostId: socket.id,
      hostIsPlayer: true,
      players: [{
        id: socket.id,
        name: playerName,
        isHost: true,
        isBot: false,
        isReady: false,
        cards: null,
        revealedCards: [],
        votedFor: null,
        isExiled: false,
      }],
      maxPlayers: 8,
      bunkerSlots: 4,
      phase: 'lobby', // lobby | card_pick | discussion | voting | final
      discussionPhase: 1,
      currentTurn: null,
      turnOrder: [],
      cardPickOrder: [],
      currentCardPickIndex: 0,
      availableCards: [],
      disaster: null,
      bunkerItems: [],
      votes: {},
      voteTimer: null,
      settings: { hostIsPlayer: true },
    };

    rooms.set(code, room);
    socket.join(code);
    socket.roomCode = code;

    console.log(`Room created: ${code} by ${playerName}`);
    callback({ success: true, code, room: sanitizeRoom(room, socket.id) });
  });

  // Войти в комнату
  socket.on('join_room', ({ code, playerName }, callback) => {
    const room = rooms.get(code.toUpperCase());
    if (!room) return callback({ success: false, error: 'Комната не найдена' });
    if (room.phase !== 'lobby') return callback({ success: false, error: 'Игра уже началась' });
    if (room.players.length >= room.maxPlayers) return callback({ success: false, error: 'Комната заполнена' });

    const player = {
      id: socket.id,
      name: playerName,
      isHost: false,
      isBot: false,
      isReady: false,
      cards: null,
      revealedCards: [],
      votedFor: null,
      isExiled: false,
    };

    room.players.push(player);
    socket.join(code.toUpperCase());
    socket.roomCode = code.toUpperCase();

    io.to(code.toUpperCase()).emit('room_updated', sanitizeRoom(room, socket.id));
    callback({ success: true, code: code.toUpperCase(), room: sanitizeRoom(room, socket.id) });
  });

  // Обновить настройки лобби
  socket.on('update_settings', ({ maxPlayers, bunkerSlots, hostIsPlayer }) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.hostId !== socket.id) return;

    if (maxPlayers !== undefined) room.maxPlayers = Math.max(2, Math.min(16, maxPlayers));
    if (bunkerSlots !== undefined) room.bunkerSlots = Math.max(1, Math.min(room.maxPlayers - 1, bunkerSlots));
    if (hostIsPlayer !== undefined) {
      room.hostIsPlayer = hostIsPlayer;
      const host = room.players.find(p => p.id === socket.id);
      if (host) host.isHostPlayer = hostIsPlayer;
    }

    io.to(socket.roomCode).emit('room_updated', sanitizeRoom(room, socket.id));
  });

  // Добавить/удалить бота
  socket.on('add_bot', () => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length >= room.maxPlayers) return;

    const bot = {
      id: 'bot_' + Date.now(),
      name: generateBotName(),
      isHost: false,
      isBot: true,
      isReady: true,
      cards: null,
      revealedCards: [],
      votedFor: null,
      isExiled: false,
    };

    room.players.push(bot);
    io.to(socket.roomCode).emit('room_updated', sanitizeRoom(room, socket.id));
  });

  socket.on('remove_bot', ({ botId }) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.hostId !== socket.id) return;
    room.players = room.players.filter(p => p.id !== botId);
    io.to(socket.roomCode).emit('room_updated', sanitizeRoom(room, socket.id));
  });

  // Начать игру (переход к раздаче карточек)
  socket.on('start_game', ({ cards, disaster, bunkerItems }) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.hostId !== socket.id) return;

    room.phase = 'card_pick';
    room.availableCards = cards;
    room.disaster = disaster;
    room.bunkerItems = bunkerItems;

    // Генерируем очередь для выбора карточек
    const activePlayers = room.players.filter(p => p.isHostPlayer !== false || p.isBot || p.id !== room.hostId || room.hostIsPlayer);
    room.cardPickOrder = shuffleArray(activePlayers.map(p => p.id));
    room.currentCardPickIndex = 0;

    io.to(socket.roomCode).emit('game_started', {
      room: sanitizeRoom(room, socket.id),
      availableCards: cards,
      disaster,
      bunkerItems,
      cardPickOrder: room.cardPickOrder,
      currentPickerId: room.cardPickOrder[0],
    });
  });

  // Выбрать карточку
  socket.on('pick_card', ({ cardIndex }, callback) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.phase !== 'card_pick') return;

    const currentPickerId = room.cardPickOrder[room.currentCardPickIndex];
    if (currentPickerId !== socket.id) return callback?.({ success: false, error: 'Не ваша очередь' });

    const card = room.availableCards[cardIndex];
    if (!card || card.pickedBy) return callback?.({ success: false, error: 'Карточка недоступна' });

    // Назначить карточку игроку
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.cards = card;
      room.availableCards[cardIndex].pickedBy = socket.id;
    }

    room.currentCardPickIndex++;

    const nextPickerId = room.cardPickOrder[room.currentCardPickIndex] || null;

    io.to(socket.roomCode).emit('card_picked', {
      playerId: socket.id,
      cardIndex,
      nextPickerId,
      availableCards: room.availableCards.map(c => ({ ...c, data: c.pickedBy ? undefined : c.data })),
    });

    // Все выбрали — переход к обсуждению
    if (!nextPickerId) {
      // Генерируем очередь для обсуждения (другой порядок)
      room.turnOrder = shuffleArray(room.players.filter(p => !p.isExiled).map(p => p.id));
      room.currentTurn = room.turnOrder[0];
      room.discussionPhase = 1;
      room.phase = 'discussion';

      setTimeout(() => {
        io.to(socket.roomCode).emit('discussion_started', {
          turnOrder: room.turnOrder,
          currentTurn: room.currentTurn,
          phase: room.discussionPhase,
        });
      }, 1000);
    }

    callback?.({ success: true });
  });

  // Раскрыть характеристику
  socket.on('reveal_characteristic', ({ characteristicKey }, callback) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.phase !== 'discussion') return;
    if (room.currentTurn !== socket.id) return callback?.({ success: false, error: 'Не ваш ход' });

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.revealedCards.includes(characteristicKey)) return;

    // В фазе 1 можно раскрывать только профессию
    if (room.discussionPhase === 1 && characteristicKey !== 'profession') {
      return callback?.({ success: false, error: 'В первой фазе можно раскрыть только профессию' });
    }

    player.revealedCards.push(characteristicKey);

    io.to(socket.roomCode).emit('characteristic_revealed', {
      playerId: socket.id,
      characteristicKey,
      characteristicValue: player.cards[characteristicKey],
    });

    callback?.({ success: true });
  });

  // Завершить ход
  socket.on('end_turn', () => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.phase !== 'discussion') return;
    if (room.currentTurn !== socket.id && room.hostId !== socket.id) return;

    const activePlayers = room.players.filter(p => !p.isExiled);
    const currentIndex = room.turnOrder.indexOf(room.currentTurn);
    const nextIndex = (currentIndex + 1) % room.turnOrder.length;
    room.currentTurn = room.turnOrder[nextIndex];

    io.to(socket.roomCode).emit('turn_changed', {
      currentTurn: room.currentTurn,
      phase: room.discussionPhase,
    });
  });

  // Следующая фаза (хост)
  socket.on('next_phase', () => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.hostId !== socket.id) return;

    if (room.phase === 'discussion') {
      if (room.discussionPhase === 3 || room.discussionPhase === 7) {
        // Начать голосование
        startVoting(room);
      } else {
        room.discussionPhase++;
        room.currentTurn = room.turnOrder[0];
        io.to(socket.roomCode).emit('phase_changed', {
          discussionPhase: room.discussionPhase,
          currentTurn: room.currentTurn,
        });
      }
    } else if (room.phase === 'voting') {
      endVoting(room, true);
    }
  });

  // Проголосовать
  socket.on('vote', ({ targetId }) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.phase !== 'voting') return;

    const voter = room.players.find(p => p.id === socket.id);
    if (!voter || voter.isExiled || voter.votedFor) return;

    voter.votedFor = targetId;
    room.votes[socket.id] = targetId;

    // Проверяем, все ли проголосовали
    const activePlayers = room.players.filter(p => !p.isExiled && !p.isBot);
    const votedPlayers = activePlayers.filter(p => p.votedFor);

    io.to(socket.roomCode).emit('vote_cast', {
      voterId: socket.id,
      totalVoted: votedPlayers.length,
      totalPlayers: activePlayers.length,
    });

    if (votedPlayers.length === activePlayers.length) {
      endVoting(room, false);
    }
  });

  // Завершить игру
  socket.on('end_game', () => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.hostId !== socket.id) return;
    room.phase = 'final';
    io.to(socket.roomCode).emit('game_ended', { players: room.players, disaster: room.disaster });
  });

  // Отключение
  socket.on('disconnect', () => {
    const code = socket.roomCode;
    if (!code) return;

    const room = rooms.get(code);
    if (!room) return;

    if (room.hostId === socket.id) {
      // Хост ушёл — разрушаем комнату
      io.to(code).emit('room_destroyed', { reason: 'Хост покинул игру' });
      rooms.delete(code);
    } else {
      room.players = room.players.filter(p => p.id !== socket.id);
      io.to(code).emit('player_left', { playerId: socket.id, room: sanitizeRoom(room, null) });
    }
  });

  function startVoting(room) {
    room.phase = 'voting';
    room.votes = {};
    room.players.forEach(p => { p.votedFor = null; });

    io.to(room.code).emit('voting_started', {
      players: room.players.filter(p => !p.isExiled).map(p => ({ id: p.id, name: p.name })),
      duration: 120000, // 2 минуты
    });

    room.voteTimer = setTimeout(() => {
      endVoting(room, true);
    }, 120000);
  }

  function endVoting(room, timedOut) {
    if (room.voteTimer) {
      clearTimeout(room.voteTimer);
      room.voteTimer = null;
    }

    // Считаем голоса
    const voteCounts = {};
    room.players.filter(p => !p.isExiled).forEach(p => {
      if (p.votedFor) {
        voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
      }
    });

    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const leaders = Object.entries(voteCounts).filter(([, v]) => v === maxVotes).map(([k]) => k);

    if (leaders.length > 1 && !timedOut) {
      // Ничья — переголосование 1 минута
      room.players.forEach(p => { p.votedFor = null; });
      room.votes = {};
      io.to(room.code).emit('revote_started', { duration: 60000, tiedPlayers: leaders });
      room.voteTimer = setTimeout(() => endVoting(room, true), 60000);
      return;
    }

    // Изгоняем лидера голосования
    if (leaders.length === 1) {
      const exiledPlayer = room.players.find(p => p.id === leaders[0]);
      if (exiledPlayer) exiledPlayer.isExiled = true;
    }

    // Обновляем очередь
    room.turnOrder = room.turnOrder.filter(id => !room.players.find(p => p.id === id && p.isExiled));

    // После 3й фазы -> 4я, после 7й -> финал
    if (room.discussionPhase >= 7) {
      room.phase = 'final';
      io.to(room.code).emit('voting_ended', {
        voteCounts,
        exiledId: leaders[0] || null,
        timedOut,
        nextPhase: 'final',
        players: room.players,
        disaster: room.disaster,
      });
    } else {
      room.phase = 'discussion';
      room.discussionPhase = 4; // После первого голосования начинается 4-я фаза
      room.currentTurn = room.turnOrder[0];
      io.to(room.code).emit('voting_ended', {
        voteCounts,
        exiledId: leaders[0] || null,
        timedOut,
        nextPhase: 'discussion',
        discussionPhase: room.discussionPhase,
        currentTurn: room.currentTurn,
      });
    }
  }
});

function sanitizeRoom(room, viewerId) {
  return {
    code: room.code,
    hostId: room.hostId,
    hostIsPlayer: room.hostIsPlayer,
    phase: room.phase,
    discussionPhase: room.discussionPhase,
    currentTurn: room.currentTurn,
    turnOrder: room.turnOrder,
    cardPickOrder: room.cardPickOrder,
    currentCardPickIndex: room.currentCardPickIndex,
    maxPlayers: room.maxPlayers,
    bunkerSlots: room.bunkerSlots,
    disaster: room.disaster,
    bunkerItems: room.bunkerItems,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      isBot: p.isBot,
      isExiled: p.isExiled,
      hasCards: !!p.cards,
      revealedCards: p.revealedCards,
      // Своим — все карты, чужим — только раскрытые
      cards: p.id === viewerId ? p.cards : (
        p.cards ? Object.fromEntries(
          Object.entries(p.cards).filter(([k]) => p.revealedCards.includes(k))
        ) : null
      ),
    })),
  };
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Bunker server running on port ${PORT}`);
});

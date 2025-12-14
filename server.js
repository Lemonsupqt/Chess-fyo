const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store active games
const games = new Map();

// Dostoevsky quotes for game events
const quotes = {
  gameStart: [
    "The soul is healed by being with children... and chess.",
    "To go wrong in one's own way is better than to go right in someone else's.",
    "The darker the night, the brighter the stars.",
    "Man is what he believes.",
    "Taking a new step, uttering a new word, is what people fear most."
  ],
  capture: [
    "Pain and suffering are always inevitable for a large intelligence.",
    "The cleverest of all, in my opinion, is the man who calls himself a fool.",
    "To live without hope is to cease to live.",
    "What is hell? I maintain that it is the suffering of being unable to love.",
    "The soul has its torments."
  ],
  check: [
    "Power is given only to those who dare to lower themselves and pick it up.",
    "It takes something more than intelligence to act intelligently.",
    "The awful thing is that beauty is mysterious as well as terrible.",
    "Man only likes to count his troubles; he doesn't calculate his happiness.",
    "Right or wrong, it's very pleasant to break something from time to time."
  ],
  checkmate: [
    "To remain human, we must keep looking into the abyss.",
    "Nothing in this world is harder than speaking the truth.",
    "The mystery of human existence lies not in just staying alive, but in finding something to live for.",
    "Above all, don't lie to yourself.",
    "The degree of civilization in a society can be judged by entering its prisons."
  ],
  draw: [
    "Neither combatant emerged victorious, yet both gained wisdom.",
    "In abstraction, there is no tragedy.",
    "The more I love humanity in general, the less I love man in particular."
  ]
};

function getRandomQuote(category) {
  const categoryQuotes = quotes[category] || quotes.gameStart;
  return categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];
}

// Create a new game room
app.get('/api/create-game', (req, res) => {
  const gameId = uuidv4().substring(0, 8);
  games.set(gameId, {
    id: gameId,
    players: [],
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: [],
    status: 'waiting',
    createdAt: Date.now()
  });
  res.json({ gameId, quote: getRandomQuote('gameStart') });
});

// Get game state
app.get('/api/game/:gameId', (req, res) => {
  const game = games.get(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json(game);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A soul has connected:', socket.id);

  socket.on('join-game', ({ gameId, playerName }) => {
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found. Perhaps it exists only in memory.' });
      return;
    }

    // Check if player is rejoining
    const existingPlayer = game.players.find(p => p.name === playerName);
    if (existingPlayer) {
      existingPlayer.socketId = socket.id;
      socket.join(gameId);
      socket.emit('game-joined', {
        game,
        color: existingPlayer.color,
        quote: getRandomQuote('gameStart')
      });
      return;
    }

    // Assign color
    if (game.players.length >= 2) {
      socket.emit('error', { message: 'This game already has two players. You may only observe.' });
      socket.join(gameId);
      socket.emit('spectator-joined', { game });
      return;
    }

    const color = game.players.length === 0 ? 'white' : 'black';
    game.players.push({
      socketId: socket.id,
      name: playerName,
      color
    });

    socket.join(gameId);

    if (game.players.length === 2) {
      game.status = 'playing';
    }

    socket.emit('game-joined', {
      game,
      color,
      quote: getRandomQuote('gameStart')
    });

    // Notify other players
    socket.to(gameId).emit('player-joined', {
      playerName,
      color,
      game
    });

    console.log(`${playerName} joined game ${gameId} as ${color}`);
  });

  socket.on('make-move', ({ gameId, move, fen, isCapture, isCheck, isCheckmate, isDraw }) => {
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    game.fen = fen;
    game.moves.push(move);

    let quote = null;
    if (isCheckmate) {
      game.status = 'checkmate';
      quote = getRandomQuote('checkmate');
    } else if (isDraw) {
      game.status = 'draw';
      quote = getRandomQuote('draw');
    } else if (isCheck) {
      quote = getRandomQuote('check');
    } else if (isCapture) {
      quote = getRandomQuote('capture');
    }

    // Broadcast move to all players in the game
    io.to(gameId).emit('move-made', {
      move,
      fen,
      game,
      quote
    });
  });

  socket.on('offer-draw', ({ gameId }) => {
    socket.to(gameId).emit('draw-offered');
  });

  socket.on('accept-draw', ({ gameId }) => {
    const game = games.get(gameId);
    if (game) {
      game.status = 'draw';
      io.to(gameId).emit('game-draw', {
        quote: getRandomQuote('draw')
      });
    }
  });

  socket.on('resign', ({ gameId, color }) => {
    const game = games.get(gameId);
    if (game) {
      game.status = 'resigned';
      game.winner = color === 'white' ? 'black' : 'white';
      io.to(gameId).emit('player-resigned', {
        color,
        winner: game.winner,
        quote: getRandomQuote('checkmate')
      });
    }
  });

  socket.on('send-message', ({ gameId, message, playerName }) => {
    io.to(gameId).emit('chat-message', {
      message,
      playerName,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log('A soul has departed:', socket.id);
    // Find and notify games this player was in
    games.forEach((game, gameId) => {
      const player = game.players.find(p => p.socketId === socket.id);
      if (player) {
        socket.to(gameId).emit('player-disconnected', {
          playerName: player.name,
          color: player.color
        });
      }
    });
  });
});

// Clean up old games periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  games.forEach((game, gameId) => {
    if (now - game.createdAt > maxAge) {
      games.delete(gameId);
      console.log(`Cleaned up old game: ${gameId}`);
    }
  });
}, 60 * 60 * 1000); // Check every hour

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     "The soul is healed by being with children."             ║
║                          — Fyodor Dostoevsky                 ║
║                                                              ║
║     Dostoevsky Chess Server running on port ${PORT}            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

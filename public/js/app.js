/**
 * Dostoevsky Chess - Main Application
 * Handles game logic, socket communication, and UI
 */

class DostoevskyChess {
  constructor() {
    this.socket = io();
    this.game = null;
    this.board = null;
    this.gameId = null;
    this.playerColor = null;
    this.playerName = '';
    this.opponentName = '';
    
    this.screens = {
      home: document.getElementById('home-screen'),
      lobby: document.getElementById('lobby-screen'),
      game: document.getElementById('game-screen')
    };
    
    this.modals = {
      gameOver: document.getElementById('game-over-modal'),
      promotion: document.getElementById('promotion-modal'),
      draw: document.getElementById('draw-modal')
    };
    
    this.promotionResolve = null;
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.bindSocketEvents();
    this.checkUrlForGame();
  }
  
  bindEvents() {
    // Home screen buttons
    document.getElementById('create-game-btn').addEventListener('click', () => this.createGame());
    document.getElementById('join-game-btn').addEventListener('click', () => this.showJoinForm());
    document.getElementById('join-submit-btn').addEventListener('click', () => this.joinGameFromForm());
    document.getElementById('join-cancel-btn').addEventListener('click', () => this.hideJoinForm());
    
    // Join form enter key
    document.getElementById('join-game-id').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinGameFromForm();
    });
    
    // Lobby screen
    document.getElementById('copy-code-btn').addEventListener('click', () => this.copyGameCode());
    document.getElementById('copy-link-btn').addEventListener('click', () => this.copyShareLink());
    document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
    document.getElementById('player-name').addEventListener('input', (e) => {
      this.playerName = e.target.value;
      this.updateStartButton();
    });
    
    // Game controls
    document.getElementById('offer-draw-btn').addEventListener('click', () => this.offerDraw());
    document.getElementById('resign-btn').addEventListener('click', () => this.resign());
    
    // Chat
    document.getElementById('send-message-btn').addEventListener('click', () => this.sendMessage());
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
    document.getElementById('toggle-chat').addEventListener('click', () => this.toggleChat());
    
    // Promotion modal
    document.querySelectorAll('.promotion-piece').forEach(btn => {
      btn.addEventListener('click', () => {
        const piece = btn.dataset.piece;
        this.hideModal('promotion');
        if (this.promotionResolve) {
          this.promotionResolve(piece);
          this.promotionResolve = null;
        }
      });
    });
    
    // Draw modal
    document.getElementById('accept-draw-btn').addEventListener('click', () => this.acceptDraw());
    document.getElementById('decline-draw-btn').addEventListener('click', () => this.declineDraw());
    
    // Game over modal
    document.getElementById('new-game-btn').addEventListener('click', () => {
      this.hideModal('gameOver');
      this.showScreen('home');
    });
    document.getElementById('review-game-btn').addEventListener('click', () => {
      this.hideModal('gameOver');
    });
  }
  
  bindSocketEvents() {
    this.socket.on('game-joined', (data) => this.onGameJoined(data));
    this.socket.on('player-joined', (data) => this.onPlayerJoined(data));
    this.socket.on('spectator-joined', (data) => this.onSpectatorJoined(data));
    this.socket.on('move-made', (data) => this.onMoveMade(data));
    this.socket.on('draw-offered', () => this.onDrawOffered());
    this.socket.on('game-draw', (data) => this.onGameDraw(data));
    this.socket.on('player-resigned', (data) => this.onPlayerResigned(data));
    this.socket.on('player-disconnected', (data) => this.onPlayerDisconnected(data));
    this.socket.on('chat-message', (data) => this.onChatMessage(data));
    this.socket.on('error', (data) => this.onError(data));
  }
  
  checkUrlForGame() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    
    if (gameId) {
      this.gameId = gameId;
      this.showScreen('lobby');
      this.updateLobbyUI();
    }
  }
  
  // Screen management
  showScreen(screenName) {
    Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
    this.screens[screenName].classList.add('active');
  }
  
  showModal(modalName) {
    this.modals[modalName].classList.add('active');
  }
  
  hideModal(modalName) {
    this.modals[modalName].classList.remove('active');
  }
  
  // Home screen actions
  async createGame() {
    try {
      const response = await fetch('/api/create-game');
      const data = await response.json();
      
      this.gameId = data.gameId;
      this.updateHomeQuote(data.quote);
      this.showScreen('lobby');
      this.updateLobbyUI();
      
      // Update URL
      window.history.pushState({}, '', `?game=${this.gameId}`);
    } catch (error) {
      console.error('Failed to create game:', error);
      this.showError('Failed to create game. Please try again.');
    }
  }
  
  showJoinForm() {
    document.getElementById('join-form').style.display = 'flex';
    document.querySelector('.menu-buttons').style.display = 'none';
    document.getElementById('join-game-id').focus();
  }
  
  hideJoinForm() {
    document.getElementById('join-form').style.display = 'none';
    document.querySelector('.menu-buttons').style.display = 'flex';
  }
  
  joinGameFromForm() {
    const gameId = document.getElementById('join-game-id').value.trim();
    if (gameId) {
      this.gameId = gameId;
      window.history.pushState({}, '', `?game=${this.gameId}`);
      this.showScreen('lobby');
      this.updateLobbyUI();
    }
  }
  
  updateHomeQuote(quote) {
    const quoteEl = document.querySelector('.home-quote .quote-text');
    if (quoteEl && quote) {
      quoteEl.textContent = `"${quote}"`;
    }
  }
  
  // Lobby actions
  updateLobbyUI() {
    document.getElementById('game-code').textContent = this.gameId;
    document.getElementById('share-link').value = `${window.location.origin}?game=${this.gameId}`;
  }
  
  copyGameCode() {
    navigator.clipboard.writeText(this.gameId);
    this.showToast('Game code copied!');
  }
  
  copyShareLink() {
    const link = document.getElementById('share-link').value;
    navigator.clipboard.writeText(link);
    this.showToast('Link copied!');
  }
  
  updateStartButton() {
    const btn = document.getElementById('start-game-btn');
    btn.disabled = !this.playerName.trim();
  }
  
  startGame() {
    if (!this.playerName.trim()) {
      document.getElementById('player-name').classList.add('shake');
      setTimeout(() => document.getElementById('player-name').classList.remove('shake'), 300);
      return;
    }
    
    this.socket.emit('join-game', {
      gameId: this.gameId,
      playerName: this.playerName
    });
  }
  
  // Socket event handlers
  onGameJoined(data) {
    this.playerColor = data.color;
    this.game = new Chess(data.game.fen);
    
    // Initialize board
    this.initializeBoard();
    
    // Update UI
    this.showScreen('game');
    this.updatePlayerInfo();
    this.updateGameStatus();
    this.showQuote(data.quote);
    
    // If both players are present, game is ready
    if (data.game.players.length === 2) {
      const opponent = data.game.players.find(p => p.color !== this.playerColor);
      if (opponent) {
        this.opponentName = opponent.name;
        this.updateOpponentInfo();
      }
    }
    
    // Replay moves if any
    if (data.game.moves && data.game.moves.length > 0) {
      this.replayMoves(data.game.moves);
    }
    
    this.addSystemMessage(`You joined as ${this.playerColor}.`);
  }
  
  onPlayerJoined(data) {
    if (data.color !== this.playerColor) {
      this.opponentName = data.playerName;
      this.updateOpponentInfo();
      this.addSystemMessage(`${data.playerName} has joined the game.`);
    }
    this.updateGameStatus();
  }
  
  onSpectatorJoined(data) {
    this.addSystemMessage('You are spectating this game.');
    this.game = new Chess(data.game.fen);
    this.initializeBoard();
    this.showScreen('game');
    
    // Spectators can't make moves
    this.board.setPlayerTurn(false, 'white');
  }
  
  onMoveMade(data) {
    // Update local game state
    this.game.load(data.fen);
    this.board.setGame(this.game);
    this.board.setLastMove(data.move);
    
    // Update UI
    this.updateGameStatus();
    this.addMoveToHistory(data.move);
    this.updateCapturedPieces();
    
    // Show quote if any
    if (data.quote) {
      this.showQuote(data.quote);
    }
    
    // Check for game end
    if (data.game.status === 'checkmate') {
      const winner = this.game.turn() === 'w' ? 'Black' : 'White';
      this.showGameOver('Checkmate!', `${winner} wins!`, data.quote);
    } else if (data.game.status === 'draw') {
      this.showGameOver('Draw', 'The game is a draw.', data.quote);
    }
    
    // Update turn
    this.updateTurn();
  }
  
  onDrawOffered() {
    this.showModal('draw');
  }
  
  onGameDraw(data) {
    this.showGameOver('Draw', 'Both players agreed to a draw.', data.quote);
  }
  
  onPlayerResigned(data) {
    const winnerColor = data.winner.charAt(0).toUpperCase() + data.winner.slice(1);
    this.showGameOver('Resignation', `${winnerColor} wins by resignation.`, data.quote);
  }
  
  onPlayerDisconnected(data) {
    this.addSystemMessage(`${data.playerName} has disconnected.`);
  }
  
  onChatMessage(data) {
    this.addChatMessage(data.playerName, data.message);
  }
  
  onError(data) {
    console.error('Socket error:', data.message);
    this.showError(data.message);
  }
  
  // Board initialization
  initializeBoard() {
    this.board = new ChessBoard('chess-board', {
      orientation: this.playerColor,
      onMove: (move) => this.handleMove(move),
      onPromotion: () => this.promptPromotion()
    });
    
    this.board.setGame(this.game);
    this.board.setOrientation(this.playerColor);
    this.updateTurn();
  }
  
  updateTurn() {
    const currentTurn = this.game.turn() === 'w' ? 'white' : 'black';
    const isPlayerTurn = currentTurn === this.playerColor;
    
    this.board.setPlayerTurn(isPlayerTurn, this.playerColor);
    
    // Update turn indicator
    const turnIndicator = document.getElementById('turn-indicator');
    const turnPiece = turnIndicator.querySelector('.turn-piece');
    const turnText = turnIndicator.querySelector('.turn-text');
    
    turnPiece.textContent = currentTurn === 'white' ? '♔' : '♚';
    turnText.textContent = isPlayerTurn ? 'Your turn' : `${this.opponentName || 'Opponent'}'s turn`;
    
    // Visual feedback
    turnIndicator.style.color = isPlayerTurn ? 'var(--accent-gold)' : 'var(--text-muted)';
  }
  
  handleMove(move) {
    this.socket.emit('make-move', {
      gameId: this.gameId,
      move: move,
      fen: this.game.fen(),
      isCapture: move.captured,
      isCheck: this.game.isCheck(),
      isCheckmate: this.game.isCheckmate(),
      isDraw: this.game.isDraw()
    });
  }
  
  promptPromotion() {
    return new Promise((resolve) => {
      this.promotionResolve = resolve;
      
      // Update promotion pieces color
      const isWhite = this.playerColor === 'white';
      const pieces = { q: '♕', r: '♖', b: '♗', n: '♘' };
      const piecesBlack = { q: '♛', r: '♜', b: '♝', n: '♞' };
      
      document.querySelectorAll('.promotion-piece').forEach(btn => {
        btn.textContent = isWhite ? pieces[btn.dataset.piece] : piecesBlack[btn.dataset.piece];
      });
      
      this.showModal('promotion');
    });
  }
  
  replayMoves(moves) {
    moves.forEach(move => {
      this.addMoveToHistory(move);
    });
    this.board.setGame(this.game);
    if (moves.length > 0) {
      this.board.setLastMove(moves[moves.length - 1]);
    }
    this.updateCapturedPieces();
  }
  
  // UI Updates
  updatePlayerInfo() {
    document.getElementById('self-name').textContent = this.playerName;
    document.getElementById('self-color').textContent = this.playerColor.charAt(0).toUpperCase() + this.playerColor.slice(1);
    
    const selfAvatar = document.querySelector('.self-avatar');
    selfAvatar.textContent = this.playerColor === 'white' ? '♔' : '♚';
  }
  
  updateOpponentInfo() {
    const opponentColor = this.playerColor === 'white' ? 'black' : 'white';
    document.getElementById('opponent-name').textContent = this.opponentName || 'Awaiting...';
    document.getElementById('opponent-color').textContent = opponentColor.charAt(0).toUpperCase() + opponentColor.slice(1);
    
    const opponentAvatar = document.querySelector('.opponent-avatar');
    opponentAvatar.textContent = opponentColor === 'white' ? '♔' : '♚';
  }
  
  updateGameStatus() {
    const status = document.getElementById('game-status');
    
    if (this.game.isCheckmate()) {
      status.textContent = 'CHECKMATE';
    } else if (this.game.isDraw()) {
      status.textContent = 'DRAW';
    } else if (this.game.isCheck()) {
      status.textContent = 'CHECK';
    } else {
      status.textContent = '';
    }
  }
  
  updateCapturedPieces() {
    if (!this.board) return;
    
    const selfColor = this.playerColor;
    const opponentColor = this.playerColor === 'white' ? 'black' : 'white';
    
    // Self captured shows pieces the player has captured (opponent's pieces)
    this.board.displayCapturedPieces('self-captured', opponentColor);
    // Opponent captured shows pieces the opponent has captured (player's pieces)
    this.board.displayCapturedPieces('opponent-captured', selfColor);
  }
  
  addMoveToHistory(move) {
    const history = document.getElementById('move-history');
    const moveNumber = Math.ceil(this.game.history().length / 2);
    const isWhiteMove = this.game.history().length % 2 === 1;
    
    if (isWhiteMove) {
      // Create new row for white's move
      const row = document.createElement('div');
      row.className = 'move-row';
      row.innerHTML = `
        <span class="move-number">${moveNumber}.</span>
        <span class="move-white">${move.san}</span>
        <span class="move-black"></span>
      `;
      history.appendChild(row);
    } else {
      // Add black's move to existing row
      const lastRow = history.querySelector('.move-row:last-child');
      if (lastRow) {
        lastRow.querySelector('.move-black').textContent = move.san;
      }
    }
    
    // Scroll to bottom
    history.scrollTop = history.scrollHeight;
  }
  
  showQuote(quote) {
    if (!quote) return;
    
    const quoteDisplay = document.querySelector('#game-quote .quote-text');
    quoteDisplay.style.opacity = '0';
    
    setTimeout(() => {
      quoteDisplay.textContent = `"${quote}"`;
      quoteDisplay.style.opacity = '1';
    }, 300);
  }
  
  // Game actions
  offerDraw() {
    this.socket.emit('offer-draw', { gameId: this.gameId });
    this.addSystemMessage('You offered a draw.');
  }
  
  acceptDraw() {
    this.hideModal('draw');
    this.socket.emit('accept-draw', { gameId: this.gameId });
  }
  
  declineDraw() {
    this.hideModal('draw');
    this.addSystemMessage('Draw offer declined.');
  }
  
  resign() {
    if (confirm('Are you sure you want to resign?')) {
      this.socket.emit('resign', {
        gameId: this.gameId,
        color: this.playerColor
      });
    }
  }
  
  // Chat
  sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (message) {
      this.socket.emit('send-message', {
        gameId: this.gameId,
        message,
        playerName: this.playerName
      });
      input.value = '';
    }
  }
  
  addChatMessage(sender, message) {
    const messages = document.getElementById('chat-messages');
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message';
    msgEl.innerHTML = `<span class="sender">${sender}:</span> <span class="text">${this.escapeHtml(message)}</span>`;
    messages.appendChild(msgEl);
    messages.scrollTop = messages.scrollHeight;
  }
  
  addSystemMessage(message) {
    const messages = document.getElementById('chat-messages');
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message system';
    msgEl.textContent = message;
    messages.appendChild(msgEl);
    messages.scrollTop = messages.scrollHeight;
  }
  
  toggleChat() {
    const chatPanel = document.getElementById('chat-panel');
    const toggleBtn = document.getElementById('toggle-chat');
    
    chatPanel.classList.toggle('minimized');
    toggleBtn.textContent = chatPanel.classList.contains('minimized') ? '+' : '−';
  }
  
  // Modals
  showGameOver(title, result, quote) {
    document.getElementById('game-over-title').textContent = title;
    document.getElementById('game-over-result').textContent = result;
    document.getElementById('game-over-quote').textContent = quote ? `"${quote}"` : '';
    this.showModal('gameOver');
  }
  
  // Utilities
  showError(message) {
    // Could implement a toast notification system
    alert(message);
  }
  
  showToast(message) {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-medium);
      color: var(--text-primary);
      padding: 12px 24px;
      border: 1px solid var(--accent-gold);
      z-index: 2000;
      animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new DostoevskyChess();
});

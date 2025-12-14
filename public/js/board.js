/**
 * Dostoevsky Chess - Board Renderer
 * Renders the chess board and handles piece interactions
 */

class ChessBoard {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.orientation = options.orientation || 'white';
    this.onMove = options.onMove || (() => {});
    this.onPromotion = options.onPromotion || (() => Promise.resolve('q'));
    
    this.selectedSquare = null;
    this.legalMoves = [];
    this.lastMove = null;
    this.game = null;
    this.isPlayerTurn = false;
    this.playerColor = 'white';
    
    // Piece Unicode symbols
    this.pieceSymbols = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };
    
    this.init();
  }
  
  init() {
    this.container.innerHTML = '';
    this.createSquares();
  }
  
  createSquares() {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        const isLight = (row + col) % 2 === 0;
        
        // Calculate actual position based on orientation
        const actualRow = this.orientation === 'white' ? row : 7 - row;
        const actualCol = this.orientation === 'white' ? col : 7 - col;
        const position = this.getPositionFromCoords(actualRow, actualCol);
        
        square.className = `square ${isLight ? 'light' : 'dark'}`;
        square.dataset.position = position;
        
        square.addEventListener('click', () => this.handleSquareClick(position));
        
        this.container.appendChild(square);
      }
    }
  }
  
  getPositionFromCoords(row, col) {
    const files = 'abcdefgh';
    const ranks = '87654321';
    return files[col] + ranks[row];
  }
  
  getCoordsFromPosition(position) {
    const files = 'abcdefgh';
    const ranks = '87654321';
    const col = files.indexOf(position[0]);
    const row = ranks.indexOf(position[1]);
    return { row, col };
  }
  
  setGame(game) {
    this.game = game;
    this.render();
  }
  
  setOrientation(color) {
    this.orientation = color;
    this.init();
    this.render();
    this.updateLabels();
  }
  
  updateLabels() {
    const fileLabels = document.querySelector('.file-labels');
    const rankLabels = document.querySelector('.rank-labels');
    
    if (fileLabels) {
      const files = this.orientation === 'white' ? 'abcdefgh' : 'hgfedcba';
      fileLabels.innerHTML = files.split('').map(f => `<span>${f}</span>`).join('');
    }
    
    if (rankLabels) {
      const ranks = this.orientation === 'white' ? '87654321' : '12345678';
      rankLabels.innerHTML = ranks.split('').map(r => `<span>${r}</span>`).join('');
    }
  }
  
  setPlayerTurn(isPlayerTurn, playerColor) {
    this.isPlayerTurn = isPlayerTurn;
    this.playerColor = playerColor;
  }
  
  render() {
    if (!this.game) return;
    
    const board = this.game.board();
    
    // Clear all squares
    this.container.querySelectorAll('.square').forEach(square => {
      square.innerHTML = '';
      square.classList.remove('selected', 'legal-move', 'legal-capture', 'last-move', 'check');
    });
    
    // Place pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const position = this.getPositionFromCoords(row, col);
          this.placePiece(position, piece);
        }
      }
    }
    
    // Highlight last move
    if (this.lastMove) {
      this.highlightSquare(this.lastMove.from, 'last-move');
      this.highlightSquare(this.lastMove.to, 'last-move');
    }
    
    // Highlight check
    if (this.game.isCheck()) {
      const turn = this.game.turn();
      const kingSquare = this.findKing(turn);
      if (kingSquare) {
        this.highlightSquare(kingSquare, 'check');
      }
    }
  }
  
  placePiece(position, piece) {
    const square = this.container.querySelector(`[data-position="${position}"]`);
    if (!square) return;
    
    const pieceKey = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
    const symbol = this.pieceSymbols[pieceKey];
    
    const pieceElement = document.createElement('span');
    pieceElement.className = `piece ${piece.color === 'w' ? 'white' : 'black'}`;
    pieceElement.textContent = symbol;
    pieceElement.draggable = true;
    
    // Drag events
    pieceElement.addEventListener('dragstart', (e) => this.handleDragStart(e, position));
    pieceElement.addEventListener('dragend', (e) => this.handleDragEnd(e));
    
    square.appendChild(pieceElement);
    
    // Drop events on square
    square.addEventListener('dragover', (e) => e.preventDefault());
    square.addEventListener('drop', (e) => this.handleDrop(e, position));
  }
  
  handleSquareClick(position) {
    if (!this.game || !this.isPlayerTurn) return;
    
    const piece = this.game.get(position);
    
    // If a square is already selected
    if (this.selectedSquare) {
      // Try to make a move
      if (this.legalMoves.includes(position)) {
        this.tryMove(this.selectedSquare, position);
      }
      // Deselect
      this.clearSelection();
      
      // If clicked on own piece, select it
      if (piece && piece.color === this.playerColor[0]) {
        this.selectSquare(position);
      }
    } else {
      // Select piece if it belongs to player
      if (piece && piece.color === this.playerColor[0]) {
        this.selectSquare(position);
      }
    }
  }
  
  selectSquare(position) {
    this.selectedSquare = position;
    this.highlightSquare(position, 'selected');
    
    // Get and show legal moves
    const moves = this.game.moves({ square: position, verbose: true });
    this.legalMoves = moves.map(m => m.to);
    
    moves.forEach(move => {
      const targetPiece = this.game.get(move.to);
      if (targetPiece || move.flags.includes('e')) {
        this.highlightSquare(move.to, 'legal-capture');
      } else {
        this.highlightSquare(move.to, 'legal-move');
      }
    });
  }
  
  clearSelection() {
    this.selectedSquare = null;
    this.legalMoves = [];
    
    this.container.querySelectorAll('.square').forEach(square => {
      square.classList.remove('selected', 'legal-move', 'legal-capture');
    });
  }
  
  highlightSquare(position, className) {
    const square = this.container.querySelector(`[data-position="${position}"]`);
    if (square) {
      square.classList.add(className);
    }
  }
  
  findKing(color) {
    const board = this.game.board();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'k' && piece.color === color) {
          return this.getPositionFromCoords(row, col);
        }
      }
    }
    return null;
  }
  
  async tryMove(from, to) {
    // Check for promotion
    const piece = this.game.get(from);
    const isPromotion = piece && piece.type === 'p' && 
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));
    
    let promotion = null;
    if (isPromotion) {
      promotion = await this.onPromotion();
    }
    
    const move = {
      from,
      to,
      promotion
    };
    
    try {
      const result = this.game.move(move);
      if (result) {
        this.lastMove = { from, to };
        this.render();
        this.onMove(result);
      }
    } catch (e) {
      console.error('Invalid move:', e);
    }
  }
  
  // Drag and drop handlers
  handleDragStart(e, position) {
    if (!this.isPlayerTurn) {
      e.preventDefault();
      return;
    }
    
    const piece = this.game.get(position);
    if (!piece || piece.color !== this.playerColor[0]) {
      e.preventDefault();
      return;
    }
    
    e.target.classList.add('dragging');
    this.selectSquare(position);
    
    // Set drag data
    e.dataTransfer.setData('text/plain', position);
    e.dataTransfer.effectAllowed = 'move';
  }
  
  handleDragEnd(e) {
    e.target.classList.remove('dragging');
  }
  
  handleDrop(e, position) {
    e.preventDefault();
    const from = e.dataTransfer.getData('text/plain');
    
    if (from && this.legalMoves.includes(position)) {
      this.tryMove(from, position);
    }
    
    this.clearSelection();
  }
  
  setLastMove(move) {
    if (move) {
      this.lastMove = { from: move.from, to: move.to };
    }
    this.render();
  }
  
  // Get captured pieces
  getCapturedPieces(color) {
    if (!this.game) return [];
    
    const history = this.game.history({ verbose: true });
    const captured = [];
    
    history.forEach(move => {
      if (move.captured) {
        // Captured piece belongs to the opposite color of who moved
        const capturedColor = move.color === 'w' ? 'b' : 'w';
        if ((color === 'white' && capturedColor === 'w') || 
            (color === 'black' && capturedColor === 'b')) {
          captured.push({
            type: move.captured,
            color: capturedColor
          });
        }
      }
    });
    
    return captured;
  }
  
  displayCapturedPieces(elementId, color) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const captured = this.getCapturedPieces(color);
    const symbols = captured.map(p => {
      const key = p.color === 'w' ? p.type.toUpperCase() : p.type.toLowerCase();
      return `<span class="captured-piece ${p.color === 'w' ? 'white' : 'black'}">${this.pieceSymbols[key]}</span>`;
    });
    
    element.innerHTML = symbols.join('');
  }
}

// Export for use in app.js
window.ChessBoard = ChessBoard;

# ♔ Dostoevsky Chess — A Game of Souls

> *"The soul is healed by being with children."* — Fyodor Dostoevsky

A beautiful multiplayer chess web application inspired by the dark, philosophical themes of Fyodor Dostoevsky's literary works. Play chess with friends while immersing yourself in the atmospheric world of 19th-century Russian literature.

![Dostoevsky Chess](https://img.shields.io/badge/Chess-Multiplayer-gold?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

## ✨ Features

### 🎮 Gameplay
- **Real-time Multiplayer** — Play with friends in real-time using WebSockets
- **Shareable Game Links** — Create a game and share the link instantly
- **Full Chess Rules** — All standard chess rules including castling, en passant, and promotion
- **Move History** — Chronicle of all moves in algebraic notation
- **Captured Pieces** — Track pieces captured by each player

### 🎨 Dostoevsky Theme
- **Dark, Moody Aesthetic** — Colors inspired by 19th-century Russian literature
- **Literary Quotes** — Famous Dostoevsky quotes appear during gameplay
- **Atmospheric Design** — Fog effects, elegant typography, and ornamental elements
- **Victorian Typography** — Cinzel, Cormorant Garamond, and IM Fell English fonts

### 💬 Social Features
- **In-game Chat** — Correspond with your opponent during the match
- **Draw Offers** — Propose a draw to your opponent
- **Resignation** — Gracefully concede when defeat is inevitable

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone or navigate to the repository**
   ```bash
   cd dostoevsky-chess
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

### Playing with Friends

1. Click **"Create New Game"** to start a new game
2. Copy the **game code** or **shareable link**
3. Send the link to your friend
4. Enter your names and begin the match!

## 🎭 Literary Atmosphere

The application features quotes from Dostoevsky's greatest works:

- **Game Start**: Inspirational quotes to begin your intellectual duel
- **Piece Captures**: Reflections on pain, suffering, and intelligence
- **Check**: Quotes about power and danger
- **Checkmate**: Profound thoughts on existence and truth
- **Draw**: Philosophical musings on equality and humanity

> *"To go wrong in one's own way is better than to go right in someone else's."*

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Real-time**: Socket.io
- **Chess Logic**: chess.js
- **Frontend**: Vanilla JavaScript, CSS3
- **Fonts**: Google Fonts (Cinzel, Cormorant Garamond, IM Fell English)

## 📁 Project Structure

```
dostoevsky-chess/
├── server.js           # Express + Socket.io server
├── package.json        # Dependencies and scripts
├── public/
│   ├── index.html      # Main HTML file
│   ├── css/
│   │   └── style.css   # Dostoevsky-themed styles
│   └── js/
│       ├── app.js      # Main application logic
│       └── board.js    # Chess board renderer
└── README.md
```

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Darkest | `#0a0908` | Background |
| Gold | `#c9a227` | Accents, highlights |
| Burgundy | `#4a1c1c` | Danger elements |
| Text Primary | `#e8dcc8` | Main text |
| Board Light | `#d4c4a8` | Light squares |
| Board Dark | `#6b5344` | Dark squares |

## 🎮 Game Controls

| Action | Description |
|--------|-------------|
| Click piece | Select a piece to move |
| Click square | Move selected piece |
| Drag & Drop | Alternative move method |
| Offer Draw | Propose a draw to opponent |
| Resign | Concede the game |

## 🔧 Configuration

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/create-game` | GET | Create a new game room |
| `/api/game/:gameId` | GET | Get game state |

## 🔌 Socket Events

### Client → Server
- `join-game` — Join a game room
- `make-move` — Send a chess move
- `offer-draw` — Offer a draw
- `accept-draw` — Accept a draw offer
- `resign` — Resign from the game
- `send-message` — Send a chat message

### Server → Client
- `game-joined` — Confirmation of joining
- `player-joined` — Another player joined
- `move-made` — A move was made
- `draw-offered` — Draw offer received
- `game-draw` — Game ended in draw
- `player-resigned` — Player resigned
- `chat-message` — Chat message received

## 🌟 Inspiration

This project draws inspiration from:

- **Crime and Punishment** — The psychological depth of the interface
- **The Brothers Karamazov** — The philosophical quotes
- **Notes from Underground** — The dark, introspective atmosphere
- **The Idiot** — The elegant, refined aesthetic

## 📜 License

MIT License — Feel free to use, modify, and share.

---

> *"The darker the night, the brighter the stars. The deeper the grief, the closer is God."*
> 
> — Fyodor Dostoevsky

---

Made with ♔ and literary passion

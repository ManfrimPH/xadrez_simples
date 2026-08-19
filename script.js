const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset');

const PIECES = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

const PIECE_NAMES = {
  K: 'Rei', Q: 'Rainha', R: 'Torre', B: 'Bispo', N: 'Cavalo', P: 'Peão'
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

let board = [];
let currentPlayer = 'w';
let selected = null;
let legalMoves = [];
let lastMove = null;
let gameOver = false;

function initBoard() {
  board = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ];
}

function findKing(color) {
  const king = color === 'w' ? 'K' : 'k';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === king) return { r, c };
    }
  }
  return null;
}

function isInBoard(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getPseudoMoves(r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  const color = piece === piece.toUpperCase() ? 'w' : 'b';
  const moves = [];
  const type = piece.toUpperCase();

  const add = (tr, tc) => {
    if (isInBoard(tr, tc)) {
      const target = board[tr][tc];
      if (!target) moves.push({ r: tr, c: tc });
      else if (getColor(target) !== color) moves.push({ r: tr, c: tc });
    }
  };

  switch (type) {
    case 'P': {
      const dir = color === 'w' ? -1 : 1;
      const start = color === 'w' ? 6 : 1;
      if (isInBoard(r + dir, c) && !board[r + dir][c]) {
        moves.push({ r: r + dir, c });
        if (r === start && !board[r + 2 * dir][c]) moves.push({ r: r + 2 * dir, c });
      }
      for (const dc of [-1, 1]) {
        if (isInBoard(r + dir, c + dc) && board[r + dir][c + dc] && getColor(board[r + dir][c + dc]) !== color) {
          moves.push({ r: r + dir, c: c + dc });
        }
      }
      break;
    }
    case 'N': {
      const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr, dc] of jumps) add(r + dr, c + dc);
      break;
    }
    case 'B': {
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        let tr = r + dr, tc = c + dc;
        while (isInBoard(tr, tc) && !board[tr][tc]) { moves.push({ r: tr, c: tc }); tr += dr; tc += dc; }
        add(tr, tc);
      }
      break;
    }
    case 'R': {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        let tr = r + dr, tc = c + dc;
        while (isInBoard(tr, tc) && !board[tr][tc]) { moves.push({ r: tr, c: tc }); tr += dr; tc += dc; }
        add(tr, tc);
      }
      break;
    }
    case 'Q': {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        let tr = r + dr, tc = c + dc;
        while (isInBoard(tr, tc) && !board[tr][tc]) { moves.push({ r: tr, c: tc }); tr += dr; tc += dc; }
        add(tr, tc);
      }
      break;
    }
    case 'K': {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(r + dr, c + dc);
      break;
    }
  }
  return moves;
}

function getColor(piece) {
  return piece === piece.toUpperCase() ? 'w' : 'b';
}

function isSquareAttacked(r, c, byColor) {
  for (let tr = 0; tr < 8; tr++) {
    for (let tc = 0; tc < 8; tc++) {
      const p = board[tr][tc];
      if (!p || getColor(p) !== byColor) continue;
      const moves = getPseudoMoves(tr, tc);
      if (moves.some(m => m.r === r && m.c === c)) return true;
    }
  }
  return false;
}

function simulateMove(from, to) {
  const piece = board[from.r][from.c];
  const captured = board[to.r][to.c];
  board[to.r][to.c] = piece;
  board[from.r][from.c] = null;
  if (piece.toUpperCase() === 'P' && (to.r === 0 || to.r === 7)) {
    board[to.r][to.c] = piece === piece.toUpperCase() ? 'Q' : 'q';
  }
  return captured;
}

function getLegalMoves(r, c) {
  const piece = board[r][c];
  if (!piece || getColor(piece) !== currentPlayer) return [];
  const pseudo = getPseudoMoves(r, c);
  const legal = [];
  for (const m of pseudo) {
    const captured = simulateMove({ r, c }, m);
    const king = findKing(currentPlayer);
    const inCheck = king ? isSquareAttacked(king.r, king.c, currentPlayer === 'w' ? 'b' : 'w') : true;
    board[r][c] = piece;
    board[m.r][m.c] = captured;
    if (!inCheck) legal.push(m);
  }
  return legal;
}

function hasAnyLegalMove(color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || getColor(p) !== color) continue;
      if (getLegalMoves(r, c).length > 0) return true;
    }
  }
  return false;
}

function isInCheck(color) {
  const king = findKing(color);
  if (!king) return false;
  return isSquareAttacked(king.r, king.c, color === 'w' ? 'b' : 'w');
}

function render() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = document.createElement('div');
      square.className = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
      square.dataset.r = r;
      square.dataset.c = c;

      if (lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c))) {
        square.classList.add('last-move');
      }
      if (selected && selected.r === r && selected.c === c) {
        square.classList.add('selected');
      }
      if (legalMoves.some(m => m.r === r && m.c === c)) {
        square.classList.add(board[r][c] ? 'capture' : 'possible');
      }
      const king = findKing(currentPlayer);
      if (king && king.r === r && king.c === c && isInCheck(currentPlayer) && !gameOver) {
        square.classList.add('check');
      }

      const piece = board[r][c];
      if (piece) {
        square.textContent = PIECES[piece];
        square.title = PIECE_NAMES[piece.toUpperCase()];
      }
      square.addEventListener('click', () => handleClick(r, c));
      boardEl.appendChild(square);
    }
  }
}

function handleClick(r, c) {
  if (gameOver) return;

  if (selected && legalMoves.some(m => m.r === r && m.c === c)) {
    lastMove = { from: selected, to: { r, c } };
    const movingPiece = board[selected.r][selected.c];
    board[selected.r][selected.c] = null;
    board[r][c] = movingPiece;
    if (movingPiece.toUpperCase() === 'P' && (r === 0 || r === 7)) {
      board[r][c] = movingPiece === movingPiece.toUpperCase() ? 'Q' : 'q';
    }
    currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
    selected = null;
    legalMoves = [];
    updateStatus();
    render();
    return;
  }

  const piece = board[r][c];
  if (piece && getColor(piece) === currentPlayer) {
    selected = { r, c };
    legalMoves = getLegalMoves(r, c);
  } else {
    selected = null;
    legalMoves = [];
  }
  render();
}

function updateStatus() {
  const inCheck = isInCheck(currentPlayer);
  const hasMoves = hasAnyLegalMove(currentPlayer);

  if (!hasMoves) {
    gameOver = true;
    if (inCheck) {
      const winner = currentPlayer === 'w' ? 'Pretas venceram' : 'Brancas venceram';
      statusEl.textContent = `Xeque-mate! ${winner}!`;
    } else {
      statusEl.textContent = 'Empate por afogamento (stalemate)!';
    }
    return;
  }
  if (inCheck) {
    statusEl.textContent = `Xeque! Vez das ${currentPlayer === 'w' ? 'Brancas' : 'Pretas'}`;
  } else {
    statusEl.textContent = `Vez das ${currentPlayer === 'w' ? 'Brancas' : 'Pretas'}`;
  }
}

function resetGame() {
  initBoard();
  currentPlayer = 'w';
  selected = null;
  legalMoves = [];
  lastMove = null;
  gameOver = false;
  updateStatus();
  render();
}

resetBtn.addEventListener('click', resetGame);
resetGame();
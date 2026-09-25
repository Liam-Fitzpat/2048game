/**
 * Browser UI for 2048: rendering, keyboard/touch input, score, undo.
 * All game rules come from Game2048 (src/game.js).
 */
(function () {
  const G = window.Game2048;
  const boardEl = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const messageEl = document.getElementById("message");
  const messageText = document.getElementById("message-text");
  const keepGoingBtn = document.getElementById("keep-going");
  const undoBtn = document.getElementById("undo");

  const state = { board: null, score: 0, best: 0, history: [], won: false, keepPlaying: false };

  // Best score survives page reloads; storage can be unavailable, so guard it.
  function loadBest() {
    try { return Number(localStorage.getItem("best-2048")) || 0; } catch { return 0; }
  }
  function saveBest(value) {
    try { localStorage.setItem("best-2048", String(value)); } catch { /* ignore */ }
  }

  function start() {
    state.board = G.newGame();
    state.score = 0;
    state.history = [];
    state.won = false;
    state.keepPlaying = false;
    hideMessage();
    render();
  }

  // How long the slide takes, in ms. Must match --slide-time in style.css.
  const SLIDE_MS = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 110;
  let animating = false;

  // The board has two layers: 16 fixed background cells, and a layer of
  // tiles on top that can move freely between cell positions.
  boardEl.innerHTML = "";
  for (let i = 0; i < G.SIZE * G.SIZE; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    boardEl.appendChild(cell);
  }
  const tileLayer = document.createElement("div");
  tileLayer.className = "tile-layer";
  boardEl.appendChild(tileLayer);

  function placeTile(el, r, c) {
    el.style.setProperty("--r", r);
    el.style.setProperty("--c", c);
  }

  // Redraw every tile from the board. Used after each slide finishes,
  // on undo, and at the start of a new game.
  function render(newTile = null, mergedCells = []) {
    tileLayer.innerHTML = "";
    state.board.forEach((row, r) => {
      row.forEach((value, c) => {
        if (!value) return;
        const tile = document.createElement("div");
        tile.className = `tile tile-${value > 2048 ? "super" : value}`;
        tile.dataset.pos = `${r},${c}`;
        tile.textContent = value;
        placeTile(tile, r, c);
        if (newTile && newTile[0] === r && newTile[1] === c) tile.classList.add("tile-new");
        if (mergedCells.some(([mr, mc]) => mr === r && mc === c)) tile.classList.add("tile-merged");
        tileLayer.appendChild(tile);
      });
    });
    scoreEl.textContent = state.score;
    bestEl.textContent = state.best;
    undoBtn.disabled = state.history.length === 0;
  }

  function handleMove(direction) {
    if (!messageEl.hidden || animating) return;
    const result = G.trackMove(state.board, direction);
    if (!result.moved) return;

    state.history.push({ board: state.board, score: state.score });
    if (state.history.length > 20) state.history.shift();

    // Step 1: slide each tile on screen to its new cell. CSS animates the change.
    result.movements.forEach(({ from, to }) => {
      const el = tileLayer.querySelector(`[data-pos="${from[0]},${from[1]}"]`);
      if (el) placeTile(el, to[0], to[1]);
    });

    // Step 2: once the slide ends, apply merges, add a new tile, and redraw.
    animating = true;
    setTimeout(() => {
      animating = false;
      const placed = G.addRandomTile(result.board);
      state.board = placed.board;
      state.score += result.gained;
      if (state.score > state.best) { state.best = state.score; saveBest(state.best); }
      render(placed.position, result.mergedCells);

      if (!state.won && !state.keepPlaying && G.hasWon(state.board)) {
        state.won = true;
        showMessage("You made 2048!", true);
      } else if (!G.canMove(state.board)) {
        showMessage("No moves left", false);
      }
    }, SLIDE_MS);
  }

  function undo() {
    const prev = state.history.pop();
    if (!prev) return;
    state.board = prev.board;
    state.score = prev.score;
    hideMessage();
    render();
  }

  function showMessage(text, canContinue) {
    messageText.textContent = text;
    keepGoingBtn.hidden = !canContinue;
    messageEl.hidden = false;
  }
  function hideMessage() { messageEl.hidden = true; }

  // Keyboard: arrow keys and WASD
  const KEYS = {
    ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
    a: "left", d: "right", w: "up", s: "down",
  };
  document.addEventListener("keydown", (e) => {
    const dir = KEYS[e.key] || KEYS[e.key.toLowerCase()];
    if (dir) { e.preventDefault(); handleMove(dir); }
  });

  // Touch: swipe on the board
  let touchStart = null;
  boardEl.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  boardEl.addEventListener("touchend", (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return; // ignore taps
    handleMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });

  document.getElementById("new-game").addEventListener("click", start);
  document.getElementById("try-again").addEventListener("click", start);
  undoBtn.addEventListener("click", undo);
  keepGoingBtn.addEventListener("click", () => { state.keepPlaying = true; hideMessage(); });

  state.best = loadBest();
  start();
})();

/**
 * 2048 game logic.
 * Pure functions with no DOM access, so the rules can be unit tested in Node
 * and reused by any interface (browser, terminal, etc.).
 */
(function (root) {
  const SIZE = 4;
  const WIN_VALUE = 2048;

  /** Create an empty SIZE x SIZE board filled with zeros. */
  function createEmptyBoard(size = SIZE) {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  function cloneBoard(board) {
    return board.map((row) => row.slice());
  }

  /**
   * Slide one row to the left and merge equal neighbors.
   * Each tile can merge only once per move, e.g. [2,2,2,2] -> [4,4,0,0].
   */
  function slideRowLeft(row) {
    const tiles = row.filter((v) => v !== 0);
    const result = [];
    let gained = 0;

    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] === tiles[i + 1]) {
        const merged = tiles[i] * 2;
        result.push(merged);
        gained += merged;
        i++; // skip the tile that was just merged in
      } else {
        result.push(tiles[i]);
      }
    }

    while (result.length < row.length) result.push(0);
    return { row: result, gained };
  }

  function transpose(board) {
    return board[0].map((_, c) => board.map((row) => row[c]));
  }

  function reverseRows(board) {
    return board.map((row) => row.slice().reverse());
  }

  /**
   * Apply a move in a direction ("left" | "right" | "up" | "down").
   * Every direction is turned into a "left" move by flipping/transposing
   * the board, then flipped back afterwards.
   * Returns { board, moved, gained } and never mutates the input.
   */
  function move(board, direction) {
    let working = cloneBoard(board);

    if (direction === "right") working = reverseRows(working);
    if (direction === "up") working = transpose(working);
    if (direction === "down") working = reverseRows(transpose(working));

    let gained = 0;
    working = working.map((row) => {
      const res = slideRowLeft(row);
      gained += res.gained;
      return res.row;
    });

    if (direction === "right") working = reverseRows(working);
    if (direction === "up") working = transpose(working);
    if (direction === "down") working = transpose(reverseRows(working));

    const moved = working.some((row, r) => row.some((v, c) => v !== board[r][c]));
    return { board: working, moved, gained };
  }


  /**
   * The same move as move(), but also records where every tile went, so the
   * interface can animate tiles sliding instead of redrawing the board.
   *
   * The board is read as 4 "lines" running toward the wall the tiles move to.
   * For a "right" move, row 0 is read as [0,3], [0,2], [0,1], [0,0].
   *
   * Returns { board, moved, gained, movements, mergedCells } where each movement
   * is { from: [r, c], to: [r, c], merged } and merged = true means the tile
   * slid into another tile and combined with it.
   */
  function trackMove(board, direction) {
    const size = board.length;
    const next = createEmptyBoard(size);
    const movements = [];
    const mergedCells = [];
    let gained = 0;

    const lineCell = {
      left: (line, k) => [line, k],
      right: (line, k) => [line, size - 1 - k],
      up: (line, k) => [k, line],
      down: (line, k) => [size - 1 - k, line],
    }[direction];

    for (let line = 0; line < size; line++) {
      let slot = 0;            // next free position along this line
      let canMerge = false;    // can the last placed tile still merge?

      for (let k = 0; k < size; k++) {
        const [r, c] = lineCell(line, k);
        const value = board[r][c];
        if (!value) continue;

        const [pr, pc] = slot > 0 ? lineCell(line, slot - 1) : [];
        if (canMerge && next[pr][pc] === value) {
          next[pr][pc] = value * 2;
          gained += value * 2;
          movements.push({ from: [r, c], to: [pr, pc], merged: true });
          mergedCells.push([pr, pc]);
          canMerge = false;    // a merged tile can't merge again this move
        } else {
          const [tr, tc] = lineCell(line, slot);
          next[tr][tc] = value;
          movements.push({ from: [r, c], to: [tr, tc], merged: false });
          canMerge = true;
          slot++;
        }
      }
    }

    const moved = next.some((row, r) => row.some((v, c) => v !== board[r][c]));
    return { board: next, moved, gained, movements, mergedCells };
  }

  function emptyCells(board) {
    const cells = [];
    board.forEach((row, r) => row.forEach((v, c) => { if (v === 0) cells.push([r, c]); }));
    return cells;
  }

  /**
   * Place a 2 (90%) or 4 (10%) in a random empty cell.
   * `rng` can be swapped for a fixed function in tests.
   */
  function addRandomTile(board, rng = Math.random) {
    const cells = emptyCells(board);
    if (cells.length === 0) return { board, position: null };
    const [r, c] = cells[Math.floor(rng() * cells.length)];
    const next = cloneBoard(board);
    next[r][c] = rng() < 0.9 ? 2 : 4;
    return { board: next, position: [r, c] };
  }

  function canMove(board) {
    return ["left", "right", "up", "down"].some((d) => move(board, d).moved);
  }

  function hasWon(board, target = WIN_VALUE) {
    return board.some((row) => row.some((v) => v >= target));
  }

  /** Start a new game with two random tiles. */
  function newGame(rng = Math.random) {
    let board = createEmptyBoard();
    board = addRandomTile(board, rng).board;
    board = addRandomTile(board, rng).board;
    return board;
  }

  const api = {
    SIZE, WIN_VALUE, createEmptyBoard, cloneBoard, slideRowLeft,
    move, trackMove, emptyCells, addRandomTile, canMove, hasWon, newGame,
  };

  // Works in the browser (global) and in Node (require) without a build step.
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Game2048 = api;
})(typeof window !== "undefined" ? window : globalThis);

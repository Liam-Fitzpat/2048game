// Run with: npm test   (uses Node's built-in test runner, no dependencies)
const test = require("node:test");
const assert = require("node:assert");
const G = require("../src/game.js");

test("slides tiles left and fills with zeros", () => {
  assert.deepStrictEqual(G.slideRowLeft([0, 2, 0, 4]).row, [2, 4, 0, 0]);
});

test("merges equal neighbors and reports points gained", () => {
  const res = G.slideRowLeft([2, 2, 0, 0]);
  assert.deepStrictEqual(res.row, [4, 0, 0, 0]);
  assert.strictEqual(res.gained, 4);
});

test("each tile merges only once per move", () => {
  assert.deepStrictEqual(G.slideRowLeft([2, 2, 2, 2]).row, [4, 4, 0, 0]);
  assert.deepStrictEqual(G.slideRowLeft([4, 4, 8, 0]).row, [8, 8, 0, 0]);
});

test("three equal tiles merge the leading pair", () => {
  assert.deepStrictEqual(G.slideRowLeft([2, 2, 2, 0]).row, [4, 2, 0, 0]);
});

test("moves work in all four directions", () => {
  const board = [
    [2, 0, 0, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 0, 0, 0],
  ];
  assert.deepStrictEqual(G.move(board, "left").board[0], [4, 0, 0, 0]);
  assert.deepStrictEqual(G.move(board, "right").board[0], [0, 0, 0, 4]);
  assert.deepStrictEqual(G.move(board, "up").board.map((r) => r[0]), [4, 0, 0, 0]);
  assert.deepStrictEqual(G.move(board, "down").board.map((r) => r[0]), [0, 0, 0, 4]);
});

test("move does not mutate the original board", () => {
  const board = [[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  const copy = G.cloneBoard(board);
  G.move(board, "left");
  assert.deepStrictEqual(board, copy);
});

test("reports moved = false when nothing changes", () => {
  const board = [[2, 4, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  assert.strictEqual(G.move(board, "left").moved, false);
});

test("detects game over when no moves remain", () => {
  const stuck = [[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]];
  assert.strictEqual(G.canMove(stuck), false);
});

test("detects a win at 2048", () => {
  const board = G.createEmptyBoard();
  board[1][1] = 2048;
  assert.strictEqual(G.hasWon(board), true);
});

test("addRandomTile fills an empty cell with 2 or 4", () => {
  const { board, position } = G.addRandomTile(G.createEmptyBoard(), () => 0);
  assert.deepStrictEqual(position, [0, 0]);
  assert.strictEqual(board[0][0], 2);
});

test("new game starts with exactly two tiles", () => {
  const board = G.newGame();
  assert.strictEqual(board.flat().filter((v) => v !== 0).length, 2);
});

test("trackMove gives the same result as move on many random boards", () => {
  // Simple seeded random generator so the test is repeatable
  let seed = 42;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const values = [0, 0, 2, 2, 4, 8];

  for (let i = 0; i < 500; i++) {
    const board = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => values[Math.floor(rand() * values.length)]));
    for (const dir of ["left", "right", "up", "down"]) {
      const expected = G.move(board, dir);
      const tracked = G.trackMove(board, dir);
      assert.deepStrictEqual(tracked.board, expected.board);
      assert.strictEqual(tracked.gained, expected.gained);
      assert.strictEqual(tracked.moved, expected.moved);
    }
  }
});

test("trackMove records where each tile slides and which ones merge", () => {
  const board = [[2, 2, 0, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  const { movements, mergedCells } = G.trackMove(board, "left");
  assert.deepStrictEqual(movements, [
    { from: [0, 0], to: [0, 0], merged: false },
    { from: [0, 1], to: [0, 0], merged: true },
    { from: [0, 3], to: [0, 1], merged: false },
  ]);
  assert.deepStrictEqual(mergedCells, [[0, 0]]);
});

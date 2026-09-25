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

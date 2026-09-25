# 2048

A browser version of the 2048 sliding-tile puzzle, built with plain HTML, CSS, and JavaScript (no frameworks).

**Play it:** [liam-fitzpat.github.io/2048game](https://liam-fitzpat.github.io/2048game/)

## Features

- Sliding tile animations, with a pop when tiles merge
- Keyboard controls (arrow keys or WASD) and swipe controls on mobile
- Score tracking, with your best score saved between visits
- Undo for up to 20 moves
- Win screen at 2048 with the option to keep playing
- Responsive layout that works on phones and desktops

## How it's built

The project keeps the game rules separate from the interface:

| File | Role |
|------|------|
| `src/game.js` | Game logic as pure functions: sliding, merging, scoring, win and game-over checks. No DOM code. |
| `src/main.js` | Browser UI: rendering the board, handling input, score, and undo. |
| `tests/game.test.js` | Unit tests for the game logic, including a check that the animated move and the plain move always agree. |

Every move direction is handled by one function. The board is transposed or flipped so that any move becomes a "slide left," the row logic runs once, and the board is transformed back. This avoids writing four nearly identical versions of the same code.

For the animations, `trackMove()` does the same move but also records where each tile slides and which tiles merge. The interface slides each tile to its new cell with a CSS transition, then redraws the board once the slide ends. A test runs 500 random boards through both functions to make sure they always produce the same result.

## Running it

Open `index.html` in a browser. No install or build step is needed.

To run the tests (requires Node.js 18+):

```bash
npm test
```

## What I'd add next

- A board-size option (3x3, 5x5)
- An AI solver that plays the game automatically

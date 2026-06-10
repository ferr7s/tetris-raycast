import { describe, expect, test } from "vitest";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  createEmptyBoard,
  createInitialState,
  type Board,
  type GameState
} from "../src/games/tetris/state";
import { tick, update } from "../src/games/tetris/engine";

function getFilledCells(board: Board): Array<{ x: number; y: number; value: string }> {
  const cells: Array<{ x: number; y: number; value: string }> = [];

  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== null) {
        cells.push({ x, y, value: cell });
      }
    });
  });

  return cells;
}

function moveToLeftWall(state: GameState): GameState {
  let current = state;

  for (let i = 0; i < BOARD_WIDTH; i += 1) {
    current = update(current, { type: "move-left" });
  }

  return current;
}

function dropUntilLocked(state: GameState): GameState {
  let current = state;

  for (let i = 0; i < BOARD_HEIGHT + 4; i += 1) {
    current = tick(current);
  }

  return current;
}

describe("tetris engine", () => {
  test("creates a running initial state with an empty 10x20 board", () => {
    const state = createInitialState({ bag: ["I", "O", "T"] });

    expect(state.board).toHaveLength(BOARD_HEIGHT);
    expect(state.board.every((row) => row.length === BOARD_WIDTH)).toBe(true);
    expect(getFilledCells(state.board)).toEqual([]);
    expect(state.score).toBe(0);
    expect(state.lines).toBe(0);
    expect(state.level).toBe(1);
    expect(state.status).toBe("running");
    expect(state.active.type).toBe("I");
    expect(state.next.type).toBe("O");
  });

  test("keeps pieces inside the left wall", () => {
    const state = createInitialState({ bag: ["O", "I", "T"] });
    const atWall = moveToLeftWall(state);
    const afterExtraMove = update(atWall, { type: "move-left" });

    expect(afterExtraMove.active.position).toEqual(atWall.active.position);
  });

  test("keeps pieces from moving through locked cells", () => {
    const board = createEmptyBoard();
    board[0][6] = "I";
    const state = createInitialState({ bag: ["O", "I", "T"], board });

    const moved = update(state, { type: "move-right" });

    expect(moved.active.position).toEqual(state.active.position);
  });

  test("rotates a piece when the rotated shape fits", () => {
    const state = createInitialState({ bag: ["I", "O", "T"] });
    const rotated = update(state, { type: "rotate" });

    expect(rotated.active.rotation).toBe(1);
    expect(rotated.active.cells).not.toEqual(state.active.cells);
  });

  test("keeps rotation unchanged when the rotated shape collides", () => {
    const board = createEmptyBoard();
    board[1][5] = "O";
    const state = createInitialState({ bag: ["I", "O", "T"], board });

    const rotated = update(state, { type: "rotate" });

    expect(rotated.active.rotation).toBe(state.active.rotation);
    expect(rotated.active.cells).toEqual(state.active.cells);
  });

  test("moves the active piece down on tick", () => {
    const state = createInitialState({ bag: ["O", "I", "T"] });
    const next = tick(state);

    expect(next.active.position.y).toBe(state.active.position.y + 1);
  });

  test("locks a landed piece and spawns the next one", () => {
    const state = createInitialState({ bag: ["O", "I", "T"] });
    const landed = dropUntilLocked(state);

    expect(getFilledCells(landed.board)).toHaveLength(4);
    expect(landed.active.type).toBe("I");
    expect(landed.next.type).toBe("T");
    expect(landed.status).toBe("running");
  });

  test("clears a full line and updates score, lines, and level", () => {
    const board = createEmptyBoard();
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      board[BOARD_HEIGHT - 1][x] = "T";
    }
    board[BOARD_HEIGHT - 1][4] = null;
    board[BOARD_HEIGHT - 1][5] = null;

    const state = createInitialState({ bag: ["O", "I", "T"], board });
    const landed = update(state, { type: "hard-drop" });

    expect(landed.lines).toBe(1);
    expect(landed.level).toBe(1);
    expect(landed.score).toBe(100);
    expect(landed.board[BOARD_HEIGHT - 1].filter((cell) => cell === "O")).toHaveLength(2);
  });

  test("hard drops to the lowest valid row and locks immediately", () => {
    const state = createInitialState({ bag: ["O", "I", "T"] });
    const dropped = update(state, { type: "hard-drop" });
    const filled = getFilledCells(dropped.board);

    expect(dropped.active.type).toBe("I");
    expect(filled.map((cell) => cell.y).sort()).toEqual([18, 18, 19, 19]);
  });

  test("sets game over when a new piece cannot spawn", () => {
    const board = createEmptyBoard();
    board[0][4] = "T";
    board[0][5] = "T";
    const state = createInitialState({ bag: ["O", "I", "T"], board });

    const gameOver = update(state, { type: "hard-drop" });

    expect(gameOver.status).toBe("game-over");
  });

  test("pauses, resumes, and restarts the game", () => {
    const state = createInitialState({ bag: ["O", "I", "T"] });
    const paused = update(state, { type: "pause" });
    const ignoredTick = tick(paused);
    const resumed = update(paused, { type: "resume" });
    const restarted = update(resumed, { type: "restart" });

    expect(paused.status).toBe("paused");
    expect(ignoredTick).toEqual(paused);
    expect(resumed.status).toBe("running");
    expect(restarted.score).toBe(0);
    expect(restarted.status).toBe("running");
  });
});

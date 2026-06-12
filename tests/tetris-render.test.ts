import { describe, expect, test } from "vitest";
import { renderBoard, renderPiecePreview } from "../src/games/tetris/render";
import { createEmptyBoard, createInitialState, type GameState } from "../src/games/tetris/state";

function stateWithBoard(board: ReturnType<typeof createEmptyBoard>): GameState {
  return createInitialState({ bag: ["O", "I", "T"], board });
}

describe("tetris rendering", () => {
  test("renders the next piece preview with tetromino-colored pixels", () => {
    expect(renderPiecePreview(createInitialState({ bag: ["O", "I", "T"] }).next)).toBe("🟦🟦🟦🟦");
  });

  test("renders every tetromino preview with square pixels only", () => {
    const rendered = renderPiecePreview(createInitialState({ bag: ["O", "J", "T"] }).next);

    expect(rendered).toBe("🟦🟦🟦🟦");
    expect(rendered).not.toContain("🔵");
  });

  test("renders the board as a compact pixel-art frame that fits Raycast height", () => {
    const state = createInitialState({ bag: ["O", "I", "T"] });
    const rendered = renderBoard(state);
    const rows = rendered.split("\n");

    expect(rows[0]).toBe("▛▀▀▀▀▀▀▀▀▀▀▜");
    expect(rows.at(-1)).toBe("▙▄▄▄▄▄▄▄▄▄▄▟");
    expect(rows).toHaveLength(12);
    expect(rendered).toContain("██");
    expect(rendered).not.toContain("⬛");
    expect(rendered).not.toContain(".");
    expect(rendered).not.toContain("#");
  });

  test("renders locked blocks differently from the active piece", () => {
    const board = createEmptyBoard();
    board[18][0] = "T";
    board[19][0] = "T";
    const rendered = renderBoard(stateWithBoard(board));

    expect(rendered).toContain("▓");
    expect(rendered).toContain("██");
  });
});

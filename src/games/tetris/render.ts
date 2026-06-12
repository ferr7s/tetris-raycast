import { BOARD_HEIGHT, BOARD_WIDTH, type GameState, type Piece, type Tetromino } from "./state";

type RenderCell = "empty" | "active" | "locked";

const EMPTY_CELL = " ";
const TOP_BORDER = `▛${"▀".repeat(BOARD_WIDTH)}▜`;
const BOTTOM_BORDER = `▙${"▄".repeat(BOARD_WIDTH)}▟`;
const LEFT_BORDER = "▌";
const RIGHT_BORDER = "▐";

const TETROMINO_PIXELS: Record<Tetromino, string> = {
  I: "🟦",
  O: "🟨",
  T: "🟪",
  S: "🟩",
  Z: "🟥",
  J: "🟦",
  L: "🟧"
};

function pixelForTetromino(type: Tetromino): string {
  return TETROMINO_PIXELS[type];
}

function createRenderGrid(state: GameState): RenderCell[][] {
  const grid = state.board.map((row) =>
    row.map<RenderCell>((cell) => (cell === null ? "empty" : "locked"))
  );

  for (const cell of state.active.cells) {
    const x = state.active.position.x + cell.x;
    const y = state.active.position.y + cell.y;

    if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
      grid[y][x] = "active";
    }
  }

  return grid;
}

function renderCompactCell(top: RenderCell, bottom: RenderCell): string {
  if (top === "empty" && bottom === "empty") {
    return EMPTY_CELL;
  }

  if (top === "active" && bottom === "active") {
    return "█";
  }

  if (top === "locked" && bottom === "locked") {
    return "▓";
  }

  if (top !== "empty" && bottom !== "empty") {
    return "█";
  }

  return top === "empty" ? "▄" : "▀";
}

export function renderPiecePreview(piece: Piece): string {
  return pixelForTetromino(piece.type).repeat(piece.cells.length);
}

export function renderBoard(state: GameState): string {
  const grid = createRenderGrid(state);
  const rows = [];

  for (let y = 0; y < BOARD_HEIGHT; y += 2) {
    const cells = Array.from({ length: BOARD_WIDTH }, (_, x) =>
      renderCompactCell(grid[y][x], grid[y + 1]?.[x] ?? "empty")
    ).join("");
    rows.push(`${LEFT_BORDER}${cells}${RIGHT_BORDER}`);
  }

  return [TOP_BORDER, ...rows, BOTTOM_BORDER].join("\n");
}

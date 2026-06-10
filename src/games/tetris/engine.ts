import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  type Board,
  type Cell,
  cloneBoard,
  createInitialState,
  createPiece,
  getRotations,
  type GameAction,
  type GameState,
  type Piece,
  type Position,
  type Tetromino
} from "./state";

const LINE_SCORES = [0, 100, 300, 500, 800] as const;

function absoluteCells(piece: Piece): Position[] {
  return piece.cells.map((cell) => ({
    x: piece.position.x + cell.x,
    y: piece.position.y + cell.y
  }));
}

function isInsideBoard(position: Position): boolean {
  return (
    position.x >= 0 && position.x < BOARD_WIDTH && position.y >= 0 && position.y < BOARD_HEIGHT
  );
}

function collides(board: Board, piece: Piece): boolean {
  return absoluteCells(piece).some((cell) => {
    if (!isInsideBoard(cell)) {
      return true;
    }

    return board[cell.y]?.[cell.x] !== null;
  });
}

function movePiece(piece: Piece, delta: Position): Piece {
  return {
    ...piece,
    position: {
      x: piece.position.x + delta.x,
      y: piece.position.y + delta.y
    }
  };
}

function rotatePiece(piece: Piece): Piece {
  const rotations = getRotations(piece.type);
  const rotation = (piece.rotation + 1) % rotations.length;
  const cells = rotations[rotation] ?? rotations[0];

  return {
    ...piece,
    rotation,
    cells: cells.map((cell) => ({ ...cell }))
  };
}

function putPieceOnBoard(board: Board, piece: Piece): Board {
  const nextBoard = cloneBoard(board);

  for (const cell of absoluteCells(piece)) {
    if (isInsideBoard(cell)) {
      nextBoard[cell.y][cell.x] = piece.type;
    }
  }

  return nextBoard;
}

function clearFullLines(board: Board): { board: Board; cleared: number } {
  const remainingRows = board.filter((row) => row.some((cell) => cell === null));
  const cleared = BOARD_HEIGHT - remainingRows.length;
  const emptyRows = Array.from({ length: cleared }, () => Array<Cell>(BOARD_WIDTH).fill(null));

  return {
    board: [...emptyRows, ...remainingRows.map((row) => [...row])],
    cleared
  };
}

function nextQueuedType(state: GameState): Tetromino {
  return state.bag[state.bagIndex % state.bag.length] ?? "I";
}

function advanceQueue(state: GameState): Pick<GameState, "next" | "bagIndex"> {
  return {
    next: createPiece(nextQueuedType(state)),
    bagIndex: state.bagIndex + 1
  };
}

function levelForLines(lines: number): number {
  return Math.floor(lines / 10) + 1;
}

function lockPiece(state: GameState, piece: Piece): GameState {
  const lockedBoard = putPieceOnBoard(state.board, piece);
  const { board, cleared } = clearFullLines(lockedBoard);
  const lines = state.lines + cleared;
  const level = levelForLines(lines);
  const active = state.next;
  const queued = advanceQueue(state);
  const score = state.score + (LINE_SCORES[cleared] ?? 0) * state.level;
  const status = collides(board, active) ? "game-over" : state.status;

  return {
    ...state,
    board,
    active,
    next: queued.next,
    bagIndex: queued.bagIndex,
    score,
    lines,
    level,
    status
  };
}

function dropDistance(state: GameState): number {
  let distance = 0;
  let candidate = movePiece(state.active, { x: 0, y: 1 });

  while (!collides(state.board, candidate)) {
    distance += 1;
    candidate = movePiece(state.active, { x: 0, y: distance + 1 });
  }

  return distance;
}

export function tick(state: GameState): GameState {
  if (state.status !== "running") {
    return state;
  }

  if (collides(state.board, state.active)) {
    return { ...state, status: "game-over" };
  }

  const candidate = movePiece(state.active, { x: 0, y: 1 });

  if (collides(state.board, candidate)) {
    return lockPiece(state, state.active);
  }

  return {
    ...state,
    active: candidate
  };
}

export function update(state: GameState, action: GameAction): GameState {
  if (action.type === "restart") {
    return createInitialState({ bag: state.bag });
  }

  if (action.type === "pause" && state.status === "running") {
    return { ...state, status: "paused" };
  }

  if (action.type === "resume" && state.status === "paused") {
    return { ...state, status: "running" };
  }

  if (state.status !== "running") {
    return state;
  }

  if (action.type === "move-left" || action.type === "move-right") {
    const deltaX = action.type === "move-left" ? -1 : 1;
    const candidate = movePiece(state.active, { x: deltaX, y: 0 });

    return collides(state.board, candidate) ? state : { ...state, active: candidate };
  }

  if (action.type === "soft-drop") {
    return tick(state);
  }

  if (action.type === "hard-drop") {
    if (collides(state.board, state.active)) {
      return { ...state, status: "game-over" };
    }

    const distance = dropDistance(state);
    const dropped = movePiece(state.active, { x: 0, y: distance });

    return lockPiece(state, dropped);
  }

  if (action.type === "rotate") {
    const candidate = rotatePiece(state.active);

    return collides(state.board, candidate) ? state : { ...state, active: candidate };
  }

  return state;
}

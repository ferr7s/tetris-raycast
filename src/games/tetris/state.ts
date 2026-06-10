export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export type Tetromino = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Cell = Tetromino | null;
export type Board = Cell[][];
export type GameStatus = "idle" | "running" | "paused" | "game-over";

export type Position = {
  x: number;
  y: number;
};

export type Piece = {
  type: Tetromino;
  rotation: number;
  position: Position;
  cells: Position[];
};

export type GameState = {
  board: Board;
  score: number;
  lines: number;
  level: number;
  status: GameStatus;
  active: Piece;
  next: Piece;
  bag: Tetromino[];
  bagIndex: number;
};

export type GameAction =
  | { type: "move-left" }
  | { type: "move-right" }
  | { type: "soft-drop" }
  | { type: "hard-drop" }
  | { type: "rotate" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "restart" };

export type InitialStateOptions = {
  bag?: Tetromino[];
  board?: Board;
};

const DEFAULT_BAG: Tetromino[] = ["I", "O", "T", "S", "Z", "J", "L"];

const SHAPES: Record<Tetromino, Position[][]> = {
  I: [
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 }
    ],
    [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 }
    ]
  ],
  O: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ]
  ],
  T: [
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 }
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 }
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 }
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 }
    ]
  ],
  S: [
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 }
    ]
  ],
  Z: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 }
    ],
    [
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 }
    ]
  ],
  J: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 }
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 }
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 }
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 }
    ]
  ],
  L: [
    [
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 }
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 }
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 }
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 }
    ]
  ]
};

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function getRotations(type: Tetromino): Position[][] {
  return SHAPES[type];
}

export function createPiece(type: Tetromino, rotation = 0): Piece {
  const rotations = getRotations(type);
  const normalizedRotation = rotation % rotations.length;
  const cells = rotations[normalizedRotation] ?? rotations[0];
  const width = Math.max(...cells.map((cell) => cell.x)) + 1;

  return {
    type,
    rotation: normalizedRotation,
    position: {
      x: Math.floor((BOARD_WIDTH - width) / 2),
      y: 0
    },
    cells: cells.map((cell) => ({ ...cell }))
  };
}

export function createInitialState(options: InitialStateOptions = {}): GameState {
  const bag = options.bag && options.bag.length > 0 ? [...options.bag] : [...DEFAULT_BAG];
  const board = options.board ? cloneBoard(options.board) : createEmptyBoard();
  const active = createPiece(bag[0] ?? "I");
  const next = createPiece(bag[1 % bag.length] ?? "O");

  return {
    board,
    score: 0,
    lines: 0,
    level: 1,
    status: "running",
    active,
    next,
    bag,
    bagIndex: 2
  };
}

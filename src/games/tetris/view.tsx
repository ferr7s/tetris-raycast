import { Action, ActionPanel, Detail, Keyboard } from "@raycast/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getHighScore, saveHighScoreIfNeeded } from "../../shared/storage";
import { tick, update } from "./engine";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  cloneBoard,
  createInitialState,
  type Board,
  type GameAction,
  type GameState,
  type Piece
} from "./state";

const EMPTY_CELL = ".";
const FILLED_CELL = "#";
const STARTING_INTERVAL_MS = 800;
const MIN_INTERVAL_MS = 120;
const LEVEL_SPEED_STEP_MS = 60;

function getTickInterval(level: number): number {
  return Math.max(MIN_INTERVAL_MS, STARTING_INTERVAL_MS - (level - 1) * LEVEL_SPEED_STEP_MS);
}

function overlayActivePiece(state: GameState): Board {
  const board = cloneBoard(state.board);

  for (const cell of state.active.cells) {
    const x = state.active.position.x + cell.x;
    const y = state.active.position.y + cell.y;

    if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
      board[y][x] = state.active.type;
    }
  }

  return board;
}

function renderBoard(state: GameState): string {
  const board = overlayActivePiece(state);
  const border = `+${"-".repeat(BOARD_WIDTH)}+`;
  const rows = board.map((row) => {
    const cells = row.map((cell) => (cell === null ? EMPTY_CELL : FILLED_CELL)).join("");
    return `|${cells}|`;
  });

  return [border, ...rows, border].join("\n");
}

function renderPiece(piece: Piece): string {
  const grid = Array.from({ length: 4 }, () => Array<string>(4).fill(EMPTY_CELL));

  for (const cell of piece.cells) {
    if (cell.y >= 0 && cell.y < 4 && cell.x >= 0 && cell.x < 4) {
      grid[cell.y][cell.x] = FILLED_CELL;
    }
  }

  return grid.map((row) => row.join("")).join("\n");
}

function statusLabel(status: GameState["status"]): string {
  if (status === "game-over") {
    return "Game Over";
  }

  return status[0].toUpperCase() + status.slice(1);
}

function createMarkdown(state: GameState): string {
  return `# Tetris

\`\`\`text
${renderBoard(state)}
\`\`\``;
}

type TetrisActionProps = {
  state: GameState;
  dispatch: (action: GameAction) => void;
};

function TetrisActions({ state, dispatch }: TetrisActionProps) {
  const isPaused = state.status === "paused";
  const isGameOver = state.status === "game-over";

  return (
    <ActionPanel title="Tetris">
      <ActionPanel.Section>
        {isGameOver ? (
          <Action title="Play Again" onAction={() => dispatch({ type: "restart" })} />
        ) : (
          <Action
            title={isPaused ? "Resume" : "Pause"}
            shortcut={{ modifiers: ["opt"], key: "p" }}
            onAction={() => dispatch({ type: isPaused ? "resume" : "pause" })}
          />
        )}
        <Action
          title="Restart"
          shortcut={Keyboard.Shortcut.Common.Refresh}
          onAction={() => dispatch({ type: "restart" })}
        />
      </ActionPanel.Section>
      <ActionPanel.Section title="Movement">
        <Action
          title="Move Left"
          shortcut={{ modifiers: ["shift"], key: "arrowLeft" }}
          onAction={() => dispatch({ type: "move-left" })}
        />
        <Action
          title="Move Right"
          shortcut={{ modifiers: ["shift"], key: "arrowRight" }}
          onAction={() => dispatch({ type: "move-right" })}
        />
        <Action
          title="Rotate"
          shortcut={{ modifiers: ["shift"], key: "arrowUp" }}
          onAction={() => dispatch({ type: "rotate" })}
        />
        <Action
          title="Soft Drop"
          shortcut={{ modifiers: ["shift"], key: "arrowDown" }}
          onAction={() => dispatch({ type: "soft-drop" })}
        />
        <Action
          title="Hard Drop"
          shortcut={{ modifiers: ["opt"], key: "space" }}
          onAction={() => dispatch({ type: "hard-drop" })}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}

export function TetrisView() {
  const [state, setState] = useState(() => createInitialState());
  const [storedHighScore, setStoredHighScore] = useState(0);

  const dispatch = useCallback((action: GameAction) => {
    setState((current) => update(current, action));
  }, []);

  useEffect(() => {
    let isMounted = true;

    getHighScore()
      .then((score) => {
        if (isMounted) {
          setStoredHighScore(score);
        }
      })
      .catch(() => {
        if (isMounted) {
          setStoredHighScore(0);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (state.status !== "running") {
      return;
    }

    const interval = setInterval(() => {
      setState((current) => tick(current));
    }, getTickInterval(state.level));

    return () => clearInterval(interval);
  }, [state.level, state.status]);

  useEffect(() => {
    if (state.status !== "game-over") {
      return;
    }

    saveHighScoreIfNeeded(state.score)
      .then(setStoredHighScore)
      .catch(() => undefined);
  }, [state.score, state.status]);

  const displayedHighScore = Math.max(storedHighScore, state.score);
  const markdown = useMemo(() => createMarkdown(state), [state]);

  return (
    <Detail
      markdown={markdown}
      navigationTitle="Play Tetris"
      actions={<TetrisActions state={state} dispatch={dispatch} />}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Score" text={String(state.score)} />
          <Detail.Metadata.Label title="High Score" text={String(displayedHighScore)} />
          <Detail.Metadata.Label title="Lines" text={String(state.lines)} />
          <Detail.Metadata.Label title="Level" text={String(state.level)} />
          <Detail.Metadata.Label title="Status" text={statusLabel(state.status)} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Next" text={state.next.type} />
          <Detail.Metadata.Label title="Preview" text={`\n${renderPiece(state.next)}`} />
        </Detail.Metadata>
      }
    />
  );
}

import { LocalStorage } from "@raycast/api";

const HIGH_SCORE_KEY = "tetris.highScore";

export async function getHighScore(): Promise<number> {
  const value = await LocalStorage.getItem<number>(HIGH_SCORE_KEY);

  return typeof value === "number" ? value : 0;
}

export async function saveHighScoreIfNeeded(score: number): Promise<number> {
  const current = await getHighScore();

  if (score > current) {
    await LocalStorage.setItem(HIGH_SCORE_KEY, score);
    return score;
  }

  return current;
}

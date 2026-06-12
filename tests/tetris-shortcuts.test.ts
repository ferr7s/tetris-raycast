import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const viewSource = readFileSync("src/games/tetris/view.tsx", "utf8");

describe("tetris shortcuts", () => {
  test("uses shift with arrow keys for movement controls", () => {
    expect(viewSource).toContain('shortcut={{ modifiers: ["shift"], key: "arrowLeft" }}');
    expect(viewSource).toContain('shortcut={{ modifiers: ["shift"], key: "arrowRight" }}');
    expect(viewSource).toContain('shortcut={{ modifiers: ["shift"], key: "arrowUp" }}');
    expect(viewSource).toContain('shortcut={{ modifiers: ["shift"], key: "arrowDown" }}');
  });

  test("keeps non-arrow shortcuts unchanged", () => {
    expect(viewSource).toContain('shortcut={{ modifiers: ["opt"], key: "p" }}');
    expect(viewSource).toContain('shortcut={{ modifiers: ["opt"], key: "space" }}');
  });
});

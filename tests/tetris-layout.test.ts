import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const viewSource = readFileSync("src/games/tetris/view.tsx", "utf8");

describe("tetris layout", () => {
  test("keeps the next piece preview in the sidebar instead of the main board content", () => {
    expect(viewSource).not.toContain("## Next");
    expect(viewSource).not.toContain("title=\"Next\"");
    expect(viewSource).not.toContain("title=\"Preview\"");
    expect(viewSource).toContain("<Detail.Metadata.Label title=\"Next Piece\" text={renderPiecePreview(state.next)} />");
    expect(viewSource).toContain("renderPiecePreview(state.next)");
    expect(viewSource).not.toContain("renderPiece(state.next)");
    expect(viewSource.indexOf("title=\"Next Piece\"")).toBeLessThan(
      viewSource.indexOf("title=\"Score\"")
    );
  });
});

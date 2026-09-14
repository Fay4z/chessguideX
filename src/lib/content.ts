export type TextBlock = { type: "text"; markdown: string };
export type BoardBlock = { type: "board"; fen: string; moves?: string[] };
export type ContentBlock = TextBlock | BoardBlock;

export function parseContentBlocks(value: unknown): ContentBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isContentBlock);
}

function isContentBlock(block: unknown): block is ContentBlock {
  if (typeof block !== "object" || block === null) return false;
  const b = block as Record<string, unknown>;
  if (b.type === "text") {
    return typeof b.markdown === "string";
  }
  if (b.type === "board") {
    return (
      typeof b.fen === "string" &&
      (b.moves === undefined ||
        (Array.isArray(b.moves) && b.moves.every((m) => typeof m === "string")))
    );
  }
  return false;
}
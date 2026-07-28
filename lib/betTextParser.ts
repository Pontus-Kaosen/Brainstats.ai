export function extractBetBlocks(text: string): string[] {
  if (/fixture id:/i.test(text)) {
    return text
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);
  }

  return [text.trim()].filter(Boolean);
}

export function extractNumberFromBlock(
  text: string,
  label: string
): string | null {
  const match = text.match(
    new RegExp(`${label}:\\s*(\\d+)`, "i")
  );

  return match ? match[1] : null;
}

export function getMatchLabelFromBlock(block: string): string {
  const line =
    block
      .split("\n")
      .map((entry) => entry.trim())
      .find(Boolean) || "";

  return line;
}

export function getMarketsFromBlock(block: string): string[] {
  const lines = block
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return lines.slice(1).filter(
    (line) =>
      !/^(fixture id|home team id|away team id|player id|player name):/i.test(
        line
      )
  );
}

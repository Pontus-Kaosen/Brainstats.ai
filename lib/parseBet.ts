export function parseBet(text: string) {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  
    return {
      match: lines[0] || "Okänd match",
      markets: lines.slice(1),
    };
  }
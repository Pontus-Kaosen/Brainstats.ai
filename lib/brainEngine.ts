import { parseBet } from "./parseBet";
import { calculateScore } from "./scoreEngine";
import { calculateRisk } from "./riskEngine";
import { calculateConfidence } from "./confidence";

export function analyzeBet(text: string) {
  const parsed = parseBet(text);

  const markets =
    parsed.markets.length > 0 ? parsed.markets : ["Ingen marknad hittad"];

  return {
    match: parsed.match,
    markets,
    score: calculateScore(parsed.markets),
    risk: calculateRisk(parsed.markets),
    confidence: calculateConfidence(parsed.markets),
  };
}
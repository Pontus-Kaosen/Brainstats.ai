import type { Injury, LastMatch } from "@/lib/analysisReportTypes";

export function resultIcon(match: LastMatch) {
  if (match.goals.home === match.goals.away) return "D";
  if (match.teams.home.winner || match.teams.away.winner) return "W";
  return "L";
}

export function matchText(match: LastMatch) {
  return `${match.teams.home.name} ${match.goals.home ?? "-"}-${
    match.goals.away ?? "-"
  } ${match.teams.away.name}`;
}

export function injuryReason(injury: Injury, fallback: string) {
  return (
    injury.reason ||
    injury.player?.reason ||
    injury.player?.type ||
    injury.type ||
    fallback
  );
}

export const analysisReportCardClass =
  "brain-card rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1";

export const analysisReportCardClassCompact =
  "brain-card rounded-2xl p-5";

export const analysisReportTitleGradient =
  "bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-transparent";

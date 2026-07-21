import type { Language } from "@/lib/translations";

export type WorthBettingVerdict =
  | "worth_it"
  | "risky"
  | "not_worth_it"
  | "wait";

export type WorthBetting = {
  verdict: WorthBettingVerdict;
  headline: string;
  reason: string;
};

const VERDICTS: WorthBettingVerdict[] = [
  "worth_it",
  "risky",
  "not_worth_it",
  "wait",
];

const fallbackCopy = {
  sv: {
    worth_it: {
      headline: "Data stödjer din spelidé",
      reason:
        "Form, tabell och matchunderlag pekar i samma riktning som din marknad. Riskerna finns kvar, men underlaget ser relativt starkt ut.",
    },
    risky: {
      headline: "Blandat underlag — var försiktig",
      reason:
        "Det finns argument för din idé, men också tydliga motpoler i data eller riskbilden. Bedöm om oddset kompenserar för osäkerheten.",
    },
    not_worth_it: {
      headline: "Svagt stöd för din idé",
      reason:
        "Fler signaler talar emot än för din valda marknad just nu. Överväg att justera spelet eller vänta på bättre läge.",
    },
    wait: {
      headline: "För tidigt för en tydlig bedömning",
      reason:
        "Viktig data saknas eller är ofullständig. Gör om analysen närmare matchstart när fler faktorer är bekräftade.",
    },
  },
  en: {
    worth_it: {
      headline: "Data supports your bet idea",
      reason:
        "Form, table and match context lean in the same direction as your market. Risks remain, but the underlying case looks relatively strong.",
    },
    risky: {
      headline: "Mixed case — proceed with caution",
      reason:
        "There are arguments for your idea, but also clear counter-signals in the data or risk profile. Consider whether the price compensates for the uncertainty.",
    },
    not_worth_it: {
      headline: "Weak support for your idea",
      reason:
        "More signals point against your chosen market right now. Consider adjusting the bet or waiting for a better setup.",
    },
    wait: {
      headline: "Too early for a clear read",
      reason:
        "Important data is missing or incomplete. Run the analysis again closer to kick-off when more factors are confirmed.",
    },
  },
} as const;

function normalizeVerdict(value: unknown): WorthBettingVerdict | null {
  if (
    typeof value === "string" &&
    VERDICTS.includes(value as WorthBettingVerdict)
  ) {
    return value as WorthBettingVerdict;
  }

  return null;
}

export function deriveWorthBettingFallback(
  options: {
    brainScore: number;
    riskLevel: string;
    dataQualityTier: "high" | "medium" | "low";
  },
  language: Language
): WorthBetting {
  const copy = fallbackCopy[language];
  let verdict: WorthBettingVerdict = "risky";

  if (options.dataQualityTier === "low") {
    verdict = "wait";
  } else if (options.brainScore >= 76 && options.riskLevel === "Low") {
    verdict = "worth_it";
  } else if (options.brainScore >= 62 && options.riskLevel !== "High") {
    verdict = "risky";
  } else if (options.brainScore < 55 || options.riskLevel === "High") {
    verdict = "not_worth_it";
  }

  return {
    verdict,
    ...copy[verdict],
  };
}

export function normalizeWorthBetting(
  raw: unknown,
  fallback: WorthBetting
): WorthBetting {
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const value = raw as Record<string, unknown>;
  const verdict = normalizeVerdict(value.verdict) ?? fallback.verdict;
  const headline =
    typeof value.headline === "string" && value.headline.trim()
      ? value.headline.trim()
      : fallback.headline;
  const reason =
    typeof value.reason === "string" && value.reason.trim()
      ? value.reason.trim()
      : fallback.reason;

  return { verdict, headline, reason };
}

export function applyWorthBettingGuardrails(
  worthBetting: WorthBetting,
  options: {
    dataQualityTier: "high" | "medium" | "low";
    language: Language;
  }
): WorthBetting {
  let { verdict, headline, reason } = worthBetting;

  if (options.dataQualityTier === "low" && verdict === "worth_it") {
    verdict = "wait";
    headline = fallbackCopy[options.language].wait.headline;
    reason = `${reason} ${fallbackCopy[options.language].wait.reason}`;
  } else if (
    options.dataQualityTier !== "high" &&
    verdict === "worth_it"
  ) {
    verdict = "risky";
  }

  return {
    verdict,
    headline: headline.slice(0, 120),
    reason: reason.slice(0, 600),
  };
}

export function worthBettingStyles(verdict: WorthBettingVerdict) {
  switch (verdict) {
    case "worth_it":
      return {
        border: "border-[#18ff6d44]",
        bg: "bg-[#07140d]/90",
        badge: "border-[#18ff6d44] bg-[#18ff6d]/15 text-[#18ff6d]",
        glow: "bg-[#18ff6d]/10",
      };
    case "risky":
      return {
        border: "border-yellow-500/40",
        bg: "bg-yellow-500/5",
        badge: "border-yellow-500/40 bg-yellow-500/10 text-yellow-200",
        glow: "bg-yellow-500/10",
      };
    case "not_worth_it":
      return {
        border: "border-red-500/35",
        bg: "bg-red-500/5",
        badge: "border-red-500/35 bg-red-500/10 text-red-200",
        glow: "bg-red-500/10",
      };
    case "wait":
    default:
      return {
        border: "border-[#2fbfff33]",
        bg: "bg-[#071018]/90",
        badge: "border-[#2fbfff33] bg-[#2fbfff]/10 text-[#72d5ff]",
        glow: "bg-[#2fbfff]/10",
      };
  }
}

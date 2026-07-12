import type { Language } from "@/lib/translations";

export const companyInfo = {
  tradeName: "BrainStats",
  legalName: "Pontus Kaosén",
  vatNoteSv: "Alla priser är inklusive moms om inget annat anges.",
  vatNoteEn: "All prices include VAT unless stated otherwise.",
  locationSv: "Stockholm, Sverige",
  locationEn: "Stockholm, Sweden",
  email: "support@brainstats.ai",
  website: "brainstats.ai",
  plans: {
    pro: {
      priceSv: "99 kr/månad",
      priceEn: "99 SEK/month",
    },
    elite: {
      priceSv: "149 kr/månad",
      priceEn: "149 SEK/month",
    },
  },
};

export function getSellerBlock(language: Language) {
  const c = companyInfo;

  if (language === "en") {
    return `${c.tradeName} – ${c.legalName}
${c.locationEn}
Email: ${c.email}
Website: ${c.website}`;
  }

  return `${c.tradeName} – ${c.legalName}
${c.locationSv}
E-post: ${c.email}
Webbplats: ${c.website}`;
}

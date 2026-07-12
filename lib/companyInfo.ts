import type { Language } from "@/lib/translations";

export const companyInfo = {
  tradeName: "BrainStats",
  legalName: "Pontus Kaosén",
  orgNumber: "030610-1056",
  vatNoteSv: "Alla priser är inklusive moms om inget annat anges.",
  vatNoteEn: "All prices include VAT unless stated otherwise.",
  addressLine1: "Vargvägen 4",
  postalCode: "137 32",
  city: "Västerhaninge",
  countrySv: "Sverige",
  countryEn: "Sweden",
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
Org. no: ${c.orgNumber}
${c.addressLine1}, ${c.postalCode} ${c.city}, ${c.countryEn}
Email: ${c.email}
Website: ${c.website}`;
  }

  return `${c.tradeName} – ${c.legalName}
Org.nr: ${c.orgNumber}
${c.addressLine1}, ${c.postalCode} ${c.city}, ${c.countrySv}
E-post: ${c.email}
Webbplats: ${c.website}`;
}

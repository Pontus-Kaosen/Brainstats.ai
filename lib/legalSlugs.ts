export type LegalSlug =
  | "terms"
  | "purchase"
  | "privacy"
  | "cookies"
  | "disclaimer";

export const legalSlugs: LegalSlug[] = [
  "terms",
  "purchase",
  "privacy",
  "cookies",
  "disclaimer",
];

export function isLegalSlug(value: string): value is LegalSlug {
  return legalSlugs.includes(value as LegalSlug);
}

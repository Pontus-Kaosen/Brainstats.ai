import type { Metadata } from "next";

import {
  defaultOgImage,
  getSiteUrl,
  siteDescriptionSv,
  siteName,
} from "@/lib/site";

type PageMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description = siteDescriptionSv,
  path = "",
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const url = `${getSiteUrl()}${path}`;
  const fullTitle = title === siteName ? siteName : `${title} | ${siteName}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName,
      locale: "sv_SE",
      type: "website",
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [defaultOgImage.url],
    },
  };
}

export const pageSeo = {
  home: {
    title: siteName,
    description: siteDescriptionSv,
    path: "/",
  },
  builder: {
    title: "Bygg spelidé",
    description:
      "Bygg din spelidé steg för steg. Välj land, liga, match och marknad — lägg till i BrainSlip och få AI-driven fotbollsanalys.",
    path: "/builder",
  },
  analyze: {
    title: "Analysera spelidé",
    description:
      "Klistra in din spelidé och få AI-analys med BrainScore, risknivå, form, tabell och rekommendationer för fotbollsmatcher.",
    path: "/analyze",
  },
  premium: {
    title: "Premium",
    description:
      "BrainStats Pro och Elite — fler AI-analyser, djupare rapporter och dagliga AI-kuponger för fotboll.",
    path: "/premium",
  },
  legal: {
    title: "Juridisk information",
    description:
      "Användarvillkor, integritetspolicy, cookiepolicy, köpvillkor och ansvarsfriskrivning för BrainStats.",
    path: "/legal",
  },
} as const;

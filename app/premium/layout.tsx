import type { Metadata } from "next";

import { createPageMetadata, getLocalizedPageSeo } from "@/lib/seo";
import { detectLanguage } from "@/lib/locale.server";

export async function generateMetadata(): Promise<Metadata> {
  const language = await detectLanguage();
  const seo = getLocalizedPageSeo("premium", language);

  return createPageMetadata({
    title: seo.title,
    description: seo.description,
    path: seo.path,
    keywords: seo.keywords,
    language,
  });
}

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

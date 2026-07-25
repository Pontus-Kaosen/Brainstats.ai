import ValueBetsPageClient from "@/components/ValueBetsPageClient";
import { getLandingPage } from "@/lib/landingPages";
import { detectLanguage } from "@/lib/locale.server";
import { createPageMetadata, getLocalizedPageSeo } from "@/lib/seo";

export async function generateMetadata() {
  const language = await detectLanguage();
  const content = getLandingPage("value-bets", language);
  const seo = getLocalizedPageSeo("valueBets", language);

  return createPageMetadata({
    title: content.seoTitle,
    description: content.seoDescription,
    path: seo.path,
    keywords: seo.keywords,
    language,
  });
}

export default async function ValueBetsPage() {
  const language = await detectLanguage();
  const landing = getLandingPage("value-bets", language);

  return <ValueBetsPageClient landing={landing} />;
}

import AiTipsPageClient from "@/components/AiTipsPageClient";
import { getLandingPage } from "@/lib/landingPages";
import { detectLanguage } from "@/lib/locale.server";
import { createPageMetadata, getLocalizedPageSeo } from "@/lib/seo";

export async function generateMetadata() {
  const language = await detectLanguage();
  const content = getLandingPage("ai-tips", language);
  const seo = getLocalizedPageSeo("aiTips", language);

  return createPageMetadata({
    title: content.seoTitle,
    description: content.seoDescription,
    path: seo.path,
    keywords: seo.keywords,
    language,
  });
}

export default async function AiTipsPage() {
  const language = await detectLanguage();
  const landing = getLandingPage("ai-tips", language);

  return <AiTipsPageClient landing={landing} />;
}

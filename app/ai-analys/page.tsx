import LandingPageView from "@/components/LandingPageView";
import { getLandingPage } from "@/lib/landingPages";
import { detectLanguage } from "@/lib/locale.server";
import { createPageMetadata, pageSeo } from "@/lib/seo";

export async function generateMetadata() {
  const language = await detectLanguage();
  const content = getLandingPage("ai-analys", language);

  return createPageMetadata({
    title: content.seoTitle,
    description: content.seoDescription,
    path: pageSeo.aiAnalys.path,
    keywords: pageSeo.aiAnalys.keywords,
    language,
  });
}

export default async function AiAnalysPage() {
  const language = await detectLanguage();
  const content = getLandingPage("ai-analys", language);

  return <LandingPageView content={content} />;
}

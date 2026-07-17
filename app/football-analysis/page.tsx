import LandingPageView from "@/components/LandingPageView";
import { getLandingPage } from "@/lib/landingPages";
import { detectLanguage } from "@/lib/locale.server";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const language = await detectLanguage();
  const content = getLandingPage("football-analysis", language);

  return createPageMetadata({
    title: content.seoTitle,
    description: content.seoDescription,
    path: "/football-analysis",
  });
}

export default async function FootballAnalysisPage() {
  const language = await detectLanguage();
  const content = getLandingPage("football-analysis", language);

  return <LandingPageView content={content} />;
}

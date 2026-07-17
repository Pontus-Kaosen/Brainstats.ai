import LandingPageView from "@/components/LandingPageView";
import { getLandingPage } from "@/lib/landingPages";
import { detectLanguage } from "@/lib/locale.server";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const language = await detectLanguage();
  const content = getLandingPage("upload-bet-slip", language);

  return createPageMetadata({
    title: content.seoTitle,
    description: content.seoDescription,
    path: "/upload-bet-slip",
  });
}

export default async function UploadBetSlipPage() {
  const language = await detectLanguage();
  const content = getLandingPage("upload-bet-slip", language);

  return <LandingPageView content={content} />;
}

import { createPageMetadata } from "@/lib/seo";
import { detectLanguage } from "@/lib/locale.server";
import { translations } from "@/lib/translations";

export async function generateMetadata() {
  const language = await detectLanguage();
  const t = translations[language].standings;

  return createPageMetadata({
    title: t.title,
    description: t.description,
    path: "/standings",
  });
}

export default function StandingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

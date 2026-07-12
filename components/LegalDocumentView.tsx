"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import { useLanguage } from "@/components/LanguageProvider";
import {
  getLegalDocument,
  type LegalSlug,
} from "@/lib/legalContent";

type LegalDocumentViewProps = {
  slug: LegalSlug;
};

export default function LegalDocumentView({ slug }: LegalDocumentViewProps) {
  const { language, t } = useLanguage();
  const document = getLegalDocument(language, slug);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />

        <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-8 sm:py-14">
          <Link
            href="/legal"
            className="text-sm font-semibold text-[#18ff6d] transition hover:opacity-75"
          >
            {t.legal.backToLegal}
          </Link>

          <header className="mt-8">
            <p className="text-sm uppercase tracking-[0.3em] text-[#18ff6d]">
              BrainStats Legal
            </p>

            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              {document.title}
            </h1>

            <p className="mt-4 text-lg leading-8 text-[#A9A9A9]">
              {document.description}
            </p>

            <p className="mt-3 text-sm text-[#777]">
              {t.legal.lastUpdated}: {document.lastUpdated}
            </p>
          </header>

          <article className="mt-10 space-y-8">
            {document.sections.map((section) => (
              <section
                key={section.title}
                className="rounded-3xl border border-[#18ff6d22] bg-black/35 p-6 sm:p-8"
              >
                <h2 className="text-xl font-bold text-[#E8DCC8]">
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 leading-8 text-[#C8C8C8]"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets && (
                  <ul className="mt-4 space-y-3 text-[#C8C8C8]">
                    {section.bullets.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="text-[#18ff6d]">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>
        </div>
      </div>
    </main>
  );
}

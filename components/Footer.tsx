"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { legalSlugs } from "@/lib/legalSlugs";
import BrainStatsLogo from "@/components/BrainStatsLogo";

export default function Footer() {
  const { t } = useLanguage();

  const links = legalSlugs.map((slug) => ({
    slug,
    label: t.legal.links[slug],
    href: `/legal/${slug}`,
  }));

  return (
    <footer className="relative z-10 border-t border-[#18ff6d22] bg-black/95 px-4 py-6 text-[#FAFAF8] max-md:backdrop-blur-none backdrop-blur-xl sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:gap-8">
          <div>
            <BrainStatsLogo variant="footer" />

            <p className="mt-2 max-w-md text-sm leading-6 text-[#A9A9A9] sm:mt-3 sm:leading-7">
              {t.footer.tagline}
            </p>

            <p className="mt-3 text-xs leading-5 text-[#777] sm:mt-4 sm:text-sm sm:leading-6">
              {t.footer.disclaimer}
            </p>

            <p className="mt-2 text-xs text-[#888] sm:mt-3 sm:text-sm">
              {t.footer.sellerLine}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#18ff6d] sm:text-sm">
              {t.footer.legalHeading}
            </p>

            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:mt-4 sm:space-y-2 sm:block">
              <li>
                <Link
                  href="/legal"
                  className="text-[#D8D8D8] transition hover:text-[#18ff6d]"
                >
                  {t.footer.allLegal}
                </Link>
              </li>

              {links.map((link) => (
                <li key={link.slug}>
                  <Link
                    href={link.href}
                    className="text-[#D8D8D8] transition hover:text-[#18ff6d]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-[#777] sm:flex-row sm:items-center sm:justify-between">
          <p>{t.footer.copyright}</p>
          <p>{t.footer.responsibleGambling}</p>
        </div>
      </div>
    </footer>
  );
}

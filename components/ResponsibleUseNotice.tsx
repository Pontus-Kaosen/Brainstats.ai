"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

type Props = {
  compact?: boolean;
  className?: string;
};

export default function ResponsibleUseNotice({
  compact = false,
  className = "",
}: Props) {
  const { t, language } = useLanguage();
  const helpHref =
    language === "en"
      ? "https://www.begambleaware.org"
      : "https://www.stodlinjen.se";

  if (compact) {
    return (
      <p
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-[#888] ${className}`}
      >
        <span className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#18ff6d]">
          {t.responsibleUse.badge}
        </span>
        <span>{t.responsibleUse.compactText}</span>
        <Link
          href="/legal/disclaimer"
          className="font-semibold text-[#18ff6d] hover:underline"
        >
          {t.responsibleUse.learnMore}
        </Link>
      </p>
    );
  }

  return (
    <aside
      className={`rounded-2xl border border-[#18ff6d22] bg-[#18ff6d]/5 px-4 py-4 sm:px-5 sm:py-5 ${className}`}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="rounded-full border border-[#18ff6d44] bg-[#18ff6d]/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#18ff6d]">
          {t.responsibleUse.badge}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">{t.responsibleUse.title}</p>
          <p className="mt-2 text-sm leading-6 text-[#A9A9A9]">
            {t.responsibleUse.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link
              href="/legal/disclaimer"
              className="font-semibold text-[#18ff6d] hover:underline"
            >
              {t.responsibleUse.disclaimerLink}
            </Link>
            <a
              href={helpHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#72d5ff] hover:underline"
            >
              {t.responsibleUse.helpLink}
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}

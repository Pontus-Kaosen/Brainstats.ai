"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function EarlyAnalysisNotice({
  lineupsConfirmed,
}: {
  lineupsConfirmed?: boolean;
}) {
  const { t } = useLanguage();

  if (lineupsConfirmed !== false) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4">
      <p className="text-sm font-bold text-yellow-100">
        {t.analyze.earlyAnalysisTitle}
      </p>
      <p className="mt-1.5 text-sm leading-6 text-[#E8E8E8]">
        {t.analyze.earlyAnalysisBody}
      </p>
    </section>
  );
}

"use client";

import { useLanguage } from "@/components/LanguageProvider";

const titleGradient =
  "bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-transparent";

export default function PlanComparisonTable() {
  const { t } = useLanguage();
  const rows = t.planComparison.rows;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 p-5 sm:p-8">
      <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
        {t.planComparison.subtitle}
      </p>
      <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
        {t.planComparison.title}
      </h2>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[#A9A9A9]">
              <th className="py-3 pr-4 font-semibold">{t.planComparison.featureCol}</th>
              <th className="px-3 py-3 font-semibold">Free</th>
              <th className="px-3 py-3 font-semibold">Pro</th>
              <th className="px-3 py-3 font-semibold">Elite</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-white/5">
                <td className="py-3 pr-4 text-[#D8D8D8]">{row.label}</td>
                <td className="px-3 py-3 text-[#A9A9A9]">{row.free}</td>
                <td className="px-3 py-3 text-[#18ff6d]">{row.pro}</td>
                <td className="px-3 py-3 text-[#72d5ff]">{row.elite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

"use client";

import { useLanguage } from "@/components/LanguageProvider";

type ParsedBetProps = {
  match: string;
  markets: string[];
};

export default function ParsedBet({ match, markets }: ParsedBetProps) {
  const { t } = useLanguage();

  return (
    <div className="mt-8 rounded-2xl bg-[#101010] p-6">
      <h3 className="text-xl font-bold text-[#E8DCC8]">
        {t.analyze.parsedBetTitle}
      </h3>

      <p className="mt-5">
        <strong>{t.analyze.parsedMatch}</strong> {match}
      </p>

      <p className="mt-4 text-[#A9A9A9]">{t.analyze.parsedMarkets}</p>

      <ul className="mt-2 space-y-2">
        {markets.map((market) => (
          <li key={market}>• {market}</li>
        ))}
      </ul>
    </div>
  );
}

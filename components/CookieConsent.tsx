"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const CONSENT_KEY = "brainstats-cookie-consent";

export default function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(CONSENT_KEY);
    if (!saved) {
      setVisible(true);
    }
  }, []);

  function saveConsent(value: "accepted" | "essential") {
    window.localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#18ff6d33] bg-[#101010]/98 p-5 shadow-[0_0_60px_rgba(24,255,109,.15)] backdrop-blur-xl sm:p-6">
        <p className="text-lg font-bold text-white">{t.cookieConsent.title}</p>

        <p className="mt-3 text-sm leading-7 text-[#A9A9A9]">
          {t.cookieConsent.description}{" "}
          <Link
            href="/legal/cookies"
            className="font-semibold text-[#18ff6d] underline-offset-2 hover:underline"
          >
            {t.cookieConsent.learnMore}
          </Link>
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => saveConsent("accepted")}
            className="rounded-2xl bg-[#18ff6d] px-5 py-3 font-bold text-black transition hover:opacity-90"
          >
            {t.cookieConsent.acceptAll}
          </button>

          <button
            type="button"
            onClick={() => saveConsent("essential")}
            className="rounded-2xl border border-white/15 px-5 py-3 font-bold text-white transition hover:bg-white/5"
          >
            {t.cookieConsent.essentialOnly}
          </button>
        </div>
      </div>
    </div>
  );
}

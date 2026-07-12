"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function selectLanguage(nextLanguage: "sv" | "en") {
    setLanguage(nextLanguage);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-bold text-white transition hover:border-[#18ff6d55] hover:bg-[#18ff6d]/10 sm:px-4"
        aria-label={t.languageSwitcher.ariaLabel}
      >
        <span>{language === "sv" ? "🇸🇪" : "🇬🇧"}</span>

        <span className="hidden sm:inline">
          {language === "sv"
            ? t.languageSwitcher.swedish
            : t.languageSwitcher.english}
        </span>

        <span className="text-xs text-[#18ff6d]">▼</span>
      </button>

      {open && (
        <div className="absolute right-0 z-[100] mt-3 w-52 overflow-hidden rounded-2xl border border-[#18ff6d33] bg-[#101010]/98 p-2 shadow-[0_0_50px_rgba(24,255,109,.18)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => selectLanguage("sv")}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
              language === "sv"
                ? "bg-[#18ff6d]/15 text-[#18ff6d]"
                : "text-white hover:bg-white/5"
            }`}
          >
            <span>🇸🇪 {t.languageSwitcher.swedish}</span>
            {language === "sv" && <span>✓</span>}
          </button>

          <button
            type="button"
            onClick={() => selectLanguage("en")}
            className={`mt-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
              language === "en"
                ? "bg-[#18ff6d]/15 text-[#18ff6d]"
                : "text-white hover:bg-white/5"
            }`}
          >
            <span>🇬🇧 {t.languageSwitcher.english}</span>
            {language === "en" && <span>✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}

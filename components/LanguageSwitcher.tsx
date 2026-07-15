"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import {
  dispatchCloseOverlays,
  subscribeCloseOverlays,
} from "@/lib/overlayEvents";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const overlayId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function closeMenu() {
    setOpen(false);
  }

  useEffect(() => {
    return subscribeCloseOverlays(overlayId, closeMenu);
  }, [overlayId]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function selectLanguage(nextLanguage: "sv" | "en") {
    setLanguage(nextLanguage);
    closeMenu();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (open) {
            closeMenu();
            return;
          }

          dispatchCloseOverlays(overlayId);
          setOpen(true);
        }}
        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-bold text-white transition hover:border-[#18ff6d55] hover:bg-[#18ff6d]/10 sm:px-4"
        aria-label={t.languageSwitcher.ariaLabel}
        aria-expanded={open}
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
        <div className="app-dropdown-layer absolute right-0 mt-3 w-52 overflow-hidden rounded-2xl border border-[#18ff6d33] bg-[#101010]/98 p-2 shadow-[0_0_50px_rgba(24,255,109,.18)] backdrop-blur-xl">
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

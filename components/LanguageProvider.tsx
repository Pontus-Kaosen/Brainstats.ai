"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Language,
  translations,
} from "@/lib/translations";

import type { Translations } from "@/lib/translations";
import { persistLanguageCookie } from "@/lib/languageCookie";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
};

const LanguageContext =
  createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "brainstats-language";

function detectBrowserLanguage(): Language {
  const browserLanguage = navigator.language.toLowerCase();
  return browserLanguage.startsWith("sv") ? "sv" : "en";
}

export default function LanguageProvider({
  children,
  initialLanguage = "sv",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] =
    useState<Language>(initialLanguage);

  useEffect(() => {
    const savedLanguage =
      window.localStorage.getItem(STORAGE_KEY);

    if (
      savedLanguage === "sv" ||
      savedLanguage === "en"
    ) {
      setLanguageState(savedLanguage);
      document.documentElement.lang = savedLanguage;
      persistLanguageCookie(savedLanguage);
      return;
    }

    const resolvedLanguage = initialLanguage || detectBrowserLanguage();

    setLanguageState(resolvedLanguage);
    document.documentElement.lang = resolvedLanguage;
    window.localStorage.setItem(STORAGE_KEY, resolvedLanguage);
    persistLanguageCookie(resolvedLanguage);
  }, [initialLanguage]);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);

    window.localStorage.setItem(
      STORAGE_KEY,
      nextLanguage
    );

    persistLanguageCookie(nextLanguage);

    document.documentElement.lang =
      nextLanguage;
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage måste användas inuti LanguageProvider."
    );
  }

  return context;
}

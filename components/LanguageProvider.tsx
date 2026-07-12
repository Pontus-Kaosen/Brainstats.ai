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

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
};

const LanguageContext =
  createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "brainstats-language";

export default function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>("sv");

  useEffect(() => {
    const savedLanguage =
      window.localStorage.getItem(STORAGE_KEY);

    if (
      savedLanguage === "sv" ||
      savedLanguage === "en"
    ) {
      setLanguageState(savedLanguage);
      document.documentElement.lang = savedLanguage;
      return;
    }

    const browserLanguage =
      navigator.language.toLowerCase();

    const detectedLanguage: Language =
      browserLanguage.startsWith("sv")
        ? "sv"
        : "en";

    setLanguageState(detectedLanguage);
    document.documentElement.lang = detectedLanguage;
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);

    window.localStorage.setItem(
      STORAGE_KEY,
      nextLanguage
    );

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
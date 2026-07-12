export type Language = "sv" | "en";

export const translations = {
  sv: {
    languageName: "Svenska",

    navbar: {
      home: "Startsida",
      builder: "Builder",
      dashboard: "Dashboard",
      premium: "Premium",
      login: "Logga in",
      logout: "Logga ut",
      loggedInAs: "Inloggad som",
      footballIntelligence: "Fotbollsintelligens",
    },
  },

  en: {
    languageName: "English",

    navbar: {
      home: "Home",
      builder: "Builder",
      dashboard: "Dashboard",
      premium: "Premium",
      login: "Log in",
      logout: "Log out",
      loggedInAs: "Signed in as",
      footballIntelligence: "Football Intelligence",
    },
  },
} as const;

export type Translations = typeof translations[Language];
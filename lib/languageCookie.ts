export const LANGUAGE_COOKIE = "brainstats-language";

export function persistLanguageCookie(language: "sv" | "en") {
  document.cookie = `${LANGUAGE_COOKIE}=${language};path=/;max-age=31536000;SameSite=Lax`;
}

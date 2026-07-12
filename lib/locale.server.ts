import { cookies, headers } from "next/headers";
import type { Language } from "@/lib/translations";

const LANGUAGE_COOKIE = "brainstats-language";

export async function detectLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LANGUAGE_COOKIE)?.value;

  if (saved === "sv" || saved === "en") {
    return saved;
  }

  const acceptLanguage = (await headers())
    .get("accept-language")
    ?.toLowerCase();

  if (acceptLanguage?.startsWith("sv")) {
    return "sv";
  }

  return "en";
}

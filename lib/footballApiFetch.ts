import { NextResponse } from "next/server";

const FOOTBALL_API_BASE = "https://v3.football.api-sports.io";

export async function fetchFootballApi(
  path: string,
  revalidateSeconds: number,
  init?: RequestInit
) {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY saknas.");
  }

  return fetch(`${FOOTBALL_API_BASE}/${path}`, {
    ...init,
    headers: {
      "x-apisports-key": apiKey,
      ...init?.headers,
    },
    next: { revalidate: revalidateSeconds },
  });
}

export function getFootballApiErrors(data: unknown) {
  const errors =
    data &&
    typeof data === "object" &&
    "errors" in data &&
    data.errors &&
    typeof data.errors === "object"
      ? (data.errors as Record<string, unknown>)
      : null;

  if (!errors || Object.keys(errors).length === 0) {
    return null;
  }

  return errors;
}

export function jsonWithCache(
  body: unknown,
  revalidateSeconds: number,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": `public, s-maxage=${revalidateSeconds}, stale-while-revalidate=${Math.max(revalidateSeconds * 2, 120)}`,
    },
  });
}

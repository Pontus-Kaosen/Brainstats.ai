import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildBetImageSystemPrompt,
  buildBetImageUserPrompt,
  getParseImageApiMessages,
  parseRequestLanguage,
} from "@/lib/aiPrompts";
import {
  resolvePicksToAnalyzeText,
  type ExtractedBetPick,
} from "@/lib/betSlipResolver";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function parseImageDataUrl(image: string) {
  const match = image.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);

  if (!match) {
    return null;
  }

  const mimeType = match[1].toLowerCase();
  const base64 = match[2];
  const bytes = Buffer.byteLength(base64, "base64");

  if (!ALLOWED_MIME_TYPES.has(mimeType) || bytes > MAX_IMAGE_BYTES) {
    return null;
  }

  return {
    mimeType,
    dataUrl: image,
  };
}

function parseVisionResponse(content: string) {
  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as {
    picks?: Array<{
      homeTeam?: string;
      awayTeam?: string;
      market?: string;
      playerName?: string | null;
    }>;
  };

  const picks = (parsed.picks || [])
    .map((pick) => ({
      homeTeam: pick.homeTeam?.trim() || "",
      awayTeam: pick.awayTeam?.trim() || "",
      market: pick.market?.trim() || "",
      playerName: pick.playerName?.trim() || null,
    }))
    .filter((pick) => pick.homeTeam && pick.awayTeam && pick.market);

  return picks as ExtractedBetPick[];
}

export async function POST(req: Request) {
  const requestBody = await req.json().catch(() => ({}));
  const language = parseRequestLanguage(requestBody?.language);
  const messages = getParseImageApiMessages(language);

  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { success: false, error: messages.mustLogin },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: messages.authFailed },
        { status: 401 }
      );
    }

    const image =
      typeof requestBody?.image === "string" ? requestBody.image.trim() : "";

    if (!image) {
      return NextResponse.json(
        { success: false, error: messages.noImage },
        { status: 400 }
      );
    }

    const parsedImage = parseImageDataUrl(image);

    if (!parsedImage) {
      return NextResponse.json(
        { success: false, error: messages.invalidImage },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildBetImageSystemPrompt(language),
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildBetImageUserPrompt(language),
            },
            {
              type: "image_url",
              image_url: {
                url: parsedImage.dataUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1800,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { success: false, error: messages.parseFailed },
        { status: 502 }
      );
    }

    let picks: ExtractedBetPick[];

    try {
      picks = parseVisionResponse(content);
    } catch {
      return NextResponse.json(
        { success: false, error: messages.parseFailed },
        { status: 502 }
      );
    }

    if (picks.length === 0) {
      return NextResponse.json(
        { success: false, error: messages.noPicksFound },
        { status: 422 }
      );
    }

    const resolved = await resolvePicksToAnalyzeText(picks);

    return NextResponse.json({
      success: true,
      text: resolved.text,
      picks,
      resolved: resolved.resolved,
      warning: resolved.warning,
    });
  } catch (error) {
    console.error("Bet slip image parse error:", error);

    return NextResponse.json(
      {
        success: false,
        error: messages.parseFailed,
      },
      { status: 500 }
    );
  }
}

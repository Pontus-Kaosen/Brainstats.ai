import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local saknas");
  }

  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].trim().replace(/^"|"$/g, "");
  }
  return env;
}

function findTestImage() {
  const candidates = [
    path.join(root, "scripts", "fixtures", "test-betslip.png"),
    path.join(
      process.env.USERPROFILE || "",
      ".cursor",
      "projects",
      "c-Users-Poppe-BrainStatsClean",
      "assets",
      "test-betslip.png"
    ),
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("test-betslip.png hittades inte");
}

function toDataUrl(filePath) {
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

async function runTest(name, fn) {
  process.stdout.write(`→ ${name} ... `);
  try {
    await fn();
    console.log("OK");
    return true;
  } catch (error) {
    console.log("FAIL");
    console.error(`  ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

async function getAccessToken(env) {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const email = `parse-image-test-${Date.now()}@brainstats.test`;
  const password = `Test-${Date.now()}-Aa1!`;

  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    throw new Error(`Kunde inte skapa testanvändare: ${createError.message}`);
  }

  const anon = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data, error } = await anon.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session?.access_token) {
    throw new Error(`Kunde inte logga in testanvändare: ${error?.message}`);
  }

  return {
    token: data.session.access_token,
    userId: data.user.id,
    supabaseAdmin: supabase,
  };
}

async function main() {
  const env = loadEnv();
  const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";
  const imagePath = findTestImage();
  const dataUrl = toDataUrl(imagePath);

  console.log(`BrainStats parse-image test`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Testbild: ${imagePath}`);
  console.log("");

  const results = [];

  results.push(
    await runTest("401 utan inloggning", async () => {
      const response = await fetch(`${baseUrl}/api/analyze/parse-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, language: "sv" }),
      });

      if (response.status !== 401) {
        throw new Error(`Förväntade 401, fick ${response.status}`);
      }
    })
  );

  results.push(
    await runTest("400 vid ogiltig bild", async () => {
      const response = await fetch(`${baseUrl}/api/analyze/parse-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({ image: "not-a-data-url", language: "sv" }),
      });

      if (response.status !== 401 && response.status !== 400) {
        const body = await response.text();
        throw new Error(`Förväntade 400/401, fick ${response.status}: ${body}`);
      }
    })
  );

  let cleanup = null;

  results.push(
    await runTest("Inloggad bilduppladdning (OpenAI + resolver)", async () => {
      const session = await getAccessToken(env);
      cleanup = session;

      const response = await fetch(`${baseUrl}/api/analyze/parse-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          image: dataUrl,
          language: "sv",
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${body.error || JSON.stringify(body)}`
        );
      }

      if (!body.success || !body.text) {
        throw new Error(`Svar saknar text: ${JSON.stringify(body)}`);
      }

      const lower = body.text.toLowerCase();
      const hasTeam =
        lower.includes("arsenal") ||
        lower.includes("chelsea") ||
        body.picks?.length > 0;

      if (!hasTeam) {
        throw new Error(`Oväntat svar: ${body.text.slice(0, 200)}`);
      }

      console.log("");
      console.log("  Extraherad text:");
      console.log(
        body.text
          .split("\n")
          .map((line) => `    ${line}`)
          .join("\n")
      );
      if (body.warning) {
        console.log(`  Varning: ${body.warning}`);
      }
    })
  );

  if (cleanup?.supabaseAdmin && cleanup?.userId) {
    await cleanup.supabaseAdmin.auth.admin.deleteUser(cleanup.userId);
  }

  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log("");
  console.log(`${passed}/${total} tester godkända`);

  if (passed !== total) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import fs from "fs";
import path from "path";
import QRCode from "qrcode";

const URL = "https://brainstats.eu";
const DOMAIN = "brainstats.eu";
const AI_TIPS_LINE = "Dagliga AI-tips på dina matcher";
const OUT_DIR = path.join(process.cwd(), "public", "print");
const LOGO_MARK_PATH = path.join(OUT_DIR, "brainstats-logo-mark.svg");
const MODULE_PX = 18;
const QUIET = 2;
const BRAND_SIZE = 40;
const DOMAIN_SIZE = 30;
const TIPS_SIZE = 20;
const GAP = 18;
const SIDE_PADDING = 24;
const TOP_PADDING = 20;
const LINE_HEIGHT = 26;
const LOGO_SCALE = 0.24;

function readLogoMarkInner() {
  const raw = fs.readFileSync(LOGO_MARK_PATH, "utf8");
  return raw
    .replace(/<\?xml[^>]*\?>\s*/i, "")
    .replace(/^<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim();
}

function buildQrSvg(url, logoMarkInner) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const { size, data } = qr.modules;
  const dim = size + QUIET * 2;
  const px = dim * MODULE_PX;

  let rects = "";

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!data[row * size + col]) continue;
      const x = (col + QUIET) * MODULE_PX;
      const y = (row + QUIET) * MODULE_PX;
      rects += `<rect x="${x}" y="${y}" width="${MODULE_PX}" height="${MODULE_PX}" fill="#000000"/>`;
    }
  }

  const logoSize = px * LOGO_SCALE;
  const logoX = (px - logoSize) / 2;
  const logoY = (px - logoSize) / 2;
  const logoOverlay = `
    <rect x="${logoX - 4}" y="${logoY - 4}" width="${logoSize + 8}" height="${logoSize + 8}" rx="${(logoSize + 8) * 0.12}" fill="#ffffff"/>
    <g transform="translate(${logoX}, ${logoY}) scale(${logoSize / 120})">
      ${logoMarkInner}
    </g>
  `;

  return { px, rects: `${rects}${logoOverlay}` };
}

function brandText(center, y) {
  return `<text
    x="${center}"
    y="${y}"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${BRAND_SIZE}"
    font-weight="800"
    fill="#000000"
  ><tspan fill="#000000">Brain</tspan><tspan fill="#18ff6d">Stats</tspan></text>`;
}

function domainText(center, y) {
  return `<text
    x="${center}"
    y="${y}"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${DOMAIN_SIZE}"
    font-weight="700"
    fill="#000000"
  >${DOMAIN}</text>`;
}

function textLine(center, y, content, size, weight = "400", color = "#000000") {
  return `<text
    x="${center}"
    y="${y}"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${size}"
    font-weight="${weight}"
    fill="${color}"
  >${content}</text>`;
}

function createPrintSvg({ rects, px, lines, showAiTips = false }) {
  const width = px + SIDE_PADDING * 2;
  const center = width / 2;

  let y = TOP_PADDING + BRAND_SIZE * 0.85;
  const parts = [brandText(center, y)];

  y += GAP;

  for (const line of lines) {
    y += line.size * 0.85;
    parts.push(textLine(center, y, line.text, line.size, line.weight, line.color));
    y += LINE_HEIGHT - line.size * 0.85;
  }

  y += GAP;
  const qrY = y;
  parts.push(`<g transform="translate(${SIDE_PADDING}, ${qrY})">${rects}</g>`);

  y = qrY + px + GAP;

  if (showAiTips) {
    y += TIPS_SIZE * 0.85;
    parts.push(textLine(center, y, AI_TIPS_LINE, TIPS_SIZE, "600"));
    y += GAP;
  }

  y += DOMAIN_SIZE * 0.85;
  parts.push(domainText(center, y));

  const height = y + TOP_PADDING;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${parts.join("\n  ")}
</svg>
`;
}

function writePrintHtml(filename, svgFilename) {
  const htmlPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(
    htmlPath,
    `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <title>BrainStats QR</title>
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" href="/icon.png" type="image/png" sizes="512x512" />
  <link rel="apple-touch-icon" href="/apple-icon.png" />
  <style>
    @page { margin: 12mm; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    img { width: 95mm; max-width: 100%; height: auto; }
    @media print { body { min-height: auto; } }
  </style>
</head>
<body>
  <img src="./${svgFilename}" alt="BrainStats QR" />
</body>
</html>
`,
    "utf8"
  );
  return htmlPath;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const logoMarkInner = readLogoMarkInner();
  const { px, rects } = buildQrSvg(URL, logoMarkInner);

  const lines = [
    {
      text: "Analysera dina fotbollsspel med vår AI",
      size: 22,
      weight: "700",
    },
    {
      text: "Alternativ 1 · Klistra in din spelidé",
      size: 18,
      weight: "500",
    },
    {
      text: "Alternativ 2 · Ladda upp bild på kupongen",
      size: 18,
      weight: "500",
    },
    {
      text: "Alternativ 3 · Bygg ditt eget spel",
      size: 18,
      weight: "500",
    },
  ];

  const svg = createPrintSvg({
    rects,
    px,
    showAiTips: true,
    lines,
  });

  const svgPath = path.join(OUT_DIR, "brainstats-qr-print.svg");
  fs.writeFileSync(svgPath, svg, "utf8");

  const htmlPath = writePrintHtml("brainstats-qr-print.html", "brainstats-qr-print.svg");

  console.log("Created:", svgPath);
  console.log("Print via:", htmlPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import fs from "fs";
import path from "path";
import pngToIco from "png-to-ico";
import sharp from "sharp";

const SOURCE = path.join(process.cwd(), "assets", "brainstats-icon-drawn.svg");
const RENDER_SIZE = 512;

async function renderIcon(size) {
  return sharp(SOURCE, { density: Math.max(192, Math.round((size / RENDER_SIZE) * 384)) })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Missing source image: ${SOURCE}`);
  }

  const icon32 = await renderIcon(32);
  const icon180 = await renderIcon(180);
  const favicon16 = await renderIcon(16);
  const favicon32 = await renderIcon(32);
  const favicon48 = await renderIcon(48);

  const appDir = path.join(process.cwd(), "app");
  const publicDir = path.join(process.cwd(), "public");

  fs.writeFileSync(path.join(appDir, "icon.png"), icon32);
  fs.writeFileSync(path.join(appDir, "apple-icon.png"), icon180);
  fs.writeFileSync(path.join(publicDir, "favicon-16x16.png"), favicon16);
  fs.writeFileSync(path.join(publicDir, "favicon-32x32.png"), favicon32);

  const faviconIco = await pngToIco([favicon16, favicon32, favicon48]);
  fs.writeFileSync(path.join(appDir, "favicon.ico"), faviconIco);
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), faviconIco);

  console.log("Created drawn favicon assets from", SOURCE);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

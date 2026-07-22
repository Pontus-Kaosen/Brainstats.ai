import fs from "fs";
import path from "path";
import pngToIco from "png-to-ico";
import sharp from "sharp";

const SOURCE = path.join(process.cwd(), "assets", "brainstats-icon-source.jpg");
const CROP_SIZE = 720;
const CROP_TOP = 36;
const CROP_LEFT = Math.floor((1024 - CROP_SIZE) / 2);

async function cropIcon(zoom = 1.12) {
  const size = Math.floor(CROP_SIZE / zoom);
  const left = CROP_LEFT + Math.floor((CROP_SIZE - size) / 2);
  const top = CROP_TOP + Math.floor((CROP_SIZE - size) / 2);

  return sharp(SOURCE).extract({
    left,
    top,
    width: size,
    height: size,
  });
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Missing source image: ${SOURCE}`);
  }

  const cropped = await cropIcon();

  await cropped.clone().resize(32, 32).png().toFile(path.join(process.cwd(), "app", "icon.png"));
  await cropped.clone().resize(180, 180).png().toFile(path.join(process.cwd(), "app", "apple-icon.png"));

  const favicon16 = await cropped.clone().resize(16, 16).png().toBuffer();
  const favicon32 = await cropped.clone().resize(32, 32).png().toBuffer();
  const favicon48 = await cropped.clone().resize(48, 48).png().toBuffer();

  const publicDir = path.join(process.cwd(), "public");
  fs.writeFileSync(path.join(publicDir, "favicon-16x16.png"), favicon16);
  fs.writeFileSync(path.join(publicDir, "favicon-32x32.png"), favicon32);

  const faviconIco = await pngToIco([favicon16, favicon32, favicon48]);

  fs.writeFileSync(path.join(process.cwd(), "app", "favicon.ico"), faviconIco);
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), faviconIco);

  console.log("Created app/icon.png (32x32)");
  console.log("Created app/apple-icon.png");
  console.log("Created app/favicon.ico");
  console.log("Created public/favicon.ico");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

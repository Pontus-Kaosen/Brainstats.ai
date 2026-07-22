import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE = path.join(process.cwd(), "assets", "brainstats-icon-source.jpg");
const CROP_SIZE = 720;
const CROP_TOP = 36;
const CROP_LEFT = Math.floor((1024 - CROP_SIZE) / 2);

async function cropIcon() {
  return sharp(SOURCE).extract({
    left: CROP_LEFT,
    top: CROP_TOP,
    width: CROP_SIZE,
    height: CROP_SIZE,
  });
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Missing source image: ${SOURCE}`);
  }

  const cropped = await cropIcon();

  await cropped.clone().resize(512, 512).png().toFile(path.join(process.cwd(), "app", "icon.png"));
  await cropped.clone().resize(180, 180).png().toFile(path.join(process.cwd(), "app", "apple-icon.png"));
  await cropped.clone().resize(32, 32).png().toFile(path.join(process.cwd(), "app", "favicon.png"));

  console.log("Created app/icon.png");
  console.log("Created app/apple-icon.png");
  console.log("Created app/favicon.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

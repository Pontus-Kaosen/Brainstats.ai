import fs from "fs";
import path from "path";
import sharp from "sharp";
import toIco from "to-ico";

const SOURCE = path.join(process.cwd(), "assets", "brainstats-icon-source.jpg");
const CROP_SIZE = 720;
const CROP_TOP = 36;
const CROP_LEFT = Math.floor((1024 - CROP_SIZE) / 2);

async function cropIcon(zoom = 1) {
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

  const cropped = await cropIcon(1);
  const croppedTight = await cropIcon(1.15);

  await cropped.clone().resize(512, 512).png().toFile(path.join(process.cwd(), "app", "icon.png"));
  await cropped.clone().resize(180, 180).png().toFile(path.join(process.cwd(), "app", "apple-icon.png"));

  const faviconSizes = [16, 32, 48];
  const faviconBuffers = await Promise.all(
    faviconSizes.map((size) =>
      croppedTight.clone().resize(size, size, { fit: "cover" }).png().toBuffer()
    )
  );

  const faviconIco = await toIco(faviconBuffers);

  const appFavicon = path.join(process.cwd(), "app", "favicon.ico");
  const publicFavicon = path.join(process.cwd(), "public", "favicon.ico");

  fs.writeFileSync(appFavicon, faviconIco);
  fs.writeFileSync(publicFavicon, faviconIco);

  console.log("Created app/icon.png");
  console.log("Created app/apple-icon.png");
  console.log("Created app/favicon.ico");
  console.log("Created public/favicon.ico");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

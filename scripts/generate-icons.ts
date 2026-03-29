import sharp from "sharp";
import path from "path";
import fs from "fs";

const publicDir = path.join(process.cwd(), "public");

const sizes = [
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 32, name: "favicon-32.png" },
  { size: 16, name: "favicon-16.png" },
];

const candidates = [
  "logo.svg",
  "logo.png",
  "orixlink-logo.svg",
  "icon.svg",
  "OrixLink-logo.svg",
  "OrixLink-logo.png",
];

async function findSourceFile(): Promise<string> {
  for (const candidate of candidates) {
    const fullPath = path.join(publicDir, candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  throw new Error(
    "No logo file found in public/. " + "Add logo.svg or logo.png to public/"
  );
}

async function generateIcons() {
  const sourcePath = await findSourceFile();
  console.log(`Using source: ${sourcePath}`);

  for (const { size, name } of sizes) {
    const outputPath = path.join(publicDir, name);
    await sharp(sourcePath)
      .resize(size, size, {
        fit: "contain",
        background: { r: 8, g: 12, b: 20, alpha: 1 },
      })
      .png()
      .toFile(outputPath);
    console.log(`Generated ${name} (${size}x${size})`);
  }

  console.log("All icons generated successfully");
}

generateIcons().catch(console.error);

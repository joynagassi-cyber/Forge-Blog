/**
 * PWA icon generator.
 * Converts the master SVG icon to 192x192 and 512x512 PNGs.
 *
 * Usage:
 *   node scripts/generate-pwa-icons.mjs
 *
 * Requires: npm install -D sharp
 */

import { readFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SVG_PATH = resolve(ROOT, "public/icons/icon.svg");
const OUT_DIR = resolve(ROOT, "public/icons");

const SIZES = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

async function main() {
  // Try to load sharp — it may not be installed (optional dependency)
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.log("[icons] sharp not installed. Install it with: npm install -D sharp");
    console.log("[icons] Skipping PNG generation — SVG icons will serve as fallback.");
    return;
  }

  const svg = await readFile(SVG_PATH, "utf-8");

  await mkdir(OUT_DIR, { recursive: true });

  for (const { name, size } of SIZES) {
    const outPath = resolve(OUT_DIR, name);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`[icons] Generated ${name} (${size}x${size})`);
  }

  console.log("[icons] Done! PNG icons are ready.");
}

main().catch((err) => {
  console.error("[icons] Error:", err.message);
  process.exit(1);
});

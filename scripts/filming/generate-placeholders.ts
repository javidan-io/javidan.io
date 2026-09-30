/**
 * Generates placeholder gallery media plus the manifest used when no
 * DATABASE_URL is configured. Re-run with `pnpm media:placeholders`.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { mediaRecordSchema, type MediaRecord } from "@/lib/filming/types";
import {
  blurDataUrl,
  extractPoster,
  imageSize,
  renderGradientVideo,
} from "./media-tools";

const LOCAL_ROOT = path.join(process.cwd(), "public", "filming", "local");
const MANIFEST = path.join(process.cwd(), "lib", "filming", "placeholder-media.json");
const SELFIE = path.join(process.cwd(), "media", "originals", "javidan-selfie.jpg");

const PALETTE: [string, string][] = [
  ["b89a7a", "5c4633"],
  ["8fa3a0", "34423f"],
  ["c9b8a3", "7d6a58"],
  ["6f7c8a", "23292f"],
  ["d1a57a", "7a4a2a"],
  ["a4a58c", "4b4c38"],
  ["9c8577", "3e302a"],
  ["b7c0c7", "5d6a74"],
];

// Aspect ratios (w, h) cycled across items; long edge 1600px.
const RATIOS: [number, number][] = [
  [2, 3], [3, 2], [4, 5], [3, 4], [1, 1], [16, 9], [4, 5], [2, 3], [3, 2],
];

// Varied lengths so the two-line clamp under tiles is exercised.
const DESCRIPTIONS = [
  "Placeholder — the story behind this frame goes here.",
  "Short note.",
  "Placeholder description. A longer line to see how two lines of text wrap and get clipped under the tile when there is more to say.",
  "Where, when and why this was shot.",
];

const VIDEO_AT = new Set([2, 7, 13, 19]);
const SELFIE_AT = 4;
const TOTAL = 28;

function size([w, h]: [number, number], longEdge: number) {
  return w >= h
    ? { width: longEdge, height: Math.round((longEdge * h) / w) }
    : { width: Math.round((longEdge * w) / h), height: longEdge };
}

function placeholderSvg(width: number, height: number, [from, to]: [string, string], label: string) {
  const font = Math.round(Math.min(width, height) * 0.035);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#${from}"/><stop offset="1" stop-color="#${to}"/>
    </linearGradient>
    <radialGradient id="l" cx="0.3" cy="0.25" r="0.6">
      <stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#l)"/>
  <text x="${font * 1.5}" y="${height - font * 1.5}" font-family="Helvetica, Arial, sans-serif" font-size="${font}" letter-spacing="2" fill="#fff" fill-opacity="0.75">${label}</text>
</svg>`);
}

async function main() {
  await fs.rm(LOCAL_ROOT, { recursive: true, force: true });
  await fs.mkdir(path.join(LOCAL_ROOT, "placeholders"), { recursive: true });
  await fs.mkdir(path.join(LOCAL_ROOT, "originals"), { recursive: true });

  const records: MediaRecord[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const n = String(i + 1).padStart(2, "0");
    const sortOrder = (i + 1) * 10;

    if (i === SELFIE_AT) {
      const objectKey = "originals/javidan-selfie.jpg";
      const out = path.join(LOCAL_ROOT, objectKey);
      await sharp(SELFIE).rotate().jpeg({ quality: 85, mozjpeg: true }).toFile(out);
      records.push({
        slug: "javidan-on-set",
        kind: "photo",
        title: "On set",
        description: "Self-portrait with the Pocket 6K.",
        views: 0,
        objectKey,
        posterKey: null,
        ...(await imageSize(out)),
        durationSeconds: null,
        mime: "image/jpeg",
        blurDataUrl: await blurDataUrl(out),
        sortOrder,
      });
      continue;
    }

    const colours = PALETTE[i % PALETTE.length];

    if (VIDEO_AT.has(i)) {
      const portrait = i % 2 === 1;
      const { width, height } = portrait
        ? { width: 720, height: 1280 }
        : { width: 1280, height: 720 };
      const objectKey = `placeholders/video-${n}.mp4`;
      const posterKey = `placeholders/video-${n}.jpg`;
      const videoPath = path.join(LOCAL_ROOT, objectKey);
      const posterPath = path.join(LOCAL_ROOT, posterKey);
      const seconds = 6;

      await renderGradientVideo({ out: videoPath, width, height, from: colours[0], to: colours[1], seconds });
      await extractPoster(videoPath, posterPath);

      records.push({
        slug: `placeholder-video-${n}`,
        kind: "video",
        title: `Placeholder film ${n}`,
        description: "Video placeholder — real footage coming soon.",
        views: 0,
        objectKey,
        posterKey,
        width,
        height,
        durationSeconds: seconds,
        mime: "video/mp4",
        blurDataUrl: await blurDataUrl(posterPath),
        sortOrder,
      });
      continue;
    }

    const { width, height } = size(RATIOS[i % RATIOS.length], 1600);
    const objectKey = `placeholders/photo-${n}.jpg`;
    const out = path.join(LOCAL_ROOT, objectKey);
    await sharp(placeholderSvg(width, height, colours, `PLACEHOLDER ${n}`))
      .jpeg({ quality: 70, mozjpeg: true })
      .toFile(out);

    records.push({
      slug: `placeholder-photo-${n}`,
      kind: "photo",
      title: `Placeholder photo ${n}`,
      description: DESCRIPTIONS[i % DESCRIPTIONS.length],
      views: 0,
      objectKey,
      posterKey: null,
      width,
      height,
      durationSeconds: null,
      mime: "image/jpeg",
      blurDataUrl: await blurDataUrl(out),
      sortOrder,
    });
  }

  const validated = records.map((record) => mediaRecordSchema.parse(record));
  await fs.writeFile(MANIFEST, `${JSON.stringify(validated, null, 2)}\n`);
  console.log(`Wrote ${validated.length} items to ${path.relative(process.cwd(), MANIFEST)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

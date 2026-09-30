import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import type { MediaKind } from "@/lib/filming/types";

const run = promisify(execFile);
const require = createRequire(import.meta.url);

/** Prefer FFMPEG_PATH / FFPROBE_PATH, then the bundled dev binaries. */
function binary(env: string, pkg: string): string {
  return process.env[env] ?? (require(pkg) as { path: string }).path;
}

const ffmpeg = () => binary("FFMPEG_PATH", "@ffmpeg-installer/ffmpeg");
const ffprobe = () => binary("FFPROBE_PATH", "@ffprobe-installer/ffprobe");

const MIME_BY_EXT: Record<string, { kind: MediaKind; mime: string }> = {
  ".jpg": { kind: "photo", mime: "image/jpeg" },
  ".jpeg": { kind: "photo", mime: "image/jpeg" },
  ".png": { kind: "photo", mime: "image/png" },
  ".webp": { kind: "photo", mime: "image/webp" },
  ".avif": { kind: "photo", mime: "image/avif" },
  ".mp4": { kind: "video", mime: "video/mp4" },
  ".m4v": { kind: "video", mime: "video/mp4" },
  ".mov": { kind: "video", mime: "video/quicktime" },
  ".webm": { kind: "video", mime: "video/webm" },
};

export function detectMedia(file: string) {
  const match = MIME_BY_EXT[path.extname(file).toLowerCase()];
  if (!match) throw new Error(`Unsupported file type: ${file}`);
  return match;
}

/** Tiny blurred preview for next/image `placeholder="blur"`. */
export async function blurDataUrl(input: string | Buffer): Promise<string> {
  const buffer = await sharp(input)
    .rotate()
    .resize(16, 16, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString("base64")}`;
}

/** Display dimensions, honouring EXIF orientation. */
export async function imageSize(input: string | Buffer) {
  const meta = await sharp(input).metadata();
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;
  if (!width || !height) throw new Error("Could not read image dimensions");
  return { width, height };
}

export async function probeVideo(file: string) {
  const { stdout } = await run(ffprobe(), [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_streams",
    "-show_format",
    "-of",
    "json",
    file,
  ]);
  const data = JSON.parse(stdout) as {
    streams: {
      width: number;
      height: number;
      tags?: { rotate?: string };
      side_data_list?: { rotation?: number }[];
    }[];
    format: { duration?: string };
  };
  const stream = data.streams[0];
  if (!stream) throw new Error(`No video stream in ${file}`);

  const rotation = Math.abs(
    Number(stream.tags?.rotate ?? stream.side_data_list?.[0]?.rotation ?? 0),
  );
  const sideways = rotation === 90 || rotation === 270;

  return {
    width: sideways ? stream.height : stream.width,
    height: sideways ? stream.width : stream.height,
    durationSeconds: data.format.duration
      ? Math.round(Number(data.format.duration) * 10) / 10
      : null,
  };
}

/** Grab a JPEG frame to use as the video's poster. */
export async function extractPoster(file: string, out: string, atSeconds = 1) {
  await run(ffmpeg(), [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-ss",
    String(atSeconds),
    "-i",
    file,
    "-frames:v",
    "1",
    "-q:v",
    "3",
    out,
  ]);
}

export async function renderGradientVideo(options: {
  out: string;
  width: number;
  height: number;
  from: string;
  to: string;
  seconds: number;
}) {
  const { out, width, height, from, to, seconds } = options;
  await run(ffmpeg(), [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    `gradients=s=${width}x${height}:c0=0x${from}:c1=0x${to}:speed=0.015:d=${seconds}:r=24`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "30",
    "-movflags",
    "+faststart",
    out,
  ]);
}

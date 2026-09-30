/**
 * Uploads the placeholder media to MinIO and upserts rows into Postgres.
 * Safe to re-run. Usage: pnpm db:seed
 */
import "./env";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getDb } from "@/lib/filming/db/client";
import { mediaAssets } from "@/lib/filming/db/schema";
import placeholderMedia from "@/lib/filming/placeholder-media.json";
import { ensurePublicBucket, putObject } from "@/lib/filming/storage";
import { mediaRecordSchema } from "@/lib/filming/types";

const LOCAL_ROOT = path.join(process.cwd(), "public", "filming", "local");

async function upload(key: string, contentType: string) {
  await putObject(key, await fs.readFile(path.join(LOCAL_ROOT, key)), contentType);
}

async function main() {
  const records = z.array(mediaRecordSchema).parse(placeholderMedia);
  const db = getDb();

  await ensurePublicBucket();

  for (const record of records) {
    await upload(record.objectKey, record.mime);
    if (record.posterKey) await upload(record.posterKey, "image/jpeg");

    // Re-seeding refreshes metadata but never resets collected views.
    await db
      .insert(mediaAssets)
      .values(record)
      .onConflictDoUpdate({ target: mediaAssets.slug, set: { ...record, views: undefined } });

    console.log(`✓ ${record.kind.padEnd(5)} ${record.slug}`);
  }

  console.log(`Seeded ${records.length} items.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

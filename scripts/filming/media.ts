/**
 * Manage /filming media in MinIO + Postgres.
 *
 *   pnpm media:add <file> [--title "…"] [--description "…"] [--slug …] [--order N] [--first] [--draft]
 *   pnpm media:album <slug> [--title "…"] [--description "…"] [--views N] [--first] <file> [file …]
 *   pnpm media:edit <slug> [--title "…"] [--description "…"] [--views N] [--order N] [--publish | --draft]
 *   pnpm media:remove <slug>
 *   pnpm media:list
 */
import "./env";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { asc, count, eq, isNotNull, isNull, max, min } from "drizzle-orm";
import { getDb } from "@/lib/filming/db/client";
import { mediaAssets, type NewMediaAssetRow } from "@/lib/filming/db/schema";
import { deleteObject, ensurePublicBucket, uploadFile } from "@/lib/filming/storage";
import { mediaRecordSchema } from "@/lib/filming/types";
import {
  blurDataUrl,
  detectMedia,
  extractPoster,
  imageSize,
  probeVideo,
} from "./media-tools";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromFile(file: string) {
  const words = path.parse(file).name.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

async function uniqueSlug(base: string) {
  const db = getDb();
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const [taken] = await db
      .select({ id: mediaAssets.id })
      .from(mediaAssets)
      .where(eq(mediaAssets.slug, slug));
    if (!taken) return slug;
  }
}

/** Next sort position among top-level gallery items. */
async function nextSortOrder(first: boolean) {
  const [row] = await getDb()
    .select({ low: min(mediaAssets.sortOrder), high: max(mediaAssets.sortOrder) })
    .from(mediaAssets)
    .where(isNull(mediaAssets.parentId));
  return first ? (row?.low ?? 10) - 10 : (row?.high ?? 0) + 10;
}

type Ingested = Omit<NewMediaAssetRow, "sortOrder" | "parentId"> & {
  width: number;
  height: number;
};

/**
 * Reads a photo or video, uploads it (plus a poster for videos) under
 * `keyBase` and returns the row to insert.
 */
async function ingest(
  file: string,
  meta: { slug: string; title: string; description: string | null; keyBase: string },
): Promise<Ingested> {
  await fs.access(file);

  const { kind, mime } = detectMedia(file);
  const objectKey = `${meta.keyBase}${path.extname(file).toLowerCase()}`;
  const base = {
    slug: meta.slug,
    kind,
    title: meta.title,
    description: meta.description,
    views: 0,
    objectKey,
    mime,
  };

  let row: Ingested;

  if (kind === "photo") {
    row = {
      ...base,
      posterKey: null,
      ...(await imageSize(file)),
      durationSeconds: null,
      blurDataUrl: await blurDataUrl(file),
    };
  } else {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "filming-"));
    const posterFile = path.join(tmp, "poster.jpg");
    const probe = await probeVideo(file);
    await extractPoster(file, posterFile, Math.min(1, (probe.durationSeconds ?? 2) / 2));

    const posterKey = `${meta.keyBase}-poster.jpg`;
    await uploadFile(posterKey, posterFile, "image/jpeg");

    row = {
      ...base,
      posterKey,
      ...probe,
      blurDataUrl: await blurDataUrl(posterFile),
    };
    await fs.rm(tmp, { recursive: true, force: true });
  }

  mediaRecordSchema.parse({ ...row, sortOrder: 0 });
  console.log(`Uploading ${path.basename(file)} → ${objectKey}`);
  await uploadFile(objectKey, file, mime);

  return row;
}

async function add(argv: string[]) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      title: { type: "string" },
      description: { type: "string" },
      slug: { type: "string" },
      order: { type: "string" },
      first: { type: "boolean", default: false },
      draft: { type: "boolean", default: false },
    },
  });

  const file = positionals[0];
  if (!file) throw new Error("Usage: pnpm media:add <file> [--title …]");

  const { kind } = detectMedia(file);
  const title = values.title ?? titleFromFile(file);
  const slug = values.slug ?? (await uniqueSlug(slugify(title) || "untitled"));
  const sortOrder = values.order ? Number(values.order) : await nextSortOrder(values.first);

  await ensurePublicBucket();

  const row = await ingest(file, {
    slug,
    title,
    description: values.description ?? null,
    keyBase: `${kind}s/${new Date().getFullYear()}/${slug}`,
  });

  await getDb()
    .insert(mediaAssets)
    .values({ ...row, sortOrder, published: !values.draft });

  console.log(`✓ Added ${kind} "${title}" at /filming/${slug} (${row.width}×${row.height})`);
}

/**
 * Creates an album from files (first file = cover), or appends files to an
 * existing album with the same slug.
 */
async function album(argv: string[]) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      title: { type: "string" },
      description: { type: "string" },
      views: { type: "string" },
      order: { type: "string" },
      first: { type: "boolean", default: false },
      draft: { type: "boolean", default: false },
    },
  });

  const [slug, ...files] = positionals;
  if (!slug || files.length === 0) {
    throw new Error('Usage: pnpm media:album <slug> [--title "…"] <file> [file …]');
  }
  if (slug !== slugify(slug)) throw new Error(`Slug must look like "${slugify(slug)}"`);

  const db = getDb();
  const [existing] = await db.select().from(mediaAssets).where(eq(mediaAssets.slug, slug));

  if (existing && existing.kind !== "album") {
    throw new Error(`"${slug}" is a ${existing.kind}, not an album`);
  }

  const title = values.title ?? existing?.title ?? titleFromFile(slug);
  let startAt = 0;

  if (existing) {
    const [current] = await db
      .select({ count: count() })
      .from(mediaAssets)
      .where(eq(mediaAssets.parentId, existing.id));
    startAt = current?.count ?? 0;
  }

  await ensurePublicBucket();

  const rows: Ingested[] = [];
  for (const [i, file] of files.entries()) {
    const n = String(startAt + i + 1).padStart(2, "0");
    rows.push(
      await ingest(file, {
        slug: await uniqueSlug(`${slug}-${n}`),
        title: `${title} — ${n}`,
        description: null,
        keyBase: `albums/${slug}/${n}`,
      }),
    );
  }

  let albumId = existing?.id;

  if (!albumId) {
    // The album tile renders its cover photo (a video cover uses its poster).
    const cover = rows[0];
    const [created] = await db
      .insert(mediaAssets)
      .values({
        slug,
        kind: "album",
        title,
        description: values.description ?? null,
        views: values.views ? Number(values.views) : 0,
        objectKey: cover.posterKey ?? cover.objectKey,
        posterKey: null,
        width: cover.width,
        height: cover.height,
        durationSeconds: null,
        mime: cover.posterKey ? "image/jpeg" : cover.mime,
        blurDataUrl: cover.blurDataUrl,
        sortOrder: values.order ? Number(values.order) : await nextSortOrder(values.first),
        published: !values.draft,
      })
      .returning({ id: mediaAssets.id });
    albumId = created.id;
  }

  await db.insert(mediaAssets).values(
    rows.map((row, i) => ({ ...row, parentId: albumId, sortOrder: (startAt + i + 1) * 10 })),
  );

  const added = `${rows.length} ${rows.length === 1 ? "item" : "items"}`;
  const verb = existing ? `Added ${added} to` : "Created";
  console.log(`✓ ${verb} album "${title}" at /filming/${slug} (${startAt + rows.length} items)`);
}

async function edit(argv: string[]) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      title: { type: "string" },
      description: { type: "string" },
      views: { type: "string" },
      order: { type: "string" },
      publish: { type: "boolean" },
      draft: { type: "boolean" },
    },
  });

  const slug = positionals[0];
  if (!slug) throw new Error('Usage: pnpm media:edit <slug> [--description "…"] …');

  const integer = (name: string, value: string | undefined) => {
    if (value === undefined) return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new Error(`--${name} must be a whole number ≥ 0`);
    }
    return parsed;
  };

  const changes: Partial<NewMediaAssetRow> = {
    title: values.title,
    // An empty string clears the description.
    description: values.description === undefined ? undefined : values.description.trim() || null,
    views: integer("views", values.views),
    sortOrder: integer("order", values.order),
    published: values.publish ? true : values.draft ? false : undefined,
  };
  const set = Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== undefined),
  );

  if (Object.keys(set).length === 0) throw new Error("Nothing to change.");

  const [row] = await getDb()
    .update(mediaAssets)
    .set(set)
    .where(eq(mediaAssets.slug, slug))
    .returning({ title: mediaAssets.title });

  if (!row) throw new Error(`No media with slug "${slug}"`);
  console.log(`✓ Updated "${row.title}": ${Object.keys(set).join(", ")}`);
}

async function remove(argv: string[]) {
  const slug = argv[0];
  if (!slug) throw new Error("Usage: pnpm media:remove <slug>");

  const db = getDb();
  const [row] = await db.select().from(mediaAssets).where(eq(mediaAssets.slug, slug));
  if (!row) throw new Error(`No media with slug "${slug}"`);

  // Albums share their cover's object, so collect keys before deleting.
  const children = await db.select().from(mediaAssets).where(eq(mediaAssets.parentId, row.id));
  const keys = new Set(
    [row, ...children].flatMap((item) =>
      item.posterKey ? [item.objectKey, item.posterKey] : [item.objectKey],
    ),
  );

  for (const key of keys) await deleteObject(key);
  await db.delete(mediaAssets).where(eq(mediaAssets.id, row.id)); // cascades to album photos

  const extra = children.length ? ` and its ${children.length} photos` : "";
  console.log(`✓ Removed ${row.kind} "${row.title}"${extra}`);
}

/** Top-level items in gallery order; albums show how many photos they hold. */
async function list() {
  const db = getDb();
  const rows = await db
    .select({
      id: mediaAssets.id,
      order: mediaAssets.sortOrder,
      kind: mediaAssets.kind,
      slug: mediaAssets.slug,
      title: mediaAssets.title,
      views: mediaAssets.views,
      published: mediaAssets.published,
      description: mediaAssets.description,
    })
    .from(mediaAssets)
    .where(isNull(mediaAssets.parentId))
    .orderBy(asc(mediaAssets.sortOrder));

  const counts = await db
    .select({ parentId: mediaAssets.parentId, items: count() })
    .from(mediaAssets)
    .where(isNotNull(mediaAssets.parentId))
    .groupBy(mediaAssets.parentId);
  const items = new Map(counts.map((row) => [row.parentId, row.items]));

  console.table(
    rows.map(({ id, ...row }) => ({ ...row, items: items.get(id) ?? "" })),
  );
}

const [command, ...rest] = process.argv.slice(2);
const commands: Record<string, (argv: string[]) => Promise<void>> = {
  add,
  album,
  edit,
  remove,
  list: () => list(),
};

const run = commands[command ?? ""];

if (!run) {
  console.error("Usage: media.ts <add|album|edit|remove|list> …");
  process.exit(1);
}

run(rest)
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });

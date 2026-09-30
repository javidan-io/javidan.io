import "server-only";
import { and, asc, count, eq, inArray, isNull } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import { z } from "zod";
import { getDb } from "@/lib/filming/db/client";
import { mediaAssets } from "@/lib/filming/db/schema";
import { mediaUrl } from "@/lib/filming/media-url";
import placeholderMedia from "@/lib/filming/placeholder-media.json";
import {
  mediaRecordSchema,
  type FilmingAsset,
  type FilmingAssetWithNeighbours,
  type MediaRecord,
} from "@/lib/filming/types";

const recordColumns = {
  slug: mediaAssets.slug,
  kind: mediaAssets.kind,
  title: mediaAssets.title,
  description: mediaAssets.description,
  views: mediaAssets.views,
  objectKey: mediaAssets.objectKey,
  posterKey: mediaAssets.posterKey,
  width: mediaAssets.width,
  height: mediaAssets.height,
  durationSeconds: mediaAssets.durationSeconds,
  mime: mediaAssets.mime,
  blurDataUrl: mediaAssets.blurDataUrl,
  sortOrder: mediaAssets.sortOrder,
};

const recordsSchema = z.array(mediaRecordSchema);

function toAsset(record: MediaRecord, itemCount = 0): FilmingAsset {
  return {
    ...record,
    src: mediaUrl(record.objectKey),
    posterSrc: record.posterKey ? mediaUrl(record.posterKey) : null,
    itemCount,
  };
}

/**
 * Top-level gallery items: Postgres when DATABASE_URL is set (rendered per
 * request), otherwise the bundled placeholder manifest (static).
 */
export const getFilmingAssets = cache(async (): Promise<FilmingAsset[]> => {
  if (!process.env.DATABASE_URL) {
    return recordsSchema
      .parse(placeholderMedia)
      .toSorted((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug))
      .map((record) => toAsset(record));
  }

  await connection();
  const db = getDb();

  const rows = await db
    .select({ id: mediaAssets.id, ...recordColumns })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.published, true), isNull(mediaAssets.parentId)))
    .orderBy(asc(mediaAssets.sortOrder), asc(mediaAssets.slug));

  const albumIds = rows.filter((row) => row.kind === "album").map((row) => row.id);
  const counts = albumIds.length
    ? await db
        .select({ parentId: mediaAssets.parentId, items: count() })
        .from(mediaAssets)
        .where(and(inArray(mediaAssets.parentId, albumIds), eq(mediaAssets.published, true)))
        .groupBy(mediaAssets.parentId)
    : [];
  const itemCounts = new Map(counts.map((row) => [row.parentId, row.items]));

  return rows.map(({ id, ...record }) =>
    toAsset(mediaRecordSchema.parse(record), itemCounts.get(id) ?? 0),
  );
});

async function getAlbumItems(slug: string): Promise<FilmingAsset[]> {
  const db = getDb();
  const [album] = await db
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(eq(mediaAssets.slug, slug));

  if (!album) return [];

  const rows = await db
    .select(recordColumns)
    .from(mediaAssets)
    .where(and(eq(mediaAssets.parentId, album.id), eq(mediaAssets.published, true)))
    .orderBy(asc(mediaAssets.sortOrder), asc(mediaAssets.slug));

  return recordsSchema.parse(rows).map((record) => toAsset(record));
}

export async function getFilmingAsset(
  slug: string,
): Promise<FilmingAssetWithNeighbours | null> {
  const assets = await getFilmingAssets();
  const index = assets.findIndex((asset) => asset.slug === slug);

  if (index === -1) return null;

  const asset = assets[index];

  return {
    asset,
    previous: assets[index - 1] ?? null,
    next: assets[index + 1] ?? null,
    items: asset.kind === "album" ? await getAlbumItems(slug) : [],
  };
}

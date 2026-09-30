import { z } from "zod";

export const mediaKinds = ["photo", "video", "album"] as const;

export type MediaKind = (typeof mediaKinds)[number];

/**
 * One gallery item as stored (Postgres row or placeholder manifest entry).
 * Keys are object keys in the media bucket, e.g. `photos/2026/dunes.jpg`.
 * Albums reuse their cover photo's key, size and blur, so they render like
 * any other tile; their photos are child rows.
 */
export const mediaRecordSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    kind: z.enum(mediaKinds),
    title: z.string().min(1),
    description: z.string().nullable(),
    views: z.number().int().nonnegative(),
    objectKey: z.string().min(1),
    posterKey: z.string().nullable(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    durationSeconds: z.number().positive().nullable(),
    mime: z.string().min(1),
    blurDataUrl: z.string().nullable(),
    sortOrder: z.number().int(),
  })
  .refine((record) => record.kind !== "video" || record.posterKey !== null, {
    message: "Videos need a posterKey",
    path: ["posterKey"],
  });

export type MediaRecord = z.infer<typeof mediaRecordSchema>;

/** A record with its keys resolved to URLs, ready to render. */
export type FilmingAsset = MediaRecord & {
  src: string;
  posterSrc: string | null;
  /** Number of photos in an album; 0 for photos and videos. */
  itemCount: number;
};

export type FilmingAssetWithNeighbours = {
  asset: FilmingAsset;
  previous: FilmingAsset | null;
  next: FilmingAsset | null;
  /** The album's photos in order; empty for photos and videos. */
  items: FilmingAsset[];
};

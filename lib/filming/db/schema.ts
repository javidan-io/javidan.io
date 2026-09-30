import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { mediaKinds } from "@/lib/filming/types";

export const mediaKind = pgEnum("media_kind", mediaKinds);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Set on photos that belong to an album; those stay out of the grid. */
    parentId: uuid("parent_id").references((): AnyPgColumn => mediaAssets.id, {
      onDelete: "cascade",
    }),
    slug: text("slug").notNull().unique(),
    kind: mediaKind("kind").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    objectKey: text("object_key").notNull(),
    posterKey: text("poster_key"),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    durationSeconds: real("duration_s"),
    mime: text("mime").notNull(),
    blurDataUrl: text("blur_data_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    views: integer("views").notNull().default(0),
    published: boolean("published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("media_assets_published_sort_idx").on(table.published, table.sortOrder),
    index("media_assets_parent_sort_idx").on(table.parentId, table.sortOrder),
  ],
);

export type MediaAssetRow = typeof mediaAssets.$inferSelect;
export type NewMediaAssetRow = typeof mediaAssets.$inferInsert;

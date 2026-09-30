CREATE TYPE "public"."media_kind" AS ENUM('photo', 'video');--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"kind" "media_kind" NOT NULL,
	"title" text NOT NULL,
	"caption" text,
	"object_key" text NOT NULL,
	"poster_key" text,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"duration_s" real,
	"mime" text NOT NULL,
	"blur_data_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "media_assets_published_sort_idx" ON "media_assets" USING btree ("published","sort_order");
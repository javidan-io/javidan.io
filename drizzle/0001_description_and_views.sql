ALTER TABLE "media_assets" RENAME COLUMN "caption" TO "description";--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "views" integer DEFAULT 0 NOT NULL;

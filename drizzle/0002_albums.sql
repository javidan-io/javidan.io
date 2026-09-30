ALTER TYPE "public"."media_kind" ADD VALUE 'album';--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_parent_id_media_assets_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_assets_parent_sort_idx" ON "media_assets" USING btree ("parent_id","sort_order");
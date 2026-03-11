ALTER TABLE "models" DROP CONSTRAINT "models_brand_category_name_unique";--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "normalized_name" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "normalized_name" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "meta_title" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "meta_description" text;--> statement-breakpoint
UPDATE "brands"
SET "normalized_name" = regexp_replace(lower(trim("name")), '\s+', ' ', 'g')
WHERE "normalized_name" IS NULL;--> statement-breakpoint
UPDATE "models"
SET "normalized_name" = regexp_replace(lower(trim("name")), '\s+', ' ', 'g')
WHERE "normalized_name" IS NULL;--> statement-breakpoint
ALTER TABLE "brands" ALTER COLUMN "normalized_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ALTER COLUMN "normalized_name" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "brands_normalized_name_idx" ON "brands" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "models_normalized_name_idx" ON "models" USING btree ("normalized_name");--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_normalized_name_unique" UNIQUE("normalized_name");--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_brand_category_normalized_name_unique" UNIQUE("brand_id","primary_category_id","normalized_name");

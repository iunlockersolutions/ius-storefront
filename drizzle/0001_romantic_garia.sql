CREATE TABLE "category_brand_menu_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"show_in_product_menu" boolean DEFAULT true NOT NULL,
	"menu_priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_brand_menu_configs_unique" UNIQUE("category_id","brand_id")
);
--> statement-breakpoint
CREATE TABLE "product_model_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"show_in_product_menu" boolean DEFAULT true NOT NULL,
	"menu_priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_model_groups_slug_unique" UNIQUE("slug"),
	CONSTRAINT "product_model_groups_category_brand_name_unique" UNIQUE("category_id","brand_id","name")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "show_in_product_menu" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "product_menu_priority" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_model_group_id" uuid;--> statement-breakpoint
ALTER TABLE "category_brand_menu_configs" ADD CONSTRAINT "category_brand_menu_configs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_brand_menu_configs" ADD CONSTRAINT "category_brand_menu_configs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_model_groups" ADD CONSTRAINT "product_model_groups_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_model_groups" ADD CONSTRAINT "product_model_groups_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_brand_menu_configs_category_id_idx" ON "category_brand_menu_configs" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "category_brand_menu_configs_brand_id_idx" ON "category_brand_menu_configs" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "product_model_groups_category_id_idx" ON "product_model_groups" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_model_groups_brand_id_idx" ON "product_model_groups" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "product_model_groups_slug_idx" ON "product_model_groups" USING btree ("slug");--> statement-breakpoint
WITH RECURSIVE "category_roots" AS (
	SELECT "id", "id" AS "top_level_id", "parent_id"
	FROM "categories"
	WHERE "parent_id" IS NULL

	UNION ALL

	SELECT "child"."id", "root"."top_level_id", "child"."parent_id"
	FROM "categories" AS "child"
	INNER JOIN "category_roots" AS "root" ON "child"."parent_id" = "root"."id"
),
"group_source" AS (
	SELECT
		"root"."top_level_id" AS "category_id",
		"products"."brand_id" AS "brand_id",
		MIN(TRIM(REGEXP_REPLACE("products"."name", '\s+', ' ', 'g'))) AS "name",
		LOWER(TRIM(REGEXP_REPLACE("products"."name", '\s+', ' ', 'g'))) AS "normalized_name"
	FROM "products"
	INNER JOIN "category_roots" AS "root" ON "root"."id" = "products"."primary_category_id"
	WHERE "products"."primary_category_id" IS NOT NULL
		AND "products"."brand_id" IS NOT NULL
	GROUP BY
		"root"."top_level_id",
		"products"."brand_id",
		LOWER(TRIM(REGEXP_REPLACE("products"."name", '\s+', ' ', 'g')))
)
INSERT INTO "product_model_groups" (
	"category_id",
	"brand_id",
	"name",
	"slug"
)
SELECT
	"source"."category_id",
	"source"."brand_id",
	"source"."name",
	CONCAT(
		"categories"."slug",
		'-',
		"brands"."slug",
		'-',
		REGEXP_REPLACE("source"."normalized_name", '[^a-z0-9]+', '-', 'g')
	)
FROM "group_source" AS "source"
INNER JOIN "categories" ON "categories"."id" = "source"."category_id"
INNER JOIN "brands" ON "brands"."id" = "source"."brand_id";--> statement-breakpoint
WITH RECURSIVE "category_roots" AS (
	SELECT "id", "id" AS "top_level_id", "parent_id"
	FROM "categories"
	WHERE "parent_id" IS NULL

	UNION ALL

	SELECT "child"."id", "root"."top_level_id", "child"."parent_id"
	FROM "categories" AS "child"
	INNER JOIN "category_roots" AS "root" ON "child"."parent_id" = "root"."id"
)
INSERT INTO "category_brand_menu_configs" (
	"category_id",
	"brand_id"
)
SELECT DISTINCT
	"root"."top_level_id" AS "category_id",
		"products"."brand_id" AS "brand_id"
FROM "products"
INNER JOIN "category_roots" AS "root" ON "root"."id" = "products"."primary_category_id"
WHERE "products"."primary_category_id" IS NOT NULL
	AND "products"."brand_id" IS NOT NULL
ON CONFLICT ("category_id", "brand_id") DO NOTHING;--> statement-breakpoint
WITH RECURSIVE "category_roots" AS (
	SELECT "id", "id" AS "top_level_id", "parent_id"
	FROM "categories"
	WHERE "parent_id" IS NULL

	UNION ALL

	SELECT "child"."id", "root"."top_level_id", "child"."parent_id"
	FROM "categories" AS "child"
	INNER JOIN "category_roots" AS "root" ON "child"."parent_id" = "root"."id"
)
INSERT INTO "product_category_assignments" (
	"product_id",
	"category_id"
)
SELECT DISTINCT
	"products"."id",
	"category_roots"."top_level_id"
FROM "products"
INNER JOIN "category_roots" ON "products"."primary_category_id" = "category_roots"."id"
WHERE "products"."primary_category_id" IS NOT NULL
ON CONFLICT ("product_id", "category_id") DO NOTHING;--> statement-breakpoint
WITH RECURSIVE "category_roots" AS (
	SELECT "id", "id" AS "top_level_id", "parent_id"
	FROM "categories"
	WHERE "parent_id" IS NULL

	UNION ALL

	SELECT "child"."id", "root"."top_level_id", "child"."parent_id"
	FROM "categories" AS "child"
	INNER JOIN "category_roots" AS "root" ON "child"."parent_id" = "root"."id"
)
UPDATE "products"
SET "product_model_group_id" = "product_model_groups"."id"
FROM "category_roots", "product_model_groups"
WHERE "products"."primary_category_id" = "category_roots"."id"
	AND "product_model_groups"."category_id" = "category_roots"."top_level_id"
	AND "product_model_groups"."brand_id" = "products"."brand_id"
	AND LOWER(TRIM(REGEXP_REPLACE("product_model_groups"."name", '\s+', ' ', 'g')))
		= LOWER(TRIM(REGEXP_REPLACE("products"."name", '\s+', ' ', 'g')))
	AND "products"."brand_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "product_model_group_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_product_model_group_id_product_model_groups_id_fk" FOREIGN KEY ("product_model_group_id") REFERENCES "public"."product_model_groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_product_model_group_id_idx" ON "products" USING btree ("product_model_group_id");

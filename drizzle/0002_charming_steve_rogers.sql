CREATE TABLE "category_option_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_option_templates_category_name_unique" UNIQUE("category_id","normalized_name")
);
--> statement-breakpoint
ALTER TABLE "category_option_templates" ADD CONSTRAINT "category_option_templates_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_option_templates_category_id_idx" ON "category_option_templates" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "category_option_templates_normalized_name_idx" ON "category_option_templates" USING btree ("normalized_name");
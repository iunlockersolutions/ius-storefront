CREATE TABLE "installment_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"provider_name" text NOT NULL,
	"logo_url" text,
	"banner_image_url" text,
	"summary" text NOT NULL,
	"description" text,
	"read_more_label" text DEFAULT 'Read more' NOT NULL,
	"terms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"terms_and_conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "installment_offers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "installment_offers_slug_idx" ON "installment_offers" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "installment_offers_provider_name_idx" ON "installment_offers" USING btree ("provider_name");--> statement-breakpoint
CREATE INDEX "installment_offers_published_idx" ON "installment_offers" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "installment_offers_sort_order_idx" ON "installment_offers" USING btree ("sort_order");
ALTER TABLE "cart_items" ADD COLUMN "non_pricing_selections" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "product_options" ADD COLUMN "affects_pricing" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "non_pricing_selections" jsonb DEFAULT '[]'::jsonb NOT NULL;
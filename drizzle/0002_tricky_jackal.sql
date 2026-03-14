ALTER TABLE "checkout_sessions" ADD COLUMN "account_intent" text;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD COLUMN "billing_same_as_shipping" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD COLUMN "billing_address" jsonb;
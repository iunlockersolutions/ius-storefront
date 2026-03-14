CREATE TYPE "public"."checkout_session_status" AS ENUM('open', 'submitted', 'expired', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."guest_order_access_token_kind" AS ENUM('confirmation', 'access');--> statement-breakpoint
CREATE TYPE "public"."order_fulfillment_status" AS ENUM('confirmed', 'processing', 'packing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_payment_status" AS ENUM('unpaid', 'pending_verification', 'authorized', 'paid', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TABLE "checkout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"user_id" uuid,
	"cart_session_id" text,
	"status" "checkout_session_status" DEFAULT 'open' NOT NULL,
	"contact" jsonb,
	"shipping_address" jsonb,
	"shipping_method" text,
	"payment_method" "payment_method",
	"notes" text,
	"pricing_snapshot" jsonb,
	"expires_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_order_access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"email" text NOT NULL,
	"kind" "guest_order_access_token_kind" DEFAULT 'access' NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_order_access_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_variant_id_product_variants_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'LKR';--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "snapshot" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "checkout_session_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" "order_payment_status" DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfillment_status" "order_fulfillment_status" DEFAULT 'confirmed' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "currency_code" text DEFAULT 'LKR' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_method" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "placed_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_order_access_tokens" ADD CONSTRAINT "guest_order_access_tokens_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkout_sessions_cart_id_idx" ON "checkout_sessions" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "checkout_sessions_user_id_idx" ON "checkout_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "checkout_sessions_cart_session_id_idx" ON "checkout_sessions" USING btree ("cart_session_id");--> statement-breakpoint
CREATE INDEX "checkout_sessions_status_idx" ON "checkout_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "guest_order_access_tokens_order_id_idx" ON "guest_order_access_tokens" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "guest_order_access_tokens_email_idx" ON "guest_order_access_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "guest_order_access_tokens_kind_idx" ON "guest_order_access_tokens" USING btree ("kind");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_checkout_session_id_checkout_sessions_id_fk" FOREIGN KEY ("checkout_session_id") REFERENCES "public"."checkout_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "orders_fulfillment_status_idx" ON "orders" USING btree ("fulfillment_status");
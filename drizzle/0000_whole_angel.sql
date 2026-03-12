CREATE TYPE "public"."address_type" AS ENUM('shipping', 'billing', 'both');--> statement-breakpoint
CREATE TYPE "public"."inventory_identifier_type" AS ENUM('serial', 'imei', 'imei2', 'barcode');--> statement-breakpoint
CREATE TYPE "public"."inventory_tracking_mode" AS ENUM('quantity', 'serial');--> statement-breakpoint
CREATE TYPE "public"."inventory_transaction_type" AS ENUM('receipt', 'adjustment_increase', 'adjustment_decrease', 'reservation', 'reservation_release', 'allocation', 'allocation_release', 'shipment', 'return', 'damage', 'loss', 'transfer_out', 'transfer_in');--> statement-breakpoint
CREATE TYPE "public"."inventory_unit_status" AS ENUM('received', 'available', 'reserved', 'allocated', 'packed', 'shipped', 'returned', 'damaged', 'lost');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'pending_payment', 'paid', 'processing', 'packing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'bank_transfer', 'cash_on_delivery');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."product_draft_step" AS ENUM('basics', 'organization', 'media', 'options', 'review');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'admin', 'manager', 'support');--> statement-breakpoint
CREATE TABLE "admin_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp DEFAULT now(),
	"aaguid" text,
	CONSTRAINT "passkey_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" uuid,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'customer',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"must_change_password" boolean DEFAULT false,
	"invited_by" uuid,
	"invited_at" timestamp,
	"last_password_change" timestamp,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_at_add" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_category_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"show_in_product_menu" boolean DEFAULT true NOT NULL,
	"nav_priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brand_category_assignments_unique" UNIQUE("brand_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logo" text,
	"website_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug"),
	CONSTRAINT "brands_normalized_name_unique" UNIQUE("normalized_name")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image" text,
	"meta_title" text,
	"meta_description" text,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"show_in_product_menu" boolean DEFAULT true NOT NULL,
	"product_menu_priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
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
CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"primary_category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"meta_title" text,
	"meta_description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"show_in_product_menu" boolean DEFAULT true NOT NULL,
	"nav_priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "models_slug_unique" UNIQUE("slug"),
	CONSTRAINT "models_brand_category_normalized_name_unique" UNIQUE("brand_id","primary_category_id","normalized_name")
);
--> statement-breakpoint
CREATE TABLE "product_attribute_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_attribute_values_unique" UNIQUE("product_id","attribute_id")
);
--> statement-breakpoint
CREATE TABLE "product_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_attributes_name_unique" UNIQUE("name"),
	CONSTRAINT "product_attributes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_category_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_category_assignments_unique" UNIQUE("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"url" text NOT NULL,
	"alt_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"option_id" uuid NOT NULL,
	"value" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_option_values_option_value_unique" UNIQUE("option_id","value")
);
--> statement-breakpoint
CREATE TABLE "product_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_options_product_name_unique" UNIQUE("product_id","name")
);
--> statement-breakpoint
CREATE TABLE "product_variant_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"option_value_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variant_option_values_variant_option_unique" UNIQUE("variant_id","option_id")
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"compare_at_price" numeric(10, 2),
	"cost_price" numeric(10, 2),
	"weight" numeric(10, 3),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"manage_inventory" boolean DEFAULT true NOT NULL,
	"inventory_tracking_mode" "inventory_tracking_mode" DEFAULT 'quantity' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"short_description" text,
	"brand_id" uuid,
	"primary_category_id" uuid,
	"model_id" uuid,
	"base_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"compare_at_price" numeric(10, 2),
	"cost_price" numeric(10, 2),
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"draft_step" "product_draft_step" DEFAULT 'basics' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"type" "address_type" DEFAULT 'both' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"label" text,
	"recipient_name" text NOT NULL,
	"phone" text NOT NULL,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text NOT NULL,
	"state" text,
	"postal_code" text NOT NULL,
	"country" text DEFAULT 'US' NOT NULL,
	"instructions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"phone" text,
	"date_of_birth" timestamp with time zone,
	"preferred_language" text DEFAULT 'en',
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_product_unique" UNIQUE("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"on_hand_quantity" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"allocated_quantity" integer DEFAULT 0 NOT NULL,
	"available_quantity" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_levels_variant_location_unique" UNIQUE("variant_id","location_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_locations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"inventory_level_id" uuid,
	"type" "inventory_transaction_type" NOT NULL,
	"quantity_delta" integer NOT NULL,
	"before_on_hand_quantity" integer NOT NULL,
	"after_on_hand_quantity" integer NOT NULL,
	"before_reserved_quantity" integer DEFAULT 0 NOT NULL,
	"after_reserved_quantity" integer DEFAULT 0 NOT NULL,
	"before_allocated_quantity" integer DEFAULT 0 NOT NULL,
	"after_allocated_quantity" integer DEFAULT 0 NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"notes" text,
	"performed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_unit_identifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_unit_id" uuid NOT NULL,
	"type" "inventory_identifier_type" NOT NULL,
	"value" text NOT NULL,
	"normalized_value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_unit_identifiers_unit_type_unique" UNIQUE("inventory_unit_id","type"),
	CONSTRAINT "inventory_unit_identifiers_type_value_unique" UNIQUE("type","normalized_value")
);
--> statement-breakpoint
CREATE TABLE "inventory_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"status" "inventory_unit_status" DEFAULT 'received' NOT NULL,
	"notes" text,
	"allocated_order_id" uuid,
	"allocated_order_item_id" uuid,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"packed_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"returned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"inventory_level_id" uuid,
	"quantity" integer NOT NULL,
	"allocated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item_unit_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"inventory_unit_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unassigned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_item_unit_assignments_inventory_unit_id_unique" UNIQUE("inventory_unit_id")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid,
	"product_name" text NOT NULL,
	"variant_name" text NOT NULL,
	"sku" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"notes" text,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"user_id" uuid,
	"status" "order_status" DEFAULT 'draft' NOT NULL,
	"shipping_address_id" uuid,
	"shipping_address" jsonb,
	"billing_address_id" uuid,
	"billing_address" jsonb,
	"subtotal" numeric(10, 2) NOT NULL,
	"shipping_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"customer_name" text,
	"notes" text,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"carrier" text,
	"tracking_number" text,
	"tracking_url" text,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_transfer_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" numeric(10, 0),
	"mime_type" text,
	"notes" text,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"verification_notes" text,
	"is_approved" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"external_id" text,
	"external_status" text,
	"idempotency_key" text,
	"metadata" text,
	"failure_reason" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "review_helpful_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_helpful_votes_user_review_unique" UNIQUE("user_id","review_id")
);
--> statement-breakpoint
CREATE TABLE "review_moderation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"moderator_id" uuid NOT NULL,
	"action" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid,
	"rating" integer NOT NULL,
	"title" text,
	"content" text,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_user_product_unique" UNIQUE("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_category_assignments" ADD CONSTRAINT "brand_category_assignments_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_category_assignments" ADD CONSTRAINT "brand_category_assignments_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_option_templates" ADD CONSTRAINT "category_option_templates_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_primary_category_id_categories_id_fk" FOREIGN KEY ("primary_category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attribute_id_product_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."product_attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category_assignments" ADD CONSTRAINT "product_category_assignments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category_assignments" ADD CONSTRAINT "product_category_assignments_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_option_id_product_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."product_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_option_values" ADD CONSTRAINT "product_variant_option_values_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_option_values" ADD CONSTRAINT "product_variant_option_values_option_id_product_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."product_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_option_values" ADD CONSTRAINT "product_variant_option_values_option_value_id_product_option_values_id_fk" FOREIGN KEY ("option_value_id") REFERENCES "public"."product_option_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_primary_category_id_categories_id_fk" FOREIGN KEY ("primary_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customer_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventory_level_id_inventory_levels_id_fk" FOREIGN KEY ("inventory_level_id") REFERENCES "public"."inventory_levels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_unit_identifiers" ADD CONSTRAINT "inventory_unit_identifiers_inventory_unit_id_inventory_units_id_fk" FOREIGN KEY ("inventory_unit_id") REFERENCES "public"."inventory_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_units" ADD CONSTRAINT "inventory_units_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_units" ADD CONSTRAINT "inventory_units_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_allocations" ADD CONSTRAINT "order_item_allocations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_allocations" ADD CONSTRAINT "order_item_allocations_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_allocations" ADD CONSTRAINT "order_item_allocations_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_allocations" ADD CONSTRAINT "order_item_allocations_inventory_level_id_inventory_levels_id_fk" FOREIGN KEY ("inventory_level_id") REFERENCES "public"."inventory_levels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_unit_assignments" ADD CONSTRAINT "order_item_unit_assignments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_unit_assignments" ADD CONSTRAINT "order_item_unit_assignments_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_unit_assignments" ADD CONSTRAINT "order_item_unit_assignments_inventory_unit_id_inventory_units_id_fk" FOREIGN KEY ("inventory_unit_id") REFERENCES "public"."inventory_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_customer_addresses_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_customer_addresses_id_fk" FOREIGN KEY ("billing_address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transfer_proofs" ADD CONSTRAINT "bank_transfer_proofs_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transfer_proofs" ADD CONSTRAINT "bank_transfer_proofs_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_moderation" ADD CONSTRAINT "review_moderation_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_moderation" ADD CONSTRAINT "review_moderation_moderator_id_user_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_activity_logs_user_id_idx" ON "admin_activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_activity_logs_action_idx" ON "admin_activity_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "admin_activity_logs_entity_idx" ON "admin_activity_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "admin_activity_logs_created_at_idx" ON "admin_activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "site_settings_key_idx" ON "site_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_userId_idx" ON "passkey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_secret_idx" ON "two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "two_factor_user_id_idx" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "cart_items_variant_id_idx" ON "cart_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "carts_user_id_idx" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "carts_session_id_idx" ON "carts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "brand_category_assignments_brand_id_idx" ON "brand_category_assignments" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "brand_category_assignments_category_id_idx" ON "brand_category_assignments" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "brands_slug_idx" ON "brands" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "brands_normalized_name_idx" ON "brands" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "brands_is_active_idx" ON "brands" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_id_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "category_option_templates_category_id_idx" ON "category_option_templates" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "category_option_templates_normalized_name_idx" ON "category_option_templates" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "models_brand_id_idx" ON "models" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "models_primary_category_id_idx" ON "models" USING btree ("primary_category_id");--> statement-breakpoint
CREATE INDEX "models_normalized_name_idx" ON "models" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "models_slug_idx" ON "models" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "product_attribute_values_product_id_idx" ON "product_attribute_values" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_attribute_values_attribute_id_idx" ON "product_attribute_values" USING btree ("attribute_id");--> statement-breakpoint
CREATE INDEX "product_category_assignments_product_id_idx" ON "product_category_assignments" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_category_assignments_category_id_idx" ON "product_category_assignments" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_images_product_id_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_images_variant_id_idx" ON "product_images" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "product_option_values_option_id_idx" ON "product_option_values" USING btree ("option_id");--> statement-breakpoint
CREATE INDEX "product_options_product_id_idx" ON "product_options" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variant_option_values_variant_id_idx" ON "product_variant_option_values" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "product_variant_option_values_option_id_idx" ON "product_variant_option_values" USING btree ("option_id");--> statement-breakpoint
CREATE INDEX "product_variant_option_values_option_value_id_idx" ON "product_variant_option_values" USING btree ("option_value_id");--> statement-breakpoint
CREATE INDEX "product_variants_product_id_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variants_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_brand_id_idx" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "products_primary_category_id_idx" ON "products" USING btree ("primary_category_id");--> statement-breakpoint
CREATE INDEX "products_model_id_idx" ON "products" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_draft_step_idx" ON "products" USING btree ("draft_step");--> statement-breakpoint
CREATE INDEX "products_is_featured_idx" ON "products" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "customer_addresses_customer_id_idx" ON "customer_addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_profiles_user_id_idx" ON "customer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "favorites_user_id_idx" ON "favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "favorites_product_id_idx" ON "favorites" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inventory_levels_variant_idx" ON "inventory_levels" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "inventory_levels_location_idx" ON "inventory_levels" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "inventory_locations_code_idx" ON "inventory_locations" USING btree ("code");--> statement-breakpoint
CREATE INDEX "inventory_locations_default_idx" ON "inventory_locations" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "inventory_transactions_variant_idx" ON "inventory_transactions" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "inventory_transactions_location_idx" ON "inventory_transactions" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "inventory_transactions_type_idx" ON "inventory_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "inventory_transactions_reference_idx" ON "inventory_transactions" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "inventory_transactions_created_at_idx" ON "inventory_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inventory_unit_identifiers_value_idx" ON "inventory_unit_identifiers" USING btree ("normalized_value");--> statement-breakpoint
CREATE INDEX "inventory_units_variant_idx" ON "inventory_units" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "inventory_units_location_idx" ON "inventory_units" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "inventory_units_status_idx" ON "inventory_units" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventory_units_order_idx" ON "inventory_units" USING btree ("allocated_order_id","allocated_order_item_id");--> statement-breakpoint
CREATE INDEX "order_item_allocations_order_id_idx" ON "order_item_allocations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_item_allocations_order_item_id_idx" ON "order_item_allocations" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "order_item_allocations_variant_id_idx" ON "order_item_allocations" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "order_item_allocations_level_id_idx" ON "order_item_allocations" USING btree ("inventory_level_id");--> statement-breakpoint
CREATE INDEX "order_item_unit_assignments_order_id_idx" ON "order_item_unit_assignments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_item_unit_assignments_order_item_id_idx" ON "order_item_unit_assignments" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "order_item_unit_assignments_inventory_unit_id_idx" ON "order_item_unit_assignments" USING btree ("inventory_unit_id");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_variant_id_idx" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_created_at_idx" ON "order_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_customer_email_idx" ON "orders" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "shipments_order_id_idx" ON "shipments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "shipments_tracking_number_idx" ON "shipments" USING btree ("tracking_number");--> statement-breakpoint
CREATE INDEX "bank_transfer_proofs_payment_id_idx" ON "bank_transfer_proofs" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_external_id_idx" ON "payments" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "payments_idempotency_key_idx" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "review_helpful_votes_review_id_idx" ON "review_helpful_votes" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "review_helpful_votes_user_id_idx" ON "review_helpful_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "review_moderation_review_id_idx" ON "review_moderation" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "review_moderation_moderator_id_idx" ON "review_moderation" USING btree ("moderator_id");--> statement-breakpoint
CREATE INDEX "reviews_product_id_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reviews_user_id_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email");
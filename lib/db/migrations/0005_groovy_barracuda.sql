ALTER TABLE "account" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "passkey" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "passkey" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "passkey" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "impersonated_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "invited_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "assigned_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "customer_profiles" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "inventory_movements" ALTER COLUMN "performed_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "carts" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "changed_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "bank_transfer_proofs" ALTER COLUMN "verified_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "review_helpful_votes" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "review_moderation" ALTER COLUMN "moderator_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "updated_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "favorites" ALTER COLUMN "user_id" SET DATA TYPE uuid;
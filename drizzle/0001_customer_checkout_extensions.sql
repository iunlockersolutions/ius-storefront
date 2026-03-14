ALTER TABLE "checkout_sessions"
ADD COLUMN IF NOT EXISTS "account_intent" text;

ALTER TABLE "checkout_sessions"
ADD COLUMN IF NOT EXISTS "billing_same_as_shipping" boolean;

UPDATE "checkout_sessions"
SET "billing_same_as_shipping" = true
WHERE "billing_same_as_shipping" IS NULL;

ALTER TABLE "checkout_sessions"
ALTER COLUMN "billing_same_as_shipping" SET DEFAULT true;

ALTER TABLE "checkout_sessions"
ALTER COLUMN "billing_same_as_shipping" SET NOT NULL;

ALTER TABLE "checkout_sessions"
ADD COLUMN IF NOT EXISTS "billing_address" jsonb;

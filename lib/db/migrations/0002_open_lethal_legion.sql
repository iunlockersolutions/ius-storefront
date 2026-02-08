CREATE TABLE "review_helpful_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_helpful_votes_user_review_unique" UNIQUE("user_id","review_id")
);
--> statement-breakpoint
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_helpful_votes_review_id_idx" ON "review_helpful_votes" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "review_helpful_votes_user_id_idx" ON "review_helpful_votes" USING btree ("user_id");
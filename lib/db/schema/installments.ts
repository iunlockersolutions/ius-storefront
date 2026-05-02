import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export type InstallmentOfferTerm = {
  months: number
  label: string
  minimumAmount?: string | null
  notes?: string | null
}

export const installmentOffers = pgTable(
  "installment_offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    providerName: text("provider_name").notNull(),
    logoUrl: text("logo_url"),
    bannerImageUrl: text("banner_image_url"),
    summary: text("summary").notNull(),
    description: text("description"),
    readMoreLabel: text("read_more_label").notNull().default("Read more"),
    terms: jsonb("terms")
      .$type<InstallmentOfferTerm[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    termsAndConditions: jsonb("terms_and_conditions")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("installment_offers_slug_idx").on(table.slug),
    index("installment_offers_provider_name_idx").on(table.providerName),
    index("installment_offers_published_idx").on(table.isPublished),
    index("installment_offers_sort_order_idx").on(table.sortOrder),
  ],
)

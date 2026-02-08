import { relations } from "drizzle-orm"
import {
  decimal,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth"
import { paymentMethodEnum, paymentStatusEnum } from "./enums"
import { orders } from "./orders"

/**
 * Payments - Payment records for orders.
 * Supports multiple payment methods (card, bank transfer, etc.).
 */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    method: paymentMethodEnum("method").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),

    // External payment provider references
    externalId: text("external_id"), // Stripe payment intent ID, etc.
    externalStatus: text("external_status"),

    // For idempotency
    idempotencyKey: text("idempotency_key").unique(),

    // Metadata
    metadata: text("metadata"), // JSON string for provider-specific data
    failureReason: text("failure_reason"),

    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payments_order_id_idx").on(table.orderId),
    index("payments_status_idx").on(table.status),
    index("payments_external_id_idx").on(table.externalId),
    index("payments_idempotency_key_idx").on(table.idempotencyKey),
  ],
)

/**
 * Bank transfer proofs - Uploaded proof of payment for bank transfers.
 * Requires admin verification before order is processed.
 */
export const bankTransferProofs = pgTable(
  "bank_transfer_proofs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    fileUrl: text("file_url").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: decimal("file_size", { precision: 10, scale: 0 }), // in bytes
    mimeType: text("mime_type"),
    notes: text("notes"),

    // Verification
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: uuid("verified_by").references(() => user.id, {
      onDelete: "set null",
    }),
    verificationNotes: text("verification_notes"),
    isApproved: timestamp("is_approved", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("bank_transfer_proofs_payment_id_idx").on(table.paymentId)],
)

// Relations
export const paymentsRelations = relations(payments, ({ one, many }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  bankTransferProofs: many(bankTransferProofs),
}))

export const bankTransferProofsRelations = relations(
  bankTransferProofs,
  ({ one }) => ({
    payment: one(payments, {
      fields: [bankTransferProofs.paymentId],
      references: [payments.id],
    }),
    verifiedByUser: one(user, {
      fields: [bankTransferProofs.verifiedBy],
      references: [user.id],
    }),
  }),
)

"use server"

import { revalidatePath } from "next/cache"

import crypto from "crypto"
import { and, count, desc, eq, ilike, or } from "drizzle-orm"
import { nanoid } from "nanoid"

import { getServerSession, requireStaff } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  bankTransferProofs,
  cartItems,
  checkoutSessions,
  guestOrderAccessTokens,
  orderItems,
  orders,
  orderStatusHistory,
  payments,
} from "@/lib/db/schema"
import { sendPaidOrderInvoiceEmail } from "@/lib/email/customer-order-email-service"
import {
  ensureOrderInventoryReservationsTx,
  releaseOrderInventoryReservationsTx,
} from "@/lib/orders/inventory-reservations"

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

async function restoreCartFromOrderTx(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  orderId: string,
) {
  const order = await tx.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })

  if (!order?.checkoutSessionId) {
    return
  }

  const checkoutSession = await tx.query.checkoutSessions.findFirst({
    where: eq(checkoutSessions.id, order.checkoutSessionId),
  })

  if (!checkoutSession) {
    return
  }

  const restorableItems = await tx
    .select({
      variantId: orderItems.variantId,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))

  await tx.delete(cartItems).where(eq(cartItems.cartId, checkoutSession.cartId))

  const values = restorableItems
    .filter((item): item is typeof item & { variantId: string } =>
      Boolean(item.variantId),
    )
    .map((item) => ({
      cartId: checkoutSession.cartId,
      variantId: item.variantId,
      quantity: item.quantity,
      priceAtAdd: item.unitPrice,
    }))

  if (values.length > 0) {
    await tx.insert(cartItems).values(values)
  }
}

async function clearCartForOrderTx(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  orderId: string,
) {
  const order = await tx.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })

  if (!order?.checkoutSessionId) {
    return
  }

  const checkoutSession = await tx.query.checkoutSessions.findFirst({
    where: eq(checkoutSessions.id, order.checkoutSessionId),
  })

  if (!checkoutSession) {
    return
  }

  await tx.delete(cartItems).where(eq(cartItems.cartId, checkoutSession.cartId))
}

// ============================================
// Initiate Card Payment
// ============================================

interface InitiatePaymentInput {
  orderId: string
  accessToken: string
}

export async function initiateCardPayment(input: InitiatePaymentInput) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, input.orderId),
  })

  if (!order) {
    return { success: false, error: "Order not found" }
  }

  if (order.status !== "draft" && order.status !== "pending_payment") {
    return { success: false, error: "Order cannot be paid in current status" }
  }

  const idempotencyKey = `pay_${order.id}_${Date.now()}`

  try {
    await db.transaction(async (tx) => {
      await ensureOrderInventoryReservationsTx(
        tx,
        order.id,
        `Ensured reservation before card payment for ${order.orderNumber}`,
      )
    })

    const [payment] = await db
      .insert(payments)
      .values({
        orderId: order.id,
        method: "card",
        status: "pending",
        amount: order.total,
        currency: "LKR",
        idempotencyKey,
      })
      .returning()

    const paymentUrl = `${getSiteUrl()}/checkout/payment/mock?paymentId=${payment.id}&token=${input.accessToken}`

    await db
      .update(payments)
      .set({
        externalId: `mock_${payment.id}`,
        metadata: JSON.stringify({
          provider: "mock_card",
          paymentUrl,
        }),
      })
      .where(eq(payments.id, payment.id))

    await db
      .update(orders)
      .set({
        status: "pending_payment",
        paymentStatus: "unpaid",
        fulfillmentStatus: "confirmed",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id))

    return {
      success: true,
      paymentUrl,
      sessionId: payment.id,
    }
  } catch (error) {
    console.error("Payment initiation failed:", error)
    return { success: false, error: "Failed to initiate payment" }
  }
}

// ============================================
// Verify Payment Status
// ============================================

export async function verifyPaymentStatus(sessionId: string) {
  try {
    const payment = await db.query.payments.findFirst({
      where: eq(payments.externalId, sessionId),
    })

    if (!payment) {
      return { success: false, error: "Payment not found" }
    }

    revalidatePath(`/orders/${payment.orderId}`)
    revalidatePath("/ops/orders")
    revalidatePath("/ops/payments")

    return {
      success: true,
      status:
        payment.status === "completed"
          ? "completed"
          : payment.status === "failed"
            ? "failed"
            : "pending",
      transactionId: payment.externalId,
    }
  } catch (error) {
    console.error("Payment verification failed:", error)
    return { success: false, error: "Failed to verify payment" }
  }
}

// ============================================
// Process Successful Payment
// ============================================

async function processSuccessfulPayment(orderId: string) {
  const session = await getServerSession()

  await db.transaction(async (tx) => {
    await processSuccessfulPaymentInTx(
      tx,
      orderId,
      session?.user?.id || null,
      "Payment completed",
    )
    await clearCartForOrderTx(tx, orderId)
  })

  void sendPaidOrderInvoiceEmail(orderId)
}

async function processFailedPayment(orderId: string, notes: string) {
  const session = await getServerSession()

  await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({
      where: eq(orders.id, orderId),
    })

    if (!order || order.status === "cancelled") {
      return
    }

    await releaseOrderInventoryReservationsTx(
      tx,
      orderId,
      "Released after failed payment",
    )

    await tx
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus: "failed",
        fulfillmentStatus: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    await tx.insert(orderStatusHistory).values({
      orderId,
      fromStatus: order.status,
      toStatus: "cancelled",
      notes,
      changedBy: session?.user?.id || null,
    })

    await restoreCartFromOrderTx(tx, orderId)
  })
}

// ============================================
// Record Bank Transfer Payment
// ============================================

export async function recordBankTransferPayment(orderId: string) {
  const session = await getServerSession()

  // Get order details
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })

  if (!order) {
    return { success: false, error: "Order not found" }
  }

  await db.transaction(async (tx) => {
    await ensureOrderInventoryReservationsTx(
      tx,
      order.id,
      `Ensured reservation before bank transfer for ${order.orderNumber}`,
    )
  })

  // Create pending bank transfer payment
  const [payment] = await db
    .insert(payments)
    .values({
      orderId: order.id,
      method: "bank_transfer",
      status: "pending",
      amount: order.total,
      currency: "LKR",
      idempotencyKey: `bt_${order.id}_${Date.now()}`,
    })
    .returning()

  // Update order status
  await db
    .update(orders)
    .set({
      status: "pending_payment",
      paymentStatus: "pending_verification",
      fulfillmentStatus: "confirmed",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))

  await db.insert(orderStatusHistory).values({
    orderId,
    fromStatus: order.status,
    toStatus: "pending_payment",
    notes: "Bank transfer initiated - awaiting proof of payment",
    changedBy: session?.user?.id || null,
  })

  revalidatePath(`/orders/${orderId}`)

  return { success: true, paymentId: payment.id }
}

// ============================================
// Record Cash on Delivery Payment
// ============================================

export async function recordCODPayment(orderId: string) {
  const session = await getServerSession()

  // Get order details
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })

  if (!order) {
    return { success: false, error: "Order not found" }
  }

  await db.transaction(async (tx) => {
    await ensureOrderInventoryReservationsTx(
      tx,
      order.id,
      `Ensured reservation before COD processing for ${order.orderNumber}`,
    )
  })

  // Create COD payment record (pending until delivery)
  const [payment] = await db
    .insert(payments)
    .values({
      orderId: order.id,
      method: "cash_on_delivery",
      status: "pending",
      amount: order.total,
      currency: "LKR",
      idempotencyKey: `cod_${order.id}_${Date.now()}`,
    })
    .returning()

  // Update order status to processing (COD orders go directly to processing)
  await db
    .update(orders)
    .set({
      status: "processing",
      paymentStatus: "unpaid",
      fulfillmentStatus: "confirmed",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))

  await db.insert(orderStatusHistory).values({
    orderId,
    fromStatus: order.status,
    toStatus: "processing",
    notes: "Cash on Delivery order - payment to be collected on delivery",
    changedBy: session?.user?.id || null,
  })

  revalidatePath(`/orders/${orderId}`)

  return { success: true, paymentId: payment.id }
}

// ============================================
// Mark COD Payment as Collected
// ============================================

export async function markCODPaymentCollected(orderId: string) {
  await requireStaff()
  const session = await getServerSession()

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })

  if (!order) {
    return { success: false, error: "Order not found" }
  }

  const payment = await db.query.payments.findFirst({
    where: and(
      eq(payments.orderId, orderId),
      eq(payments.method, "cash_on_delivery"),
    ),
  })

  if (!payment) {
    return { success: false, error: "COD payment record not found" }
  }

  if (payment.status === "completed") {
    return { success: false, error: "Payment already collected" }
  }

  try {
    await db.transaction(async (tx) => {
      // Update payment as completed
      await tx
        .update(payments)
        .set({
          status: "completed",
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))

      await tx
        .update(orders)
        .set({
          paymentStatus: "paid",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
    })

    revalidatePath("/ops/orders")
    revalidatePath(`/ops/orders/${orderId}`)
    revalidatePath(`/orders/${orderId}`)

    return { success: true }
  } catch (error) {
    console.error("Failed to mark COD payment as collected:", error)
    return { success: false, error: "Failed to process payment" }
  }
}

// ============================================
// Upload Bank Transfer Proof
// ============================================

export async function uploadBankTransferProof(
  paymentId: string,
  fileUrl: string,
  fileName: string,
  notes?: string,
) {
  await db.insert(bankTransferProofs).values({
    paymentId,
    fileUrl,
    fileName,
    notes,
  })

  revalidatePath("/ops/payments")
  return { success: true }
}

export async function getMockCardPaymentContext(
  paymentId: string,
  accessToken: string,
) {
  const tokenRecord = await db.query.guestOrderAccessTokens.findFirst({
    where: eq(guestOrderAccessTokens.tokenHash, hashToken(accessToken)),
  })

  if (!tokenRecord || tokenRecord.expiresAt <= new Date()) {
    return null
  }

  const payment = await db.query.payments.findFirst({
    where: and(eq(payments.id, paymentId), eq(payments.method, "card")),
  })

  if (!payment || payment.orderId !== tokenRecord.orderId) {
    return null
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, payment.orderId),
  })

  if (!order) {
    return null
  }

  const items = await db
    .select({
      id: orderItems.id,
      productName: orderItems.productName,
      variantName: orderItems.variantName,
      quantity: orderItems.quantity,
      subtotal: orderItems.subtotal,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))

  return {
    paymentId: payment.id,
    status: payment.status,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    total: order.total,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    taxAmount: order.taxAmount,
    discountAmount: order.discountAmount,
    token: accessToken,
    items,
  }
}

interface SubmitMockCardPaymentInput {
  paymentId: string
  accessToken: string
  cardholderName: string
  cardNumber: string
  expiry: string
  cvc: string
  outcome: "success" | "failed"
}

export async function submitMockCardPayment(input: SubmitMockCardPaymentInput) {
  const paymentContext = await getMockCardPaymentContext(
    input.paymentId,
    input.accessToken,
  )

  if (!paymentContext) {
    return { success: false as const, error: "Payment session not found" }
  }

  if (paymentContext.status === "completed") {
    return {
      success: true as const,
      redirectUrl: `/checkout/success?token=${input.accessToken}`,
    }
  }

  if (paymentContext.status === "failed" || input.outcome === "failed") {
    await processFailedPayment(
      paymentContext.orderId,
      input.outcome === "failed"
        ? "Mock card payment declined"
        : "Payment already failed",
    )

    return {
      success: true as const,
      redirectUrl: `/checkout/complete?orderId=${paymentContext.orderId}&token=${input.accessToken}&failed=1`,
    }
  }

  const normalizedNumber = input.cardNumber.replace(/\s+/g, "")
  if (
    input.cardholderName.trim().length < 2 ||
    normalizedNumber.length < 12 ||
    input.expiry.trim().length < 4 ||
    input.cvc.trim().length < 3
  ) {
    return { success: false as const, error: "Enter valid mock card details" }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({
        status: "completed",
        processedAt: new Date(),
        updatedAt: new Date(),
        externalStatus: "completed",
        metadata: JSON.stringify({
          provider: "mock_card",
          cardholderName: input.cardholderName.trim(),
          cardLast4: normalizedNumber.slice(-4),
        }),
      })
      .where(eq(payments.id, input.paymentId))

    await processSuccessfulPaymentInTx(
      tx,
      paymentContext.orderId,
      null,
      "Mock card payment completed",
    )

    await clearCartForOrderTx(tx, paymentContext.orderId)
  })

  void sendPaidOrderInvoiceEmail(paymentContext.orderId)

  return {
    success: true as const,
    redirectUrl: `/checkout/success?token=${input.accessToken}`,
  }
}

export async function cancelMockCardPayment(
  paymentId: string,
  accessToken: string,
) {
  const paymentContext = await getMockCardPaymentContext(paymentId, accessToken)

  if (!paymentContext) {
    return { success: false as const, error: "Payment session not found" }
  }

  if (paymentContext.status !== "completed") {
    await processFailedPayment(
      paymentContext.orderId,
      "Payment cancelled by customer on mock card page",
    )
  }

  return {
    success: true as const,
    redirectUrl: `/checkout/complete?orderId=${paymentContext.orderId}&token=${accessToken}&cancelled=1`,
  }
}

export async function verifyCardPaymentForOrder(orderId: string) {
  const payment = await db.query.payments.findFirst({
    where: and(eq(payments.orderId, orderId), eq(payments.method, "card")),
  })

  if (!payment) {
    return { success: false as const, error: "Payment not found" }
  }

  if (payment.status === "completed") {
    return { success: true as const, status: "completed" as const }
  }

  if (payment.status === "failed") {
    return { success: true as const, status: "failed" as const }
  }

  return { success: true as const, status: "pending" as const }
}

// ============================================
// Admin: Get Payments List
// ============================================

interface PaymentFilterInput {
  page?: number
  limit?: number
  status?: string
  method?: string
  search?: string
}

export async function getPayments(input: PaymentFilterInput = {}) {
  await requireStaff()

  const { page = 1, limit = 20, status, method, search } = input
  const offset = (page - 1) * limit

  let query = db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      method: payments.method,
      status: payments.status,
      amount: payments.amount,
      currency: payments.currency,
      externalId: payments.externalId,
      processedAt: payments.processedAt,
      createdAt: payments.createdAt,
      orderNumber: orders.orderNumber,
      customerEmail: orders.customerEmail,
      customerName: orders.customerName,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .$dynamic()

  // Build where conditions
  const conditions = []
  if (status) {
    conditions.push(eq(payments.status, status as any))
  }
  if (method) {
    conditions.push(eq(payments.method, method as any))
  }
  if (search) {
    conditions.push(
      or(
        ilike(orders.orderNumber, `%${search}%`),
        ilike(orders.customerEmail, `%${search}%`),
      ),
    )
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions))
  }

  const paymentsList = await query
    .orderBy(desc(payments.createdAt))
    .limit(limit)
    .offset(offset)

  // Get total count
  const [totalResult] = await db.select({ count: count() }).from(payments)
  const total = totalResult?.count || 0

  return {
    payments: paymentsList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ============================================
// Admin: Get Pending Bank Transfer Verifications
// ============================================

export async function getPendingBankTransfers() {
  await requireStaff()

  const pending = await db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      amount: payments.amount,
      currency: payments.currency,
      createdAt: payments.createdAt,
      orderNumber: orders.orderNumber,
      customerEmail: orders.customerEmail,
      customerName: orders.customerName,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(
      and(eq(payments.method, "bank_transfer"), eq(payments.status, "pending")),
    )
    .orderBy(desc(payments.createdAt))

  // Get proofs for each payment
  const paymentsWithProofs = await Promise.all(
    pending.map(async (payment) => {
      const proofs = await db
        .select()
        .from(bankTransferProofs)
        .where(eq(bankTransferProofs.paymentId, payment.id))
        .orderBy(desc(bankTransferProofs.createdAt))

      return { ...payment, proofs }
    }),
  )

  return paymentsWithProofs
}

// ============================================
// Admin: Verify Bank Transfer
// ============================================

export async function verifyBankTransfer(
  paymentId: string,
  approved: boolean,
  notes?: string,
) {
  await requireStaff()
  const session = await getServerSession()

  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
  })

  if (!payment) {
    return { success: false, error: "Payment not found" }
  }

  if (payment.status !== "pending") {
    return { success: false, error: "Payment already processed" }
  }

  try {
    await db.transaction(async (tx) => {
      if (approved) {
        // Update payment as completed
        await tx
          .update(payments)
          .set({
            status: "completed",
            processedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentId))

        // Update proof verification
        await tx
          .update(bankTransferProofs)
          .set({
            verifiedAt: new Date(),
            verifiedBy: session?.user?.id || null,
            verificationNotes: notes,
            isApproved: new Date(),
          })
          .where(eq(bankTransferProofs.paymentId, paymentId))

        // Process the successful payment
        await processSuccessfulPaymentInTx(
          tx,
          payment.orderId,
          session?.user?.id || null,
          "Bank transfer verified",
        )
      } else {
        // Reject the payment
        await tx
          .update(payments)
          .set({
            status: "failed",
            failureReason: notes || "Bank transfer verification failed",
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentId))

        await tx
          .update(bankTransferProofs)
          .set({
            verifiedAt: new Date(),
            verifiedBy: session?.user?.id || null,
            verificationNotes: notes,
          })
          .where(eq(bankTransferProofs.paymentId, paymentId))

        await releaseOrderInventoryReservationsTx(
          tx,
          payment.orderId,
          "Released after bank transfer rejection",
        )

        await tx
          .update(orders)
          .set({
            status: "cancelled",
            paymentStatus: "failed",
            fulfillmentStatus: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, payment.orderId))

        await tx.insert(orderStatusHistory).values({
          orderId: payment.orderId,
          fromStatus: "pending_payment",
          toStatus: "cancelled",
          notes: `Bank transfer rejected: ${notes || "Verification failed"}`,
          changedBy: session?.user?.id || null,
        })
      }
    })

    revalidatePath("/ops/payments")
    revalidatePath("/ops/orders")
    revalidatePath(`/ops/orders/${payment.orderId}`)
    revalidatePath(`/orders/${payment.orderId}`)

    if (approved) {
      void sendPaidOrderInvoiceEmail(payment.orderId)
    }

    return { success: true }
  } catch (error) {
    console.error("Bank transfer verification failed:", error)
    return { success: false, error: "Failed to process verification" }
  }
}

// Helper for transaction context
async function processSuccessfulPaymentInTx(
  tx: any,
  orderId: string,
  userId: string | null,
  notes: string,
) {
  await tx
    .update(orders)
    .set({
      status: "paid",
      paymentStatus: "paid",
      fulfillmentStatus: "confirmed",
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))

  await tx.insert(orderStatusHistory).values({
    orderId,
    fromStatus: "pending_payment",
    toStatus: "paid",
    notes,
    changedBy: userId,
  })
}

// ============================================
// Admin: Get Payment Stats
// ============================================

export async function getPaymentStats() {
  await requireStaff()

  const stats = await db
    .select({
      status: payments.status,
      method: payments.method,
      count: count(),
    })
    .from(payments)
    .groupBy(payments.status, payments.method)

  const pendingBankTransfers = stats
    .filter((s) => s.method === "bank_transfer" && s.status === "pending")
    .reduce((sum, s) => sum + s.count, 0)

  const totalCompleted = stats
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.count, 0)

  const totalFailed = stats
    .filter((s) => s.status === "failed")
    .reduce((sum, s) => sum + s.count, 0)

  const totalPending = stats
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.count, 0)

  return {
    pendingBankTransfers,
    totalCompleted,
    totalFailed,
    totalPending,
  }
}

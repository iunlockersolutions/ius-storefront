import crypto from "crypto"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

import { db } from "@/lib/db"
import {
  guestOrderAccessTokens,
  orderItems,
  orders,
  payments,
} from "@/lib/db/schema"
import {
  type OrderEmailData,
  sendOrderConfirmationEmail,
  sendOrderInvoiceEmail,
} from "@/lib/email/order-notifications"
import { formatCurrency, parseCurrencyAmount } from "@/lib/utils"

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

function getPaymentMethodLabel(method: string | null) {
  switch (method) {
    case "card":
      return "Card payment"
    case "bank_transfer":
      return "Bank transfer"
    case "cash_on_delivery":
      return "Cash on delivery"
    default:
      return "Payment pending"
  }
}

async function createFreshOrderAccessToken(orderId: string, email: string) {
  const token = nanoid(48)

  await db.insert(guestOrderAccessTokens).values({
    orderId,
    email,
    kind: "access",
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
  })

  return token
}

async function buildOrderEmailData(orderId: string): Promise<{
  data: OrderEmailData
  paymentStatus: string | null
  paymentMethod: string | null
} | null> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })

  if (!order) {
    return null
  }

  const [payment, items] = await Promise.all([
    db.query.payments.findFirst({
      where: eq(payments.orderId, orderId),
      orderBy: (table, { desc: orderDesc }) => [orderDesc(table.createdAt)],
    }),
    db
      .select({
        productName: orderItems.productName,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId)),
  ])

  const siteUrl = getSiteUrl()
  const accessToken = await createFreshOrderAccessToken(
    order.id,
    order.customerEmail,
  )
  const orderPath = `/orders/${order.id}`
  const bankTransferPath = `/orders/${order.id}/bank-transfer`
  const guestOrderUrl = `${siteUrl}/guest/orders/${encodeURIComponent(accessToken)}`
  const guestBankTransferUrl = `${siteUrl}/guest/orders/${encodeURIComponent(accessToken)}/bank-transfer`

  const orderUrl = `${siteUrl}${orderPath}`
  const loginTargetPath =
    order.paymentMethod === "bank_transfer" ? bankTransferPath : orderPath
  const loginUrl = `${siteUrl}/auth/login?callbackUrl=${encodeURIComponent(loginTargetPath)}`

  const primaryActionUrl =
    order.paymentMethod === "bank_transfer" &&
    payment?.status === "pending" &&
    (order.userId ? loginUrl : guestBankTransferUrl || guestOrderUrl)
      ? order.userId
        ? loginUrl
        : guestBankTransferUrl || guestOrderUrl || orderUrl
      : order.userId
        ? loginUrl
        : guestOrderUrl || orderUrl

  const primaryActionLabel =
    order.paymentMethod === "bank_transfer" && payment?.status === "pending"
      ? order.userId
        ? "Sign in to complete payment"
        : "View bank transfer instructions"
      : order.userId
        ? "Sign in to track your order"
        : "Track your order"

  const secondaryActionUrl = order.userId ? guestOrderUrl : null
  const secondaryActionLabel =
    order.userId && guestOrderUrl ? "Use secure fallback link" : undefined

  const data: OrderEmailData = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName || "Customer",
    customerEmail: order.customerEmail,
    total: formatCurrency(order.total),
    subtotal: formatCurrency(order.subtotal),
    shippingCost: formatCurrency(order.shippingCost),
    taxAmount: formatCurrency(order.taxAmount),
    discountAmount: formatCurrency(order.discountAmount),
    paymentMethodLabel: getPaymentMethodLabel(order.paymentMethod),
    items: items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      price: formatCurrency(
        parseCurrencyAmount(item.unitPrice) * item.quantity,
      ),
    })),
    shippingAddress: order.shippingAddress as OrderEmailData["shippingAddress"],
    primaryActionLabel,
    primaryActionUrl,
    secondaryActionLabel,
    secondaryActionUrl: secondaryActionUrl || undefined,
  }

  return {
    data,
    paymentStatus: payment?.status ?? null,
    paymentMethod: order.paymentMethod,
  }
}

export async function sendPlacedOrderEmails(orderId: string) {
  const payload = await buildOrderEmailData(orderId)

  if (!payload) {
    return false
  }

  const confirmationData: OrderEmailData = {
    ...payload.data,
    paymentSummaryTitle:
      payload.paymentMethod === "bank_transfer"
        ? "Bank transfer pending"
        : payload.paymentMethod === "card"
          ? "Complete your card payment"
          : "Cash on delivery",
    paymentSummaryBody:
      payload.paymentMethod === "bank_transfer"
        ? "Transfer the exact amount and upload your proof of payment using the secure link in this email."
        : payload.paymentMethod === "card"
          ? "Use the secure mock payment page to finish your card payment."
          : "Please keep this invoice for reference. Payment will be collected when the order is delivered.",
  }

  const confirmationSent = await sendOrderConfirmationEmail(confirmationData)

  if (payload.paymentMethod === "cash_on_delivery") {
    await sendOrderInvoiceEmail({
      ...payload.data,
      paymentSummaryTitle: "Amount due on delivery",
      paymentSummaryBody:
        "This is your invoice for a cash on delivery order. Please keep it for reference until payment is collected at delivery.",
    })
  }

  return confirmationSent
}

export async function sendPaidOrderInvoiceEmail(orderId: string) {
  const payload = await buildOrderEmailData(orderId)

  if (!payload) {
    return false
  }

  return sendOrderInvoiceEmail({
    ...payload.data,
    paymentSummaryTitle:
      payload.paymentMethod === "bank_transfer"
        ? "Payment received by bank transfer"
        : "Payment received",
    paymentSummaryBody:
      payload.paymentMethod === "bank_transfer"
        ? "Your bank transfer has been verified and your invoice is now fully paid."
        : "Your payment was completed successfully and this email is your receipt.",
  })
}

"use server"

import { and, desc, eq, inArray, sql } from "drizzle-orm"

import { getServerSession, requireAuth } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  orderItems,
  orders,
  orderStatusHistory,
  payments,
  productImages,
} from "@/lib/db/schema"

// ============================================
// Get Customer Orders
// ============================================

export async function getCustomerOrders(page: number = 1, limit: number = 10) {
  const session = await requireAuth()

  const offset = (page - 1) * limit

  // Get orders for the current user
  const customerOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
      itemCount: sql<number>`(
                SELECT COUNT(*)::int 
                FROM ${orderItems} 
                WHERE ${orderItems.orderId} = ${orders.id}
            )`,
    })
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.userId, session.user.id))

  // Get first item image for each order
  const orderIds = customerOrders.map((o) => o.id)

  const firstItems =
    orderIds.length > 0
      ? await db
          .select({
            orderId: orderItems.orderId,
            productName: orderItems.productName,
            variantId: orderItems.variantId,
          })
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
      : []

  // Get images for the variants
  const variantIds = [
    ...new Set(firstItems.map((i) => i.variantId).filter(Boolean)),
  ] as string[]

  const images =
    variantIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(eq(productImages.isPrimary, true))
      : []

  // Create order-to-image mapping
  const orderImageMap = new Map<
    string,
    { productName: string; imageUrl: string | null }
  >()
  for (const order of customerOrders) {
    const firstItem = firstItems.find((i) => i.orderId === order.id)
    if (firstItem) {
      const image = images.find((img) => img.productId)
      orderImageMap.set(order.id, {
        productName: firstItem.productName,
        imageUrl: image?.url || null,
      })
    }
  }

  return {
    orders: customerOrders.map((order) => ({
      ...order,
      firstItem: orderImageMap.get(order.id) || null,
    })),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  }
}

// ============================================
// Get Single Customer Order
// ============================================

export async function getCustomerOrder(orderId: string) {
  const session = await requireAuth()

  // Get order with ownership check
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, session.user.id)),
  })

  if (!order) {
    return null
  }

  // Get order items
  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      subtotal: orderItems.subtotal,
      productName: orderItems.productName,
      variantName: orderItems.variantName,
      sku: orderItems.sku,
      variantId: orderItems.variantId,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))

  // Get status history
  const history = await db
    .select({
      id: orderStatusHistory.id,
      fromStatus: orderStatusHistory.fromStatus,
      toStatus: orderStatusHistory.toStatus,
      notes: orderStatusHistory.notes,
      createdAt: orderStatusHistory.createdAt,
    })
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, orderId))
    .orderBy(desc(orderStatusHistory.createdAt))

  // Get payment info
  const payment = await db.query.payments.findFirst({
    where: eq(payments.orderId, orderId),
  })

  return {
    ...order,
    items,
    statusHistory: history,
    payment,
  }
}

// ============================================
// Cancel Order
// ============================================

export async function cancelCustomerOrder(orderId: string, reason?: string) {
  const session = await requireAuth()

  // Get order with ownership check
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, session.user.id)),
  })

  if (!order) {
    return { success: false, error: "Order not found" }
  }

  // Only allow cancellation of orders in certain statuses
  const cancellableStatuses = ["draft", "pending_payment", "paid"]
  if (!cancellableStatuses.includes(order.status)) {
    return {
      success: false,
      error: "This order cannot be cancelled. Please contact support.",
    }
  }

  // Update order status
  await db
    .update(orders)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))

  // Record status change
  await db.insert(orderStatusHistory).values({
    orderId,
    fromStatus: order.status,
    toStatus: "cancelled",
    notes: reason
      ? `Customer requested cancellation: ${reason}`
      : "Cancelled by customer",
    changedBy: session.user.id,
  })

  // TODO: Release reserved inventory if order was paid
  // TODO: Initiate refund if payment was made

  return { success: true }
}

// ============================================
// Get Order Status Timeline
// ============================================

export async function getOrderTimeline(orderId: string) {
  const session = await requireAuth()

  // Verify ownership
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, session.user.id)),
  })

  if (!order) {
    return null
  }

  const history = await db
    .select({
      id: orderStatusHistory.id,
      fromStatus: orderStatusHistory.fromStatus,
      toStatus: orderStatusHistory.toStatus,
      notes: orderStatusHistory.notes,
      createdAt: orderStatusHistory.createdAt,
    })
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, orderId))
    .orderBy(orderStatusHistory.createdAt)

  // Create a timeline including order creation
  const timeline = [
    {
      status: "created",
      label: "Order Placed",
      date: order.createdAt,
      description: `Order #${order.orderNumber} was placed`,
    },
  ]

  // Add status changes
  for (const entry of history) {
    timeline.push({
      status: entry.toStatus,
      label: getStatusLabel(entry.toStatus),
      date: entry.createdAt,
      description: entry.notes || getStatusDescription(entry.toStatus),
    })
  }

  return timeline
}

// ============================================
// Helper Functions
// ============================================

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Order Created",
    pending_payment: "Awaiting Payment",
    paid: "Payment Received",
    processing: "Processing",
    packing: "Packing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
  }
  return labels[status] || status
}

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    draft: "Your order has been created",
    pending_payment: "We're waiting for your payment",
    paid: "Your payment has been confirmed",
    processing: "Your order is being processed",
    packing: "Your order is being packed",
    shipped: "Your order is on its way",
    delivered: "Your order has been delivered",
    cancelled: "This order has been cancelled",
    refunded: "Your payment has been refunded",
  }
  return descriptions[status] || ""
}

// ============================================
// Get Order Count by Status
// ============================================

export async function getCustomerOrderCounts() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return null
  }

  const counts = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .groupBy(orders.status)

  const result: Record<string, number> = {
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }

  for (const row of counts) {
    result.total += row.count
    if (row.status === "pending_payment" || row.status === "paid") {
      result.pending += row.count
    } else if (row.status === "processing" || row.status === "packing") {
      result.processing += row.count
    } else if (row.status === "shipped") {
      result.shipped += row.count
    } else if (row.status === "delivered") {
      result.delivered += row.count
    } else if (row.status === "cancelled" || row.status === "refunded") {
      result.cancelled += row.count
    }
  }

  return result
}

"use server"

import { and, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm"
import { z } from "zod"

import { getServerSession, requireStaff } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  orderItems,
  orders,
  orderStatusHistory,
  productVariants,
  user,
} from "@/lib/db/schema"
import {
  type OrderEmailData,
  sendOrderDeliveredEmail,
  sendOrderShippedEmail,
} from "@/lib/email/order-notifications"

// Schemas
const orderFilterSchema = z.object({
  status: z
    .enum([
      "draft",
      "pending_payment",
      "paid",
      "processing",
      "packing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    "draft",
    "pending_payment",
    "paid",
    "processing",
    "packing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  notes: z.string().optional(),
})

// Types
type OrderFilterInput = z.infer<typeof orderFilterSchema>
type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>

// Get orders with filtering and pagination
export async function getOrders(
  input: OrderFilterInput = { page: 1, limit: 20 },
) {
  try {
    await requireStaff()
    const { status, search, startDate, endDate, page, limit } =
      orderFilterSchema.parse(input)
    const offset = (page - 1) * limit

    const conditions = []

    if (status) {
      conditions.push(eq(orders.status, status))
    }

    if (search) {
      conditions.push(
        or(
          ilike(orders.orderNumber, `%${search}%`),
          ilike(user.email, `%${search}%`),
        ),
      )
    }

    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate)))
    }

    if (endDate) {
      conditions.push(lte(orders.createdAt, new Date(endDate)))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [ordersList, [{ total }]] = await Promise.all([
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          subtotal: orders.subtotal,
          tax: orders.taxAmount,
          shippingCost: orders.shippingCost,
          discount: orders.discountAmount,
          total: orders.total,
          createdAt: orders.createdAt,
          customer: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        })
        .from(orders)
        .leftJoin(user, eq(orders.userId, user.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(orders)
        .leftJoin(user, eq(orders.userId, user.id))
        .where(whereClause),
    ])

    return {
      success: true as const,
      data: {
        orders: ordersList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    }
  } catch (error) {
    console.error("Failed to fetch orders:", error)
    return { success: false as const, error: "Failed to fetch orders" }
  }
}

// Get single order with details
export async function getOrder(orderId: string) {
  try {
    await requireStaff()
    const order = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        subtotal: orders.subtotal,
        taxAmount: orders.taxAmount,
        shippingCost: orders.shippingCost,
        discountAmount: orders.discountAmount,
        total: orders.total,
        notes: orders.notes,
        adminNotes: orders.adminNotes,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        customerName: orders.customerName,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customer: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(orders)
      .leftJoin(user, eq(orders.userId, user.id))
      .where(eq(orders.id, orderId))
      .limit(1)

    if (order.length === 0) {
      return { success: false as const, error: "Order not found" }
    }

    // Get order items (using denormalized data)
    const items = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        subtotal: orderItems.subtotal,
        productName: orderItems.productName,
        variantName: orderItems.variantName,
        sku: orderItems.sku,
        variant: {
          id: productVariants.id,
          name: productVariants.name,
          sku: productVariants.sku,
        },
      })
      .from(orderItems)
      .leftJoin(productVariants, eq(orderItems.variantId, productVariants.id))
      .where(eq(orderItems.orderId, orderId))

    // Get status history
    const statusHistory = await db
      .select({
        id: orderStatusHistory.id,
        fromStatus: orderStatusHistory.fromStatus,
        toStatus: orderStatusHistory.toStatus,
        notes: orderStatusHistory.notes,
        createdAt: orderStatusHistory.createdAt,
        changedBy: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(orderStatusHistory)
      .leftJoin(user, eq(orderStatusHistory.changedBy, user.id))
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.createdAt))

    return {
      success: true as const,
      data: {
        ...order[0],
        items,
        statusHistory,
      },
    }
  } catch (error) {
    console.error("Failed to fetch order:", error)
    return { success: false as const, error: "Failed to fetch order" }
  }
}

// Update order status
export async function updateOrderStatus(input: UpdateOrderStatusInput) {
  try {
    const session = await getServerSession()
    await requireStaff()
    const { orderId, status, notes } = updateOrderStatusSchema.parse(input)

    const [existingOrder] = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    if (!existingOrder) {
      return { success: false as const, error: "Order not found" }
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      draft: ["pending_payment", "cancelled"],
      pending_payment: ["paid", "cancelled"],
      paid: ["processing", "cancelled"],
      processing: ["packing", "cancelled"],
      packing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: ["refunded"],
      cancelled: [],
      refunded: [],
    }

    if (!validTransitions[existingOrder.status]?.includes(status)) {
      return {
        success: false as const,
        error: `Cannot change status from ${existingOrder.status} to ${status}`,
      }
    }

    // Update order status
    await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    // Record status change in history
    await db.insert(orderStatusHistory).values({
      orderId,
      fromStatus: existingOrder.status,
      toStatus: status,
      notes: notes || null,
      changedBy: session?.user?.id || null,
    })

    // Send email notifications for specific status changes
    if (status === "shipped" || status === "delivered") {
      // Get full order data for email
      const orderData = await getOrderForEmail(orderId)
      if (orderData) {
        if (status === "shipped") {
          await sendOrderShippedEmail(orderData)
        } else if (status === "delivered") {
          await sendOrderDeliveredEmail(orderData)
        }
      }
    }

    return { success: true as const }
  } catch (error) {
    console.error("Failed to update order status:", error)
    return { success: false as const, error: "Failed to update order status" }
  }
}

// Update order admin notes
export async function updateOrderNotes(orderId: string, adminNotes: string) {
  try {
    await requireStaff()

    const [existingOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    if (!existingOrder) {
      return { success: false as const, error: "Order not found" }
    }

    await db
      .update(orders)
      .set({
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    return { success: true as const }
  } catch (error) {
    console.error("Failed to update order notes:", error)
    return { success: false as const, error: "Failed to update order notes" }
  }
}

// Get order stats
export async function getOrderStats() {
  try {
    await requireStaff()
    const stats = await db
      .select({
        status: orders.status,
        count: count(),
        total: sql<number>`sum(${orders.total})`,
      })
      .from(orders)
      .groupBy(orders.status)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayStats] = await db
      .select({
        count: count(),
        total: sql<number>`sum(${orders.total})`,
      })
      .from(orders)
      .where(gte(orders.createdAt, today))

    return {
      success: true as const,
      data: {
        byStatus: stats,
        today: todayStats,
      },
    }
  } catch (error) {
    console.error("Failed to fetch order stats:", error)
    return { success: false as const, error: "Failed to fetch order stats" }
  }
}

// Helper function to get order data for email
async function getOrderForEmail(
  orderId: string,
): Promise<OrderEmailData | null> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })

  if (!order) return null

  const items = await db
    .select({
      productName: orderItems.productName,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))

  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName || "Customer",
    customerEmail: order.customerEmail,
    total: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(order.total)),
    items: items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      price: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(parseFloat(item.unitPrice)),
    })),
    shippingAddress: order.shippingAddress as OrderEmailData["shippingAddress"],
  }
}

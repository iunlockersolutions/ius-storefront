"use server"

import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { adminActivityLogs } from "@/lib/db/schema/admin"

export type ActivityAction =
  // User management actions
  | "user.create"
  | "user.update"
  | "user.delete"
  | "user.ban"
  | "user.unban"
  | "user.password_reset"
  | "user.role_change"
  // Product actions
  | "product.create"
  | "product.update"
  | "product.delete"
  | "product.status_change"
  // Category actions
  | "category.create"
  | "category.update"
  | "category.delete"
  // Order actions
  | "order.update_status"
  | "order.cancel"
  | "order.refund"
  // Inventory actions
  | "inventory.adjust"
  | "inventory.reserve"
  | "inventory.release"
  // Payment actions
  | "payment.verify"
  | "payment.refund"
  // Review actions
  | "review.approve"
  | "review.reject"
  | "review.delete"
  // Settings actions
  | "settings.update"
  // Session actions
  | "session.revoke"
  | "session.revoke_all"

interface LogActivityOptions {
  action: ActivityAction
  entityType?: string
  entityId?: string
  details?: Record<string, unknown>
}

/**
 * Log an admin activity
 *
 * Records admin actions for audit trail and security purposes.
 * Automatically captures the current user, IP address, and user agent.
 */
export async function logActivity(options: LogActivityOptions): Promise<void> {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user?.id) {
      console.warn("Attempted to log activity without authenticated user")
      return
    }

    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      null
    const userAgent = headersList.get("user-agent") || null

    await db.insert(adminActivityLogs).values({
      userId: session.user.id,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      details: options.details,
      ipAddress,
      userAgent,
    })
  } catch (error) {
    // Don't throw - logging should not break the main flow
    console.error("Failed to log activity:", error)
  }
}

/**
 * Get activity logs for a specific user
 */
export async function getActivityLogs(
  userId?: string,
  limit = 50,
): Promise<
  Array<{
    id: string
    action: string
    entityType: string | null
    entityId: string | null
    details: Record<string, unknown> | null
    ipAddress: string | null
    createdAt: Date
  }>
> {
  const headersList = await headers()
  const session = await auth.api.getSession({
    headers: headersList,
  })

  if (!session?.user?.id) {
    return []
  }

  const query = db.query.adminActivityLogs.findMany({
    where: userId ? (logs, { eq }) => eq(logs.userId, userId) : undefined,
    orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    limit,
  })

  return query
}

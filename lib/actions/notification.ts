"use server"

import { and, count, desc, eq, inArray, isNull } from "drizzle-orm"

import { requireStaff } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import type {
  AdminNotification,
  AdminNotificationFeed,
} from "@/lib/types/admin-contact-message"

interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

const DEFAULT_LIMIT = 30

function mapNotification(row: {
  id: string
  type: "contact_message_created"
  targetRef: string
  title: string
  preview: string
  readAt: Date | null
  createdAt: Date
}): AdminNotification {
  return {
    id: row.id,
    type: row.type,
    targetRef: row.targetRef,
    title: row.title,
    preview: row.preview,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }
}

/**
 * Returns the latest notifications for the current staff user plus an unread count.
 */
export async function getNotificationFeed(input?: {
  limit?: number
}): Promise<ActionResult<AdminNotificationFeed>> {
  try {
    const session = await requireStaff()
    const recipientId = session.user.id
    const limit = Math.min(Math.max(input?.limit ?? DEFAULT_LIMIT, 1), 100)

    const rows = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        targetRef: notifications.targetRef,
        title: notifications.title,
        preview: notifications.preview,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.recipientId, recipientId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)

    const [unreadRow] = await db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, recipientId),
          isNull(notifications.readAt),
        ),
      )

    return {
      success: true,
      data: {
        items: rows.map((row) =>
          mapNotification({
            ...row,
            type: row.type as "contact_message_created",
          }),
        ),
        unreadCount: Number(unreadRow?.value ?? 0),
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load notifications",
    }
  }
}

/**
 * Mark notifications read. If `ids` is omitted, marks all unread for the user.
 */
export async function markNotificationsRead(input: {
  ids?: string[]
}): Promise<ActionResult<{ updated: number }>> {
  try {
    const session = await requireStaff()
    const recipientId = session.user.id
    const now = new Date()

    if (input.ids && input.ids.length > 0) {
      const result = await db
        .update(notifications)
        .set({ readAt: now })
        .where(
          and(
            eq(notifications.recipientId, recipientId),
            inArray(notifications.id, input.ids),
            isNull(notifications.readAt),
          ),
        )
        .returning({ id: notifications.id })

      return { success: true, data: { updated: result.length } }
    }

    const result = await db
      .update(notifications)
      .set({ readAt: now })
      .where(
        and(
          eq(notifications.recipientId, recipientId),
          isNull(notifications.readAt),
        ),
      )
      .returning({ id: notifications.id })

    return { success: true, data: { updated: result.length } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to mark notifications read",
    }
  }
}

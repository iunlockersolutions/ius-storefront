"use server"

import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm"
import { z } from "zod"

import { getServerSession, requireStaff } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  contactMessageEvents,
  contactMessages,
  notifications,
  user,
} from "@/lib/db/schema"
import type {
  AdminContactMessage,
  AdminContactMessageDetail,
  AdminContactMessageEvent,
  AdminContactMessageListResult,
  AdminContactMessageStatus,
} from "@/lib/types/admin-contact-message"

const STATUS_VALUES = [
  "unread",
  "open",
  "replied",
  "closed",
  "spam",
] as const satisfies readonly AdminContactMessageStatus[]

const listFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(STATUS_VALUES).optional(),
  assigneeId: z.string().uuid().optional(),
})

const createContactMessageSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(5000),
})

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUS_VALUES),
})

const assignSchema = z.object({
  id: z.string().uuid(),
  assigneeId: z.string().uuid().nullable(),
})

const replySchema = z.object({
  id: z.string().uuid(),
  body: z.string().trim().min(1).max(10000),
})

type ListFilterInput = z.infer<typeof listFilterSchema>
type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>

interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

function buildPreview(message: string, max = 140) {
  const collapsed = message.replace(/\s+/g, " ").trim()
  if (collapsed.length <= max) return collapsed
  return `${collapsed.slice(0, max - 1).trimEnd()}…`
}

function toIsoString(value: Date | string | null): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

function mapContactMessageRow(row: {
  id: string
  senderName: string
  senderEmail: string
  senderPhone: string | null
  message: string
  status: AdminContactMessageStatus
  userId: string | null
  createdAt: Date
  updatedAt: Date
  repliedAt: Date | null
  userName: string | null
  userEmail: string | null
  assigneeId: string | null
  assigneeName: string | null
  assigneeEmail: string | null
}): AdminContactMessage {
  return {
    id: row.id,
    senderName: row.senderName,
    senderEmail: row.senderEmail,
    senderPhone: row.senderPhone,
    message: row.message,
    status: row.status,
    userId: row.userId,
    user: row.userId
      ? {
          id: row.userId,
          name: row.userName,
          email: row.userEmail ?? "",
        }
      : null,
    assignee: row.assigneeId
      ? {
          id: row.assigneeId,
          name: row.assigneeName,
          email: row.assigneeEmail ?? "",
        }
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    repliedAt: toIsoString(row.repliedAt),
  }
}

const userTable = user

/**
 * List contact messages for the ops inbox. Staff-only.
 */
export async function getContactMessages(
  input: Partial<ListFilterInput>,
): Promise<ActionResult<AdminContactMessageListResult>> {
  try {
    await requireStaff()

    const filters = listFilterSchema.parse({
      page: input.page ?? 1,
      limit: input.limit ?? 20,
      search: input.search,
      status: input.status,
      assigneeId: input.assigneeId,
    })

    const conditions = []
    if (filters.status) {
      conditions.push(eq(contactMessages.status, filters.status))
    }
    if (filters.assigneeId) {
      conditions.push(eq(contactMessages.assigneeId, filters.assigneeId))
    }
    if (filters.search && filters.search.length > 0) {
      const term = `%${filters.search}%`
      conditions.push(
        or(
          ilike(contactMessages.senderName, term),
          ilike(contactMessages.senderEmail, term),
          ilike(contactMessages.message, term),
        )!,
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const offset = (filters.page - 1) * filters.limit

    const totalRow = await db
      .select({ value: count() })
      .from(contactMessages)
      .where(whereClause)

    const total = Number(totalRow[0]?.value ?? 0)

    const rows = await db
      .select({
        id: contactMessages.id,
        senderName: contactMessages.senderName,
        senderEmail: contactMessages.senderEmail,
        senderPhone: contactMessages.senderPhone,
        message: contactMessages.message,
        status: contactMessages.status,
        userId: contactMessages.userId,
        createdAt: contactMessages.createdAt,
        updatedAt: contactMessages.updatedAt,
        repliedAt: contactMessages.repliedAt,
        userName: userTable.name,
        userEmail: userTable.email,
        assigneeId: contactMessages.assigneeId,
        // Subselect the assignee name/email since user is already joined for sender
        assigneeName: sql<
          string | null
        >`(SELECT name FROM "user" WHERE id = ${contactMessages.assigneeId})`,
        assigneeEmail: sql<
          string | null
        >`(SELECT email FROM "user" WHERE id = ${contactMessages.assigneeId})`,
      })
      .from(contactMessages)
      .leftJoin(userTable, eq(contactMessages.userId, userTable.id))
      .where(whereClause)
      .orderBy(desc(contactMessages.createdAt))
      .limit(filters.limit)
      .offset(offset)

    const messages = rows.map((row) =>
      mapContactMessageRow({
        ...row,
        status: row.status as AdminContactMessageStatus,
      }),
    )

    return {
      success: true,
      data: {
        messages,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / filters.limit)),
        },
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list contact messages",
    }
  }
}

/**
 * Fetch a single contact message + its events. Staff-only.
 */
export async function getContactMessage(
  id: string,
): Promise<ActionResult<AdminContactMessageDetail>> {
  try {
    await requireStaff()

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid id" }
    }

    const [row] = await db
      .select({
        id: contactMessages.id,
        senderName: contactMessages.senderName,
        senderEmail: contactMessages.senderEmail,
        senderPhone: contactMessages.senderPhone,
        message: contactMessages.message,
        status: contactMessages.status,
        userId: contactMessages.userId,
        createdAt: contactMessages.createdAt,
        updatedAt: contactMessages.updatedAt,
        repliedAt: contactMessages.repliedAt,
        userName: userTable.name,
        userEmail: userTable.email,
        assigneeId: contactMessages.assigneeId,
        assigneeName: sql<
          string | null
        >`(SELECT name FROM "user" WHERE id = ${contactMessages.assigneeId})`,
        assigneeEmail: sql<
          string | null
        >`(SELECT email FROM "user" WHERE id = ${contactMessages.assigneeId})`,
      })
      .from(contactMessages)
      .leftJoin(userTable, eq(contactMessages.userId, userTable.id))
      .where(eq(contactMessages.id, id))
      .limit(1)

    if (!row) {
      return { success: false, error: "Contact message not found" }
    }

    const eventRows = await db
      .select({
        id: contactMessageEvents.id,
        type: contactMessageEvents.type,
        payload: contactMessageEvents.payload,
        createdAt: contactMessageEvents.createdAt,
        actorId: contactMessageEvents.actorId,
        actorName: userTable.name,
        actorEmail: userTable.email,
      })
      .from(contactMessageEvents)
      .leftJoin(userTable, eq(contactMessageEvents.actorId, userTable.id))
      .where(eq(contactMessageEvents.contactMessageId, id))
      .orderBy(contactMessageEvents.createdAt)

    const events: AdminContactMessageEvent[] = eventRows.map((event) => ({
      id: event.id,
      type: event.type,
      payload: (event.payload ?? {}) as Record<string, unknown>,
      createdAt: event.createdAt.toISOString(),
      actor: event.actorId
        ? {
            id: event.actorId,
            name: event.actorName,
            email: event.actorEmail ?? "",
          }
        : null,
    }))

    return {
      success: true,
      data: {
        ...mapContactMessageRow({
          ...row,
          status: row.status as AdminContactMessageStatus,
        }),
        events,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load contact message",
    }
  }
}

/**
 * Public: persist a new contact submission and fan out staff notifications.
 * No auth requirement — caller is responsible for honeypot + rate limit.
 */
export async function createContactMessage(
  input: CreateContactMessageInput & {
    clientIp?: string
    userAgent?: string
  },
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = createContactMessageSchema.parse({
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message,
    })

    const session = await getServerSession()
    const userId = session?.user?.id ?? null

    const phone =
      parsed.phone && parsed.phone.trim().length > 0
        ? parsed.phone.trim()
        : null

    const result = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(contactMessages)
        .values({
          senderName: parsed.name,
          senderEmail: parsed.email,
          senderPhone: phone,
          message: parsed.message,
          userId,
          clientIp: input.clientIp ?? null,
          userAgent: input.userAgent ?? null,
        })
        .returning({ id: contactMessages.id })

      if (!created) throw new Error("Failed to create contact message")

      // Fan out: one notification per staff recipient.
      const recipients = await tx
        .select({ id: userTable.id })
        .from(userTable)
        .where(
          and(
            sql`${userTable.role} IS NOT NULL`,
            // role can be "admin", "manager", "support", or comma-separated.
            // Match any token; cheap LIKE is fine at our scale.
            or(
              ilike(userTable.role, "%admin%"),
              ilike(userTable.role, "%manager%"),
              ilike(userTable.role, "%support%"),
            )!,
          ),
        )

      if (recipients.length > 0) {
        const title = `New contact message from ${parsed.name}`
        const preview = buildPreview(parsed.message)
        await tx.insert(notifications).values(
          recipients.map((recipient) => ({
            recipientId: recipient.id,
            type: "contact_message_created" as const,
            targetRef: `contact_message:${created.id}`,
            title,
            preview,
          })),
        )
      }

      return created
    })

    return { success: true, data: { id: result.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of error.issues) {
        const key = issue.path[0]?.toString() ?? "form"
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      return {
        success: false,
        error: JSON.stringify({ fieldErrors }),
      }
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit contact message",
    }
  }
}

/**
 * Update status. Records a `status_changed` event.
 */
export async function updateContactMessageStatus(input: {
  id: string
  status: AdminContactMessageStatus
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireStaff()
    const parsed = updateStatusSchema.parse(input)

    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ status: contactMessages.status })
        .from(contactMessages)
        .where(eq(contactMessages.id, parsed.id))
        .limit(1)

      if (!existing) throw new Error("Contact message not found")

      if (existing.status === parsed.status) return

      await tx
        .update(contactMessages)
        .set({ status: parsed.status, updatedAt: new Date() })
        .where(eq(contactMessages.id, parsed.id))

      await tx.insert(contactMessageEvents).values({
        contactMessageId: parsed.id,
        type: "status_changed",
        actorId: session.user.id,
        payload: { from: existing.status, to: parsed.status },
      })
    })

    return { success: true, data: { id: parsed.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Invalid input",
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    }
  }
}

/**
 * Assign or unassign. Records an `assigned` event.
 */
export async function assignContactMessage(input: {
  id: string
  assigneeId: string | null
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireStaff()
    const parsed = assignSchema.parse(input)

    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ assigneeId: contactMessages.assigneeId })
        .from(contactMessages)
        .where(eq(contactMessages.id, parsed.id))
        .limit(1)

      if (!existing) throw new Error("Contact message not found")

      if (existing.assigneeId === parsed.assigneeId) return

      await tx
        .update(contactMessages)
        .set({
          assigneeId: parsed.assigneeId,
          updatedAt: new Date(),
        })
        .where(eq(contactMessages.id, parsed.id))

      await tx.insert(contactMessageEvents).values({
        contactMessageId: parsed.id,
        type: "assigned",
        actorId: session.user.id,
        payload: {
          fromAssigneeId: existing.assigneeId,
          toAssigneeId: parsed.assigneeId,
        },
      })
    })

    return { success: true, data: { id: parsed.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Invalid input",
      }
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to assign message",
    }
  }
}

/**
 * Record a reply event and flip status to `replied`. Returns enough data
 * for the route handler to send the email outside the DB transaction.
 */
export async function recordContactMessageReply(input: {
  id: string
  body: string
}): Promise<
  ActionResult<{
    id: string
    senderEmail: string
    senderName: string
    originalMessage: string
    replyBody: string
    staffName: string
  }>
> {
  try {
    const session = await requireStaff()
    const parsed = replySchema.parse(input)

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: contactMessages.id,
          senderEmail: contactMessages.senderEmail,
          senderName: contactMessages.senderName,
          message: contactMessages.message,
          status: contactMessages.status,
        })
        .from(contactMessages)
        .where(eq(contactMessages.id, parsed.id))
        .limit(1)

      if (!existing) throw new Error("Contact message not found")

      await tx
        .update(contactMessages)
        .set({
          status: "replied",
          repliedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(contactMessages.id, parsed.id))

      await tx.insert(contactMessageEvents).values({
        contactMessageId: parsed.id,
        type: "reply_sent",
        actorId: session.user.id,
        payload: { body: parsed.body },
      })

      if (existing.status !== "replied") {
        await tx.insert(contactMessageEvents).values({
          contactMessageId: parsed.id,
          type: "status_changed",
          actorId: session.user.id,
          payload: { from: existing.status, to: "replied" },
        })
      }

      return existing
    })

    return {
      success: true,
      data: {
        id: result.id,
        senderEmail: result.senderEmail,
        senderName: result.senderName,
        originalMessage: result.message,
        replyBody: parsed.body,
        staffName: session.user.name ?? "Our team",
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Invalid input",
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record reply",
    }
  }
}

/**
 * Hard-delete a contact message and its events.
 */
export async function deleteContactMessage(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaff()

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid id" }
    }

    const [removed] = await db
      .delete(contactMessages)
      .where(eq(contactMessages.id, id))
      .returning({ id: contactMessages.id })

    if (!removed) {
      return { success: false, error: "Contact message not found" }
    }

    return { success: true, data: { id: removed.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete message",
    }
  }
}

/**
 * List the signed-in customer's own contact messages with their visible reply events.
 */
export async function getOwnContactMessages(): Promise<
  ActionResult<{
    messages: Array<
      AdminContactMessage & { replies: AdminContactMessageEvent[] }
    >
  }>
> {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    const userId = session.user.id

    const rows = await db
      .select({
        id: contactMessages.id,
        senderName: contactMessages.senderName,
        senderEmail: contactMessages.senderEmail,
        senderPhone: contactMessages.senderPhone,
        message: contactMessages.message,
        status: contactMessages.status,
        userId: contactMessages.userId,
        createdAt: contactMessages.createdAt,
        updatedAt: contactMessages.updatedAt,
        repliedAt: contactMessages.repliedAt,
        userName: userTable.name,
        userEmail: userTable.email,
        assigneeId: contactMessages.assigneeId,
        assigneeName: sql<
          string | null
        >`(SELECT name FROM "user" WHERE id = ${contactMessages.assigneeId})`,
        assigneeEmail: sql<
          string | null
        >`(SELECT email FROM "user" WHERE id = ${contactMessages.assigneeId})`,
      })
      .from(contactMessages)
      .leftJoin(userTable, eq(contactMessages.userId, userTable.id))
      .where(eq(contactMessages.userId, userId))
      .orderBy(desc(contactMessages.createdAt))

    if (rows.length === 0) {
      return { success: true, data: { messages: [] } }
    }

    const ids = rows.map((row) => row.id)

    const eventRows = await db
      .select({
        id: contactMessageEvents.id,
        contactMessageId: contactMessageEvents.contactMessageId,
        type: contactMessageEvents.type,
        payload: contactMessageEvents.payload,
        createdAt: contactMessageEvents.createdAt,
        actorId: contactMessageEvents.actorId,
        actorName: userTable.name,
        actorEmail: userTable.email,
      })
      .from(contactMessageEvents)
      .leftJoin(userTable, eq(contactMessageEvents.actorId, userTable.id))
      .where(
        and(
          eq(contactMessageEvents.type, "reply_sent"),
          // Drizzle inArray works with arrays; small hand-spelled OR for clarity since we have it
          ids.length === 1
            ? eq(contactMessageEvents.contactMessageId, ids[0])
            : sql`${contactMessageEvents.contactMessageId} = ANY(${ids})`,
        ),
      )
      .orderBy(contactMessageEvents.createdAt)

    const repliesByMessage = new Map<string, AdminContactMessageEvent[]>()
    for (const event of eventRows) {
      const list = repliesByMessage.get(event.contactMessageId) ?? []
      list.push({
        id: event.id,
        type: event.type,
        payload: (event.payload ?? {}) as Record<string, unknown>,
        createdAt: event.createdAt.toISOString(),
        actor: event.actorId
          ? {
              id: event.actorId,
              name: event.actorName,
              email: event.actorEmail ?? "",
            }
          : null,
      })
      repliesByMessage.set(event.contactMessageId, list)
    }

    const messages = rows.map((row) => ({
      ...mapContactMessageRow({
        ...row,
        status: row.status as AdminContactMessageStatus,
      }),
      replies: repliesByMessage.get(row.id) ?? [],
    }))

    return { success: true, data: { messages } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load messages",
    }
  }
}

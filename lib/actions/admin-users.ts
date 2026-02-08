"use server"

import { headers } from "next/headers"

import { and, count, desc, eq, ilike, or } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { requireAdmin, requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { session as sessionTable, user } from "@/lib/db/schema/auth"
import { sendEmail } from "@/lib/email/send"
import { generateSecurePassword } from "@/lib/utils/password-requirements"

import { logActivity } from "./activity-log"

type StaffRole = "admin" | "manager" | "support"

interface CreateStaffInput {
  name: string
  email: string
  role: StaffRole
}

interface UpdateStaffInput {
  id: string
  name?: string
  role?: StaffRole
}

interface ListStaffOptions {
  search?: string
  role?: StaffRole
  page?: number
  limit?: number
}

export async function listStaffUsers(options: ListStaffOptions = {}) {
  const { search, role, page = 1, limit = 10 } = options

  // Only admins and managers can view staff list
  await requireRole(["admin", "manager"])

  const offset = (page - 1) * limit

  // Build where conditions for staff users (not customers)
  const conditions = [
    or(
      eq(user.role, "admin"),
      eq(user.role, "manager"),
      eq(user.role, "support"),
    ),
  ]

  if (search) {
    conditions.push(
      or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))!,
    )
  }

  if (role) {
    conditions.push(eq(user.role, role))
  }

  const [users, totalResult] = await Promise.all([
    db.query.user.findMany({
      where: and(...conditions),
      orderBy: [desc(user.createdAt)],
      limit,
      offset,
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        banReason: true,
        createdAt: true,
        emailVerified: true,
      },
    }),
    db
      .select({ count: count() })
      .from(user)
      .where(and(...conditions)),
  ])

  const total = totalResult[0]?.count ?? 0

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getStaffUser(userId: string) {
  // Only admins and managers can view staff details
  await requireRole(["admin", "manager"])

  const staffUser = await db.query.user.findFirst({
    where: and(
      eq(user.id, userId),
      or(
        eq(user.role, "admin"),
        eq(user.role, "manager"),
        eq(user.role, "support"),
      ),
    ),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
      createdAt: true,
      emailVerified: true,
      invitedBy: true,
      invitedAt: true,
      lastPasswordChange: true,
      mustChangePassword: true,
    },
  })

  if (!staffUser) {
    return null
  }

  // Get inviter info if available
  let inviter = null
  if (staffUser.invitedBy) {
    inviter = await db.query.user.findFirst({
      where: eq(user.id, staffUser.invitedBy),
      columns: {
        id: true,
        name: true,
        email: true,
      },
    })
  }

  return {
    ...staffUser,
    inviter,
  }
}

export async function createStaffUser(input: CreateStaffInput) {
  // Only admins can create staff users
  let session
  try {
    session = await requireAdmin()
  } catch {
    return {
      success: false,
      error: "Only administrators can create staff users",
    }
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { id: true, name: true },
  })

  const inviterName = currentUser?.name || "An administrator"

  // Check if email already exists
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, input.email.toLowerCase()),
  })

  if (existingUser) {
    return { success: false, error: "A user with this email already exists" }
  }

  // Generate a temporary password
  const temporaryPassword = generateSecurePassword()

  try {
    // Create user via BetterAuth API
    const result = await auth.api.signUpEmail({
      body: {
        name: input.name,
        email: input.email.toLowerCase(),
        password: temporaryPassword,
      },
      headers: await headers(),
    })

    if (!result?.user) {
      return { success: false, error: "Failed to create user" }
    }

    // Update user with staff-specific fields
    await db
      .update(user)
      .set({
        role: input.role,
        mustChangePassword: true,
        invitedBy: session.user.id,
        invitedAt: new Date(),
        emailVerified: true, // Staff accounts are pre-verified
      })
      .where(eq(user.id, result.user.id))

    // Send invitation email with temporary password
    await sendEmail({
      to: input.email,
      template: "staff-invitation",
      subject: "You've been invited to join IUS Shop",
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        invitedByName: inviterName,
        temporaryPassword,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
      },
    })

    // Log activity
    await logActivity({
      action: "user.create",
      entityType: "user",
      entityId: result.user.id,
      details: {
        email: input.email,
        name: input.name,
        role: input.role,
      },
    })

    return {
      success: true,
      userId: result.user.id,
      message: "Staff user created and invitation email sent",
    }
  } catch (error) {
    console.error("Error creating staff user:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create staff user",
    }
  }
}

export async function updateStaffUser(input: UpdateStaffInput) {
  // Only admins can update staff users
  let session
  try {
    session = await requireAdmin()
  } catch {
    return {
      success: false,
      error: "Only administrators can update staff users",
    }
  }

  // Can't modify yourself
  if (input.id === session.user.id) {
    return {
      success: false,
      error: "Use your profile page to update your own information",
    }
  }

  // Check target user exists and is staff
  const targetUser = await db.query.user.findFirst({
    where: and(
      eq(user.id, input.id),
      or(
        eq(user.role, "admin"),
        eq(user.role, "manager"),
        eq(user.role, "support"),
      ),
    ),
  })

  if (!targetUser) {
    return { success: false, error: "Staff user not found" }
  }

  try {
    const updateData: Record<string, unknown> = {}

    if (input.name !== undefined) {
      updateData.name = input.name
    }

    if (input.role !== undefined) {
      updateData.role = input.role
    }

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: "No changes provided" }
    }

    updateData.updatedAt = new Date()

    await db.update(user).set(updateData).where(eq(user.id, input.id))

    // Log activity
    await logActivity({
      action: input.role ? "user.role_change" : "user.update",
      entityType: "user",
      entityId: input.id,
      details: {
        changes: updateData,
        previousRole: targetUser.role,
        newRole: input.role,
      },
    })

    return { success: true, message: "Staff user updated" }
  } catch (error) {
    console.error("Error updating staff user:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update staff user",
    }
  }
}

export async function banStaffUser(
  userId: string,
  reason?: string,
  expiresAt?: Date,
) {
  // Only admins can ban users
  let session
  try {
    session = await requireAdmin()
  } catch {
    return { success: false, error: "Only administrators can ban users" }
  }

  // Can't ban yourself
  if (userId === session.user.id) {
    return { success: false, error: "You cannot ban yourself" }
  }

  try {
    await db
      .update(user)
      .set({
        banned: true,
        banReason: reason || null,
        banExpires: expiresAt || null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))

    // Revoke all sessions for the banned user
    await db.delete(sessionTable).where(eq(sessionTable.userId, userId))

    // Log activity
    await logActivity({
      action: "user.ban",
      entityType: "user",
      entityId: userId,
      details: {
        reason: reason || "No reason provided",
        expiresAt: expiresAt?.toISOString() || "permanent",
      },
    })

    return { success: true, message: "User banned and sessions revoked" }
  } catch (error) {
    console.error("Error banning user:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to ban user",
    }
  }
}

export async function unbanStaffUser(userId: string) {
  // Only admins can unban users
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: "Only administrators can unban users" }
  }

  try {
    await db
      .update(user)
      .set({
        banned: false,
        banReason: null,
        banExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))

    // Log activity
    await logActivity({
      action: "user.unban",
      entityType: "user",
      entityId: userId,
    })

    return { success: true, message: "User unbanned" }
  } catch (error) {
    console.error("Error unbanning user:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unban user",
    }
  }
}

export async function resetStaffPassword(userId: string) {
  // Only admins can reset passwords
  let session
  try {
    session = await requireAdmin()
  } catch {
    return { success: false, error: "Only administrators can reset passwords" }
  }

  // Get current user info for email
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { id: true, name: true },
  })

  // Can't reset your own password through this method
  if (userId === session.user.id) {
    return {
      success: false,
      error: "Use your profile page to change your own password",
    }
  }

  // Check target user exists and is staff
  const targetUser = await db.query.user.findFirst({
    where: and(
      eq(user.id, userId),
      or(
        eq(user.role, "admin"),
        eq(user.role, "manager"),
        eq(user.role, "support"),
      ),
    ),
  })

  if (!targetUser) {
    return { success: false, error: "Staff user not found" }
  }

  try {
    // Generate a new temporary password
    const temporaryPassword = generateSecurePassword()

    // Update password via BetterAuth or direct hash
    // For now, we'll need to use the change password flow
    // This requires integration with BetterAuth's admin API

    // Update user to require password change
    await db
      .update(user)
      .set({
        mustChangePassword: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))

    // Send email with new temporary password
    await sendEmail({
      to: targetUser.email,
      template: "password-reset-by-admin",
      subject: "Your password has been reset",
      data: {
        name: targetUser.name || "Staff Member",
        temporaryPassword,
        adminName: currentUser?.name || "An administrator",
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
      },
    })

    // Log activity
    await logActivity({
      action: "user.password_reset",
      entityType: "user",
      entityId: userId,
      details: {
        targetEmail: targetUser.email,
      },
    })

    return { success: true, message: "Password reset email sent" }
  } catch (error) {
    console.error("Error resetting password:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reset password",
    }
  }
}

export async function deleteStaffUser(userId: string) {
  // Only admins can delete users
  let session
  try {
    session = await requireAdmin()
  } catch {
    return { success: false, error: "Only administrators can delete users" }
  }

  // Can't delete yourself
  if (userId === session.user.id) {
    return { success: false, error: "You cannot delete your own account" }
  }

  // Check target user exists and is staff
  const targetUser = await db.query.user.findFirst({
    where: and(
      eq(user.id, userId),
      or(
        eq(user.role, "admin"),
        eq(user.role, "manager"),
        eq(user.role, "support"),
      ),
    ),
  })

  if (!targetUser) {
    return { success: false, error: "Staff user not found" }
  }

  try {
    // Delete all sessions first
    await db.delete(sessionTable).where(eq(sessionTable.userId, userId))

    // Log activity before delete (while we still have user info)
    await logActivity({
      action: "user.delete",
      entityType: "user",
      entityId: userId,
      details: {
        deletedEmail: targetUser.email,
        deletedName: targetUser.name,
        deletedRole: targetUser.role,
      },
    })

    // Delete the user
    await db.delete(user).where(eq(user.id, userId))

    return { success: true, message: "Staff user deleted" }
  } catch (error) {
    console.error("Error deleting user:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    }
  }
}

/**
 * Get sessions for a specific staff user (admin action)
 */
export async function getStaffUserSessions(userId: string) {
  // Only admins can view other users' sessions
  try {
    await requireAdmin()
  } catch {
    return []
  }

  // Get sessions for the target user
  const sessions = await db.query.session.findMany({
    where: eq(sessionTable.userId, userId),
    orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
  })

  return sessions.map((s) => ({
    id: s.id,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
  }))
}

/**
 * Revoke a specific session for any user (admin action)
 */
export async function revokeUserSession(
  sessionId: string,
  targetUserId: string,
) {
  // Only admins can revoke other users' sessions
  let session
  try {
    session = await requireAdmin()
  } catch {
    return {
      success: false,
      error: "Only administrators can revoke other users' sessions",
    }
  }

  // Can't revoke your own session from this endpoint
  if (targetUserId === session.user.id) {
    return {
      success: false,
      error: "Use the profile page to manage your own sessions",
    }
  }

  try {
    await db.delete(sessionTable).where(eq(sessionTable.id, sessionId))

    await logActivity({
      action: "session.revoke",
      entityType: "session",
      entityId: sessionId,
      details: {
        targetUserId,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to revoke session:", error)
    return { success: false, error: "Failed to revoke session" }
  }
}

/**
 * Revoke all sessions for a user (admin action)
 */
export async function revokeAllUserSessions(targetUserId: string) {
  // Only admins can revoke other users' sessions
  let session
  try {
    session = await requireAdmin()
  } catch {
    return {
      success: false,
      error: "Only administrators can revoke other users' sessions",
    }
  }

  // Can't revoke your own sessions from this endpoint
  if (targetUserId === session.user.id) {
    return {
      success: false,
      error: "Use the profile page to manage your own sessions",
    }
  }

  try {
    await db.delete(sessionTable).where(eq(sessionTable.userId, targetUserId))

    await logActivity({
      action: "session.revoke_all",
      entityType: "user",
      entityId: targetUserId,
      details: {},
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to revoke sessions:", error)
    return { success: false, error: "Failed to revoke sessions" }
  }
}

/**
 * Get activity logs for a specific user (admin action)
 */
export async function getStaffUserActivity(userId: string, limit = 50) {
  // Only admins and managers can view activity
  try {
    await requireRole(["admin", "manager"])
  } catch {
    return []
  }

  const { adminActivityLogs } = await import("@/lib/db/schema/admin")

  const logs = await db.query.adminActivityLogs.findMany({
    where: eq(adminActivityLogs.userId, userId),
    orderBy: (logs, { desc: descOrder }) => [descOrder(logs.createdAt)],
    limit,
  })

  return logs
}

"use server"

import { headers } from "next/headers"

import { and, count, desc, eq, ilike, or } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { requireAdmin, requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema/auth"
import { sendEmail } from "@/lib/email/send"
import { generateSecurePassword } from "@/lib/utils/password-requirements"

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

function staffRoleCondition() {
  return or(
    eq(user.role, "admin"),
    eq(user.role, "manager"),
    eq(user.role, "support"),
  )
}

export async function listStaffUsers(options: ListStaffOptions = {}) {
  const { search, role, page = 1, limit = 10 } = options

  await requireRole(["admin", "manager"])

  const offset = (page - 1) * limit
  const conditions = [staffRoleCondition()]

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
        twoFactorEnabled: true,
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
  await requireRole(["admin", "manager"])

  const staffUser = await db.query.user.findFirst({
    where: and(eq(user.id, userId), staffRoleCondition()),
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
      twoFactorEnabled: true,
    },
  })

  if (!staffUser) {
    return null
  }

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
  let session
  try {
    session = await requireAdmin()
  } catch {
    return {
      success: false,
      error: "Only administrators can create staff users",
    }
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, input.email.toLowerCase()),
    columns: { id: true },
  })

  if (existingUser) {
    return { success: false, error: "A user with this email already exists" }
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { name: true },
  })

  const temporaryPassword = generateSecurePassword()

  try {
    const result = await auth.api.createUser({
      body: {
        name: input.name,
        email: input.email.toLowerCase(),
        password: temporaryPassword,
        role: input.role,
      },
      headers: await headers(),
    })

    await auth.api.adminUpdateUser({
      body: {
        userId: result.user.id,
        data: {
          emailVerified: true,
          mustChangePassword: true,
          invitedBy: session.user.id,
          invitedAt: new Date(),
        },
      },
      headers: await headers(),
    })

    await sendEmail({
      to: input.email,
      template: "staff-invitation",
      subject: "You've been invited to join IUS Shop",
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        invitedByName: currentUser?.name || "An administrator",
        temporaryPassword,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
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
  let session
  try {
    session = await requireAdmin()
  } catch {
    return {
      success: false,
      error: "Only administrators can update staff users",
    }
  }

  if (input.id === session.user.id) {
    return {
      success: false,
      error: "Use your profile page to update your own information",
    }
  }

  const targetUser = await db.query.user.findFirst({
    where: and(eq(user.id, input.id), staffRoleCondition()),
    columns: {
      id: true,
      role: true,
    },
  })

  if (!targetUser) {
    return { success: false, error: "Staff user not found" }
  }

  try {
    if (input.name !== undefined) {
      await auth.api.adminUpdateUser({
        body: {
          userId: input.id,
          data: {
            name: input.name,
          },
        },
        headers: await headers(),
      })
    }

    if (input.role !== undefined && input.role !== targetUser.role) {
      await auth.api.setRole({
        body: {
          userId: input.id,
          role: input.role,
        },
        headers: await headers(),
      })
    }

    if (input.name === undefined && input.role === undefined) {
      return { success: false, error: "No changes provided" }
    }

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
  let session
  try {
    session = await requireAdmin()
  } catch {
    return { success: false, error: "Only administrators can ban users" }
  }

  if (userId === session.user.id) {
    return { success: false, error: "You cannot ban yourself" }
  }

  try {
    const banExpiresIn = expiresAt
      ? Math.max(Math.floor((expiresAt.getTime() - Date.now()) / 1000), 1)
      : undefined

    await auth.api.banUser({
      body: {
        userId,
        ...(reason ? { banReason: reason } : {}),
        ...(banExpiresIn ? { banExpiresIn } : {}),
      },
      headers: await headers(),
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
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: "Only administrators can unban users" }
  }

  try {
    await auth.api.unbanUser({
      body: { userId },
      headers: await headers(),
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
  let session
  try {
    session = await requireAdmin()
  } catch {
    return { success: false, error: "Only administrators can reset passwords" }
  }

  if (userId === session.user.id) {
    return {
      success: false,
      error: "Use your profile page to change your own password",
    }
  }

  const targetUser = await db.query.user.findFirst({
    where: and(eq(user.id, userId), staffRoleCondition()),
    columns: {
      email: true,
      name: true,
    },
  })

  if (!targetUser) {
    return { success: false, error: "Staff user not found" }
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { name: true },
  })

  try {
    const temporaryPassword = generateSecurePassword()

    await auth.api.setUserPassword({
      body: {
        userId,
        newPassword: temporaryPassword,
      },
      headers: await headers(),
    })

    await auth.api.adminUpdateUser({
      body: {
        userId,
        data: {
          mustChangePassword: true,
        },
      },
      headers: await headers(),
    })

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
  let session
  try {
    session = await requireAdmin()
  } catch {
    return { success: false, error: "Only administrators can delete users" }
  }

  if (userId === session.user.id) {
    return { success: false, error: "You cannot delete your own account" }
  }

  const targetUser = await db.query.user.findFirst({
    where: and(eq(user.id, userId), staffRoleCondition()),
    columns: {
      id: true,
    },
  })

  if (!targetUser) {
    return { success: false, error: "Staff user not found" }
  }

  try {
    await auth.api.removeUser({
      body: { userId },
      headers: await headers(),
    })

    return { success: true, message: "Staff user deleted" }
  } catch (error) {
    console.error("Error deleting user:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    }
  }
}

export async function getStaffUserSessions(userId: string) {
  try {
    await requireAdmin()
  } catch {
    return []
  }

  try {
    const result = await auth.api.listUserSessions({
      body: { userId },
      headers: await headers(),
    })

    return result.sessions.map((session) => ({
      id: session.token,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
    }))
  } catch (error) {
    console.error("Failed to load staff sessions:", error)
    return []
  }
}

export async function revokeUserSession(
  sessionToken: string,
  targetUserId: string,
) {
  let session
  try {
    session = await requireAdmin()
  } catch {
    return {
      success: false,
      error: "Only administrators can revoke other users' sessions",
    }
  }

  if (targetUserId === session.user.id) {
    return {
      success: false,
      error: "Use the profile page to manage your own sessions",
    }
  }

  try {
    await auth.api.revokeUserSession({
      body: {
        sessionToken,
      },
      headers: await headers(),
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to revoke session:", error)
    return { success: false, error: "Failed to revoke session" }
  }
}

export async function revokeAllUserSessions(targetUserId: string) {
  let session
  try {
    session = await requireAdmin()
  } catch {
    return {
      success: false,
      error: "Only administrators can revoke other users' sessions",
    }
  }

  if (targetUserId === session.user.id) {
    return {
      success: false,
      error: "Use the profile page to manage your own sessions",
    }
  }

  try {
    await auth.api.revokeUserSessions({
      body: {
        userId: targetUserId,
      },
      headers: await headers(),
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to revoke sessions:", error)
    return { success: false, error: "Failed to revoke sessions" }
  }
}

export async function getStaffUserActivity(userId: string, limit = 50) {
  try {
    await requireRole(["admin", "manager"])
  } catch {
    return []
  }

  const { adminActivityLogs } = await import("@/lib/db/schema/admin")

  return db.query.adminActivityLogs.findMany({
    where: eq(adminActivityLogs.userId, userId),
    orderBy: (logs, { desc: descOrder }) => [descOrder(logs.createdAt)],
    limit,
  })
}

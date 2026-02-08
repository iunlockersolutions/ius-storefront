"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { requireStaff } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { roles, user, userRoles } from "@/lib/db/schema"
import { sendEmail } from "@/lib/email/send"

/**
 * Get current staff user's profile with roles
 */
export async function getStaffProfile() {
  const session = await requireStaff()

  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  })

  if (!userData) {
    throw new Error("User not found")
  }

  // Get user roles
  const userRolesData = await db
    .select({
      roleName: roles.name,
      roleDescription: roles.description,
      assignedAt: userRoles.assignedAt,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, session.user.id))

  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    image: userData.image,
    emailVerified: userData.emailVerified,
    createdAt: userData.createdAt,
    updatedAt: userData.updatedAt,
    role: userData.role,
    lastPasswordChange: userData.lastPasswordChange,
    roles: userRolesData.map((r) => ({
      name: r.roleName,
      description: r.roleDescription,
      assignedAt: r.assignedAt,
    })),
  }
}

/**
 * Update staff profile
 */
export async function updateStaffProfile(data: { name: string }) {
  const session = await requireStaff()

  try {
    await db
      .update(user)
      .set({
        name: data.name,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))

    revalidatePath("/admin/profile")

    return { success: true }
  } catch (error) {
    console.error("Failed to update profile:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

/**
 * Change password for current user
 */
export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}) {
  const session = await requireStaff()

  try {
    // Use BetterAuth's change password API
    const result = await auth.api.changePassword({
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      headers: await headers(),
    })

    if (!result) {
      return { success: false, error: "Failed to change password" }
    }

    // Update last password change timestamp
    await db
      .update(user)
      .set({
        lastPasswordChange: new Date(),
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))

    // Send password changed notification
    const userData = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    })

    if (userData) {
      await sendEmail({
        to: userData.email,
        subject: "Your password has been changed",
        template: "password-changed",
        data: {
          name: userData.name,
        },
      })
    }

    revalidatePath("/admin/profile")

    return { success: true }
  } catch (error) {
    console.error("Failed to change password:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to change password",
    }
  }
}

/**
 * Get user sessions for current user
 */
export async function getUserSessions() {
  const session = await requireStaff()

  const sessions = await auth.api.listSessions({
    headers: await headers(),
  })

  return sessions.map((s) => ({
    id: s.id,
    token: s.token,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    isCurrent: s.token === session.session.token,
  }))
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionToken: string) {
  await requireStaff()

  try {
    await auth.api.revokeSession({
      body: {
        token: sessionToken,
      },
      headers: await headers(),
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to revoke session:", error)
    return { success: false, error: "Failed to revoke session" }
  }
}

/**
 * Revoke all sessions except current
 */
export async function revokeAllOtherSessions() {
  await requireStaff()

  try {
    await auth.api.revokeSessions({
      headers: await headers(),
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to revoke sessions:", error)
    return { success: false, error: "Failed to revoke sessions" }
  }
}

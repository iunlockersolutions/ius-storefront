"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { getPrimaryUserRole, normalizeUserRoles } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema/auth"

/**
 * Check the current user's role after login to determine redirect
 * Called after successful authentication to handle role-based routing
 */
export async function checkUserRoleAfterLogin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return { isStaff: false }
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: {
      id: true,
      role: true,
      mustChangePassword: true,
      banned: true,
      banReason: true,
    },
  })

  if (!currentUser) {
    return { isStaff: false }
  }

  const roles = normalizeUserRoles(currentUser.role)
  const isStaff = roles.some((role) => role !== "customer")
  const primaryRole = getPrimaryUserRole(currentUser.role)

  return {
    isStaff,
    role: primaryRole,
    roles,
    mustChangePassword: currentUser.mustChangePassword,
    banned: currentUser.banned,
    banReason: currentUser.banReason,
  }
}

/**
 * Server Action to handle post-login redirect based on user role.
 * This uses Next.js redirect() which works properly in Server Actions.
 *
 * @param callbackUrl - The URL to redirect customers to (default: "/")
 * @returns Object with error/banned info if redirect is blocked, otherwise redirects
 */
export async function handlePostLoginRedirect(callbackUrl: string = "/") {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/auth/login")
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: {
      id: true,
      role: true,
      mustChangePassword: true,
      banned: true,
      banReason: true,
    },
  })

  if (!currentUser) {
    redirect("/auth/login")
  }

  const roles = normalizeUserRoles(currentUser.role)
  const isStaff = roles.some((role) => role !== "customer")

  if (isStaff) {
    // Staff member - check for banned
    if (currentUser.banned) {
      // Return error info - client will handle sign out and display
      return {
        error: "banned",
        banReason: currentUser.banReason,
      }
    }

    // Check must change password
    if (currentUser.mustChangePassword) {
      redirect("/ops/change-password")
    }

    // Staff goes to admin
    redirect("/ops")
  } else {
    // Regular customer - go to their destination
    redirect(callbackUrl)
  }
}

/**
 * First-time password change for staff users
 */
export async function changeFirstTimePassword(
  currentPassword: string,
  newPassword: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  // Verify the user has mustChangePassword flag
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  })

  if (!currentUser) {
    return { success: false, error: "User not found" }
  }

  if (!currentUser.mustChangePassword) {
    return { success: false, error: "Password change not required" }
  }

  try {
    // Use BetterAuth's changePassword API
    const result = await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
      },
      headers: await headers(),
    })

    if (!result) {
      return { success: false, error: "Failed to change password" }
    }

    // Update mustChangePassword flag and lastPasswordChange
    await db
      .update(user)
      .set({
        mustChangePassword: false,
        lastPasswordChange: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))

    return { success: true }
  } catch (error) {
    console.error("Error changing password:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to change password",
    }
  }
}

/**
 * Legacy no-op retained so existing sign-out UI does not need a separate refactor.
 */
export async function clearAuthCookies() {
  return
}

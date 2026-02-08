"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { getUserRoles, type UserRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema/auth"

/**
 * Check if a user should be treated as a staff user (has staff role)
 */
export async function checkStaffLogin(email: string) {
  const staffUser = await db.query.user.findFirst({
    where: eq(user.email, email.toLowerCase()),
    columns: {
      id: true,
      mustChangePassword: true,
      banned: true,
      banReason: true,
    },
  })

  if (!staffUser) {
    return { isStaff: false }
  }

  // Check roles via RBAC system
  const roles = await getUserRoles(staffUser.id)
  const isStaff = roles.some((role) =>
    ["admin", "manager", "support"].includes(role),
  )

  return {
    isStaff,
    mustChangePassword: staffUser.mustChangePassword,
    banned: staffUser.banned,
    banReason: staffUser.banReason,
  }
}

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
      mustChangePassword: true,
      banned: true,
      banReason: true,
    },
  })

  if (!currentUser) {
    return { isStaff: false }
  }

  // Check roles via RBAC system (uses userRoles junction table)
  const roles = await getUserRoles(currentUser.id)
  const isStaff = roles.some((role) =>
    ["admin", "manager", "support"].includes(role),
  )

  // Get the highest priority role for display purposes
  let primaryRole: UserRole = "customer"
  if (roles.includes("admin")) primaryRole = "admin"
  else if (roles.includes("manager")) primaryRole = "manager"
  else if (roles.includes("support")) primaryRole = "support"

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
      mustChangePassword: true,
      banned: true,
      banReason: true,
    },
  })

  if (!currentUser) {
    redirect("/auth/login")
  }

  // Check roles via RBAC system
  const roles = await getUserRoles(currentUser.id)
  const isStaff = roles.some((role) =>
    ["admin", "manager", "support"].includes(role),
  )

  // Set is-staff cookie for middleware route masking
  await setIsStaffCookie(isStaff)

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
      await setMustChangePasswordCookie(true)
      redirect("/admin/change-password")
    }

    // Staff goes to admin
    redirect("/admin")
  } else {
    // Regular customer - go to their destination
    redirect(callbackUrl)
  }
}

/**
 * Set the must-change-password cookie after successful staff login
 */
export async function setMustChangePasswordCookie(mustChange: boolean) {
  const cookieStore = await cookies()

  if (mustChange) {
    cookieStore.set("must-change-password", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    })
  } else {
    cookieStore.delete("must-change-password")
  }
}

/**
 * Clear the must-change-password cookie (after password change)
 */
export async function clearMustChangePasswordCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("must-change-password")
}

/**
 * Set the is-staff cookie to indicate user has staff role.
 * This is used by middleware to mask admin routes from non-staff users.
 */
export async function setIsStaffCookie(isStaffUser: boolean) {
  const cookieStore = await cookies()

  if (isStaffUser) {
    cookieStore.set("is-staff", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Cookie expires with session (no maxAge = session cookie)
    })
  } else {
    cookieStore.delete("is-staff")
  }
}

/**
 * Clear the is-staff cookie (on logout or role change)
 */
export async function clearIsStaffCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("is-staff")
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

    // Clear the cookie
    await clearMustChangePasswordCookie()

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
 * Clear all auth-related cookies on sign out.
 * Call this server action before signOut() to clean up custom cookies.
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete("is-staff")
  cookieStore.delete("must-change-password")
}

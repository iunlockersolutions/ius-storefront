import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"

/**
 * Admin Access Verification Page
 *
 * This page handles the case where a user has a valid session but the
 * is-staff cookie hasn't been set or propagated yet.
 *
 * Flow:
 * 1. Middleware detects session exists but no is-staff cookie
 * 2. Redirects here with ?redirect=/intended/path
 * 3. This page verifies the session server-side
 * 4. Sets appropriate cookies
 * 5. Redirects to intended path (if staff) or shows 404 (if not)
 *
 * This solves cookie propagation issues in production (Vercel).
 */
export default async function VerifyAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect: redirectPath } = await searchParams
  const targetPath = redirectPath || "/admin"

  // Get session server-side
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // No session - show 404 to mask admin routes
  if (!session?.user) {
    redirect("/404")
  }

  // Check if user is staff
  const userIsStaff = await isStaff(session.user.id)

  if (!userIsStaff) {
    // Not staff - show 404 to mask admin routes
    redirect("/404")
  }

  // User is staff - set the is-staff cookie
  const cookieStore = await cookies()
  cookieStore.set("is-staff", "true", {
    httpOnly: true,
    secure: true, // Always secure in production
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days - matches session duration
  })

  // Check for must-change-password requirement
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: {
      mustChangePassword: true,
    },
  })

  if (currentUser?.mustChangePassword) {
    cookieStore.set("must-change-password", "true", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    })
    redirect("/admin/change-password")
  }

  // Redirect to intended path
  redirect(targetPath)
}

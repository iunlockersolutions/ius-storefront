import { redirect } from "next/navigation"

import { hasRole, requireRole } from "@/lib/auth/rbac"

export async function requireAdminAccessOrRedirect() {
  try {
    return await requireRole("admin")
  } catch {
    redirect("/ops")
  }
}

export async function requireAdminOrManagerAccessOrRedirect() {
  try {
    const session = await requireRole(["admin", "manager"])
    const canEdit = await hasRole(session.user.id, "admin")

    return {
      session,
      canEdit,
    }
  } catch {
    redirect("/ops")
  }
}

export async function requireAuthenticatedAdminUserOrRedirect() {
  try {
    return await requireRole(["admin", "manager", "support"])
  } catch {
    redirect("/ops/login")
  }
}

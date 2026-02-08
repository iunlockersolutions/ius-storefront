import { redirect } from "next/navigation"

import { AdminHeader } from "@/components/admin/header"
import { AdminSidebar } from "@/components/admin/sidebar"
import { getServerSession, isStaff } from "@/lib/auth/rbac"

/**
 * Admin Layout
 *
 * Protected layout for admin dashboard.
 * Requires authentication and staff role.
 *
 * Note: Route masking (404 for unauthorized) is handled in middleware.
 * This layout provides a secondary check for security in depth.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  // Redirect to login if not authenticated
  // Note: Middleware should catch this first and mask the route
  if (!session?.user) {
    redirect("/auth/login")
  }

  // Check if user is staff (admin, manager, or support)
  // Note: Middleware should catch this first and show 404
  const staff = await isStaff(session.user.id)
  if (!staff) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <AdminHeader user={session.user} />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6 dark:bg-neutral-900">
          {children}
        </main>
      </div>
    </div>
  )
}

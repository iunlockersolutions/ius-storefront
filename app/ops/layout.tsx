import { notFound } from "next/navigation"

import { eq } from "drizzle-orm"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getServerSession, normalizeUserRoles } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema/auth"

import AppHeader from "./_components/app-header"
import AppSidebar from "./_components/app-sidebar"
import OpsRouteGuard from "./_components/ops-route-guard"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session?.user) {
    notFound()
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: {
      role: true,
      banned: true,
      mustChangePassword: true,
    },
  })

  const isStaffUser = normalizeUserRoles(
    currentUser?.role ?? session.user.role,
  ).some((role) => role !== "customer")

  if (!currentUser || !isStaffUser || Boolean(currentUser.banned)) {
    notFound()
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="max-h-svh min-h-svh overflow-hidden bg-white">
        <OpsRouteGuard
          mustChangePassword={Boolean(currentUser.mustChangePassword)}
        >
          <AppHeader
            user={{
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
              image: session.user.image,
            }}
          />
          <div className="flex-1 overflow-y-auto overscroll-none bg-white">
            <div className="mx-auto min-h-full w-full px-4 py-6 lg:px-6">
              {children}
            </div>
          </div>
        </OpsRouteGuard>
      </SidebarInset>
    </SidebarProvider>
  )
}

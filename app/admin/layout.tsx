import { redirect } from "next/navigation"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getServerSession, isStaff } from "@/lib/auth/rbac"

import AppHeader from "./_components/app-header"
import AppSidebar from "./_components/app-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/login")
  }

  const staff = await isStaff(session.user.id)
  if (!staff) {
    redirect("/")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6 dark:bg-neutral-900">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

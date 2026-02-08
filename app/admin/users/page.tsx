import { Suspense } from "react"
import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { Loader2 } from "lucide-react"

import { StaffUsersTable } from "@/components/admin/users/staff-users-table"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Staff Users | Admin",
  description: "Manage staff user accounts and permissions",
}

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/admin/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Users</h1>
        <p className="text-muted-foreground">
          Manage staff accounts, roles, and permissions
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <StaffUsersTable currentUserId={session.user.id} />
      </Suspense>
    </div>
  )
}

import { notFound } from "next/navigation"

import { eq } from "drizzle-orm"

import { OpsThemeProvider } from "@/components/ops-theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { getServerSession, normalizeUserRoles } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema/auth"

import OpsShell from "./_components/ops-shell"

export const dynamic = "force-dynamic"

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
    <OpsThemeProvider>
      <OpsShell
        mustChangePassword={Boolean(currentUser.mustChangePassword)}
        user={{
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        }}
      >
        {children}
      </OpsShell>
      <Toaster />
    </OpsThemeProvider>
  )
}

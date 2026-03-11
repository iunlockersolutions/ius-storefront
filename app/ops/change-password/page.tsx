import { redirect } from "next/navigation"

import { eq } from "drizzle-orm"

import { FirstTimePasswordChange } from "@/components/admin/auth/first-time-password-change"
import { getServerSession } from "@/lib/auth/rbac"
// eslint-disable-next-line no-restricted-imports
import { db } from "@/lib/db"
// eslint-disable-next-line no-restricted-imports
import { user } from "@/lib/db/schema/auth"

export const metadata = {
  title: "Change Password | Ops",
  description: "Set a new password before entering the operations area",
}

export default async function OpsChangePasswordPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/login")
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: {
      mustChangePassword: true,
    },
  })

  if (!currentUser?.mustChangePassword) {
    redirect("/ops")
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-6">
      <FirstTimePasswordChange
        userEmail={session.user.email}
        userName={session.user.name}
      />
    </div>
  )
}

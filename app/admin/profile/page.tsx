import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { ActiveSessions } from "@/components/admin/profile/active-sessions"
import { ProfileOverview } from "@/components/admin/profile/profile-overview"
import { SecurityPasskeys } from "@/components/admin/profile/security-passkeys"
import { SecurityPassword } from "@/components/admin/profile/security-password"
import { getStaffProfile } from "@/lib/actions/staff-profile"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Profile | Admin",
  description: "Manage your admin profile and security settings",
}

export default async function AdminProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/admin/login")
  }

  const profile = await getStaffProfile()

  if (!profile) {
    redirect("/admin/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and security settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Overview - Full width */}
        <div className="lg:col-span-2">
          <ProfileOverview
            user={{
              id: profile.id,
              name: profile.name || "",
              email: profile.email,
              image: profile.image,
              role: profile.role as "admin" | "manager" | "support",
              createdAt: new Date(profile.createdAt),
              lastPasswordChange: profile.lastPasswordChange
                ? new Date(profile.lastPasswordChange)
                : null,
            }}
          />
        </div>

        {/* Security - Password */}
        <SecurityPassword
          userInfo={{
            email: profile.email,
            name: profile.name || undefined,
          }}
        />

        {/* Security - Passkeys */}
        <SecurityPasskeys />

        {/* Active Sessions - Full width */}
        <div className="lg:col-span-2">
          <ActiveSessions />
        </div>
      </div>
    </div>
  )
}

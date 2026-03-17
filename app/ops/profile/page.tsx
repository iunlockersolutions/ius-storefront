import { Metadata } from "next"

import { ProfilePageClient } from "./_components/profile-page-client"

export const metadata: Metadata = {
  title: "Profile | Ops",
  description: "Manage your operations profile and security settings",
}

export default function AdminProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and security settings
        </p>
      </div>

      <ProfilePageClient />
    </div>
  )
}

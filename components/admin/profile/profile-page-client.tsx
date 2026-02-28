"use client"

import { ActiveSessions } from "@/components/admin/profile/active-sessions"
import { ProfileOverview } from "@/components/admin/profile/profile-overview"
import { SecurityPasskeys } from "@/components/admin/profile/security-passkeys"
import { SecurityPassword } from "@/components/admin/profile/security-password"
import {
  AdminQueryEmptyState,
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { useAdminProfileQuery } from "@/hooks/admin/use-admin-profile-query"

export function ProfilePageClient() {
  const profileQuery = useAdminProfileQuery()

  if (profileQuery.isLoading || profileQuery.isFetching) {
    return <AdminQueryLoadingState />
  }

  if (profileQuery.error) {
    return (
      <AdminQueryErrorState
        message={getQueryErrorMessage(
          profileQuery.error,
          "Failed to load profile",
        )}
        onRetry={profileQuery.refetch}
      />
    )
  }

  if (!profileQuery.data) {
    return <AdminQueryEmptyState message="Profile not found." />
  }

  const profile = profileQuery.data

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <ProfileOverview
          user={{
            id: profile.id,
            name: profile.name || "",
            email: profile.email,
            image: profile.image,
            role: profile.role,
            createdAt: profile.createdAt,
            lastPasswordChange: profile.lastPasswordChange,
          }}
        />
      </div>

      <SecurityPassword
        userInfo={{
          email: profile.email,
          name: profile.name || undefined,
        }}
      />

      <SecurityPasskeys />

      <div className="lg:col-span-2">
        <ActiveSessions />
      </div>
    </div>
  )
}

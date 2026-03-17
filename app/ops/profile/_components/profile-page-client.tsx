"use client"

import {
  AdminQueryEmptyState,
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { useAdminProfileQuery } from "@/services/queries/use-admin-profile-query"

import { ActiveSessions } from "./active-sessions"
import { ProfileOverview } from "./profile-overview"
import { SecurityPasskeys } from "./security-passkeys"
import { SecurityPassword } from "./security-password"
import { SecurityTwoFactor } from "./security-two-factor"

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

      <SecurityTwoFactor enabled={profile.twoFactorEnabled} />

      <SecurityPasskeys />

      <div className="lg:col-span-2">
        <ActiveSessions />
      </div>
    </div>
  )
}

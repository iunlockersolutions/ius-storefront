"use client"

import {
  AdminQueryErrorState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { getSettingCategories } from "@/lib/utils/settings-config"
import { useAdminSettingsQuery } from "@/services/queries/use-admin-settings-query"

import { SettingsForm } from "./settings-form"

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-6 space-y-4">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function SettingsPageClient() {
  const settingsQuery = useAdminSettingsQuery()
  const categories = getSettingCategories()

  if (settingsQuery.isLoading || settingsQuery.isFetching) {
    return <SettingsSkeleton />
  }

  if (settingsQuery.error) {
    return (
      <AdminQueryErrorState
        message={getQueryErrorMessage(
          settingsQuery.error,
          "Failed to load settings",
        )}
        onRetry={settingsQuery.refetch}
      />
    )
  }

  return (
    <SettingsForm settings={settingsQuery.data ?? {}} categories={categories} />
  )
}

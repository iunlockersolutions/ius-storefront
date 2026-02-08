import { Suspense } from "react"

import { SettingsForm } from "@/components/admin/settings/settings-form"
import { getSiteSettings } from "@/lib/actions/settings"
import { getSettingCategories } from "@/lib/utils/settings-config"

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

async function SettingsContent() {
  const settings = await getSiteSettings()
  const categories = getSettingCategories()

  return <SettingsForm settings={settings} categories={categories} />
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your store configuration and preferences
        </p>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  )
}

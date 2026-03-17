import { Suspense } from "react"

import { AdminQueryLoadingState } from "@/components/admin/query-state"

import { CategoriesPageClient } from "./_components/categories-page-client"

export const metadata = {
  title: "Categories | Operations",
  description: "Manage your product categories",
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-40 rounded bg-muted" />
            <div className="h-5 w-64 rounded bg-muted" />
          </div>
          <AdminQueryLoadingState skeletonClassName="h-96 w-full" />
        </div>
      }
    >
      <CategoriesPageClient />
    </Suspense>
  )
}

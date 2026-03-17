import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { getBrands } from "@/lib/actions/brand"
import { getCategoriesFlat } from "@/lib/actions/category"
import { getModels } from "@/lib/actions/model"

import { CatalogSetupPageClient } from "./_components/catalog-setup-page-client"

export const metadata = {
  title: "Catalog Setup | Operations",
  description: "Manage brands and models used throughout the catalog.",
}

interface CatalogSetupPageProps {
  searchParams?: Promise<{
    tab?: string
    create?: string
  }>
}

async function CatalogSetupPageContent({
  searchParams,
}: CatalogSetupPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const [categories, brands, models] = await Promise.all([
    getCategoriesFlat(),
    getBrands(),
    getModels({ includeInactive: true }),
  ])

  const topLevelCategories = categories
    .filter((category) => category.level === 0)
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }))

  return (
    <CatalogSetupPageClient
      categories={topLevelCategories}
      brands={brands}
      models={models}
      initialTab={resolvedSearchParams.tab === "models" ? "models" : "brands"}
      initialCreate={
        resolvedSearchParams.create === "brand" ||
        resolvedSearchParams.create === "model"
          ? resolvedSearchParams.create
          : null
      }
    />
  )
}

export default function CatalogSetupPage(props: CatalogSetupPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <CatalogSetupPageContent {...props} />
    </Suspense>
  )
}

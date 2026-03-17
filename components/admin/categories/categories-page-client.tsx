"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Plus } from "lucide-react"

import { CategoriesTable } from "@/components/admin/categories/categories-table"
import { CategoryCreateDialog } from "@/components/admin/categories/category-create-dialog"
import { Button } from "@/components/ui/button"
import { useAdminCategoriesQuery } from "@/services/queries/use-admin-categories-query"

export function CategoriesPageClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const categoriesQuery = useAdminCategoriesQuery()
  const isCreateDialogOpen = searchParams.get("create") === "1"

  const categories = (categoriesQuery.data ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    level: category.level || 0,
    path: category.path || category.name,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    productCount: category.productCount,
    optionTemplates: category.optionTemplates,
  }))

  const parentOptions = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    level: category.level,
    path: category.path,
  }))

  const updateCreateQueryState = (open: boolean) => {
    const params = new URLSearchParams(searchParams.toString())

    if (open) {
      params.set("create", "1")
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
      return
    }

    params.delete("create")
    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-neutral-500">Manage your product categories</p>
        </div>
        <Button onClick={() => updateCreateQueryState(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <CategoriesTable
        categories={categories}
        isLoading={categoriesQuery.isLoading || categoriesQuery.isFetching}
        errorMessage={
          categoriesQuery.error instanceof Error
            ? categoriesQuery.error.message
            : null
        }
        onRefetch={categoriesQuery.refetch}
      />

      <CategoryCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={updateCreateQueryState}
        categories={parentOptions}
        isLoading={categoriesQuery.isLoading}
        errorMessage={
          categoriesQuery.error instanceof Error
            ? categoriesQuery.error.message
            : null
        }
        onRetry={categoriesQuery.refetch}
      />
    </div>
  )
}

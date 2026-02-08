import { Suspense } from "react"
import Link from "next/link"

import { Plus } from "lucide-react"

import { CategoriesTable } from "@/components/admin/categories/categories-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCategoriesFlat } from "@/lib/actions/category"

export const metadata = {
  title: "Categories | Admin Dashboard",
  description: "Manage your product categories",
}

async function CategoriesData() {
  const categories = await getCategoriesFlat()

  // Transform to include level and path for the table
  const flatCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    level: 0,
    path: cat.name,
    isActive: cat.isActive,
    sortOrder: cat.sortOrder,
  }))

  return <CategoriesTable categories={flatCategories} />
}

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-neutral-500">Manage your product categories</p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <CategoriesData />
      </Suspense>
    </div>
  )
}

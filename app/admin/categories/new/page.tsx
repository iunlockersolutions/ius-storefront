import { Suspense } from "react"
import Link from "next/link"

import { ChevronLeft } from "lucide-react"

import { NewCategoryForm } from "@/components/admin/categories/new-category-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCategoriesFlat } from "@/lib/actions/category"

export const metadata = {
  title: "Add New Category | Admin Dashboard",
  description: "Add a new product category",
}

async function CategoryFormWrapper() {
  const categories = await getCategoriesFlat()

  // Transform to include level and path for the form
  const flatCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    level: 0,
    path: cat.name,
  }))

  return <NewCategoryForm categories={flatCategories} />
}

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/categories">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Category</h1>
          <p className="text-neutral-500">Create a new product category</p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="max-w-2xl space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <CategoryFormWrapper />
      </Suspense>
    </div>
  )
}

import { Suspense } from "react"
import Link from "next/link"

import { ChevronLeft } from "lucide-react"

import { NewProductForm } from "@/components/admin/products/new-product-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getActiveBrands } from "@/lib/actions/brand"
import { getCategoriesFlat } from "@/lib/actions/category"
import { getModels } from "@/lib/actions/model"

export const metadata = {
  title: "Add New Product | Operations",
  description: "Add a new product to your store",
}

async function ProductFormWrapper() {
  const [categories, brands, models] = await Promise.all([
    getCategoriesFlat(),
    getActiveBrands(),
    getModels({ includeInactive: true }),
  ])

  const flatCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parentId: cat.parentId,
    level: cat.level,
    path: cat.path,
  }))

  const activeBrands = brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
  }))

  return (
    <NewProductForm
      categories={flatCategories}
      brands={activeBrands}
      models={models.map((model) => ({
        id: model.id,
        name: model.name,
        slug: model.slug,
        primaryCategoryId: model.primaryCategoryId,
        brandId: model.brandId,
        isActive: model.isActive,
      }))}
    />
  )
}

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/products">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Product</h1>
          <p className="text-neutral-500">Create a new product in your store</p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="max-w-3xl mx-auto space-y-8">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <ProductFormWrapper />
      </Suspense>
    </div>
  )
}

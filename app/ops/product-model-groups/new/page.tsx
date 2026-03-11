import Link from "next/link"

import { ChevronLeft } from "lucide-react"

import { ProductModelGroupForm } from "@/components/admin/product-model-groups/product-model-group-form"
import { Button } from "@/components/ui/button"
import { getActiveBrands } from "@/lib/actions/brand"
import { getCategoriesFlat } from "@/lib/actions/category"

export const metadata = {
  title: "New Product Model Group | Operations",
  description: "Create a new product model group for the storefront menu.",
}

export default async function NewProductModelGroupPage() {
  const [categories, brands] = await Promise.all([
    getCategoriesFlat(),
    getActiveBrands(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/product-model-groups">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Product Model Group</h1>
          <p className="text-muted-foreground">
            Create a new model group used in the storefront Products menu.
          </p>
        </div>
      </div>

      <ProductModelGroupForm
        mode="create"
        categories={categories
          .filter((category) => category.level === 0)
          .map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
          }))}
        brands={brands.map((brand) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
        }))}
      />
    </div>
  )
}

import Link from "next/link"

import { ChevronLeft } from "lucide-react"

import { ProductModelGroupForm } from "@/components/admin/product-model-groups/product-model-group-form"
import { Button } from "@/components/ui/button"
import { getActiveBrands } from "@/lib/actions/brand"
import { getCategoriesFlat } from "@/lib/actions/category"

export const metadata = {
  title: "New Model | Operations",
  description: "Create a new brand model for the storefront catalog.",
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
          <Link href="/ops/models">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Model</h1>
          <p className="text-muted-foreground">
            Create a new model under a brand and top-level category.
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
          categoryAssignments: brand.categoryAssignments.map((assignment) => ({
            categoryId: assignment.categoryId,
          })),
        }))}
      />
    </div>
  )
}

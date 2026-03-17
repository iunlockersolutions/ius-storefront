import { getBrands } from "@/lib/actions/brand"
import { getCategoriesFlat } from "@/lib/actions/category"
import { getModels } from "@/lib/actions/model"

import { NewProductForm } from "../_components/new-product-form"

export const metadata = {
  title: "New Product | Ops Dashboard",
  description: "Create a new product draft in the ops dashboard.",
}

export default async function NewProductPage() {
  const [categories, brands, models] = await Promise.all([
    getCategoriesFlat(),
    getBrands(),
    getModels({ includeInactive: true }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Product</h1>
        <p className="text-muted-foreground">
          Build a draft product, define its variants, and configure inventory
          behavior before stock intake.
        </p>
      </div>

      <NewProductForm
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          parentId: category.parentId,
          level: category.level,
          path: category.path,
          optionTemplates: category.optionTemplates,
        }))}
        brands={brands.map((brand) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
        }))}
        models={models.map((model) => ({
          id: model.id,
          name: model.name,
          slug: model.slug,
          primaryCategoryId: model.primaryCategoryId,
          brandId: model.brandId,
          isActive: model.isActive,
        }))}
      />
    </div>
  )
}

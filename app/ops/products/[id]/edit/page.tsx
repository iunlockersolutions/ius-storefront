import { notFound } from "next/navigation"

import { getBrands } from "@/lib/actions/brand"
import { getCategoriesFlat } from "@/lib/actions/category"
import { getModels } from "@/lib/actions/model"
import { getProduct } from "@/lib/actions/product"

import { EditProductForm } from "../../_components/edit-product-form"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Edit Product | Ops Dashboard",
  description: "Update product catalog data in the ops dashboard.",
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params

  const [product, categories, brands, models] = await Promise.all([
    getProduct(id),
    getCategoriesFlat(),
    getBrands(),
    getModels({ includeInactive: true }),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">
          Update product information for &quot;{product.name}&quot;
        </p>
      </div>

      <EditProductForm
        product={product}
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
        media={(product.media ?? []).map((item) => ({
          ...item,
          variantAssignment: item.variantAssignment ?? {
            mode: "all",
            variantIds: [],
          },
        }))}
      />
    </div>
  )
}

import { notFound } from "next/navigation"

import { EditProductForm } from "@/components/admin/products/edit-product-form"
import { getActiveBrands } from "@/lib/actions/brand"
import { getCategoriesFlat } from "@/lib/actions/category"
import { getProduct } from "@/lib/actions/product"
import { getProductModelGroups } from "@/lib/actions/product-model-group"

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

  const [product, categories, brands, productModelGroups] = await Promise.all([
    getProduct(id),
    getCategoriesFlat(),
    getActiveBrands(),
    getProductModelGroups({ includeInactive: true }),
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
        }))}
        brands={brands.map((brand) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
        }))}
        productModelGroups={productModelGroups.map((group) => ({
          id: group.id,
          name: group.name,
          slug: group.slug,
          categoryId: group.categoryId,
          brandId: group.brandId,
          isActive: group.isActive,
        }))}
        images={product.images}
      />
    </div>
  )
}

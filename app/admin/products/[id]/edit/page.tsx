import { notFound } from "next/navigation"

import { EditProductForm } from "@/components/admin/products/edit-product-form"
import { getCategoriesFlat } from "@/lib/actions/category"
import { getProduct } from "@/lib/actions/product"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params

  const [product, categories] = await Promise.all([
    getProduct(id),
    getCategoriesFlat(),
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
        categories={categories}
        images={product.images}
      />
    </div>
  )
}

import Link from "next/link"
import { notFound } from "next/navigation"

import { ChevronLeft } from "lucide-react"

import { ProductModelGroupForm } from "@/components/admin/product-model-groups/product-model-group-form"
import { Button } from "@/components/ui/button"
import { getActiveBrands } from "@/lib/actions/brand"
import { getCategoriesFlat } from "@/lib/actions/category"
import { getProductModelGroup } from "@/lib/actions/product-model-group"

interface ProductModelGroupPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Edit Model | Operations",
  description: "Update model details.",
}

export default async function EditProductModelGroupPage({
  params,
}: ProductModelGroupPageProps) {
  const { id } = await params

  const [group, categories, brands] = await Promise.all([
    getProductModelGroup(id),
    getCategoriesFlat(),
    getActiveBrands(),
  ])

  if (!group) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/models">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Model</h1>
          <p className="text-muted-foreground">
            Update details for &quot;{group.name}&quot;.
          </p>
        </div>
      </div>

      <ProductModelGroupForm
        mode="edit"
        initialData={{
          id: group.id,
          name: group.name,
          slug: group.slug,
          description: group.description,
          primaryCategoryId: group.primaryCategoryId,
          brandId: group.brandId,
          showInProductMenu: group.showInProductMenu,
          navPriority: group.navPriority,
          isActive: group.isActive,
        }}
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

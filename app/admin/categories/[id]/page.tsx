import Link from "next/link"
import { notFound } from "next/navigation"

import { ChevronLeft } from "lucide-react"

import { EditCategoryForm } from "@/components/admin/categories/edit-category-form"
import { Button } from "@/components/ui/button"
import { getCategoriesFlat, getCategory } from "@/lib/actions/category"

interface EditCategoryPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditCategoryPageProps) {
  const { id } = await params
  const category = await getCategory(id)

  if (!category) {
    return { title: "Category Not Found" }
  }

  return {
    title: `Edit ${category.name} | Admin Dashboard`,
    description: `Edit category: ${category.name}`,
  }
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params

  const [category, allCategories] = await Promise.all([
    getCategory(id),
    getCategoriesFlat(),
  ])

  if (!category) {
    notFound()
  }

  // Filter out current category and its children from parent options
  const parentOptions = allCategories
    .filter((cat) => cat.id !== id)
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      level: 0,
      path: cat.name,
    }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/categories">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Category</h1>
          <p className="text-muted-foreground">
            Update &quot;{category.name}&quot;
          </p>
        </div>
      </div>

      <EditCategoryForm category={category} parentOptions={parentOptions} />
    </div>
  )
}

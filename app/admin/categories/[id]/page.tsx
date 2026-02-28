import Link from "next/link"

import { ChevronLeft } from "lucide-react"

import { EditCategoryPageClient } from "@/components/admin/categories/edit-category-page-client"
import { Button } from "@/components/ui/button"

interface EditCategoryPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Edit Category | Admin Dashboard",
  description: "Edit category details",
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params

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
          <p className="text-muted-foreground">Update category details</p>
        </div>
      </div>

      <EditCategoryPageClient categoryId={id} />
    </div>
  )
}

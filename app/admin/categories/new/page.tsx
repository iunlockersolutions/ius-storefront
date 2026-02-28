import Link from "next/link"

import { ChevronLeft } from "lucide-react"

import { NewCategoryPageClient } from "@/components/admin/categories/new-category-page-client"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Add New Category | Admin Dashboard",
  description: "Add a new product category",
}

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/categories">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Category</h1>
          <p className="text-neutral-500">Create a new product category</p>
        </div>
      </div>

      <NewCategoryPageClient />
    </div>
  )
}

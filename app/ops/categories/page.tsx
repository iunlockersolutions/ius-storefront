import Link from "next/link"

import { Plus } from "lucide-react"

import { CategoriesPageClient } from "@/components/admin/categories/categories-page-client"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Categories | Admin Dashboard",
  description: "Manage your product categories",
}

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-neutral-500">Manage your product categories</p>
        </div>
        <Button asChild>
          <Link href="/ops/categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Link>
        </Button>
      </div>

      <CategoriesPageClient />
    </div>
  )
}

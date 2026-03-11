import Link from "next/link"

import { ChevronLeft } from "lucide-react"

import { NewBrandForm } from "@/components/admin/brands/new-brand-form"
import { Button } from "@/components/ui/button"
import { getCategoriesFlat } from "@/lib/actions/category"

export const metadata = {
  title: "Add Brand | Operations",
  description: "Create a new brand",
}

export default async function NewBrandPage() {
  const categories = await getCategoriesFlat()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/brands">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Brand</h1>
          <p className="text-neutral-500">Create a new product brand</p>
        </div>
      </div>

      <NewBrandForm
        categories={categories
          .filter((category) => category.level === 0)
          .map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
          }))}
      />
    </div>
  )
}

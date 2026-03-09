import Link from "next/link"

import { Plus } from "lucide-react"

import { ProductsPageClient } from "@/components/admin/products/products-page-client"
import { Button } from "@/components/ui/button"

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
  }>
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const status = params.status || ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-neutral-500">Manage your product catalog</p>
        </div>
        <Button asChild>
          <Link href="/ops/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <ProductsPageClient page={page} search={search} status={status} />
    </div>
  )
}

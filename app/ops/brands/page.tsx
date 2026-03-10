import Link from "next/link"

import { Plus } from "lucide-react"

import { BrandsPageClient } from "@/components/admin/brands/brands-page-client"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Brands | Operations",
  description: "Manage your product brands",
}

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brands</h1>
          <p className="text-neutral-500">Manage your product brands</p>
        </div>
        <Button asChild>
          <Link href="/ops/brands/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Link>
        </Button>
      </div>

      <BrandsPageClient />
    </div>
  )
}

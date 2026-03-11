import Link from "next/link"

import { Plus } from "lucide-react"

import { ProductModelGroupsTable } from "@/components/admin/product-model-groups/product-model-groups-table"
import { Button } from "@/components/ui/button"
import { getProductModelGroups } from "@/lib/actions/product-model-group"

export const metadata = {
  title: "Models | Operations",
  description: "Manage product models used by the storefront catalog.",
}

export default async function ProductModelGroupsPage() {
  const groups = await getProductModelGroups({ includeInactive: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Models</h1>
          <p className="text-muted-foreground">
            Manage brand-specific models that group multiple sellable products.
          </p>
        </div>

        <Button asChild>
          <Link href="/ops/models/new">
            <Plus className="mr-2 size-4" />
            New Model
          </Link>
        </Button>
      </div>

      <ProductModelGroupsTable groups={groups} />
    </div>
  )
}

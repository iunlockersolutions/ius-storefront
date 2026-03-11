import Link from "next/link"

import { Plus } from "lucide-react"

import { ProductModelGroupsTable } from "@/components/admin/product-model-groups/product-model-groups-table"
import { Button } from "@/components/ui/button"
import { getProductModelGroups } from "@/lib/actions/product-model-group"

export const metadata = {
  title: "Product Model Groups | Operations",
  description: "Manage the model groups used by the storefront product menu.",
}

export default async function ProductModelGroupsPage() {
  const groups = await getProductModelGroups({ includeInactive: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Product Model Groups</h1>
          <p className="text-muted-foreground">
            Manage the third-level items shown inside the storefront Products
            menu.
          </p>
        </div>

        <Button asChild>
          <Link href="/ops/product-model-groups/new">
            <Plus className="mr-2 size-4" />
            New Model Group
          </Link>
        </Button>
      </div>

      <ProductModelGroupsTable groups={groups} />
    </div>
  )
}

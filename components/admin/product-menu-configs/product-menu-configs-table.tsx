"use client"

import { useState } from "react"

import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useUpdateProductMenuConfigMutation } from "@/hooks/admin/use-product-menu-config-mutations"

interface ProductMenuConfigRowData {
  id: string
  categoryId: string
  categoryName: string
  brandId: string
  brandName: string
  showInProductMenu: boolean
  menuPriority: number
  modelGroupCount: number
  productCount: number
}

interface ProductMenuConfigRowProps {
  row: ProductMenuConfigRowData
}

function ProductMenuConfigRow({ row }: ProductMenuConfigRowProps) {
  const [showInProductMenu, setShowInProductMenu] = useState(
    row.showInProductMenu,
  )
  const [menuPriority, setMenuPriority] = useState(row.menuPriority)
  const updateMutation = useUpdateProductMenuConfigMutation(row.id)

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        showInProductMenu,
        menuPriority,
      })
      toast.success("Product menu config updated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update config",
      )
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{row.brandName}</TableCell>
      <TableCell>{row.modelGroupCount}</TableCell>
      <TableCell>{row.productCount}</TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Switch
            checked={showInProductMenu}
            onCheckedChange={setShowInProductMenu}
          />
          <span className="text-sm text-muted-foreground">
            {showInProductMenu ? "Visible" : "Hidden"}
          </span>
        </div>
      </TableCell>
      <TableCell className="w-40">
        <Label htmlFor={`priority-${row.id}`} className="sr-only">
          Priority
        </Label>
        <Input
          id={`priority-${row.id}`}
          type="number"
          min={0}
          value={menuPriority}
          onChange={(event) => setMenuPriority(Number(event.target.value) || 0)}
        />
      </TableCell>
      <TableCell className="w-32">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : null}
          Save
        </Button>
      </TableCell>
    </TableRow>
  )
}

interface ProductMenuConfigsTableProps {
  rows: ProductMenuConfigRowData[]
}

export function ProductMenuConfigsTable({
  rows,
}: ProductMenuConfigsTableProps) {
  const groupedRows = rows.reduce<
    Record<string, { categoryName: string; rows: ProductMenuConfigRowData[] }>
  >((accumulator, row) => {
    if (!accumulator[row.categoryId]) {
      accumulator[row.categoryId] = {
        categoryName: row.categoryName,
        rows: [],
      }
    }

    accumulator[row.categoryId].rows.push(row)
    return accumulator
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(groupedRows).map(([categoryId, group]) => (
        <section key={categoryId} className="rounded-md border">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">{group.categoryName}</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Model Groups</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.rows.map((row) => (
                <ProductMenuConfigRow key={row.id} row={row} />
              ))}
            </TableBody>
          </Table>
        </section>
      ))}
    </div>
  )
}

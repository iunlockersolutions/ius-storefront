"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Eye, MoreHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDeleteProductModelGroupMutation } from "@/hooks/admin/use-product-model-group-mutations"

interface ProductModelGroupRow {
  id: string
  name: string
  slug: string
  primaryCategoryName: string
  brandName: string
  showInProductMenu: boolean
  navPriority: number
  isActive: boolean
  productCount: number
}

interface ProductModelGroupsTableProps {
  groups: ProductModelGroupRow[]
}

export function ProductModelGroupsTable({
  groups,
}: ProductModelGroupsTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const deleteMutation = useDeleteProductModelGroupMutation()

  const handleDelete = async () => {
    if (!deleteId) {
      return
    }

    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success("Model deleted successfully")
      setDeleteId(null)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete model group",
      )
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Menu</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No models found
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow
                  key={group.id}
                  role="link"
                  tabIndex={0}
                  className="cursor-pointer outline-none focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => router.push(`/ops/models/${group.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      router.push(`/ops/models/${group.id}`)
                    }
                  }}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{group.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {group.slug}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{group.primaryCategoryName}</TableCell>
                  <TableCell>{group.brandName}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          group.showInProductMenu ? "default" : "outline"
                        }
                      >
                        {group.showInProductMenu ? "Visible" : "Hidden"}
                      </Badge>
                      <Badge variant={group.isActive ? "secondary" : "outline"}>
                        {group.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{group.navPriority}</TableCell>
                  <TableCell>{group.productCount}</TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-10 gap-2 px-3"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/products/models/${group.slug}`}
                            target="_blank"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteId(group.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete model?</AlertDialogTitle>
            <AlertDialogDescription>
              You must reassign or remove all linked products before deleting a
              model.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

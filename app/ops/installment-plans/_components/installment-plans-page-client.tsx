"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Eye, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react"
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { routes } from "@/configs/routes"
import {
  useDeleteInstallmentPlanMutation,
  useSetInstallmentPlanPublishedMutation,
} from "@/services/mutations/use-installment-plan-mutations"
import {
  type AdminInstallmentOffer,
  useAdminInstallmentPlansQuery,
} from "@/services/queries/use-admin-installment-plans-query"

interface InstallmentPlansPageClientProps {
  page: number
  status: string
  search?: string
}

type DeleteState = Pick<AdminInstallmentOffer, "id" | "title"> | null

function formatDate(value: string | Date | null) {
  if (!value) return "Not published"
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function termsSummary(offer: AdminInstallmentOffer) {
  if (offer.terms.length === 0) return "No terms"
  return offer.terms
    .map((term) => `${term.months} mo ${term.label}`)
    .slice(0, 2)
    .join(", ")
}

export function InstallmentPlansPageClient({
  page,
  status,
  search,
}: InstallmentPlansPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(search ?? "")
  const [deleteState, setDeleteState] = useState<DeleteState>(null)
  const query = useAdminInstallmentPlansQuery({
    page,
    status,
    search,
  })
  const deleteMutation = useDeleteInstallmentPlanMutation()

  const pagination = query.data?.pagination ?? {
    page,
    limit: 20,
    total: 0,
    totalPages: 0,
  }

  const offers = useMemo(() => query.data?.offers ?? [], [query.data?.offers])

  const statusCounts = useMemo(
    () => ({
      published: offers.filter((offer) => offer.isPublished).length,
      draft: offers.filter((offer) => !offer.isPublished).length,
    }),
    [offers],
  )

  const updateFilters = (updates: {
    search?: string | null
    status?: string
    page?: number
  }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (updates.search !== undefined) {
      if (updates.search) params.set("search", updates.search)
      else params.delete("search")
    }

    if (updates.status !== undefined) {
      if (updates.status && updates.status !== "all") {
        params.set("status", updates.status)
      } else {
        params.delete("status")
      }
    }

    params.set("page", String(updates.page ?? 1))
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleDelete = async () => {
    if (!deleteState) return

    try {
      await deleteMutation.mutateAsync(deleteState.id)
      toast.success("Installment plan deleted")
      setDeleteState(null)
      query.refetch()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete installment plan",
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Installment Plans
          </h1>
          <p className="text-muted-foreground">
            Manage 0% bank and card installment notices for the storefront.
          </p>
        </div>
        <Button asChild>
          <Link href={routes.ops.installmentPlans.new}>
            <Plus className="size-4" />
            New plan
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total plans</CardDescription>
            <CardTitle className="text-2xl">{pagination.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Published in current view</CardDescription>
            <CardTitle className="text-2xl">{statusCounts.published}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Drafts in current view</CardDescription>
            <CardTitle className="text-2xl">{statusCounts.draft}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan notices</CardTitle>
          <CardDescription>
            Published notices appear on the customer installment plans page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    updateFilters({ search: searchInput.trim(), page: 1 })
                  }
                }}
                placeholder="Search title, provider, or slug"
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => updateFilters({ status: value })}
            >
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => updateFilters({ search: searchInput.trim() })}
            >
              Search
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading || query.isFetching ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading installment plans...
                    </TableCell>
                  </TableRow>
                ) : query.error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {query.error instanceof Error
                        ? query.error.message
                        : "Failed to load installment plans"}
                    </TableCell>
                  </TableRow>
                ) : offers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No installment plans found.
                    </TableCell>
                  </TableRow>
                ) : (
                  offers.map((offer) => (
                    <InstallmentOfferRow
                      key={offer.id}
                      offer={offer}
                      onDelete={() => setDeleteState(offer)}
                      onUpdated={() => query.refetch()}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => updateFilters({ page: pagination.page - 1 })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => updateFilters({ page: pagination.page + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(deleteState)}
        onOpenChange={(open) => {
          if (!open) setDeleteState(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete installment plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {deleteState?.title}. Published content
              will be removed from the storefront.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InstallmentOfferRow({
  offer,
  onDelete,
  onUpdated,
}: {
  offer: AdminInstallmentOffer
  onDelete: () => void
  onUpdated: () => void
}) {
  const publishMutation = useSetInstallmentPlanPublishedMutation(offer.id)

  const togglePublish = async () => {
    try {
      await publishMutation.mutateAsync(!offer.isPublished)
      toast.success(offer.isPublished ? "Plan unpublished" : "Plan published")
      onUpdated()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update publish status",
      )
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{offer.title}</div>
        <div className="text-xs text-muted-foreground">/{offer.slug}</div>
      </TableCell>
      <TableCell>{offer.providerName}</TableCell>
      <TableCell className="max-w-52 truncate">{termsSummary(offer)}</TableCell>
      <TableCell>
        <Badge variant={offer.isPublished ? "default" : "secondary"}>
          {offer.isPublished ? "Published" : "Draft"}
        </Badge>
      </TableCell>
      <TableCell>{offer.sortOrder}</TableCell>
      <TableCell>{formatDate(offer.updatedAt)}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Open actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {offer.isPublished ? (
              <DropdownMenuItem asChild>
                <Link
                  href={routes.storefront.installmentPlans.id(offer.slug)}
                  target="_blank"
                >
                  <Eye className="size-4" />
                  View storefront
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
              <Link href={routes.ops.installmentPlans.id(offer.id)}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={togglePublish}>
              {offer.isPublished ? "Unpublish" : "Publish"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

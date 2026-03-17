"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Eye, MoreHorizontal, Plus, Trash2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDeleteBrandMutation } from "@/services/mutations/use-brand-mutations"
import { useDeleteProductModelGroupMutation } from "@/services/mutations/use-product-model-group-mutations"

import { BrandCreateDialog } from "./brand-create-dialog"
import { ModelCreateDialog } from "./model-create-dialog"

type CategoryOption = {
  id: string
  name: string
  slug: string
}

type BrandRow = {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  websiteUrl: string | null
  isActive: boolean
  sortOrder: number
  metaTitle: string | null
  metaDescription: string | null
  productCount: number
  modelCount: number
  categoryAssignments: Array<{
    categoryId: string
    categoryName: string
    categorySlug: string
    navPriority: number
    showInProductMenu: boolean
  }>
}

type ModelRow = {
  id: string
  name: string
  slug: string
  description: string | null
  metaTitle: string | null
  metaDescription: string | null
  brandId: string
  brandName: string
  primaryCategoryId: string
  primaryCategoryName: string
  showInProductMenu: boolean
  navPriority: number
  isActive: boolean
  productCount: number
}

type CatalogTab = "brands" | "models"

type CreateState = { kind: "brand" | "model" } | null

type DeleteState =
  | { kind: "brand"; id: string; name: string }
  | { kind: "model"; id: string; name: string }
  | null

interface CatalogSetupPageClientProps {
  categories: CategoryOption[]
  brands: BrandRow[]
  models: ModelRow[]
  initialTab: CatalogTab
  initialCreate?: "brand" | "model" | null
}

export function CatalogSetupPageClient({
  categories,
  brands,
  models,
  initialTab,
  initialCreate,
}: CatalogSetupPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<CatalogTab>(initialTab)
  const [brandQuery, setBrandQuery] = useState("")
  const [modelQuery, setModelQuery] = useState("")
  const [createState, setCreateState] = useState<CreateState>(() => {
    if (initialCreate === "brand") {
      return { kind: "brand" }
    }

    if (initialCreate === "model") {
      return { kind: "model" }
    }

    return null
  })
  const [deleteState, setDeleteState] = useState<DeleteState>(null)
  const deleteBrandMutation = useDeleteBrandMutation()
  const deleteModelMutation = useDeleteProductModelGroupMutation()

  const brandOptionsForModels = useMemo(
    () =>
      brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        categoryAssignments: brand.categoryAssignments.map((assignment) => ({
          categoryId: assignment.categoryId,
        })),
      })),
    [brands],
  )

  const filteredBrands = useMemo(() => {
    const query = brandQuery.trim().toLowerCase()

    if (!query) {
      return brands
    }

    return brands.filter((brand) =>
      [brand.name, brand.slug].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
  }, [brandQuery, brands])

  const filteredModels = useMemo(() => {
    const query = modelQuery.trim().toLowerCase()

    if (!query) {
      return models
    }

    return models.filter((model) =>
      [model.name, model.slug, model.brandName, model.primaryCategoryName].some(
        (value) => value.toLowerCase().includes(query),
      ),
    )
  }, [modelQuery, models])

  const syncSearchParams = (
    nextTab: CatalogTab,
    nextCreateState: CreateState = null,
  ) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", nextTab)
    params.delete("create")

    if (nextCreateState) {
      params.set("create", nextCreateState.kind)
    }

    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    })
  }

  const openCreateDialog = (nextState: NonNullable<CreateState>) => {
    setCreateState(nextState)
    setActiveTab(nextState.kind === "brand" ? "brands" : "models")
    syncSearchParams(
      nextState.kind === "brand" ? "brands" : "models",
      nextState,
    )
  }

  const closeCreateDialog = () => {
    setCreateState(null)
    syncSearchParams(activeTab)
  }

  const handleTabChange = (value: string) => {
    const nextTab = value as CatalogTab
    setActiveTab(nextTab)
    setCreateState(null)
    syncSearchParams(nextTab)
  }

  const handleDelete = async () => {
    if (!deleteState) {
      return
    }

    try {
      if (deleteState.kind === "brand") {
        await deleteBrandMutation.mutateAsync(deleteState.id)
        toast.success("Brand deleted successfully")
      } else {
        await deleteModelMutation.mutateAsync(deleteState.id)
        toast.success("Model deleted successfully")
      }

      setDeleteState(null)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete item",
      )
    }
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Catalog Setup</h1>
            <p className="text-sm text-muted-foreground">
              Maintain brands and models that drive the product form and the
              storefront product menu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <TabsList>
              <TabsTrigger value="brands">Brands</TabsTrigger>
              <TabsTrigger value="models">Models</TabsTrigger>
            </TabsList>

            <Button
              onClick={() =>
                openCreateDialog({
                  kind: activeTab === "brands" ? "brand" : "model",
                })
              }
            >
              <Plus className="mr-2 size-4" />
              {activeTab === "brands" ? "New Brand" : "New Model"}
            </Button>
          </div>
        </div>

        <TabsContent value="brands" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              value={brandQuery}
              onChange={(event) => setBrandQuery(event.target.value)}
              placeholder="Search brands..."
              className="max-w-sm"
            />
            <p className="text-sm text-muted-foreground">
              {filteredBrands.length} brand
              {filteredBrands.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Models</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No brands match this search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBrands.map((brand) => (
                    <TableRow
                      key={brand.id}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer outline-none focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => router.push(`/ops/brands/${brand.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          router.push(`/ops/brands/${brand.id}`)
                        }
                      }}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{brand.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {brand.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{brand.categoryAssignments.length}</TableCell>
                      <TableCell>{brand.productCount}</TableCell>
                      <TableCell>{brand.modelCount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={brand.isActive ? "secondary" : "outline"}
                        >
                          {brand.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-10 gap-2 px-3"
                              aria-label={`Actions for ${brand.name}`}
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/brands/${brand.slug}`}
                                target="_blank"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() =>
                                setDeleteState({
                                  kind: "brand",
                                  id: brand.id,
                                  name: brand.name,
                                })
                              }
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
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              value={modelQuery}
              onChange={(event) => setModelQuery(event.target.value)}
              placeholder="Search models..."
              className="max-w-sm"
            />
            <p className="text-sm text-muted-foreground">
              {filteredModels.length} model
              {filteredModels.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No models match this search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredModels.map((model) => (
                    <TableRow
                      key={model.id}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer outline-none focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => router.push(`/ops/models/${model.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          router.push(`/ops/models/${model.id}`)
                        }
                      }}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{model.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {model.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{model.brandName}</TableCell>
                      <TableCell>{model.primaryCategoryName}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              model.showInProductMenu ? "secondary" : "outline"
                            }
                          >
                            {model.showInProductMenu ? "Visible" : "Hidden"}
                          </Badge>
                          <Badge
                            variant={model.isActive ? "secondary" : "outline"}
                          >
                            {model.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Priority {model.navPriority}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{model.productCount}</TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-10 gap-2 px-3"
                              aria-label={`Actions for ${model.name}`}
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/products/models/${model.slug}`}
                                target="_blank"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() =>
                                setDeleteState({
                                  kind: "model",
                                  id: model.id,
                                  name: model.name,
                                })
                              }
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
        </TabsContent>
      </Tabs>

      <BrandCreateDialog
        open={createState?.kind === "brand"}
        onOpenChange={(open) => {
          if (!open) {
            closeCreateDialog()
          }
        }}
        categories={categories}
      />

      <ModelCreateDialog
        open={createState?.kind === "model"}
        onOpenChange={(open) => {
          if (!open) {
            closeCreateDialog()
          }
        }}
        categories={categories}
        brands={brandOptionsForModels}
      />

      <AlertDialog
        open={Boolean(deleteState)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteState?.kind === "brand" ? "brand" : "model"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteState?.kind === "brand"
                ? `Delete ${deleteState.name}. Brands assigned to models or products must be cleaned up first.`
                : `Delete ${deleteState?.name}. You must reassign or remove linked products before deleting this model.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={
                deleteBrandMutation.isPending || deleteModelMutation.isPending
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={
                deleteBrandMutation.isPending || deleteModelMutation.isPending
              }
            >
              {deleteBrandMutation.isPending || deleteModelMutation.isPending
                ? "Deleting..."
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

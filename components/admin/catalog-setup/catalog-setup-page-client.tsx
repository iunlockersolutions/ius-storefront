"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Pencil, Plus } from "lucide-react"

import { BrandEditorForm } from "@/components/admin/brands/brand-editor-form"
import { ProductModelGroupForm } from "@/components/admin/product-model-groups/product-model-group-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  useCreateBrandMutation,
  useDeleteBrandMutation,
  useUpdateBrandMutation,
} from "@/hooks/admin/use-brand-mutations"

import { ResponsiveEditorPanel } from "./responsive-editor-panel"

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

type EditorState =
  | { kind: "brand"; mode: "create" | "edit"; id?: string }
  | { kind: "model"; mode: "create" | "edit"; id?: string }
  | null

interface CatalogSetupPageClientProps {
  categories: CategoryOption[]
  brands: BrandRow[]
  models: ModelRow[]
  initialTab: CatalogTab
  initialBrandId?: string | null
  initialModelId?: string | null
  initialCreate?: "brand" | "model" | null
}

export function CatalogSetupPageClient({
  categories,
  brands,
  models,
  initialTab,
  initialBrandId,
  initialModelId,
  initialCreate,
}: CatalogSetupPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<CatalogTab>(initialTab)
  const [brandQuery, setBrandQuery] = useState("")
  const [modelQuery, setModelQuery] = useState("")
  const [editorState, setEditorState] = useState<EditorState>(() => {
    if (initialCreate === "brand") {
      return { kind: "brand", mode: "create" }
    }

    if (initialCreate === "model") {
      return { kind: "model", mode: "create" }
    }

    if (initialBrandId && brands.some((brand) => brand.id === initialBrandId)) {
      return { kind: "brand", mode: "edit", id: initialBrandId }
    }

    if (initialModelId && models.some((model) => model.id === initialModelId)) {
      return { kind: "model", mode: "edit", id: initialModelId }
    }

    return null
  })

  const createBrandMutation = useCreateBrandMutation()
  const deleteBrandMutation = useDeleteBrandMutation()
  const updateBrandMutation = useUpdateBrandMutation(
    editorState?.kind === "brand" && editorState.mode === "edit"
      ? editorState.id || ""
      : "",
  )

  const selectedBrand =
    editorState?.kind === "brand" && editorState.mode === "edit"
      ? (brands.find((brand) => brand.id === editorState.id) ?? null)
      : null
  const selectedModel =
    editorState?.kind === "model" && editorState.mode === "edit"
      ? (models.find((model) => model.id === editorState.id) ?? null)
      : null

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
    nextEditorState: EditorState = null,
  ) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", nextTab)
    params.delete("brand")
    params.delete("model")
    params.delete("create")

    if (nextEditorState?.mode === "create") {
      params.set("create", nextEditorState.kind)
    }

    if (
      nextEditorState?.mode === "edit" &&
      nextEditorState.kind === "brand" &&
      nextEditorState.id
    ) {
      params.set("brand", nextEditorState.id)
    }

    if (
      nextEditorState?.mode === "edit" &&
      nextEditorState.kind === "model" &&
      nextEditorState.id
    ) {
      params.set("model", nextEditorState.id)
    }

    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    })
  }

  const openEditor = (nextState: Exclude<EditorState, null>) => {
    setEditorState(nextState)
    setActiveTab(nextState.kind === "brand" ? "brands" : "models")
    syncSearchParams(
      nextState.kind === "brand" ? "brands" : "models",
      nextState,
    )
  }

  const closeEditor = () => {
    setEditorState(null)
    syncSearchParams(activeTab)
  }

  const handleTabChange = (value: string) => {
    const nextTab = value as CatalogTab
    setActiveTab(nextTab)
    setEditorState(null)
    syncSearchParams(nextTab)
  }

  const panelTitle =
    editorState?.kind === "brand"
      ? editorState.mode === "create"
        ? "Create Brand"
        : `Edit Brand${selectedBrand ? `: ${selectedBrand.name}` : ""}`
      : editorState?.kind === "model"
        ? editorState.mode === "create"
          ? "Create Model"
          : `Edit Model${selectedModel ? `: ${selectedModel.name}` : ""}`
        : ""

  const panelDescription =
    editorState?.kind === "brand"
      ? "Manage brand details, category assignments, and storefront navigation defaults."
      : editorState?.kind === "model"
        ? "Manage model metadata, category placement, and storefront menu visibility."
        : ""

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
                openEditor({
                  kind: activeTab === "brands" ? "brand" : "model",
                  mode: "create",
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
                    <TableRow key={brand.id}>
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
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openEditor({
                              kind: "brand",
                              mode: "edit",
                              id: brand.id,
                            })
                          }
                        >
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </Button>
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
                    <TableRow key={model.id}>
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/products/models/${model.slug}`}
                              target="_blank"
                            >
                              View
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openEditor({
                                kind: "model",
                                mode: "edit",
                                id: model.id,
                              })
                            }
                          >
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <ResponsiveEditorPanel
        open={Boolean(editorState)}
        onOpenChange={(open) => {
          if (!open) {
            closeEditor()
          }
        }}
        title={panelTitle}
        description={panelDescription}
      >
        {editorState?.kind === "brand" ? (
          <BrandEditorForm
            mode={editorState.mode}
            categories={categories}
            initialData={selectedBrand ?? undefined}
            redirectTo={null}
            onCancel={closeEditor}
            onCompleted={closeEditor}
            onSave={(payload) =>
              editorState.mode === "create"
                ? createBrandMutation.mutateAsync(payload)
                : updateBrandMutation.mutateAsync(payload)
            }
            onDelete={
              selectedBrand
                ? () => deleteBrandMutation.mutateAsync(selectedBrand.id)
                : undefined
            }
          />
        ) : null}

        {editorState?.kind === "model" ? (
          <ProductModelGroupForm
            mode={editorState.mode}
            categories={categories}
            brands={brandOptionsForModels}
            initialData={selectedModel ?? undefined}
            redirectTo={null}
            onCancel={closeEditor}
            onCompleted={closeEditor}
          />
        ) : null}
      </ResponsiveEditorPanel>
    </>
  )
}

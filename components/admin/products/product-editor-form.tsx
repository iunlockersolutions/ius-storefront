"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { ImageUpload } from "@/components/admin/image-upload"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { slugify } from "@/lib/utils"

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  brandId: z.string().min(1, "Brand is required"),
  primaryCategoryId: z.string().min(1, "Primary category is required"),
  productModelGroupId: z.string().min(1, "Model group is required"),
  basePrice: z.string().min(1, "Price is required"),
  compareAtPrice: z.string().optional(),
  costPrice: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
})

type ProductFormData = z.infer<typeof productSchema>

type UploadedImage = {
  id: string
  url: string
  altText?: string
  isPrimary?: boolean
}

type VariantEditorValue = {
  key: string
  id?: string
  sku: string
  name: string
  price: string
  compareAtPrice: string
  costPrice: string
  weight: string
  isDefault: boolean
  isActive: boolean
}

type CategoryOption = {
  id: string
  name: string
  slug: string
  parentId: string | null
  level: number
  path: string
}

type BrandOption = {
  id: string
  name: string
  slug: string
}

type ProductModelGroupOption = {
  id: string
  name: string
  slug: string
  categoryId: string
  brandId: string
  isActive: boolean
}

type ProductEditorInitialData = {
  id?: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  brandId: string | null
  primaryCategoryId: string | null
  productModelGroupId: string | null
  basePrice: string
  compareAtPrice: string | null
  costPrice: string | null
  status: "draft" | "active" | "archived"
  isFeatured: boolean
  metaTitle: string | null
  metaDescription: string | null
  categories: Array<{ id: string }>
  variants: Array<{
    id: string
    sku: string
    name: string
    price: string
    compareAtPrice: string | null
    costPrice: string | null
    weight: string | null
    isDefault: boolean
    isActive: boolean
  }>
  images?: Array<{
    id: string
    url: string
    altText: string | null
    isPrimary: boolean
  }>
}

interface ProductEditorFormProps {
  mode: "create" | "edit"
  categories: CategoryOption[]
  brands: BrandOption[]
  productModelGroups: ProductModelGroupOption[]
  initialData?: ProductEditorInitialData
  onSave: (payload: {
    name: string
    slug: string
    description?: string
    shortDescription?: string
    brandId: string
    primaryCategoryId: string
    productModelGroupId: string
    categoryIds: string[]
    basePrice: string
    compareAtPrice?: string
    costPrice?: string
    status: "draft" | "active" | "archived"
    isFeatured: boolean
    metaTitle?: string
    metaDescription?: string
    variants: Array<{
      id?: string
      sku?: string
      name: string
      price: string
      compareAtPrice?: string
      costPrice?: string
      weight?: string
      isDefault?: boolean
      isActive?: boolean
    }>
    images: UploadedImage[]
  }) => Promise<void>
  onDelete?: () => Promise<void>
}

function createEmptyVariant(): VariantEditorValue {
  return {
    key: crypto.randomUUID(),
    sku: "",
    name: "",
    price: "",
    compareAtPrice: "",
    costPrice: "",
    weight: "",
    isDefault: true,
    isActive: true,
  }
}

export function ProductEditorForm({
  mode,
  categories,
  brands,
  productModelGroups,
  initialData,
  onSave,
  onDelete,
}: ProductEditorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [variants, setVariants] = useState<VariantEditorValue[]>(
    initialData?.variants?.length
      ? initialData.variants.map((variant) => ({
          key: variant.id,
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice || "",
          costPrice: variant.costPrice || "",
          weight: variant.weight || "",
          isDefault: variant.isDefault,
          isActive: variant.isActive,
        }))
      : [createEmptyVariant()],
  )
  const [categoryIds, setCategoryIds] = useState<string[]>(
    Array.from(
      new Set(
        initialData?.categories?.map((category) => category.id) ??
          (initialData?.primaryCategoryId
            ? [initialData.primaryCategoryId]
            : []),
      ),
    ),
  )
  const [images, setImages] = useState<UploadedImage[]>(
    (initialData?.images ?? []).map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText || undefined,
      isPrimary: image.isPrimary,
    })),
  )

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      shortDescription: initialData?.shortDescription || "",
      description: initialData?.description || "",
      brandId: initialData?.brandId || "",
      primaryCategoryId: initialData?.primaryCategoryId || "",
      productModelGroupId: initialData?.productModelGroupId || "",
      basePrice: initialData?.basePrice || "",
      compareAtPrice: initialData?.compareAtPrice || "",
      costPrice: initialData?.costPrice || "",
      status: initialData?.status || "draft",
      isFeatured: initialData?.isFeatured || false,
      metaTitle: initialData?.metaTitle || "",
      metaDescription: initialData?.metaDescription || "",
    },
    mode: "onChange",
  })

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = form

  const watchedValues = watch()
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )

  const selectedPrimaryCategoryId = watchedValues.primaryCategoryId
  const selectedBrandId = watchedValues.brandId
  const orderedCategories = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        label:
          category.level > 0
            ? `${"— ".repeat(category.level)}${category.name}`
            : category.name,
      })),
    [categories],
  )

  const selectedMenuCategoryId = useMemo(() => {
    if (!selectedPrimaryCategoryId) {
      return null
    }

    let cursor = selectedPrimaryCategoryId
    let topLevelCategoryId: string | null = null

    while (cursor) {
      const category = categoryMap.get(cursor)

      if (!category) {
        break
      }

      topLevelCategoryId = category.id
      cursor = category.parentId!
    }

    return topLevelCategoryId
  }, [categoryMap, selectedPrimaryCategoryId])

  const filteredProductModelGroups = useMemo(
    () =>
      productModelGroups.filter((group) => {
        if (selectedBrandId && group.brandId !== selectedBrandId) {
          return false
        }

        if (
          selectedMenuCategoryId &&
          group.categoryId !== selectedMenuCategoryId
        ) {
          return false
        }

        if (group.isActive) {
          return true
        }

        return group.id === watchedValues.productModelGroupId
      }),
    [
      productModelGroups,
      selectedBrandId,
      selectedMenuCategoryId,
      watchedValues.productModelGroupId,
    ],
  )

  useEffect(() => {
    if (!watchedValues.productModelGroupId) {
      return
    }

    const isStillValid = filteredProductModelGroups.some(
      (group) => group.id === watchedValues.productModelGroupId,
    )

    if (!isStillValid) {
      setValue("productModelGroupId", "")
    }
  }, [filteredProductModelGroups, setValue, watchedValues.productModelGroupId])

  const handleNameChange = (value: string) => {
    setValue("name", value)
    if (
      !watchedValues.slug ||
      watchedValues.slug === slugify(watchedValues.name || "")
    ) {
      setValue("slug", slugify(value))
    }
  }

  const handlePrimaryCategoryChange = (value: string) => {
    setValue("primaryCategoryId", value)
    setCategoryIds((current) =>
      Array.from(new Set([value, ...current.filter((id) => id !== value)])),
    )
  }

  const toggleCategory = (categoryId: string, checked: boolean) => {
    if (categoryId === selectedPrimaryCategoryId) {
      return
    }

    setCategoryIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, categoryId]))
      }

      return current.filter((id) => id !== categoryId)
    })
  }

  const updateVariant = (
    key: string,
    field: keyof VariantEditorValue,
    value: string | boolean,
  ) => {
    setVariants((current) =>
      current.map((variant) => {
        if (variant.key !== key) {
          if (field === "isDefault" && value === true) {
            return { ...variant, isDefault: false }
          }

          return variant
        }

        return {
          ...variant,
          [field]: value,
        }
      }),
    )
  }

  const addVariant = () => {
    setVariants((current) => [
      ...current.map((variant, index) =>
        current.length === 0 || index > 0
          ? variant
          : { ...variant, isDefault: false },
      ),
      {
        ...createEmptyVariant(),
        isDefault: current.length === 0,
      },
    ])
  }

  const removeVariant = (key: string) => {
    setVariants((current) => {
      const next = current.filter((variant) => variant.key !== key)
      if (next.length === 0) {
        return [createEmptyVariant()]
      }

      if (!next.some((variant) => variant.isDefault)) {
        next[0] = { ...next[0], isDefault: true }
      }

      return next
    })
  }

  const validateVariants = () => {
    if (variants.length === 0) {
      toast.error("At least one variant is required")
      return false
    }

    for (const variant of variants) {
      if (!variant.name.trim()) {
        toast.error("Each variant must have a name")
        return false
      }

      if (!variant.price.trim()) {
        toast.error("Each variant must have a price")
        return false
      }
    }

    return true
  }

  const submit = async (data: ProductFormData) => {
    if (!validateVariants()) {
      return
    }

    startTransition(async () => {
      try {
        await onSave({
          name: data.name,
          slug: data.slug,
          description: data.description || undefined,
          shortDescription: data.shortDescription || undefined,
          brandId: data.brandId,
          primaryCategoryId: data.primaryCategoryId,
          productModelGroupId: data.productModelGroupId,
          categoryIds: Array.from(
            new Set([data.primaryCategoryId, ...categoryIds]),
          ),
          basePrice: data.basePrice,
          compareAtPrice: data.compareAtPrice || undefined,
          costPrice: data.costPrice || undefined,
          status: data.status,
          isFeatured: data.isFeatured,
          metaTitle: data.metaTitle || undefined,
          metaDescription: data.metaDescription || undefined,
          variants: variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku || undefined,
            name: variant.name,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice || undefined,
            costPrice: variant.costPrice || undefined,
            weight: variant.weight || undefined,
            isDefault: variant.isDefault,
            isActive: variant.isActive,
          })),
          images,
        })

        toast.success(
          mode === "create"
            ? "Product created successfully!"
            : "Product updated successfully!",
        )
        router.push("/ops/products")
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Core Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={watchedValues.name}
              onChange={(event) => handleNameChange(event.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" {...register("slug")} />
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Textarea
              id="shortDescription"
              rows={2}
              {...register("shortDescription")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={6} {...register("description")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand & Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Select
                value={watchedValues.brandId}
                onValueChange={(value) => setValue("brandId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brandId && (
                <p className="text-sm text-red-500">{errors.brandId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Primary Category *</Label>
              <Select
                value={watchedValues.primaryCategoryId}
                onValueChange={handlePrimaryCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a primary category" />
                </SelectTrigger>
                <SelectContent>
                  {orderedCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.primaryCategoryId && (
                <p className="text-sm text-red-500">
                  {errors.primaryCategoryId.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product Model Group *</Label>
            <Select
              value={watchedValues.productModelGroupId}
              onValueChange={(value) => setValue("productModelGroupId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a model group" />
              </SelectTrigger>
              <SelectContent>
                {filteredProductModelGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productModelGroupId && (
              <p className="text-sm text-red-500">
                {errors.productModelGroupId.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Model groups are filtered by the selected brand and the top-level
              menu category derived from the primary category.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Additional Category Assignments</Label>
            <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
              {orderedCategories.map((category) => {
                const checked =
                  categoryIds.includes(category.id) ||
                  category.id === selectedPrimaryCategoryId

                return (
                  <label
                    key={category.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={category.id === selectedPrimaryCategoryId}
                      onCheckedChange={(nextChecked) =>
                        toggleCategory(category.id, nextChecked === true)
                      }
                    />
                    <span>{category.label}</span>
                  </label>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              The primary category is always assigned automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price *</Label>
              <Input id="basePrice" {...register("basePrice")} />
              {errors.basePrice && (
                <p className="text-sm text-red-500">
                  {errors.basePrice.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Compare At Price</Label>
              <Input id="compareAtPrice" {...register("compareAtPrice")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input id="costPrice" {...register("costPrice")} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Variants</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, index) => (
                <Card key={variant.key} className="border-dashed">
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Variant {index + 1}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariant(variant.key)}
                        disabled={variants.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          value={variant.name}
                          onChange={(event) =>
                            updateVariant(
                              variant.key,
                              "name",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SKU</Label>
                        <Input
                          value={variant.sku}
                          onChange={(event) =>
                            updateVariant(
                              variant.key,
                              "sku",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Price *</Label>
                        <Input
                          value={variant.price}
                          onChange={(event) =>
                            updateVariant(
                              variant.key,
                              "price",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Compare At</Label>
                        <Input
                          value={variant.compareAtPrice}
                          onChange={(event) =>
                            updateVariant(
                              variant.key,
                              "compareAtPrice",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cost</Label>
                        <Input
                          value={variant.costPrice}
                          onChange={(event) =>
                            updateVariant(
                              variant.key,
                              "costPrice",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Weight</Label>
                        <Input
                          value={variant.weight}
                          onChange={(event) =>
                            updateVariant(
                              variant.key,
                              "weight",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <Label>Default Variant</Label>
                          <p className="text-xs text-muted-foreground">
                            Used as the initial storefront selection
                          </p>
                        </div>
                        <Switch
                          checked={variant.isDefault}
                          onCheckedChange={(checked) =>
                            updateVariant(variant.key, "isDefault", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <Label>Active</Label>
                          <p className="text-xs text-muted-foreground">
                            Inactive variants stay hidden from purchasing
                          </p>
                        </div>
                        <Switch
                          checked={variant.isActive}
                          onCheckedChange={(checked) =>
                            updateVariant(variant.key, "isActive", checked)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload value={images} onChange={setImages} folder="products" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publishing & SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watchedValues.status}
                onValueChange={(value) =>
                  setValue("status", value as ProductFormData["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Featured</Label>
                <p className="text-xs text-muted-foreground">
                  Eligible for featured merchandising placements
                </p>
              </div>
              <Switch
                checked={watchedValues.isFeatured}
                onCheckedChange={(checked) => setValue("isFeatured", checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input id="metaTitle" {...register("metaTitle")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              rows={3}
              {...register("metaDescription")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          {onDelete && mode === "edit" ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  Delete Product
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete product?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete the product and its catalog variants.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      startTransition(async () => {
                        try {
                          await onDelete()
                          router.push("/ops/products")
                          router.refresh()
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Failed to delete product",
                          )
                        }
                      })
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <span />
          )}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Product" : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  )
}

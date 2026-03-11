"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { ImageUpload } from "@/components/admin/image-upload"
import { CreatableEntityCombobox } from "@/components/admin/products/creatable-entity-combobox"
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
import { normalizeEntityName } from "@/lib/utils/catalog"

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  brandId: z.string().optional(),
  primaryCategoryId: z.string().optional(),
  modelId: z.string().optional(),
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

type OptionEditorValue = {
  key: string
  name: string
  values: string[]
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
  optionValues: Record<string, string>
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

type ModelOption = {
  id: string
  name: string
  slug: string
  primaryCategoryId: string
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
  modelId: string | null
  status: "draft" | "active" | "archived"
  isFeatured: boolean
  metaTitle: string | null
  metaDescription: string | null
  categories: Array<{ id: string }>
  options: Array<{
    id: string
    name: string
    values: Array<{
      id: string
      value: string
    }>
  }>
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
    selections?: Array<{
      optionName: string
      optionValue: string
    }>
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
  models: ModelOption[]
  initialData?: ProductEditorInitialData
  onSave: (payload: {
    name: string
    slug: string
    description?: string
    shortDescription?: string
    brandId?: string | null
    primaryCategoryId?: string | null
    modelId?: string | null
    categoryIds: string[]
    status: "draft" | "active" | "archived"
    isFeatured: boolean
    metaTitle?: string
    metaDescription?: string
    options: Array<{
      name: string
      values: string[]
    }>
    variants: Array<{
      id?: string
      sku?: string
      name?: string
      price: string
      compareAtPrice?: string
      costPrice?: string
      weight?: string
      isDefault?: boolean
      isActive?: boolean
      optionValues: Record<string, string>
    }>
    images: UploadedImage[]
  }) => Promise<void>
  onDelete?: () => Promise<void>
}

function createEmptyVariant(): VariantEditorValue {
  return {
    key: crypto.randomUUID(),
    sku: "",
    name: "Default",
    price: "0.00",
    compareAtPrice: "",
    costPrice: "",
    weight: "",
    isDefault: true,
    isActive: true,
    optionValues: {},
  }
}

function buildOptionKey(optionValues: Record<string, string>) {
  return Object.entries(optionValues)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}:${value}`)
    .join("|")
}

function buildCombinations(options: OptionEditorValue[]) {
  if (options.length === 0) {
    return [{}]
  }

  return options.reduce<Array<Record<string, string>>>(
    (combinations, option) => {
      const next: Array<Record<string, string>> = []

      for (const combination of combinations) {
        for (const value of option.values) {
          next.push({
            ...combination,
            [option.name]: value,
          })
        }
      }

      return next
    },
    [{}],
  )
}

function buildVariantName(optionValues: Record<string, string>) {
  const values = Object.values(optionValues)
  return values.length > 0 ? values.join(" / ") : "Default"
}

export function ProductEditorForm({
  mode,
  categories,
  brands,
  models,
  initialData,
  onSave,
  onDelete,
}: ProductEditorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [categoryIds, setCategoryIds] = useState<string[]>(() =>
    Array.from(
      new Set(
        initialData?.categories?.map((category) => category.id) ??
          (initialData?.primaryCategoryId
            ? [initialData.primaryCategoryId]
            : []),
      ),
    ),
  )
  const [images, setImages] = useState<UploadedImage[]>(() =>
    (initialData?.images ?? []).map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText || undefined,
      isPrimary: image.isPrimary,
    })),
  )
  const [options, setOptions] = useState<OptionEditorValue[]>(
    () =>
      initialData?.options?.map((option) => ({
        key: option.id,
        name: option.name,
        values: option.values.map((value) => value.value),
      })) ?? [],
  )
  const [variants, setVariants] = useState<VariantEditorValue[]>(() =>
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
          optionValues: Object.fromEntries(
            (variant.selections ?? []).map((selection) => [
              selection.optionName,
              selection.optionValue,
            ]),
          ),
        }))
      : [createEmptyVariant()],
  )
  const [createdBrands, setCreatedBrands] = useState<BrandOption[]>([])
  const [createdModels, setCreatedModels] = useState<ModelOption[]>([])
  const [isInlineBrandPending, setIsInlineBrandPending] = useState(false)
  const [isInlineModelPending, setIsInlineModelPending] = useState(false)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      shortDescription: initialData?.shortDescription || "",
      description: initialData?.description || "",
      brandId: initialData?.brandId || "",
      primaryCategoryId: initialData?.primaryCategoryId || "",
      modelId: initialData?.modelId || "",
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

  const topLevelCategories = useMemo(
    () => categories.filter((category) => category.level === 0),
    [categories],
  )

  const brandOptions = useMemo(() => {
    const merged = [...brands, ...createdBrands]
    return merged.filter(
      (brand, index) =>
        merged.findIndex((candidate) => candidate.id === brand.id) === index,
    )
  }, [brands, createdBrands])

  const modelOptions = useMemo(() => {
    const merged = [...models, ...createdModels]
    return merged.filter(
      (model, index) =>
        merged.findIndex((candidate) => candidate.id === model.id) === index,
    )
  }, [createdModels, models])

  const topLevelCategoryMap = useMemo(
    () =>
      new Map(
        topLevelCategories.map((category) => [
          category.id,
          {
            name: category.name,
            slug: category.slug,
          },
        ]),
      ),
    [topLevelCategories],
  )

  const modelMap = useMemo(
    () => new Map(modelOptions.map((model) => [model.id, model])),
    [modelOptions],
  )

  const selectedModel = watchedValues.modelId
    ? modelMap.get(watchedValues.modelId)
    : undefined

  const availableModels = useMemo(() => {
    if (selectedModel) {
      return modelOptions
    }

    return modelOptions.filter((model) => {
      if (watchedValues.brandId && model.brandId !== watchedValues.brandId) {
        return false
      }

      if (
        watchedValues.primaryCategoryId &&
        model.primaryCategoryId !== watchedValues.primaryCategoryId
      ) {
        return false
      }

      return true
    })
  }, [
    modelOptions,
    selectedModel,
    watchedValues.brandId,
    watchedValues.primaryCategoryId,
  ])

  const brandComboboxOptions = useMemo(
    () =>
      brandOptions.map((brand) => ({
        id: brand.id,
        name: brand.name,
      })),
    [brandOptions],
  )

  const modelComboboxOptions = useMemo(
    () =>
      availableModels.map((model) => ({
        id: model.id,
        name: model.name,
        description: [
          brandOptions.find((brand) => brand.id === model.brandId)?.name,
          topLevelCategoryMap.get(model.primaryCategoryId)?.name,
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    [availableModels, brandOptions, topLevelCategoryMap],
  )

  const canCreateModel =
    Boolean(watchedValues.brandId) && Boolean(watchedValues.primaryCategoryId)

  useEffect(() => {
    const normalizedOptions = options
      .map((option) => ({
        name: option.name.trim(),
        values: option.values.map((value) => value.trim()).filter(Boolean),
      }))
      .filter((option) => option.name.length > 0 && option.values.length > 0)

    if (normalizedOptions.length === 0) {
      setVariants((current) => {
        const existingDefault = current[0] ?? createEmptyVariant()
        return [
          {
            ...existingDefault,
            name: existingDefault.name || "Default",
            optionValues: {},
            isDefault: true,
          },
        ]
      })
      return
    }

    const nextCombinations = buildCombinations(
      normalizedOptions.map((option) => ({
        key: option.name,
        name: option.name,
        values: option.values,
      })),
    )

    setVariants((current) => {
      const existingMap = new Map(
        current.map((variant) => [
          buildOptionKey(variant.optionValues),
          variant,
        ]),
      )

      const nextVariants = nextCombinations.map((combination, index) => {
        const key = buildOptionKey(combination)
        const existing = existingMap.get(key)

        return {
          key: existing?.key || crypto.randomUUID(),
          id: existing?.id,
          sku: existing?.sku || "",
          name: existing?.name || buildVariantName(combination),
          price: existing?.price || "0.00",
          compareAtPrice: existing?.compareAtPrice || "",
          costPrice: existing?.costPrice || "",
          weight: existing?.weight || "",
          isDefault:
            existing?.isDefault ??
            (index === 0 && !current.some((variant) => variant.isDefault)),
          isActive: existing?.isActive ?? true,
          optionValues: combination,
        }
      })

      if (!nextVariants.some((variant) => variant.isDefault)) {
        nextVariants[0] = { ...nextVariants[0], isDefault: true }
      }

      let defaultAssigned = false
      return nextVariants.map((variant) => {
        if (variant.isDefault && !defaultAssigned) {
          defaultAssigned = true
          return variant
        }

        return {
          ...variant,
          isDefault: false,
        }
      })
    })
  }, [options])

  const toggleCategory = (categoryId: string, checked: boolean) => {
    setCategoryIds((current) =>
      checked
        ? Array.from(new Set([...current, categoryId]))
        : current.filter((id) => id !== categoryId),
    )
  }

  const addOption = () => {
    setOptions((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        name: "",
        values: [],
      },
    ])
  }

  const updateOption = (
    optionKey: string,
    updates: Partial<OptionEditorValue>,
  ) => {
    setOptions((current) =>
      current.map((option) =>
        option.key === optionKey ? { ...option, ...updates } : option,
      ),
    )
  }

  const removeOption = (optionKey: string) => {
    setOptions((current) =>
      current.filter((option) => option.key !== optionKey),
    )
  }

  const updateVariant = (
    variantKey: string,
    updates: Partial<VariantEditorValue>,
  ) => {
    setVariants((current) =>
      current.map((variant) =>
        variant.key === variantKey ? { ...variant, ...updates } : variant,
      ),
    )
  }

  const setDefaultVariant = (variantKey: string) => {
    setVariants((current) =>
      current.map((variant) => ({
        ...variant,
        isDefault: variant.key === variantKey,
      })),
    )
  }

  const submit = async (data: ProductFormData) => {
    startTransition(async () => {
      try {
        await onSave({
          name: data.name,
          slug: data.slug,
          description: data.description || undefined,
          shortDescription: data.shortDescription || undefined,
          brandId: data.brandId || null,
          primaryCategoryId: data.primaryCategoryId || null,
          modelId: data.modelId || null,
          categoryIds,
          status: data.status,
          isFeatured: data.isFeatured,
          metaTitle: data.metaTitle || undefined,
          metaDescription: data.metaDescription || undefined,
          options: options
            .map((option) => ({
              name: option.name.trim(),
              values: option.values
                .map((value) => value.trim())
                .filter(Boolean),
            }))
            .filter(
              (option) => option.name.length > 0 && option.values.length > 0,
            ),
          variants: variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku || undefined,
            name: variant.name || undefined,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice || undefined,
            costPrice: variant.costPrice || undefined,
            weight: variant.weight || undefined,
            isDefault: variant.isDefault,
            isActive: variant.isActive,
            optionValues: variant.optionValues,
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

  const createBrandInline = async (name: string) => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return
    }

    setIsInlineBrandPending(true)

    try {
      const response = await fetch("/api/admin/brands/inline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          primaryCategoryId: watchedValues.primaryCategoryId || null,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(
          errorBody?.error?.message ||
            errorBody?.error ||
            "Failed to create brand",
        )
      }

      const body = await response.json()
      const nextBrand = body.data.brand as BrandOption

      setCreatedBrands((current) => {
        const exists = current.some((brand) => brand.id === nextBrand.id)
        return exists ? current : [...current, nextBrand]
      })
      setValue("brandId", nextBrand.id, {
        shouldDirty: true,
        shouldValidate: true,
      })

      toast.success(
        body.data.created
          ? `Created brand "${nextBrand.name}"`
          : `Using existing brand "${nextBrand.name}"`,
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create brand",
      )
    } finally {
      setIsInlineBrandPending(false)
    }
  }

  const createModelInline = async (name: string) => {
    const trimmedName = name.trim()

    if (
      !trimmedName ||
      !watchedValues.brandId ||
      !watchedValues.primaryCategoryId
    ) {
      return
    }

    setIsInlineModelPending(true)

    try {
      const response = await fetch("/api/admin/models/inline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          brandId: watchedValues.brandId,
          primaryCategoryId: watchedValues.primaryCategoryId,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(
          errorBody?.error?.message ||
            errorBody?.error ||
            "Failed to create model",
        )
      }

      const body = await response.json()
      const nextModel = body.data.model as ModelOption

      setCreatedModels((current) => {
        const exists = current.some((model) => model.id === nextModel.id)
        return exists ? current : [...current, nextModel]
      })
      setValue("modelId", nextModel.id, {
        shouldDirty: true,
        shouldValidate: true,
      })

      toast.success(
        body.data.created
          ? `Created model "${nextModel.name}"`
          : `Using existing model "${nextModel.name}"`,
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create model",
      )
    } finally {
      setIsInlineModelPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Core Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={watchedValues.name}
              onChange={(event) => {
                const nextName = event.target.value
                setValue("name", nextName)

                if (
                  !watchedValues.slug ||
                  watchedValues.slug === slugify(watchedValues.name || "")
                ) {
                  setValue("slug", slugify(nextName))
                }
              }}
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
            <Textarea id="description" rows={5} {...register("description")} />
          </div>

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
                <Label htmlFor="isFeatured">Featured</Label>
                <p className="text-xs text-muted-foreground">
                  Highlight this product on the storefront
                </p>
              </div>
              <Switch
                id="isFeatured"
                checked={watchedValues.isFeatured}
                onCheckedChange={(checked) => setValue("isFeatured", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Brand</Label>
              <CreatableEntityCombobox
                value={watchedValues.brandId || ""}
                options={brandComboboxOptions}
                placeholder="Select or create brand"
                searchPlaceholder="Search brands..."
                emptyLabel="No matching brands"
                disabled={Boolean(selectedModel)}
                createLabel={(query) => `Create "${query.trim()}"`}
                onValueChange={(value) =>
                  setValue("brandId", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                onCreate={createBrandInline}
                canCreate={(query) =>
                  Boolean(query.trim()) && !isInlineBrandPending
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Primary Category</Label>
              <Select
                value={watchedValues.primaryCategoryId || "__none__"}
                onValueChange={(value) =>
                  setValue(
                    "primaryCategoryId",
                    value === "__none__" ? "" : value,
                  )
                }
                disabled={Boolean(selectedModel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No category</SelectItem>
                  {topLevelCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <CreatableEntityCombobox
                value={watchedValues.modelId || ""}
                options={modelComboboxOptions}
                placeholder={
                  canCreateModel
                    ? "Select or create model"
                    : "Select brand and category first"
                }
                searchPlaceholder="Search models..."
                emptyLabel={
                  canCreateModel
                    ? "No matching models for this brand and category"
                    : "Choose a brand and top-level category first"
                }
                disabled={!canCreateModel && !selectedModel}
                createLabel={(query) => `Create "${query.trim()}"`}
                canCreate={(query) =>
                  canCreateModel &&
                  Boolean(query.trim()) &&
                  !isInlineModelPending &&
                  !availableModels.some(
                    (model) =>
                      normalizeEntityName(model.name) ===
                      normalizeEntityName(query),
                  )
                }
                onValueChange={(value) => {
                  const nextModel = value ? modelMap.get(value) : undefined

                  setValue("modelId", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })

                  if (!nextModel) {
                    return
                  }

                  setValue("brandId", nextModel.brandId, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                  setValue("primaryCategoryId", nextModel.primaryCategoryId, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                  setCategoryIds((current) =>
                    current.includes(nextModel.primaryCategoryId)
                      ? current
                      : [nextModel.primaryCategoryId, ...current],
                  )
                }}
                onCreate={createModelInline}
              />
            </div>
          </div>

          {selectedModel ? (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              Brand and primary category are locked to the selected model. Clear
              the model if you need to change them.
            </div>
          ) : null}

          <div className="space-y-3">
            <Label>Additional Categories</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {categories.map((category) =>
                (() => {
                  const isPrimaryCategory =
                    watchedValues.primaryCategoryId === category.id

                  return (
                    <div
                      key={category.id}
                      className="flex items-start gap-3 rounded-lg border p-3 text-sm"
                    >
                      <Checkbox
                        id={`product-category-${category.id}`}
                        checked={
                          isPrimaryCategory || categoryIds.includes(category.id)
                        }
                        disabled={isPrimaryCategory}
                        onCheckedChange={(checked) =>
                          toggleCategory(category.id, Boolean(checked))
                        }
                      />
                      <div>
                        <Label
                          htmlFor={`product-category-${category.id}`}
                          className="font-medium"
                        >
                          {category.path}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {isPrimaryCategory
                            ? `${category.slug} · Primary category`
                            : category.slug}
                        </p>
                      </div>
                    </div>
                  )
                })(),
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Options</CardTitle>
          <Button type="button" variant="outline" onClick={addOption}>
            <Plus className="mr-2 h-4 w-4" />
            Add Option
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No options defined. A single default variant will be used.
            </p>
          ) : (
            options.map((option) => (
              <div key={option.key} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>Option Name</Label>
                    <Input
                      value={option.name}
                      onChange={(event) =>
                        updateOption(option.key, { name: event.target.value })
                      }
                      placeholder="Storage"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(option.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Values (comma separated)</Label>
                  <Input
                    value={option.values.join(", ")}
                    onChange={(event) =>
                      updateOption(option.key, {
                        values: event.target.value
                          .split(",")
                          .map((value) => value.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="128GB, 256GB, 512GB"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {variants.map((variant) => (
            <div key={variant.key} className="rounded-lg border p-4 space-y-4">
              {Object.keys(variant.optionValues).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(variant.optionValues).map(([name, value]) => (
                    <span
                      key={`${variant.key}-${name}`}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                    >
                      {name}: {value}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Variant Name</Label>
                  <Input
                    value={variant.name}
                    onChange={(event) =>
                      updateVariant(variant.key, { name: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    value={variant.sku}
                    onChange={(event) =>
                      updateVariant(variant.key, { sku: event.target.value })
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
                      updateVariant(variant.key, { price: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Compare At</Label>
                  <Input
                    value={variant.compareAtPrice}
                    onChange={(event) =>
                      updateVariant(variant.key, {
                        compareAtPrice: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost</Label>
                  <Input
                    value={variant.costPrice}
                    onChange={(event) =>
                      updateVariant(variant.key, {
                        costPrice: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    value={variant.weight}
                    onChange={(event) =>
                      updateVariant(variant.key, { weight: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label>Default Variant</Label>
                    <p className="text-xs text-muted-foreground">
                      Used for storefront default pricing
                    </p>
                  </div>
                  <Switch
                    checked={variant.isDefault}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setDefaultVariant(variant.key)
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label>Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Purchasable on the storefront
                    </p>
                  </div>
                  <Switch
                    checked={variant.isActive}
                    onCheckedChange={(checked) =>
                      updateVariant(variant.key, { isActive: checked })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={images}
            onChange={setImages}
            maxImages={8}
            folder="products"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        {onDelete ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Product
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete product?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the product and all of its variants.
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

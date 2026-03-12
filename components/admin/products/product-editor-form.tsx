"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { ImageUpload } from "@/components/admin/image-upload"
import { CreatableEntityCombobox } from "@/components/admin/products/creatable-entity-combobox"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  variantId?: string | null
  isPrimary?: boolean
}

type OptionValueEditorValue = {
  key: string
  value: string
}

type OptionEditorValue = {
  key: string
  name: string
  values: OptionValueEditorValue[]
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
  quantity: number
  lowStockThreshold: number
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
  optionTemplates: Array<{
    id: string
    name: string
    sortOrder: number
  }>
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
  id: string
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
    inventory?: {
      quantity: number
      reservedQuantity: number
      lowStockThreshold: number | null
    } | null
    selections?: Array<{
      optionName: string
      optionValue: string
    }>
  }>
  images?: Array<{
    id: string
    url: string
    altText: string | null
    variantId?: string | null
    isPrimary: boolean
  }>
}

interface ProductEditorFormProps {
  categories: CategoryOption[]
  brands: BrandOption[]
  models: ModelOption[]
  initialData: ProductEditorInitialData
  onSave: (
    productId: string,
    payload: {
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
        quantity?: number
        lowStockThreshold?: number
        isDefault?: boolean
        isActive?: boolean
        optionValues: Record<string, string>
      }>
      images: UploadedImage[]
    },
  ) => Promise<ProductEditorInitialData | null | void>
  onDelete?: () => Promise<void>
}

const STEP_DEFINITIONS = [
  {
    id: "basics",
    title: "Basics",
    description: "Core product details and publishing status.",
  },
  {
    id: "organization",
    title: "Organization",
    description: "Brand, categories, and model assignment.",
  },
  {
    id: "media",
    title: "Media",
    description: "Images, alt text, and optional variant mapping.",
  },
  {
    id: "options",
    title: "Options",
    description: "Product option names and values.",
  },
  {
    id: "variants",
    title: "Variants",
    description: "Sellable combinations, pricing, and stock.",
  },
  {
    id: "review",
    title: "Review",
    description: "SEO and activation review.",
  },
] as const

function createEmptyVariant(): VariantEditorValue {
  return {
    key: crypto.randomUUID(),
    sku: "",
    name: "Default",
    price: "0.00",
    compareAtPrice: "",
    costPrice: "",
    weight: "",
    quantity: 0,
    lowStockThreshold: 5,
    isDefault: true,
    isActive: true,
    optionValues: {},
  }
}

function createEmptyOption(): OptionEditorValue {
  return {
    key: crypto.randomUUID(),
    name: "",
    values: [],
  }
}

function createEmptyOptionValue(): OptionValueEditorValue {
  return {
    key: crypto.randomUUID(),
    value: "",
  }
}

function buildOptionKey(optionValues: Record<string, string>) {
  return Object.entries(optionValues)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}:${value}`)
    .join("|")
}

function buildCombinations(options: Array<{ name: string; values: string[] }>) {
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

function normalizeNumberInput(value: string, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback
  }

  return parsed
}

export function ProductEditorForm({
  categories,
  brands,
  models,
  initialData,
  onSave,
  onDelete,
}: ProductEditorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(0)
  const [categoryIds, setCategoryIds] = useState<string[]>(() =>
    Array.from(
      new Set(
        initialData.categories.map((category) => category.id) ??
          (initialData.primaryCategoryId
            ? [initialData.primaryCategoryId]
            : []),
      ),
    ),
  )
  const [images, setImages] = useState<UploadedImage[]>(() =>
    (initialData.images ?? []).map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText || undefined,
      variantId: image.variantId || null,
      isPrimary: image.isPrimary,
    })),
  )
  const [options, setOptions] = useState<OptionEditorValue[]>(
    () =>
      initialData.options.map((option) => ({
        key: option.id,
        name: option.name,
        values: option.values.map((value) => ({
          key: value.id,
          value: value.value,
        })),
      })) ?? [],
  )
  const [variants, setVariants] = useState<VariantEditorValue[]>(() =>
    initialData.variants.length
      ? initialData.variants.map((variant) => ({
          key: variant.id,
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice || "",
          costPrice: variant.costPrice || "",
          weight: variant.weight || "",
          quantity: variant.inventory?.quantity ?? 0,
          lowStockThreshold: variant.inventory?.lowStockThreshold ?? 5,
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
      name: initialData.name,
      slug: initialData.slug,
      shortDescription: initialData.shortDescription || "",
      description: initialData.description || "",
      brandId: initialData.brandId || "",
      primaryCategoryId: initialData.primaryCategoryId || "",
      modelId: initialData.modelId || "",
      status: initialData.status,
      isFeatured: initialData.isFeatured,
      metaTitle: initialData.metaTitle || "",
      metaDescription: initialData.metaDescription || "",
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

  const selectedCategoryIds = useMemo(
    () =>
      Array.from(
        new Set(
          watchedValues.primaryCategoryId
            ? [watchedValues.primaryCategoryId, ...categoryIds]
            : categoryIds,
        ),
      ),
    [categoryIds, watchedValues.primaryCategoryId],
  )

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

  const availableOptionTemplateNames = useMemo(() => {
    const templates = categories
      .filter((category) => selectedCategoryIds.includes(category.id))
      .flatMap((category) => category.optionTemplates)

    const seen = new Set<string>()

    return templates
      .filter((template) => {
        const normalized = normalizeEntityName(template.name)
        if (seen.has(normalized)) {
          return false
        }

        seen.add(normalized)
        return true
      })
      .sort((left, right) => left.sortOrder - right.sortOrder)
  }, [categories, selectedCategoryIds])

  const normalizedOptions = useMemo(
    () =>
      options
        .map((option) => ({
          name: option.name.trim(),
          values: option.values
            .map((value) => value.value.trim())
            .filter(Boolean),
        }))
        .filter((option) => option.name.length > 0),
    [options],
  )

  const optionNameDuplicates = useMemo(() => {
    const counts = new Map<string, number>()

    for (const option of normalizedOptions) {
      const normalizedName = normalizeEntityName(option.name)
      counts.set(normalizedName, (counts.get(normalizedName) ?? 0) + 1)
    }

    return normalizedOptions.filter(
      (option) => (counts.get(normalizeEntityName(option.name)) ?? 0) > 1,
    )
  }, [normalizedOptions])

  const optionWarnings = useMemo(() => {
    const warnings: string[] = []

    if (optionNameDuplicates.length > 0) {
      warnings.push("Option names must be unique.")
    }

    if (normalizedOptions.some((option) => option.values.length === 0)) {
      warnings.push("Every option must include at least one value.")
    }

    return warnings
  }, [normalizedOptions, optionNameDuplicates])

  useEffect(() => {
    const optionInputs = normalizedOptions.filter(
      (option) => option.values.length > 0,
    )

    if (optionInputs.length === 0) {
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

    const combinations = buildCombinations(optionInputs)

    setVariants((current) => {
      const existingMap = new Map(
        current.map((variant) => [
          buildOptionKey(variant.optionValues),
          variant,
        ]),
      )

      const nextVariants = combinations.map((combination, index) => {
        const existing = existingMap.get(buildOptionKey(combination))

        return {
          key: existing?.key || crypto.randomUUID(),
          id: existing?.id,
          sku: existing?.sku || "",
          name: existing?.name || buildVariantName(combination),
          price: existing?.price || "0.00",
          compareAtPrice: existing?.compareAtPrice || "",
          costPrice: existing?.costPrice || "",
          weight: existing?.weight || "",
          quantity: existing?.quantity ?? 0,
          lowStockThreshold: existing?.lowStockThreshold ?? 5,
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
  }, [normalizedOptions])

  const variantSummaries = useMemo(
    () =>
      variants
        .filter((variant) => Boolean(variant.id))
        .map((variant) => ({
          id: variant.id!,
          name: variant.name || buildVariantName(variant.optionValues),
        })),
    [variants],
  )

  const warnings = useMemo(() => {
    const items = [...optionWarnings]

    if (!images.some((image) => image.isPrimary)) {
      items.push("No primary image is selected yet.")
    }

    const skuCounts = new Map<string, number>()
    for (const variant of variants) {
      const sku = variant.sku.trim()
      if (!sku) {
        continue
      }

      skuCounts.set(sku, (skuCounts.get(sku) ?? 0) + 1)
    }

    if (variants.some((variant) => variant.sku.trim().length === 0)) {
      items.push("Some variants do not have an SKU yet.")
    }

    if ([...skuCounts.values()].some((count) => count > 1)) {
      items.push("Variant SKUs must be unique.")
    }

    if (
      variants.some(
        (variant) =>
          variant.isActive &&
          normalizeNumberInput(`${variant.quantity}`, 0) === 0,
      )
    ) {
      items.push("Some active variants have zero starting stock.")
    }

    return items
  }, [images, optionWarnings, variants])

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

  const hydrateFromSavedProduct = (savedProduct: ProductEditorInitialData) => {
    setCategoryIds(
      Array.from(
        new Set(
          savedProduct.categories.map((category) => category.id) ??
            (savedProduct.primaryCategoryId
              ? [savedProduct.primaryCategoryId]
              : []),
        ),
      ),
    )
    setOptions(
      savedProduct.options.map((option) => ({
        key: option.id,
        name: option.name,
        values: option.values.map((value) => ({
          key: value.id,
          value: value.value,
        })),
      })),
    )
    setVariants(
      savedProduct.variants.map((variant) => ({
        key: variant.id,
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice || "",
        costPrice: variant.costPrice || "",
        weight: variant.weight || "",
        quantity: variant.inventory?.quantity ?? 0,
        lowStockThreshold: variant.inventory?.lowStockThreshold ?? 5,
        isDefault: variant.isDefault,
        isActive: variant.isActive,
        optionValues: Object.fromEntries(
          (variant.selections ?? []).map((selection) => [
            selection.optionName,
            selection.optionValue,
          ]),
        ),
      })),
    )
    setImages(
      (savedProduct.images ?? []).map((image) => ({
        id: image.id,
        url: image.url,
        altText: image.altText || undefined,
        variantId: image.variantId || null,
        isPrimary: image.isPrimary,
      })),
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

  const addOption = () => {
    setOptions((current) => [...current, createEmptyOption()])
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

  const addOptionValue = (optionKey: string) => {
    setOptions((current) =>
      current.map((option) =>
        option.key === optionKey
          ? { ...option, values: [...option.values, createEmptyOptionValue()] }
          : option,
      ),
    )
  }

  const updateOptionValue = (
    optionKey: string,
    valueKey: string,
    nextValue: string,
  ) => {
    setOptions((current) =>
      current.map((option) =>
        option.key === optionKey
          ? {
              ...option,
              values: option.values.map((value) =>
                value.key === valueKey ? { ...value, value: nextValue } : value,
              ),
            }
          : option,
      ),
    )
  }

  const removeOptionValue = (optionKey: string, valueKey: string) => {
    setOptions((current) =>
      current.map((option) =>
        option.key === optionKey
          ? {
              ...option,
              values: option.values.filter((value) => value.key !== valueKey),
            }
          : option,
      ),
    )
  }

  const toggleCategory = (categoryId: string, checked: boolean) => {
    setCategoryIds((current) =>
      checked
        ? Array.from(new Set([...current, categoryId]))
        : current.filter((id) => id !== categoryId),
    )
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

  const buildPayload = (data: ProductFormData) => ({
    name: data.name,
    slug: data.slug,
    description: data.description || undefined,
    shortDescription: data.shortDescription || undefined,
    brandId: data.brandId || null,
    primaryCategoryId: data.primaryCategoryId || null,
    modelId: data.modelId || null,
    categoryIds: selectedCategoryIds,
    status: data.status,
    isFeatured: data.isFeatured,
    metaTitle: data.metaTitle || undefined,
    metaDescription: data.metaDescription || undefined,
    options: normalizedOptions.map((option) => ({
      name: option.name,
      values: option.values,
    })),
    variants: variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku || undefined,
      name: variant.name || undefined,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice || undefined,
      costPrice: variant.costPrice || undefined,
      weight: variant.weight || undefined,
      quantity: variant.quantity,
      lowStockThreshold: variant.lowStockThreshold,
      isDefault: variant.isDefault,
      isActive: variant.isActive,
      optionValues: variant.optionValues,
    })),
    images,
  })

  const persistProduct = async (data: ProductFormData) => {
    if (optionWarnings.length > 0) {
      throw new Error(optionWarnings[0])
    }

    const savedProduct = await onSave(initialData.id, buildPayload(data))
    if (savedProduct) {
      hydrateFromSavedProduct(savedProduct)
    }
  }

  const handleContinue = async (data: ProductFormData) => {
    startTransition(async () => {
      try {
        if (currentStep < STEP_DEFINITIONS.length - 1) {
          await persistProduct(data)
          setCurrentStep((step) =>
            Math.min(step + 1, STEP_DEFINITIONS.length - 1),
          )
          toast.success("Product updated")
          return
        }

        await persistProduct(data)
        toast.success("Product updated successfully!")
        router.push("/ops/products")
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        )
      }
    })
  }

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
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
              {errors.name ? (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" {...register("slug")} />
              {errors.slug ? (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              ) : null}
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
              <Textarea
                id="description"
                rows={5}
                {...register("description")}
              />
            </div>

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
          </CardContent>
        </Card>
      )
    }

    if (currentStep === 1) {
      return (
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
                Brand and primary category are locked to the selected model.
                Clear the model if you need to change them.
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="isFeatured">Featured</Label>
                <p className="text-xs text-muted-foreground">
                  Highlight this product on the storefront.
                </p>
              </div>
              <Switch
                id="isFeatured"
                checked={watchedValues.isFeatured}
                onCheckedChange={(checked) => setValue("isFeatured", checked)}
              />
            </div>

            <div className="space-y-3">
              <Label>Additional Categories</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {categories.map((category) => {
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
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (currentStep === 2) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ImageUpload
              value={images}
              onChange={setImages}
              maxImages={8}
              folder="products"
            />

            {images.length > 0 ? (
              <FieldSet>
                <FieldGroup>
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="rounded-lg border p-4 space-y-4"
                    >
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>Image {index + 1}</FieldTitle>
                          <FieldDescription>
                            Edit alt text and optionally map this image to a
                            specific variant.
                          </FieldDescription>
                        </FieldContent>
                        {image.isPrimary ? <Badge>Primary</Badge> : null}
                      </Field>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Alt Text</Label>
                          <Input
                            value={image.altText || ""}
                            onChange={(event) =>
                              setImages((current) =>
                                current.map((currentImage) =>
                                  currentImage.id === image.id
                                    ? {
                                        ...currentImage,
                                        altText: event.target.value,
                                      }
                                    : currentImage,
                                ),
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Variant Mapping</Label>
                          <Select
                            value={image.variantId || "__all__"}
                            onValueChange={(value) =>
                              setImages((current) =>
                                current.map((currentImage) =>
                                  currentImage.id === image.id
                                    ? {
                                        ...currentImage,
                                        variantId:
                                          value === "__all__" ? null : value,
                                      }
                                    : currentImage,
                                ),
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__all__">
                                Product-wide image
                              </SelectItem>
                              {variantSummaries.map((variant) => (
                                <SelectItem key={variant.id} value={variant.id}>
                                  {variant.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </FieldGroup>
              </FieldSet>
            ) : null}
          </CardContent>
        </Card>
      )
    }

    if (currentStep === 3) {
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Options</CardTitle>
              <p className="text-sm text-muted-foreground">
                Option names are suggested from the selected categories, but you
                can still create product-specific options.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={addOption}>
              <Plus className="mr-2 h-4 w-4" />
              Add option
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {availableOptionTemplateNames.length > 0 ? (
                availableOptionTemplateNames.map((template) => (
                  <Badge key={template.id} variant="outline">
                    {template.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  No category templates yet. Add custom options as needed.
                </span>
              )}
            </div>

            {options.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No options defined. The product will use a single default
                variant.
              </div>
            ) : (
              <Accordion
                type="multiple"
                defaultValue={options.map((option) => option.key)}
              >
                {options.map((option, index) => {
                  const optionNameChoices = [
                    ...availableOptionTemplateNames.map((template) => ({
                      id: template.name,
                      name: template.name,
                    })),
                    ...(option.name &&
                    !availableOptionTemplateNames.some(
                      (template) =>
                        normalizeEntityName(template.name) ===
                        normalizeEntityName(option.name),
                    )
                      ? [{ id: option.name, name: option.name }]
                      : []),
                  ]

                  return (
                    <AccordionItem key={option.key} value={option.key}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-col text-left">
                          <span className="font-medium">
                            {option.name || `Option ${index + 1}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {
                              option.values.filter((value) =>
                                value.value.trim(),
                              ).length
                            }{" "}
                            values
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <Label>Option Name</Label>
                            <CreatableEntityCombobox
                              value={option.name}
                              options={optionNameChoices}
                              placeholder="Select or create option name"
                              searchPlaceholder="Search option names..."
                              emptyLabel="No matching option names"
                              createLabel={(query) =>
                                `Use custom option "${query.trim()}"`
                              }
                              onValueChange={(value) =>
                                updateOption(option.key, { name: value })
                              }
                              onCreate={async (query) =>
                                updateOption(option.key, {
                                  name: query.trim(),
                                })
                              }
                              canCreate={(query) =>
                                Boolean(query.trim()) &&
                                !optionNameChoices.some(
                                  (choice) =>
                                    normalizeEntityName(choice.name) ===
                                    normalizeEntityName(query),
                                )
                              }
                              allowClear={false}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(option.key)}
                            aria-label={`Remove option ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <FieldSet>
                          <FieldGroup>
                            <Field
                              orientation="horizontal"
                              className="items-center"
                            >
                              <FieldContent>
                                <FieldTitle>Values</FieldTitle>
                                <FieldDescription>
                                  Add each allowed value as a separate row.
                                </FieldDescription>
                              </FieldContent>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => addOptionValue(option.key)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add value
                              </Button>
                            </Field>

                            {option.values.length === 0 ? (
                              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                Add at least one value to generate variants.
                              </div>
                            ) : (
                              option.values.map((value, valueIndex) => (
                                <div
                                  key={value.key}
                                  className="flex items-center gap-3 rounded-lg border p-3"
                                >
                                  <Input
                                    value={value.value}
                                    onChange={(event) =>
                                      updateOptionValue(
                                        option.key,
                                        value.key,
                                        event.target.value,
                                      )
                                    }
                                    placeholder={`Value ${valueIndex + 1}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeOptionValue(option.key, value.key)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))
                            )}
                          </FieldGroup>
                        </FieldSet>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )
    }

    if (currentStep === 4) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Variants and Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              {variants.length} sellable variant
              {variants.length === 1 ? "" : "s"} are derived from the current
              option values.
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Combination</TableHead>
                    <TableHead>Variant Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Compare At</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => (
                    <TableRow key={variant.key}>
                      <TableCell className="min-w-40">
                        {Object.keys(variant.optionValues).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(variant.optionValues).map(
                              ([name, value]) => (
                                <Badge
                                  key={`${variant.key}-${name}`}
                                  variant="outline"
                                >
                                  {name}: {value}
                                </Badge>
                              ),
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">Default</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={variant.name}
                          onChange={(event) =>
                            updateVariant(variant.key, {
                              name: event.target.value,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={variant.sku}
                          onChange={(event) =>
                            updateVariant(variant.key, {
                              sku: event.target.value,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={variant.price}
                          onChange={(event) =>
                            updateVariant(variant.key, {
                              price: event.target.value,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={variant.compareAtPrice}
                          onChange={(event) =>
                            updateVariant(variant.key, {
                              compareAtPrice: event.target.value,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={variant.costPrice}
                          onChange={(event) =>
                            updateVariant(variant.key, {
                              costPrice: event.target.value,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={variant.weight}
                          onChange={(event) =>
                            updateVariant(variant.key, {
                              weight: event.target.value,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={variant.quantity}
                          onChange={(event) =>
                            updateVariant(variant.key, {
                              quantity: normalizeNumberInput(
                                event.target.value,
                                0,
                              ),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={variant.lowStockThreshold}
                          onChange={(event) =>
                            updateVariant(variant.key, {
                              lowStockThreshold: normalizeNumberInput(
                                event.target.value,
                                5,
                              ),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={variant.isDefault}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDefaultVariant(variant.key)
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={variant.isActive}
                          onCheckedChange={(checked) =>
                            updateVariant(variant.key, { isActive: checked })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-lg font-semibold">
                  {selectedCategoryIds.length}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Options</p>
                <p className="text-lg font-semibold">
                  {normalizedOptions.length}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Variants</p>
                <p className="text-lg font-semibold">{variants.length}</p>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                {warnings.length === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <p className="font-medium">Readiness Check</p>
              </div>

              {warnings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No blocking warnings detected. You can save or activate this
                  product.
                </p>
              ) : (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(handleContinue)} className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Editing product</Badge>
              <span className="text-sm text-muted-foreground">
                Product ID: {initialData.id}
              </span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-6">
            {STEP_DEFINITIONS.map((step, index) => {
              const isActive = currentStep === index
              const isCompleted = index < currentStep

              return (
                <button
                  key={step.id}
                  type="button"
                  className={`rounded-lg border p-3 text-left transition ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : isCompleted
                        ? "border-green-200 bg-green-50"
                        : "border-border"
                  }`}
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index)
                    }
                  }}
                >
                  <p className="text-xs text-muted-foreground">
                    Step {index + 1}
                  </p>
                  <p className="font-medium">{step.title}</p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {renderStepContent()}

      {warnings.length > 0 && currentStep < STEP_DEFINITIONS.length - 1 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {warnings[0]}
        </div>
      ) : null}

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
            {currentStep === 0 ? "Cancel" : "Exit"}
          </Button>
          {currentStep > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
              disabled={isPending}
            >
              Back
            </Button>
          ) : null}
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {currentStep === STEP_DEFINITIONS.length - 1 ? (
              "Save Product"
            ) : (
              <>
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

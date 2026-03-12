"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
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
import { useCreateCategoryMutation } from "@/hooks/admin/use-category-mutations"
import { cn, slugify } from "@/lib/utils"
import { normalizeEntityName } from "@/lib/utils/catalog"

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(100),
  description: z.string().max(1000).optional(),
  image: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0, "Sort order must be 0 or greater"),
  isActive: z.boolean().default(true),
  showInProductMenu: z.boolean().default(true),
  productMenuPriority: z
    .number()
    .int()
    .min(0, "Menu priority must be 0 or greater"),
  metaTitle: z
    .string()
    .max(100, "Meta title must be 100 characters or less")
    .optional(),
  metaDescription: z
    .string()
    .max(300, "Meta description must be 300 characters or less")
    .optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface Category {
  id: string
  name: string
  slug: string
  level: number
  path: string
}

interface NewCategoryFormProps {
  categories: Category[]
  onSuccess?: () => void
  onCancel?: () => void
  onDirtyChange?: (isDirty: boolean) => void
  onSubmittingChange?: (isSubmitting: boolean) => void
}

type StepKey = "basics" | "variants" | "storefront" | "seo"

interface WizardStep {
  key: StepKey
  label: string
  description: string
}

interface VariantNameRow {
  id: string
  value: string
}

const STEPS: WizardStep[] = [
  {
    key: "basics",
    label: "Basics",
    description: "Name the category and place it in the catalog hierarchy.",
  },
  {
    key: "variants",
    label: "Variant Names",
    description: "Add reusable option names like Color, Storage, or RAM.",
  },
  {
    key: "storefront",
    label: "Storefront",
    description: "Control storefront visibility, ordering, and menu behavior.",
  },
  {
    key: "seo",
    label: "SEO",
    description: "Add search metadata and save the category.",
  },
]

function createVariantNameRow(): VariantNameRow {
  return {
    id: crypto.randomUUID(),
    value: "",
  }
}

function parseIntegerInput(value: string) {
  if (value === "") {
    return 0
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeVariantRows(rows: VariantNameRow[]) {
  const seen = new Set<string>()

  return rows
    .map((row, index) => ({
      id: row.id,
      name: row.value.trim(),
      normalizedName: normalizeEntityName(row.value),
      sortOrder: index,
    }))
    .filter((row) => {
      if (!row.name || !row.normalizedName || seen.has(row.normalizedName)) {
        return false
      }

      seen.add(row.normalizedName)
      return true
    })
    .map((row, index) => ({
      id: row.id,
      name: row.name,
      sortOrder: index,
    }))
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {STEPS.map((step, index) => {
        const isActive = index === currentStep
        const isComplete = index < currentStep

        return (
          <div
            key={step.key}
            className={cn(
              "rounded-2xl border px-3 py-3 transition-colors",
              isActive && "border-foreground/20 bg-foreground/[0.04]",
              isComplete && "border-emerald-200 bg-emerald-50",
              !isActive && !isComplete && "border-border/70 bg-muted/30",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isActive && "border-foreground/20 bg-background",
                  isComplete &&
                    "border-emerald-200 bg-emerald-100 text-emerald-700",
                  !isActive &&
                    !isComplete &&
                    "border-border bg-background text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="size-4" /> : index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{step.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Step {index + 1}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {eyebrow}
      </p>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function NewCategoryForm({
  categories,
  onSuccess,
  onCancel,
  onDirtyChange,
  onSubmittingChange,
}: NewCategoryFormProps) {
  const createCategoryMutation = useCreateCategoryMutation()
  const [currentStep, setCurrentStep] = useState(0)
  const [variantRows, setVariantRows] = useState<VariantNameRow[]>([])

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image: "",
      parentId: undefined,
      sortOrder: 0,
      isActive: true,
      showInProductMenu: true,
      productMenuPriority: 0,
      metaTitle: "",
      metaDescription: "",
    },
  })

  const {
    control,
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    trigger,
    formState: { errors, isDirty },
  } = form

  const name = useWatch({ control, name: "name" })
  const slug = useWatch({ control, name: "slug" })
  const parentId = useWatch({ control, name: "parentId" })
  const isActive = useWatch({ control, name: "isActive" })
  const showInProductMenu = useWatch({
    control,
    name: "showInProductMenu",
  })

  const step = STEPS[currentStep]
  const isLastStep = currentStep === STEPS.length - 1
  const hasUnsavedVariantRows = variantRows.length > 0

  const duplicateVariantRowIds = useMemo(() => {
    const counts = new Map<string, number>()

    for (const row of variantRows) {
      const normalizedName = normalizeEntityName(row.value)
      if (!normalizedName) {
        continue
      }

      counts.set(normalizedName, (counts.get(normalizedName) ?? 0) + 1)
    }

    return new Set(
      variantRows
        .filter((row) => {
          const normalizedName = normalizeEntityName(row.value)
          return normalizedName ? (counts.get(normalizedName) ?? 0) > 1 : false
        })
        .map((row) => row.id),
    )
  }, [variantRows])

  const isFormDirty = isDirty || hasUnsavedVariantRows

  useEffect(() => {
    onDirtyChange?.(isFormDirty)
  }, [isFormDirty, onDirtyChange])

  useEffect(() => {
    onSubmittingChange?.(createCategoryMutation.isPending)
  }, [createCategoryMutation.isPending, onSubmittingChange])

  const handleNameChange = (nextName: string) => {
    const currentSlug = getValues("slug")

    if (!currentSlug || currentSlug === slugify(name || "")) {
      setValue("slug", slugify(nextName), { shouldDirty: true })
    }
  }

  const appendVariantRow = () => {
    setVariantRows((currentRows) => [...currentRows, createVariantNameRow()])
  }

  const updateVariantRow = (rowId: string, value: string) => {
    setVariantRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? { ...row, value } : row)),
    )
  }

  const removeVariantRow = (rowId: string) => {
    setVariantRows((currentRows) =>
      currentRows.filter((row) => row.id !== rowId),
    )
  }

  const validateStep = async (stepIndex: number) => {
    if (stepIndex === 0) {
      return trigger(["name", "slug", "description", "parentId"])
    }

    if (stepIndex === 1) {
      if (duplicateVariantRowIds.size > 0) {
        toast.error("Variant names must be unique.")
        return false
      }

      return true
    }

    if (stepIndex === 2) {
      return trigger([
        "image",
        "sortOrder",
        "isActive",
        "showInProductMenu",
        "productMenuPriority",
      ])
    }

    return trigger(["metaTitle", "metaDescription"])
  }

  const goToNextStep = async () => {
    const isStepValid = await validateStep(currentStep)
    if (!isStepValid) {
      return
    }

    setCurrentStep((stepIndex) => Math.min(stepIndex + 1, STEPS.length - 1))
  }

  const goToPreviousStep = () => {
    setCurrentStep((stepIndex) => Math.max(stepIndex - 1, 0))
  }

  const onSubmit = async (data: CategoryFormData) => {
    const isStepValid = await validateStep(currentStep)
    if (!isStepValid) {
      return
    }

    try {
      await createCategoryMutation.mutateAsync({
        ...data,
        image: data.image || null,
        parentId: data.parentId ?? null,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined,
        optionTemplates: normalizeVariantRows(variantRows).map((row) => ({
          name: row.name,
          sortOrder: row.sortOrder,
        })),
      })

      toast.success("Category created successfully.")
      reset()
      setVariantRows([])
      setCurrentStep(0)
      onDirtyChange?.(false)
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create category.",
      )
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="shrink-0 border-b bg-background px-5 py-5 sm:px-7">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Step {currentStep + 1} of {STEPS.length}
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Create Category
                </h1>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onCancel}
              aria-label="Close category wizard"
            >
              <X className="size-4" />
            </Button>
          </div>

          <StepIndicator currentStep={currentStep} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
        <div className="mx-auto w-full max-w-none">
          {currentStep === 0 ? (
            <div className="space-y-8">
              <SectionHeader
                eyebrow="Step 1"
                title="Category Basics"
                description="Set the category name, slug, optional parent category, and description before moving on."
              />

              <div className="space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Category Name *</Label>
                  <Input
                    id="category-name"
                    {...register("name")}
                    value={name ?? ""}
                    onChange={(event) => {
                      register("name").onChange(event)
                      handleNameChange(event.target.value)
                    }}
                    placeholder="Smartphones"
                  />
                  {errors.name ? (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category-slug">Slug *</Label>
                    <Input
                      id="category-slug"
                      {...register("slug")}
                      value={slug ?? ""}
                      placeholder="smartphones"
                    />
                    <p className="text-xs text-muted-foreground">
                      This is used in URLs and storefront category links.
                    </p>
                    {errors.slug ? (
                      <p className="text-sm text-destructive">
                        {errors.slug.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category-parent">Parent Category</Label>
                    <Select
                      value={parentId ?? "none"}
                      onValueChange={(value) =>
                        setValue(
                          "parentId",
                          value === "none" ? undefined : value,
                          {
                            shouldDirty: true,
                          },
                        )
                      }
                    >
                      <SelectTrigger id="category-parent">
                        <SelectValue placeholder="No parent category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No parent category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.level > 0
                              ? "— ".repeat(category.level)
                              : ""}
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Leave empty to create a top-level category.
                    </p>
                    {errors.parentId ? (
                      <p className="text-sm text-destructive">
                        {errors.parentId.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-description">Description</Label>
                  <Textarea
                    id="category-description"
                    rows={6}
                    {...register("description")}
                    placeholder="Write a short internal or storefront description for this category."
                  />
                  {errors.description ? (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="space-y-8">
              <SectionHeader
                eyebrow="Step 2"
                title="Variant Names"
                description="Add the reusable option names products in this category can use later, such as Color, Storage, or RAM."
              />

              <div className="space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
                <div className="flex flex-col gap-4 rounded-2xl border border-dashed bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Reusable names</p>
                    <p className="text-sm text-muted-foreground">
                      Add as many variant names as you need. Empty rows are
                      ignored when the category is saved.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={appendVariantRow}
                  >
                    <Plus className="mr-2 size-4" />
                    Add variant name
                  </Button>
                </div>

                {variantRows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed px-6 py-10 text-center">
                    <p className="text-sm font-medium">
                      No variant names added yet
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Start with common option names like Color, Size, Storage,
                      or RAM.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {variantRows.map((row, index) => {
                      const hasDuplicate = duplicateVariantRowIds.has(row.id)

                      return (
                        <div
                          key={row.id}
                          className="rounded-2xl border border-border/70 bg-background p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-2">
                              <Label htmlFor={`variant-name-${row.id}`}>
                                Variant Name {index + 1}
                              </Label>
                              <Input
                                id={`variant-name-${row.id}`}
                                value={row.value}
                                onChange={(event) =>
                                  updateVariantRow(row.id, event.target.value)
                                }
                                placeholder="Color"
                              />
                              {hasDuplicate ? (
                                <p className="text-sm text-destructive">
                                  Duplicate variant names are not allowed.
                                </p>
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="mt-6 shrink-0"
                              onClick={() => removeVariantRow(row.id)}
                              aria-label={`Remove variant name ${index + 1}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-8">
              <SectionHeader
                eyebrow="Step 3"
                title="Storefront Settings"
                description="Set image, ordering, and menu visibility defaults for this category."
              />

              <div className="space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
                <div className="space-y-2">
                  <Label htmlFor="category-image">Image URL</Label>
                  <Input
                    id="category-image"
                    {...register("image")}
                    placeholder="https://example.com/images/smartphones.jpg"
                  />
                  {errors.image ? (
                    <p className="text-sm text-destructive">
                      {errors.image.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category-sort-order">Sort Order</Label>
                    <Input
                      id="category-sort-order"
                      type="number"
                      inputMode="numeric"
                      {...register("sortOrder", {
                        setValueAs: parseIntegerInput,
                      })}
                    />
                    {errors.sortOrder ? (
                      <p className="text-sm text-destructive">
                        {errors.sortOrder.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category-menu-priority">
                      Product Menu Priority
                    </Label>
                    <Input
                      id="category-menu-priority"
                      type="number"
                      inputMode="numeric"
                      disabled={!showInProductMenu}
                      {...register("productMenuPriority", {
                        setValueAs: parseIntegerInput,
                      })}
                    />
                    {errors.productMenuPriority ? (
                      <p className="text-sm text-destructive">
                        {errors.productMenuPriority.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-border/70 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="category-active">Active</Label>
                      <p className="text-sm text-muted-foreground">
                        Inactive categories stay hidden from the storefront.
                      </p>
                    </div>
                    <Switch
                      id="category-active"
                      checked={isActive}
                      onCheckedChange={(checked) =>
                        setValue("isActive", checked, { shouldDirty: true })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="category-product-menu">
                        Show In Product Menu
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enable this to surface the category in storefront
                        product navigation.
                      </p>
                    </div>
                    <Switch
                      id="category-product-menu"
                      checked={showInProductMenu}
                      onCheckedChange={(checked) =>
                        setValue("showInProductMenu", checked, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-8">
              <SectionHeader
                eyebrow="Step 4"
                title="SEO Properties"
                description="Add optional search metadata. The category is created only when you press Save."
              />

              <div className="space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
                <div className="space-y-2">
                  <Label htmlFor="category-meta-title">Meta Title</Label>
                  <Input
                    id="category-meta-title"
                    {...register("metaTitle")}
                    placeholder="Buy smartphones online"
                  />
                  {errors.metaTitle ? (
                    <p className="text-sm text-destructive">
                      {errors.metaTitle.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-meta-description">
                    Meta Description
                  </Label>
                  <Textarea
                    id="category-meta-description"
                    rows={6}
                    {...register("metaDescription")}
                    placeholder="Explore our latest smartphone collection with multiple storage, RAM, and color options."
                  />
                  {errors.metaDescription ? (
                    <p className="text-sm text-destructive">
                      {errors.metaDescription.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t bg-background px-5 py-4 sm:px-7">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            {currentStep > 0 ? (
              <Button type="button" variant="ghost" onClick={goToPreviousStep}>
                <ArrowLeft className="mr-2 size-4" />
                Previous
              </Button>
            ) : null}
          </div>

          {isLastStep ? (
            <Button
              key="save-category"
              type="button"
              disabled={createCategoryMutation.isPending}
              className="min-w-28"
              onClick={() => void handleSubmit(onSubmit)()}
            >
              {createCategoryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          ) : (
            <Button key="next-step" type="button" onClick={goToNextStep}>
              Next
              <ArrowRight className="ml-2 size-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

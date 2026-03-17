"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Loader2, X } from "lucide-react"
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
import { slugify } from "@/lib/utils"
import { useCreateProductModelGroupMutation } from "@/services/mutations/use-product-model-group-mutations"

import {
  CreateWizardSectionHeader,
  type CreateWizardStep,
  CreateWizardStepIndicator,
  parseIntegerInput,
} from "../../catalog-setup/_components/create-wizard-primitives"

const modelSchema = z.object({
  name: z.string().min(1, "Model name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  description: z.string().max(1000).optional(),
  primaryCategoryId: z.string().min(1, "Category is required"),
  brandId: z.string().min(1, "Brand is required"),
  metaTitle: z
    .string()
    .max(100, "Meta title must be 100 characters or less")
    .optional(),
  metaDescription: z
    .string()
    .max(300, "Meta description must be 300 characters or less")
    .optional(),
  showInProductMenu: z.boolean().default(true),
  navPriority: z
    .number()
    .int()
    .min(0, "Navigation priority must be 0 or greater"),
  isActive: z.boolean().default(true),
})

type ModelFormData = z.infer<typeof modelSchema>

interface CategoryOption {
  id: string
  name: string
  slug: string
}

interface BrandOption {
  id: string
  name: string
  slug: string
  categoryAssignments: Array<{
    categoryId: string
  }>
}

interface NewProductModelGroupWizardFormProps {
  categories: CategoryOption[]
  brands: BrandOption[]
  onSuccess?: () => void
  onCancel?: () => void
  onDirtyChange?: (isDirty: boolean) => void
  onSubmittingChange?: (isSubmitting: boolean) => void
}

const STEPS: CreateWizardStep[] = [
  {
    key: "basics",
    label: "Basics",
    description: "Set the model name, slug, and description.",
  },
  {
    key: "placement",
    label: "Catalog Placement",
    description: "Choose the brand and top-level category for this model.",
  },
  {
    key: "storefront",
    label: "Storefront",
    description: "Control storefront visibility and menu ordering.",
  },
  {
    key: "seo",
    label: "SEO",
    description: "Add search metadata and save the new model.",
  },
]

export function NewProductModelGroupWizardForm({
  categories,
  brands,
  onSuccess,
  onCancel,
  onDirtyChange,
  onSubmittingChange,
}: NewProductModelGroupWizardFormProps) {
  const createMutation = useCreateProductModelGroupMutation()
  const [currentStep, setCurrentStep] = useState(0)

  const form = useForm<ModelFormData>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      primaryCategoryId: "",
      brandId: "",
      metaTitle: "",
      metaDescription: "",
      showInProductMenu: true,
      navPriority: 0,
      isActive: true,
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

  const brandId = useWatch({
    control,
    name: "brandId",
  })
  const name = useWatch({
    control,
    name: "name",
  })
  const slug = useWatch({
    control,
    name: "slug",
  })
  const primaryCategoryId = useWatch({
    control,
    name: "primaryCategoryId",
  })
  const showInProductMenu = useWatch({
    control,
    name: "showInProductMenu",
  })
  const isActive = useWatch({
    control,
    name: "isActive",
  })

  const step = STEPS[currentStep]
  const isLastStep = currentStep === STEPS.length - 1

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    onSubmittingChange?.(createMutation.isPending)
  }, [createMutation.isPending, onSubmittingChange])

  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.id === brandId),
    [brandId, brands],
  )

  const availableCategories = useMemo(() => {
    if (!brandId) {
      return categories
    }

    return categories.filter((category) =>
      selectedBrand?.categoryAssignments.some(
        (assignment) => assignment.categoryId === category.id,
      ),
    )
  }, [brandId, categories, selectedBrand])

  const handleNameChange = (nextName: string) => {
    const currentSlug = getValues("slug")

    if (!currentSlug || currentSlug === slugify(name || "")) {
      setValue("slug", slugify(nextName), { shouldDirty: true })
    }
  }

  const validateStep = async (stepIndex: number) => {
    if (stepIndex === 0) {
      return trigger(["name", "slug", "description"])
    }

    if (stepIndex === 1) {
      return trigger(["brandId", "primaryCategoryId"])
    }

    if (stepIndex === 2) {
      return trigger(["showInProductMenu", "navPriority", "isActive"])
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

  const onSubmit = async (data: ModelFormData) => {
    const isStepValid = await validateStep(currentStep)
    if (!isStepValid) {
      return
    }

    try {
      await createMutation.mutateAsync({
        ...data,
        description: data.description || null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
      })

      toast.success("Model created successfully.")
      reset()
      setCurrentStep(0)
      onDirtyChange?.(false)
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create model.",
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
                  Create Model
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
              aria-label="Close model wizard"
            >
              <X className="size-4" />
            </Button>
          </div>

          <CreateWizardStepIndicator steps={STEPS} currentStep={currentStep} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
        <div className="mx-auto w-full max-w-none">
          {currentStep === 0 ? (
            <div className="space-y-8">
              <CreateWizardSectionHeader
                eyebrow="Step 1"
                title="Model Basics"
                description="Set the model name, slug, and description before choosing catalog placement."
              />

              <div className="space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
                <div className="space-y-2">
                  <Label htmlFor="model-name">Model Name *</Label>
                  <Input
                    id="model-name"
                    {...register("name")}
                    value={name ?? ""}
                    onChange={(event) => {
                      register("name").onChange(event)
                      handleNameChange(event.target.value)
                    }}
                    placeholder="iPhone 16"
                  />
                  {errors.name ? (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model-slug">Slug *</Label>
                  <Input
                    id="model-slug"
                    {...register("slug")}
                    value={slug ?? ""}
                    placeholder="smartphones-apple-iphone-16"
                  />
                  {errors.slug ? (
                    <p className="text-sm text-destructive">
                      {errors.slug.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model-description">Description</Label>
                  <Textarea
                    id="model-description"
                    rows={6}
                    {...register("description")}
                    placeholder="Write a short description for this model."
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
              <CreateWizardSectionHeader
                eyebrow="Step 2"
                title="Catalog Placement"
                description="Choose which brand and top-level category this model belongs to."
              />

              <div className="space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="model-brand">Brand *</Label>
                    <Select
                      value={brandId}
                      onValueChange={(value) => {
                        setValue("brandId", value, { shouldDirty: true })

                        const nextBrand = brands.find(
                          (brand) => brand.id === value,
                        )
                        if (
                          primaryCategoryId &&
                          !nextBrand?.categoryAssignments.some(
                            (assignment) =>
                              assignment.categoryId === primaryCategoryId,
                          )
                        ) {
                          setValue("primaryCategoryId", "", {
                            shouldDirty: true,
                          })
                        }
                      }}
                    >
                      <SelectTrigger id="model-brand">
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
                    {errors.brandId ? (
                      <p className="text-sm text-destructive">
                        {errors.brandId.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model-category">Top-Level Category *</Label>
                    <Select
                      value={primaryCategoryId}
                      onValueChange={(value) =>
                        setValue("primaryCategoryId", value, {
                          shouldDirty: true,
                        })
                      }
                    >
                      <SelectTrigger id="model-category">
                        <SelectValue
                          placeholder={
                            brandId
                              ? "Select an assigned category"
                              : "Select a brand first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Only categories assigned to the selected brand are
                      available here.
                    </p>
                    {errors.primaryCategoryId ? (
                      <p className="text-sm text-destructive">
                        {errors.primaryCategoryId.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                {brandId && availableCategories.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                    This brand is not assigned to any top-level category yet.
                    Assign the brand to a category first before creating models
                    under it.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-8">
              <CreateWizardSectionHeader
                eyebrow="Step 3"
                title="Storefront Settings"
                description="Set visibility and storefront navigation order for this model."
              />

              <div className="space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
                <div className="space-y-2">
                  <Label htmlFor="model-nav-priority">
                    Navigation Priority
                  </Label>
                  <Input
                    id="model-nav-priority"
                    type="number"
                    inputMode="numeric"
                    disabled={!showInProductMenu}
                    {...register("navPriority", {
                      setValueAs: parseIntegerInput,
                    })}
                  />
                  {errors.navPriority ? (
                    <p className="text-sm text-destructive">
                      {errors.navPriority.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 p-5">
                    <div className="space-y-1">
                      <Label htmlFor="model-show-in-menu">
                        Show In Product Menu
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Controls whether this model appears in the storefront
                        product menu.
                      </p>
                    </div>
                    <Switch
                      id="model-show-in-menu"
                      checked={showInProductMenu}
                      onCheckedChange={(checked) =>
                        setValue("showInProductMenu", checked, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-border/70 p-5">
                    <div className="space-y-1">
                      <Label htmlFor="model-active">Active</Label>
                      <p className="text-sm text-muted-foreground">
                        Inactive models are hidden from the storefront.
                      </p>
                    </div>
                    <Switch
                      id="model-active"
                      checked={isActive}
                      onCheckedChange={(checked) =>
                        setValue("isActive", checked, { shouldDirty: true })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-8">
              <CreateWizardSectionHeader
                eyebrow="Step 4"
                title="SEO"
                description="Add optional search metadata. The model is created only when you press Save."
              />

              <div className="space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
                <div className="space-y-2">
                  <Label htmlFor="model-meta-title">Meta Title</Label>
                  <Input
                    id="model-meta-title"
                    {...register("metaTitle")}
                    placeholder="Apple iPhone 16"
                  />
                  {errors.metaTitle ? (
                    <p className="text-sm text-destructive">
                      {errors.metaTitle.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model-meta-description">
                    Meta Description
                  </Label>
                  <Textarea
                    id="model-meta-description"
                    rows={6}
                    {...register("metaDescription")}
                    placeholder="Explore Apple iPhone 16 model options and specifications."
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
              key="save-model"
              type="button"
              disabled={createMutation.isPending}
              className="min-w-28"
              onClick={() => void handleSubmit(onSubmit)()}
            >
              {createMutation.isPending ? (
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

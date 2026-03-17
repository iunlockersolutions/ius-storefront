"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import {
  CreateWizardSectionHeader,
  type CreateWizardStep,
  CreateWizardStepIndicator,
  parseIntegerInput,
} from "@/components/admin/catalog-setup/create-wizard-primitives"
import { ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useCreateBrandMutation } from "@/services/mutations/use-brand-mutations"
import { slugify } from "@/lib/utils"

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  description: z.string().max(1000).optional(),
  websiteUrl: z
    .string()
    .url("Enter a valid website URL")
    .optional()
    .or(z.literal("")),
  sortOrder: z.number().int().min(0, "Sort order must be 0 or greater"),
  isActive: z.boolean().default(true),
  metaTitle: z
    .string()
    .max(100, "Meta title must be 100 characters or less")
    .optional(),
  metaDescription: z
    .string()
    .max(300, "Meta description must be 300 characters or less")
    .optional(),
})

type BrandFormData = z.infer<typeof brandSchema>

type UploadedImage = {
  id: string
  url: string
  altText?: string
  isPrimary?: boolean
}

type CategoryAssignmentValue = {
  categoryId: string
  navPriority: number
  showInProductMenu: boolean
}

interface CategoryOption {
  id: string
  name: string
  slug: string
}

interface NewBrandWizardFormProps {
  categories: CategoryOption[]
  onSuccess?: () => void
  onCancel?: () => void
  onDirtyChange?: (isDirty: boolean) => void
  onSubmittingChange?: (isSubmitting: boolean) => void
}

const STEPS: CreateWizardStep[] = [
  {
    key: "basics",
    label: "Basics",
    description: "Set the brand name, slug, and description.",
  },
  {
    key: "presence",
    label: "Brand Presence",
    description: "Add a logo and website URL for the brand.",
  },
  {
    key: "assignments",
    label: "Category Assignments",
    description: "Assign the brand to top-level categories and menu settings.",
  },
  {
    key: "seo",
    label: "SEO",
    description: "Add search metadata and save the new brand.",
  },
]

function normalizeAssignments(assignments: CategoryAssignmentValue[]) {
  return assignments.map((assignment, index) => ({
    ...assignment,
    navPriority:
      Number.isFinite(assignment.navPriority) && assignment.navPriority >= 0
        ? assignment.navPriority
        : index + 1,
  }))
}

export function NewBrandWizardForm({
  categories,
  onSuccess,
  onCancel,
  onDirtyChange,
  onSubmittingChange,
}: NewBrandWizardFormProps) {
  const createBrandMutation = useCreateBrandMutation()
  const [currentStep, setCurrentStep] = useState(0)
  const [logoImages, setLogoImages] = useState<UploadedImage[]>([])
  const [categoryAssignments, setCategoryAssignments] = useState<
    CategoryAssignmentValue[]
  >([])

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      websiteUrl: "",
      sortOrder: 0,
      isActive: true,
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
  const isActive = useWatch({ control, name: "isActive" })
  const step = STEPS[currentStep]
  const isLastStep = currentStep === STEPS.length - 1

  const assignmentMap = useMemo(
    () =>
      new Map(
        categoryAssignments.map((assignment) => [
          assignment.categoryId,
          assignment,
        ]),
      ),
    [categoryAssignments],
  )

  const isWizardDirty =
    isDirty || logoImages.length > 0 || categoryAssignments.length > 0

  useEffect(() => {
    onDirtyChange?.(isWizardDirty)
  }, [isWizardDirty, onDirtyChange])

  useEffect(() => {
    onSubmittingChange?.(createBrandMutation.isPending)
  }, [createBrandMutation.isPending, onSubmittingChange])

  const handleNameChange = (nextName: string) => {
    const currentSlug = getValues("slug")

    if (!currentSlug || currentSlug === slugify(name || "")) {
      setValue("slug", slugify(nextName), { shouldDirty: true })
    }
  }

  const toggleCategory = (categoryId: string, checked: boolean) => {
    setCategoryAssignments((currentAssignments) => {
      if (checked) {
        if (
          currentAssignments.some(
            (assignment) => assignment.categoryId === categoryId,
          )
        ) {
          return currentAssignments
        }

        return normalizeAssignments([
          ...currentAssignments,
          {
            categoryId,
            navPriority: currentAssignments.length + 1,
            showInProductMenu: true,
          },
        ])
      }

      return normalizeAssignments(
        currentAssignments.filter(
          (assignment) => assignment.categoryId !== categoryId,
        ),
      )
    })
  }

  const updateAssignment = (
    categoryId: string,
    updates: Partial<CategoryAssignmentValue>,
  ) => {
    setCategoryAssignments((currentAssignments) =>
      currentAssignments.map((assignment) =>
        assignment.categoryId === categoryId
          ? { ...assignment, ...updates }
          : assignment,
      ),
    )
  }

  const validateStep = async (stepIndex: number) => {
    if (stepIndex === 0) {
      return trigger(["name", "slug", "description"])
    }

    if (stepIndex === 1) {
      return trigger(["websiteUrl"])
    }

    if (stepIndex === 2) {
      return trigger(["sortOrder", "isActive"])
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

  const onSubmit = async (data: BrandFormData) => {
    const isStepValid = await validateStep(currentStep)
    if (!isStepValid) {
      return
    }

    try {
      await createBrandMutation.mutateAsync({
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        logo: logoImages[0]?.url || null,
        websiteUrl: data.websiteUrl || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined,
        categoryAssignments,
      })

      toast.success("Brand created successfully.")
      reset()
      setLogoImages([])
      setCategoryAssignments([])
      setCurrentStep(0)
      onDirtyChange?.(false)
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create brand.",
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
                  Create Brand
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
              aria-label="Close brand wizard"
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
                title="Brand Basics"
                description="Set the brand name, slug, and description before moving on."
              />

              <div className="space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
                <div className="space-y-2">
                  <Label htmlFor="brand-name">Brand Name *</Label>
                  <Input
                    id="brand-name"
                    {...register("name")}
                    value={name ?? ""}
                    onChange={(event) => {
                      register("name").onChange(event)
                      handleNameChange(event.target.value)
                    }}
                    placeholder="Apple"
                  />
                  {errors.name ? (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand-slug">Slug *</Label>
                  <Input
                    id="brand-slug"
                    {...register("slug")}
                    value={slug ?? ""}
                    placeholder="apple"
                  />
                  {errors.slug ? (
                    <p className="text-sm text-destructive">
                      {errors.slug.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand-description">Description</Label>
                  <Textarea
                    id="brand-description"
                    rows={6}
                    {...register("description")}
                    placeholder="Write a short description for this brand."
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
                title="Brand Presence"
                description="Add the brand logo and website URL used across the storefront."
              />

              <div className="space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <ImageUpload
                    value={logoImages}
                    onChange={(images) => setLogoImages(images.slice(0, 1))}
                    maxImages={1}
                    folder="brands"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand-website-url">Website URL</Label>
                  <Input
                    id="brand-website-url"
                    {...register("websiteUrl")}
                    placeholder="https://www.apple.com"
                  />
                  {errors.websiteUrl ? (
                    <p className="text-sm text-destructive">
                      {errors.websiteUrl.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-8">
              <CreateWizardSectionHeader
                eyebrow="Step 3"
                title="Category Assignments"
                description="Assign this brand to top-level categories and configure per-category storefront behavior."
              />

              <div className="space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="brand-sort-order">Sort Order</Label>
                    <Input
                      id="brand-sort-order"
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

                  <div className="flex items-center justify-between rounded-2xl border border-border/70 p-5">
                    <div className="space-y-1">
                      <Label htmlFor="brand-active">Active</Label>
                      <p className="text-sm text-muted-foreground">
                        Active brands appear across the storefront.
                      </p>
                    </div>
                    <Switch
                      id="brand-active"
                      checked={isActive}
                      onCheckedChange={(checked) =>
                        setValue("isActive", checked, { shouldDirty: true })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="font-medium">Top-level categories</p>
                    <p className="text-sm text-muted-foreground">
                      Select the categories this brand should belong to. You can
                      set menu visibility and priority for each selected
                      category.
                    </p>
                  </div>

                  {categories.map((category) => {
                    const assignment = assignmentMap.get(category.id)
                    const isSelected = Boolean(assignment)

                    return (
                      <div
                        key={category.id}
                        className="rounded-2xl border border-border/70 bg-background p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`brand-category-${category.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              toggleCategory(category.id, Boolean(checked))
                            }
                          />
                          <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                              <Label htmlFor={`brand-category-${category.id}`}>
                                {category.name}
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                /{category.slug}
                              </p>
                            </div>

                            {assignment ? (
                              <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                                <div className="space-y-2">
                                  <Label
                                    htmlFor={`brand-category-priority-${category.id}`}
                                  >
                                    Navigation Priority
                                  </Label>
                                  <Input
                                    id={`brand-category-priority-${category.id}`}
                                    type="number"
                                    inputMode="numeric"
                                    value={String(assignment.navPriority)}
                                    onChange={(event) =>
                                      updateAssignment(category.id, {
                                        navPriority: parseIntegerInput(
                                          event.target.value,
                                        ),
                                      })
                                    }
                                  />
                                </div>

                                <div className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`brand-category-menu-${category.id}`}
                                    >
                                      Show In Product Menu
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                      Show this brand under the selected
                                      category in the storefront product menu.
                                    </p>
                                  </div>
                                  <Switch
                                    id={`brand-category-menu-${category.id}`}
                                    checked={assignment.showInProductMenu}
                                    onCheckedChange={(checked) =>
                                      updateAssignment(category.id, {
                                        showInProductMenu: checked,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-8">
              <CreateWizardSectionHeader
                eyebrow="Step 4"
                title="SEO"
                description="Add optional search metadata. The brand is created only when you press Save."
              />

              <div className="space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
                <div className="space-y-2">
                  <Label htmlFor="brand-meta-title">Meta Title</Label>
                  <Input
                    id="brand-meta-title"
                    {...register("metaTitle")}
                    placeholder="Apple phones and accessories"
                  />
                  {errors.metaTitle ? (
                    <p className="text-sm text-destructive">
                      {errors.metaTitle.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand-meta-description">
                    Meta Description
                  </Label>
                  <Textarea
                    id="brand-meta-description"
                    rows={6}
                    {...register("metaDescription")}
                    placeholder="Explore Apple phones, tablets, accessories, and more."
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
              key="save-brand"
              type="button"
              disabled={createBrandMutation.isPending}
              className="min-w-28"
              onClick={() => void handleSubmit(onSubmit)()}
            >
              {createBrandMutation.isPending ? (
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

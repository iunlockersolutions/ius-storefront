"use client"

import { useEffect, useMemo, useState } from "react"
import { useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import {
  CategoryOptionTemplatesEditor,
  type CategoryOptionTemplateValue,
} from "@/components/admin/categories/category-option-templates-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { slugify } from "@/lib/utils"
import { normalizeEntityName } from "@/lib/utils/catalog"

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(100),
  description: z.string().max(1000).optional(),
  image: z.string().url().optional().or(z.literal("")),
  parentId: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  showInProductMenu: z.boolean().default(true),
  productMenuPriority: z.number().int().min(0).default(0),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
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
}

const STEP_LABELS = ["Basics", "Variant Names", "Storefront & SEO"] as const

export function NewCategoryForm({
  categories,
  onSuccess,
  onCancel,
  onDirtyChange,
}: NewCategoryFormProps) {
  const [isPending, startTransition] = useTransition()
  const createCategoryMutation = useCreateCategoryMutation()
  const [currentStep, setCurrentStep] = useState(0)
  const [optionTemplates, setOptionTemplates] = useState<
    CategoryOptionTemplateValue[]
  >([])

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image: "",
      parentId: "",
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
    register,
    setValue,
    reset,
    trigger,
    handleSubmit,
    formState: { errors, isDirty },
  } = form
  const nameField = register("name")
  const watchedName = useWatch({ control, name: "name" })
  const watchedSlug = useWatch({ control, name: "slug" })
  const watchedParentId = useWatch({ control, name: "parentId" })
  const watchedIsActive = useWatch({ control, name: "isActive" })
  const watchedShowInProductMenu = useWatch({
    control,
    name: "showInProductMenu",
  })
  const duplicateTemplateNames = useMemo(() => {
    const counts = new Map<string, number>()

    for (const template of optionTemplates) {
      const normalized = normalizeEntityName(template.name)
      if (!normalized) {
        continue
      }

      counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
    }

    return optionTemplates
      .filter((template) => {
        const normalized = normalizeEntityName(template.name)
        return normalized && (counts.get(normalized) ?? 0) > 1
      })
      .map((template) => template.name.trim())
  }, [optionTemplates])
  const hasTemplateChanges = optionTemplates.length > 0
  const isFormDirty = isDirty || hasTemplateChanges

  useEffect(() => {
    onDirtyChange?.(isFormDirty)
  }, [isFormDirty, onDirtyChange])

  const handleNameChange = (name: string) => {
    if (!watchedSlug || watchedSlug === slugify(watchedName || "")) {
      setValue("slug", slugify(name))
    }
  }

  const goToNextStep = async () => {
    if (currentStep === 0) {
      const isValid = await trigger(["name", "slug", "parentId", "description"])
      if (!isValid) {
        return
      }
    }

    if (currentStep === 1 && duplicateTemplateNames.length > 0) {
      toast.error("Variant names must be unique")
      return
    }

    setCurrentStep((step) => Math.min(step + 1, STEP_LABELS.length - 1))
  }

  const goToPreviousStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  const onSubmit = async (data: CategoryFormData) => {
    if (duplicateTemplateNames.length > 0) {
      toast.error("Variant names must be unique")
      return
    }

    startTransition(async () => {
      try {
        await createCategoryMutation.mutateAsync({
          ...data,
          image: data.image || null,
          parentId: data.parentId || null,
          metaTitle: data.metaTitle || undefined,
          metaDescription: data.metaDescription || undefined,
          showInProductMenu: data.showInProductMenu,
          productMenuPriority: data.productMenuPriority,
          optionTemplates: optionTemplates
            .map((template, index) => ({
              name: template.name.trim(),
              sortOrder: index,
            }))
            .filter((template) => template.name.length > 0),
        })

        toast.success("Category created successfully!")
        reset()
        setOptionTemplates([])
        setCurrentStep(0)
        onDirtyChange?.(false)
        onSuccess?.()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        )
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-full flex-col"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {STEP_LABELS.map((label, index) => {
            const isComplete = index < currentStep
            const isCurrent = index === currentStep

            return (
              <Badge
                key={label}
                variant={isCurrent || isComplete ? "default" : "outline"}
                className="h-8 gap-2 px-3 text-xs"
              >
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-background/15 text-[10px] font-semibold">
                  {isComplete ? <Check className="size-3" /> : index + 1}
                </span>
                {label}
              </Badge>
            )
          })}
        </div>

        {currentStep === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Basics</CardTitle>
              <CardDescription>
                Start with the category identity and where it sits in the
                catalog hierarchy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  {...nameField}
                  value={watchedName ?? ""}
                  onChange={(event) => {
                    nameField.onChange(event)
                    handleNameChange(event.target.value)
                  }}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input id="slug" {...register("slug")} />
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Category</Label>
                <Select
                  value={watchedParentId || "none"}
                  onValueChange={(value) =>
                    setValue("parentId", value === "none" ? "" : value, {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No parent (top-level category)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      No parent (top-level category)
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.level > 0 && "— ".repeat(category.level)}
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={5}
                  {...register("description")}
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {currentStep === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle>Variant Names</CardTitle>
              <CardDescription>
                Define reusable option names like Color, Storage, or RAM for
                products in this category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CategoryOptionTemplatesEditor
                value={optionTemplates}
                onChange={setOptionTemplates}
              />
              {duplicateTemplateNames.length > 0 ? (
                <p className="text-sm text-red-500">
                  Duplicate variant names are not allowed.
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {currentStep === 2 ? (
          <Card>
            <CardHeader>
              <CardTitle>Storefront & SEO</CardTitle>
              <CardDescription>
                Configure storefront visibility, menu behavior, ordering, and
                metadata before saving.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input id="image" {...register("image")} />
                {errors.image && (
                  <p className="text-sm text-red-500">{errors.image.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    {...register("sortOrder", { valueAsNumber: true })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="isActive">Active</Label>
                    <p className="text-xs text-neutral-500">
                      Show this category in the storefront.
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={watchedIsActive}
                    onCheckedChange={(checked) =>
                      setValue("isActive", checked, { shouldDirty: true })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="productMenuPriority">
                    Product Menu Priority
                  </Label>
                  <Input
                    id="productMenuPriority"
                    type="number"
                    min="0"
                    {...register("productMenuPriority", {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="showInProductMenu">
                      Show In Product Menu
                    </Label>
                    <p className="text-xs text-neutral-500">
                      Allow this top-level category to appear in the storefront
                      Products menu.
                    </p>
                  </div>
                  <Switch
                    id="showInProductMenu"
                    checked={watchedShowInProductMenu}
                    onCheckedChange={(checked) =>
                      setValue("showInProductMenu", checked, {
                        shouldDirty: true,
                      })
                    }
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
        ) : null}
      </div>

      <div className="sticky bottom-0 mt-6 border-t bg-background px-1 py-4 sm:px-0">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            {currentStep > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isPending}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : null}
          </div>

          {currentStep < STEP_LABELS.length - 1 ? (
            <Button type="button" onClick={() => void goToNextStep()}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Category
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

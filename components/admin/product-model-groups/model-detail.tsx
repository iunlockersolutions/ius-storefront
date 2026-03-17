"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { ExternalLink, Loader2, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { CategorySectionSheet } from "@/components/admin/categories/category-section-sheet"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { AdminModel } from "@/services/queries/use-admin-model-query"
import {
  useDeleteProductModelGroupMutation,
  useUpdateProductModelGroupMutation,
} from "@/services/mutations/use-product-model-group-mutations"
import { formatDate, slugify } from "@/lib/utils"

const identitySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
})

const descriptionSchema = z.object({
  description: z.string().max(1000).optional(),
})

const placementSchema = z.object({
  brandId: z.string().min(1, "Brand is required"),
  primaryCategoryId: z.string().min(1, "Category is required"),
})

const storefrontSchema = z.object({
  showInProductMenu: z.boolean().default(true),
  navPriority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

const seoSchema = z.object({
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
})

type IdentityFormValues = z.infer<typeof identitySchema>
type DescriptionFormValues = z.infer<typeof descriptionSchema>
type PlacementFormValues = z.infer<typeof placementSchema>
type StorefrontFormValues = z.infer<typeof storefrontSchema>
type SeoFormValues = z.infer<typeof seoSchema>

type EditorKey =
  | "identity"
  | "description"
  | "placement"
  | "storefront"
  | "seo"
  | null

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

interface ModelDetailProps {
  model: AdminModel
  categories: CategoryOption[]
  brands: BrandOption[]
  onRefresh: () => Promise<unknown>
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div>{children}</div>
      <Separator />
    </section>
  )
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-all font-medium">{value}</p>
    </div>
  )
}

function buildModelUpdatePayload(
  model: AdminModel,
  overrides: Partial<{
    name: string
    slug: string
    description?: string | null
    brandId: string
    primaryCategoryId: string
    metaTitle?: string | null
    metaDescription?: string | null
    showInProductMenu: boolean
    navPriority: number
    isActive: boolean
  }>,
) {
  return {
    name: overrides.name ?? model.name,
    slug: overrides.slug ?? model.slug,
    description:
      overrides.description !== undefined
        ? overrides.description
        : (model.description ?? null),
    brandId: overrides.brandId ?? model.brandId,
    primaryCategoryId: overrides.primaryCategoryId ?? model.primaryCategoryId,
    metaTitle:
      overrides.metaTitle !== undefined
        ? overrides.metaTitle
        : (model.metaTitle ?? null),
    metaDescription:
      overrides.metaDescription !== undefined
        ? overrides.metaDescription
        : (model.metaDescription ?? null),
    showInProductMenu: overrides.showInProductMenu ?? model.showInProductMenu,
    navPriority: overrides.navPriority ?? model.navPriority,
    isActive: overrides.isActive ?? model.isActive,
  }
}

export function ModelDetail({
  model,
  categories,
  brands,
  onRefresh,
}: ModelDetailProps) {
  const router = useRouter()
  const [activeEditor, setActiveEditor] = useState<EditorKey>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const updateMutation = useUpdateProductModelGroupMutation(model.id)
  const deleteMutation = useDeleteProductModelGroupMutation()

  const handleSectionSave = async (
    payload: Parameters<typeof updateMutation.mutateAsync>[0],
    successMessage: string,
  ) => {
    await updateMutation.mutateAsync(payload)
    await onRefresh()
    toast.success(successMessage)
    setActiveEditor(null)
  }

  const handleDeleteModel = async () => {
    try {
      await deleteMutation.mutateAsync(model.id)
      toast.success("Model deleted successfully")
      router.push("/ops/catalog-setup?tab=models")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete model",
      )
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/ops/catalog-setup?tab=models">Back to Models</Link>
            </Button>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {model.name}
                </h1>
                <Badge
                  className={
                    model.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-neutral-100 text-neutral-800"
                  }
                >
                  {model.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                /{model.slug} · {model.brandName} / {model.primaryCategoryName}
              </p>
            </div>
          </div>

          <Button variant="outline" asChild>
            <Link href={`/products/models/${model.slug}`} target="_blank">
              View Storefront
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="space-y-8">
          <Section
            title="Identity"
            description="Core naming for this model."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveEditor("identity")}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Model name" value={model.name} />
              <DetailItem label="Slug" value={`/${model.slug}`} />
            </div>
          </Section>

          <Section
            title="Description"
            description="Merchant-facing description and supporting copy."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveEditor("description")}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            }
          >
            {model.description ? (
              <p className="whitespace-pre-wrap text-sm leading-7">
                {model.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No description has been added yet.
              </p>
            )}
          </Section>

          <Section
            title="Catalog Placement"
            description="Current brand and top-level category for this model."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveEditor("placement")}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Brand" value={model.brandName} />
              <DetailItem
                label="Primary category"
                value={model.primaryCategoryName}
              />
            </div>
          </Section>

          <Section
            title="Storefront Settings"
            description="Visibility, navigation order, and linked product count."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveEditor("storefront")}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Show in product menu"
                value={model.showInProductMenu ? "Yes" : "No"}
              />
              <DetailItem
                label="Navigation priority"
                value={String(model.navPriority)}
              />
              <DetailItem
                label="Active"
                value={model.isActive ? "Yes" : "No"}
              />
              <DetailItem
                label="Assigned products"
                value={String(model.productCount)}
              />
            </div>
          </Section>

          <Section
            title="SEO"
            description="Metadata used by search engines and social previews."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveEditor("seo")}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            }
          >
            <div className="grid gap-4">
              <DetailItem
                label="Meta title"
                value={model.metaTitle || "No meta title"}
              />
              <DetailItem
                label="Meta description"
                value={model.metaDescription || "No meta description"}
              />
            </div>
          </Section>

          <Section
            title="Timestamps"
            description="Creation and update history for this model."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Created"
                value={
                  model.createdAt ? formatDate(model.createdAt) : "Unknown"
                }
              />
              <DetailItem
                label="Updated"
                value={
                  model.updatedAt ? formatDate(model.updatedAt) : "Unknown"
                }
              />
            </div>
          </Section>

          <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">
                  Danger Zone
                </h2>
                <p className="text-sm text-muted-foreground">
                  Delete this model if it is no longer needed.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete model
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Models assigned to products must be cleaned up before deletion.
            </p>
          </section>
        </div>
      </div>

      <ModelIdentityEditorSheet
        open={activeEditor === "identity"}
        onOpenChange={(open) => setActiveEditor(open ? "identity" : null)}
        model={model}
        isPending={updateMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              buildModelUpdatePayload(model, {
                name: values.name,
                slug: values.slug,
              }),
              "Model identity updated",
            )
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update model identity",
            )
          }
        }}
      />

      <ModelDescriptionEditorSheet
        open={activeEditor === "description"}
        onOpenChange={(open) => setActiveEditor(open ? "description" : null)}
        model={model}
        isPending={updateMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              buildModelUpdatePayload(model, {
                description: values.description || null,
              }),
              "Description updated",
            )
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update description",
            )
          }
        }}
      />

      <ModelPlacementEditorSheet
        open={activeEditor === "placement"}
        onOpenChange={(open) => setActiveEditor(open ? "placement" : null)}
        model={model}
        brands={brands}
        categories={categories}
        isPending={updateMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              buildModelUpdatePayload(model, {
                brandId: values.brandId,
                primaryCategoryId: values.primaryCategoryId,
              }),
              "Catalog placement updated",
            )
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update catalog placement",
            )
          }
        }}
      />

      <ModelStorefrontEditorSheet
        open={activeEditor === "storefront"}
        onOpenChange={(open) => setActiveEditor(open ? "storefront" : null)}
        model={model}
        isPending={updateMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              buildModelUpdatePayload(model, {
                showInProductMenu: values.showInProductMenu,
                navPriority: values.navPriority,
                isActive: values.isActive,
              }),
              "Storefront settings updated",
            )
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update storefront settings",
            )
          }
        }}
      />

      <ModelSeoEditorSheet
        open={activeEditor === "seo"}
        onOpenChange={(open) => setActiveEditor(open ? "seo" : null)}
        model={model}
        isPending={updateMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              buildModelUpdatePayload(model, {
                metaTitle: values.metaTitle || null,
                metaDescription: values.metaDescription || null,
              }),
              "SEO updated",
            )
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Failed to update SEO",
            )
          }
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete model?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You must reassign or remove all
              linked products before deleting a model.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteModel}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ModelIdentityEditorSheet({
  open,
  onOpenChange,
  model,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: AdminModel
  isPending: boolean
  onSave: (values: IdentityFormValues) => Promise<void>
}) {
  const form = useForm<IdentityFormValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      name: model.name,
      slug: model.slug,
    },
  })

  const {
    control,
    register,
    reset,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = form
  const nameField = register("name")
  const watchedName = useWatch({ control, name: "name" })
  const watchedSlug = useWatch({ control, name: "slug" })

  useEffect(() => {
    if (open) {
      reset({
        name: model.name,
        slug: model.slug,
      })
    }
  }, [model.name, model.slug, open, reset])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Identity"
      description="Update the model name and slug."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="model-identity-form" type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="model-identity-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="model-identity-name">Model Name</Label>
          <Input
            id="model-identity-name"
            {...nameField}
            value={watchedName ?? ""}
            onChange={(event) => {
              nameField.onChange(event)
              if (!watchedSlug || watchedSlug === slugify(model.name || "")) {
                setValue("slug", slugify(event.target.value), {
                  shouldDirty: true,
                })
              }
            }}
          />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model-identity-slug">Slug</Label>
          <Input id="model-identity-slug" {...register("slug")} />
          {errors.slug ? (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          ) : null}
        </div>
      </form>
    </CategorySectionSheet>
  )
}

function ModelDescriptionEditorSheet({
  open,
  onOpenChange,
  model,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: AdminModel
  isPending: boolean
  onSave: (values: DescriptionFormValues) => Promise<void>
}) {
  const form = useForm<DescriptionFormValues>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: {
      description: model.description || "",
    },
  })

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = form

  useEffect(() => {
    if (open) {
      reset({
        description: model.description || "",
      })
    }
  }, [model.description, open, reset])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Description"
      description="Update the model description."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            form="model-description-form"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="model-description-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="model-description">Description</Label>
          <Textarea
            id="model-description"
            rows={6}
            {...register("description")}
          />
          {errors.description ? (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          ) : null}
        </div>
      </form>
    </CategorySectionSheet>
  )
}

function ModelPlacementEditorSheet({
  open,
  onOpenChange,
  model,
  brands,
  categories,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: AdminModel
  brands: BrandOption[]
  categories: CategoryOption[]
  isPending: boolean
  onSave: (values: PlacementFormValues) => Promise<void>
}) {
  const form = useForm<PlacementFormValues>({
    resolver: zodResolver(placementSchema),
    defaultValues: {
      brandId: model.brandId,
      primaryCategoryId: model.primaryCategoryId,
    },
  })

  const {
    control,
    reset,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = form

  const brandId = useWatch({
    control,
    name: "brandId",
  })
  const primaryCategoryId = useWatch({
    control,
    name: "primaryCategoryId",
  })

  const selectedBrand = brands.find((brand) => brand.id === brandId)
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

  useEffect(() => {
    if (open) {
      reset({
        brandId: model.brandId,
        primaryCategoryId: model.primaryCategoryId,
      })
    }
  }, [model.brandId, model.primaryCategoryId, open, reset])

  useEffect(() => {
    if (
      primaryCategoryId &&
      !availableCategories.some((category) => category.id === primaryCategoryId)
    ) {
      setValue("primaryCategoryId", "", { shouldDirty: true })
    }
  }, [availableCategories, primaryCategoryId, setValue])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Catalog Placement"
      description="Update the brand and top-level category for this model."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            form="model-placement-form"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="model-placement-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="model-placement-brand">Brand</Label>
          <Select
            value={brandId}
            onValueChange={(value) =>
              setValue("brandId", value, { shouldDirty: true })
            }
          >
            <SelectTrigger id="model-placement-brand">
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
            <p className="text-sm text-destructive">{errors.brandId.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model-placement-category">Top-Level Category</Label>
          <Select
            value={primaryCategoryId}
            onValueChange={(value) =>
              setValue("primaryCategoryId", value, { shouldDirty: true })
            }
          >
            <SelectTrigger id="model-placement-category">
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
            Only categories assigned to the selected brand are available.
          </p>
          {errors.primaryCategoryId ? (
            <p className="text-sm text-destructive">
              {errors.primaryCategoryId.message}
            </p>
          ) : null}
        </div>
      </form>
    </CategorySectionSheet>
  )
}

function ModelStorefrontEditorSheet({
  open,
  onOpenChange,
  model,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: AdminModel
  isPending: boolean
  onSave: (values: StorefrontFormValues) => Promise<void>
}) {
  const form = useForm<StorefrontFormValues>({
    resolver: zodResolver(storefrontSchema),
    defaultValues: {
      showInProductMenu: model.showInProductMenu,
      navPriority: model.navPriority,
      isActive: model.isActive,
    },
  })

  const {
    register,
    reset,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = form

  const showInProductMenu = useWatch({
    control: form.control,
    name: "showInProductMenu",
  })
  const isActive = useWatch({
    control: form.control,
    name: "isActive",
  })

  useEffect(() => {
    if (open) {
      reset({
        showInProductMenu: model.showInProductMenu,
        navPriority: model.navPriority,
        isActive: model.isActive,
      })
    }
  }, [model.isActive, model.navPriority, model.showInProductMenu, open, reset])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Storefront Settings"
      description="Update model visibility and menu settings."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            form="model-storefront-form"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="model-storefront-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="model-storefront-priority">Navigation Priority</Label>
          <Input
            id="model-storefront-priority"
            type="number"
            disabled={!showInProductMenu}
            {...register("navPriority", { valueAsNumber: true })}
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
              <Label htmlFor="model-storefront-menu">
                Show In Product Menu
              </Label>
              <p className="text-sm text-muted-foreground">
                Controls whether this model appears in the storefront menu.
              </p>
            </div>
            <Switch
              id="model-storefront-menu"
              checked={showInProductMenu}
              onCheckedChange={(checked) =>
                setValue("showInProductMenu", checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border/70 p-5">
            <div className="space-y-1">
              <Label htmlFor="model-storefront-active">Active</Label>
              <p className="text-sm text-muted-foreground">
                Inactive models are hidden from the storefront.
              </p>
            </div>
            <Switch
              id="model-storefront-active"
              checked={isActive}
              onCheckedChange={(checked) =>
                setValue("isActive", checked, { shouldDirty: true })
              }
            />
          </div>
        </div>
      </form>
    </CategorySectionSheet>
  )
}

function ModelSeoEditorSheet({
  open,
  onOpenChange,
  model,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: AdminModel
  isPending: boolean
  onSave: (values: SeoFormValues) => Promise<void>
}) {
  const form = useForm<SeoFormValues>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      metaTitle: model.metaTitle || "",
      metaDescription: model.metaDescription || "",
    },
  })

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = form

  useEffect(() => {
    if (open) {
      reset({
        metaTitle: model.metaTitle || "",
        metaDescription: model.metaDescription || "",
      })
    }
  }, [model.metaDescription, model.metaTitle, open, reset])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit SEO"
      description="Update metadata used by search engines and social previews."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="model-seo-form" type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="model-seo-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="model-seo-title">Meta Title</Label>
          <Input id="model-seo-title" {...register("metaTitle")} />
          {errors.metaTitle ? (
            <p className="text-sm text-destructive">
              {errors.metaTitle.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model-seo-description">Meta Description</Label>
          <Textarea
            id="model-seo-description"
            rows={5}
            {...register("metaDescription")}
          />
          {errors.metaDescription ? (
            <p className="text-sm text-destructive">
              {errors.metaDescription.message}
            </p>
          ) : null}
        </div>
      </form>
    </CategorySectionSheet>
  )
}

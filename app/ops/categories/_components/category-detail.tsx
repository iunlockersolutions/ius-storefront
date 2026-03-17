"use client"

import { type ReactNode, useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { AdminCategory } from "@/services/queries/use-admin-categories-query"
import {
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "@/services/mutations/use-category-mutations"
import { formatDate, slugify } from "@/lib/utils"
import { normalizeEntityName } from "@/lib/utils/catalog"

interface ParentOption {
  id: string
  name: string
  slug: string
  level: number
  path: string
}

interface CategoryDetailProps {
  category: AdminCategory
  path: string
  parentName: string | null
  parentOptions: ParentOption[]
  onRefresh: () => Promise<unknown>
}

const identitySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(100),
  parentId: z.string().optional(),
})

const descriptionSchema = z.object({
  description: z.string().max(1000).optional(),
})

const storefrontSchema = z.object({
  image: z.string().url().optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  showInProductMenu: z.boolean().default(true),
  productMenuPriority: z.number().int().min(0).default(0),
})

const seoSchema = z.object({
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
})

const variantNameSchema = z.object({
  name: z.string().min(1, "Variant name is required").max(100),
})

type IdentityFormValues = z.infer<typeof identitySchema>
type DescriptionFormValues = z.infer<typeof descriptionSchema>
type StorefrontFormValues = z.infer<typeof storefrontSchema>
type SeoFormValues = z.infer<typeof seoSchema>
type VariantNameFormValues = z.infer<typeof variantNameSchema>
type EditorKey =
  | "identity"
  | "description"
  | "storefront"
  | "seo"
  | "variant"
  | null

function SectionCard({
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

export function CategoryDetail({
  category,
  path,
  parentName,
  parentOptions,
  onRefresh,
}: CategoryDetailProps) {
  const router = useRouter()
  const [activeEditor, setActiveEditor] = useState<EditorKey>(null)
  const [editingVariantName, setEditingVariantName] = useState<
    AdminCategory["optionTemplates"][number] | null
  >(null)
  const [variantNameToRemove, setVariantNameToRemove] = useState<
    AdminCategory["optionTemplates"][number] | null
  >(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const updateCategoryMutation = useUpdateCategoryMutation(category.id)
  const deleteCategoryMutation = useDeleteCategoryMutation()

  const handleSectionSave = async (
    payload: Parameters<typeof updateCategoryMutation.mutateAsync>[0],
    successMessage: string,
  ) => {
    await updateCategoryMutation.mutateAsync(payload)
    await onRefresh()
    toast.success(successMessage)
    setActiveEditor(null)
    setEditingVariantName(null)
  }

  const handleVariantSave = async (name: string) => {
    const normalized = normalizeEntityName(name)
    const hasDuplicate = category.optionTemplates.some((template) => {
      if (editingVariantName && template.id === editingVariantName.id) {
        return false
      }

      return normalizeEntityName(template.name) === normalized
    })

    if (hasDuplicate) {
      throw new Error("Variant names must be unique")
    }

    const nextTemplates = editingVariantName
      ? category.optionTemplates.map((template) =>
          template.id === editingVariantName.id
            ? { ...template, name: name.trim() }
            : template,
        )
      : [
          ...category.optionTemplates,
          {
            name: name.trim(),
            sortOrder: category.optionTemplates.length,
          },
        ]

    await handleSectionSave(
      {
        optionTemplates: nextTemplates.map((template, index) => ({
          id: "id" in template ? template.id : undefined,
          name: template.name.trim(),
          sortOrder: index,
        })),
      },
      editingVariantName ? "Variant name updated" : "Variant name added",
    )
  }

  const handleVariantRemove = async () => {
    if (!variantNameToRemove) return

    try {
      await updateCategoryMutation.mutateAsync({
        optionTemplates: category.optionTemplates
          .filter((template) => template.id !== variantNameToRemove.id)
          .map((template, index) => ({
            id: template.id,
            name: template.name,
            sortOrder: index,
          })),
      })
      await onRefresh()
      toast.success("Variant name removed")
      setVariantNameToRemove(null)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove variant name",
      )
    }
  }

  const handleDeleteCategory = async () => {
    try {
      await deleteCategoryMutation.mutateAsync(category.id)
      toast.success("Category deleted successfully")
      router.push("/ops/categories")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category",
      )
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/ops/categories">Back to Categories</Link>
            </Button>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {category.name}
                </h1>
                <Badge
                  className={
                    category.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-neutral-100 text-neutral-800"
                  }
                >
                  {category.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                /{category.slug} · {path}
              </p>
            </div>
          </div>

          <Button variant="outline" asChild>
            <Link href={`/categories/${category.slug}`} target="_blank">
              View Storefront
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="space-y-8">
          <SectionCard
            title="Identity & Hierarchy"
            description="Core naming and catalog placement for this category."
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
              <DetailItem label="Category name" value={category.name} />
              <DetailItem label="Slug" value={`/${category.slug}`} />
              <DetailItem
                label="Parent category"
                value={parentName ?? "None"}
              />
              <DetailItem label="Hierarchy path" value={path} />
            </div>
          </SectionCard>

          <SectionCard
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
            {category.description ? (
              <p className="whitespace-pre-wrap text-sm leading-7">
                {category.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No description has been added yet.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Variant Names"
            description="Reusable option names for products in this category."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingVariantName(null)
                  setActiveEditor("variant")
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add variant name
              </Button>
            }
          >
            {category.optionTemplates.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No variant names yet. Add reusable names like Color, Storage, or
                RAM to guide product creation later.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.optionTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        {template.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingVariantName(template)
                              setActiveEditor("variant")
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setVariantNameToRemove(template)}
                          >
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>

          <SectionCard
            title="Storefront Settings"
            description="Visibility, ordering, image, and menu placement."
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
                label="Active"
                value={category.isActive ? "Yes" : "No"}
              />
              <DetailItem
                label="Sort order"
                value={String(category.sortOrder)}
              />
              <DetailItem
                label="Show in product menu"
                value={category.showInProductMenu ? "Yes" : "No"}
              />
              <DetailItem
                label="Product menu priority"
                value={String(category.productMenuPriority)}
              />
              <DetailItem
                label="Image URL"
                value={category.image || "No image URL set"}
                className="sm:col-span-2"
              />
            </div>
          </SectionCard>

          <SectionCard
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
                value={category.metaTitle || "No meta title"}
              />
              <DetailItem
                label="Meta description"
                value={category.metaDescription || "No meta description"}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Timestamps"
            description="Creation and update history for this category."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Created"
                value={
                  category.createdAt
                    ? formatDate(category.createdAt)
                    : "Unknown"
                }
              />
              <DetailItem
                label="Updated"
                value={
                  category.updatedAt
                    ? formatDate(category.updatedAt)
                    : "Unknown"
                }
              />
            </div>
          </SectionCard>

          <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">
                  Danger Zone
                </h2>
                <p className="text-sm text-muted-foreground">
                  Delete this category if it is no longer needed.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete category
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Categories with subcategories or assigned products must be cleaned
              up before deletion.
            </p>
          </section>
        </div>
      </div>

      <IdentityEditorSheet
        open={activeEditor === "identity"}
        onOpenChange={(open) => setActiveEditor(open ? "identity" : null)}
        category={category}
        parentOptions={parentOptions}
        isPending={updateCategoryMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              {
                name: values.name,
                slug: values.slug,
                parentId: values.parentId || null,
              },
              "Category identity updated",
            )
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update category identity",
            )
          }
        }}
      />

      <DescriptionEditorSheet
        open={activeEditor === "description"}
        onOpenChange={(open) => setActiveEditor(open ? "description" : null)}
        category={category}
        isPending={updateCategoryMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              { description: values.description || undefined },
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

      <StorefrontEditorSheet
        open={activeEditor === "storefront"}
        onOpenChange={(open) => setActiveEditor(open ? "storefront" : null)}
        category={category}
        isPending={updateCategoryMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              {
                image: values.image || null,
                sortOrder: values.sortOrder,
                isActive: values.isActive,
                showInProductMenu: values.showInProductMenu,
                productMenuPriority: values.productMenuPriority,
              },
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

      <SeoEditorSheet
        open={activeEditor === "seo"}
        onOpenChange={(open) => setActiveEditor(open ? "seo" : null)}
        category={category}
        isPending={updateCategoryMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              {
                metaTitle: values.metaTitle || undefined,
                metaDescription: values.metaDescription || undefined,
              },
              "SEO settings updated",
            )
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Failed to update SEO",
            )
          }
        }}
      />

      <VariantNameEditorSheet
        open={activeEditor === "variant"}
        onOpenChange={(open) => {
          setActiveEditor(open ? "variant" : null)
          if (!open) {
            setEditingVariantName(null)
          }
        }}
        initialValue={editingVariantName?.name ?? ""}
        isPending={updateCategoryMutation.isPending}
        mode={editingVariantName ? "edit" : "add"}
        onSave={async (values) => {
          try {
            await handleVariantSave(values.name)
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to save variant name",
            )
          }
        }}
      />

      <AlertDialog
        open={!!variantNameToRemove}
        onOpenChange={(open) => {
          if (!open) {
            setVariantNameToRemove(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove variant name?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              {variantNameToRemove?.name ?? "this variant name"} from the
              category template list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVariantRemove}
              disabled={updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Categories with subcategories or
              assigned products must be cleaned up before deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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

function IdentityEditorSheet({
  open,
  onOpenChange,
  category,
  parentOptions,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: AdminCategory
  parentOptions: ParentOption[]
  isPending: boolean
  onSave: (values: IdentityFormValues) => Promise<void>
}) {
  const form = useForm<IdentityFormValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      name: category.name,
      slug: category.slug,
      parentId: category.parentId || "",
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
  const watchedParentId = useWatch({ control, name: "parentId" })

  useEffect(() => {
    if (open) {
      reset({
        name: category.name,
        slug: category.slug,
        parentId: category.parentId || "",
      })
    }
  }, [category.name, category.slug, category.parentId, open, reset])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Identity & Hierarchy"
      description="Update the category name, slug, and parent category."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="category-identity-form"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="category-identity-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="category-name">Category Name *</Label>
          <Input
            id="category-name"
            {...nameField}
            value={watchedName ?? ""}
            onChange={(event) => {
              nameField.onChange(event)
              if (!watchedSlug || watchedSlug === slugify(watchedName || "")) {
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
          <Label htmlFor="category-slug">URL Slug *</Label>
          <Input id="category-slug" {...register("slug")} />
          {errors.slug ? (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-parent">Parent Category</Label>
          <Select
            value={watchedParentId || "none"}
            onValueChange={(value) =>
              setValue("parentId", value === "none" ? "" : value, {
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger id="category-parent">
              <SelectValue placeholder="No parent (root category)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No parent (root category)</SelectItem>
              {parentOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.level > 0 && "— ".repeat(option.level)}
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>
    </CategorySectionSheet>
  )
}

function DescriptionEditorSheet({
  open,
  onOpenChange,
  category,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: AdminCategory
  isPending: boolean
  onSave: (values: DescriptionFormValues) => Promise<void>
}) {
  const form = useForm<DescriptionFormValues>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: {
      description: category.description || "",
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
      reset({ description: category.description || "" })
    }
  }, [category.description, open, reset])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Description"
      description="Update the category description shown internally and on the storefront."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="category-description-form"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="category-description-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="category-description">Description</Label>
          <Textarea
            id="category-description"
            rows={8}
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

function StorefrontEditorSheet({
  open,
  onOpenChange,
  category,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: AdminCategory
  isPending: boolean
  onSave: (values: StorefrontFormValues) => Promise<void>
}) {
  const form = useForm<StorefrontFormValues>({
    resolver: zodResolver(storefrontSchema),
    defaultValues: {
      image: category.image || "",
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      showInProductMenu: category.showInProductMenu,
      productMenuPriority: category.productMenuPriority,
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
  const watchedIsActive = useWatch({ control, name: "isActive" })
  const watchedShowInProductMenu = useWatch({
    control,
    name: "showInProductMenu",
  })

  useEffect(() => {
    if (open) {
      reset({
        image: category.image || "",
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        showInProductMenu: category.showInProductMenu,
        productMenuPriority: category.productMenuPriority,
      })
    }
  }, [
    category.image,
    category.isActive,
    category.productMenuPriority,
    category.showInProductMenu,
    category.sortOrder,
    open,
    reset,
  ])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Storefront Settings"
      description="Control visibility, ordering, image URL, and menu behavior."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="category-storefront-form"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="category-storefront-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="category-image-url">Image URL</Label>
          <Input id="category-image-url" {...register("image")} />
          {errors.image ? (
            <p className="text-sm text-destructive">{errors.image.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-sort-order">Sort Order</Label>
          <Input
            id="category-sort-order"
            type="number"
            min={0}
            {...register("sortOrder", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-product-menu-priority">
            Product Menu Priority
          </Label>
          <Input
            id="category-product-menu-priority"
            type="number"
            min={0}
            {...register("productMenuPriority", { valueAsNumber: true })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="category-active">Active</Label>
            <p className="text-xs text-muted-foreground">
              Control whether this category is visible in storefront surfaces.
            </p>
          </div>
          <Switch
            id="category-active"
            checked={watchedIsActive}
            onCheckedChange={(checked) =>
              setValue("isActive", checked, { shouldDirty: true })
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="category-show-in-menu">Show In Product Menu</Label>
            <p className="text-xs text-muted-foreground">
              Only active top-level categories should appear in the storefront
              Products menu.
            </p>
          </div>
          <Switch
            id="category-show-in-menu"
            checked={watchedShowInProductMenu}
            onCheckedChange={(checked) =>
              setValue("showInProductMenu", checked, { shouldDirty: true })
            }
          />
        </div>
      </form>
    </CategorySectionSheet>
  )
}

function SeoEditorSheet({
  open,
  onOpenChange,
  category,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: AdminCategory
  isPending: boolean
  onSave: (values: SeoFormValues) => Promise<void>
}) {
  const form = useForm<SeoFormValues>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      metaTitle: category.metaTitle || "",
      metaDescription: category.metaDescription || "",
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
        metaTitle: category.metaTitle || "",
        metaDescription: category.metaDescription || "",
      })
    }
  }, [category.metaDescription, category.metaTitle, open, reset])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit SEO"
      description="Update the meta title and description for search engines."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="category-seo-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="category-seo-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="category-meta-title">Meta Title</Label>
          <Input id="category-meta-title" {...register("metaTitle")} />
          {errors.metaTitle ? (
            <p className="text-sm text-destructive">
              {errors.metaTitle.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-meta-description">Meta Description</Label>
          <Textarea
            id="category-meta-description"
            rows={6}
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

function VariantNameEditorSheet({
  open,
  onOpenChange,
  initialValue,
  isPending,
  mode,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValue: string
  isPending: boolean
  mode: "add" | "edit"
  onSave: (values: VariantNameFormValues) => Promise<void>
}) {
  const form = useForm<VariantNameFormValues>({
    resolver: zodResolver(variantNameSchema),
    defaultValues: {
      name: initialValue,
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
      reset({ name: initialValue })
    }
  }, [initialValue, open, reset])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "edit" ? "Edit Variant Name" : "Add Variant Name"}
      description="Keep variant names short and reusable for products in this category."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="category-variant-name-form"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "edit" ? "Save changes" : "Add variant name"}
          </Button>
        </>
      }
    >
      <form
        id="category-variant-name-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="category-variant-name">Variant Name</Label>
          <Input
            id="category-variant-name"
            placeholder="Color"
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>
      </form>
    </CategorySectionSheet>
  )
}

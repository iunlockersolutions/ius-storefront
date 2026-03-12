"use client"

import { useMemo, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import {
  CategoryOptionTemplatesEditor,
  type CategoryOptionTemplateValue,
} from "@/components/admin/categories/category-option-templates-editor"
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
import {
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "@/hooks/admin/use-category-mutations"
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
  description: string | null
  image: string | null
  metaTitle: string | null
  metaDescription: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  showInProductMenu: boolean
  productMenuPriority: number
  productCount: number
  optionTemplates: Array<{
    id: string
    name: string
    sortOrder: number
  }>
}

interface ParentOption {
  id: string
  name: string
  slug: string
  level: number
  path: string
}

interface EditCategoryFormProps {
  category: Category
  parentOptions: ParentOption[]
}

export function EditCategoryForm({
  category,
  parentOptions,
}: EditCategoryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [optionTemplates, setOptionTemplates] = useState<
    CategoryOptionTemplateValue[]
  >(() =>
    category.optionTemplates.map((template) => ({
      id: template.id,
      key: template.id,
      name: template.name,
    })),
  )
  const updateCategoryMutation = useUpdateCategoryMutation(category.id)
  const deleteCategoryMutation = useDeleteCategoryMutation()

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || "",
      parentId: category.parentId || "",
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      showInProductMenu: category.showInProductMenu,
      productMenuPriority: category.productMenuPriority,
      metaTitle: category.metaTitle || "",
      metaDescription: category.metaDescription || "",
    },
  })

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isDirty },
  } = form

  const watchedValues = watch()
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

  const onSubmit = async (data: CategoryFormData) => {
    if (duplicateTemplateNames.length > 0) {
      toast.error("Variant names must be unique")
      return
    }

    startTransition(async () => {
      try {
        await updateCategoryMutation.mutateAsync({
          name: data.name,
          slug: data.slug,
          description: data.description || undefined,
          image: data.image || null,
          parentId: data.parentId || null,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
          showInProductMenu: data.showInProductMenu,
          productMenuPriority: data.productMenuPriority,
          metaTitle: data.metaTitle || undefined,
          metaDescription: data.metaDescription || undefined,
          optionTemplates: optionTemplates
            .map((template, index) => ({
              id: template.id,
              name: template.name.trim(),
              sortOrder: index,
            }))
            .filter((template) => template.name.length > 0),
        })

        toast.success("Category updated successfully!")
        router.push("/ops/categories")
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update category",
        )
      }
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteCategoryMutation.mutateAsync(category.id)
      toast.success("Category deleted successfully!")
      router.push("/ops/categories")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            Assigned products:{" "}
            <span className="font-medium">{category.productCount}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input id="name" {...register("name")} />
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
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" {...register("image")} />
            {errors.image && (
              <p className="text-sm text-red-500">{errors.image.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Category</Label>
            <Select
              value={watchedValues.parentId || "none"}
              onValueChange={(value) =>
                setValue("parentId", value === "none" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent category (optional)" />
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              min={0}
              {...register("sortOrder", { valueAsNumber: true })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="isActive">Active</Label>
              <p className="text-sm text-neutral-500">
                Inactive categories won&apos;t be shown on the storefront
              </p>
            </div>
            <Switch
              id="isActive"
              checked={watchedValues.isActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="productMenuPriority">Product Menu Priority</Label>
              <Input
                id="productMenuPriority"
                type="number"
                min={0}
                {...register("productMenuPriority", { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="showInProductMenu">Show In Product Menu</Label>
                <p className="text-sm text-neutral-500">
                  Only active top-level categories marked here can appear in the
                  storefront Products menu.
                </p>
              </div>
              <Switch
                id="showInProductMenu"
                checked={watchedValues.showInProductMenu}
                onCheckedChange={(checked) =>
                  setValue("showInProductMenu", checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variant Names</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Category
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the category &quot;{category.name}
                &quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}

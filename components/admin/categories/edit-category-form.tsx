"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

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
import { deleteCategory, updateCategory } from "@/lib/actions/category"

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(100),
  description: z.string().max(1000).optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
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

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parentId: category.parentId || "",
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    },
  })

  const {
    register,
    setValue,
    watch,
    formState: { errors, isDirty },
    handleSubmit,
  } = form

  const watchedValues = watch()

  const onSubmit = async (data: CategoryFormData) => {
    startTransition(async () => {
      try {
        await updateCategory(category.id, {
          name: data.name,
          slug: data.slug,
          description: data.description || undefined,
          parentId: data.parentId || null,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        })

        toast.success("Category updated successfully!")
        router.push("/admin/categories")
        router.refresh()
      } catch {
        toast.error("Failed to update category")
      }
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteCategory(category.id)
      if (result.success) {
        toast.success("Category deleted successfully!")
        router.push("/admin/categories")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to delete category")
      }
    } catch {
      toast.error("Something went wrong")
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
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Electronics"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              placeholder="e.g., electronics"
              {...register("slug")}
            />
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
            <p className="text-xs text-neutral-500">
              URL: /categories/{watchedValues.slug || "your-slug"}
            </p>
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
            <Textarea
              id="description"
              placeholder="Brief description of this category..."
              rows={4}
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              min={0}
              {...register("sortOrder", { valueAsNumber: true })}
            />
            <p className="text-xs text-neutral-500">
              Lower numbers appear first
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
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
                This action cannot be undone. This will permanently delete the
                category &quot;{category.name}&quot;.
                {category.parentId === null && (
                  <span className="block mt-2 font-medium text-amber-600">
                    Note: This is a root category. Any child categories will
                    need to be reassigned.
                  </span>
                )}
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

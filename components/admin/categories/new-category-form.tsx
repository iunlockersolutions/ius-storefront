"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

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
import { createCategory } from "@/lib/actions/category"
import { slugify } from "@/lib/utils"

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(100),
  description: z.string().max(1000).optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  metaKeywords: z.string().max(500).optional(),
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
}

export function NewCategoryForm({ categories }: NewCategoryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      parentId: "",
      sortOrder: 0,
      isActive: true,
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
    },
  })

  const {
    register,
    setValue,
    watch,
    formState: { errors },
    handleSubmit,
  } = form
  const watchedValues = watch()

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setValue("name", name)
    if (
      !watchedValues.slug ||
      watchedValues.slug === slugify(watchedValues.name)
    ) {
      setValue("slug", slugify(name))
    }
  }

  const onSubmit = async (data: CategoryFormData) => {
    startTransition(async () => {
      try {
        const result = await createCategory({
          ...data,
          parentId: data.parentId || undefined,
        })

        if (result.success) {
          toast.success("Category created successfully!")
          router.push("/admin/categories")
          router.refresh()
        } else {
          toast.error(result.error || "Failed to create category")
        }
      } catch (error) {
        toast.error("Something went wrong")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Electronics"
              {...register("name")}
              onChange={handleNameChange}
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
              This will be used in the category URL: /categories/
              {watchedValues.slug || "your-slug"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Category</Label>
            <Select
              value={watchedValues.parentId}
              onValueChange={(value) =>
                setValue("parentId", value === "none" ? "" : value)
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
              placeholder="Describe this category..."
              rows={4}
              {...register("description")}
            />
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
              <p className="text-xs text-neutral-500">
                Lower numbers appear first
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active</Label>
                <p className="text-xs text-neutral-500">Show in storefront</p>
              </div>
              <Switch
                id="isActive"
                checked={watchedValues.isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              placeholder="SEO optimized title"
              {...register("metaTitle")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              placeholder="Brief description for search engines..."
              rows={2}
              {...register("metaDescription")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaKeywords">Meta Keywords</Label>
            <Input
              id="metaKeywords"
              placeholder="keyword1, keyword2, keyword3"
              {...register("metaKeywords")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Category
        </Button>
      </div>
    </form>
  )
}

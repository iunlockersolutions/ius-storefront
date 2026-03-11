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
import { useCreateCategoryMutation } from "@/hooks/admin/use-category-mutations"
import { slugify } from "@/lib/utils"

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
}

export function NewCategoryForm({ categories }: NewCategoryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const createCategoryMutation = useCreateCategoryMutation()

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
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = form
  const watchedValues = watch()

  const handleNameChange = (name: string) => {
    setValue("name", name)
    if (
      !watchedValues.slug ||
      watchedValues.slug === slugify(watchedValues.name || "")
    ) {
      setValue("slug", slugify(name))
    }
  }

  const onSubmit = async (data: CategoryFormData) => {
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
        })

        toast.success("Category created successfully!")
        router.push("/ops/categories")
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        )
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
              value={watchedValues.name}
              onChange={(event) => handleNameChange(event.target.value)}
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
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" {...register("image")} />
            {errors.image && (
              <p className="text-sm text-red-500">{errors.image.message}</p>
            )}
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
            <Textarea id="description" rows={4} {...register("description")} />
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
                <p className="text-xs text-neutral-500">Show in storefront</p>
              </div>
              <Switch
                id="isActive"
                checked={watchedValues.isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="productMenuPriority">Product Menu Priority</Label>
              <Input
                id="productMenuPriority"
                type="number"
                min="0"
                {...register("productMenuPriority", { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="showInProductMenu">Show In Product Menu</Label>
                <p className="text-xs text-neutral-500">
                  Allow this top-level category to appear in the storefront
                  Products menu
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

"use client"

import { useMemo, useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { ImageUpload } from "@/components/shared/image-upload"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { slugify } from "@/lib/utils"

const brandSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  description: z.string().max(1000).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
})

type BrandFormData = z.infer<typeof brandSchema>

type UploadedImage = {
  id: string
  url: string
  altText?: string
  isPrimary?: boolean
}

type CategoryOption = {
  id: string
  name: string
  slug: string
}

type CategoryAssignmentValue = {
  categoryId: string
  navPriority: number
  showInProductMenu: boolean
}

interface BrandEditorFormProps {
  mode: "create" | "edit"
  categories: CategoryOption[]
  initialData?: {
    id: string
    name: string
    slug: string
    description: string | null
    logo: string | null
    websiteUrl: string | null
    isActive: boolean
    sortOrder: number
    metaTitle: string | null
    metaDescription: string | null
    productCount?: number
    modelCount?: number
    categoryAssignments: CategoryAssignmentValue[]
  }
  onSave: (payload: {
    name: string
    slug: string
    description?: string
    logo?: string | null
    websiteUrl?: string | null
    sortOrder: number
    isActive: boolean
    metaTitle?: string
    metaDescription?: string
    categoryAssignments: CategoryAssignmentValue[]
  }) => Promise<unknown>
  onDelete?: () => Promise<unknown>
  redirectTo?: string | null
  onCompleted?: () => void
  onCancel?: () => void
}

export function BrandEditorForm({
  mode,
  categories,
  initialData,
  onSave,
  onDelete,
  redirectTo = "/ops/brands",
  onCompleted,
  onCancel,
}: BrandEditorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [logoImages, setLogoImages] = useState<UploadedImage[]>(
    initialData?.logo
      ? [
          {
            id: initialData.id,
            url: initialData.logo,
            altText: initialData.name,
            isPrimary: true,
          },
        ]
      : [],
  )
  const [categoryAssignments, setCategoryAssignments] = useState<
    CategoryAssignmentValue[]
  >(initialData?.categoryAssignments ?? [])

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      websiteUrl: initialData?.websiteUrl || "",
      sortOrder: initialData?.sortOrder || 0,
      isActive: initialData?.isActive ?? true,
      metaTitle: initialData?.metaTitle || "",
      metaDescription: initialData?.metaDescription || "",
    },
  })

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = form

  const watchedValues = useWatch({
    control: form.control,
  })
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

  const handleNameChange = (name: string) => {
    setValue("name", name)
    if (
      !watchedValues.slug ||
      watchedValues.slug === slugify(watchedValues.name || "")
    ) {
      setValue("slug", slugify(name))
    }
  }

  const toggleCategory = (categoryId: string, checked: boolean) => {
    setCategoryAssignments((current) => {
      if (checked) {
        const nextPriority = current.length + 1
        return [
          ...current,
          {
            categoryId,
            navPriority: nextPriority,
            showInProductMenu: true,
          },
        ]
      }

      return current.filter(
        (assignment) => assignment.categoryId !== categoryId,
      )
    })
  }

  const updateAssignment = (
    categoryId: string,
    updates: Partial<CategoryAssignmentValue>,
  ) => {
    setCategoryAssignments((current) =>
      current.map((assignment) =>
        assignment.categoryId === categoryId
          ? { ...assignment, ...updates }
          : assignment,
      ),
    )
  }

  const submit = async (data: BrandFormData) => {
    startTransition(async () => {
      try {
        await onSave({
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

        toast.success(
          mode === "create"
            ? "Brand created successfully!"
            : "Brand updated successfully!",
        )
        if (redirectTo) {
          router.push(redirectTo)
        }
        router.refresh()
        onCompleted?.()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(typeof initialData?.productCount === "number" ||
            typeof initialData?.modelCount === "number") && (
            <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm md:grid-cols-2">
              <div>
                Assigned products:{" "}
                <span className="font-medium">
                  {initialData?.productCount ?? 0}
                </span>
              </div>
              <div>
                Models:{" "}
                <span className="font-medium">
                  {initialData?.modelCount ?? 0}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Brand Name *</Label>
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
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" {...register("slug")} />
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
          </div>

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
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input id="websiteUrl" {...register("websiteUrl")} />
            {errors.websiteUrl && (
              <p className="text-sm text-red-500">
                {errors.websiteUrl.message}
              </p>
            )}
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
                min={0}
                {...register("sortOrder", { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="isActive">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Show brand on the storefront
                </p>
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
          <CardTitle>Category Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Assign this brand to one or more top-level categories and set menu
            visibility/order for each category.
          </p>

          <div className="space-y-3">
            {categories.map((category) => {
              const assignment = assignmentMap.get(category.id)

              return (
                <div
                  key={category.id}
                  className="rounded-lg border p-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={Boolean(assignment)}
                          onCheckedChange={(checked) =>
                            toggleCategory(category.id, Boolean(checked))
                          }
                        />
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {category.slug}
                          </p>
                        </div>
                      </div>
                    </div>

                    {assignment ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Nav Priority</Label>
                          <Input
                            type="number"
                            min={0}
                            value={assignment.navPriority}
                            onChange={(event) =>
                              updateAssignment(category.id, {
                                navPriority: Number(event.target.value || 0),
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                          <div>
                            <Label>Show In Menu</Label>
                            <p className="text-xs text-muted-foreground">
                              Allow this brand under this category in Products
                              menu
                            </p>
                          </div>
                          <Switch
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
              )
            })}
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

      <div className="flex items-center justify-between">
        {onDelete ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Brand
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete brand?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the brand.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        await onDelete()
                        if (redirectTo) {
                          router.push(redirectTo)
                        }
                        router.refresh()
                        onCompleted?.()
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Failed to delete brand",
                        )
                      }
                    })
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span />
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel()
                return
              }

              if (redirectTo) {
                router.push(redirectTo)
                return
              }

              router.back()
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || (mode === "edit" && !isDirty)}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Brand" : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  )
}

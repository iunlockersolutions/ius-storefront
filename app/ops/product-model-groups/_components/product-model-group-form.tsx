"use client"

import { useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
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
import { slugify } from "@/lib/utils"
import {
  useCreateProductModelGroupMutation,
  useDeleteProductModelGroupMutation,
  useUpdateProductModelGroupMutation,
} from "@/services/mutations/use-product-model-group-mutations"

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  description: z.string().max(1000).optional(),
  primaryCategoryId: z.string().min(1, "Category is required"),
  brandId: z.string().min(1, "Brand is required"),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
  showInProductMenu: z.boolean().default(true),
  navPriority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

type FormValues = z.infer<typeof formSchema>

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

interface InitialData {
  id: string
  name: string
  slug: string
  description: string | null
  primaryCategoryId: string
  brandId: string
  metaTitle?: string | null
  metaDescription?: string | null
  showInProductMenu: boolean
  navPriority: number
  isActive: boolean
}

interface ProductModelGroupFormProps {
  mode: "create" | "edit"
  categories: CategoryOption[]
  brands: BrandOption[]
  initialData?: InitialData
  redirectTo?: string | null
  onCompleted?: () => void
  onCancel?: () => void
}

export function ProductModelGroupForm({
  mode,
  categories,
  brands,
  initialData,
  redirectTo = "/ops/models",
  onCompleted,
  onCancel,
}: ProductModelGroupFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const createMutation = useCreateProductModelGroupMutation()
  const updateMutation = useUpdateProductModelGroupMutation(
    initialData?.id || "",
  )
  const deleteMutation = useDeleteProductModelGroupMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      primaryCategoryId: initialData?.primaryCategoryId || "",
      brandId: initialData?.brandId || "",
      metaTitle: initialData?.metaTitle || "",
      metaDescription: initialData?.metaDescription || "",
      showInProductMenu: initialData?.showInProductMenu ?? true,
      navPriority: initialData?.navPriority ?? 0,
      isActive: initialData?.isActive ?? true,
    },
  })

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form

  const brandId = useWatch({
    control: form.control,
    name: "brandId",
  })
  const name = useWatch({
    control: form.control,
    name: "name",
  })
  const slug = useWatch({
    control: form.control,
    name: "slug",
  })
  const primaryCategoryId = useWatch({
    control: form.control,
    name: "primaryCategoryId",
  })
  const showInProductMenu = useWatch({
    control: form.control,
    name: "showInProductMenu",
  })
  const isActive = useWatch({
    control: form.control,
    name: "isActive",
  })

  const selectedBrand = brands.find((brand) => brand.id === brandId)
  const availableCategories =
    brandId.length > 0
      ? categories.filter((category) =>
          selectedBrand?.categoryAssignments.some(
            (assignment) => assignment.categoryId === category.id,
          ),
        )
      : categories

  const onSubmit = async (data: FormValues) => {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createMutation.mutateAsync({
            ...data,
            description: data.description || null,
            metaTitle: data.metaTitle || null,
            metaDescription: data.metaDescription || null,
          })
        } else if (initialData) {
          await updateMutation.mutateAsync({
            ...data,
            description: data.description || null,
            metaTitle: data.metaTitle || null,
            metaDescription: data.metaDescription || null,
          })
        }

        toast.success(
          mode === "create"
            ? "Model created successfully"
            : "Model updated successfully",
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

  const handleDelete = async () => {
    if (!initialData) {
      return
    }

    try {
      await deleteMutation.mutateAsync(initialData.id)
      toast.success("Model deleted successfully")
      if (redirectTo) {
        router.push(redirectTo)
      }
      router.refresh()
      onCompleted?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete model group",
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Model Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value
                setValue("name", nextName)

                if (!slug || slug === slugify(name || "")) {
                  setValue("slug", slugify(nextName))
                }
              }}
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Top-Level Category *</Label>
              <Select
                value={primaryCategoryId}
                onValueChange={(value) => setValue("primaryCategoryId", value)}
              >
                <SelectTrigger>
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
              {errors.primaryCategoryId && (
                <p className="text-sm text-red-500">
                  {errors.primaryCategoryId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Brand *</Label>
              <Select
                value={brandId}
                onValueChange={(value) => {
                  setValue("brandId", value)

                  const nextBrand = brands.find((brand) => brand.id === value)
                  if (
                    primaryCategoryId &&
                    !nextBrand?.categoryAssignments.some(
                      (assignment) =>
                        assignment.categoryId === primaryCategoryId,
                    )
                  ) {
                    setValue("primaryCategoryId", "")
                  }
                }}
              >
                <SelectTrigger>
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
              {errors.brandId && (
                <p className="text-sm text-red-500">{errors.brandId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} {...register("description")} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="navPriority">Navigation Priority</Label>
              <Input
                id="navPriority"
                type="number"
                min={0}
                {...register("navPriority", { valueAsNumber: true })}
              />
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="showInProductMenu">
                    Show In Product Menu
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Controls whether this model appears in the storefront menu.
                  </p>
                </div>
                <Switch
                  id="showInProductMenu"
                  checked={showInProductMenu}
                  onCheckedChange={(checked) =>
                    setValue("showInProductMenu", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive models are hidden from the storefront.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div>
          {mode === "edit" && initialData ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete model?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This is only allowed when no products are assigned to the
                    model.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
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
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {mode === "create" ? "Create Model" : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  )
}

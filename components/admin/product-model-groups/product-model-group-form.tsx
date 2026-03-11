"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import Link from "next/link"
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
import {
  useCreateProductModelGroupMutation,
  useDeleteProductModelGroupMutation,
  useUpdateProductModelGroupMutation,
} from "@/hooks/admin/use-product-model-group-mutations"
import { slugify } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  description: z.string().max(1000).optional(),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().min(1, "Brand is required"),
  showInProductMenu: z.boolean().default(true),
  menuPriority: z.number().int().min(0).default(0),
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
}

interface InitialData {
  id: string
  name: string
  slug: string
  description: string | null
  categoryId: string
  brandId: string
  showInProductMenu: boolean
  menuPriority: number
  isActive: boolean
}

interface ProductModelGroupFormProps {
  mode: "create" | "edit"
  categories: CategoryOption[]
  brands: BrandOption[]
  initialData?: InitialData
}

export function ProductModelGroupForm({
  mode,
  categories,
  brands,
  initialData,
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
      categoryId: initialData?.categoryId || "",
      brandId: initialData?.brandId || "",
      showInProductMenu: initialData?.showInProductMenu ?? true,
      menuPriority: initialData?.menuPriority ?? 0,
      isActive: initialData?.isActive ?? true,
    },
  })

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = form

  const values = watch()

  const onSubmit = async (data: FormValues) => {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createMutation.mutateAsync({
            ...data,
            description: data.description || null,
          })
        } else if (initialData) {
          await updateMutation.mutateAsync({
            ...data,
            description: data.description || null,
          })
        }

        toast.success(
          mode === "create"
            ? "Product model group created successfully"
            : "Product model group updated successfully",
        )
        router.push("/ops/product-model-groups")
        router.refresh()
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
      toast.success("Product model group deleted successfully")
      router.push("/ops/product-model-groups")
      router.refresh()
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
          <CardTitle>Model Group Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(event) => {
                const nextName = event.target.value
                setValue("name", nextName)

                if (
                  !values.slug ||
                  values.slug === slugify(values.name || "")
                ) {
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
                value={values.categoryId}
                onValueChange={(value) => setValue("categoryId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-red-500">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Brand *</Label>
              <Select
                value={values.brandId}
                onValueChange={(value) => setValue("brandId", value)}
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
              <Label htmlFor="menuPriority">Menu Priority</Label>
              <Input
                id="menuPriority"
                type="number"
                min={0}
                {...register("menuPriority", { valueAsNumber: true })}
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
                  checked={values.showInProductMenu}
                  onCheckedChange={(checked) =>
                    setValue("showInProductMenu", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive model groups are hidden from the storefront.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={values.isActive}
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
                  <AlertDialogTitle>Delete model group?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This is only allowed when no products are assigned to the
                    model group.
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
          <Button type="button" variant="outline" asChild>
            <Link href="/ops/product-model-groups">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {mode === "create" ? "Create Model Group" : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  )
}

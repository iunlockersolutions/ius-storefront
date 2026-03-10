"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { ImageUpload } from "@/components/admin/image-upload"
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

interface BrandEditorFormProps {
  mode: "create" | "edit"
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
  }) => Promise<unknown>
  onDelete?: () => Promise<unknown>
}

export function BrandEditorForm({
  mode,
  initialData,
  onSave,
  onDelete,
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
    watch,
    handleSubmit,
    formState: { errors, isDirty },
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
        })

        toast.success(
          mode === "create" ? "Brand created successfully!" : "Brand updated successfully!",
        )
        router.push("/ops/brands")
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {typeof initialData?.productCount === "number" && (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              Assigned products:{" "}
              <span className="font-medium">{initialData.productCount}</span>
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
              <p className="text-sm text-red-500">{errors.websiteUrl.message}</p>
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
                        router.push("/ops/brands")
                        router.refresh()
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
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || (mode === "edit" && !isDirty)}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Brand" : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  )
}

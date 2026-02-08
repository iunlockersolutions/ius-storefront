"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  deleteProduct,
  updateProduct,
  updateProductImages,
} from "@/lib/actions/product"
import { cn } from "@/lib/utils"

// Form schemas
const basicInfoSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
})

const pricingSchema = z.object({
  basePrice: z.string().min(1, "Price is required"),
  compareAtPrice: z.string().optional(),
  costPrice: z.string().optional(),
})

const settingsSchema = z.object({
  status: z.enum(["draft", "active", "archived"]),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
})

const productSchema = basicInfoSchema.merge(pricingSchema).merge(settingsSchema)
type ProductFormData = z.infer<typeof productSchema>

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

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  categoryId: string | null
  basePrice: string
  compareAtPrice: string | null
  costPrice: string | null
  status: "draft" | "active" | "archived"
  isFeatured: boolean
  metaTitle: string | null
  metaDescription: string | null
}

interface ProductImage {
  id: string
  url: string
  altText: string | null
  isPrimary: boolean
}

interface UploadedImage {
  id: string
  url: string
  altText?: string
  isPrimary?: boolean
}

interface EditProductFormProps {
  product: Product
  categories: Category[]
  images?: ProductImage[]
}

const steps = [
  { id: 1, name: "Basic Info", description: "Product name and description" },
  { id: 2, name: "Pricing", description: "Price details" },
  { id: 3, name: "Images", description: "Product photos and media" },
  { id: 4, name: "Settings", description: "Status and SEO settings" },
]

export function EditProductForm({
  product,
  categories,
  images: initialImages = [],
}: EditProductFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>(
    initialImages.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText || undefined,
      isPrimary: img.isPrimary,
    })),
  )
  const [imagesChanged, setImagesChanged] = useState(false)

  const handleImagesChange = (newImages: UploadedImage[]) => {
    setImages(newImages)
    setImagesChanged(true)
  }

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription || "",
      description: product.description || "",
      categoryId: product.categoryId || "",
      basePrice: product.basePrice,
      compareAtPrice: product.compareAtPrice || "",
      costPrice: product.costPrice || "",
      status: product.status,
      isFeatured: product.isFeatured,
      metaTitle: product.metaTitle || "",
      metaDescription: product.metaDescription || "",
    },
    mode: "onChange",
  })

  const {
    register,
    setValue,
    watch,
    formState: { errors, isDirty },
    trigger,
  } = form
  const watchedValues = watch()

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setValue("name", name)
  }

  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsToValidate: (keyof ProductFormData)[] = []

    switch (step) {
      case 1:
        fieldsToValidate.push(
          "name",
          "slug",
          "shortDescription",
          "description",
          "categoryId",
        )
        break
      case 2:
        fieldsToValidate.push("basePrice", "compareAtPrice", "costPrice")
        break
      case 3:
        // Images step - no form validation needed
        return true
      case 4:
        fieldsToValidate.push(
          "status",
          "isFeatured",
          "metaTitle",
          "metaDescription",
        )
        break
    }

    return await trigger(fieldsToValidate)
  }

  const nextStep = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    startTransition(async () => {
      try {
        await updateProduct(product.id, {
          name: data.name,
          slug: data.slug,
          description: data.description || undefined,
          shortDescription: data.shortDescription || undefined,
          categoryId: data.categoryId || undefined,
          basePrice: data.basePrice,
          compareAtPrice: data.compareAtPrice || undefined,
          costPrice: data.costPrice || undefined,
          status: data.status,
          isFeatured: data.isFeatured,
          metaTitle: data.metaTitle || undefined,
          metaDescription: data.metaDescription || undefined,
        })

        // Update images if changed
        if (imagesChanged) {
          await updateProductImages(
            product.id,
            images.map((img) => ({
              id: img.id,
              url: img.url,
              altText: img.altText,
              isPrimary: img.isPrimary,
            })),
          )
        }

        toast.success("Product updated successfully!")
        router.push("/admin/products")
        router.refresh()
      } catch {
        toast.error("Failed to update product")
      }
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteProduct(product.id)
      toast.success("Product deleted successfully!")
      router.push("/admin/products")
      router.refresh()
    } catch {
      toast.error("Failed to delete product")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step Progress */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li
              key={step.id}
              className={cn(
                stepIdx !== steps.length - 1 ? "flex-1" : "",
                "relative",
              )}
            >
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full cursor-pointer",
                    currentStep > step.id
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : currentStep === step.id
                        ? "border-2 border-primary bg-background"
                        : "border-2 border-neutral-300 bg-background hover:border-neutral-400",
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        currentStep === step.id
                          ? "text-primary"
                          : "text-neutral-500",
                      )}
                    >
                      {step.id}
                    </span>
                  )}
                </button>
                {stepIdx !== steps.length - 1 && (
                  <div
                    className={cn(
                      "ml-4 h-0.5 flex-1",
                      currentStep > step.id ? "bg-primary" : "bg-neutral-200",
                    )}
                  />
                )}
              </div>
              <div className="mt-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    currentStep >= step.id
                      ? "text-primary"
                      : "text-neutral-500",
                  )}
                >
                  {step.name}
                </span>
                <p className="text-xs text-neutral-500">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the basic details about your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., iPhone 15 Pro"
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
                  placeholder="e.g., iphone-15-pro"
                  {...register("slug")}
                />
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
                <p className="text-xs text-neutral-500">
                  URL: /products/{watchedValues.slug || "your-slug"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={watchedValues.categoryId}
                  onValueChange={(value) => setValue("categoryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Textarea
                  id="shortDescription"
                  placeholder="Brief description for product listings..."
                  rows={2}
                  {...register("shortDescription")}
                />
                <p className="text-xs text-neutral-500">
                  {watchedValues.shortDescription?.length || 0}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed product description..."
                  rows={6}
                  {...register("description")}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Pricing */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Update pricing details for this product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("basePrice")}
                  />
                  {errors.basePrice && (
                    <p className="text-sm text-red-500">
                      {errors.basePrice.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Compare at Price</Label>
                  <Input
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("compareAtPrice")}
                  />
                  <p className="text-xs text-neutral-500">
                    Original price for showing discounts
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("costPrice")}
                />
                <p className="text-xs text-neutral-500">
                  For profit calculations (not shown to customers)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Images */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>
                Upload high-quality images of your product. The first image will
                be the primary image.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={images}
                onChange={handleImagesChange}
                maxImages={10}
                folder="products"
              />
            </CardContent>
          </Card>
        )}

        {/* Step 4: Settings */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Settings & SEO</CardTitle>
              <CardDescription>
                Configure product status and search engine optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watchedValues.status}
                  onValueChange={(value: "draft" | "active" | "archived") =>
                    setValue("status", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isFeatured">Featured Product</Label>
                  <p className="text-sm text-neutral-500">
                    Display this product in featured sections
                  </p>
                </div>
                <Switch
                  id="isFeatured"
                  checked={watchedValues.isFeatured}
                  onCheckedChange={(checked) => setValue("isFeatured", checked)}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">SEO Settings</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      placeholder="SEO optimized title"
                      {...register("metaTitle")}
                    />
                    <p className="text-xs text-neutral-500">
                      {watchedValues.metaTitle?.length || 0}/200 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      placeholder="Brief description for search engines..."
                      rows={3}
                      {...register("metaDescription")}
                    />
                    <p className="text-xs text-neutral-500">
                      {watchedValues.metaDescription?.length || 0}/500
                      characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-red-600 mb-4">
                  Danger Zone
                </h3>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-800">
                        Delete this product
                      </p>
                      <p className="text-sm text-red-600">
                        Once deleted, this product cannot be recovered.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Product</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{product.name}
                            &quot;? This action cannot be undone. All variants,
                            images, and inventory data will be permanently
                            removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Delete Product
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>

            {currentStep < steps.length ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending || !isDirty}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

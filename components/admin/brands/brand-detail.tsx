"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { ExternalLink, Loader2, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { CategorySectionSheet } from "@/components/admin/categories/category-section-sheet"
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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import type { AdminBrand } from "@/hooks/admin/use-admin-brands-query"
import {
  useDeleteBrandMutation,
  useUpdateBrandMutation,
} from "@/hooks/admin/use-brand-mutations"
import { formatDate, slugify } from "@/lib/utils"

const identitySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
})

const descriptionSchema = z.object({
  description: z.string().max(1000).optional(),
})

const presenceSchema = z.object({
  websiteUrl: z
    .string()
    .url("Enter a valid website URL")
    .optional()
    .or(z.literal("")),
})

const storefrontSchema = z.object({
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

const seoSchema = z.object({
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
})

type IdentityFormValues = z.infer<typeof identitySchema>
type DescriptionFormValues = z.infer<typeof descriptionSchema>
type PresenceFormValues = z.infer<typeof presenceSchema>
type StorefrontFormValues = z.infer<typeof storefrontSchema>
type SeoFormValues = z.infer<typeof seoSchema>

type EditorKey =
  | "identity"
  | "description"
  | "presence"
  | "assignments"
  | "storefront"
  | "seo"
  | null

type UploadedImage = {
  id: string
  url: string
  altText?: string
  isPrimary?: boolean
}

type CategoryAssignmentValue = {
  categoryId: string
  navPriority: number
  showInProductMenu: boolean
}

interface CategoryOption {
  id: string
  name: string
  slug: string
}

interface BrandDetailProps {
  brand: AdminBrand
  categories: CategoryOption[]
  onRefresh: () => Promise<unknown>
}

function Section({
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

function buildBrandUpdatePayload(
  brand: AdminBrand,
  overrides: Partial<{
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
  }>,
) {
  return {
    name: overrides.name ?? brand.name,
    slug: overrides.slug ?? brand.slug,
    description:
      overrides.description !== undefined
        ? overrides.description
        : (brand.description ?? undefined),
    logo: overrides.logo !== undefined ? overrides.logo : (brand.logo ?? null),
    websiteUrl:
      overrides.websiteUrl !== undefined
        ? overrides.websiteUrl
        : (brand.websiteUrl ?? null),
    sortOrder: overrides.sortOrder ?? brand.sortOrder,
    isActive: overrides.isActive ?? brand.isActive,
    metaTitle:
      overrides.metaTitle !== undefined
        ? overrides.metaTitle
        : (brand.metaTitle ?? undefined),
    metaDescription:
      overrides.metaDescription !== undefined
        ? overrides.metaDescription
        : (brand.metaDescription ?? undefined),
    categoryAssignments:
      overrides.categoryAssignments ??
      brand.categoryAssignments.map((assignment) => ({
        categoryId: assignment.categoryId,
        navPriority: assignment.navPriority,
        showInProductMenu: assignment.showInProductMenu,
      })),
  }
}

export function BrandDetail({
  brand,
  categories,
  onRefresh,
}: BrandDetailProps) {
  const router = useRouter()
  const [activeEditor, setActiveEditor] = useState<EditorKey>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const updateBrandMutation = useUpdateBrandMutation(brand.id)
  const deleteBrandMutation = useDeleteBrandMutation()

  const handleSectionSave = async (
    payload: Parameters<typeof updateBrandMutation.mutateAsync>[0],
    successMessage: string,
  ) => {
    await updateBrandMutation.mutateAsync(payload)
    await onRefresh()
    toast.success(successMessage)
    setActiveEditor(null)
  }

  const handleDeleteBrand = async () => {
    try {
      await deleteBrandMutation.mutateAsync(brand.id)
      toast.success("Brand deleted successfully")
      router.push("/ops/catalog-setup?tab=brands")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete brand",
      )
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/ops/catalog-setup?tab=brands">Back to Brands</Link>
            </Button>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {brand.name}
                </h1>
                <Badge
                  className={
                    brand.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-neutral-100 text-neutral-800"
                  }
                >
                  {brand.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">/{brand.slug}</p>
            </div>
          </div>

          <Button variant="outline" asChild>
            <Link href={`/brands/${brand.slug}`} target="_blank">
              View Storefront
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="space-y-8">
          <Section
            title="Identity"
            description="Core naming for this brand."
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
              <DetailItem label="Brand name" value={brand.name} />
              <DetailItem label="Slug" value={`/${brand.slug}`} />
            </div>
          </Section>

          <Section
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
            {brand.description ? (
              <p className="whitespace-pre-wrap text-sm leading-7">
                {brand.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No description has been added yet.
              </p>
            )}
          </Section>

          <Section
            title="Brand Presence"
            description="Logo and website metadata used in the storefront."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveEditor("presence")}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            }
          >
            <div className="grid gap-6 sm:grid-cols-[120px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-2xl border bg-muted/30">
                {brand.logo ? (
                  <div className="relative aspect-square">
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
                    No logo
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Website URL"
                  value={brand.websiteUrl || "No website URL"}
                />
                <DetailItem
                  label="Logo URL"
                  value={brand.logo || "No logo URL"}
                />
              </div>
            </div>
          </Section>

          <Section
            title="Category Assignments"
            description="Top-level categories this brand is assigned to."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveEditor("assignments")}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            }
          >
            {brand.categoryAssignments.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No category assignments yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Menu</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brand.categoryAssignments.map((assignment) => (
                    <TableRow key={assignment.categoryId}>
                      <TableCell className="font-medium">
                        {assignment.categoryName}
                      </TableCell>
                      <TableCell>
                        {assignment.showInProductMenu ? "Visible" : "Hidden"}
                      </TableCell>
                      <TableCell>{assignment.navPriority}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>

          <Section
            title="Storefront Settings"
            description="Visibility, ordering, and catalog counters."
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
                value={brand.isActive ? "Yes" : "No"}
              />
              <DetailItem label="Sort order" value={String(brand.sortOrder)} />
              <DetailItem
                label="Assigned products"
                value={String(brand.productCount)}
              />
              <DetailItem
                label="Assigned models"
                value={String(brand.modelCount ?? 0)}
              />
            </div>
          </Section>

          <Section
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
                value={brand.metaTitle || "No meta title"}
              />
              <DetailItem
                label="Meta description"
                value={brand.metaDescription || "No meta description"}
              />
            </div>
          </Section>

          <Section
            title="Timestamps"
            description="Creation and update history for this brand."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Created"
                value={
                  brand.createdAt ? formatDate(brand.createdAt) : "Unknown"
                }
              />
              <DetailItem
                label="Updated"
                value={
                  brand.updatedAt ? formatDate(brand.updatedAt) : "Unknown"
                }
              />
            </div>
          </Section>

          <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">
                  Danger Zone
                </h2>
                <p className="text-sm text-muted-foreground">
                  Delete this brand if it is no longer needed.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete brand
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Brands with linked models or products must be cleaned up before
              deletion.
            </p>
          </section>
        </div>
      </div>

      <BrandIdentityEditorSheet
        key={`identity-${brand.id}-${brand.name}-${brand.slug}`}
        open={activeEditor === "identity"}
        onOpenChange={(open) => setActiveEditor(open ? "identity" : null)}
        brand={brand}
        isPending={updateBrandMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              buildBrandUpdatePayload(brand, {
                name: values.name,
                slug: values.slug,
              }),
              "Brand identity updated",
            )
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update brand identity",
            )
          }
        }}
      />

      <BrandDescriptionEditorSheet
        key={`description-${brand.id}-${brand.updatedAt ?? "none"}`}
        open={activeEditor === "description"}
        onOpenChange={(open) => setActiveEditor(open ? "description" : null)}
        brand={brand}
        isPending={updateBrandMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              buildBrandUpdatePayload(brand, {
                description: values.description || undefined,
              }),
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

      <BrandPresenceEditorSheet
        key={`presence-${brand.id}-${brand.logo ?? "none"}-${brand.websiteUrl ?? "none"}`}
        open={activeEditor === "presence"}
        onOpenChange={(open) => setActiveEditor(open ? "presence" : null)}
        brand={brand}
        isPending={updateBrandMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              buildBrandUpdatePayload(brand, {
                logo: values.logo,
                websiteUrl: values.websiteUrl || null,
              }),
              "Brand presence updated",
            )
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update brand presence",
            )
          }
        }}
      />

      <BrandAssignmentsEditorSheet
        key={`assignments-${brand.id}-${brand.categoryAssignments
          .map(
            (assignment) =>
              `${assignment.categoryId}:${assignment.navPriority}:${assignment.showInProductMenu}`,
          )
          .join("|")}`}
        open={activeEditor === "assignments"}
        onOpenChange={(open) => setActiveEditor(open ? "assignments" : null)}
        categories={categories}
        assignments={brand.categoryAssignments.map((assignment) => ({
          categoryId: assignment.categoryId,
          navPriority: assignment.navPriority,
          showInProductMenu: assignment.showInProductMenu,
        }))}
        isPending={updateBrandMutation.isPending}
        onSave={async (assignments) => {
          try {
            await handleSectionSave(
              buildBrandUpdatePayload(brand, {
                categoryAssignments: assignments,
              }),
              "Category assignments updated",
            )
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update category assignments",
            )
          }
        }}
      />

      <BrandStorefrontEditorSheet
        key={`storefront-${brand.id}-${brand.sortOrder}-${brand.isActive}`}
        open={activeEditor === "storefront"}
        onOpenChange={(open) => setActiveEditor(open ? "storefront" : null)}
        brand={brand}
        isPending={updateBrandMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              buildBrandUpdatePayload(brand, {
                sortOrder: values.sortOrder,
                isActive: values.isActive,
              }),
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

      <BrandSeoEditorSheet
        key={`seo-${brand.id}-${brand.metaTitle ?? "none"}-${brand.metaDescription ?? "none"}`}
        open={activeEditor === "seo"}
        onOpenChange={(open) => setActiveEditor(open ? "seo" : null)}
        brand={brand}
        isPending={updateBrandMutation.isPending}
        onSave={async (values) => {
          try {
            await handleSectionSave(
              buildBrandUpdatePayload(brand, {
                metaTitle: values.metaTitle || undefined,
                metaDescription: values.metaDescription || undefined,
              }),
              "SEO updated",
            )
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Failed to update SEO",
            )
          }
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete brand?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Brands assigned to models or
              products must be cleaned up first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBrand}
              disabled={deleteBrandMutation.isPending}
            >
              {deleteBrandMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function BrandIdentityEditorSheet({
  open,
  onOpenChange,
  brand,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand: AdminBrand
  isPending: boolean
  onSave: (values: IdentityFormValues) => Promise<void>
}) {
  const form = useForm<IdentityFormValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      name: brand.name,
      slug: brand.slug,
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

  useEffect(() => {
    if (open) {
      reset({
        name: brand.name,
        slug: brand.slug,
      })
    }
  }, [brand.name, brand.slug, open, reset])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Identity"
      description="Update the brand name and slug."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="brand-identity-form" type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="brand-identity-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="brand-identity-name">Brand Name</Label>
          <Input
            id="brand-identity-name"
            {...nameField}
            value={watchedName ?? ""}
            onChange={(event) => {
              nameField.onChange(event)
              if (!watchedSlug || watchedSlug === slugify(brand.name || "")) {
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
          <Label htmlFor="brand-identity-slug">Slug</Label>
          <Input id="brand-identity-slug" {...register("slug")} />
          {errors.slug ? (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          ) : null}
        </div>
      </form>
    </CategorySectionSheet>
  )
}

function BrandDescriptionEditorSheet({
  open,
  onOpenChange,
  brand,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand: AdminBrand
  isPending: boolean
  onSave: (values: DescriptionFormValues) => Promise<void>
}) {
  const form = useForm<DescriptionFormValues>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: {
      description: brand.description || "",
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
        description: brand.description || "",
      })
    }
  }, [brand.description, open, reset])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Description"
      description="Update the brand description."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            form="brand-description-form"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="brand-description-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="brand-description">Description</Label>
          <Textarea
            id="brand-description"
            rows={6}
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

function BrandPresenceEditorSheet({
  open,
  onOpenChange,
  brand,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand: AdminBrand
  isPending: boolean
  onSave: (values: {
    logo: string | null
    websiteUrl?: string
  }) => Promise<void>
}) {
  const initialLogoImages = useMemo<UploadedImage[]>(
    () =>
      brand.logo
        ? [
            {
              id: brand.id,
              url: brand.logo,
              altText: brand.name,
              isPrimary: true,
            },
          ]
        : [],
    [brand.id, brand.logo, brand.name],
  )
  const [logoImages, setLogoImages] =
    useState<UploadedImage[]>(initialLogoImages)

  const form = useForm<PresenceFormValues>({
    resolver: zodResolver(presenceSchema),
    defaultValues: {
      websiteUrl: brand.websiteUrl || "",
    },
  })

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = form

  const hasLogoChanged = (logoImages[0]?.url || null) !== (brand.logo || null)

  useEffect(() => {
    if (open) {
      reset({
        websiteUrl: brand.websiteUrl || "",
      })
    }
  }, [brand.websiteUrl, open, reset])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Brand Presence"
      description="Update the logo and website URL for this brand."
      isDirty={isDirty || hasLogoChanged}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="brand-presence-form" type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="brand-presence-form"
        onSubmit={handleSubmit(async (values) =>
          onSave({
            logo: logoImages[0]?.url || null,
            websiteUrl: values.websiteUrl || undefined,
          }),
        )}
        className="space-y-5"
      >
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
          <Label htmlFor="brand-presence-website">Website URL</Label>
          <Input id="brand-presence-website" {...register("websiteUrl")} />
          {errors.websiteUrl ? (
            <p className="text-sm text-destructive">
              {errors.websiteUrl.message}
            </p>
          ) : null}
        </div>
      </form>
    </CategorySectionSheet>
  )
}

function BrandAssignmentsEditorSheet({
  open,
  onOpenChange,
  categories,
  assignments,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: CategoryOption[]
  assignments: CategoryAssignmentValue[]
  isPending: boolean
  onSave: (values: CategoryAssignmentValue[]) => Promise<void>
}) {
  const [draftAssignments, setDraftAssignments] =
    useState<CategoryAssignmentValue[]>(assignments)

  const assignmentMap = useMemo(
    () =>
      new Map(
        draftAssignments.map((assignment) => [
          assignment.categoryId,
          assignment,
        ]),
      ),
    [draftAssignments],
  )

  const isDirty =
    JSON.stringify(draftAssignments) !== JSON.stringify(assignments)

  const toggleCategory = (categoryId: string, checked: boolean) => {
    setDraftAssignments((currentAssignments) => {
      if (checked) {
        if (
          currentAssignments.some(
            (assignment) => assignment.categoryId === categoryId,
          )
        ) {
          return currentAssignments
        }

        return [
          ...currentAssignments,
          {
            categoryId,
            navPriority: currentAssignments.length + 1,
            showInProductMenu: true,
          },
        ]
      }

      return currentAssignments
        .filter((assignment) => assignment.categoryId !== categoryId)
        .map((assignment, index) => ({
          ...assignment,
          navPriority:
            assignment.navPriority > 0 ? assignment.navPriority : index + 1,
        }))
    })
  }

  const updateAssignment = (
    categoryId: string,
    updates: Partial<CategoryAssignmentValue>,
  ) => {
    setDraftAssignments((currentAssignments) =>
      currentAssignments.map((assignment) =>
        assignment.categoryId === categoryId
          ? { ...assignment, ...updates }
          : assignment,
      ),
    )
  }

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Category Assignments"
      description="Manage top-level categories and per-category storefront settings for this brand."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => onSave(draftAssignments)}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {categories.map((category) => {
          const assignment = assignmentMap.get(category.id)
          const isSelected = Boolean(assignment)

          return (
            <div
              key={category.id}
              className="rounded-2xl border border-border/70 bg-background p-4"
            >
              <div className="flex items-start gap-3">
                <input
                  id={`brand-assignment-${category.id}`}
                  type="checkbox"
                  checked={isSelected}
                  onChange={(event) =>
                    toggleCategory(category.id, event.target.checked)
                  }
                  className="mt-1 size-4"
                />
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor={`brand-assignment-${category.id}`}>
                      {category.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      /{category.slug}
                    </p>
                  </div>

                  {assignment ? (
                    <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`brand-assignment-priority-${category.id}`}
                        >
                          Navigation Priority
                        </Label>
                        <Input
                          id={`brand-assignment-priority-${category.id}`}
                          type="number"
                          inputMode="numeric"
                          value={String(assignment.navPriority)}
                          onChange={(event) =>
                            updateAssignment(category.id, {
                              navPriority: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
                        <div className="space-y-1">
                          <Label
                            htmlFor={`brand-assignment-menu-${category.id}`}
                          >
                            Show In Product Menu
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Show this brand under this category in the
                            storefront product menu.
                          </p>
                        </div>
                        <Switch
                          id={`brand-assignment-menu-${category.id}`}
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
            </div>
          )
        })}
      </div>
    </CategorySectionSheet>
  )
}

function BrandStorefrontEditorSheet({
  open,
  onOpenChange,
  brand,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand: AdminBrand
  isPending: boolean
  onSave: (values: StorefrontFormValues) => Promise<void>
}) {
  const form = useForm<StorefrontFormValues>({
    resolver: zodResolver(storefrontSchema),
    defaultValues: {
      sortOrder: brand.sortOrder,
      isActive: brand.isActive,
    },
  })

  const {
    register,
    reset,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = form

  const isActive = useWatch({
    control: form.control,
    name: "isActive",
  })

  useEffect(() => {
    if (open) {
      reset({
        sortOrder: brand.sortOrder,
        isActive: brand.isActive,
      })
    }
  }, [brand.isActive, brand.sortOrder, open, reset])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Storefront Settings"
      description="Update brand visibility and sort order."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            form="brand-storefront-form"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="brand-storefront-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="brand-storefront-sort-order">Sort Order</Label>
          <Input
            id="brand-storefront-sort-order"
            type="number"
            {...register("sortOrder", { valueAsNumber: true })}
          />
          {errors.sortOrder ? (
            <p className="text-sm text-destructive">
              {errors.sortOrder.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/70 p-5">
          <div className="space-y-1">
            <Label htmlFor="brand-storefront-active">Active</Label>
            <p className="text-sm text-muted-foreground">
              Active brands appear across the storefront.
            </p>
          </div>
          <Switch
            id="brand-storefront-active"
            checked={isActive}
            onCheckedChange={(checked) =>
              setValue("isActive", checked, { shouldDirty: true })
            }
          />
        </div>
      </form>
    </CategorySectionSheet>
  )
}

function BrandSeoEditorSheet({
  open,
  onOpenChange,
  brand,
  isPending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand: AdminBrand
  isPending: boolean
  onSave: (values: SeoFormValues) => Promise<void>
}) {
  const form = useForm<SeoFormValues>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      metaTitle: brand.metaTitle || "",
      metaDescription: brand.metaDescription || "",
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
        metaTitle: brand.metaTitle || "",
        metaDescription: brand.metaDescription || "",
      })
    }
  }, [brand.metaDescription, brand.metaTitle, open, reset])

  return (
    <CategorySectionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit SEO"
      description="Update metadata used by search engines and social previews."
      isDirty={isDirty}
      isPending={isPending}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="brand-seo-form" type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="brand-seo-form"
        onSubmit={handleSubmit(onSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="brand-seo-title">Meta Title</Label>
          <Input id="brand-seo-title" {...register("metaTitle")} />
          {errors.metaTitle ? (
            <p className="text-sm text-destructive">
              {errors.metaTitle.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand-seo-description">Meta Description</Label>
          <Textarea
            id="brand-seo-description"
            rows={5}
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

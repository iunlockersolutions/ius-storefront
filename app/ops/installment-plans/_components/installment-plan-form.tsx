"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ImageUpload } from "@/components/shared/image-upload"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { routes } from "@/configs/routes"
import {
  type InstallmentPlanPayload,
  useCreateInstallmentPlanMutation,
  useUpdateInstallmentPlanMutation,
} from "@/services/mutations/use-installment-plan-mutations"
import { useAdminInstallmentPlanQuery } from "@/services/queries/use-admin-installment-plan-query"
import type { AdminInstallmentOffer } from "@/services/queries/use-admin-installment-plans-query"

type TermFormValue = {
  months: string
  label: string
  minimumAmount: string
  notes: string
}

type ImageValue = {
  id: string
  url: string
  altText?: string
  isPrimary?: boolean
}

interface InstallmentPlanFormProps {
  mode: "create" | "edit"
  offerId?: string
}

const emptyTerm = (): TermFormValue => ({
  months: "12",
  label: "Credit card",
  minimumAmount: "",
  notes: "",
})

function imageValue(url: string | null | undefined, altText: string) {
  if (!url) return []
  return [{ id: url, url, altText, isPrimary: true }]
}

function toNullable(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function buildPayload(state: FormState): InstallmentPlanPayload {
  return {
    title: state.title,
    slug: state.slug || null,
    providerName: state.providerName,
    logoUrl: state.logoUrl,
    bannerImageUrl: state.bannerImageUrl,
    summary: state.summary,
    description: state.description || null,
    readMoreLabel: state.readMoreLabel || "Read more",
    terms: state.terms
      .filter((term) => term.label.trim())
      .map((term) => ({
        months: Number(term.months),
        label: term.label.trim(),
        minimumAmount: toNullable(term.minimumAmount),
        notes: toNullable(term.notes),
      })),
    termsAndConditions: state.termsAndConditions
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    isPublished: state.isPublished,
    sortOrder: Number(state.sortOrder) || 0,
  }
}

function getInitialState(offer?: AdminInstallmentOffer | null): FormState {
  return {
    title: offer?.title ?? "",
    slug: offer?.slug ?? "",
    providerName: offer?.providerName ?? "",
    logoUrl: offer?.logoUrl ?? null,
    bannerImageUrl: offer?.bannerImageUrl ?? null,
    summary: offer?.summary ?? "",
    description: offer?.description ?? "",
    readMoreLabel: offer?.readMoreLabel ?? "Read more",
    terms:
      offer && offer.terms.length > 0
        ? offer.terms.map((term) => ({
            months: String(term.months),
            label: term.label,
            minimumAmount: term.minimumAmount ?? "",
            notes: term.notes ?? "",
          }))
        : [emptyTerm()],
    termsAndConditions: offer?.termsAndConditions.join("\n") ?? "",
    isPublished: offer?.isPublished ?? false,
    sortOrder: String(offer?.sortOrder ?? 0),
  }
}

type FormState = {
  title: string
  slug: string
  providerName: string
  logoUrl: string | null
  bannerImageUrl: string | null
  summary: string
  description: string
  readMoreLabel: string
  terms: TermFormValue[]
  termsAndConditions: string
  isPublished: boolean
  sortOrder: string
}

export function InstallmentPlanForm({
  mode,
  offerId,
}: InstallmentPlanFormProps) {
  const offerQuery = useAdminInstallmentPlanQuery(offerId ?? "")

  if (mode === "edit" && offerQuery.isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (mode === "edit" && offerQuery.error) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link href={routes.ops.installmentPlans.root}>
            <ArrowLeft className="size-4" />
            Back to installment plans
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Unable to load installment plan</CardTitle>
            <CardDescription>
              {offerQuery.error instanceof Error
                ? offerQuery.error.message
                : "The installment plan could not be loaded."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <InstallmentPlanEditor
      key={offerQuery.data?.id ?? "new-installment-plan"}
      mode={mode}
      offerId={offerId}
      initialOffer={mode === "edit" ? offerQuery.data : null}
    />
  )
}

function InstallmentPlanEditor({
  mode,
  offerId,
  initialOffer,
}: InstallmentPlanFormProps & {
  initialOffer?: AdminInstallmentOffer | null
}) {
  const router = useRouter()
  const createMutation = useCreateInstallmentPlanMutation()
  const updateMutation = useUpdateInstallmentPlanMutation(offerId ?? "")
  const [state, setState] = useState<FormState>(() =>
    getInitialState(initialOffer),
  )

  const title = mode === "create" ? "New installment plan" : "Edit plan"
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const logoImages = useMemo(
    () => imageValue(state.logoUrl, `${state.providerName} logo`),
    [state.logoUrl, state.providerName],
  )
  const bannerImages = useMemo(
    () => imageValue(state.bannerImageUrl, `${state.title} banner`),
    [state.bannerImageUrl, state.title],
  )

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setState((current) => ({ ...current, [key]: value }))
  }

  const updateTerm = (
    index: number,
    key: keyof TermFormValue,
    value: string,
  ) => {
    setState((current) => ({
      ...current,
      terms: current.terms.map((term, termIndex) =>
        termIndex === index ? { ...term, [key]: value } : term,
      ),
    }))
  }

  const addTerm = () => {
    setState((current) => ({
      ...current,
      terms: [...current.terms, emptyTerm()],
    }))
  }

  const removeTerm = (index: number) => {
    setState((current) => ({
      ...current,
      terms:
        current.terms.length > 1
          ? current.terms.filter((_, termIndex) => termIndex !== index)
          : current.terms,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const payload = buildPayload(state)

      if (mode === "create") {
        const created = await createMutation.mutateAsync(payload)
        toast.success("Installment plan created")
        router.push(routes.ops.installmentPlans.id(created.id))
      } else if (offerId) {
        await updateMutation.mutateAsync(payload)
        toast.success("Installment plan updated")
        router.refresh()
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save installment plan",
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2 -ml-2">
            <Link href={routes.ops.installmentPlans.root}>
              <ArrowLeft className="size-4" />
              Back to installment plans
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">
            Create customer-facing 0% installment notices without hard-coded
            storefront content.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href={routes.ops.installmentPlans.root}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Save plan
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                This copy appears on the listing and detail pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={state.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="0% installments with selected cards"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="providerName">Bank or service name</Label>
                <Input
                  id="providerName"
                  value={state.providerName}
                  onChange={(event) =>
                    updateField("providerName", event.target.value)
                  }
                  placeholder="Commercial Bank"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={state.slug}
                  onChange={(event) => updateField("slug", event.target.value)}
                  placeholder="Auto-generated from title if empty"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="summary">Short summary</Label>
                <Textarea
                  id="summary"
                  value={state.summary}
                  onChange={(event) =>
                    updateField("summary", event.target.value)
                  }
                  placeholder="A short card summary for the public listing."
                  rows={3}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Rich description</Label>
                <Textarea
                  id="description"
                  value={state.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  placeholder="Add details, eligibility notes, and how customers can use this plan."
                  rows={8}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="readMoreLabel">Read more label</Label>
                <Input
                  id="readMoreLabel"
                  value={state.readMoreLabel}
                  onChange={(event) =>
                    updateField("readMoreLabel", event.target.value)
                  }
                  placeholder="Read more"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Installment terms</CardTitle>
              <CardDescription>
                Add the structured terms customers can scan quickly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.terms.map((term, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg border p-4 md:grid-cols-[7rem_1fr_12rem] md:items-end"
                >
                  <div className="grid gap-2">
                    <Label htmlFor={`term-months-${index}`}>Months</Label>
                    <Input
                      id={`term-months-${index}`}
                      type="number"
                      min={1}
                      max={120}
                      value={term.months}
                      onChange={(event) =>
                        updateTerm(index, "months", event.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`term-label-${index}`}>
                      Card or service label
                    </Label>
                    <Input
                      id={`term-label-${index}`}
                      value={term.label}
                      onChange={(event) =>
                        updateTerm(index, "label", event.target.value)
                      }
                      placeholder="Visa / Mastercard"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`term-minimum-${index}`}>
                      Minimum amount
                    </Label>
                    <Input
                      id={`term-minimum-${index}`}
                      value={term.minimumAmount}
                      onChange={(event) =>
                        updateTerm(index, "minimumAmount", event.target.value)
                      }
                      placeholder="LKR 25,000"
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor={`term-notes-${index}`}>Notes</Label>
                    <Input
                      id={`term-notes-${index}`}
                      value={term.notes}
                      onChange={(event) =>
                        updateTerm(index, "notes", event.target.value)
                      }
                      placeholder="Selected cards only"
                    />
                  </div>
                  <div className="flex md:justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeTerm(index)}
                      disabled={state.terms.length === 1}
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addTerm}>
                <Plus className="size-4" />
                Add term
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Terms and conditions</CardTitle>
              <CardDescription>
                Add one condition per line. These appear as a simple public
                checklist.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={state.termsAndConditions}
                onChange={(event) =>
                  updateField("termsAndConditions", event.target.value)
                }
                placeholder="Offer applies to selected bank cards only&#10;Bank approval is subject to issuer terms"
                rows={7}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
              <CardDescription>
                Publish to show this notice on the storefront.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <Label htmlFor="isPublished">Published</Label>
                  <p className="text-sm text-muted-foreground">
                    Drafts are hidden from customers.
                  </p>
                </div>
                <Switch
                  id="isPublished"
                  checked={state.isPublished}
                  onCheckedChange={(checked) =>
                    updateField("isPublished", checked)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={state.sortOrder}
                  onChange={(event) =>
                    updateField("sortOrder", event.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>
                Upload the bank or service logo shown on cards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={logoImages}
                onChange={(images: ImageValue[]) =>
                  updateField("logoUrl", images[0]?.url ?? null)
                }
                maxImages={1}
                folder="installment-plans"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Banner image</CardTitle>
              <CardDescription>
                Optional wide image for the offer detail page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={bannerImages}
                onChange={(images: ImageValue[]) =>
                  updateField("bannerImageUrl", images[0]?.url ?? null)
                }
                maxImages={1}
                folder="installment-plans"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}

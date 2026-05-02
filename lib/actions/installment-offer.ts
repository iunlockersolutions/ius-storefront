"use server"

import { revalidatePath } from "next/cache"

import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm"
import { z } from "zod"

import { routes } from "@/configs/routes"
import { requireResourcePermission } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { installmentOffers, type InstallmentOfferTerm } from "@/lib/db/schema"

const installmentTermSchema = z.object({
  months: z.coerce.number().int().min(1).max(120),
  label: z.string().trim().min(1).max(120),
  minimumAmount: z.string().trim().max(80).optional().nullable(),
  notes: z.string().trim().max(300).optional().nullable(),
})

const installmentOfferSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().max(220).optional().nullable(),
  providerName: z.string().trim().min(1).max(160),
  logoUrl: z.string().url().optional().nullable(),
  bannerImageUrl: z.string().url().optional().nullable(),
  summary: z.string().trim().min(1).max(280),
  description: z.string().trim().max(5000).optional().nullable(),
  readMoreLabel: z.string().trim().min(1).max(80).default("Read more"),
  terms: z.array(installmentTermSchema).default([]),
  termsAndConditions: z.array(z.string().trim().min(1).max(500)).default([]),
  isPublished: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
})

const updateInstallmentOfferSchema = installmentOfferSchema.partial()

const adminListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(["all", "published", "draft"]).default("all"),
})

export type InstallmentOfferInput = z.infer<typeof installmentOfferSchema>

export type AdminInstallmentOffer = typeof installmentOffers.$inferSelect

function normalizeNullable(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function normalizeTerms(
  terms: z.infer<typeof installmentTermSchema>[],
): InstallmentOfferTerm[] {
  return terms.map((term) => ({
    months: term.months,
    label: term.label,
    minimumAmount: normalizeNullable(term.minimumAmount),
    notes: normalizeNullable(term.notes),
  }))
}

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function resolveUniqueSlug(title: string, preferredSlug?: string | null) {
  const baseSlug = generateSlug(preferredSlug || title) || "installment-plan"
  let nextSlug = baseSlug
  let suffix = 2

  while (true) {
    const [existing] = await db
      .select({ id: installmentOffers.id })
      .from(installmentOffers)
      .where(eq(installmentOffers.slug, nextSlug))
      .limit(1)

    if (!existing) return nextSlug

    nextSlug = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

async function assertUniqueSlug(slug: string, offerId: string) {
  const [existing] = await db
    .select({ id: installmentOffers.id })
    .from(installmentOffers)
    .where(eq(installmentOffers.slug, slug))
    .limit(1)

  if (existing && existing.id !== offerId) {
    throw new Error("An installment plan with this slug already exists")
  }
}

function assertPublishable(input: {
  title: string
  providerName: string
  summary: string
  terms: InstallmentOfferTerm[]
}) {
  if (!input.title.trim()) {
    throw new Error("Title is required before publishing")
  }

  if (!input.providerName.trim()) {
    throw new Error("Provider name is required before publishing")
  }

  if (!input.summary.trim()) {
    throw new Error("Summary is required before publishing")
  }

  if (input.terms.length === 0) {
    throw new Error(
      "At least one installment term is required before publishing",
    )
  }
}

function revalidateInstallmentOfferPaths(slug?: string | null) {
  revalidatePath(routes.storefront.installmentPlans.root)
  revalidatePath(routes.ops.installmentPlans.root)

  if (slug) {
    revalidatePath(routes.storefront.installmentPlans.id(slug))
  }
}

export async function getAdminInstallmentOffers(
  input?: Partial<z.infer<typeof adminListSchema>>,
) {
  await requireResourcePermission("installment_plan", "list")

  const parsed = adminListSchema.parse(input ?? {})
  const offset = (parsed.page - 1) * parsed.limit
  const conditions = []

  if (parsed.status === "published") {
    conditions.push(eq(installmentOffers.isPublished, true))
  }

  if (parsed.status === "draft") {
    conditions.push(eq(installmentOffers.isPublished, false))
  }

  if (parsed.search) {
    const searchPattern = `%${parsed.search}%`
    conditions.push(
      or(
        ilike(installmentOffers.title, searchPattern),
        ilike(installmentOffers.providerName, searchPattern),
        ilike(installmentOffers.slug, searchPattern),
      ),
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [totalRow] = await db
    .select({ count: count() })
    .from(installmentOffers)
    .where(where)

  const offers = await db
    .select()
    .from(installmentOffers)
    .where(where)
    .orderBy(
      desc(installmentOffers.updatedAt),
      asc(installmentOffers.sortOrder),
      asc(installmentOffers.title),
    )
    .limit(parsed.limit)
    .offset(offset)

  const total = totalRow?.count ?? 0

  return {
    offers,
    pagination: {
      page: parsed.page,
      limit: parsed.limit,
      total,
      totalPages: Math.ceil(total / parsed.limit),
    },
  }
}

export async function getAdminInstallmentOffer(id: string) {
  await requireResourcePermission("installment_plan", "read")

  const [offer] = await db
    .select()
    .from(installmentOffers)
    .where(eq(installmentOffers.id, id))
    .limit(1)

  return offer ?? null
}

export async function createInstallmentOffer(input: InstallmentOfferInput) {
  await requireResourcePermission("installment_plan", "create")

  const validated = installmentOfferSchema.parse(input)
  const slug = await resolveUniqueSlug(validated.title, validated.slug)
  const terms = normalizeTerms(validated.terms)

  if (validated.isPublished) {
    assertPublishable({
      title: validated.title,
      providerName: validated.providerName,
      summary: validated.summary,
      terms,
    })
  }

  const [offer] = await db
    .insert(installmentOffers)
    .values({
      title: validated.title,
      slug,
      providerName: validated.providerName,
      logoUrl: normalizeNullable(validated.logoUrl),
      bannerImageUrl: normalizeNullable(validated.bannerImageUrl),
      summary: validated.summary,
      description: normalizeNullable(validated.description),
      readMoreLabel: validated.readMoreLabel,
      terms,
      termsAndConditions: validated.termsAndConditions,
      isPublished: validated.isPublished,
      publishedAt: validated.isPublished ? new Date() : null,
      sortOrder: validated.sortOrder,
    })
    .returning()

  revalidateInstallmentOfferPaths(offer.slug)
  return offer
}

export async function updateInstallmentOffer(
  id: string,
  input: Partial<InstallmentOfferInput>,
) {
  await requireResourcePermission("installment_plan", "update")

  const validated = updateInstallmentOfferSchema.parse(input)
  const [current] = await db
    .select()
    .from(installmentOffers)
    .where(eq(installmentOffers.id, id))
    .limit(1)

  if (!current) {
    throw new Error("Installment plan not found")
  }

  const nextSlug =
    validated.slug !== undefined
      ? generateSlug(validated.slug || validated.title || current.title) ||
        current.slug
      : current.slug

  if (nextSlug !== current.slug) {
    await assertUniqueSlug(nextSlug, id)
  }

  const nextTerms =
    validated.terms !== undefined
      ? normalizeTerms(validated.terms)
      : current.terms
  const nextIsPublished = validated.isPublished ?? current.isPublished

  if (nextIsPublished) {
    assertPublishable({
      title: validated.title ?? current.title,
      providerName: validated.providerName ?? current.providerName,
      summary: validated.summary ?? current.summary,
      terms: nextTerms,
    })
  }

  const [offer] = await db
    .update(installmentOffers)
    .set({
      ...(validated.title !== undefined ? { title: validated.title } : {}),
      slug: nextSlug,
      ...(validated.providerName !== undefined
        ? { providerName: validated.providerName }
        : {}),
      ...(validated.logoUrl !== undefined
        ? { logoUrl: normalizeNullable(validated.logoUrl) }
        : {}),
      ...(validated.bannerImageUrl !== undefined
        ? { bannerImageUrl: normalizeNullable(validated.bannerImageUrl) }
        : {}),
      ...(validated.summary !== undefined
        ? { summary: validated.summary }
        : {}),
      ...(validated.description !== undefined
        ? { description: normalizeNullable(validated.description) }
        : {}),
      ...(validated.readMoreLabel !== undefined
        ? { readMoreLabel: validated.readMoreLabel }
        : {}),
      ...(validated.terms !== undefined ? { terms: nextTerms } : {}),
      ...(validated.termsAndConditions !== undefined
        ? { termsAndConditions: validated.termsAndConditions }
        : {}),
      ...(validated.isPublished !== undefined
        ? {
            isPublished: validated.isPublished,
            publishedAt: validated.isPublished
              ? (current.publishedAt ?? new Date())
              : null,
          }
        : {}),
      ...(validated.sortOrder !== undefined
        ? { sortOrder: validated.sortOrder }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(installmentOffers.id, id))
    .returning()

  if (!offer) {
    throw new Error("Installment plan not found")
  }

  revalidateInstallmentOfferPaths(current.slug)
  revalidateInstallmentOfferPaths(offer.slug)
  return offer
}

export async function deleteInstallmentOffer(id: string) {
  await requireResourcePermission("installment_plan", "delete")

  const [deleted] = await db
    .delete(installmentOffers)
    .where(eq(installmentOffers.id, id))
    .returning()

  if (!deleted) {
    throw new Error("Installment plan not found")
  }

  revalidateInstallmentOfferPaths(deleted.slug)
  return deleted
}

export async function getPublishedInstallmentOffers() {
  return db
    .select()
    .from(installmentOffers)
    .where(eq(installmentOffers.isPublished, true))
    .orderBy(asc(installmentOffers.sortOrder), asc(installmentOffers.title))
}

export async function getPublishedInstallmentOfferBySlug(slug: string) {
  const [offer] = await db
    .select()
    .from(installmentOffers)
    .where(
      and(
        eq(installmentOffers.slug, slug),
        eq(installmentOffers.isPublished, true),
      ),
    )
    .limit(1)

  return offer ?? null
}

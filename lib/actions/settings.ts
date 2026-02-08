"use server"

import { revalidatePath } from "next/cache"

import { eq } from "drizzle-orm"

import { getServerSession, requireAdmin } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { siteSettings } from "@/lib/db/schema"

// ============================================
// Get Site Settings
// ============================================

export async function getSiteSettings() {
  const settings = await db.select().from(siteSettings)

  // Convert to key-value object
  const settingsMap: Record<string, string> = {}
  settings.forEach((s) => {
    settingsMap[s.key] = s.value
  })

  return settingsMap
}

// ============================================
// Update Site Setting
// ============================================

export async function updateSiteSetting(key: string, value: string) {
  await requireAdmin()
  const session = await getServerSession()

  // Check if setting exists
  const existing = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.key, key),
  })

  if (existing) {
    await db
      .update(siteSettings)
      .set({
        value,
        updatedBy: session?.user?.id || null,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.key, key))
  } else {
    await db.insert(siteSettings).values({
      key,
      value,
      updatedBy: session?.user?.id || null,
    })
  }

  revalidatePath("/admin/settings")
  return { success: true }
}

// ============================================
// Update Multiple Settings
// ============================================

export async function updateSiteSettings(settings: Record<string, string>) {
  await requireAdmin()
  const session = await getServerSession()

  await db.transaction(async (tx) => {
    for (const [key, value] of Object.entries(settings)) {
      const existing = await tx.query.siteSettings.findFirst({
        where: eq(siteSettings.key, key),
      })

      if (existing) {
        await tx
          .update(siteSettings)
          .set({
            value,
            updatedBy: session?.user?.id || null,
            updatedAt: new Date(),
          })
          .where(eq(siteSettings.key, key))
      } else {
        await tx.insert(siteSettings).values({
          key,
          value,
          updatedBy: session?.user?.id || null,
        })
      }
    }
  })

  revalidatePath("/admin/settings")
  return { success: true }
}

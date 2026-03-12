import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import {
  brandCategoryAssignments,
  brands,
  categories,
  inventoryLevels,
  inventoryLocations,
  inventoryTransactions,
  inventoryUnitIdentifiers,
  inventoryUnits,
  models,
  productAttributes,
  productAttributeValues,
  productCategoryAssignments,
  productImages,
  productOptions,
  productOptionValues,
  products,
  productVariantOptionValues,
  productVariants,
} from "./schema"

import "dotenv/config"

async function cleanSeed() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set")
    process.exit(1)
  }

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)
  console.log("🧹 Starting database cleanup...\n")

  try {
    console.log("🗑️  Deleting inventory unit identifiers...")
    const deletedUnitIdentifiers = await db
      .delete(inventoryUnitIdentifiers)
      .returning()
    console.log(
      `  ✅ Deleted ${deletedUnitIdentifiers.length} inventory unit identifiers`,
    )

    console.log("🗑️  Deleting inventory units...")
    const deletedUnits = await db.delete(inventoryUnits).returning()
    console.log(`  ✅ Deleted ${deletedUnits.length} inventory units`)

    console.log("🗑️  Deleting inventory transactions...")
    const deletedTransactions = await db
      .delete(inventoryTransactions)
      .returning()
    console.log(
      `  ✅ Deleted ${deletedTransactions.length} inventory transactions`,
    )

    console.log("🗑️  Deleting inventory levels...")
    const deletedLevels = await db.delete(inventoryLevels).returning()
    console.log(`  ✅ Deleted ${deletedLevels.length} inventory levels`)

    console.log("🗑️  Deleting inventory locations...")
    const deletedLocations = await db.delete(inventoryLocations).returning()
    console.log(`  ✅ Deleted ${deletedLocations.length} inventory locations`)

    console.log("🗑️  Deleting product variant option values...")
    const deletedVariantSelections = await db
      .delete(productVariantOptionValues)
      .returning()
    console.log(
      `  ✅ Deleted ${deletedVariantSelections.length} product variant option values`,
    )

    console.log("🗑️  Deleting product images...")
    const deletedImages = await db.delete(productImages).returning()
    console.log(`  ✅ Deleted ${deletedImages.length} product images`)

    console.log("🗑️  Deleting product category assignments...")
    const deletedAssignments = await db
      .delete(productCategoryAssignments)
      .returning()
    console.log(
      `  ✅ Deleted ${deletedAssignments.length} product category assignments`,
    )

    console.log("🗑️  Deleting product option values...")
    const deletedOptionValues = await db.delete(productOptionValues).returning()
    console.log(
      `  ✅ Deleted ${deletedOptionValues.length} product option values`,
    )

    console.log("🗑️  Deleting product options...")
    const deletedOptions = await db.delete(productOptions).returning()
    console.log(`  ✅ Deleted ${deletedOptions.length} product options`)

    console.log("🗑️  Deleting product attribute values...")
    const deletedAttrValues = await db
      .delete(productAttributeValues)
      .returning()
    console.log(
      `  ✅ Deleted ${deletedAttrValues.length} product attribute values`,
    )

    console.log("🗑️  Deleting product attributes...")
    const deletedAttrs = await db.delete(productAttributes).returning()
    console.log(`  ✅ Deleted ${deletedAttrs.length} product attributes`)

    console.log("🗑️  Deleting product variants...")
    const deletedVariants = await db.delete(productVariants).returning()
    console.log(`  ✅ Deleted ${deletedVariants.length} product variants`)

    console.log("🗑️  Deleting products...")
    const deletedProducts = await db.delete(products).returning()
    console.log(`  ✅ Deleted ${deletedProducts.length} products`)

    console.log("🗑️  Deleting models...")
    const deletedModels = await db.delete(models).returning()
    console.log(`  ✅ Deleted ${deletedModels.length} models`)

    console.log("🗑️  Deleting brand-category assignments...")
    const deletedBrandAssignments = await db
      .delete(brandCategoryAssignments)
      .returning()
    console.log(
      `  ✅ Deleted ${deletedBrandAssignments.length} brand-category assignments`,
    )

    console.log("🗑️  Deleting categories...")
    const deletedCategories = await db.delete(categories).returning()
    console.log(`  ✅ Deleted ${deletedCategories.length} categories`)

    console.log("🗑️  Deleting brands...")
    const deletedBrands = await db.delete(brands).returning()
    console.log(`  ✅ Deleted ${deletedBrands.length} brands`)

    console.log("\n✅ Database cleanup completed successfully!")
    console.log("\n📌 Preserved data:")
    console.log("  - Admin user (admin@example.com)")
    console.log("  - Better Auth identity data")
  } catch (error) {
    console.error("\n❌ Cleanup failed:", error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

cleanSeed()

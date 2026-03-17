import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import {
  brandCategoryAssignments,
  brands,
  categories,
  inventoryLevels,
  inventoryTransactions,
  inventoryUnitIdentifiers,
  inventoryUnits,
  mediaAssets,
  mediaDerivatives,
  models,
  productAttributes,
  productAttributeValues,
  productCategoryAssignments,
  productMedia,
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
    console.error("âŒ DATABASE_URL is not set")
    process.exit(1)
  }

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)
  console.log("ðŸ§¹ Starting database cleanup...\n")

  try {
    console.log("ðŸ—‘ï¸  Deleting inventory unit identifiers...")
    const deletedUnitIdentifiers = await db
      .delete(inventoryUnitIdentifiers)
      .returning()
    console.log(
      `  âœ… Deleted ${deletedUnitIdentifiers.length} inventory unit identifiers`,
    )

    console.log("ðŸ—‘ï¸  Deleting inventory units...")
    const deletedUnits = await db.delete(inventoryUnits).returning()
    console.log(`  âœ… Deleted ${deletedUnits.length} inventory units`)

    console.log("ðŸ—‘ï¸  Deleting inventory transactions...")
    const deletedTransactions = await db
      .delete(inventoryTransactions)
      .returning()
    console.log(
      `  âœ… Deleted ${deletedTransactions.length} inventory transactions`,
    )

    console.log("ðŸ—‘ï¸  Deleting inventory levels...")
    const deletedLevels = await db.delete(inventoryLevels).returning()
    console.log(`  âœ… Deleted ${deletedLevels.length} inventory levels`)

    console.log("ðŸ—‘ï¸  Deleting product variant option values...")
    const deletedVariantSelections = await db
      .delete(productVariantOptionValues)
      .returning()
    console.log(
      `  âœ… Deleted ${deletedVariantSelections.length} product variant option values`,
    )

    console.log("ðŸ—‘ï¸  Deleting product media...")
    const deletedProductMedia = await db.delete(productMedia).returning()
    console.log(`  âœ… Deleted ${deletedProductMedia.length} product media rows`)

    console.log("ðŸ—‘ï¸  Deleting media derivatives...")
    const deletedMediaDerivatives = await db
      .delete(mediaDerivatives)
      .returning()
    console.log(
      `  âœ… Deleted ${deletedMediaDerivatives.length} media derivative rows`,
    )

    console.log("ðŸ—‘ï¸  Deleting media assets...")
    const deletedMediaAssets = await db.delete(mediaAssets).returning()
    console.log(`  âœ… Deleted ${deletedMediaAssets.length} media assets`)

    console.log("ðŸ—‘ï¸  Deleting product category assignments...")
    const deletedAssignments = await db
      .delete(productCategoryAssignments)
      .returning()
    console.log(
      `  âœ… Deleted ${deletedAssignments.length} product category assignments`,
    )

    console.log("ðŸ—‘ï¸  Deleting product option values...")
    const deletedOptionValues = await db.delete(productOptionValues).returning()
    console.log(
      `  âœ… Deleted ${deletedOptionValues.length} product option values`,
    )

    console.log("ðŸ—‘ï¸  Deleting product options...")
    const deletedOptions = await db.delete(productOptions).returning()
    console.log(`  âœ… Deleted ${deletedOptions.length} product options`)

    console.log("ðŸ—‘ï¸  Deleting product attribute values...")
    const deletedAttrValues = await db
      .delete(productAttributeValues)
      .returning()
    console.log(
      `  âœ… Deleted ${deletedAttrValues.length} product attribute values`,
    )

    console.log("ðŸ—‘ï¸  Deleting product attributes...")
    const deletedAttrs = await db.delete(productAttributes).returning()
    console.log(`  âœ… Deleted ${deletedAttrs.length} product attributes`)

    console.log("ðŸ—‘ï¸  Deleting product variants...")
    const deletedVariants = await db.delete(productVariants).returning()
    console.log(`  âœ… Deleted ${deletedVariants.length} product variants`)

    console.log("ðŸ—‘ï¸  Deleting products...")
    const deletedProducts = await db.delete(products).returning()
    console.log(`  âœ… Deleted ${deletedProducts.length} products`)

    console.log("ðŸ—‘ï¸  Deleting models...")
    const deletedModels = await db.delete(models).returning()
    console.log(`  âœ… Deleted ${deletedModels.length} models`)

    console.log("ðŸ—‘ï¸  Deleting brand-category assignments...")
    const deletedBrandAssignments = await db
      .delete(brandCategoryAssignments)
      .returning()
    console.log(
      `  âœ… Deleted ${deletedBrandAssignments.length} brand-category assignments`,
    )

    console.log("ðŸ—‘ï¸  Deleting categories...")
    const deletedCategories = await db.delete(categories).returning()
    console.log(`  âœ… Deleted ${deletedCategories.length} categories`)

    console.log("ðŸ—‘ï¸  Deleting brands...")
    const deletedBrands = await db.delete(brands).returning()
    console.log(`  âœ… Deleted ${deletedBrands.length} brands`)

    console.log("\nâœ… Database cleanup completed successfully!")
    console.log("\nðŸ“Œ Preserved data:")
    console.log("  - Admin user (admin@example.com)")
    console.log("  - Better Auth identity data")
  } catch (error) {
    console.error("\nâŒ Cleanup failed:", error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

cleanSeed()

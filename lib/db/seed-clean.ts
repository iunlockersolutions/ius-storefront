import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import {
  brands,
  categories,
  inventoryItems,
  inventoryMovements,
  productAttributes,
  productAttributeValues,
  productCategoryAssignments,
  productImages,
  products,
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
    console.log("🗑️  Deleting inventory movements...")
    const deletedMovements = await db.delete(inventoryMovements).returning()
    console.log(`  ✅ Deleted ${deletedMovements.length} inventory movements`)

    console.log("🗑️  Deleting inventory items...")
    const deletedInventory = await db.delete(inventoryItems).returning()
    console.log(`  ✅ Deleted ${deletedInventory.length} inventory items`)

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

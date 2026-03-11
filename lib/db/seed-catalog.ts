import { and, eq, inArray } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import {
  brands,
  categories,
  categoryBrandMenuConfigs,
  inventoryItems,
  inventoryMovements,
  productAttributes,
  productAttributeValues,
  productCategoryAssignments,
  productImages,
  productModelGroups,
  products,
  productVariants,
} from "./schema"

import "dotenv/config"

type SeedBrand = {
  slug: string
  name: string
  description: string
  websiteUrl: string
  logo: string
  sortOrder: number
}

type SeedCategory = {
  slug: string
  name: string
  description: string
  image: string
  sortOrder: number
  parentSlug?: string
}

type SeedAttribute = {
  slug: string
  name: string
  description: string
}

type SeedVariant = {
  sku: string
  name: string
  price: string
  compareAtPrice?: string
  costPrice?: string
  weight?: string
  isDefault?: boolean
  sortOrder: number
  quantity: number
  lowStockThreshold: number
}

type SeedProduct = {
  slug: string
  name: string
  description: string
  shortDescription: string
  brandSlug: string
  primaryCategorySlug: string
  categorySlugs: string[]
  basePrice: string
  compareAtPrice?: string
  costPrice?: string
  isFeatured?: boolean
  images: Array<{
    url: string
    altText: string
    sortOrder: number
    isPrimary?: boolean
  }>
  attributes: Record<string, string>
  variants: SeedVariant[]
}

const seedBrands: SeedBrand[] = [
  {
    slug: "apple",
    name: "Apple",
    description: "Premium devices and accessories for the Apple ecosystem.",
    websiteUrl: "https://www.apple.com",
    logo: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80",
    sortOrder: 1,
  },
  {
    slug: "sony",
    name: "Sony",
    description: "Audio and entertainment hardware with a focus on fidelity.",
    websiteUrl: "https://www.sony.com",
    logo: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
    sortOrder: 2,
  },
  {
    slug: "anker",
    name: "Anker",
    description: "Charging, power, and practical everyday mobile gear.",
    websiteUrl: "https://www.anker.com",
    logo: "https://images.unsplash.com/photo-1580894908361-967195033215?auto=format&fit=crop&w=600&q=80",
    sortOrder: 3,
  },
]

const seedCategories: SeedCategory[] = [
  {
    slug: "phones",
    name: "Phones",
    description: "Flagship and mid-range smartphones.",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 1,
  },
  {
    slug: "audio",
    name: "Audio",
    description: "Headphones, earbuds, and speakers.",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 2,
  },
  {
    slug: "power-accessories",
    name: "Power Accessories",
    description: "Chargers, cables, and battery packs.",
    image:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 3,
  },
  {
    slug: "wireless-earbuds",
    name: "Wireless Earbuds",
    description: "Pocket-sized audio built for daily carry.",
    image:
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f37?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 1,
    parentSlug: "audio",
  },
]

const seedAttributes: SeedAttribute[] = [
  {
    slug: "brand",
    name: "Brand",
    description: "The manufacturer or label of the product.",
  },
  {
    slug: "connectivity",
    name: "Connectivity",
    description: "Primary wireless or wired connection method.",
  },
  {
    slug: "battery-life",
    name: "Battery Life",
    description: "Typical battery performance under normal use.",
  },
  {
    slug: "charging",
    name: "Charging",
    description: "Charging standard or wattage support.",
  },
]

const seedProducts: SeedProduct[] = [
  {
    slug: "iphone-16-pro",
    name: "iPhone 16 Pro",
    description:
      "A premium smartphone with a titanium finish, pro-grade camera system, and all-day battery life.",
    shortDescription: "Flagship iPhone with pro camera system.",
    brandSlug: "apple",
    primaryCategorySlug: "phones",
    categorySlugs: ["phones"],
    basePrice: "999.00",
    compareAtPrice: "1099.00",
    costPrice: "770.00",
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80",
        altText: "iPhone 16 Pro front and back view",
        sortOrder: 1,
        isPrimary: true,
      },
      {
        url: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1200&q=80",
        altText: "iPhone detail close-up",
        sortOrder: 2,
      },
    ],
    attributes: {
      brand: "Apple",
      connectivity: "5G",
      "battery-life": "Up to 27 hours video playback",
      charging: "USB-C fast charging",
    },
    variants: [
      {
        sku: "APL-IP16PRO-128-BLK",
        name: "128GB / Black Titanium",
        price: "999.00",
        compareAtPrice: "1099.00",
        costPrice: "770.00",
        weight: "0.199",
        isDefault: true,
        sortOrder: 1,
        quantity: 18,
        lowStockThreshold: 5,
      },
      {
        sku: "APL-IP16PRO-256-NAT",
        name: "256GB / Natural Titanium",
        price: "1099.00",
        compareAtPrice: "1199.00",
        costPrice: "850.00",
        weight: "0.199",
        sortOrder: 2,
        quantity: 10,
        lowStockThreshold: 4,
      },
    ],
  },
  {
    slug: "sony-wf-1000xm5",
    name: "Sony WF-1000XM5",
    description:
      "Noise-canceling earbuds with strong clarity, comfortable fit, and compact charging case.",
    shortDescription: "Premium noise-canceling wireless earbuds.",
    brandSlug: "sony",
    primaryCategorySlug: "wireless-earbuds",
    categorySlugs: ["audio", "wireless-earbuds"],
    basePrice: "299.00",
    compareAtPrice: "349.00",
    costPrice: "210.00",
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80",
        altText: "Sony wireless earbuds in charging case",
        sortOrder: 1,
        isPrimary: true,
      },
      {
        url: "https://images.unsplash.com/photo-1505740106531-4243f3831c78?auto=format&fit=crop&w=1200&q=80",
        altText: "Wireless earbuds on a table",
        sortOrder: 2,
      },
    ],
    attributes: {
      brand: "Sony",
      connectivity: "Bluetooth 5.3",
      "battery-life": "Up to 8 hours per charge",
      charging: "USB-C and wireless charging case",
    },
    variants: [
      {
        sku: "SNY-WF1000XM5-BLK",
        name: "Black",
        price: "299.00",
        compareAtPrice: "349.00",
        costPrice: "210.00",
        weight: "0.039",
        isDefault: true,
        sortOrder: 1,
        quantity: 24,
        lowStockThreshold: 6,
      },
      {
        sku: "SNY-WF1000XM5-SLV",
        name: "Silver",
        price: "299.00",
        compareAtPrice: "349.00",
        costPrice: "210.00",
        weight: "0.039",
        sortOrder: 2,
        quantity: 16,
        lowStockThreshold: 6,
      },
    ],
  },
  {
    slug: "anker-prime-power-bank-200w",
    name: "Anker Prime Power Bank 200W",
    description:
      "High-output power bank with multi-device charging, travel-ready form factor, and digital battery status.",
    shortDescription: "Large-capacity USB-C power bank for laptops and phones.",
    brandSlug: "anker",
    primaryCategorySlug: "power-accessories",
    categorySlugs: ["power-accessories"],
    basePrice: "189.00",
    compareAtPrice: "229.00",
    costPrice: "128.00",
    images: [
      {
        url: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=1200&q=80",
        altText: "Portable power bank on desk",
        sortOrder: 1,
        isPrimary: true,
      },
      {
        url: "https://images.unsplash.com/photo-1616578273463-6960b1bb2e0d?auto=format&fit=crop&w=1200&q=80",
        altText: "Charging accessories laid out on a surface",
        sortOrder: 2,
      },
    ],
    attributes: {
      brand: "Anker",
      connectivity: "USB-C / USB-A",
      "battery-life": "27,650mAh capacity",
      charging: "200W total output",
    },
    variants: [
      {
        sku: "ANK-PRIME-200W-BLK",
        name: "Black",
        price: "189.00",
        compareAtPrice: "229.00",
        costPrice: "128.00",
        weight: "0.540",
        isDefault: true,
        sortOrder: 1,
        quantity: 30,
        lowStockThreshold: 8,
      },
    ],
  },
]

function getTopLevelCategorySlug(categorySlug: string) {
  let currentSlug = categorySlug

  while (true) {
    const category = seedCategories.find((item) => item.slug === currentSlug)

    if (!category?.parentSlug) {
      return currentSlug
    }

    currentSlug = category.parentSlug
  }
}

async function seedCatalog() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set")
    process.exit(1)
  }

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)
  console.log("📦 Starting catalog seed...\n")

  try {
    const brandMap = new Map<string, string>()
    const categoryMap = new Map<string, string>()
    const attributeMap = new Map<string, string>()
    const productMap = new Map<string, string>()
    const variantMap = new Map<string, string>()
    const seededProductIds: string[] = []

    console.log("🏷️  Upserting brands...")
    for (const brand of seedBrands) {
      const [record] = await db
        .insert(brands)
        .values({
          name: brand.name,
          slug: brand.slug,
          description: brand.description,
          websiteUrl: brand.websiteUrl,
          logo: brand.logo,
          sortOrder: brand.sortOrder,
          isActive: true,
          metaTitle: `${brand.name} products`,
          metaDescription: brand.description,
        })
        .onConflictDoUpdate({
          target: brands.slug,
          set: {
            name: brand.name,
            description: brand.description,
            websiteUrl: brand.websiteUrl,
            logo: brand.logo,
            sortOrder: brand.sortOrder,
            isActive: true,
            metaTitle: `${brand.name} products`,
            metaDescription: brand.description,
            updatedAt: new Date(),
          },
        })
        .returning({ id: brands.id, slug: brands.slug })

      brandMap.set(record.slug, record.id)
    }

    console.log("🗂️  Upserting categories...")
    for (const category of seedCategories.filter((item) => !item.parentSlug)) {
      const [record] = await db
        .insert(categories)
        .values({
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          sortOrder: category.sortOrder,
          isActive: true,
          metaTitle: `${category.name} collection`,
          metaDescription: category.description,
        })
        .onConflictDoUpdate({
          target: categories.slug,
          set: {
            name: category.name,
            description: category.description,
            image: category.image,
            sortOrder: category.sortOrder,
            isActive: true,
            metaTitle: `${category.name} collection`,
            metaDescription: category.description,
            updatedAt: new Date(),
          },
        })
        .returning({ id: categories.id, slug: categories.slug })

      categoryMap.set(record.slug, record.id)
    }

    for (const category of seedCategories.filter((item) => item.parentSlug)) {
      const [record] = await db
        .insert(categories)
        .values({
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          sortOrder: category.sortOrder,
          isActive: true,
          parentId: category.parentSlug
            ? (categoryMap.get(category.parentSlug) ?? null)
            : null,
          metaTitle: `${category.name} collection`,
          metaDescription: category.description,
        })
        .onConflictDoUpdate({
          target: categories.slug,
          set: {
            name: category.name,
            description: category.description,
            image: category.image,
            sortOrder: category.sortOrder,
            isActive: true,
            parentId: category.parentSlug
              ? (categoryMap.get(category.parentSlug) ?? null)
              : null,
            metaTitle: `${category.name} collection`,
            metaDescription: category.description,
            updatedAt: new Date(),
          },
        })
        .returning({ id: categories.id, slug: categories.slug })

      categoryMap.set(record.slug, record.id)
    }

    console.log("🔖 Upserting product attributes...")
    for (const attribute of seedAttributes) {
      const [record] = await db
        .insert(productAttributes)
        .values({
          name: attribute.name,
          slug: attribute.slug,
          description: attribute.description,
        })
        .onConflictDoUpdate({
          target: productAttributes.slug,
          set: {
            name: attribute.name,
            description: attribute.description,
          },
        })
        .returning({ id: productAttributes.id, slug: productAttributes.slug })

      attributeMap.set(record.slug, record.id)
    }

    console.log("🛍️  Upserting products and variants...")
    for (const product of seedProducts) {
      const topLevelCategorySlug = getTopLevelCategorySlug(
        product.primaryCategorySlug,
      )
      const topLevelCategoryId = categoryMap.get(topLevelCategorySlug) ?? null
      const brandId = brandMap.get(product.brandSlug) ?? null

      if (!topLevelCategoryId || !brandId) {
        throw new Error(
          `Missing top-level category or brand for ${product.slug}`,
        )
      }

      const [productModelGroupRecord] = await db
        .insert(productModelGroups)
        .values({
          name: product.name,
          slug: `${topLevelCategorySlug}-${product.brandSlug}-${product.slug}`,
          categoryId: topLevelCategoryId,
          brandId,
          description: product.shortDescription,
          showInProductMenu: true,
          menuPriority: 0,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: productModelGroups.slug,
          set: {
            name: product.name,
            categoryId: topLevelCategoryId,
            brandId,
            description: product.shortDescription,
            showInProductMenu: true,
            isActive: true,
            updatedAt: new Date(),
          },
        })
        .returning({ id: productModelGroups.id })

      await db
        .insert(categoryBrandMenuConfigs)
        .values({
          categoryId: topLevelCategoryId,
          brandId,
        })
        .onConflictDoNothing()

      const [productRecord] = await db
        .insert(products)
        .values({
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          brandId,
          categoryId: categoryMap.get(product.primaryCategorySlug) ?? null,
          primaryCategoryId:
            categoryMap.get(product.primaryCategorySlug) ?? null,
          productModelGroupId: productModelGroupRecord.id,
          basePrice: product.basePrice,
          compareAtPrice: product.compareAtPrice ?? null,
          costPrice: product.costPrice ?? null,
          status: "active",
          isFeatured: product.isFeatured ?? false,
          metaTitle: product.name,
          metaDescription: product.shortDescription,
        })
        .onConflictDoUpdate({
          target: products.slug,
          set: {
            name: product.name,
            description: product.description,
            shortDescription: product.shortDescription,
            brandId,
            categoryId: categoryMap.get(product.primaryCategorySlug) ?? null,
            primaryCategoryId:
              categoryMap.get(product.primaryCategorySlug) ?? null,
            productModelGroupId: productModelGroupRecord.id,
            basePrice: product.basePrice,
            compareAtPrice: product.compareAtPrice ?? null,
            costPrice: product.costPrice ?? null,
            status: "active",
            isFeatured: product.isFeatured ?? false,
            metaTitle: product.name,
            metaDescription: product.shortDescription,
            updatedAt: new Date(),
          },
        })
        .returning({ id: products.id, slug: products.slug })

      productMap.set(productRecord.slug, productRecord.id)
      seededProductIds.push(productRecord.id)

      for (const categorySlug of product.categorySlugs) {
        const categoryId = categoryMap.get(categorySlug)

        if (!categoryId) {
          continue
        }

        await db
          .insert(productCategoryAssignments)
          .values({
            productId: productRecord.id,
            categoryId,
          })
          .onConflictDoNothing()
      }

      for (const variant of product.variants) {
        const [variantRecord] = await db
          .insert(productVariants)
          .values({
            productId: productRecord.id,
            sku: variant.sku,
            name: variant.name,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice ?? null,
            costPrice: variant.costPrice ?? null,
            weight: variant.weight ?? null,
            isDefault: variant.isDefault ?? false,
            isActive: true,
            sortOrder: variant.sortOrder,
          })
          .onConflictDoUpdate({
            target: productVariants.sku,
            set: {
              productId: productRecord.id,
              name: variant.name,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice ?? null,
              costPrice: variant.costPrice ?? null,
              weight: variant.weight ?? null,
              isDefault: variant.isDefault ?? false,
              isActive: true,
              sortOrder: variant.sortOrder,
              updatedAt: new Date(),
            },
          })
          .returning({ id: productVariants.id, sku: productVariants.sku })

        variantMap.set(variantRecord.sku, variantRecord.id)

        const [inventoryRecord] = await db
          .insert(inventoryItems)
          .values({
            variantId: variantRecord.id,
            quantity: variant.quantity,
            reservedQuantity: 0,
            lowStockThreshold: variant.lowStockThreshold,
          })
          .onConflictDoUpdate({
            target: inventoryItems.variantId,
            set: {
              quantity: variant.quantity,
              reservedQuantity: 0,
              lowStockThreshold: variant.lowStockThreshold,
              updatedAt: new Date(),
            },
          })
          .returning({
            id: inventoryItems.id,
            variantId: inventoryItems.variantId,
          })

        await db
          .delete(inventoryMovements)
          .where(
            and(
              eq(inventoryMovements.inventoryItemId, inventoryRecord.id),
              eq(inventoryMovements.referenceType, "seed"),
              eq(inventoryMovements.referenceId, inventoryRecord.variantId),
            ),
          )

        await db.insert(inventoryMovements).values({
          inventoryItemId: inventoryRecord.id,
          type: "purchase",
          quantity: variant.quantity,
          previousQuantity: 0,
          newQuantity: variant.quantity,
          referenceType: "seed",
          referenceId: inventoryRecord.variantId,
          notes: "Initial catalog seed stock",
        })
      }
    }

    if (seededProductIds.length > 0) {
      console.log("🖼️  Refreshing product images and attribute values...")
      await db
        .delete(productImages)
        .where(inArray(productImages.productId, seededProductIds))
      await db
        .delete(productAttributeValues)
        .where(inArray(productAttributeValues.productId, seededProductIds))
    }

    for (const product of seedProducts) {
      const productId = productMap.get(product.slug)

      if (!productId) {
        continue
      }

      await db.insert(productImages).values(
        product.images.map((image) => ({
          productId,
          url: image.url,
          altText: image.altText,
          sortOrder: image.sortOrder,
          isPrimary: image.isPrimary ?? false,
        })),
      )

      const attributeValues = Object.entries(product.attributes)
        .map(([attributeSlug, value]) => {
          const attributeId = attributeMap.get(attributeSlug)

          if (!attributeId) {
            return null
          }

          return {
            productId,
            attributeId,
            value,
          }
        })
        .filter((value): value is NonNullable<typeof value> => value !== null)

      if (attributeValues.length > 0) {
        await db.insert(productAttributeValues).values(attributeValues)
      }
    }

    console.log("\n✅ Catalog seed completed successfully!")
    console.log(`  Brands: ${seedBrands.length}`)
    console.log(`  Categories: ${seedCategories.length}`)
    console.log(`  Attributes: ${seedAttributes.length}`)
    console.log(`  Products: ${seedProducts.length}`)
    console.log(
      `  Variants: ${seedProducts.reduce((sum, item) => sum + item.variants.length, 0)}`,
    )
  } catch (error) {
    console.error("\n❌ Catalog seed failed:", error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seedCatalog()

import { and, eq, inArray } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import {
  brands,
  categories,
  categoryBrandMenuConfigs,
  inventoryItems,
  inventoryMovements,
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
  sortOrder: number
}

type SeedCategory = {
  slug: string
  name: string
  description: string
  image: string
  sortOrder: number
  productMenuPriority: number
}

type SeedModel = {
  name: string
  description: string
  basePrice: number
  compareAtPrice?: number
  menuPriority: number
  imageUrl: string
  featured?: boolean
}

type SeedVariant = {
  sku: string
  name: string
  price: string
  compareAtPrice: string | null
  costPrice: string
  weight: string
  isDefault: boolean
  sortOrder: number
  quantity: number
  lowStockThreshold: number
}

type SeedListing = {
  slug: string
  name: string
  shortDescription: string
  description: string
  basePrice: string
  compareAtPrice: string | null
  costPrice: string
  isFeatured: boolean
  imageUrl: string
  variants: SeedVariant[]
}

const seedBrands: SeedBrand[] = [
  {
    slug: "apple",
    name: "Apple",
    description: "Apple devices across phones, tablets, and laptops.",
    sortOrder: 1,
  },
  {
    slug: "samsung",
    name: "Samsung",
    description: "Samsung mobile, tablet, and notebook lineup.",
    sortOrder: 2,
  },
  {
    slug: "xiaomi",
    name: "Xiaomi",
    description: "Xiaomi products spanning value and flagship ranges.",
    sortOrder: 3,
  },
  {
    slug: "asus",
    name: "ASUS",
    description: "ASUS productivity and performance computing devices.",
    sortOrder: 4,
  },
]

const seedCategories: SeedCategory[] = [
  {
    slug: "phones",
    name: "Phones",
    description: "Flagship and premium smartphones.",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 1,
    productMenuPriority: 1,
  },
  {
    slug: "tablets",
    name: "Tablets",
    description: "Portable tablets for work, study, and entertainment.",
    image:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 2,
    productMenuPriority: 2,
  },
  {
    slug: "laptops",
    name: "Laptops",
    description: "Professional, creator, and performance notebooks.",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 3,
    productMenuPriority: 3,
  },
]

const seedCatalog: Record<string, Record<string, SeedModel[]>> = {
  phones: {
    apple: [
      {
        name: "iPhone 17",
        description:
          "Everyday flagship with Apple silicon and dual-camera setup.",
        basePrice: 999,
        compareAtPrice: 1099,
        menuPriority: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80",
        featured: true,
      },
      {
        name: "iPhone 17 Pro",
        description:
          "Pro-grade iPhone with advanced camera system and titanium finish.",
        basePrice: 1299,
        compareAtPrice: 1399,
        menuPriority: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1200&q=80",
        featured: true,
      },
      {
        name: "iPhone 17 Pro Max",
        description: "Largest Pro iPhone built for creators and power users.",
        basePrice: 1499,
        compareAtPrice: 1599,
        menuPriority: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    samsung: [
      {
        name: "Galaxy S25",
        description: "Compact Samsung flagship with Galaxy AI features.",
        basePrice: 949,
        compareAtPrice: 1049,
        menuPriority: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "Galaxy S25 Ultra",
        description: "Ultra Samsung flagship with S Pen and long zoom lens.",
        basePrice: 1399,
        compareAtPrice: 1499,
        menuPriority: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80",
        featured: true,
      },
    ],
    xiaomi: [
      {
        name: "Xiaomi 15",
        description:
          "Balanced flagship tuned for photography and battery life.",
        basePrice: 799,
        compareAtPrice: 899,
        menuPriority: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "Xiaomi 15 Pro",
        description: "Premium Xiaomi phone with higher-end optics and finish.",
        basePrice: 999,
        compareAtPrice: 1099,
        menuPriority: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    asus: [
      {
        name: "ROG Phone 9",
        description:
          "Gaming-first phone with active cooling support and high refresh display.",
        basePrice: 1199,
        compareAtPrice: 1299,
        menuPriority: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "Zenfone 12 Ultra",
        description:
          "Large ASUS flagship focused on camera and battery endurance.",
        basePrice: 1099,
        compareAtPrice: 1199,
        menuPriority: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  tablets: {
    apple: [
      {
        name: "iPad Air 13",
        description:
          "Thin productivity tablet with Apple Pencil and keyboard support.",
        basePrice: 899,
        compareAtPrice: 999,
        menuPriority: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "iPad Pro 13",
        description:
          "High-end iPad for creators, drawing, and editing workflows.",
        basePrice: 1299,
        compareAtPrice: 1399,
        menuPriority: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1200&q=80",
        featured: true,
      },
    ],
    samsung: [
      {
        name: "Galaxy Tab S10+",
        description:
          "Large AMOLED tablet built for productivity and entertainment.",
        basePrice: 999,
        compareAtPrice: 1099,
        menuPriority: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "Galaxy Tab S10 Ultra",
        description:
          "Samsung's largest premium tablet with keyboard-ready setup.",
        basePrice: 1199,
        compareAtPrice: 1299,
        menuPriority: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    xiaomi: [
      {
        name: "Pad 7",
        description: "Versatile Xiaomi tablet for media and note-taking.",
        basePrice: 549,
        compareAtPrice: 629,
        menuPriority: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "Pad 7 Pro",
        description:
          "Higher-spec Xiaomi tablet with faster display and chipset.",
        basePrice: 699,
        compareAtPrice: 779,
        menuPriority: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    asus: [
      {
        name: "ROG Flow Z13",
        description:
          "Tablet-style gaming device with detachable keyboard design.",
        basePrice: 1499,
        compareAtPrice: 1599,
        menuPriority: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "ProArt PZ13",
        description:
          "Portable creator tablet with color-accurate display and stylus support.",
        basePrice: 1399,
        compareAtPrice: 1499,
        menuPriority: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  laptops: {
    apple: [
      {
        name: "MacBook Air 15",
        description:
          "Thin Apple laptop with strong battery life and silent design.",
        basePrice: 1399,
        compareAtPrice: 1499,
        menuPriority: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "MacBook Pro 14",
        description:
          "Professional Apple notebook for development and creative work.",
        basePrice: 1999,
        compareAtPrice: 2149,
        menuPriority: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
        featured: true,
      },
    ],
    samsung: [
      {
        name: "Galaxy Book5 Pro 360",
        description:
          "Convertible Samsung notebook for hybrid productivity setups.",
        basePrice: 1599,
        compareAtPrice: 1699,
        menuPriority: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "Galaxy Book5 Ultra",
        description:
          "High-performance Samsung notebook for creators and professionals.",
        basePrice: 1899,
        compareAtPrice: 1999,
        menuPriority: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    xiaomi: [
      {
        name: "Redmi Book Pro 16",
        description:
          "Large-screen Xiaomi laptop with balanced daily performance.",
        basePrice: 1199,
        compareAtPrice: 1299,
        menuPriority: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "Xiaomi Book Air 13",
        description: "Lightweight Xiaomi notebook for travel and work.",
        basePrice: 1099,
        compareAtPrice: 1199,
        menuPriority: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    asus: [
      {
        name: "Zenbook S 16",
        description:
          "Premium ASUS ultrabook with OLED display and thin chassis.",
        basePrice: 1699,
        compareAtPrice: 1799,
        menuPriority: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "ROG Zephyrus G16",
        description:
          "ASUS performance laptop for gaming and heavy multitasking.",
        basePrice: 2199,
        compareAtPrice: 2349,
        menuPriority: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1593642634367-d91a135587b5?auto=format&fit=crop&w=1200&q=80",
        featured: true,
      },
    ],
  },
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function formatMoney(value: number) {
  return value.toFixed(2)
}

function formatWeight(value: number) {
  return value.toFixed(3)
}

function buildVariants(
  categorySlug: string,
  skuBase: string,
  basePrice: number,
  compareAtPrice?: number,
): SeedVariant[] {
  if (categorySlug === "phones") {
    return [
      {
        sku: `${skuBase}-256-BLK`,
        name: "256GB / Black",
        price: formatMoney(basePrice),
        compareAtPrice: compareAtPrice ? formatMoney(compareAtPrice) : null,
        costPrice: formatMoney(basePrice * 0.78),
        weight: formatWeight(0.21),
        isDefault: true,
        sortOrder: 1,
        quantity: 18,
        lowStockThreshold: 4,
      },
      {
        sku: `${skuBase}-512-SLV`,
        name: "512GB / Silver",
        price: formatMoney(basePrice + 140),
        compareAtPrice: compareAtPrice
          ? formatMoney(compareAtPrice + 140)
          : null,
        costPrice: formatMoney((basePrice + 140) * 0.78),
        weight: formatWeight(0.212),
        isDefault: false,
        sortOrder: 2,
        quantity: 10,
        lowStockThreshold: 3,
      },
    ]
  }

  if (categorySlug === "tablets") {
    return [
      {
        sku: `${skuBase}-256-WIFI`,
        name: "256GB / Wi-Fi",
        price: formatMoney(basePrice),
        compareAtPrice: compareAtPrice ? formatMoney(compareAtPrice) : null,
        costPrice: formatMoney(basePrice * 0.79),
        weight: formatWeight(0.62),
        isDefault: true,
        sortOrder: 1,
        quantity: 12,
        lowStockThreshold: 3,
      },
      {
        sku: `${skuBase}-512-5G`,
        name: "512GB / Wi-Fi + Cellular",
        price: formatMoney(basePrice + 180),
        compareAtPrice: compareAtPrice
          ? formatMoney(compareAtPrice + 180)
          : null,
        costPrice: formatMoney((basePrice + 180) * 0.79),
        weight: formatWeight(0.635),
        isDefault: false,
        sortOrder: 2,
        quantity: 8,
        lowStockThreshold: 2,
      },
    ]
  }

  return [
    {
      sku: `${skuBase}-16-512`,
      name: "16GB RAM / 512GB SSD",
      price: formatMoney(basePrice),
      compareAtPrice: compareAtPrice ? formatMoney(compareAtPrice) : null,
      costPrice: formatMoney(basePrice * 0.8),
      weight: formatWeight(1.42),
      isDefault: true,
      sortOrder: 1,
      quantity: 9,
      lowStockThreshold: 2,
    },
    {
      sku: `${skuBase}-32-1TB`,
      name: "32GB RAM / 1TB SSD",
      price: formatMoney(basePrice + 320),
      compareAtPrice: compareAtPrice ? formatMoney(compareAtPrice + 320) : null,
      costPrice: formatMoney((basePrice + 320) * 0.8),
      weight: formatWeight(1.46),
      isDefault: false,
      sortOrder: 2,
      quantity: 6,
      lowStockThreshold: 2,
    },
  ]
}

function buildListings(
  categorySlug: string,
  brandName: string,
  model: SeedModel,
  modelSlug: string,
): SeedListing[] {
  const channelConfigs = [
    {
      slugSuffix: "official",
      label: "Official Store",
      shortCopy: "Official channel listing with full local support.",
      priceOffset: 0,
      featured: model.featured ?? false,
    },
    {
      slugSuffix: "partner",
      label: "Partner Seller",
      shortCopy: "Partner marketplace listing with the same model group.",
      priceOffset:
        categorySlug === "laptops"
          ? -90
          : categorySlug === "tablets"
            ? -50
            : -30,
      featured: false,
    },
  ] as const

  return channelConfigs.map((channel, index) => {
    const listingPrice = model.basePrice + channel.priceOffset
    const listingCompareAt = model.compareAtPrice
      ? model.compareAtPrice + channel.priceOffset
      : undefined
    const skuBase = `PMD-${brandName.slice(0, 3).toUpperCase()}-${modelSlug
      .replace(/-/g, "")
      .slice(0, 12)
      .toUpperCase()}-${channel.slugSuffix.toUpperCase()}`

    return {
      slug: `${modelSlug}-${channel.slugSuffix}`,
      name: model.name,
      shortDescription: `${brandName} ${model.name}. ${channel.shortCopy}`,
      description: `${model.description} This seeded listing represents the ${channel.label.toLowerCase()} offer for ${model.name}. It exists to test model-group landing pages with multiple sellable products under one menu item.`,
      basePrice: formatMoney(listingPrice),
      compareAtPrice: listingCompareAt ? formatMoney(listingCompareAt) : null,
      costPrice: formatMoney(listingPrice * 0.77),
      isFeatured: channel.featured,
      imageUrl: model.imageUrl,
      variants: buildVariants(
        categorySlug,
        `${skuBase}${index + 1}`,
        listingPrice,
        listingCompareAt,
      ),
    }
  })
}

async function seedProductMenuDemo() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set")
    process.exit(1)
  }

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  console.log("🧭 Starting product menu demo seed...\n")

  try {
    const brandMap = new Map<string, { id: string; name: string }>()
    const categoryMap = new Map<string, { id: string; name: string }>()
    console.log("🏷️  Upserting brands...")
    for (const brand of seedBrands) {
      const [record] = await db
        .insert(brands)
        .values({
          name: brand.name,
          slug: brand.slug,
          description: brand.description,
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
            sortOrder: brand.sortOrder,
            isActive: true,
            metaTitle: `${brand.name} products`,
            metaDescription: brand.description,
            updatedAt: new Date(),
          },
        })
        .returning({ id: brands.id, name: brands.name, slug: brands.slug })

      brandMap.set(record.slug, { id: record.id, name: record.name })
    }

    console.log("🗂️  Upserting top-level categories...")
    for (const category of seedCategories) {
      const [record] = await db
        .insert(categories)
        .values({
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          sortOrder: category.sortOrder,
          isActive: true,
          showInProductMenu: true,
          productMenuPriority: category.productMenuPriority,
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
            showInProductMenu: true,
            productMenuPriority: category.productMenuPriority,
            metaTitle: `${category.name} collection`,
            metaDescription: category.description,
            updatedAt: new Date(),
          },
        })
        .returning({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        })

      categoryMap.set(record.slug, { id: record.id, name: record.name })
    }

    const seededListings: Array<{
      productId: string
      categoryId: string
      imageUrl: string
      variants: SeedVariant[]
    }> = []
    const touchedCategoryBrandPairs = new Set<string>()
    let totalModelGroups = 0

    console.log("🧩 Upserting model groups and products...")
    for (const [categorySlug, brandsForCategory] of Object.entries(
      seedCatalog,
    )) {
      const category = categoryMap.get(categorySlug)

      if (!category) {
        throw new Error(`Missing seeded category: ${categorySlug}`)
      }

      for (const [brandSlug, models] of Object.entries(brandsForCategory)) {
        const brand = brandMap.get(brandSlug)

        if (!brand) {
          throw new Error(`Missing seeded brand: ${brandSlug}`)
        }

        const pairKey = `${category.id}:${brand.id}`
        touchedCategoryBrandPairs.add(pairKey)

        await db
          .insert(categoryBrandMenuConfigs)
          .values({
            categoryId: category.id,
            brandId: brand.id,
            showInProductMenu: true,
            menuPriority:
              seedBrands.find((item) => item.slug === brandSlug)?.sortOrder ??
              0,
          })
          .onConflictDoUpdate({
            target: [
              categoryBrandMenuConfigs.categoryId,
              categoryBrandMenuConfigs.brandId,
            ],
            set: {
              showInProductMenu: true,
              menuPriority:
                seedBrands.find((item) => item.slug === brandSlug)?.sortOrder ??
                0,
              updatedAt: new Date(),
            },
          })

        for (const model of models) {
          const modelSlug = `${categorySlug}-${brandSlug}-${slugify(model.name)}`

          const [groupRecord] = await db
            .insert(productModelGroups)
            .values({
              categoryId: category.id,
              brandId: brand.id,
              name: model.name,
              slug: modelSlug,
              description: model.description,
              showInProductMenu: true,
              menuPriority: model.menuPriority,
              isActive: true,
            })
            .onConflictDoUpdate({
              target: productModelGroups.slug,
              set: {
                categoryId: category.id,
                brandId: brand.id,
                name: model.name,
                description: model.description,
                showInProductMenu: true,
                menuPriority: model.menuPriority,
                isActive: true,
                updatedAt: new Date(),
              },
            })
            .returning({ id: productModelGroups.id })

          totalModelGroups += 1

          for (const listing of buildListings(
            categorySlug,
            brand.name,
            model,
            modelSlug,
          )) {
            const [productRecord] = await db
              .insert(products)
              .values({
                name: listing.name,
                slug: listing.slug,
                description: listing.description,
                shortDescription: listing.shortDescription,
                brandId: brand.id,
                categoryId: category.id,
                primaryCategoryId: category.id,
                productModelGroupId: groupRecord.id,
                basePrice: listing.basePrice,
                compareAtPrice: listing.compareAtPrice,
                costPrice: listing.costPrice,
                status: "active",
                isFeatured: listing.isFeatured,
                metaTitle: `${listing.name} | ${brand.name}`,
                metaDescription: listing.shortDescription,
              })
              .onConflictDoUpdate({
                target: products.slug,
                set: {
                  name: listing.name,
                  description: listing.description,
                  shortDescription: listing.shortDescription,
                  brandId: brand.id,
                  categoryId: category.id,
                  primaryCategoryId: category.id,
                  productModelGroupId: groupRecord.id,
                  basePrice: listing.basePrice,
                  compareAtPrice: listing.compareAtPrice,
                  costPrice: listing.costPrice,
                  status: "active",
                  isFeatured: listing.isFeatured,
                  metaTitle: `${listing.name} | ${brand.name}`,
                  metaDescription: listing.shortDescription,
                  updatedAt: new Date(),
                },
              })
              .returning({ id: products.id, slug: products.slug })

            seededListings.push({
              productId: productRecord.id,
              categoryId: category.id,
              imageUrl: listing.imageUrl,
              variants: listing.variants,
            })
          }
        }
      }
    }

    const seededProductIds = seededListings.map((listing) => listing.productId)

    if (seededProductIds.length > 0) {
      console.log("🧹 Refreshing seeded assignments, media, and variants...")
      await db
        .delete(productImages)
        .where(inArray(productImages.productId, seededProductIds))
      await db
        .delete(productCategoryAssignments)
        .where(inArray(productCategoryAssignments.productId, seededProductIds))
      await db
        .delete(productVariants)
        .where(inArray(productVariants.productId, seededProductIds))
    }

    let totalVariants = 0

    for (const listing of seededListings) {
      await db.insert(productCategoryAssignments).values({
        productId: listing.productId,
        categoryId: listing.categoryId,
      })

      await db.insert(productImages).values({
        productId: listing.productId,
        url: listing.imageUrl,
        altText: "Seeded product image",
        sortOrder: 1,
        isPrimary: true,
      })

      for (const variant of listing.variants) {
        const [variantRecord] = await db
          .insert(productVariants)
          .values({
            productId: listing.productId,
            sku: variant.sku,
            name: variant.name,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            costPrice: variant.costPrice,
            weight: variant.weight,
            isDefault: variant.isDefault,
            isActive: true,
            sortOrder: variant.sortOrder,
          })
          .onConflictDoUpdate({
            target: productVariants.sku,
            set: {
              productId: listing.productId,
              name: variant.name,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              costPrice: variant.costPrice,
              weight: variant.weight,
              isDefault: variant.isDefault,
              isActive: true,
              sortOrder: variant.sortOrder,
              updatedAt: new Date(),
            },
          })
          .returning({ id: productVariants.id })

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
          .returning({ id: inventoryItems.id })

        await db
          .delete(inventoryMovements)
          .where(
            and(
              eq(inventoryMovements.inventoryItemId, inventoryRecord.id),
              eq(inventoryMovements.referenceType, "seed-product-menu-demo"),
              eq(inventoryMovements.referenceId, variantRecord.id),
            ),
          )

        await db.insert(inventoryMovements).values({
          inventoryItemId: inventoryRecord.id,
          type: "purchase",
          quantity: variant.quantity,
          previousQuantity: 0,
          newQuantity: variant.quantity,
          referenceType: "seed-product-menu-demo",
          referenceId: variantRecord.id,
          notes: "Initial stock from product menu demo seed",
        })

        totalVariants += 1
      }
    }

    console.log("\n✅ Product menu demo seed completed successfully!")
    console.log(`  Categories: ${seedCategories.length}`)
    console.log(`  Brands: ${seedBrands.length}`)
    console.log(`  Category-brand configs: ${touchedCategoryBrandPairs.size}`)
    console.log(`  Model groups: ${totalModelGroups}`)
    console.log(`  Products: ${seededListings.length}`)
    console.log(`  Variants: ${totalVariants}`)
    console.log(
      "  Storefront test path: hover Products in the header, then open /products/models/[slug]",
    )
  } catch (error) {
    console.error("\n❌ Product menu demo seed failed:", error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seedProductMenuDemo()

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import {
  brandCategoryAssignments,
  brands,
  categories,
  inventoryItems,
  inventoryMovements,
  models,
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

type SeedCategory = {
  name: string
  slug: string
  description: string
  sortOrder: number
  productMenuPriority: number
}

type SeedBrand = {
  name: string
  slug: string
  description: string
  sortOrder: number
  categories: Array<{
    categorySlug: string
    navPriority: number
    showInProductMenu?: boolean
  }>
}

type SeedVariant = {
  name: string
  sku: string
  price: string
  compareAtPrice?: string | null
  costPrice?: string | null
  weight?: string | null
  quantity: number
  isDefault?: boolean
  optionValues?: Record<string, string>
}

type SeedProduct = {
  name: string
  slug: string
  shortDescription: string
  description: string
  isFeatured?: boolean
  options?: Array<{
    name: string
    values: string[]
  }>
  variants: SeedVariant[]
}

type SeedModel = {
  name: string
  slug: string
  description: string
  brandSlug: string
  categorySlug: string
  navPriority: number
  products: SeedProduct[]
}

const seedCategories: SeedCategory[] = [
  {
    name: "Phones",
    slug: "phones",
    description: "Smartphones and flagship mobile devices.",
    sortOrder: 1,
    productMenuPriority: 1,
  },
  {
    name: "Tablets",
    slug: "tablets",
    description: "Tablets, hybrid devices, and large-screen mobile computing.",
    sortOrder: 2,
    productMenuPriority: 2,
  },
  {
    name: "Laptops",
    slug: "laptops",
    description: "Premium laptops, creator notebooks, and gaming systems.",
    sortOrder: 3,
    productMenuPriority: 3,
  },
  {
    name: "Audio",
    slug: "audio",
    description: "Audio gear, earbuds, and listening accessories.",
    sortOrder: 10,
    productMenuPriority: 10,
  },
  {
    name: "Power Accessories",
    slug: "power-accessories",
    description: "Chargers, adapters, power banks, and cables.",
    sortOrder: 11,
    productMenuPriority: 11,
  },
]

const seedBrands: SeedBrand[] = [
  {
    name: "Apple",
    slug: "apple",
    description: "Apple hardware across phones, tablets, laptops, and audio.",
    sortOrder: 1,
    categories: [
      { categorySlug: "phones", navPriority: 1 },
      { categorySlug: "tablets", navPriority: 1 },
      { categorySlug: "laptops", navPriority: 1 },
      { categorySlug: "audio", navPriority: 1 },
      { categorySlug: "power-accessories", navPriority: 2 },
    ],
  },
  {
    name: "Samsung",
    slug: "samsung",
    description: "Samsung mobile, tablet, and laptop devices.",
    sortOrder: 2,
    categories: [
      { categorySlug: "phones", navPriority: 2 },
      { categorySlug: "tablets", navPriority: 2 },
      { categorySlug: "laptops", navPriority: 2 },
      { categorySlug: "audio", navPriority: 2 },
      { categorySlug: "power-accessories", navPriority: 3 },
    ],
  },
  {
    name: "Xiaomi",
    slug: "xiaomi",
    description: "Xiaomi devices and ecosystem hardware.",
    sortOrder: 3,
    categories: [
      { categorySlug: "phones", navPriority: 3 },
      { categorySlug: "tablets", navPriority: 3 },
      { categorySlug: "laptops", navPriority: 3 },
      { categorySlug: "audio", navPriority: 3 },
      { categorySlug: "power-accessories", navPriority: 4 },
    ],
  },
  {
    name: "ASUS",
    slug: "asus",
    description: "ASUS consumer, creator, and gaming hardware.",
    sortOrder: 4,
    categories: [
      { categorySlug: "phones", navPriority: 4 },
      { categorySlug: "tablets", navPriority: 4 },
      { categorySlug: "laptops", navPriority: 4 },
      { categorySlug: "power-accessories", navPriority: 5 },
    ],
  },
]

const seedModels: SeedModel[] = [
  {
    name: "iPhone 17",
    slug: "phones-apple-iphone-17",
    description:
      "Apple iPhone 17 family with multiple storage and supplier listings.",
    brandSlug: "apple",
    categorySlug: "phones",
    navPriority: 1,
    products: [
      {
        name: "iPhone 17 Official Warranty",
        slug: "iphone-17-official-warranty",
        shortDescription: "Official channel iPhone 17 with local warranty.",
        description:
          "Primary Apple channel listing for iPhone 17 with official local warranty support.",
        isFeatured: true,
        options: [
          { name: "Storage", values: ["128GB", "256GB"] },
          { name: "Color", values: ["Black", "Blue"] },
        ],
        variants: [
          {
            name: "128GB / Black",
            sku: "APL-IP17-OFF-128-BLK",
            price: "999.00",
            compareAtPrice: "1049.00",
            costPrice: "830.00",
            weight: "0.172",
            quantity: 9,
            isDefault: true,
            optionValues: { Storage: "128GB", Color: "Black" },
          },
          {
            name: "128GB / Blue",
            sku: "APL-IP17-OFF-128-BLU",
            price: "999.00",
            compareAtPrice: "1049.00",
            costPrice: "830.00",
            weight: "0.172",
            quantity: 6,
            optionValues: { Storage: "128GB", Color: "Blue" },
          },
          {
            name: "256GB / Black",
            sku: "APL-IP17-OFF-256-BLK",
            price: "1099.00",
            compareAtPrice: "1149.00",
            costPrice: "920.00",
            weight: "0.172",
            quantity: 7,
            optionValues: { Storage: "256GB", Color: "Black" },
          },
          {
            name: "256GB / Blue",
            sku: "APL-IP17-OFF-256-BLU",
            price: "1099.00",
            compareAtPrice: "1149.00",
            costPrice: "920.00",
            weight: "0.172",
            quantity: 5,
            optionValues: { Storage: "256GB", Color: "Blue" },
          },
        ],
      },
    ],
  },
  {
    name: "iPhone 17 Pro",
    slug: "phones-apple-iphone-17-pro",
    description:
      "Apple iPhone 17 Pro model listings grouped under a single nav item.",
    brandSlug: "apple",
    categorySlug: "phones",
    navPriority: 2,
    products: [
      {
        name: "iPhone 17 Pro Official Warranty",
        slug: "iphone-17-pro-official-warranty",
        shortDescription:
          "Official iPhone 17 Pro listing with full warranty coverage.",
        description: "Official Apple distribution listing for iPhone 17 Pro.",
        isFeatured: true,
        options: [
          { name: "Storage", values: ["256GB", "512GB"] },
          { name: "Color", values: ["Natural Titanium", "Black Titanium"] },
        ],
        variants: [
          {
            name: "256GB / Natural Titanium",
            sku: "APL-IP17PRO-OFF-256-NAT",
            price: "1299.00",
            compareAtPrice: "1399.00",
            costPrice: "1040.00",
            weight: "0.199",
            quantity: 8,
            isDefault: true,
            optionValues: { Storage: "256GB", Color: "Natural Titanium" },
          },
          {
            name: "256GB / Black Titanium",
            sku: "APL-IP17PRO-OFF-256-BLK",
            price: "1299.00",
            compareAtPrice: "1399.00",
            costPrice: "1040.00",
            weight: "0.199",
            quantity: 6,
            optionValues: { Storage: "256GB", Color: "Black Titanium" },
          },
          {
            name: "512GB / Natural Titanium",
            sku: "APL-IP17PRO-OFF-512-NAT",
            price: "1499.00",
            compareAtPrice: "1599.00",
            costPrice: "1210.00",
            weight: "0.199",
            quantity: 4,
            optionValues: { Storage: "512GB", Color: "Natural Titanium" },
          },
          {
            name: "512GB / Black Titanium",
            sku: "APL-IP17PRO-OFF-512-BLK",
            price: "1499.00",
            compareAtPrice: "1599.00",
            costPrice: "1210.00",
            weight: "0.199",
            quantity: 3,
            optionValues: { Storage: "512GB", Color: "Black Titanium" },
          },
        ],
      },
      {
        name: "iPhone 17 Pro Partner Store",
        slug: "iphone-17-pro-partner-store",
        shortDescription:
          "Partner-supplied iPhone 17 Pro offers under the same model.",
        description:
          "Secondary supplier listing for iPhone 17 Pro, grouped under the same model landing page.",
        options: [{ name: "Storage", values: ["256GB", "512GB"] }],
        variants: [
          {
            name: "256GB",
            sku: "APL-IP17PRO-PTN-256",
            price: "1269.00",
            compareAtPrice: "1349.00",
            costPrice: "1010.00",
            weight: "0.199",
            quantity: 5,
            isDefault: true,
            optionValues: { Storage: "256GB" },
          },
          {
            name: "512GB",
            sku: "APL-IP17PRO-PTN-512",
            price: "1469.00",
            compareAtPrice: "1549.00",
            costPrice: "1185.00",
            weight: "0.199",
            quantity: 4,
            optionValues: { Storage: "512GB" },
          },
        ],
      },
    ],
  },
  {
    name: "iPhone 17 Pro Max",
    slug: "phones-apple-iphone-17-pro-max",
    description: "Premium iPhone 17 Pro Max listings.",
    brandSlug: "apple",
    categorySlug: "phones",
    navPriority: 3,
    products: [
      {
        name: "iPhone 17 Pro Max Official Warranty",
        slug: "iphone-17-pro-max-official-warranty",
        shortDescription: "Top-tier iPhone 17 Pro Max with official coverage.",
        description: "Official flagship listing for the iPhone 17 Pro Max.",
        options: [{ name: "Storage", values: ["256GB", "512GB", "1TB"] }],
        variants: [
          {
            name: "256GB",
            sku: "APL-IP17PM-OFF-256",
            price: "1499.00",
            compareAtPrice: "1599.00",
            costPrice: "1235.00",
            weight: "0.221",
            quantity: 5,
            isDefault: true,
            optionValues: { Storage: "256GB" },
          },
          {
            name: "512GB",
            sku: "APL-IP17PM-OFF-512",
            price: "1699.00",
            compareAtPrice: "1799.00",
            costPrice: "1405.00",
            weight: "0.221",
            quantity: 4,
            optionValues: { Storage: "512GB" },
          },
          {
            name: "1TB",
            sku: "APL-IP17PM-OFF-1TB",
            price: "1899.00",
            compareAtPrice: "1999.00",
            costPrice: "1575.00",
            weight: "0.221",
            quantity: 2,
            optionValues: { Storage: "1TB" },
          },
        ],
      },
    ],
  },
  {
    name: "Galaxy S25 Ultra",
    slug: "phones-samsung-galaxy-s25-ultra",
    description: "Samsung flagship Galaxy S25 Ultra offers.",
    brandSlug: "samsung",
    categorySlug: "phones",
    navPriority: 1,
    products: [
      {
        name: "Galaxy S25 Ultra",
        slug: "galaxy-s25-ultra",
        shortDescription: "Samsung flagship Android phone.",
        description:
          "Premium Samsung Galaxy S25 Ultra with S Pen and AI features.",
        options: [{ name: "Storage", values: ["256GB", "512GB"] }],
        variants: [
          {
            name: "256GB",
            sku: "SAM-S25U-256",
            price: "1249.00",
            compareAtPrice: "1349.00",
            costPrice: "990.00",
            weight: "0.232",
            quantity: 6,
            isDefault: true,
            optionValues: { Storage: "256GB" },
          },
          {
            name: "512GB",
            sku: "SAM-S25U-512",
            price: "1399.00",
            compareAtPrice: "1499.00",
            costPrice: "1110.00",
            weight: "0.232",
            quantity: 4,
            optionValues: { Storage: "512GB" },
          },
        ],
      },
    ],
  },
  {
    name: "Xiaomi 15 Ultra",
    slug: "phones-xiaomi-15-ultra",
    description: "Xiaomi premium camera-focused flagship listings.",
    brandSlug: "xiaomi",
    categorySlug: "phones",
    navPriority: 1,
    products: [
      {
        name: "Xiaomi 15 Ultra",
        slug: "xiaomi-15-ultra",
        shortDescription: "Ultra-premium Xiaomi flagship phone.",
        description:
          "Xiaomi 15 Ultra built for flagship mobile photography and performance.",
        variants: [
          {
            name: "Default",
            sku: "XIA-15ULT-512",
            price: "1199.00",
            compareAtPrice: "1249.00",
            costPrice: "935.00",
            weight: "0.219",
            quantity: 5,
            isDefault: true,
          },
        ],
      },
    ],
  },
  {
    name: "ROG Phone 9",
    slug: "phones-asus-rog-phone-9",
    description: "Gaming-focused ASUS smartphone offers.",
    brandSlug: "asus",
    categorySlug: "phones",
    navPriority: 1,
    products: [
      {
        name: "ROG Phone 9",
        slug: "rog-phone-9",
        shortDescription: "Gaming smartphone from ASUS ROG.",
        description:
          "High-refresh, gaming-focused phone with advanced cooling and shoulder triggers.",
        variants: [
          {
            name: "Default",
            sku: "ASU-ROG9-512",
            price: "1099.00",
            compareAtPrice: "1149.00",
            costPrice: "860.00",
            weight: "0.227",
            quantity: 4,
            isDefault: true,
          },
        ],
      },
    ],
  },
  {
    name: "iPad Pro 13",
    slug: "tablets-apple-ipad-pro-13",
    description: "Apple iPad Pro 13-inch line.",
    brandSlug: "apple",
    categorySlug: "tablets",
    navPriority: 1,
    products: [
      {
        name: "iPad Pro 13-inch",
        slug: "ipad-pro-13",
        shortDescription: "Apple tablet for creative and pro workflows.",
        description:
          "iPad Pro 13-inch with OLED display and Apple Pencil support.",
        options: [{ name: "Storage", values: ["256GB", "512GB"] }],
        variants: [
          {
            name: "256GB",
            sku: "APL-IPADPRO13-256",
            price: "1299.00",
            compareAtPrice: "1349.00",
            costPrice: "1045.00",
            weight: "0.579",
            quantity: 6,
            isDefault: true,
            optionValues: { Storage: "256GB" },
          },
          {
            name: "512GB",
            sku: "APL-IPADPRO13-512",
            price: "1499.00",
            compareAtPrice: "1549.00",
            costPrice: "1210.00",
            weight: "0.579",
            quantity: 3,
            optionValues: { Storage: "512GB" },
          },
        ],
      },
    ],
  },
  {
    name: "Galaxy Tab S10 Ultra",
    slug: "tablets-samsung-galaxy-tab-s10-ultra",
    description: "Samsung flagship tablet lineup.",
    brandSlug: "samsung",
    categorySlug: "tablets",
    navPriority: 1,
    products: [
      {
        name: "Galaxy Tab S10 Ultra",
        slug: "galaxy-tab-s10-ultra",
        shortDescription: "Large Samsung productivity tablet.",
        description:
          "Large-screen flagship Samsung tablet built for work and entertainment.",
        variants: [
          {
            name: "Default",
            sku: "SAM-TABS10U-256",
            price: "1199.00",
            compareAtPrice: "1249.00",
            costPrice: "945.00",
            weight: "0.732",
            quantity: 4,
            isDefault: true,
          },
        ],
      },
    ],
  },
  {
    name: "Pad 7 Pro",
    slug: "tablets-xiaomi-pad-7-pro",
    description: "Xiaomi tablet lineup.",
    brandSlug: "xiaomi",
    categorySlug: "tablets",
    navPriority: 1,
    products: [
      {
        name: "Xiaomi Pad 7 Pro",
        slug: "xiaomi-pad-7-pro",
        shortDescription: "Premium Android tablet from Xiaomi.",
        description:
          "Slim productivity tablet with stylus support and large battery life.",
        variants: [
          {
            name: "Default",
            sku: "XIA-PAD7PRO-256",
            price: "699.00",
            compareAtPrice: "749.00",
            costPrice: "520.00",
            weight: "0.571",
            quantity: 7,
            isDefault: true,
          },
        ],
      },
    ],
  },
  {
    name: "ROG Flow Z13",
    slug: "tablets-asus-rog-flow-z13",
    description: "ASUS gaming tablet and detachable lineup.",
    brandSlug: "asus",
    categorySlug: "tablets",
    navPriority: 1,
    products: [
      {
        name: "ROG Flow Z13",
        slug: "rog-flow-z13",
        shortDescription: "Detachable gaming tablet from ASUS.",
        description:
          "High-performance gaming tablet with keyboard flexibility and RTX graphics.",
        variants: [
          {
            name: "Default",
            sku: "ASU-Z13-RTX4060",
            price: "1899.00",
            compareAtPrice: "1999.00",
            costPrice: "1530.00",
            weight: "1.180",
            quantity: 2,
            isDefault: true,
          },
        ],
      },
    ],
  },
  {
    name: "MacBook Air 15",
    slug: "laptops-apple-macbook-air-15",
    description: "Apple MacBook Air 15-inch offers.",
    brandSlug: "apple",
    categorySlug: "laptops",
    navPriority: 1,
    products: [
      {
        name: "MacBook Air 15-inch",
        slug: "macbook-air-15",
        shortDescription: "Thin and light Apple laptop.",
        description:
          "Portable Apple notebook for everyday productivity and creative work.",
        options: [
          { name: "Memory", values: ["16GB", "24GB"] },
          { name: "Storage", values: ["512GB", "1TB"] },
        ],
        variants: [
          {
            name: "16GB / 512GB",
            sku: "APL-MBA15-16-512",
            price: "1599.00",
            compareAtPrice: "1649.00",
            costPrice: "1280.00",
            weight: "1.510",
            quantity: 5,
            isDefault: true,
            optionValues: { Memory: "16GB", Storage: "512GB" },
          },
          {
            name: "16GB / 1TB",
            sku: "APL-MBA15-16-1TB",
            price: "1799.00",
            compareAtPrice: "1849.00",
            costPrice: "1440.00",
            weight: "1.510",
            quantity: 4,
            optionValues: { Memory: "16GB", Storage: "1TB" },
          },
          {
            name: "24GB / 1TB",
            sku: "APL-MBA15-24-1TB",
            price: "1999.00",
            compareAtPrice: "2049.00",
            costPrice: "1605.00",
            weight: "1.510",
            quantity: 2,
            optionValues: { Memory: "24GB", Storage: "1TB" },
          },
        ],
      },
    ],
  },
  {
    name: "Galaxy Book5 Pro 360",
    slug: "laptops-samsung-galaxy-book5-pro-360",
    description: "Samsung premium 2-in-1 laptop lineup.",
    brandSlug: "samsung",
    categorySlug: "laptops",
    navPriority: 1,
    products: [
      {
        name: "Galaxy Book5 Pro 360",
        slug: "galaxy-book5-pro-360",
        shortDescription: "Convertible Samsung productivity laptop.",
        description:
          "Samsung 2-in-1 laptop with AMOLED display and S Pen support.",
        variants: [
          {
            name: "Default",
            sku: "SAM-GB5P360-16-1TB",
            price: "1749.00",
            compareAtPrice: "1849.00",
            costPrice: "1405.00",
            weight: "1.560",
            quantity: 3,
            isDefault: true,
          },
        ],
      },
    ],
  },
  {
    name: "RedmiBook Pro 16",
    slug: "laptops-xiaomi-redmibook-pro-16",
    description: "Xiaomi laptop lineup.",
    brandSlug: "xiaomi",
    categorySlug: "laptops",
    navPriority: 1,
    products: [
      {
        name: "RedmiBook Pro 16",
        slug: "redmibook-pro-16",
        shortDescription: "Xiaomi productivity laptop.",
        description:
          "Large-screen laptop with strong battery life and creator-friendly performance.",
        variants: [
          {
            name: "Default",
            sku: "XIA-RBP16-32-1TB",
            price: "1299.00",
            compareAtPrice: "1349.00",
            costPrice: "995.00",
            weight: "1.880",
            quantity: 4,
            isDefault: true,
          },
        ],
      },
    ],
  },
  {
    name: "ROG Zephyrus G16",
    slug: "laptops-asus-rog-zephyrus-g16",
    description: "ASUS premium gaming laptop lineup.",
    brandSlug: "asus",
    categorySlug: "laptops",
    navPriority: 1,
    products: [
      {
        name: "ROG Zephyrus G16",
        slug: "rog-zephyrus-g16",
        shortDescription: "Portable gaming and creator laptop from ASUS.",
        description:
          "Balanced performance laptop for gaming, design, and rendering workflows.",
        variants: [
          {
            name: "Default",
            sku: "ASU-G16-RTX4070",
            price: "2199.00",
            compareAtPrice: "2299.00",
            costPrice: "1770.00",
            weight: "1.950",
            quantity: 3,
            isDefault: true,
          },
        ],
      },
    ],
  },
]

function createClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }

  const client = postgres(connectionString, { max: 1 })
  const database = drizzle(client)

  return { client, db: database }
}

async function clearCatalogData(db: ReturnType<typeof drizzle>) {
  await db.delete(inventoryMovements)
  await db.delete(inventoryItems)
  await db.delete(productVariantOptionValues)
  await db.delete(productImages)
  await db.delete(productOptionValues)
  await db.delete(productOptions)
  await db.delete(productCategoryAssignments)
  await db.delete(productAttributeValues)
  await db.delete(productVariants)
  await db.delete(products)
  await db.delete(models)
  await db.delete(brandCategoryAssignments)
  await db.delete(categories)
  await db.delete(brands)
}

export async function seedCatalogData(logLabel: string) {
  const { client, db } = createClient()

  console.log(`🌱 Starting ${logLabel}...\n`)

  try {
    await clearCatalogData(db)

    console.log("🏷️  Seeding top-level categories...")
    const categoryMap = new Map<string, string>()
    for (const category of seedCategories) {
      const [created] = await db
        .insert(categories)
        .values({
          name: category.name,
          slug: category.slug,
          description: category.description,
          sortOrder: category.sortOrder,
          isActive: true,
          showInProductMenu: true,
          productMenuPriority: category.productMenuPriority,
        })
        .returning({ id: categories.id })

      categoryMap.set(category.slug, created.id)
    }

    console.log("🏢 Seeding brands and category assignments...")
    const brandMap = new Map<string, string>()
    for (const brand of seedBrands) {
      const [createdBrand] = await db
        .insert(brands)
        .values({
          name: brand.name,
          slug: brand.slug,
          description: brand.description,
          isActive: true,
          sortOrder: brand.sortOrder,
        })
        .returning({ id: brands.id })

      brandMap.set(brand.slug, createdBrand.id)

      for (const assignment of brand.categories) {
        const categoryId = categoryMap.get(assignment.categorySlug)
        if (!categoryId) {
          throw new Error(
            `Missing category for assignment: ${assignment.categorySlug}`,
          )
        }

        await db.insert(brandCategoryAssignments).values({
          brandId: createdBrand.id,
          categoryId,
          navPriority: assignment.navPriority,
          showInProductMenu: assignment.showInProductMenu ?? true,
        })
      }
    }

    console.log(
      "🧩 Seeding models, products, options, variants, and inventory...",
    )
    for (const model of seedModels) {
      const brandId = brandMap.get(model.brandSlug)
      const categoryId = categoryMap.get(model.categorySlug)

      if (!brandId || !categoryId) {
        throw new Error(`Missing brand/category for model ${model.slug}`)
      }

      const [createdModel] = await db
        .insert(models)
        .values({
          name: model.name,
          slug: model.slug,
          description: model.description,
          brandId,
          primaryCategoryId: categoryId,
          isActive: true,
          showInProductMenu: true,
          navPriority: model.navPriority,
        })
        .returning({ id: models.id })

      for (const product of model.products) {
        const defaultVariant =
          product.variants.find((variant) => variant.isDefault) ||
          product.variants[0]

        const [createdProduct] = await db
          .insert(products)
          .values({
            name: product.name,
            slug: product.slug,
            description: product.description,
            shortDescription: product.shortDescription,
            brandId,
            primaryCategoryId: categoryId,
            modelId: createdModel.id,
            basePrice: defaultVariant.price,
            compareAtPrice: defaultVariant.compareAtPrice || null,
            costPrice: defaultVariant.costPrice || null,
            status: "active",
            isFeatured: product.isFeatured ?? false,
            metaTitle: product.name,
            metaDescription: product.shortDescription,
          })
          .returning({ id: products.id })

        await db.insert(productCategoryAssignments).values({
          productId: createdProduct.id,
          categoryId,
        })

        const optionMap = new Map<
          string,
          { id: string; values: Map<string, string> }
        >()

        for (const [optionIndex, option] of (product.options || []).entries()) {
          const [createdOption] = await db
            .insert(productOptions)
            .values({
              productId: createdProduct.id,
              name: option.name,
              sortOrder: optionIndex,
            })
            .returning({ id: productOptions.id })

          const valueMap = new Map<string, string>()
          for (const [valueIndex, value] of option.values.entries()) {
            const [createdValue] = await db
              .insert(productOptionValues)
              .values({
                optionId: createdOption.id,
                value,
                sortOrder: valueIndex,
              })
              .returning({ id: productOptionValues.id })

            valueMap.set(value, createdValue.id)
          }

          optionMap.set(option.name, { id: createdOption.id, values: valueMap })
        }

        for (const [variantIndex, variant] of product.variants.entries()) {
          const [createdVariant] = await db
            .insert(productVariants)
            .values({
              productId: createdProduct.id,
              sku: variant.sku,
              name: variant.name,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice || null,
              costPrice: variant.costPrice || null,
              weight: variant.weight || null,
              isDefault: variant.isDefault ?? variantIndex === 0,
              isActive: true,
              sortOrder: variantIndex,
            })
            .returning({ id: productVariants.id })

          const [inventoryItem] = await db
            .insert(inventoryItems)
            .values({
              variantId: createdVariant.id,
              quantity: variant.quantity,
              reservedQuantity: 0,
              lowStockThreshold: 3,
            })
            .returning({ id: inventoryItems.id })

          await db.insert(inventoryMovements).values({
            inventoryItemId: inventoryItem.id,
            type: "purchase",
            quantity: variant.quantity,
            previousQuantity: 0,
            newQuantity: variant.quantity,
            referenceType: "seed",
            notes: logLabel,
          })

          for (const [optionName, optionValue] of Object.entries(
            variant.optionValues || {},
          )) {
            const optionRecord = optionMap.get(optionName)
            const optionValueId = optionRecord?.values.get(optionValue)

            if (!optionRecord || !optionValueId) {
              throw new Error(
                `Variant ${variant.sku} references unknown option "${optionName}: ${optionValue}"`,
              )
            }

            await db.insert(productVariantOptionValues).values({
              variantId: createdVariant.id,
              optionId: optionRecord.id,
              optionValueId,
            })
          }
        }

        await db.insert(productImages).values({
          productId: createdProduct.id,
          url: `/placeholder/${product.slug}.svg`,
          altText: product.name,
          sortOrder: 0,
          isPrimary: true,
        })
      }
    }

    console.log("\n✅ Catalog seed completed successfully!")
  } catch (error) {
    console.error(`\n❌ ${logLabel} failed:`, error)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

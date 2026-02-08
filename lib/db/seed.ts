import { hashPassword } from "better-auth/crypto"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import {
  account,
  categories,
  inventoryItems,
  productImages,
  products,
  productVariants,
  roles,
  user,
  userRoles,
} from "./schema"

import "dotenv/config"

async function seed() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set")
    process.exit(1)
  }

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)
  console.log("🌱 Starting database seed...\n")

  try {
    console.log("📋 Seeding roles...")
    const roleData = [
      { name: "customer" as const, description: "Regular customer" },
      { name: "admin" as const, description: "Full system access" },
      { name: "manager" as const, description: "Operations management access" },
      { name: "support" as const, description: "Customer support access" },
    ]

    for (const role of roleData) {
      const existing = await db
        .select()
        .from(roles)
        .where(eq(roles.name, role.name))
        .limit(1)

      if (existing.length === 0) {
        await db.insert(roles).values(role)
        console.log(`  ✅ Created role: ${role.name}`)
      } else {
        console.log(`  ⏭️  Role already exists: ${role.name}`)
      }
    }

    console.log("\n👤 Seeding admin user...")
    const adminEmail = "admin@example.com"
    const existingAdmin = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1)

    if (existingAdmin.length === 0) {
      const [adminUser] = await db
        .insert(user)
        .values({
          email: adminEmail,
          emailVerified: true,
          name: "System Admin",
        })
        .returning()

      const passwordHash = await hashPassword("admin123")
      await db.insert(account).values({
        userId: adminUser.id,
        accountId: adminUser.id,
        providerId: "credential",
        password: passwordHash,
      })

      const [adminRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, "admin"))
        .limit(1)

      if (adminRole) {
        await db.insert(userRoles).values({
          userId: adminUser.id,
          roleId: adminRole.id,
        })
      }

      console.log(`  ✅ Created admin user: ${adminEmail}`)
      console.log(`  ⚠️  Default password: admin123 (CHANGE IN PRODUCTION)`)
    } else {
      const adminUser = existingAdmin[0]
      const passwordHash = await hashPassword("admin123")
      await db
        .update(account)
        .set({ password: passwordHash })
        .where(eq(account.userId, adminUser.id))

      console.log(`  🔄 Updated admin password: ${adminEmail}`)
      console.log(`  ⚠️  Default password: admin123 (CHANGE IN PRODUCTION)`)
    }

    console.log("\n📁 Seeding categories...")
    const categoryData = [
      {
        name: "Electronics",
        slug: "electronics",
        description: "Latest gadgets and electronic devices",
        sortOrder: 1,
      },
      {
        name: "Smartphones",
        slug: "smartphones",
        description: "Mobile phones and accessories",
        sortOrder: 2,
        parentSlug: "electronics",
      },
      {
        name: "Laptops",
        slug: "laptops",
        description: "Notebooks and laptop computers",
        sortOrder: 3,
        parentSlug: "electronics",
      },
      {
        name: "Audio",
        slug: "audio",
        description: "Headphones, speakers, and audio equipment",
        sortOrder: 4,
        parentSlug: "electronics",
      },
    ]

    const categoryMap = new Map<string, string>()
    for (const cat of categoryData) {
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, cat.slug))
        .limit(1)

      if (existing.length === 0) {
        const parentId = cat.parentSlug ? categoryMap.get(cat.parentSlug) : null
        const [created] = await db
          .insert(categories)
          .values({
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            sortOrder: cat.sortOrder,
            parentId: parentId || null,
            isActive: true,
          })
          .returning()
        categoryMap.set(cat.slug, created.id)
        console.log(`  ✅ Created category: ${cat.name}`)
      } else {
        categoryMap.set(cat.slug, existing[0].id)
        console.log(`  ⏭️  Category already exists: ${cat.name}`)
      }
    }

    console.log("\n📦 Seeding products...")
    const productData = [
      {
        name: "iPhone 15 Pro",
        slug: "iphone-15-pro",
        description:
          "The most advanced iPhone ever with titanium design, A17 Pro chip, and a customizable Action button. Features a 48MP camera system with 5x optical zoom.",
        shortDescription:
          "Premium smartphone with titanium design and A17 Pro chip",
        categorySlug: "smartphones",
        basePrice: "999.00",
        compareAtPrice: "1099.00",
        costPrice: "700.00",
        status: "active" as const,
        isFeatured: true,
        variants: [
          {
            name: "128GB - Natural Titanium",
            sku: "IPH15P-128-NAT",
            price: "999.00",
            stock: 25,
          },
          {
            name: "256GB - Natural Titanium",
            sku: "IPH15P-256-NAT",
            price: "1099.00",
            stock: 20,
          },
          {
            name: "128GB - Blue Titanium",
            sku: "IPH15P-128-BLU",
            price: "999.00",
            stock: 15,
          },
          {
            name: "256GB - Blue Titanium",
            sku: "IPH15P-256-BLU",
            price: "1099.00",
            stock: 18,
          },
        ],
        images: [
          {
            url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800",
            altText: "iPhone 15 Pro front view",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800",
            altText: "iPhone 15 Pro side view",
            isPrimary: false,
          },
        ],
      },
      {
        name: "Samsung Galaxy S24 Ultra",
        slug: "samsung-galaxy-s24-ultra",
        description:
          "The ultimate Galaxy experience with built-in S Pen, 200MP camera, and Galaxy AI features. Titanium frame for premium durability.",
        shortDescription: "Flagship Samsung phone with S Pen and 200MP camera",
        categorySlug: "smartphones",
        basePrice: "1199.00",
        compareAtPrice: "1299.00",
        costPrice: "850.00",
        status: "active" as const,
        isFeatured: true,
        variants: [
          {
            name: "256GB - Titanium Black",
            sku: "SGS24U-256-BLK",
            price: "1199.00",
            stock: 30,
          },
          {
            name: "512GB - Titanium Black",
            sku: "SGS24U-512-BLK",
            price: "1319.00",
            stock: 22,
          },
          {
            name: "256GB - Titanium Gray",
            sku: "SGS24U-256-GRY",
            price: "1199.00",
            stock: 28,
          },
        ],
        images: [
          {
            url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800",
            altText: "Samsung Galaxy S24 Ultra",
            isPrimary: true,
          },
        ],
      },
      {
        name: 'MacBook Pro 14" M3 Pro',
        slug: "macbook-pro-14-m3-pro",
        description:
          "Supercharged by the M3 Pro chip for exceptional performance. Features Liquid Retina XDR display, up to 18 hours of battery life, and advanced connectivity.",
        shortDescription:
          "Professional laptop with M3 Pro chip and stunning display",
        categorySlug: "laptops",
        basePrice: "1999.00",
        compareAtPrice: null,
        costPrice: "1500.00",
        status: "active" as const,
        isFeatured: true,
        variants: [
          {
            name: "18GB RAM / 512GB SSD - Space Black",
            sku: "MBP14-M3P-18-512-BLK",
            price: "1999.00",
            stock: 12,
          },
          {
            name: "36GB RAM / 1TB SSD - Space Black",
            sku: "MBP14-M3P-36-1TB-BLK",
            price: "2499.00",
            stock: 8,
          },
          {
            name: "18GB RAM / 512GB SSD - Silver",
            sku: "MBP14-M3P-18-512-SLV",
            price: "1999.00",
            stock: 10,
          },
        ],
        images: [
          {
            url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
            altText: "MacBook Pro 14 inch",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800",
            altText: "MacBook Pro keyboard",
            isPrimary: false,
          },
        ],
      },
      {
        name: "Sony WH-1000XM5",
        slug: "sony-wh-1000xm5",
        description:
          "Industry-leading noise cancellation with Auto NC Optimizer. Crystal clear hands-free calling with 8 microphones. Up to 30 hours of battery life.",
        shortDescription: "Premium wireless noise-canceling headphones",
        categorySlug: "audio",
        basePrice: "349.00",
        compareAtPrice: "399.00",
        costPrice: "200.00",
        status: "active" as const,
        isFeatured: false,
        variants: [
          { name: "Black", sku: "SONY-XM5-BLK", price: "349.00", stock: 45 },
          { name: "Silver", sku: "SONY-XM5-SLV", price: "349.00", stock: 38 },
          {
            name: "Midnight Blue",
            sku: "SONY-XM5-BLU",
            price: "349.00",
            stock: 25,
          },
        ],
        images: [
          {
            url: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800",
            altText: "Sony WH-1000XM5 headphones",
            isPrimary: true,
          },
        ],
      },
      {
        name: "AirPods Pro 2nd Generation",
        slug: "airpods-pro-2",
        description:
          "Rebuilt from the sound up with the Apple H2 chip. Active Noise Cancellation and Adaptive Transparency. Personalized Spatial Audio with dynamic head tracking.",
        shortDescription:
          "Premium wireless earbuds with active noise cancellation",
        categorySlug: "audio",
        basePrice: "249.00",
        compareAtPrice: null,
        costPrice: "150.00",
        status: "active" as const,
        isFeatured: true,
        variants: [
          {
            name: "With MagSafe Charging Case",
            sku: "APP2-MAGSAFE",
            price: "249.00",
            stock: 60,
          },
          {
            name: "With USB-C Charging Case",
            sku: "APP2-USBC",
            price: "249.00",
            stock: 55,
          },
        ],
        images: [
          {
            url: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800",
            altText: "AirPods Pro",
            isPrimary: true,
          },
        ],
      },
      {
        name: "Wireless Charging Pad",
        slug: "wireless-charging-pad",
        description:
          "Fast 15W wireless charging pad compatible with all Qi-enabled devices. Sleek minimalist design with LED indicator. Includes USB-C cable.",
        shortDescription: "Fast 15W Qi wireless charging pad",
        categorySlug: "electronics",
        basePrice: "29.00",
        compareAtPrice: "39.00",
        costPrice: "12.00",
        status: "active" as const,
        isFeatured: false,
        variants: [
          { name: "Black", sku: "CHRG-PAD-BLK", price: "29.00", stock: 200 },
          { name: "White", sku: "CHRG-PAD-WHT", price: "29.00", stock: 180 },
        ],
        images: [
          {
            url: "https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=800",
            altText: "Wireless charging pad",
            isPrimary: true,
          },
        ],
      },
    ]

    for (const prod of productData) {
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.slug, prod.slug))
        .limit(1)

      if (existing.length === 0) {
        const categoryId = categoryMap.get(prod.categorySlug) || null
        const [createdProduct] = await db
          .insert(products)
          .values({
            name: prod.name,
            slug: prod.slug,
            description: prod.description,
            shortDescription: prod.shortDescription,
            categoryId,
            basePrice: prod.basePrice,
            compareAtPrice: prod.compareAtPrice,
            costPrice: prod.costPrice,
            status: prod.status,
            isFeatured: prod.isFeatured,
          })
          .returning()

        for (let i = 0; i < prod.variants.length; i++) {
          const variant = prod.variants[i]
          const [createdVariant] = await db
            .insert(productVariants)
            .values({
              productId: createdProduct.id,
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              isDefault: i === 0,
              isActive: true,
              sortOrder: i,
            })
            .returning()

          await db.insert(inventoryItems).values({
            variantId: createdVariant.id,
            quantity: variant.stock,
            reservedQuantity: 0,
            lowStockThreshold: 5,
          })
        }

        for (let i = 0; i < prod.images.length; i++) {
          const img = prod.images[i]
          await db.insert(productImages).values({
            productId: createdProduct.id,
            url: img.url,
            altText: img.altText,
            isPrimary: img.isPrimary,
            sortOrder: i,
          })
        }

        console.log(
          `  ✅ Created product: ${prod.name} (${prod.variants.length} variants)`,
        )
      } else {
        console.log(`  ⏭️  Product already exists: ${prod.name}`)
      }
    }

    console.log("\n✅ Database seed completed successfully!")
  } catch (error) {
    console.error("\n❌ Seed failed:", error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seed()

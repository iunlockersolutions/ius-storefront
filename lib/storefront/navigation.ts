import { unstable_cache } from "next/cache"

import { and, asc, desc, eq, inArray } from "drizzle-orm"

import { getActiveBrands } from "@/lib/actions/brand"
import { getActiveCategories } from "@/lib/actions/category"
import { withStorefrontCatalogFallback } from "@/lib/actions/storefront-catalog-read"
import { db } from "@/lib/db"
import { brands, productCategoryAssignments, products } from "@/lib/db/schema"

type CategoryNode = Awaited<ReturnType<typeof getActiveCategories>>[number]

type NavigationProduct = {
  id: string
  name: string
  slug: string
  createdAt: Date
  brand: {
    id: string
    name: string
    slug: string
    sortOrder: number
  } | null
  isFeatured: boolean
}

export type StorefrontNavProductLink = {
  id: string
  name: string
  href: string
  isDummy?: boolean
}

export type StorefrontNavBrand = {
  id: string
  name: string
  slug: string | null
  href: string
  products: StorefrontNavProductLink[]
  isDummy?: boolean
}

export type StorefrontNavCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  productCount: number
  brands: StorefrontNavBrand[]
}

export type StorefrontNavigationData = {
  productCategories: StorefrontNavCategory[]
  brands: Array<{
    id: string
    name: string
    slug: string
    productCount: number
  }>
}

function collectDescendantIds(
  node: CategoryNode,
  rootId: string,
  descendantToTopLevel = new Map<string, string>(),
) {
  descendantToTopLevel.set(node.id, rootId)

  for (const child of node.children) {
    collectDescendantIds(child as CategoryNode, rootId, descendantToTopLevel)
  }

  return descendantToTopLevel
}

function compareProducts(a: NavigationProduct, b: NavigationProduct) {
  if (a.isFeatured !== b.isFeatured) {
    return a.isFeatured ? -1 : 1
  }

  if (a.createdAt.getTime() !== b.createdAt.getTime()) {
    return b.createdAt.getTime() - a.createdAt.getTime()
  }

  return a.name.localeCompare(b.name)
}

const DUMMY_BRAND_PRESETS: Record<
  string,
  Array<{ name: string; slug: string | null; products: string[] }>
> = {
  phones: [
    {
      name: "Apple",
      slug: "apple",
      products: [
        "iPhone 17 Pro Max",
        "iPhone 17 Pro",
        "iPhone 17 Plus",
        "iPhone 17",
        "iPhone 16 Pro",
        "iPhone 16e",
      ],
    },
    {
      name: "Samsung",
      slug: null,
      products: [
        "Galaxy S25 Ultra",
        "Galaxy S25+",
        "Galaxy S25",
        "Galaxy Z Fold 7",
        "Galaxy Z Flip 7",
      ],
    },
    {
      name: "Google",
      slug: null,
      products: ["Pixel 10 Pro", "Pixel 10", "Pixel 9a", "Pixel Fold 3"],
    },
    {
      name: "OnePlus",
      slug: null,
      products: ["OnePlus 14", "OnePlus 14R", "Nord 6 Pro", "Open 2"],
    },
  ],
  tablets: [
    {
      name: "Apple",
      slug: "apple",
      products: [
        'iPad Pro 13"',
        'iPad Pro 11"',
        'iPad Air 13"',
        'iPad Air 11"',
        "iPad mini",
        "iPad 11th Gen",
      ],
    },
    {
      name: "Samsung",
      slug: null,
      products: [
        "Galaxy Tab S10 Ultra",
        "Galaxy Tab S10+",
        "Galaxy Tab S10 FE",
        "Galaxy Tab A10",
      ],
    },
    {
      name: "Xiaomi",
      slug: null,
      products: ["Pad 7 Pro", "Pad 7", "Redmi Pad Pro 5G", "Redmi Pad SE"],
    },
    {
      name: "ASUS",
      slug: null,
      products: [
        "ROG Flow Z13",
        "ProArt PZ13",
        "Vivobook Tab 13",
        "ZenPad Ultra",
      ],
    },
  ],
  laptops: [
    {
      name: "Apple",
      slug: "apple",
      products: [
        'MacBook Pro 16"',
        'MacBook Pro 14"',
        'MacBook Air 15"',
        'MacBook Air 13"',
        "Mac mini",
        "iMac 24",
      ],
    },
    {
      name: "Samsung",
      slug: null,
      products: [
        "Galaxy Book5 Ultra",
        "Galaxy Book5 Pro 360",
        "Galaxy Book5 Pro",
        "Galaxy Book5 360",
      ],
    },
    {
      name: "Xiaomi",
      slug: null,
      products: [
        "Xiaomi Book Pro 16",
        "Redmi Book Pro 16",
        "Redmi Book 14",
        "Xiaomi Notebook Air",
      ],
    },
    {
      name: "ASUS",
      slug: null,
      products: [
        "Zenbook S 16",
        "ROG Zephyrus G16",
        "Vivobook Pro 15",
        "ExpertBook B9",
      ],
    },
  ],
  wearables: [
    {
      name: "Apple",
      slug: "apple",
      products: [
        "Apple Watch Ultra 3",
        "Apple Watch Series 11",
        "Apple Watch SE",
        "Watch Magnetic Link",
      ],
    },
    {
      name: "Samsung",
      slug: null,
      products: [
        "Galaxy Watch Ultra",
        "Galaxy Watch 8 Classic",
        "Galaxy Watch FE",
        "Galaxy Ring",
      ],
    },
    {
      name: "Garmin",
      slug: null,
      products: ["Fenix 8", "Forerunner 975", "Venu 4", "Instinct 3"],
    },
    {
      name: "Fitbit",
      slug: null,
      products: ["Sense 3", "Versa 5", "Charge 7", "Inspire 4"],
    },
  ],
  audio: [
    {
      name: "Sony",
      slug: "sony",
      products: ["WH-1000XM7", "WF-1000XM6", "ULT Wear", "SRS-XG500"],
    },
    {
      name: "Apple",
      slug: "apple",
      products: [
        "AirPods Pro 3",
        "AirPods 5",
        "AirPods Max 2",
        "Beats Studio Pro",
      ],
    },
    {
      name: "Soundcore",
      slug: null,
      products: ["Liberty 5", "Space One Pro", "Motion X600", "Boom 3i"],
    },
    {
      name: "JBL",
      slug: null,
      products: ["Tour Pro 3", "Charge 7", "Quantum One X", "Flip 8"],
    },
  ],
  "power-accessories": [
    {
      name: "Anker",
      slug: "anker",
      products: [
        "Prime 200W Charger",
        "PowerCore 24K",
        "USB-C Cable Pro",
        "MagGo 3-in-1 Stand",
      ],
    },
    {
      name: "UGREEN",
      slug: null,
      products: [
        "Nexode 100W",
        "MagFlow Stand",
        "6-in-1 Charging Dock",
        "Revodok Pro Hub",
      ],
    },
    {
      name: "Belkin",
      slug: null,
      products: [
        "BoostCharge Pro",
        "3-in-1 Pad",
        "Braided Cable Kit",
        "USB-C GaN 140W",
      ],
    },
    {
      name: "Baseus",
      slug: null,
      products: [
        "Blade 2 Power Bank",
        "GaN5 Charger",
        "Display Cable",
        "Nomos 7-in-1 Hub",
      ],
    },
  ],
}

const SYNTHETIC_CATEGORY_PRESETS: Array<{
  slug: string
  name: string
  description: string
}> = [
  {
    slug: "tablets",
    name: "Tablets",
    description:
      "iPads, Galaxy Tabs, Xiaomi tablets, and ASUS portable devices.",
  },
  {
    slug: "laptops",
    name: "Laptops",
    description:
      "MacBooks, Galaxy Books, Xiaomi notebooks, and ASUS performance laptops.",
  },
]

function resolveDummyPresetKey(categorySlug: string) {
  if (categorySlug in DUMMY_BRAND_PRESETS) {
    return categorySlug
  }

  if (
    categorySlug.includes("phone") ||
    categorySlug.includes("mobile") ||
    categorySlug.includes("smartphone")
  ) {
    return "phones"
  }

  if (categorySlug.includes("tablet") || categorySlug.includes("ipad")) {
    return "tablets"
  }

  if (
    categorySlug.includes("laptop") ||
    categorySlug.includes("notebook") ||
    categorySlug.includes("computer") ||
    categorySlug.includes("macbook")
  ) {
    return "laptops"
  }

  if (
    categorySlug.includes("watch") ||
    categorySlug.includes("wearable") ||
    categorySlug.includes("smart-band")
  ) {
    return "wearables"
  }

  return categorySlug
}

function buildDummyBrands(categorySlug: string): StorefrontNavBrand[] {
  const dummyBrands = DUMMY_BRAND_PRESETS[
    resolveDummyPresetKey(categorySlug)
  ] ?? [
    {
      name: "Featured Brand",
      slug: null,
      products: ["Premium Edition", "Essential Series", "Travel Model"],
    },
    {
      name: "Top Picks",
      slug: null,
      products: ["Performance Line", "Studio Variant", "Everyday Bundle"],
    },
    {
      name: "New Arrivals",
      slug: null,
      products: ["Launch Collection", "Limited Release", "Creator Setup"],
    },
  ]

  return dummyBrands.map((brand, brandIndex) => ({
    id: `dummy-${categorySlug}-${brand.slug ?? brandIndex}`,
    name: brand.name,
    slug: brand.slug,
    href: brand.slug
      ? `/products?category=${categorySlug}&brand=${brand.slug}`
      : `/products?category=${categorySlug}`,
    isDummy: true,
    products: brand.products.map((productName, productIndex) => ({
      id: `dummy-${categorySlug}-${brandIndex}-${productIndex}`,
      name: productName,
      href: brand.slug
        ? `/products?category=${categorySlug}&brand=${brand.slug}`
        : `/products?category=${categorySlug}`,
      isDummy: true,
    })),
  }))
}

function mergeBrandProducts(
  existingProducts: StorefrontNavProductLink[],
  incomingProducts: StorefrontNavProductLink[],
) {
  const merged = [...existingProducts]
  const seen = new Set(existingProducts.map((product) => product.name))

  for (const product of incomingProducts) {
    if (seen.has(product.name)) {
      continue
    }

    merged.push(product)
    seen.add(product.name)
  }

  return merged
}

function buildSyntheticCategory(
  category: (typeof SYNTHETIC_CATEGORY_PRESETS)[number],
): StorefrontNavCategory {
  const brands = buildDummyBrands(category.slug).slice(0, 4)

  return {
    id: `synthetic-${category.slug}`,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: null,
    productCount: brands.reduce(
      (total, brand) => total + brand.products.length,
      0,
    ),
    brands,
  }
}

export const getStorefrontNavigationData = unstable_cache(
  async (): Promise<StorefrontNavigationData> => {
    const [categoryTree, activeBrands] = await Promise.all([
      getActiveCategories(),
      getActiveBrands({ failSoft: true }),
    ])

    const topLevelCategories = categoryTree.filter(
      (category) => !category.parentId,
    )

    if (topLevelCategories.length === 0) {
      return {
        productCategories: [],
        brands: activeBrands.map((brand) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          productCount: brand.productCount,
        })),
      }
    }

    const descendantToTopLevel = new Map<string, string>()

    for (const category of topLevelCategories) {
      collectDescendantIds(
        category as CategoryNode,
        category.id,
        descendantToTopLevel,
      )
    }

    const assignedCategoryIds = Array.from(descendantToTopLevel.keys())

    const productRows = await withStorefrontCatalogFallback(
      "storefront:navigation:products",
      [] as Array<{
        assignedCategoryId: string
        id: string
        name: string
        slug: string
        createdAt: Date
        isFeatured: boolean
        brandId: string | null
        brandName: string | null
        brandSlug: string | null
        brandSortOrder: number | null
      }>,
      async () => {
        if (assignedCategoryIds.length === 0) {
          return []
        }

        return db
          .select({
            assignedCategoryId: productCategoryAssignments.categoryId,
            id: products.id,
            name: products.name,
            slug: products.slug,
            createdAt: products.createdAt,
            isFeatured: products.isFeatured,
            brandId: brands.id,
            brandName: brands.name,
            brandSlug: brands.slug,
            brandSortOrder: brands.sortOrder,
          })
          .from(productCategoryAssignments)
          .innerJoin(
            products,
            eq(productCategoryAssignments.productId, products.id),
          )
          .leftJoin(brands, eq(products.brandId, brands.id))
          .where(
            and(
              eq(products.status, "active"),
              inArray(
                productCategoryAssignments.categoryId,
                assignedCategoryIds,
              ),
            ),
          )
          .orderBy(
            desc(products.isFeatured),
            asc(brands.sortOrder),
            asc(brands.name),
            desc(products.createdAt),
            asc(products.name),
          )
      },
    )

    const productsByTopLevelCategory = new Map<
      string,
      Map<string, NavigationProduct>
    >()

    for (const row of productRows) {
      const topLevelCategoryId = descendantToTopLevel.get(
        row.assignedCategoryId,
      )

      if (!topLevelCategoryId) {
        continue
      }

      if (!productsByTopLevelCategory.has(topLevelCategoryId)) {
        productsByTopLevelCategory.set(topLevelCategoryId, new Map())
      }

      const categoryProducts =
        productsByTopLevelCategory.get(topLevelCategoryId)

      if (!categoryProducts || categoryProducts.has(row.id)) {
        continue
      }

      categoryProducts.set(row.id, {
        id: row.id,
        name: row.name,
        slug: row.slug,
        createdAt: row.createdAt,
        isFeatured: row.isFeatured,
        brand:
          row.brandId &&
          row.brandName &&
          row.brandSlug &&
          row.brandSortOrder !== null
            ? {
                id: row.brandId,
                name: row.brandName,
                slug: row.brandSlug,
                sortOrder: row.brandSortOrder,
              }
            : null,
      })
    }

    const productCategories = topLevelCategories.map((category) => {
      const categoryProducts = Array.from(
        productsByTopLevelCategory.get(category.id)?.values() ?? [],
      )
        .sort(compareProducts)
        .slice(0, 12)

      const navigationCategory: StorefrontNavCategory = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        productCount: category.productCount,
        brands: [],
      }

      const brandMap = new Map<string, StorefrontNavBrand>()

      for (const product of categoryProducts) {
        const brandId = product.brand?.id ?? "featured"

        if (!brandMap.has(brandId)) {
          brandMap.set(brandId, {
            id: brandId,
            name: product.brand?.name ?? "Featured",
            slug: product.brand?.slug ?? null,
            href: product.brand?.slug
              ? `/products?category=${category.slug}&brand=${product.brand.slug}`
              : `/products?category=${category.slug}`,
            products: [],
          })
        }

        brandMap.get(brandId)?.products.push({
          id: product.id,
          name: product.name,
          href: `/products/${product.slug}`,
        })
      }

      navigationCategory.brands = Array.from(brandMap.values())
        .map((brand) => ({
          ...brand,
          products: brand.products.slice(0, 6),
        }))
        .slice(0, 4)

      const dummyBrands = buildDummyBrands(category.slug)

      for (const dummyBrand of dummyBrands) {
        const existingBrandIndex = navigationCategory.brands.findIndex(
          (brand) => brand.name === dummyBrand.name,
        )

        if (existingBrandIndex >= 0) {
          const existingBrand = navigationCategory.brands[existingBrandIndex]

          navigationCategory.brands[existingBrandIndex] = {
            ...existingBrand,
            products: mergeBrandProducts(
              existingBrand.products,
              dummyBrand.products,
            ).slice(0, 6),
          }

          continue
        }

        if (navigationCategory.brands.length < 4) {
          navigationCategory.brands.push(dummyBrand)
        }
      }

      return navigationCategory
    })

    for (const syntheticCategory of SYNTHETIC_CATEGORY_PRESETS) {
      const exists = productCategories.some(
        (category) => category.slug === syntheticCategory.slug,
      )

      if (!exists) {
        productCategories.push(buildSyntheticCategory(syntheticCategory))
      }
    }

    return {
      productCategories,
      brands: activeBrands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        productCount: brand.productCount,
      })),
    }
  },
  ["storefront-navigation"],
  {
    revalidate: 3600,
    tags: ["categories", "brands", "products"],
  },
)

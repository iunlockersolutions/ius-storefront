import { routes } from "@/configs/routes"

import { getStorefrontProductsHref } from "./header-utils"
import { CatalogCategory, HeaderLink } from "./types"

const iphoneHref = getStorefrontProductsHref({ category: "iphone" })
const macHref = getStorefrontProductsHref({ category: "mac" })
const ipadHref = getStorefrontProductsHref({ category: "ipad" })
const watchHref = getStorefrontProductsHref({ category: "watch" })
const airpodsHref = getStorefrontProductsHref({ category: "airpods" })
const tvHomeHref = getStorefrontProductsHref({ category: "tv-home" })
const accessoriesHref = getStorefrontProductsHref({ category: "accessories" })

export const searchQuickLinks: HeaderLink[] = [
  {
    id: "all-products",
    label: "Shop All Products",
    href: routes.storefront.prodcuts.root,
  },
  {
    id: "deals",
    label: "Deals & Offers",
    href: routes.storefront.deals.root,
  },
  {
    id: "iphone",
    label: "iPhone",
    href: `${routes.storefront.prodcuts.root}?category=iphone`,
  },
  {
    id: "mac",
    label: "Mac",
    href: `${routes.storefront.prodcuts.root}?category=mac`,
  },
  {
    id: "ipad",
    label: "iPad",
    href: `${routes.storefront.prodcuts.root}?category=ipad`,
  },
  {
    id: "refurbished",
    label: "Refurbished",
    href: `${routes.storefront.prodcuts.root}?condition=refurbished`,
  },
]

export const dealStripMessages: HeaderLink[] = [
  {
    id: "shipping",
    label: "Free shipping on orders over $50",
    href: routes.storefront.root,
  },
  {
    id: "financing",
    label: "0% financing available at checkout",
    href: routes.storefront.deals.root,
  },
  {
    id: "returns",
    label: "30-day returns, no questions asked",
    href: routes.storefront.root,
  },
  {
    id: "trade-in",
    label: "Trade in your old device for credit",
    href: routes.storefront.prodcuts.root,
  },
]

const commonShopLinks = (categoryHref: string, label: string) => [
  { label: `Shop ${label}`, href: categoryHref },
  { label: "Deals & Offers", href: routes.storefront.deals.root },
  { label: "Refurbished", href: `${categoryHref}&condition=refurbished` },
  { label: "Bulk Orders", href: routes.storefront.prodcuts.root },
]

const commonMoreLinks = [
  { label: "Extended Warranty", href: routes.storefront.prodcuts.root },
  { label: "Trade-In & Sell", href: routes.storefront.prodcuts.root },
  { label: "0% Financing", href: routes.storefront.prodcuts.root },
  { label: "Free Setup & Delivery", href: routes.storefront.prodcuts.root },
  { label: "Ask an Expert", href: routes.storefront.root },
]

export const appleCatalog: CatalogCategory[] = [
  {
    id: "iphone",
    label: "iPhone",
    exploreAllHref: iphoneHref,
    models: [
      {
        name: "iPhone 17 Pro Max",
        href: `${iphoneHref}&model=iphone-17-pro-max`,
        priceFrom: 420000,
        gradient: "from-stone-600 to-stone-900",
        featured: true,
      },
      {
        name: "iPhone 17 Pro",
        href: `${iphoneHref}&model=iphone-17-pro`,
        priceFrom: 360000,
        gradient: "from-stone-500 to-stone-800",
        featured: true,
      },
      {
        name: "iPhone 17 Air",
        href: `${iphoneHref}&model=iphone-17-air`,
        priceFrom: 300000,
        gradient: "from-sky-300 to-cyan-500",
        featured: true,
      },
      {
        name: "iPhone 17",
        href: `${iphoneHref}&model=iphone-17`,
        priceFrom: 270000,
        gradient: "from-blue-400 to-indigo-600",
        featured: true,
      },
      {
        name: "iPhone 16 Pro",
        href: `${iphoneHref}&model=iphone-16-pro`,
        priceFrom: 300000,
        gradient: "from-zinc-600 to-zinc-900",
      },
      {
        name: "iPhone 16",
        href: `${iphoneHref}&model=iphone-16`,
        priceFrom: 240000,
        gradient: "from-pink-400 to-rose-500",
      },
      {
        name: "iPhone 15",
        href: `${iphoneHref}&model=iphone-15`,
        priceFrom: 180000,
        gradient: "from-violet-400 to-purple-600",
      },
    ],
    shopLinks: [
      ...commonShopLinks(iphoneHref, "iPhone"),
      { label: "Mobile Plans", href: routes.storefront.deals.root },
    ],
    moreLinks: [
      ...commonMoreLinks,
      { label: "Compare iPhone", href: iphoneHref },
      { label: "Compare Phones", href: iphoneHref },
    ],
  },
  {
    id: "mac",
    label: "Mac",
    exploreAllHref: macHref,
    models: [
      {
        name: "MacBook Pro",
        href: `${macHref}&model=macbook-pro`,
        priceFrom: 480000,
        gradient: "from-slate-700 to-slate-900",
        featured: true,
      },
      {
        name: "MacBook Air",
        href: `${macHref}&model=macbook-air`,
        priceFrom: 330000,
        gradient: "from-sky-400 to-blue-600",
        featured: true,
      },
      {
        name: "iMac",
        href: `${macHref}&model=imac`,
        priceFrom: 390000,
        gradient: "from-pink-400 to-rose-500",
        featured: true,
      },
      {
        name: "Mac mini",
        href: `${macHref}&model=mac-mini`,
        priceFrom: 180000,
        gradient: "from-zinc-400 to-zinc-600",
        featured: true,
      },
      {
        name: "Mac Studio",
        href: `${macHref}&model=mac-studio`,
        priceFrom: 600000,
        gradient: "from-gray-500 to-gray-700",
      },
      {
        name: "Mac Pro",
        href: `${macHref}&model=mac-pro`,
        priceFrom: 2100000,
        gradient: "from-neutral-700 to-neutral-900",
      },
    ],
    shopLinks: commonShopLinks(macHref, "Mac"),
    moreLinks: [
      ...commonMoreLinks,
      { label: "Compare Mac", href: macHref },
      { label: "Mac Reviews", href: macHref },
    ],
  },
  {
    id: "ipad",
    label: "iPad",
    exploreAllHref: ipadHref,
    models: [
      {
        name: "iPad Pro",
        href: `${ipadHref}&model=ipad-pro`,
        priceFrom: 300000,
        gradient: "from-slate-600 to-slate-800",
        featured: true,
      },
      {
        name: "iPad Air",
        href: `${ipadHref}&model=ipad-air`,
        priceFrom: 180000,
        gradient: "from-purple-400 to-indigo-600",
        featured: true,
      },
      {
        name: "iPad",
        href: `${ipadHref}&model=ipad`,
        priceFrom: 105000,
        gradient: "from-amber-400 to-orange-500",
        featured: true,
      },
      {
        name: "iPad mini",
        href: `${ipadHref}&model=ipad-mini`,
        priceFrom: 150000,
        gradient: "from-cyan-400 to-blue-500",
        featured: true,
      },
    ],
    shopLinks: [
      ...commonShopLinks(ipadHref, "iPad"),
      { label: "Apple Pencil", href: accessoriesHref },
    ],
    moreLinks: [
      ...commonMoreLinks,
      { label: "Compare iPad", href: ipadHref },
      { label: "iPad Reviews", href: ipadHref },
    ],
  },
  {
    id: "watch",
    label: "Watch",
    exploreAllHref: watchHref,
    models: [
      {
        name: "Apple Watch Ultra 2",
        href: `${watchHref}&model=watch-ultra-2`,
        priceFrom: 240000,
        gradient: "from-orange-500 to-amber-600",
        featured: true,
      },
      {
        name: "Apple Watch Series 10",
        href: `${watchHref}&model=watch-series-10`,
        priceFrom: 120000,
        gradient: "from-slate-400 to-slate-600",
        featured: true,
      },
      {
        name: "Apple Watch SE",
        href: `${watchHref}&model=watch-se`,
        priceFrom: 75000,
        gradient: "from-emerald-400 to-green-600",
        featured: true,
      },
    ],
    shopLinks: [
      ...commonShopLinks(watchHref, "Apple Watch"),
      { label: "Watch Bands", href: accessoriesHref },
    ],
    moreLinks: [
      ...commonMoreLinks,
      { label: "Compare Watches", href: watchHref },
    ],
  },
  {
    id: "airpods",
    label: "AirPods",
    exploreAllHref: airpodsHref,
    models: [
      {
        name: "AirPods Pro 2",
        href: `${airpodsHref}&model=airpods-pro-2`,
        priceFrom: 75000,
        gradient: "from-neutral-300 to-neutral-500",
        featured: true,
      },
      {
        name: "AirPods 4",
        href: `${airpodsHref}&model=airpods-4`,
        priceFrom: 39000,
        gradient: "from-zinc-200 to-zinc-400",
        featured: true,
      },
      {
        name: "AirPods Max",
        href: `${airpodsHref}&model=airpods-max`,
        priceFrom: 165000,
        gradient: "from-purple-300 to-fuchsia-500",
        featured: true,
      },
    ],
    shopLinks: commonShopLinks(airpodsHref, "AirPods"),
    moreLinks: [
      ...commonMoreLinks,
      { label: "Compare AirPods", href: airpodsHref },
    ],
  },
  {
    id: "tv-home",
    label: "TV & Home",
    exploreAllHref: tvHomeHref,
    models: [
      {
        name: "Apple TV 4K",
        href: `${tvHomeHref}&model=apple-tv-4k`,
        priceFrom: 39000,
        gradient: "from-gray-700 to-gray-900",
        featured: true,
      },
      {
        name: "HomePod",
        href: `${tvHomeHref}&model=homepod`,
        priceFrom: 90000,
        gradient: "from-indigo-400 to-violet-600",
        featured: true,
      },
      {
        name: "HomePod mini",
        href: `${tvHomeHref}&model=homepod-mini`,
        priceFrom: 30000,
        gradient: "from-teal-400 to-cyan-600",
        featured: true,
      },
    ],
    shopLinks: commonShopLinks(tvHomeHref, "TV & Home"),
    moreLinks: commonMoreLinks,
  },
  {
    id: "accessories",
    label: "Accessories",
    exploreAllHref: accessoriesHref,
    models: [
      {
        name: "Mac Accessories",
        href: `${accessoriesHref}&for=mac`,
        tagline: "Keyboards, mice, trackpads.",
        gradient: "from-slate-400 to-slate-600",
        featured: true,
      },
      {
        name: "iPad Accessories",
        href: `${accessoriesHref}&for=ipad`,
        tagline: "Pencils, keyboards, cases.",
        gradient: "from-purple-400 to-indigo-600",
        featured: true,
      },
      {
        name: "iPhone Accessories",
        href: `${accessoriesHref}&for=iphone`,
        tagline: "Cases, MagSafe, chargers.",
        gradient: "from-sky-400 to-blue-600",
        featured: true,
      },
      {
        name: "Watch Accessories",
        href: `${accessoriesHref}&for=watch`,
        tagline: "Bands, chargers, protection.",
        gradient: "from-orange-400 to-red-500",
        featured: true,
      },
    ],
    shopLinks: [
      { label: "Shop All Accessories", href: accessoriesHref },
      { label: "Deals & Offers", href: routes.storefront.deals.root },
      { label: "AirTag", href: accessoriesHref },
      { label: "Cables & Chargers", href: accessoriesHref },
      { label: "Cases & Protection", href: accessoriesHref },
    ],
    moreLinks: [
      { label: "Extended Warranty", href: routes.storefront.prodcuts.root },
      { label: "Free Setup & Delivery", href: routes.storefront.prodcuts.root },
      { label: "Bulk Orders", href: routes.storefront.prodcuts.root },
      { label: "Ask an Expert", href: routes.storefront.root },
    ],
  },
  {
    id: "support",
    label: "Support",
    exploreAllHref: routes.storefront.prodcuts.root,
    models: [
      {
        name: "Ask an Expert",
        href: routes.storefront.root,
        tagline: "Chat, call, or book a consult.",
        gradient: "from-indigo-500 to-blue-600",
        featured: true,
      },
      {
        name: "Order Status",
        href: routes.storefront.orders.root,
        tagline: "Track a recent order.",
        gradient: "from-emerald-500 to-teal-600",
        featured: true,
      },
      {
        name: "Returns & Exchanges",
        href: routes.storefront.root,
        tagline: "30 days, hassle-free.",
        gradient: "from-amber-500 to-orange-500",
        featured: true,
      },
    ],
    shopLinks: [
      { label: "Ask an Expert", href: routes.storefront.root },
      { label: "Order Status", href: routes.storefront.orders.root },
      { label: "Shipping & Returns", href: routes.storefront.root },
      { label: "Store Locator", href: routes.storefront.root },
      { label: "Contact Us", href: routes.storefront.root },
    ],
    moreLinks: [
      { label: "Extended Warranty", href: routes.storefront.prodcuts.root },
      { label: "Price Match", href: routes.storefront.root },
      { label: "Product Reviews", href: routes.storefront.prodcuts.root },
      { label: "Community", href: routes.storefront.root },
    ],
  },
]

export function getAppleCategoryById(id: string): CatalogCategory | undefined {
  return appleCatalog.find((c) => c.id === id)
}

export function formatPriceFrom(value: number | undefined): string | null {
  if (!value) return null
  return `LKR ${value.toLocaleString("en-US")}`
}

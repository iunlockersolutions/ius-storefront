import { routes } from "@/configs/routes"

import { getStorefrontProductsHref } from "./header-utils"

export type AppleCatalogModel = {
  name: string
  href: string
  priceFrom?: number
  gradient?: string
  tagline?: string
}

export type AppleCatalogCategory = {
  id: string
  label: string
  exploreAllHref: string
  models: AppleCatalogModel[]
  shopLinks: { label: string; href: string }[]
  moreLinks: { label: string; href: string }[]
}

const iphoneHref = getStorefrontProductsHref({ category: "iphone" })
const macHref = getStorefrontProductsHref({ category: "mac" })
const ipadHref = getStorefrontProductsHref({ category: "ipad" })
const watchHref = getStorefrontProductsHref({ category: "watch" })
const airpodsHref = getStorefrontProductsHref({ category: "airpods" })
const tvHomeHref = getStorefrontProductsHref({ category: "tv-home" })
const accessoriesHref = getStorefrontProductsHref({ category: "accessories" })

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

export const appleCatalog: AppleCatalogCategory[] = [
  {
    id: "store",
    label: "Store",
    exploreAllHref: routes.storefront.prodcuts.root,
    models: [
      {
        name: "Shop the Latest",
        href: routes.storefront.prodcuts.root,
        tagline: "Newest arrivals across every lineup.",
        gradient: "from-indigo-500 to-purple-500",
      },
      {
        name: "Refurbished",
        href: `${routes.storefront.prodcuts.root}?condition=refurbished`,
        tagline: "Certified pre-owned with warranty.",
        gradient: "from-emerald-500 to-teal-500",
      },
      {
        name: "Gift Cards",
        href: routes.storefront.prodcuts.root,
        tagline: "The gift that always fits.",
        gradient: "from-rose-500 to-pink-500",
      },
    ],
    shopLinks: [
      { label: "Shop All Products", href: routes.storefront.prodcuts.root },
      { label: "Deals & Offers", href: routes.storefront.deals.root },
      { label: "Categories", href: routes.storefront.categories.root },
      { label: "Brands", href: routes.storefront.brands.root },
      { label: "New Arrivals", href: routes.storefront.prodcuts.root },
    ],
    moreLinks: [
      { label: "Store Locator", href: routes.storefront.root },
      { label: "Order Status", href: routes.storefront.orders.root },
      { label: "Shipping & Returns", href: routes.storefront.root },
      { label: "Price Match", href: routes.storefront.root },
      { label: "Gift Cards", href: routes.storefront.prodcuts.root },
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
        priceFrom: 1599,
        tagline: "Supercharged by M4 Pro & Max.",
        gradient: "from-slate-700 to-slate-900",
      },
      {
        name: "MacBook Air",
        href: `${macHref}&model=macbook-air`,
        priceFrom: 1099,
        tagline: "Strikingly thin. Seriously powerful.",
        gradient: "from-sky-400 to-blue-600",
      },
      {
        name: "iMac",
        href: `${macHref}&model=imac`,
        priceFrom: 1299,
        tagline: "Inspiration, in 24 inches.",
        gradient: "from-pink-400 to-rose-500",
      },
      {
        name: "Mac mini",
        href: `${macHref}&model=mac-mini`,
        priceFrom: 599,
        tagline: "Desktop power. Pint-sized.",
        gradient: "from-zinc-400 to-zinc-600",
      },
      {
        name: "Mac Studio",
        href: `${macHref}&model=mac-studio`,
        priceFrom: 1999,
        tagline: "Studio-grade performance.",
        gradient: "from-gray-500 to-gray-700",
      },
      {
        name: "Mac Pro",
        href: `${macHref}&model=mac-pro`,
        priceFrom: 6999,
        tagline: "The ultimate pro workstation.",
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
        priceFrom: 999,
        tagline: "Unbelievably thin. Incredibly powerful.",
        gradient: "from-slate-600 to-slate-800",
      },
      {
        name: "iPad Air",
        href: `${ipadHref}&model=ipad-air`,
        priceFrom: 599,
        tagline: "Light. Bright. Full of might.",
        gradient: "from-purple-400 to-indigo-600",
      },
      {
        name: "iPad",
        href: `${ipadHref}&model=ipad`,
        priceFrom: 349,
        tagline: "Colorfully capable.",
        gradient: "from-amber-400 to-orange-500",
      },
      {
        name: "iPad mini",
        href: `${ipadHref}&model=ipad-mini`,
        priceFrom: 499,
        tagline: "Mega power. Mini sized.",
        gradient: "from-cyan-400 to-blue-500",
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
    id: "iphone",
    label: "iPhone",
    exploreAllHref: iphoneHref,
    models: [
      {
        name: "iPhone 17 Pro",
        href: `${iphoneHref}&model=iphone-17-pro`,
        priceFrom: 1199,
        tagline: "Titanium. Thinnest borders ever.",
        gradient: "from-stone-500 to-stone-800",
      },
      {
        name: "iPhone 17",
        href: `${iphoneHref}&model=iphone-17`,
        priceFrom: 899,
        tagline: "Brilliant display. Powerful chip.",
        gradient: "from-blue-400 to-indigo-600",
      },
      {
        name: "iPhone Air",
        href: `${iphoneHref}&model=iphone-air`,
        priceFrom: 999,
        tagline: "Impossibly thin. Remarkably capable.",
        gradient: "from-sky-300 to-cyan-500",
      },
      {
        name: "iPhone 16 Pro",
        href: `${iphoneHref}&model=iphone-16-pro`,
        priceFrom: 999,
        tagline: "Built for Apple Intelligence.",
        gradient: "from-zinc-600 to-zinc-900",
      },
      {
        name: "iPhone 16",
        href: `${iphoneHref}&model=iphone-16`,
        priceFrom: 799,
        tagline: "Hello, Apple Intelligence.",
        gradient: "from-pink-400 to-rose-500",
      },
      {
        name: "iPhone 15",
        href: `${iphoneHref}&model=iphone-15`,
        priceFrom: 599,
        tagline: "Dynamic. Bright. Capable.",
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
    id: "watch",
    label: "Watch",
    exploreAllHref: watchHref,
    models: [
      {
        name: "Apple Watch Ultra 2",
        href: `${watchHref}&model=watch-ultra-2`,
        priceFrom: 799,
        tagline: "Adventure awaits.",
        gradient: "from-orange-500 to-amber-600",
      },
      {
        name: "Apple Watch Series 10",
        href: `${watchHref}&model=watch-series-10`,
        priceFrom: 399,
        tagline: "Thinstant classic.",
        gradient: "from-slate-400 to-slate-600",
      },
      {
        name: "Apple Watch SE",
        href: `${watchHref}&model=watch-se`,
        priceFrom: 249,
        tagline: "A great deal to love.",
        gradient: "from-emerald-400 to-green-600",
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
        priceFrom: 249,
        tagline: "Adaptive Audio. Now playing.",
        gradient: "from-neutral-300 to-neutral-500",
      },
      {
        name: "AirPods 4",
        href: `${airpodsHref}&model=airpods-4`,
        priceFrom: 129,
        tagline: "Iconic. Now supersonic.",
        gradient: "from-zinc-200 to-zinc-400",
      },
      {
        name: "AirPods Max",
        href: `${airpodsHref}&model=airpods-max`,
        priceFrom: 549,
        tagline: "A symphony of sound.",
        gradient: "from-purple-300 to-fuchsia-500",
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
        priceFrom: 129,
        tagline: "Cinematic at home.",
        gradient: "from-gray-700 to-gray-900",
      },
      {
        name: "HomePod",
        href: `${tvHomeHref}&model=homepod`,
        priceFrom: 299,
        tagline: "Profound sound.",
        gradient: "from-indigo-400 to-violet-600",
      },
      {
        name: "HomePod mini",
        href: `${tvHomeHref}&model=homepod-mini`,
        priceFrom: 99,
        tagline: "Mini in size. Mighty in sound.",
        gradient: "from-teal-400 to-cyan-600",
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
      },
      {
        name: "iPad Accessories",
        href: `${accessoriesHref}&for=ipad`,
        tagline: "Pencils, keyboards, cases.",
        gradient: "from-purple-400 to-indigo-600",
      },
      {
        name: "iPhone Accessories",
        href: `${accessoriesHref}&for=iphone`,
        tagline: "Cases, MagSafe, chargers.",
        gradient: "from-sky-400 to-blue-600",
      },
      {
        name: "Watch Accessories",
        href: `${accessoriesHref}&for=watch`,
        tagline: "Bands, chargers, protection.",
        gradient: "from-orange-400 to-red-500",
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
      },
      {
        name: "Order Status",
        href: routes.storefront.orders.root,
        tagline: "Track a recent order.",
        gradient: "from-emerald-500 to-teal-600",
      },
      {
        name: "Returns & Exchanges",
        href: routes.storefront.root,
        tagline: "30 days, hassle-free.",
        gradient: "from-amber-500 to-orange-500",
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

export function getAppleCategoryById(
  id: string,
): AppleCatalogCategory | undefined {
  return appleCatalog.find((c) => c.id === id)
}

export function formatPriceFrom(cents: number | undefined): string | null {
  if (!cents) return null
  return `From $${cents.toLocaleString()}`
}

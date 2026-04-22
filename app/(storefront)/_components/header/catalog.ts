import { routes } from "@/configs/routes"

import { getStorefrontProductsHref } from "./header-utils"

export type AppleCatalogModel = {
  name: string
  href: string
  image?: string
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

export const appleCatalog: AppleCatalogCategory[] = [
  {
    id: "store",
    label: "Store",
    exploreAllHref: routes.storefront.prodcuts.root,
    models: [
      {
        name: "Shop the Latest",
        href: routes.storefront.prodcuts.root,
        tagline: "Newest arrivals across every Apple lineup.",
      },
      {
        name: "Deals",
        href: routes.storefront.deals.root,
        tagline: "Limited-time offers and savings.",
      },
    ],
    shopLinks: [
      { label: "Shop the Latest", href: routes.storefront.prodcuts.root },
      { label: "Deals", href: routes.storefront.deals.root },
      { label: "Categories", href: routes.storefront.categories.root },
      { label: "Brands", href: routes.storefront.brands.root },
    ],
    moreLinks: [
      { label: "Find a Store", href: routes.storefront.root },
      { label: "Apple Trade In", href: routes.storefront.prodcuts.root },
      { label: "Financing", href: routes.storefront.prodcuts.root },
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
        tagline: "Supercharged by M4 Pro and M4 Max.",
      },
      {
        name: "MacBook Air",
        href: `${macHref}&model=macbook-air`,
        tagline: "Strikingly thin. Seriously powerful.",
      },
      {
        name: "iMac",
        href: `${macHref}&model=imac`,
        tagline: "Inspiration strikes in 24 inches.",
      },
      {
        name: "Mac mini",
        href: `${macHref}&model=mac-mini`,
        tagline: "Desktop power. Pint-sized footprint.",
      },
      {
        name: "Mac Studio",
        href: `${macHref}&model=mac-studio`,
        tagline: "Studio-grade performance.",
      },
      {
        name: "Mac Pro",
        href: `${macHref}&model=mac-pro`,
        tagline: "Ultimate pro workstation.",
      },
    ],
    shopLinks: [
      { label: "Shop Mac", href: macHref },
      { label: "Mac Accessories", href: accessoriesHref },
      { label: "Apple Trade In", href: routes.storefront.prodcuts.root },
      { label: "Financing", href: routes.storefront.prodcuts.root },
    ],
    moreLinks: [
      { label: "Mac Support", href: routes.storefront.prodcuts.root },
      { label: "AppleCare+ for Mac", href: routes.storefront.prodcuts.root },
      { label: "macOS Sequoia", href: routes.storefront.prodcuts.root },
      { label: "Compare Mac", href: macHref },
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
        tagline: "Unbelievably thin. Incredibly powerful.",
      },
      {
        name: "iPad Air",
        href: `${ipadHref}&model=ipad-air`,
        tagline: "Light. Bright. Full of might.",
      },
      {
        name: "iPad",
        href: `${ipadHref}&model=ipad`,
        tagline: "Colorfully capable.",
      },
      {
        name: "iPad mini",
        href: `${ipadHref}&model=ipad-mini`,
        tagline: "Mega power. Mini sized.",
      },
    ],
    shopLinks: [
      { label: "Shop iPad", href: ipadHref },
      { label: "iPad Accessories", href: accessoriesHref },
      { label: "Apple Pencil", href: accessoriesHref },
      { label: "Apple Trade In", href: routes.storefront.prodcuts.root },
    ],
    moreLinks: [
      { label: "iPad Support", href: routes.storefront.prodcuts.root },
      { label: "AppleCare+ for iPad", href: routes.storefront.prodcuts.root },
      { label: "iPadOS 18", href: routes.storefront.prodcuts.root },
      { label: "Compare iPad", href: ipadHref },
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
        tagline: "Titanium. The thinnest borders ever.",
      },
      {
        name: "iPhone 17",
        href: `${iphoneHref}&model=iphone-17`,
        tagline: "Brilliant display. Powerful chip.",
      },
      {
        name: "iPhone Air",
        href: `${iphoneHref}&model=iphone-air`,
        tagline: "Impossibly thin. Remarkably capable.",
      },
      {
        name: "iPhone 16 Pro",
        href: `${iphoneHref}&model=iphone-16-pro`,
        tagline: "Built for Apple Intelligence.",
      },
      {
        name: "iPhone 16",
        href: `${iphoneHref}&model=iphone-16`,
        tagline: "Hello, Apple Intelligence.",
      },
      {
        name: "iPhone 15",
        href: `${iphoneHref}&model=iphone-15`,
        tagline: "Dynamic. Bright. Impressively capable.",
      },
    ],
    shopLinks: [
      { label: "Shop iPhone", href: iphoneHref },
      { label: "iPhone Accessories", href: accessoriesHref },
      { label: "Apple Trade In", href: routes.storefront.prodcuts.root },
      { label: "Carrier Deals", href: routes.storefront.deals.root },
      { label: "Financing", href: routes.storefront.prodcuts.root },
    ],
    moreLinks: [
      { label: "iPhone Support", href: routes.storefront.prodcuts.root },
      { label: "AppleCare+ for iPhone", href: routes.storefront.prodcuts.root },
      { label: "iOS 18", href: routes.storefront.prodcuts.root },
      { label: "Apple Intelligence", href: routes.storefront.prodcuts.root },
      { label: "Compare iPhone", href: iphoneHref },
      { label: "Switch from Android", href: routes.storefront.prodcuts.root },
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
        tagline: "Adventure awaits.",
      },
      {
        name: "Apple Watch Series 10",
        href: `${watchHref}&model=watch-series-10`,
        tagline: "Thinstant classic.",
      },
      {
        name: "Apple Watch SE",
        href: `${watchHref}&model=watch-se`,
        tagline: "A great deal to love.",
      },
    ],
    shopLinks: [
      { label: "Shop Apple Watch", href: watchHref },
      { label: "Watch Bands", href: accessoriesHref },
      { label: "Apple Trade In", href: routes.storefront.prodcuts.root },
    ],
    moreLinks: [
      { label: "Watch Support", href: routes.storefront.prodcuts.root },
      { label: "AppleCare+", href: routes.storefront.prodcuts.root },
      { label: "watchOS 11", href: routes.storefront.prodcuts.root },
      { label: "Compare Watch", href: watchHref },
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
        tagline: "Adaptive Audio. Now playing.",
      },
      {
        name: "AirPods 4",
        href: `${airpodsHref}&model=airpods-4`,
        tagline: "Iconic. Now supersonic.",
      },
      {
        name: "AirPods Max",
        href: `${airpodsHref}&model=airpods-max`,
        tagline: "A symphony of sound.",
      },
    ],
    shopLinks: [
      { label: "Shop AirPods", href: airpodsHref },
      { label: "AirPods Accessories", href: accessoriesHref },
      { label: "Compare AirPods", href: airpodsHref },
    ],
    moreLinks: [
      { label: "AirPods Support", href: routes.storefront.prodcuts.root },
      { label: "AppleCare+", href: routes.storefront.prodcuts.root },
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
        tagline: "The Apple experience. Cinematic.",
      },
      {
        name: "HomePod",
        href: `${tvHomeHref}&model=homepod`,
        tagline: "Profound sound.",
      },
      {
        name: "HomePod mini",
        href: `${tvHomeHref}&model=homepod-mini`,
        tagline: "Mini in size. Mighty in sound.",
      },
    ],
    shopLinks: [
      { label: "Shop TV & Home", href: tvHomeHref },
      { label: "Shop Apple TV 4K", href: `${tvHomeHref}&model=apple-tv-4k` },
      { label: "Shop HomePod", href: `${tvHomeHref}&model=homepod` },
    ],
    moreLinks: [
      { label: "TV & Home Support", href: routes.storefront.prodcuts.root },
      { label: "Apple TV+", href: routes.storefront.prodcuts.root },
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    exploreAllHref: accessoriesHref,
    models: [
      {
        name: "Mac Accessories",
        href: `${accessoriesHref}&for=mac`,
        tagline: "Keyboards, mice, trackpads and more.",
      },
      {
        name: "iPad Accessories",
        href: `${accessoriesHref}&for=ipad`,
        tagline: "Apple Pencil, Magic Keyboard, cases.",
      },
      {
        name: "iPhone Accessories",
        href: `${accessoriesHref}&for=iphone`,
        tagline: "Cases, MagSafe, chargers.",
      },
      {
        name: "Watch Accessories",
        href: `${accessoriesHref}&for=watch`,
        tagline: "Bands, chargers, protection.",
      },
    ],
    shopLinks: [
      { label: "Shop All Accessories", href: accessoriesHref },
      { label: "AirTag", href: accessoriesHref },
      { label: "AppleCare", href: routes.storefront.prodcuts.root },
    ],
    moreLinks: [
      { label: "Accessories Support", href: routes.storefront.prodcuts.root },
    ],
  },
  {
    id: "support",
    label: "Support",
    exploreAllHref: routes.storefront.prodcuts.root,
    models: [
      {
        name: "Contact Support",
        href: routes.storefront.root,
        tagline: "Get help from an expert.",
      },
      {
        name: "Order Status",
        href: routes.storefront.orders.root,
        tagline: "Track your recent order.",
      },
      {
        name: "Shipping & Returns",
        href: routes.storefront.root,
        tagline: "Policies and timelines.",
      },
    ],
    shopLinks: [
      { label: "Find a Store", href: routes.storefront.root },
      { label: "Order Status", href: routes.storefront.orders.root },
      { label: "Shipping & Returns", href: routes.storefront.root },
      { label: "Contact Support", href: routes.storefront.root },
    ],
    moreLinks: [
      { label: "AppleCare+", href: routes.storefront.prodcuts.root },
      { label: "Community", href: routes.storefront.root },
    ],
  },
  {
    id: "deals",
    label: "Deals",
    exploreAllHref: routes.storefront.deals.root,
    models: [
      {
        name: "All Deals",
        href: routes.storefront.deals.root,
        tagline: "Every current offer in one place.",
      },
      {
        name: "Trade In",
        href: routes.storefront.prodcuts.root,
        tagline: "Turn the device you have into the one you want.",
      },
    ],
    shopLinks: [
      { label: "All Deals", href: routes.storefront.deals.root },
      { label: "Shop All Products", href: routes.storefront.prodcuts.root },
    ],
    moreLinks: [
      { label: "Financing", href: routes.storefront.prodcuts.root },
      { label: "Carrier Deals", href: routes.storefront.deals.root },
    ],
  },
]

export function getAppleCategoryById(
  id: string,
): AppleCatalogCategory | undefined {
  return appleCatalog.find((c) => c.id === id)
}

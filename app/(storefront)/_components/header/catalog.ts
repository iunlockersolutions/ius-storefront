import { routes } from "@/configs/routes"

import { getStorefrontProductsHref } from "./header-utils"
import { CatalogCategory, HeaderLink } from "./types"

const iphoneHref = getStorefrontProductsHref({ category: "iphone" })
const macHref = getStorefrontProductsHref({ category: "mac" })
const ipadHref = getStorefrontProductsHref({ category: "ipad" })
const watchHref = getStorefrontProductsHref({ category: "watch" })
const airpodsHref = getStorefrontProductsHref({ category: "airpods" })
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
    id: "installments",
    label: "0% Installment Plans",
    href: routes.storefront.installmentPlans.root,
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
    label: "Free islandwide delivery",
    href: routes.storefront.support.freeSetupAndDelivery,
  },
  {
    id: "financing",
    label: "0% financing available at checkout",
    href: routes.storefront.installmentPlans.root,
  },
  {
    id: "returns",
    label: "Shipping and returns support",
    href: routes.storefront.support.shippingAndReturns,
  },
  {
    id: "trade-in",
    label: "Trade in your old device for credit",
    href: routes.storefront.prodcuts.root,
  },
]

const commonShopLinks = (categoryHref: string, label: string) => [
  { label: "Deals & Offers", href: routes.storefront.deals.root },
]

const commonMoreLinks = [
  // { label: "Extended Warranty", href: routes.storefront.prodcuts.root },
  // { label: "Trade-In & Sell", href: routes.storefront.prodcuts.root },
  { label: "0% Financing", href: routes.storefront.installmentPlans.root },
  {
    label: "Free Setup & Delivery",
    href: routes.storefront.support.freeSetupAndDelivery,
  },
  { label: "Ask an Expert", href: routes.storefront.support.askAnExpert },
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
      },
      {
        name: "iPhone 17 Pro",
        href: `${iphoneHref}&model=iphone-17-pro`,
      },
      {
        name: "iPhone 17 Air",
        href: `${iphoneHref}&model=iphone-17-air`,
      },
      {
        name: "iPhone 17",
        href: `${iphoneHref}&model=iphone-17`,
      },
      {
        name: "iPhone 16 Pro",
        href: `${iphoneHref}&model=iphone-16-pro`,
      },
      {
        name: "iPhone 16",
        href: `${iphoneHref}&model=iphone-16`,
      },
      {
        name: "iPhone 15",
        href: `${iphoneHref}&model=iphone-15`,
      },
      {
        name: "iPhone 14",
        href: `${iphoneHref}&model=iphone-14`,
      },
    ],
    shopLinks: [...commonShopLinks(iphoneHref, "iPhone")],
    moreLinks: [
      ...commonMoreLinks,
      { label: "Compare iPhone", href: iphoneHref },
    ],
  },
  {
    id: "macbook",
    label: "MacBook",
    exploreAllHref: macHref,
    models: [
      {
        name: "MacBook Pro",
        href: `${macHref}&model=macbook-pro`,
      },
      {
        name: "MacBook Air",
        href: `${macHref}&model=macbook-air`,
      },
    ],
    shopLinks: commonShopLinks(macHref, "MacBook"),
    moreLinks: [
      ...commonMoreLinks,
      { label: "Compare MacBook", href: macHref },
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
      },
      {
        name: "iPad Air",
        href: `${ipadHref}&model=ipad-air`,
      },
      {
        name: "iPad",
        href: `${ipadHref}&model=ipad`,
      },
      {
        name: "iPad mini",
        href: `${ipadHref}&model=ipad-mini`,
      },
    ],
    shopLinks: [
      ...commonShopLinks(ipadHref, "iPad"),
      { label: "Apple Pencil", href: accessoriesHref },
    ],
    moreLinks: [...commonMoreLinks, { label: "Compare iPad", href: ipadHref }],
  },
  {
    id: "watch",
    label: "Watch",
    exploreAllHref: watchHref,
    models: [
      {
        name: "Apple Watch Ultra 2",
        href: `${watchHref}&model=watch-ultra-2`,
      },
      {
        name: "Apple Watch Series 10",
        href: `${watchHref}&model=watch-series-10`,
      },
      {
        name: "Apple Watch SE",
        href: `${watchHref}&model=watch-se`,
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
      },
      {
        name: "AirPods 4",
        href: `${airpodsHref}&model=airpods-4`,
      },
      {
        name: "AirPods Max",
        href: `${airpodsHref}&model=airpods-max`,
      },
    ],
    shopLinks: commonShopLinks(airpodsHref, "AirPods"),
    moreLinks: [
      ...commonMoreLinks,
      { label: "Compare AirPods", href: airpodsHref },
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    exploreAllHref: accessoriesHref,
    models: [
      {
        name: "Power Adapters",
        href: `${accessoriesHref}&for=power-adapters`,
      },
      {
        name: "Cables",
        href: `${accessoriesHref}&for=cables`,
      },
      {
        name: "Headsets",
        href: `${accessoriesHref}&for=headsets`,
      },
      {
        name: "Portable Speakers",
        href: `${accessoriesHref}&for=portable-speakers`,
      },
      {
        name: "Power Banks",
        href: `${accessoriesHref}&for=power-banks`,
      },
      {
        name: "Back Covers",
        href: `${accessoriesHref}&for=back-covers`,
      },
      {
        name: "Tempered Glass",
        href: `${accessoriesHref}&for=tempered-glass`,
      },
    ],
    shopLinks: [
      { label: "Shop All Accessories", href: accessoriesHref },
      { label: "Deals & Offers", href: routes.storefront.deals.root },
      {
        label: "0% Installment Plans",
        href: routes.storefront.installmentPlans.root,
      },
      { label: "Cables & Chargers", href: accessoriesHref },
      { label: "Cases & Protection", href: accessoriesHref },
    ],
    moreLinks: [
      {
        label: "Free Setup & Delivery",
        href: routes.storefront.support.freeSetupAndDelivery,
      },
      { label: "Ask an Expert", href: routes.storefront.support.askAnExpert },
    ],
  },
  {
    id: "support",
    label: "Support",
    exploreAllHref: routes.storefront.support.contact,
    models: [
      {
        name: "Ask an Expert",
        href: routes.storefront.support.askAnExpert,
        tagline: "Chat, call, or book a consult.",
      },
      {
        name: "Order Status",
        href: routes.storefront.orders.root,
        tagline: "Track a recent order.",
      },
    ],
    shopLinks: [
      { label: "Ask an Expert", href: routes.storefront.support.askAnExpert },
      { label: "Order Status", href: routes.storefront.orders.root },
      {
        label: "0% Installment Plans",
        href: routes.storefront.installmentPlans.root,
      },
      {
        label: "Shipping & Returns",
        href: routes.storefront.support.shippingAndReturns,
      },
      { label: "Contact Us", href: routes.storefront.support.contact },
    ],
    moreLinks: [],
  },
]

export function getAppleCategoryById(id: string): CatalogCategory | undefined {
  return appleCatalog.find((c) => c.id === id)
}

export function formatPriceFrom(value: number | undefined): string | null {
  if (!value) return null
  return `LKR ${value.toLocaleString("en-US")}`
}

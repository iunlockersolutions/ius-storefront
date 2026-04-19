import type { LucideIcon } from "lucide-react"
import {
  Grid3X3,
  Heart,
  Home,
  Package,
  ShoppingBag,
  Store,
  Tag,
  User,
} from "lucide-react"

import { type GuestAuthPromptSource } from "@/components/auth/guest-auth-prompt"
import { routes } from "@/configs/routes"

type HeaderLink = {
  href: string
  label: string
  icon?: LucideIcon
}

type MobileHeaderLink = HeaderLink & {
  icon: LucideIcon
}

type AccountLink = HeaderLink & {
  icon: LucideIcon
  source: GuestAuthPromptSource
}

export const mobileRootNavLinks: MobileHeaderLink[] = [
  { href: routes.storefront.root, label: "Home", icon: Home },
  { href: routes.storefront.prodcuts.root, label: "Products", icon: Package },
  {
    href: routes.storefront.categories.root,
    label: "Categories",
    icon: Grid3X3,
  },
  { href: routes.storefront.brands.root, label: "Brands", icon: Store },
  { href: routes.storefront.deals.root, label: "Deals", icon: Tag },
]

export const desktopTopLevelLinks: HeaderLink[] = [
  { href: routes.storefront.categories.root, label: "Categories" },
  { href: routes.storefront.brands.root, label: "Brands" },
  { href: routes.storefront.deals.root, label: "Deals" },
]

export const accountLinks: AccountLink[] = [
  {
    href: routes.storefront.orders.root,
    label: "My Orders",
    icon: ShoppingBag,
    source: "orders",
  },
  {
    href: routes.storefront.favorites.root,
    label: "Favorites",
    icon: Heart,
    source: "favorites",
  },
  {
    href: routes.storefront.profile.root,
    label: "Profile",
    icon: User,
    source: "profile",
  },
]

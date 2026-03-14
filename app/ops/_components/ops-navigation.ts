import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Boxes,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  SwatchBook,
  Tags,
  UserCog,
  Users,
} from "lucide-react"

export type OpsNavItem = {
  title: string
  href: string
  icon: LucideIcon
  match?: (pathname: string) => boolean
  items?: OpsNavItem[]
}

export type OpsNavGroup = {
  title: string
  items: OpsNavItem[]
}

type OpsNavMatch = {
  group: OpsNavGroup
  item: OpsNavItem
}

function isSameOrDescendant(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isStaffUsersPath(pathname: string) {
  return (
    pathname === "/ops/users" ||
    pathname === "/ops/users/new" ||
    (pathname.startsWith("/ops/users/") &&
      !pathname.startsWith("/ops/users/roles"))
  )
}

export const opsNavGroups: OpsNavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/ops",
        icon: LayoutDashboard,
        match: (pathname) => pathname === "/ops",
      },
      {
        title: "Reports",
        href: "/ops/reports",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Catalog",
    items: [
      {
        title: "Products",
        href: "/ops/products",
        icon: Package,
      },
      {
        title: "Brands",
        href: "/ops/brands",
        icon: Store,
      },
      {
        title: "Categories",
        href: "/ops/categories",
        icon: Tags,
      },
      {
        title: "Models",
        href: "/ops/models",
        icon: SwatchBook,
      },
      {
        title: "Product Model Groups",
        href: "/ops/product-model-groups",
        icon: SwatchBook,
      },
      {
        title: "Product Menu Configs",
        href: "/ops/product-menu-configs",
        icon: SwatchBook,
      },
      {
        title: "Catalog Setup",
        href: "/ops/catalog-setup",
        icon: Store,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        title: "Inventory",
        href: "/ops/inventory",
        icon: Boxes,
      },
      {
        title: "Orders",
        href: "/ops/orders",
        icon: ShoppingCart,
      },
      {
        title: "Payments",
        href: "/ops/payments",
        icon: CreditCard,
      },
      {
        title: "Reviews",
        href: "/ops/reviews",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Customers",
    items: [
      {
        title: "Customers",
        href: "/ops/customers",
        icon: Users,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Staff Users",
        href: "/ops/users",
        icon: UserCog,
        match: isStaffUsersPath,
      },
      {
        title: "Roles & Permissions",
        href: "/ops/users/roles",
        icon: Shield,
      },
      {
        title: "Settings",
        href: "/ops/settings",
        icon: Settings,
      },
      {
        title: "Profile",
        href: "/ops/profile",
        icon: UserCog,
      },
    ],
  },
]

function isItemActive(item: OpsNavItem, pathname: string): boolean {
  if (item.items?.some((child) => isItemActive(child, pathname))) {
    return true
  }

  if (item.match) {
    return item.match(pathname)
  }

  return isSameOrDescendant(pathname, item.href)
}

function findActiveNavItem(
  items: OpsNavItem[],
  pathname: string,
): OpsNavItem | null {
  for (const item of items) {
    if (item.items) {
      const activeChild = findActiveNavItem(item.items, pathname)
      if (activeChild) {
        return activeChild
      }
    }

    if (isItemActive(item, pathname)) {
      return item
    }
  }

  return null
}

export function isOpsNavItemActive(item: OpsNavItem, pathname: string) {
  return isItemActive(item, pathname)
}

export function findActiveOpsNavMatch(pathname: string): OpsNavMatch | null {
  for (const group of opsNavGroups) {
    const activeItem = findActiveNavItem(group.items, pathname)
    if (activeItem) {
      return {
        group,
        item: activeItem,
      }
    }
  }

  if (pathname === "/ops/change-password") {
    const group = opsNavGroups.at(-1)

    if (!group) {
      return null
    }

    return {
      group,
      item: {
        title: "Change Password",
        href: pathname,
        icon: Settings,
      },
    }
  }

  return null
}

export function getOpsPageHeading(pathname: string) {
  const match = findActiveOpsNavMatch(pathname)

  if (!match) {
    return {
      eyebrow: "Operations",
      title: "Operations",
    }
  }

  return {
    eyebrow: match.group.title,
    title: match.item.title,
  }
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

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
  Tags,
  UserCog,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Admin Sidebar Navigation
 */

const navigation = [
  {
    name: "Dashboard",
    href: "/ops",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    href: "/ops/products",
    icon: Package,
  },
  {
    name: "Brands",
    href: "/ops/brands",
    icon: Store,
  },
  {
    name: "Categories",
    href: "/ops/categories",
    icon: Tags,
  },
  {
    name: "Inventory",
    href: "/ops/inventory",
    icon: Boxes,
  },
  {
    name: "Orders",
    href: "/ops/orders",
    icon: ShoppingCart,
  },
  {
    name: "Payments",
    href: "/ops/payments",
    icon: CreditCard,
  },
  {
    name: "Customers",
    href: "/ops/customers",
    icon: Users,
  },
  {
    name: "Reviews",
    href: "/ops/reviews",
    icon: MessageSquare,
  },
  {
    name: "Reports",
    href: "/ops/reports",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/ops/settings",
    icon: Settings,
  },
]

const staffNavigation = [
  {
    name: "Staff Users",
    href: "/ops/users",
    icon: UserCog,
  },
  {
    name: "Roles & Permissions",
    href: "/ops/users/roles",
    icon: Shield,
  },
]

export function OpsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col border-r bg-white dark:bg-neutral-950">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/ops" className="flex items-center space-x-2">
          <span className="text-xl font-bold">IUS Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/ops" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}

        {/* Staff Management Section */}
        <div className="pt-4 mt-4 border-t">
          <p className="px-3 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Staff Management
          </p>
          {staffNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/ops/users" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Back to Store */}
      <div className="border-t p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Back to Store
        </Link>
      </div>
    </aside>
  )
}

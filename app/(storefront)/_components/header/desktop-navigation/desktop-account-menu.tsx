"use client"

import * as React from "react"
import Link from "next/link"

import { Heart, LogOut, type LucideIcon, Package, User } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { routes } from "@/configs/routes"

import { AccountAvatar } from "../account-avatar"
import { getCurrentStorefrontPathWithQuery } from "../header-utils"
import { type HeaderUser } from "../types"
import { useStorefrontSignOut } from "../use-storefront-sign-out"

type DesktopAccountMenuProps = {
  user?: HeaderUser
}

type AccountLink = {
  href: string
  icon: LucideIcon
  label: string
}

const accountLinks: AccountLink[] = [
  { href: routes.storefront.orders.root, icon: Package, label: "My Orders" },
  { href: routes.storefront.favorites.root, icon: Heart, label: "Favorites" },
  { href: routes.storefront.profile.root, icon: User, label: "Profile" },
]

export function DesktopAccountMenu({ user }: DesktopAccountMenuProps) {
  const [callbackUrl, setCallbackUrl] = React.useState<string | null>(null)
  const signOut = useStorefrontSignOut()

  React.useEffect(() => {
    setCallbackUrl(getCurrentStorefrontPathWithQuery())
  }, [])

  if (!user) {
    const href = callbackUrl
      ? `${routes.auth.login}?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : routes.auth.login

    return (
      <Link
        href={href}
        className="ml-1 inline-flex items-center rounded-full border border-neutral-300 px-3.5 py-1.5 text-xs font-semibold text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-50"
      >
        Sign in
      </Link>
    )
  }

  const displayName = user.name?.trim() || user.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="ml-1 rounded-full outline-none focus-visible:ring-0 data-[state=open]:ring-0"
      >
        <AccountAvatar user={user} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        <div className="px-2 py-2">
          <p className="truncate text-sm font-semibold text-neutral-900">
            {displayName}
          </p>
          <p className="truncate text-xs text-neutral-500">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        {accountLinks.map((link) => {
          const Icon = link.icon
          return (
            <DropdownMenuItem key={link.href} asChild>
              <Link href={link.href} className="cursor-pointer">
                <Icon className="text-neutral-500" />
                {link.label}
              </Link>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={(event) => {
            event.preventDefault()
            void signOut()
          }}
          className="cursor-pointer"
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

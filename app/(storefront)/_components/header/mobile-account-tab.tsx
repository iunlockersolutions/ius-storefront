"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Heart, LogOut, type LucideIcon, Package, User } from "lucide-react"
import { m } from "motion/react"

import { useGuestAuthPrompt } from "@/components/auth/guest-auth-prompt"
import { routes } from "@/configs/routes"

import { getCurrentStorefrontPathWithQuery } from "./header-utils"
import { type HeaderUser } from "./types"
import { useStorefrontSignOut } from "./use-storefront-sign-out"

type MobileAccountTabProps = {
  user?: HeaderUser
  onClose: () => void
}

type GuestAccountPromptSource =
  | "favorites"
  | "orders"
  | "profile"
  | "signin"
  | "register"

type AccountLink = {
  href: string
  icon: LucideIcon
  label: string
  source?: GuestAccountPromptSource
}

const authenticatedAccountLinks: AccountLink[] = [
  { href: routes.storefront.orders.root, icon: Package, label: "My Orders" },
  { href: routes.storefront.favorites.root, icon: Heart, label: "Favorites" },
  { href: routes.storefront.profile.root, icon: User, label: "Profile" },
]

const guestQuickLinks: AccountLink[] = [
  {
    href: routes.storefront.orders.root,
    icon: Package,
    label: "My Orders",
    source: "orders",
  },
  { href: routes.storefront.favorites.root, icon: Heart, label: "Favorites" },
]

export function MobileAccountTab({ user, onClose }: MobileAccountTabProps) {
  const router = useRouter()
  const { open } = useGuestAuthPrompt()
  const signOut = useStorefrontSignOut()
  const isAuthenticated = !!user

  const handleProtected = React.useCallback(
    (href: string) => {
      onClose()
      router.push(href)
    },
    [onClose, router],
  )

  const handleGuest = React.useCallback(
    (callbackUrl: string, source: GuestAccountPromptSource) => {
      onClose()
      window.setTimeout(() => open({ callbackUrl, source }), 0)
    },
    [onClose, open],
  )

  const handleSignOut = React.useCallback(async () => {
    onClose()
    await signOut()
  }, [onClose, signOut])

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="flex-1 overflow-y-auto px-6 py-8"
    >
      {isAuthenticated ? (
        <>
          <div className="mb-6">
            <p className="text-xs text-neutral-500">Signed in as</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">
              {user.name || user.email}
            </p>
          </div>

          <ul className="space-y-1">
            {authenticatedAccountLinks.map((link) => {
              const Icon = link.icon
              return (
                <li key={link.href}>
                  <button
                    type="button"
                    onClick={() => handleProtected(link.href)}
                    className="flex w-full items-center gap-3 py-2.5 text-left text-[28px] font-semibold tracking-tight text-neutral-900"
                  >
                    <Icon className="size-5 text-neutral-500" />
                    {link.label}
                  </button>
                </li>
              )
            })}
            <li>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 py-2.5 text-left text-[28px] font-semibold tracking-tight text-red-600"
              >
                <LogOut className="size-5" />
                Sign out
              </button>
            </li>
          </ul>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Your account
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Sign in to view your orders, favorites, and profile.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() =>
                handleGuest(getCurrentStorefrontPathWithQuery(), "signin")
              }
              className="h-11 rounded-full bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-500"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() =>
                handleGuest(getCurrentStorefrontPathWithQuery(), "register")
              }
              className="h-11 rounded-full border border-neutral-300 px-5 text-sm font-medium text-neutral-900 hover:border-neutral-400"
            >
              Create account
            </button>
          </div>

          <div className="mt-10">
            <p className="mb-3 text-xs text-neutral-500">Quick Links</p>
            <ul className="space-y-0">
              {guestQuickLinks.map((link) => {
                const Icon = link.icon
                const source = link.source
                return (
                  <li key={link.href}>
                    {source ? (
                      <button
                        type="button"
                        onClick={() => handleGuest(link.href, source)}
                        className="flex w-full items-center gap-3 py-2 text-left text-base text-neutral-900"
                      >
                        <Icon className="size-4 text-neutral-500" />
                        {link.label}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className="flex items-center gap-3 py-2 text-base text-neutral-900"
                      >
                        <Icon className="size-4 text-neutral-500" />
                        {link.label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </m.div>
  )
}

"use client"

import { ArrowRight, Heart, User } from "lucide-react"

import {
  type GuestAuthPromptSource,
  useGuestAuthPrompt,
} from "@/components/auth/guest-auth-prompt"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { routes } from "@/configs/routes"

import { accountLinks } from "./navigation-config"

function getCurrentUrl() {
  if (typeof window === "undefined") {
    return "/"
  }

  return `${window.location.pathname}${window.location.search}`
}

export function GuestHeaderActions() {
  const { open } = useGuestAuthPrompt()
  const favoritesLink = accountLinks.find((link) => link.source === "favorites")

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="hidden sm:inline-flex"
        onClick={() =>
          open({
            callbackUrl:
              favoritesLink?.href || routes.storefront.favorites.root,
            source:
              (favoritesLink?.source as GuestAuthPromptSource | undefined) ||
              "favorites",
          })
        }
      >
        <Heart className="size-5" />
        <span className="sr-only">Favorites</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <User className="size-5" />
            <span className="sr-only">Account</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">Customer Account</p>
              <p className="text-xs text-muted-foreground">
                Sign in to view orders, favorites, and profile settings.
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {accountLinks.map((link) => (
            <DropdownMenuItem
              key={link.href}
              onSelect={() =>
                open({
                  callbackUrl: link.href,
                  source: link.source,
                })
              }
              className="cursor-pointer"
            >
              {link.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="default"
        size="sm"
        className="hidden sm:inline-flex"
        onClick={() =>
          open({
            callbackUrl: getCurrentUrl(),
            source: "signin",
          })
        }
      >
        Sign in
        <ArrowRight className="size-4" />
      </Button>
    </>
  )
}

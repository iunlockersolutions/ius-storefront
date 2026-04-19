"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { ArrowRight, Heart, Package, ShieldCheck, User } from "lucide-react"

import { SocialLoginButtons } from "@/app/auth/_components/social-login-buttons"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { routes } from "@/configs/routes"
import { useIsMobile } from "@/hooks/use-mobile"
import type { SocialProviderId } from "@/lib/auth/social-provider-metadata"

const AUTO_DISMISS_KEY = "guest-auth-prompt:dismissed"

export type GuestAuthPromptSource =
  | "auto"
  | "favorite"
  | "favorites"
  | "orders"
  | "profile"
  | "signin"
  | "register"

interface GuestAuthPromptOptions {
  callbackUrl: string
  source: GuestAuthPromptSource
}

interface GuestAuthPromptContextValue {
  open: (options: GuestAuthPromptOptions) => void
}

const GuestAuthPromptContext =
  createContext<GuestAuthPromptContextValue | null>(null)

function buildAuthHref(pathname: string, callbackUrl: string) {
  return `${pathname}?callbackUrl=${encodeURIComponent(callbackUrl)}`
}

function getCurrentStorefrontUrl(pathname: string) {
  if (typeof window === "undefined") {
    return pathname
  }

  const query = window.location.search
  return query ? `${pathname}${query}` : pathname
}

function getPromptCopy(source: GuestAuthPromptSource) {
  switch (source) {
    case "favorite":
      return {
        icon: Heart,
        title: "Save this item to your account",
        description:
          "Use a social sign-in to keep your favorites, cart, and future purchases in sync.",
      }
    case "favorites":
      return {
        icon: Heart,
        title: "Open your saved items faster",
        description:
          "Sign in once to keep favorites across devices and come back to them anytime.",
      }
    case "orders":
      return {
        icon: Package,
        title: "Track your orders in one place",
        description:
          "Use a social sign-in to view order updates, history, and delivery details without extra steps.",
      }
    case "profile":
      return {
        icon: User,
        title: "Unlock your customer account",
        description:
          "Sign in to manage profile details, addresses, and account preferences from one place.",
      }
    case "register":
      return {
        icon: ShieldCheck,
        title: "Create your account with one tap",
        description:
          "Use a social account to start shopping faster and keep your details ready for checkout.",
      }
    case "signin":
      return {
        icon: ShieldCheck,
        title: "Sign in and keep shopping",
        description:
          "Continue with a social account to save favorites, track orders, and move through checkout faster.",
      }
    case "auto":
    default:
      return {
        icon: ShieldCheck,
        title: "Shop faster with social sign-in",
        description:
          "Create or access your account in one tap, then keep your orders, favorites, and delivery details ready.",
      }
  }
}

interface GuestAuthPromptProviderProps {
  children: ReactNode
  isAuthenticated: boolean
  socialProviders: SocialProviderId[]
}

export function GuestAuthPromptProvider({
  children,
  isAuthenticated,
  socialProviders,
}: GuestAuthPromptProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<GuestAuthPromptOptions>({
    callbackUrl: pathname,
    source: "auto",
  })
  const autoPromptAttemptedRef = useRef(false)

  const hasSocialProviders = socialProviders.length > 0

  const open = (nextOptions: GuestAuthPromptOptions) => {
    if (!hasSocialProviders) {
      router.push(buildAuthHref(routes.auth.login, nextOptions.callbackUrl))
      return
    }

    setOptions(nextOptions)
    setIsOpen(true)
  }

  useEffect(() => {
    if (
      autoPromptAttemptedRef.current ||
      isAuthenticated ||
      !hasSocialProviders ||
      pathname.startsWith("/auth")
    ) {
      return
    }

    const dismissed = sessionStorage.getItem(AUTO_DISMISS_KEY) === "true"
    autoPromptAttemptedRef.current = true

    if (dismissed) {
      return
    }

    const timer = window.setTimeout(() => {
      setOptions({
        callbackUrl: getCurrentStorefrontUrl(pathname),
        source: "auto",
      })
      setIsOpen(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [hasSocialProviders, isAuthenticated, pathname])

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen)

    if (!nextOpen && options.source === "auto") {
      sessionStorage.setItem(AUTO_DISMISS_KEY, "true")
    }
  }

  return (
    <GuestAuthPromptContext.Provider value={{ open }}>
      {children}
      {hasSocialProviders ? (
        <GuestAuthPrompt
          open={isOpen}
          onOpenChange={handleOpenChange}
          socialProviders={socialProviders}
          options={options}
        />
      ) : null}
    </GuestAuthPromptContext.Provider>
  )
}

export function useGuestAuthPrompt() {
  const context = useContext(GuestAuthPromptContext)

  if (!context) {
    throw new Error(
      "useGuestAuthPrompt must be used within a GuestAuthPromptProvider",
    )
  }

  return context
}

interface GuestAuthPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: GuestAuthPromptOptions
  socialProviders: SocialProviderId[]
}

function GuestAuthPrompt({
  open,
  onOpenChange,
  options,
  socialProviders,
}: GuestAuthPromptProps) {
  const isMobile = useIsMobile()
  const copy = getPromptCopy(options.source)
  const Icon = copy.icon
  const loginHref = buildAuthHref(routes.auth.login, options.callbackUrl)
  const registerHref = buildAuthHref(routes.auth.register, options.callbackUrl)

  const body = (
    <div className="space-y-6 px-6">
      <SocialLoginButtons
        callbackUrl={options.callbackUrl}
        providers={socialProviders}
      />
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{copy.title}</DrawerTitle>
            <DrawerDescription>{copy.description}</DrawerDescription>
          </DrawerHeader>
          {body}
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="ghost">Maybe later</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        {body}
        <DialogFooter className="px-6 pb-4">
          <div className="flex items-center justify-center gap-2 w-full">
            <p>Sign In with email, </p>
            <Link className="text-blue-500" href={loginHref}>
              sign in here
            </Link>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

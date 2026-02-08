"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { Bell, LogOut, Settings, User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clearAuthCookies } from "@/lib/actions/admin-auth"
import { signOut } from "@/lib/auth-client"

interface AdminHeaderProps {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
  }
}

/**
 * Admin Header
 *
 * Header bar for admin dashboard with user menu.
 */
export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await clearAuthCookies()
    await signOut()
    router.push("/auth/login")
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-neutral-950">
      {/* Search - Placeholder */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.image || undefined}
                  alt={user.name || user.email}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name || "User"}</p>
                <p className="text-xs text-neutral-500">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/admin/profile"
                className="flex items-center cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/admin/settings"
                className="flex items-center cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

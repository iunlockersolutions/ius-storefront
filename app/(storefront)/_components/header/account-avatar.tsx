"use client"

import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

import { type HeaderUser } from "./types"

const INITIALS_PALETTE = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-fuchsia-500",
  "bg-pink-500",
] as const

function colorForEmail(email: string) {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0
  }
  return INITIALS_PALETTE[hash % INITIALS_PALETTE.length]
}

function initialsForEmail(email: string) {
  return email.slice(0, 2).toUpperCase()
}

function isGoogleImage(image?: string | null) {
  return !!image && /googleusercontent\.com/.test(image)
}

function GoogleGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  )
}

type AccountAvatarProps = {
  user: HeaderUser
  size?: "sm" | "default" | "lg"
}

const GOOGLE_BADGE_CLASS: Record<
  NonNullable<AccountAvatarProps["size"]>,
  string
> = {
  sm: "size-3 [&>svg]:size-2",
  default: "size-4 [&>svg]:size-3",
  lg: "size-5 [&>svg]:size-4",
}

export function AccountAvatar({ user, size = "default" }: AccountAvatarProps) {
  const initials = initialsForEmail(user.email)
  const fallbackColor = colorForEmail(user.email)
  const isGoogle = isGoogleImage(user.image)

  const avatar = (
    <Avatar size={size}>
      {user.image ? (
        <AvatarImage
          src={user.image}
          alt={user.name || user.email}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
      ) : null}
      <AvatarFallback
        className={cn(
          !user.image && fallbackColor,
          !user.image && "text-white font-semibold",
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )

  if (!isGoogle) return avatar

  return (
    <span className="relative inline-flex">
      {avatar}
      <span
        aria-hidden="true"
        className={cn(
          "absolute right-0 bottom-0 z-10 inline-flex translate-x-1/4 translate-y-1/4 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5",
          GOOGLE_BADGE_CLASS[size],
        )}
      >
        <GoogleGlyph />
      </span>
    </span>
  )
}

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getSessionCookie } from "better-auth/cookies"

import { getCustomCookie } from "@/lib/utils/cookies"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/ops")) {
    // Use Better Auth's getSessionCookie which handles prefix automatically
    const sessionCookie = getSessionCookie(request)

    if (!sessionCookie) {
      const url = new URL("/404", request.url)
      return NextResponse.rewrite(url, { status: 404 })
    }

    const isStaff = getCustomCookie(request, "is-staff") === "true"
    if (!isStaff) {
      const url = new URL("/404", request.url)
      return NextResponse.rewrite(url, { status: 404 })
    }

    const mustChangePassword =
      getCustomCookie(request, "must-change-password") === "true"
    if (mustChangePassword) {
      const allowedPaths = ["/ops/change-password"]

      const isAllowed = allowedPaths.some((p) => pathname.startsWith(p))
      if (!isAllowed && !pathname.startsWith("/api/")) {
        return NextResponse.redirect(
          new URL("/ops/change-password", request.url),
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/ops/:path*", "/api/((?!auth).)*"],
}

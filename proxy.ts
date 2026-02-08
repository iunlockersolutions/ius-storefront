import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Get a cookie value checking both secure and non-secure prefixes.
 * In production (HTTPS), better-auth uses __Secure- prefix for cookies.
 */
function getCookie(request: NextRequest, name: string): string | undefined {
  // Check for __Secure- prefixed cookie first (production HTTPS)
  const secureCookie = request.cookies.get(`__Secure-${name}`)?.value
  if (secureCookie) return secureCookie

  // Fall back to non-prefixed cookie (local development)
  return request.cookies.get(name)?.value
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin")) {
    const sessionToken = getCookie(request, "better-auth.session_token")

    if (!sessionToken) {
      const url = new URL("/404", request.url)
      return NextResponse.rewrite(url, { status: 404 })
    }

    const isStaff = getCookie(request, "is-staff") === "true"
    if (!isStaff) {
      const url = new URL("/404", request.url)
      return NextResponse.rewrite(url, { status: 404 })
    }

    const mustChangePassword = getCookie(request, "must-change-password") === "true"
    if (mustChangePassword) {
      const allowedPaths = ["/admin/change-password"]

      const isAllowed = allowedPaths.some((p) => pathname.startsWith(p))
      if (!isAllowed && !pathname.startsWith("/api/")) {
        return NextResponse.redirect(
          new URL("/admin/change-password", request.url),
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/((?!auth).)*"],
}

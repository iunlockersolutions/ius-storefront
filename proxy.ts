import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getSessionCookie } from "better-auth/cookies"

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true"
const MAINTENANCE_BYPASS_SECRET = process.env.MAINTENANCE_BYPASS_SECRET
const BYPASS_COOKIE = "maintenance-bypass"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- Maintenance mode: block every customer and admin request ---
  if (MAINTENANCE_MODE) {
    // Allow a privileged operator to preview the live site via
    // `?preview=<secret>`, which drops a short-lived bypass cookie so
    // subsequent navigations keep working.
    if (MAINTENANCE_BYPASS_SECRET) {
      const previewParam = request.nextUrl.searchParams.get("preview")
      if (previewParam === MAINTENANCE_BYPASS_SECRET) {
        const response = NextResponse.next()
        response.cookies.set(BYPASS_COOKIE, MAINTENANCE_BYPASS_SECRET, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 8, // 8 hours
        })
        return response
      }
    }

    const isBypassed =
      !!MAINTENANCE_BYPASS_SECRET &&
      request.cookies.get(BYPASS_COOKIE)?.value === MAINTENANCE_BYPASS_SECRET

    if (!isBypassed) {
      if (pathname !== "/maintenance") {
        const url = request.nextUrl.clone()
        url.pathname = "/maintenance"
        return NextResponse.rewrite(url, {
          status: 503,
          headers: { "Retry-After": "3600" },
        })
      }
      return NextResponse.next()
    }
  }

  // --- Operations portal auth guard ---
  if (pathname.startsWith("/ops")) {
    const sessionCookie = getSessionCookie(request)

    if (!sessionCookie) {
      const url = new URL("/404", request.url)
      return NextResponse.rewrite(url, { status: 404 })
    }
  }

  return NextResponse.next()
}

export const config = {
  // Run on everything except Next internals and static files so maintenance
  // mode can gate the whole site (storefront, ops, and API).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
}

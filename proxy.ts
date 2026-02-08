import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin")) {
    const sessionToken = request.cookies.get("better-auth.session_token")?.value

    if (!sessionToken) {
      const url = new URL("/404", request.url)
      return NextResponse.rewrite(url, { status: 404 })
    }

    const isStaff = request.cookies.get("is-staff")?.value === "true"
    if (!isStaff) {
      const url = new URL("/404", request.url)
      return NextResponse.rewrite(url, { status: 404 })
    }

    const mustChangePassword =
      request.cookies.get("must-change-password")?.value === "true"
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

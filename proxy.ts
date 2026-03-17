import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getSessionCookie } from "better-auth/cookies"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

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
  matcher: ["/ops/:path*", "/api/((?!auth).)*"],
}

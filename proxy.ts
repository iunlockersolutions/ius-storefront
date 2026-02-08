import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Proxy for route protection and admin route masking.
 *
 * Strategy for production reliability:
 * 1. Check for session token - if missing, show 404 for admin routes
 * 2. Check for is-staff cookie - if present, allow access
 * 3. If session exists but is-staff cookie missing, redirect to verification
 *    This handles the edge case where cookies haven't propagated after login
 *
 * The is-staff cookie is set by the handlePostLoginRedirect server action
 * after successful authentication.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only process admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  // Get cookies
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value
  const isStaff = request.cookies.get("is-staff")?.value === "true"
  const mustChangePassword =
    request.cookies.get("must-change-password")?.value === "true"

  // No session token = definitely not authenticated
  // Show 404 to mask admin routes from unauthenticated users
  if (!sessionToken) {
    return NextResponse.rewrite(new URL("/404", request.url), { status: 404 })
  }

  // Session exists but no is-staff cookie
  // This can happen due to:
  // 1. Cookie not yet propagated after login
  // 2. User is not staff (regular customer trying to access admin)
  // 3. Cookie expired or was cleared
  //
  // Redirect to verification endpoint which will:
  // - Verify the session server-side
  // - Set appropriate cookies
  // - Redirect to admin if staff, or show 404 if not
  if (!isStaff) {
    // Allow the verify-session route itself to prevent redirect loops
    if (pathname === "/admin/verify-access") {
      return NextResponse.next()
    }

    // Redirect to verification with the intended destination
    const verifyUrl = new URL("/admin/verify-access", request.url)
    verifyUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(verifyUrl)
  }

  // Staff user with valid session - check password change requirement
  if (mustChangePassword) {
    const allowedPaths = ["/admin/change-password", "/admin/verify-access"]
    const isAllowed = allowedPaths.some((p) => pathname.startsWith(p))

    if (!isAllowed && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(
        new URL("/admin/change-password", request.url),
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all admin routes
    "/admin/:path*",
    // Match API routes except auth
    "/api/((?!auth).)*",
  ],
}

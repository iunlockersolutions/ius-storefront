import type { NextRequest } from "next/server"

/**
 * Cookie Utilities
 *
 * Handles cookie naming with proper __Secure- prefix for production.
 * This matches Better Auth's cookie behavior.
 */

/**
 * Check if we should use secure cookie prefix.
 * In production (HTTPS), cookies should use __Secure- prefix.
 */
export function isSecureCookieEnvironment(): boolean {
  return process.env.NODE_ENV === "production"
}

/**
 * Get the cookie name with the appropriate prefix.
 * In production (HTTPS), cookies use __Secure- prefix for security.
 */
export function getCookieName(name: string): string {
  return isSecureCookieEnvironment() ? `__Secure-${name}` : name
}

/**
 * Get a custom cookie value from a NextRequest, matching Better Auth's prefix behavior.
 * Use this in proxy/middleware where you have access to NextRequest.
 */
export function getCustomCookie(
  request: NextRequest,
  name: string,
): string | undefined {
  const cookieName = getCookieName(name)
  return request.cookies.get(cookieName)?.value
}

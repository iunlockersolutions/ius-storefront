import type { NextRequest } from "next/server"

export function isSecureCookieEnvironment(): boolean {
  return process.env.NODE_ENV === "production"
}

export function getCookieName(name: string): string {
  return isSecureCookieEnvironment() ? `__Secure-${name}` : name
}

export function getCustomCookie(
  request: NextRequest,
  name: string,
): string | undefined {
  const cookieName = getCookieName(name)
  return request.cookies.get(cookieName)?.value
}

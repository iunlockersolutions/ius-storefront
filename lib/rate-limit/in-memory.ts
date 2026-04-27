// Simple in-memory rate limiter scoped to a single Node process.
// Fine for single-instance deployments; swap to Upstash Redis if the
// storefront is ever scaled horizontally — call sites won't need to change.

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || now > existing.resetAt) {
    const next: Bucket = { count: 1, resetAt: now + windowMs }
    buckets.set(key, next)
    return { allowed: true, remaining: limit - 1, resetAt: next.resetAt }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  }
}

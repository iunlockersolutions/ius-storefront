import { NextRequest } from "next/server"

import { createContactMessage } from "@/lib/actions/contact-message"
import { checkRateLimit } from "@/lib/rate-limit/in-memory"
import { fail, mapErrorToApi, ok } from "@/lib/utils/api-response"
import { getClientIp } from "@/lib/utils/get-client-ip"

const RATE_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

interface ContactSubmissionBody {
  name?: unknown
  email?: unknown
  phone?: unknown
  message?: unknown
  // Honeypot — must be empty. Bots happily fill anything they can find.
  hp?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request
      .json()
      .catch(() => null)) as ContactSubmissionBody | null

    if (!body || typeof body !== "object") {
      return fail("BAD_REQUEST", "Invalid request body", 400)
    }

    // Honeypot: succeed silently so bots don't learn anything.
    if (typeof body.hp === "string" && body.hp.trim().length > 0) {
      return ok({ success: true })
    }

    const ip = getClientIp(request)
    const rate = checkRateLimit(`contact:${ip}`, RATE_LIMIT, WINDOW_MS)
    if (!rate.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rate.resetAt - Date.now()) / 1000),
      )
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Too many submissions. Try again in an hour.",
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        },
      )
    }

    const userAgent = request.headers.get("user-agent") ?? undefined

    const result = await createContactMessage({
      name: typeof body.name === "string" ? body.name : "",
      email: typeof body.email === "string" ? body.email : "",
      phone: typeof body.phone === "string" ? body.phone : undefined,
      message: typeof body.message === "string" ? body.message : "",
      clientIp: ip === "unknown" ? undefined : ip,
      userAgent,
    })

    if (!result.success || !result.data) {
      // Action returns JSON-encoded fieldErrors when zod fails so the form
      // can show inline messages.
      const errorPayload = result.error ?? "Failed to submit message"
      try {
        const parsed = JSON.parse(errorPayload) as {
          fieldErrors?: Record<string, string>
        }
        if (parsed.fieldErrors) {
          return fail(
            "BAD_REQUEST",
            "Please correct the highlighted fields.",
            400,
            { fieldErrors: parsed.fieldErrors },
          )
        }
      } catch {
        // not JSON — fall through
      }
      return fail("BAD_REQUEST", errorPayload, 400)
    }

    return ok({ id: result.data.id })
  } catch (error) {
    return mapErrorToApi(error)
  }
}

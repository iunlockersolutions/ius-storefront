# Realtime Option A — SSE with In-Process Pub/Sub

## Context

Right now [use-admin-notifications-query.ts](services/queries/use-admin-notifications-query.ts) polls `/api/admin/notifications` every 30 seconds. That's a steady stream of cache-miss requests for every signed-in staff tab and a 0–30s lag from "customer hits Send" to "bell badge increments." We want push, not pull.

This plan uses **Server-Sent Events** (built into the web platform, no third party) backed by an **in-memory pub/sub bus** inside the Next.js Node process. When [createContactMessage](lib/actions/contact-message.ts) inserts notification rows, it also publishes to the bus, which fans events out to every open SSE connection for the relevant staff users. The browser's `EventSource` receives the event and invalidates the React Query cache — the existing bell component re-renders.

This is the simplest of the three options. It ships in ~150 lines, has zero new dependencies, and works correctly on a single long-running Node instance.

---

## Suitability

**Use this when:**
- The app runs on a long-running Node host (Railway, Fly, a VPS, a single container) — anything where one process stays up and serves all traffic for a region.
- One Node process is enough to handle the load.
- You want zero new infrastructure.

**Do NOT use this when:**
- You scale horizontally (more than one Node process for the same app). Each process has its own Map; a publish in process A never reaches a subscriber in process B. Staff on the wrong process get nothing.
- You're on Vercel serverless functions with default settings. SSE needs a long-lived response; serverless functions on hobby cap at ~25s, pro at ~5min on Edge. Workable but constrained — you'd want Edge Runtime with the connection eventually closing and the client reconnecting.

If either of those is true now or imminent, jump straight to **Option B (Redis)** or **Option C (Postgres LISTEN/NOTIFY)**.

---

## Architecture

```
Customer POST /api/contact
        │
        ▼
createContactMessage()
        │
        ├── insert contact_messages row
        ├── insert notifications rows (one per staff recipient)
        └── bus.publish(recipientId, { type: "notification.created", ... })  ← NEW
                                            │
                                            ▼
                              In-memory Map<userId, Set<controller>>
                                            │
                                            ▼
                              writes "data: {...}\n\n" to each controller
                                            │
                                            ▼
                              Browser EventSource onmessage
                                            │
                                            ▼
                              queryClient.invalidateQueries(notifications)
                                            │
                                            ▼
                              Bell badge re-renders
```

The bus is a singleton `Map`. Subscribing pushes a controller into the user's set; unsubscribing removes it. Publishing iterates the set and writes to each controller.

---

## Files

### New: `lib/realtime/bus.ts`

Singleton in-memory pub/sub.

```ts
type Listener = (event: RealtimeEvent) => void

export type RealtimeEvent =
  | { type: "notification.created"; recipientId: string; notificationId: string }
  | { type: "notification.read"; recipientId: string }

class RealtimeBus {
  private listeners = new Map<string, Set<Listener>>()

  subscribe(recipientId: string, listener: Listener) {
    let set = this.listeners.get(recipientId)
    if (!set) {
      set = new Set()
      this.listeners.set(recipientId, set)
    }
    set.add(listener)
    return () => {
      set!.delete(listener)
      if (set!.size === 0) this.listeners.delete(recipientId)
    }
  }

  publish(recipientId: string, event: RealtimeEvent) {
    const set = this.listeners.get(recipientId)
    if (!set) return
    for (const listener of set) {
      try { listener(event) } catch { /* swallow — one bad listener can't break others */ }
    }
  }
}

// `globalThis` cache so HMR in dev doesn't create a new bus per reload.
const globalForBus = globalThis as unknown as { __iusRealtimeBus?: RealtimeBus }
export const realtimeBus = globalForBus.__iusRealtimeBus ?? (globalForBus.__iusRealtimeBus = new RealtimeBus())
```

### New: `app/api/admin/notifications/stream/route.ts`

The SSE endpoint. Holds the connection open, writes events as they come in, sends a heartbeat every 25s so proxies don't kill it.

```ts
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { getServerSession } from "@/lib/auth/rbac"
import { realtimeBus, type RealtimeEvent } from "@/lib/realtime/bus"

// Long-lived response — must run on Node runtime, not Edge serverless
// (unless deploying to a host that keeps Edge streams open indefinitely).
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  await requireAdminApiPermission("contact_message", "list")
  const session = await getServerSession()
  const userId = session!.user.id

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Initial comment so the client knows the stream is live
      controller.enqueue(encoder.encode(": connected\n\n"))

      const unsubscribe = realtimeBus.subscribe(userId, (event: RealtimeEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      })

      // Heartbeat every 25s — defeats idle-connection timeouts
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"))
      }, 25_000)

      // Clean up on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        unsubscribe()
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // disables nginx buffering if you're behind it
    },
  })
}
```

### Edit: `lib/actions/contact-message.ts`

Inside `createContactMessage`, after the bulk-insert of `notifications` rows, publish to the bus. The publish is best-effort — never let realtime failures block the DB transaction's commit.

```ts
// inside the transaction, after notifications insert:
const recipientIds = recipients.map((r) => r.id)

// outside the transaction, after it commits:
for (const recipientId of recipientIds) {
  realtimeBus.publish(recipientId, {
    type: "notification.created",
    recipientId,
    notificationId: created.id,
  })
}
```

Move the publish to *after* `db.transaction()` resolves — that way you only fire events for rows that actually committed.

### Edit: `services/queries/use-admin-notifications-query.ts`

Drop `refetchInterval` to a long fallback (5 min — survives a missed reconnect). Add a sibling hook that opens the SSE connection.

```ts
import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

export function useAdminNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.notifications(),
    queryFn: async () => { /* unchanged */ },
    refetchInterval: 5 * 60_000, // safety net only
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  })
}

export function useAdminNotificationsStream() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const source = new EventSource("/api/admin/notifications/stream", {
      withCredentials: true, // BetterAuth uses cookies
    })

    source.onmessage = (event) => {
      // Any event from the server → refetch the feed
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notifications() })
    }

    source.onerror = () => {
      // EventSource auto-reconnects with exponential backoff. Nothing to do.
    }

    return () => source.close()
  }, [queryClient])
}
```

### Edit: `app/ops/_components/ops-notification-bell.tsx`

Call `useAdminNotificationsStream()` once at the top of the component so the connection opens when any staff user has the bell mounted (which is every ops page).

```tsx
export function OpsNotificationBell() {
  useAdminNotificationsStream()  // ← add this
  const feed = useAdminNotificationsQuery()
  // ... existing code
}
```

---

## Build order

1. `lib/realtime/bus.ts` — write the bus, no callers yet.
2. `app/api/admin/notifications/stream/route.ts` — the SSE endpoint. Verify with `curl -N http://localhost:4000/api/admin/notifications/stream` (with auth cookie) — should print `: connected` then `: ping` every 25s.
3. Wire the publish in `createContactMessage`. Submit a contact form, watch the curl tail emit a `data:` line within milliseconds.
4. Add `useAdminNotificationsStream` and mount it in the bell. Bell badge should now update with no polling.
5. Bump `refetchInterval` to 5 minutes once SSE is verified working.

Each step is independently testable.

---

## Edge cases & gotchas

- **HMR duplication in dev**: Next.js dev server reloads modules on edit. The `globalThis` trick in `bus.ts` keeps a single bus across reloads — without it you'd publish to one bus and subscribe on another after every save.
- **Multiple tabs per user**: each tab opens its own `EventSource`, each subscribes its own listener. The bus's `Set<Listener>` handles that natively. Closing one tab unsubscribes only that tab.
- **Reconnect**: `EventSource` auto-reconnects on disconnect with exponential backoff. No client code needed. The 5-min `refetchInterval` covers the worst case where a reconnect lands milliseconds after a missed event.
- **Heartbeat**: 25s is below most proxy idle timeouts (Cloudflare 100s, nginx default 60s, AWS ALB 60s). The leading colon (`: ping`) makes it an SSE comment — the browser ignores it, but the bytes keep the connection alive.
- **Auth**: `EventSource` sends cookies on same-origin requests; `requireAdminApiPermission` works as-is. `withCredentials: true` is only needed for cross-origin and is safe to keep.
- **Memory**: each open connection keeps one closure + one controller in the bus. At 1000 concurrent staff that's negligible. The bus's auto-cleanup of empty sets prevents leaks.
- **What about other event types?** The bus is generic — `RealtimeEvent` is a union. Add new event shapes as the feature grows (assignment changes, replies, etc.). Add cases in the bell's stream handler to invalidate the right query keys.

---

## What this unlocks for v2

The pattern generalizes:
- Inventory low-stock — publish from `inventory.adjust`.
- Order status change broadcast — publish from `order.updateStatus`.
- @mentions in contact-message internal notes — publish to the mentioned user only.

All of them reuse `realtimeBus.publish(recipientId, ...)` and a `useEffect` that listens.

---

## Verification

1. Open ops dashboard in two tabs as the same admin user.
2. Open `curl -N -b "session=..." http://localhost:4000/api/admin/notifications/stream` in a terminal.
3. Submit a contact form from a private window.
4. Curl prints a `data:` line within milliseconds.
5. Both ops tabs' bell badges increment without a page reload, network tab shows zero polling requests.
6. Click "mark all read" in tab A — tab B's badge updates within milliseconds (after we add `bus.publish` to `markNotificationsRead` too — small follow-up edit).
7. Kill the server. Both tabs' connections drop. Restart server. Both tabs reconnect automatically (visible in network tab).

If all 7 pass, ship it.

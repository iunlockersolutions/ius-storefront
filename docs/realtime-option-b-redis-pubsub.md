# Realtime Option B — SSE backed by Redis Pub/Sub

## Context

Same goal as Option A (push notifications to the ops bell without polling), same client-facing transport (SSE + `EventSource`). The difference is *what's behind the publish*.

In Option A, the pub/sub bus is an in-process `Map`. That breaks the moment you have more than one Node process — a publish in process A never reaches a subscriber in process B. This plan replaces the in-memory bus with **Redis pub/sub** so events fan out across every process that has subscribers, regardless of which process handled the originating POST.

The user specifically called out **Vercel Redis** (which is Vercel's managed Upstash Redis offering — same wire protocol, same client). This plan assumes that, but the design works with any Redis.

---

## Suitability

**Use this when:**
- You scale horizontally — multiple Node containers, multi-region deployments, or Vercel serverless where each request might hit a different process.
- You're already using or willing to add Vercel Redis / Upstash for other things (caching, rate limiting, queues). Pub/sub on top costs almost nothing extra.
- You want the operational simplicity of a managed service — no DB connection pool tuning, no `LISTEN/NOTIFY` quirks.

**Do NOT use this when:**
- You only have one Node process. Option A solves the same problem with zero infra. Adding Redis just adds an external dependency to babysit.
- The deployment can't reach Redis with low latency. Pub/sub is fast but every publish round-trips to Redis.
- You've already committed to Postgres and don't want a second persistence dependency. Option C uses Postgres `LISTEN/NOTIFY` to avoid that.

---

## Architecture

```
Process A (handles POST)              Redis (managed)             Process B (holds SSE)
        │                                   │                              │
createContactMessage()                       │                              │
        │                                    │                              │
        ├── DB insert                        │                              │
        └── publisher.publish(               │                              │
              "ius:notif:<userId>",          │                              │
              JSON event                     │                              │
            )                                │                              │
        ─────────────────────────────────▶  ─┤                              │
                                             │                              │
                                             ├──── pub/sub fan-out ─────────┤
                                             │                              │
                                             │      subscriber receives ◀───┤
                                             │      controller.enqueue(...) │
                                             │                              │
                                             │      Browser EventSource     │
                                             │      onmessage fires         │
                                             │      queryClient.invalidate  │
```

Two Redis clients per Node process:
- **Publisher** — used by API routes / actions. One shared client (Redis allows pub/sub on a normal client *or* a dedicated one; for clarity use a dedicated one).
- **Subscriber** — long-lived connection per process. While a Node connection is in subscriber mode, it can't issue normal commands, which is why it's separate.

Channel naming: `ius:notif:<recipientId>`. One channel per recipient — keeps the message volume per channel tiny and makes the subscribe/unsubscribe lifecycle simple. (Alternative: one global channel + filtering in subscribers. Worse fan-out at scale; skip it.)

---

## Files

### Setup

Pick a Redis client. The two reasonable choices for Vercel Redis:

- **`@upstash/redis`** — REST-based, perfect for serverless edge functions. **Does NOT support pub/sub.** Skip for this use case.
- **`ioredis`** — TCP-based, full Redis protocol including pub/sub. Use this.

```
pnpm add ioredis
```

Vercel Redis exposes a TCP `REDIS_URL` (or `KV_URL` depending on the integration) — check the dashboard.

### New: `lib/realtime/redis.ts`

Singleton Redis clients. The `globalThis` cache avoids HMR creating new TCP connections on every dev reload.

```ts
import Redis from "ioredis"

const REDIS_URL = process.env.REDIS_URL ?? process.env.KV_URL

if (!REDIS_URL) {
  // Don't throw at import time — let the runtime decide. The realtime feature
  // can degrade gracefully to polling if Redis isn't configured locally.
  console.warn("[realtime] REDIS_URL not set; realtime features disabled.")
}

const globalForRedis = globalThis as unknown as {
  __iusRedisPub?: Redis
  __iusRedisSub?: Redis
}

export const redisPub =
  globalForRedis.__iusRedisPub ??
  (globalForRedis.__iusRedisPub = REDIS_URL ? new Redis(REDIS_URL, { lazyConnect: false }) : null)

export const redisSub =
  globalForRedis.__iusRedisSub ??
  (globalForRedis.__iusRedisSub = REDIS_URL ? new Redis(REDIS_URL, { lazyConnect: false }) : null)

export const isRealtimeConfigured = Boolean(REDIS_URL)

export function notificationChannel(recipientId: string) {
  return `ius:notif:${recipientId}`
}
```

### New: `lib/realtime/bus.ts`

Same public API as Option A — same `publish`/`subscribe` shape — but backed by Redis. Swapping the bus implementation requires no changes elsewhere.

```ts
import { isRealtimeConfigured, notificationChannel, redisPub, redisSub } from "./redis"

export type RealtimeEvent =
  | { type: "notification.created"; recipientId: string; notificationId: string }
  | { type: "notification.read"; recipientId: string }

type Listener = (event: RealtimeEvent) => void

// Per-process map of channel → listeners. Each process subscribes to a Redis
// channel exactly once and demuxes incoming messages to all local listeners.
const localListeners = new Map<string, Set<Listener>>()

let messageHandlerInstalled = false

function installMessageHandler() {
  if (messageHandlerInstalled || !redisSub) return
  messageHandlerInstalled = true
  redisSub.on("message", (channel, payload) => {
    const set = localListeners.get(channel)
    if (!set) return
    let event: RealtimeEvent
    try { event = JSON.parse(payload) as RealtimeEvent } catch { return }
    for (const listener of set) {
      try { listener(event) } catch {}
    }
  })
}

export const realtimeBus = {
  async subscribe(recipientId: string, listener: Listener) {
    if (!isRealtimeConfigured || !redisSub) return () => {}
    installMessageHandler()

    const channel = notificationChannel(recipientId)
    let set = localListeners.get(channel)
    if (!set) {
      set = new Set()
      localListeners.set(channel, set)
      await redisSub.subscribe(channel)
    }
    set.add(listener)

    return async () => {
      set!.delete(listener)
      if (set!.size === 0) {
        localListeners.delete(channel)
        try { await redisSub.unsubscribe(channel) } catch {}
      }
    }
  },

  async publish(recipientId: string, event: RealtimeEvent) {
    if (!isRealtimeConfigured || !redisPub) return
    try {
      await redisPub.publish(notificationChannel(recipientId), JSON.stringify(event))
    } catch (err) {
      console.error("[realtime] publish failed", err)
      // Don't throw — realtime is best-effort, polling fallback still catches it.
    }
  },
}
```

Differences from Option A:
- `subscribe`/`publish` are now async (Redis round-trips).
- Multiple subscribers in the *same* process share one Redis subscription per channel — only the first subscribe issues `SUBSCRIBE`, only the last unsubscribe issues `UNSUBSCRIBE`. Important for keeping Redis subscription count bounded.

### New: `app/api/admin/notifications/stream/route.ts`

Same SSE endpoint as Option A but `await`s the bus's async subscribe and unsubscribe.

```ts
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { getServerSession } from "@/lib/auth/rbac"
import { realtimeBus, type RealtimeEvent } from "@/lib/realtime/bus"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  await requireAdminApiPermission("contact_message", "list")
  const session = await getServerSession()
  const userId = session!.user.id

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"))

      const unsubscribe = await realtimeBus.subscribe(userId, (event: RealtimeEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      })

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"))
      }, 25_000)

      request.signal.addEventListener("abort", async () => {
        clearInterval(heartbeat)
        await unsubscribe()
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
```

### Edit: `lib/actions/contact-message.ts`

Same as Option A — call `realtimeBus.publish()` after the DB transaction commits. The publish is async now; either `await` it or fire-and-forget. `await` is fine since it's a single TCP round-trip and gives you proper error logging.

```ts
// After db.transaction() resolves:
for (const recipientId of recipientIds) {
  await realtimeBus.publish(recipientId, {
    type: "notification.created",
    recipientId,
    notificationId: created.id,
  })
}
```

### Edit: client hook + bell

**Identical** to Option A. The browser doesn't care that the server's bus is Redis-backed.

---

## Environment

```
REDIS_URL=redis://default:<password>@<host>:<port>
```

In Vercel:
1. Storage → Redis → Create.
2. The integration auto-injects `REDIS_URL` (and aliases like `KV_URL`) into the project's environment variables.
3. Redeploy.

For local dev: run Redis in Docker (`docker run -p 6379:6379 redis:7`) and set `REDIS_URL=redis://localhost:6379` in `.env.local`. Or just leave it unset — the bus degrades gracefully to no-op, the existing 30s polling still works.

---

## Build order

1. Add `ioredis`, create `lib/realtime/redis.ts`. Verify with a one-off script: open two terminals, `redisPub.publish("test", "hi")` in one, `redisSub.subscribe("test"); redisSub.on("message", ...)` in the other.
2. Write `lib/realtime/bus.ts`. Unit-test by manually subscribing twice in the same process and confirming both listeners fire.
3. Write the SSE endpoint. Verify with `curl -N`.
4. Wire the publish in `createContactMessage`. End-to-end test with two browser tabs on different ports (simulate two processes) — POST hits port A, SSE on port B receives the event.
5. Add the client hook + bell mount.
6. Bump `refetchInterval` in the query hook to 5 minutes.

---

## Edge cases & gotchas

- **`ioredis` auto-reconnects** with exponential backoff. After a Redis outage, in-flight subscriptions are re-issued on reconnect — but events that fired *during* the outage are lost (Redis pub/sub has zero persistence). The 5-min polling fallback catches those.
- **Each Node process holds one persistent TCP subscriber connection.** Vercel Redis pricing usually counts connections — check your plan's connection cap if you're running many processes. Upstash's free tier was historically 100 concurrent connections, paid 10k+.
- **Don't share `redisSub` with normal commands.** Once `SUBSCRIBE` is issued, the connection enters subscriber mode and most other commands are rejected. Hence the two-client split.
- **TLS:** Vercel Redis URLs are usually `rediss://` (TLS). `ioredis` handles that via the URL scheme — no extra config.
- **Multi-region:** if your processes span regions, Redis pub/sub is *not* multi-region by default. Either pin all writes/reads to one region's Redis, or use a global Redis (Upstash Global). Out of scope for a small app.
- **Memory pressure:** Redis pub/sub holds nothing — published messages are dropped if no subscribers. No memory growth.
- **Auth identical to Option A** — cookies + `requireAdminApiPermission`.

---

## Cost estimate

For a small ops team:
- Vercel Redis hobby tier: $0/month, plenty for pub/sub on a small staff team (well under any free-tier command limits).
- Pro tier: ~$1/month per 100k commands. Each publish + each connection's subscribe = ~2 commands. Even at 1k contact messages/day with 10 staff online, that's ~10k commands/day = ~300k/month — under $5/month.

---

## Verification

Same checklist as Option A, plus:

8. Run two `next dev` instances on different ports backed by the same Redis. Submit a contact form to port A. SSE clients on port B receive the event within milliseconds.
9. Stop Redis (`docker stop redis`). Watch ioredis log reconnect attempts. SSE connections stay open (heartbeats still flow), events stop being delivered. Restart Redis — events flow again.
10. Tail Redis with `redis-cli MONITOR` while submitting a form — should see exactly one `PUBLISH ius:notif:<userId>` per recipient.

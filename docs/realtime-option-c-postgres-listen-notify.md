# Realtime Option C — SSE backed by Postgres LISTEN/NOTIFY

## Context

Same goal and same client transport as Options A and B. The only thing that changes is what carries the publish across processes.

This plan uses **Postgres `LISTEN` / `NOTIFY`** — a built-in pub/sub feature of Postgres. It's not a separate dependency: it's the database the app already uses (Neon, per [drizzle.config.ts](drizzle.config.ts)). A process executes `LISTEN ius_notif`; another process executes `NOTIFY ius_notif, '<json payload>'`; every listening connection receives the payload.

For a Postgres-only stack, this is the cleanest cross-process realtime solution. No Redis, no extra service to monitor, no new bill line.

---

## Suitability

**Use this when:**
- You're already on Postgres and don't want a second pub/sub dependency.
- You scale horizontally but stay rooted in one Postgres cluster.
- You want realtime that piggybacks on the database's existing connection security, IP allowlisting, and ops story.

**Do NOT use this when:**
- You're on Postgres connection-pooling middleware that doesn't pass `LISTEN/NOTIFY` through. **Neon's pgbouncer-style pooler in transaction mode silently drops `LISTEN`** — the listening connection has to be a *direct* (unpooled) connection, or use Neon's session-mode pooler. Verify before committing to this option.
- The payload size needs to exceed 8000 bytes. `NOTIFY` payloads are capped at ~8 KB. Easy to work around (publish an ID, fetch on receipt) but worth knowing.
- You're already running Redis for other things — Option B is simpler in that case.

---

## Architecture

```
Process A (handles POST)            Postgres                    Process B (holds SSE)
        │                              │                                 │
createContactMessage()                  │                                 │
        │                               │  ┌─── LISTEN ius_notif ────────┤
        ├── INSERT contact_messages     │  │                              │
        ├── INSERT notifications x N    │  │                              │
        └── NOTIFY ius_notif, '<json>'  │  │                              │
        ──────────────────────────────▶ ┤  │                              │
                                        ├──┴── notification delivered ───▶│
                                        │                                 │
                                        │      pg client emits 'notification' event
                                        │      controller.enqueue(...)    │
                                        │      Browser EventSource fires  │
                                        │      queryClient.invalidate(...)│
```

**One channel** (`ius_notif`) for all notification events. The payload includes `recipientId`, and each listening process filters/demuxes locally. Postgres has no per-channel-per-recipient model the way Redis does, so we put the recipient in the payload and filter in the app.

> **Why one channel?** You *can* use `LISTEN ius_notif_<userId>` per recipient, but that means executing a `LISTEN` every time a staff member opens a tab and `UNLISTEN` when they close. Postgres handles this fine, but tracking active LISTENs across many connections is fiddly. Single-channel + payload-side filtering is simpler at the staff scale we're targeting (dozens to hundreds, not millions).

---

## Files

### Setup

The existing app uses [postgres-js](package.json) (the `postgres` npm package, ~3.4.x in our deps). It supports `LISTEN/NOTIFY` natively via `sql.listen(channel, callback)`.

No new dependency.

> **Critical**: Confirm the listening connection bypasses any pooler that runs in *transaction* mode. With Neon, that means using the unpooled `DATABASE_URL_UNPOOLED` (or whatever the env name is) for the listen client *only*. Publishing (`NOTIFY`) works fine through any connection — including the pooled one — because it's just a regular SQL command inside its own transaction.

### New: `lib/realtime/postgres-listener.ts`

A singleton client that holds the `LISTEN` connection.

```ts
import postgres from "postgres"

const LISTEN_URL =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!LISTEN_URL) {
  console.warn("[realtime] DATABASE_URL not set; realtime disabled.")
}

const globalForListen = globalThis as unknown as {
  __iusListenSql?: postgres.Sql<{}>
}

// Use a dedicated client for LISTEN — separate from the pooled client used
// elsewhere. One persistent connection per Node process.
export const listenSql =
  globalForListen.__iusListenSql ??
  (globalForListen.__iusListenSql = LISTEN_URL
    ? postgres(LISTEN_URL, { max: 1, idle_timeout: 0, connect_timeout: 30 })
    : null)

export const isRealtimeConfigured = Boolean(LISTEN_URL)

export const NOTIF_CHANNEL = "ius_notif"
```

### New: `lib/realtime/bus.ts`

Same public API as Options A and B. The implementation uses a single LISTEN per process and demuxes locally by `recipientId`.

```ts
import { db } from "@/lib/db" // existing pooled client used for NOTIFY
import { isRealtimeConfigured, listenSql, NOTIF_CHANNEL } from "./postgres-listener"

export type RealtimeEvent =
  | { type: "notification.created"; recipientId: string; notificationId: string }
  | { type: "notification.read"; recipientId: string }

type Listener = (event: RealtimeEvent) => void

const localListeners = new Map<string, Set<Listener>>() // keyed by recipientId

let listenInstalled = false
let listenHandle: { unlisten: () => Promise<void> } | null = null

async function ensureListening() {
  if (listenInstalled || !listenSql) return
  listenInstalled = true

  // postgres.js exposes sql.listen(channel, onMessage). It auto-reconnects
  // and re-issues LISTEN on connection loss.
  listenHandle = await listenSql.listen(NOTIF_CHANNEL, (payload) => {
    let event: RealtimeEvent
    try { event = JSON.parse(payload) as RealtimeEvent } catch { return }
    const set = localListeners.get(event.recipientId)
    if (!set) return
    for (const listener of set) {
      try { listener(event) } catch {}
    }
  })
}

export const realtimeBus = {
  async subscribe(recipientId: string, listener: Listener) {
    if (!isRealtimeConfigured) return () => {}
    await ensureListening()

    let set = localListeners.get(recipientId)
    if (!set) {
      set = new Set()
      localListeners.set(recipientId, set)
    }
    set.add(listener)

    return async () => {
      set!.delete(listener)
      if (set!.size === 0) localListeners.delete(recipientId)
      // Note: we never UNLISTEN at runtime — one persistent LISTEN per process
      // is the whole design. Cleanup happens on process exit.
    }
  },

  async publish(recipientId: string, event: RealtimeEvent) {
    if (!isRealtimeConfigured) return
    try {
      // pg_notify is the SQL function form of NOTIFY — works with bound parameters
      // and inside transactions.
      await db.execute(
        // drizzle's sql tag — adapt to whatever raw-SQL helper the codebase uses
        // (db.execute(sql`...`)). This is illustrative.
        `SELECT pg_notify($1, $2)`,
        [NOTIF_CHANNEL, JSON.stringify(event)],
      )
    } catch (err) {
      console.error("[realtime] NOTIFY failed", err)
    }
  },
}
```

> **One important Postgres semantic**: `NOTIFY` issued *inside* a transaction is only delivered when that transaction commits. That's a feature, not a bug — it means we don't need the "publish after commit" dance from Options A and B. We can publish *inside* `db.transaction(...)` and Postgres delivers it iff the transaction succeeds. Move the `realtimeBus.publish(...)` calls inside the transaction in `createContactMessage` to take advantage of this.

### New: `app/api/admin/notifications/stream/route.ts`

Identical to Option B's SSE endpoint. The bus's `subscribe` is async; everything else is the same.

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

Inside the transaction in `createContactMessage`, after the bulk-insert of `notifications` rows, fire the NOTIFYs. Because Postgres only delivers NOTIFYs on commit, we don't need a separate "post-commit" pass.

```ts
// Inside the existing db.transaction(async (tx) => { ... }):
await Promise.all(
  recipients.map((recipient) =>
    realtimeBus.publish(recipient.id, {
      type: "notification.created",
      recipientId: recipient.id,
      notificationId: created.id,
    }),
  ),
)
```

> **Caveat:** this assumes `realtimeBus.publish` issues the NOTIFY through the *same* transaction's connection. If it instead uses a separate pooled client, the NOTIFY won't be tied to the contact-message transaction's commit. Either pass `tx` into `publish` or do the publish *after* the transaction resolves (same pattern as Options A and B). The simpler, less surprising choice is to publish after — write `recipientIds` to a closure variable, do the `await` outside `db.transaction(...)`. Documented here so the implementer doesn't trip on it.

### Edit: client hook + bell

**Identical** to Options A and B. The browser is unaware of the server-side transport.

---

## Environment

```
DATABASE_URL=postgres://...           # existing — used for queries (pooled OK)
DATABASE_URL_UNPOOLED=postgres://...  # NEW — direct connection for LISTEN
```

For Neon: the dashboard exposes both — the pooled URL has `-pooler` in the host, the unpooled doesn't. For self-hosted Postgres without pgbouncer, both env vars can point to the same URL.

For local dev: same `.env.local` setup; no special config needed.

---

## Build order

1. Add `DATABASE_URL_UNPOOLED` to `.env.local` and Vercel/production.
2. Write `lib/realtime/postgres-listener.ts` and `lib/realtime/bus.ts`. Verify by running two `psql` sessions in different terminals: `LISTEN ius_notif;` in one, `NOTIFY ius_notif, '{"hello":"world"}';` in the other — first session prints the payload.
3. Manual smoke test from Node: import the bus, subscribe, then `await realtimeBus.publish(userId, ...)` from another script — confirm the listener fires.
4. Write the SSE endpoint. Verify with `curl -N` and a manual `pg_notify` from psql.
5. Wire publishes in `createContactMessage` (after the transaction).
6. Add the client hook + bell mount.
7. Bump `refetchInterval` to 5 minutes.

---

## Edge cases & gotchas

- **Pooler in transaction mode silently breaks LISTEN.** This is *the* gotcha. Symptom: the LISTEN appears to succeed, but no NOTIFYs ever arrive. Cause: pgbouncer in transaction mode hands you a different backend connection per transaction; LISTEN registrations don't survive. Fix: route the listening client through a session-mode pool or directly to Postgres. Most managed providers expose two URLs for exactly this reason.
- **Payload size cap (~8 KB).** Plenty for `{ recipientId, notificationId }`. If you ever need to publish whole records, publish the ID and fetch from the DB on receipt instead.
- **Reconnect.** `postgres.js` auto-reconnects and re-issues the LISTEN on connection loss. Events fired during the outage are lost (Postgres NOTIFY isn't durable). The 5-min polling fallback is the safety net.
- **One LISTEN per process, forever.** We never `UNLISTEN` at runtime — adding/removing per-recipient LISTENs would burn round-trips for negligible savings. Each process maintains exactly one persistent LISTEN. Memory cost: one client connection per process (which Postgres connection limits already constrain).
- **Connection limits.** Each process consumes one extra DB connection (the LISTEN one). At 10 processes, that's 10 connections held open just for realtime. Check your Postgres `max_connections` (Neon free tier is 100; pro 200+).
- **Ordering.** NOTIFY guarantees ordering per session, not globally. For our use case (each event is independent), this is fine.
- **Transactional semantics.** As noted: `NOTIFY` *inside* a transaction is delivered iff the transaction commits. This is a clean primitive — but it requires that the publish run on the same connection as the transaction. Easiest: publish after the transaction resolves (we already have the data we need).
- **Auth identical to Options A and B** — cookies + `requireAdminApiPermission`.

---

## Cost estimate

- $0 incremental cost. Uses the existing Postgres instance.
- One additional DB connection per Node process (the LISTEN one). On a 100-connection limit with 10 processes, that's 10 of 100. Already-running queries continue to share the pool.

---

## Verification

Same checklist as Options A and B, plus:

8. Connect via psql, run `LISTEN ius_notif;`. Submit a contact form. psql prints a `Asynchronous notification "ius_notif"` line within milliseconds.
9. Run two `next dev` instances on different ports backed by the same Postgres. POST to port A. SSE on port B receives the event.
10. **Pooler smoke test**: deliberately point `DATABASE_URL_UNPOOLED` at the *pooled* URL. Confirm LISTEN goes silent (no events ever arrive). Restore unpooled URL, confirm events flow again. This confirms the pooler distinction matters in your environment and you've got the right URL.

---

## Comparing the three options at a glance

| Property | A: In-process | B: Redis | C: Postgres |
|---|---|---|---|
| New dependency | none | Vercel Redis / Upstash | none (uses existing Postgres) |
| Works across processes | ❌ | ✅ | ✅ |
| Cost | $0 | ~$0–5/mo | $0 |
| Operational complexity | trivial | low | low–medium (pooler caveat) |
| Payload size cap | none | none | ~8 KB |
| Persistence on subscriber outage | none | none | none |
| Transactional publish guarantee | manual (after commit) | manual (after commit) | native (inside transaction) |
| Right call when | single Node host | already use Redis or going multi-region | Postgres-only stack |

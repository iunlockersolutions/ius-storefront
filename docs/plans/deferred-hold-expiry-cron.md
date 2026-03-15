# Deferred Feature: Hold-Expiry Scheduled Trigger

## Current Status

- Scheduled hold-expiry triggering is intentionally disabled for now.
- Reason: Vercel free plan limitations for cron usage in this project context.
- The endpoint and release logic still exist and can be run manually.

## What Is Deferred

- Automatic invocation of the internal hold-release endpoint.
- The disabled part is only the scheduler config, not the release workflow itself.

## What Still Works Today

- Manual endpoint execution:
  - POST /api/internal/orders/release-expired-holds?limit=250
- Scripted consistency checks:
  - pnpm ops:backfill:order-holds -- --dry-run
  - pnpm ops:check:lifecycle

## How To Enable Later

### 1. Re-add scheduler config

Update [vercel.json](vercel.json) with:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/internal/orders/release-expired-holds?limit=250",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### 2. Configure secret in Vercel

Set one of:

- CRON_SECRET
- ORDER_HOLD_CRON_SECRET

The route accepts either:

- Authorization: Bearer <secret>
- x-cron-secret: <secret>

### 3. Deploy and verify

- Trigger manually once after deploy:
  - POST /api/internal/orders/release-expired-holds?limit=10
- Confirm response includes scanned, released, orderIds.
- Re-run:
  - pnpm ops:check:lifecycle

## Rollback Plan

- Remove crons section from [vercel.json](vercel.json).
- Keep endpoint code unchanged for manual operations.

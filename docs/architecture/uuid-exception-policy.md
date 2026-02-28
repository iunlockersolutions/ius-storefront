# UUID Exception Policy

This project enforces UUID primary keys and UUID foreign keys for relational columns in Drizzle schema tables.

## Default Rule

- Primary keys must be `id: uuid("id")` with `.primaryKey()`.
- Foreign key columns declared with `.references(...)` must be UUID-typed.

## Allowed Exceptions

Non-UUID identifiers are allowed only when they are not relational foreign keys and represent one of the following:

- Polymorphic identifiers where the target table varies by another column.
  - Example: `admin_activity_logs.entityId` paired with `entityType`.
- External/provider-controlled identifiers from third-party systems.
  - Examples: OAuth/provider IDs, credential IDs, opaque tokens.

## Constraints for Exceptions

- Exception columns must not use `.references(...)`.
- Exception columns must be explicitly documented in schema comments near the column.
- New exceptions require a rationale update in this file.

## Tooling

- Run `pnpm db:audit:uuid` to validate UUID primary-key and foreign-key rules across `lib/db/schema/*`.
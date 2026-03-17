type PostgresLikeError = {
  name?: string
  code?: string
  message?: string
  detail?: string
  cause?: unknown
}

type FallbackValue<T> = T | (() => T)

const SOFT_FAILURE_CODES = new Set([
  "42P01", // undefined_table
  "42703", // undefined_column
  "42702", // ambiguous_column
  "42P10", // invalid_column_reference
])

const loggedFailures = new Set<string>()

function extractPostgresLikeError(
  error: unknown,
  depth = 0,
): PostgresLikeError | null {
  if (!error || typeof error !== "object" || depth > 5) {
    return null
  }

  const candidate = error as PostgresLikeError

  if (
    candidate.name === "PostgresError" ||
    typeof candidate.code === "string" ||
    typeof candidate.detail === "string"
  ) {
    return candidate
  }

  if ("cause" in candidate) {
    return extractPostgresLikeError(candidate.cause, depth + 1)
  }

  return null
}

function isSoftCatalogReadFailure(error: unknown) {
  const pgError = extractPostgresLikeError(error)

  if (!pgError) {
    return false
  }

  if (pgError.code && SOFT_FAILURE_CODES.has(pgError.code)) {
    return true
  }

  const message = pgError.message?.toLowerCase() ?? ""
  return (
    message.includes("does not exist") ||
    message.includes("is ambiguous") ||
    message.includes("ambiguous") ||
    message.includes("column reference")
  )
}

function resolveFallback<T>(fallback: FallbackValue<T>) {
  return typeof fallback === "function" ? (fallback as () => T)() : fallback
}

function logCatalogReadFailure(operation: string, error: unknown) {
  const pgError = extractPostgresLikeError(error)
  const errorCode = pgError?.code ?? "unknown"
  const logKey = `${operation}:${errorCode}`

  if (loggedFailures.has(logKey)) {
    return
  }

  loggedFailures.add(logKey)
  console.error("[storefront-catalog-read] falling back to empty result", {
    operation,
    code: pgError?.code ?? null,
    message:
      pgError?.message ??
      (error instanceof Error ? error.message : "Unknown catalog read error"),
  })
}

export async function withStorefrontCatalogFallback<T>(
  operation: string,
  fallback: FallbackValue<T>,
  read: () => Promise<T>,
): Promise<T> {
  try {
    return await read()
  } catch (error) {
    if (!isSoftCatalogReadFailure(error)) {
      throw error
    }

    logCatalogReadFailure(operation, error)
    return resolveFallback(fallback)
  }
}

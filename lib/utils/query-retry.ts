const NON_RETRIABLE_MESSAGE_PATTERNS = [
  "authentication required",
  "unauthorized",
  "insufficient permission",
  "forbidden",
  "not found",
  "invalid",
  "required",
  "conflict",
]

export function isLikelyNonRetriableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return NON_RETRIABLE_MESSAGE_PATTERNS.some((pattern) =>
    message.includes(pattern),
  )
}

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (isLikelyNonRetriableError(error)) {
    return false
  }

  return failureCount < 2
}

export function shouldRetryMutation(_failureCount: number, _error: unknown) {
  return false
}

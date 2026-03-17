import { NextResponse } from "next/server"

export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR"

export type ApiError = {
  success: false
  error: {
    code: ApiErrorCode
    message: string
    details?: unknown
  }
}

export function ok<T>(data: T, status: number = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status })
}

export function fail(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown,
) {
  return NextResponse.json<ApiError>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    { status },
  )
}

const apiErrorStatus: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
}

export function inferApiErrorCode(
  message: string,
  fallback: ApiErrorCode = "BAD_REQUEST",
): ApiErrorCode {
  const normalized = message.toLowerCase()

  if (
    normalized.includes("authentication required") ||
    normalized.includes("unauthorized")
  ) {
    return "UNAUTHORIZED"
  }

  if (
    normalized.includes("insufficient permission") ||
    normalized.includes("forbidden") ||
    normalized.includes("not allowed")
  ) {
    return "FORBIDDEN"
  }

  if (normalized.includes("not found") || normalized.includes("no such")) {
    return "NOT_FOUND"
  }

  if (
    normalized.includes("already exists") ||
    normalized.includes("duplicate") ||
    normalized.includes("conflict")
  ) {
    return "CONFLICT"
  }

  if (
    normalized.includes("invalid") ||
    normalized.includes("required") ||
    normalized.includes("must be") ||
    normalized.includes("bad request")
  ) {
    return "BAD_REQUEST"
  }

  return fallback
}

export function failFromMessage(
  message: string,
  fallback: ApiErrorCode = "BAD_REQUEST",
  details?: unknown,
) {
  const code = inferApiErrorCode(message, fallback)
  return fail(code, message, apiErrorStatus[code], details)
}

export function mapErrorToApi(error: unknown) {
  if (error instanceof Error) {
    return failFromMessage(error.message, "INTERNAL_ERROR")
  }

  return fail("INTERNAL_ERROR", "Unexpected server error", 500)
}

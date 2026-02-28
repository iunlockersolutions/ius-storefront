type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } }

interface StaffCheckResponse {
  isStaff: boolean
  mustChangePassword?: boolean | null
  banned?: boolean | null
  banReason?: string | null
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null

  if (!response.ok || !payload?.success) {
    const message =
      payload && !payload.success ? payload.error.message : "Request failed"
    throw new Error(message)
  }

  return payload.data
}

export async function checkStaffLoginByApi(email: string) {
  const response = await fetch("/api/staff-auth/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })

  const data = await readApiResponse<StaffCheckResponse>(response)

  return {
    isStaff: Boolean(data.isStaff),
    mustChangePassword: Boolean(data.mustChangePassword),
    banned: Boolean(data.banned),
    banReason: data.banReason ?? null,
  }
}

export async function setMustChangePasswordCookieByApi(
  mustChangePassword: boolean,
) {
  const response = await fetch("/api/staff-auth/must-change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mustChangePassword }),
  })

  await readApiResponse<{ success: true }>(response)
}

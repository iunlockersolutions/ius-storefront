type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } }

type StaffRole = "admin" | "manager" | "support"

interface ActionResult {
  success: boolean
  error?: string
  message?: string
}

interface CreateStaffInput {
  name: string
  email: string
  role: StaffRole
}

interface UpdateStaffInput {
  id: string
  name?: string
  role?: StaffRole
}

async function requestAdminApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, init)
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

export async function createStaffUserByApi(input: CreateStaffInput) {
  return requestAdminApi<ActionResult & { userId?: string }>(
    "/api/admin/users/staff",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  )
}

export async function updateStaffUserByApi(input: UpdateStaffInput) {
  return requestAdminApi<ActionResult>(`/api/admin/users/staff/${input.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
    }),
  })
}

export async function banStaffUserByApi(userId: string) {
  return requestAdminApi<ActionResult>(`/api/admin/users/staff/${userId}/ban`, {
    method: "POST",
  })
}

export async function unbanStaffUserByApi(userId: string) {
  return requestAdminApi<ActionResult>(
    `/api/admin/users/staff/${userId}/unban`,
    {
      method: "POST",
    },
  )
}

export async function resetStaffPasswordByApi(userId: string) {
  return requestAdminApi<ActionResult>(
    `/api/admin/users/staff/${userId}/reset-password`,
    {
      method: "POST",
    },
  )
}

export async function deleteStaffUserByApi(userId: string) {
  return requestAdminApi<ActionResult>(`/api/admin/users/staff/${userId}`, {
    method: "DELETE",
  })
}

export async function revokeUserSessionByApi(
  sessionId: string,
  userId: string,
) {
  return requestAdminApi<ActionResult>(
    `/api/admin/users/staff/${userId}/sessions/${sessionId}`,
    {
      method: "DELETE",
    },
  )
}

export async function revokeAllUserSessionsByApi(userId: string) {
  return requestAdminApi<ActionResult>(
    `/api/admin/users/staff/${userId}/sessions`,
    {
      method: "DELETE",
    },
  )
}

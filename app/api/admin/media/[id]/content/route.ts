import { NextRequest, NextResponse } from "next/server"

import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { resolveMediaDelivery } from "@/lib/media/service"
import { fail, mapErrorToApi } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("product", "read")

    const { id } = await params
    const delivery = await resolveMediaDelivery(id)

    if (!delivery) {
      return fail("NOT_FOUND", "Media not found", 404)
    }

    return NextResponse.redirect(delivery.downloadUrl || delivery.url)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

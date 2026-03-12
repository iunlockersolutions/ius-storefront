import { NextRequest } from "next/server"

import { publishProduct } from "@/lib/actions/product"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import {
  fail,
  failFromMessage,
  mapErrorToApi,
  ok,
} from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("product", "update")

    const { id } = await params
    const product = await publishProduct(id)

    if (!product) {
      return fail("NOT_FOUND", "Product not found", 404)
    }

    await auditAdminMutation({
      action: "product.update",
      entityType: "product",
      entityId: id,
      details: {
        status: "active",
      },
    })

    return ok(product)
  } catch (error) {
    if (
      error instanceof Error &&
      Array.isArray(
        (error as Error & { publishErrors?: string[] }).publishErrors,
      )
    ) {
      const publishErrors = (error as Error & { publishErrors?: string[] })
        .publishErrors

      return fail("BAD_REQUEST", error.message, 400, {
        errors: publishErrors,
      })
    }

    if (error instanceof Error) {
      return failFromMessage(error.message, "BAD_REQUEST")
    }

    return mapErrorToApi(error)
  }
}

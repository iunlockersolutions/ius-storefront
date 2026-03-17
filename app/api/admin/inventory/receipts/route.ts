import { NextRequest } from "next/server"

import { receiveInventory } from "@/lib/actions/inventory"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { fail, mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiPermission("inventory", "adjust")

    const body = (await request.json()) as {
      variantId?: string
      quantity?: number
      notes?: string
      identifierTemplate?: Array<"serial" | "imei" | "imei2" | "barcode">
      units?: Array<{
        notes?: string
        identifiers?: Array<{
          type?: "serial" | "imei" | "imei2" | "barcode"
          value?: string
        }>
      }>
    }

    if (typeof body.variantId !== "string") {
      return fail("BAD_REQUEST", "Receipt requires a valid variant ID", 400)
    }

    const result = await receiveInventory({
      variantId: body.variantId,
      quantity: body.quantity,
      notes: body.notes,
      identifierTemplate: body.identifierTemplate,
      units: body.units?.map((unit) => ({
        notes: unit.notes,
        identifiers:
          unit.identifiers?.flatMap((identifier) =>
            typeof identifier.type === "string" &&
            typeof identifier.value === "string"
              ? [
                  {
                    type: identifier.type,
                    value: identifier.value,
                  },
                ]
              : [],
          ) ?? [],
      })),
    })

    await auditAdminMutation({
      action: "inventory.adjust",
      entityType: "inventory_variant",
      entityId: body.variantId,
      details: {
        type: "receipt",
        quantity: result.receivedQuantity,
      },
    })

    return ok(result, 201)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

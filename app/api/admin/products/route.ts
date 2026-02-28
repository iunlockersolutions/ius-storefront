import { NextRequest } from "next/server"

import { createProduct, getProducts } from "@/lib/actions/product"
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

function parsePositiveNumber(value: string | null, fallback: number) {
    if (!value) return fallback

    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback
    }

    return parsed
}

export async function GET(request: NextRequest) {
    try {
        await requireAdminApiPermission("product", "list")

        const searchParams = request.nextUrl.searchParams

        const page = parsePositiveNumber(searchParams.get("page"), 1)
        const limit = parsePositiveNumber(searchParams.get("limit"), 20)
        const search = searchParams.get("search") || undefined
        const status = searchParams.get("status") || undefined
        const categoryId = searchParams.get("categoryId") || undefined

        const products = await getProducts({
            page,
            limit,
            search,
            status,
            categoryId,
        })

        return ok(products)
    } catch (error) {
        return mapErrorToApi(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdminApiPermission("product", "create")

        const body = await request.json()
        const result = await createProduct(body)

        if (!result.success) {
            return failFromMessage(result.error || "Failed to create product", "BAD_REQUEST")
        }

        await auditAdminMutation({
            action: "product.create",
            entityType: "product",
            entityId: result.data?.id,
        })

        return ok(result.data, 201)
    } catch (error) {
        return mapErrorToApi(error)
    }
}

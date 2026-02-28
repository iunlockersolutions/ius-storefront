import { NextRequest } from "next/server"

import {
    deleteCategory,
    getCategory,
    updateCategory,
} from "@/lib/actions/category"
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

export async function GET(_request: NextRequest, { params }: RouteProps) {
    try {
        await requireAdminApiPermission("category", "read")

        const { id } = await params
        const category = await getCategory(id)

        if (!category) {
            return fail("NOT_FOUND", "Category not found", 404)
        }

        return ok(category)
    } catch (error) {
        return mapErrorToApi(error)
    }
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
    try {
        await requireAdminApiPermission("category", "update")

        const { id } = await params
        const body = await request.json()

        const updated = await updateCategory(id, body)

        await auditAdminMutation({
            action: "category.update",
            entityType: "category",
            entityId: id,
        })

        return ok(updated)
    } catch (error) {
        return mapErrorToApi(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
    try {
        await requireAdminApiPermission("category", "delete")

        const { id } = await params
        const result = await deleteCategory(id)

        if (!result.success) {
            return failFromMessage(result.error || "Failed to delete category", "BAD_REQUEST")
        }

        await auditAdminMutation({
            action: "category.delete",
            entityType: "category",
            entityId: id,
        })

        return ok(result)
    } catch (error) {
        return mapErrorToApi(error)
    }
}

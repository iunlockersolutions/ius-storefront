import { ActivityAction, logActivity } from "@/lib/actions/activity-log"
import { Action, requireResourcePermission, Resource } from "@/lib/auth/rbac"

export async function requireAdminApiPermission(
  resource: Resource,
  action: Action,
) {
  await requireResourcePermission(resource, action)
}

interface AdminMutationAuditOptions {
  action: ActivityAction
  entityType: string
  entityId?: string
  details?: Record<string, unknown>
}

export async function auditAdminMutation(options: AdminMutationAuditOptions) {
  await logActivity({
    action: options.action,
    entityType: options.entityType,
    entityId: options.entityId,
    details: options.details,
  })
}

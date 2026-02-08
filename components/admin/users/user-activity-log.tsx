"use client"

import { formatDistanceToNow } from "date-fns"
import {
  Activity,
  Boxes,
  CreditCard,
  FolderTree,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Star,
  User,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"

interface ActivityLog {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  details: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: Date
}

interface UserActivityLogProps {
  activities: ActivityLog[]
}

const actionIcons: Record<string, typeof Activity> = {
  user: User,
  product: Package,
  category: FolderTree,
  order: ShoppingCart,
  inventory: Boxes,
  payment: CreditCard,
  review: Star,
  settings: Settings,
  session: LogOut,
}

const actionColors: Record<string, string> = {
  create:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  update:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  delete:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  ban: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  unban:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  password_reset:
    "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
  role_change:
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  approve:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  reject:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  verify:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  revoke:
    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  adjust:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
}

function getActionVerb(action: string): { entityType: string; verb: string } {
  const parts = action.split(".")
  const entityType = parts[0] || "unknown"
  const verb = parts[1] || action
  return { entityType, verb }
}

function formatActionDescription(
  action: string,
  details: Record<string, unknown> | null,
): string {
  const { entityType, verb } = getActionVerb(action)

  const descriptions: Record<
    string,
    Record<string, string | ((d: Record<string, unknown> | null) => string)>
  > = {
    user: {
      create: (d) => `Created user ${d?.email || ""}`,
      update: (d) => `Updated user ${d?.email || d?.targetEmail || ""}`,
      delete: (d) => `Deleted user ${d?.deletedEmail || ""}`,
      ban: (d) =>
        `Banned user ${d?.email || d?.targetEmail || ""}${d?.reason ? `: ${d.reason}` : ""}`,
      unban: (d) => `Unbanned user ${d?.email || d?.targetEmail || ""}`,
      password_reset: (d) =>
        `Reset password for ${d?.email || d?.targetEmail || ""}`,
      role_change: (d) =>
        `Changed role for ${d?.email || d?.targetEmail || ""} to ${d?.newRole || ""}`,
    },
    product: {
      create: (d) => `Created product ${d?.name || ""}`,
      update: (d) => `Updated product ${d?.name || ""}`,
      delete: (d) => `Deleted product ${d?.name || ""}`,
      status_change: (d) => `Changed product status to ${d?.status || ""}`,
    },
    category: {
      create: (d) => `Created category ${d?.name || ""}`,
      update: (d) => `Updated category ${d?.name || ""}`,
      delete: (d) => `Deleted category ${d?.name || ""}`,
    },
    order: {
      update_status: (d) => `Updated order status to ${d?.status || ""}`,
      cancel: "Cancelled order",
      refund: "Refunded order",
    },
    inventory: {
      adjust: (d) => `Adjusted inventory by ${d?.quantity || 0}`,
      reserve: "Reserved inventory",
      release: "Released inventory",
    },
    payment: {
      verify: "Verified payment",
      refund: "Refunded payment",
    },
    review: {
      approve: "Approved review",
      reject: "Rejected review",
      delete: "Deleted review",
    },
    settings: {
      update: (d) => `Updated setting ${d?.key || ""}`,
    },
    session: {
      revoke: "Revoked session",
      revoke_all: "Revoked all sessions",
    },
  }

  const entityDescriptions = descriptions[entityType]
  if (!entityDescriptions) {
    return `${verb.replace("_", " ")} ${entityType}`
  }

  const description = entityDescriptions[verb]
  if (typeof description === "function") {
    return description(details)
  }
  if (typeof description === "string") {
    return description
  }

  return `${verb.replace("_", " ")} ${entityType}`
}

export function UserActivityLog({ activities }: UserActivityLogProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p>No activity recorded</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const { entityType, verb } = getActionVerb(activity.action)
        const Icon = actionIcons[entityType] || Activity
        const colorClass =
          actionColors[verb] || "bg-gray-100 text-gray-700 border-gray-200"

        return (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-4 rounded-lg border bg-card"
          >
            <div className={`rounded-lg p-2 ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                {formatActionDescription(activity.action, activity.details)}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs capitalize">
                  {entityType}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {activity.ipAddress && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {activity.ipAddress}
                  </span>
                )}
              </div>
              {activity.entityId && (
                <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                  ID: {activity.entityId}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

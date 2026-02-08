"use client"

import {
  BarChart3,
  Boxes,
  Check,
  CreditCard,
  FolderTree,
  Package,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Star,
  User,
  Users,
  X,
} from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Role definitions with their descriptions and permissions
const roleDefinitions = {
  admin: {
    name: "Administrator",
    description:
      "Full system access with all permissions. Can manage staff users and system settings.",
    icon: ShieldAlert,
    color:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    permissions: {
      product: ["create", "read", "update", "delete", "list"],
      category: ["create", "read", "update", "delete", "list"],
      order: ["read", "update", "list", "cancel", "refund"],
      inventory: ["read", "update", "adjust", "list"],
      payment: ["read", "verify", "refund", "list"],
      review: ["read", "approve", "reject", "delete", "list"],
      customer: ["read", "update", "ban", "list"],
      staff: ["create", "read", "update", "delete", "list", "invite"],
      settings: ["read", "update"],
      reports: ["read", "export"],
    },
  },
  manager: {
    name: "Manager",
    description:
      "Full product and inventory management. Can manage orders and customers but cannot manage staff or settings.",
    icon: ShieldCheck,
    color:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    permissions: {
      product: ["create", "read", "update", "delete", "list"],
      category: ["create", "read", "update", "delete", "list"],
      order: ["read", "update", "list", "cancel", "refund"],
      inventory: ["read", "update", "adjust", "list"],
      payment: ["read", "verify", "refund", "list"],
      review: ["read", "approve", "reject", "delete", "list"],
      customer: ["read", "update", "list"],
      staff: [],
      settings: [],
      reports: ["read"],
    },
  },
  support: {
    name: "Support",
    description:
      "Can view orders, assist customers, and moderate reviews. Cannot modify products or settings.",
    icon: Shield,
    color:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    permissions: {
      product: [],
      category: [],
      order: ["read", "update", "list"],
      inventory: [],
      payment: ["read", "list"],
      review: ["read", "approve", "reject", "list"],
      customer: ["read", "list"],
      staff: [],
      settings: [],
      reports: [],
    },
  },
  customer: {
    name: "Customer",
    description: "Regular customer account. No admin panel access.",
    icon: User,
    color:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    permissions: {
      product: [],
      category: [],
      order: [],
      inventory: [],
      payment: [],
      review: [],
      customer: [],
      staff: [],
      settings: [],
      reports: [],
    },
  },
}

const resourceIcons: Record<string, typeof Package> = {
  product: Package,
  category: FolderTree,
  order: ShoppingCart,
  inventory: Boxes,
  payment: CreditCard,
  review: Star,
  customer: User,
  staff: Users,
  settings: Settings,
  reports: BarChart3,
}

export const allActions = [
  "create",
  "read",
  "update",
  "delete",
  "list",
  "verify",
  "approve",
  "reject",
  "cancel",
  "refund",
  "ban",
  "invite",
  "adjust",
  "export",
]

export type RoleName = keyof typeof roleDefinitions

interface PermissionCellProps {
  hasPermission: boolean
}

function PermissionCell({ hasPermission }: PermissionCellProps) {
  if (hasPermission) {
    return <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
  }
  return <X className="h-4 w-4 text-muted-foreground/30" />
}

export function RolesTable() {
  const staffRoles = ["admin", "manager", "support"] as const

  return (
    <div className="space-y-6">
      {/* Role Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {staffRoles.map((roleName) => {
          const role = roleDefinitions[roleName]
          const Icon = role.icon
          const permissionCount = Object.values(role.permissions).flat().length

          return (
            <div key={roleName} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${role.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{role.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {permissionCount} permissions
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {role.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Detailed Permission Matrix */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="matrix">
          <AccordionTrigger className="text-sm font-medium">
            View Detailed Permission Matrix
          </AccordionTrigger>
          <AccordionContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Resource</TableHead>
                    <TableHead className="w-[120px]">Action</TableHead>
                    {staffRoles.map((role) => (
                      <TableHead key={role} className="text-center w-[100px]">
                        <Badge
                          variant="outline"
                          className={roleDefinitions[role].color}
                        >
                          {roleDefinitions[role].name}
                        </Badge>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(roleDefinitions.admin.permissions).map(
                    ([resource, actions]) => (
                      <>
                        {actions.map((action, index) => (
                          <TableRow key={`${resource}-${action}`}>
                            {index === 0 && (
                              <TableCell
                                rowSpan={actions.length}
                                className="font-medium align-top"
                              >
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const Icon = resourceIcons[resource]
                                    return Icon ? (
                                      <Icon className="h-4 w-4 text-muted-foreground" />
                                    ) : null
                                  })()}
                                  <span className="capitalize">{resource}</span>
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="capitalize text-muted-foreground">
                              {action}
                            </TableCell>
                            {staffRoles.map((roleName) => (
                              <TableCell
                                key={`${roleName}-${resource}-${action}`}
                                className="text-center"
                              >
                                <div className="flex justify-center">
                                  <PermissionCell
                                    hasPermission={
                                      (
                                        roleDefinitions[roleName].permissions[
                                          resource as keyof typeof roleDefinitions.admin.permissions
                                        ] as string[] | undefined
                                      )?.includes(action) ?? false
                                    }
                                  />
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Permission Summary by Resource */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Permission Summary by Resource</h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(roleDefinitions.admin.permissions).map(
            ([resource, actions]) => {
              const Icon = resourceIcons[resource]
              return (
                <div key={resource} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-medium capitalize text-sm">
                      {resource}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {actions.map((action) => (
                      <Badge
                        key={action}
                        variant="secondary"
                        className="text-xs capitalize"
                      >
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            },
          )}
        </div>
      </div>
    </div>
  )
}

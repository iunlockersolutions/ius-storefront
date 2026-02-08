"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  Calendar,
  DollarSign,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Shield,
  ShoppingBag,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { assignRole, removeRole } from "@/lib/actions/customer"

interface CustomerDetailProps {
  customer: {
    user: {
      id: string
      name: string | null
      email: string
      emailVerified: boolean
      image: string | null
      createdAt: Date
    }
    profile: {
      id: string
      phone: string | null
      dateOfBirth: Date | null
      marketingOptIn: boolean
    } | null
    addresses: Array<{
      id: string
      type: string
      isDefault: boolean
      label: string | null
      recipientName: string
      phone: string
      addressLine1: string
      addressLine2: string | null
      city: string
      state: string | null
      postalCode: string
      country: string
    }>
    roles: Array<{ roleId: string; roleName: string }>
    stats: {
      totalOrders: number
      totalSpent: number
    }
  }
  orders: Array<{
    id: string
    orderNumber: string
    status: string
    total: string
    createdAt: Date
  }>
  ordersPagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  allRoles: Array<{ id: string; name: string }>
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  return email.charAt(0).toUpperCase()
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_payment: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  processing: "bg-blue-100 text-blue-800",
  packing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-orange-100 text-orange-800",
}

export function CustomerDetail({
  customer,
  orders,
  allRoles,
}: CustomerDetailProps) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [isAddingRole, setIsAddingRole] = useState(false)
  const [removingRoleId, setRemovingRoleId] = useState<string | null>(null)

  const availableRoles = allRoles.filter(
    (role) => !customer.roles.some((r) => r.roleId === role.id),
  )

  async function handleAddRole() {
    if (!selectedRole) return

    setIsAddingRole(true)
    const result = await assignRole(customer.user.id, selectedRole)
    setIsAddingRole(false)

    if (result.success) {
      toast.success("Role assigned successfully")
      setSelectedRole("")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to assign role")
    }
  }

  async function handleRemoveRole(roleId: string) {
    setRemovingRoleId(roleId)
    const result = await removeRole(customer.user.id, roleId)
    setRemovingRoleId(null)

    if (result.success) {
      toast.success("Role removed successfully")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to remove role")
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={customer.user.image || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(customer.user.name, customer.user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">
                  {customer.user.name || "No name"}
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Mail className="h-4 w-4" />
                  <span>{customer.user.email}</span>
                  {customer.user.emailVerified && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Verified
                    </Badge>
                  )}
                </div>
                {customer.profile?.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Phone className="h-4 w-4" />
                    <span>{customer.profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(customer.user.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {customer.stats.totalOrders}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(customer.stats.totalSpent)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No orders yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={STATUS_COLORS[order.status] || ""}
                        >
                          {order.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(parseFloat(order.total))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Roles */}
            <div className="flex flex-wrap gap-2">
              {customer.roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No roles assigned
                </p>
              ) : (
                customer.roles.map((role) => (
                  <Badge
                    key={role.roleId}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {role.roleName}
                    <button
                      onClick={() => handleRemoveRole(role.roleId)}
                      disabled={removingRoleId === role.roleId}
                      className="ml-1 hover:text-destructive"
                    >
                      {removingRoleId === role.roleId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </button>
                  </Badge>
                ))
              )}
            </div>

            {/* Add Role */}
            {availableRoles.length > 0 && (
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  onClick={handleAddRole}
                  disabled={!selectedRole || isAddingRole}
                >
                  {isAddingRole ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No addresses saved
              </p>
            ) : (
              <div className="space-y-4">
                {customer.addresses.map((address) => (
                  <div
                    key={address.id}
                    className="p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {address.label && (
                        <Badge variant="outline">{address.label}</Badge>
                      )}
                      {address.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <p className="font-medium">{address.recipientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.country}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {address.phone}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

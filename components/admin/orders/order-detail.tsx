"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Package,
  RefreshCw,
  Truck,
  User,
  XCircle,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateOrderNotes, updateOrderStatus } from "@/lib/actions/order"
import { getValidTransitions } from "@/lib/utils/order-status"

// Types
interface ShippingAddress {
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  instructions?: string
}

interface BillingAddress {
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  postalCode: string
  country: string
}

interface OrderItem {
  id: string
  quantity: number
  unitPrice: string
  subtotal: string
  productName: string
  variantName: string
  sku: string
  variant: {
    id: string | null
    name: string | null
    sku: string | null
  } | null
}

interface StatusHistoryEntry {
  id: string
  fromStatus: string | null
  toStatus: string
  notes: string | null
  createdAt: Date
  changedBy: {
    id: string | null
    name: string | null
    email: string | null
  } | null
}

interface Order {
  id: string
  orderNumber: string
  status: string
  subtotal: string
  taxAmount: string
  shippingCost: string
  discountAmount: string
  total: string
  notes: string | null
  adminNotes: string | null
  customerEmail: string
  customerPhone: string | null
  customerName: string | null
  shippingAddress: ShippingAddress | null
  billingAddress: BillingAddress | null
  createdAt: Date
  updatedAt: Date
  customer: {
    id: string | null
    name: string | null
    email: string | null
  } | null
  items: OrderItem[]
  statusHistory: StatusHistoryEntry[]
}

interface OrderDetailProps {
  order: Order
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: Clock },
  pending_payment: {
    label: "Pending Payment",
    color: "bg-yellow-100 text-yellow-800",
    icon: CreditCard,
  },
  paid: {
    label: "Paid",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle,
  },
  processing: {
    label: "Processing",
    color: "bg-indigo-100 text-indigo-800",
    icon: RefreshCw,
  },
  packing: {
    label: "Packing",
    color: "bg-purple-100 text-purple-800",
    icon: Package,
  },
  shipped: {
    label: "Shipped",
    color: "bg-cyan-100 text-cyan-800",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    color: "bg-orange-100 text-orange-800",
    icon: AlertCircle,
  },
}

function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    label: status,
    color: "bg-gray-100 text-gray-800",
    icon: Clock,
  }
  const Icon = config.icon
  return (
    <Badge className={`${config.color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

function AddressCard({
  title,
  address,
  icon: Icon,
}: {
  title: string
  address: ShippingAddress | BillingAddress | null
  icon: React.ElementType
}) {
  if (!address) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No address provided</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        <p className="font-medium">{address.recipientName}</p>
        <p>{address.addressLine1}</p>
        {address.addressLine2 && <p>{address.addressLine2}</p>}
        <p>
          {address.city}
          {address.state && `, ${address.state}`} {address.postalCode}
        </p>
        <p>{address.country}</p>
        <p className="text-muted-foreground">{address.phone}</p>
        {"instructions" in address && address.instructions && (
          <p className="text-muted-foreground italic mt-2">
            Note: {address.instructions}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function OrderDetail({ order }: OrderDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [statusNote, setStatusNote] = useState("")
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || "")
  const [error, setError] = useState<string | null>(null)

  const validTransitions = getValidTransitions(order.status)

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return
    setError(null)

    startTransition(async () => {
      const result = await updateOrderStatus({
        orderId: order.id,
        status: selectedStatus as
          | "draft"
          | "pending_payment"
          | "paid"
          | "processing"
          | "packing"
          | "shipped"
          | "delivered"
          | "cancelled"
          | "refunded",
        notes: statusNote || undefined,
      })

      if (result.success) {
        setSelectedStatus("")
        setStatusNote("")
        router.refresh()
      } else {
        setError(result.error || "Failed to update status")
      }
    })
  }

  const handleNotesUpdate = async () => {
    setError(null)
    startTransition(async () => {
      const result = await updateOrderNotes(order.id, adminNotes)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || "Failed to update notes")
      }
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Order Header */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge status={order.status} />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(order.createdAt)}</p>
              <p className="text-xs text-muted-foreground">
                Updated: {formatDate(order.updatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {order.customer?.name || order.customerName || "Guest"}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {order.customer?.email || order.customerEmail}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items & Addresses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
              <CardDescription>
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}{" "}
                in this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">
                        Product
                      </th>
                      <th className="text-center p-3 text-sm font-medium">
                        Qty
                      </th>
                      <th className="text-right p-3 text-sm font-medium">
                        Price
                      </th>
                      <th className="text-right p-3 text-sm font-medium">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.variantName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.sku}
                          </p>
                        </td>
                        <td className="text-center p-3">{item.quantity}</td>
                        <td className="text-right p-3">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="text-right p-3 font-medium">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30">
                    <tr>
                      <td colSpan={3} className="text-right p-3 text-sm">
                        Subtotal
                      </td>
                      <td className="text-right p-3 font-medium">
                        {formatCurrency(order.subtotal)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="text-right p-3 text-sm">
                        Shipping
                      </td>
                      <td className="text-right p-3">
                        {formatCurrency(order.shippingCost)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="text-right p-3 text-sm">
                        Tax
                      </td>
                      <td className="text-right p-3">
                        {formatCurrency(order.taxAmount)}
                      </td>
                    </tr>
                    {parseFloat(order.discountAmount) > 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-right p-3 text-sm text-green-600"
                        >
                          Discount
                        </td>
                        <td className="text-right p-3 text-green-600">
                          -{formatCurrency(order.discountAmount)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t">
                      <td colSpan={3} className="text-right p-3 font-bold">
                        Total
                      </td>
                      <td className="text-right p-3 font-bold text-lg">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <div className="grid md:grid-cols-2 gap-4">
            <AddressCard
              title="Shipping Address"
              address={order.shippingAddress}
              icon={Truck}
            />
            <AddressCard
              title="Billing Address"
              address={order.billingAddress}
              icon={CreditCard}
            />
          </div>

          {/* Customer Notes */}
          {order.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          {/* Update Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update Status</CardTitle>
              <CardDescription>
                Change the order status and notify the customer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {validTransitions.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label>New Status</Label>
                    <Select
                      value={selectedStatus}
                      onValueChange={setSelectedStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        {validTransitions.map((status) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              {statusConfig[status]?.label || status}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Note (optional)</Label>
                    <Textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Add a note about this status change..."
                      rows={2}
                    />
                  </div>

                  {selectedStatus === "cancelled" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="w-full"
                          disabled={isPending}
                        >
                          Cancel Order
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Cancel this order?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will cancel the order. The customer will
                            be notified. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Order</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleStatusUpdate}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, Cancel Order
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {selectedStatus && selectedStatus !== "cancelled" && (
                    <Button
                      onClick={handleStatusUpdate}
                      disabled={isPending}
                      className="w-full"
                    >
                      {isPending ? "Updating..." : "Update Status"}
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No status changes available for this order.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Admin Notes</CardTitle>
              <CardDescription>
                Internal notes (not visible to customer)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes..."
                rows={4}
              />
              <Button
                variant="outline"
                onClick={handleNotesUpdate}
                disabled={isPending || adminNotes === (order.adminNotes || "")}
                className="w-full"
              >
                {isPending ? "Saving..." : "Save Notes"}
              </Button>
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {order.statusHistory.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`relative pl-6 pb-4 ${
                        index !== order.statusHistory.length - 1
                          ? "border-l-2 border-muted"
                          : ""
                      }`}
                    >
                      <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.fromStatus && (
                            <>
                              <StatusBadge status={entry.fromStatus} />
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            </>
                          )}
                          <StatusBadge status={entry.toStatus} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.createdAt)}
                          {entry.changedBy?.name && (
                            <> by {entry.changedBy.name}</>
                          )}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No status changes recorded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

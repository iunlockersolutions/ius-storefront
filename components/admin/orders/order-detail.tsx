"use client"

import { type ComponentType, useMemo, useState, useTransition } from "react"

import {
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Package2,
  ReceiptText,
  ScanBarcode,
  ShieldCheck,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react"

import { OrderPackingCard } from "@/components/admin/orders/order-packing-card"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  useUpdateOrderNotesMutation,
  useUpdateOrderStatusMutation,
} from "@/hooks/admin/use-order-mutations"
import type {
  AdminOrder,
  AdminOrderFulfillmentStatus,
  AdminOrderPaymentStatus,
  AdminOrderStatus,
} from "@/lib/types/admin-order"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { getValidTransitions } from "@/lib/utils/order-status"

interface OrderDetailProps {
  order: AdminOrder
  onRefetch: () => Promise<unknown>
}

function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: "default" | "success" | "warning" | "danger" | "info" | "muted"
}) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : tone === "danger"
          ? "border-red-200 bg-red-50 text-red-900"
          : tone === "info"
            ? "border-sky-200 bg-sky-50 text-sky-900"
            : tone === "muted"
              ? "border-border/80 bg-muted/40 text-muted-foreground"
              : "border-border/80 bg-background text-foreground"

  return (
    <Badge variant="outline" className={cn("capitalize", className)}>
      {label}
    </Badge>
  )
}

function PaymentStatusBadge({ status }: { status: AdminOrderPaymentStatus }) {
  const tone =
    status === "paid"
      ? "success"
      : status === "pending_verification"
        ? "warning"
        : status === "authorized"
          ? "info"
          : status === "failed" || status === "cancelled"
            ? "danger"
            : status === "refunded"
              ? "muted"
              : "default"

  return <StatusBadge label={status.replaceAll("_", " ")} tone={tone} />
}

function FulfillmentStatusBadge({
  status,
}: {
  status: AdminOrderFulfillmentStatus
}) {
  const tone =
    status === "delivered"
      ? "success"
      : status === "shipped"
        ? "info"
        : status === "packing" || status === "processing"
          ? "warning"
          : status === "cancelled"
            ? "danger"
            : "default"

  return <StatusBadge label={status.replaceAll("_", " ")} tone={tone} />
}

function LifecycleStatusBadge({ status }: { status: AdminOrderStatus }) {
  const tone =
    status === "delivered" || status === "paid"
      ? "success"
      : status === "pending_payment" || status === "packing"
        ? "warning"
        : status === "shipped" || status === "processing"
          ? "info"
          : status === "cancelled" || status === "refunded"
            ? "danger"
            : "default"

  return <StatusBadge label={status.replaceAll("_", " ")} tone={tone} />
}

function AddressCard({
  title,
  address,
  icon: Icon,
}: {
  title: string
  address: AdminOrder["shippingAddress"] | AdminOrder["billingAddress"] | null
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {address ? (
          <>
            <p className="font-medium">{address.recipientName}</p>
            <p>{address.addressLine1}</p>
            {address.addressLine2 ? <p>{address.addressLine2}</p> : null}
            <p>
              {address.city}
              {address.state ? `, ${address.state}` : ""} {address.postalCode}
            </p>
            <p>{address.country}</p>
            <p className="text-muted-foreground">{address.phone}</p>
            {"instructions" in address && address.instructions ? (
              <p className="pt-2 text-muted-foreground">
                Delivery note: {address.instructions}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground">No address captured.</p>
        )}
      </CardContent>
    </Card>
  )
}

function getTransitionLabel(status: string) {
  switch (status) {
    case "paid":
      return "Mark as paid"
    case "processing":
      return "Move to processing"
    case "delivered":
      return "Mark delivered"
    case "cancelled":
      return "Cancel order"
    case "refunded":
      return "Mark refunded"
    default:
      return `Move to ${status.replaceAll("_", " ")}`
  }
}

export function OrderDetail({ order, onRefetch }: OrderDetailProps) {
  const [isPending, startTransition] = useTransition()
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || "")
  const [error, setError] = useState<string | null>(null)
  const [selectedTransition, setSelectedTransition] =
    useState<AdminOrderStatus | null>(null)
  const [statusNote, setStatusNote] = useState("")
  const updateOrderStatusMutation = useUpdateOrderStatusMutation(order.id)
  const updateOrderNotesMutation = useUpdateOrderNotesMutation(order.id)

  const availableTransitions = useMemo(
    () =>
      getValidTransitions(order.status).filter(
        (status) => status !== "packing" && status !== "shipped",
      ) as AdminOrderStatus[],
    [order.status],
  )

  async function handleStatusUpdate(nextStatus = selectedTransition) {
    if (!nextStatus) {
      return
    }

    setError(null)

    startTransition(async () => {
      try {
        await updateOrderStatusMutation.mutateAsync({
          status: nextStatus,
          notes: statusNote.trim() || undefined,
        })
        setSelectedTransition(null)
        setStatusNote("")
        await onRefetch()
      } catch (mutationError) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : "Failed to update order status",
        )
      }
    })
  }

  async function handleNotesUpdate() {
    setError(null)

    startTransition(async () => {
      try {
        await updateOrderNotesMutation.mutateAsync(adminNotes)
        await onRefetch()
      } catch (mutationError) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : "Failed to update notes",
        )
      }
    })
  }

  const totalAssignedSerializedUnits = order.items.reduce(
    (sum, item) => sum + item.packing.assignedUnitCount,
    0,
  )
  const totalCommittedUnits = order.items.reduce(
    (sum, item) => sum + item.progress.committedQuantity,
    0,
  )

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ReceiptText className="h-4 w-4" />
              Lifecycle
            </div>
            <LifecycleStatusBadge status={order.status} />
            <p className="text-sm text-muted-foreground">
              Placed{" "}
              {formatDate(order.placedAt, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Payment
            </div>
            <PaymentStatusBadge status={order.paymentStatus} />
            <p className="text-lg font-semibold">
              {formatCurrency(order.total)}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              {order.paymentMethod?.replaceAll("_", " ") ||
                "Payment method not set"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              Fulfillment
            </div>
            <FulfillmentStatusBadge status={order.fulfillmentStatus} />
            <p className="text-sm text-muted-foreground capitalize">
              {order.shippingMethod.replaceAll("_", " ")}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.shipments.length > 0
                ? `${order.shipments.length} shipment record${
                    order.shipments.length !== 1 ? "s" : ""
                  }`
                : "No shipment created yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserRound className="h-4 w-4" />
              Customer
            </div>
            <p className="font-semibold">
              {order.customerName || order.customer?.name || "Guest checkout"}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.customerEmail}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.customerPhone || "No phone captured"}
            </p>
            <Badge variant="outline">
              {order.customer?.id ? "Registered" : "Guest"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <OrderPackingCard order={order} onRefetch={onRefetch} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-5 w-5" />
                Line Items
              </CardTitle>
              <CardDescription>
                Snapshot data, sellable commitment, and preparing progress for
                every order line.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Committed
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {totalCommittedUnits}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Serialized assigned
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {totalAssignedSerializedUnits}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Ready lines
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {
                      order.items.filter((item) => item.progress.isReadyToShip)
                        .length
                    }
                    /{order.items.length}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {order.items.map((item) => {
                  const activeAssignments = item.packing.assignments.filter(
                    (assignment) => assignment.unassignedAt === null,
                  )

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border/70 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{item.productName}</p>
                            <Badge variant="outline">{item.variantName}</Badge>
                            <Badge variant="outline">SKU {item.sku}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge
                              label={
                                item.packing.manageInventory
                                  ? item.packing.trackingMode || "tracked"
                                  : "not managed"
                              }
                              tone={
                                item.packing.trackingMode === "serial"
                                  ? "warning"
                                  : item.packing.trackingMode === "quantity"
                                    ? "info"
                                    : "muted"
                              }
                            />
                            <StatusBadge
                              label={
                                item.progress.isReadyToShip
                                  ? "ready to ship"
                                  : item.progress.blockedReason || "in progress"
                              }
                              tone={
                                item.progress.isReadyToShip
                                  ? "success"
                                  : "warning"
                              }
                            />
                          </div>
                        </div>

                        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:min-w-[22rem]">
                          <div>
                            <p className="text-xs uppercase tracking-[0.14em]">
                              Quantity
                            </p>
                            <p className="mt-1 font-semibold text-foreground">
                              {item.quantity}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.14em]">
                              Line total
                            </p>
                            <p className="mt-1 font-semibold text-foreground">
                              {formatCurrency(item.subtotal)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.14em]">
                              Committed
                            </p>
                            <p className="mt-1 font-semibold text-foreground">
                              {item.progress.committedQuantity}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.14em]">
                              Preparing
                            </p>
                            <p className="mt-1 font-semibold text-foreground">
                              {item.progress.preparingQuantity}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.14em]">
                              Remaining to assign
                            </p>
                            <p className="mt-1 font-semibold text-foreground">
                              {item.progress.remainingToAssign}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.14em]">
                              Remaining to ship
                            </p>
                            <p className="mt-1 font-semibold text-foreground">
                              {item.progress.remainingToShip}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)]">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            Inventory snapshot
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
                              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                Unit price
                              </p>
                              <p className="mt-1 font-medium">
                                {formatCurrency(item.unitPrice)}
                              </p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
                              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                Identifier types
                              </p>
                              <p className="mt-1 font-medium">
                                {item.snapshot.receiptIdentifierTypes.length > 0
                                  ? item.snapshot.receiptIdentifierTypes
                                      .map((value) => value.toUpperCase())
                                      .join(", ")
                                  : "Not required"}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
                            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                              Allocation history
                            </p>
                            {item.packing.allocations.length > 0 ? (
                              <div className="mt-2 space-y-2">
                                {item.packing.allocations.map((allocation) => (
                                  <div
                                    key={allocation.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2"
                                  >
                                    <span>{allocation.quantity} unit(s)</span>
                                    <span className="text-muted-foreground">
                                      {allocation.releasedAt
                                        ? "released"
                                        : "active"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-muted-foreground">
                                No preparing allocations yet.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <ScanBarcode className="h-4 w-4 text-muted-foreground" />
                            Serialized assignments
                          </div>
                          {item.packing.trackingMode === "serial" ? (
                            activeAssignments.length > 0 ? (
                              <div className="space-y-2">
                                {activeAssignments.map((assignment) => (
                                  <div
                                    key={assignment.id}
                                    className="rounded-xl border border-border/70 p-3"
                                  >
                                    <div className="flex flex-wrap gap-2">
                                      {assignment.identifiers.map(
                                        (identifier) => (
                                          <Badge
                                            key={identifier.id}
                                            variant="secondary"
                                          >
                                            {identifier.type.toUpperCase()}:{" "}
                                            {identifier.value}
                                          </Badge>
                                        ),
                                      )}
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      Unit status {assignment.unitStatus}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                                No serialized units assigned yet. This line
                                cannot become ready to ship until the preparing
                                step scans or enters all required identifiers.
                              </div>
                            )
                          ) : (
                            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                              Quantity-managed line. No serial or IMEI capture
                              is required.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
                <CardDescription>
                  Payment attempts, proof uploads, and processing timestamps.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.payments.length > 0 ? (
                  order.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-2xl border border-border/70 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium capitalize">
                            {payment.method.replaceAll("_", " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                        <StatusBadge
                          label={payment.status.replaceAll("_", " ")}
                          tone={
                            payment.status === "completed"
                              ? "success"
                              : payment.status === "failed" ||
                                  payment.status === "cancelled"
                                ? "danger"
                                : payment.status === "refunded"
                                  ? "muted"
                                  : "warning"
                          }
                        />
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <p>
                          Created{" "}
                          {formatDate(payment.createdAt, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        {payment.processedAt ? (
                          <p>
                            Processed{" "}
                            {formatDate(payment.processedAt, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        ) : null}
                        {payment.externalId ? (
                          <p>Reference {payment.externalId}</p>
                        ) : null}
                        {payment.externalStatus ? (
                          <p>Gateway status {payment.externalStatus}</p>
                        ) : null}
                        {payment.failureReason ? (
                          <p className="text-destructive">
                            Failure: {payment.failureReason}
                          </p>
                        ) : null}
                      </div>

                      {payment.proofs.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Proof uploads
                          </p>
                          {payment.proofs.map((proof) => (
                            <div
                              key={proof.id}
                              className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-medium">{proof.fileName}</p>
                                <StatusBadge
                                  label={
                                    proof.verifiedAt
                                      ? proof.isApproved
                                        ? "approved"
                                        : "rejected"
                                      : "pending"
                                  }
                                  tone={
                                    proof.verifiedAt
                                      ? proof.isApproved
                                        ? "success"
                                        : "danger"
                                      : "warning"
                                  }
                                />
                              </div>
                              {proof.notes ? (
                                <p className="mt-2 text-muted-foreground">
                                  Customer note: {proof.notes}
                                </p>
                              ) : null}
                              {proof.verificationNotes ? (
                                <p className="mt-2 text-muted-foreground">
                                  Review note: {proof.verificationNotes}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                    No payment records have been created for this order yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipment History
                </CardTitle>
                <CardDescription>
                  Carrier details, tracking, and delivery confirmation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.shipments.length > 0 ? (
                  order.shipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="rounded-2xl border border-border/70 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {shipment.carrier || "Carrier pending"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {shipment.trackingNumber || "No tracking number"}
                          </p>
                        </div>
                        <StatusBadge
                          label={
                            shipment.deliveredAt ? "delivered" : "in transit"
                          }
                          tone={shipment.deliveredAt ? "success" : "info"}
                        />
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {shipment.shippedAt ? (
                          <p>
                            Shipped{" "}
                            {formatDate(shipment.shippedAt, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        ) : null}
                        {shipment.deliveredAt ? (
                          <p>
                            Delivered{" "}
                            {formatDate(shipment.deliveredAt, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        ) : null}
                        {shipment.trackingUrl ? (
                          <a
                            href={shipment.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            Open tracking link
                          </a>
                        ) : null}
                        {shipment.notes ? <p>Note: {shipment.notes}</p> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                    No shipment events yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AddressCard
              title="Shipping Address"
              address={order.shippingAddress}
              icon={MapPin}
            />
            <AddressCard
              title="Billing Address"
              address={order.billingAddress}
              icon={CreditCard}
            />
          </div>

          {order.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4" />
                Order Actions
              </CardTitle>
              <CardDescription>
                Use preparing for serial assignment and shipment. Other
                transitions stay explicit and audited.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableTransitions.length > 0 ? (
                availableTransitions.map((transition) =>
                  transition === "cancelled" ? (
                    <AlertDialog key={transition}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="w-full justify-between"
                        >
                          {getTransitionLabel(transition)}
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Cancel this order?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This releases committed or preparing stock and marks
                            the order as cancelled.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep order</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => void handleStatusUpdate("cancelled")}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Confirm cancellation
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button
                      key={transition}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => {
                        setSelectedTransition(transition)
                        setStatusNote("")
                      }}
                    >
                      {getTransitionLabel(transition)}
                      <Clock3 className="h-4 w-4" />
                    </Button>
                  ),
                )
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  No direct status transitions are available. Use the preparing
                  flow for packing and shipping work.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Admin Notes</CardTitle>
              <CardDescription>
                Internal notes for processing, fraud review, or shipping
                context.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                rows={6}
                placeholder="Add internal notes for this order..."
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={isPending || adminNotes === (order.adminNotes || "")}
                onClick={() => void handleNotesUpdate()}
              >
                Save notes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
              <CardDescription>
                Audit trail for every order status transition.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {order.statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {order.statusHistory.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "relative pl-6",
                        index !== order.statusHistory.length - 1
                          ? "border-l border-border pb-4"
                          : "",
                      )}
                    >
                      <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {entry.fromStatus ? (
                            <LifecycleStatusBadge
                              status={entry.fromStatus as AdminOrderStatus}
                            />
                          ) : null}
                          <span className="text-xs text-muted-foreground">
                            to
                          </span>
                          <LifecycleStatusBadge
                            status={entry.toStatus as AdminOrderStatus}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.createdAt, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                          {entry.changedBy?.name
                            ? ` by ${entry.changedBy.name}`
                            : ""}
                        </p>
                        {entry.notes ? (
                          <p className="text-sm text-muted-foreground">
                            {entry.notes}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No audit history yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={selectedTransition !== null && selectedTransition !== "cancelled"}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTransition(null)
            setStatusNote("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTransition
                ? getTransitionLabel(selectedTransition)
                : "Update order"}
            </DialogTitle>
            <DialogDescription>
              Add an internal reason or customer-facing context for this
              transition. Packing and shipment stay in the preparing workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="order-status-note">Transition note</Label>
            <Textarea
              id="order-status-note"
              value={statusNote}
              onChange={(event) => setStatusNote(event.target.value)}
              rows={4}
              placeholder="Optional note for the status timeline..."
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTransition(null)
                setStatusNote("")
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onClick={() => void handleStatusUpdate()}
            >
              Confirm transition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

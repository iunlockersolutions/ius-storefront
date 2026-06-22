"use client"

import { useState } from "react"

import { Loader2, PackageCheck, ScanBarcode, Truck } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { AdminOrder } from "@/lib/types/admin-order"
import {
  useCompleteOrderPackingMutation,
  useScanOrderPackingUnitMutation,
  useStartOrderPackingMutation,
  useUnassignOrderPackingUnitMutation,
} from "@/services/mutations/use-order-mutations"

interface OrderPackingCardProps {
  order: AdminOrder
  onRefetch: () => Promise<unknown>
}

export function OrderPackingCard({ order, onRefetch }: OrderPackingCardProps) {
  const [startNote, setStartNote] = useState("")
  const [completionNotes, setCompletionNotes] = useState("")
  const [carrier, setCarrier] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [trackingUrl, setTrackingUrl] = useState("")
  const [scanValues, setScanValues] = useState<Record<string, string>>({})

  const startPackingMutation = useStartOrderPackingMutation(order.id)
  const scanUnitMutation = useScanOrderPackingUnitMutation(order.id)
  const unassignUnitMutation = useUnassignOrderPackingUnitMutation(order.id)
  const completePackingMutation = useCompleteOrderPackingMutation(order.id)

  const latestShipment = order.shipments[0] ?? null
  const serialItems = order.items.filter(
    (item) =>
      item.packing.manageInventory && item.packing.trackingMode === "serial",
  )
  const quantityItems = order.items.filter(
    (item) =>
      item.packing.manageInventory && item.packing.trackingMode === "quantity",
  )

  async function handleStartPacking() {
    try {
      await startPackingMutation.mutateAsync({
        notes: startNote.trim() || undefined,
      })
      toast.success("Packing started")
      setStartNote("")
      await onRefetch()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start packing",
      )
    }
  }

  async function handleScan(orderItemId: string) {
    const identifier = scanValues[orderItemId]?.trim()

    if (!identifier) {
      toast.error("Scan or type an identifier first")
      return
    }

    try {
      await scanUnitMutation.mutateAsync({
        orderItemId,
        identifier,
      })
      toast.success("Serialized unit assigned")
      setScanValues((current) => ({
        ...current,
        [orderItemId]: "",
      }))
      await onRefetch()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to assign serialized unit",
      )
    }
  }

  async function handleUnassign(orderItemId: string, inventoryUnitId: string) {
    try {
      await unassignUnitMutation.mutateAsync({
        orderItemId,
        inventoryUnitId,
      })
      toast.success("Serialized unit released")
      await onRefetch()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unassign unit",
      )
    }
  }

  async function handleCompletePacking() {
    try {
      await completePackingMutation.mutateAsync({
        notes: completionNotes.trim() || undefined,
        carrier: carrier.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        trackingUrl: trackingUrl.trim() || undefined,
      })
      toast.success("Order shipped")
      setCompletionNotes("")
      setCarrier("")
      setTrackingNumber("")
      setTrackingUrl("")
      await onRefetch()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to complete packing",
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5" />
          Packing
        </CardTitle>
        <CardDescription>
          Allocate stock, assign serialized devices, and complete shipment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Status {order.status}</Badge>
          <Badge variant="secondary">
            Serial {order.packing.totalSerializedUnitsAssigned}/
            {order.packing.totalSerializedUnitsRequired}
          </Badge>
          <Badge variant="secondary">
            Quantity {order.packing.quantityLinesAllocated}/
            {order.packing.quantityLinesRequiringAllocation}
          </Badge>
        </div>

        {order.packing.issues.length > 0 ? (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-3 text-sm text-yellow-950">
            {order.packing.issues.map((issue) => (
              <p key={issue}>{issue}</p>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-900">
            Packing requirements are satisfied for the current order state.
          </div>
        )}

        {order.status === "processing" ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="packing-start-note">Packing Note</Label>
              <Textarea
                id="packing-start-note"
                value={startNote}
                onChange={(event) => setStartNote(event.target.value)}
                placeholder="Optional note for the packing handoff"
                rows={3}
              />
            </div>
            <Button
              onClick={() => void handleStartPacking()}
              disabled={startPackingMutation.isPending}
            >
              {startPackingMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Start Packing
            </Button>
          </div>
        ) : null}

        {quantityItems.length > 0 ? (
          <div className="space-y-3">
            <div>
              <p className="font-medium">Quantity Allocations</p>
              <p className="text-sm text-muted-foreground">
                These lines are allocated automatically when packing starts.
              </p>
            </div>
            <div className="space-y-3">
              {quantityItems.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.variantName} â€¢ {item.sku}
                      </p>
                      {item.nonPricingSelections.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.nonPricingSelections.map((selection) => (
                            <p
                              key={selection.optionId}
                              className="text-xs text-muted-foreground"
                            >
                              {selection.optionName}: {selection.optionValue}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline">
                      {item.packing.allocatedQuantity}/{item.quantity} allocated
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {item.packing.allocations.length === 0 ? (
                      <p>No active allocations yet.</p>
                    ) : (
                      item.packing.allocations.map((allocation) => (
                        <p key={allocation.id}>
                          {allocation.quantity} unit(s)
                          {allocation.releasedAt ? " released" : " active"}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {serialItems.length > 0 ? (
          <>
            <Separator />
            <div className="space-y-3">
              <div>
                <p className="font-medium">Serialized Assignments</p>
                <p className="text-sm text-muted-foreground">
                  Scan serial, IMEI, or barcode values to bind exact units.
                </p>
              </div>
              <div className="space-y-4">
                {serialItems.map((item) => {
                  const activeAssignments = item.packing.assignments.filter(
                    (assignment) => assignment.unassignedAt === null,
                  )

                  return (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.variantName} â€¢ {item.sku}
                          </p>
                          {item.nonPricingSelections.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.nonPricingSelections.map((selection) => (
                                <p
                                  key={selection.optionId}
                                  className="text-xs text-muted-foreground"
                                >
                                  {selection.optionName}:{" "}
                                  {selection.optionValue}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline">
                          {activeAssignments.length}/{item.quantity} assigned
                        </Badge>
                      </div>

                      {order.status === "packing" ? (
                        <div className="mt-4 flex gap-2">
                          <Input
                            value={scanValues[item.id] ?? ""}
                            onChange={(event) =>
                              setScanValues((current) => ({
                                ...current,
                                [item.id]: event.target.value,
                              }))
                            }
                            placeholder="Scan serial, IMEI, or barcode"
                          />
                          <Button
                            onClick={() => void handleScan(item.id)}
                            disabled={scanUnitMutation.isPending}
                          >
                            {scanUnitMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ScanBarcode className="mr-2 h-4 w-4" />
                            )}
                            Assign
                          </Button>
                        </div>
                      ) : null}

                      <div className="mt-4 space-y-2">
                        {activeAssignments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No units assigned yet.
                          </p>
                        ) : (
                          activeAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3"
                            >
                              <div className="flex flex-wrap gap-2">
                                {assignment.identifiers.map((identifier) => (
                                  <Badge
                                    key={identifier.id}
                                    variant="secondary"
                                  >
                                    {identifier.type.toUpperCase()}:{" "}
                                    {identifier.value}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                                <span>Status {assignment.unitStatus}</span>
                                {order.status === "packing" ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      void handleUnassign(
                                        item.id,
                                        assignment.inventoryUnitId,
                                      )
                                    }
                                    disabled={unassignUnitMutation.isPending}
                                  >
                                    Release
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : null}

        {order.status === "packing" ? (
          <>
            <Separator />
            <div className="space-y-4">
              <div>
                <p className="font-medium">Complete Packing</p>
                <p className="text-sm text-muted-foreground">
                  Shipping will decrement inventory and mark the order as
                  shipped.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier</Label>
                  <Input
                    id="carrier"
                    value={carrier}
                    onChange={(event) => setCarrier(event.target.value)}
                    placeholder="DHL, UPS, local courier"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tracking-number">Tracking Number</Label>
                  <Input
                    id="tracking-number"
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value)}
                    placeholder="Tracking number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking-url">Tracking URL</Label>
                <Input
                  id="tracking-url"
                  value={trackingUrl}
                  onChange={(event) => setTrackingUrl(event.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completion-notes">Shipment Note</Label>
                <Textarea
                  id="completion-notes"
                  value={completionNotes}
                  onChange={(event) => setCompletionNotes(event.target.value)}
                  placeholder="Optional shipping note"
                  rows={3}
                />
              </div>

              <Button
                onClick={() => void handleCompletePacking()}
                disabled={
                  completePackingMutation.isPending ||
                  !order.packing.canComplete
                }
              >
                {completePackingMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="mr-2 h-4 w-4" />
                )}
                Ship Order
              </Button>
            </div>
          </>
        ) : null}

        {latestShipment ? (
          <>
            <Separator />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Latest Shipment</p>
              <p>Carrier: {latestShipment.carrier || "Not specified"}</p>
              <p>
                Tracking Number:{" "}
                {latestShipment.trackingNumber || "Not specified"}
              </p>
              <p>
                Tracking URL: {latestShipment.trackingUrl || "Not specified"}
              </p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

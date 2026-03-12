"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  ArrowLeft,
  Loader2,
  Package,
  RefreshCw,
  ScanBarcode,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"

import {
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAdminInventoryDetailQuery } from "@/hooks/admin/use-admin-inventory-detail-query"
import { useReceiveInventoryMutation } from "@/hooks/admin/use-inventory-mutations"
import type { AdminInventoryIdentifierType } from "@/lib/types/admin-inventory"

type InventoryTab = "overview" | "receipts" | "transactions"

interface InventoryDetailPageClientProps {
  variantId: string
  initialTab: InventoryTab
}

interface StagedSerialUnit {
  id: string
  notes?: string
  identifiers: Array<{
    type: AdminInventoryIdentifierType
    value: string
  }>
}

function normalizeIdentifierValue(value: string) {
  return value.trim().toLowerCase()
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function InventoryDetailPageClient({
  variantId,
  initialTab,
}: InventoryDetailPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const detailQuery = useAdminInventoryDetailQuery(variantId)
  const receiveInventoryMutation = useReceiveInventoryMutation()

  const [quantityToReceive, setQuantityToReceive] = useState(1)
  const [receiptNotes, setReceiptNotes] = useState("")
  const [serialValue, setSerialValue] = useState("")
  const [imeiValue, setImeiValue] = useState("")
  const [imei2Value, setImei2Value] = useState("")
  const [barcodeValue, setBarcodeValue] = useState("")
  const [serialNotes, setSerialNotes] = useState("")
  const [stagedUnits, setStagedUnits] = useState<StagedSerialUnit[]>([])

  const duplicateBatchKeys = useMemo(() => {
    const counts = new Map<string, number>()

    for (const unit of stagedUnits) {
      for (const identifier of unit.identifiers) {
        const key = `${identifier.type}:${normalizeIdentifierValue(identifier.value)}`
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }

    return counts
  }, [stagedUnits])

  function setTab(tab: InventoryTab) {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (tab === "overview") {
      nextParams.delete("tab")
    } else {
      nextParams.set("tab", tab)
    }

    startTransition(() => {
      const query = nextParams.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    })
  }

  function addSerialUnitToBatch() {
    const identifiers = [
      serialValue
        ? {
            type: "serial" as const,
            value: serialValue.trim(),
          }
        : null,
      imeiValue
        ? {
            type: "imei" as const,
            value: imeiValue.trim(),
          }
        : null,
      imei2Value
        ? {
            type: "imei2" as const,
            value: imei2Value.trim(),
          }
        : null,
      barcodeValue
        ? {
            type: "barcode" as const,
            value: barcodeValue.trim(),
          }
        : null,
    ].filter((identifier) => identifier !== null)

    if (identifiers.length === 0) {
      toast.error("Add at least one identifier before staging the unit")
      return
    }

    for (const identifier of identifiers) {
      const key = `${identifier.type}:${normalizeIdentifierValue(identifier.value)}`
      if ((duplicateBatchKeys.get(key) ?? 0) > 0) {
        toast.error(
          `Duplicate ${identifier.type.toUpperCase()} in staged batch`,
        )
        return
      }
    }

    setStagedUnits((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        notes: serialNotes.trim() || undefined,
        identifiers,
      },
    ])
    setSerialValue("")
    setImeiValue("")
    setImei2Value("")
    setBarcodeValue("")
    setSerialNotes("")
  }

  async function handleQuantityReceipt() {
    if (quantityToReceive <= 0) {
      toast.error("Quantity must be greater than zero")
      return
    }

    try {
      const result = await receiveInventoryMutation.mutateAsync({
        variantId,
        quantity: quantityToReceive,
        notes: receiptNotes.trim() || undefined,
      })

      toast.success(
        `Received ${result.receivedQuantity} units. On hand is now ${result.newQuantity}.`,
      )
      setReceiptNotes("")
      setQuantityToReceive(1)
      setTab("overview")
      await detailQuery.refetch()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to receive inventory",
      )
    }
  }

  async function handleSerializedReceipt() {
    if (stagedUnits.length === 0) {
      toast.error("Stage at least one scanned unit before submitting")
      return
    }

    try {
      const result = await receiveInventoryMutation.mutateAsync({
        variantId,
        notes: receiptNotes.trim() || undefined,
        units: stagedUnits.map((unit) => ({
          notes: unit.notes,
          identifiers: unit.identifiers,
        })),
      })

      toast.success(
        `Received ${result.receivedQuantity} serialized units. On hand is now ${result.newQuantity}.`,
      )
      setReceiptNotes("")
      setStagedUnits([])
      setTab("overview")
      await detailQuery.refetch()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to receive inventory",
      )
    }
  }

  if (detailQuery.isLoading || detailQuery.isFetching) {
    return <AdminQueryLoadingState skeletonClassName="h-[34rem] w-full" />
  }

  if (detailQuery.error) {
    return (
      <AdminQueryErrorState
        message={getQueryErrorMessage(
          detailQuery.error,
          "Failed to load inventory detail",
        )}
        onRetry={detailQuery.refetch}
        backHref="/ops/inventory"
        backLabel="Back to inventory"
      />
    )
  }

  const detail = detailQuery.data

  if (!detail) {
    return (
      <AdminQueryErrorState
        message="Inventory detail not found"
        backHref="/ops/inventory"
        backLabel="Back to inventory"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button variant="ghost" asChild className="w-fit px-0">
            <Link href="/ops/inventory">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Inventory
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{detail.productName}</h1>
            <p className="text-muted-foreground">
              {detail.variantName} • {detail.variantSku}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">
              {detail.trackingMode}
            </Badge>
            <Badge variant="secondary">
              Available {detail.stats.availableQuantity}
            </Badge>
            <Badge variant="secondary">
              Reserved {detail.stats.reservedQuantity}
            </Badge>
            <Badge variant="secondary">
              Allocated {detail.stats.allocatedQuantity}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void detailQuery.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link href={`/ops/inventory/${variantId}?tab=receipts`}>
              <ScanBarcode className="mr-2 h-4 w-4" />
              Receive Stock
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        value={initialTab}
        onValueChange={(value) => setTab(value as InventoryTab)}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">On Hand</p>
                <p className="text-3xl font-semibold">
                  {detail.stats.onHandQuantity}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-3xl font-semibold">
                  {detail.stats.availableQuantity}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Reserved</p>
                <p className="text-3xl font-semibold">
                  {detail.stats.reservedQuantity}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Allocated</p>
                <p className="text-3xl font-semibold">
                  {detail.stats.allocatedQuantity}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Threshold</p>
                <p className="text-3xl font-semibold">
                  {detail.stats.lowStockThreshold}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Location Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">Available</TableHead>
                      <TableHead className="text-center">Reserved</TableHead>
                      <TableHead className="text-center">Allocated</TableHead>
                      <TableHead className="text-center">On Hand</TableHead>
                      <TableHead className="text-center">Threshold</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.levels.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No stock has been received for this variant yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      detail.levels.map((level) => (
                        <TableRow key={level.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {level.locationName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {level.locationCode}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {level.availableQuantity}
                          </TableCell>
                          <TableCell className="text-center">
                            {level.reservedQuantity}
                          </TableCell>
                          <TableCell className="text-center">
                            {level.allocatedQuantity}
                          </TableCell>
                          <TableCell className="text-center">
                            {level.onHandQuantity}
                          </TableCell>
                          <TableCell className="text-center">
                            {level.lowStockThreshold}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(level.updatedAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {detail.trackingMode === "serial" ? (
            <Card>
              <CardHeader>
                <CardTitle>Serialized Units</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Identifiers</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.units.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-muted-foreground"
                          >
                            No serialized units have been received yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        detail.units.map((unit) => (
                          <TableRow key={unit.id}>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {unit.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {unit.identifiers.map((identifier) => (
                                  <Badge
                                    key={identifier.id}
                                    variant="secondary"
                                  >
                                    {identifier.type.toUpperCase()}:{" "}
                                    {identifier.value}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(unit.receivedAt)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(unit.updatedAt)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {unit.notes || "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receive Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {detail.trackingMode === "quantity" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="quantity-to-receive">Quantity</Label>
                      <Input
                        id="quantity-to-receive"
                        type="number"
                        min={1}
                        value={quantityToReceive}
                        onChange={(event) =>
                          setQuantityToReceive(
                            parseInt(event.target.value, 10) || 1,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receipt-notes">Notes</Label>
                      <Textarea
                        id="receipt-notes"
                        placeholder="Supplier reference, batch note, or receiving note"
                        value={receiptNotes}
                        onChange={(event) =>
                          setReceiptNotes(event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => void handleQuantityReceipt()}
                    disabled={receiveInventoryMutation.isPending}
                  >
                    {receiveInventoryMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Commit Receipt
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">
                    Use a barcode scanner in the serial, IMEI, or barcode
                    fields. Each staged row becomes one physical inventory unit.
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="serial-number">Serial Number</Label>
                      <Input
                        id="serial-number"
                        value={serialValue}
                        onChange={(event) => setSerialValue(event.target.value)}
                        placeholder="Serial number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input
                        id="barcode"
                        value={barcodeValue}
                        onChange={(event) =>
                          setBarcodeValue(event.target.value)
                        }
                        placeholder="Barcode"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imei">IMEI</Label>
                      <Input
                        id="imei"
                        value={imeiValue}
                        onChange={(event) => setImeiValue(event.target.value)}
                        placeholder="IMEI"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imei2">IMEI 2</Label>
                      <Input
                        id="imei2"
                        value={imei2Value}
                        onChange={(event) => setImei2Value(event.target.value)}
                        placeholder="IMEI 2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serial-notes">Unit Notes</Label>
                    <Input
                      id="serial-notes"
                      value={serialNotes}
                      onChange={(event) => setSerialNotes(event.target.value)}
                      placeholder="Optional note for this unit"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addSerialUnitToBatch}
                    >
                      Stage Unit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setSerialValue("")
                        setBarcodeValue("")
                        setImeiValue("")
                        setImei2Value("")
                        setSerialNotes("")
                      }}
                    >
                      Clear Inputs
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Staged Batch</p>
                        <p className="text-sm text-muted-foreground">
                          {stagedUnits.length} serialized unit
                          {stagedUnits.length === 1 ? "" : "s"} ready to commit
                        </p>
                      </div>
                      {stagedUnits.length > 0 ? (
                        <Button
                          variant="ghost"
                          onClick={() => setStagedUnits([])}
                        >
                          Clear Batch
                        </Button>
                      ) : null}
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Identifiers</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stagedUnits.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="py-8 text-center text-muted-foreground"
                              >
                                No units staged yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            stagedUnits.map((unit) => (
                              <TableRow key={unit.id}>
                                <TableCell>
                                  <div className="flex flex-wrap gap-2">
                                    {unit.identifiers.map((identifier) => (
                                      <Badge
                                        key={`${unit.id}-${identifier.type}`}
                                        variant="secondary"
                                      >
                                        {identifier.type.toUpperCase()}:{" "}
                                        {identifier.value}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {unit.notes || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setStagedUnits((current) =>
                                        current.filter(
                                          (candidate) =>
                                            candidate.id !== unit.id,
                                        ),
                                      )
                                    }
                                  >
                                    Remove
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt-batch-notes">Batch Notes</Label>
                    <Textarea
                      id="receipt-batch-notes"
                      placeholder="Receiving note for the full batch"
                      value={receiptNotes}
                      onChange={(event) => setReceiptNotes(event.target.value)}
                    />
                  </div>

                  <Button
                    onClick={() => void handleSerializedReceipt()}
                    disabled={
                      receiveInventoryMutation.isPending ||
                      stagedUnits.length === 0
                    }
                  >
                    {receiveInventoryMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Commit Serialized Receipt
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">Change</TableHead>
                      <TableHead className="text-center">
                        Before → After
                      </TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.transactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No transactions recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      detail.transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {transaction.type.replaceAll("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">
                                {transaction.locationName}
                              </p>
                              <p className="text-muted-foreground">
                                {transaction.locationCode}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={
                                transaction.quantityDelta >= 0
                                  ? "font-medium text-green-600"
                                  : "font-medium text-red-600"
                              }
                            >
                              {transaction.quantityDelta > 0 ? "+" : ""}
                              {transaction.quantityDelta}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {transaction.beforeOnHandQuantity} →{" "}
                            {transaction.afterOnHandQuantity}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {transaction.performedByName || "System"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {transaction.notes || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {detail.trackingMode === "serial" && stagedUnits.length > 0 ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4" />
            <p>
              Staged identifiers are validated against duplicates inside this
              batch before submit. Final uniqueness is still enforced by the
              database on receipt commit.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

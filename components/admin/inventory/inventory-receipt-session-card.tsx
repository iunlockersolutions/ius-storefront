"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  Camera,
  Loader2,
  PackagePlus,
  RotateCcw,
  ScanBarcode,
  Type,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useReceiveInventoryMutation } from "@/hooks/admin/use-inventory-mutations"
import {
  getDefaultSerialReceiptIdentifierTypes,
  INVENTORY_IDENTIFIER_TYPE_ORDER,
  normalizeReceiptIdentifierTypes,
  type ReceiptIdentifierType,
} from "@/lib/inventory/identifier-template"
import type { AdminInventoryTrackingMode } from "@/lib/types/admin-inventory"

type ReceiptSessionInputSource = "scanner" | "camera" | "manual"

interface ReceiptSessionVariant {
  id: string
  name: string
  sku: string
  trackingMode: AdminInventoryTrackingMode
  manageInventory: boolean
  receiptIdentifierTypes: ReceiptIdentifierType[]
  onHandQuantity: number | null
  availableQuantity: number | null
}

interface StagedSerialUnit {
  id: string
  notes?: string
  identifiers: Array<{
    type: ReceiptIdentifierType
    value: string
  }>
}

interface BarcodeDetectorResult {
  rawValue?: string
}

interface BarcodeDetectorInstance {
  detect(source: ImageBitmapSource): Promise<BarcodeDetectorResult[]>
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance
}

interface InventoryReceiptSessionCardProps {
  productId: string
  productName: string
  variants: ReceiptSessionVariant[]
  initialVariantId?: string | null
  title?: string
  description?: string
  onReceived?: () => Promise<void> | void
}

function getIdentifierLabel(type: ReceiptIdentifierType) {
  if (type === "imei2") {
    return "IMEI 2"
  }

  return type.toUpperCase()
}

function getNextMissingIdentifierType(
  template: ReceiptIdentifierType[],
  values: Partial<Record<ReceiptIdentifierType, string>>,
) {
  return (
    template.find((type) => !values[type]?.trim()) ??
    template[template.length - 1] ??
    null
  )
}

export function InventoryReceiptSessionCard({
  productId,
  productName,
  variants,
  initialVariantId,
  title = "Receive Stock",
  description = "Add quantity or tracked devices for this product.",
  onReceived,
}: InventoryReceiptSessionCardProps) {
  const receiveInventoryMutation = useReceiveInventoryMutation()
  const barcodeCaptureInputRef = useRef<HTMLInputElement | null>(null)
  const ocrCaptureInputRef = useRef<HTMLInputElement | null>(null)
  const scannerInputRef = useRef<HTMLInputElement | null>(null)

  const defaultVariantId =
    initialVariantId ||
    variants.find((variant) => variant.manageInventory)?.id ||
    variants[0]?.id ||
    ""

  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariantId)
  const [inputSource, setInputSource] =
    useState<ReceiptSessionInputSource>("scanner")
  const [quantityToReceive, setQuantityToReceive] = useState(1)
  const [receiptNotes, setReceiptNotes] = useState("")
  const [sessionIdentifierTypes, setSessionIdentifierTypes] = useState<
    ReceiptIdentifierType[]
  >([])
  const [activeIdentifierType, setActiveIdentifierType] =
    useState<ReceiptIdentifierType | null>(null)
  const [currentUnitValues, setCurrentUnitValues] = useState<
    Partial<Record<ReceiptIdentifierType, string>>
  >({})
  const [currentUnitNotes, setCurrentUnitNotes] = useState("")
  const [stagedUnits, setStagedUnits] = useState<StagedSerialUnit[]>([])
  const [scannerBuffer, setScannerBuffer] = useState("")
  const [isBarcodeCapturePending, setIsBarcodeCapturePending] = useState(false)
  const [isOcrPending, setIsOcrPending] = useState(false)

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) || null,
    [selectedVariantId, variants],
  )

  useEffect(() => {
    if (!selectedVariant) {
      return
    }

    const initialTemplate =
      selectedVariant.trackingMode === "serial"
        ? selectedVariant.receiptIdentifierTypes.length > 0
          ? selectedVariant.receiptIdentifierTypes
          : getDefaultSerialReceiptIdentifierTypes()
        : []

    setSessionIdentifierTypes(initialTemplate)
    setActiveIdentifierType(initialTemplate[0] ?? null)
    setCurrentUnitValues({})
    setCurrentUnitNotes("")
    setReceiptNotes("")
    setStagedUnits([])
    setScannerBuffer("")
    setQuantityToReceive(1)
  }, [selectedVariant])

  useEffect(() => {
    if (inputSource === "scanner") {
      scannerInputRef.current?.focus()
    }
  }, [inputSource, activeIdentifierType])

  const missingIdentifierTypes = useMemo(() => {
    if (!selectedVariant || selectedVariant.trackingMode !== "serial") {
      return []
    }

    return sessionIdentifierTypes.filter(
      (type) => !currentUnitValues[type]?.trim(),
    )
  }, [currentUnitValues, selectedVariant, sessionIdentifierTypes])

  function resetCurrentUnit() {
    setCurrentUnitValues({})
    setCurrentUnitNotes("")
    setScannerBuffer("")
    setActiveIdentifierType(sessionIdentifierTypes[0] ?? null)
  }

  const applyIncomingValue = useCallback(
    (rawValue: string) => {
      const trimmed = rawValue.trim()

      if (
        !trimmed ||
        !selectedVariant ||
        selectedVariant.trackingMode !== "serial"
      ) {
        return
      }

      const targetType =
        activeIdentifierType ||
        getNextMissingIdentifierType(sessionIdentifierTypes, currentUnitValues)

      if (!targetType) {
        toast.error("Select an identifier type before applying scanned input")
        return
      }

      setCurrentUnitValues((current) => {
        const next = {
          ...current,
          [targetType]: trimmed,
        }

        const nextMissing = getNextMissingIdentifierType(
          sessionIdentifierTypes,
          next,
        )
        setActiveIdentifierType(nextMissing)
        return next
      })
      setScannerBuffer("")
    },
    [
      activeIdentifierType,
      currentUnitValues,
      selectedVariant,
      sessionIdentifierTypes,
    ],
  )

  useEffect(() => {
    if (inputSource !== "scanner" || !scannerBuffer.trim()) {
      return
    }

    const timeout = window.setTimeout(() => {
      applyIncomingValue(scannerBuffer.trim())
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [applyIncomingValue, inputSource, scannerBuffer])

  function updateSessionIdentifierTypes(nextValues: ReceiptIdentifierType[]) {
    const normalized = normalizeReceiptIdentifierTypes(nextValues)
    setSessionIdentifierTypes(normalized)
    setStagedUnits([])
    setCurrentUnitValues(
      (current) =>
        Object.fromEntries(
          Object.entries(current).filter(([type]) =>
            normalized.includes(type as ReceiptIdentifierType),
          ),
        ) as Partial<Record<ReceiptIdentifierType, string>>,
    )
    setActiveIdentifierType((current) =>
      normalized.includes(current as ReceiptIdentifierType)
        ? current
        : normalized[0] || null,
    )
  }

  function toggleIdentifierType(type: ReceiptIdentifierType) {
    if (!selectedVariant || selectedVariant.trackingMode !== "serial") {
      return
    }

    const nextValues = sessionIdentifierTypes.includes(type)
      ? sessionIdentifierTypes.filter((value) => value !== type)
      : [...sessionIdentifierTypes, type]

    updateSessionIdentifierTypes(nextValues)
  }

  function stageCurrentUnit() {
    if (!selectedVariant || selectedVariant.trackingMode !== "serial") {
      return
    }

    if (sessionIdentifierTypes.length === 0) {
      toast.error(
        "Select at least one identifier type for this receipt session",
      )
      return
    }

    if (missingIdentifierTypes.length > 0) {
      toast.error(
        `Complete the current unit before staging: ${missingIdentifierTypes
          .map(getIdentifierLabel)
          .join(", ")}`,
      )
      return
    }

    const identifiers = sessionIdentifierTypes.map((type) => ({
      type,
      value: currentUnitValues[type]!.trim(),
    }))

    const duplicateKey = identifiers.find((identifier) =>
      stagedUnits.some((unit) =>
        unit.identifiers.some(
          (candidate) =>
            candidate.type === identifier.type &&
            candidate.value.trim().toLowerCase() ===
              identifier.value.trim().toLowerCase(),
        ),
      ),
    )

    if (duplicateKey) {
      toast.error(
        `Duplicate ${getIdentifierLabel(duplicateKey.type)} in staged batch`,
      )
      return
    }

    setStagedUnits((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        notes: currentUnitNotes.trim() || undefined,
        identifiers,
      },
    ])
    resetCurrentUnit()
  }

  async function handleQuantityReceipt() {
    if (!selectedVariant) {
      return
    }

    if (quantityToReceive <= 0) {
      toast.error("Quantity must be greater than zero")
      return
    }

    try {
      const result = await receiveInventoryMutation.mutateAsync({
        productId,
        variantId: selectedVariant.id,
        quantity: quantityToReceive,
        notes: receiptNotes.trim() || undefined,
      })

      toast.success(
        `Received ${result.receivedQuantity} units. On hand is now ${result.newQuantity}.`,
      )
      setReceiptNotes("")
      setQuantityToReceive(1)
      await onReceived?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to receive inventory",
      )
    }
  }

  async function handleSerializedReceipt() {
    if (!selectedVariant) {
      return
    }

    if (stagedUnits.length === 0) {
      toast.error("Stage at least one device before submitting")
      return
    }

    try {
      const result = await receiveInventoryMutation.mutateAsync({
        productId,
        variantId: selectedVariant.id,
        notes: receiptNotes.trim() || undefined,
        identifierTemplate: sessionIdentifierTypes,
        units: stagedUnits.map((unit) => ({
          notes: unit.notes,
          identifiers: unit.identifiers,
        })),
      })

      toast.success(
        `Received ${result.receivedQuantity} tracked units. On hand is now ${result.newQuantity}.`,
      )
      setReceiptNotes("")
      setStagedUnits([])
      resetCurrentUnit()
      await onReceived?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to receive inventory",
      )
    }
  }

  async function detectBarcodeFromFile(file: File) {
    const BarcodeDetectorCtor = (
      globalThis as typeof globalThis & {
        BarcodeDetector?: BarcodeDetectorConstructor
      }
    ).BarcodeDetector

    if (!BarcodeDetectorCtor) {
      toast.error("Barcode scanning is not supported in this browser")
      return
    }

    setIsBarcodeCapturePending(true)

    try {
      const imageBitmap = await createImageBitmap(file)
      try {
        const detector = new BarcodeDetectorCtor()
        const results = await detector.detect(imageBitmap)
        const value = results[0]?.rawValue?.trim()

        if (!value) {
          throw new Error("No barcode was detected in the captured image")
        }

        applyIncomingValue(value)
        toast.success("Barcode captured")
      } finally {
        imageBitmap.close?.()
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to scan barcode",
      )
    } finally {
      setIsBarcodeCapturePending(false)
    }
  }

  async function extractTextFromFile(file: File) {
    setIsOcrPending(true)

    try {
      const { recognize } = await import("tesseract.js")
      const result = await recognize(file, "eng")
      const extractedText = result.data.text.replace(/\s+/g, " ").trim()

      if (!extractedText) {
        throw new Error("No readable text was found in the captured image")
      }

      setScannerBuffer(extractedText)
      toast.success("OCR text extracted. Review it before applying.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to extract text",
      )
    } finally {
      setIsOcrPending(false)
    }
  }

  if (!selectedVariant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No inventory-managed variants are available for {productName}.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Variant</Label>
            {variants.length === 1 ? (
              <div className="rounded-lg border px-3 py-2 text-sm">
                {selectedVariant.name} · {selectedVariant.sku}
              </div>
            ) : (
              <Select
                value={selectedVariantId}
                onValueChange={(value) => setSelectedVariantId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.name} · {variant.sku}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">
            {selectedVariant.trackingMode}
          </Badge>
          <Badge variant="secondary">
            On hand {selectedVariant.onHandQuantity ?? 0}
          </Badge>
          <Badge variant="secondary">
            Available {selectedVariant.availableQuantity ?? 0}
          </Badge>
        </div>

        {selectedVariant.trackingMode === "quantity" ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity-to-receive">Quantity</Label>
                <Input
                  id="quantity-to-receive"
                  type="number"
                  min={1}
                  value={quantityToReceive}
                  onChange={(event) =>
                    setQuantityToReceive(parseInt(event.target.value, 10) || 1)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt-notes">Notes</Label>
                <Textarea
                  id="receipt-notes"
                  placeholder="Supplier reference, batch note, or receiving note"
                  value={receiptNotes}
                  onChange={(event) => setReceiptNotes(event.target.value)}
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
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Each staged row becomes one physical device. One device can carry
              multiple identifiers such as Serial, IMEI, and IMEI 2.
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>Receipt Identifier Template</Label>
                  <p className="text-xs text-muted-foreground">
                    This session override does not change the variant default.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateSessionIdentifierTypes(
                      selectedVariant.receiptIdentifierTypes.length > 0
                        ? selectedVariant.receiptIdentifierTypes
                        : getDefaultSerialReceiptIdentifierTypes(),
                    )
                  }
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset to Variant Default
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {INVENTORY_IDENTIFIER_TYPE_ORDER.map((type) => {
                  const selected = sessionIdentifierTypes.includes(type)
                  return (
                    <Button
                      key={type}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleIdentifierType(type)}
                    >
                      {getIdentifierLabel(type)}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Input Source</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={inputSource === "scanner" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputSource("scanner")}
                >
                  <ScanBarcode className="mr-2 h-4 w-4" />
                  Scanner
                </Button>
                <Button
                  type="button"
                  variant={inputSource === "camera" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputSource("camera")}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Camera
                </Button>
                <Button
                  type="button"
                  variant={inputSource === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputSource("manual")}
                >
                  <Type className="mr-2 h-4 w-4" />
                  Manual
                </Button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {sessionIdentifierTypes.map((type) => (
                    <div key={type} className="space-y-2">
                      <Label htmlFor={`identifier-${type}`}>
                        {getIdentifierLabel(type)}
                      </Label>
                      <Input
                        id={`identifier-${type}`}
                        value={currentUnitValues[type] ?? ""}
                        onFocus={() => setActiveIdentifierType(type)}
                        onChange={(event) =>
                          setCurrentUnitValues((current) => ({
                            ...current,
                            [type]: event.target.value,
                          }))
                        }
                        placeholder={`Enter ${getIdentifierLabel(type)}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current-unit-notes">Unit Notes</Label>
                  <Input
                    id="current-unit-notes"
                    value={currentUnitNotes}
                    onChange={(event) =>
                      setCurrentUnitNotes(event.target.value)
                    }
                    placeholder="Optional note for this device"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={stageCurrentUnit}
                  >
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Stage Unit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetCurrentUnit}
                  >
                    Clear Current Unit
                  </Button>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <div className="space-y-2">
                  <Label htmlFor="scanner-buffer">
                    {inputSource === "scanner"
                      ? "Scanner Buffer"
                      : inputSource === "camera"
                        ? "Camera / OCR Result"
                        : "Manual Quick Apply"}
                  </Label>
                  <Input
                    ref={scannerInputRef}
                    id="scanner-buffer"
                    value={scannerBuffer}
                    onChange={(event) => setScannerBuffer(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        applyIncomingValue(scannerBuffer.trim())
                      }
                    }}
                    placeholder={
                      activeIdentifierType
                        ? `Applies to ${getIdentifierLabel(activeIdentifierType)}`
                        : "Select an identifier slot first"
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Active slot:{" "}
                    {activeIdentifierType
                      ? getIdentifierLabel(activeIdentifierType)
                      : "none"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => applyIncomingValue(scannerBuffer.trim())}
                    disabled={!scannerBuffer.trim()}
                  >
                    Apply Value
                  </Button>
                  {inputSource === "camera" ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => barcodeCaptureInputRef.current?.click()}
                        disabled={isBarcodeCapturePending}
                      >
                        {isBarcodeCapturePending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="mr-2 h-4 w-4" />
                        )}
                        Capture Barcode
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => ocrCaptureInputRef.current?.click()}
                        disabled={isOcrPending}
                      >
                        {isOcrPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Type className="mr-2 h-4 w-4" />
                        )}
                        OCR Assist
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <input
              ref={barcodeCaptureInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (file) {
                  void detectBarcodeFromFile(file)
                }
              }}
            />
            <input
              ref={ocrCaptureInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (file) {
                  void extractTextFromFile(file)
                }
              }}
            />

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Staged Batch</p>
                  <p className="text-sm text-muted-foreground">
                    {stagedUnits.length} tracked unit
                    {stagedUnits.length === 1 ? "" : "s"} ready to commit
                  </p>
                </div>
                {stagedUnits.length > 0 ? (
                  <Button
                    type="button"
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
                      <TableHead className="text-right">Actions</TableHead>
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
                                  {getIdentifierLabel(identifier.type)}:{" "}
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
                                    (candidate) => candidate.id !== unit.id,
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
                stagedUnits.length === 0 ||
                sessionIdentifierTypes.length === 0
              }
            >
              {receiveInventoryMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Commit Serialized Receipt
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

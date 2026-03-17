"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react"

import {
  Camera,
  CheckCircle2,
  Keyboard,
  Loader2,
  PackagePlus,
  PencilLine,
  RotateCcw,
  ScanBarcode,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  getDefaultSerialReceiptIdentifierTypes,
  INVENTORY_IDENTIFIER_TYPE_ORDER,
  normalizeReceiptIdentifierTypes,
  type ReceiptIdentifierType,
} from "@/lib/inventory/identifier-template"
import type { AdminInventoryTrackingMode } from "@/lib/types/admin-inventory"
import { cn } from "@/lib/utils"
import { useReceiveInventoryMutation } from "@/services/mutations/use-inventory-mutations"

type ReceiptPanel = "template" | "scanner" | "camera" | "manual" | "quantity"

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

interface RecentScanEntry {
  id: string
  type: ReceiptIdentifierType
  value: string
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

interface ReceiptSessionState {
  selectedVariantId: string
  activePanel: ReceiptPanel | null
  quantityToReceive: number
  receiptNotes: string
  sessionIdentifierTypes: ReceiptIdentifierType[]
  activeIdentifierType: ReceiptIdentifierType | null
  currentUnitValues: Partial<Record<ReceiptIdentifierType, string>>
  currentUnitNotes: string
  stagedUnits: StagedSerialUnit[]
  scannerBuffer: string
  recentScans: RecentScanEntry[]
  editingUnitId: string | null
}

type ReceiptSessionAction =
  | {
      type: "selectVariant"
      payload: {
        variantId: string
        template: ReceiptIdentifierType[]
      }
    }
  | {
      type: "setPanel"
      payload: ReceiptPanel | null
    }
  | {
      type: "setQuantity"
      payload: number
    }
  | {
      type: "setReceiptNotes"
      payload: string
    }
  | {
      type: "setTemplate"
      payload: ReceiptIdentifierType[]
    }
  | {
      type: "setActiveIdentifierType"
      payload: ReceiptIdentifierType | null
    }
  | {
      type: "setCurrentValue"
      payload: {
        type: ReceiptIdentifierType
        value: string
      }
    }
  | {
      type: "setCurrentUnitNotes"
      payload: string
    }
  | {
      type: "setScannerBuffer"
      payload: string
    }
  | {
      type: "applyIncomingValue"
      payload: {
        type: ReceiptIdentifierType
        value: string
        nextActiveType: ReceiptIdentifierType | null
        recentScan: RecentScanEntry
      }
    }
  | {
      type: "clearCurrentUnit"
    }
  | {
      type: "stageUnit"
      payload: StagedSerialUnit
    }
  | {
      type: "removeStagedUnit"
      payload: string
    }
  | {
      type: "clearBatch"
    }
  | {
      type: "loadStagedUnit"
      payload: StagedSerialUnit
    }
  | {
      type: "serializedReceiptCommitted"
    }
  | {
      type: "quantityReceiptCommitted"
    }

function getIdentifierLabel(type: ReceiptIdentifierType) {
  if (type === "imei2") {
    return "IMEI 2"
  }

  return type.toUpperCase()
}

function getVariantTemplate(variant: ReceiptSessionVariant | null) {
  if (!variant || variant.trackingMode !== "serial") {
    return []
  }

  return variant.receiptIdentifierTypes.length > 0
    ? normalizeReceiptIdentifierTypes(variant.receiptIdentifierTypes)
    : getDefaultSerialReceiptIdentifierTypes()
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

function createInitialState(
  variants: ReceiptSessionVariant[],
  initialVariantId?: string | null,
): ReceiptSessionState {
  const defaultVariant =
    variants.find((variant) => variant.id === initialVariantId) ||
    variants.find((variant) => variant.manageInventory) ||
    variants[0] ||
    null
  const template = getVariantTemplate(defaultVariant)

  return {
    selectedVariantId: defaultVariant?.id ?? "",
    activePanel: null,
    quantityToReceive: 1,
    receiptNotes: "",
    sessionIdentifierTypes: template,
    activeIdentifierType: template[0] ?? null,
    currentUnitValues: {},
    currentUnitNotes: "",
    stagedUnits: [],
    scannerBuffer: "",
    recentScans: [],
    editingUnitId: null,
  }
}

function receiptSessionReducer(
  state: ReceiptSessionState,
  action: ReceiptSessionAction,
): ReceiptSessionState {
  switch (action.type) {
    case "selectVariant": {
      const template = normalizeReceiptIdentifierTypes(action.payload.template)

      return {
        selectedVariantId: action.payload.variantId,
        activePanel: null,
        quantityToReceive: 1,
        receiptNotes: "",
        sessionIdentifierTypes: template,
        activeIdentifierType: template[0] ?? null,
        currentUnitValues: {},
        currentUnitNotes: "",
        stagedUnits: [],
        scannerBuffer: "",
        recentScans: [],
        editingUnitId: null,
      }
    }
    case "setPanel":
      return {
        ...state,
        activePanel: action.payload,
      }
    case "setQuantity":
      return {
        ...state,
        quantityToReceive: action.payload,
      }
    case "setReceiptNotes":
      return {
        ...state,
        receiptNotes: action.payload,
      }
    case "setTemplate": {
      const nextTemplate = normalizeReceiptIdentifierTypes(action.payload)
      const nextValues = Object.fromEntries(
        Object.entries(state.currentUnitValues).filter(([type]) =>
          nextTemplate.includes(type as ReceiptIdentifierType),
        ),
      ) as Partial<Record<ReceiptIdentifierType, string>>

      return {
        ...state,
        sessionIdentifierTypes: nextTemplate,
        activeIdentifierType:
          getNextMissingIdentifierType(nextTemplate, nextValues) ??
          nextTemplate[0] ??
          null,
        currentUnitValues: nextValues,
        currentUnitNotes: "",
        stagedUnits: [],
        scannerBuffer: "",
        recentScans: [],
        editingUnitId: null,
      }
    }
    case "setActiveIdentifierType":
      return {
        ...state,
        activeIdentifierType: action.payload,
      }
    case "setCurrentValue":
      return {
        ...state,
        currentUnitValues: {
          ...state.currentUnitValues,
          [action.payload.type]: action.payload.value,
        },
      }
    case "setCurrentUnitNotes":
      return {
        ...state,
        currentUnitNotes: action.payload,
      }
    case "setScannerBuffer":
      return {
        ...state,
        scannerBuffer: action.payload,
      }
    case "applyIncomingValue":
      return {
        ...state,
        currentUnitValues: {
          ...state.currentUnitValues,
          [action.payload.type]: action.payload.value,
        },
        activeIdentifierType: action.payload.nextActiveType,
        scannerBuffer: "",
        recentScans: [action.payload.recentScan, ...state.recentScans].slice(
          0,
          6,
        ),
      }
    case "clearCurrentUnit":
      return {
        ...state,
        activeIdentifierType: state.sessionIdentifierTypes[0] ?? null,
        currentUnitValues: {},
        currentUnitNotes: "",
        scannerBuffer: "",
        editingUnitId: null,
      }
    case "stageUnit": {
      const existingIndex = state.stagedUnits.findIndex(
        (unit) => unit.id === action.payload.id,
      )
      const nextStagedUnits =
        existingIndex === -1
          ? [...state.stagedUnits, action.payload]
          : state.stagedUnits.map((unit) =>
              unit.id === action.payload.id ? action.payload : unit,
            )

      return {
        ...state,
        stagedUnits: nextStagedUnits,
        activeIdentifierType: state.sessionIdentifierTypes[0] ?? null,
        currentUnitValues: {},
        currentUnitNotes: "",
        scannerBuffer: "",
        editingUnitId: null,
      }
    }
    case "removeStagedUnit":
      return {
        ...state,
        stagedUnits: state.stagedUnits.filter(
          (unit) => unit.id !== action.payload,
        ),
      }
    case "clearBatch":
      return {
        ...state,
        stagedUnits: [],
        receiptNotes: "",
      }
    case "loadStagedUnit": {
      const nextValues = Object.fromEntries(
        action.payload.identifiers.map((identifier) => [
          identifier.type,
          identifier.value,
        ]),
      ) as Partial<Record<ReceiptIdentifierType, string>>

      return {
        ...state,
        activePanel: "manual",
        currentUnitValues: nextValues,
        currentUnitNotes: action.payload.notes ?? "",
        activeIdentifierType:
          getNextMissingIdentifierType(
            state.sessionIdentifierTypes,
            nextValues,
          ) ??
          state.sessionIdentifierTypes[0] ??
          null,
        editingUnitId: action.payload.id,
      }
    }
    case "serializedReceiptCommitted":
      return {
        ...state,
        activePanel: null,
        receiptNotes: "",
        currentUnitValues: {},
        currentUnitNotes: "",
        stagedUnits: [],
        scannerBuffer: "",
        recentScans: [],
        activeIdentifierType: state.sessionIdentifierTypes[0] ?? null,
        editingUnitId: null,
      }
    case "quantityReceiptCommitted":
      return {
        ...state,
        activePanel: null,
        quantityToReceive: 1,
        receiptNotes: "",
      }
    default:
      return state
  }
}

function joinTemplateLabel(template: ReceiptIdentifierType[]) {
  if (template.length === 0) {
    return "No identifiers selected"
  }

  return template.map(getIdentifierLabel).join(" + ")
}

function areIdentifierTemplatesEqual(
  left: ReceiptIdentifierType[],
  right: ReceiptIdentifierType[],
) {
  if (left.length !== right.length) {
    return false
  }

  return left.every((value, index) => value === right[index])
}

function getTrackingDescription(variant: ReceiptSessionVariant) {
  if (variant.trackingMode === "serial") {
    return "Receive one physical device at a time. Scanner mode is optimized for wedge scanners and quick keyboard staging."
  }

  return "This variant is quantity tracked. Post the received count in one focused step with notes if needed."
}

function getCurrentUnitPreview(
  template: ReceiptIdentifierType[],
  values: Partial<Record<ReceiptIdentifierType, string>>,
) {
  return template.map((type) => ({
    type,
    value: values[type]?.trim() ?? "",
    isComplete: Boolean(values[type]?.trim()),
  }))
}

function ReceiptWorkflowPanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  mobileLayout = "sheet",
  desktopClassName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: React.ReactNode
  mobileLayout?: "sheet" | "drawer"
  desktopClassName?: string
}) {
  const isMobile = useIsMobile()

  if (isMobile && mobileLayout === "drawer") {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="mx-auto flex h-[92vh] max-h-[92vh] w-full flex-col overflow-hidden p-0">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full max-w-none overflow-y-auto p-0 sm:max-w-none">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="px-6 py-6">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex h-[90vh] max-h-[90vh] sm:max-w-6xl flex-col overflow-hidden p-0",
          desktopClassName,
        )}
      >
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}

function ReceiptActionTile({
  title,
  description,
  icon: Icon,
  onClick,
  hint,
  accent = false,
  disabled = false,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  hint?: string
  accent?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group rounded-2xl border p-5 text-left transition-all duration-200",
        "hover:border-foreground/20 hover:-translate-y-0.5 hover:shadow-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
        disabled && "cursor-not-allowed opacity-50 hover:translate-y-0",
        accent
          ? "border-primary/20 bg-primary/5"
          : "bg-background/80 hover:bg-background",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <span className="bg-muted inline-flex rounded-full p-2">
            <Icon className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="font-medium">{title}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {hint ? (
          <Badge variant="outline" className="shrink-0">
            {hint}
          </Badge>
        ) : null}
      </div>
    </button>
  )
}

function TemplateBadgeRow({ template }: { template: ReceiptIdentifierType[] }) {
  if (template.length === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        No identifiers selected
      </Badge>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {template.map((type) => (
        <Badge key={type} variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {getIdentifierLabel(type)}
        </Badge>
      ))}
    </div>
  )
}

function CurrentUnitPreviewCard({
  template,
  values,
  notes,
  activeIdentifierType,
}: {
  template: ReceiptIdentifierType[]
  values: Partial<Record<ReceiptIdentifierType, string>>
  notes: string
  activeIdentifierType: ReceiptIdentifierType | null
}) {
  const preview = getCurrentUnitPreview(template, values)

  return (
    <div className="rounded-2xl border bg-background/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">Current Unit</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Build one physical device at a time before staging it into the
            batch.
          </p>
        </div>
        {activeIdentifierType ? (
          <Badge variant="outline">
            Active {getIdentifierLabel(activeIdentifierType)}
          </Badge>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {preview.length === 0 ? (
          <Badge variant="outline">Add a template to begin</Badge>
        ) : (
          preview.map((entry) => (
            <Badge
              key={entry.type}
              variant={entry.isComplete ? "secondary" : "outline"}
              className="gap-1"
            >
              {entry.isComplete ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : null}
              {getIdentifierLabel(entry.type)}
              {entry.value ? `: ${entry.value}` : ""}
            </Badge>
          ))
        )}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {notes.trim() ? notes.trim() : "No unit note added yet."}
      </p>
    </div>
  )
}

function KeyboardShortcutList() {
  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <Keyboard className="h-4 w-4" />
        <p className="font-medium">Keyboard shortcuts</p>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <p>
          <span className="font-medium text-foreground">Enter</span> apply the
          current value
        </p>
        <p>
          <span className="font-medium text-foreground">Cmd/Ctrl + Enter</span>{" "}
          stage the current unit
        </p>
        <p>
          <span className="font-medium text-foreground">Esc</span> clear the
          current unit
        </p>
        <p>
          <span className="font-medium text-foreground">Tab / Shift + Tab</span>{" "}
          move between identifier slots
        </p>
      </div>
    </div>
  )
}

export function InventoryReceiptSessionCard({
  productId,
  productName,
  variants,
  initialVariantId,
  title = "Receive Stock",
  description = "Choose the fastest way to add inventory and keep your receiving flow focused.",
  onReceived,
}: InventoryReceiptSessionCardProps) {
  const receiveInventoryMutation = useReceiveInventoryMutation()
  const scannerInputRef = useRef<HTMLInputElement | null>(null)
  const barcodeCaptureInputRef = useRef<HTMLInputElement | null>(null)
  const ocrCaptureInputRef = useRef<HTMLInputElement | null>(null)
  const manualInputRefs = useRef<
    Partial<Record<ReceiptIdentifierType, HTMLInputElement | null>>
  >({})

  const [isBarcodeCapturePending, setIsBarcodeCapturePending] = useState(false)
  const [isOcrPending, setIsOcrPending] = useState(false)

  const [state, dispatch] = useReducer(
    receiptSessionReducer,
    createInitialState(variants, initialVariantId),
  )

  const selectedVariant = useMemo(
    () =>
      variants.find((variant) => variant.id === state.selectedVariantId) ??
      null,
    [state.selectedVariantId, variants],
  )
  const variantDefaultTemplate = useMemo(
    () => getVariantTemplate(selectedVariant),
    [selectedVariant],
  )
  const isSerialVariant = selectedVariant?.trackingMode === "serial"
  const isTemplateOverride = useMemo(
    () =>
      isSerialVariant &&
      !areIdentifierTemplatesEqual(
        state.sessionIdentifierTypes,
        variantDefaultTemplate,
      ),
    [isSerialVariant, state.sessionIdentifierTypes, variantDefaultTemplate],
  )

  useEffect(() => {
    if (!selectedVariant && variants.length > 0) {
      const fallback =
        variants.find((variant) => variant.id === initialVariantId) ||
        variants.find((variant) => variant.manageInventory) ||
        variants[0]

      if (fallback) {
        dispatch({
          type: "selectVariant",
          payload: {
            variantId: fallback.id,
            template: getVariantTemplate(fallback),
          },
        })
      }
    }
  }, [initialVariantId, selectedVariant, variants])

  const focusScannerInput = useCallback(() => {
    window.requestAnimationFrame(() => {
      scannerInputRef.current?.focus()
      scannerInputRef.current?.select()
    })
  }, [])

  const focusManualField = useCallback((type: ReceiptIdentifierType | null) => {
    if (!type) {
      return
    }

    window.requestAnimationFrame(() => {
      manualInputRefs.current[type]?.focus()
      manualInputRefs.current[type]?.select()
    })
  }, [])

  useEffect(() => {
    if (state.activePanel === "scanner") {
      focusScannerInput()
    }
  }, [focusScannerInput, state.activePanel, state.activeIdentifierType])

  useEffect(() => {
    if (state.activePanel === "manual") {
      focusManualField(
        state.activeIdentifierType ?? state.sessionIdentifierTypes[0] ?? null,
      )
    }
  }, [
    focusManualField,
    state.activeIdentifierType,
    state.activePanel,
    state.sessionIdentifierTypes,
  ])

  const moveActiveIdentifier = useCallback(
    (direction: 1 | -1) => {
      if (state.sessionIdentifierTypes.length === 0) {
        return
      }

      const currentIndex = state.activeIdentifierType
        ? state.sessionIdentifierTypes.indexOf(state.activeIdentifierType)
        : 0
      const nextIndex =
        currentIndex === -1
          ? 0
          : (currentIndex + direction + state.sessionIdentifierTypes.length) %
            state.sessionIdentifierTypes.length

      dispatch({
        type: "setActiveIdentifierType",
        payload: state.sessionIdentifierTypes[nextIndex] ?? null,
      })
      focusScannerInput()
    },
    [
      focusScannerInput,
      state.activeIdentifierType,
      state.sessionIdentifierTypes,
    ],
  )

  const resetCurrentUnit = useCallback(() => {
    dispatch({ type: "clearCurrentUnit" })
    if (state.activePanel === "scanner") {
      focusScannerInput()
    }
  }, [focusScannerInput, state.activePanel])

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
        state.activeIdentifierType ||
        getNextMissingIdentifierType(
          state.sessionIdentifierTypes,
          state.currentUnitValues,
        )

      if (!targetType) {
        toast.error("Add at least one identifier type before scanning")
        return
      }

      const nextValues = {
        ...state.currentUnitValues,
        [targetType]: trimmed,
      }

      dispatch({
        type: "applyIncomingValue",
        payload: {
          type: targetType,
          value: trimmed,
          nextActiveType: getNextMissingIdentifierType(
            state.sessionIdentifierTypes,
            nextValues,
          ),
          recentScan: {
            id: crypto.randomUUID(),
            type: targetType,
            value: trimmed,
          },
        },
      })

      if (state.activePanel === "scanner") {
        focusScannerInput()
      }
    },
    [
      focusScannerInput,
      selectedVariant,
      state.activeIdentifierType,
      state.currentUnitValues,
      state.activePanel,
      state.sessionIdentifierTypes,
    ],
  )

  const createStagePayload = useCallback(
    (
      values: Partial<Record<ReceiptIdentifierType, string>>,
      options?: {
        note?: string
        editingUnitId?: string | null
      },
    ) => {
      if (!selectedVariant || selectedVariant.trackingMode !== "serial") {
        return null
      }

      if (state.sessionIdentifierTypes.length === 0) {
        toast.error(
          "Select at least one identifier type for this receipt session",
        )
        return null
      }

      const missingTypes = state.sessionIdentifierTypes.filter(
        (type) => !values[type]?.trim(),
      )

      if (missingTypes.length > 0) {
        toast.error(
          `Complete the current unit before staging: ${missingTypes
            .map(getIdentifierLabel)
            .join(", ")}`,
        )
        return null
      }

      const identifiers = state.sessionIdentifierTypes.map((type) => ({
        type,
        value: values[type]!.trim(),
      }))

      const duplicate = identifiers.find((identifier) =>
        state.stagedUnits.some(
          (unit) =>
            unit.id !== (options?.editingUnitId ?? state.editingUnitId) &&
            unit.identifiers.some(
              (candidate) =>
                candidate.type === identifier.type &&
                candidate.value.trim().toLowerCase() ===
                  identifier.value.trim().toLowerCase(),
            ),
        ),
      )

      if (duplicate) {
        toast.error(
          `Duplicate ${getIdentifierLabel(duplicate.type)} in the staged batch`,
        )
        return null
      }

      return {
        id:
          options?.editingUnitId ?? state.editingUnitId ?? crypto.randomUUID(),
        notes: options?.note?.trim() || undefined,
        identifiers,
      }
    },
    [
      selectedVariant,
      state.editingUnitId,
      state.sessionIdentifierTypes,
      state.stagedUnits,
    ],
  )

  const applyCapturedValue = useCallback(
    (
      rawValue: string,
      options?: {
        sourceLabel?: string
      },
    ) => {
      const trimmed = rawValue.trim()

      if (
        !trimmed ||
        !selectedVariant ||
        selectedVariant.trackingMode !== "serial"
      ) {
        return
      }

      const targetType =
        state.activeIdentifierType ||
        getNextMissingIdentifierType(
          state.sessionIdentifierTypes,
          state.currentUnitValues,
        )

      if (!targetType) {
        toast.error("Choose an identifier slot before capturing a code")
        return
      }

      const nextValues = {
        ...state.currentUnitValues,
        [targetType]: trimmed,
      }
      const nextActiveType = getNextMissingIdentifierType(
        state.sessionIdentifierTypes,
        nextValues,
      )

      dispatch({
        type: "applyIncomingValue",
        payload: {
          type: targetType,
          value: trimmed,
          nextActiveType,
          recentScan: {
            id: crypto.randomUUID(),
            type: targetType,
            value: trimmed,
          },
        },
      })

      if (!nextActiveType) {
        const payload = createStagePayload(nextValues, {
          note: state.currentUnitNotes,
          editingUnitId: state.editingUnitId,
        })

        if (payload) {
          dispatch({
            type: "stageUnit",
            payload,
          })
          toast.success(
            `${options?.sourceLabel ?? "Captured value"} applied and unit auto-staged.`,
          )
        }

        return
      }

      toast.success(
        `${options?.sourceLabel ?? "Captured value"} applied to ${getIdentifierLabel(targetType)}. Ready for ${getIdentifierLabel(nextActiveType)}.`,
      )
    },
    [
      createStagePayload,
      selectedVariant,
      state.activeIdentifierType,
      state.currentUnitNotes,
      state.currentUnitValues,
      state.editingUnitId,
      state.sessionIdentifierTypes,
    ],
  )

  const stageCurrentUnit = useCallback(() => {
    const payload = createStagePayload(state.currentUnitValues, {
      note: state.currentUnitNotes,
      editingUnitId: state.editingUnitId,
    })

    if (!payload) {
      return
    }

    dispatch({
      type: "stageUnit",
      payload,
    })

    if (state.activePanel === "scanner") {
      focusScannerInput()
    }
    if (state.activePanel === "manual") {
      focusManualField(state.sessionIdentifierTypes[0] ?? null)
    }
  }, [
    createStagePayload,
    focusScannerInput,
    focusManualField,
    state.activePanel,
    state.currentUnitNotes,
    state.currentUnitValues,
    state.editingUnitId,
    state.sessionIdentifierTypes,
  ])

  useEffect(() => {
    if (
      (state.activePanel !== "scanner" && state.activePanel !== "manual") ||
      !selectedVariant ||
      !isSerialVariant
    ) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTextarea =
        target?.tagName === "TEXTAREA" ||
        target?.getAttribute("data-receipt-hotkeys") === "off"

      if (isTextarea) {
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault()
        stageCurrentUnit()
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        resetCurrentUnit()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    isSerialVariant,
    resetCurrentUnit,
    selectedVariant,
    stageCurrentUnit,
    state.activePanel,
  ])

  async function handleQuantityReceipt() {
    if (!selectedVariant) {
      return
    }

    if (state.quantityToReceive <= 0) {
      toast.error("Quantity must be greater than zero")
      return
    }

    try {
      const result = await receiveInventoryMutation.mutateAsync({
        productId,
        variantId: selectedVariant.id,
        quantity: state.quantityToReceive,
        notes: state.receiptNotes.trim() || undefined,
      })

      toast.success(
        `Received ${result.receivedQuantity} units. On hand is now ${result.newQuantity}.`,
      )
      dispatch({ type: "quantityReceiptCommitted" })
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

    if (state.stagedUnits.length === 0) {
      toast.error("Stage at least one device before committing the batch")
      return
    }

    try {
      const result = await receiveInventoryMutation.mutateAsync({
        productId,
        variantId: selectedVariant.id,
        notes: state.receiptNotes.trim() || undefined,
        identifierTemplate: state.sessionIdentifierTypes,
        units: state.stagedUnits.map((unit) => ({
          notes: unit.notes,
          identifiers: unit.identifiers,
        })),
      })

      toast.success(
        `Received ${result.receivedQuantity} tracked units. On hand is now ${result.newQuantity}.`,
      )
      dispatch({ type: "serializedReceiptCommitted" })
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

        applyCapturedValue(value, { sourceLabel: "Barcode capture" })
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

      applyCapturedValue(extractedText, { sourceLabel: "OCR capture" })
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
      <div className="rounded-2xl border bg-background/80 p-6">
        <p className="font-medium">No inventory-managed variants available</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {productName} does not currently have an inventory-managed variant
          that can receive stock.
        </p>
      </div>
    )
  }

  const currentUnitPreview = getCurrentUnitPreview(
    state.sessionIdentifierTypes,
    state.currentUnitValues,
  )

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionHeader
          eyebrow="Receipts Launchpad"
          title={title}
          description={description}
        />

        <div className="rounded-3xl border bg-background/80 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  You are receiving stock for
                </p>
                <h3 className="text-2xl font-semibold tracking-tight">
                  {selectedVariant.name}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  SKU {selectedVariant.sku} ·{" "}
                  {getTrackingDescription(selectedVariant)}
                </p>
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
            </div>

            <div className="w-full max-w-sm space-y-2">
              <Label htmlFor="receipt-variant">Variant</Label>
              {variants.length === 1 ? (
                <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm">
                  {selectedVariant.name} · {selectedVariant.sku}
                </div>
              ) : (
                <Select
                  value={state.selectedVariantId}
                  onValueChange={(value) => {
                    const nextVariant =
                      variants.find((variant) => variant.id === value) ?? null

                    if (!nextVariant) {
                      return
                    }

                    dispatch({
                      type: "selectVariant",
                      payload: {
                        variantId: nextVariant.id,
                        template: getVariantTemplate(nextVariant),
                      },
                    })
                  }}
                >
                  <SelectTrigger id="receipt-variant" className="w-full">
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
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <SectionHeader
          title="Receipt Rules"
          description={
            isSerialVariant
              ? "Keep the identifier template visible so staff always know what every staged device needs before it can be committed."
              : "Quantity-tracked variants do not need per-device identifiers. Focus on the count, notes, and confirmation summary."
          }
          action={
            isSerialVariant ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  dispatch({ type: "setPanel", payload: "template" })
                }
              >
                <PencilLine className="mr-2 h-4 w-4" />
                Edit template
              </Button>
            ) : null
          }
        />

        <div className="rounded-3xl border bg-background/80 p-6">
          {isSerialVariant ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isTemplateOverride ? "secondary" : "outline"}>
                  {isTemplateOverride ? "Session override" : "Variant default"}
                </Badge>
                <Badge variant="outline">
                  Every staged device must include{" "}
                  {joinTemplateLabel(state.sessionIdentifierTypes)}
                </Badge>
              </div>
              <TemplateBadgeRow template={state.sessionIdentifierTypes} />
              <p className="text-sm leading-6 text-muted-foreground">
                This rule set stays visible here so the receiving team can
                verify the expected identifiers before opening scanner, camera,
                or manual-entry workflows.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Badge variant="outline">No identifier template required</Badge>
              <p className="text-sm leading-6 text-muted-foreground">
                This variant is quantity tracked, so you can receive units in a
                single quantity step without staging individual devices.
              </p>
            </div>
          )}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <SectionHeader
          title="Input Methods"
          description={
            isSerialVariant
              ? "Pick the fastest way to bring values into the current unit. Scanner mode is the fastest path for keyboard-only receiving."
              : "Open the focused quantity workflow to post this receipt without distraction."
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {isSerialVariant ? (
            <>
              <ReceiptActionTile
                title="Scanner"
                description="Keyboard-first receiving with a dedicated buffer, progress strip, and quick staging flow."
                icon={ScanBarcode}
                onClick={() =>
                  dispatch({ type: "setPanel", payload: "scanner" })
                }
                hint="Fastest"
                accent
              />
              <ReceiptActionTile
                title="Camera"
                description="Use barcode capture or OCR assist when a hardware scanner is not available."
                icon={Camera}
                onClick={() =>
                  dispatch({ type: "setPanel", payload: "camera" })
                }
                hint="Assist"
              />
              <ReceiptActionTile
                title="Manual Entry"
                description="Enter or correct identifier fields deliberately, then stage the current device."
                icon={Type}
                onClick={() =>
                  dispatch({ type: "setPanel", payload: "manual" })
                }
                hint={state.editingUnitId ? "Editing" : "Precise"}
              />
              <ReceiptActionTile
                title="Template"
                description="Adjust the receipt identifier template for this session without changing the variant default."
                icon={Sparkles}
                onClick={() =>
                  dispatch({ type: "setPanel", payload: "template" })
                }
                hint={isTemplateOverride ? "Override" : "Default"}
              />
            </>
          ) : (
            <ReceiptActionTile
              title="Quantity Receipt"
              description="Post the received quantity in one focused step with a quick before-and-after summary."
              icon={PackagePlus}
              onClick={() =>
                dispatch({ type: "setPanel", payload: "quantity" })
              }
              hint="Focused"
              accent
            />
          )}
        </div>
      </section>

      {isSerialVariant ? (
        <>
          <Separator />

          <section className="space-y-4">
            <SectionHeader
              title="Staged Batch"
              description="Stage units as you scan or enter them. Review the batch here before you commit the full receipt."
              action={
                state.stagedUnits.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => dispatch({ type: "clearBatch" })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear batch
                  </Button>
                ) : null
              }
            />

            <div className="space-y-4 rounded-3xl border bg-background/80 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {state.stagedUnits.length} staged unit
                  {state.stagedUnits.length === 1 ? "" : "s"}
                </Badge>
                {state.editingUnitId ? (
                  <Badge variant="outline">Editing staged unit</Badge>
                ) : null}
              </div>

              <div className="rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Identifiers</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.stagedUnits.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-12 text-center text-muted-foreground"
                        >
                          No units staged yet. Open Scanner, Camera, or Manual
                          Entry to start building this receipt batch.
                        </TableCell>
                      </TableRow>
                    ) : (
                      state.stagedUnits.map((unit) => (
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
                            {unit.notes || "No note"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  dispatch({
                                    type: "loadStagedUnit",
                                    payload: unit,
                                  })
                                }
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  dispatch({
                                    type: "removeStagedUnit",
                                    payload: unit.id,
                                  })
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="space-y-2">
                  <Label htmlFor="receipt-batch-notes">Batch Notes</Label>
                  <Textarea
                    id="receipt-batch-notes"
                    placeholder="Receiving note for the full batch"
                    value={state.receiptNotes}
                    onChange={(event) =>
                      dispatch({
                        type: "setReceiptNotes",
                        payload: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Commit when the staged list matches the physical items you
                    just received.
                  </p>
                  <Button
                    onClick={() => void handleSerializedReceipt()}
                    disabled={
                      receiveInventoryMutation.isPending ||
                      state.stagedUnits.length === 0 ||
                      state.sessionIdentifierTypes.length === 0
                    }
                    className="w-full sm:w-auto"
                  >
                    {receiveInventoryMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PackagePlus className="mr-2 h-4 w-4" />
                    )}
                    Commit Serialized Receipt
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}

      <ReceiptWorkflowPanel
        open={state.activePanel === "template"}
        onOpenChange={(open) =>
          dispatch({ type: "setPanel", payload: open ? "template" : null })
        }
        title="Receipt Identifier Template"
        description="Adjust the active identifier checklist for this receiving session. Changing it clears staged units so the batch stays consistent."
        desktopClassName="sm:max-w-3xl"
      >
        <div className="space-y-6">
          <div className="rounded-2xl border bg-muted/20 p-4">
            <p className="font-medium">Current session rule</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Every staged device in this session must include{" "}
              {joinTemplateLabel(state.sessionIdentifierTypes)}.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">Available identifier types</p>
                <p className="text-sm text-muted-foreground">
                  Toggle the fields this session should expect on every device.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  dispatch({
                    type: "setTemplate",
                    payload: variantDefaultTemplate,
                  })
                }
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to variant default
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {INVENTORY_IDENTIFIER_TYPE_ORDER.map((type) => {
                const selected = state.sessionIdentifierTypes.includes(type)

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      const nextTemplate = selected
                        ? state.sessionIdentifierTypes.filter(
                            (value) => value !== type,
                          )
                        : [...state.sessionIdentifierTypes, type]

                      dispatch({
                        type: "setTemplate",
                        payload: nextTemplate,
                      })
                    }}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all",
                      selected
                        ? "border-primary/30 bg-primary/5"
                        : "bg-background/80 hover:border-foreground/20",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{getIdentifierLabel(type)}</p>
                      {selected ? (
                        <Badge variant="secondary">Included</Badge>
                      ) : (
                        <Badge variant="outline">Optional</Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selected
                        ? "This field will be required on every staged device in this session."
                        : "Add this field if the received devices carry this identifier."}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </ReceiptWorkflowPanel>

      <ReceiptWorkflowPanel
        open={state.activePanel === "scanner"}
        onOpenChange={(open) =>
          dispatch({ type: "setPanel", payload: open ? "scanner" : null })
        }
        title="Scanner Workspace"
        description="Keep your hands on the scanner and keyboard. Apply values, advance slots, and stage units without leaving this focused workspace."
        mobileLayout="drawer"
        desktopClassName="sm:max-w-[min(92vw,96rem)]"
      >
        <div className="space-y-6">
          <Input
            ref={scannerInputRef}
            id="scanner-buffer"
            value={state.scannerBuffer}
            onChange={(event) =>
              dispatch({
                type: "setScannerBuffer",
                payload: event.target.value,
              })
            }
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault()
                stageCurrentUnit()
                return
              }

              if (event.key === "Enter") {
                event.preventDefault()
                applyIncomingValue(state.scannerBuffer)
                return
              }

              if (event.key === "Escape") {
                event.preventDefault()
                resetCurrentUnit()
                return
              }

              if (event.key === "Tab") {
                event.preventDefault()
                moveActiveIdentifier(event.shiftKey ? -1 : 1)
              }
            }}
            placeholder={
              state.activeIdentifierType
                ? `Scan or paste ${getIdentifierLabel(state.activeIdentifierType)}`
                : "Choose an identifier slot first"
            }
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Hidden scanner capture input"
            className="pointer-events-none absolute h-px w-px opacity-0"
          />

          <div className="rounded-3xl border bg-background/80 p-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Ready to scan
                  </p>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {state.activeIdentifierType
                      ? `Scanning into ${getIdentifierLabel(state.activeIdentifierType)}`
                      : "Choose an identifier slot to begin"}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    The scanner is listening in the background. Scan, paste, or
                    type a value and press Enter to apply it instantly.
                  </p>
                </div>
                <Badge variant="secondary">Keyboard-first</Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {state.sessionIdentifierTypes.map((type) => {
                  const isActive = state.activeIdentifierType === type
                  const isComplete = Boolean(
                    state.currentUnitValues[type]?.trim(),
                  )

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        dispatch({
                          type: "setActiveIdentifierType",
                          payload: type,
                        })
                        focusScannerInput()
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        isActive
                          ? "border-primary/40 bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {isComplete ? "✓ " : ""}
                      {getIdentifierLabel(type)}
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={focusScannerInput}
                className="w-full rounded-3xl border border-dashed bg-muted/30 px-5 py-6 text-left transition-colors hover:border-foreground/20 hover:bg-muted/40"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {state.scannerBuffer.trim()
                        ? "Current captured value"
                        : "Waiting for the next scan"}
                    </p>
                    <p className="font-mono text-2xl tracking-tight text-foreground">
                      {state.scannerBuffer.trim() || "Scan now..."}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {state.activeIdentifierType
                      ? getIdentifierLabel(state.activeIdentifierType)
                      : "No active slot"}
                  </Badge>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Keep the scanner moving. This workspace keeps focus in the
                  background so wedge scanners can continue without using the
                  mouse.
                </p>
              </button>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => applyIncomingValue(state.scannerBuffer)}
                  disabled={!state.scannerBuffer.trim()}
                >
                  Apply value
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={stageCurrentUnit}
                >
                  <PackagePlus className="mr-2 h-4 w-4" />
                  {state.editingUnitId
                    ? "Save staged unit"
                    : "Stage current unit"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetCurrentUnit}
                >
                  Clear current unit
                </Button>
              </div>
            </div>
          </div>

          <KeyboardShortcutList />

          <CurrentUnitPreviewCard
            template={state.sessionIdentifierTypes}
            values={state.currentUnitValues}
            notes={state.currentUnitNotes}
            activeIdentifierType={state.activeIdentifierType}
          />

          <div className="space-y-2">
            <Label htmlFor="scanner-unit-notes">Unit note</Label>
            <Input
              id="scanner-unit-notes"
              value={state.currentUnitNotes}
              data-receipt-hotkeys="off"
              onChange={(event) =>
                dispatch({
                  type: "setCurrentUnitNotes",
                  payload: event.target.value,
                })
              }
              placeholder="Optional note for this device"
            />
          </div>

          <div className="rounded-2xl border bg-background/80 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <p className="font-medium">Recent scanned values</p>
            </div>
            <div className="mt-4 space-y-3">
              {state.recentScans.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Applied values will appear here so staff can quickly confirm
                  what was just scanned.
                </p>
              ) : (
                state.recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{scan.value}</p>
                      <p className="text-xs text-muted-foreground">
                        Applied to {getIdentifierLabel(scan.type)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {getIdentifierLabel(scan.type)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ReceiptWorkflowPanel>

      <ReceiptWorkflowPanel
        open={state.activePanel === "manual"}
        onOpenChange={(open) =>
          dispatch({ type: "setPanel", payload: open ? "manual" : null })
        }
        title={state.editingUnitId ? "Edit Staged Unit" : "Manual Entry"}
        description="Use this focused form when you need to type values carefully or correct a staged device."
        desktopClassName="sm:max-w-4xl"
      >
        <div className="space-y-6">
          <KeyboardShortcutList />

          <CurrentUnitPreviewCard
            template={state.sessionIdentifierTypes}
            values={state.currentUnitValues}
            notes={state.currentUnitNotes}
            activeIdentifierType={state.activeIdentifierType}
          />

          <div className="grid gap-4 md:grid-cols-2">
            {state.sessionIdentifierTypes.map((type) => (
              <div key={type} className="space-y-2">
                <Label htmlFor={`manual-${type}`}>
                  {getIdentifierLabel(type)}
                </Label>
                <Input
                  ref={(node) => {
                    manualInputRefs.current[type] = node
                  }}
                  id={`manual-${type}`}
                  value={state.currentUnitValues[type] ?? ""}
                  onFocus={() =>
                    dispatch({
                      type: "setActiveIdentifierType",
                      payload: type,
                    })
                  }
                  onChange={(event) =>
                    dispatch({
                      type: "setCurrentValue",
                      payload: {
                        type,
                        value: event.target.value,
                      },
                    })
                  }
                  onKeyDown={(event) => {
                    if (
                      (event.metaKey || event.ctrlKey) &&
                      event.key === "Enter"
                    ) {
                      event.preventDefault()
                      stageCurrentUnit()
                      return
                    }

                    if (event.key === "Escape") {
                      event.preventDefault()
                      resetCurrentUnit()
                      return
                    }

                    if (event.key === "Enter") {
                      event.preventDefault()

                      const currentIndex =
                        state.sessionIdentifierTypes.indexOf(type)
                      const nextType =
                        state.sessionIdentifierTypes[currentIndex + 1] ?? null

                      if (nextType) {
                        dispatch({
                          type: "setActiveIdentifierType",
                          payload: nextType,
                        })
                        focusManualField(nextType)
                        return
                      }

                      stageCurrentUnit()
                    }
                  }}
                  placeholder={`Enter ${getIdentifierLabel(type)}`}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-unit-notes">Unit note</Label>
            <Input
              id="manual-unit-notes"
              value={state.currentUnitNotes}
              data-receipt-hotkeys="off"
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault()
                  stageCurrentUnit()
                  return
                }

                if (event.key === "Escape") {
                  event.preventDefault()
                  resetCurrentUnit()
                }
              }}
              onChange={(event) =>
                dispatch({
                  type: "setCurrentUnitNotes",
                  payload: event.target.value,
                })
              }
              placeholder="Optional note for this device"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={stageCurrentUnit}>
              <PackagePlus className="mr-2 h-4 w-4" />
              {state.editingUnitId ? "Save staged unit" : "Stage current unit"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetCurrentUnit}>
              Clear current unit
            </Button>
          </div>
        </div>
      </ReceiptWorkflowPanel>

      <ReceiptWorkflowPanel
        open={state.activePanel === "camera"}
        onOpenChange={(open) =>
          dispatch({ type: "setPanel", payload: open ? "camera" : null })
        }
        title="Camera Assist"
        description="Capture a barcode or use OCR assist, then review the detected value before applying it to the active slot."
        desktopClassName="sm:max-w-4xl"
      >
        <div className="space-y-6">
          <div className="rounded-2xl border bg-muted/20 p-4">
            <p className="font-medium">Automatic camera flow</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {state.activeIdentifierType
                ? `Captured values are applied straight into ${getIdentifierLabel(state.activeIdentifierType)}. When the current unit becomes complete, it will stage automatically.`
                : "Choose an identifier slot first from manual entry or scanner mode."}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <ReceiptActionTile
              title="Capture Barcode"
              description="Open the device camera and detect a barcode directly from the image."
              icon={Camera}
              onClick={() => barcodeCaptureInputRef.current?.click()}
              hint={isBarcodeCapturePending ? "Working" : "Barcode"}
              disabled={isBarcodeCapturePending}
            />
            <ReceiptActionTile
              title="OCR Assist"
              description="Extract readable text when a barcode is unavailable or damaged."
              icon={Type}
              onClick={() => ocrCaptureInputRef.current?.click()}
              hint={isOcrPending ? "Working" : "OCR"}
              disabled={isOcrPending}
            />
          </div>

          <div className="rounded-2xl border bg-background/80 p-4">
            <p className="font-medium">What happens after capture</p>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                1. The detected code fills the active identifier slot
                automatically.
              </p>
              <p>2. The next missing slot becomes active immediately.</p>
              <p>3. If the unit is complete, it is staged automatically.</p>
              <p>
                OCR is still more error-prone than barcode scanning, so use
                manual entry to correct anything that looks off.
              </p>
            </div>
          </div>

          <CurrentUnitPreviewCard
            template={state.sessionIdentifierTypes}
            values={state.currentUnitValues}
            notes={state.currentUnitNotes}
            activeIdentifierType={state.activeIdentifierType}
          />

          <div className="space-y-2">
            <Label htmlFor="camera-unit-notes">Unit note</Label>
            <Input
              id="camera-unit-notes"
              value={state.currentUnitNotes}
              data-receipt-hotkeys="off"
              onChange={(event) =>
                dispatch({
                  type: "setCurrentUnitNotes",
                  payload: event.target.value,
                })
              }
              placeholder="Optional note for the current device"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={stageCurrentUnit}
            >
              <PackagePlus className="mr-2 h-4 w-4" />
              {state.editingUnitId ? "Save staged unit" : "Stage current unit"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetCurrentUnit}>
              Clear current unit
            </Button>
          </div>

          <div className="rounded-2xl border bg-background/80 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <p className="font-medium">Recent captured values</p>
            </div>
            <div className="mt-4 space-y-3">
              {state.recentScans.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Barcode and OCR captures will appear here so staff can quickly
                  confirm what was just applied.
                </p>
              ) : (
                state.recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{scan.value}</p>
                      <p className="text-xs text-muted-foreground">
                        Applied to {getIdentifierLabel(scan.type)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {getIdentifierLabel(scan.type)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ReceiptWorkflowPanel>

      <ReceiptWorkflowPanel
        open={state.activePanel === "quantity"}
        onOpenChange={(open) =>
          dispatch({ type: "setPanel", payload: open ? "quantity" : null })
        }
        title="Quantity Receipt"
        description="Post the received count in one step, review the impact, and commit the quantity with confidence."
        desktopClassName="sm:max-w-xl"
      >
        <div className="space-y-6">
          <div className="rounded-2xl border bg-muted/20 p-4">
            <p className="font-medium">{selectedVariant.name}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Current on hand: {selectedVariant.onHandQuantity ?? 0}. This
              quantity receipt will update the stock counts immediately.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity-to-receive">Quantity to receive</Label>
            <Input
              id="quantity-to-receive"
              type="number"
              min={1}
              value={state.quantityToReceive}
              onChange={(event) =>
                dispatch({
                  type: "setQuantity",
                  payload: Math.max(1, parseInt(event.target.value, 10) || 1),
                })
              }
            />
          </div>

          <div className="rounded-2xl border bg-background/80 p-4">
            <p className="font-medium">Receipt summary</p>
            <p className="mt-2 text-sm text-muted-foreground">
              On hand will move from {selectedVariant.onHandQuantity ?? 0} to{" "}
              {(selectedVariant.onHandQuantity ?? 0) + state.quantityToReceive}.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity-receipt-notes">Batch notes</Label>
            <Textarea
              id="quantity-receipt-notes"
              placeholder="Supplier reference, receiving note, or batch comment"
              value={state.receiptNotes}
              onChange={(event) =>
                dispatch({
                  type: "setReceiptNotes",
                  payload: event.target.value,
                })
              }
            />
          </div>

          <Button
            onClick={() => void handleQuantityReceipt()}
            disabled={receiveInventoryMutation.isPending}
          >
            {receiveInventoryMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PackagePlus className="mr-2 h-4 w-4" />
            )}
            Commit Quantity Receipt
          </Button>
        </div>
      </ReceiptWorkflowPanel>

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
    </div>
  )
}

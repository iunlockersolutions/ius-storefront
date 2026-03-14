export const INVENTORY_IDENTIFIER_TYPE_ORDER = [
  "serial",
  "imei",
  "imei2",
  "barcode",
] as const

export type ReceiptIdentifierType =
  (typeof INVENTORY_IDENTIFIER_TYPE_ORDER)[number]

export function normalizeReceiptIdentifierTypes(
  values: readonly ReceiptIdentifierType[] | null | undefined,
) {
  const seen = new Set<ReceiptIdentifierType>()
  const input = values ?? []

  return INVENTORY_IDENTIFIER_TYPE_ORDER.filter((value) => {
    if (!input.includes(value) || seen.has(value)) {
      return false
    }

    seen.add(value)
    return true
  })
}

export function getDefaultSerialReceiptIdentifierTypes() {
  return ["serial"] as ReceiptIdentifierType[]
}

export function sanitizeReceiptIdentifierTypes(options: {
  manageInventory: boolean
  trackingMode: "quantity" | "serial"
  values: readonly ReceiptIdentifierType[] | null | undefined
}) {
  if (!options.manageInventory || options.trackingMode === "quantity") {
    return [] as ReceiptIdentifierType[]
  }

  return normalizeReceiptIdentifierTypes(options.values)
}

export function normalizeEntityName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number | string,
  currency: string = "LKR",
  locale: string = "en-LK",
): string {
  const numericAmount =
    typeof amount === "string" ? parseCurrencyAmount(amount) : amount

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numericAmount)
}

export function parseCurrencyAmount(
  amount: string | number | null | undefined,
): number {
  if (typeof amount === "number") {
    return amount
  }

  if (typeof amount === "string") {
    const parsed = Number.parseFloat(amount)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    ...options,
  }).format(d)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

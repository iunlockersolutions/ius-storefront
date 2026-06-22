import { routes } from "@/configs/routes"

import { type HeaderUser } from "./types"

const STAFF_ROLES = new Set(["admin", "manager", "support"])

type ProductHrefParams = {
  brand?: string
  category?: string
}

export function getStorefrontProductsHref({
  brand,
  category,
}: ProductHrefParams = {}) {
  const searchParams = new URLSearchParams()

  if (category) {
    searchParams.set("category", category)
  }

  if (brand) {
    searchParams.set("brand", brand)
  }

  const queryString = searchParams.toString()

  return queryString
    ? `${routes.storefront.prodcuts.root}?${queryString}`
    : routes.storefront.prodcuts.root
}

export function getCurrentStorefrontPathWithQuery() {
  if (typeof window === "undefined") {
    return routes.storefront.root
  }

  return `${window.location.pathname}${window.location.search}`
}

export function isStaffHeaderUser(user?: HeaderUser) {
  return (user?.role ?? "")
    .split(",")
    .map((role) => role.trim())
    .some((role) => STAFF_ROLES.has(role))
}

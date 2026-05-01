export type CatalogModel = {
  name: string
  href: string
  priceFrom?: number
  gradient?: string
  tagline?: string
  featured?: boolean
}

export type CatalogCategory = {
  id: string
  label: string
  exploreAllHref: string
  models: CatalogModel[]
  shopLinks: { label: string; href: string }[]
  moreLinks: { label: string; href: string }[]
}

export type HeaderLink = {
  id: string
  label: string
  href: string
}

export type HeaderUser = {
  name?: string | null
  email: string
  role?: string | null
}

"use client"

import { m } from "motion/react"

import { type CatalogCategory } from "../types"
import { listVariants } from "./animation"
import { ColumnLinks } from "./column-links"

type ProductFlyoutProps = {
  category: CatalogCategory
  onNavigate: () => void
}

export function ProductFlyout({ category, onNavigate }: ProductFlyoutProps) {
  const rest = category.models.filter((model) => !model.featured)

  return (
    <m.div
      className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-8 pt-6 pb-10"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <ColumnLinks
          heading={`Explore ${category.label}`}
          items={[
            {
              label: `Explore All ${category.label}`,
              href: category.exploreAllHref,
              bold: true,
            },
            ...rest.map((model) => ({ label: model.name, href: model.href })),
          ]}
          onNavigate={onNavigate}
        />

        <ColumnLinks
          heading={`Shop ${category.label}`}
          items={category.shopLinks}
          onNavigate={onNavigate}
        />

        <ColumnLinks
          heading={`More from ${category.label}`}
          items={category.moreLinks}
          onNavigate={onNavigate}
        />
      </div>
    </m.div>
  )
}

"use client"

import * as React from "react"

import { type StorefrontNavigationData } from "@/lib/storefront/navigation"

export function useStorefrontProductNavigation(
  navigation: StorefrontNavigationData,
) {
  const initialCategorySlug = navigation.productCategories[0]?.slug ?? null
  const initialBrandId = navigation.productCategories[0]?.brands[0]?.id ?? null

  const [selectedCategorySlug, setSelectedCategorySlug] =
    React.useState(initialCategorySlug)
  const [selectedBrandId, setSelectedBrandId] = React.useState(initialBrandId)

  const activeCategory =
    navigation.productCategories.find(
      (category) => category.slug === selectedCategorySlug,
    ) ?? navigation.productCategories[0]

  const activeBrand =
    activeCategory?.brands.find((brand) => brand.id === selectedBrandId) ??
    activeCategory?.brands[0]

  const selectCategory = React.useCallback(
    (categorySlug: string) => {
      const nextCategory = navigation.productCategories.find(
        (category) => category.slug === categorySlug,
      )

      setSelectedCategorySlug(categorySlug)
      setSelectedBrandId(nextCategory?.brands[0]?.id ?? null)
    },
    [navigation.productCategories],
  )

  const selectBrand = React.useCallback((brandId: string) => {
    setSelectedBrandId(brandId)
  }, [])

  const reset = React.useCallback(() => {
    setSelectedCategorySlug(initialCategorySlug)
    setSelectedBrandId(initialBrandId)
  }, [initialBrandId, initialCategorySlug])

  return {
    activeBrand,
    activeCategory,
    reset,
    selectBrand,
    selectCategory,
  }
}

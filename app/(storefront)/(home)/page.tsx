import {
  getDealProducts,
  getHomeCategoryProductSections,
} from "@/lib/actions/storefront"

import { ContactSection } from "./_sections/contact-section"
import { DealsSection } from "./_sections/deals-section"
import { HeroSection } from "./_sections/hero-section"
import { ProductCategorySection } from "./_sections/product-category-section"
import { PromoFreeDelivery } from "./_sections/promo-banners-section"
import { StoreInfoSection } from "./_sections/store-info-section"

export const revalidate = 1800 // 30min

const HOME_PRODUCT_CATEGORY_SLUGS = [
  "iphone",
  "macbook",
  "airpods",
  "apple-watch",
  "accessories",
]

export default async function HomePage() {
  const [productCategorySections, deals] = await Promise.all([
    getHomeCategoryProductSections({
      slugs: HOME_PRODUCT_CATEGORY_SLUGS,
      limitPerSection: 8,
    }),
    getDealProducts(10),
  ])

  return (
    <>
      <HeroSection />

      {productCategorySections.map((section) => (
        <ProductCategorySection
          key={section.id}
          title={section.title}
          eyebrow={section.eyebrow}
          href={section.href}
          products={section.products}
        />
      ))}

      <PromoFreeDelivery />

      <DealsSection products={deals} />

      <StoreInfoSection />

      <ContactSection />
    </>
  )
}

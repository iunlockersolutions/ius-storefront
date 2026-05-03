import { getActiveBrands } from "@/lib/actions/brand"
import {
  getDealProducts,
  getFeaturedCategories,
  getHomeCategoryProductSections,
  getTopReviews,
} from "@/lib/actions/storefront"

import { BrandsSection } from "./_sections/brands-section"
import { CategoriesSection } from "./_sections/categories-section"
import { ContactSection } from "./_sections/contact-section"
import { DealsSection } from "./_sections/deals-section"
import { HeroSection } from "./_sections/hero-section"
import { NewsletterSection } from "./_sections/newsletter-section"
import { ProductCategorySection } from "./_sections/product-category-section"
import {
  PromoFreeDelivery,
  PromoTradeIn,
} from "./_sections/promo-banners-section"
import { ReviewsSection } from "./_sections/reviews-section"
import { StoreInfoSection } from "./_sections/store-info-section"

export const revalidate = 1800

const HOME_PRODUCT_CATEGORY_SLUGS = ["iphone", "mac", "airpods", "accessories"]

export default async function HomePage() {
  const [productCategorySections, categories, deals, brands, topReviews] =
    await Promise.all([
      getHomeCategoryProductSections({
        slugs: HOME_PRODUCT_CATEGORY_SLUGS,
        limitPerSection: 8,
      }),
      getFeaturedCategories(8),
      getDealProducts(10),
      getActiveBrands({ failSoft: true }),
      getTopReviews(6),
    ])

  const brandsList = brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: b.logo,
    productCount: b.productCount,
  }))

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

      <CategoriesSection categories={categories} />

      <PromoTradeIn />

      <PromoFreeDelivery />

      <DealsSection products={deals} />

      <BrandsSection brands={brandsList} />

      <ReviewsSection reviews={topReviews} />

      <StoreInfoSection />

      <ContactSection />

      <NewsletterSection />
    </>
  )
}

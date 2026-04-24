import { getActiveBrands } from "@/lib/actions/brand"
import {
  getBestSellers,
  getDealProducts,
  getFeaturedCategories,
  getFeaturedProducts,
  getNewArrivals,
  getTopReviews,
} from "@/lib/actions/storefront"

import { BestSellersSection } from "./_sections/best-sellers-section"
import { BrandsSection } from "./_sections/brands-section"
import { CategoriesSection } from "./_sections/categories-section"
import { ContactSection } from "./_sections/contact-section"
import { DealsSection } from "./_sections/deals-section"
import { FeaturedProductsSection } from "./_sections/featured-products-section"
import { HeroSection } from "./_sections/hero-section"
import { NewArrivalsSection } from "./_sections/new-arrivals-section"
import { NewsletterSection } from "./_sections/newsletter-section"
import {
  PromoFreeDelivery,
  PromoTradeIn,
} from "./_sections/promo-banners-section"
import { ReviewsSection } from "./_sections/reviews-section"
import { StoreInfoSection } from "./_sections/store-info-section"

export const revalidate = 1800

export default async function HomePage() {
  const [
    bestSellers,
    categories,
    featuredProducts,
    deals,
    brands,
    newArrivals,
    topReviews,
  ] = await Promise.all([
    getBestSellers(10),
    getFeaturedCategories(8),
    getFeaturedProducts(8),
    getDealProducts(10),
    getActiveBrands({ failSoft: true }),
    getNewArrivals(10),
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

      <BestSellersSection products={bestSellers} />

      <CategoriesSection categories={categories} />

      <PromoTradeIn />

      <NewArrivalsSection products={newArrivals} />

      <FeaturedProductsSection products={featuredProducts} />

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

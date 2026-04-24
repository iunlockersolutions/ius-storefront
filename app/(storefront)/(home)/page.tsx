import { getActiveBrands } from "@/lib/actions/brand"
import {
  getBestSellers,
  getDealProducts,
  getFeaturedCategories,
  getFeaturedProducts,
  getNewArrivals,
  getTopReviews,
} from "@/lib/actions/storefront"

import { BestSellersSection } from "./_components/best-sellers-section"
import { BrandsSection } from "./_components/brands-section"
import { CategoriesSection } from "./_components/categories-section"
import { ContactSection } from "./_components/contact-section"
import { DealsSection } from "./_components/deals-section"
import { FeaturedProductsSection } from "./_components/featured-products-section"
import { HeroSection } from "./_components/hero-section"
import { NewArrivalsSection } from "./_components/new-arrivals-section"
import { NewsletterSection } from "./_components/newsletter-section"
import {
  PromoFreeDelivery,
  PromoTradeIn,
} from "./_components/promo-banners-section"
import { ReviewsSection } from "./_components/reviews-section"
import { StoreInfoSection } from "./_components/store-info-section"

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

      <CategoriesSection categories={categories} />

      <BestSellersSection products={bestSellers} />

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

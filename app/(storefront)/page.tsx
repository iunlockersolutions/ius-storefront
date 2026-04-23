import { getActiveBrands } from "@/lib/actions/brand"
import {
  getBestSellers,
  getDealProducts,
  getFeaturedCategories,
  getFeaturedProducts,
  getNewArrivals,
  getTopReviews,
} from "@/lib/actions/storefront"

import { BestSellersSection } from "./_components/home/best-sellers-section"
import { BrandsSection } from "./_components/home/brands-section"
import { CategoriesSection } from "./_components/home/categories-section"
import { ContactSection } from "./_components/home/contact-section"
import { DealsSection } from "./_components/home/deals-section"
import { FeaturedProductsSection } from "./_components/home/featured-products-section"
import { HeroSection } from "./_components/home/hero-section"
import { NewArrivalsSection } from "./_components/home/new-arrivals-section"
import { NewsletterSection } from "./_components/home/newsletter-section"
import {
  PromoFreeDelivery,
  PromoTradeIn,
} from "./_components/home/promo-banners-section"
import { ReviewsSection } from "./_components/home/reviews-section"
import { StoreInfoSection } from "./_components/home/store-info-section"

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

  // Map brands to the shape BrandsSection expects
  const brandsList = brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: b.logo,
    productCount: b.productCount,
  }))

  return (
    <div className="flex flex-col">
      {/* 1. Hero carousel */}
      <HeroSection />

      {/* Everything below the hero sits on an opaque background so the fixed
          hero never bleeds through as sections scroll over it. */}
      <div className="relative z-0 bg-white">
        {/* 2. Shop by Category — compact icon strip */}
        <CategoriesSection categories={categories} />

        {/* 3. Best Sellers — horizontal scroll */}
        <BestSellersSection products={bestSellers} />

        {/* ── Promo: Trade In ── */}
        <PromoTradeIn />

        {/* 4. New Arrivals — horizontal scroll */}
        <NewArrivalsSection products={newArrivals} />

        {/* 5. Featured Products grid */}
        <FeaturedProductsSection products={featuredProducts} />

        {/* ── Promo: Free Delivery ── */}
        <PromoFreeDelivery />

        {/* 6. Deals & Promotions — dark section */}
        <DealsSection products={deals} />

        {/* 7. Shop by Brand */}
        <BrandsSection brands={brandsList} />

        {/* 8. Customer Reviews */}
        <ReviewsSection reviews={topReviews} />

        {/* 9. Store info — Ways to Pay, Delivery, Collections */}
        <StoreInfoSection />

        {/* 10. Contact Us */}
        <ContactSection />

        {/* 11. Newsletter */}
        <NewsletterSection />
      </div>
    </div>
  )
}

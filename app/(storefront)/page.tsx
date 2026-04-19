import {
  getBestSellers,
  getDealProducts,
  getFeaturedCategories,
  getFeaturedProducts,
  getNewArrivals,
} from "@/lib/actions/storefront"

import { DealsSection } from "./_components/deals-section"
import { FeaturedCategories } from "./_components/featured-categories"
import { HeroSection } from "./_components/hero-section"
import { NewsletterSection } from "./_components/newsletter-section"
import { ProductGridSection } from "./_components/product-grid-section"

export const revalidate = 1800

export default async function HomePage() {
  const [featuredProducts, newArrivals, bestSellers, categories, deals] =
    await Promise.all([
      getFeaturedProducts(8),
      getNewArrivals(8),
      getBestSellers(8),
      getFeaturedCategories(6),
      getDealProducts(4),
    ])

  return (
    <div className="flex flex-col">
      <HeroSection
        title="Welcome to EvoluX"
        subtitle="Your trusted destination for mobile phones, accessories, and electronics. Quality products at competitive prices."
        ctaText="Browse Products"
        ctaLink="/products"
        secondaryCtaText="View Categories"
        secondaryCtaLink="/categories"
      />

      <FeaturedCategories categories={categories} />

      <ProductGridSection
        title="Featured Products"
        subtitle="Handpicked selection of our best products"
        products={featuredProducts}
        viewAllLink="/products?featured=true"
        viewAllText="View All Featured"
      />

      {deals.length > 0 && <DealsSection products={deals} />}

      <ProductGridSection
        title="New Arrivals"
        subtitle="Check out our latest additions"
        products={newArrivals}
        viewAllLink="/products?sort=newest"
        viewAllText="View All New"
        className="bg-muted/30"
      />

      <ProductGridSection
        title="Best Sellers"
        subtitle="Customer favorites and top-rated products"
        products={bestSellers}
        viewAllLink="/products?sort=popular"
        viewAllText="View All Best Sellers"
      />

      <NewsletterSection />
    </div>
  )
}

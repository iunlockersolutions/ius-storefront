import { DealsSection } from "@/components/storefront/home/deals-section"
import { FeaturedCategories } from "@/components/storefront/home/featured-categories"
import { HeroSection } from "@/components/storefront/home/hero-section"
import { NewsletterSection } from "@/components/storefront/home/newsletter-section"
import { ProductGridSection } from "@/components/storefront/home/product-grid-section"
import {
  getBestSellers,
  getDealProducts,
  getFeaturedCategories,
  getFeaturedProducts,
  getNewArrivals,
} from "@/lib/actions/storefront"

/**
 * Storefront Home Page
 *
 * The main landing page for customers with featured content.
 */
export default async function HomePage() {
  // Fetch all data in parallel
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
      {/* Hero Section */}
      <HeroSection
        title="Welcome to IUS Shop"
        subtitle="Your trusted destination for mobile phones, accessories, and electronics. Quality products at competitive prices."
        ctaText="Browse Products"
        ctaLink="/products"
        secondaryCtaText="View Categories"
        secondaryCtaLink="/categories"
      />

      {/* Featured Categories */}
      <FeaturedCategories categories={categories} />

      {/* Featured Products */}
      <ProductGridSection
        title="Featured Products"
        subtitle="Handpicked selection of our best products"
        products={featuredProducts}
        viewAllLink="/products?featured=true"
        viewAllText="View All Featured"
      />

      {/* Deals Section */}
      {deals.length > 0 && <DealsSection products={deals} />}

      {/* New Arrivals */}
      <ProductGridSection
        title="New Arrivals"
        subtitle="Check out our latest additions"
        products={newArrivals}
        viewAllLink="/products?sort=newest"
        viewAllText="View All New"
        className="bg-muted/30"
      />

      {/* Best Sellers */}
      <ProductGridSection
        title="Best Sellers"
        subtitle="Customer favorites and top-rated products"
        products={bestSellers}
        viewAllLink="/products?sort=popular"
        viewAllText="View All Best Sellers"
      />

      {/* Newsletter */}
      <NewsletterSection />
    </div>
  )
}

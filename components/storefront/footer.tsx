import Link from "next/link"

/**
 * Storefront Footer
 *
 * Footer for the storefront with links and information.
 */
export function StorefrontFooter() {
  return (
    <footer className="border-t bg-neutral-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold">IUS Shop</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Your trusted destination for mobile phones, accessories, and
              electronics.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold">Shop</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/deals"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Deals
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold">Account</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/auth/login"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Track Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold">Support</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Shipping Info
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t pt-8 text-center text-sm text-neutral-600 dark:text-neutral-400">
          <p>© {new Date().getFullYear()} IUS Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

import Link from "next/link"

import { routes } from "@/configs/routes"

export function Footer() {
  return (
    <footer className="border-t bg-zinc-50">
      <div className="section-container">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-bold">EvoluX</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Your trusted destination for mobile phones, accessories, and
              electronics.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">Shop</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href={routes.storefront.prodcuts.root}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href={routes.storefront.categories.root}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href={routes.storefront.deals.root}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Deals
                </Link>
              </li>
              <li>
                <Link
                  href={routes.storefront.installmentPlans.root}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  0% Installment Plans
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Account</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href={routes.auth.login}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href={routes.auth.register}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  href={routes.storefront.orders.root}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Track Orders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Support</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href={routes.storefront.support.contact}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href={routes.storefront.support.askAnExpert}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Ask an Expert
                </Link>
              </li>
              <li>
                <Link
                  href={routes.storefront.support.shippingAndReturns}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link
                  href={routes.storefront.support.freeSetupAndDelivery}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Free Setup & Delivery
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-neutral-600 dark:text-neutral-400">
          <p>&copy; 2026 EvoluX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

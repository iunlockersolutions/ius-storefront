import Link from "next/link"

import { routes } from "@/configs/routes"

function TopBar() {
  return (
    <div className="border-b bg-muted/30">
      <div className="container mx-auto flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
        <p className="truncate pr-4">
          New arrivals across phones, audio, and power accessories.
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-4">
          <Link
            href={routes.storefront.deals.root}
            className="transition-colors hover:text-foreground"
          >
            Shop deals
          </Link>
          <Link
            href={routes.storefront.categories.root}
            className="hidden transition-colors hover:text-foreground sm:block"
          >
            Browse categories
          </Link>
        </div>
      </div>
    </div>
  )
}

export default TopBar

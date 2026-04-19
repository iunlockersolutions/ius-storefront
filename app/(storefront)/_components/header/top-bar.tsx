import Link from "next/link"

import { routes } from "@/configs/routes"

function TopBar() {
  return (
    <div className="border-b bg-primary">
      <div className="container mx-auto flex flex-col items-start gap-1 px-4 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
        <p className="text-white">For administrative tasks, please visit the</p>
        <Link
          href={routes.ops.root}
          className="cursor-pointer font-medium text-white transition-colors"
        >
          Admin Panel
        </Link>
      </div>
    </div>
  )
}

export default TopBar

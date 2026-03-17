import Link from "next/link"

import { routes } from "@/configs/routes"

function TopBar() {
  return (
    <div className="border-b bg-primary">
      <div className="container mx-auto flex gap-2 items-center px-4 py-2 text-xs text-muted-foreground">
        <p className="truncate text-white">
          For administrative tasks, please visit the
        </p>
        <Link
          href={routes.ops.root}
          className="transition-colors cursor-pointer text-white font-medium"
        >
          Admin Panel
        </Link>
      </div>
    </div>
  )
}

export default TopBar

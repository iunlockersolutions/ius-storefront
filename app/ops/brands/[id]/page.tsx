import Link from "next/link"

import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

import { EditBrandPageClient } from "./page-client"

interface EditBrandPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Edit Brand | Operations",
  description: "Edit brand details",
}

export default async function EditBrandPage({ params }: EditBrandPageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/brands">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Brand</h1>
          <p className="text-muted-foreground">Update brand details</p>
        </div>
      </div>

      <EditBrandPageClient brandId={id} />
    </div>
  )
}

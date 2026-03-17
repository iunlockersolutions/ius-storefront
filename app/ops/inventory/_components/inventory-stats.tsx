"use client"

import { AlertTriangle, Boxes, Lock, Package, ScanBarcode } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { AdminInventoryStats as AdminInventoryStatsData } from "@/lib/types/admin-inventory"

interface InventoryStatsProps {
  stats: AdminInventoryStatsData
}

export function InventoryStats({ stats }: InventoryStatsProps) {
  const statCards = [
    {
      title: "Total SKUs",
      value: stats.totalTrackedVariants,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Low Stock",
      value: stats.lowStockVariants,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Serialized",
      value: stats.serialTrackedVariants,
      icon: ScanBarcode,
      color: "text-sky-600",
      bgColor: "bg-sky-100",
    },
    {
      title: "Available",
      value: stats.totalAvailable,
      icon: Lock,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "On Hand",
      value: stats.totalOnHand,
      icon: Boxes,
      color: "text-violet-600",
      bgColor: "bg-violet-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`rounded-full p-3 ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

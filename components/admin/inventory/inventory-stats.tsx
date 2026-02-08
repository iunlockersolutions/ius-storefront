"use client"

import { AlertTriangle, Lock, Package, XCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

interface InventoryStatsProps {
  stats: {
    totalItems: number
    lowStockItems: number
    outOfStockItems: number
    totalReserved: number
  }
}

export function InventoryStats({ stats }: InventoryStatsProps) {
  const statCards = [
    {
      title: "Total SKUs",
      value: stats.totalItems,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Low Stock",
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockItems,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Reserved",
      value: stats.totalReserved,
      icon: Lock,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

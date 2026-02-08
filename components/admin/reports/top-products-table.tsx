"use client"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Product {
  productId: string
  productName: string
  totalQuantity: number
  totalRevenue: number
  orderCount: number
}

interface TopProductsTableProps {
  products: Product[]
}

export function TopProductsTable({ products }: TopProductsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const maxRevenue = Math.max(...products.map((p) => p.totalRevenue), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
        <CardDescription>
          Products with highest revenue from completed orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No product sales data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty Sold</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="w-[150px]">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => {
                const sharePercent = (product.totalRevenue / maxRevenue) * 100
                return (
                  <TableRow key={product.productId}>
                    <TableCell>
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/products/${product.productId}`}
                        className="font-medium hover:underline"
                      >
                        {product.productName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {product.totalQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.orderCount}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.totalRevenue)}
                    </TableCell>
                    <TableCell>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${sharePercent}%` }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

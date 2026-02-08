"use client"

import { CheckCircle, Clock, MessageSquare, Star, XCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ReviewStatsProps {
  stats: {
    pending: number
    approved: number
    rejected: number
    total: number
    averageRating: number
  }
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending}</div>
          <p className="text-xs text-muted-foreground">Awaiting moderation</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approved}</div>
          <p className="text-xs text-muted-foreground">Published reviews</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.rejected}</div>
          <p className="text-xs text-muted-foreground">Not published</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          <MessageSquare className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageRating ? Number(stats.averageRating).toFixed(1) : "—"}
          </div>
          <p className="text-xs text-muted-foreground">From approved reviews</p>
        </CardContent>
      </Card>
    </div>
  )
}

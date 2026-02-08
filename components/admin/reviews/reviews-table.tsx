"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { formatDistanceToNow } from "date-fns"
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deleteReview, moderateReview } from "@/lib/actions/review"

interface Review {
  id: string
  rating: number
  title: string | null
  content: string | null
  status: string
  orderId: string | null
  helpfulCount: number
  createdAt: Date
  productId: string
  productName: string
  userId: string | null
  userEmail: string | null
  userName: string | null
}

interface ReviewsTableProps {
  reviews: Review[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  approved: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  rejected: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
}

export function ReviewsTable({ reviews, pagination }: ReviewsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    params.delete("page")
    router.push(`/admin/reviews?tab=all&${params.toString()}`)
  }

  const handleSearch = () => {
    updateFilters({ search })
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/admin/reviews?tab=all&${params.toString()}`)
  }

  const handleModerate = async (
    reviewId: string,
    action: "approve" | "reject",
  ) => {
    setIsLoading(reviewId)
    try {
      await moderateReview(reviewId, action)
      router.refresh()
    } catch (error) {
      console.error("Moderation error:", error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this review? This cannot be undone.",
      )
    ) {
      return
    }
    setIsLoading(reviewId)
    try {
      await deleteReview(reviewId)
      router.refresh()
    } catch (error) {
      console.error("Delete error:", error)
    } finally {
      setIsLoading(null)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Select
            value={searchParams.get("status") || "all"}
            onValueChange={(value) => updateFilters({ status: value })}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get("rating") || "all"}
            onValueChange={(value) => updateFilters({ rating: value })}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Review</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No reviews found
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {review.userName || review.userEmail || "Anonymous"}
                        </span>
                        {review.orderId && (
                          <Badge variant="outline" className="text-xs">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      {review.title && (
                        <div className="font-medium mt-1">{review.title}</div>
                      )}
                      <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {review.content}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/products/${review.productId}`}
                      className="hover:underline"
                    >
                      {review.productName}
                    </Link>
                  </TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[review.status] || ""}>
                      {review.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLoading === review.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {review.status !== "approved" && (
                          <DropdownMenuItem
                            onClick={() => handleModerate(review.id, "approve")}
                          >
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        {review.status !== "rejected" && (
                          <DropdownMenuItem
                            onClick={() => handleModerate(review.id, "reject")}
                          >
                            <XCircle className="h-4 w-4 mr-2 text-red-500" />
                            Reject
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/products/${review.productId}`}
                            target="_blank"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Product
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(review.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} reviews
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  ExternalLink,
  Loader2,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  deleteUserReview,
  updateUserReview,
} from "@/lib/actions/customer-reviews"

interface ReviewActionsProps {
  review: {
    id: string
    rating: number
    title: string | null
    content: string | null
    status: "pending" | "approved" | "rejected"
    productSlug: string
  }
}

export function ReviewActions({ review }: ReviewActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editData, setEditData] = useState({
    rating: review.rating,
    title: review.title || "",
    content: review.content || "",
  })
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUserReview(review.id)
      if (result.success) {
        setShowDeleteDialog(false)
        router.refresh()
      }
    })
  }

  const handleEdit = () => {
    setError(null)
    startTransition(async () => {
      const result = await updateUserReview(review.id, {
        rating: editData.rating,
        title: editData.title || null,
        content: editData.content || null,
      })
      if (result.success) {
        setShowEditDialog(false)
        router.refresh()
      } else {
        setError(result.error || "Failed to update review")
      }
    })
  }

  const canEdit = review.status !== "rejected"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/products/${review.productSlug}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Product
            </Link>
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Review
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>
              Update your review. It will be submitted for moderation again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setEditData((prev) => ({ ...prev, rating: i + 1 }))
                    }
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        i < editData.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Title (Optional)</Label>
              <Input
                id="edit-title"
                value={editData.title}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Summarize your review"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Review (Optional)</Label>
              <Textarea
                id="edit-content"
                value={editData.content}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Share your experience with this product"
                rows={4}
                maxLength={2000}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cancelCustomerOrder } from "@/lib/actions/customer-orders"

interface CancelOrderButtonProps {
  orderId: string
}

export function CancelOrderButton({ orderId }: CancelOrderButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelCustomerOrder(orderId, reason || undefined)

      if (result.success) {
        toast.success("Order cancelled successfully")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to cancel order")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <XCircle className="h-4 w-4 mr-2" />
          Cancel Order
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this order? This action cannot be
            undone. If you&apos;ve already made a payment, a refund will be
            processed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="cancel-reason">
            Reason for cancellation (optional)
          </Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please let us know why you're cancelling..."
            className="mt-2"
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep Order</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Yes, Cancel Order"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

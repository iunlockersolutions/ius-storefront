"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { format, formatDistanceToNow } from "date-fns"
import {
  CheckCircle,
  Clock,
  ExternalLink,
  FileImage,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { verifyBankTransfer } from "@/lib/actions/payment"

interface BankTransferProof {
  id: string
  fileUrl: string
  fileName: string
  notes: string | null
  createdAt: Date
}

interface PendingTransfer {
  id: string
  orderId: string
  amount: string
  currency: string
  createdAt: Date
  orderNumber: string
  customerEmail: string
  customerName: string | null
  proofs: BankTransferProof[]
}

interface BankTransferQueueProps {
  transfers: PendingTransfer[]
}

export function BankTransferQueue({ transfers }: BankTransferQueueProps) {
  const router = useRouter()
  const [selectedTransfer, setSelectedTransfer] =
    useState<PendingTransfer | null>(null)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [verifyAction, setVerifyAction] = useState<"approve" | "reject">(
    "approve",
  )
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency,
    }).format(parseFloat(amount))
  }

  const handleVerify = async () => {
    if (!selectedTransfer) return

    setIsSubmitting(true)
    try {
      const result = await verifyBankTransfer(
        selectedTransfer.id,
        verifyAction === "approve",
        notes,
      )

      if (result.success) {
        setVerifyDialogOpen(false)
        setSelectedTransfer(null)
        setNotes("")
        router.refresh()
      } else {
        alert(result.error || "Failed to verify transfer")
      }
    } catch (error) {
      console.error("Verification error:", error)
      alert("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openVerifyDialog = (
    transfer: PendingTransfer,
    action: "approve" | "reject",
  ) => {
    setSelectedTransfer(transfer)
    setVerifyAction(action)
    setNotes("")
    setVerifyDialogOpen(true)
  }

  if (transfers.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-medium">All caught up!</h3>
        <p className="text-muted-foreground">
          No pending bank transfers to verify
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Proofs</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell>
                  <Link
                    href={`/admin/orders/${transfer.orderId}`}
                    className="font-medium hover:underline"
                  >
                    {transfer.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {transfer.customerName || "Guest"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {transfer.customerEmail}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(transfer.amount, transfer.currency)}
                </TableCell>
                <TableCell>
                  {transfer.proofs.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <FileImage className="h-3 w-3 mr-1" />
                        {transfer.proofs.length} file(s)
                      </Badge>
                      <div className="flex gap-1">
                        {transfer.proofs.map((proof) => (
                          <a
                            key={proof.id}
                            href={proof.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-yellow-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Awaiting upload
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(transfer.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openVerifyDialog(transfer, "reject")}
                      className="text-red-500 hover:text-red-600"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openVerifyDialog(transfer, "approve")}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={transfer.proofs.length === 0}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verifyAction === "approve" ? "Approve" : "Reject"} Bank Transfer
            </DialogTitle>
            <DialogDescription>
              {verifyAction === "approve"
                ? "Confirm that you have verified the bank transfer proof and the payment has been received."
                : "Reject this bank transfer verification. The order will be cancelled."}
            </DialogDescription>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order</span>
                  <span className="font-medium">
                    {selectedTransfer.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    {formatCurrency(
                      selectedTransfer.amount,
                      selectedTransfer.currency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{selectedTransfer.customerEmail}</span>
                </div>
              </div>

              {selectedTransfer.proofs.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Proofs</Label>
                  <div className="grid gap-2">
                    {selectedTransfer.proofs.map((proof) => (
                      <a
                        key={proof.id}
                        href={proof.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 border rounded hover:bg-muted"
                      >
                        <FileImage className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-sm">{proof.fileName}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(proof.createdAt), "MMM d, HH:mm")}
                        </span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">
                  {verifyAction === "approve"
                    ? "Notes (optional)"
                    : "Rejection reason"}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    verifyAction === "approve"
                      ? "Add any notes about this verification..."
                      : "Please provide a reason for rejection..."
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={
                isSubmitting || (verifyAction === "reject" && !notes.trim())
              }
              className={
                verifyAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isSubmitting
                ? "Processing..."
                : verifyAction === "approve"
                  ? "Approve Payment"
                  : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { CheckCircle2, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { uploadBankTransferProof } from "@/lib/actions/payment"

interface BankTransferUploadFormProps {
  paymentId: string
  orderId: string
}

export function BankTransferUploadForm({
  paymentId,
  orderId,
}: BankTransferUploadFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const [uploaded, setUploaded] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
      ]
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Please upload an image (JPEG, PNG, GIF) or PDF file")
        return
      }
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB")
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    startTransition(async () => {
      try {
        // Upload file to Vercel Blob
        const formData = new FormData()
        formData.append("file", file)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file")
        }

        const { url } = await uploadResponse.json()

        // Record the upload
        const result = await uploadBankTransferProof(
          paymentId,
          url,
          file.name,
          notes || undefined,
        )

        if (result.success) {
          setUploaded(true)
          toast.success("Proof of payment uploaded successfully")
          router.refresh()
        } else {
          toast.error("Failed to record upload")
        }
      } catch (error) {
        console.error("Upload error:", error)
        toast.error("Failed to upload file")
      }
    })
  }

  if (uploaded) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Proof Uploaded Successfully
        </h3>
        <p className="text-muted-foreground mb-4">
          We&apos;ll verify your payment within 1-2 business days.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push(`/orders/${orderId}`)}
        >
          Back to Order
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="proof-file">Payment Receipt *</Label>
        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <Input
            id="proof-file"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="proof-file"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            {file ? (
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Click to upload</p>
                <p className="text-sm text-muted-foreground">
                  JPEG, PNG, GIF, or PDF (max 5MB)
                </p>
              </div>
            )}
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Transaction reference, date of transfer, etc."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!file || isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload Proof of Payment
          </>
        )}
      </Button>
    </form>
  )
}

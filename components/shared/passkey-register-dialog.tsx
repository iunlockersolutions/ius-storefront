"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import { Fingerprint, Loader2 } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

const registerPasskeySchema = z.object({
  name: z.string().min(1, "Please provide a name for this passkey"),
})

type RegisterPasskeyFormData = z.infer<typeof registerPasskeySchema>

interface PasskeyRegisterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PasskeyRegisterDialog({
  open,
  onOpenChange,
  onSuccess,
}: PasskeyRegisterDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"name" | "registering">("name")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterPasskeyFormData>({
    resolver: zodResolver(registerPasskeySchema),
    defaultValues: {
      name: "",
    },
  })

  const handleClose = () => {
    setError(null)
    setStep("name")
    reset()
    onOpenChange(false)
  }

  const handleRegister = async (data: RegisterPasskeyFormData) => {
    setError(null)
    setStep("registering")

    try {
      const result = await authClient.passkey.addPasskey({
        name: data.name,
      })

      if (result.error) {
        setError(result.error.message || "Failed to register passkey")
        setStep("name")
        return
      }

      handleClose()
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to register passkey. Please try again.",
      )
      setStep("name")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Register Passkey
          </DialogTitle>
          <DialogDescription>
            {step === "name"
              ? "Give your passkey a name to help you identify it later."
              : "Follow your browser's instructions to complete registration."}
          </DialogDescription>
        </DialogHeader>

        {step === "name" ? (
          <form onSubmit={handleSubmit(handleRegister)}>
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passkey-name">Passkey Name</Label>
                <Input
                  id="passkey-name"
                  placeholder="e.g., MacBook Pro, iPhone, Security Key"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Choose a descriptive name like your device name or type.
                </p>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              <Fingerprint className="h-16 w-16 text-primary animate-pulse" />
            </div>
            <p className="mt-4 text-center text-muted-foreground">
              Please follow your browser&apos;s instructions to register your
              passkey...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

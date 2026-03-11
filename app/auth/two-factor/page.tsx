"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { handlePostLoginRedirect } from "@/lib/actions/admin-auth"
import { authClient } from "@/lib/auth-client"

function TwoFactorForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const [totpCode, setTotpCode] = useState("")
  const [backupCode, setBackupCode] = useState("")
  const [trustDevice, setTrustDevice] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function finishLogin() {
    await handlePostLoginRedirect(callbackUrl)
  }

  async function handleVerifyTotp() {
    setIsPending(true)
    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: totpCode,
        trustDevice,
      })

      if (result.error) {
        toast.error(result.error.message || "Invalid verification code")
        return
      }

      toast.success("Verification successful")
      await finishLogin()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Verification failed",
      )
    } finally {
      setIsPending(false)
    }
  }

  async function handleVerifyBackupCode() {
    setIsPending(true)
    try {
      const result = await authClient.twoFactor.verifyBackupCode({
        code: backupCode,
        trustDevice,
      })

      if (result.error) {
        toast.error(result.error.message || "Invalid backup code")
        return
      }

      toast.success("Verification successful")
      await finishLogin()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Verification failed",
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-center text-2xl font-bold">
          Two-Factor Verification
        </CardTitle>
        <CardDescription className="text-center">
          Enter a code from your authenticator app or use a backup code to
          continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="totp" className="space-y-4">
          <TabsList>
            <TabsTrigger value="totp">Authenticator App</TabsTrigger>
            <TabsTrigger value="backup">Backup Code</TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="totp-code">Verification code</Label>
              <Input
                id="totp-code"
                value={totpCode}
                onChange={(event) => setTotpCode(event.target.value)}
                placeholder="123456"
                inputMode="numeric"
              />
            </div>
            <Button
              onClick={handleVerifyTotp}
              disabled={isPending || !totpCode}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Verify code
            </Button>
          </TabsContent>

          <TabsContent value="backup" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="backup-code">Backup code</Label>
              <Input
                id="backup-code"
                value={backupCode}
                onChange={(event) => setBackupCode(event.target.value)}
                placeholder="Enter one of your backup codes"
              />
            </div>
            <Button
              onClick={handleVerifyBackupCode}
              disabled={isPending || !backupCode}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Verify backup code
            </Button>
          </TabsContent>
        </Tabs>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={trustDevice}
            onChange={(event) => setTrustDevice(event.target.checked)}
          />
          Trust this device for future sign-ins
        </label>

        <div className="text-sm text-muted-foreground">
          Need a different account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Return to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TwoFactorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <TwoFactorForm />
    </Suspense>
  )
}

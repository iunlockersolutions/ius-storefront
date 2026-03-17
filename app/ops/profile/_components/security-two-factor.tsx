"use client"

import { useMemo, useState } from "react"

import { KeyRound, Loader2, ShieldCheck } from "lucide-react"
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
import { authClient } from "@/lib/auth-client"

function extractSecret(totpURI: string) {
  try {
    return new URL(totpURI).searchParams.get("secret") ?? ""
  } catch {
    return ""
  }
}

export function SecurityTwoFactor({ enabled }: { enabled: boolean }) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [currentPassword, setCurrentPassword] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [backupCodesPassword, setBackupCodesPassword] = useState("")
  const [disablePassword, setDisablePassword] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [setupData, setSetupData] = useState<{
    totpURI: string
    backupCodes: string[]
  } | null>(null)
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([])

  const secret = useMemo(
    () => (setupData ? extractSecret(setupData.totpURI) : ""),
    [setupData],
  )

  async function handleEnable() {
    if (!currentPassword) {
      toast.error("Current password is required")
      return
    }

    setIsBusy(true)
    try {
      const result = await authClient.twoFactor.enable({
        password: currentPassword,
        issuer: "IUS Storefront",
      })

      if (result.error) {
        toast.error(result.error.message || "Failed to start 2FA setup")
        return
      }

      setSetupData(result.data)
      setGeneratedBackupCodes(result.data?.backupCodes ?? [])
      setCurrentPassword("")
      toast.success("Authenticator setup started")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to enable 2FA",
      )
    } finally {
      setIsBusy(false)
    }
  }

  async function handleVerifySetup() {
    if (!verificationCode) {
      toast.error("Enter the code from your authenticator app")
      return
    }

    setIsBusy(true)
    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: verificationCode,
      })

      if (result.error) {
        toast.error(result.error.message || "Invalid verification code")
        return
      }

      setIsEnabled(true)
      setVerificationCode("")
      toast.success("Two-factor authentication enabled")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to verify code",
      )
    } finally {
      setIsBusy(false)
    }
  }

  async function handleDisable() {
    if (!disablePassword) {
      toast.error("Current password is required")
      return
    }

    setIsBusy(true)
    try {
      const result = await authClient.twoFactor.disable({
        password: disablePassword,
      })

      if (result.error) {
        toast.error(result.error.message || "Failed to disable 2FA")
        return
      }

      setIsEnabled(false)
      setSetupData(null)
      setGeneratedBackupCodes([])
      setDisablePassword("")
      setVerificationCode("")
      toast.success("Two-factor authentication disabled")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disable 2FA",
      )
    } finally {
      setIsBusy(false)
    }
  }

  async function handleRegenerateBackupCodes() {
    if (!backupCodesPassword) {
      toast.error("Current password is required")
      return
    }

    setIsBusy(true)
    try {
      const result = await authClient.twoFactor.generateBackupCodes({
        password: backupCodesPassword,
      })

      if (result.error) {
        toast.error(result.error.message || "Failed to generate backup codes")
        return
      }

      setGeneratedBackupCodes(result.data?.backupCodes ?? [])
      setBackupCodesPassword("")
      toast.success("Backup codes regenerated")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate backup codes",
      )
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Protect staff access with authenticator app verification
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          {isEnabled
            ? "Two-factor authentication is enabled for this account."
            : "Two-factor authentication is optional for now, but recommended for staff accounts."}
        </div>

        {!isEnabled && !setupData ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="enable-2fa-password">Current password</Label>
              <Input
                id="enable-2fa-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter your current password"
              />
            </div>
            <Button onClick={handleEnable} disabled={isBusy}>
              {isBusy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Enable 2FA
            </Button>
          </div>
        ) : null}

        {setupData ? (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
              <h3 className="font-medium">
                Step 1: Add the account to your authenticator app
              </h3>
              <p className="text-sm text-muted-foreground">
                Manual setup secret
              </p>
              <div className="rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
                {secret || "Unavailable"}
              </div>
              <p className="text-xs text-muted-foreground break-all">
                {setupData.totpURI}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verify-2fa-code">
                Step 2: Verify with a code
              </Label>
              <Input
                id="verify-2fa-code"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder="123456"
                inputMode="numeric"
              />
              <Button onClick={handleVerifySetup} disabled={isBusy}>
                {isBusy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Verify and enable
              </Button>
            </div>

            {generatedBackupCodes.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-medium">Backup codes</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {generatedBackupCodes.map((code) => (
                    <div
                      key={code}
                      className="rounded-md bg-muted px-3 py-2 font-mono text-sm"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {isEnabled ? (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
              <Label htmlFor="backup-codes-password">Current password</Label>
              <Input
                id="backup-codes-password"
                type="password"
                value={backupCodesPassword}
                onChange={(event) => setBackupCodesPassword(event.target.value)}
                placeholder="Enter your current password"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleRegenerateBackupCodes}
                disabled={isBusy}
              >
                {isBusy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                Regenerate Backup Codes
              </Button>
            </div>

            {generatedBackupCodes.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-medium">Current backup codes</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {generatedBackupCodes.map((code) => (
                    <div
                      key={code}
                      className="rounded-md bg-muted px-3 py-2 font-mono text-sm"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="disable-2fa-password">Current password</Label>
              <Input
                id="disable-2fa-password"
                type="password"
                value={disablePassword}
                onChange={(event) => setDisablePassword(event.target.value)}
                placeholder="Enter your current password"
              />
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={isBusy}
              >
                {isBusy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Disable 2FA
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

"use client"

import { Fingerprint } from "lucide-react"

import { PasskeyManager } from "@/components/shared/passkey-manager"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SecurityPasskeys() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Fingerprint className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Passkeys</CardTitle>
            <CardDescription>
              Use biometrics or security keys for passwordless sign-in
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <PasskeyManager />
      </CardContent>
    </Card>
  )
}

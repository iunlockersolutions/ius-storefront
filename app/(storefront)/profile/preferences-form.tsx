"use client"

import { useState } from "react"

import { Loader2 } from "lucide-react"

import { updateMarketingPreferences } from "@/lib/actions/profile"

interface PreferencesFormProps {
  marketingOptIn: boolean
}

export function PreferencesForm({ marketingOptIn }: PreferencesFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [optedIn, setOptedIn] = useState(marketingOptIn)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const handleToggle = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const newValue = !optedIn
      const result = await updateMarketingPreferences(newValue)
      if (result.success) {
        setOptedIn(newValue)
        setMessage({
          type: "success",
          text: newValue
            ? "You've subscribed to marketing emails"
            : "You've unsubscribed from marketing emails",
        })
      } else {
        setMessage({ type: "error", text: "Failed to update preferences" })
      }
    } catch {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-medium">Marketing Emails</p>
          <p className="text-sm text-muted-foreground">
            Receive emails about new products, promotions, and exclusive offers
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={optedIn}
          disabled={isLoading}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            optedIn ? "bg-primary" : "bg-input"
          }`}
        >
          <span
            className={`pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-lg ring-0 transition-transform ${
              optedIn ? "translate-x-5" : "translate-x-0"
            }`}
          >
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          </span>
        </button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-medium">Order Updates</p>
          <p className="text-sm text-muted-foreground">
            Receive email notifications about your orders (shipping, delivery,
            etc.)
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={true}
          disabled={true}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-primary opacity-50"
        >
          <span className="pointer-events-none inline-flex h-5 w-5 translate-x-5 items-center justify-center rounded-full bg-background shadow-lg ring-0" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Order update emails cannot be disabled as they contain important
        information about your purchases.
      </p>

      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"

import { ArrowRight, CheckCircle, Loader2, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { subscribeToNewsletter } from "@/lib/actions/newsletter"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setStatus("idle")

    try {
      const result = await subscribeToNewsletter(email)
      if (result.success) {
        setStatus("success")
        setMessage(result.message || "Successfully subscribed!")
        setEmail("")
      } else {
        setStatus("error")
        setMessage(result.error || "Failed to subscribe. Please try again.")
      }
    } catch {
      setStatus("error")
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Mail className="mx-auto h-12 w-12 mb-4 opacity-90" />
          <h2 className="text-2xl font-bold sm:text-3xl">Stay Updated</h2>
          <p className="mt-3 text-primary-foreground/80">
            Subscribe to our newsletter for exclusive deals, new arrivals, and
            special offers.
          </p>

          {status === "success" ? (
            <div className="mt-6 flex flex-col items-center gap-3 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-green-200">
                <CheckCircle className="h-5 w-5" />
                <span>{message}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStatus("idle")}
              >
                Subscribe another email
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
                className="flex-1 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/60"
              />
              <Button variant="secondary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {status === "error" && (
            <p className="mt-3 text-sm text-red-200">{message}</p>
          )}

          <p className="mt-3 text-xs text-primary-foreground/60">
            By subscribing, you agree to our Privacy Policy.
          </p>
        </div>
      </div>
    </section>
  )
}

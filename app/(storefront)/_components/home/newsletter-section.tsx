"use client"

import { useState } from "react"

import { ArrowRight, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    // TODO: integrate with newsletter API
    setSubmitted(true)
  }

  return (
    <section className="bg-zinc-50 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
            <Mail className="h-5 w-5 text-zinc-500" />
          </div>

          {/* Heading */}
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            Stay in the Loop
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:text-base">
            Subscribe for the latest products, deals and tech news delivered
            straight to your inbox.
          </p>

          {/* Form */}
          {submitted ? (
            <div className="mt-6 rounded-xl bg-emerald-50 px-6 py-4">
              <p className="text-sm font-medium text-emerald-700">
                You&apos;re subscribed! We&apos;ll keep you posted.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 flex-1 rounded-full border-zinc-200 bg-white px-5 text-base placeholder:text-zinc-400"
              />
              <Button
                type="submit"
                size="lg"
                className="h-12 rounded-full bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-800"
              >
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          {/* Privacy note */}
          <p className="mt-4 text-[11px] text-zinc-400 sm:text-xs">
            No spam, ever. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  )
}

import type { Metadata } from "next"

import { Wrench } from "lucide-react"

export const metadata: Metadata = {
  title: "Down for maintenance",
  description: "We are performing scheduled maintenance and will be back soon.",
  robots: { index: false, follow: false },
}

export default function MaintenancePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-b from-background via-background to-muted/30 px-4 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float-slow absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="animate-float-medium absolute right-[15%] top-[30%] h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
        <div className="animate-float-fast absolute bottom-[25%] left-[20%] h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Wrench className="h-9 w-9" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          We&apos;ll be back shortly
        </h1>

        <p className="mt-3 text-balance text-muted-foreground">
          Our store is temporarily down for scheduled maintenance. We&apos;re
          working to improve your experience and will be back online soon. Thank
          you for your patience.
        </p>
      </div>
    </main>
  )
}

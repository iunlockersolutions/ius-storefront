import { ForceLightTheme } from "@/components/force-light-theme"
import { Toaster } from "@/components/ui/sonner"

/**
 * Auth Layout
 *
 * Centered layout for authentication pages.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ForceLightTheme />
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 dark:bg-neutral-900">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <Toaster theme="light" />
    </>
  )
}

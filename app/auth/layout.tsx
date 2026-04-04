import { ForceLightTheme } from "@/components/force-light-theme"
import { Toaster } from "@/components/ui/sonner"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ForceLightTheme />
      <div className="bg-background text-foreground relative min-h-screen overflow-hidden">
        <div className="relative mx-auto flex min-h-screen w-full container items-center px-6 py-12 sm:px-8 lg:px-10">
          {children}
        </div>
      </div>
      <Toaster theme="light" />
    </>
  )
}

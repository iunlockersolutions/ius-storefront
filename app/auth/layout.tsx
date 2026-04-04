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
        <div className="bg-secondary/40 absolute inset-0" />
        <div className="bg-primary/10 pointer-events-none absolute left-[-7rem] top-1/3 h-72 w-72 rounded-full blur-3xl" />
        <div className="bg-secondary pointer-events-none absolute right-[-6rem] top-[-4rem] h-80 w-80 rounded-full opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-[-16rem] flex justify-center">
          <div className="border-primary/25 relative h-[34rem] w-[34rem] rounded-full border-[28px]" />
          <div className="border-secondary/70 absolute top-8 h-[34rem] w-[34rem] rounded-full border-[28px]" />
          <div className="border-primary/15 absolute top-16 h-[34rem] w-[34rem] rounded-full border-[28px]" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12 sm:px-8 lg:px-10">
          {children}
        </div>
      </div>
      <Toaster theme="light" />
    </>
  )
}

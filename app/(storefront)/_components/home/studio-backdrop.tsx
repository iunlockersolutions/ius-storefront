export function StudioBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Single soft radial — brightest center, barely-there fade at edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_45%,#ffffff_0%,#fdfdfd_65%,#f7f7f8_100%)]" />

      {/* Very faint side vignettes to frame the product */}
      <div className="absolute inset-y-0 left-0 w-56 bg-[linear-gradient(to_right,#f4f4f5_0%,transparent_100%)] opacity-25" />
      <div className="absolute inset-y-0 right-0 w-56 bg-[linear-gradient(to_left,#f4f4f5_0%,transparent_100%)] opacity-25" />

      {/* Soft contact shadow under product — fakes depth without a horizon */}
      <div className="absolute bottom-[20%] left-1/2 h-6 w-[45%] max-w-xl -translate-x-1/2 rounded-[50%] bg-black/10 blur-3xl" />
    </div>
  )
}

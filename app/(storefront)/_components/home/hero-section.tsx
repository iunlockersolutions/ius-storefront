"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

interface HeroSlide {
  tag?: string
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
  image: string
  imageAlt: string
  bg?: string
}

interface HeroSectionProps {
  slides?: HeroSlide[]
  interval?: number
}

const defaultSlides: HeroSlide[] = [
  {
    tag: "New Arrivals",
    title: "iPhone 17 Pro",
    subtitle:
      "Titanium. The thinnest borders ever. The most advanced camera system on iPhone.",
    ctaText: "Shop iPhone",
    ctaLink: "/products",
    image:
      "https://dczkp6l3mmbt1dmm.public.blob.vercel-storage.com/public-assets/ip17po-Picsart-AiImageEnhancer.png",
    imageAlt: "iPhone on a clean light background",
    bg: "bg-stone-50",
  },
  // {
  //   tag: "Just Launched",
  //   title: "MacBook Air M4",
  //   subtitle:
  //     "Strikingly thin. Impossibly fast. Built for Apple Intelligence from the ground up.",
  //   ctaText: "Shop MacBook",
  //   ctaLink: "/products",
  //   image:
  //     "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=900&q=80&auto=format&fit=crop",
  //   imageAlt: "MacBook on a minimal white desk",
  //   bg: "bg-gray-50",
  // },
  // {
  //   tag: "Best Seller",
  //   title: "AirPods Pro 2",
  //   subtitle:
  //     "Adaptive Audio. Personalised Spatial Audio. A magical listening experience.",
  //   ctaText: "Shop AirPods",
  //   ctaLink: "/products",
  //   image:
  //     "https://images.unsplash.com/photo-1606741965326-cb990ae01bb2?w=900&q=80&auto=format&fit=crop",
  //   imageAlt: "AirPods Pro on a clean white surface",
  //   bg: "bg-neutral-50",
  // },
  // {
  //   tag: "Featured",
  //   title: "iPad Pro M4",
  //   subtitle:
  //     "The ultimate iPad experience. Incredibly powerful. Impossibly thin.",
  //   ctaText: "Shop iPad",
  //   ctaLink: "/products",
  //   image:
  //     "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=900&q=80&auto=format&fit=crop",
  //   imageAlt: "iPad Pro on a light background",
  //   bg: "bg-zinc-50",
  // },
]

export function HeroSection({
  slides = defaultSlides,
  interval = 6000,
}: HeroSectionProps) {
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const count = slides.length

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setActive((p) => (p + 1) % count)
    }, interval)
  }, [count, interval])

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [resetTimer])

  const goTo = (index: number) => {
    setActive(index)
    resetTimer()
  }
  const goPrev = () => {
    setActive((p) => (p - 1 + count) % count)
    resetTimer()
  }
  const goNext = () => {
    setActive((p) => (p + 1) % count)
    resetTimer()
  }

  const slide = slides[active]

  return (
    <section
      className={`relative w-full overflow-hidden transition-colors duration-700 ${slide.bg ?? "bg-stone-50"}`}
    >
      <div className="mx-auto grid min-h-120 max-w-7xl grid-cols-1 items-center gap-6 px-6 py-12 sm:min-h-135 sm:py-16 lg:min-h-150 lg:grid-cols-2 lg:gap-12 lg:py-0">
        {/* ── Left: Text ─────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col items-start text-left">
          {slide.tag && (
            <span
              key={`tag-${active}`}
              className="mb-4 inline-flex animate-fade-in-up items-center rounded-full border border-zinc-200 bg-white/80 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-zinc-500"
            >
              {slide.tag}
            </span>
          )}

          <h1
            key={`title-${active}`}
            className="animate-fade-in-up text-4xl font-semibold tracking-tight text-zinc-900 [animation-delay:80ms] sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {slide.title}
          </h1>

          <p
            key={`sub-${active}`}
            className="mt-4 max-w-md animate-fade-in-up text-base leading-relaxed text-zinc-500 [animation-delay:160ms] sm:text-lg"
          >
            {slide.subtitle}
          </p>

          <div
            key={`cta-${active}`}
            className="mt-8 flex animate-fade-in-up items-center gap-3 [animation-delay:240ms]"
          >
            <Button
              asChild
              size="lg"
              className="rounded-full bg-zinc-900 font-medium text-white hover:bg-zinc-800"
            >
              <Link href={slide.ctaLink}>
                {slide.ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full font-medium"
            >
              <Link href="/categories">Browse All</Link>
            </Button>
          </div>

          {/* ── Controls ───────────────────────────────────── */}
          <div className="mt-10 flex items-center gap-4">
            <button
              onClick={goPrev}
              aria-label="Previous slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === active
                      ? "w-8 bg-zinc-900"
                      : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              aria-label="Next slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Right: Product image ───────────────────────────── */}
        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="relative aspect-square w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
            {slides.map((s, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-all duration-700 ease-out ${
                  i === active
                    ? "translate-y-0 scale-100 opacity-100"
                    : "translate-y-4 scale-[0.97] opacity-0"
                }`}
                aria-hidden={i !== active}
              >
                <Image
                  src={s.image}
                  alt={s.imageAlt}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 85vw, (max-width: 1200px) 45vw, 520px"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

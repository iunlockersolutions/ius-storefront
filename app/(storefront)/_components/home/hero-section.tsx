"use client"

import { useEffect, useState } from "react"
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
      "Introducing iPhone 17 Pro and iPhone 17 Pro Max, designed from the inside out to be the most powerful iPhone models ever made.",
    ctaText: "Shop iPhone",
    ctaLink: "/products",
    image:
      "https://n1hqdjz7virkwon8.public.blob.vercel-storage.com/hero/iphone-pro-17-uGsD9Vnx7yMlwpWUHH76bFJmTNabP9.png",
    imageAlt: "iPhone on a clean light background",
  },
  {
    tag: "New Arrivals",
    title: "Apple Watch Series 11",
    subtitle:
      "Apple Watch Series 11 can spot signs of chronic high blood pressure and notify you of possible hypertension.",
    ctaText: "Shop Apple Watch",
    ctaLink: "/products",
    image:
      "https://n1hqdjz7virkwon8.public.blob.vercel-storage.com/hero/apple-watch-series-11-aNbQuXyo3MlbpQnpjFyyL0OqKd7keH.png",
    imageAlt: "Apple Watch on a clean light background",
  },
]

export function HeroSection({
  slides = defaultSlides,
  interval = 6000,
}: HeroSectionProps) {
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const id = setInterval(
      () => setSelected((i) => (i + 1) % slides.length),
      interval,
    )
    return () => clearInterval(id)
  }, [slides.length, interval])

  const next = () => setSelected((i) => (i + 1) % slides.length)
  const prev = () => setSelected((i) => (i - 1 + slides.length) % slides.length)

  const slide = slides[selected]

  return (
    <section className="relative w-full overflow-hidden bg-zinc-50 lg:h-[55dvh]">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-6 pt-6 sm:gap-8 sm:pt-8 lg:h-full lg:grid-cols-2 lg:grid-rows-1 lg:items-center lg:gap-12 lg:pt-0">
        {/* ── Text column ─────────────────────────────────── */}

        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          {slide.tag && (
            <span
              key={`tag-${selected}`}
              className="mb-4 inline-flex animate-fade-in-up items-center rounded-full border border-zinc-200 bg-white/80 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-zinc-500"
            >
              {slide.tag}
            </span>
          )}

          <h1
            key={`title-${selected}`}
            className="animate-fade-in-up text-4xl font-semibold tracking-tight text-zinc-900 [animation-delay:80ms] sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {slide.title}
          </h1>

          <p
            key={`sub-${selected}`}
            className="mt-4 max-w-md animate-fade-in-up text-base leading-relaxed text-zinc-500 [animation-delay:160ms] sm:text-lg"
          >
            {slide.subtitle}
          </p>

          <div
            key={`cta-${selected}`}
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

          {slides.length > 1 && (
            <div className="mt-10 flex items-center gap-4">
              <button
                onClick={prev}
                aria-label="Previous slide"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === selected
                        ? "w-8 bg-zinc-900"
                        : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                aria-label="Next slide"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[24rem] lg:mx-0 lg:h-full lg:min-h-0 lg:max-w-none lg:aspect-auto">
          {slides.map((s, i) => (
            <Image
              key={i}
              src={s.image}
              alt={s.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={i === 0}
              className={`object-contain object-bottom transition-opacity duration-700 ${
                i === selected ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export interface HeroSlide {
  tag?: string
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
  image: string
  imageAlt: string
}

export const IMAGE_EXIT_EASE = [0.55, 0.06, 0.68, 0.19] as const
export const IMAGE_ENTER_EASE = [0.16, 1, 0.3, 1] as const
export const IMAGE_EXIT_DURATION = 0.5
export const IMAGE_ENTER_DURATION = 0.4
export const OPACITY_IDLE = 0.5

export const defaultSlides: HeroSlide[] = [
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
    title: "Watch Series 11",
    subtitle:
      "Apple Watch Series 11 can spot signs of chronic high blood pressure and notify you of possible hypertension.",
    ctaText: "Shop Apple Watch",
    ctaLink: "/products",
    image:
      "https://n1hqdjz7virkwon8.public.blob.vercel-storage.com/hero/apple-watch-series-11-aNbQuXyo3MlbpQnpjFyyL0OqKd7keH.png",
    imageAlt: "Apple Watch on a clean light background",
  },
  {
    tag: "New Arrivals",
    title: "MacBook Pro M5, M5 Pro, and M5 Max",
    subtitle:
      "MacBook Pro M5, M5 Pro, and M5 Max are designed to deliver unparalleled performance and efficiency for professionals.",
    ctaText: "Shop MacBook Pro",
    ctaLink: "/products",
    image:
      "https://n1hqdjz7virkwon8.public.blob.vercel-storage.com/hero/m5pro-5XSWM37ayStND9BIaMhlSUforPa6d2.png",
    imageAlt: "MacBook Pro on a clean light background",
  },
  {
    tag: "New Arrivals",
    title: "iPhone 17",
    subtitle:
      "iPhone 17 is designed to deliver unparalleled performance and efficiency for professionals.",
    ctaText: "Shop iPhone 17",
    ctaLink: "/products",
    image:
      "https://n1hqdjz7virkwon8.public.blob.vercel-storage.com/hero/17-e-QfJU44hrNiKepmLxzt15QIrBCBlSmh.png",
    imageAlt: "iPhone on a clean light background",
  },
  {
    tag: "New Arrivals",
    title: "MacBook Neo",
    subtitle:
      "MacBook Neo is designed to deliver unparalleled performance and efficiency for professionals.",
    ctaText: "Shop MacBook Neo",
    ctaLink: "/products",
    image:
      "https://n1hqdjz7virkwon8.public.blob.vercel-storage.com/hero/neo-e-zmbQGxq7aSsnyhSOBDMszEJIgxzrU2.png",
    imageAlt: "MacBook Neo on a clean light background",
  },
  {
    tag: "New Arrivals",
    title: "AirPods Max 2",
    subtitle:
      "AirPods Max 2 is designed to deliver unparalleled performance and efficiency for professionals.",
    ctaText: "Shop AirPods Max 2",
    ctaLink: "/products",
    image:
      "https://n1hqdjz7virkwon8.public.blob.vercel-storage.com/hero/airpod-e-qcQ9PiusUyShE62GgILyrTmNvRgyOF.png",
    imageAlt: "AirPods Max 2 on a clean light background",
  },
]

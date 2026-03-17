"use client"

import Image, { type ImageProps } from "next/image"

type ManagedMediaImageProps = Omit<
  ImageProps,
  "src" | "alt" | "placeholder" | "blurDataURL"
> & {
  src: string
  alt: string
  placeholderDataUrl?: string | null
}

export function ManagedMediaImage({
  src,
  alt,
  placeholderDataUrl,
  ...props
}: ManagedMediaImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      placeholder={placeholderDataUrl ? "blur" : "empty"}
      blurDataURL={placeholderDataUrl || undefined}
      {...props}
    />
  )
}

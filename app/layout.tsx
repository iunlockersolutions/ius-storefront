import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { Providers } from "@/components/providers"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "EvoluX - Electronics Store",
    template: "%s | EvoluX",
  },
  description:
    "Your trusted destination for mobile phones, accessories, and electronics.",
  keywords: ["electronics", "mobile phones", "accessories", "e-commerce"],
  authors: [{ name: "EvoluX" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "EvoluX",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import { Providers } from "@/components/providers"

import "./globals.css"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
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
        className={`${inter.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

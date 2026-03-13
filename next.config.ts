import type { NextConfig } from "next"

const mediaRemoteHosts = (
  process.env.MEDIA_REMOTE_HOSTS ||
  "*.public.blob.vercel-storage.com,*.vercel-storage.com"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...mediaRemoteHosts.map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Optimize production builds
  experimental: {
    optimizePackageImports: ["lucide-react", "@tanstack/react-query"],
  },
  // Enable compression
  compress: true,
}

export default nextConfig

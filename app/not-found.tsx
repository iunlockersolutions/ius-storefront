"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { ArrowLeft, Home } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * 404 Not Found Page
 *
 * Beautiful animated 404 page with floating elements and gradient text.
 */
export default function NotFound() {
  const router = useRouter()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-b from-background via-background to-muted/30 px-4">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Floating circles */}
        <div className="animate-float-slow absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="animate-float-medium absolute right-[15%] top-[30%] h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
        <div className="animate-float-fast absolute bottom-[20%] left-[20%] h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
        <div className="animate-float-slow absolute bottom-[30%] right-[10%] h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Animated 404 SVG */}
        <div className="relative mb-8">
          <svg
            viewBox="0 0 400 150"
            className="h-32 w-80 sm:h-40 sm:w-96"
            aria-hidden="true"
          >
            {/* Animated gradient definition */}
            <defs>
              <linearGradient
                id="gradient404"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="hsl(270 80% 60%)">
                  <animate
                    attributeName="stop-color"
                    values="hsl(270 80% 60%); hsl(280 80% 55%); hsl(260 80% 65%); hsl(270 80% 60%)"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="50%" stopColor="hsl(280 70% 50%)">
                  <animate
                    attributeName="stop-color"
                    values="hsl(280 70% 50%); hsl(270 75% 55%); hsl(285 70% 50%); hsl(280 70% 50%)"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%" stopColor="hsl(290 80% 55%)">
                  <animate
                    attributeName="stop-color"
                    values="hsl(290 80% 55%); hsl(275 80% 60%); hsl(295 75% 55%); hsl(290 80% 55%)"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </stop>
              </linearGradient>

              {/* Shadow filter */}
              <filter
                id="shadow404"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="8"
                  floodColor="hsl(270 80% 50%)"
                  floodOpacity="0.3"
                />
              </filter>
            </defs>

            {/* 404 Text with animations */}
            <g filter="url(#shadow404)">
              {/* First 4 */}
              <text
                x="50"
                y="110"
                fontSize="120"
                fontWeight="bold"
                fill="url(#gradient404)"
                className="font-sans"
              >
                <tspan>4</tspan>
                <animate
                  attributeName="y"
                  values="110; 105; 110"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </text>

              {/* 0 in the middle */}
              <text
                x="150"
                y="110"
                fontSize="120"
                fontWeight="bold"
                fill="url(#gradient404)"
                className="font-sans"
              >
                <tspan>0</tspan>
                <animate
                  attributeName="y"
                  values="110; 115; 110"
                  dur="2s"
                  repeatCount="indefinite"
                  begin="0.3s"
                />
              </text>

              {/* Second 4 */}
              <text
                x="260"
                y="110"
                fontSize="120"
                fontWeight="bold"
                fill="url(#gradient404)"
                className="font-sans"
              >
                <tspan>4</tspan>
                <animate
                  attributeName="y"
                  values="110; 105; 110"
                  dur="2s"
                  repeatCount="indefinite"
                  begin="0.6s"
                />
              </text>
            </g>

            {/* Decorative animated dots */}
            <circle cx="340" cy="40" r="6" fill="url(#gradient404)">
              <animate
                attributeName="opacity"
                values="1; 0.3; 1"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="360" cy="70" r="4" fill="url(#gradient404)">
              <animate
                attributeName="opacity"
                values="0.3; 1; 0.3"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="30" cy="50" r="5" fill="url(#gradient404)">
              <animate
                attributeName="opacity"
                values="0.5; 1; 0.5"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>

        {/* Text content */}
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Page Not Found
        </h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been
          moved. Let&apos;s get you back on track.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="min-w-[140px]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button asChild className="min-w-[140px]">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Home Page
            </Link>
          </Button>
        </div>

        {/* Subtle hint text */}
        <p className="mt-12 text-xs text-muted-foreground/60">
          Error Code: 404
        </p>
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        @keyframes float-medium {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-15px) translateX(-10px);
          }
        }
        @keyframes float-fast {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        :global(.animate-float-slow) {
          animation: float-slow 8s ease-in-out infinite;
        }
        :global(.animate-float-medium) {
          animation: float-medium 6s ease-in-out infinite;
        }
        :global(.animate-float-fast) {
          animation: float-fast 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

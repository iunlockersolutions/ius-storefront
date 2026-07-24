import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Down for maintenance",
  description: "EvoluX is temporarily down for scheduled maintenance.",
  robots: { index: false, follow: false },
}

const bigGearTeeth = Array.from({ length: 10 }, (_, i) => i * 36)
const smallGearTeeth = Array.from({ length: 8 }, (_, i) => i * 45)

export default function MaintenancePage() {
  return (
    <main className="evx-scene relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-b from-background via-background to-muted/40 px-4 py-16 text-center">
      {/* Soft ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="evx-float absolute left-[8%] top-[18%] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="evx-float-slow absolute right-[10%] top-[24%] h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="evx-float-fast absolute bottom-[16%] left-[22%] h-52 w-52 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center">
        {/* Animated illustration */}
        <svg
          viewBox="0 0 560 400"
          role="img"
          aria-label="A friendly mascot fastening a gear with a wrench"
          className="w-full max-w-[460px]"
        >
          <defs>
            <linearGradient id="evx-panel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#181545" />
              <stop offset="100%" stopColor="#0d0b32" />
            </linearGradient>
            <linearGradient id="evx-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f9a8d4" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
            <clipPath id="evx-clip">
              <path d="M40,155 C22,84 92,32 178,42 C244,50 280,12 366,30 C462,50 545,112 522,204 C506,272 546,332 456,362 C372,390 302,360 206,362 C112,364 72,300 57,222 C50,192 52,178 40,155 Z" />
            </clipPath>
          </defs>

          {/* Dark organic panel */}
          <path
            d="M40,155 C22,84 92,32 178,42 C244,50 280,12 366,30 C462,50 545,112 522,204 C506,272 546,332 456,362 C372,390 302,360 206,362 C112,364 72,300 57,222 C50,192 52,178 40,155 Z"
            fill="url(#evx-panel)"
          />

          {/* Decorative blobs, clipped inside the panel */}
          <g clipPath="url(#evx-clip)">
            <path
              className="evx-float-slow"
              d="M120,70 q40,-30 80,-5 q20,40 -20,60 q-55,20 -70,-20 q-12,-25 10,-35 Z"
              fill="#f97316"
              opacity="0.9"
            />
            <path
              className="evx-float"
              d="M430,90 q45,-20 60,25 q10,45 -40,50 q-45,3 -45,-40 q0,-25 25,-35 Z"
              fill="#a855f7"
              opacity="0.9"
            />
            <path
              className="evx-float-fast"
              d="M430,250 q60,-15 70,50 q5,60 -70,55 q-50,-5 -45,-55 q3,-40 45,-50 Z"
              fill="#3b82f6"
              opacity="0.95"
            />
            <circle
              className="evx-float"
              cx="105"
              cy="255"
              r="26"
              fill="#a855f7"
            />
            <circle
              className="evx-float-slow"
              cx="455"
              cy="235"
              r="20"
              fill="#5eead4"
            />
            <circle cx="470" cy="150" r="14" fill="#1e1b57" />
            <circle cx="95" cy="130" r="10" fill="#1e1b57" />
            {/* sparkles */}
            <rect
              className="evx-twinkle"
              x="150"
              y="115"
              width="9"
              height="9"
              rx="2"
              fill="#ffffff"
              transform="rotate(45 154 119)"
            />
            <rect
              className="evx-twinkle"
              x="380"
              y="290"
              width="7"
              height="7"
              rx="2"
              fill="#ffffff"
              transform="rotate(45 383 293)"
              style={{ animationDelay: "0.8s" }}
            />
            <circle
              className="evx-twinkle"
              cx="330"
              cy="95"
              r="3.5"
              fill="#ffffff"
              style={{ animationDelay: "1.4s" }}
            />
          </g>

          {/* Small gear (counter-rotating, behind) */}
          <g transform="translate(348,150)">
            <g className="evx-spin-rev">
              {smallGearTeeth.map((a) => (
                <rect
                  key={a}
                  x="-5"
                  y="-40"
                  width="10"
                  height="13"
                  rx="3"
                  fill="#7c3aed"
                  transform={`rotate(${a})`}
                />
              ))}
              <circle r="30" fill="#8b5cf6" />
              <circle r="20" fill="#a78bfa" />
              <circle r="8" fill="#0d0b32" />
            </g>
          </g>

          {/* Big gear (spinning) */}
          <g transform="translate(250,128)">
            <g className="evx-spin">
              {bigGearTeeth.map((a) => (
                <rect
                  key={a}
                  x="-7"
                  y="-58"
                  width="14"
                  height="18"
                  rx="5"
                  fill="#2563eb"
                  transform={`rotate(${a})`}
                />
              ))}
              <circle r="46" fill="#3b82f6" />
              <circle r="31" fill="#60a5fa" />
              <circle r="14" fill="#0d0b32" />
            </g>
          </g>

          {/* Ground shadow */}
          <ellipse
            cx="250"
            cy="330"
            rx="92"
            ry="16"
            fill="#000000"
            opacity="0.22"
          />

          {/* Mascot */}
          <g transform="translate(250,250)">
            <g className="evx-bob">
              {/* antennae */}
              <path
                d="M-22,-46 C-30,-64 -34,-70 -30,-80"
                stroke="#f472b6"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="-30" cy="-84" r="6" fill="#5eead4" />
              <path
                d="M22,-46 C30,-62 32,-70 38,-78"
                stroke="#f472b6"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="39" cy="-82" r="6" fill="#5eead4" />

              {/* body */}
              <ellipse cx="0" cy="0" rx="60" ry="54" fill="url(#evx-body)" />
              <ellipse
                cx="0"
                cy="10"
                rx="42"
                ry="36"
                fill="#fbcfe8"
                opacity="0.7"
              />
              {/* spots */}
              <circle cx="-34" cy="-14" r="5" fill="#f472b6" opacity="0.55" />
              <circle cx="30" cy="-22" r="4" fill="#f472b6" opacity="0.55" />
              <circle cx="40" cy="18" r="6" fill="#f472b6" opacity="0.5" />

              {/* happy closed eyes */}
              <path
                d="M-30,-6 Q-20,-18 -10,-6"
                stroke="#3b2b5e"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M10,-6 Q20,-18 30,-6"
                stroke="#3b2b5e"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* cheeks */}
              <circle cx="-34" cy="12" r="7" fill="#fb7185" opacity="0.6" />
              <circle cx="34" cy="12" r="7" fill="#fb7185" opacity="0.6" />
              {/* grin */}
              <path d="M-15,10 A15,14 0 0 0 15,10 Z" fill="#3b2b5e" />
              <path d="M-11,17 A9,9 0 0 0 11,17 Z" fill="#ffffff" />
            </g>
          </g>

          {/* Wrench (rocking, held up to the gear) */}
          <g transform="translate(250,235)">
            <g className="evx-rock">
              <rect
                x="-9"
                y="-96"
                width="18"
                height="96"
                rx="9"
                fill="#5eead4"
              />
              <circle cx="0" cy="-100" r="23" fill="#5eead4" />
              <circle cx="0" cy="-100" r="11" fill="url(#evx-panel)" />
              {/* open-end notch */}
              <path
                d="M-11,-118 L11,-118 L7,-100 L-7,-100 Z"
                fill="url(#evx-panel)"
              />
              <rect
                x="-9"
                y="-6"
                width="18"
                height="16"
                rx="8"
                fill="#2dd4bf"
              />
            </g>
          </g>
        </svg>

        <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">
          EvoluX.lk is under maintenance
        </h1>

        <p className="mt-2 text-base font-medium text-primary">
          We&apos;re fastening a few screws.
        </p>

        <p className="mx-auto mt-4 max-w-md text-balance text-muted-foreground">
          Our store is temporarily down for scheduled maintenance. We&apos;re
          working to improve your experience and will be back online soon. Thank
          you for your patience.
        </p>

        {/* <p className="mt-8 text-sm text-muted-foreground">
          Need help in the meantime? Email{" "}
          <a
            href="mailto:support@evolux.com"
            className="font-medium text-foreground underline underline-offset-4"
          >
            support@evolux.com
          </a>
        </p> */}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .evx-scene .evx-spin,
        .evx-scene .evx-spin-rev,
        .evx-scene .evx-bob,
        .evx-scene .evx-rock,
        .evx-scene .evx-twinkle,
        .evx-scene .evx-float,
        .evx-scene .evx-float-slow,
        .evx-scene .evx-float-fast {
          transform-box: fill-box;
          transform-origin: center;
          will-change: transform;
        }
        .evx-scene .evx-spin { animation: evx-spin 9s linear infinite; }
        .evx-scene .evx-spin-rev { animation: evx-spin 7s linear infinite reverse; }
        .evx-scene .evx-bob { animation: evx-bob 4s ease-in-out infinite; }
        .evx-scene .evx-rock { transform-origin: bottom center; animation: evx-rock 2.4s ease-in-out infinite; }
        .evx-scene .evx-twinkle { animation: evx-twinkle 2.6s ease-in-out infinite; }
        .evx-scene .evx-float { animation: evx-drift 6s ease-in-out infinite; }
        .evx-scene .evx-float-slow { animation: evx-drift 9s ease-in-out infinite; }
        .evx-scene .evx-float-fast { animation: evx-drift 4.5s ease-in-out infinite; }

        @keyframes evx-spin { to { transform: rotate(360deg); } }
        @keyframes evx-bob {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes evx-rock {
          0%, 100% { transform: rotate(-7deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes evx-twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes evx-drift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .evx-scene .evx-spin,
          .evx-scene .evx-spin-rev,
          .evx-scene .evx-bob,
          .evx-scene .evx-rock,
          .evx-scene .evx-twinkle,
          .evx-scene .evx-float,
          .evx-scene .evx-float-slow,
          .evx-scene .evx-float-fast {
            animation: none !important;
          }
        }
      `,
        }}
      />
    </main>
  )
}

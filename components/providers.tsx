"use client"

import { useState } from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

/**
 * App Providers
 *
 * Wraps the application with necessary context providers:
 * - React Query for server state management
 * - Additional providers can be added here
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { UserProvider } from '@/contexts/UserContext'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          return failureCount < 3
        },
      },
    },
  }))

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null // Prevent hydration mismatches
  }

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={100}>
          <UserProvider>
            {children}
          </UserProvider>
        </TooltipPrimitive.Provider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
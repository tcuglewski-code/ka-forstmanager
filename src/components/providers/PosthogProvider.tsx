'use client'

/**
 * Posthog Analytics Provider
 * 
 * DSGVO-konform: Tracking erst nach Consent aktiviert
 * 
 * Usage in layout.tsx:
 * ```tsx
 * import { PosthogProvider } from '@/components/providers/PosthogProvider'
 * 
 * <PosthogProvider>
 *   {children}
 * </PosthogProvider>
 * ```
 */

import { useEffect, ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initAnalytics, trackPageView } from '@/lib/analytics'

interface PosthogProviderProps {
  children: ReactNode
}

export function PosthogProvider({ children }: PosthogProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize on mount
  useEffect(() => {
    initAnalytics()
  }, [])

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      const params = searchParams?.toString()
      if (params) {
        url = url + '?' + params
      }
      trackPageView(url)
    }
  }, [pathname, searchParams])

  return <>{children}</>
}

export default PosthogProvider

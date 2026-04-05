"use client"

import { Suspense, useEffect, type ReactNode } from "react"
import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"

function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (key) {
      posthog.init(key, {
        api_host: "https://eu.i.posthog.com",
        capture_pageview: false,
        loaded: (ph) => {
          if (process.env.NODE_ENV === "development") {
            ph.debug()
          }
        },
      })
    }
  }, [])

  return null
}

interface PostHogProviderProps {
  children: ReactNode
}

export default function PostHogProvider({ children }: PostHogProviderProps) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

  if (!key) {
    return <>{children}</>
  }

  return (
    <Suspense fallback={null}>
      <PHProvider client={posthog}>
        <PostHogInit />
        {children}
      </PHProvider>
    </Suspense>
  )
}

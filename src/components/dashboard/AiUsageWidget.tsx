"use client"

import useSWR from "swr"
import { Sparkles, X } from "lucide-react"
import { useState } from "react"

interface AiUsageData {
  currentUsage: number
  monthlyLimit: number
  tier: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function Skeleton() {
  return (
    <div
      className="rounded-xl p-6 ambient-shadow-md animate-pulse"
      style={{ backgroundColor: "var(--color-surface-container-low)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: "var(--color-surface-container-high)" }} />
        <div className="h-4 w-24 rounded" style={{ backgroundColor: "var(--color-surface-container-high)" }} />
        <div className="ml-auto h-4 w-12 rounded-full" style={{ backgroundColor: "var(--color-surface-container-high)" }} />
      </div>
      <div className="h-4 w-48 rounded mb-2" style={{ backgroundColor: "var(--color-surface-container-high)" }} />
      <div className="w-full h-2 rounded-full" style={{ backgroundColor: "var(--color-surface-container-high)" }} />
      <div className="h-3 w-20 rounded mt-2" style={{ backgroundColor: "var(--color-surface-container-high)" }} />
    </div>
  )
}

export function AiUsageWidget() {
  const { data, isLoading } = useSWR<AiUsageData>("/api/ai/usage", fetcher, {
    refreshInterval: 60_000,
  })
  const [dismissedWarning, setDismissedWarning] = useState(false)
  const [dismissedLimit, setDismissedLimit] = useState(false)

  if (isLoading) return <Skeleton />
  if (!data) return null

  const percent = data.monthlyLimit > 0 ? (data.currentUsage / data.monthlyLimit) * 100 : 0
  const atWarning = percent >= 80 && percent < 100
  const atLimit = percent >= 100

  const barColor =
    atLimit ? "var(--color-error)" : atWarning ? "#d97706" : "var(--color-primary)"

  return (
    <div
      className="rounded-xl p-6 ambient-shadow-md"
      style={{ backgroundColor: "var(--color-surface-container-low)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4" style={{ color: "var(--color-tertiary)" }} />
        <h2
          className="font-semibold"
          style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
        >
          KI-Nutzung
        </h2>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: "var(--color-surface-container-high)",
            color: "var(--color-on-surface-variant)",
          }}
        >
          {data.tier}
        </span>
      </div>

      <p
        className="text-sm mb-2"
        style={{ color: "var(--color-on-surface-variant)" }}
      >
        {data.currentUsage} / {data.monthlyLimit} KI-Anfragen diesen Monat
      </p>

      {/* Progress Bar */}
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--color-surface-container-high)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(percent, 100)}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      <p
        className="text-xs mt-2"
        style={{ color: "var(--color-on-surface-variant)" }}
      >
        {Math.round(percent)}% verbraucht
      </p>

      {atWarning && !dismissedWarning && (
        <div
          className="mt-3 rounded-lg px-3 py-2 text-xs font-medium flex items-center justify-between gap-2"
          style={{
            backgroundColor: "rgba(217,119,6,0.08)",
            color: "#d97706",
            border: "1px solid rgba(217,119,6,0.2)",
          }}
        >
          <span>Du näherst dich deinem monatlichen KI-Limit</span>
          <button
            onClick={() => setDismissedWarning(true)}
            className="flex-shrink-0 p-0.5 rounded hover:bg-black/5"
            aria-label="Warnung schließen"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {atLimit && !dismissedLimit && (
        <div
          className="mt-3 rounded-lg px-3 py-2 text-xs font-medium flex items-center justify-between gap-2"
          style={{
            backgroundColor: "rgba(186,26,26,0.08)",
            color: "var(--color-error)",
            border: "1px solid rgba(186,26,26,0.2)",
          }}
        >
          <span>Limit erreicht — KI-Features pausiert</span>
          <button
            onClick={() => setDismissedLimit(true)}
            className="flex-shrink-0 p-0.5 rounded hover:bg-black/5"
            aria-label="Warnung schließen"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

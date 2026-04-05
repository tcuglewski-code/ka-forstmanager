"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"

interface AiUsageData {
  currentUsage: number
  monthlyLimit: number
  tier: string
}

export function AiUsageWidget() {
  const [data, setData] = useState<AiUsageData | null>(null)

  useEffect(() => {
    fetch("/api/ai/usage")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null

  const percent = data.monthlyLimit > 0 ? (data.currentUsage / data.monthlyLimit) * 100 : 0
  const atLimit = percent >= 100

  const barColor =
    percent > 80 ? "var(--color-error)" : percent > 60 ? "#d97706" : "var(--color-primary)"

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

      {atLimit && (
        <div
          className="mt-3 rounded-lg px-3 py-2 text-xs font-medium"
          style={{
            backgroundColor: "rgba(186,26,26,0.08)",
            color: "var(--color-error)",
            border: "1px solid rgba(186,26,26,0.2)",
          }}
        >
          Limit erreicht — Upgrade verfügbar
        </div>
      )}
    </div>
  )
}

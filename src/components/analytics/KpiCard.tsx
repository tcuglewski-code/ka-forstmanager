"use client"

import type { ReactNode } from "react"

interface KpiCardProps {
  title: string
  value: string | number
  hint?: string
  icon?: ReactNode
  trend?: number
  loading?: boolean
}

const FOREST = "#012d1d"
const LIME = "#A3E635"

export function KpiCard({ title, value, hint, icon, trend, loading }: KpiCardProps) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm border"
      style={{
        backgroundColor: "var(--color-surface-container, #ffffff)",
        borderColor: "var(--color-outline-variant, #e5e7eb)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide font-medium opacity-70">{title}</p>
          <p className="text-2xl font-semibold mt-2" style={{ color: FOREST }}>
            {loading ? "…" : value}
          </p>
          {hint && <p className="text-xs mt-1 opacity-60">{hint}</p>}
          {typeof trend === "number" && !loading && (
            <p
              className="text-xs mt-1 font-medium"
              style={{ color: trend >= 0 ? LIME : "#e53e3e" }}
            >
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
            </p>
          )}
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${LIME}33`, color: FOREST }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

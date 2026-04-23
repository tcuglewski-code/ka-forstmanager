"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, ToggleLeft, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureFlagData {
  id: string
  key: string
  name: string
  description: string | null
  type: string
  enabled: boolean
  percentage: number | null
  category: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
  _stats: {
    overrideCount: number
    usageLast24h: number
  }
}

function FeatureFlagToggle({
  flagKey,
  enabled,
  onToggle,
}: {
  flagKey: string
  enabled: boolean
  onToggle: (key: string, enabled: boolean) => void
}) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: flagKey, enabled: !enabled }),
      })
      if (res.ok) {
        onToggle(flagKey, !enabled)
      }
    } catch (err) {
      console.error("Toggle failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors",
        enabled ? "bg-emerald-600" : "bg-surface-container-highest",
        loading && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-full bg-white transition-transform mx-0.5",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
}

export default function FeatureFlagsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [flags, setFlags] = useState<FeatureFlagData[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const isAdmin =
    session?.user &&
    ["ka_admin", "super_admin"].includes(
      (session.user as { role?: string }).role || ""
    )

  useEffect(() => {
    if (session && !isAdmin) {
      router.push("/dashboard")
    }
  }, [session, isAdmin, router])

  const loadFlags = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/feature-flags")
      if (res.ok) {
        const data = await res.json()
        setFlags(data.flags || [])
      }
    } catch (err) {
      console.error("Feature Flags laden fehlgeschlagen:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) loadFlags()
  }, [isAdmin, loadFlags])

  const handleToggle = (key: string, enabled: boolean) => {
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled } : f))
    )
    setMessage({ type: "success", text: `Flag "${key}" ${enabled ? "aktiviert" : "deaktiviert"}` })
    setTimeout(() => setMessage(null), 3000)
  }

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case "ki":
        return "bg-purple-500/20 text-purple-400"
      case "sync":
        return "bg-blue-100 text-blue-800"
      case "billing":
        return "bg-amber-100 text-amber-800"
      case "safety":
        return "bg-red-100 text-red-800"
      case "compliance":
        return "bg-green-500/20 text-green-400"
      case "security":
        return "bg-orange-500/20 text-orange-400"
      case "admin":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-[var(--color-surface-container-high)] text-zinc-300"
    }
  }

  if (!isAdmin) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center">
            <ToggleLeft className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>Feature Flags</h1>
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              {flags.length} Flags konfiguriert
            </p>
          </div>
        </div>
        <button
          onClick={loadFlags}
          className="px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg hover:bg-[#333] flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Aktualisieren
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={cn(
            "px-4 py-3 rounded-lg text-sm",
            message.type === "success"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-500/30"
              : "bg-red-100 text-red-800 border border-red-500/30"
          )}
        >
          {message.text}
        </div>
      )}

      {/* Flags Table */}
      <div className="bg-[var(--color-surface-container-lowest)] border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)]">
                Key
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)]">
                Status
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)]">
                Typ
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)]">
                Rollout %
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)]">
                Kategorie
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)]">
                Beschreibung
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)]">
                24h Nutzung
              </th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => (
              <tr
                key={flag.id}
                className="border-b border-border last:border-0 hover:bg-[#222]"
              >
                <td className="px-4 py-3">
                  <code className="text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {flag.key}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <FeatureFlagToggle
                    flagKey={flag.key}
                    enabled={flag.enabled}
                    onToggle={handleToggle}
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-[var(--color-on-surface-variant)]">{flag.type}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-[var(--color-on-surface-variant)]">
                    {flag.percentage !== null ? `${flag.percentage}%` : "---"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {flag.category && (
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs",
                        getCategoryColor(flag.category)
                      )}
                    >
                      {flag.category}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-on-surface-variant)] max-w-xs truncate">
                  {flag.description || "---"}
                </td>
                <td className="px-4 py-3 text-right text-sm text-[var(--color-on-surface-variant)]">
                  {flag._stats?.usageLast24h ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

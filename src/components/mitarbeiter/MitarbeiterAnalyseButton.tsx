"use client"

import { useState } from "react"
import { Sparkles, Loader2, CheckCircle } from "lucide-react"
import { captureScreenshot } from "@/lib/screenshot"

interface AnalyseResult {
  analysiert: number
  erstellt: number
  tasks: Array<{ title: string; description: string; priority: string }>
}

export function MitarbeiterAnalyseButton({ mitarbeiterId }: { mitarbeiterId: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyseResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyse = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // 1. Screenshot der Seite
      const { dataUrl, error: screenshotError } = await captureScreenshot()
      if (!dataUrl || screenshotError) {
        setError(`Screenshot fehlgeschlagen: ${screenshotError}`)
        return
      }

      // 2. An API senden
      const res = await fetch(`/api/mitarbeiter/${mitarbeiterId}/analyse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshot: dataUrl }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Fehler ${res.status}`)
        return
      }

      const data: AnalyseResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleAnalyse}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analysiere...
          </>
        ) : result ? (
          <>
            <CheckCircle className="w-4 h-4" />
            {result.erstellt} Tasks erstellt
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            KI-Analyse
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}

      {result && result.tasks.length > 0 && (
        <div className="mt-3 space-y-2">
          {result.tasks.map((t, i) => (
            <div
              key={i}
              className="bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    t.priority === "high"
                      ? "bg-red-400"
                      : t.priority === "medium"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                  }`}
                />
                <p className="text-sm text-[var(--color-on-surface)] font-medium">{t.title}</p>
              </div>
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-1 ml-4">
                {t.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

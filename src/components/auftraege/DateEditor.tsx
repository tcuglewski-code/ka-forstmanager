"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Calendar } from "lucide-react"

interface Props {
  auftragId: string
  startDatum?: string | null
  endDatum?: string | null
  onUpdated?: () => void
}

function toDateInput(value?: string | null): string {
  if (!value) return ""
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return ""
    return d.toISOString().slice(0, 10)
  } catch {
    return ""
  }
}

export function DateEditor({ auftragId, startDatum, endDatum, onUpdated }: Props) {
  const [start, setStart] = useState<string>(toDateInput(startDatum))
  const [end, setEnd] = useState<string>(toDateInput(endDatum))
  const [savedFlash, setSavedFlash] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => setStart(toDateInput(startDatum)), [startDatum])
  useEffect(() => setEnd(toDateInput(endDatum)), [endDatum])

  const triggerSave = (s: string, e: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        setError(null)
        const body: Record<string, string | null> = {}
        body.startDatum = s ? new Date(s).toISOString() : null
        body.endDatum = e ? new Date(e).toISOString() : null

        const res = await fetch(`/api/auftraege/${auftragId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          setError("Speichern fehlgeschlagen")
          return
        }
        setSavedFlash(true)
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
        flashTimerRef.current = setTimeout(() => setSavedFlash(false), 1500)
        onUpdated?.()
      } catch (err) {
        console.error("[DateEditor] save error:", err)
        setError("Netzwerkfehler")
      }
    }, 400)
  }

  return (
    <div className="bg-[var(--color-surface-container-low)] border border-border rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Calendar className="w-3.5 h-3.5 text-[var(--color-on-surface-variant)]" />
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-on-surface-variant)] font-medium">
          Zeitraum
        </span>
        {savedFlash && (
          <span className="ml-auto flex items-center gap-1 text-emerald-400 text-xs animate-pulse">
            <Check className="w-3.5 h-3.5" />
            Gespeichert
          </span>
        )}
        {error && <span className="ml-auto text-red-400 text-xs">{error}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`start-${auftragId}`} className="block text-[10px] text-[var(--color-on-surface-variant)] mb-1">
            Startdatum
          </label>
          <input
            id={`start-${auftragId}`}
            data-testid="auftrag-start-datum"
            type="date"
            value={start}
            onChange={(e) => {
              setStart(e.target.value)
              triggerSave(e.target.value, end)
            }}
            className="w-full bg-[var(--color-surface-container)] border border-border rounded px-2 py-1.5 text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label htmlFor={`end-${auftragId}`} className="block text-[10px] text-[var(--color-on-surface-variant)] mb-1">
            Voraussl. Enddatum
          </label>
          <input
            id={`end-${auftragId}`}
            data-testid="auftrag-end-datum"
            type="date"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value)
              triggerSave(start, e.target.value)
            }}
            className="w-full bg-[var(--color-surface-container)] border border-border rounded px-2 py-1.5 text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  )
}

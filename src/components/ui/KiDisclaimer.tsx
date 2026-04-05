"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

const STORAGE_KEY = "ki-disclaimer-dismissed"

export default function KiDisclaimer() {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true")
  }, [])

  if (dismissed) return null

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
      <p className="text-xs text-amber-300">
        KI-Hinweis: Empfehlungen des Betriebs-Assistenten sind unverbindlich und ersetzen keine Fachberatung.
      </p>
      <button
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "true")
          setDismissed(true)
        }}
        className="p-1 rounded hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0"
        aria-label="Hinweis schließen"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

interface Props {
  data: unknown
}

export function RohdatenToggle({ data }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)] hover:text-zinc-300 transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        {open ? "Rohdaten ausblenden" : "Rohdaten anzeigen"}
      </button>
      {open && (
        <pre className="mt-3 p-3 bg-[var(--color-surface-container-lowest)] rounded-lg text-xs text-[var(--color-on-surface-variant)] overflow-auto max-h-64 leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from 'react'
import { Clock, ExternalLink, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

interface FristProgramm {
  id: number
  name: string
  bundesland: string | null
  antragsfrist: string | null
  url: string | null
  foerdersatz: string | null
  traeger: string | null
}

/**
 * Widget das Förderprogramme mit konkreten Antragsfristen anzeigt.
 * Für Dashboard-Integration.
 */
export function FristenWidget() {
  const [programme, setProgramme] = useState<FristProgramm[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/foerderung/fristen')
      .then(r => r.json())
      .then(data => setProgramme(data.programme || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (programme.length === 0) return null

  const sichtbar = expanded ? programme : programme.slice(0, 3)

  return (
    <div className="bg-[#161616] border border-amber-900/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-amber-500/15 rounded-lg">
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">Antragsfristen</h3>
          <p className="text-xs text-zinc-500">{programme.length} Programme mit Fristangabe</p>
        </div>
        <AlertTriangle className="w-4 h-4 text-amber-400/60" />
      </div>

      <div className="space-y-2">
        {sichtbar.map(p => (
          <div key={p.id} className="flex items-start justify-between gap-2 bg-[#0f0f0f] rounded-lg px-3 py-2 border border-[#1e1e1e]">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{p.name}</p>
              <p className="text-xs text-amber-400 mt-0.5">📅 {p.antragsfrist}</p>
              {p.bundesland && <p className="text-xs text-zinc-600">{p.bundesland}</p>}
            </div>
            {p.url && (
              <a href={p.url} target="_blank" rel="noopener noreferrer"
                className="p-1 text-zinc-600 hover:text-emerald-400 transition-colors flex-shrink-0 mt-0.5">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>

      {programme.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full justify-center"
        >
          {expanded ? <><ChevronUp className="w-3 h-3" /> Weniger anzeigen</> : <><ChevronDown className="w-3 h-3" /> {programme.length - 3} weitere anzeigen</>}
        </button>
      )}

      <p className="text-xs text-zinc-700 mt-2">⚠️ Fristen bei Behörde prüfen</p>
    </div>
  )
}

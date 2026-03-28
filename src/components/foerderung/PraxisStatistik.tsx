"use client"
import { useState, useEffect } from 'react'
import { TrendingUp, CheckCircle, Clock } from 'lucide-react'

interface Statistik {
  programm_id: number
  programm_name: string
  bundesland: string | null
  anzahl_antraege: number
  anzahl_bewilligt: number
  erfolgsquote_pct: number | null
  avg_bearbeitungstage: number | null
  gesamt_bewilligt_eur: number | null
}

/**
 * Zeigt Praxis-Statistiken zu gestellten Förderanträgen.
 * Aggregiertes Betriebswissen — das, was kein ChatGPT kennt.
 */
export function PraxisStatistik() {
  const [statistiken, setStatistiken] = useState<Statistik[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/foerderung/antragsverlauf')
      .then(r => r.json())
      .then(data => setStatistiken(data.statistik || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || statistiken.length === 0) {
    return (
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Betriebserfahrung</h3>
        </div>
        <p className="text-xs text-zinc-600">
          Noch keine Anträge erfasst. Trage gestellte Förderanträge ein um Erfolgsquoten zu tracken.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-emerald-500/15 rounded-lg">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Betriebserfahrung</h3>
          <p className="text-xs text-zinc-500">Aus eigenen Antragsverläufen</p>
        </div>
      </div>

      <div className="space-y-2">
        {statistiken.map(s => (
          <div key={s.programm_id} className="bg-[#0f0f0f] rounded-lg px-3 py-2 border border-[#1e1e1e]">
            <p className="text-xs font-medium text-white truncate mb-1">{s.programm_name}</p>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-500">{s.anzahl_antraege}x beantragt</span>
              {s.erfolgsquote_pct !== null && (
                <span className={`flex items-center gap-1 ${s.erfolgsquote_pct >= 70 ? 'text-emerald-400' : s.erfolgsquote_pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  <CheckCircle className="w-3 h-3" />
                  {s.erfolgsquote_pct}% Erfolg
                </span>
              )}
              {s.avg_bearbeitungstage && (
                <span className="flex items-center gap-1 text-zinc-500">
                  <Clock className="w-3 h-3" />
                  Ø {s.avg_bearbeitungstage} Tage
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

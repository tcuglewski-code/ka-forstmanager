"use client"

import { useState, useEffect } from "react"

interface Saison {
  id: string
  name: string
}

interface Statistik {
  gesamtStunden: number
  maschinenStunden: number
  arbeitsTage: number
  vorschussGesamt: number
  abrechnungenAnzahl: number
  nachTyp: Record<string, number>
}

export function StatistikWidget({ mitarbeiterId, saisons }: { mitarbeiterId: string; saisons: Saison[] }) {
  const [statistik, setStatistik] = useState<Statistik | null>(null)
  const [statSaisonId, setStatSaisonId] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = statSaisonId
      ? `/api/mitarbeiter/${mitarbeiterId}/statistik?saisonId=${statSaisonId}`
      : `/api/mitarbeiter/${mitarbeiterId}/statistik`
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setStatistik(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [mitarbeiterId, statSaisonId])

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Statistik</h3>
        <select
          value={statSaisonId}
          onChange={(e) => setStatSaisonId(e.target.value)}
          className="text-xs px-2 py-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded text-zinc-400 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Saisons</option>
          {saisons.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-xs text-zinc-600">Lade Statistik...</p>
      ) : statistik ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Gesamtstunden", value: `${(statistik.gesamtStunden ?? 0).toFixed(1)}h`, color: "text-white" },
              { label: "Maschinenstunden", value: `${(statistik.maschinenStunden ?? 0).toFixed(1)}h`, color: "text-amber-400" },
              { label: "Arbeitstage", value: String(statistik.arbeitsTage ?? 0), color: "text-white" },
              {
                label: "Vorschüsse",
                value: (statistik.vorschussGesamt ?? 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" }),
                color: "text-red-400",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-3">
                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {statistik.abrechnungenAnzahl > 0 && (
            <p className="text-xs text-zinc-500 mt-3">
              {statistik.abrechnungenAnzahl} Abrechnung{statistik.abrechnungenAnzahl !== 1 ? "en" : ""} erstellt
            </p>
          )}

          {statistik.nachTyp && Object.keys(statistik.nachTyp).length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {Object.entries(statistik.nachTyp).map(([typ, std]) => (
                <span
                  key={typ}
                  className="text-xs px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-zinc-400"
                >
                  {typ}: {(std as number).toFixed(1)}h
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-zinc-600">Keine Daten verfügbar</p>
      )}
    </div>
  )
}

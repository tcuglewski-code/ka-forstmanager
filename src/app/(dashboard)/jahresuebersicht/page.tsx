"use client"

import { useState, useEffect } from "react"
import { BarChart3, Loader2, TrendingUp, Euro, Clock, ClipboardList } from "lucide-react"

interface SaisonResult {
  saison: { id: string; name: string; aktiv: boolean; status: string }
  auftraege: number
  abgeschlossen: number
  mitarbeiter: number
  gesamtStunden: number
  umsatz: number
  lohnkosten: number
  deckungsbeitrag: number
  marge: number
}

interface Gesamt {
  umsatz: number
  lohnkosten: number
  gesamtStunden: number
  auftraege: number
  deckungsbeitrag: number
  marge: number
}

function formatEur(value: number): string {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
}

function MargeChip({ marge }: { marge: number }) {
  const color =
    marge > 30
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : marge > 10
      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
      : "bg-red-500/20 text-red-400 border-red-500/30"
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-semibold ${color}`}>
      {marge.toFixed(1)} %
    </span>
  )
}

export default function JahresuebersichtPage() {
  const [data, setData] = useState<{ saisons: SaisonResult[]; gesamt: Gesamt } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/jahresuebersicht")
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError("Fehler beim Laden der Daten"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400 text-sm">
          {error}
        </div>
      </div>
    )
  }

  const gesamt = data?.gesamt
  const saisons = data?.saisons ?? []

  const kacheln = [
    {
      label: "Gesamtumsatz",
      value: gesamt ? formatEur(gesamt.umsatz) : "—",
      icon: <Euro className="w-5 h-5 text-emerald-400" />,
      color: "text-emerald-400",
    },
    {
      label: "Lohnkosten",
      value: gesamt ? formatEur(gesamt.lohnkosten) : "—",
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      color: "text-amber-400",
    },
    {
      label: "Deckungsbeitrag",
      value: gesamt ? formatEur(gesamt.deckungsbeitrag) : "—",
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
      color: gesamt && gesamt.deckungsbeitrag >= 0 ? "text-blue-400" : "text-red-400",
    },
    {
      label: "Gesamtmarge",
      value: gesamt ? `${gesamt.marge.toFixed(1)} %` : "—",
      icon: <BarChart3 className="w-5 h-5 text-violet-400" />,
      color:
        gesamt && gesamt.marge > 30
          ? "text-emerald-400"
          : gesamt && gesamt.marge > 10
          ? "text-amber-400"
          : "text-red-400",
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          Jahresübersicht
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Strategische Gesamtsicht über alle Saisons</p>
      </div>

      {/* Gesamt-Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kacheln.map(k => (
          <div
            key={k.label}
            className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              {k.icon}
              <p className="text-xs text-zinc-500">{k.label}</p>
            </div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Weitere Gesamt-Zahlen */}
      {gesamt && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Gesamtstunden</p>
            <p className="text-lg font-bold text-white">{gesamt.gesamtStunden.toLocaleString("de-DE")} h</p>
          </div>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Aufträge gesamt</p>
            <p className="text-lg font-bold text-white">{gesamt.auftraege}</p>
          </div>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Saisons</p>
            <p className="text-lg font-bold text-white">{saisons.length}</p>
          </div>
        </div>
      )}

      {/* Tabelle per Saison */}
      {saisons.length === 0 ? (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-12 text-center text-zinc-600 text-sm">
          Keine Saisons gefunden
        </div>
      ) : (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-zinc-500" />
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">Auswertung nach Saison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Saison</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-medium">Aufträge</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-medium">Abgeschl.</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-medium">MA</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-medium">Stunden</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-medium">Umsatz</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-medium">Lohnkosten</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-medium">DB</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-medium">Marge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {saisons.map(s => (
                  <tr key={s.saison.id} className="hover:bg-[#1c1c1c] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{s.saison.name}</span>
                        {s.saison.aktiv && (
                          <span className="px-1.5 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            aktiv
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">{s.auftraege}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      <span className={s.abgeschlossen === s.auftraege && s.auftraege > 0 ? "text-emerald-400" : ""}>
                        {s.abgeschlossen}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">{s.mitarbeiter}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{s.gesamtStunden.toLocaleString("de-DE")} h</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-400">{formatEur(s.umsatz)}</td>
                    <td className="px-4 py-3 text-right text-amber-400">{formatEur(s.lohnkosten)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${s.deckungsbeitrag >= 0 ? "text-blue-400" : "text-red-400"}`}>
                      {formatEur(s.deckungsbeitrag)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MargeChip marge={s.marge} />
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Gesamt-Zeile */}
              {gesamt && (
                <tfoot>
                  <tr className="border-t-2 border-[#3a3a3a] bg-[#1a1a1a]">
                    <td className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Gesamt</td>
                    <td className="px-4 py-3 text-right text-zinc-300 font-bold">{gesamt.auftraege}</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right text-zinc-300 font-bold">{gesamt.gesamtStunden.toLocaleString("de-DE")} h</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">{formatEur(gesamt.umsatz)}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-400">{formatEur(gesamt.lohnkosten)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${gesamt.deckungsbeitrag >= 0 ? "text-blue-400" : "text-red-400"}`}>
                      {formatEur(gesamt.deckungsbeitrag)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MargeChip marge={gesamt.marge} />
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

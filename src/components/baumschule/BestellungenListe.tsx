"use client"

import { useState, useEffect } from "react"

interface Pflanzanfrage {
  id: string
  titel: string
  typ: string
  status: string
  flaeche_ha: number | null
  standort: string | null
  bundesland: string | null
  waldbesitzer: string | null
  baumarten: string | null
  zeitraum: string | null
  createdAt: string
  updatedAt: string
}

interface Props {
  baumschuleId: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  anfrage: { label: "Anfrage", color: "bg-yellow-500/20 text-yellow-400" },
  geplant: { label: "Geplant", color: "bg-blue-500/20 text-blue-400" },
  aktiv: { label: "Aktiv", color: "bg-emerald-500/20 text-emerald-400" },
  abgeschlossen: { label: "Abgeschlossen", color: "bg-zinc-600/30 text-zinc-400" },
  storniert: { label: "Storniert", color: "bg-zinc-600/30 text-zinc-500" },
}

export function BestellungenListe({ baumschuleId }: Props) {
  const [anfragen, setAnfragen] = useState<Pflanzanfrage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/baumschulen/${baumschuleId}/bestellungen`)
        if (res.ok) {
          const data = await res.json()
          setAnfragen(data.pflanzanfragen || [])
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [baumschuleId])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (loading) {
    return <div className="py-8 text-center text-zinc-500">Lade Pflanzanfragen...</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Pflanzanfragen ({anfragen.length})</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Waldbesitzer-Anfragen die Baumarten aus Ihrem Sortiment enthalten
        </p>
      </div>

      {anfragen.length === 0 ? (
        <div className="py-8 text-center text-zinc-500">
          Keine passenden Pflanzanfragen vorhanden.
        </div>
      ) : (
        <div className="space-y-3">
          {anfragen.map((a) => {
            const config = STATUS_CONFIG[a.status] || { label: a.status, color: "bg-zinc-700 text-zinc-400" }

            return (
              <div key={a.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium truncate">{a.titel}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {a.waldbesitzer && <span>Waldbesitzer: {a.waldbesitzer}</span>}
                      {a.flaeche_ha != null && <span>{a.flaeche_ha} ha</span>}
                      {a.standort && <span>{a.standort}</span>}
                      {a.bundesland && <span>{a.bundesland}</span>}
                      <span>{formatDate(a.createdAt)}</span>
                    </div>
                    {a.baumarten && (
                      <p className="text-xs text-emerald-400/70 mt-1">
                        Baumarten: {a.baumarten}
                      </p>
                    )}
                    {a.zeitraum && (
                      <p className="text-xs text-zinc-500 mt-0.5">Zeitraum: {a.zeitraum}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

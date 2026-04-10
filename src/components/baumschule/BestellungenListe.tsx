"use client"

import { useState } from "react"
import { toast } from "sonner"

interface Bestellung {
  id: string
  baumschuleId: string
  wpOrderId: number | null
  baumart: string
  menge: number
  preis: number | null
  einheit: string
  status: string
  notizen: string | null
  createdAt: string
  updatedAt: string
}

interface Props {
  baumschuleId: string
  initialBestellungen: Bestellung[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  neu: { label: "Neu", color: "bg-yellow-500/20 text-yellow-400" },
  bestaetigt: { label: "Bestätigt", color: "bg-blue-500/20 text-blue-400" },
  geliefert: { label: "Geliefert", color: "bg-emerald-500/20 text-emerald-400" },
  storniert: { label: "Storniert", color: "bg-zinc-600/30 text-zinc-500" },
}

const NEXT_STATUS: Record<string, string> = {
  neu: "bestaetigt",
  bestaetigt: "geliefert",
}

export function BestellungenListe({ baumschuleId, initialBestellungen }: Props) {
  const [bestellungen, setBestellungen] = useState(initialBestellungen)
  const [updating, setUpdating] = useState<string | null>(null)

  const updateStatus = async (bestellung: Bestellung, newStatus: string) => {
    setUpdating(bestellung.id)
    try {
      const res = await fetch(`/api/baumschulen/${baumschuleId}/bestellungen/${bestellung.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const updated = await res.json()
        setBestellungen((prev) => prev.map((b) => (b.id === bestellung.id ? updated : b)))
        toast.success(`Status auf "${STATUS_CONFIG[newStatus]?.label || newStatus}" gesetzt`)
      } else {
        toast.error("Fehler beim Status-Update")
      }
    } catch {
      toast.error("Netzwerkfehler")
    } finally {
      setUpdating(null)
    }
  }

  const stornieren = async (bestellung: Bestellung) => {
    if (!confirm(`Bestellung für "${bestellung.baumart}" stornieren?`)) return
    await updateStatus(bestellung, "storniert")
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Bestellungen ({bestellungen.length})</h2>

      {bestellungen.length === 0 ? (
        <div className="py-8 text-center text-zinc-500">Noch keine Bestellungen vorhanden.</div>
      ) : (
        <div className="space-y-3">
          {bestellungen.map((b) => {
            const config = STATUS_CONFIG[b.status] || { label: b.status, color: "bg-zinc-700 text-zinc-400" }
            const nextStatus = NEXT_STATUS[b.status]

            return (
              <div key={b.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{b.baumart}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${config.color}`}>{config.label}</span>
                    </div>
                    <div className="text-sm text-zinc-400 mt-1">
                      {b.menge} {b.einheit}
                      {b.preis != null && <> &middot; {b.preis.toFixed(2)} €</>}
                      {b.wpOrderId && <> &middot; WC #{b.wpOrderId}</>}
                      <> &middot; {formatDate(b.createdAt)}</>
                    </div>
                    {b.notizen && <p className="text-xs text-zinc-500 mt-1">{b.notizen}</p>}
                  </div>
                  <div className="flex gap-2">
                    {nextStatus && (
                      <button
                        onClick={() => updateStatus(b, nextStatus)}
                        disabled={updating === b.id}
                        className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
                      >
                        {updating === b.id ? "..." : STATUS_CONFIG[nextStatus]?.label || nextStatus}
                      </button>
                    )}
                    {b.status !== "storniert" && b.status !== "geliefert" && (
                      <button
                        onClick={() => stornieren(b)}
                        disabled={updating === b.id}
                        className="px-3 py-1.5 text-xs bg-red-900/50 hover:bg-red-800 text-red-400 disabled:opacity-50 rounded-lg transition-colors"
                      >
                        Stornieren
                      </button>
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

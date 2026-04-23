"use client"

import { useState, useEffect } from "react"
import { Package, Check, Undo2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BestandsAmpel } from "./BestandsAmpel"

interface LagerReservierung {
  id: string
  menge: number
  status: "RESERVIERT" | "VERBRAUCHT" | "ZURUECK"
  verbrauchtAm: string | null
  createdAt: string
  artikel: {
    id: string
    name: string
    einheit: string
    bestand: number
    mindestbestand: number
  }
}

interface MaterialTabProps {
  auftragId: string
}

export function MaterialTab({ auftragId }: MaterialTabProps) {
  const [reservierungen, setReservierungen] = useState<LagerReservierung[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadReservierungen = async () => {
    try {
      const res = await fetch(`/api/lager/reservierung?auftragId=${auftragId}`)
      if (res.ok) {
        const data = await res.json()
        setReservierungen(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Fehler beim Laden der Reservierungen:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReservierungen()
  }, [auftragId])

  const handleVerbrauchen = async (reservierungId: string) => {
    setActionLoading(reservierungId)
    try {
      const res = await fetch(`/api/lager/reservierung/${reservierungId}/verbrauchen`, {
        method: "PATCH"
      })
      if (res.ok) {
        toast.success("Verbrauch bestätigt")
        loadReservierungen()
      } else {
        toast.error("Fehler beim Bestätigen")
      }
    } catch {
      toast.error("Fehler beim Bestätigen")
    } finally {
      setActionLoading(null)
    }
  }

  const handleZurueckgeben = async (reservierungId: string) => {
    setActionLoading(reservierungId)
    try {
      const res = await fetch(`/api/lager/reservierung/${reservierungId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ZURUECK" })
      })
      if (res.ok) {
        toast.success("Material zurückgegeben")
        loadReservierungen()
      } else {
        toast.error("Fehler bei Rückgabe")
      }
    } catch {
      toast.error("Fehler bei Rückgabe")
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (status: LagerReservierung["status"]) => {
    switch (status) {
      case "RESERVIERT":
        return (
          <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 flex items-center gap-1">
            <Package className="w-3 h-3" />
            Reserviert
          </span>
        )
      case "VERBRAUCHT":
        return (
          <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Verbraucht
          </span>
        )
      case "ZURUECK":
        return (
          <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 flex items-center gap-1">
            <Undo2 className="w-3 h-3" />
            Zurückgegeben
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-[var(--color-on-surface-variant)] animate-spin" />
      </div>
    )
  }

  if (reservierungen.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
        <p className="text-[var(--color-on-surface-variant)] text-sm">Keine Materialreservierungen für diesen Auftrag</p>
        <p className="text-zinc-600 text-xs mt-1">
          Reservierungen können über das Lager erstellt werden
        </p>
      </div>
    )
  }

  const reserviert = reservierungen.filter(r => r.status === "RESERVIERT")
  const verbraucht = reservierungen.filter(r => r.status === "VERBRAUCHT")
  const zurueck = reservierungen.filter(r => r.status === "ZURUECK")

  return (
    <div className="space-y-4">
      {/* Zusammenfassung */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--color-surface-container-highest)] rounded-lg p-3 text-center">
          <p className="text-lg font-semibold text-blue-400">{reserviert.length}</p>
          <p className="text-xs text-[var(--color-on-surface-variant)]">Reserviert</p>
        </div>
        <div className="bg-[var(--color-surface-container-highest)] rounded-lg p-3 text-center">
          <p className="text-lg font-semibold text-emerald-400">{verbraucht.length}</p>
          <p className="text-xs text-[var(--color-on-surface-variant)]">Verbraucht</p>
        </div>
        <div className="bg-[var(--color-surface-container-highest)] rounded-lg p-3 text-center">
          <p className="text-lg font-semibold text-amber-400">{zurueck.length}</p>
          <p className="text-xs text-[var(--color-on-surface-variant)]">Zurückgegeben</p>
        </div>
      </div>

      {/* Reservierungsliste */}
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">Artikel</th>
              <th className="text-right px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">Menge</th>
              <th className="text-center px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">Status</th>
              <th className="text-right px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {reservierungen.map(r => (
              <tr key={r.id} className="border-b border-[var(--color-outline-variant)] hover:bg-[#1c1c1c] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <BestandsAmpel 
                      bestand={r.artikel.bestand} 
                      mindestbestand={r.artikel.mindestbestand} 
                    />
                    <span className="text-[var(--color-on-surface)]">{r.artikel.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-[var(--color-on-surface)]">
                  {r.menge} {r.artikel.einheit}
                </td>
                <td className="px-4 py-3 text-center">
                  {statusBadge(r.status)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    {r.status === "RESERVIERT" && (
                      <>
                        <button
                          onClick={() => handleVerbrauchen(r.id)}
                          disabled={actionLoading === r.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === r.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Verbraucht
                        </button>
                        <button
                          onClick={() => handleZurueckgeben(r.id)}
                          disabled={actionLoading === r.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === r.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Undo2 className="w-3 h-3" />
                          )}
                          Zurück
                        </button>
                      </>
                    )}
                    {r.status === "VERBRAUCHT" && r.verbrauchtAm && (
                      <span className="text-xs text-[var(--color-on-surface-variant)]">
                        {new Date(r.verbrauchtAm).toLocaleDateString("de-DE")}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hinweis wenn Artikel unter Mindestbestand */}
      {reservierungen.some(r => r.artikel.bestand <= r.artikel.mindestbestand) && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-100 border border-amber-200 text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Einige reservierte Artikel sind unter Mindestbestand. Bitte Nachbestellung prüfen.</span>
        </div>
      )}
    </div>
  )
}

export default MaterialTab

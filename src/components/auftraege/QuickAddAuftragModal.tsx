"use client"

// KJ-1: Quick Add Auftrag Modal für Saison-View
// Kompaktes Modal zum schnellen Erstellen von Aufträgen direkt aus der Saison-Ansicht

import { useState } from "react"
import { X, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  saisonId: string
  saisonName: string
  onClose: () => void
  onCreated: () => void
}

const TYPEN = [
  { value: "pflanzung", label: "Pflanzung" },
  { value: "zaunbau", label: "Zaunbau" },
  { value: "kulturschutz", label: "Kulturschutz" },
  { value: "kulturpflege", label: "Kulturpflege" },
  { value: "flaechenvorbereitung", label: "Flächenvorbereitung" },
]

export function QuickAddAuftragModal({ saisonId, saisonName, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    typ: "pflanzung",
    waldbesitzer: "",
    flaeche_ha: "",
    standort: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.waldbesitzer.trim()) {
      toast.error("Waldbesitzer ist erforderlich")
      return
    }

    setLoading(true)

    try {
      // Auto-generierter Titel basierend auf Typ und Waldbesitzer
      const typLabel = TYPEN.find(t => t.value === form.typ)?.label || form.typ
      const titel = `${typLabel} - ${form.waldbesitzer}`

      const res = await fetch("/api/auftraege", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titel,
          typ: form.typ,
          status: "anfrage",
          waldbesitzer: form.waldbesitzer,
          flaeche_ha: form.flaeche_ha ? parseFloat(form.flaeche_ha) : null,
          standort: form.standort || null,
          saisonId, // Automatisch aus Kontext
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erstellen fehlgeschlagen")
      }

      toast.success("Auftrag erstellt")
      onCreated()
    } catch (error) {
      console.error("Quick Add Fehler:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Erstellen")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-border rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" />
              Schnell-Auftrag
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Saison: {saisonName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Typ */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Auftragstyp *</label>
            <select
              value={form.typ}
              onChange={(e) => setForm((f) => ({ ...f, typ: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {TYPEN.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Waldbesitzer */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Waldbesitzer *</label>
            <input
              type="text"
              value={form.waldbesitzer}
              onChange={(e) => setForm((f) => ({ ...f, waldbesitzer: e.target.value }))}
              placeholder="Name des Waldbesitzers"
              className="w-full bg-[#0f0f0f] border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>

          {/* Fläche + Standort */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Fläche (ha)</label>
              <input
                type="number"
                step="0.01"
                value={form.flaeche_ha}
                onChange={(e) => setForm((f) => ({ ...f, flaeche_ha: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-[#0f0f0f] border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Standort</label>
              <input
                type="text"
                value={form.standort}
                onChange={(e) => setForm((f) => ({ ...f, standort: e.target.value }))}
                placeholder="z.B. Abt. 5"
                className="w-full bg-[#0f0f0f] border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Info */}
          <p className="text-xs text-zinc-600">
            Der Auftrag wird automatisch dieser Saison zugewiesen. Details können später bearbeitet werden.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !form.waldbesitzer.trim()}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Erstellen...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Erstellen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

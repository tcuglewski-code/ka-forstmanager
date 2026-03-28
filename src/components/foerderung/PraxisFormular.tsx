"use client"

import { useState, useEffect } from "react"
import { X, Save, Loader2 } from "lucide-react"

interface Programm {
  id: number
  name: string
  bundesland: string | null
}

interface PraxisFormularProps {
  onClose: () => void
  onSuccess: () => void
  editData?: {
    id: number
    programm_id: number
    bundesland: string | null
    bewilligungsdauer_wochen: number | null
    beantragter_betrag_eur: number | null
    bewilligter_betrag_eur: number | null
    hinweis: string | null
    fallstricke: string | null
    erfolgreich: boolean
    antrag_datum: string | null
    bewilligung_datum: string | null
  } | null
}

const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
  "Bundesweit",
]

export function PraxisFormular({ onClose, onSuccess, editData }: PraxisFormularProps) {
  const [loading, setLoading] = useState(false)
  const [loadingProgramme, setLoadingProgramme] = useState(true)
  const [programme, setProgramme] = useState<Programm[]>([])
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    programm_id: editData?.programm_id || 0,
    bundesland: editData?.bundesland || "",
    antrag_datum: editData?.antrag_datum?.split("T")[0] || "",
    bewilligung_datum: editData?.bewilligung_datum?.split("T")[0] || "",
    bewilligungsdauer_wochen: editData?.bewilligungsdauer_wochen || "",
    beantragter_betrag_eur: editData?.beantragter_betrag_eur || "",
    bewilligter_betrag_eur: editData?.bewilligter_betrag_eur || "",
    erfolgreich: editData?.erfolgreich ?? true,
    hinweis: editData?.hinweis || "",
    fallstricke: editData?.fallstricke || "",
  })

  // Programme laden
  useEffect(() => {
    async function loadProgramme() {
      try {
        const res = await fetch("/api/foerderung/suche?limit=500")
        const data = await res.json()
        setProgramme(data.programme || [])
      } catch (err) {
        console.error("Fehler beim Laden der Programme:", err)
      } finally {
        setLoadingProgramme(false)
      }
    }
    loadProgramme()
  }, [])

  // Bewilligungsdauer automatisch berechnen
  useEffect(() => {
    if (formData.antrag_datum && formData.bewilligung_datum) {
      const antrag = new Date(formData.antrag_datum)
      const bewilligung = new Date(formData.bewilligung_datum)
      const diffMs = bewilligung.getTime() - antrag.getTime()
      const diffWeeks = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7))
      if (diffWeeks > 0) {
        setFormData((prev) => ({ ...prev, bewilligungsdauer_wochen: diffWeeks }))
      }
    }
  }, [formData.antrag_datum, formData.bewilligung_datum])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const method = editData ? "PATCH" : "POST"
      const body = editData ? { id: editData.id, ...formData } : formData

      const res = await fetch("/api/foerderung/praxis", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Fehler beim Speichern")
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">
            {editData ? "Antrag bearbeiten" : "Neuen Antrag dokumentieren"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-[#2a2a2a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Programm */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Förderprogramm *</label>
            {loadingProgramme ? (
              <div className="h-10 bg-[#0a0a0a] rounded-lg flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
              </div>
            ) : (
              <select
                required
                value={formData.programm_id}
                onChange={(e) => setFormData({ ...formData, programm_id: Number(e.target.value) })}
                className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value={0}>Programm auswählen...</option>
                {programme.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.bundesland ? `(${p.bundesland})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Bundesland */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Bundesland</label>
            <select
              value={formData.bundesland}
              onChange={(e) => setFormData({ ...formData, bundesland: e.target.value })}
              className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Bundesland auswählen...</option>
              {BUNDESLAENDER.map((bl) => (
                <option key={bl} value={bl}>
                  {bl}
                </option>
              ))}
            </select>
          </div>

          {/* Datums-Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Antrag gestellt am</label>
              <input
                type="date"
                value={formData.antrag_datum}
                onChange={(e) => setFormData({ ...formData, antrag_datum: e.target.value })}
                className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Bewilligung am</label>
              <input
                type="date"
                value={formData.bewilligung_datum}
                onChange={(e) => setFormData({ ...formData, bewilligung_datum: e.target.value })}
                className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Bewilligungsdauer */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Bewilligungsdauer (Wochen)
              <span className="text-zinc-600 ml-1 text-xs">— automatisch berechnet</span>
            </label>
            <input
              type="number"
              min={0}
              value={formData.bewilligungsdauer_wochen}
              onChange={(e) =>
                setFormData({ ...formData, bewilligungsdauer_wochen: e.target.value })
              }
              className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Beträge */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Beantragter Betrag (€)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={formData.beantragter_betrag_eur}
                onChange={(e) =>
                  setFormData({ ...formData, beantragter_betrag_eur: e.target.value })
                }
                className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Bewilligter Betrag (€)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={formData.bewilligter_betrag_eur}
                onChange={(e) =>
                  setFormData({ ...formData, bewilligter_betrag_eur: e.target.value })
                }
                className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Erfolgreich Toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.erfolgreich}
                onChange={(e) => setFormData({ ...formData, erfolgreich: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#2a2a2a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
            <span className="text-sm text-zinc-300">Erfolgreich bewilligt</span>
          </div>

          {/* Hinweis */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Besonderheiten / Praxis-Hinweis</label>
            <textarea
              rows={3}
              value={formData.hinweis}
              onChange={(e) => setFormData({ ...formData, hinweis: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-emerald-500 focus:outline-none resize-none"
              placeholder="Was hat gut funktioniert? Worauf sollte man achten?"
            />
          </div>

          {/* Fallstricke */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Fallstricke</label>
            <textarea
              rows={3}
              value={formData.fallstricke}
              onChange={(e) => setFormData({ ...formData, fallstricke: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-emerald-500 focus:outline-none resize-none"
              placeholder="Welche Probleme gab es? Was sollte man vermeiden?"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || formData.programm_id === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editData ? "Aktualisieren" : "Speichern"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

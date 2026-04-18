"use client"
// @ts-nocheck
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Search,
  CheckCircle2,
} from "lucide-react"

interface Flaeche {
  id: string
  registerNr: string
  bundesland: string
  baumart: string
  profil?: { id: string } | null
}

interface Sammler {
  id: string
  sammlerName: string
  datum: string
  mengeKg: string
  stunden: string
}

export default function NeueErnteSeite() {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]
  const currentYear = new Date().getFullYear()

  const [flaechen, setFlaechen] = useState<Flaeche[]>([])
  const [flaecheSearch, setFlaecheSearch] = useState("")
  const [flaecheDropdownOpen, setFlaecheDropdownOpen] = useState(false)
  const [selectedFlaeche, setSelectedFlaeche] = useState<Flaeche | null>(null)
  const [profilId, setProfilId] = useState("")

  const [saison, setSaison] = useState(String(currentYear))
  const [datum, setDatum] = useState(today)
  const [baumart, setBaumart] = useState("")
  const [mengeKgGesamt, setMengeKgGesamt] = useState("")
  const [notizen, setNotizen] = useState("")
  const [sammler, setSammler] = useState<Sammler[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Flächen laden für Dropdown
  const loadFlaechen = useCallback(async (search: string) => {
    try {
      const params = new URLSearchParams({ limit: "20" })
      if (search) params.set("search", search)
      const res = await fetch(`/api/saatguternte/register?${params}`)
      if (res.ok) {
        const data = await res.json()
        setFlaechen(data.data ?? [])
      }
    } catch (err) { console.error("Flächen-Laden Fehler:", err) }
  }, [])

  useEffect(() => {
    loadFlaechen(flaecheSearch)
  }, [flaecheSearch, loadFlaechen])

  const selectFlaeche = async (f: Flaeche) => {
    setSelectedFlaeche(f)
    setBaumart(f.baumart)
    setFlaecheDropdownOpen(false)
    setFlaecheSearch("")
    // Profil-ID ermitteln oder FlaechenProfil anlegen
    try {
      const res = await fetch(`/api/saatguternte/register/${f.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.profil?.id) {
          setProfilId(data.profil.id)
        } else {
          // Profil anlegen via PATCH
          const patchRes = await fetch(`/api/saatguternte/register/${f.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ungeprüft" }),
          })
          if (patchRes.ok) {
            const profil = await patchRes.json()
            setProfilId(profil.id)
          }
        }
      }
    } catch (err) { console.error("Profil-Laden/Erstellen Fehler:", err) }
  }

  const addSammler = () => {
    setSammler((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        sammlerName: "",
        datum: datum,
        mengeKg: "",
        stunden: "",
      },
    ])
  }

  const updateSammler = (id: string, field: string, value: string) => {
    setSammler((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const removeSammler = (id: string) => {
    setSammler((prev) => prev.filter((s) => s.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!profilId) {
      setError("Bitte eine Fläche auswählen.")
      return
    }
    if (!saison || !datum || !baumart) {
      setError("Pflichtfelder: Fläche, Saison, Datum, Baumart")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/saatguternte/ernten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profilId,
          saison: parseInt(saison),
          datum,
          baumart,
          mengeKgGesamt: mengeKgGesamt ? parseFloat(mengeKgGesamt) : null,
          notizen: notizen || null,
          positionen: sammler
            .filter((s) => s.sammlerName && s.datum && s.mengeKg)
            .map((s) => ({
              sammlerName: s.sammlerName,
              datum: s.datum,
              mengeKg: parseFloat(s.mengeKg),
              stunden: s.stunden ? parseFloat(s.stunden) : null,
            })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Fehler beim Speichern")
        setSaving(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push("/saatguternte/ernte"), 1500)
    } catch {
      setError("Netzwerkfehler")
      setSaving(false)
    }
  }

  const filteredFlaechen = flaechen.filter(
    (f) =>
      flaecheSearch === "" ||
      f.registerNr.toLowerCase().includes(flaecheSearch.toLowerCase()) ||
      f.baumart.toLowerCase().includes(flaecheSearch.toLowerCase()) ||
      f.bundesland.toLowerCase().includes(flaecheSearch.toLowerCase())
  )

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/saatguternte/ernte"
          className="p-2 rounded-lg hover:bg-[#1e1e1e] text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>Neue Ernte erfassen</h1>
          <p className="text-zinc-500 text-sm">Erntedaten eingeben und Sammler zuordnen</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-900/30 border border-emerald-700 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-300">Ernte erfolgreich gespeichert! Weiterleitung...</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fläche auswählen */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Fläche</h2>

          <div className="relative">
            <label className="block text-sm text-zinc-400 mb-1">Fläche auswählen *</label>
            {selectedFlaeche ? (
              <div className="flex items-center gap-3 p-3 bg-[#1e1e1e] border border-emerald-700 rounded-lg">
                <div className="flex-1">
                  <span className="text-white font-mono">{selectedFlaeche.registerNr}</span>
                  <span className="text-zinc-400 ml-2">·</span>
                  <span className="text-emerald-400 ml-2">{selectedFlaeche.baumart}</span>
                  <span className="text-zinc-500 ml-2">{selectedFlaeche.bundesland}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFlaeche(null)
                    setProfilId("")
                    setBaumart("")
                  }}
                  className="text-zinc-500 hover:text-red-400 transition-colors text-sm"
                >
                  Ändern
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={flaecheSearch}
                    onChange={(e) => {
                      setFlaecheSearch(e.target.value)
                      setFlaecheDropdownOpen(true)
                    }}
                    onFocus={() => setFlaecheDropdownOpen(true)}
                    placeholder="Register-Nr, Baumart oder Bundesland suchen..."
                    className="w-full pl-9 pr-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                {flaecheDropdownOpen && filteredFlaechen.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredFlaechen.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => selectFlaeche(f)}
                        className="w-full px-4 py-3 text-left hover:bg-[#2a2a2a] transition-colors border-b border-[#222] last:border-0"
                      >
                        <span className="text-white font-mono text-sm">{f.registerNr}</span>
                        <span className="text-emerald-400 ml-3 text-sm">{f.baumart}</span>
                        <span className="text-zinc-500 ml-2 text-xs">{f.bundesland}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ernte-Details */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Ernte-Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Saison (Jahr) *</label>
              <input
                type="number"
                value={saison}
                onChange={(e) => setSaison(e.target.value)}
                min="2000"
                max="2100"
                required
                className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Datum *</label>
              <input
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Baumart *</label>
              <input
                type="text"
                value={baumart}
                onChange={(e) => setBaumart(e.target.value)}
                placeholder="z.B. Fichte, Buche..."
                required
                className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Gesamtmenge (kg)</label>
              <input
                type="number"
                value={mengeKgGesamt}
                onChange={(e) => setMengeKgGesamt(e.target.value)}
                placeholder="0.0"
                step="0.1"
                min="0"
                className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-zinc-400 mb-1">Notizen</label>
              <textarea
                value={notizen}
                onChange={(e) => setNotizen(e.target.value)}
                rows={3}
                placeholder="Bemerkungen zur Ernte..."
                className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-600 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Sammler / Positionen */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Sammler / Positionen</h2>
            <button
              type="button"
              onClick={addSammler}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Sammler hinzufügen
            </button>
          </div>

          {sammler.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-6">
              Noch keine Sammler hinzugefügt. Klicke auf „Sammler hinzufügen".
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs text-zinc-500 px-1 mb-1">
                <div className="col-span-3">Name</div>
                <div className="col-span-3">Datum</div>
                <div className="col-span-2">Menge kg</div>
                <div className="col-span-2">Stunden</div>
                <div className="col-span-2"></div>
              </div>
              {sammler.map((s) => (
                <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={s.sammlerName}
                    onChange={(e) => updateSammler(s.id, "sammlerName", e.target.value)}
                    placeholder="Name"
                    className="col-span-3 px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-600"
                  />
                  <input
                    type="date"
                    value={s.datum}
                    onChange={(e) => updateSammler(s.id, "datum", e.target.value)}
                    className="col-span-3 px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-600"
                  />
                  <input
                    type="number"
                    value={s.mengeKg}
                    onChange={(e) => updateSammler(s.id, "mengeKg", e.target.value)}
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                    className="col-span-2 px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-600"
                  />
                  <input
                    type="number"
                    value={s.stunden}
                    onChange={(e) => updateSammler(s.id, "stunden", e.target.value)}
                    placeholder="0.0"
                    step="0.5"
                    min="0"
                    className="col-span-2 px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeSammler(s.id)}
                    className="col-span-2 flex justify-center p-2 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aktionen */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/saatguternte/ernte"
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={saving || success}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Speichern...
              </>
            ) : (
              "Ernte speichern"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

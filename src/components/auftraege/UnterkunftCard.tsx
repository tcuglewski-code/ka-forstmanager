"use client"

import { useEffect, useState } from "react"
import { Home, ExternalLink, Edit2, Save, X, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"

interface Unterkunft {
  id?: string
  name: string
  adresse?: string | null
  maxPersonen?: number | null
  preisNacht?: number | null
  kontakt?: string | null
  externeUrl?: string | null
  notizen?: string | null
}

interface Props {
  auftragId: string
  // Für Suchlink-Generator
  ort?: string | null
  startDatum?: string | null
  endDatum?: string | null
  anzahlPersonen?: number | null
}

const EMPTY: Unterkunft = {
  name: "",
  adresse: "",
  maxPersonen: null,
  preisNacht: null,
  kontakt: "",
  externeUrl: "",
  notizen: "",
}

export function UnterkunftCard({
  auftragId,
  ort,
  startDatum,
  endDatum,
  anzahlPersonen,
}: Props) {
  const [unterkunft, setUnterkunft] = useState<Unterkunft | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Unterkunft>(EMPTY)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/auftraege/${auftragId}/unterkunft`)
      if (res.ok) {
        const data = await res.json()
        setUnterkunft(data)
        if (data) setForm(data)
      }
    } catch (e) {
      console.error("Unterkunft laden fehlgeschlagen", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auftragId])

  const save = async () => {
    if (!form.name?.trim()) {
      toast.error("Name ist erforderlich")
      return
    }
    try {
      const res = await fetch(`/api/auftraege/${auftragId}/unterkunft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("save failed")
      const data = await res.json()
      setUnterkunft(data)
      setEditing(false)
      toast.success("Unterkunft gespeichert")
    } catch (e) {
      console.error(e)
      toast.error("Speichern fehlgeschlagen")
    }
  }

  const del = async () => {
    if (!confirm("Unterkunft wirklich löschen?")) return
    try {
      const res = await fetch(`/api/auftraege/${auftragId}/unterkunft`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("delete failed")
      setUnterkunft(null)
      setForm(EMPTY)
      toast.success("Unterkunft gelöscht")
    } catch (e) {
      console.error(e)
      toast.error("Löschen fehlgeschlagen")
    }
  }

  const bookingSearchUrl = () => {
    const params = new URLSearchParams()
    if (ort) params.set("ss", ort)
    if (startDatum) params.set("checkin", String(startDatum).slice(0, 10))
    if (endDatum) params.set("checkout", String(endDatum).slice(0, 10))
    params.set("group_adults", String(anzahlPersonen || 4))
    return `https://www.booking.com/searchresults.html?${params.toString()}`
  }

  if (loading) {
    return (
      <div className="text-on-surface-variant text-sm">Lade Unterkunft...</div>
    )
  }

  // Edit-Mode
  if (editing) {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-on-surface-variant mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-surface-container-low border border-border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-emerald-500"
            placeholder="z.B. Ferienwohnung Am Wald"
          />
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1">Adresse</label>
          <input
            type="text"
            value={form.adresse ?? ""}
            onChange={(e) => setForm({ ...form, adresse: e.target.value })}
            className="w-full bg-surface-container-low border border-border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Max. Personen</label>
            <input
              type="number"
              min="0"
              value={form.maxPersonen ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxPersonen: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full bg-surface-container-low border border-border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Preis/Nacht (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.preisNacht ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  preisNacht: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full bg-surface-container-low border border-border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1">Kontakt</label>
          <input
            type="text"
            value={form.kontakt ?? ""}
            onChange={(e) => setForm({ ...form, kontakt: e.target.value })}
            className="w-full bg-surface-container-low border border-border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-emerald-500"
            placeholder="Telefon, E-Mail, Ansprechpartner"
          />
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1">Externer Link</label>
          <input
            type="url"
            value={form.externeUrl ?? ""}
            onChange={(e) => setForm({ ...form, externeUrl: e.target.value })}
            className="w-full bg-surface-container-low border border-border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-emerald-500"
            placeholder="https://www.airbnb.de/rooms/..."
          />
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1">Notizen</label>
          <textarea
            value={form.notizen ?? ""}
            onChange={(e) => setForm({ ...form, notizen: e.target.value })}
            rows={3}
            className="w-full bg-surface-container-low border border-border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Speichern
          </button>
          <button
            onClick={() => {
              setEditing(false)
              setForm(unterkunft ?? EMPTY)
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg text-sm transition-colors"
          >
            <X className="w-4 h-4" />
            Abbrechen
          </button>
        </div>
      </div>
    )
  }

  // Display-Mode (mit Daten)
  if (unterkunft) {
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <Home className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-on-surface font-medium text-sm">{unterkunft.name}</h3>
              {unterkunft.adresse && (
                <p className="text-on-surface-variant text-xs mt-0.5">{unterkunft.adresse}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setForm(unterkunft)
                setEditing(true)
              }}
              className="p-1.5 text-on-surface-variant hover:text-emerald-400 transition-colors"
              title="Bearbeiten"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={del}
              className="p-1.5 text-on-surface-variant hover:text-red-400 transition-colors"
              title="Löschen"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {unterkunft.maxPersonen != null && (
            <div>
              <span className="text-on-surface-variant block">Kapazität</span>
              <span className="text-on-surface">{unterkunft.maxPersonen} Personen</span>
            </div>
          )}
          {unterkunft.preisNacht != null && (
            <div>
              <span className="text-on-surface-variant block">Preis/Nacht</span>
              <span className="text-on-surface">
                {unterkunft.preisNacht.toFixed(2)} €
              </span>
            </div>
          )}
        </div>

        {unterkunft.kontakt && (
          <div className="text-xs">
            <span className="text-on-surface-variant block mb-0.5">Kontakt</span>
            <span className="text-on-surface">{unterkunft.kontakt}</span>
          </div>
        )}

        {unterkunft.notizen && (
          <div className="text-xs">
            <span className="text-on-surface-variant block mb-0.5">Notizen</span>
            <p className="text-on-surface whitespace-pre-wrap">{unterkunft.notizen}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {unterkunft.externeUrl && (
            <a
              href={unterkunft.externeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg text-xs transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Eintrag öffnen
            </a>
          )}
          <a
            href={bookingSearchUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-xs transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Booking.com Suche
          </a>
        </div>
      </div>
    )
  }

  // Display-Mode (leer)
  return (
    <div className="space-y-3">
      <p className="text-on-surface-variant text-xs">
        Noch keine Unterkunft zugewiesen.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setForm(EMPTY)
            setEditing(true)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Unterkunft hinzufügen
        </button>
        <a
          href={bookingSearchUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg text-xs transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Booking.com suchen
        </a>
      </div>
    </div>
  )
}

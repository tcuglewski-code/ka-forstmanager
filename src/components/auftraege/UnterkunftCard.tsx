"use client"

import { useEffect, useState, useMemo } from "react"
import { Home, ExternalLink, Edit2, Save, X, Trash2, Plus, Search } from "lucide-react"
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
  wlan?: boolean
  waschmaschine?: boolean
  parkplatz?: boolean
  kueche?: boolean
  haustierErlaubt?: boolean
  fruehstueck?: boolean
  trailerParkplatz?: boolean
  frueherCheckIn?: boolean
}

interface Props {
  auftragId: string
  // Auto-fill Kontext
  ort?: string | null
  startDatum?: string | null
  endDatum?: string | null
  anzahlPersonen?: number | null
  // erweitert
  bundesland?: string | null
  waldbesitzerOrt?: string | null
  anzahlMitarbeiter?: number | null
  gruppe?: { name: string; mitgliederAnzahl?: number | null } | null
  wizardDaten?: Record<string, unknown> | null
  // GPS-Koordinaten für präzise Suche
  lat?: number | null
  lng?: number | null
}

interface SearchState {
  ort: string
  radius: string // z.B. "30km"
  personen: number
  vonDatum: string // YYYY-MM-DD
  bisDatum: string
  wlan: boolean
  waschmaschine: boolean
  parkplatz: boolean
  haustierErlaubt: boolean
  trailerParkplatz: boolean
  frueherCheckIn: boolean
}

const RADIUS_OPTIONS = ["10km", "20km", "30km", "50km", "100km"]

const EMPTY: Unterkunft = {
  name: "",
  adresse: "",
  maxPersonen: null,
  preisNacht: null,
  kontakt: "",
  externeUrl: "",
  notizen: "",
  wlan: false,
  waschmaschine: false,
  parkplatz: false,
  kueche: false,
  haustierErlaubt: false,
  fruehstueck: false,
  trailerParkplatz: false,
  frueherCheckIn: false,
}

function toDateInput(value?: string | null): string {
  if (!value) return ""
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return ""
    return d.toISOString().slice(0, 10)
  } catch {
    return ""
  }
}

export function UnterkunftCard({
  auftragId,
  ort,
  startDatum,
  endDatum,
  anzahlPersonen,
  bundesland,
  waldbesitzerOrt,
  anzahlMitarbeiter,
  gruppe,
  wizardDaten,
  lat,
  lng,
}: Props) {
  const [unterkunft, setUnterkunft] = useState<Unterkunft | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Unterkunft>(EMPTY)

  // Defaults für Suche
  // Auto-fill aus wizardDaten: 'PLZ Ort' bevorzugt, dann Forstamt, dann Fallbacks
  const wd = (wizardDaten as Record<string, string> | null) ?? {}
  const flaeche_plz = wd.flaeche_plz ?? ""
  const flaeche_ort = wd.flaeche_ort ?? ""
  const forstamt = wd.flaeche_forstamt ?? wd.forstamt ?? ""
  const ortAuto =
    [flaeche_plz, flaeche_ort].filter(Boolean).join(" ") ||
    forstamt ||
    waldbesitzerOrt ||
    ort ||
    bundesland ||
    ""

  const defaultOrt = ortAuto
  const defaultPersonen = gruppe?.mitgliederAnzahl || anzahlMitarbeiter || anzahlPersonen || 4
  const defaultVon = toDateInput(startDatum)
  const defaultBis = toDateInput(endDatum)

  const [search, setSearch] = useState<SearchState>({
    ort: defaultOrt,
    radius: "30km",
    personen: defaultPersonen,
    vonDatum: defaultVon,
    bisDatum: defaultBis,
    wlan: false,
    waschmaschine: false,
    parkplatz: false,
    haustierErlaubt: false,
    trailerParkplatz: false,
    frueherCheckIn: false,
  })

  // Sync defaults wenn sich Props ändern (z. B. wenn Auftrag geladen wird)
  useEffect(() => {
    setSearch((s) => ({
      ...s,
      ort: s.ort || defaultOrt,
      personen: s.personen || defaultPersonen,
      vonDatum: s.vonDatum || defaultVon,
      bisDatum: s.bisDatum || defaultBis,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOrt, defaultPersonen, defaultVon, defaultBis])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/auftraege/${auftragId}/unterkunft`)
      if (res.ok) {
        const data = await res.json()
        setUnterkunft(data)
        if (data) {
          setForm(data)
          // Übernehme Ausstattung in Such-State, damit beide Buttons konsistent funktionieren
          setSearch((s) => ({
            ...s,
            wlan: !!data.wlan,
            waschmaschine: !!data.waschmaschine,
            parkplatz: !!data.parkplatz,
            haustierErlaubt: !!data.haustierErlaubt,
            trailerParkplatz: !!data.trailerParkplatz,
            frueherCheckIn: !!data.frueherCheckIn,
          }))
        }
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

  // ──────────────────────────────────────────────────────────────────────
  // Such-Links
  // ──────────────────────────────────────────────────────────────────────
  const bookingUrl = useMemo(() => {
    const filters: string[] = []
    if (search.wlan) filters.push("facility%3D107")
    if (search.waschmaschine) filters.push("facility%3D116")
    if (search.parkplatz) filters.push("facility%3D2")
    if (search.haustierErlaubt) filters.push("pets_score_breakdown%3D1")
    // Trailer-Stellplatz und früher Check-in haben keinen Booking.com facility code
    const nflt = filters.join("%3B")

    const radiusKm = parseInt(search.radius, 10) || 30

    // Präferenz: 1) GPS-Koordinaten 2) PLZ aus wizardDaten 3) Ort-Name
    const params = new URLSearchParams()
    if (lat != null && lng != null) {
      params.set("latitude", String(lat))
      params.set("longitude", String(lng))
    } else if (flaeche_plz) {
      const ssVal = [flaeche_plz, flaeche_ort].filter(Boolean).join(" ")
      params.set("ss", ssVal || flaeche_plz)
    } else if (search.ort) {
      params.set("ss", search.ort)
    }
    if (search.vonDatum) params.set("checkin", search.vonDatum)
    if (search.bisDatum) params.set("checkout", search.bisDatum)
    params.set("group_adults", String(search.personen || 1))
    params.set("radius", String(radiusKm))

    const base = `https://www.booking.com/searchresults.html?${params.toString()}`
    return nflt ? `${base}&nflt=${nflt}` : base
  }, [search, lat, lng, flaeche_plz, flaeche_ort])

  const airbnbUrl = useMemo(() => {
    const amenities: string[] = []
    if (search.wlan) amenities.push("&amenities[]=4")
    if (search.waschmaschine) amenities.push("&amenities[]=33")
    if (search.parkplatz) amenities.push("&amenities[]=7")
    if (search.haustierErlaubt) amenities.push("&amenities[]=12")

    const params = new URLSearchParams()
    if (search.vonDatum) params.set("checkin", search.vonDatum)
    if (search.bisDatum) params.set("checkout", search.bisDatum)
    params.set("adults", String(search.personen || 1))

    // Koordinaten-basierte Bounding-Box wenn lat/lng vorhanden
    if (lat != null && lng != null) {
      params.set("sw_lat", (lat - 0.3).toFixed(6))
      params.set("sw_lng", (lng - 0.3).toFixed(6))
      params.set("ne_lat", (lat + 0.3).toFixed(6))
      params.set("ne_lng", (lng + 0.3).toFixed(6))
      params.set("search_by_map", "true")
      return `https://www.airbnb.de/s/homes?${params.toString()}${amenities.join("")}`
    }

    const slug = encodeURIComponent(search.ort || "Deutschland")
    return `https://www.airbnb.de/s/${slug}/homes?${params.toString()}${amenities.join("")}`
  }, [search, lat, lng])

  // ──────────────────────────────────────────────────────────────────────
  // Render Helper
  // ──────────────────────────────────────────────────────────────────────
  const renderSearchPanel = () => (
    <div className="space-y-3 bg-[var(--color-surface-container-low)] border border-border rounded-lg p-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Ort</label>
          <input
            type="text"
            value={search.ort}
            onChange={(e) => setSearch({ ...search, ort: e.target.value })}
            placeholder="z.B. Eberswalde"
            className="w-full bg-[var(--color-surface-container)] border border-border rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Suchradius</label>
          <select
            value={search.radius}
            onChange={(e) => setSearch({ ...search, radius: e.target.value })}
            className="w-full bg-[var(--color-surface-container)] border border-border rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-emerald-500"
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Personen</label>
          <input
            type="number"
            min="1"
            value={search.personen}
            onChange={(e) => setSearch({ ...search, personen: Math.max(1, Number(e.target.value) || 1) })}
            className="w-full bg-[var(--color-surface-container)] border border-border rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Von</label>
          <input
            type="date"
            value={search.vonDatum}
            onChange={(e) => setSearch({ ...search, vonDatum: e.target.value })}
            className="w-full bg-[var(--color-surface-container)] border border-border rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Bis</label>
          <input
            type="date"
            value={search.bisDatum}
            onChange={(e) => setSearch({ ...search, bisDatum: e.target.value })}
            className="w-full bg-[var(--color-surface-container)] border border-border rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider mb-1.5">Ausstattung (Filter)</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
          {[
            { key: "wlan", label: "WLAN / Internet" },
            { key: "waschmaschine", label: "Waschmaschine" },
            { key: "parkplatz", label: "Parkplatz (PKW)" },
            { key: "trailerParkplatz", label: "Großer Stellplatz / Trailer" },
            { key: "haustierErlaubt", label: "Haustiere erlaubt" },
            { key: "frueherCheckIn", label: "Früher Check-in möglich" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer text-on-surface">
              <input
                type="checkbox"
                checked={(search as unknown as Record<string, boolean>)[key]}
                onChange={(e) => setSearch({ ...search, [key]: e.target.checked } as SearchState)}
                className="accent-emerald-500"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
        >
          <Search className="w-3.5 h-3.5" />
          Booking.com suchen
        </a>
        <a
          href={airbnbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
        >
          <Search className="w-3.5 h-3.5" />
          Airbnb suchen
        </a>
      </div>
    </div>
  )

  if (loading) {
    return <div className="text-on-surface-variant text-sm">Lade Unterkunft...</div>
  }

  // ──────────────────────────────────────────────────────────────────────
  // Edit-Mode
  // ──────────────────────────────────────────────────────────────────────
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
                setForm({ ...form, maxPersonen: e.target.value ? Number(e.target.value) : null })
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
                setForm({ ...form, preisNacht: e.target.value ? Number(e.target.value) : null })
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

        {/* Ausstattung Checkboxes */}
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">Ausstattung</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {[
              { key: "wlan", label: "WLAN / Internet" },
              { key: "waschmaschine", label: "Waschmaschine" },
              { key: "parkplatz", label: "Parkplatz (PKW)" },
              { key: "trailerParkplatz", label: "Großer Stellplatz / Trailer" },
              { key: "haustierErlaubt", label: "Haustiere erlaubt" },
              { key: "frueherCheckIn", label: "Früher Check-in möglich" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1.5 cursor-pointer text-on-surface">
                <input
                  type="checkbox"
                  checked={!!(form as unknown as Record<string, boolean>)[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: e.target.checked } as Unterkunft)
                  }
                  className="accent-emerald-500"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
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

  // ──────────────────────────────────────────────────────────────────────
  // Display-Mode (mit Daten)
  // ──────────────────────────────────────────────────────────────────────
  if (unterkunft) {
    const ausstattung: { label: string; on: boolean }[] = [
      { label: "WLAN", on: !!unterkunft.wlan },
      { label: "Waschmaschine", on: !!unterkunft.waschmaschine },
      { label: "Parkplatz", on: !!unterkunft.parkplatz },
      { label: "Trailer-Stellplatz", on: !!unterkunft.trailerParkplatz },
      { label: "Haustiere", on: !!unterkunft.haustierErlaubt },
      { label: "Früher Check-in", on: !!unterkunft.frueherCheckIn },
    ]
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
              <span className="text-on-surface">{unterkunft.preisNacht.toFixed(2)} €</span>
            </div>
          )}
        </div>

        {unterkunft.kontakt && (
          <div className="text-xs">
            <span className="text-on-surface-variant block mb-0.5">Kontakt</span>
            <span className="text-on-surface">{unterkunft.kontakt}</span>
          </div>
        )}

        {ausstattung.some((a) => a.on) && (
          <div className="text-xs">
            <span className="text-on-surface-variant block mb-1">Ausstattung</span>
            <div className="flex flex-wrap gap-1">
              {ausstattung.filter((a) => a.on).map((a) => (
                <span
                  key={a.label}
                  className="px-2 py-0.5 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-[11px]"
                >
                  {a.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {unterkunft.notizen && (
          <div className="text-xs">
            <span className="text-on-surface-variant block mb-0.5">Notizen</span>
            <p className="text-on-surface whitespace-pre-wrap">{unterkunft.notizen}</p>
          </div>
        )}

        {unterkunft.externeUrl && (
          <a
            href={unterkunft.externeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg text-xs transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Eintrag öffnen
          </a>
        )}

        <div className="pt-2 border-t border-border">
          <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
            Weitere Optionen suchen
          </div>
          {renderSearchPanel()}
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────
  // Display-Mode (leer) — Suchbereich + Add Button
  // ──────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <p className="text-on-surface-variant text-xs">Noch keine Unterkunft zugewiesen.</p>

      {renderSearchPanel()}

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
    </div>
  )
}

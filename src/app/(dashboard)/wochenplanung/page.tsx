// @ts-nocheck
"use client"

// Sprint AO: Wochenplan-System — Hauptseite
// KW-Picker + Gruppen-Auswahl + Dienstleistungstyp

import { useState, useEffect } from "react"
import { Plus, FileDown, ChevronLeft, ChevronRight, Trash2, Edit2 } from "lucide-react"

// ── Typen ─────────────────────────────────────────────────────────────────────

interface WochenplanPosition {
  id: string
  dienstleistungstyp: string
  datum?: string
  flaeche?: string
  baumart?: string
  stueckzahl?: number
  herkunftscode?: string
  zielkg?: number
  gesammelteKg?: number
  gpsPosition?: string
  treffpunkt?: string
  status: string
  notizen?: string
}

interface Wochenplan {
  id: string
  kalenderwoche: number
  jahr: number
  gruppe?: { id: string; name: string }
  status: string
  notizen?: string
  positionen: WochenplanPosition[]
}

interface Gruppe {
  id: string
  name: string
}

// ── Konstanten ────────────────────────────────────────────────────────────────

const DIENSTLEISTUNG_TYPEN = [
  { key: "pflanzung", label: "🌱 Pflanzung", farbe: "bg-green-900/50 text-green-300 border-green-700" },
  { key: "flaechenvorbereitung", label: "🔧 Flächenvorbereitung", farbe: "bg-amber-900/50 text-amber-300 border-amber-700" },
  { key: "kulturpflege", label: "✂️ Kulturpflege", farbe: "bg-blue-900/50 text-blue-300 border-blue-700" },
  { key: "kulturschutz", label: "🛡️ Kulturschutz", farbe: "bg-purple-900/50 text-purple-300 border-purple-700" },
  { key: "saatguternte", label: "🌾 Saatguternte", farbe: "bg-yellow-900/50 text-yellow-300 border-yellow-700" },
  { key: "sonstiges", label: "📋 Sonstiges", farbe: "bg-zinc-700/50 text-zinc-300 border-zinc-600" },
]

const BAUMARTEN = [
  "Stieleiche", "Traubeneiche", "Rotbuche", "Fichte", "Kiefer", "Lärche",
  "Kastanie", "Roteiche", "Walnuss", "Baumhasel", "Esche", "Bergahorn",
  "Spitzahorn", "Douglasie", "Weißtanne", "Gemeine Kiefer", "Sonstige",
]

// Aktuelle Kalenderwoche ermitteln
function aktuelleKW(): { kw: number; jahr: number } {
  const jetzt = new Date()
  const startDesJahres = new Date(jetzt.getFullYear(), 0, 1)
  const tageImJahr = Math.floor((jetzt.getTime() - startDesJahres.getTime()) / 86400000)
  const kw = Math.ceil((tageImJahr + startDesJahres.getDay() + 1) / 7)
  return { kw, jahr: jetzt.getFullYear() }
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────

export default function WochenplanungPage() {
  const { kw: initKW, jahr: initJahr } = aktuelleKW()
  const [kw, setKW] = useState(initKW)
  const [jahr, setJahr] = useState(initJahr)
  const [aktGruppeId, setAktGruppeId] = useState<string | null>(null)
  const [gruppen, setGruppen] = useState<Gruppe[]>([])
  const [wochenplan, setWochenplan] = useState<Wochenplan | null>(null)
  const [laden, setLaden] = useState(false)
  const [positionFormTyp, setPositionFormTyp] = useState<string | null>(null)

  // Gruppen laden
  useEffect(() => {
    fetch("/api/gruppen")
      .then((r) => r.json())
      .then((d) => setGruppen(Array.isArray(d) ? d : []))
      .catch(console.error)
  }, [])

  // Wochenplan laden
  async function wochenplanLaden() {
    setLaden(true)
    try {
      const params = new URLSearchParams({ kw: String(kw), jahr: String(jahr) })
      if (aktGruppeId) params.set("gruppeId", aktGruppeId)
      const res = await fetch(`/api/wochenplanung?${params}`)
      const daten = await res.json()
      setWochenplan(Array.isArray(daten) && daten.length > 0 ? daten[0] : null)
    } catch (err) {
      console.error(err)
    } finally {
      setLaden(false)
    }
  }

  useEffect(() => { wochenplanLaden() }, [kw, jahr, aktGruppeId])

  // Neuen Wochenplan erstellen
  async function wochenplanErstellen() {
    try {
      const res = await fetch("/api/wochenplanung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kalenderwoche: kw, jahr, gruppeId: aktGruppeId }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? "Fehler beim Erstellen")
        return
      }
      const neu = await res.json()
      setWochenplan(neu)
    } catch (err) {
      console.error(err)
    }
  }

  // Position hinzufügen
  async function positionHinzufuegen(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!wochenplan || !positionFormTyp) return

    const form = e.currentTarget
    const formData = new FormData(form)
    const daten: Record<string, string | number> = { dienstleistungstyp: positionFormTyp }
    formData.forEach((wert, schluessel) => {
      if (wert) daten[schluessel] = wert as string
    })

    try {
      const res = await fetch(`/api/wochenplanung/${wochenplan.id}/positionen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(daten),
      })
      if (!res.ok) throw new Error("Fehler beim Hinzufügen")
      const neuePos = await res.json()
      setWochenplan((prev) => prev ? { ...prev, positionen: [...prev.positionen, neuePos] } : prev)
      form.reset()
      setPositionFormTyp(null)
    } catch (err) {
      alert("Fehler: " + (err as Error).message)
    }
  }

  // Position löschen
  async function positionLoeschen(positionId: string) {
    if (!wochenplan || !confirm("Position löschen?")) return
    try {
      const res = await fetch(
        `/api/wochenplanung/${wochenplan.id}/positionen?positionId=${positionId}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Fehler beim Löschen")
      setWochenplan((prev) =>
        prev ? { ...prev, positionen: prev.positionen.filter((p) => p.id !== positionId) } : prev
      )
    } catch (err) {
      alert("Fehler: " + (err as Error).message)
    }
  }

  // KW navigieren
  function kWNavigieren(richtung: 1 | -1) {
    let neueKW = kw + richtung
    let neuesJahr = jahr
    if (neueKW < 1) { neueKW = 52; neuesJahr-- }
    if (neueKW > 53) { neueKW = 1; neuesJahr++ }
    setKW(neueKW)
    setJahr(neuesJahr)
  }

  const typFarbe = (typ: string) =>
    DIENSTLEISTUNG_TYPEN.find((t) => t.key === typ)?.farbe ?? "bg-zinc-700 text-zinc-300 border-zinc-600"

  const typLabel = (typ: string) =>
    DIENSTLEISTUNG_TYPEN.find((t) => t.key === typ)?.label ?? typ

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Seiten-Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">📅 Wochenplanung</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Planung aller Dienstleistungen nach Kalenderwoche
        </p>
      </div>

      {/* Steuerleiste */}
      <div className="flex flex-wrap items-center gap-4">
        {/* KW-Navigation */}
        <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2">
          <button
            onClick={() => kWNavigieren(-1)}
            className="p-1 hover:text-white text-zinc-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center min-w-[100px]">
            <div className="text-white font-bold text-lg">KW {kw}</div>
            <div className="text-zinc-400 text-xs">{jahr}</div>
          </div>
          <button
            onClick={() => kWNavigieren(1)}
            className="p-1 hover:text-white text-zinc-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Gruppen-Auswahl */}
        <select
          value={aktGruppeId ?? ""}
          onChange={(e) => setAktGruppeId(e.target.value || null)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm min-w-[160px]"
        >
          <option value="">Alle Gruppen</option>
          {gruppen.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        {/* Heute-Button */}
        <button
          onClick={() => { const { kw: k, jahr: j } = aktuelleKW(); setKW(k); setJahr(j) }}
          className="px-3 py-2 border border-zinc-600 text-zinc-300 rounded-lg hover:border-zinc-400 hover:text-white text-sm"
        >
          Heute
        </button>

        {/* PDF-Export */}
        {wochenplan && (
          <a
            href={`/api/wochenplanung/${wochenplan.id}/export-pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 text-sm"
          >
            <FileDown className="w-4 h-4" />
            PDF exportieren
          </a>
        )}
      </div>

      {/* Hauptinhalt */}
      {laden ? (
        <div className="text-zinc-400 text-center py-16">Lade Wochenplan...</div>
      ) : !wochenplan ? (
        /* Kein Plan vorhanden */
        <div className="bg-zinc-800/50 border border-dashed border-zinc-600 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Kein Wochenplan für KW {kw}/{jahr}
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            {aktGruppeId
              ? `Für die ausgewählte Gruppe wurde noch kein Plan erstellt.`
              : "Für diese Kalenderwoche existiert noch kein Plan."}
          </p>
          <button
            onClick={wochenplanErstellen}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-600 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Wochenplan erstellen
          </button>
        </div>
      ) : (
        /* Plan vorhanden */
        <div className="space-y-6">
          {/* Plan-Header */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white">
                Wochenplan KW {wochenplan.kalenderwoche}/{wochenplan.jahr}
                {wochenplan.gruppe && ` — ${wochenplan.gruppe.name}`}
              </h2>
              <p className="text-zinc-400 text-sm">
                {wochenplan.positionen.length} Position{wochenplan.positionen.length !== 1 ? "en" : ""}
              </p>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              wochenplan.status === "freigegeben" ? "bg-green-900/40 text-green-400" :
              wochenplan.status === "abgeschlossen" ? "bg-zinc-700 text-zinc-300" :
              "bg-amber-900/40 text-amber-400"
            }`}>
              {wochenplan.status.charAt(0).toUpperCase() + wochenplan.status.slice(1)}
            </span>
          </div>

          {/* Positionen je Dienstleistungstyp */}
          {DIENSTLEISTUNG_TYPEN.map(({ key, label, farbe }) => {
            const posFuerTyp = wochenplan.positionen.filter((p) => p.dienstleistungstyp === key)

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className={`text-sm font-bold px-3 py-1 rounded-full border ${farbe}`}>
                    {label}
                  </h3>
                  <span className="text-zinc-500 text-xs">({posFuerTyp.length})</span>
                  <button
                    onClick={() => setPositionFormTyp(positionFormTyp === key ? null : key)}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Hinzufügen
                  </button>
                </div>

                {/* Hinzufügen-Formular */}
                {positionFormTyp === key && (
                  <form
                    onSubmit={positionHinzufuegen}
                    className="bg-zinc-800 border border-zinc-600 rounded-xl p-4 space-y-3 ml-4"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-zinc-400">Datum</label>
                        <input type="date" name="datum" className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white" />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400">Fläche / Waldstück</label>
                        <input type="text" name="flaeche" placeholder="z.B. Forstort Eichwald" className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white" />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400">Treffpunkt</label>
                        <input type="text" name="treffpunkt" placeholder="z.B. Parkplatz B27" className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white" />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400">GPS-Position</label>
                        <input type="text" name="gpsPosition" placeholder="51.1657, 10.4515" className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white" />
                      </div>

                      {/* Pflanzung-spezifische Felder */}
                      {key === "pflanzung" && (
                        <>
                          <div>
                            <label className="text-xs text-zinc-400">Baumart</label>
                            <select name="baumart" className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white">
                              <option value="">Wählen...</option>
                              {BAUMARTEN.map((b) => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-400">Stückzahl</label>
                            <input type="number" name="stueckzahl" min="0" placeholder="z.B. 5000" className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white" />
                          </div>
                        </>
                      )}

                      {/* Saatguternte-spezifische Felder */}
                      {key === "saatguternte" && (
                        <>
                          <div>
                            <label className="text-xs text-zinc-400">Baumart</label>
                            <select name="baumart" className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white">
                              <option value="">Wählen...</option>
                              {BAUMARTEN.map((b) => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-400">Herkunftscode</label>
                            <input type="text" name="herkunftscode" placeholder="z.B. 06 NRW-818-07" className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white" />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-400">Ziel (kg)</label>
                            <input type="number" name="zielkg" min="0" step="0.1" placeholder="z.B. 50" className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white" />
                          </div>
                        </>
                      )}

                      <div className="col-span-3">
                        <label className="text-xs text-zinc-400">Notizen</label>
                        <input type="text" name="notizen" placeholder="Besonderheiten, Hinweise..." className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setPositionFormTyp(null)} className="px-3 py-1.5 border border-zinc-600 text-zinc-300 rounded-lg text-sm">Abbrechen</button>
                      <button type="submit" className="px-4 py-1.5 bg-green-700 text-white rounded-lg text-sm hover:bg-green-600">Hinzufügen</button>
                    </div>
                  </form>
                )}

                {/* Positionen-Liste */}
                {posFuerTyp.length > 0 ? (
                  <div className="ml-4 space-y-1">
                    {posFuerTyp.map((pos) => (
                      <div
                        key={pos.id}
                        className="flex items-start gap-3 p-3 bg-zinc-800/40 border border-zinc-700/50 rounded-lg hover:bg-zinc-800/60 group transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            {pos.datum && (
                              <span className="text-xs text-zinc-400 font-mono">
                                {new Date(pos.datum).toLocaleDateString("de-DE")}
                              </span>
                            )}
                            {pos.flaeche && (
                              <span className="text-sm text-white font-medium">{pos.flaeche}</span>
                            )}
                            {/* Pflanzung-Details */}
                            {key === "pflanzung" && pos.baumart && (
                              <span className="text-xs text-green-400">
                                🌱 {pos.baumart}{pos.stueckzahl ? ` · ${pos.stueckzahl.toLocaleString("de-DE")} Stück` : ""}
                              </span>
                            )}
                            {/* Saatguternte-Details */}
                            {key === "saatguternte" && (
                              <span className="text-xs text-yellow-400">
                                🌾 {pos.baumart ?? "?"}{pos.herkunftscode ? ` · HKG: ${pos.herkunftscode}` : ""}
                                {pos.zielkg ? ` · Ziel: ${pos.zielkg} kg` : ""}
                              </span>
                            )}
                            {pos.treffpunkt && (
                              <span className="text-xs text-zinc-400">📍 {pos.treffpunkt}</span>
                            )}
                          </div>
                          {pos.notizen && (
                            <p className="text-xs text-zinc-500 mt-1 italic">{pos.notizen}</p>
                          )}
                        </div>
                        <button
                          onClick={() => positionLoeschen(pos.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ml-4 text-zinc-600 text-xs py-2">
                    Noch keine {label}-Positionen
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

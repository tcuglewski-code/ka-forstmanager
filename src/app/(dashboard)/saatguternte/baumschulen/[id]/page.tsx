// @ts-nocheck
"use client"

// Sprint AI: Baumschule-Detailansicht mit Preislisten-Tab

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Plus, Pencil, Trash2, Check, X, ChevronLeft } from "lucide-react"
import Link from "next/link"

interface Baumschule {
  id: string
  name: string
  ort?: string
  bundesland?: string
  ansprechpartner?: string
  email?: string
  telefon?: string
  notizen?: string
  aktiv: boolean
}

interface Preisliste {
  id: string
  baumart: string
  preis: number
  einheit: string
  saison?: string
  aktiv: boolean
  notizen?: string
}

const BAUMARTEN = [
  "Stieleiche", "Traubeneiche", "Rotbuche", "Fichte", "Kiefer", "Lärche",
  "Kastanie", "Roteiche", "Walnuss", "Baumhasel", "Esche", "Bergahorn",
  "Spitzahorn", "Douglasie", "Weißtanne", "Gemeine Kiefer", "Sonstige",
]

const EINHEITEN = ["kg", "Stück", "Bündel", "Liter", "Kilo"]

export default function BaumschuleDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [baumschule, setBaumschule] = useState<Baumschule | null>(null)
  const [preislisten, setPreislisten] = useState<Preisliste[]>([])
  const [laden, setLaden] = useState(true)
  const [aktTab, setAktTab] = useState<"info" | "preislisten">("preislisten")

  // Formular für neue Preisliste
  const [formOffen, setFormOffen] = useState(false)
  const [formDaten, setFormDaten] = useState({
    baumart: "",
    preis: "",
    einheit: "kg",
    saison: new Date().getFullYear().toString(),
    aktiv: true,
    notizen: "",
  })
  const [speichern, setSpeichern] = useState(false)

  // Bearbeitungs-State
  const [bearbeiteId, setBearbeiteId] = useState<string | null>(null)
  const [bearbeiteDaten, setBearbeiteDaten] = useState<Partial<Preisliste>>({})

  async function laden_() {
    try {
      const res = await fetch(`/api/baumschulen/${id}/preislisten`)
      const daten = await res.json()
      setBaumschule(daten.baumschule)
      setPreislisten(daten.preislisten)
    } catch (err) {
      console.error("Fehler beim Laden:", err)
    } finally {
      setLaden(false)
    }
  }

  useEffect(() => { laden_() }, [id])

  async function preisErstellen(e: React.FormEvent) {
    e.preventDefault()
    setSpeichern(true)
    try {
      const res = await fetch(`/api/baumschulen/${id}/preislisten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDaten),
      })
      if (!res.ok) throw new Error("Fehler beim Erstellen")
      const neu = await res.json()
      setPreislisten((prev) => [...prev, neu])
      setFormDaten({ baumart: "", preis: "", einheit: "kg", saison: new Date().getFullYear().toString(), aktiv: true, notizen: "" })
      setFormOffen(false)
    } catch (err) {
      alert("Fehler: " + (err as Error).message)
    } finally {
      setSpeichern(false)
    }
  }

  async function preisAktualisieren(preisId: string) {
    try {
      const res = await fetch(`/api/baumschulen/${id}/preislisten/${preisId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bearbeiteDaten),
      })
      if (!res.ok) throw new Error("Fehler beim Aktualisieren")
      const aktualisiert = await res.json()
      setPreislisten((prev) => prev.map((p) => (p.id === preisId ? aktualisiert : p)))
      setBearbeiteId(null)
      setBearbeiteDaten({})
    } catch (err) {
      alert("Fehler: " + (err as Error).message)
    }
  }

  async function preisLoeschen(preisId: string) {
    if (!confirm("Preiseintrag wirklich löschen?")) return
    try {
      const res = await fetch(`/api/baumschulen/${id}/preislisten/${preisId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Fehler beim Löschen")
      setPreislisten((prev) => prev.filter((p) => p.id !== preisId))
    } catch (err) {
      alert("Fehler: " + (err as Error).message)
    }
  }

  const aktivPreislisten = preislisten.filter((p) => p.aktiv)
  const inaktivPreislisten = preislisten.filter((p) => !p.aktiv)

  if (laden) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        <div className="animate-spin text-2xl mr-2">⏳</div>
        Lade Baumschule...
      </div>
    )
  }

  if (!baumschule) {
    return (
      <div className="p-6 text-red-400">
        Baumschule nicht gefunden.
        <Link href="/saatguternte" className="ml-2 underline text-zinc-300">← Zurück</Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/saatguternte/anfragen"
          className="mt-1 p-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{baumschule.name}</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {[baumschule.ort, baumschule.bundesland].filter(Boolean).join(", ")}
            {!baumschule.aktiv && (
              <span className="ml-2 px-2 py-0.5 bg-red-900/40 text-red-400 rounded text-xs">inaktiv</span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-700">
        {[
          { key: "info", label: "📋 Info" },
          { key: "preislisten", label: `💰 Preislisten (${preislisten.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAktTab(tab.key as "info" | "preislisten")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              aktTab === tab.key
                ? "bg-zinc-800 text-white border border-b-0 border-zinc-700"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {aktTab === "info" && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Ansprechpartner", wert: baumschule.ansprechpartner },
              { label: "E-Mail", wert: baumschule.email },
              { label: "Telefon", wert: baumschule.telefon },
              { label: "Ort", wert: baumschule.ort },
              { label: "Bundesland", wert: baumschule.bundesland },
            ].map(({ label, wert }) => wert ? (
              <div key={label}>
                <dt className="text-zinc-400">{label}</dt>
                <dd className="text-white font-medium mt-0.5">{wert}</dd>
              </div>
            ) : null)}
          </dl>
          {baumschule.notizen && (
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <p className="text-zinc-400 text-xs mb-1">Notizen</p>
              <p className="text-zinc-200 text-sm whitespace-pre-line">{baumschule.notizen}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Preislisten */}
      {aktTab === "preislisten" && (
        <div className="space-y-4">
          {/* Neue Preisliste hinzufügen */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Preislisten</h2>
            <button
              onClick={() => setFormOffen(!formOffen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-600 text-sm"
            >
              <Plus className="w-4 h-4" />
              Neuer Preiseintrag
            </button>
          </div>

          {/* Formular */}
          {formOffen && (
            <form
              onSubmit={preisErstellen}
              className="bg-zinc-800 border border-zinc-600 rounded-xl p-4 space-y-3"
            >
              <h3 className="font-medium text-white text-sm">Neuen Preiseintrag hinzufügen</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400">Baumart *</label>
                  <select
                    value={formDaten.baumart}
                    onChange={(e) => setFormDaten({ ...formDaten, baumart: e.target.value })}
                    className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white"
                    required
                  >
                    <option value="">Baumart wählen...</option>
                    {BAUMARTEN.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Preis (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formDaten.preis}
                    onChange={(e) => setFormDaten({ ...formDaten, preis: e.target.value })}
                    placeholder="z.B. 4.50"
                    className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Einheit</label>
                  <select
                    value={formDaten.einheit}
                    onChange={(e) => setFormDaten({ ...formDaten, einheit: e.target.value })}
                    className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {EINHEITEN.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Saison</label>
                  <input
                    type="text"
                    value={formDaten.saison}
                    onChange={(e) => setFormDaten({ ...formDaten, saison: e.target.value })}
                    placeholder="z.B. 2025"
                    className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400">Notizen (optional)</label>
                  <input
                    type="text"
                    value={formDaten.notizen}
                    onChange={(e) => setFormDaten({ ...formDaten, notizen: e.target.value })}
                    placeholder="Qualitätshinweise, Bedingungen..."
                    className="w-full mt-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setFormOffen(false)}
                  className="px-3 py-1.5 border border-zinc-600 text-zinc-300 rounded-lg hover:border-zinc-400 text-sm"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={speichern}
                  className="px-4 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-600 text-sm disabled:opacity-50"
                >
                  {speichern ? "Wird gespeichert..." : "Speichern"}
                </button>
              </div>
            </form>
          )}

          {/* Aktive Preislisten */}
          {preislisten.length === 0 ? (
            <div className="text-center text-zinc-500 py-12 text-sm">
              Noch keine Preislisten vorhanden. Klicke auf „Neuer Preiseintrag".
            </div>
          ) : (
            <div className="space-y-4">
              {/* Aktive Einträge */}
              {aktivPreislisten.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">Aktive Preise</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-zinc-400 text-xs border-b border-zinc-700">
                        <th className="text-left py-2 px-3">Baumart</th>
                        <th className="text-right py-2 px-3">Preis</th>
                        <th className="text-left py-2 px-3">Einheit</th>
                        <th className="text-left py-2 px-3">Saison</th>
                        <th className="text-left py-2 px-3">Notizen</th>
                        <th className="py-2 px-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {aktivPreislisten.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors"
                        >
                          {bearbeiteId === p.id ? (
                            <>
                              <td className="py-2 px-3">
                                <select
                                  value={bearbeiteDaten.baumart ?? p.baumart}
                                  onChange={(e) => setBearbeiteDaten({ ...bearbeiteDaten, baumart: e.target.value })}
                                  className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs w-full"
                                >
                                  {BAUMARTEN.map((b) => <option key={b} value={b}>{b}</option>)}
                                </select>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={bearbeiteDaten.preis ?? p.preis}
                                  onChange={(e) => setBearbeiteDaten({ ...bearbeiteDaten, preis: parseFloat(e.target.value) })}
                                  className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs w-20 text-right"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <select
                                  value={bearbeiteDaten.einheit ?? p.einheit}
                                  onChange={(e) => setBearbeiteDaten({ ...bearbeiteDaten, einheit: e.target.value })}
                                  className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs"
                                >
                                  {EINHEITEN.map((e) => <option key={e} value={e}>{e}</option>)}
                                </select>
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={bearbeiteDaten.saison ?? p.saison ?? ""}
                                  onChange={(e) => setBearbeiteDaten({ ...bearbeiteDaten, saison: e.target.value })}
                                  className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs w-20"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={bearbeiteDaten.notizen ?? p.notizen ?? ""}
                                  onChange={(e) => setBearbeiteDaten({ ...bearbeiteDaten, notizen: e.target.value })}
                                  className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs w-full"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => preisAktualisieren(p.id)}
                                    className="p-1 text-green-400 hover:text-green-300"
                                    title="Speichern"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => { setBearbeiteId(null); setBearbeiteDaten({}) }}
                                    className="p-1 text-zinc-400 hover:text-zinc-200"
                                    title="Abbrechen"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 px-3 text-white font-medium">{p.baumart}</td>
                              <td className="py-2 px-3 text-right text-emerald-400 font-mono font-medium">
                                {p.preis.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                              </td>
                              <td className="py-2 px-3 text-zinc-300">/{p.einheit}</td>
                              <td className="py-2 px-3 text-zinc-400">{p.saison ?? "—"}</td>
                              <td className="py-2 px-3 text-zinc-500 text-xs">{p.notizen ?? "—"}</td>
                              <td className="py-2 px-3">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => { setBearbeiteId(p.id); setBearbeiteDaten({ baumart: p.baumart, preis: p.preis, einheit: p.einheit, saison: p.saison, notizen: p.notizen }) }}
                                    className="p-1 text-zinc-400 hover:text-white"
                                    title="Bearbeiten"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => preisLoeschen(p.id)}
                                    className="p-1 text-zinc-400 hover:text-red-400"
                                    title="Löschen"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Inaktive Einträge */}
              {inaktivPreislisten.length > 0 && (
                <details className="mt-4">
                  <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-300">
                    {inaktivPreislisten.length} inaktive Preiseinträge anzeigen
                  </summary>
                  <div className="mt-2 opacity-50">
                    <table className="w-full text-sm">
                      <tbody>
                        {inaktivPreislisten.map((p) => (
                          <tr key={p.id} className="border-b border-zinc-800">
                            <td className="py-2 px-3 text-zinc-400 line-through">{p.baumart}</td>
                            <td className="py-2 px-3 text-right text-zinc-500 font-mono">
                              {p.preis.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                            </td>
                            <td className="py-2 px-3 text-zinc-500">/{p.einheit}</td>
                            <td className="py-2 px-3 text-zinc-600">{p.saison ?? "—"}</td>
                            <td className="py-2 px-3">
                              <button
                                onClick={() => preisLoeschen(p.id)}
                                className="p-1 text-zinc-600 hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

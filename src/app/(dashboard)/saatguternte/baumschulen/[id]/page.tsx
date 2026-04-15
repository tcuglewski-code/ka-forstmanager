// @ts-nocheck
"use client"

// Sprint AI: Baumschule-Detailansicht mit Preislisten-Tab

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Check, X, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/useConfirm"

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
  const router = useRouter()
  const { confirm, ConfirmDialogElement } = useConfirm()

  // Guard: "neu" should not reach detail page (modal handles creation)
  if (id === "neu") {
    router.push("/saatguternte/baumschulen")
    return null
  }

  const [baumschule, setBaumschule] = useState<Baumschule | null>(null)
  const [preislisten, setPreislisten] = useState<Preisliste[]>([])
  const [laden, setLaden] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      if (res.status === 404) {
        setError("Baumschule nicht gefunden")
        router.push("/saatguternte/baumschulen")
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const daten = await res.json()
      setBaumschule(daten.baumschule)
      setPreislisten(daten.preislisten)
    } catch (err) {
      console.error("Fehler beim Laden:", err)
      setError("Fehler beim Laden der Baumschule")
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
      toast.error("Fehler: " + (err as Error).message)
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
      toast.error("Fehler: " + (err as Error).message)
    }
  }

  async function preisLoeschen(preisId: string) {
    const ok = await confirm({ title: "Bestätigen", message: "Preiseintrag wirklich löschen?" })
    if (!ok) return
    try {
      const res = await fetch(`/api/baumschulen/${id}/preislisten/${preisId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Fehler beim Löschen")
      setPreislisten((prev) => prev.filter((p) => p.id !== preisId))
    } catch (err) {
      toast.error("Fehler: " + (err as Error).message)
    }
  }

  const aktivPreislisten = preislisten.filter((p) => p.aktiv)
  const inaktivPreislisten = preislisten.filter((p) => !p.aktiv)

  if (laden) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="animate-spin text-2xl mr-2">&#x23F3;</div>
        Lade Baumschule...
      </div>
    )
  }

  if (!baumschule) {
    return (
      <div className="p-6 text-red-600">
        {error || "Baumschule nicht gefunden."}
        <Link href="/saatguternte/baumschulen" className="ml-2 underline text-gray-600">&#x2190; Zur&uuml;ck zur Liste</Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {ConfirmDialogElement}
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/saatguternte/baumschulen"
          className="mt-1 p-2 rounded-lg border border-gray-200 hover:border-gray-400 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{baumschule.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {[baumschule.ort, baumschule.bundesland].filter(Boolean).join(", ")}
            {!baumschule.aktiv && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">inaktiv</span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: "info", label: "Info" },
          { key: "preislisten", label: `Preislisten (${preislisten.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAktTab(tab.key as "info" | "preislisten")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              aktTab === tab.key
                ? "bg-white text-gray-900 border border-b-0 border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {aktTab === "info" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Ansprechpartner", wert: baumschule.ansprechpartner },
              { label: "E-Mail", wert: baumschule.email },
              { label: "Telefon", wert: baumschule.telefon },
              { label: "Ort", wert: baumschule.ort },
              { label: "Bundesland", wert: baumschule.bundesland },
            ].map(({ label, wert }) => wert ? (
              <div key={label}>
                <dt className="text-gray-500">{label}</dt>
                <dd className="text-gray-900 font-medium mt-0.5">{wert}</dd>
              </div>
            ) : null)}
          </dl>
          {baumschule.notizen && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-500 text-xs mb-1">Notizen</p>
              <p className="text-gray-700 text-sm whitespace-pre-line">{baumschule.notizen}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Preislisten */}
      {aktTab === "preislisten" && (
        <div className="space-y-4">
          {/* Neue Preisliste hinzufügen */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Preislisten</h2>
            <button
              onClick={() => setFormOffen(!formOffen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              Neuer Preiseintrag
            </button>
          </div>

          {/* Formular */}
          {formOffen && (
            <form
              onSubmit={preisErstellen}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3"
            >
              <h3 className="font-medium text-gray-900 text-sm">Neuen Preiseintrag hinzufügen</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Baumart *</label>
                  <select
                    value={formDaten.baumart}
                    onChange={(e) => setFormDaten({ ...formDaten, baumart: e.target.value })}
                    className="w-full mt-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    required
                  >
                    <option value="">Baumart wählen...</option>
                    {BAUMARTEN.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Preis (&#x20AC;) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formDaten.preis}
                    onChange={(e) => setFormDaten({ ...formDaten, preis: e.target.value })}
                    placeholder="z.B. 4.50"
                    className="w-full mt-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Einheit</label>
                  <select
                    value={formDaten.einheit}
                    onChange={(e) => setFormDaten({ ...formDaten, einheit: e.target.value })}
                    className="w-full mt-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                  >
                    {EINHEITEN.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Saison</label>
                  <input
                    type="text"
                    value={formDaten.saison}
                    onChange={(e) => setFormDaten({ ...formDaten, saison: e.target.value })}
                    placeholder="z.B. 2025"
                    className="w-full mt-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Notizen (optional)</label>
                  <input
                    type="text"
                    value={formDaten.notizen}
                    onChange={(e) => setFormDaten({ ...formDaten, notizen: e.target.value })}
                    placeholder="Qualitätshinweise, Bedingungen..."
                    className="w-full mt-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setFormOffen(false)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:border-gray-400 text-sm"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={speichern}
                  className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                >
                  {speichern ? "Wird gespeichert..." : "Speichern"}
                </button>
              </div>
            </form>
          )}

          {/* Aktive Preislisten */}
          {preislisten.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-sm">
              Noch keine Preislisten vorhanden. Klicke auf &bdquo;Neuer Preiseintrag&ldquo;.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Aktive Einträge */}
              {aktivPreislisten.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Aktive Preise</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs border-b border-gray-200">
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
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          {bearbeiteId === p.id ? (
                            <>
                              <td className="py-2 px-3">
                                <select
                                  value={bearbeiteDaten.baumart ?? p.baumart}
                                  onChange={(e) => setBearbeiteDaten({ ...bearbeiteDaten, baumart: e.target.value })}
                                  className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-full"
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
                                  className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-20 text-right"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <select
                                  value={bearbeiteDaten.einheit ?? p.einheit}
                                  onChange={(e) => setBearbeiteDaten({ ...bearbeiteDaten, einheit: e.target.value })}
                                  className="bg-white border border-gray-200 rounded px-2 py-1 text-xs"
                                >
                                  {EINHEITEN.map((e) => <option key={e} value={e}>{e}</option>)}
                                </select>
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={bearbeiteDaten.saison ?? p.saison ?? ""}
                                  onChange={(e) => setBearbeiteDaten({ ...bearbeiteDaten, saison: e.target.value })}
                                  className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-20"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={bearbeiteDaten.notizen ?? p.notizen ?? ""}
                                  onChange={(e) => setBearbeiteDaten({ ...bearbeiteDaten, notizen: e.target.value })}
                                  className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-full"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => preisAktualisieren(p.id)}
                                    className="p-1 text-green-600 hover:text-green-700"
                                    title="Speichern"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => { setBearbeiteId(null); setBearbeiteDaten({}) }}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                    title="Abbrechen"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 px-3 text-gray-900 font-medium">{p.baumart}</td>
                              <td className="py-2 px-3 text-right text-green-700 font-mono font-medium">
                                {p.preis.toLocaleString("de-DE", { minimumFractionDigits: 2 })} &#x20AC;
                              </td>
                              <td className="py-2 px-3 text-gray-600">/{p.einheit}</td>
                              <td className="py-2 px-3 text-gray-500">{p.saison ?? "\u2014"}</td>
                              <td className="py-2 px-3 text-gray-400 text-xs">{p.notizen ?? "\u2014"}</td>
                              <td className="py-2 px-3">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => { setBearbeiteId(p.id); setBearbeiteDaten({ baumart: p.baumart, preis: p.preis, einheit: p.einheit, saison: p.saison, notizen: p.notizen }) }}
                                    className="p-1 text-gray-400 hover:text-gray-900"
                                    title="Bearbeiten"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => preisLoeschen(p.id)}
                                    className="p-1 text-gray-400 hover:text-red-500"
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
                  <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
                    {inaktivPreislisten.length} inaktive Preiseinträge anzeigen
                  </summary>
                  <div className="mt-2 opacity-50">
                    <table className="w-full text-sm">
                      <tbody>
                        {inaktivPreislisten.map((p) => (
                          <tr key={p.id} className="border-b border-gray-100">
                            <td className="py-2 px-3 text-gray-400 line-through">{p.baumart}</td>
                            <td className="py-2 px-3 text-right text-gray-400 font-mono">
                              {p.preis.toLocaleString("de-DE", { minimumFractionDigits: 2 })} &#x20AC;
                            </td>
                            <td className="py-2 px-3 text-gray-400">/{p.einheit}</td>
                            <td className="py-2 px-3 text-gray-400">{p.saison ?? "\u2014"}</td>
                            <td className="py-2 px-3">
                              <button
                                onClick={() => preisLoeschen(p.id)}
                                className="p-1 text-gray-400 hover:text-red-500"
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

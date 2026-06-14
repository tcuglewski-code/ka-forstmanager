"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Plus, Trash2, Save, RefreshCw, Power } from "lucide-react"

type Einheit = "ha" | "stueck" | "lm" | "m2" | "stunde" | "pauschale" | "kg"
const EINHEITEN: Einheit[] = ["ha", "stueck", "lm", "m2", "stunde", "pauschale", "kg"]
const AUFSCHLAG_TYPEN = ["steilheit", "entfernung", "saison", "menge", "subunternehmer", "fixkosten", "bodenart", "sonstiges"]

interface Eintrag {
  id: string
  kategorieId: string
  bezeichnung: string
  einheit: Einheit
  basispreis: number
  mwstSatz: number
  beschreibung: string | null
  lieferantTyp: string | null
  aktiv: boolean
}
interface Kategorie {
  id: string
  name: string
  label: string | null
  beschreibung: string | null
  reihenfolge: number
  aktiv: boolean
  eintraege: Eintrag[]
}
interface Aufschlag {
  id: string
  name: string
  typ: string
  bedingung: unknown
  faktor: number
  beschreibung: string | null
  aktiv: boolean
}
interface Template {
  id: string
  name: string
  beschreibung: string | null
  leistungsTyp: string
  aktiv: boolean
}

export default function PreisbuchAdminPage() {
  const [tab, setTab] = useState<"eintraege" | "aufschlaege" | "templates" | "einstellungen">("eintraege")
  const [kategorien, setKategorien] = useState<Kategorie[]>([])
  const [aufschlaege, setAufschlaege] = useState<Aufschlag[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [agentAktiv, setAgentAktiv] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [kRes, aRes, tRes, cRes] = await Promise.all([
        fetch("/api/preisbuch/kategorien?aktiv=false"),
        fetch("/api/preisbuch/aufschlaege"),
        fetch("/api/preisbuch/templates"),
        fetch("/api/einstellungen/config"),
      ])
      if (kRes.ok) setKategorien(await kRes.json())
      if (aRes.ok) setAufschlaege(await aRes.json())
      if (tRes.ok) setTemplates(await tRes.json())
      if (cRes.ok) {
        const cfg = await cRes.json()
        setAgentAktiv(cfg.ang_agent_aktiv === "true")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500) }

  // ── Kategorie + Eintrag CRUD ──
  const addKategorie = async () => {
    const name = prompt("Kategorie-Name (techn., klein):")
    if (!name) return
    const label = prompt("Anzeige-Label:") || name
    const res = await fetch("/api/preisbuch/kategorien", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, label, reihenfolge: kategorien.length + 1 }),
    })
    if (res.ok) { flash("Kategorie angelegt"); load() } else { flash("Fehler") }
  }

  const addEintrag = async (kategorieId: string) => {
    const bezeichnung = prompt("Bezeichnung:")
    if (!bezeichnung) return
    const basispreis = parseFloat(prompt("Basispreis (Netto €):") || "0")
    const einheit = (prompt(`Einheit (${EINHEITEN.join("/")}):`, "stueck") || "stueck") as Einheit
    const mwstSatz = parseFloat(prompt("MwSt-Satz (7 oder 19):", "19") || "19")
    const res = await fetch("/api/preisbuch/eintraege", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kategorieId, bezeichnung, basispreis, einheit, mwstSatz }),
    })
    if (res.ok) { flash("Eintrag angelegt"); load() } else { flash("Fehler — Einheit prüfen") }
  }

  const saveEintrag = async (e: Eintrag) => {
    const res = await fetch(`/api/preisbuch/eintraege/${e.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basispreis: e.basispreis, mwstSatz: e.mwstSatz, bezeichnung: e.bezeichnung, einheit: e.einheit }),
    })
    if (res.ok) flash("Gespeichert"); else flash("Fehler")
  }

  const deleteEintrag = async (id: string) => {
    if (!confirm("Eintrag deaktivieren?")) return
    const res = await fetch(`/api/preisbuch/eintraege/${id}`, { method: "DELETE" })
    if (res.ok) { flash("Deaktiviert"); load() }
  }

  const updateLocalEintrag = (katId: string, eId: string, patch: Partial<Eintrag>) => {
    setKategorien(prev => prev.map(k => k.id !== katId ? k : {
      ...k, eintraege: k.eintraege.map(e => e.id === eId ? { ...e, ...patch } : e),
    }))
  }

  const toggleAgent = async () => {
    const next = !agentAktiv
    const res = await fetch("/api/einstellungen/config", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "ang_agent_aktiv", value: next ? "true" : "false" }),
    })
    if (res.ok) { setAgentAktiv(next); flash(next ? "KI-Agent AKTIV" : "KI-Agent deaktiviert") }
  }

  const toggleTemplate = async (t: Template) => {
    const res = await fetch("/api/preisbuch/templates", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, aktiv: !t.aktiv }),
    })
    if (res.ok) load()
  }

  const addAufschlag = async () => {
    const name = prompt("Name des Aufschlags:")
    if (!name) return
    const typ = prompt(`Typ (${AUFSCHLAG_TYPEN.join("/")}):`, "steilheit") || "sonstiges"
    const faktor = parseFloat(prompt("Faktor (z.B. 0.15 = +15%, -0.05 = Rabatt):", "0.15") || "0")
    const min = prompt("Bedingung min (optional):")
    const max = prompt("Bedingung max (optional):")
    const wert = prompt("Bedingung Wert (z.B. winter/steinig, optional):")
    const bedingung: Record<string, unknown> = {}
    if (min) bedingung.min = parseFloat(min)
    if (max) bedingung.max = parseFloat(max)
    if (wert) bedingung.wert = wert
    const res = await fetch("/api/preisbuch/aufschlaege", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, typ, faktor, bedingung, reihenfolge: aufschlaege.length + 1 }),
    })
    if (res.ok) { flash("Aufschlag angelegt"); load() } else flash("Fehler")
  }

  const deleteAufschlag = async (id: string) => {
    if (!confirm("Aufschlag löschen?")) return
    const res = await fetch(`/api/preisbuch/aufschlaege/${id}`, { method: "DELETE" })
    if (res.ok) { flash("Gelöscht"); load() }
  }

  if (loading) return <div className="p-8 flex items-center gap-2"><Loader2 className="animate-spin" /> Lädt…</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: "#2C3A1C" }}>Preisbuch-Verwaltung</h1>
        <button onClick={load} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded border hover:bg-gray-50">
          <RefreshCw size={14} /> Aktualisieren
        </button>
      </div>
      {msg && <div className="mb-3 px-3 py-2 rounded bg-emerald-50 text-emerald-800 text-sm">{msg}</div>}

      <div className="flex gap-2 border-b mb-4">
        {(["eintraege", "aufschlaege", "templates", "einstellungen"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t ? "border-[#C5A55A] text-[#2C3A1C]" : "border-transparent text-gray-500"}`}>
            {t === "eintraege" ? "Kategorien & Einträge" : t === "aufschlaege" ? "Aufschläge" : t === "templates" ? "Templates" : "Einstellungen"}
          </button>
        ))}
      </div>

      {tab === "eintraege" && (
        <div className="space-y-4">
          <button onClick={addKategorie} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded bg-[#2C3A1C] text-white">
            <Plus size={14} /> Kategorie
          </button>
          {kategorien.map(k => (
            <div key={k.id} className={`border rounded-lg p-3 ${!k.aktiv ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{k.label || k.name} <span className="text-xs text-gray-400">({k.name})</span></h3>
                <button onClick={() => addEintrag(k.id)} className="text-xs flex items-center gap-1 text-[#2C3A1C]">
                  <Plus size={12} /> Eintrag
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs">
                    <th className="py-1">Bezeichnung</th><th>Einheit</th><th>Basispreis €</th><th>MwSt %</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {k.eintraege.map(e => (
                    <tr key={e.id} className="border-t">
                      <td className="py-1">
                        <input value={e.bezeichnung} onChange={ev => updateLocalEintrag(k.id, e.id, { bezeichnung: ev.target.value })}
                          className="w-full bg-transparent border-b border-transparent focus:border-gray-300 outline-none" />
                      </td>
                      <td>
                        <select value={e.einheit} onChange={ev => updateLocalEintrag(k.id, e.id, { einheit: ev.target.value as Einheit })}
                          className="bg-transparent text-xs">
                          {EINHEITEN.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="number" step="0.01" value={e.basispreis}
                          onChange={ev => updateLocalEintrag(k.id, e.id, { basispreis: parseFloat(ev.target.value) })}
                          className="w-20 bg-transparent border-b border-transparent focus:border-gray-300 outline-none" />
                      </td>
                      <td>
                        <input type="number" step="1" value={e.mwstSatz}
                          onChange={ev => updateLocalEintrag(k.id, e.id, { mwstSatz: parseFloat(ev.target.value) })}
                          className="w-12 bg-transparent border-b border-transparent focus:border-gray-300 outline-none" />
                      </td>
                      <td className="flex gap-2 py-1">
                        <button onClick={() => saveEintrag(e)} title="Speichern"><Save size={14} className="text-emerald-600" /></button>
                        <button onClick={() => deleteEintrag(e.id)} title="Deaktivieren"><Trash2 size={14} className="text-red-500" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {tab === "aufschlaege" && (
        <div className="space-y-2">
          <button onClick={addAufschlag} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded bg-[#2C3A1C] text-white">
            <Plus size={14} /> Aufschlag
          </button>
          <table className="w-full text-sm border rounded">
            <thead><tr className="text-left text-gray-500 text-xs bg-gray-50">
              <th className="p-2">Name</th><th>Typ</th><th>Bedingung</th><th>Faktor</th><th></th>
            </tr></thead>
            <tbody>
              {aufschlaege.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-2">{a.name}</td>
                  <td>{a.typ}</td>
                  <td className="text-xs text-gray-500">{JSON.stringify(a.bedingung)}</td>
                  <td>{(a.faktor * 100).toFixed(0)}%</td>
                  <td><button onClick={() => deleteAufschlag(a.id)}><Trash2 size={14} className="text-red-500" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "templates" && (
        <div className="space-y-2">
          {templates.map(t => (
            <div key={t.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-gray-500">{t.beschreibung} · {t.leistungsTyp}</div>
              </div>
              <button onClick={() => toggleTemplate(t)}
                className={`text-xs px-2 py-1 rounded ${t.aktiv ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>
                {t.aktiv ? "aktiv" : "inaktiv"}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "einstellungen" && (
        <div className="space-y-4 max-w-lg">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2"><Power size={16} /> KI-Angebots-Agent</h3>
                <p className="text-xs text-gray-500 mt-1">Kill-Switch (ang_agent_aktiv). Bei AUS: manueller Angebotsprozess bleibt unverändert nutzbar.</p>
              </div>
              <button onClick={toggleAgent}
                className={`relative w-12 h-6 rounded-full transition-colors ${agentAktiv ? "bg-emerald-600" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${agentAktiv ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Mock-Hinweis: Das Preisbuch enthält realistische Beispielpreise (DE 2025). Vor Produktiveinsatz echte
            Koch-Aufforstung-Preise oben pflegen.
          </p>
        </div>
      )}
    </div>
  )
}

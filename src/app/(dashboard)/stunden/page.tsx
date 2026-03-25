"use client"

import { useState, useEffect, useCallback } from "react"
import { Clock, Plus, Loader2, Check, X, Download } from "lucide-react"

interface Auftrag {
  id: string
  titel: string
  typ: string
}

interface Stundeneintrag {
  id: string
  datum: string
  stunden: number
  typ: string
  genehmigt: boolean
  notiz?: string | null
  auftragId?: string | null
  auftrag?: { id: string; titel: string; typ: string } | null
  mitarbeiter: { id: string; vorname: string; nachname: string }
}

interface Abwesenheit {
  id: string
  von: string
  bis: string
  typ: string
  genehmigt: boolean
  notiz?: string | null
  mitarbeiter: { id: string; vorname: string; nachname: string }
}

interface Mitarbeiter {
  id: string
  vorname: string
  nachname: string
}

function exportStundenCSV(stunden: Stundeneintrag[], filename: string) {
  if (!stunden.length) {
    alert("Keine Daten zum Exportieren")
    return
  }
  const BOM = "\uFEFF"
  const headers = ["Mitarbeiter", "Datum", "Stunden", "Tätigkeit", "Auftrag", "Notiz"]
  const rows = stunden.map(s => [
    `${s.mitarbeiter?.vorname || ""} ${s.mitarbeiter?.nachname || ""}`.trim(),
    s.datum ? new Date(s.datum).toLocaleDateString("de-DE") : "",
    s.stunden ?? "",
    typLabel[s.typ] ?? s.typ,
    s.auftrag?.titel ?? "",
    s.notiz || ""
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"))

  const csv = BOM + [headers.join(";"), ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const typLabel: Record<string, string> = {
  arbeit: "Allgemeine Arbeit",
  pflanzung: "Pflanzung",
  einschlag: "Einschlag",
  freischneider: "Freischneider (Maschine)",
  pflege: "Bestandespflege",
  transport: "Transport",
  ueberstunden: "Überstunden",
  urlaub: "Urlaub",
  krank: "Krank",
  sonstiges: "Sonstiges",
}

const abwTypLabel: Record<string, string> = {
  urlaub: "Urlaub",
  krank: "Krankheit",
  sonderurlaub: "Sonderurlaub",
  unbezahlt: "Unbezahlt",
  sonstiges: "Sonstiges",
}

const MASCHINENZUSCHLAG_DEFAULT = 1 // €/h Standard aus SystemConfig

export default function StundenPage() {
  const [tab, setTab] = useState<"stunden" | "abwesenheiten">("stunden")
  const [stunden, setStunden] = useState<Stundeneintrag[]>([])
  const [abwesenheiten, setAbwesenheiten] = useState<Abwesenheit[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMitarbeiter, setFilterMitarbeiter] = useState("")
  const [filterMonat, setFilterMonat] = useState(String(new Date().getMonth() + 1))
  const [filterJahr, setFilterJahr] = useState(String(new Date().getFullYear()))
  const [filterGenehmigt, setFilterGenehmigt] = useState("")
  const [urlParamsLoaded, setUrlParamsLoaded] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const maId = params.get("mitarbeiterId")
    const genehmigtParam = params.get("genehmigt")
    if (maId) setFilterMitarbeiter(maId)
    if (genehmigtParam !== null && genehmigtParam !== "") {
      setFilterGenehmigt(genehmigtParam)
      setFilterMonat("")
      setFilterJahr("")
    }
    setUrlParamsLoaded(true)
  }, [])

  const [showModal, setShowModal] = useState(false)
  const [showAbwModal, setShowAbwModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stundenForm, setStundenForm] = useState({
    mitarbeiterId: "",
    datum: new Date().toISOString().split("T")[0],
    stunden: "",
    typ: "arbeit",
    auftragId: "",
    notiz: "",
    maschinenzuschlag: "",
  })
  const [abwForm, setAbwForm] = useState({ mitarbeiterId: "", von: "", bis: "", typ: "urlaub", notiz: "" })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterMitarbeiter) params.set("mitarbeiterId", filterMitarbeiter)
    if (filterMonat) params.set("monat", filterMonat)
    if (filterJahr) params.set("jahr", filterJahr)
    if (filterGenehmigt) params.set("genehmigt", filterGenehmigt)
    const [s, a, m, au] = await Promise.all([
      fetch(`/api/stunden?${params}`).then((r) => r.json()),
      fetch("/api/abwesenheiten").then((r) => r.json()),
      fetch("/api/mitarbeiter").then((r) => r.json()),
      fetch("/api/auftraege?limit=200").then((r) => r.json()),
    ])
    setStunden(Array.isArray(s) ? s : [])
    setAbwesenheiten(Array.isArray(a) ? a : [])
    setMitarbeiter(Array.isArray(m) ? m : [])
    setAuftraege(Array.isArray(au) ? au : (Array.isArray(au?.data) ? au.data : []))
    setLoading(false)
  }, [filterMitarbeiter, filterMonat, filterJahr, filterGenehmigt])

  useEffect(() => { if (urlParamsLoaded) fetchAll() }, [fetchAll, urlParamsLoaded])

  // Beim Typ-Wechsel auf "freischneider" Maschinenzuschlag vorausfüllen
  function handleTypChange(typ: string) {
    setStundenForm(prev => ({
      ...prev,
      typ,
      maschinenzuschlag: typ === "freischneider" ? String(MASCHINENZUSCHLAG_DEFAULT) : prev.maschinenzuschlag,
    }))
  }

  async function toggleGenehmigt(id: string, current: boolean) {
    await fetch(`/api/stunden/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ genehmigt: !current }) })
    await fetchAll()
  }

  async function toggleAbwGenehmigt(id: string, current: boolean) {
    await fetch(`/api/abwesenheiten/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ genehmigt: !current }) })
    await fetchAll()
  }

  async function saveStunden() {
    setSaving(true)
    const payload = {
      ...stundenForm,
      auftragId: stundenForm.auftragId || null,
      maschinenzuschlag: stundenForm.maschinenzuschlag ? parseFloat(stundenForm.maschinenzuschlag) : null,
    }
    await fetch("/api/stunden", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setShowModal(false)
    setStundenForm({ mitarbeiterId: "", datum: new Date().toISOString().split("T")[0], stunden: "", typ: "arbeit", auftragId: "", notiz: "", maschinenzuschlag: "" })
    await fetchAll()
    setSaving(false)
  }

  async function saveAbwesenheit() {
    setSaving(true)
    await fetch("/api/abwesenheiten", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(abwForm) })
    setShowAbwModal(false)
    setAbwForm({ mitarbeiterId: "", von: "", bis: "", typ: "urlaub", notiz: "" })
    await fetchAll()
    setSaving(false)
  }

  // Monats-Summe pro Mitarbeiter
  const stundenProMitarbeiter: Record<string, { name: string; summe: number }> = {}
  for (const s of stunden) {
    const key = s.mitarbeiter.id
    if (!stundenProMitarbeiter[key]) stundenProMitarbeiter[key] = { name: `${s.mitarbeiter.vorname} ${s.mitarbeiter.nachname}`, summe: 0 }
    stundenProMitarbeiter[key].summe += s.stunden
  }

  // Tages-Gruppierung
  const nachDatum = stunden.reduce((acc, e) => {
    const datum = new Date(e.datum).toLocaleDateString("de-DE")
    if (!acc[datum]) acc[datum] = []
    acc[datum].push(e)
    return acc
  }, {} as Record<string, typeof stunden>)

  const jahre = [2023, 2024, 2025, 2026, 2027]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-400" /> Stunden & Abwesenheiten
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Stundenerfassung und Abwesenheitsverwaltung</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "stunden" && (
            <button
              onClick={() => exportStundenCSV(stunden, `stunden-export-${new Date().toISOString().slice(0, 10)}.csv`)}
              className="flex items-center gap-2 px-3 py-2 border border-[#2a2a2a] rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              title="Stunden als CSV exportieren"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          <button onClick={() => tab === "stunden" ? setShowModal(true) : setShowAbwModal(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
            <Plus className="w-4 h-4" />
            {tab === "stunden" ? "Stunden buchen" : "Abwesenheit eintragen"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#161616] border border-[#2a2a2a] rounded-lg p-1 w-fit">
        {(["stunden", "abwesenheiten"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? "bg-[#2C3A1C] text-emerald-400" : "text-zinc-400 hover:text-white"}`}>
            {t === "stunden" ? "Stundenerfassung" : "Abwesenheiten"}
          </button>
        ))}
      </div>

      {tab === "stunden" && (
        <>
          {/* Filter */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={filterMitarbeiter} onChange={(e) => setFilterMitarbeiter(e.target.value)} className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Alle Mitarbeiter</option>
              {mitarbeiter.map((m) => <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>)}
            </select>
            <select value={filterMonat} onChange={(e) => setFilterMonat(e.target.value)} className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Alle Monate</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{new Date(2024, m - 1).toLocaleString("de-DE", { month: "long" })}</option>
              ))}
            </select>
            <select value={filterJahr} onChange={(e) => setFilterJahr(e.target.value)} className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Alle Jahre</option>
              {jahre.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filterGenehmigt} onChange={(e) => setFilterGenehmigt(e.target.value)} className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Alle Status</option>
              <option value="true">Genehmigt</option>
              <option value="false">Ausstehend</option>
            </select>
          </div>

          {/* Summen */}
          {Object.keys(stundenProMitarbeiter).length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {Object.values(stundenProMitarbeiter).map((s) => (
                <div key={s.name} className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm">
                  <span className="text-zinc-400">{s.name}: </span>
                  <span className="text-emerald-400 font-medium">{s.summe.toFixed(1)} h</span>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
          ) : stunden.length === 0 ? (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl px-6 py-12 text-center text-zinc-600">
              Keine Einträge
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(nachDatum)
                .sort(([a], [b]) => {
                  // DE-Datum "TT.MM.JJJJ" → sortierbar umwandeln
                  const parseDE = (d: string) => {
                    const [t, m, j] = d.split(".")
                    return `${j}-${m}-${t}`
                  }
                  return parseDE(b).localeCompare(parseDE(a))
                })
                .map(([datum, eintraege]) => (
                  <div key={datum}>
                    {/* Tages-Header */}
                    <div className="flex items-center gap-3 mb-2 px-2">
                      <span className="text-sm font-medium text-zinc-300">{datum}</span>
                      <span className="text-xs text-zinc-600">
                        {eintraege.reduce((s, e) => s + (e.stunden ?? 0), 0).toFixed(1)}h gesamt
                        {eintraege.length > 1 && ` · ${eintraege.length} Einträge`}
                      </span>
                    </div>
                    {/* Einträge des Tages */}
                    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#2a2a2a]">
                            <th className="text-left px-4 py-2 text-xs text-zinc-500 uppercase tracking-wider">Mitarbeiter</th>
                            <th className="text-left px-4 py-2 text-xs text-zinc-500 uppercase tracking-wider">Stunden</th>
                            <th className="text-left px-4 py-2 text-xs text-zinc-500 uppercase tracking-wider">Tätigkeit</th>
                            <th className="text-left px-4 py-2 text-xs text-zinc-500 uppercase tracking-wider">Auftrag</th>
                            <th className="text-left px-4 py-2 text-xs text-zinc-500 uppercase tracking-wider">Notiz</th>
                            <th className="text-left px-4 py-2 text-xs text-zinc-500 uppercase tracking-wider">✓</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2a2a]">
                          {eintraege.map((s) => (
                            <tr key={s.id} className="hover:bg-[#1c1c1c]">
                              <td className="px-4 py-3 text-sm text-white">{s.mitarbeiter.vorname} {s.mitarbeiter.nachname}</td>
                              <td className="px-4 py-3 text-sm font-medium text-emerald-400">{s.stunden} h</td>
                              <td className="px-4 py-3 text-sm text-zinc-400">{typLabel[s.typ] ?? s.typ}</td>
                              <td className="px-4 py-3 text-sm text-zinc-400">
                                {s.auftrag ? (
                                  <a
                                    href={`/auftraege/${s.auftragId}`}
                                    className="text-xs text-blue-400 hover:underline truncate max-w-[150px] block"
                                  >
                                    {s.auftrag.titel ?? s.auftragId}
                                  </a>
                                ) : (
                                  <span className="text-zinc-600">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-zinc-500">{s.notiz ?? "—"}</td>
                              <td className="px-4 py-3">
                                <button onClick={() => toggleGenehmigt(s.id, s.genehmigt)} className={`w-8 h-5 rounded-full transition-all ${s.genehmigt ? "bg-emerald-500" : "bg-zinc-700"}`}>
                                  <span className="block w-3 h-3 rounded-full bg-white mx-auto" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {tab === "abwesenheiten" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
          ) : (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Mitarbeiter</th>
                    <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Von</th>
                    <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Bis</th>
                    <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Typ</th>
                    <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {abwesenheiten.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-600">Keine Abwesenheiten</td></tr>
                  ) : abwesenheiten.map((a) => (
                    <tr key={a.id} className="hover:bg-[#1c1c1c]">
                      <td className="px-6 py-4 text-sm text-white">{a.mitarbeiter.vorname} {a.mitarbeiter.nachname}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{new Date(a.von).toLocaleDateString("de-DE")}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{new Date(a.bis).toLocaleDateString("de-DE")}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{abwTypLabel[a.typ] ?? a.typ}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${a.genehmigt ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                          {a.genehmigt ? "Genehmigt" : "Ausstehend"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {!a.genehmigt ? (
                          <div className="flex gap-2">
                            <button onClick={() => toggleAbwGenehmigt(a.id, false)} className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30">
                              <Check className="w-3 h-3" /> Genehmigen
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => toggleAbwGenehmigt(a.id, true)} className="flex items-center gap-1 px-2 py-1 bg-zinc-700/50 text-zinc-400 rounded text-xs hover:bg-red-500/20 hover:text-red-400">
                            <X className="w-3 h-3" /> Ablehnen
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Stunden Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Stunden buchen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Mitarbeiter *</label>
                <select value={stundenForm.mitarbeiterId} onChange={(e) => setStundenForm({ ...stundenForm, mitarbeiterId: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">— auswählen —</option>
                  {mitarbeiter.map((m) => <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Datum *</label>
                  <input type="date" value={stundenForm.datum} onChange={(e) => setStundenForm({ ...stundenForm, datum: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Stunden *</label>
                  <input type="number" step="0.5" min="0.5" max="24" value={stundenForm.stunden} onChange={(e) => setStundenForm({ ...stundenForm, stunden: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Tätigkeit</label>
                <select
                  value={stundenForm.typ}
                  onChange={(e) => handleTypChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white"
                >
                  <option value="arbeit">Allgemeine Arbeit</option>
                  <option value="pflanzung">Pflanzung</option>
                  <option value="einschlag">Einschlag</option>
                  <option value="freischneider">Freischneider (Maschine)</option>
                  <option value="pflege">Bestandespflege</option>
                  <option value="transport">Transport</option>
                  <option value="ueberstunden">Überstunden</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
              </div>
              {stundenForm.typ === "freischneider" && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Maschinenzuschlag (€/h)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={stundenForm.maschinenzuschlag}
                    onChange={(e) => setStundenForm({ ...stundenForm, maschinenzuschlag: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="1.00"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Auftrag (optional)</label>
                <select
                  value={stundenForm.auftragId}
                  onChange={(e) => setStundenForm({ ...stundenForm, auftragId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white"
                >
                  <option value="">Kein Auftrag</option>
                  {auftraege.map((a) => <option key={a.id} value={a.id}>{a.titel}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Notiz</label>
                <input value={stundenForm.notiz} onChange={(e) => setStundenForm({ ...stundenForm, notiz: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-[#333] text-zinc-400 text-sm hover:bg-[#222]">Abbrechen</button>
              <button onClick={saveStunden} disabled={saving || !stundenForm.mitarbeiterId || !stundenForm.stunden} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Speichern..." : "Buchen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abwesenheit Modal */}
      {showAbwModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">Abwesenheit eintragen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Mitarbeiter</label>
                <select value={abwForm.mitarbeiterId} onChange={(e) => setAbwForm({ ...abwForm, mitarbeiterId: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">— auswählen —</option>
                  {mitarbeiter.map((m) => <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Von</label>
                  <input type="date" value={abwForm.von} onChange={(e) => setAbwForm({ ...abwForm, von: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Bis</label>
                  <input type="date" value={abwForm.bis} onChange={(e) => setAbwForm({ ...abwForm, bis: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Typ</label>
                <select value={abwForm.typ} onChange={(e) => setAbwForm({ ...abwForm, typ: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                  <option value="urlaub">Urlaub</option>
                  <option value="krank">Krankheit</option>
                  <option value="schlechtwetter">Schlechtwetter</option>
                  <option value="sonderurlaub">Sonderurlaub</option>
                  <option value="unbezahlt">Unbezahlt</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Notiz</label>
                <input value={abwForm.notiz} onChange={(e) => setAbwForm({ ...abwForm, notiz: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAbwModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-[#333] text-zinc-400 text-sm hover:bg-[#222]">Abbrechen</button>
              <button onClick={saveAbwesenheit} disabled={saving || !abwForm.mitarbeiterId || !abwForm.von || !abwForm.bis} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Speichern..." : "Eintragen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

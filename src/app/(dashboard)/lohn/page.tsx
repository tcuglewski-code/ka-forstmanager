"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, X, CheckCircle, Circle, TrendingDown, Calculator, Download } from "lucide-react"

interface Lohneintrag {
  id: string
  mitarbeiter: { id: string; vorname: string; nachname: string }
  monat: number
  jahr: number
  stunden: number
  stundenlohn: number
  brutto: number
  netto?: number | null
  ausgezahlt: boolean
  ausgezahltAm?: string | null
}
interface Mitarbeiter { id: string; vorname: string; nachname: string; stundenlohn?: number | null }

interface Vorschuss {
  id: string
  mitarbeiter: { id: string; vorname: string; nachname: string }
  betrag: number
  datum: string
  notizen?: string | null
  grund?: string | null
  status: string
  individualBonus?: number | null
  individualBonusGrund?: string | null
}

interface Gruppe {
  id: string
  name: string
  mitglieder?: { mitarbeiterId: string; mitarbeiter: { id: string } }[]
}

interface LohnBerechnung {
  mitarbeiterId: string
  mitarbeiter: { id: string; vorname: string; nachname: string; stundenlohn?: number | null }
  stunden: number
  stundenlohn: number
  bruttoLohn: number
  maschinenzuschlag: number
  gesamtLohn: number
  eintraege: number
}

const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]

// ─── CSV-Export: Gruppen-Abrechnung ──────────────────────────────────────────

function exportGruppenAbrechnungCSV(gruppe: string, vorschuesse: Vorschuss[], lohnData: LohnBerechnung[]) {
  const BOM = "\uFEFF"
  const headers = ["Mitarbeiter", "Stunden", "Stundenlohn", "Bruttolohn", "Maschinenbonus", "Individualbonus", "Gesamtlohn", "Vorschuss", "Datum"]

  const rows = lohnData.map(l => {
    const vorschuss = vorschuesse.find(v => v.mitarbeiter.id === l.mitarbeiterId)
    return [
      `${l.mitarbeiter?.vorname} ${l.mitarbeiter?.nachname}`,
      l.stunden?.toFixed(1) ?? "0",
      (l.stundenlohn ?? 0).toFixed(2),
      (l.bruttoLohn ?? 0).toFixed(2),
      (l.maschinenzuschlag ?? 0).toFixed(2),
      (vorschuss?.individualBonus ?? 0).toFixed(2),
      (l.gesamtLohn ?? 0).toFixed(2),
      (vorschuss?.betrag ?? 0).toFixed(2),
      vorschuss?.datum ? new Date(vorschuss.datum).toLocaleDateString("de-DE") : ""
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")
  })

  const csv = BOM + [headers.join(";"), ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `abrechnung-${gruppe.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Modal: Abrechnung erstellen ─────────────────────────────────────────────

function AbrechnungModal({ mitarbeiter, monat, jahr, onClose, onSave }: {
  mitarbeiter: Mitarbeiter[]
  monat: number
  jahr: number
  onClose: () => void
  onSave: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    mitarbeiterId: "",
    monat: monat.toString(),
    jahr: jahr.toString(),
    stunden: "",
    stundenlohn: "",
    notizen: "",
  })

  const selectedMA = mitarbeiter.find(m => m.id === form.mitarbeiterId)

  useEffect(() => {
    if (selectedMA?.stundenlohn) {
      setForm(f => ({ ...f, stundenlohn: selectedMA.stundenlohn!.toString() }))
    }
  }, [form.mitarbeiterId, selectedMA])

  const brutto = parseFloat(form.stunden || "0") * parseFloat(form.stundenlohn || "0")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/lohn", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Abrechnung erstellen</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Mitarbeiter *</label>
            <select value={form.mitarbeiterId} onChange={e => setForm(f => ({ ...f, mitarbeiterId: e.target.value }))} required
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="">— wählen —</option>
              {mitarbeiter.map(m => <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Monat</label>
              <select value={form.monat} onChange={e => setForm(f => ({ ...f, monat: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                {MONATE.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Jahr</label>
              <input type="number" value={form.jahr} onChange={e => setForm(f => ({ ...f, jahr: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Stunden *</label>
              <input type="number" step="0.5" value={form.stunden} onChange={e => setForm(f => ({ ...f, stunden: e.target.value }))} required
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Stundenlohn (€)</label>
              <input type="number" step="0.01" value={form.stundenlohn} onChange={e => setForm(f => ({ ...f, stundenlohn: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          {brutto > 0 && (
            <div className="bg-[#0f0f0f] rounded-lg px-4 py-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Brutto</span>
                <span className="text-white font-semibold">{brutto.toFixed(2)} €</span>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all">Abbrechen</button>
            <button type="submit" disabled={loading || !form.mitarbeiterId || !form.stunden} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {loading ? "Erstellen..." : "Erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal: Vorschuss erstellen ───────────────────────────────────────────────

function VorschussModal({ mitarbeiter, onClose, onSave }: {
  mitarbeiter: Mitarbeiter[]
  onClose: () => void
  onSave: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    mitarbeiterId: "",
    betrag: "",
    datum: new Date().toISOString().slice(0, 10),
    grund: "",
    individualBonus: "",
    individualBonusGrund: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/vorschuesse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        individualBonus: form.individualBonus ? parseFloat(form.individualBonus) : 0,
      }),
    })
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Vorschuss erfassen</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Mitarbeiter *</label>
            <select value={form.mitarbeiterId} onChange={e => setForm(f => ({ ...f, mitarbeiterId: e.target.value }))} required
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="">— wählen —</option>
              {mitarbeiter.map(m => <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Betrag (€) *</label>
              <input type="number" step="0.01" min="0" value={form.betrag} onChange={e => setForm(f => ({ ...f, betrag: e.target.value }))} required
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Datum</label>
              <input type="date" value={form.datum} onChange={e => setForm(f => ({ ...f, datum: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Grund</label>
            <input type="text" value={form.grund} onChange={e => setForm(f => ({ ...f, grund: e.target.value }))}
              placeholder="z.B. Reisekosten, Materialvorschuss..."
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          {/* Individueller Bonus (K7) */}
          <div className="border-t border-[#2a2a2a] pt-3">
            <p className="text-xs text-zinc-500 mb-3">Optionaler Bonus</p>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Individueller Bonus (€)</label>
              <input type="number" step="1" min="0" placeholder="0"
                value={form.individualBonus}
                onChange={(e) => setForm(prev => ({ ...prev, individualBonus: e.target.value }))}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="mt-3">
              <label className="text-xs text-zinc-500 mb-1 block">Grund des Bonus</label>
              <input type="text" placeholder="z.B. Schichtleitung, Erschwernis..."
                value={form.individualBonusGrund}
                onChange={(e) => setForm(prev => ({ ...prev, individualBonusGrund: e.target.value }))}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all">Abbrechen</button>
            <button type="submit" disabled={loading || !form.mitarbeiterId || !form.betrag} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Haupt-Seite ──────────────────────────────────────────────────────────────

export default function LohnPage() {
  const now = new Date()
  const [activeTab, setActiveTab] = useState<"abrechnungen" | "vorschuesse" | "lohnuebersicht">("abrechnungen")
  const [monat, setMonat] = useState(now.getMonth() + 1)
  const [jahr, setJahr] = useState(now.getFullYear())
  const [eintraege, setEintraege] = useState<Lohneintrag[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState<"abrechnung" | "vorschuss" | null>(null)
  const [vorschuesse, setVorschuesse] = useState<Vorschuss[]>([])
  const [vorschuesseLoading, setVorschuesseLoading] = useState(false)

  // K3: Gruppen-Filter für Vorschüsse
  const [gruppen, setGruppen] = useState<Gruppe[]>([])
  const [gruppenFilter, setGruppenFilter] = useState<string>("")

  // K1: Lohnübersicht
  const [lohnBerechnung, setLohnBerechnung] = useState<LohnBerechnung[]>([])
  const [lohnBerechnungLoading, setLohnBerechnungLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [e, ma] = await Promise.all([
      fetch(`/api/lohn?monat=${monat}&jahr=${jahr}`).then(r => r.json()),
      fetch("/api/mitarbeiter").then(r => r.json()),
    ])
    setEintraege(e)
    setMitarbeiter(ma)
    setLoading(false)
  }, [monat, jahr])

  useEffect(() => { load() }, [load])

  const loadVorschuesse = useCallback(async () => {
    setVorschuesseLoading(true)
    try {
      const [vs, gr] = await Promise.all([
        fetch("/api/vorschuesse").then(r => r.json()),
        fetch("/api/gruppen").then(r => r.json()),
      ])
      setVorschuesse(Array.isArray(vs) ? vs : [])
      setGruppen(Array.isArray(gr) ? gr : [])
    } catch {
      setVorschuesse([])
    } finally {
      setVorschuesseLoading(false)
    }
  }, [])

  const loadLohnBerechnung = useCallback(async () => {
    setLohnBerechnungLoading(true)
    try {
      const data = await fetch("/api/lohn/berechnung").then(r => r.json())
      setLohnBerechnung(Array.isArray(data) ? data : [])
    } catch {
      setLohnBerechnung([])
    } finally {
      setLohnBerechnungLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "vorschuesse") loadVorschuesse()
    if (activeTab === "lohnuebersicht") {
      loadLohnBerechnung()
      loadVorschuesse()
    }
  }, [activeTab, loadVorschuesse, loadLohnBerechnung])

  const toggleAusgezahlt = async (id: string, ausgezahlt: boolean) => {
    await fetch(`/api/lohn/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ausgezahlt: !ausgezahlt, ausgezahltAm: !ausgezahlt ? new Date().toISOString() : null }),
    })
    load()
  }

  const gesamtBrutto = eintraege.reduce((s, e) => s + e.brutto, 0)

  // K3: Gruppen-Filter für Vorschüsse
  const selectedGruppe = gruppen.find(g => g.id === gruppenFilter)
  const filteredVorschuesse = gruppenFilter && selectedGruppe
    ? vorschuesse.filter(v => {
        const mitgliederIds = selectedGruppe.mitglieder?.map(m => m.mitarbeiterId) ?? []
        return mitgliederIds.includes(v.mitarbeiter.id)
      })
    : vorschuesse

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Lohn</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {eintraege.length} Einträge · Gesamt: {gesamtBrutto.toFixed(2)} €
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "vorschuesse" && (
            <button
              onClick={() => setShowModal("vorschuss")}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Vorschuss
            </button>
          )}
          {activeTab !== "vorschuesse" && (
            <button
              onClick={() => setShowModal("abrechnung")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Abrechnung
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#161616] border border-[#2a2a2a] rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("abrechnungen")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "abrechnungen" ? "bg-[#2C3A1C] text-emerald-400" : "text-zinc-400 hover:text-white"}`}
        >
          Abrechnungen
        </button>
        <button
          onClick={() => setActiveTab("vorschuesse")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "vorschuesse" ? "bg-[#2C3A1C] text-emerald-400" : "text-zinc-400 hover:text-white"}`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          Vorschüsse
        </button>
        <button
          onClick={() => setActiveTab("lohnuebersicht")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "lohnuebersicht" ? "bg-[#2C3A1C] text-emerald-400" : "text-zinc-400 hover:text-white"}`}
        >
          <Calculator className="w-3.5 h-3.5" />
          Lohnübersicht
        </button>
      </div>

      {/* ─── Tab: Abrechnungen ───────────────────────────────────────────── */}
      {activeTab === "abrechnungen" && (
        <>
          <div className="flex gap-3 mb-6">
            <select value={monat} onChange={e => setMonat(parseInt(e.target.value))}
              className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500">
              {MONATE.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={jahr} onChange={e => setJahr(parseInt(e.target.value))}
              className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Mitarbeiter</th>
                  <th className="text-right px-4 py-3 text-zinc-500 font-medium">Stunden</th>
                  <th className="text-right px-4 py-3 text-zinc-500 font-medium">Stundenlohn</th>
                  <th className="text-right px-4 py-3 text-zinc-500 font-medium">Brutto</th>
                  <th className="text-center px-4 py-3 text-zinc-500 font-medium">Ausgezahlt</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-zinc-600">Laden...</td></tr>
                ) : eintraege.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-zinc-600">Keine Einträge für diesen Zeitraum</td></tr>
                ) : (
                  eintraege.map(e => (
                    <tr key={e.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors">
                      <td className="px-4 py-3 text-white font-medium">
                        {e.mitarbeiter.vorname} {e.mitarbeiter.nachname}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400">{e.stunden}h</td>
                      <td className="px-4 py-3 text-right text-zinc-400">{e.stundenlohn.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-right text-white font-semibold">{e.brutto.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleAusgezahlt(e.id, e.ausgezahlt)} className="transition-colors">
                          {e.ausgezahlt
                            ? <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                            : <Circle className="w-5 h-5 text-zinc-600 mx-auto hover:text-zinc-400" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {eintraege.length > 0 && (
                <tfoot>
                  <tr className="bg-[#0f0f0f]">
                    <td className="px-4 py-3 text-zinc-400 font-medium" colSpan={3}>Gesamt</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">{gesamtBrutto.toFixed(2)} €</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      {/* ─── Tab: Vorschüsse ─────────────────────────────────────────────── */}
      {activeTab === "vorschuesse" && (
        <>
          {/* K3: Gruppen-Filter */}
          <div className="mb-4">
            <select
              value={gruppenFilter}
              onChange={e => setGruppenFilter(e.target.value)}
              className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Alle Gruppen</option>
              {gruppen.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2a2a2a]">
              <p className="text-sm text-zinc-400">
                {gruppenFilter ? `Gefiltert: ${filteredVorschuesse.length} Vorschüsse` : "Alle erfassten Vorschüsse an Mitarbeiter"}
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Mitarbeiter</th>
                  <th className="text-right px-4 py-3 text-zinc-500 font-medium">Betrag</th>
                  <th className="text-right px-4 py-3 text-zinc-500 font-medium">Bonus</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Datum</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Grund</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {vorschuesseLoading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-zinc-600">Laden...</td></tr>
                ) : filteredVorschuesse.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-zinc-600">Keine Vorschüsse erfasst</td></tr>
                ) : (
                  filteredVorschuesse.map(v => (
                    <tr key={v.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors">
                      <td className="px-4 py-3 text-white font-medium">
                        {v.mitarbeiter.vorname} {v.mitarbeiter.nachname}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-400 font-semibold">
                        {(v.betrag || 0).toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-right">
                        {v.individualBonus && v.individualBonus > 0 ? (
                          <span className="text-emerald-400 font-medium" title={v.individualBonusGrund ?? undefined}>
                            +{v.individualBonus.toFixed(2)} €
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {v.datum ? new Date(v.datum).toLocaleDateString("de-DE") : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{v.grund || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          v.status === "ausgezahlt"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : v.status === "verrechnet"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {v.status || "offen"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredVorschuesse.length > 0 && (
                <tfoot>
                  <tr className="bg-[#0f0f0f]">
                    <td className="px-4 py-3 text-zinc-400 font-medium" colSpan={1}>Gesamt</td>
                    <td className="px-4 py-3 text-right text-amber-400 font-bold">
                      {filteredVorschuesse.reduce((s, v) => s + (v.betrag || 0), 0).toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">
                      {filteredVorschuesse.reduce((s, v) => s + (v.individualBonus || 0), 0) > 0
                        ? `+${filteredVorschuesse.reduce((s, v) => s + (v.individualBonus || 0), 0).toFixed(2)} €`
                        : "—"}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      {/* ─── Tab: Lohnübersicht (K1) ─────────────────────────────────────── */}
      {activeTab === "lohnuebersicht" && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
            <p className="text-sm text-zinc-400">Automatische Lohnberechnung aus Stundenbuchungen</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => exportGruppenAbrechnungCSV(selectedGruppe?.name ?? "alle", vorschuesse, lohnBerechnung)}
                disabled={lohnBerechnung.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 border border-[#2a2a2a] rounded-lg text-xs text-zinc-400 hover:text-white disabled:opacity-40 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Abrechnung exportieren
              </button>
              <button
                onClick={loadLohnBerechnung}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Aktualisieren
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Mitarbeiter</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Stunden</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Stundenlohn</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Bruttolohn</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Maschinenbonus</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Gesamt</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Buchungen</th>
              </tr>
            </thead>
            <tbody>
              {lohnBerechnungLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-zinc-600">Laden...</td></tr>
              ) : lohnBerechnung.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-zinc-600">Keine Stundenbuchungen vorhanden</td></tr>
              ) : (
                lohnBerechnung.map(m => (
                  <tr key={m.mitarbeiterId} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      {m.mitarbeiter.vorname} {m.mitarbeiter.nachname}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">{m.stunden.toFixed(1)}h</td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {m.stundenlohn ? `${m.stundenlohn.toFixed(2)} €` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-white">{m.bruttoLohn.toFixed(2)} €</td>
                    <td className="px-4 py-3 text-right">
                      {m.maschinenzuschlag > 0 ? (
                        <span className="text-emerald-400">{m.maschinenzuschlag.toFixed(2)} €</span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">{m.gesamtLohn.toFixed(2)} €</td>
                    <td className="px-4 py-3 text-right text-zinc-600">{m.eintraege}</td>
                  </tr>
                ))
              )}
            </tbody>
            {lohnBerechnung.length > 0 && (
              <tfoot>
                <tr className="bg-[#0f0f0f] border-t border-[#2a2a2a]">
                  <td className="px-4 py-3 font-bold text-zinc-300" colSpan={3}>Gesamt</td>
                  <td className="px-4 py-3 text-right font-bold text-white">
                    {lohnBerechnung.reduce((s, m) => s + m.bruttoLohn, 0).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-400">
                    {lohnBerechnung.reduce((s, m) => s + m.maschinenzuschlag, 0) > 0
                      ? `${lohnBerechnung.reduce((s, m) => s + m.maschinenzuschlag, 0).toFixed(2)} €`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-400">
                    {lohnBerechnung.reduce((s, m) => s + m.gesamtLohn, 0).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-zinc-400">
                    {lohnBerechnung.reduce((s, m) => s + m.eintraege, 0)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Modals */}
      {showModal === "abrechnung" && (
        <AbrechnungModal
          mitarbeiter={mitarbeiter}
          monat={monat}
          jahr={jahr}
          onClose={() => setShowModal(null)}
          onSave={() => { setShowModal(null); load() }}
        />
      )}
      {showModal === "vorschuss" && (
        <VorschussModal
          mitarbeiter={mitarbeiter}
          onClose={() => setShowModal(null)}
          onSave={() => { setShowModal(null); loadVorschuesse() }}
        />
      )}
    </div>
  )
}

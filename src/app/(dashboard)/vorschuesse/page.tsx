"use client"

import { useState, useEffect, useCallback } from "react"
import { DollarSign, Plus, Loader2, Check } from "lucide-react"

interface Vorschuss {
  id: string
  betrag: number
  datum: string
  grund?: string | null
  genehmigt: boolean
  zurueckgezahlt: boolean
  mitarbeiter: { id: string; vorname: string; nachname: string }
}

interface Mitarbeiter { id: string; vorname: string; nachname: string }

export default function VorschuessePage() {
  const [vorschuesse, setVorschuesse] = useState<Vorschuss[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ mitarbeiterId: "", betrag: "", grund: "", datum: new Date().toISOString().split("T")[0] })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [v, m] = await Promise.all([
      fetch("/api/vorschuesse").then((r) => r.json()),
      fetch("/api/mitarbeiter").then((r) => r.json()),
    ])
    setVorschuesse(Array.isArray(v) ? v : [])
    setMitarbeiter(Array.isArray(m) ? m : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function patch(id: string, data: Record<string, unknown>) {
    await fetch(`/api/vorschuesse/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    await fetchAll()
  }

  async function create() {
    setSaving(true)
    await fetch("/api/vorschuesse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setShowModal(false)
    setForm({ mitarbeiterId: "", betrag: "", grund: "", datum: new Date().toISOString().split("T")[0] })
    await fetchAll()
    setSaving(false)
  }

  const gesamtOffen = vorschuesse.filter((v) => !v.genehmigt).reduce((s, v) => s + v.betrag, 0)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" /> Vorschüsse
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Offene Vorschüsse: <span className="text-amber-400 font-medium">{gesamtOffen.toFixed(2)} €</span>
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> Vorschuss eintragen
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Mitarbeiter</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Betrag</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Datum</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Grund</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Genehmigt</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Zurückgezahlt</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {vorschuesse.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-600">Keine Vorschüsse</td></tr>
              ) : vorschuesse.map((v) => (
                <tr key={v.id} className="hover:bg-[#1c1c1c]">
                  <td className="px-6 py-4 text-sm text-white">{v.mitarbeiter.vorname} {v.mitarbeiter.nachname}</td>
                  <td className="px-6 py-4 text-sm font-medium text-amber-400">{v.betrag.toFixed(2)} €</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{new Date(v.datum).toLocaleDateString("de-DE")}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{v.grund ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${v.genehmigt ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {v.genehmigt ? "Ja" : "Ausstehend"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => patch(v.id, { zurueckgezahlt: !v.zurueckgezahlt })} className={`w-10 h-5 rounded-full transition-all ${v.zurueckgezahlt ? "bg-emerald-500" : "bg-zinc-700"}`} title="Toggle zurückgezahlt" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!v.genehmigt && (
                      <button onClick={() => patch(v.id, { genehmigt: true })} className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30 ml-auto">
                        <Check className="w-3 h-3" /> Genehmigen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">Vorschuss eintragen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Mitarbeiter</label>
                <select value={form.mitarbeiterId} onChange={(e) => setForm({ ...form, mitarbeiterId: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">— auswählen —</option>
                  {mitarbeiter.map((m) => <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Betrag (€)</label>
                  <input type="number" step="0.01" value={form.betrag} onChange={(e) => setForm({ ...form, betrag: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Datum</label>
                  <input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Grund</label>
                <input value={form.grund} onChange={(e) => setForm({ ...form, grund: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-[#333] text-zinc-400 text-sm hover:bg-[#222]">Abbrechen</button>
              <button onClick={create} disabled={saving || !form.mitarbeiterId || !form.betrag} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Speichern..." : "Eintragen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, X, CheckCircle, Circle } from "lucide-react"

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

const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]

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

export default function LohnPage() {
  const now = new Date()
  const [monat, setMonat] = useState(now.getMonth() + 1)
  const [jahr, setJahr] = useState(now.getFullYear())
  const [eintraege, setEintraege] = useState<Lohneintrag[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

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

  const toggleAusgezahlt = async (id: string, ausgezahlt: boolean) => {
    await fetch(`/api/lohn/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ausgezahlt: !ausgezahlt, ausgezahltAm: !ausgezahlt ? new Date().toISOString() : null }),
    })
    load()
  }

  const gesamtBrutto = eintraege.reduce((s, e) => s + e.brutto, 0)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Lohn</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {eintraege.length} Einträge · Gesamt: {gesamtBrutto.toFixed(2)} €
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Abrechnung
        </button>
      </div>

      {/* Monat/Jahr Filter */}
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

      {showModal && (
        <AbrechnungModal
          mitarbeiter={mitarbeiter}
          monat={monat}
          jahr={jahr}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}

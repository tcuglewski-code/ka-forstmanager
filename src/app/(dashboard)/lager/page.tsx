"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, X } from "lucide-react"

interface LagerArtikel {
  id: string
  name: string
  kategorie: string
  einheit: string
  bestand: number
  mindestbestand: number
  lagerort?: string | null
  artikelnummer?: string | null
}

function Ampel({ bestand, mindestbestand }: { bestand: number; mindestbestand: number }) {
  if (bestand < mindestbestand) return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" title="Unterbestand" />
  if (bestand < mindestbestand * 2) return <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" title="Niedrig" />
  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" title="OK" />
}

function ArtikelModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", kategorie: "material", einheit: "Stück", bestand: "0", mindestbestand: "0", lagerort: "", artikelnummer: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/lager", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Neuer Artikel</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[["Name *", "name", "text"], ["Lagerort", "lagerort", "text"], ["Artikelnummer", "artikelnummer", "text"]].map(([label, key, type]) => (
            <div key={key}>
              <label className="block text-xs text-zinc-400 mb-1">{label}</label>
              <input type={type} value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Kategorie</label>
              <select value={form.kategorie} onChange={e => setForm(f => ({ ...f, kategorie: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                {["material", "werkzeug", "pflanzgut", "schutz", "chemie", "sonstiges"].map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Einheit</label>
              <input type="text" value={form.einheit} onChange={e => setForm(f => ({ ...f, einheit: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Bestand</label>
              <input type="number" value={form.bestand} onChange={e => setForm(f => ({ ...f, bestand: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Mindestbestand</label>
              <input type="number" value={form.mindestbestand} onChange={e => setForm(f => ({ ...f, mindestbestand: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all">Abbrechen</button>
            <button type="submit" disabled={loading || !form.name} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BuchungModal({ artikel, onClose, onSave }: { artikel: LagerArtikel; onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ typ: "eingang", menge: "1", notiz: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch(`/api/lager/${artikel.id}/bewegung`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Buchung: {artikel.name}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Typ</label>
            <select value={form.typ} onChange={e => setForm(f => ({ ...f, typ: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="eingang">Eingang (+)</option>
              <option value="ausgang">Ausgang (-)</option>
              <option value="korrektur">Korrektur</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Menge ({artikel.einheit})</label>
            <input type="number" min="0.01" step="0.01" value={form.menge} onChange={e => setForm(f => ({ ...f, menge: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notiz</label>
            <input type="text" value={form.notiz} onChange={e => setForm(f => ({ ...f, notiz: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all">Abbrechen</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {loading ? "Buchen..." : "Buchen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LagerPage() {
  const [artikel, setArtikel] = useState<LagerArtikel[]>([])
  const [loading, setLoading] = useState(true)
  const [showArtikelModal, setShowArtikelModal] = useState(false)
  const [buchungArtikel, setBuchungArtikel] = useState<LagerArtikel | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/lager")
    setArtikel(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const unterMindest = artikel.filter(a => a.bestand < a.mindestbestand).length

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Lager</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {artikel.length} Artikel
            {unterMindest > 0 && <span className="ml-2 text-red-400">• {unterMindest} unter Mindestbestand</span>}
          </p>
        </div>
        <button
          onClick={() => setShowArtikelModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Artikel
        </button>
      </div>

      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium w-6"></th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Kategorie</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium">Bestand</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium">Mindest</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Lagerort</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-zinc-600">Laden...</td></tr>
            ) : artikel.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-zinc-600">Keine Artikel vorhanden</td></tr>
            ) : (
              artikel.map(a => (
                <tr key={a.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors">
                  <td className="px-4 py-3"><Ampel bestand={a.bestand} mindestbestand={a.mindestbestand} /></td>
                  <td className="px-4 py-3 text-white font-medium">{a.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-[#2a2a2a] text-zinc-400">{a.kategorie}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-white">{a.bestand} {a.einheit}</td>
                  <td className="px-4 py-3 text-right text-zinc-500">{a.mindestbestand} {a.einheit}</td>
                  <td className="px-4 py-3 text-zinc-500">{a.lagerort ?? "–"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setBuchungArtikel(a)}
                      className="px-3 py-1 rounded-lg text-xs bg-[#1e1e1e] text-zinc-400 hover:text-white hover:bg-[#2a2a2a] transition-all"
                    >
                      Buchen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showArtikelModal && (
        <ArtikelModal onClose={() => setShowArtikelModal(false)} onSave={() => { setShowArtikelModal(false); load() }} />
      )}
      {buchungArtikel && (
        <BuchungModal artikel={buchungArtikel} onClose={() => setBuchungArtikel(null)} onSave={() => { setBuchungArtikel(null); load() }} />
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, X, Car, Truck, Wrench, Tractor } from "lucide-react"

interface Fahrzeug {
  id: string
  typ: string
  bezeichnung: string
  kennzeichen?: string | null
  baujahr?: number | null
  status: string
  tuvDatum?: string | null
  naechsteWartung?: string | null
  notizen?: string | null
}
interface Geraet {
  id: string
  typ: string
  bezeichnung: string
  seriennummer?: string | null
  status: string
  naechsteWartung?: string | null
}

const STATUS_FARBEN: Record<string, string> = {
  verfuegbar: "bg-emerald-500/20 text-emerald-400",
  im_einsatz: "bg-amber-500/20 text-amber-400",
  in_wartung: "bg-blue-500/20 text-blue-400",
  defekt: "bg-red-500/20 text-red-400",
}

const TypIcon = ({ typ }: { typ: string }) => {
  if (typ === "lkw") return <Truck className="w-4 h-4" />
  if (typ === "maschine") return <Tractor className="w-4 h-4" />
  return <Car className="w-4 h-4" />
}

function FahrzeugModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ typ: "pkw", bezeichnung: "", kennzeichen: "", baujahr: "", status: "verfuegbar", tuvDatum: "", notizen: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/fuhrpark", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Neues Fahrzeug</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Typ</label>
              <select value={form.typ} onChange={e => setForm(f => ({ ...f, typ: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                {["pkw", "lkw", "transporter", "maschine"].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                {["verfuegbar", "im_einsatz", "in_wartung", "defekt"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {[["Bezeichnung *", "bezeichnung"], ["Kennzeichen", "kennzeichen"], ["Baujahr", "baujahr"]].map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs text-zinc-400 mb-1">{label}</label>
              <input type={key === "baujahr" ? "number" : "text"} value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">TÜV-Datum</label>
            <input type="date" value={form.tuvDatum} onChange={e => setForm(f => ({ ...f, tuvDatum: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all">Abbrechen</button>
            <button type="submit" disabled={loading || !form.bezeichnung} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GeraetModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ typ: "", bezeichnung: "", seriennummer: "", status: "verfuegbar", naechsteWartung: "", notizen: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/geraete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Neues Gerät</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[["Typ *", "typ"], ["Bezeichnung *", "bezeichnung"], ["Seriennummer", "seriennummer"]].map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs text-zinc-400 mb-1">{label}</label>
              <input type="text" value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nächste Wartung</label>
            <input type="date" value={form.naechsteWartung} onChange={e => setForm(f => ({ ...f, naechsteWartung: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all">Abbrechen</button>
            <button type="submit" disabled={loading || !form.bezeichnung || !form.typ} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FuhrparkPage() {
  const [tab, setTab] = useState<"fahrzeuge" | "geraete">("fahrzeuge")
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [geraete, setGeraete] = useState<Geraet[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<"fahrzeug" | "geraet" | null>(null)
  const heute = new Date()

  const load = useCallback(async () => {
    setLoading(true)
    const [f, g] = await Promise.all([
      fetch("/api/fuhrpark").then(r => r.json()),
      fetch("/api/geraete").then(r => r.json()),
    ])
    setFahrzeuge(f)
    setGeraete(g)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const isTuvUeberfaellig = (datum: string | null | undefined) => datum && new Date(datum) < heute

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Fuhrpark & Geräte</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{fahrzeuge.length} Fahrzeuge · {geraete.length} Geräte</p>
        </div>
        <button
          onClick={() => setModal(tab === "fahrzeuge" ? "fahrzeug" : "geraet")}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          {tab === "fahrzeuge" ? "Fahrzeug" : "Gerät"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0f0f0f] rounded-lg p-1 mb-6 w-fit">
        {(["fahrzeuge", "geraete"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t ? "bg-[#2C3A1C] text-emerald-400" : "text-zinc-500 hover:text-white"}`}>
            {t === "fahrzeuge" ? "Fahrzeuge" : "Geräte"}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-16 text-zinc-600">Laden...</div> : (
        tab === "fahrzeuge" ? (
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Typ</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Bezeichnung</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Kennzeichen</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">TÜV</th>
                </tr>
              </thead>
              <tbody>
                {fahrzeuge.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-zinc-600">Keine Fahrzeuge</td></tr>
                ) : fahrzeuge.map(f => (
                  <tr key={f.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors cursor-default">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <TypIcon typ={f.typ} />
                        <span className="uppercase text-xs">{f.typ}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{f.bezeichnung}</td>
                    <td className="px-4 py-3 text-zinc-400">{f.kennzeichen ?? "–"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_FARBEN[f.status] ?? "bg-zinc-700 text-zinc-300"}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {f.tuvDatum ? (
                        <span className={isTuvUeberfaellig(f.tuvDatum) ? "text-red-400" : "text-zinc-400"}>
                          {new Date(f.tuvDatum).toLocaleDateString("de-DE")}
                          {isTuvUeberfaellig(f.tuvDatum) && " ⚠️"}
                        </span>
                      ) : <span className="text-zinc-600">–</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Bezeichnung</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Typ</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Nächste Wartung</th>
                </tr>
              </thead>
              <tbody>
                {geraete.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-zinc-600">Keine Geräte</td></tr>
                ) : geraete.map(g => (
                  <tr key={g.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors cursor-default">
                    <td className="px-4 py-3 text-white font-medium">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-zinc-500" />
                        {g.bezeichnung}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{g.typ}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_FARBEN[g.status] ?? "bg-zinc-700 text-zinc-300"}`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {g.naechsteWartung ? (
                        <span className={new Date(g.naechsteWartung) < heute ? "text-amber-400" : "text-zinc-400"}>
                          {new Date(g.naechsteWartung).toLocaleDateString("de-DE")}
                        </span>
                      ) : <span className="text-zinc-600">–</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {modal === "fahrzeug" && (
        <FahrzeugModal onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />
      )}
      {modal === "geraet" && (
        <GeraetModal onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />
      )}
    </div>
  )
}

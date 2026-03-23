"use client"

import { useState, useEffect, useCallback } from "react"
import { ClipboardList, Plus, Loader2, Cloud, Camera } from "lucide-react"

interface Protokoll {
  id: string
  datum: string
  gruppeId?: string | null
  ersteller?: string | null
  bericht?: string | null
  gepflanzt?: number | null
  witterung?: string | null
  fotos?: string | null
  auftrag?: { id: string; titel: string } | null
}

interface Auftrag { id: string; titel: string }
interface Gruppe { id: string; name: string }

export default function ProtokolleSeite() {
  const [protokolle, setProtokolle] = useState<Protokoll[]>([])
  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [gruppen, setGruppen] = useState<Gruppe[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAuftrag, setFilterAuftrag] = useState("")
  const [filterGruppe, setFilterGruppe] = useState("")
  const [filterVon, setFilterVon] = useState("")
  const [filterBis, setFilterBis] = useState("")
  const [selectedProtokoll, setSelectedProtokoll] = useState<Protokoll | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ auftragId: "", gruppeId: "", datum: new Date().toISOString().split("T")[0], ersteller: "", bericht: "", gepflanzt: "", witterung: "sonnig", fotos: "" })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterAuftrag) params.set("auftragId", filterAuftrag)
    if (filterGruppe) params.set("gruppeId", filterGruppe)
    if (filterVon) params.set("von", filterVon)
    if (filterBis) params.set("bis", filterBis)
    const [p, a, g] = await Promise.all([
      fetch(`/api/protokolle?${params}`).then((r) => r.json()),
      fetch("/api/auftraege").then((r) => r.json()),
      fetch("/api/gruppen").then((r) => r.json()),
    ])
    setProtokolle(Array.isArray(p) ? p : [])
    setAuftraege(Array.isArray(a) ? a : [])
    setGruppen(Array.isArray(g) ? g : [])
    setLoading(false)
  }, [filterAuftrag, filterGruppe, filterVon, filterBis])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function create() {
    setSaving(true)
    await fetch("/api/protokolle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setShowModal(false)
    setForm({ auftragId: "", gruppeId: "", datum: new Date().toISOString().split("T")[0], ersteller: "", bericht: "", gepflanzt: "", witterung: "sonnig", fotos: "" })
    await fetchAll()
    setSaving(false)
  }

  const fotoUrls = (fotos?: string | null) => {
    if (!fotos) return []
    try { return JSON.parse(fotos) } catch { return fotos.split(",").map((f) => f.trim()) }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-400" /> Tagesprotokolle
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Tagesberichte und Pflanzprotokolle</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> Protokoll erstellen
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterAuftrag} onChange={(e) => setFilterAuftrag(e.target.value)} className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white">
          <option value="">Alle Aufträge</option>
          {auftraege.map((a) => <option key={a.id} value={a.id}>{a.titel}</option>)}
        </select>
        <select value={filterGruppe} onChange={(e) => setFilterGruppe(e.target.value)} className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white">
          <option value="">Alle Gruppen</option>
          {gruppen.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input type="date" value={filterVon} onChange={(e) => setFilterVon(e.target.value)} placeholder="Von" className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white" />
        <input type="date" value={filterBis} onChange={(e) => setFilterBis(e.target.value)} placeholder="Bis" className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Datum</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Auftrag</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Ersteller</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Gepflanzt</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Witterung</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Fotos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {protokolle.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-600">Keine Protokolle</td></tr>
              ) : protokolle.map((p) => (
                <tr key={p.id} className="hover:bg-[#1c1c1c] cursor-pointer" onClick={() => setSelectedProtokoll(selectedProtokoll?.id === p.id ? null : p)}>
                  <td className="px-6 py-4 text-sm text-white">{new Date(p.datum).toLocaleDateString("de-DE")}</td>
                  <td className="px-6 py-4 text-sm text-zinc-300">{p.auftrag?.titel ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{p.ersteller ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-emerald-400 font-medium">{p.gepflanzt != null ? `${(p.gepflanzt as number).toLocaleString()} Stk.` : "—"}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">
                    {p.witterung && (
                      <span className="flex items-center gap-1"><Cloud className="w-3 h-3" /> {p.witterung}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">
                    {fotoUrls(p.fotos).length > 0 ? (
                      <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> {fotoUrls(p.fotos).length}</span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Panel */}
      {selectedProtokoll && (
        <div className="mt-4 bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <h3 className="font-semibold text-white mb-3">
            Protokoll vom {new Date(selectedProtokoll.datum).toLocaleDateString("de-DE")}
          </h3>
          {selectedProtokoll.bericht && (
            <p className="text-sm text-zinc-300 mb-4 whitespace-pre-wrap">{selectedProtokoll.bericht}</p>
          )}
          {fotoUrls(selectedProtokoll.fotos).length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Fotos:</p>
              <div className="flex flex-wrap gap-2">
                {fotoUrls(selectedProtokoll.fotos).map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`Foto ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-[#333] hover:border-emerald-500/50 transition-all" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Protokoll erstellen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Auftrag</label>
                <select value={form.auftragId} onChange={(e) => setForm({ ...form, auftragId: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">— kein Auftrag —</option>
                  {auftraege.map((a) => <option key={a.id} value={a.id}>{a.titel}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Datum</label>
                  <input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Gepflanzt (Stk.)</label>
                  <input type="number" value={form.gepflanzt} onChange={(e) => setForm({ ...form, gepflanzt: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Ersteller</label>
                  <input value={form.ersteller} onChange={(e) => setForm({ ...form, ersteller: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Witterung</label>
                  <select value={form.witterung} onChange={(e) => setForm({ ...form, witterung: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                    <option value="sonnig">Sonnig</option>
                    <option value="bewoelkt">Bewölkt</option>
                    <option value="regen">Regen</option>
                    <option value="sturm">Sturm</option>
                    <option value="schnee">Schnee</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Bericht</label>
                <textarea value={form.bericht} onChange={(e) => setForm({ ...form, bericht: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" rows={3} />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Fotos (URLs kommasepariert)</label>
                <input value={form.fotos} onChange={(e) => setForm({ ...form, fotos: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-[#333] text-zinc-400 text-sm hover:bg-[#222]">Abbrechen</button>
              <button onClick={create} disabled={saving} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Speichern..." : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

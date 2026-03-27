"use client"

import { useState, useEffect, useCallback } from "react"
import { FileText, Plus, Loader2, Download, Trash2, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface Dokument {
  id: string
  name: string
  typ: string
  url: string | null
  createdAt: string
  hochgeladenVon?: string | null
  auftrag?: { id: string; titel: string } | null
  saison?: { id: string; name: string } | null
}

interface Auftrag { id: string; titel: string }
interface Saison { id: string; name: string }

const typBadge: Record<string, string> = {
  foto: "bg-purple-500/20 text-purple-400",
  karte: "bg-blue-500/20 text-blue-400",
  protokoll: "bg-amber-500/20 text-amber-400",
  foerderantrag: "bg-emerald-500/20 text-emerald-400",
  rechnung: "bg-red-500/20 text-red-400",
  sonstiges: "bg-zinc-700/50 text-zinc-400",
}

const typLabel: Record<string, string> = {
  foto: "Foto",
  karte: "Karte",
  protokoll: "Protokoll",
  foerderantrag: "Förderantrag",
  rechnung: "Rechnung",
  sonstiges: "Sonstiges",
}

export default function DokumentePage() {
  const [dokumente, setDokumente] = useState<Dokument[]>([])
  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [saisons, setSaisons] = useState<Saison[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTyp, setFilterTyp] = useState("")
  const [filterAuftrag, setFilterAuftrag] = useState("")
  const [filterSaison, setFilterSaison] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", typ: "sonstiges", url: "", auftragId: "", saisonId: "" })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterTyp) params.set("typ", filterTyp)
    if (filterAuftrag) params.set("auftragId", filterAuftrag)
    if (filterSaison) params.set("saisonId", filterSaison)
    const [d, a, s] = await Promise.all([
      fetch(`/api/dokumente?${params}`).then((r) => r.json()),
      fetch("/api/auftraege").then((r) => r.json()),
      fetch("/api/saisons").then((r) => r.json()),
    ])
    setDokumente(Array.isArray(d) ? d : [])
    setAuftraege(Array.isArray(a) ? a : [])
    setSaisons(Array.isArray(s) ? s : [])
    setLoading(false)
  }, [filterTyp, filterAuftrag, filterSaison])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function upload() {
    setSaving(true)
    try {
      const res = await fetch("/api/dokumente", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (res.ok) {
        toast.success("Erfolgreich gespeichert")
      } else {
        toast.error("Fehler beim Hochladen")
      }
      setShowModal(false)
      setForm({ name: "", typ: "sonstiges", url: "", auftragId: "", saisonId: "" })
      await fetchAll()
    } catch (e: unknown) {
      toast.error("Fehler: " + (e instanceof Error ? e.message : String(e)))
    }
    setSaving(false)
  }

  async function deleteDok(id: string) {
    if (!confirm("Dokument löschen?")) return
    try {
      await fetch(`/api/dokumente/${id}`, { method: "DELETE" })
      toast.success("Gelöscht")
      await fetchAll()
    } catch (e: unknown) {
      toast.error("Fehler: " + (e instanceof Error ? e.message : String(e)))
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" /> Dokumente
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Fotos, Karten, Protokolle und Förderanträge</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> Dokument hochladen
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterTyp} onChange={(e) => setFilterTyp(e.target.value)} className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white">
          <option value="">Alle Typen</option>
          {Object.keys(typLabel).map((t) => <option key={t} value={t}>{typLabel[t]}</option>)}
        </select>
        <select value={filterAuftrag} onChange={(e) => setFilterAuftrag(e.target.value)} className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white">
          <option value="">Alle Aufträge</option>
          {auftraege.map((a) => <option key={a.id} value={a.id}>{a.titel}</option>)}
        </select>
        <select value={filterSaison} onChange={(e) => setFilterSaison(e.target.value)} className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white">
          <option value="">Alle Saisons</option>
          {saisons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Typ</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Zuordnung</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Hochgeladen</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Von</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {dokumente.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-600">Keine Dokumente</td></tr>
              ) : dokumente.map((d) => (
                <tr key={d.id} className="hover:bg-[#1c1c1c]">
                  <td className="px-6 py-4 text-sm text-white">{d.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${typBadge[d.typ] ?? "bg-zinc-700 text-zinc-400"}`}>
                      {typLabel[d.typ] ?? d.typ}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">
                    {d.auftrag?.titel ?? d.saison?.name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{new Date(d.createdAt).toLocaleDateString("de-DE")}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{d.hochgeladenVon ?? "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <a href={d.url ?? ""} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-emerald-400 transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button onClick={() => deleteDok(d.id)} className="text-zinc-600 hover:text-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Dokument hochladen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Typ</label>
                <select value={form.typ} onChange={(e) => setForm({ ...form, typ: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                  {Object.entries(typLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">URL / Link</label>
                <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Auftrag (optional)</label>
                <select value={form.auftragId} onChange={(e) => setForm({ ...form, auftragId: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">— kein Auftrag —</option>
                  {auftraege.map((a) => <option key={a.id} value={a.id}>{a.titel}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Saison (optional)</label>
                <select value={form.saisonId} onChange={(e) => setForm({ ...form, saisonId: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">— keine Saison —</option>
                  {saisons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-[#333] text-zinc-400 text-sm hover:bg-[#222]">Abbrechen</button>
              <button onClick={upload} disabled={saving || !form.name || !form.url} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Speichern..." : "Hochladen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

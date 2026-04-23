"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckSquare, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Abnahme {
  id: string
  datum: string
  foersterId?: string | null
  status: string
  notizen?: string | null
  signaturUrl?: string | null
  auftrag: { id: string; titel: string }
}

interface Auftrag { id: string; titel: string }

const statusBadge: Record<string, string> = {
  offen: "bg-blue-100 text-blue-800",
  bestanden: "bg-emerald-100 text-emerald-800",
  nicht_bestanden: "bg-red-100 text-red-800",
}

const statusLabel: Record<string, string> = {
  offen: "Offen",
  bestanden: "Bestanden",
  nicht_bestanden: "Nicht bestanden",
}

export default function AbnahmenPage() {
  const [abnahmen, setAbnahmen] = useState<Abnahme[]>([])
  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("")
  const [filterAuftrag, setFilterAuftrag] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [selectedAbnahme, setSelectedAbnahme] = useState<Abnahme | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ auftragId: "", datum: new Date().toISOString().split("T")[0], foersterId: "", status: "offen", notizen: "" })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set("status", filterStatus)
    if (filterAuftrag) params.set("auftragId", filterAuftrag)
    const [a, au] = await Promise.all([
      fetch(`/api/abnahmen?${params}`).then((r) => r.json()),
      fetch("/api/auftraege").then((r) => r.json()),
    ])
    setAbnahmen(Array.isArray(a) ? a : [])
    setAuftraege(Array.isArray(au) ? au : [])
    setLoading(false)
  }, [filterStatus, filterAuftrag])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function create() {
    setSaving(true)
    try {
      const res = await fetch("/api/abnahmen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (res.ok) {
        toast.success("Erfolgreich gespeichert")
      } else {
        toast.error("Fehler beim Erstellen der Abnahme")
      }
      setShowModal(false)
      setForm({ auftragId: "", datum: new Date().toISOString().split("T")[0], foersterId: "", status: "offen", notizen: "" })
      await fetchAll()
    } catch (e: unknown) {
      toast.error("Fehler: " + (e instanceof Error ? e.message : String(e)))
    }
    setSaving(false)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-emerald-400" /> Abnahmen
          </h1>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">Forstliche Abnahmen und Protokolle</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> Abnahme erstellen
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-[var(--color-surface-container)] border border-border rounded-lg px-3 py-2 text-sm text-white">
          <option value="">Alle Status</option>
          <option value="offen">Offen</option>
          <option value="bestanden">Bestanden</option>
          <option value="nicht_bestanden">Nicht bestanden</option>
        </select>
        <select value={filterAuftrag} onChange={(e) => setFilterAuftrag(e.target.value)} className="bg-[var(--color-surface-container)] border border-border rounded-lg px-3 py-2 text-sm text-white">
          <option value="">Alle Aufträge</option>
          {auftraege.map((a) => <option key={a.id} value={a.id}>{a.titel}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="bg-[var(--color-surface-container)] border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider">Auftrag</th>
                <th className="text-left px-6 py-3 text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider">Datum</th>
                <th className="text-left px-6 py-3 text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider">Förster</th>
                <th className="text-left px-6 py-3 text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider">Signatur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {abnahmen.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-600">Keine Abnahmen</td></tr>
              ) : abnahmen.map((a) => (
                <tr key={a.id} className="hover:bg-[#1c1c1c] cursor-pointer" onClick={() => setSelectedAbnahme(selectedAbnahme?.id === a.id ? null : a)}>
                  <td className="px-6 py-4 text-sm text-white">{a.auftrag.titel}</td>
                  <td className="px-6 py-4 text-sm text-[var(--color-on-surface-variant)]">{new Date(a.datum).toLocaleDateString("de-DE")}</td>
                  <td className="px-6 py-4 text-sm text-[var(--color-on-surface-variant)]">{a.foersterId ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[a.status] ?? "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]"}`}>
                      {statusLabel[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={a.signaturUrl ? "text-emerald-400" : "text-zinc-600"}>
                      {a.signaturUrl ? "✓ Ja" : "Nein"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedAbnahme && (
        <div className="mt-4 bg-[var(--color-surface-container)] border border-border rounded-xl p-6">
          <h3 className="font-semibold text-white mb-3">Details: {selectedAbnahme.auftrag.titel}</h3>
          <p className="text-sm text-[var(--color-on-surface-variant)] mb-2"><span className="text-[var(--color-on-surface-variant)]">Notizen:</span> {selectedAbnahme.notizen ?? "—"}</p>
          {selectedAbnahme.signaturUrl && (
            <div>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-1">Signatur:</p>
              <img src={selectedAbnahme.signaturUrl} alt="Signatur" className="max-h-32 border border-border rounded-lg" />
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-container-lowest)] border border-border rounded-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Abnahme erstellen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Auftrag</label>
                <select value={form.auftragId} onChange={(e) => setForm({ ...form, auftragId: e.target.value })} className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">— auswählen —</option>
                  {auftraege.map((a) => <option key={a.id} value={a.id}>{a.titel}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Datum</label>
                  <input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-white">
                    <option value="offen">Offen</option>
                    <option value="bestanden">Bestanden</option>
                    <option value="nicht_bestanden">Nicht bestanden</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Förster Name</label>
                <input value={form.foersterId} onChange={(e) => setForm({ ...form, foersterId: e.target.value })} className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Notizen</label>
                <textarea value={form.notizen} onChange={(e) => setForm({ ...form, notizen: e.target.value })} className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-white" rows={3} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-[var(--color-on-surface-variant)] text-sm hover:bg-[#222]">Abbrechen</button>
              <button onClick={create} disabled={saving || !form.auftragId} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Speichern..." : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

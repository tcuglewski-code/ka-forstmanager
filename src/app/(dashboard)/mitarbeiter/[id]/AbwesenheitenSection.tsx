"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"

interface Abwesenheit {
  id: string
  von: string
  bis: string
  typ: string
  genehmigt: boolean
  notiz?: string | null
}

interface Props {
  mitarbeiterId: string
  initialAbwesenheiten: Abwesenheit[]
}

const typLabel: Record<string, string> = {
  urlaub: "Urlaub",
  krank: "Krankheit",
  schlechtwetter: "Schlechtwetter",
  sonderurlaub: "Sonderurlaub",
  unbezahlt: "Unbezahlt",
  sonstiges: "Sonstiges",
}

export function AbwesenheitenSection({ mitarbeiterId, initialAbwesenheiten }: Props) {
  const [abwesenheiten, setAbwesenheiten] = useState<Abwesenheit[]>(initialAbwesenheiten)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    von: "",
    bis: "",
    typ: "krank",
    notiz: "",
  })

  async function save() {
    if (!form.von || !form.bis) return
    setSaving(true)
    try {
      const res = await fetch("/api/abwesenheiten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mitarbeiterId, ...form }),
      })
      if (res.ok) {
        const data = await res.json()
        setAbwesenheiten((prev) => [data, ...prev])
        setShowModal(false)
        setForm({ von: "", bis: "", typ: "krank", notiz: "" })
      }
    } finally {
      setSaving(false)
    }
  }

  async function genehmigen(id: string, current: boolean) {
    await fetch(`/api/abwesenheiten/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genehmigt: !current }),
    })
    setAbwesenheiten((prev) =>
      prev.map((a) => (a.id === id ? { ...a, genehmigt: !current } : a))
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-zinc-500">{abwesenheiten.length} Einträge</span>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#1a1a1a] border border-[#333] text-zinc-400 hover:text-white rounded-lg transition-colors"
        >
          <Plus className="w-3 h-3" />
          Abwesenheit eintragen
        </button>
      </div>

      {abwesenheiten.length === 0 ? (
        <p className="text-zinc-600 text-sm">Keine Abwesenheiten</p>
      ) : (
        <div className="space-y-2">
          {abwesenheiten.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-0">
              <div>
                <p className="text-sm text-white">{typLabel[a.typ] ?? a.typ}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(a.von).toLocaleDateString("de-DE")} – {new Date(a.bis).toLocaleDateString("de-DE")}
                  {a.notiz && <span className="ml-2 text-zinc-600">· {a.notiz}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${a.genehmigt ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {a.genehmigt ? "Genehmigt" : "Ausstehend"}
                </span>
                {!a.genehmigt && (
                  <button
                    onClick={() => genehmigen(a.id, a.genehmigt)}
                    className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors"
                  >
                    Genehmigen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Abwesenheit eintragen</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Typ</label>
                <select
                  value={form.typ}
                  onChange={(e) => setForm({ ...form, typ: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="urlaub">Urlaub</option>
                  <option value="krank">Krankheit</option>
                  <option value="schlechtwetter">Schlechtwetter</option>
                  <option value="sonderurlaub">Sonderurlaub</option>
                  <option value="unbezahlt">Unbezahlt</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Von *</label>
                  <input
                    type="date"
                    value={form.von}
                    onChange={(e) => setForm({ ...form, von: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Bis *</label>
                  <input
                    type="date"
                    value={form.bis}
                    onChange={(e) => setForm({ ...form, bis: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Notiz (optional)</label>
                <input
                  value={form.notiz}
                  onChange={(e) => setForm({ ...form, notiz: e.target.value })}
                  placeholder="z.B. Arbeitsunfähigkeitsbescheinigung eingereicht"
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 px-3 py-2 rounded-lg border border-[#333] text-zinc-400 text-sm hover:bg-[#222]">
                Abbrechen
              </button>
              <button
                onClick={save}
                disabled={saving || !form.von || !form.bis}
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Speichern..." : "Eintragen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

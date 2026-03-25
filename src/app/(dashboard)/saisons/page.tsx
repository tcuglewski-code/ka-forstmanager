"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2, Sprout, Calendar, Pencil, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"

interface Saison {
  id: string
  name: string
  typ: string
  status: string
  startDatum?: string | null
  endDatum?: string | null
  beschreibung?: string | null
  ziel?: string | null
}

const typLabel: Record<string, string> = {
  pflanzung: "Pflanzung",
  ernte: "Ernte",
  pflege: "Pflege",
  allgemein: "Allgemein",
}

const statusBadge: Record<string, string> = {
  planung: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  aktiv: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  abgeschlossen: "bg-zinc-700/50 text-zinc-400 border-zinc-600/30",
}

const typIcon: Record<string, string> = {
  pflanzung: "🌱",
  ernte: "🌾",
  pflege: "✂️",
  allgemein: "📋",
}

const defaultForm = {
  name: "",
  typ: "pflanzung",
  status: "planung",
  startDatum: "",
  endDatum: "",
  beschreibung: "",
  ziel: "",
}

export default function SaisonsPage() {
  const [saisons, setSaisons] = useState<Saison[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Saison | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchSaisons = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/saisons")
      const data = await res.json()
      setSaisons(data)
    } catch {
      setSaisons([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSaisons()
  }, [])

  const openCreate = () => {
    setEditItem(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (e: React.MouseEvent, s: Saison) => {
    e.stopPropagation()
    e.preventDefault()
    setEditItem(s)
    setForm({
      name: s.name,
      typ: s.typ,
      status: s.status,
      startDatum: s.startDatum ? s.startDatum.split("T")[0] : "",
      endDatum: s.endDatum ? s.endDatum.split("T")[0] : "",
      beschreibung: s.beschreibung || "",
      ziel: s.ziel || "",
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        startDatum: form.startDatum ? new Date(form.startDatum).toISOString() : null,
        endDatum: form.endDatum ? new Date(form.endDatum).toISOString() : null,
      }
      if (editItem) {
        await fetch(`/api/saisons/${editItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        toast.success("Saison aktualisiert")
      } else {
        await fetch("/api/saisons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        toast.success("Saison erfolgreich angelegt")
      }
      setModalOpen(false)
      await fetchSaisons()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
      toast.error("Fehler: " + msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm("Saison wirklich löschen?")) return
    setDeleting(id)
    try {
      await fetch(`/api/saisons/${id}`, { method: "DELETE" })
      toast.success("Saison gelöscht")
      await fetchSaisons()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler"
      toast.error("Fehler: " + msg)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Saisons</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{saisons.length} Saisons</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2C3A1C] hover:bg-[#3a4d26] text-white text-sm font-medium rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Neue Saison
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      ) : saisons.length === 0 ? (
        <div className="text-center py-16 bg-[#161616] border border-[#2a2a2a] rounded-xl">
          <Sprout className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Noch keine Saisons angelegt</p>
          <p className="text-zinc-600 text-sm mt-1">Erstellen Sie die erste Saison</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {saisons.map((s) => (
            /* W1: Karte als Link zur Detailseite */
            <Link
              key={s.id}
              href={`/saisons/${s.id}`}
              className="block bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 hover:border-emerald-700/50 hover:bg-[#1a1a1a] transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{typIcon[s.typ] || "📋"}</span>
                  <div>
                    <h3 className="font-semibold text-white">{s.name}</h3>
                    <p className="text-xs text-zinc-500">{typLabel[s.typ] || s.typ}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs border",
                    statusBadge[s.status] || "bg-zinc-700/50 text-zinc-400 border-zinc-600/30"
                  )}
                >
                  {s.status}
                </span>
              </div>

              {(s.startDatum || s.endDatum) && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {s.startDatum
                      ? new Date(s.startDatum).toLocaleDateString("de-DE")
                      : "?"}{" "}
                    →{" "}
                    {s.endDatum
                      ? new Date(s.endDatum).toLocaleDateString("de-DE")
                      : "?"}
                  </span>
                </div>
              )}

              {s.beschreibung && (
                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{s.beschreibung}</p>
              )}

              {/* Buttons mit stopPropagation damit Klick nicht zur Detailseite navigiert */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#2a2a2a]">
                <button
                  onClick={(e) => openEdit(e, s)}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#2a2a2a]"
                >
                  <Pencil className="w-3 h-3" />
                  Bearbeiten
                </button>
                <button
                  onClick={(e) => handleDelete(e, s.id)}
                  disabled={deleting === s.id}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10 ml-auto disabled:opacity-50"
                >
                  {deleting === s.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Löschen
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-[#161616] border border-[#2a2a2a] rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
              <h2 className="text-lg font-semibold text-white">
                {editItem ? "Saison bearbeiten" : "Neue Saison"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-[#1e1e1e] hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="z.B. Pflanzung Frühjahr 2026"
                  className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Typ</label>
                  <select
                    value={form.typ}
                    onChange={(e) => setForm((f) => ({ ...f, typ: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  >
                    <option value="pflanzung">Pflanzung</option>
                    <option value="ernte">Ernte</option>
                    <option value="pflege">Pflege</option>
                    <option value="allgemein">Allgemein</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  >
                    <option value="planung">Planung</option>
                    <option value="aktiv">Aktiv</option>
                    <option value="abgeschlossen">Abgeschlossen</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Start</label>
                  <input
                    type="date"
                    value={form.startDatum}
                    onChange={(e) => setForm((f) => ({ ...f, startDatum: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Ende</label>
                  <input
                    type="date"
                    value={form.endDatum}
                    onChange={(e) => setForm((f) => ({ ...f, endDatum: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Beschreibung
                </label>
                <textarea
                  rows={2}
                  value={form.beschreibung}
                  onChange={(e) => setForm((f) => ({ ...f, beschreibung: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Ziel / Sollmenge
                </label>
                <input
                  type="text"
                  value={form.ziel}
                  onChange={(e) => setForm((f) => ({ ...f, ziel: e.target.value }))}
                  placeholder="z.B. 50.000 Pflanzen"
                  className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-[#0f0f0f] border border-[#2a2a2a] text-zinc-400 hover:text-white rounded-lg text-sm transition-all"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 bg-[#2C3A1C] hover:bg-[#3a4d26] text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Speichern...
                    </>
                  ) : editItem ? (
                    "Aktualisieren"
                  ) : (
                    "Erstellen"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

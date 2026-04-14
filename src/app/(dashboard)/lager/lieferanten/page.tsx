"use client"

// KL-2: Lieferanten-Stammdaten CRUD-Seite

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, ExternalLink, Phone, Mail, MapPin, Package, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Breadcrumb } from "@/components/layout/Breadcrumb"

interface Lieferant {
  id: string
  name: string
  email: string | null
  telefon: string | null
  website: string | null
  adresse: string | null
  plz: string | null
  ort: string | null
  land: string | null
  notizen: string | null
  aktiv: boolean
  _count?: { artikel: number }
}

export default function LieferantenPage() {
  const [lieferanten, setLieferanten] = useState<Lieferant[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLieferant, setEditingLieferant] = useState<Lieferant | null>(null)

  // Lieferanten laden
  useEffect(() => {
    fetchLieferanten()
  }, [])

  const fetchLieferanten = async () => {
    try {
      const res = await fetch("/api/lager/lieferanten")
      const data = await res.json()
      setLieferanten(data)
    } catch (error) {
      console.error("Fehler beim Laden:", error)
      toast.error("Lieferanten konnten nicht geladen werden")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Lieferant "${name}" wirklich löschen?`)) return

    try {
      const res = await fetch(`/api/lager/lieferanten/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Löschen fehlgeschlagen")
      
      toast.success("Lieferant gelöscht")
      fetchLieferanten()
    } catch (error) {
      console.error("Fehler:", error)
      toast.error("Löschen fehlgeschlagen")
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Lager", href: "/lager" }, { label: "Lieferanten" }]} />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Lieferanten</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {lieferanten.length} Lieferanten
          </p>
        </div>
        <button
          onClick={() => {
            setEditingLieferant(null)
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neuer Lieferant
        </button>
      </div>

      {/* Liste */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-zinc-600 animate-spin mx-auto" />
          </div>
        ) : lieferanten.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">Keine Lieferanten vorhanden</p>
            <p className="text-zinc-600 text-sm mt-1">Erstelle deinen ersten Lieferanten</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-xs text-zinc-500">Name</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500">Kontakt</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500">Ort</th>
                <th className="text-right px-4 py-3 text-xs text-zinc-500">Artikel</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {lieferanten.map((l) => (
                <tr key={l.id} className="hover:bg-[#1c1c1c]">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">{l.name}</p>
                      {l.website && (
                        <a
                          href={l.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-zinc-500 hover:text-emerald-400 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Website
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs">
                          <Mail className="w-3 h-3" />
                          {l.email}
                        </a>
                      )}
                      {l.telefon && (
                        <a href={`tel:${l.telefon}`} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs">
                          <Phone className="w-3 h-3" />
                          {l.telefon}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {l.ort ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        {l.plz && `${l.plz} `}{l.ort}
                      </span>
                    ) : (
                      <span className="text-zinc-600">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-emerald-400 font-medium">
                      {l._count?.artikel || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingLieferant(l)
                          setShowModal(true)
                        }}
                        className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(l.id, l.name)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                      >
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
      </div>

      {/* Modal */}
      {showModal && (
        <LieferantModal
          lieferant={editingLieferant}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            fetchLieferanten()
          }}
        />
      )}
    </div>
  )
}

// Modal-Komponente
function LieferantModal({
  lieferant,
  onClose,
  onSaved,
}: {
  lieferant: Lieferant | null
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: lieferant?.name || "",
    email: lieferant?.email || "",
    telefon: lieferant?.telefon || "",
    website: lieferant?.website || "",
    adresse: lieferant?.adresse || "",
    plz: lieferant?.plz || "",
    ort: lieferant?.ort || "",
    notizen: lieferant?.notizen || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.name.trim()) {
      toast.error("Name erforderlich")
      return
    }

    setLoading(true)

    try {
      const url = lieferant ? `/api/lager/lieferanten/${lieferant.id}` : "/api/lager/lieferanten"
      const method = lieferant ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Speichern fehlgeschlagen")
      }

      toast.success(lieferant ? "Lieferant aktualisiert" : "Lieferant erstellt")
      onSaved()
    } catch (error) {
      console.error("Fehler:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">
            {lieferant ? "Lieferant bearbeiten" : "Neuer Lieferant"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">E-Mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Telefon</label>
              <input
                type="tel"
                value={form.telefon}
                onChange={(e) => setForm((f) => ({ ...f, telefon: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://"
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Adresse</label>
            <input
              type="text"
              value={form.adresse}
              onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">PLZ</label>
              <input
                type="text"
                value={form.plz}
                onChange={(e) => setForm((f) => ({ ...f, plz: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-400 mb-1">Ort</label>
              <input
                type="text"
                value={form.ort}
                onChange={(e) => setForm((f) => ({ ...f, ort: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notizen</label>
            <textarea
              value={form.notizen}
              onChange={(e) => setForm((f) => ({ ...f, notizen: e.target.value }))}
              rows={2}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#2a2a2a] rounded-lg text-zinc-400 hover:text-white text-sm"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

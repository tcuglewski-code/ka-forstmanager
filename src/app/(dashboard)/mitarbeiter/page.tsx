"use client"

import { useState, useEffect, useCallback } from "react"
import { UserPlus, Search, Filter, Pencil, Trash2, Loader2, Eye } from "lucide-react"
import { MitarbeiterModal } from "@/components/mitarbeiter/MitarbeiterModal"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Mitarbeiter {
  id: string
  vorname: string
  nachname: string
  email?: string | null
  telefon?: string | null
  rolle: string
  status: string
  stundenlohn?: number | null
}

const rolleBadge: Record<string, string> = {
  admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  buero: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  gruppenfuehrer: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  mitarbeiter: "bg-zinc-700/50 text-zinc-400 border-zinc-600/30",
}

const rolleLabel: Record<string, string> = {
  admin: "Admin",
  buero: "Büro",
  gruppenfuehrer: "Gruppenführer",
  mitarbeiter: "Mitarbeiter",
}

const statusBadge: Record<string, string> = {
  aktiv: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  inaktiv: "bg-red-500/20 text-red-400 border-red-500/30",
  beurlaubt: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
}

export default function MitarbeiterPage() {
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [loading, setLoading] = useState(true)
  const [suche, setSuche] = useState("")
  const [rolleFilter, setRolleFilter] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Mitarbeiter | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchMitarbeiter = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (suche) params.set("suche", suche)
      if (rolleFilter) params.set("rolle", rolleFilter)
      const res = await fetch(`/api/mitarbeiter?${params}`)
      const data = await res.json()
      setMitarbeiter(data)
    } catch {
      setMitarbeiter([])
    } finally {
      setLoading(false)
    }
  }, [suche, rolleFilter])

  useEffect(() => {
    const t = setTimeout(fetchMitarbeiter, 300)
    return () => clearTimeout(t)
  }, [fetchMitarbeiter])

  const handleSave = async (data: any) => {
    if (editItem?.id) {
      await fetch(`/api/mitarbeiter/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } else {
      await fetch("/api/mitarbeiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    }
    await fetchMitarbeiter()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Mitarbeiter wirklich löschen?")) return
    setDeleting(id)
    try {
      await fetch(`/api/mitarbeiter/${id}`, { method: "DELETE" })
      await fetchMitarbeiter()
    } finally {
      setDeleting(null)
    }
  }

  const openCreate = () => {
    setEditItem(null)
    setModalOpen(true)
  }

  const openEdit = (m: Mitarbeiter) => {
    setEditItem(m)
    setModalOpen(true)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mitarbeiter</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {mitarbeiter.length} Einträge
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2C3A1C] hover:bg-[#3a4d26] text-white text-sm font-medium rounded-lg transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Mitarbeiter hinzufügen
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Suchen..."
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#161616] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
          />
        </div>
        <select
          value={rolleFilter}
          onChange={(e) => setRolleFilter(e.target.value)}
          className="px-3 py-2.5 bg-[#161616] border border-[#2a2a2a] rounded-lg text-sm text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="">Alle Rollen</option>
          <option value="mitarbeiter">Mitarbeiter</option>
          <option value="gruppenfuehrer">Gruppenführer</option>
          <option value="buero">Büro</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#1e1e1e] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : mitarbeiter.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg mb-2">Keine Mitarbeiter gefunden</p>
            <p className="text-sm">
              {suche || rolleFilter
                ? "Suche anpassen oder Filter entfernen"
                : "Fügen Sie den ersten Mitarbeiter hinzu"}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left text-xs font-medium text-zinc-500 px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-5 py-3">Rolle</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-5 py-3">Telefon</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-5 py-3">Status</th>
                <th className="text-right text-xs font-medium text-zinc-500 px-5 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {mitarbeiter.map((m, i) => (
                <tr
                  key={m.id}
                  className={cn(
                    "border-b border-[#2a2a2a] last:border-0 hover:bg-[#1a1a1a] transition-colors",
                  )}
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-white">
                        {m.vorname} {m.nachname}
                      </p>
                      {m.email && (
                        <p className="text-xs text-zinc-500 mt-0.5">{m.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs border",
                        rolleBadge[m.rolle] || rolleBadge.mitarbeiter
                      )}
                    >
                      {rolleLabel[m.rolle] || m.rolle}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-400">
                    {m.telefon || "–"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs border capitalize",
                        statusBadge[m.status] || "bg-zinc-700/50 text-zinc-400 border-zinc-600/30"
                      )}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/mitarbeiter/${m.id}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-[#2a2a2a] hover:text-emerald-400 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => openEdit(m)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-[#2a2a2a] hover:text-white transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-50"
                      >
                        {deleting === m.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <MitarbeiterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editItem}
      />
    </div>
  )
}

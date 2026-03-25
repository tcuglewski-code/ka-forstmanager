"use client"

import { useState, useEffect, useCallback } from "react"
import { UserPlus, Search, Pencil, Trash2, Loader2, Eye, CheckSquare, X, ChevronDown } from "lucide-react"
import { MitarbeiterModal } from "@/components/mitarbeiter/MitarbeiterModal"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"

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

// RolleBadge Komponente für schnelle Sichtbarkeit
function RolleBadge({ rolle }: { rolle: string }) {
  if (rolle === "gf_senior" || rolle === "ka_admin") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40">🏅 Senior GF</span>
  }
  if (rolle === "gf_standard" || rolle === "gruppenführer" || rolle === "ka_gruppenführer" || rolle === "gruppenfuehrer") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/20 text-zinc-300 border border-zinc-500/40">👷 Gruppenführer</span>
  }
  if (rolle === "admin") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">Admin</span>
  }
  if (rolle === "buero") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">Büro</span>
  }
  if (rolle === "ka_mitarbeiter" || rolle === "mitarbeiter") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Mitarbeiter</span>
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-zinc-500 border border-zinc-700">{rolle}</span>
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

  // Bulk-Auswahl State
  const [selected, setSelected] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<string>("")
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchMitarbeiter = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (suche) params.set("suche", suche)
      if (rolleFilter) params.set("rolle", rolleFilter)
      const res = await fetch(`/api/mitarbeiter?${params}`)
      const data = await res.json()
      setMitarbeiter(data)
      // Auswahl zurücksetzen wenn neue Daten geladen
      setSelected([])
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

  // Alle auswählen / abwählen
  const toggleAll = () => {
    if (selected.length === mitarbeiter.length) {
      setSelected([])
    } else {
      setSelected(mitarbeiter.map((m) => m.id))
    }
  }

  // Einzelne Zeile auswählen
  const toggleOne = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

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

  // Bulk: Status setzen
  const handleBulkStatusSetzen = async () => {
    if (!bulkStatus || selected.length === 0) {
      toast.error("Bitte zuerst einen Status auswählen.")
      return
    }
    setBulkLoading(true)
    let errors = 0
    for (const id of selected) {
      try {
        const res = await fetch(`/api/mitarbeiter/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: bulkStatus }),
        })
        if (!res.ok) errors++
      } catch {
        errors++
      }
    }
    setBulkLoading(false)
    if (errors === 0) {
      toast.success(`Status für ${selected.length} Mitarbeiter auf „${bulkStatus}" gesetzt.`)
    } else {
      toast.error(`${errors} von ${selected.length} Aktualisierungen fehlgeschlagen.`)
    }
    setBulkStatus("")
    await fetchMitarbeiter()
  }

  // Bulk: Löschen
  const handleBulkLoeschen = async () => {
    if (!confirm(`${selected.length} Mitarbeiter wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return
    setBulkLoading(true)
    let errors = 0
    for (const id of selected) {
      try {
        const res = await fetch(`/api/mitarbeiter/${id}`, { method: "DELETE" })
        if (!res.ok) errors++
      } catch {
        errors++
      }
    }
    setBulkLoading(false)
    if (errors === 0) {
      toast.success(`${selected.length} Mitarbeiter erfolgreich gelöscht.`)
    } else {
      toast.error(`${errors} von ${selected.length} Löschvorgängen fehlgeschlagen.`)
    }
    await fetchMitarbeiter()
  }

  const openCreate = () => {
    setEditItem(null)
    setModalOpen(true)
  }

  const openEdit = (m: Mitarbeiter) => {
    setEditItem(m)
    setModalOpen(true)
  }

  const alleAusgewaehlt = mitarbeiter.length > 0 && selected.length === mitarbeiter.length
  const teilweiseAusgewaehlt = selected.length > 0 && selected.length < mitarbeiter.length

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
          <option value="gf_standard">Gruppenführer</option>
          <option value="gf_senior">Senior-Gruppenführer</option>
          <option value="gruppenfuehrer">Gruppenführer (alt)</option>
          <option value="buero">Büro</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Bulk-Aktionsbar — erscheint wenn mindestens ein Eintrag ausgewählt */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-[#1a1a1a] border border-emerald-500/30 rounded-xl flex-wrap">
          <span className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4" />
            {selected.length} Mitarbeiter ausgewählt
          </span>

          <div className="h-4 w-px bg-[#2a2a2a] hidden sm:block" />

          {/* Status-Dropdown + Anwenden */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-[#161616] border border-[#2a2a2a] rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              >
                <option value="">Status setzen…</option>
                <option value="aktiv">✅ Aktiv</option>
                <option value="inaktiv">🔴 Inaktiv</option>
                <option value="archiviert">📁 Archiviert</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
            <button
              onClick={handleBulkStatusSetzen}
              disabled={bulkLoading || !bulkStatus}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all flex items-center gap-1.5"
            >
              {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Anwenden
            </button>
          </div>

          <div className="h-4 w-px bg-[#2a2a2a] hidden sm:block" />

          {/* Löschen */}
          <button
            onClick={handleBulkLoeschen}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-red-400 text-sm font-medium rounded-lg border border-red-500/20 transition-all"
          >
            {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Löschen
          </button>

          {/* Auswahl aufheben */}
          <button
            onClick={() => setSelected([])}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 hover:text-zinc-300 text-sm rounded-lg hover:bg-[#2a2a2a] transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Auswahl aufheben
          </button>
        </div>
      )}

      {/* Tabelle */}
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
                {/* Header-Checkbox */}
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={alleAusgewaehlt}
                    ref={(el) => {
                      if (el) el.indeterminate = teilweiseAusgewaehlt
                    }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-[#3a3a3a] bg-[#1e1e1e] accent-emerald-400 cursor-pointer"
                    title={alleAusgewaehlt ? "Alle abwählen" : "Alle auswählen"}
                  />
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Rolle</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Telefon</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {mitarbeiter.map((m) => {
                const istAusgewaehlt = selected.includes(m.id)
                return (
                  <tr
                    key={m.id}
                    className={cn(
                      "border-b border-[#2a2a2a] last:border-0 transition-colors",
                      istAusgewaehlt
                        ? "bg-emerald-500/5 hover:bg-emerald-500/8"
                        : "hover:bg-[#1a1a1a]"
                    )}
                  >
                    {/* Zeilen-Checkbox */}
                    <td className="px-4 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={istAusgewaehlt}
                        onChange={() => toggleOne(m.id)}
                        className="w-4 h-4 rounded border-[#3a3a3a] bg-[#1e1e1e] accent-emerald-400 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-white">
                          {m.vorname} {m.nachname}
                        </p>
                        {m.email && (
                          <p className="text-xs text-zinc-500 mt-0.5">{m.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <RolleBadge rolle={m.rolle} />
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-400">
                      {m.telefon || "–"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs border capitalize",
                          statusBadge[m.status] || "bg-zinc-700/50 text-zinc-400 border-zinc-600/30"
                        )}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
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
                )
              })}
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

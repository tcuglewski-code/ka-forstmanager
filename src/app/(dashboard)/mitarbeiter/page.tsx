"use client"

import { useState, useEffect, useCallback } from "react"
import { UserPlus, Search, Pencil, Trash2, Loader2, Eye, CheckSquare, X, ChevronDown } from "lucide-react"
import { MitarbeiterModal } from "@/components/mitarbeiter/MitarbeiterModal"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/useConfirm"
import { fetchWithTimeout } from "@/hooks/useFetchWithTimeout"

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
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-500/40">🏅 Senior GF</span>
  }
  if (rolle === "gf_standard" || rolle === "gruppenführer" || rolle === "ka_gruppenführer" || rolle === "gruppenfuehrer") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 border border-gray-300">👷 Gruppenführer</span>
  }
  if (rolle === "admin") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Admin</span>
  }
  if (rolle === "buero") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-500/30">Büro</span>
  }
  if (rolle === "ka_mitarbeiter" || rolle === "mitarbeiter") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-500/20">Mitarbeiter</span>
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-[var(--color-on-surface-variant)] border border-border">{rolle}</span>
}

const statusBadge: Record<string, string> = {
  aktiv: "bg-emerald-100 text-emerald-800 border-emerald-500/30",
  inaktiv: "bg-red-100 text-red-800 border-red-500/30",
  beurlaubt: "bg-yellow-100 text-yellow-800 border-yellow-200",
}

export default function MitarbeiterPage() {
  const router = useRouter()
  const { confirm, ConfirmDialogElement } = useConfirm()
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
      const res = await fetchWithTimeout(`/api/mitarbeiter?${params}`)
      const data = await res.json()
      setMitarbeiter(Array.isArray(data) ? data : (data.items ?? []))
      // Auswahl zurücksetzen wenn neue Daten geladen
      setSelected([])
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        toast.error("Laden dauert zu lange. Bitte Seite neu laden.")
      } else {
        toast.error("Fehler beim Laden der Mitarbeiter.")
      }
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
    const ok = await confirm({ title: "Bestätigen", message: "Mitarbeiter wirklich löschen?" })
    if (!ok) return
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
    const ok = await confirm({ title: "Bestätigen", message: `${selected.length} Mitarbeiter wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.` })
    if (!ok) return
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
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>Mitarbeiter</h1>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
            {mitarbeiter.length} Einträge
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest hover:bg-[#3a4d26] text-white text-sm font-medium rounded-lg transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Mitarbeiter hinzufügen
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
          <input
            type="text"
            placeholder="Suchen..."
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--color-surface-container)] border border-border rounded-lg text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
          />
        </div>
        <select
          value={rolleFilter}
          onChange={(e) => setRolleFilter(e.target.value)}
          className="px-3 py-2.5 bg-[var(--color-surface-container)] border border-border rounded-lg text-sm text-[var(--color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-emerald-500/30 rounded-xl flex-wrap">
          <span className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4" />
            {selected.length} Mitarbeiter ausgewählt
          </span>

          <div className="h-4 w-px bg-surface-container-highest hidden sm:block" />

          {/* Status-Dropdown + Anwenden */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-[var(--color-surface-container)] border border-border rounded-lg text-sm text-[var(--color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              >
                <option value="">Status setzen…</option>
                <option value="aktiv">✅ Aktiv</option>
                <option value="inaktiv">🔴 Inaktiv</option>
                <option value="archiviert">📁 Archiviert</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-on-surface-variant)] pointer-events-none" />
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

          <div className="h-4 w-px bg-surface-container-highest hidden sm:block" />

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
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] text-sm rounded-lg hover:bg-surface-container-highest transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Auswahl aufheben
          </button>
        </div>
      )}

      {/* Tabelle */}
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[var(--color-surface-container-highest)] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : mitarbeiter.length === 0 ? (
          <div className="text-center py-16 text-[var(--color-on-surface-variant)]">
            <p className="text-lg mb-2">Keine Mitarbeiter gefunden</p>
            <p className="text-sm">
              {suche || rolleFilter
                ? "Suche anpassen oder Filter entfernen"
                : "Fügen Sie den ersten Mitarbeiter hinzu"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border">
                {/* Header-Checkbox */}
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={alleAusgewaehlt}
                    ref={(el) => {
                      if (el) el.indeterminate = teilweiseAusgewaehlt
                    }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-border bg-[var(--color-surface-container-highest)] accent-emerald-400 cursor-pointer"
                    title={alleAusgewaehlt ? "Alle abwählen" : "Alle auswählen"}
                  />
                </th>
                <th className="text-left text-xs font-medium text-[var(--color-on-surface-variant)] px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-[var(--color-on-surface-variant)] px-4 py-3">Rolle</th>
                <th className="text-left text-xs font-medium text-[var(--color-on-surface-variant)] px-4 py-3">Telefon</th>
                <th className="text-left text-xs font-medium text-[var(--color-on-surface-variant)] px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-[var(--color-on-surface-variant)] px-4 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {mitarbeiter.map((m) => {
                const istAusgewaehlt = selected.includes(m.id)
                return (
                  <tr
                    key={m.id}
                    onClick={() => router.push(`/mitarbeiter/${m.id}`)}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors cursor-pointer",
                      istAusgewaehlt
                        ? "bg-emerald-500/5 hover:bg-emerald-500/8"
                        : "hover:bg-[var(--color-surface-container-lowest)]"
                    )}
                  >
                    {/* Zeilen-Checkbox */}
                    <td className="px-4 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={istAusgewaehlt}
                        onChange={() => toggleOne(m.id)}
                        className="w-4 h-4 rounded border-border bg-[var(--color-surface-container-highest)] accent-emerald-400 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-[var(--color-on-surface)]">
                          {m.vorname} {m.nachname}
                        </p>
                        {m.email && (
                          <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{m.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <RolleBadge rolle={m.rolle} />
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-on-surface-variant)]">
                      {m.telefon || "–"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs border capitalize",
                          statusBadge[m.status] || "bg-[var(--color-surface-container-high)]/50 text-[var(--color-on-surface-variant)] border-zinc-600/30"
                        )}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/mitarbeiter/${m.id}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-on-surface-variant)] hover:bg-surface-container-highest hover:text-emerald-400 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => openEdit(m)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-on-surface-variant)] hover:bg-surface-container-highest hover:text-[var(--color-on-surface)] transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={deleting === m.id}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-on-surface-variant)] hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-50"
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
          </div>
        )}
      </div>

      {ConfirmDialogElement}
      <MitarbeiterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editItem}
      />
    </div>
  )
}

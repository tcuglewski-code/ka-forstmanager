"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

const FORSTBAUMARTEN = [
  "Eiche",
  "Buche",
  "Fichte",
  "Kiefer",
  "Lärche",
  "Douglasie",
  "Tanne",
  "Birke",
  "Erle",
  "Esche",
  "Ahorn",
  "Linde",
]

interface Preisliste {
  id: string
  baumschuleId: string
  baumart: string
  preis: number
  einheit: string
  saison: string | null
  aktiv: boolean
  notizen: string | null
  menge: number | null
  verfuegbar: boolean
  createdAt: string
  updatedAt: string
}

interface Props {
  baumschuleId: string
  initialSortiment: Preisliste[]
}

export function SortimentEditor({ baumschuleId, initialSortiment }: Props) {
  const [sortiment, setSortiment] = useState(initialSortiment)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)

  // New entry form state
  const [newBaumart, setNewBaumart] = useState("")
  const [newPreis, setNewPreis] = useState("")
  const [newEinheit, setNewEinheit] = useState("Stück")
  const [newMenge, setNewMenge] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Inline edit state
  const [editPreis, setEditPreis] = useState("")
  const [editMenge, setEditMenge] = useState("")
  const [editEinheit, setEditEinheit] = useState("")

  const handleBaumartInput = (value: string) => {
    setNewBaumart(value)
    if (value.length > 0) {
      const filtered = FORSTBAUMARTEN.filter((b) => b.toLowerCase().startsWith(value.toLowerCase()))
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }

  const handleAdd = async () => {
    if (!newBaumart.trim() || !newPreis) return
    setSaving(true)
    try {
      const res = await fetch(`/api/baumschulen/${baumschuleId}/sortiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baumart: newBaumart.trim(),
          preis: parseFloat(newPreis),
          einheit: newEinheit,
          menge: newMenge ? parseInt(newMenge) : null,
          verfuegbar: true,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Fehler beim Speichern")
        return
      }
      const eintrag = await res.json()
      setSortiment((prev) => [...prev, eintrag])
      setNewBaumart("")
      setNewPreis("")
      setNewMenge("")
      setShowAdd(false)
      toast.success(`${eintrag.baumart} hinzugefügt`)
    } catch {
      toast.error("Netzwerkfehler")
    } finally {
      setSaving(false)
    }
  }

  const toggleVerfuegbar = useCallback(
    async (eintrag: Preisliste) => {
      try {
        const res = await fetch(`/api/baumschulen/${baumschuleId}/sortiment/${eintrag.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verfuegbar: !eintrag.verfuegbar }),
        })
        if (res.ok) {
          const updated = await res.json()
          setSortiment((prev) => prev.map((s) => (s.id === eintrag.id ? updated : s)))
        }
      } catch {
        toast.error("Fehler beim Aktualisieren")
      }
    },
    [baumschuleId]
  )

  const startEdit = (eintrag: Preisliste) => {
    setEditId(eintrag.id)
    setEditPreis(String(eintrag.preis))
    setEditMenge(eintrag.menge != null ? String(eintrag.menge) : "")
    setEditEinheit(eintrag.einheit)
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/baumschulen/${baumschuleId}/sortiment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preis: parseFloat(editPreis),
          menge: editMenge ? parseInt(editMenge) : null,
          einheit: editEinheit,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSortiment((prev) => prev.map((s) => (s.id === id ? updated : s)))
        setEditId(null)
        toast.success("Gespeichert")
      }
    } catch {
      toast.error("Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, baumart: string) => {
    if (!confirm(`"${baumart}" wirklich löschen?`)) return
    try {
      const res = await fetch(`/api/baumschulen/${baumschuleId}/sortiment/${id}`, { method: "DELETE" })
      if (res.ok) {
        setSortiment((prev) => prev.filter((s) => s.id !== id))
        toast.success(`${baumart} gelöscht`)
      }
    } catch {
      toast.error("Fehler beim Löschen")
    }
  }

  const handleWpSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`/api/baumschulen/${baumschuleId}/wp-sync`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
      } else {
        toast.error(data.error || "Sync fehlgeschlagen")
      }
    } catch {
      toast.error("Netzwerkfehler beim Sync")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sortiment ({sortiment.length} Einträge)</h2>
        <div className="flex gap-2">
          <button
            onClick={handleWpSync}
            disabled={syncing}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {syncing ? "Synchronisiere..." : "WP Sync"}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            + Baumart hinzufügen
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-3">
          <h3 className="font-medium">Neue Baumart hinzufügen</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Baumart"
                value={newBaumart}
                onChange={(e) => handleBaumartInput(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-600 rounded-lg max-h-40 overflow-y-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setNewBaumart(s)
                        setSuggestions([])
                      }}
                      className="block w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="Preis (€)"
              value={newPreis}
              onChange={(e) => setNewPreis(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
            />
            <select
              value={newEinheit}
              onChange={(e) => setNewEinheit(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="Stück">Stück</option>
              <option value="kg">kg</option>
              <option value="Bündel">Bündel</option>
            </select>
            <input
              type="number"
              placeholder="Menge (optional)"
              value={newMenge}
              onChange={(e) => setNewMenge(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !newBaumart.trim() || !newPreis}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {saving ? "Speichern..." : "Hinzufügen"}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700 text-zinc-400 text-left">
              <th className="py-2 pr-4">Baumart</th>
              <th className="py-2 pr-4">Preis</th>
              <th className="py-2 pr-4">Einheit</th>
              <th className="py-2 pr-4">Menge</th>
              <th className="py-2 pr-4">Verfügbar</th>
              <th className="py-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {sortiment.map((eintrag) => (
              <tr key={eintrag.id} className="border-b border-zinc-800 hover:bg-zinc-900/50">
                <td className="py-2.5 pr-4 font-medium">{eintrag.baumart}</td>
                <td className="py-2.5 pr-4">
                  {editId === eintrag.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editPreis}
                      onChange={(e) => setEditPreis(e.target.value)}
                      className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-sm"
                    />
                  ) : (
                    `${eintrag.preis.toFixed(2)} €`
                  )}
                </td>
                <td className="py-2.5 pr-4">
                  {editId === eintrag.id ? (
                    <select
                      value={editEinheit}
                      onChange={(e) => setEditEinheit(e.target.value)}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-sm"
                    >
                      <option value="Stück">Stück</option>
                      <option value="kg">kg</option>
                      <option value="Bündel">Bündel</option>
                    </select>
                  ) : (
                    eintrag.einheit
                  )}
                </td>
                <td className="py-2.5 pr-4">
                  {editId === eintrag.id ? (
                    <input
                      type="number"
                      value={editMenge}
                      onChange={(e) => setEditMenge(e.target.value)}
                      placeholder="—"
                      className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-sm"
                    />
                  ) : (
                    eintrag.menge ?? "—"
                  )}
                </td>
                <td className="py-2.5 pr-4">
                  <button
                    onClick={() => toggleVerfuegbar(eintrag)}
                    className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                      eintrag.verfuegbar ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-700 text-zinc-500"
                    }`}
                  >
                    {eintrag.verfuegbar ? "Ja" : "Nein"}
                  </button>
                </td>
                <td className="py-2.5">
                  {editId === eintrag.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveEdit(eintrag.id)}
                        disabled={saving}
                        className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded transition-colors"
                      >
                        OK
                      </button>
                      <button onClick={() => setEditId(null)} className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded transition-colors">
                        X
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(eintrag)} className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded transition-colors">
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(eintrag.id, eintrag.baumart)}
                        className="px-2 py-1 text-xs bg-red-900/50 hover:bg-red-800 text-red-400 rounded transition-colors"
                      >
                        Löschen
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {sortiment.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-500">
                  Noch keine Baumarten im Sortiment. Klicken Sie auf &quot;+ Baumart hinzufügen&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

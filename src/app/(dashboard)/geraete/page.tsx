"use client"

// Y3: Eigenständige Geräte-Seite mit Bulk-Auswahl, Bulk-Status-Setzen,
//     Bulk-Löschen und Edit-Modal
import { useState, useEffect, useCallback } from "react"
import { Plus, X, Wrench, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Geraet {
  id: string
  typ: string
  bezeichnung: string
  seriennummer?: string | null
  status: string
  naechsteWartung?: string | null
  notizen?: string | null
}

const STATUS_FARBEN: Record<string, string> = {
  verfuegbar: "bg-emerald-500/20 text-emerald-400",
  im_einsatz: "bg-amber-500/20 text-amber-400",
  in_wartung: "bg-blue-500/20 text-blue-400",
  defekt: "bg-red-500/20 text-red-400",
}

// ─── Modal: Gerät bearbeiten ──────────────────────────────────────────────────

function GeraetEditModal({
  geraet,
  onClose,
  onSave,
}: {
  geraet: Geraet
  onClose: () => void
  onSave: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    typ: geraet.typ,
    bezeichnung: geraet.bezeichnung,
    seriennummer: geraet.seriennummer ?? "",
    status: geraet.status,
    naechsteWartung: geraet.naechsteWartung
      ? geraet.naechsteWartung.split("T")[0]
      : "",
    notizen: geraet.notizen ?? "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/geraete/${geraet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Fehler beim Speichern")
      toast.success("Gerät aktualisiert")
    } catch {
      toast.error("Fehler beim Speichern")
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Gerät bearbeiten</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-zinc-500 hover:text-white" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Typ *</label>
              <input
                type="text"
                required
                value={form.typ}
                onChange={(e) => setForm((f) => ({ ...f, typ: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {["verfuegbar", "im_einsatz", "in_wartung", "defekt"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Bezeichnung *</label>
            <input
              type="text"
              required
              value={form.bezeichnung}
              onChange={(e) => setForm((f) => ({ ...f, bezeichnung: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Seriennummer</label>
            <input
              type="text"
              value={form.seriennummer}
              onChange={(e) => setForm((f) => ({ ...f, seriennummer: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nächste Wartung</label>
            <input
              type="date"
              value={form.naechsteWartung}
              onChange={(e) => setForm((f) => ({ ...f, naechsteWartung: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notizen</label>
            <textarea
              rows={2}
              value={form.notizen}
              onChange={(e) => setForm((f) => ({ ...f, notizen: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !form.bezeichnung || !form.typ}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all"
            >
              {loading ? "Speichern..." : "Aktualisieren"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal: Neues Gerät ───────────────────────────────────────────────────────

function GeraetNeuModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    typ: "",
    bezeichnung: "",
    seriennummer: "",
    status: "verfuegbar",
    naechsteWartung: "",
    notizen: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch("/api/geraete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      toast.success("Gerät gespeichert")
    } catch {
      toast.error("Fehler beim Speichern")
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Neues Gerät</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-zinc-500 hover:text-white" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(
            [
              ["Typ *", "typ"],
              ["Bezeichnung *", "bezeichnung"],
              ["Seriennummer", "seriennummer"],
            ] as [string, string][]
          ).map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs text-zinc-400 mb-1">{label}</label>
              <input
                type="text"
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nächste Wartung</label>
            <input
              type="date"
              value={form.naechsteWartung}
              onChange={(e) => setForm((f) => ({ ...f, naechsteWartung: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !form.bezeichnung || !form.typ}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all"
            >
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Haupt-Seite ──────────────────────────────────────────────────────────────

export default function GeraetePage() {
  const [geraete, setGeraete] = useState<Geraet[]>([])
  const [loading, setLoading] = useState(true)
  const [showNeuModal, setShowNeuModal] = useState(false)
  const [editGeraet, setEditGeraet] = useState<Geraet | null>(null)

  // Y3: Bulk-States
  const [selected, setSelected] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState("")

  const heute = new Date()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/geraete")
      setGeraete(await res.json())
    } catch {
      setGeraete([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Y3: Bulk-Status setzen
  const handleBulkStatus = async () => {
    if (!bulkStatus || selected.length === 0) return
    let errors = 0
    for (const id of selected) {
      const res = await fetch(`/api/geraete/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: bulkStatus }),
      })
      if (!res.ok) errors++
    }
    setSelected([])
    setBulkStatus("")
    await load()
    if (errors > 0) {
      toast.error(`${errors} Geräte konnten nicht aktualisiert werden`)
    } else {
      toast.success(`${selected.length} Geräte aktualisiert`)
    }
  }

  // Y3: Bulk-Löschen
  const handleBulkDelete = async () => {
    if (!confirm(`${selected.length} Geräte wirklich löschen?`)) return
    const count = selected.length
    let errors = 0
    for (const id of selected) {
      const res = await fetch(`/api/geraete/${id}`, { method: "DELETE" })
      if (!res.ok) errors++
    }
    setSelected([])
    await load()
    if (errors > 0) {
      toast.error(`${errors} von ${count} Geräten konnten nicht gelöscht werden`)
    } else {
      toast.success(`${count} Geräte gelöscht`)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Geräte</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{geraete.length} Geräte</p>
        </div>
        <button
          onClick={() => setShowNeuModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Gerät
        </button>
      </div>

      {/* Y3: Bulk-Aktionsleiste */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex-wrap">
          <span className="text-emerald-400 text-sm font-medium">
            {selected.length} Geräte ausgewählt
          </span>

          {/* Bulk-Status setzen */}
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-white"
            >
              <option value="">Status setzen...</option>
              {["verfuegbar", "im_einsatz", "in_wartung", "defekt"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>
            <button
              onClick={handleBulkStatus}
              disabled={!bulkStatus}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Anwenden
            </button>
          </div>

          {/* Bulk-Löschen */}
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-lg text-sm text-red-400 hover:bg-red-500/30 transition-colors"
          >
            Löschen
          </button>

          <button
            onClick={() => setSelected([])}
            className="text-xs text-zinc-500 hover:text-white ml-auto"
          >
            Auswahl aufheben
          </button>
        </div>
      )}

      {/* Tabelle */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              {/* Y3: Header-Checkbox */}
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={
                    selected.length === geraete.length && geraete.length > 0
                  }
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? geraete.map((g) => g.id) : []
                    )
                  }
                  className="rounded border-zinc-600"
                />
              </th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Bezeichnung</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Typ</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Seriennummer</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Nächste Wartung</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-zinc-600">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Laden...
                </td>
              </tr>
            ) : geraete.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-zinc-600">
                  Keine Geräte vorhanden
                </td>
              </tr>
            ) : (
              geraete.map((g) => (
                <tr
                  key={g.id}
                  className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors"
                >
                  {/* Y3: Zeilen-Checkbox */}
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(g.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, g.id]
                            : prev.filter((id) => id !== g.id)
                        )
                      }
                      className="rounded border-zinc-600"
                    />
                  </td>
                  <td className="px-4 py-3 text-white font-medium">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-zinc-500" />
                      {g.bezeichnung}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{g.typ}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {g.seriennummer ?? "–"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${STATUS_FARBEN[g.status] ?? "bg-zinc-700 text-zinc-300"}`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {g.naechsteWartung ? (
                      <span
                        className={
                          new Date(g.naechsteWartung) < heute
                            ? "text-amber-400"
                            : "text-zinc-400"
                        }
                      >
                        {new Date(g.naechsteWartung).toLocaleDateString(
                          "de-DE"
                        )}
                      </span>
                    ) : (
                      <span className="text-zinc-600">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditGeraet(g)}
                      className="text-zinc-500 hover:text-emerald-400 transition-colors text-xs px-2 py-1 rounded hover:bg-[#2a2a2a]"
                    >
                      Bearbeiten
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showNeuModal && (
        <GeraetNeuModal
          onClose={() => setShowNeuModal(false)}
          onSave={() => {
            setShowNeuModal(false)
            load()
          }}
        />
      )}
      {editGeraet && (
        <GeraetEditModal
          geraet={editGeraet}
          onClose={() => setEditGeraet(null)}
          onSave={() => {
            setEditGeraet(null)
            load()
          }}
        />
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"

interface Saison { id: string; name: string }
interface Mitarbeiter { id: string; vorname: string; nachname: string; rolle: string }
interface Gruppe { id?: string; name?: string; saisonId?: string | null; gruppenfuehrerId?: string | null }

export function GruppeModal({
  gruppe,
  onClose,
  onSave,
}: {
  gruppe?: Gruppe | null
  onClose: () => void
  onSave: () => void
}) {
  const [saisons, setSaisons] = useState<Saison[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: gruppe?.name ?? "",
    saisonId: gruppe?.saisonId ?? "",
    gruppenfuehrerId: gruppe?.gruppenfuehrerId ?? "",
  })

  useEffect(() => {
    fetch("/api/saisons").then(r => r.json()).then(setSaisons)
    // Fetch all mitarbeiter and filter by Gruppenführer roles client-side
    fetch("/api/mitarbeiter")
      .then(r => r.json())
      .then((raw: Mitarbeiter[] | { items: Mitarbeiter[] }) => {
        const all: Mitarbeiter[] = Array.isArray(raw) ? raw : (raw.items ?? [])
        const GF_ROLES = ["gruppenführer", "gf", "gruppenf\u00fchrer"]
        const gf = all.filter(m => {
          const r = (m.rolle ?? '').toLowerCase().trim()
          return GF_ROLES.includes(r) || GF_ROLES.includes(decodeURIComponent(r))
        })
        // If no Gruppenführer found, show all (fallback)
        setMitarbeiter(gf.length > 0 ? gf : all)
      })
  }, [])

  // Auto-fill group name when Gruppenführer is selected (only for new groups)
  const handleFuehrerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setForm(f => {
      const isNewGroup = !gruppe?.id
      if (isNewGroup && id) {
        const selected = mitarbeiter.find(m => m.id === id)
        if (selected) {
          return { ...f, gruppenfuehrerId: id, name: `${selected.vorname} ${selected.nachname}` }
        }
      }
      return { ...f, gruppenfuehrerId: id }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      saisonId: form.saisonId || null,
      gruppenfuehrerId: form.gruppenfuehrerId || null,
    }
    const url = gruppe?.id ? `/api/gruppen/${gruppe.id}` : "/api/gruppen"
    const method = gruppe?.id ? "PATCH" : "POST"
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Fehler beim Speichern")
        setLoading(false)
        return
      }
      if (gruppe?.id) {
        toast.success("Gruppe aktualisiert")
      } else {
        toast.success("Gruppe erfolgreich angelegt")
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
      toast.error("Fehler: " + msg)
      setLoading(false)
      return
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl w-full max-w-md flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">
            {gruppe?.id ? "Gruppe bearbeiten" : "Neue Gruppe"}
          </h2>
          <button onClick={onClose} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            <div>
              <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Gruppenführer</label>
              <select
                value={form.gruppenfuehrerId}
                onChange={handleFuehrerChange}
                className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
              >
                <option value="">— keiner —</option>
                {mitarbeiter.map(m => (
                  <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>
                ))}
              </select>
              {mitarbeiter.length === 0 && (
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Keine Gruppenführer gefunden. Bitte Rollen in Mitarbeiterverwaltung setzen.</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="z.B. Gruppe Nord"
                className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500"
                required
              />
              {!gruppe?.id && (
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Wird automatisch aus Gruppenführer-Name befüllt</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Saison</label>
              <select
                value={form.saisonId}
                onChange={e => setForm(f => ({ ...f, saisonId: e.target.value }))}
                className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
              >
                <option value="">— keine —</option>
                {saisons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="shrink-0 flex gap-3 p-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:border-zinc-500 transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !form.name}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

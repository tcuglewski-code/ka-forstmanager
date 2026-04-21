"use client"

import { useState } from "react"
import { toast } from "sonner"

interface Props {
  flaecheId: string
  initialStatus: string
  initialNotizen: string | null
}

export function FlaechenProfilForm({ flaecheId, initialStatus, initialNotizen }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [notizen, setNotizen] = useState(initialNotizen ?? "")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/saatguternte/register/${flaecheId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notizen }),
      })
      if (!res.ok) throw new Error("Speichern fehlgeschlagen")
      toast.success("Profil gespeichert")
    } catch {
      toast.error("Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full bg-[#1e1e1e] border border-border rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="ungeprüft">Ungeprüft</option>
          <option value="interessant">Interessant</option>
          <option value="geplant">Geplant</option>
          <option value="aktiv">Aktiv</option>
          <option value="pausiert">Pausiert</option>
          <option value="abgeschlossen">Abgeschlossen</option>
          <option value="nicht_geeignet">Nicht geeignet</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">Notizen</label>
        <textarea
          value={notizen}
          onChange={(e) => setNotizen(e.target.value)}
          rows={4}
          placeholder="Interne Notizen zu dieser Fläche..."
          className="w-full bg-[#1e1e1e] border border-border rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
      >
        {saving ? "Speichern..." : "Profil speichern"}
      </button>
    </div>
  )
}

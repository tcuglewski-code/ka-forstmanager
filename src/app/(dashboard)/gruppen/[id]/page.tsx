"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, UserPlus, Trash2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Breadcrumb } from "@/components/layout/Breadcrumb"

interface Mitglied {
  id: string
  rolle: string
  mitarbeiter: { id: string; vorname: string; nachname: string; rolle: string }
}
interface Gruppe {
  id: string
  name: string
  status: string
  saison?: { name: string } | null
  mitglieder: Mitglied[]
  auftraege: { id: string; titel: string; status: string }[]
}
interface Mitarbeiter { id: string; vorname: string; nachname: string }

export default function GruppeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [gruppe, setGruppe] = useState<Gruppe | null>(null)
  const [allMitarbeiter, setAllMitarbeiter] = useState<Mitarbeiter[]>([])
  const [selectedMitarbeiterId, setSelectedMitarbeiterId] = useState("")
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    try {
      const [gRes, maRes] = await Promise.all([
        fetch(`/api/gruppen/${id}`),
        fetch("/api/mitarbeiter"),
      ])
      if (!gRes.ok) { router.push("/gruppen"); return }
      const [g, ma] = await Promise.all([gRes.json(), maRes.json()])
      setGruppe(g)
      setAllMitarbeiter(Array.isArray(ma) ? ma : (ma.items ?? []))
    } catch {
      router.push("/gruppen")
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  const addMitglied = async () => {
    if (!selectedMitarbeiterId) return
    setAdding(true)
    try {
      const res = await fetch(`/api/gruppen/${id}/mitglieder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mitarbeiterId: selectedMitarbeiterId }),
      })
      if (!res.ok) {
        const err = await res.text()
        toast.error(`Mitglied hinzufügen fehlgeschlagen: ${err}`)
        return
      }
      toast.success("Mitglied hinzugefügt")
      setSelectedMitarbeiterId("")
      load()
    } catch {
      toast.error("Netzwerkfehler beim Hinzufügen des Mitglieds")
    } finally {
      setAdding(false)
    }
  }

  const removeMitglied = async (mitarbeiterId: string) => {
    try {
      const res = await fetch(`/api/gruppen/${id}/mitglieder`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mitarbeiterId }),
      })
      if (!res.ok) {
        const err = await res.text()
        toast.error(`Mitglied entfernen fehlgeschlagen: ${err}`)
        return
      }
      toast.success("Mitglied entfernt")
      load()
    } catch {
      toast.error("Netzwerkfehler beim Entfernen des Mitglieds")
    }
  }

  if (!gruppe) return <div className="text-center py-16 text-zinc-600">Laden...</div>

  const existingIds = gruppe.mitglieder.map(m => m.mitarbeiter.id)
  const verfuegbareMitarbeiter = allMitarbeiter.filter(m => !existingIds.includes(m.id))

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumb items={[{ label: "Gruppen", href: "/gruppen" }, { label: gruppe.name }]} />
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[var(--color-on-surface-variant)] hover:text-white mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Zurück
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>{gruppe.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {gruppe.saison && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-forest text-emerald-400">
                {gruppe.saison.name}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs ${gruppe.status === "aktiv" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>
              {gruppe.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mitglieder */}
        <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-5">
          <h2 className="font-semibold text-[var(--color-on-surface)] mb-4">Mitglieder ({gruppe.mitglieder.length})</h2>

          <div className="space-y-2 mb-4">
            {gruppe.mitglieder.length === 0 ? (
              <p className="text-zinc-600 text-sm">Noch keine Mitglieder</p>
            ) : (
              gruppe.mitglieder.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-border">
                  <Link
                    href={`/mitarbeiter/${m.mitarbeiter.id}`}
                    className="flex items-center gap-2 group hover:text-emerald-400 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-[var(--color-on-surface)] group-hover:text-emerald-400 transition-colors">{m.mitarbeiter.vorname} {m.mitarbeiter.nachname}</p>
                      <p className="text-xs text-[var(--color-on-surface-variant)]">{m.rolle}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-[var(--color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <button
                    onClick={() => removeMitglied(m.mitarbeiter.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Mitglied hinzufügen */}
          <div className="flex gap-2">
            <select
              value={selectedMitarbeiterId}
              onChange={e => setSelectedMitarbeiterId(e.target.value)}
              className="flex-1 bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
            >
              <option value="">— Mitarbeiter wählen —</option>
              {verfuegbareMitarbeiter.map(m => (
                <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>
              ))}
            </select>
            <button
              onClick={addMitglied}
              disabled={!selectedMitarbeiterId || adding}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-all disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Aufträge */}
        <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-5">
          <h2 className="font-semibold text-[var(--color-on-surface)] mb-4">Aufträge ({gruppe.auftraege.length})</h2>
          {gruppe.auftraege.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Aufträge zugewiesen</p>
          ) : (
            <div className="space-y-2">
              {gruppe.auftraege.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border">
                  <p className="text-sm text-[var(--color-on-surface)]">{a.titel}</p>
                  <span className="text-xs text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-low)] px-2 py-0.5 rounded">{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

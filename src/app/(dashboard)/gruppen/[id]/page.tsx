"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, UserPlus, Trash2 } from "lucide-react"
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
    const [g, ma] = await Promise.all([
      fetch(`/api/gruppen/${id}`).then(r => r.json()),
      fetch("/api/mitarbeiter").then(r => r.json()),
    ])
    setGruppe(g)
    setAllMitarbeiter(ma)
  }, [id])

  useEffect(() => { load() }, [load])

  const addMitglied = async () => {
    if (!selectedMitarbeiterId) return
    setAdding(true)
    await fetch(`/api/gruppen/${id}/mitglieder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mitarbeiterId: selectedMitarbeiterId }),
    })
    setSelectedMitarbeiterId("")
    setAdding(false)
    load()
  }

  const removeMitglied = async (mitarbeiterId: string) => {
    await fetch(`/api/gruppen/${id}/mitglieder`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mitarbeiterId }),
    })
    load()
  }

  if (!gruppe) return <div className="text-center py-16 text-zinc-600">Laden...</div>

  const existingIds = gruppe.mitglieder.map(m => m.mitarbeiter.id)
  const verfuegbareMitarbeiter = allMitarbeiter.filter(m => !existingIds.includes(m.id))

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumb items={[{ label: "Gruppen", href: "/gruppen" }, { label: gruppe.name }]} />
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Zurück
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{gruppe.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {gruppe.saison && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-[#2C3A1C] text-emerald-400">
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
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Mitglieder ({gruppe.mitglieder.length})</h2>

          <div className="space-y-2 mb-4">
            {gruppe.mitglieder.length === 0 ? (
              <p className="text-zinc-600 text-sm">Noch keine Mitglieder</p>
            ) : (
              gruppe.mitglieder.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a]">
                  <div>
                    <p className="text-sm text-white">{m.mitarbeiter.vorname} {m.mitarbeiter.nachname}</p>
                    <p className="text-xs text-zinc-500">{m.rolle}</p>
                  </div>
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
              className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
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
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Aufträge ({gruppe.auftraege.length})</h2>
          {gruppe.auftraege.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Aufträge zugewiesen</p>
          ) : (
            <div className="space-y-2">
              {gruppe.auftraege.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a]">
                  <p className="text-sm text-white">{a.titel}</p>
                  <span className="text-xs text-zinc-500 bg-[#0f0f0f] px-2 py-0.5 rounded">{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

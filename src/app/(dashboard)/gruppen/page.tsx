"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Users, ChevronRight } from "lucide-react"
import Link from "next/link"
import { GruppeModal } from "@/components/gruppen/GruppeModal"

interface GruppeMitglied {
  id: string
  mitarbeiter: { vorname: string; nachname: string }
}
interface Gruppe {
  id: string
  name: string
  status: string
  saisonId?: string | null
  gruppenfuehrerId?: string | null
  saison?: { name: string } | null
  mitglieder: GruppeMitglied[]
}

export default function GruppenPage() {
  const [gruppen, setGruppen] = useState<Gruppe[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; gruppe?: Gruppe | null }>({ open: false })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/gruppen")
    setGruppen(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gruppen</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{gruppen.length} Gruppen</p>
        </div>
        <button
          onClick={() => setModal({ open: true, gruppe: null })}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Neue Gruppe
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-600">Laden...</div>
      ) : gruppen.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">Keine Gruppen vorhanden</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gruppen.map(g => (
            <div
              key={g.id}
              className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 hover:border-zinc-600 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{g.name}</h3>
                  {g.saison && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-[#2C3A1C] text-emerald-400">
                      {g.saison.name}
                    </span>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${g.status === "aktiv" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                  {g.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
                <Users className="w-4 h-4" />
                <span>{g.mitglieder.length} Mitglieder</span>
              </div>

              {g.mitglieder.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {g.mitglieder.slice(0, 4).map(m => (
                    <span key={m.id} className="text-xs bg-[#1e1e1e] text-zinc-400 px-2 py-0.5 rounded">
                      {m.mitarbeiter.vorname} {m.mitarbeiter.nachname.charAt(0)}.
                    </span>
                  ))}
                  {g.mitglieder.length > 4 && (
                    <span className="text-xs bg-[#1e1e1e] text-zinc-600 px-2 py-0.5 rounded">
                      +{g.mitglieder.length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/gruppen/${g.id}`}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[#1e1e1e] text-zinc-400 hover:text-white text-xs transition-all"
                >
                  Details <ChevronRight className="w-3 h-3" />
                </Link>
                <button
                  onClick={() => setModal({ open: true, gruppe: g })}
                  className="px-3 py-1.5 rounded-lg bg-[#1e1e1e] text-zinc-400 hover:text-white text-xs transition-all"
                >
                  Bearbeiten
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <GruppeModal
          gruppe={modal.gruppe}
          onClose={() => setModal({ open: false })}
          onSave={() => { setModal({ open: false }); load() }}
        />
      )}
    </div>
  )
}

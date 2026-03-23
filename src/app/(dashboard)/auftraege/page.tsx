"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Filter } from "lucide-react"
import { AuftragModal } from "@/components/auftraege/AuftragModal"

interface Auftrag {
  id: string
  titel: string
  typ: string
  status: string
  waldbesitzer?: string | null
  flaeche_ha?: number | null
  saison?: { name: string } | null
  gruppe?: { name: string } | null
  startDatum?: string | null
  createdAt: string
}

const STATUS_FARBEN: Record<string, string> = {
  anfrage: "bg-blue-500/20 text-blue-400",
  geprueft: "bg-sky-500/20 text-sky-400",
  angebot: "bg-violet-500/20 text-violet-400",
  bestaetigt: "bg-amber-500/20 text-amber-400",
  in_ausfuehrung: "bg-emerald-500/20 text-emerald-400",
  abgeschlossen: "bg-zinc-500/20 text-zinc-400",
}

const STATUS_LABELS: Record<string, string> = {
  anfrage: "Anfrage",
  geprueft: "Geprüft",
  angebot: "Angebot",
  bestaetigt: "Bestätigt",
  in_ausfuehrung: "In Ausführung",
  abgeschlossen: "Abgeschlossen",
}

const TYP_LABELS: Record<string, string> = {
  pflanzung: "Pflanzung",
  zaunbau: "Zaunbau",
  kulturschutz: "Kulturschutz",
  kulturpflege: "Kulturpflege",
  flaechenvorbereitung: "Flächenvorb.",
  saatguternte: "Saatguternte",
  pflanzenbeschaffung: "Pflanzenbeschaff.",
}

export default function AuftraegePage() {
  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("")
  const [filterTyp, setFilterTyp] = useState("")
  const [modal, setModal] = useState<{ open: boolean; auftrag?: Auftrag | null }>({ open: false })

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set("status", filterStatus)
    if (filterTyp) params.set("typ", filterTyp)
    const res = await fetch(`/api/auftraege?${params}`)
    setAuftraege(await res.json())
    setLoading(false)
  }, [filterStatus, filterTyp])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Aufträge</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{auftraege.length} Aufträge gesamt</p>
        </div>
        <button
          onClick={() => setModal({ open: true, auftrag: null })}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Auftrag
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2 text-zinc-500">
          <Filter className="w-4 h-4" />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select
          value={filterTyp}
          onChange={e => setFilterTyp(e.target.value)}
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Typen</option>
          {Object.entries(TYP_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Tabelle */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Titel</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Typ</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Waldbesitzer</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Fläche (ha)</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Saison</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Datum</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-zinc-600">Laden...</td></tr>
            ) : auftraege.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-zinc-600">Keine Aufträge gefunden</td></tr>
            ) : (
              auftraege.map(a => (
                <tr
                  key={a.id}
                  onClick={() => setModal({ open: true, auftrag: a })}
                  className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">{a.titel}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-[#2C3A1C] text-emerald-400">
                      {TYP_LABELS[a.typ] ?? a.typ}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_FARBEN[a.status] ?? "bg-zinc-700 text-zinc-300"}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{a.waldbesitzer ?? "–"}</td>
                  <td className="px-4 py-3 text-zinc-400">{a.flaeche_ha != null ? `${a.flaeche_ha} ha` : "–"}</td>
                  <td className="px-4 py-3 text-zinc-400">{a.saison?.name ?? "–"}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {a.startDatum ? new Date(a.startDatum).toLocaleDateString("de-DE") : new Date(a.createdAt).toLocaleDateString("de-DE")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <AuftragModal
          auftrag={modal.auftrag}
          onClose={() => setModal({ open: false })}
          onSave={() => { setModal({ open: false }); load() }}
        />
      )}
    </div>
  )
}

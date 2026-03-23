"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, Filter, Eye, Plus, Sparkles } from "lucide-react"
import { AuftragModal } from "@/components/auftraege/AuftragModal"
import Link from "next/link"

interface Auftrag {
  id: string
  titel: string
  typ: string
  status: string
  waldbesitzer?: string | null
  waldbesitzerEmail?: string | null
  flaeche_ha?: number | null
  bundesland?: string | null
  zeitraum?: string | null
  neuFlag?: boolean
  saison?: { name: string } | null
  gruppe?: { name: string } | null
  startDatum?: string | null
  createdAt: string
  wpErstelltAm?: string | null
}

const STATUS_FARBEN: Record<string, string> = {
  anfrage: "bg-blue-500/20 text-blue-400",
  geprueft: "bg-sky-500/20 text-sky-400",
  angebot: "bg-violet-500/20 text-violet-400",
  bestaetigt: "bg-amber-500/20 text-amber-400",
  in_ausfuehrung: "bg-emerald-500/20 text-emerald-400",
  abgeschlossen: "bg-zinc-500/20 text-zinc-400",
  laufend: "bg-emerald-500/20 text-emerald-400",
  auftrag: "bg-amber-500/20 text-amber-400",
}

const STATUS_LABELS: Record<string, string> = {
  anfrage: "Anfrage",
  geprueft: "Geprüft",
  angebot: "Angebot",
  bestaetigt: "Bestätigt",
  in_ausfuehrung: "In Ausführung",
  abgeschlossen: "Abgeschlossen",
  laufend: "Laufend",
  auftrag: "Auftrag",
}

const TYP_FARBEN: Record<string, string> = {
  pflanzung: "bg-emerald-500/20 text-emerald-400",
  flaechenvorbereitung: "bg-blue-500/20 text-blue-400",
  flachenvorbereitung: "bg-blue-500/20 text-blue-400",
  foerderberatung: "bg-purple-500/20 text-purple-400",
  foerdermittelberatung: "bg-purple-500/20 text-purple-400",
  zaunbau: "bg-orange-500/20 text-orange-400",
  kulturschutz: "bg-amber-500/20 text-amber-400",
  kulturpflege: "bg-yellow-500/20 text-yellow-400",
  saatguternte: "bg-cyan-500/20 text-cyan-400",
  pflanzenbeschaffung: "bg-teal-500/20 text-teal-400",
}

function typLabel(typ: string): string {
  const map: Record<string, string> = {
    pflanzung: "Pflanzung",
    flaechenvorbereitung: "Flächenvorb.",
    flachenvorbereitung: "Flächenvorb.",
    foerderberatung: "Förderberatung",
    foerdermittelberatung: "Förderberatung",
    zaunbau: "Zaunbau",
    kulturschutz: "Kulturschutz",
    kulturpflege: "Kulturpflege",
    saatguternte: "Saatguternte",
    pflanzenbeschaffung: "Pflanzenbeschaff.",
    unbekannt: "Unbekannt",
  }
  return map[typ] ?? typ
}

export default function AuftraegePage() {
  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ new: number; updated: number; synced: number } | null>(null)
  const [filterStatus, setFilterStatus] = useState("")
  const [filterTyp, setFilterTyp] = useState("")
  const [datumSort, setDatumSort] = useState<"desc" | "asc">("desc")
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

  const sync = useCallback(async (silent = false) => {
    setSyncing(true)
    try {
      const res = await fetch("/api/auftraege/sync", { method: "POST" })
      const data = await res.json()
      if (!silent) setSyncResult(data)
      await load()
    } catch (e) {
      console.error("Sync failed", e)
    } finally {
      setSyncing(false)
    }
  }, [load])

  // Auto-sync on mount, then load list
  useEffect(() => {
    sync(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!syncing) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterTyp])

  const neuCount = auftraege.filter(a => a.neuFlag).length

  const sortedAuftraege = [...auftraege].sort((a, b) => {
    const da = new Date(a.wpErstelltAm ?? a.createdAt).getTime()
    const db = new Date(b.wpErstelltAm ?? b.createdAt).getTime()
    return datumSort === "desc" ? db - da : da - db
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Aufträge</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {auftraege.length} Aufträge gesamt
            {neuCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
                {neuCount} neu
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => sync(false)}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] text-zinc-300 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sync..." : "Synchronisieren"}
          </button>
          <button
            onClick={() => setModal({ open: true, auftrag: null })}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Auftrag
          </button>
        </div>
      </div>

      {/* Sync result */}
      {syncResult && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          Sync: {syncResult.synced} Posts — {syncResult.new} neu, {syncResult.updated} aktualisiert
          <button onClick={() => setSyncResult(null)} className="ml-auto text-emerald-600 hover:text-emerald-400">✕</button>
        </div>
      )}

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
          <option value="anfrage">Anfrage</option>
          <option value="angebot">Angebot</option>
          <option value="auftrag">Auftrag</option>
          <option value="laufend">Laufend</option>
          <option value="abgeschlossen">Abgeschlossen</option>
          <option value="geprueft">Geprüft</option>
          <option value="bestaetigt">Bestätigt</option>
          <option value="in_ausfuehrung">In Ausführung</option>
        </select>
        <select
          value={filterTyp}
          onChange={e => setFilterTyp(e.target.value)}
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Typen</option>
          <option value="pflanzung">Pflanzung</option>
          <option value="flaechenvorbereitung">Flächenvorbereitung</option>
          <option value="foerderberatung">Förderberatung</option>
          <option value="zaunbau">Zaunbau</option>
          <option value="kulturschutz">Kulturschutz</option>
          <option value="kulturpflege">Kulturpflege</option>
        </select>
      </div>

      {/* Tabelle */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Titel</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Waldbesitzer</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Leistung</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Fläche</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Bundesland</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                <button
                  onClick={() => setDatumSort(s => s === "desc" ? "asc" : "desc")}
                  className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
                >
                  Datum {datumSort === "desc" ? "↓" : "↑"}
                </button>
              </th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading || syncing ? (
              <tr><td colSpan={8} className="text-center py-12 text-zinc-600">
                {syncing ? "Synchronisiere mit WordPress..." : "Laden..."}
              </td></tr>
            ) : auftraege.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-zinc-600">Keine Aufträge gefunden</td></tr>
            ) : (
              sortedAuftraege.map(a => (
                <tr
                  key={a.id}
                  className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] cursor-pointer transition-colors"
                  onClick={() => window.location.href = `/auftraege/${a.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium leading-tight">{a.titel}</span>
                      {a.neuFlag && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/30 text-emerald-300 rounded text-xs font-bold flex-shrink-0">
                          NEU
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{a.waldbesitzer ?? "–"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${TYP_FARBEN[a.typ] ?? "bg-zinc-700/50 text-zinc-400"}`}>
                      {typLabel(a.typ)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {a.flaeche_ha != null ? `${a.flaeche_ha} ha` : "–"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{a.bundesland ?? "–"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_FARBEN[a.status] ?? "bg-zinc-700 text-zinc-300"}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(a.wpErstelltAm ?? a.createdAt).toLocaleDateString("de-DE", {
                      day: "2-digit", month: "2-digit", year: "numeric"
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/auftraege/${a.id}`}
                      onClick={e => e.stopPropagation()}
                      className="text-zinc-600 hover:text-emerald-400 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <AuftragModal
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          auftrag={modal.auftrag as any}
          onClose={() => setModal({ open: false })}
          onSave={() => { setModal({ open: false }); load() }}
        />
      )}
    </div>
  )
}

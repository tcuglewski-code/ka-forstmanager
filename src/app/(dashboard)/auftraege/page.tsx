"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, Filter, Eye, Plus, Sparkles } from "lucide-react"
import { AuftragModal } from "@/components/auftraege/AuftragModal"
import Link from "next/link"
import { toast } from "sonner"

// X2: Saison-ID im Interface ergänzt
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
  saison?: { id: string; name: string } | null
  gruppe?: { name: string } | null
  startDatum?: string | null
  createdAt: string
  wpErstelltAm?: string | null
}

interface Saison {
  id: string
  name: string
  status: string
}

const STATUS_FARBEN: Record<string, string> = {
  anfrage: "bg-blue-500/20 text-blue-400",
  geprueft: "bg-sky-500/20 text-sky-400",
  angebot: "bg-violet-500/20 text-violet-400",
  bestaetigt: "bg-amber-500/20 text-amber-400",
  angenommen: "bg-green-500/20 text-green-400",  // Sprint FP (A2)
  in_ausfuehrung: "bg-emerald-500/20 text-emerald-400",
  abgeschlossen: "bg-green-600/30 text-green-300",  // Sprint FP (A2): grüner Badge
  laufend: "bg-emerald-500/20 text-emerald-400",
  auftrag: "bg-amber-500/20 text-amber-400",
  maengel_offen: "bg-red-500/20 text-red-400",  // Sprint FV
  abnahme: "bg-purple-500/20 text-purple-400",  // Sprint FV
}

const STATUS_LABELS: Record<string, string> = {
  anfrage: "Anfrage",
  geprueft: "Geprüft",
  angebot: "Angebot",
  bestaetigt: "Bestätigt",
  angenommen: "Angenommen",  // Sprint FP (A2)
  in_ausfuehrung: "In Ausführung",
  abgeschlossen: "Abgeschlossen",
  laufend: "Laufend",
  auftrag: "Auftrag",
  maengel_offen: "Mängel offen",  // Sprint FV
  abnahme: "Abnahme",  // Sprint FV
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
  const [syncResult, setSyncResult] = useState<{
    new: number
    updated: number
    synced: number
  } | null>(null)
  const [filterStatus, setFilterStatus] = useState("")
  const [filterTyp, setFilterTyp] = useState("")
  // X6: Neuer filterSaison State
  const [filterSaison, setFilterSaison] = useState("")
  const [suche, setSuche] = useState("")
  const [datumSort, setDatumSort] = useState<"desc" | "asc">("desc")
  const [modal, setModal] = useState<{ open: boolean; auftrag?: Auftrag | null }>({
    open: false,
  })
  const [selected, setSelected] = useState<string[]>([])
  const [saisons, setSaisons] = useState<Saison[]>([])
  const [gruppen, setGruppen] = useState<{ id: string; name: string }[]>([])
  // X4: Lokaler State für Bulk-Saisonzuweisung
  const [bulkSaisonId, setBulkSaisonId] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set("status", filterStatus)
    if (filterTyp) params.set("typ", filterTyp)
    if (suche) params.set("suche", suche)
    const res = await fetch(`/api/auftraege?${params}`)
    setAuftraege(await res.json())
    setLoading(false)
  }, [filterStatus, filterTyp, suche])

  const sync = useCallback(
    async (silent = false) => {
      setSyncing(true)
      try {
        const res = await fetch("/api/auftraege/sync", { method: "POST" })
        const data = await res.json()
        if (!silent) setSyncResult(data)
        await load()
      } catch (e) {
        console.error("Sync fehlgeschlagen", e)
      } finally {
        setSyncing(false)
      }
    },
    [load]
  )

  // Auto-Sync beim ersten Laden
  useEffect(() => {
    sync(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Saisons laden (inkl. Status für X5)
  useEffect(() => {
    fetch("/api/saisons")
      .then((r) => r.json())
      .then((d) => setSaisons(Array.isArray(d) ? d : []))
  }, [])

  // Gruppen laden
  useEffect(() => {
    fetch("/api/gruppen")
      .then((r) => r.json())
      .then((d) => setGruppen(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    if (!syncing) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterTyp])

  const neuCount = auftraege.filter((a) => a.neuFlag).length

  const sortedAuftraege = [...auftraege].sort((a, b) => {
    const da = new Date(a.wpErstelltAm ?? a.createdAt).getTime()
    const db = new Date(b.wpErstelltAm ?? b.createdAt).getTime()
    return datumSort === "desc" ? db - da : da - db
  })

  // X6: Saison-Filter in der Tabelle anwenden
  const filtered = sortedAuftraege.filter((a) => {
    if (suche) {
      const s = suche.toLowerCase()
      if (
        !a.titel?.toLowerCase().includes(s) &&
        !a.waldbesitzer?.toLowerCase().includes(s) &&
        !a.bundesland?.toLowerCase().includes(s)
      ) {
        return false
      }
    }
    if (filterSaison) {
      if (a.saison?.id !== filterSaison) return false
    }
    return true
  })

  // X4: Bulk-Saisonzuweisung anwenden
  const handleBulkSaisonAnwenden = async () => {
    if (!bulkSaisonId || selected.length === 0) return
    let errors = 0
    for (const id of selected) {
      const res = await fetch(`/api/auftraege/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saisonId: bulkSaisonId }),
      })
      if (!res.ok) errors++
    }
    setSelected([])
    setBulkSaisonId("")
    await load()
    if (errors > 0) {
      toast.error(`${errors} Aufträge konnten nicht aktualisiert werden`)
    } else {
      toast.success(`${selected.length} Aufträge der Saison zugewiesen`)
    }
  }

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

      {/* Sync-Ergebnis */}
      {syncResult && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          Sync: {syncResult.synced} Posts — {syncResult.new} neu,{" "}
          {syncResult.updated} aktualisiert
          <button
            onClick={() => setSyncResult(null)}
            className="ml-auto text-emerald-600 hover:text-emerald-400"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter-Leiste */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 text-zinc-500">
          <Filter className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Suche nach Titel, Waldbesitzer, Bundesland..."
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-64"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
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
          onChange={(e) => setFilterTyp(e.target.value)}
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

        {/* X6: Saison-Filter Dropdown */}
        <select
          value={filterSaison}
          onChange={(e) => setFilterSaison(e.target.value)}
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Saisons</option>
          {saisons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk-Aktionsleiste */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex-wrap">
          <span className="text-emerald-400 text-sm font-medium">
            {selected.length} Aufträge ausgewählt
          </span>

          {/* X4: Saison zuweisen mit Anwenden-Button */}
          <div className="flex items-center gap-2">
            <select
              value={bulkSaisonId}
              onChange={(e) => setBulkSaisonId(e.target.value)}
              className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-white"
            >
              <option value="">Saison zuweisen...</option>
              {/* X5: Nur nicht-abgeschlossene Saisons anzeigen */}
              {saisons
                .filter((s) => s.status !== "abgeschlossen")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
            <button
              onClick={handleBulkSaisonAnwenden}
              disabled={!bulkSaisonId}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              Anwenden
            </button>
          </div>

          {/* Gruppe zuweisen */}
          <select
            onChange={async (e) => {
              if (!e.target.value) return
              const count = selected.length
              let errors = 0
              for (const id of selected) {
                const res = await fetch(`/api/auftraege/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ gruppeId: e.target.value }),
                })
                if (!res.ok) errors++
              }
              setSelected([])
              e.target.value = ""
              await load()
              if (errors > 0) {
                toast.error(`${errors} Aufträge konnten nicht aktualisiert werden`)
              } else {
                toast.success(`${count} Aufträge aktualisiert`)
              }
            }}
            className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-white"
          >
            <option value="">Gruppe zuweisen...</option>
            {gruppen.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Status setzen */}
          <select
            onChange={async (e) => {
              if (!e.target.value) return
              const count = selected.length
              let errors = 0
              for (const id of selected) {
                const res = await fetch(`/api/auftraege/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: e.target.value }),
                })
                if (!res.ok) errors++
              }
              setSelected([])
              e.target.value = ""
              await load()
              if (errors > 0) {
                toast.error(`${errors} Aufträge konnten nicht aktualisiert werden`)
              } else {
                toast.success(`${count} Aufträge aktualisiert`)
              }
            }}
            className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-white"
          >
            <option value="">Status setzen...</option>
            <option value="anfrage">Anfrage</option>
            <option value="in_planung">In Planung</option>
            <option value="in_bearbeitung">In Bearbeitung</option>
            <option value="abgeschlossen">Abgeschlossen</option>
            <option value="storniert">Storniert</option>
          </select>

          {/* X3: Bulk-Löschen mit korrektem Error-Handling */}
          <button
            onClick={async () => {
              if (!confirm(`${selected.length} Aufträge wirklich löschen?`)) return
              const count = selected.length
              let errors = 0
              for (const id of selected) {
                const res = await fetch(`/api/auftraege/${id}`, {
                  method: "DELETE",
                })
                if (!res.ok) errors++
              }
              setSelected([])
              await load()
              if (errors > 0) {
                toast.error(
                  `${errors} von ${count} Aufträgen konnten nicht gelöscht werden`
                )
              } else {
                toast.success(`${count} Aufträge gelöscht`)
              }
            }}
            className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-lg text-sm text-red-400 hover:bg-red-500/30 transition-colors ml-2"
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
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    selected.length === filtered.length && filtered.length > 0
                  }
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? filtered.map((a) => a.id) : []
                    )
                  }
                  className="rounded border-zinc-600"
                />
              </th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Titel</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Waldbesitzer</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Leistung</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Fläche</th>
              {/* X6: Saison-Spalte */}
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Saison</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                <button
                  onClick={() =>
                    setDatumSort((s) => (s === "desc" ? "asc" : "desc"))
                  }
                  className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
                >
                  Datum {datumSort === "desc" ? "↓" : "↑"}
                </button>
              </th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading || syncing ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-zinc-600">
                  {syncing ? "Synchronisiere mit WordPress..." : "Laden..."}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-zinc-600">
                  Keine Aufträge gefunden
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] cursor-pointer transition-colors"
                  onClick={() => (window.location.href = `/auftraege/${a.id}`)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.includes(a.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, a.id]
                            : prev.filter((id) => id !== a.id)
                        )
                      }
                      className="rounded border-zinc-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium leading-tight">
                        {a.titel}
                      </span>
                      {a.neuFlag && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/30 text-emerald-300 rounded text-xs font-bold flex-shrink-0">
                          NEU
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {a.waldbesitzer ?? "–"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${TYP_FARBEN[a.typ] ?? "bg-zinc-700/50 text-zinc-400"}`}
                    >
                      {typLabel(a.typ)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {a.flaeche_ha != null ? `${a.flaeche_ha} ha` : "–"}
                  </td>
                  {/* X6: Saison-Spalte in der Tabelle */}
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {a.saison?.name ?? "–"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${STATUS_FARBEN[a.status] ?? "bg-zinc-700 text-zinc-300"}`}
                    >
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(a.wpErstelltAm ?? a.createdAt).toLocaleDateString(
                      "de-DE",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/auftraege/${a.id}`}
                      onClick={(e) => e.stopPropagation()}
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
          onSave={() => {
            setModal({ open: false })
            load()
          }}
        />
      )}
    </div>
  )
}

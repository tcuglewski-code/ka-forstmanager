"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, Filter, Eye, Plus, Sparkles, Download, List, BarChart3 } from "lucide-react"
import { AuftragModal } from "@/components/auftraege/AuftragModal"
import { GanttChart } from "@/components/auftraege/GanttChart"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/useConfirm"
import { fetchWithTimeout } from "@/hooks/useFetchWithTimeout"

// X2: Saison-ID im Interface ergänzt, Q048: Gruppen-ID für Gantt + Filter
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
  gruppe?: { id: string; name: string } | null
  startDatum?: string | null
  endDatum?: string | null
  createdAt: string
  wpErstelltAm?: string | null
}

interface Saison {
  id: string
  name: string
  status: string
}

const STATUS_FARBEN: Record<string, string> = {
  anfrage: "bg-blue-100 text-blue-800",
  geplant: "bg-cyan-100 text-cyan-800",  // QA-01: WCAG AA
  aktiv: "bg-lime-100 text-lime-800",  // QA-01: WCAG AA
  geprueft: "bg-sky-100 text-sky-800",
  angebot: "bg-violet-100 text-violet-800",
  bestaetigt: "bg-amber-100 text-amber-800",
  angenommen: "bg-green-100 text-green-800",  // Sprint FP (A2): WCAG AA
  in_ausfuehrung: "bg-emerald-100 text-emerald-800",
  abgeschlossen: "bg-green-100 text-green-800",  // Sprint FP (A2): WCAG AA
  laufend: "bg-emerald-100 text-emerald-800",
  auftrag: "bg-amber-100 text-amber-800",
  maengel_offen: "bg-red-100 text-red-800",  // Sprint FV
  abnahme: "bg-purple-100 text-purple-800",  // Sprint FV: WCAG AA
  in_bearbeitung: "bg-yellow-100 text-yellow-800",  // FM-27
  in_planung: "bg-indigo-100 text-indigo-800",  // FM-27
  storniert: "bg-gray-100 text-gray-600",  // FM-27
}

const STATUS_LABELS: Record<string, string> = {
  anfrage: "Anfrage",
  geplant: "Geplant",  // QA-01: Neuer Status
  aktiv: "Aktiv",  // QA-01: Neuer Status
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
  in_bearbeitung: "In Bearbeitung",  // FM-27
  in_planung: "In Planung",  // FM-27
  storniert: "Storniert",  // FM-27
}

const TYP_FARBEN: Record<string, string> = {
  pflanzung: "bg-emerald-100 text-emerald-800",
  flaechenvorbereitung: "bg-blue-100 text-blue-800",
  flachenvorbereitung: "bg-blue-100 text-blue-800",
  foerderberatung: "bg-purple-100 text-purple-800",
  foerdermittelberatung: "bg-purple-100 text-purple-800",
  zaunbau: "bg-orange-100 text-orange-800",
  kulturschutz: "bg-amber-100 text-amber-800",
  kulturpflege: "bg-amber-100 text-amber-800",
  saatguternte: "bg-cyan-100 text-cyan-800",
  pflanzenbeschaffung: "bg-teal-100 text-teal-800",
}

function typLabel(typ: string): string {
  const map: Record<string, string> = {
    pflanzung: "Pflanzung",
    flaechenvorbereitung: "Flächenvorb.",
    flachenvorbereitung: "Flächenvorb.",
    foerderberatung: "Betriebs-Assistent",
    foerdermittelberatung: "Betriebs-Assistent",
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
  const router = useRouter()
  const { confirm, ConfirmDialogElement } = useConfirm()
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
  // Q048: View-Mode (liste oder gantt)
  const [viewMode, setViewMode] = useState<"liste" | "gantt">("liste")
  // Q048: Filter nach Gruppenführer
  const [filterGruppe, setFilterGruppe] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set("status", filterStatus)
      if (filterTyp) params.set("typ", filterTyp)
      if (suche) params.set("search", suche)
      const res = await fetchWithTimeout(`/api/auftraege?${params}`)
      setAuftraege(await res.json())
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        toast.error("Laden dauert zu lange. Bitte Seite neu laden.")
      } else {
        toast.error("Fehler beim Laden der Aufträge.")
      }
      console.error("Aufträge laden fehlgeschlagen", e)
    } finally {
      setLoading(false)
    }
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

  // X6: Saison-Filter + Q048: Gruppen-Filter in der Tabelle anwenden
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
    // Q048: Gruppen-Filter
    if (filterGruppe) {
      if (a.gruppe?.id !== filterGruppe) return false
    }
    return true
  })

  // CSV Export Funktion
  const handleBulkExportCSV = () => {
    const selectedAuftraege = auftraege.filter(a => selected.includes(a.id))
    if (selectedAuftraege.length === 0) return
    
    // CSV Header
    const headers = [
      'ID',
      'Titel',
      'Waldbesitzer',
      'Email',
      'Typ',
      'Status',
      'Fläche (ha)',
      'Bundesland',
      'Saison',
      'Gruppe',
      'Erstellt am'
    ]
    
    // CSV Rows
    const rows = selectedAuftraege.map(a => [
      a.id,
      a.titel?.replace(/"/g, '""') || '',
      a.waldbesitzer?.replace(/"/g, '""') || '',
      a.waldbesitzerEmail || '',
      typLabel(a.typ),
      STATUS_LABELS[a.status] || a.status,
      a.flaeche_ha != null ? String(a.flaeche_ha) : '',
      a.bundesland || '',
      a.saison?.name || '',
      a.gruppe?.name || '',
      new Date(a.wpErstelltAm || a.createdAt).toLocaleDateString('de-DE')
    ])
    
    // Build CSV content with BOM for Excel compatibility
    const bom = '\uFEFF'
    const csvContent = bom + [
      headers.map(h => `"${h}"`).join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n')
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `auftraege-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success(`${selectedAuftraege.length} Aufträge als CSV exportiert`)
  }

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
      {ConfirmDialogElement}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>Aufträge</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            {auftraege.length} Aufträge gesamt
            {neuCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
                {neuCount} neu
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Q048: View-Mode Toggle */}
          <div className="flex items-center bg-surface-container-high rounded-lg p-1">
            <button
              onClick={() => setViewMode("liste")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "liste"
                  ? "bg-emerald-600 text-white"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <List className="w-4 h-4" />
              Liste
            </button>
            <button
              onClick={() => setViewMode("gantt")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "gantt"
                  ? "bg-emerald-600 text-white"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Gantt
            </button>
          </div>
          <button
            onClick={() => sync(false)}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest hover:bg-surface-container-highest text-on-surface rounded-lg text-sm font-medium transition-all disabled:opacity-50"
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
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Filter className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Suche nach Titel, Waldbesitzer, Bundesland..."
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          className="px-3 py-1.5 bg-surface-container-high border border-border rounded-lg text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-emerald-500 w-64"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-surface-container border border-border rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-emerald-500"
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
          className="bg-surface-container border border-border rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Typen</option>
          <option value="pflanzung">Pflanzung</option>
          <option value="flaechenvorbereitung">Flächenvorbereitung</option>
          <option value="foerderberatung">Betriebs-Assistent</option>
          <option value="zaunbau">Zaunbau</option>
          <option value="kulturschutz">Kulturschutz</option>
          <option value="kulturpflege">Kulturpflege</option>
        </select>

        {/* X6: Saison-Filter Dropdown */}
        <select
          value={filterSaison}
          onChange={(e) => setFilterSaison(e.target.value)}
          className="bg-surface-container border border-border rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Saisons</option>
          {saisons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Q048: Gruppen-Filter Dropdown */}
        <select
          value={filterGruppe}
          onChange={(e) => setFilterGruppe(e.target.value)}
          className="bg-surface-container border border-border rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Gruppen</option>
          {gruppen.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        {/* Export alle (gefilterte) Aufträge */}
        <button
          onClick={() => {
            if (filtered.length === 0) {
              toast.error('Keine Aufträge zum Exportieren')
              return
            }
            // CSV Header
            const headers = [
              'ID', 'Titel', 'Waldbesitzer', 'Email', 'Typ', 'Status',
              'Fläche (ha)', 'Bundesland', 'Saison', 'Gruppe', 'Erstellt am'
            ]
            // CSV Rows
            const rows = filtered.map(a => [
              a.id,
              a.titel?.replace(/"/g, '""') || '',
              a.waldbesitzer?.replace(/"/g, '""') || '',
              a.waldbesitzerEmail || '',
              typLabel(a.typ),
              STATUS_LABELS[a.status] || a.status,
              a.flaeche_ha != null ? String(a.flaeche_ha) : '',
              a.bundesland || '',
              a.saison?.name || '',
              a.gruppe?.name || '',
              new Date(a.wpErstelltAm || a.createdAt).toLocaleDateString('de-DE')
            ])
            const bom = '\uFEFF'
            const csvContent = bom + [
              headers.map(h => `"${h}"`).join(';'),
              ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
            ].join('\n')
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `auftraege-alle-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            toast.success(`${filtered.length} Aufträge als CSV exportiert`)
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high border border-border rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:border-outline-variant transition-colors ml-auto"
        >
          <Download className="w-4 h-4" />
          Alle exportieren ({filtered.length})
        </button>
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
              className="px-3 py-1.5 bg-surface-container-high border border-border rounded-lg text-sm text-on-surface"
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
            className="px-3 py-1.5 bg-surface-container-high border border-border rounded-lg text-sm text-on-surface"
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
            className="px-3 py-1.5 bg-surface-container-high border border-border rounded-lg text-sm text-on-surface"
          >
            <option value="">Status setzen...</option>
            <option value="anfrage">Anfrage</option>
            <option value="in_planung">In Planung</option>
            <option value="in_bearbeitung">In Bearbeitung</option>
            <option value="abgeschlossen">Abgeschlossen</option>
            <option value="storniert">Storniert</option>
          </select>

          {/* CSV Export */}
          <button
            onClick={handleBulkExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-800 hover:bg-blue-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV Export
          </button>

          {/* X3: Bulk-Löschen mit korrektem Error-Handling */}
          <button
            onClick={async () => {
              const ok = await confirm({ title: "Bestätigen", message: `${selected.length} Aufträge wirklich löschen?` })
              if (!ok) return
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
            className="text-xs text-on-surface-variant hover:text-on-surface ml-auto"
          >
            Auswahl aufheben
          </button>
        </div>
      )}

      {/* Q048: Conditional View - Liste oder Gantt */}
      {viewMode === "liste" ? (
        /* Tabelle */
        <div className="bg-surface-container border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border">
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
                    className="rounded border-outline-variant"
                  />
                </th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Titel</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Waldbesitzer</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Leistung</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Fläche</th>
                {/* X6: Saison-Spalte */}
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Saison</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Status</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">
                  <button
                    onClick={() =>
                      setDatumSort((s) => (s === "desc" ? "asc" : "desc"))
                    }
                    className="flex items-center gap-1 hover:text-on-surface transition-colors"
                  >
                    Datum {datumSort === "desc" ? "↓" : "↑"}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading || syncing ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-on-surface-variant">
                    {syncing ? "Synchronisiere mit WordPress..." : "Laden..."}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-on-surface-variant">
                    Keine Aufträge gefunden
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-outline-variant hover:bg-surface-container-high cursor-pointer transition-colors"
                    onClick={() => (router.push(`/auftraege/${a.id}`))}
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
                        className="rounded border-outline-variant"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-on-surface font-medium leading-tight">
                          {a.titel}
                        </span>
                        {a.neuFlag && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/30 text-emerald-300 rounded text-xs font-bold flex-shrink-0">
                            NEU
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {a.waldbesitzer ?? "–"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${TYP_FARBEN[a.typ] ?? "bg-surface-container-highest/50 text-on-surface-variant"}`}
                      >
                        {typLabel(a.typ)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {a.flaeche_ha != null ? `${a.flaeche_ha} ha` : "–"}
                    </td>
                    {/* X6: Saison-Spalte in der Tabelle */}
                    <td className="px-4 py-3 text-on-surface-variant text-xs">
                      {a.saison?.name ?? "–"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${STATUS_FARBEN[a.status] ?? "bg-surface-container-highest text-on-surface"}`}
                      >
                        {STATUS_LABELS[a.status] ?? a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
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
                        className="text-on-surface-variant hover:text-emerald-400 transition-colors"
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
        </div>
      ) : (
        /* Q048: Gantt-Ansicht mit Drag&Drop (KZ) */
        <GanttChart
          auftraege={filtered}
          onAuftragClick={(id) => router.push(`/auftraege/${id}`)}
          onAuftragUpdate={load}
        />
      )}

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

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Search,
  BookOpen,
  Building2,
  TreePine,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  UserPlus,
  Star,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react"

// ──────────────── Types ────────────────

interface ForstamtKontakt {
  id: number
  vorname: string
  nachname: string
  titel: string
  funktion: string
  funktion_kategorie: string
  revier: string | null
  telefon: string | null
  mobil: string | null
  email: string | null
  forstamt_name: string | null
  ort: string | null
  plz: string | null
  adresse: string | null
  bundesland_name: string | null
  bundesland_kuerzel: string | null
}

interface Betrieb {
  id: number
  name: string
  ort: string | null
  bundesland: string | null
  plz: string | null
  betriebsnummer: string | null
  betriebsart: string | null
  betriebsart_code: string | null
  ist_partner: boolean
}

interface Foerderprogramm {
  id: number
  name: string
  ebene: string | null
  bundesland: string | null
  kategorie: string | null
  foerderart: string | null
  traeger: string | null
  bewilligungsstelle: string | null
  zielgruppe: string | null
  foerdergegenstand: string | null
  foerderkulisse: string | null
  foerdersatz: string | null
  antragsfrist: string | null
  antragsweg: string | null
  foerdergrundlage: string | null
  url: string | null
  status: string | null
  geprueft: boolean
}

interface WissenChunk {
  id: number
  doc_title: string | null
  doc_source: string | null
  doc_type: string | null
  chunk_text: string
  chunk_index: number
  page_ref: string | null
  topic_kategorie: string | null
  created_at: string | null
}

// ──────────────── Constants ────────────────

const BUNDESLAENDER = [
  { kuerzel: "BW", name: "Baden-Württemberg" },
  { kuerzel: "BY", name: "Bayern" },
  { kuerzel: "BE", name: "Berlin" },
  { kuerzel: "BB", name: "Brandenburg" },
  { kuerzel: "HB", name: "Bremen" },
  { kuerzel: "HH", name: "Hamburg" },
  { kuerzel: "HE", name: "Hessen" },
  { kuerzel: "MV", name: "Mecklenburg-Vorpommern" },
  { kuerzel: "NI", name: "Niedersachsen" },
  { kuerzel: "NW", name: "Nordrhein-Westfalen" },
  { kuerzel: "RP", name: "Rheinland-Pfalz" },
  { kuerzel: "SL", name: "Saarland" },
  { kuerzel: "SN", name: "Sachsen" },
  { kuerzel: "ST", name: "Sachsen-Anhalt" },
  { kuerzel: "SH", name: "Schleswig-Holstein" },
  { kuerzel: "TH", name: "Thüringen" },
]

const TAB_LIST = [
  { id: "forstamter", label: "Forstamt-Kontakte", icon: Building2, count: "2.546" },
  { id: "baumschulen", label: "Betriebe", icon: TreePine, count: "2.046" },
  { id: "foerderprogramme", label: "Förderprogramme", icon: Star, count: "43" },
  { id: "wissen", label: "Wissen", icon: FileText, count: "1.641" },
] as const

type TabId = (typeof TAB_LIST)[number]["id"]

// ──────────────── Betriebsart Badge ────────────────

const BETRIEBSART_COLORS: Record<string, string> = {
  "Baumschule": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Waldbesitzer": "bg-green-500/20 text-green-400 border-green-500/30",
  "Ernter": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Reiner Händler": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Saat- und Pflanzgutbetrieb": "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "Klenge": "bg-orange-500/20 text-orange-400 border-orange-500/30",
}

function BetriebsartBadge({ betriebsart }: { betriebsart: string | null }) {
  if (!betriebsart) return <span className="text-zinc-600 text-xs">—</span>
  const cls = BETRIEBSART_COLORS[betriebsart] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${cls}`}>
      {betriebsart}
    </span>
  )
}

// ──────────────── Forstamt-Kontakte Tab ────────────────

function ForstamterTab() {
  const [data, setData] = useState<ForstamtKontakt[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [suche, setSuche] = useState("")
  const [bundesland, setBundesland] = useState("")
  const [sort, setSort] = useState("forstamt")
  const [order, setOrder] = useState<"asc" | "desc">("asc")
  const [offset, setOffset] = useState(0)
  const [importing, setImporting] = useState<number | null>(null)
  const limit = 50
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchData = useCallback(
    async (s: string, bl: string, so: string, or: string, off: number) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          suche: s,
          bundesland: bl,
          sort: so,
          order: or,
          limit: String(limit),
          offset: String(off),
        })
        const res = await fetch(`/api/secondbrain/forstamter?${params}`)
        const json = await res.json()
        setData(json.data || [])
        setTotal(json.total || 0)
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setOffset(0)
      fetchData(suche, bundesland, sort, order, 0)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [suche, bundesland, sort, order, fetchData])

  useEffect(() => {
    fetchData(suche, bundesland, sort, order, offset)
  }, [offset]) // eslint-disable-line

  const importKontakt = async (k: ForstamtKontakt) => {
    setImporting(k.id)
    try {
      const name = [k.titel, k.vorname, k.nachname].filter(Boolean).join(" ") || k.funktion
      await fetch("/api/kontakte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Unbekannt",
          typ: "foerster",
          telefon: k.telefon || k.mobil || "",
          email: k.email || "",
          forstamt: k.forstamt_name || "",
          revier: k.revier || "",
          adresse: k.adresse || "",
          notizen: `Importiert aus SecondBrain\nFunktion: ${k.funktion}\nBundesland: ${k.bundesland_name || ""}`,
        }),
      })
    } finally {
      setImporting(null)
    }
  }

  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)

  return (
    <div className="space-y-4">
      {/* Filter-Bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-600"
            placeholder="Suche nach Name, Funktion, Forstamt, Ort..."
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
          />
        </div>
        <select
          className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
          value={bundesland}
          onChange={(e) => setBundesland(e.target.value)}
        >
          <option value="">Alle Bundesländer</option>
          {BUNDESLAENDER.map((bl) => (
            <option key={bl.kuerzel} value={bl.kuerzel}>{bl.name}</option>
          ))}
        </select>
        <select
          className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="forstamt">Sortierung: Forstamt</option>
          <option value="name">Sortierung: Name</option>
          <option value="ort">Sortierung: Ort</option>
          <option value="bundesland">Sortierung: Bundesland</option>
        </select>
        <button
          onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
          className="flex items-center gap-1.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {order === "asc" ? "A→Z" : "Z→A"}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{loading ? "Lädt..." : `${total.toLocaleString("de")} Kontakte gefunden`}</span>
        {total > 0 && <span>Zeige {from}–{to} von {total.toLocaleString("de")}</span>}
      </div>

      {/* Table */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Name / Funktion</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Forstamt / Ort</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Bundesland</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Kontakt</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500 mx-auto" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Keine Kontakte gefunden
                  </td>
                </tr>
              ) : (
                data.map((k) => (
                  <tr key={k.id} className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-xs">
                        {[k.titel, k.vorname, k.nachname].filter(Boolean).join(" ") || "—"}
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5 truncate max-w-[200px]">{k.funktion}</p>
                      {k.revier && <p className="text-zinc-600 text-xs">Revier: {k.revier}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-zinc-300 text-xs">{k.forstamt_name || "—"}</p>
                      <p className="text-zinc-500 text-xs">{k.plz} {k.ort}</p>
                    </td>
                    <td className="px-4 py-3">
                      {k.bundesland_kuerzel && (
                        <span className="px-2 py-0.5 bg-[#2C3A1C] text-emerald-400 rounded text-xs">
                          {k.bundesland_kuerzel}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 space-y-1">
                      {k.telefon && (
                        <a href={`tel:${k.telefon}`} className="block text-xs text-blue-400 hover:underline">
                          📞 {k.telefon}
                        </a>
                      )}
                      {k.mobil && (
                        <a href={`tel:${k.mobil}`} className="block text-xs text-blue-400 hover:underline">
                          📱 {k.mobil}
                        </a>
                      )}
                      {k.email && (
                        <a href={`mailto:${k.email}`} className="block text-xs text-blue-400 hover:underline truncate max-w-[180px]">
                          ✉ {k.email}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => importKontakt(k)}
                        disabled={importing === k.id}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-lg text-xs hover:bg-emerald-600/30 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        {importing === k.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserPlus className="w-3 h-3" />
                        )}
                        Übernehmen
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1c1c1c] border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Zurück
          </button>
          <span className="text-sm text-zinc-500">
            Zeige {from}–{to} von {total.toLocaleString("de")}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1c1c1c] border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
          >
            Weiter <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ──────────────── Betriebe Tab ────────────────

function BetriebeTab() {
  const [data, setData] = useState<Betrieb[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [suche, setSuche] = useState("")
  const [betriebsartFilter, setBetriebsartFilter] = useState("")
  const [betriebsarten, setBetriebsarten] = useState<string[]>([])
  const [sortField, setSortField] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchData = useCallback(
    async (s: string, ba: string, sf: string, so: string, pg: number) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          suche: s,
          betriebsart: ba,
          sort: sf,
          order: so,
          limit: String(PAGE_SIZE),
          offset: String(pg * PAGE_SIZE),
        })
        const res = await fetch(`/api/secondbrain/baumschulen?${params}`)
        const json = await res.json()
        setData(json.data || [])
        setTotal(json.total || 0)
        if (json.betriebsarten) setBetriebsarten(json.betriebsarten)
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(0)
      fetchData(suche, betriebsartFilter, sortField, sortOrder, 0)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [suche, betriebsartFilter, sortField, sortOrder, fetchData])

  useEffect(() => {
    fetchData(suche, betriebsartFilter, sortField, sortOrder, page)
  }, [page]) // eslint-disable-line

  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE + PAGE_SIZE, total)

  return (
    <div className="space-y-4">
      {/* Filter-Bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-600"
            placeholder="Suche nach Name oder Ort..."
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
          />
        </div>
        <select
          className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
          value={betriebsartFilter}
          onChange={(e) => setBetriebsartFilter(e.target.value)}
        >
          <option value="">Alle Betriebsarten</option>
          {betriebsarten.map((ba) => (
            <option key={ba} value={ba}>{ba}</option>
          ))}
        </select>
        <select
          className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
        >
          <option value="name">Sortierung: Name</option>
          <option value="betriebsart">Sortierung: Betriebsart</option>
          <option value="ort">Sortierung: Ort</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="flex items-center gap-1.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortOrder === "asc" ? "A→Z" : "Z→A"}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{loading ? "Lädt..." : `${total.toLocaleString("de")} Betriebe gefunden`}</span>
        {total > 0 && <span>Zeige {from}–{to} von {total.toLocaleString("de")}</span>}
      </div>

      {/* Table */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Betriebsart</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Ort</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Bundesland</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Betr.-Nr.</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Partner</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500 mx-auto" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    Keine Betriebe gefunden
                  </td>
                </tr>
              ) : (
                data.map((b) => (
                  <tr key={b.id} className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white text-xs font-medium">{b.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <BetriebsartBadge betriebsart={b.betriebsart} />
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-300">
                      {[b.plz, b.ort].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{b.bundesland || "—"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 font-mono">{b.betriebsnummer || "—"}</td>
                    <td className="px-4 py-3">
                      {b.ist_partner ? (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-medium">
                          ⭐ Partner
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1c1c1c] border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Zurück
          </button>
          <span className="text-sm text-zinc-500">
            Zeige {from}–{to} von {total.toLocaleString("de")}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={(page + 1) * PAGE_SIZE >= total}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1c1c1c] border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
          >
            Weiter <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ──────────────── Förderprogramme Tab ────────────────

function FoerderprogrammeCard({ prog }: { prog: Foerderprogramm }) {
  const [open, setOpen] = useState(false)

  const statusColor =
    prog.status === "OFFEN"
      ? "bg-emerald-500/20 text-emerald-400"
      : "bg-zinc-500/20 text-zinc-400"

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-5 hover:bg-[#1a1a1a] transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                {prog.status || "Unbekannt"}
              </span>
              {prog.ebene && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                  {prog.ebene}
                </span>
              )}
              {prog.bundesland && (
                <span className="px-2 py-0.5 bg-[#2C3A1C] text-emerald-400 rounded-full text-xs">
                  {prog.bundesland}
                </span>
              )}
              {prog.kategorie && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                  {prog.kategorie}
                </span>
              )}
            </div>
            <h3 className="text-white font-semibold text-sm leading-tight">{prog.name}</h3>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-zinc-400">
              {prog.foerderart && <span>💰 {prog.foerderart}</span>}
              {prog.foerdersatz && <span>📊 {prog.foerdersatz}</span>}
              {prog.antragsfrist && <span>📅 {prog.antragsfrist}</span>}
            </div>
          </div>
          <div className="flex-shrink-0 text-zinc-500">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-[#2a2a2a] pt-4 space-y-3">
          {prog.traeger && (
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Träger</p>
              <p className="text-sm text-zinc-300">{prog.traeger}</p>
            </div>
          )}
          {prog.bewilligungsstelle && (
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Bewilligungsstelle</p>
              <p className="text-sm text-zinc-300">{prog.bewilligungsstelle}</p>
            </div>
          )}
          {prog.zielgruppe && (
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Zielgruppe</p>
              <p className="text-sm text-zinc-300">{prog.zielgruppe}</p>
            </div>
          )}
          {prog.foerdergegenstand && (
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Fördergegenstand</p>
              <p className="text-sm text-zinc-300">{prog.foerdergegenstand}</p>
            </div>
          )}
          {prog.foerderkulisse && (
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Förderkulisse</p>
              <p className="text-sm text-zinc-300">{prog.foerderkulisse}</p>
            </div>
          )}
          {prog.antragsweg && (
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Antragsweg</p>
              <p className="text-sm text-zinc-300">{prog.antragsweg}</p>
            </div>
          )}
          {prog.foerdergrundlage && (
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Fördergrundlage</p>
              <p className="text-sm text-zinc-300">{prog.foerdergrundlage}</p>
            </div>
          )}
          {prog.url && (
            <a
              href={prog.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs hover:bg-blue-500/30 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Weitere Informationen
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function FoerderprogrammeTab() {
  const [data, setData] = useState<Foerderprogramm[]>([])
  const [loading, setLoading] = useState(false)
  const [suche, setSuche] = useState("")
  const [bundesland, setBundesland] = useState("")
  const [kategorie, setKategorie] = useState("")
  const [kategorien, setKategorien] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [sort, setSort] = useState("name")
  const [apiError, setApiError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchData = useCallback(
    async (s: string, bl: string, kat: string, st: string, so: string) => {
      setLoading(true)
      setApiError(null)
      try {
        const params = new URLSearchParams({
          suche: s,
          bundesland: bl,
          kategorie: kat,
          status: st,
          sort: so,
        })
        const res = await fetch(`/api/secondbrain/foerderprogramme?${params}`)
        const json = await res.json()
        setData(json.data || [])
        if (json.kategorien) setKategorien(json.kategorien)
      } catch {
        setData([])
        setApiError("Datenbankverbindung konnte nicht hergestellt werden. Bitte Vercel ENV-Variable SECOND_BRAIN_URL prüfen.")
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchData(suche, bundesland, kategorie, statusFilter, sort)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [suche, bundesland, kategorie, statusFilter, sort, fetchData])

  // Sort client-side for antragsfrist / name
  const sorted = [...data].sort((a, b) => {
    if (sort === "antragsfrist") {
      return (a.antragsfrist || "").localeCompare(b.antragsfrist || "")
    }
    if (sort === "bundesland") {
      return (a.bundesland || "").localeCompare(b.bundesland || "")
    }
    return (a.name || "").localeCompare(b.name || "")
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-600"
            placeholder="Suche nach Programm, Fördergegenstand..."
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
          />
        </div>
        <select
          className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
          value={bundesland}
          onChange={(e) => setBundesland(e.target.value)}
        >
          <option value="">Alle Bundesländer</option>
          {BUNDESLAENDER.map((bl) => (
            <option key={bl.kuerzel} value={bl.name}>{bl.name}</option>
          ))}
        </select>
        {kategorien.length > 0 && (
          <select
            className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
            value={kategorie}
            onChange={(e) => setKategorie(e.target.value)}
          >
            <option value="">Alle Kategorien</option>
            {kategorien.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        )}
        <select
          className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Alle Status</option>
          <option value="OFFEN">Offen</option>
          <option value="GESCHLOSSEN">Geschlossen</option>
        </select>
        <select
          className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="name">Sortierung: Name</option>
          <option value="bundesland">Sortierung: Bundesland</option>
          <option value="antragsfrist">Sortierung: Antragsfrist</option>
        </select>
      </div>

      <div className="text-xs text-zinc-500">
        {loading ? "Lädt..." : `${data.length} Förderprogramme`}
      </div>

      {apiError ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <p className="text-amber-400 text-sm font-medium">Verbindungsfehler</p>
          <p className="text-zinc-500 text-xs text-center max-w-sm">{apiError}</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">Keine Förderprogramme gefunden</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((prog) => (
            <FoerderprogrammeCard key={prog.id} prog={prog} />
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────── Wissen Tab ────────────────

function WissenTab() {
  const [data, setData] = useState<WissenChunk[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [suche, setSuche] = useState("")
  const [kategorie, setKategorie] = useState("")
  const [kategorien, setKategorien] = useState<string[]>([])
  const [sort, setSort] = useState("relevanz")
  const [offset, setOffset] = useState(0)
  const [apiError, setApiError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const limit = 30
  const [hasSearched, setHasSearched] = useState(false)

  const fetchData = useCallback(
    async (s: string, kat: string, so: string, off: number) => {
      setLoading(true)
      setApiError(null)
      try {
        const params = new URLSearchParams({
          suche: s,
          kategorie: kat,
          sort: so,
          limit: String(limit),
          offset: String(off),
        })
        const res = await fetch(`/api/secondbrain/wissen?${params}`)
        const json = await res.json()
        setData(json.data || [])
        setTotal(json.total || 0)
        if (json.kategorien) setKategorien(json.kategorien)
      } catch {
        setData([])
        setApiError("Datenbankverbindung konnte nicht hergestellt werden. Bitte Vercel ENV-Variable SECOND_BRAIN_URL prüfen.")
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Load kategorien on mount
  useEffect(() => {
    fetchData("", "", "relevanz", 0)
  }, [fetchData])

  const handleSearch = () => {
    if (!suche && !kategorie) return
    setHasSearched(true)
    setOffset(0)
    fetchData(suche, kategorie, sort, 0)
  }

  useEffect(() => {
    if (hasSearched) {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        fetchData(suche, kategorie, sort, offset)
      }, 500)
    }
    return () => clearTimeout(debounceRef.current)
  }, [offset, sort]) // eslint-disable-line

  const highlightText = (text: string, search: string) => {
    if (!search) return text
    const parts = text.split(
      new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    )
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-300 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
        <p className="text-zinc-400 text-sm mb-4">
          Volltextsuche in{" "}
          {total > 0 && hasSearched ? `${total.toLocaleString("de")} Treffer aus ` : ""}
          1.641 gecrawlten Forstdokumenten und PDFs
        </p>
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-600"
              placeholder="z.B. Pflanzverband, Borkenkäfer, Fördersatz..."
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          {kategorien.length > 0 && (
            <select
              className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
              value={kategorie}
              onChange={(e) => setKategorie(e.target.value)}
            >
              <option value="">Alle Kategorien</option>
              {kategorien.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          )}
          <select
            className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              if (hasSearched) {
                setOffset(0)
                fetchData(suche, kategorie, e.target.value, 0)
              }
            }}
          >
            <option value="relevanz">Sortierung: Relevanz</option>
            <option value="datum">Sortierung: Datum</option>
            <option value="kategorie">Sortierung: Kategorie</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={!suche && !kategorie}
            className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Suchen
          </button>
        </div>
      </div>

      {/* Results */}
      {apiError ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <p className="text-amber-400 text-sm font-medium">Verbindungsfehler</p>
          <p className="text-zinc-500 text-xs text-center max-w-sm">{apiError}</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : !hasSearched ? (
        <div className="text-center py-12 text-zinc-500">
          <FileText className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
          <p>Suchbegriff eingeben um in der Wissensdatenbank zu suchen</p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
          Keine Treffer für &ldquo;{suche}&rdquo;
        </div>
      ) : (
        <>
          <div className="text-xs text-zinc-500">{total.toLocaleString("de")} Treffer</div>
          <div className="space-y-3">
            {data.map((chunk) => (
              <div key={chunk.id} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-white text-sm font-medium leading-tight">
                      {chunk.doc_title || "Unbekanntes Dokument"}
                    </p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {chunk.doc_type && (
                        <span className="px-2 py-0.5 bg-[#1e1e1e] text-zinc-400 rounded text-xs border border-[#2a2a2a]">
                          {chunk.doc_type}
                        </span>
                      )}
                      {chunk.topic_kategorie && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                          {chunk.topic_kategorie}
                        </span>
                      )}
                      {chunk.page_ref && (
                        <span className="text-xs text-zinc-600">S. {chunk.page_ref}</span>
                      )}
                    </div>
                  </div>
                  {chunk.doc_source && (
                    <a
                      href={chunk.doc_source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed line-clamp-4">
                  {highlightText(chunk.chunk_text, suche)}
                </p>
              </div>
            ))}
          </div>

          {total > limit && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1c1c1c] border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Zurück
              </button>
              <span className="text-sm text-zinc-500">
                Zeige {from}–{to} von {total.toLocaleString("de")}
              </span>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1c1c1c] border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                Weiter <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ──────────────── Main Page ────────────────

export default function WissensPage() {
  const [activeTab, setActiveTab] = useState<TabId>("forstamter")

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#2C3A1C] flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Wissensbank</h1>
          <p className="text-sm text-zinc-500">
            7.000+ Datensätze aus dem Forstbereich — Kontakte, Betriebe, Förderprogramme, Wissen
          </p>
        </div>
        <div className="ml-auto hidden sm:flex gap-2">
          <div className="px-3 py-1.5 bg-[#2C3A1C]/50 border border-emerald-900/50 rounded-lg text-xs text-emerald-400">
            🌲 SecondBrain DB
          </div>
          <div className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-xs text-zinc-400">
            7.064 Einträge
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#161616] p-1 rounded-xl border border-[#2a2a2a] overflow-x-auto">
        {TAB_LIST.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                isActive
                  ? "bg-[#2C3A1C] text-emerald-400"
                  : "text-zinc-400 hover:text-white hover:bg-[#1e1e1e]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="ml-1 text-xs opacity-60">({tab.count})</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "forstamter" && <ForstamterTab />}
        {activeTab === "baumschulen" && <BetriebeTab />}
        {activeTab === "foerderprogramme" && <FoerderprogrammeTab />}
        {activeTab === "wissen" && <WissenTab />}
      </div>
    </div>
  )
}

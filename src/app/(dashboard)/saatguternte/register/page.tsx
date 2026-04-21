export const dynamic = "force-dynamic"
export const revalidate = 0

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Leaf, Bot, Filter, X, Download, AlertTriangle, CheckCircle, MapPin, AlertCircle, RefreshCw } from "lucide-react"
import { RegisterTable } from "./RegisterTable"
import { Prisma } from "@prisma/client"
import { isCorruptedEntry } from "@/lib/register-parser"

interface SearchParams {
  bundesland?: string
  baumart?: string
  herkunft?: string
  quelleId?: string
  search?: string
  status?: string
  sonderherkunft?: string
  eigentumsart?: string
  gps?: string
  quality?: string
  page?: string
  sortBy?: string
  sortDir?: string
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const limit = 25
  const skip = (page - 1) * limit
  const sortBy = params.sortBy ?? "registerNr"
  const sortDir = (params.sortDir === "asc" ? "asc" : "desc") as "asc" | "desc"

  // Filter aufbauen
  const where: Prisma.RegisterFlaecheWhereInput = {}

  if (params.bundesland) where.bundesland = params.bundesland
  if (params.baumart) where.baumart = { contains: params.baumart, mode: "insensitive" }
  if (params.herkunft) where.herkunftsgebiet = { contains: params.herkunft, mode: "insensitive" }
  if (params.quelleId) where.quelleId = params.quelleId
  if (params.status === "zugelassen") where.zugelassen = true
  if (params.status === "abgelaufen") where.zugelassen = false
  if (params.sonderherkunft === "true") where.sonderherkunft = true
  if (params.eigentumsart) where.eigentumsart = params.eigentumsart
  if (params.gps === "mit_gps") where.latDez = { not: null }
  if (params.gps === "ohne_gps") where.latDez = null
  
  // Qualitäts-Filter: Ermittle fehlerhafte IDs, um sie zu filtern
  // Fehlerhafte Einträge haben sehr lange baumart-Felder (>100 Zeichen)
  // oder registerNr ohne Zahlen
  if (params.quality) {
    const allForQualityFilter = await prisma.registerFlaeche.findMany({
      select: { id: true, registerNr: true, baumart: true, latDez: true, lonDez: true, flaecheHa: true },
    })
    
    const corruptedIds: string[] = []
    const completeIds: string[] = []
    const incompleteIds: string[] = []
    
    for (const entry of allForQualityFilter) {
      const isCorrupted = isCorruptedEntry(entry.baumart, entry.registerNr)
      if (isCorrupted) {
        corruptedIds.push(entry.id)
      } else {
        const hasGps = entry.latDez != null && entry.lonDez != null
        const hasFlaeche = entry.flaecheHa != null
        if (hasGps && hasFlaeche) {
          completeIds.push(entry.id)
        } else {
          incompleteIds.push(entry.id)
        }
      }
    }
    
    if (params.quality === "fehlerhaft") {
      where.id = { in: corruptedIds }
    } else if (params.quality === "vollstaendig") {
      where.id = { in: completeIds }
    } else if (params.quality === "unvollstaendig") {
      where.id = { in: incompleteIds }
    }
  }
  
  if (params.search) {
    const s = params.search
    where.OR = [
      { registerNr: { contains: s, mode: "insensitive" } },
      { forstamt: { contains: s, mode: "insensitive" } },
      { revier: { contains: s, mode: "insensitive" } },
      { ansprechpartner: { contains: s, mode: "insensitive" } },
    ]
  }

  // OrderBy aufbauen
  const orderBy: Prisma.RegisterFlaecheOrderByWithRelationInput = {}
  const validSortFields = ["registerNr", "bundesland", "baumart", "flaecheHa", "forstamt", "zulassungBis"]
  if (validSortFields.includes(sortBy)) {
    ;(orderBy as Record<string, string>)[sortBy] = sortDir
  } else {
    orderBy.registerNr = "asc"
  }

  const [flaechen, total] = await Promise.all([
    prisma.registerFlaeche.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        quelle: { select: { name: true, kuerzel: true } },
        wetterDaten: { select: { id: true }, take: 1 },
        _count: { select: { medien: true } },
      },
    }),
    prisma.registerFlaeche.count({ where }),
  ])

  // Filter-Optionen
  const [bundeslaender, baumarten, quellen, eigentumsarten] = await Promise.all([
    prisma.registerFlaeche.findMany({
      select: { bundesland: true },
      distinct: ["bundesland"],
      orderBy: { bundesland: "asc" },
    }),
    prisma.registerFlaeche.findMany({
      select: { baumart: true },
      distinct: ["baumart"],
      orderBy: { baumart: "asc" },
    }),
    prisma.ernteRegisterQuelle.findMany({
      select: { id: true, name: true, kuerzel: true },
      orderBy: { name: "asc" },
    }),
    prisma.registerFlaeche.findMany({
      select: { eigentumsart: true },
      distinct: ["eigentumsart"],
      where: { eigentumsart: { not: null } },
      orderBy: { eigentumsart: "asc" },
    }),
  ])

  // Herkunfts-Optionen: nur wenn Baumart-Filter aktiv
  let herkunftsOptionen: string[] = []
  if (params.baumart) {
    const herkünfte = await prisma.registerFlaeche.findMany({
      where: { baumart: { contains: params.baumart, mode: "insensitive" }, herkunftsgebiet: { not: null } },
      select: { herkunftsgebiet: true },
      distinct: ["herkunftsgebiet"],
      orderBy: { herkunftsgebiet: "asc" },
    })
    herkunftsOptionen = herkünfte.map((h) => h.herkunftsgebiet!).filter(Boolean)
  }

  // Gesamtanzahl aller Flächen
  const gesamtanzahl = await prisma.registerFlaeche.count()

  // Qualitäts-Statistiken berechnen
  const allEntriesForQuality = await prisma.registerFlaeche.findMany({
    select: {
      id: true,
      registerNr: true,
      baumart: true,
      latDez: true,
      lonDez: true,
      flaecheHa: true,
    },
  })
  
  let corruptedCount = 0
  let withGpsCount = 0
  let withFlaecheCount = 0
  let completeCount = 0
  
  for (const entry of allEntriesForQuality) {
    const isCorrupted = isCorruptedEntry(entry.baumart, entry.registerNr)
    if (isCorrupted) {
      corruptedCount++
    } else {
      const hasGps = entry.latDez != null && entry.lonDez != null
      const hasFlaeche = entry.flaecheHa != null
      if (hasGps) withGpsCount++
      if (hasFlaeche) withFlaecheCount++
      if (hasGps && hasFlaeche) completeCount++
    }
  }
  
  const qualityStats = {
    total: gesamtanzahl,
    corrupted: corruptedCount,
    withGps: withGpsCount,
    withFlaeche: withFlaecheCount,
    complete: completeCount,
    qualityScore: gesamtanzahl > 0 ? Math.round(
      ((gesamtanzahl - corruptedCount) / gesamtanzahl) * 30 +
      (withGpsCount / gesamtanzahl) * 40 +
      (withFlaecheCount / gesamtanzahl) * 30
    ) : 0,
  }

  const hasFilter = !!(
    params.bundesland ||
    params.baumart ||
    params.herkunft ||
    params.quelleId ||
    params.search ||
    params.status ||
    params.sonderherkunft ||
    params.eigentumsart ||
    params.gps ||
    params.quality
  )

  // Serialisierung für Client Component
  const serializedFlaechen = flaechen.map((f) => ({
    ...f,
    zulassungBis: f.zulassungBis?.toISOString() ?? null,
    zulassungVon: f.zulassungVon?.toISOString() ?? null,
    letzteAktualisierung: f.letzteAktualisierung.toISOString(),
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    hatWetterdaten: f.wetterDaten.length > 0,
    sonderherkunft: f.sonderherkunft,
  }))

  return (
    <div className="max-w-7xl mx-auto">
      {/* Kopfzeile */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Erntebestand-Register</h1>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
              {gesamtanzahl.toLocaleString("de-DE")} Flächen
            </span>
          </div>
          <p className="text-zinc-500 text-sm mt-0.5 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5" />
            Zugelassene Erntbestände aus staatlichen Registern
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/saatguternte/register/export?${new URLSearchParams(params as Record<string, string>).toString()}`}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest hover:bg-[#333] text-zinc-300 rounded-lg text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            CSV Export
          </a>
          <Link
            href="/saatguternte/crawler"
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest hover:bg-[#333] text-zinc-300 rounded-lg text-sm font-medium transition-all"
          >
            <Bot className="w-4 h-4" />
            Crawler verwalten
          </Link>
        </div>
      </div>

      {/* Datenqualitäts-Übersicht */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 bg-[#1e1e1e] rounded-lg border border-border">
          <div className="text-xs text-zinc-500 mb-1">Qualitäts-Score</div>
          <div className={`text-xl font-bold ${qualityStats.qualityScore >= 70 ? 'text-emerald-400' : qualityStats.qualityScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {qualityStats.qualityScore}%
          </div>
        </div>
        <div className="p-3 bg-[#1e1e1e] rounded-lg border border-border">
          <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Mit GPS
          </div>
          <div className="text-xl font-bold text-blue-400">
            {qualityStats.withGps.toLocaleString("de-DE")}
          </div>
          <div className="text-xs text-zinc-600">{Math.round(qualityStats.withGps / qualityStats.total * 100)}%</div>
        </div>
        <div className="p-3 bg-[#1e1e1e] rounded-lg border border-border">
          <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Vollständig
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {qualityStats.complete.toLocaleString("de-DE")}
          </div>
          <div className="text-xs text-zinc-600">{Math.round(qualityStats.complete / qualityStats.total * 100)}%</div>
        </div>
        <div className="p-3 bg-[#1e1e1e] rounded-lg border border-border">
          <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Fehlerhaft
          </div>
          <div className="text-xl font-bold text-red-400">
            {qualityStats.corrupted.toLocaleString("de-DE")}
          </div>
          <div className="text-xs text-zinc-600">{Math.round(qualityStats.corrupted / qualityStats.total * 100)}%</div>
        </div>
        <div className="p-3 bg-[#1e1e1e] rounded-lg border border-border flex flex-col justify-between">
          <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Admin
          </div>
          {qualityStats.corrupted > 0 ? (
            <a 
              href="/api/saatguternte/admin/re-parse" 
              target="_blank"
              className="text-xs text-amber-400 hover:text-amber-300 underline"
            >
              Re-Parse starten
            </a>
          ) : (
            <span className="text-xs text-emerald-400">Alles OK ✓</span>
          )}
        </div>
      </div>
      
      {/* Warnung bei fehlerhaften Daten */}
      {qualityStats.corrupted > 0 && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>
              <strong>{qualityStats.corrupted}</strong> Einträge haben fehlerhafte Parsing-Daten (zusammengefügte Zeilen). 
              <Link href="/saatguternte/register?quality=fehlerhaft" className="underline ml-1">Nur fehlerhafte anzeigen</Link>
            </span>
          </div>
          <span className="text-xs text-zinc-500 hidden md:block">GET /api/saatguternte/admin/re-parse für Analyse</span>
        </div>
      )}

      {/* Filter-Bar */}
      <form method="GET" className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="flex items-center gap-2 text-zinc-500">
          <Filter className="w-4 h-4" />
        </div>
        <input
          type="text"
          name="search"
          defaultValue={params.search ?? ""}
          placeholder="Register-Nr, Forstamt, Revier..."
          className="px-3 py-1.5 bg-[#1e1e1e] border border-border rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-56"
        />
        <select
          name="bundesland"
          defaultValue={params.bundesland ?? ""}
          className="bg-[#161616] border border-border rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Bundesländer</option>
          {bundeslaender.map((b) => (
            <option key={b.bundesland} value={b.bundesland}>
              {b.bundesland}
            </option>
          ))}
        </select>
        <select
          name="baumart"
          defaultValue={params.baumart ?? ""}
          className="bg-[#161616] border border-border rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Baumarten</option>
          {baumarten.map((b) => (
            <option key={b.baumart} value={b.baumart}>
              {b.baumart}
            </option>
          ))}
        </select>
        {/* Herkunft-Filter — erscheint nur wenn Baumart ausgewählt */}
        {params.baumart && herkunftsOptionen.length > 0 && (
          <select
            name="herkunft"
            defaultValue={params.herkunft ?? ""}
            className="bg-[#161616] border border-border rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Alle Herkünfte ({herkunftsOptionen.length})</option>
            {herkunftsOptionen.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        )}
        <select
          name="quelleId"
          defaultValue={params.quelleId ?? ""}
          className="bg-[#161616] border border-border rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Quellen</option>
          {quellen.map((q) => (
            <option key={q.id} value={q.id}>
              {q.kuerzel} – {q.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="bg-[#161616] border border-border rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Status</option>
          <option value="zugelassen">Zugelassen</option>
          <option value="abgelaufen">Abgelaufen/Widerruf</option>
        </select>
        <select
          name="eigentumsart"
          defaultValue={params.eigentumsart ?? ""}
          className="bg-[#161616] border border-border rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Eigentumsarten</option>
          {eigentumsarten.map((e) => (
            <option key={e.eigentumsart} value={e.eigentumsart ?? ""}>
              {e.eigentumsart}
            </option>
          ))}
        </select>
        <select
          name="gps"
          defaultValue={params.gps ?? ""}
          className="bg-[#161616] border border-border rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">GPS: Alle</option>
          <option value="mit_gps">📍 Mit GPS</option>
          <option value="ohne_gps">❌ Ohne GPS</option>
        </select>
        <select
          name="quality"
          defaultValue={params.quality ?? ""}
          className="bg-[#161616] border border-border rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Datenqualität: Alle</option>
          <option value="vollstaendig">✓ Vollständig (GPS + Fläche)</option>
          <option value="fehlerhaft">⚠️ Fehlerhaft (Parser-Bug)</option>
          <option value="unvollstaendig">○ Unvollständig</option>
        </select>
        <label className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] border border-border rounded-lg text-sm text-zinc-300 cursor-pointer hover:border-amber-500/50 transition-all select-none">
          <input
            type="checkbox"
            name="sonderherkunft"
            value="true"
            defaultChecked={params.sonderherkunft === "true"}
            className="accent-amber-500"
          />
          ⭐ Sonderherkünfte
        </label>
        <button
          type="submit"
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          Filtern
        </button>
        {hasFilter && (
          <Link
            href="/saatguternte/register"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-highest hover:bg-[#333] text-zinc-400 rounded-lg text-sm transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Zurücksetzen
          </Link>
        )}
      </form>

      {/* Tabelle */}
      <RegisterTable
        data={serializedFlaechen}
        total={total}
        page={page}
        limit={limit}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  )
}

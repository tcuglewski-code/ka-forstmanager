// @ts-nocheck
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { History, Package, TreeDeciduous, MapPin, Users, BarChart3, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { ErnteFilterClient } from "./ErnteFilterClient"
import { StatistikTab } from "./StatistikTab"

interface SearchParams {
  saison?: string
  baumart?: string
  bundesland?: string
  page?: string
  tab?: string
}

export default async function ErnteHistoriePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const activeTab = params.tab ?? "historie"
  const saison = params.saison && params.saison !== "alle" ? parseInt(params.saison) : undefined
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const limit = 25
  const skip = (page - 1) * limit

  // Filter aufbauen
  const where: any = {}
  if (saison) where.saison = saison
  if (params.baumart) where.baumart = { contains: params.baumart, mode: "insensitive" }
  if (params.bundesland) {
    where.profil = {
      flaeche: { bundesland: { contains: params.bundesland, mode: "insensitive" } },
    }
  }

  const [ernten, total] = await Promise.all([
    prisma.ernte.findMany({
      where,
      orderBy: { datum: "desc" },
      skip,
      take: limit,
      include: {
        profil: {
          include: {
            flaeche: {
              select: { id: true, registerNr: true, bundesland: true, baumart: true },
            },
          },
        },
        positionen: { select: { sammlerName: true } },
      },
    }),
    prisma.ernte.count({ where }),
  ])

  // Statistik-Cards (für gefilterte Saison)
  const [statsAgg, baumartCount, flaechenCount, sammlerRaw, saisons] = await Promise.all([
    prisma.ernte.aggregate({
      where,
      _sum: { mengeKgGesamt: true },
    }),
    prisma.ernte.findMany({
      where,
      select: { baumart: true },
      distinct: ["baumart"],
    }),
    prisma.ernte.findMany({
      where,
      select: { profilId: true },
      distinct: ["profilId"],
    }),
    prisma.erntePosition.findMany({
      where: { ernte: where },
      select: { sammlerName: true },
      distinct: ["sammlerName"],
    }),
    // Alle verfügbaren Saisons
    prisma.ernte.findMany({
      select: { saison: true },
      distinct: ["saison"],
      orderBy: { saison: "desc" },
    }),
  ])

  // Filter-Optionen
  const [baumartOptionen, bundeslandOptionen] = await Promise.all([
    prisma.ernte.findMany({
      select: { baumart: true },
      distinct: ["baumart"],
      orderBy: { baumart: "asc" },
    }),
    prisma.registerFlaeche.findMany({
      select: { bundesland: true },
      distinct: ["bundesland"],
      orderBy: { bundesland: "asc" },
    }),
  ])

  const gesamtKg = statsAgg._sum.mengeKgGesamt ?? 0
  const totalPages = Math.ceil(total / limit)
  const saisonLabel = saison ? String(saison) : "Gesamt"

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center">
            <History className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>Erntehistorie</h1>
            <p className="text-[var(--color-on-surface-variant)] text-sm">{total} Einträge{saison ? ` · Saison ${saison}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/saatguternte/ernte/neu"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            + Neue Ernte erfassen
          </Link>
        </div>
      </div>

      {/* ── Haupt-Tabs: Historie | Statistik ──────────────────────────────── */}
      <div className="flex gap-1 border-b border-border">
        <Link
          href="/saatguternte/ernte"
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "historie"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-[var(--color-on-surface-variant)] hover:text-zinc-300"
          }`}
        >
          📋 Erntehistorie
        </Link>
        <Link
          href="/saatguternte/ernte?tab=statistik"
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "statistik"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-[var(--color-on-surface-variant)] hover:text-zinc-300"
          }`}
        >
          📊 Statistik
        </Link>
      </div>

      {/* ── Tab: Statistik ────────────────────────────────────────────────── */}
      {activeTab === "statistik" && <StatistikTab />}

      {/* ── Tab: Erntehistorie (Statistik-Cards, Filter, Tabelle) ─────────── */}
      {activeTab === "historie" && <>

      {/* Statistik-Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <span className="text-[var(--color-on-surface-variant)] text-sm">Gesamternte {saisonLabel}</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>
            {gesamtKg.toLocaleString("de-DE", { maximumFractionDigits: 1 })} kg
          </p>
        </div>
        <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TreeDeciduous className="w-4 h-4 text-emerald-400" />
            <span className="text-[var(--color-on-surface-variant)] text-sm">Baumarten</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>
            {baumartCount.length} <span className="text-sm font-normal text-[var(--color-on-surface-variant)]">verschiedene</span>
          </p>
        </div>
        <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-[var(--color-on-surface-variant)] text-sm">Flächen beerntet</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>{flaechenCount.length}</p>
        </div>
        <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-[var(--color-on-surface-variant)] text-sm">Aktive Sammler</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>{sammlerRaw.length}</p>
        </div>
      </div>

      {/* Filter */}
      <ErnteFilterClient
        saisons={saisons.map((s) => s.saison)}
        baumartOptionen={baumartOptionen.map((b) => b.baumart)}
        bundeslandOptionen={bundeslandOptionen.map((b) => b.bundesland)}
        currentSaison={params.saison ?? "alle"}
        currentBaumart={params.baumart ?? ""}
        currentBundesland={params.bundesland ?? ""}
      />

      {/* Tabelle */}
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[var(--color-surface-container-low)]">
                <th className="px-4 py-3 text-left text-[var(--color-on-surface-variant)] font-medium">Saison</th>
                <th className="px-4 py-3 text-left text-[var(--color-on-surface-variant)] font-medium">Datum</th>
                <th className="px-4 py-3 text-left text-[var(--color-on-surface-variant)] font-medium">Fläche</th>
                <th className="px-4 py-3 text-left text-[var(--color-on-surface-variant)] font-medium">Bundesland</th>
                <th className="px-4 py-3 text-left text-[var(--color-on-surface-variant)] font-medium">Baumart</th>
                <th className="px-4 py-3 text-right text-[var(--color-on-surface-variant)] font-medium">Menge (kg)</th>
                <th className="px-4 py-3 text-left text-[var(--color-on-surface-variant)] font-medium">Sammler</th>
                <th className="px-4 py-3 text-center text-[var(--color-on-surface-variant)] font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {ernten.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-[var(--color-on-surface-variant)]">
                    Keine Ernten gefunden.
                  </td>
                </tr>
              ) : (
                ernten.map((e) => {
                  const sammlerNamen = [...new Set(e.positionen.map((p) => p.sammlerName))]
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-border hover:bg-[var(--color-surface-container-lowest)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-400 rounded text-xs font-medium">
                          {e.saison}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {new Date(e.datum).toLocaleDateString("de-DE")}
                      </td>
                      <td className="px-4 py-3">
                        {e.profil?.flaeche ? (
                          <Link
                            href={`/saatguternte/register/${e.profil.flaeche.id}`}
                            className="font-mono text-emerald-400 hover:text-emerald-300 text-xs"
                          >
                            {e.profil.flaeche.registerNr}
                          </Link>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-on-surface-variant)] text-xs">
                        {e.profil?.flaeche?.bundesland ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{e.baumart}</td>
                      <td className="px-4 py-3 text-right text-white font-medium">
                        {e.mengeKgGesamt !== null
                          ? e.mengeKgGesamt.toLocaleString("de-DE", { maximumFractionDigits: 1 })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {sammlerNamen.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {sammlerNamen.slice(0, 2).map((n) => (
                              <span
                                key={n}
                                className="px-1.5 py-0.5 bg-surface-container-highest text-[var(--color-on-surface-variant)] rounded text-xs"
                              >
                                {n}
                              </span>
                            ))}
                            {sammlerNamen.length > 2 && (
                              <span className="text-[var(--color-on-surface-variant)] text-xs">+{sammlerNamen.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/saatguternte/register/${e.profil?.flaecheId ?? ""}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-surface-container-highest)] hover:bg-surface-container-highest border border-border text-[var(--color-on-surface-variant)] hover:text-white rounded text-xs transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Detail
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-[var(--color-on-surface-variant)] text-sm">
              Seite {page} von {totalPages} · {total} Einträge
            </span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-surface-container-highest)] hover:bg-surface-container-highest border border-border text-[var(--color-on-surface-variant)] hover:text-white rounded text-sm transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Zurück
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-surface-container-highest)] hover:bg-surface-container-highest border border-border text-[var(--color-on-surface-variant)] hover:text-white rounded text-sm transition-colors"
                >
                  Weiter
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      </> /* Ende Tab: historie */}
    </div>
  )
}

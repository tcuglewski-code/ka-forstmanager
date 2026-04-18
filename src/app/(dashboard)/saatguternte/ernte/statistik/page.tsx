// @ts-nocheck
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  ArrowLeft,
  BarChart3,
  Package,
  Hash,
  MapPin,
  Users,
  TrendingUp,
} from "lucide-react"

interface SearchParams {
  saison?: string
}

export default async function StatistikPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const saisonParam = params.saison
  const saison = saisonParam ? parseInt(saisonParam) : undefined

  const ernteWhere: any = {}
  if (saison) ernteWhere.saison = saison

  // Verfügbare Saisons
  const saisonList = await prisma.ernte.findMany({
    select: { saison: true },
    distinct: ["saison"],
    orderBy: { saison: "desc" },
  })
  const saisons = saisonList.map((s) => s.saison)

  // A) Übersicht
  const [gesamtAgg, flaechenDistinct] = await Promise.all([
    prisma.ernte.aggregate({
      where: ernteWhere,
      _sum: { mengeKgGesamt: true },
      _count: { id: true },
    }),
    prisma.ernte.findMany({
      where: ernteWhere,
      select: { profilId: true },
      distinct: ["profilId"],
    }),
  ])

  const sammlerDistinct = await prisma.erntePosition.findMany({
    where: { ernte: ernteWhere },
    select: { sammlerName: true },
    distinct: ["sammlerName"],
  })

  const gesamtKg = gesamtAgg._sum.mengeKgGesamt ?? 0

  // B) Sammler-Ranking
  const sammlerGruppen = await prisma.erntePosition.groupBy({
    by: ["sammlerName"],
    where: { ernte: ernteWhere },
    _sum: { mengeKg: true, stunden: true },
    _count: { id: true },
    orderBy: { _sum: { mengeKg: "desc" } },
  })

  const sammlerMitAvg = sammlerGruppen.map((s) => ({
    sammlerName: s.sammlerName,
    gesamtKg: Math.round((s._sum.mengeKg ?? 0) * 10) / 10,
    einsaetze: s._count.id,
    avgKgEinsatz:
      s._count.id > 0 ? Math.round(((s._sum.mengeKg ?? 0) / s._count.id) * 10) / 10 : 0,
    avgKgTag:
      s._sum.stunden && s._sum.stunden > 0
        ? Math.round((((s._sum.mengeKg ?? 0) / s._sum.stunden) * 8) * 10) / 10
        : null,
  }))

  const top3 = sammlerMitAvg.slice(0, 3)
  const flop3 =
    sammlerMitAvg.length > 3
      ? [...sammlerMitAvg].reverse().slice(0, 3)
      : []

  // C) Baumart-Statistik
  const baumartGruppen = await prisma.ernte.groupBy({
    by: ["baumart"],
    where: ernteWhere,
    _sum: { mengeKgGesamt: true },
    _count: { id: true },
    orderBy: { _sum: { mengeKgGesamt: "desc" } },
  })

  const baumartStats = baumartGruppen.map((b) => ({
    baumart: b.baumart,
    gesamtKg: Math.round((b._sum.mengeKgGesamt ?? 0) * 10) / 10,
    anzahlErnten: b._count.id,
    avgKgErnte:
      b._count.id > 0 ? Math.round(((b._sum.mengeKgGesamt ?? 0) / b._count.id) * 10) / 10 : 0,
    anteilProzent:
      gesamtKg > 0 ? Math.round(((b._sum.mengeKgGesamt ?? 0) / gesamtKg) * 1000) / 10 : 0,
  }))

  // D) Bundesland-Statistik
  const erntenMitFlaeche = await prisma.ernte.findMany({
    where: ernteWhere,
    select: {
      mengeKgGesamt: true,
      profil: {
        select: {
          id: true,
          flaeche: { select: { bundesland: true } },
        },
      },
    },
  })

  const bundeslandMap = new Map<string, { kg: number; profilIds: Set<string> }>()
  for (const e of erntenMitFlaeche) {
    const bl = e.profil?.flaeche?.bundesland ?? "Unbekannt"
    if (!bundeslandMap.has(bl)) bundeslandMap.set(bl, { kg: 0, profilIds: new Set() })
    const entry = bundeslandMap.get(bl)!
    entry.kg += e.mengeKgGesamt ?? 0
    entry.profilIds.add(e.profil?.id ?? "")
  }

  const bundeslandStats = Array.from(bundeslandMap.entries())
    .map(([bl, data]) => ({
      bundesland: bl,
      gesamtKg: Math.round(data.kg * 10) / 10,
      anzahlFlaechen: data.profilIds.size,
      avgKgFlaeche:
        data.profilIds.size > 0 ? Math.round((data.kg / data.profilIds.size) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.gesamtKg - a.gesamtKg)

  // E) Durchschnitte
  const avgKgSammler =
    sammlerGruppen.length > 0 ? Math.round((gesamtKg / sammlerGruppen.length) * 10) / 10 : 0
  const avgKgFlaeche =
    flaechenDistinct.length > 0 ? Math.round((gesamtKg / flaechenDistinct.length) * 10) / 10 : 0
  const sammlerMitTag = sammlerMitAvg.filter((s) => s.avgKgTag !== null)
  const avgKgTag =
    sammlerMitTag.length > 0
      ? Math.round(
          (sammlerMitTag.reduce((a, s) => a + (s.avgKgTag ?? 0), 0) / sammlerMitTag.length) * 10
        ) / 10
      : null

  const rankEmojis = ["🥇", "🥈", "🥉"]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/saatguternte/ernte"
            className="p-2 rounded-lg hover:bg-[#1e1e1e] text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#2C3A1C] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>Ernte-Statistiken</h1>
            <p className="text-zinc-500 text-sm">
              {saison ? `Saison ${saison}` : "Alle Saisons"}
            </p>
          </div>
        </div>
        {/* Saison-Auswahl */}
        <div className="flex items-center gap-2">
          {saisons.map((s) => (
            <Link
              key={s}
              href={`?saison=${s}`}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                saison === s
                  ? "bg-emerald-700 text-white"
                  : "bg-[#1e1e1e] border border-[#2a2a2a] text-zinc-400 hover:text-white"
              }`}
            >
              {s}
            </Link>
          ))}
          {saison && (
            <Link
              href="/saatguternte/ernte/statistik"
              className="px-3 py-1.5 rounded-lg text-sm bg-[#1e1e1e] border border-[#2a2a2a] text-zinc-400 hover:text-white transition-colors"
            >
              Gesamt
            </Link>
          )}
        </div>
      </div>

      {/* A) Übersicht-Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Package,
            label: "Gesamternte",
            value: `${gesamtKg.toLocaleString("de-DE", { maximumFractionDigits: 1 })} kg`,
          },
          {
            icon: Hash,
            label: "Anzahl Ernten",
            value: gesamtAgg._count.id,
          },
          {
            icon: MapPin,
            label: "Flächen",
            value: flaechenDistinct.length,
          },
          {
            icon: Users,
            label: "Sammler",
            value: sammlerDistinct.length,
          },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-400 text-sm">{label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* B) Sammler-Ranking */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Sammler-Ranking
          </h2>

          {top3.length > 0 ? (
            <>
              <p className="text-zinc-500 text-xs mb-3">Top 3 (höchste Menge)</p>
              <div className="space-y-3 mb-5">
                {top3.map((s, i) => (
                  <div key={s.sammlerName} className="flex items-center gap-3">
                    <span className="text-xl w-8">{rankEmojis[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{s.sammlerName}</p>
                      <p className="text-zinc-500 text-xs">
                        {s.einsaetze} Einsätze · ∅ {s.avgKgEinsatz} kg/Einsatz
                        {s.avgKgTag !== null && ` · ∅ ${s.avgKgTag} kg/Tag`}
                      </p>
                    </div>
                    <span className="text-emerald-400 font-bold whitespace-nowrap">
                      {s.gesamtKg.toLocaleString("de-DE")} kg
                    </span>
                  </div>
                ))}
              </div>

              {flop3.length > 0 && (
                <>
                  <p className="text-zinc-500 text-xs mb-3">Flop 3 (niedrigste Menge)</p>
                  <div className="space-y-2">
                    {flop3.map((s) => (
                      <div
                        key={s.sammlerName}
                        className="flex items-center justify-between py-2 px-3 bg-[#1a1a1a] rounded-lg"
                      >
                        <p className="text-zinc-400 text-sm truncate">{s.sammlerName}</p>
                        <span className="text-zinc-500 text-sm whitespace-nowrap ml-3">
                          {s.gesamtKg.toLocaleString("de-DE")} kg
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-zinc-500 text-sm text-center py-8">
              Keine Sammler-Daten vorhanden.
            </p>
          )}
        </div>

        {/* E) Durchschnitte */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Durchschnitts-Statistiken
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#2a2a2a]">
              <span className="text-zinc-400 text-sm">∅ kg pro Sammler / Saison</span>
              <span className="text-white font-semibold">
                {avgKgSammler.toLocaleString("de-DE")} kg
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#2a2a2a]">
              <span className="text-zinc-400 text-sm">∅ kg pro Sammler / Tag</span>
              <span className="text-white font-semibold">
                {avgKgTag !== null ? `${avgKgTag.toLocaleString("de-DE")} kg` : "keine Stunden erfasst"}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400 text-sm">∅ kg pro Fläche</span>
              <span className="text-white font-semibold">
                {avgKgFlaeche.toLocaleString("de-DE")} kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* C) Ertrag pro Baumart */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-white font-semibold">Ertrag pro Baumart</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#111]">
                <th className="px-4 py-3 text-left text-zinc-400 font-medium">Baumart</th>
                <th className="px-4 py-3 text-right text-zinc-400 font-medium">Gesamtmenge kg</th>
                <th className="px-4 py-3 text-right text-zinc-400 font-medium">Ernten</th>
                <th className="px-4 py-3 text-right text-zinc-400 font-medium">∅ kg/Ernte</th>
                <th className="px-4 py-3 text-right text-zinc-400 font-medium">Anteil %</th>
              </tr>
            </thead>
            <tbody>
              {baumartStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                    Keine Daten vorhanden.
                  </td>
                </tr>
              ) : (
                baumartStats.map((b) => (
                  <tr key={b.baumart} className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3 text-zinc-300 font-medium">{b.baumart}</td>
                    <td className="px-4 py-3 text-right text-white">
                      {b.gesamtKg.toLocaleString("de-DE")}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">{b.anzahlErnten}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {b.avgKgErnte.toLocaleString("de-DE")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-[#2a2a2a] rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, b.anteilProzent)}%` }}
                          />
                        </div>
                        <span className="text-emerald-400 text-xs w-10 text-right">
                          {b.anteilProzent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* D) Ertrag pro Bundesland */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-white font-semibold">Ertrag pro Bundesland</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#111]">
                <th className="px-4 py-3 text-left text-zinc-400 font-medium">Bundesland</th>
                <th className="px-4 py-3 text-right text-zinc-400 font-medium">Gesamtmenge kg</th>
                <th className="px-4 py-3 text-right text-zinc-400 font-medium">Flächen</th>
                <th className="px-4 py-3 text-right text-zinc-400 font-medium">∅ kg/Fläche</th>
              </tr>
            </thead>
            <tbody>
              {bundeslandStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                    Keine Daten vorhanden.
                  </td>
                </tr>
              ) : (
                bundeslandStats.map((b) => (
                  <tr
                    key={b.bundesland}
                    className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="px-4 py-3 text-zinc-300 font-medium">{b.bundesland}</td>
                    <td className="px-4 py-3 text-right text-white">
                      {b.gesamtKg.toLocaleString("de-DE")}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">{b.anzahlFlaechen}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {b.avgKgFlaeche.toLocaleString("de-DE")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

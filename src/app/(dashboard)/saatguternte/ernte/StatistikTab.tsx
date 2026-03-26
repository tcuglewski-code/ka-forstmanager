"use client"

// @ts-nocheck
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BarChart3, Calendar, Clock, Euro,
  Users, TreePine, MapPin, ChevronUp, ChevronDown, Minus,
} from "lucide-react"

// ─── Typen ─────────────────────────────────────────────────────────────────

interface Kpis {
  gesamtKg:      number
  einsatztage:   number
  gesamtStunden: number
  gesamtKosten:  number
}

interface SammlerRank {
  rang:          number
  name:          string
  gesamtKg:      number
  gesamtStunden: number | null
  gesamtKosten:  number | null
  kgProStunde:   number | null
  anteilProzent: number
  jahre:         number[]
}

interface BaumartVgl {
  jahr2024: number
  jahr2025: number
  diff:     number
}

interface FlaechePerf {
  registerNr: string | null
  forstamt:   string | null
  baumart:    string
  gesamtKg:   number
  einsaetze:  number
  saisons:    number
}

interface StatistikData {
  kpis:                Kpis
  ranking:             SammlerRank[]
  jahresvergleich:     {
    baumartVergleich: Record<string, BaumartVgl>
    jahresSummen:     Record<string, number>
  }
  flaechenPerformance: FlaechePerf[]
  saisons:             { jahr: number; gruppenFuehrer: string | null }[]
  meta:                { generiert: string }
}

// ─── Helper ─────────────────────────────────────────────────────────────────

const fmt = (n: number | null | undefined, dec = 1) =>
  n == null ? "–" : n.toLocaleString("de-DE", { maximumFractionDigits: dec })

const fmtEur = (n: number | null | undefined) =>
  n == null ? "–" : `${n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

// ─── StatistikTab ────────────────────────────────────────────────────────────

export function StatistikTab() {
  const [data, setData]         = useState<StatistikData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [tab, setTab]           = useState<"uebersicht"|"ranking"|"vergleich"|"flaechen">("uebersicht")
  const [jahrFilter, setJahrFilter] = useState("alle")

  useEffect(() => {
    setLoading(true)
    setError(null)
    const url = jahrFilter !== "alle"
      ? `/api/saatguternte/statistik-v2?jahr=${jahrFilter}`
      : "/api/saatguternte/statistik-v2"
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [jahrFilter])

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        <BarChart3 className="w-6 h-6 mr-2 animate-pulse" /> Lade Statistiken…
      </div>
    )

  if (error)
    return <div className="p-6 text-red-400 font-medium">Fehler: {error}</div>

  if (!data) return null

  const { kpis, ranking, jahresvergleich, flaechenPerformance, saisons } = data
  const total = ranking.length

  // Farbe für Rang — heller Hintergrund → immer dunkle Schrift
  const rowClass = (rang: number) => {
    if (rang <= 3)         return "bg-green-50 dark:bg-green-950/30 text-gray-900 dark:text-gray-100"
    if (rang >= total - 2) return "bg-red-50 dark:bg-red-950/30 text-gray-900 dark:text-gray-100"
    return ""
  }

  const vergleichEntries = Object.entries(jahresvergleich.baumartVergleich)
    .sort(([, a], [, b]) => (b.jahr2024 + b.jahr2025) - (a.jahr2024 + a.jahr2025))

  const maxKg = Math.max(...ranking.map((r) => r.gesamtKg), 1)

  return (
    <div className="space-y-5">

      {/* ── Filter + Sub-Tabs ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1 border-b border-[#2a2a2a] overflow-x-auto pb-0 flex-1">
          {([
            { key: "uebersicht", label: "📊 Übersicht" },
            { key: "ranking",    label: "🏆 Sammler-Ranking" },
            { key: "vergleich",  label: "📅 Jahresvergleich" },
            { key: "flaechen",   label: "🗺️ Flächen" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-zinc-500">Jahr:</span>
          <select
            value={jahrFilter}
            onChange={(e) => setJahrFilter(e.target.value)}
            className="text-sm border border-[#2a2a2a] rounded px-2 py-1 bg-[#1e1e1e] text-zinc-300"
          >
            <option value="alle">Alle</option>
            {saisons.map((s) => (
              <option key={s.jahr} value={String(s.jahr)}>{s.jahr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Tab: Übersicht ──────────────────────────────────────────────────── */}
      {tab === "uebersicht" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                icon: <TreePine className="w-4 h-4 text-emerald-400" />,
                label: "Gesamtmenge",
                value: `${fmt(kpis.gesamtKg, 0)} kg`,
                color: "text-emerald-400",
              },
              {
                icon: <Calendar className="w-4 h-4 text-blue-400" />,
                label: "Einsatztage",
                value: String(kpis.einsatztage),
                color: "text-blue-400",
              },
              {
                icon: <Clock className="w-4 h-4 text-purple-400" />,
                label: "Gesamtstunden",
                value: `${fmt(kpis.gesamtStunden, 0)} h`,
                color: "text-purple-400",
              },
              {
                icon: <Euro className="w-4 h-4 text-orange-400" />,
                label: "Lohnkosten",
                value: fmtEur(kpis.gesamtKosten),
                color: "text-orange-400",
              },
            ].map((k) => (
              <div key={k.label} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 uppercase tracking-wide">
                  {k.icon} {k.label}
                </div>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {saisons.map((s) => {
              const kg = jahresvergleich.jahresSummen[String(s.jahr)] ?? 0
              return (
                <div key={s.jahr} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-lg text-white">Saison {s.jahr}</span>
                    <span className="bg-emerald-900/40 text-emerald-400 text-sm font-medium px-2 py-0.5 rounded">
                      {fmt(kg, 0)} kg
                    </span>
                  </div>
                  {s.gruppenFuehrer && (
                    <p className="text-sm text-zinc-500">
                      Gruppenführer: <span className="text-zinc-300">{s.gruppenFuehrer}</span>
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Tab: Sammler-Ranking ─────────────────────────────────────────────── */}
      {tab === "ranking" && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-500" />
            <span className="font-medium text-sm text-zinc-300">
              Sammler-Ranking ({total} Personen)
            </span>
            <span className="text-xs text-zinc-500 ml-2">
              🟢 Top 3 — Grün &nbsp;|&nbsp; 🔴 Bottom 3 — Rot
            </span>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-[#222] sm:hidden">
            {ranking.map((r) => (
              <div key={r.name} className={`p-3 ${rowClass(r.rang)}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-zinc-500 text-sm mr-2">#{r.rang}</span>
                    <span className="font-medium text-sm">{r.name}</span>
                  </div>
                  <span className="font-bold text-emerald-400 text-sm">{fmt(r.gesamtKg)} kg</span>
                </div>
                <div className="mt-2 h-1.5 bg-[#2a2a2a] rounded-full">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(r.gesamtKg / maxKg) * 100}%` }} />
                </div>
                <div className="flex gap-3 mt-1.5 text-xs text-zinc-500">
                  <span>{r.anteilProzent} %</span>
                  {r.kgProStunde && <span>{fmt(r.kgProStunde)} kg/h</span>}
                  <span>{r.jahre.join(", ")}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#111]">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500 uppercase w-10">#</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500 uppercase">Name</th>
                  <th className="px-3 py-2 text-right text-xs text-zinc-500 uppercase">Gesamt kg</th>
                  <th className="px-3 py-2 text-right text-xs text-zinc-500 uppercase">Anteil</th>
                  <th className="px-3 py-2 text-right text-xs text-zinc-500 uppercase">Stunden</th>
                  <th className="px-3 py-2 text-right text-xs text-zinc-500 uppercase">kg/h</th>
                  <th className="px-3 py-2 text-right text-xs text-zinc-500 uppercase">Kosten</th>
                  <th className="px-3 py-2 text-center text-xs text-zinc-500 uppercase">Jahre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {ranking.map((r) => (
                  <tr key={r.name} className={`hover:bg-[#1a1a1a] transition-colors ${rowClass(r.rang)}`}>
                    <td className="px-3 py-2 font-bold text-zinc-500 text-center">{r.rang}</td>
                    <td className="px-3 py-2">
                      <div>
                        <span className="font-medium">{r.name}</span>
                        <div className="mt-1 h-1 bg-[#2a2a2a] rounded-full w-28">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(r.gesamtKg / maxKg) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-white">{fmt(r.gesamtKg)} kg</td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-500">{fmt(r.anteilProzent)} %</td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-500">
                      {r.gesamtStunden != null ? `${fmt(r.gesamtStunden)} h` : "–"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.kgProStunde != null ? (
                        <span className={r.kgProStunde > 10 ? "text-emerald-400 font-medium" : "text-zinc-400"}>
                          {fmt(r.kgProStunde)}
                        </span>
                      ) : "–"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-500">{fmtEur(r.gesamtKosten)}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {r.jahre.map((j) => (
                          <span key={j} className="text-xs bg-[#2a2a2a] text-zinc-400 px-1.5 py-0.5 rounded">{j}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Jahresvergleich ─────────────────────────────────────────────── */}
      {tab === "vergleich" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(jahresvergleich.jahresSummen)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([jahr, kg]) => (
                <div key={jahr} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
                  <p className="text-sm text-zinc-500">Saison {jahr}</p>
                  <p className="text-2xl font-bold text-emerald-400">{fmt(kg, 0)} kg</p>
                </div>
              ))}
          </div>

          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2a2a2a] font-medium text-sm flex items-center gap-2 text-zinc-300">
              <BarChart3 className="w-4 h-4 text-zinc-500" />
              Baumarten 2024 vs 2025
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#111]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-zinc-500 uppercase">Baumart</th>
                    <th className="px-3 py-2 text-right text-xs text-zinc-500 uppercase">2024 (kg)</th>
                    <th className="px-3 py-2 text-right text-xs text-zinc-500 uppercase">2025 (kg)</th>
                    <th className="px-3 py-2 text-right text-xs text-zinc-500 uppercase">Veränderung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {vergleichEntries.map(([baumart, v]) => (
                    <tr key={baumart} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-3 py-2 font-medium text-zinc-300">{baumart}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-500">
                        {v.jahr2024 > 0 ? fmt(v.jahr2024) : "–"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                        {v.jahr2025 > 0 ? fmt(v.jahr2025) : "–"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {v.diff !== 0 ? (
                          <span className={`inline-flex items-center gap-0.5 font-medium ${v.diff > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {v.diff > 0 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {v.diff > 0 ? "+" : ""}{fmt(v.diff)} kg
                          </span>
                        ) : (
                          <span className="text-zinc-600 inline-flex items-center gap-0.5">
                            <Minus className="w-3 h-3" /> 0
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Flächen-Performance ─────────────────────────────────────────── */}
      {tab === "flaechen" && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2a2a] font-medium text-sm flex items-center gap-2 text-zinc-300">
            <MapPin className="w-4 h-4 text-zinc-500" />
            Flächen-Performance
            <span className="text-xs text-zinc-600 font-normal">(Top 25 nach kg)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#111]">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500 uppercase">Register-Nr.</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500 uppercase">Forstamt</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500 uppercase">Baumart</th>
                  <th className="px-3 py-2 text-right text-xs text-zinc-500 uppercase">Gesamt kg</th>
                  <th className="px-3 py-2 text-right text-xs text-zinc-500 uppercase">Einsätze</th>
                  <th className="px-3 py-2 text-right text-xs text-zinc-500 uppercase">Saisons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {flaechenPerformance.map((f, idx) => (
                  <tr key={idx} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-3 py-2">
                      {f.registerNr ? (
                        <Link
                          href={`/saatguternte/register?search=${encodeURIComponent(f.registerNr)}`}
                          className="text-blue-400 hover:underline font-mono text-sm"
                        >
                          {f.registerNr}
                        </Link>
                      ) : (
                        <span className="text-zinc-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-zinc-500 text-xs">{f.forstamt ?? "–"}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs bg-emerald-900/40 text-emerald-400 px-1.5 py-0.5 rounded">
                        {f.baumart}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-white">{fmt(f.gesamtKg)} kg</td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-500">{f.einsaetze}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-500">{f.saisons}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-600 text-right">
        Stand: {new Date(data.meta.generiert).toLocaleString("de-DE")}
      </p>
    </div>
  )
}

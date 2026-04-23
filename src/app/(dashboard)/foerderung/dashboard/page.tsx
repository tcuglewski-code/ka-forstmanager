"use client"

import { useState, useEffect } from "react"
import { RefreshCw, TrendingUp, Clock, Euro, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import { FristenWidget } from "@/components/foerderung/FristenWidget"
import { PraxisStatistik } from "@/components/foerderung/PraxisStatistik"
import KiDisclaimer from "@/components/ui/KiDisclaimer"

interface KPIs {
  gesamt_programme: number
  durchschn_erfolgsquote: number
  laufende_antraege: number
  gesamt_bewilligt_eur: number
}

interface ProgrammStats {
  id: number
  name: string
  bundesland: string | null
  anzahl_antraege: number
  erfolgreich: number
  erfolgsquote_prozent: number
  avg_bewilligungsdauer: number | null
  avg_bewilligungsquote_prozent: number | null
  gesamt_beantragt: number
  gesamt_bewilligt: number
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getErfolgsquoteColor(quote: number): string {
  if (quote >= 80) return "text-emerald-400"
  if (quote >= 50) return "text-yellow-400"
  return "text-red-400"
}

function getErfolgsquoteBg(quote: number): string {
  if (quote >= 80) return "bg-emerald-500/10"
  if (quote >= 50) return "bg-yellow-500/10"
  return "bg-red-500/10"
}

export default function FoerderungDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<KPIs>({
    gesamt_programme: 0,
    durchschn_erfolgsquote: 0,
    laufende_antraege: 0,
    gesamt_bewilligt_eur: 0,
  })
  const [programmeMitErfahrung, setProgrammeMitErfahrung] = useState<ProgrammStats[]>([])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch("/api/foerderung/stats")
      const data = await res.json()
      setKpis(data.kpis || {})
      setProgrammeMitErfahrung(data.programmeMitErfahrung || [])
    } catch (err) {
      console.error("Fehler beim Laden der Statistiken:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <KiDisclaimer />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>Erfolgsquoten Dashboard</h1>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">
            Übersicht unserer Fördererfahrungen und Statistiken
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-highest)] rounded-lg transition"
            title="Aktualisieren"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/foerderung/praxis"
            className="px-4 py-2 bg-forest hover:bg-[#3a4a2a] text-emerald-400 text-sm font-medium rounded-lg flex items-center gap-2 transition"
          >
            <FileText className="w-4 h-4" />
            Erfahrungen erfassen
          </Link>
        </div>
      </div>

      {/* Fristen-Widget — zeigt Programme mit konkreten Antragsfristen */}
      <FristenWidget />

      {/* Praxis-Statistiken — eigene Antragserfahrungen */}
      <PraxisStatistik />

      {/* KPI-Karten */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-[var(--color-on-surface-variant)] text-sm">Programme in DB</p>
          </div>
          <p className="text-3xl font-bold" style={{ color: "var(--color-on-surface)" }}>{kpis.gesamt_programme}</p>
        </div>

        <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-[var(--color-on-surface-variant)] text-sm">Ø Erfolgsquote</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-bold ${getErfolgsquoteColor(kpis.durchschn_erfolgsquote)}`}>
              {kpis.durchschn_erfolgsquote.toFixed(1)}%
            </p>
            {kpis.durchschn_erfolgsquote >= 70 ? (
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            ) : kpis.durchschn_erfolgsquote < 50 ? (
              <ArrowDownRight className="w-5 h-5 text-red-400" />
            ) : null}
          </div>
        </div>

        <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-[var(--color-on-surface-variant)] text-sm">Laufende Anträge</p>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{kpis.laufende_antraege}</p>
        </div>

        <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Euro className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-[var(--color-on-surface-variant)] text-sm">Gesamt bewilligt</p>
          </div>
          <p className="text-3xl font-bold text-purple-400">
            {formatEuro(kpis.gesamt_bewilligt_eur)}
          </p>
        </div>
      </div>

      {/* Erfahrungs-Tabelle */}
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">Unsere Erfahrungen pro Programm</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            Programme mit dokumentierten Anträgen
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                  Programm
                </th>
                <th className="px-5 py-3 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                  BL
                </th>
                <th className="px-5 py-3 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider text-center">
                  Anträge
                </th>
                <th className="px-5 py-3 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider text-center">
                  Erfolgsquote
                </th>
                <th className="px-5 py-3 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider text-center">
                  Ø Dauer
                </th>
                <th className="px-5 py-3 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider text-center">
                  Ø Bewilligungsquote
                </th>
                <th className="px-5 py-3 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider text-right">
                  Gesamt bewilligt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[var(--color-on-surface-variant)]">
                    Lade Statistiken...
                  </td>
                </tr>
              ) : programmeMitErfahrung.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[var(--color-on-surface-variant)]">
                    Noch keine Erfahrungen dokumentiert.{" "}
                    <Link href="/foerderung/praxis" className="text-emerald-400 hover:underline">
                      Jetzt starten →
                    </Link>
                  </td>
                </tr>
              ) : (
                programmeMitErfahrung.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--color-surface-container-highest)] transition">
                    <td className="px-5 py-4">
                      <p className="text-[var(--color-on-surface)] text-sm font-medium truncate max-w-[250px]">
                        {p.name}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-[var(--color-on-surface-variant)] text-sm">
                      {p.bundesland || "—"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-[var(--color-on-surface)] font-medium">{p.anzahl_antraege}</span>
                      <span className="text-[var(--color-on-surface-variant)] text-sm ml-1">
                        ({p.erfolgreich} ✓)
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-sm font-medium ${getErfolgsquoteBg(
                          p.erfolgsquote_prozent
                        )} ${getErfolgsquoteColor(p.erfolgsquote_prozent)}`}
                      >
                        {p.erfolgsquote_prozent}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-[var(--color-on-surface-variant)] text-sm">
                      {p.avg_bewilligungsdauer ? `${p.avg_bewilligungsdauer} Wo.` : "—"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {p.avg_bewilligungsquote_prozent != null ? (
                        <span
                          className={`text-sm font-medium ${getErfolgsquoteColor(
                            p.avg_bewilligungsquote_prozent
                          )}`}
                        >
                          {p.avg_bewilligungsquote_prozent.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-[var(--color-on-surface-variant)] text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-emerald-400 font-medium text-sm">
                        {formatEuro(p.gesamt_bewilligt)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-4 text-sm text-[var(--color-on-surface-variant)]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/50 rounded"></span>
          <span>≥80% Erfolgsquote</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/50 rounded"></span>
          <span>50-79% Erfolgsquote</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500/20 border border-red-500/50 rounded"></span>
          <span>&lt;50% Erfolgsquote</span>
        </div>
      </div>
    </div>
  )
}

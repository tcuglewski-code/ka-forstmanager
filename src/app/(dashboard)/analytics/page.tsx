"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { BarChart3, Users, ClipboardList, Receipt, TrendingUp, Loader2, Bot, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react"
import { KpiCard } from "@/components/analytics/KpiCard"
import { UmsatzChart } from "@/components/analytics/UmsatzChart"
import { StatusDonut } from "@/components/analytics/StatusDonut"
import { BaumartChart } from "@/components/analytics/BaumartChart"
import { BundeslandChart } from "@/components/analytics/BundeslandChart"
import { KapazitaetChart } from "@/components/analytics/KapazitaetChart"
import { KundenTabelle } from "@/components/analytics/KundenTabelle"

type Range = "3m" | "6m" | "12m" | "all"

interface OverviewResp {
  gesamtUmsatz: number
  aktiveKunden: number
  offeneAuftraege: number
  avgAuftragswert: number
  umsatzTrend: { monat: string; umsatz: number }[]
}

interface KundenResp {
  totalKunden: number
  ruhendeKundenAnzahl: number
  kunden: Array<{
    kunde: string
    auftragsAnzahl: number
    umsatz: number
    letzterAuftrag: string | null
    bindungsMonate: number
    clv: number
  }>
}

interface AuftraegeResp {
  statusVerteilung: { status: string; anzahl: number }[]
  bundeslandVerteilung: { bundesland: string; anzahl: number }[]
  avgDauerTage: number | null
}

interface MaterialResp {
  baumarten: { baumart: string; menge: number; wert: number }[]
}

interface KapazitaetResp {
  gruppenAnzahl: number
  mitarbeiterAnzahl: number
  unterkunftTrend: { monat: string; anzahl: number }[]
  gruppenAuslastung: { gruppe: string; auftraege: number; auftraegePerMonat: number; mitglieder: number }[]
}

const FOREST = "#012d1d"
const GOLD = "#C5A55A"

type Tab = "kpi" | "ki"

interface AiInsightData {
  id: string
  titel: string
  zusammenfassung: string
  empfehlungen: {
    empfehlungen?: Array<{ titel: string; beschreibung: string; prioritaet?: string; zeitraum?: string }>
    positiv?: string[]
    risiken?: string[]
  }
  generatedAt: string
}

interface AiInsightResp {
  insight: AiInsightData | null
  config: { aiEnabled: boolean; aiModel: string; aiFrequency: string; aiLastRun: string | null } | null
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role
  const allowed = ["ka_admin", "super_admin", "admin", "supervisor"].includes(role || "")

  const [tab, setTab] = useState<Tab>("kpi")
  const [range, setRange] = useState<Range>("12m")
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewResp | null>(null)
  const [kunden, setKunden] = useState<KundenResp | null>(null)
  const [auftraege, setAuftraege] = useState<AuftraegeResp | null>(null)
  const [material, setMaterial] = useState<MaterialResp | null>(null)
  const [kapazitaet, setKapazitaet] = useState<KapazitaetResp | null>(null)
  const [aiData, setAiData] = useState<AiInsightResp | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiRunning, setAiRunning] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    if (!allowed) return
    setLoading(true)
    Promise.all([
      fetch(`/api/analytics/overview?range=${range}`).then(r => r.json()),
      fetch(`/api/analytics/kunden?range=${range}`).then(r => r.json()),
      fetch(`/api/analytics/auftraege?range=${range}`).then(r => r.json()),
      fetch(`/api/analytics/material?range=${range}`).then(r => r.json()),
      fetch(`/api/analytics/kapazitaet?range=${range}`).then(r => r.json()),
    ])
      .then(([o, k, a, m, c]) => {
        setOverview(o)
        setKunden(k)
        setAuftraege(a)
        setMaterial(m)
        setKapazitaet(c)
      })
      .catch(e => console.error("Analytics fetch error:", e))
      .finally(() => setLoading(false))
  }, [range, allowed])

  const loadAiInsight = () => {
    setAiLoading(true)
    setAiError(null)
    fetch("/api/analytics/ai-insight")
      .then(r => r.json())
      .then((d: AiInsightResp) => setAiData(d))
      .catch(e => setAiError(e?.message || "Fehler beim Laden"))
      .finally(() => setAiLoading(false))
  }

  useEffect(() => {
    if (!allowed) return
    if (tab === "ki" && !aiData) loadAiInsight()
  }, [tab, allowed, aiData])

  const runAiAnalysis = async () => {
    setAiRunning(true)
    setAiError(null)
    try {
      const r = await fetch("/api/cron/analytics-ai", { method: "POST" })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || d?.detail || "Analyse fehlgeschlagen")
      loadAiInsight()
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Fehler")
    } finally {
      setAiRunning(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="rounded-2xl p-6 border" style={{ borderColor: "#fed7d7", backgroundColor: "#fff5f5" }}>
          <h2 className="text-lg font-semibold" style={{ color: "#c53030" }}>Kein Zugriff</h2>
          <p className="text-sm mt-2 opacity-80">
            Das Business-Analytics-Tool ist nur für Admins/Supervisor verfügbar.
          </p>
        </div>
      </div>
    )
  }

  const fmt = (n: number) => `${n.toLocaleString("de-DE")} €`

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3" style={{ color: FOREST }}>
            <BarChart3 className="w-7 h-7" />
            Business Analytics
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Management-Cockpit: Umsatz, Kunden, Aufträge, Kapazität.
          </p>
        </div>
        {tab === "kpi" && (
          <div className="flex items-center gap-2">
            {(["3m", "6m", "12m", "all"] as Range[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={
                  range === r
                    ? { backgroundColor: FOREST, color: "#fff", borderColor: FOREST }
                    : { backgroundColor: "transparent", color: FOREST, borderColor: "var(--color-outline-variant, #d1d5db)" }
                }
              >
                {r === "all" ? "Alle" : r.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b" style={{ borderColor: "var(--color-outline-variant, #e5e7eb)" }}>
        <button
          onClick={() => setTab("kpi")}
          className="px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px"
          style={{
            borderColor: tab === "kpi" ? FOREST : "transparent",
            color: tab === "kpi" ? FOREST : "var(--color-on-surface-variant, #6b7280)",
          }}
        >
          📊 Kennzahlen
        </button>
        <button
          onClick={() => setTab("ki")}
          className="px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px"
          style={{
            borderColor: tab === "ki" ? FOREST : "transparent",
            color: tab === "ki" ? FOREST : "var(--color-on-surface-variant, #6b7280)",
          }}
        >
          🤖 KI-Ratgeber
        </button>
      </div>

      {tab === "ki" ? (
        <KiRatgeberPanel
          data={aiData}
          loading={aiLoading}
          running={aiRunning}
          error={aiError}
          onRun={runAiAnalysis}
        />
      ) : (
        <>

      {/* Row 1 — KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Gesamtumsatz"
          value={overview ? fmt(overview.gesamtUmsatz) : "—"}
          hint={`im Zeitraum ${range === "all" ? "gesamt" : range.toUpperCase()}`}
          icon={<Receipt className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          title="Aktive Kunden"
          value={overview ? overview.aktiveKunden : "—"}
          hint={kunden ? `davon ${kunden.ruhendeKundenAnzahl} ruhend (>180d)` : undefined}
          icon={<Users className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          title="Offene Aufträge"
          value={overview ? overview.offeneAuftraege : "—"}
          hint={auftraege?.avgDauerTage ? `Ø Dauer: ${auftraege.avgDauerTage} Tage` : undefined}
          icon={<ClipboardList className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          title="Ø Auftragswert"
          value={overview ? fmt(overview.avgAuftragswert) : "—"}
          icon={<TrendingUp className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* Row 2 — Umsatz + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UmsatzChart data={overview?.umsatzTrend ?? []} />
        <StatusDonut data={auftraege?.statusVerteilung ?? []} title="Aufträge nach Status" />
      </div>

      {/* Row 3 — Kunden + Bundesland */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <KundenTabelle kunden={(kunden?.kunden ?? []).slice(0, 10)} />
        <BundeslandChart data={auftraege?.bundeslandVerteilung ?? []} />
      </div>

      {/* Row 4 — Baumart + Kapazität */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BaumartChart data={material?.baumarten ?? []} />
        <KapazitaetChart data={kapazitaet?.unterkunftTrend ?? []} />
      </div>

      {/* Row 5 — Full Kunden + Gruppen-Auslastung */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <KundenTabelle kunden={kunden?.kunden ?? []} />
        </div>
        <div className="rounded-2xl p-5 border" style={{
          backgroundColor: "var(--color-surface-container, #ffffff)",
          borderColor: "var(--color-outline-variant, #e5e7eb)",
        }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: FOREST }}>
            Gruppen-Auslastung
          </h3>
          <p className="text-xs opacity-70 mb-3">
            {kapazitaet?.gruppenAnzahl ?? 0} aktive Gruppen ·
            {" "}{kapazitaet?.mitarbeiterAnzahl ?? 0} aktive Mitarbeiter
          </p>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {(kapazitaet?.gruppenAuslastung ?? []).length === 0 && (
              <p className="text-xs opacity-60">Keine Daten.</p>
            )}
            {(kapazitaet?.gruppenAuslastung ?? []).map((g, i) => (
              <div key={i} className="flex items-center justify-between text-sm gap-2">
                <span className="truncate flex-1">{g.gruppe}</span>
                <span className="text-xs opacity-70">{g.mitglieder} MA</span>
                <span className="text-xs font-semibold" style={{ color: FOREST }}>
                  {g.auftraege} Aufträge
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

function KiRatgeberPanel({
  data,
  loading,
  running,
  error,
  onRun,
}: {
  data: AiInsightResp | null
  loading: boolean
  running: boolean
  error: string | null
  onRun: () => void
}) {
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: FOREST }} />
      </div>
    )
  }

  const aiDisabled = data?.config && data.config.aiEnabled === false

  if (aiDisabled) {
    return (
      <div className="rounded-2xl p-6 border" style={{ borderColor: "#fde68a", backgroundColor: "#fffbeb" }}>
        <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: "#92400e" }}>
          <Bot className="w-5 h-5" /> KI-Ratgeber deaktiviert
        </h3>
        <p className="text-sm mt-2 opacity-80">
          Die KI-Analyse ist aktuell deaktiviert. Aktivierung erfolgt in Mission Control unter „KI-Einstellungen".
        </p>
      </div>
    )
  }

  const insight = data?.insight
  const empfehlungen = insight?.empfehlungen?.empfehlungen ?? []
  const positiv = insight?.empfehlungen?.positiv ?? []
  const risiken = insight?.empfehlungen?.risiken ?? []
  const lastRun = data?.config?.aiLastRun

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl p-4 border"
        style={{ borderColor: "var(--color-outline-variant, #e5e7eb)", backgroundColor: "var(--color-surface-container, #ffffff)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: FOREST }}>
            <Sparkles className="w-5 h-5" style={{ color: GOLD }} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: FOREST }}>KI-Strategieanalyse</div>
            <div className="text-xs opacity-70">
              Modell: {data?.config?.aiModel ?? "—"} · Frequenz: {data?.config?.aiFrequency ?? "—"}
              {lastRun ? ` · Letzte Analyse: ${new Date(lastRun).toLocaleString("de-DE")}` : " · Noch keine Analyse"}
            </div>
          </div>
        </div>
        <button
          onClick={onRun}
          disabled={running}
          className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: FOREST, color: "#fff" }}
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {running ? "Analysiere…" : "Jetzt analysieren"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl p-4 border text-sm" style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      {!insight && !running && (
        <div className="rounded-2xl p-8 border text-center" style={{ borderColor: "var(--color-outline-variant, #e5e7eb)", backgroundColor: "var(--color-surface-container, #ffffff)" }}>
          <Bot className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm opacity-70">Noch keine KI-Analyse vorhanden. Starte die erste Analyse oben.</p>
        </div>
      )}

      {insight && (
        <>
          <div className="rounded-2xl p-5 border" style={{ borderColor: "var(--color-outline-variant, #e5e7eb)", backgroundColor: "var(--color-surface-container, #ffffff)" }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: FOREST }}>Zusammenfassung</h3>
            <p className="text-sm leading-relaxed">{insight.zusammenfassung || "—"}</p>
          </div>

          {empfehlungen.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: FOREST }}>Empfehlungen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {empfehlungen.map((e, i) => {
                  const prio = (e.prioritaet || "").toLowerCase()
                  const prioColor =
                    prio === "hoch" ? { bg: "#fef2f2", color: "#991b1b" }
                    : prio === "mittel" ? { bg: "#fffbeb", color: "#92400e" }
                    : { bg: "#f0fdf4", color: "#166534" }
                  return (
                    <div key={i} className="rounded-xl p-4 border" style={{ borderColor: "var(--color-outline-variant, #e5e7eb)", backgroundColor: "var(--color-surface-container, #ffffff)" }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="text-sm font-semibold" style={{ color: FOREST }}>{e.titel}</div>
                        {e.prioritaet && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap"
                            style={{ backgroundColor: prioColor.bg, color: prioColor.color }}>
                            {e.prioritaet}
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-80 leading-relaxed">{e.beschreibung}</p>
                      {e.zeitraum && <p className="text-[11px] opacity-60 mt-2">Zeitraum: {e.zeitraum}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5 border" style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }}>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: "#166534" }}>
                <CheckCircle2 className="w-4 h-4" /> Positiv
              </h3>
              {positiv.length === 0 ? (
                <p className="text-xs opacity-60">—</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {positiv.map((p, i) => <li key={i} className="flex gap-2"><span style={{ color: "#16a34a" }}>•</span><span>{p}</span></li>)}
                </ul>
              )}
            </div>
            <div className="rounded-2xl p-5 border" style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: "#991b1b" }}>
                <AlertTriangle className="w-4 h-4" /> Risiken
              </h3>
              {risiken.length === 0 ? (
                <p className="text-xs opacity-60">—</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {risiken.map((r, i) => <li key={i} className="flex gap-2"><span style={{ color: "#dc2626" }}>•</span><span>{r}</span></li>)}
                </ul>
              )}
            </div>
          </div>

          <p className="text-xs opacity-50 text-center">
            Generiert {new Date(insight.generatedAt).toLocaleString("de-DE")}
          </p>
        </>
      )}
    </div>
  )
}

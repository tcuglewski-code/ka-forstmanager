"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { BarChart3, Users, ClipboardList, Receipt, TrendingUp, Loader2 } from "lucide-react"
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

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role
  const allowed = ["ka_admin", "super_admin", "admin"].includes(role || "")

  const [range, setRange] = useState<Range>("12m")
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewResp | null>(null)
  const [kunden, setKunden] = useState<KundenResp | null>(null)
  const [auftraege, setAuftraege] = useState<AuftraegeResp | null>(null)
  const [material, setMaterial] = useState<MaterialResp | null>(null)
  const [kapazitaet, setKapazitaet] = useState<KapazitaetResp | null>(null)

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
      </div>

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
    </div>
  )
}

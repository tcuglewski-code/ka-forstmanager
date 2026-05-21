import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { auth } from "@/lib/auth"

export const maxDuration = 60

const TENANT_ID = "koch-aufforstung"
const ALLOWED_ROLES = ["ka_admin", "super_admin", "admin", "supervisor"]

async function isAuthorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  const authHeader = req.headers.get("authorization")
  const bypassHeader = req.headers.get("x-vercel-bypass-automation-protection")
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  if (bypass && bypassHeader === bypass) return true
  if (req.headers.get("x-vercel-cron") === "1") return true
  // Allow session-based manual trigger from admins
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (session?.user && ALLOWED_ROLES.includes(role || "")) return true
  return false
}

async function aggregateMetrics() {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [
    auftraegeTotal,
    auftraegeNeu30d,
    auftraegeOffen,
    auftraegeProStatus,
    rechnungenAgg,
    rechnungenOffenAgg,
    baumschulBestellungen,
    topBaumarten,
  ] = await Promise.all([
    prisma.auftrag.count({ where: { deletedAt: null } }),
    prisma.auftrag.count({ where: { deletedAt: null, createdAt: { gte: since } } }),
    prisma.auftrag.count({
      where: { deletedAt: null, status: { in: ["anfrage", "geplant", "aktiv", "in_bearbeitung"] } },
    }),
    prisma.auftrag.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.rechnung.aggregate({
      where: { deletedAt: null, rechnungsDatum: { gte: since } },
      _sum: { bruttoBetrag: true, betrag: true },
      _count: { _all: true },
      _avg: { bruttoBetrag: true },
    }),
    prisma.rechnung.aggregate({
      where: { deletedAt: null, status: "offen" },
      _sum: { bruttoBetrag: true, betrag: true },
      _count: { _all: true },
    }),
    prisma.baumschulBestellung.findMany({
      where: { createdAt: { gte: since } },
      select: { baumart: true, menge: true, status: true },
    }),
    prisma.auftrag.groupBy({
      by: ["baumarten"],
      where: { deletedAt: null, baumarten: { not: null }, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { baumarten: "desc" } },
      take: 10,
    }),
  ])

  const umsatz30dBrutto =
    rechnungenAgg._sum.bruttoBetrag ?? rechnungenAgg._sum.betrag ?? 0
  const offenBetrag =
    rechnungenOffenAgg._sum.bruttoBetrag ?? rechnungenOffenAgg._sum.betrag ?? 0

  return {
    zeitraum: "letzte_30_tage",
    auftraege: {
      gesamt: auftraegeTotal,
      neu_30d: auftraegeNeu30d,
      offen: auftraegeOffen,
      nach_status: auftraegeProStatus.map(s => ({ status: s.status, anzahl: s._count._all })),
    },
    finanzen: {
      umsatz_30d_brutto: Math.round(umsatz30dBrutto * 100) / 100,
      anzahl_rechnungen_30d: rechnungenAgg._count._all,
      avg_rechnung: Math.round((rechnungenAgg._avg.bruttoBetrag ?? 0) * 100) / 100,
      offene_rechnungen_anzahl: rechnungenOffenAgg._count._all,
      offene_rechnungen_betrag: Math.round(offenBetrag * 100) / 100,
    },
    baumschule: {
      bestellungen_30d: baumschulBestellungen.length,
      mengen_summe: baumschulBestellungen.reduce((a, b) => a + (b.menge ?? 0), 0),
      nach_status: Object.entries(
        baumschulBestellungen.reduce<Record<string, number>>((acc, b) => {
          acc[b.status] = (acc[b.status] ?? 0) + 1
          return acc
        }, {})
      ).map(([status, anzahl]) => ({ status, anzahl })),
    },
    baumarten_top: topBaumarten
      .filter(b => b.baumarten)
      .map(b => ({ baumarten: b.baumarten, anzahl: b._count._all })),
  }
}

type AiResponse = {
  zusammenfassung?: string
  empfehlungen?: Array<{ titel: string; beschreibung: string; prioritaet?: string; zeitraum?: string }>
  positiv?: string[]
  risiken?: string[]
}

function parseJsonResponse(text: string): AiResponse | null {
  if (!text) return null
  // Strip markdown fences if present
  let clean = text.trim()
  clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
  // Try direct parse
  try {
    return JSON.parse(clean)
  } catch {
    // Extract first {...} block
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        // Last resort: find outermost { } 
        const start = clean.indexOf("{")
        const end = clean.lastIndexOf("}")
        if (start !== -1 && end > start) {
          try { return JSON.parse(clean.slice(start, end + 1)) } catch { return null }
        }
        return null
      }
    }
    return null
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Load config (auto-create if missing)
  let config = await prisma.tenantConfig.findUnique({ where: { tenantId: TENANT_ID } })
  if (!config) {
    config = await prisma.tenantConfig.create({ data: { tenantId: TENANT_ID } })
  }

  if (!config.aiEnabled) {
    return NextResponse.json({ skipped: true, reason: "aiEnabled=false" })
  }

  const apiKey = config.aiApiKeyOverride || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 })
  }

  const metrics = await aggregateMetrics()

  const client = new Anthropic({ apiKey })
  const prompt =
    "Analysiere als Strategieberater für einen deutschen Forstbetrieb (Aufforstung, Baumschule) folgende Kennzahlen der letzten 30 Tage. " +
    "Gib konkrete, umsetzbare Handlungsempfehlungen. " +
    "Antworte AUSSCHLIESSLICH als gültiges JSON ohne Markdown-Fences in genau diesem Schema: " +
    '{"zusammenfassung":"string (1-3 Sätze)","empfehlungen":[{"titel":"string","beschreibung":"string","prioritaet":"hoch|mittel|niedrig","zeitraum":"string"}],"positiv":["string"],"risiken":["string"]}. ' +
    "Daten: " +
    JSON.stringify(metrics)

  let res
  try {
    res = await client.messages.create({
      model: config.aiModel,
      max_tokens: 1024,
      system: "Du bist ein Datenanalyst. Antworte IMMER und AUSSCHLIESSLICH mit reinem JSON. Kein Markdown, keine Erklärungen, keine ```-Blöcke. Nur das JSON-Objekt.",
      messages: [{ role: "user", content: prompt }],
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown"
    return NextResponse.json({ error: "Anthropic API error", detail: msg }, { status: 502 })
  }

  const textBlock = res.content.find(c => c.type === "text")
  const text = textBlock && "text" in textBlock ? textBlock.text : ""
  const parsed = parseJsonResponse(text)

  if (!parsed) {
    return NextResponse.json(
      { error: "Failed to parse model response", raw: text.slice(0, 500) },
      { status: 500 }
    )
  }

  const insight = await prisma.aiInsight.create({
    data: {
      tenantId: TENANT_ID,
      insightType: "business_strategy",
      titel: "KI-Strategieanalyse (30 Tage)",
      zusammenfassung: parsed.zusammenfassung ?? "",
      empfehlungen: {
        empfehlungen: parsed.empfehlungen ?? [],
        positiv: parsed.positiv ?? [],
        risiken: parsed.risiken ?? [],
      },
      quelldaten: metrics,
      konfidenz: null,
    },
  })

  await prisma.tenantConfig.update({
    where: { tenantId: TENANT_ID },
    data: { aiLastRun: new Date() },
  })

  return NextResponse.json({
    success: true,
    insightId: insight.id,
    model: config.aiModel,
    usage: {
      inputTokens: res.usage?.input_tokens,
      outputTokens: res.usage?.output_tokens,
    },
  })
}

// Allow same logic to be triggered from UI via POST
export const POST = GET

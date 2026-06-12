/**
 * DOK-059: Kosten-Tracking der Dokumenten-KI (admin-only).
 * GET /api/dokumente/kosten?monate=6 — Aggregation je Monat:
 * Scans, Summe Verarbeitungskosten (OCR+LLM), Ø Dauer, Status-Verteilung.
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"

const KostenSchema = z.object({ gesamtEur: z.number() }).partial()

interface MonatsEintrag {
  monat: string
  scans: number
  kostenEur: number
  dauerMsGesamt: number
  mitDauer: number
  status: Record<string, number>
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })

  const monate = Math.min(Math.max(parseInt(new URL(req.url).searchParams.get("monate") || "6"), 1), 24)
  const seit = new Date()
  seit.setMonth(seit.getMonth() - monate)

  const scans = await prisma.dokumentenScan.findMany({
    where: { erstelltAm: { gte: seit }, deletedAt: null },
    select: {
      status: true,
      erstelltAm: true,
      verarbeitungsKostenJson: true,
      verarbeitungsDauerMs: true,
    },
  })

  const proMonat = new Map<string, MonatsEintrag>()
  let gesamtEur = 0
  for (const s of scans) {
    const monat = s.erstelltAm.toISOString().slice(0, 7)
    const e: MonatsEintrag = proMonat.get(monat) ?? {
      monat,
      scans: 0,
      kostenEur: 0,
      dauerMsGesamt: 0,
      mitDauer: 0,
      status: {},
    }
    e.scans++
    // NEVER #23: Prisma-JSON via Zod, nicht via cast
    const kosten = KostenSchema.safeParse(s.verarbeitungsKostenJson)
    if (kosten.success && typeof kosten.data.gesamtEur === "number") {
      e.kostenEur += kosten.data.gesamtEur
      gesamtEur += kosten.data.gesamtEur
    }
    if (s.verarbeitungsDauerMs) {
      e.dauerMsGesamt += s.verarbeitungsDauerMs
      e.mitDauer++
    }
    e.status[s.status] = (e.status[s.status] ?? 0) + 1
    proMonat.set(monat, e)
  }

  const eintraege = Array.from(proMonat.values())
    .sort((a, b) => b.monat.localeCompare(a.monat))
    .map((e) => ({
      monat: e.monat,
      scans: e.scans,
      kostenEur: Number(e.kostenEur.toFixed(4)),
      avgDauerMs: e.mitDauer > 0 ? Math.round(e.dauerMsGesamt / e.mitDauer) : null,
      status: e.status,
    }))

  return NextResponse.json({
    zeitraumMonate: monate,
    scansGesamt: scans.length,
    kostenGesamtEur: Number(gesamtEur.toFixed(4)),
    monate: eintraege,
  })
}

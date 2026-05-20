/**
 * Analytics Seed-Demo
 * Erstellt Demo-Rechnungen für vorhandene Aufträge.
 * Nur in development verfügbar — production blockt mit 403.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAnalyticsRole } from "@/lib/analytics-utils"

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Seed-Demo nur in development verfügbar" }, { status: 403 })
  }

  const session = await requireAnalyticsRole()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const auftraege = await prisma.auftrag.findMany({
      where: { deletedAt: null },
      take: 20,
      orderBy: { createdAt: "desc" },
      select: { id: true, titel: true, waldbesitzer: true, createdAt: true },
    })

    if (auftraege.length === 0) {
      return NextResponse.json({ ok: false, info: "Keine Aufträge vorhanden" })
    }

    // Letzte 12 Monate
    const now = new Date()
    let counter = await prisma.rechnung.count()
    const erstellt: string[] = []

    for (const auftrag of auftraege) {
      const monatOffset = Math.floor(Math.random() * 12)
      const rDatum = new Date(now.getFullYear(), now.getMonth() - monatOffset, 5 + Math.floor(Math.random() * 20))
      const nettoBetrag = Math.round(1500 + Math.random() * 18500)
      const bruttoBetrag = Math.round(nettoBetrag * 1.19)
      counter += 1
      const nummer = `DEMO-${rDatum.getFullYear()}-${String(counter).padStart(4, "0")}`

      try {
        const r = await prisma.rechnung.create({
          data: {
            auftragId: auftrag.id,
            nummer,
            betrag: bruttoBetrag,
            mwst: 19,
            status: Math.random() > 0.3 ? "bezahlt" : "offen",
            rechnungsDatum: rDatum,
            faelligAm: new Date(rDatum.getTime() + 30 * 24 * 60 * 60 * 1000),
            nettoBetrag,
            bruttoBetrag,
            paidAt: Math.random() > 0.3 ? new Date(rDatum.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
          },
        })
        erstellt.push(r.nummer)
      } catch (e) {
        // ignore duplicate nummer
        console.warn("seed-demo skip:", (e as Error).message)
      }
    }

    return NextResponse.json({
      ok: true,
      erstelltAnzahl: erstellt.length,
      erstellt,
    })
  } catch (e) {
    console.error("[analytics/seed-demo]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

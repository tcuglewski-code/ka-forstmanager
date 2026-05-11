/**
 * GET /api/zeiterfassung/history — Stempeluhr History (App-Alias)
 * Query: user_id (ignored — uses authenticated user)
 * Response: { tage: [...], woche_summe_minuten, monat_summe_minuten }
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"

export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const mitarbeiterId = appUser.mitarbeiterId as string | null
  if (!mitarbeiterId) {
    return NextResponse.json({ tage: [], woche_summe_minuten: 0, monat_summe_minuten: 0 })
  }

  // Letzte 30 Tage
  const dreissigTageZurueck = new Date()
  dreissigTageZurueck.setDate(dreissigTageZurueck.getDate() - 30)

  const eintraege = await prisma.stundeneintrag.findMany({
    where: {
      mitarbeiterId,
      typ: { in: ["arbeit", "stempeluhr_aktiv"] },
      datum: { gte: dreissigTageZurueck },
    },
    orderBy: { datum: "desc" },
  })

  // Gruppieren nach Datum
  const byDate = new Map<string, { stunden: number; sessions: typeof eintraege }>()
  for (const e of eintraege) {
    const datum = e.datum.toISOString().split("T")[0]
    const cur = byDate.get(datum) ?? { stunden: 0, sessions: [] }
    cur.stunden += e.stunden ?? 0
    cur.sessions.push(e)
    byDate.set(datum, cur)
  }

  const tage = Array.from(byDate.entries()).map(([datum, val]) => {
    const gesamtMin = Math.round(val.stunden * 60)
    return {
      datum,
      gesamtzeit_minuten: gesamtMin,
      pausen_minuten: 0,
      ueberstunden_minuten: Math.max(0, gesamtMin - 480),
      sessions: val.sessions.map((s) => ({
        id: s.id,
        user_id: mitarbeiterId,
        start_time: s.createdAt.getTime(),
        end_time: s.updatedAt.getTime(),
        pausen: [],
        synced: true,
      })),
    }
  })

  // Woche (Montag 00:00 lokal)
  const now = new Date()
  const weekStart = new Date(now)
  const day = weekStart.getDay() || 7
  weekStart.setDate(now.getDate() - (day - 1))
  weekStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const woche = tage
    .filter((t) => new Date(t.datum) >= weekStart)
    .reduce((s, t) => s + t.gesamtzeit_minuten, 0)
  const monat = tage
    .filter((t) => new Date(t.datum) >= monthStart)
    .reduce((s, t) => s + t.gesamtzeit_minuten, 0)

  return NextResponse.json({
    tage,
    woche_summe_minuten: woche,
    monat_summe_minuten: monat,
  })
}

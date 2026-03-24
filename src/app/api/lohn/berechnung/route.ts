import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"

// GET /api/lohn/berechnung
// Automatische Lohnberechnung aus gespeicherten Stundenbuchungen
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const saisonId = searchParams.get("saisonId")

  // Lies alle Stundenbuchungen mit Mitarbeiter-Daten (Sprint P: saisonId-Filter)
  const eintraege = await prisma.stundeneintrag.findMany({
    where: saisonId ? { auftrag: { saisonId } } : {},
    include: {
      mitarbeiter: {
        select: { id: true, vorname: true, nachname: true, stundenlohn: true },
      },
    },
  })

  // Gruppiere nach Mitarbeiter
  const byMitarbeiter = new Map<
    string,
    {
      mitarbeiterId: string
      mitarbeiter: { id: string; vorname: string; nachname: string; stundenlohn: number | null }
      stunden: number
      bruttoLohn: number
      maschinenzuschlagGesamt: number
      eintraege: number
    }
  >()

  for (const e of eintraege) {
    const key = e.mitarbeiterId
    if (!byMitarbeiter.has(key)) {
      byMitarbeiter.set(key, {
        mitarbeiterId: key,
        mitarbeiter: e.mitarbeiter,
        stunden: 0,
        bruttoLohn: 0,
        maschinenzuschlagGesamt: 0,
        eintraege: 0,
      })
    }
    const m = byMitarbeiter.get(key)!
    m.stunden += e.stunden ?? 0
    const lohn = e.stundenlohn ?? e.mitarbeiter?.stundenlohn ?? 0
    m.bruttoLohn += (e.stunden ?? 0) * lohn
    m.maschinenzuschlagGesamt += (e.maschinenzuschlag ?? 0) * (e.stunden ?? 0)
    m.eintraege++
  }

  const result = Array.from(byMitarbeiter.values()).map((m) => ({
    mitarbeiterId: m.mitarbeiterId,
    mitarbeiter: m.mitarbeiter,
    stunden: m.stunden,
    stundenlohn: m.mitarbeiter?.stundenlohn ?? 0,
    bruttoLohn: m.bruttoLohn,
    maschinenzuschlag: m.maschinenzuschlagGesamt,
    gesamtLohn: m.bruttoLohn + m.maschinenzuschlagGesamt,
    eintraege: m.eintraege,
  }))

  return NextResponse.json(result)
}

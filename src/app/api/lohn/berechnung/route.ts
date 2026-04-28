import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"


// GET /api/lohn/berechnung?saisonId=xxx
// Automatische Lohnberechnung aus gespeicherten Stundenbuchungen
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const saisonId = searchParams.get("saisonId")

  // Sprint P: saisonId-Filter — erst Auftrags-IDs der Saison laden
  let auftragIdFilter: { in: string[] } | undefined
  if (saisonId) {
    const auftraege = await prisma.auftrag.findMany({
      where: { saisonId },
      select: { id: true },
    })
    auftragIdFilter = { in: auftraege.map(a => a.id) }
  }

  // Lies alle Stundenbuchungen mit Mitarbeiter-Daten
  const eintraege = await prisma.stundeneintrag.findMany({
    where: auftragIdFilter ? { auftragId: auftragIdFilter } : {},
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
      wochentagZuschlag: number
      stundenNormal: number
      stundenSamstag: number
      stundenSonntag: number
      eintraege: number
    }
  >()

  // Zuschlag-Konfiguration (Defaults)
  const zuschlagSamstag = 0.25 // 25%
  const zuschlagSonntag = 0.50 // 50%

  for (const e of eintraege) {
    const key = e.mitarbeiterId
    if (!byMitarbeiter.has(key)) {
      byMitarbeiter.set(key, {
        mitarbeiterId: key,
        mitarbeiter: e.mitarbeiter,
        stunden: 0,
        bruttoLohn: 0,
        maschinenzuschlagGesamt: 0,
        wochentagZuschlag: 0,
        stundenNormal: 0,
        stundenSamstag: 0,
        stundenSonntag: 0,
        eintraege: 0,
      })
    }
    const m = byMitarbeiter.get(key)!
    const stunden = e.stunden ?? 0
    m.stunden += stunden
    const lohn = e.stundenlohn ?? e.mitarbeiter?.stundenlohn ?? 0
    m.bruttoLohn += stunden * lohn
    m.maschinenzuschlagGesamt += (e.maschinenzuschlag ?? 0) * stunden
    m.eintraege++

    // Wochentag-Zuschläge (Sa/So)
    const wochentag = new Date(e.datum).getDay() // 0=So, 6=Sa
    if (wochentag === 0) {
      m.wochentagZuschlag += zuschlagSonntag * stunden * lohn
      m.stundenSonntag += stunden
    } else if (wochentag === 6) {
      m.wochentagZuschlag += zuschlagSamstag * stunden * lohn
      m.stundenSamstag += stunden
    } else {
      m.stundenNormal += stunden
    }
  }

  // Maschinen-Einsatz aus Tagesprotokollen
  const maschinenstundensatz = 15 // €/h Fallback
  const protokolle = await prisma.tagesprotokoll.findMany({
    where: auftragIdFilter ? { auftragId: auftragIdFilter } : {},
    select: { maschinenEinsatz: true, mitarbeiterAnzahl: true },
  })

  let maschinenKostenGesamt = 0
  for (const p of protokolle) {
    if (!p.maschinenEinsatz) continue
    try {
      const einsaetze = p.maschinenEinsatz as { maschine?: string; stunden?: number }[]
      if (!Array.isArray(einsaetze)) continue
      for (const e of einsaetze) {
        maschinenKostenGesamt += (e.stunden ?? 0) * maschinenstundensatz
      }
    } catch { /* skip invalid JSON */ }
  }

  // Distribute machine costs evenly across all employees with hours
  const maCount = byMitarbeiter.size
  const maschinenProMA = maCount > 0 ? maschinenKostenGesamt / maCount : 0

  const result = Array.from(byMitarbeiter.values()).map((m) => ({
    mitarbeiterId: m.mitarbeiterId,
    mitarbeiter: m.mitarbeiter,
    stunden: m.stunden,
    stundenNormal: m.stundenNormal,
    stundenSamstag: m.stundenSamstag,
    stundenSonntag: m.stundenSonntag,
    stundenlohn: m.mitarbeiter?.stundenlohn ?? 0,
    bruttoLohn: m.bruttoLohn,
    maschinenzuschlag: m.maschinenzuschlagGesamt,
    maschinenEinsatz: Math.round(maschinenProMA * 100) / 100,
    wochentagZuschlag: Math.round(m.wochentagZuschlag * 100) / 100,
    gesamtLohn: Math.round((m.bruttoLohn + m.maschinenzuschlagGesamt + m.wochentagZuschlag + maschinenProMA) * 100) / 100,
    eintraege: m.eintraege,
  }))

  return NextResponse.json(result)
})

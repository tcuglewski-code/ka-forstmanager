import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // Stunden für diesen Auftrag
  const stunden = await prisma.stundeneintrag.findMany({
    where: { auftragId: id },
    include: { mitarbeiter: { select: { stundenlohn: true, vorname: true, nachname: true } } }
  })

  // Rechnungen für diesen Auftrag
  const rechnungen = await prisma.rechnung.findMany({
    where: { auftragId: id },
    select: { betrag: true, status: true, createdAt: true }
  })

  // Maschineneinsätze
  const maschineneinsaetze = await prisma.maschineneinsatz.findMany({
    where: { auftragId: id },
    include: { fahrzeug: { select: { bezeichnung: true, stundenBonus: true } } }
  })

  // Berechnung
  let lohnkosten = 0
  let maschinenkosten = 0

  for (const e of stunden) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lohn = (e as any).stundenlohn ?? e.mitarbeiter?.stundenlohn ?? 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bonus = (e as any).maschinenzuschlag ?? 0
    lohnkosten += ((e as any).stunden ?? 0) * (lohn + bonus)
  }

  for (const m of maschineneinsaetze) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ma = m as any
    if (ma.stundensatz && ma.vonDatum) {
      const std = ma.bisDatum
        ? Math.abs(new Date(ma.bisDatum).getTime() - new Date(ma.vonDatum).getTime()) / 3600000
        : 8
      maschinenkosten += std * ma.stundensatz
    }
  }

  const umsatz = rechnungen.reduce((s, r) => s + (r.betrag ?? 0), 0)
  const gesamtkosten = lohnkosten + maschinenkosten
  const deckungsbeitrag = umsatz - gesamtkosten
  const marge = umsatz > 0 ? (deckungsbeitrag / umsatz) * 100 : 0

  return NextResponse.json({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stundenAnzahl: stunden.reduce((s, e) => s + ((e as any).stunden ?? 0), 0),
    lohnkosten: Math.round(lohnkosten * 100) / 100,
    maschinenkosten: Math.round(maschinenkosten * 100) / 100,
    gesamtkosten: Math.round(gesamtkosten * 100) / 100,
    umsatz: Math.round(umsatz * 100) / 100,
    deckungsbeitrag: Math.round(deckungsbeitrag * 100) / 100,
    marge: Math.round(marge * 10) / 10,
    rechnungenAnzahl: rechnungen.length,
    maschineneinsaetzeAnzahl: maschineneinsaetze.length
  })
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // SystemConfig laden (Sprint Q: vollkosten-Modell)
  const configs = await prisma.systemConfig.findMany()
  const configMap: Record<string, string> = {}
  for (const c of configs) configMap[c.key] = c.value
  const vollkosten = parseFloat(configMap.vollkosten_pro_stunde ?? "43.50")
  const maschinenkundenzuschlag = parseFloat(configMap.maschinenzuschlag_kunde ?? "6.00")

  // Stunden für diesen Auftrag (inkl. individuellem vollkostenSatz)
  const stunden = await prisma.stundeneintrag.findMany({
    where: { auftragId: id },
    include: {
      mitarbeiter: {
        select: {
          stundenlohn: true,
          vorname: true,
          nachname: true,
          vollkostenSatz: true,  // Sprint Q: individueller Override
        }
      }
    }
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

  // Sprint Q: vollkostenSatz (Kundenpreis) statt Netto-Stundenlohn
  for (const e of stunden) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ma = e.mitarbeiter as any
    // Priorität: individueller vollkostenSatz → globaler vollkosten
    const satz = ma?.vollkostenSatz ?? vollkosten
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lohnkosten += ((e as any).stunden ?? 0) * satz
  }

  // Sprint Q: Maschinenkosten = stundensatz + maschinenkundenzuschlag pro Stunde
  for (const m of maschineneinsaetze) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ma = m as any
    if (ma.vonDatum) {
      const std = ma.bisDatum
        ? Math.abs(new Date(ma.bisDatum).getTime() - new Date(ma.vonDatum).getTime()) / 3600000
        : 8
      const basisSatz = ma.stundensatz ?? 0
      maschinenkosten += std * (basisSatz + maschinenkundenzuschlag)
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
    maschineneinsaetzeAnzahl: maschineneinsaetze.length,
    // Sprint Q: Kalkulationsgrundlage mitliefern
    kalkulationsbasis: {
      vollkostenProStunde: vollkosten,
      maschinenkundenzuschlag,
    }
  })
}

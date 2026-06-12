/**
 * DOK-065: Stammdaten-Readiness-Check für die Dokumenten-KI.
 * GET /api/dokumente/readiness → Score 0–100 + konkrete Hinweise.
 * Je besser die Stammdaten gepflegt sind (Lieferanten, Artikelnummern,
 * Lieferanten-Bestellnummern, Bestellungen), desto besser matcht die Pipeline.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [lieferanten, lieferantenMitKontakt, artikel, artikelMitNr, artikelMitLieferantNr, aliase, bestellungen] =
    await Promise.all([
      prisma.lieferant.count({ where: { aktiv: true } }),
      prisma.lieferant.count({ where: { aktiv: true, email: { not: null } } }),
      prisma.lagerArtikel.count({ where: { deletedAt: null } }),
      prisma.lagerArtikel.count({ where: { deletedAt: null, artikelnummer: { not: null } } }),
      prisma.lagerArtikel.count({ where: { deletedAt: null, lieferantBestellnummer: { not: null } } }),
      prisma.lagerArtikelAlias.count(),
      prisma.bestellung.count({ where: { status: "BESTELLT" } }),
    ])

  const hinweise: string[] = []
  let score = 0

  // 30 P.: Lieferanten erfasst
  if (lieferanten > 0) {
    score += 20
    score += Math.round(10 * Math.min(1, lieferantenMitKontakt / lieferanten))
    if (lieferantenMitKontakt < lieferanten) {
      hinweise.push(`${lieferanten - lieferantenMitKontakt} Lieferant(en) ohne E-Mail — Kontaktdaten verbessern die Zuordnung.`)
    }
  } else {
    hinweise.push("Keine aktiven Lieferanten erfasst — Belege können keinem Lieferanten zugeordnet werden.")
  }

  // 50 P.: Artikel-Stammdaten
  if (artikel > 0) {
    score += 20
    score += Math.round(15 * Math.min(1, artikelMitNr / artikel))
    score += Math.round(15 * Math.min(1, artikelMitLieferantNr / artikel))
    if (artikelMitNr < artikel) {
      hinweise.push(`${artikel - artikelMitNr} Artikel ohne Artikelnummer — Nummern ermöglichen exaktes Matching.`)
    }
    if (artikelMitLieferantNr < artikel) {
      hinweise.push(
        `${artikel - artikelMitLieferantNr} Artikel ohne Lieferanten-Bestellnummer — diese Nummer steht auf Rechnungen/Lieferscheinen und matcht am zuverlässigsten.`
      )
    }
  } else {
    hinweise.push("Keine Lagerartikel angelegt — extrahierte Positionen können nicht gemappt werden.")
  }

  // 10 P.: gelernte Aliasse (wächst mit Nutzung)
  if (aliase > 0) score += 10
  else hinweise.push("Noch keine Artikel-Aliasse — entstehen automatisch beim Bestätigen von Reviews.")

  // 10 P.: offene Bestellungen für Lieferschein-Abgleich
  if (bestellungen > 0) score += 10
  else hinweise.push("Keine offenen Bestellungen (Status BESTELLT) — der Bestell-Abgleich für Lieferscheine bleibt leer.")

  return NextResponse.json({
    score: Math.min(100, score),
    bereit: score >= 50,
    stammdaten: {
      lieferanten,
      lieferantenMitKontakt,
      artikel,
      artikelMitArtikelnummer: artikelMitNr,
      artikelMitLieferantBestellnummer: artikelMitLieferantNr,
      aliase,
      offeneBestellungen: bestellungen,
    },
    hinweise,
  })
}

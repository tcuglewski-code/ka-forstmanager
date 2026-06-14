/**
 * A2 — Bestellvorschläge (MAT-016).
 *
 * Erzeugt aus den zu bestellenden Positionen eines MaterialBedarfs gruppierte
 * Bestellvorschläge je Lieferant (bzw. Baumschule für Pflanzgut/Saatgut).
 * Bestellen selbst ist Human-in-the-Loop (kein Auto-Bestellen, NEVER #21).
 */
import { prisma } from "@/lib/prisma"
import type { BestellPositionSnapshot } from "@/lib/material/zod-schemas"

function istPflanzgut(bezeichnung: string): boolean {
  const b = bezeichnung.toLowerCase()
  return b.startsWith("pflanzgut") || b.startsWith("saatgut")
}

/**
 * Erzeugt (idempotent) Bestellvorschläge für einen MaterialBedarf.
 * Bestehende Vorschläge werden zuvor entfernt (nur solange Status VORSCHLAG).
 */
export async function erzeugeBestellvorschlaege(materialBedarfId: string): Promise<number> {
  const bedarf = await prisma.materialBedarf.findUnique({
    where: { id: materialBedarfId },
    include: { positionen: true, bestellVorschlaege: true },
  })
  if (!bedarf) return 0

  // Nur neu erzeugen, wenn noch nichts bestellt wurde.
  const bereitsBestellt = bedarf.bestellVorschlaege.some((v) => v.status !== "VORSCHLAG")
  if (bereitsBestellt) return bedarf.bestellVorschlaege.length

  await prisma.bestellVorschlag.deleteMany({
    where: { materialBedarfId, status: "VORSCHLAG" },
  })

  const zuBestellen = bedarf.positionen.filter((p) => (p.zuBestellenMenge ?? 0) > 0)
  if (zuBestellen.length === 0) return 0

  // Lieferant je Position über Lager-Artikel ermitteln.
  const artikelIds = zuBestellen.map((p) => p.lagerArtikelId).filter((x): x is string => !!x)
  const artikel = artikelIds.length
    ? await prisma.lagerArtikel.findMany({
        where: { id: { in: artikelIds } },
        select: { id: true, lieferantId: true },
      })
    : []
  const lieferantByArtikel = new Map(artikel.map((a) => [a.id, a.lieferantId]))

  // Erste aktive Baumschule als Default-Empfänger für Pflanzgut/Saatgut.
  const baumschule = await prisma.baumschule.findFirst({
    where: { aktiv: true, status: "aktiv" },
    select: { id: true, name: true },
  })

  // Gruppierung: Key = "L:<lieferantId>" | "B:<baumschuleId>" | "manuell"
  interface Gruppe {
    lieferantId: string | null
    baumschuleId: string | null
    lieferantName: string | null
    positionen: BestellPositionSnapshot[]
    betrag: number
  }
  const gruppen = new Map<string, Gruppe>()

  for (const p of zuBestellen) {
    let key: string
    let lieferantId: string | null = null
    let baumschuleId: string | null = null
    let lieferantName: string | null = null

    if (istPflanzgut(p.bezeichnung) && baumschule) {
      key = `B:${baumschule.id}`
      baumschuleId = baumschule.id
      lieferantName = baumschule.name
    } else {
      const lid = p.lagerArtikelId ? lieferantByArtikel.get(p.lagerArtikelId) ?? null : null
      if (lid) {
        key = `L:${lid}`
        lieferantId = lid
      } else {
        key = "manuell"
      }
    }

    if (!gruppen.has(key)) {
      gruppen.set(key, { lieferantId, baumschuleId, lieferantName, positionen: [], betrag: 0 })
    }
    const g = gruppen.get(key)!
    const menge = p.zuBestellenMenge ?? 0
    const preis = p.einzelpreis ?? null
    g.positionen.push({
      materialPositionId: p.id,
      bezeichnung: p.bezeichnung,
      menge,
      preis,
    })
    if (preis != null) g.betrag += preis * menge
  }

  // Lieferantennamen für L:-Gruppen nachladen
  const lieferantIds = [...gruppen.values()].map((g) => g.lieferantId).filter((x): x is string => !!x)
  if (lieferantIds.length) {
    const lf = await prisma.lieferant.findMany({
      where: { id: { in: lieferantIds } },
      select: { id: true, name: true },
    })
    const nameById = new Map(lf.map((l) => [l.id, l.name]))
    for (const g of gruppen.values()) {
      if (g.lieferantId) g.lieferantName = nameById.get(g.lieferantId) ?? null
    }
  }

  let anzahl = 0
  for (const g of gruppen.values()) {
    await prisma.bestellVorschlag.create({
      data: {
        materialBedarfId,
        lieferantId: g.lieferantId,
        baumschuleId: g.baumschuleId,
        lieferantName: g.lieferantName ?? (g.lieferantId || g.baumschuleId ? null : "Manuell zuzuordnen"),
        positionenJson: g.positionen,
        gesamtBetrag: Math.round(g.betrag * 100) / 100,
        status: "VORSCHLAG",
      },
    })
    anzahl++
  }
  return anzahl
}

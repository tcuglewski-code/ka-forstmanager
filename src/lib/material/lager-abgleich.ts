/**
 * A2 — Lager-Abgleich (MAT-006).
 *
 * Bestandsbewusster Abgleich (USP): Für jede benötigte Position wird im
 * Lager nach einem passenden Artikel gesucht und der zu bestellende Rest
 * berechnet (zuBestellen = max(0, bedarf − bestand)).
 */
import { prisma } from "@/lib/prisma"
import type { LagerAbgleich } from "@/lib/material/zod-schemas"

export interface BedarfsPosition {
  bezeichnung: string
  menge: number
}

export interface AbgeglicheneePosition extends BedarfsPosition {
  lagerArtikelId: string | null
  lagerBestand: number
  zuBestellenMenge: number
  einkaufspreis: number | null
  lieferantId: string | null
}

export interface AbgleichErgebnis {
  positionen: AbgeglicheneePosition[]
  uebersicht: LagerAbgleich
}

/** Normalisiert einen Namen für unscharfen Vergleich. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, " ").trim()
}

/**
 * Gleicht eine Bedarfsliste gegen den Lagerbestand ab.
 * Soft-gelöschte Artikel (deletedAt) werden ausgeschlossen.
 */
export async function gleicheAbLager(bedarf: BedarfsPosition[]): Promise<AbgleichErgebnis> {
  const artikel = await prisma.lagerArtikel.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      bestand: true,
      einkaufspreis: true,
      lieferantPreis: true,
      lieferantId: true,
    },
  })

  const positionen: AbgeglicheneePosition[] = bedarf.map((b) => {
    const treffer = findeBestenTreffer(b.bezeichnung, artikel)
    const bestand = treffer ? Math.max(0, treffer.bestand) : 0
    const zuBestellen = Math.max(0, b.menge - bestand)
    const einkaufspreis =
      treffer?.einkaufspreis ??
      (treffer?.lieferantPreis != null ? Number(treffer.lieferantPreis) : null)
    return {
      bezeichnung: b.bezeichnung,
      menge: b.menge,
      lagerArtikelId: treffer?.id ?? null,
      lagerBestand: bestand,
      zuBestellenMenge: zuBestellen,
      einkaufspreis,
      lieferantId: treffer?.lieferantId ?? null,
    }
  })

  const uebersicht: LagerAbgleich = { verfuegbar: [], teilweise: [], fehlt: [] }
  for (const p of positionen) {
    const eintrag = {
      bezeichnung: p.bezeichnung,
      bedarf: p.menge,
      bestand: p.lagerBestand,
      zuBestellen: p.zuBestellenMenge,
      lagerArtikelId: p.lagerArtikelId,
    }
    if (p.zuBestellenMenge <= 0) uebersicht.verfuegbar.push(eintrag)
    else if (p.lagerBestand > 0) uebersicht.teilweise.push(eintrag)
    else uebersicht.fehlt.push(eintrag)
  }

  return { positionen, uebersicht }
}

interface ArtikelLite {
  id: string
  name: string
  bestand: number
  einkaufspreis: number | null
  lieferantPreis: unknown
  lieferantId: string | null
}

/**
 * Findet den besten Lager-Treffer: bevorzugt enthaltene Namen (fuzzy),
 * bei mehreren Treffern den mit dem höchsten Bestand.
 */
function findeBestenTreffer(bezeichnung: string, artikel: ArtikelLite[]): ArtikelLite | null {
  const ziel = normalize(bezeichnung)
  if (!ziel) return null
  const zielWorte = ziel.split(" ").filter(Boolean)

  const kandidaten = artikel.filter((a) => {
    const name = normalize(a.name)
    if (!name) return false
    if (name.includes(ziel) || ziel.includes(name)) return true
    // mind. ein gemeinsames signifikantes Wort (>3 Zeichen)
    return zielWorte.some((w) => w.length > 3 && name.includes(w))
  })

  if (kandidaten.length === 0) return null
  return kandidaten.reduce((best, cur) => (cur.bestand > best.bestand ? cur : best))
}

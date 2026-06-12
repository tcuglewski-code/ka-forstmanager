/**
 * DOK-015/016: Bestellabgleich — ordnet ein Dokument einer offenen
 * Bestellung zu (Lieferant + Positions-Überlappung).
 *
 * DOK-057: Lieferschein ohne Bestellung → ohneBestellung=true → immer REVIEW.
 * DOK-058: Gutschriften → nie Auto-Buchung, Referenz-Beleg wird gesucht.
 */
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { normalisiereRechnungsNr } from "../doppelbuchung"

export interface BestellAbgleichErgebnis {
  bestellungId: string | null
  konfidenz: number
  /** DOK-057: keine passende Bestellung gefunden */
  ohneBestellung: boolean
  /** Anteil der Dokument-Positionen die in der Bestellung vorkommen (0..1) */
  positionsUeberlappung: number
  grund: string
}

export interface DokumentPositionInput {
  artikelId: string | null
  menge: number
}

const OFFENE_STATUS = ["ENTWURF", "BESTELLT", "TEILGELIEFERT", "OFFEN"]

/**
 * Pure Abgleichs-Logik (testbar ohne DB): vergleicht Dokument-Positionen
 * mit den Positionen offener Bestellungen.
 */
export function bewerteBestellungen(
  dokPositionen: DokumentPositionInput[],
  bestellungen: { id: string; positionen: { artikelId: string }[] }[]
): BestellAbgleichErgebnis {
  if (bestellungen.length === 0) {
    return {
      bestellungId: null,
      konfidenz: 0,
      ohneBestellung: true,
      positionsUeberlappung: 0,
      grund: "keine Bestellung gefunden",
    }
  }

  const gematchteArtikel = dokPositionen.filter((p) => p.artikelId !== null)
  if (gematchteArtikel.length === 0) {
    return {
      bestellungId: null,
      konfidenz: 0,
      ohneBestellung: true,
      positionsUeberlappung: 0,
      grund: "keine Dokument-Position einem Artikel zugeordnet",
    }
  }

  let best: { id: string; ueberlappung: number } | null = null
  for (const b of bestellungen) {
    const bestellArtikel = new Set(b.positionen.map((p) => p.artikelId))
    const treffer = gematchteArtikel.filter((p) => p.artikelId && bestellArtikel.has(p.artikelId)).length
    const ueberlappung = treffer / gematchteArtikel.length
    if (!best || ueberlappung > best.ueberlappung) best = { id: b.id, ueberlappung }
  }

  if (!best || best.ueberlappung === 0) {
    return {
      bestellungId: null,
      konfidenz: 0,
      ohneBestellung: true,
      positionsUeberlappung: 0,
      grund: "keine Bestellung mit überlappenden Positionen",
    }
  }

  return {
    bestellungId: best.id,
    konfidenz: best.ueberlappung,
    ohneBestellung: false,
    positionsUeberlappung: best.ueberlappung,
    grund:
      best.ueberlappung === 1
        ? "alle Positionen in Bestellung enthalten"
        : `${(best.ueberlappung * 100).toFixed(0)}% Positions-Überlappung`,
  }
}

/** Lädt offene Bestellungen des Lieferanten und führt den Abgleich aus. */
export async function gleicheAbBestellung(
  lieferantId: string | null,
  dokPositionen: DokumentPositionInput[]
): Promise<BestellAbgleichErgebnis> {
  if (!lieferantId) {
    return {
      bestellungId: null,
      konfidenz: 0,
      ohneBestellung: true,
      positionsUeberlappung: 0,
      grund: "kein Lieferant zugeordnet — keine Bestellung gefunden",
    }
  }
  const bestellungen = await prisma.bestellung.findMany({
    where: { lieferantId, status: { in: OFFENE_STATUS } },
    select: { id: true, positionen: { select: { artikelId: true } } },
    orderBy: { bestelldatum: "desc" },
    take: 20,
  })
  return bewerteBestellungen(dokPositionen, bestellungen)
}

/**
 * DOK-058: Gutschrift — sucht den referenzierten Original-Beleg
 * (gleiche/r Lieferant + Rechnungsnummern-Ähnlichkeit). Gutschriften
 * gehen IMMER in den Review (Routing erzwingt das, konfidenz-routing.ts).
 */
export async function findeReferenzBeleg(
  lieferantId: string | null,
  referenzNr: string | null
): Promise<string | null> {
  if (!referenzNr) return null
  const normalisiert = normalisiereRechnungsNr(referenzNr)
  if (!normalisiert) return null

  const kandidaten = await prisma.dokumentenScan.findMany({
    where: {
      status: "GEBUCHT",
      deletedAt: null,
      ...(lieferantId ? { lieferantId } : {}),
    },
    select: { id: true, extrahierteDaten: true },
    take: 200,
  })
  const DatenSchema = z.object({ rechnungsNr: z.string().optional() })
  for (const scan of kandidaten) {
    const parsed = DatenSchema.safeParse(scan.extrahierteDaten)
    if (parsed.success && parsed.data.rechnungsNr) {
      if (normalisiereRechnungsNr(parsed.data.rechnungsNr) === normalisiert) return scan.id
    }
  }
  return null
}

/**
 * DOK-008: Doppelbuchungs-Prüfung.
 *
 * Rechnungsnummern werden normalisiert verglichen (Groß/Klein,
 * Bindestriche, Leerzeichen), damit "RE-2026 001" und "re2026001"
 * als identisch erkannt werden.
 */
import { prisma } from "@/lib/prisma"

export function normalisiereRechnungsNr(nr: string): string {
  // alle Trennzeichen entfernen (-, /, ., Leerzeichen …) — nur Alphanumerik zählt
  return nr.toLowerCase().trim().replace(/[^a-z0-9]/g, "")
}

/**
 * Prüft ob eine Rechnungsnummer (ggf. je Lieferant) bereits als
 * GEBUCHT oder REVIEW_ERFORDERLICH im System existiert.
 *
 * Die Rechnungsnummer liegt in extrahierteDaten.rechnungsNr — der
 * Vergleich erfolgt normalisiert in der Anwendung, da Json-Felder
 * keine normalisierte DB-Suche erlauben.
 */
export async function isDoppelbuchung(
  rechnungsNr: string,
  lieferantId: string | null
): Promise<boolean> {
  const normalisiert = normalisiereRechnungsNr(rechnungsNr)
  if (!normalisiert) return false

  const kandidaten = await prisma.dokumentenScan.findMany({
    where: {
      status: { in: ["GEBUCHT", "REVIEW_ERFORDERLICH"] },
      deletedAt: null,
      ...(lieferantId ? { lieferantId } : {}),
    },
    select: { extrahierteDaten: true },
  })

  return (kandidaten as { extrahierteDaten: unknown }[]).some((scan) => {
    const daten = scan.extrahierteDaten as { rechnungsNr?: string } | null
    if (!daten?.rechnungsNr) return false
    return normalisiereRechnungsNr(daten.rechnungsNr) === normalisiert
  })
}

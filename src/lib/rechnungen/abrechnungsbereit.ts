/**
 * A8 Rechnungs-Agent — Abrechnungsbereitschaft (REC-005)
 *
 * Ein Auftrag ist abrechnungsbereit, wenn:
 *  - Status final/abrechenbar (abgeschlossen | abrechnungsbereit | abnahme), UND
 *  - mindestens eine bestätigte Abnahme ODER Abnahme.rechnungFreigegeben = true
 *
 * Doppel-Abrechnung (Audit C64) wird zusätzlich geprüft: existiert bereits eine
 * aktive (nicht-stornierte, nicht-soft-deleted) Rechnung für den Auftrag.
 */
import { prisma } from "@/lib/prisma"

const ABRECHENBARE_STATUS = ["abgeschlossen", "abrechnungsbereit", "abnahme"]

export interface AbrechnungsCheck {
  bereit: boolean
  grund: string
  hatAbnahme: boolean
  bestehendeRechnung: { id: string; nummer: string; status: string } | null
}

export async function pruefeAbrechnungsbereit(auftragId: string): Promise<AbrechnungsCheck> {
  const auftrag = await prisma.auftrag.findUnique({
    where: { id: auftragId },
    select: {
      id: true,
      status: true,
      abnahmen: { select: { status: true, rechnungFreigegeben: true } },
    },
  })

  if (!auftrag) {
    return { bereit: false, grund: "Auftrag nicht gefunden", hatAbnahme: false, bestehendeRechnung: null }
  }

  const hatFreigabe = auftrag.abnahmen.some(
    (a: { status: string; rechnungFreigegeben: boolean }) =>
      a.status === "bestätigt" || a.rechnungFreigegeben === true
  )
  const hatAbnahme = auftrag.abnahmen.length > 0

  // Bestehende aktive Rechnung? (Doppel-Abrechnung-Schutz, C64)
  const bestehende = await prisma.rechnung.findFirst({
    where: {
      auftragId,
      deletedAt: null,
      status: { notIn: ["storniert"] },
    },
    select: { id: true, nummer: true, status: true },
    orderBy: { createdAt: "desc" },
  })

  if (!ABRECHENBARE_STATUS.includes(auftrag.status)) {
    return {
      bereit: false,
      grund: `Auftrag-Status '${auftrag.status}' ist nicht abrechenbar`,
      hatAbnahme,
      bestehendeRechnung: bestehende,
    }
  }

  if (!hatFreigabe) {
    return {
      bereit: false,
      grund: "Keine bestätigte Abnahme / Rechnungsfreigabe vorhanden",
      hatAbnahme,
      bestehendeRechnung: bestehende,
    }
  }

  return {
    bereit: true,
    grund: bestehende
      ? `Abrechnungsbereit — Hinweis: aktive Rechnung ${bestehende.nummer} existiert bereits`
      : "Abrechnungsbereit",
    hatAbnahme,
    bestehendeRechnung: bestehende,
  }
}

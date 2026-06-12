/**
 * DOK-055: DACH-USt-Länderprofile.
 *
 * Validiert Mehrwertsteuersätze gegen die gültigen Sätze je Land.
 * Stand 2026: DE 0/7/19 · AT 0/10/13/20 · CH 0/2.6/3.8/8.1
 */

export type DachLand = "DE" | "AT" | "CH"

export const MWST_PROFILE: Record<DachLand, number[]> = {
  DE: [0, 7, 19],
  AT: [0, 10, 13, 20],
  CH: [0, 2.6, 3.8, 8.1],
}

/** Toleranz für Float-Vergleiche (z. B. 8.1 aus XML-Parsing) */
const EPSILON = 0.001

export function validateMwstSatz(satz: number, land: DachLand): boolean {
  if (!Number.isFinite(satz) || satz < 0) return false
  return MWST_PROFILE[land].some((gueltig) => Math.abs(gueltig - satz) < EPSILON)
}

/** Leitet das DACH-Land aus einer USt-ID ab (DE…, ATU…, CHE…). */
export function landAusUstId(ustId: string | null | undefined): DachLand | null {
  if (!ustId) return null
  const prefix = ustId.trim().toUpperCase()
  if (prefix.startsWith("DE")) return "DE"
  if (prefix.startsWith("AT")) return "AT"
  if (prefix.startsWith("CH")) return "CH"
  return null
}

/**
 * Prüft alle MwSt-Sätze eines Dokuments gegen das Länderprofil.
 * Unbekanntes Land → kein False-Flag, aber Hinweis.
 */
export function pruefeMwstSaetze(
  saetze: number[],
  land: DachLand | null
): { gueltig: boolean; hinweise: string[] } {
  const hinweise: string[] = []
  if (!land) {
    hinweise.push("Land unbekannt — USt-Sätze nicht länderspezifisch geprüft")
    return { gueltig: true, hinweise }
  }
  let gueltig = true
  for (const satz of saetze) {
    if (!validateMwstSatz(satz, land)) {
      gueltig = false
      hinweise.push(`USt-Satz ${satz}% ist in ${land} nicht gültig`)
    }
  }
  return { gueltig, hinweise }
}

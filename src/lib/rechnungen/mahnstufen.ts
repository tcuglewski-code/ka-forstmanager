/**
 * A8 Rechnungs-Agent — Mahnstufen-Logik (REC-011, testbar isoliert)
 *
 * Reine Funktionen ohne DB — vom Cron (api/cron/rechnungen-mahnwesen) genutzt
 * und in tests/a8/mahnwesen.test.ts geprüft.
 */
export interface MahnStufe {
  stufe: 1 | 2 | 3
  abTagen: number
  gebuehr: number
  label: string
}

// Tage nach Fälligkeit → Stufe + Gebühr (€)
export const MAHN_STUFEN: readonly MahnStufe[] = [
  { stufe: 1, abTagen: 7, gebuehr: 0, label: "Zahlungserinnerung" },
  { stufe: 2, abTagen: 14, gebuehr: 5, label: "1. Mahnung" },
  { stufe: 3, abTagen: 30, gebuehr: 15, label: "2. Mahnung" },
] as const

/** Status, die noch mahnbar sind (offen / versandt / teilbezahlt). */
export const MAHNBARE_STATUS = ["offen", "gesendet", "versendet", "freigegeben", "teilbezahlt", "überfällig"]

/** Höchste erreichte Mahnstufe für eine gegebene Überfälligkeit in Tagen. */
export function zielStufe(overdueTage: number): MahnStufe | null {
  let result: MahnStufe | null = null
  for (const s of MAHN_STUFEN) {
    if (overdueTage >= s.abTagen) result = s
  }
  return result
}

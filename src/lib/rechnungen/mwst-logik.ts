/**
 * A8 Rechnungs-Agent — MwSt-Logik (REC-003, Audit Kat. B)
 *
 * Forstwirtschaft: §12 Abs. 2 / §24 UStG-Kontext.
 *  - 7 %  : forstwirtschaftliche (Dienst-)Leistungen
 *  - 19 % : sonstige Leistungen, Material, Fahrtkosten (Regelsatz)
 *  - 0 %  : Kleinunternehmer §19 UStG ODER Reverse-Charge (EU-USt-IdNr, B32)
 *
 * Rundung (Audit C52): MwSt wird je Satz auf die NETTO-Summe gerundet,
 * nicht je Position summiert → vermeidet Centdifferenzen.
 */
import type { ExtraktPosition, MwstGruppe } from "./zod-schemas"

/** Standard-MwSt-Satz je Positionstyp. */
export function bestimmeMwstSatz(
  typ: "leistung" | "material" | "fahrt",
  opts?: { kleinunternehmer?: boolean; reverseCharge?: boolean }
): 0 | 7 | 19 {
  if (opts?.kleinunternehmer || opts?.reverseCharge) return 0
  switch (typ) {
    case "leistung":
      return 7 // forstwirtschaftliche Dienstleistung
    case "material":
    case "fahrt":
      return 19
    default:
      return 19
  }
}

export function runde2(n: number): number {
  // Kaufmännische Rundung auf 2 Nachkommastellen, robust gegen FP-Fehler.
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Gruppiert Positionen nach MwSt-Satz und berechnet Netto + Steuer je Satz.
 * Steuer wird je Satz auf die Netto-Summe gerundet (GoBD/C52).
 */
export function gruppiereMwst(positionen: Pick<ExtraktPosition, "gesamt" | "mwstSatz">[]): MwstGruppe[] {
  const byRate = new Map<number, number>()
  for (const p of positionen) {
    byRate.set(p.mwstSatz, (byRate.get(p.mwstSatz) ?? 0) + p.gesamt)
  }
  return [...byRate.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([satz, netto]) => {
      const nettoR = runde2(netto)
      return {
        satz: satz as 0 | 7 | 19,
        netto: nettoR,
        steuer: runde2((nettoR * satz) / 100),
      }
    })
}

export interface RechnungsSummen {
  nettoGesamt: number
  mwstGesamt: number
  bruttoGesamt: number
  gruppen: MwstGruppe[]
}

/** Berechnet Netto/MwSt/Brutto aus Positionen (Single Source of Truth). */
export function berechneSummen(positionen: ExtraktPosition[]): RechnungsSummen {
  const gruppen = gruppiereMwst(positionen)
  const nettoGesamt = runde2(gruppen.reduce((s, g) => s + g.netto, 0))
  const mwstGesamt = runde2(gruppen.reduce((s, g) => s + g.steuer, 0))
  const bruttoGesamt = runde2(nettoGesamt + mwstGesamt)
  return { nettoGesamt, mwstGesamt, bruttoGesamt, gruppen }
}
